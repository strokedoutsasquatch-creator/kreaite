import { EventEmitter } from 'events';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type JobType = 'ai_generation' | 'batch_generation' | 'export' | 'import' | 'media_processing';

export interface Job {
  id: string;
  type: JobType;
  userId: string;
  status: JobStatus;
  progress: number;
  data: Record<string, any>;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, any>;
}

export interface JobUpdate {
  status?: JobStatus;
  progress?: number;
  result?: any;
  error?: string;
}

class JobQueueService extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private userJobs: Map<string, Set<string>> = new Map();
  private processingQueue: string[] = [];
  private maxConcurrent: number = 5;
  private activeJobs: number = 0;

  constructor() {
    super();
    this.setMaxListeners(100);
  }

  generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  createJob(
    type: JobType,
    userId: string,
    data: Record<string, any>,
    metadata?: Record<string, any>
  ): Job {
    const id = this.generateJobId();
    
    const job: Job = {
      id,
      type,
      userId,
      status: 'pending',
      progress: 0,
      data,
      createdAt: new Date(),
      metadata,
    };

    this.jobs.set(id, job);
    
    if (!this.userJobs.has(userId)) {
      this.userJobs.set(userId, new Set());
    }
    this.userJobs.get(userId)!.add(id);

    this.processingQueue.push(id);
    this.emit('job:created', job);
    
    this.processNext();
    
    return job;
  }

  getJob(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  getUserJobs(userId: string, limit: number = 50): Job[] {
    const jobIds = this.userJobs.get(userId);
    if (!jobIds) return [];

    const jobs: Job[] = [];
    const jobIdArray = Array.from(jobIds);
    for (let i = 0; i < jobIdArray.length; i++) {
      const job = this.jobs.get(jobIdArray[i]);
      if (job) jobs.push(job);
    }

    return jobs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  updateJob(jobId: string, update: JobUpdate): Job | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;

    if (update.status) job.status = update.status;
    if (update.progress !== undefined) job.progress = update.progress;
    if (update.result !== undefined) job.result = update.result;
    if (update.error !== undefined) job.error = update.error;

    if (update.status === 'processing' && !job.startedAt) {
      job.startedAt = new Date();
    }

    if (update.status === 'completed' || update.status === 'failed') {
      job.completedAt = new Date();
      this.activeJobs--;
      this.processNext();
    }

    this.emit('job:updated', job);
    this.emit(`job:${jobId}`, job);

    return job;
  }

  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    if (job.status === 'pending' || job.status === 'processing') {
      job.status = 'cancelled';
      job.completedAt = new Date();
      
      const queueIndex = this.processingQueue.indexOf(jobId);
      if (queueIndex > -1) {
        this.processingQueue.splice(queueIndex, 1);
      }

      if (job.status === 'cancelled') {
        this.activeJobs--;
        this.processNext();
      }

      this.emit('job:cancelled', job);
      this.emit(`job:${jobId}`, job);
      return true;
    }

    return false;
  }

  private async processNext(): Promise<void> {
    if (this.activeJobs >= this.maxConcurrent) return;
    if (this.processingQueue.length === 0) return;

    const jobId = this.processingQueue.shift();
    if (!jobId) return;

    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'pending') {
      this.processNext();
      return;
    }

    this.activeJobs++;
    this.updateJob(jobId, { status: 'processing' });
    this.emit('job:start', job);
  }

  subscribeToJob(jobId: string, callback: (job: Job) => void): () => void {
    const listener = (job: Job) => callback(job);
    this.on(`job:${jobId}`, listener);
    
    return () => {
      this.off(`job:${jobId}`, listener);
    };
  }

  getQueueStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } {
    let pending = 0, processing = 0, completed = 0, failed = 0;

    const jobsArray = Array.from(this.jobs.values());
    for (let i = 0; i < jobsArray.length; i++) {
      const job = jobsArray[i];
      switch (job.status) {
        case 'pending': pending++; break;
        case 'processing': processing++; break;
        case 'completed': completed++; break;
        case 'failed': failed++; break;
      }
    }

    return { pending, processing, completed, failed };
  }

  cleanupOldJobs(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const now = Date.now();
    let cleaned = 0;

    const entries = Array.from(this.jobs.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id, job] = entries[i];
      if (job.status === 'completed' || job.status === 'failed' || job.status === 'cancelled') {
        const age = now - job.createdAt.getTime();
        if (age > maxAgeMs) {
          this.jobs.delete(id);
          const userJobSet = this.userJobs.get(job.userId);
          if (userJobSet) {
            userJobSet.delete(id);
          }
          cleaned++;
        }
      }
    }

    return cleaned;
  }
}

export const jobQueue = new JobQueueService();

setInterval(() => {
  jobQueue.cleanupOldJobs();
}, 60 * 60 * 1000);

export async function processAIGenerationJob(
  job: Job,
  generateFn: (data: any, onProgress: (p: number) => void) => Promise<any>
): Promise<void> {
  try {
    const result = await generateFn(job.data, (progress) => {
      jobQueue.updateJob(job.id, { progress });
    });

    jobQueue.updateJob(job.id, {
      status: 'completed',
      progress: 100,
      result,
    });
  } catch (error: any) {
    jobQueue.updateJob(job.id, {
      status: 'failed',
      error: error.message || 'Unknown error',
    });
  }
}

export async function processBatchJob(
  job: Job,
  processFn: (item: any, index: number) => Promise<any>
): Promise<void> {
  try {
    const items = job.data.items as any[];
    const results: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const result = await processFn(items[i], i);
        results.push({ index: i, success: true, result });
      } catch (error: any) {
        errors.push({ index: i, success: false, error: error.message });
      }

      const progress = Math.round(((i + 1) / items.length) * 100);
      jobQueue.updateJob(job.id, { progress });
    }

    jobQueue.updateJob(job.id, {
      status: errors.length === items.length ? 'failed' : 'completed',
      progress: 100,
      result: { results, errors, totalProcessed: items.length },
    });
  } catch (error: any) {
    jobQueue.updateJob(job.id, {
      status: 'failed',
      error: error.message || 'Batch processing failed',
    });
  }
}
