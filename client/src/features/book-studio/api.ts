import { apiRequest } from "@/lib/queryClient";

export interface ProjectNote {
  id: number;
  projectId: number;
  chapterId: number | null;
  userId: number;
  noteType: string;
  content: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
}

export interface DoctrineOutline {
  id: number;
  projectId: number;
  userId: number;
  title: string;
  description: string | null;
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  nodes?: DoctrineNode[];
}

export interface DoctrineNode {
  id: number;
  outlineId: number;
  parentId: number | null;
  chapterId: number | null;
  title: string;
  content: string | null;
  nodeType: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface EditResult {
  success: boolean;
  edit?: any;
  raw?: string;
  creditsUsed: number;
}

export interface ResearchResult {
  success: boolean;
  research?: any;
  raw?: string;
  creditsUsed: number;
}

export interface CoachingResult {
  success: boolean;
  coaching?: {
    overallFeedback: string;
    suggestions: Array<{
      type: string;
      original: string;
      suggestion: string;
      explanation: string;
      literaryTechnique?: string;
    }>;
    strengths: string[];
    nextSteps: string[];
  };
  raw?: string;
  creditsUsed: number;
}

export const bookStudioApi = {
  notes: {
    list: (projectId: number, params?: { chapterId?: number; noteType?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.chapterId) query.set('chapterId', params.chapterId.toString());
      if (params?.noteType) query.set('noteType', params.noteType);
      if (params?.status) query.set('status', params.status);
      return `/api/projects/${projectId}/notes${query.toString() ? '?' + query.toString() : ''}`;
    },
    create: async (projectId: number, data: { chapterId?: number; noteType: string; content: string; priority?: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/notes`, data);
    },
    update: async (noteId: number, data: Partial<ProjectNote>) => {
      return apiRequest('PATCH', `/api/notes/${noteId}`, data);
    },
    delete: async (noteId: number) => {
      return apiRequest('DELETE', `/api/notes/${noteId}`);
    },
    resolve: async (noteId: number) => {
      return apiRequest('POST', `/api/notes/${noteId}/resolve`);
    }
  },

  doctrine: {
    get: (projectId: number) => `/api/projects/${projectId}/doctrine`,
    create: async (projectId: number, data: { title?: string; description?: string }) => {
      return apiRequest('POST', `/api/projects/${projectId}/doctrine`, data);
    },
    update: async (outlineId: number, data: Partial<DoctrineOutline>) => {
      return apiRequest('PATCH', `/api/doctrine/${outlineId}`, data);
    },
    delete: async (outlineId: number) => {
      return apiRequest('DELETE', `/api/doctrine/${outlineId}`);
    },
    createNode: async (outlineId: number, data: Partial<DoctrineNode>) => {
      return apiRequest('POST', `/api/doctrine/${outlineId}/nodes`, data);
    },
    updateNode: async (nodeId: number, data: Partial<DoctrineNode>) => {
      return apiRequest('PATCH', `/api/doctrine/nodes/${nodeId}`, data);
    },
    deleteNode: async (nodeId: number) => {
      return apiRequest('DELETE', `/api/doctrine/nodes/${nodeId}`);
    }
  },

  editing: {
    developmental: async (data: { content: string; genre?: string; targetAudience?: string }): Promise<EditResult> => {
      const res = await apiRequest('POST', '/api/book/edit/developmental', data);
      return res.json();
    },
    line: async (data: { content: string; style?: string }): Promise<EditResult> => {
      const res = await apiRequest('POST', '/api/book/edit/line', data);
      return res.json();
    },
    copy: async (data: { content: string; styleGuide?: string }): Promise<EditResult> => {
      const res = await apiRequest('POST', '/api/book/edit/copy', data);
      return res.json();
    },
    proofread: async (data: { content: string }): Promise<EditResult> => {
      const res = await apiRequest('POST', '/api/book/edit/proofread', data);
      return res.json();
    }
  },

  research: {
    conduct: async (data: { topic: string; depth?: 'standard' | 'deep'; focusAreas?: string[] }): Promise<ResearchResult> => {
      const res = await apiRequest('POST', '/api/book/research', data);
      return res.json();
    },
    citations: async (data: { sources: any[]; style?: 'APA' | 'MLA' | 'Chicago' | 'Harvard' }) => {
      const res = await apiRequest('POST', '/api/book/citations', data);
      return res.json();
    }
  },

  coach: {
    getSuggestions: async (data: { content: string; genre?: string; focusAreas?: string[] }): Promise<CoachingResult> => {
      const res = await apiRequest('POST', '/api/book/writing-coach', data);
      return res.json();
    }
  }
};
