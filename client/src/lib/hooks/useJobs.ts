import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useState, useEffect, useCallback } from 'react';

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
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface JobStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export function useJobs(limit: number = 50) {
  return useQuery<Job[]>({
    queryKey: ['/api/jobs', limit],
    queryFn: async () => {
      const res = await fetch(`/api/jobs?limit=${limit}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch jobs');
      return res.json();
    },
    refetchInterval: 5000,
  });
}

export function useJob(jobId: string) {
  return useQuery<Job>({
    queryKey: ['/api/jobs', jobId],
    queryFn: async () => {
      const res = await fetch(`/api/jobs/${jobId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch job');
      return res.json();
    },
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'completed' || data.status === 'failed' || data.status === 'cancelled')) {
        return false;
      }
      return 2000;
    },
  });
}

export function useJobStats() {
  return useQuery<JobStats>({
    queryKey: ['/api/jobs/stats'],
    queryFn: async () => {
      const res = await fetch('/api/jobs/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch job stats');
      return res.json();
    },
    refetchInterval: 10000,
  });
}

export function useCreateJob() {
  return useMutation({
    mutationFn: async ({ type, data, metadata }: { type: JobType; data: Record<string, any>; metadata?: Record<string, any> }) => {
      const response = await apiRequest('POST', '/api/jobs', { type, data, metadata });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });
}

export function useCancelJob() {
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await apiRequest('DELETE', `/api/jobs/${jobId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
    },
  });
}

export function useJobStream(jobId: string | null) {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setIsConnected(false);
      return;
    }

    let eventSource: EventSource | null = new EventSource(`/api/jobs/${jobId}/stream`);
    let isClosed = false;
    
    const cleanup = () => {
      if (!isClosed && eventSource) {
        isClosed = true;
        eventSource.close();
        eventSource = null;
        setIsConnected(false);
      }
    };

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const updatedJob = JSON.parse(event.data);
        setJob(updatedJob);

        if (updatedJob.status === 'completed' || updatedJob.status === 'failed' || updatedJob.status === 'cancelled') {
          cleanup();
          queryClient.invalidateQueries({ 
            predicate: (query) => 
              Array.isArray(query.queryKey) && 
              query.queryKey[0] === '/api/jobs'
          });
        }
      } catch (e) {
        console.error('Failed to parse job update:', e);
      }
    };

    eventSource.onerror = () => {
      setError(new Error('Connection lost'));
      cleanup();
    };

    return cleanup;
  }, [jobId]);

  return { job, error, isConnected };
}

export function invalidateJobs() {
  queryClient.invalidateQueries({ 
    predicate: (query) => 
      Array.isArray(query.queryKey) && 
      query.queryKey[0] === '/api/jobs'
  });
}
