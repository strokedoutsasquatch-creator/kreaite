import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

export interface BookProject {
  id: number;
  ownerId: string;
  title: string;
  subtitle?: string;
  authorName?: string;
  genre?: string;
  targetAudience?: string;
  manuscriptHtml?: string;
  manuscriptText?: string;
  wordCount?: number;
  pageCount?: number;
  chapterCount?: number;
  currentStep?: number;
  trimSize?: string;
  fontSize?: number;
  fontFamily?: string;
  marginInner?: number;
  marginOuter?: number;
  marginTop?: number;
  marginBottom?: number;
  hasFrontMatter?: boolean;
  hasBackMatter?: boolean;
  readinessScore?: number;
  coverImageUrl?: string;
  spineWidth?: number;
  status?: string;
  lastEditedAt: string;
  createdAt: string;
}

export interface BookProjectSection {
  id: number;
  projectId: number;
  sectionNumber: number;
  title: string;
  type: string;
  content?: string;
  wordCount?: number;
  startPage?: number;
  endPage?: number;
  summary?: string;
  suggestedImages?: number;
  createdAt: string;
}

export interface BookProjectWithSections extends BookProject {
  sections: BookProjectSection[];
  imagePlacements?: any[];
}

interface UseBookProjectReturn {
  project: BookProjectWithSections | null;
  projects: BookProject[];
  isLoading: boolean;
  isLoadingProjects: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  saveError: string | null;
  updateProject: (data: Partial<BookProject>) => void;
  createProject: (data: { title: string; genre?: string }) => Promise<BookProject>;
  loadProject: (id: number) => void;
  deleteProject: (id: number) => Promise<void>;
  clearProject: () => void;
  saveNow: () => Promise<void>;
}

const AUTOSAVE_DELAY = 2000;

export function useBookProject(initialProjectId?: number): UseBookProjectReturn {
  const [currentProjectId, setCurrentProjectId] = useState<number | undefined>(initialProjectId);
  const [pendingChanges, setPendingChanges] = useState<Partial<BookProject>>({});
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const saveLockRef = useRef(false);
  const pendingUpdateRef = useRef<Partial<BookProject> | null>(null);

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<BookProject[]>({
    queryKey: ['/api/book-projects'],
    staleTime: 30000,
  });

  const { data: project, isLoading: isLoadingProject, refetch: refetchProject } = useQuery<BookProjectWithSections>({
    queryKey: ['/api/book-projects', currentProjectId],
    enabled: !!currentProjectId,
    staleTime: 5000,
  });

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; genre?: string }) => {
      const response = await apiRequest('POST', '/api/book-projects', data);
      return response.json();
    },
    onSuccess: (newProject: BookProject) => {
      queryClient.invalidateQueries({ queryKey: ['/api/book-projects'] });
      setPendingChanges({});
      setCurrentProjectId(newProject.id);
      setLastSaved(new Date(newProject.createdAt));
      setSaveError(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<BookProject> }) => {
      const response = await apiRequest('PATCH', `/api/book-projects/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      setLastSaved(new Date());
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ['/api/book-projects', currentProjectId] });
      queryClient.invalidateQueries({ queryKey: ['/api/book-projects'] });
    },
    onError: (error: Error) => {
      setSaveError(error.message || 'Failed to save');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/book-projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/book-projects'] });
      if (currentProjectId) {
        setCurrentProjectId(undefined);
      }
    },
  });

  const performSave = useCallback(async () => {
    if (!currentProjectId || Object.keys(pendingChanges).length === 0) {
      return;
    }

    if (saveLockRef.current) {
      pendingUpdateRef.current = { ...pendingChanges };
      return;
    }

    saveLockRef.current = true;
    const changesToSave = { ...pendingChanges };
    setPendingChanges({});

    try {
      await updateMutation.mutateAsync({ id: currentProjectId, data: changesToSave });
    } catch (error) {
      setPendingChanges((prev) => ({ ...prev, ...changesToSave }));
    } finally {
      saveLockRef.current = false;
      if (pendingUpdateRef.current) {
        const pending = pendingUpdateRef.current;
        pendingUpdateRef.current = null;
        setPendingChanges((prev) => ({ ...prev, ...pending }));
        scheduleSave();
      }
    }
  }, [currentProjectId, pendingChanges, updateMutation]);

  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSave();
    }, AUTOSAVE_DELAY);
  }, [performSave]);

  const updateProject = useCallback((data: Partial<BookProject>) => {
    setPendingChanges((prev) => ({ ...prev, ...data }));
    scheduleSave();
  }, [scheduleSave]);

  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    
    if (saveLockRef.current) {
      pendingUpdateRef.current = { ...pendingChanges };
      return;
    }
    
    await performSave();
  }, [performSave, pendingChanges]);

  const createProject = useCallback(async (data: { title: string; genre?: string }) => {
    const newProject = await createMutation.mutateAsync(data);
    return newProject;
  }, [createMutation]);

  const loadProject = useCallback((id: number) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (currentProjectId && Object.keys(pendingChanges).length > 0) {
      performSave();
    }
    setPendingChanges({});
    pendingUpdateRef.current = null;
    setCurrentProjectId(id);
  }, [currentProjectId, pendingChanges, performSave]);

  const deleteProject = useCallback(async (id: number) => {
    await deleteMutation.mutateAsync(id);
  }, [deleteMutation]);

  const clearProject = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    if (currentProjectId && Object.keys(pendingChanges).length > 0) {
      performSave();
    }
    setPendingChanges({});
    pendingUpdateRef.current = null;
    setCurrentProjectId(undefined);
    setLastSaved(null);
  }, [currentProjectId, pendingChanges, performSave]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingChanges).length > 0 && currentProjectId) {
        e.preventDefault();
        e.returnValue = '';
        navigator.sendBeacon(
          `/api/book-projects/${currentProjectId}`,
          JSON.stringify(pendingChanges)
        );
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pendingChanges, currentProjectId]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (project?.lastEditedAt && !lastSaved) {
      setLastSaved(new Date(project.lastEditedAt));
    }
  }, [project, lastSaved]);

  const isSaving = updateMutation.isPending || Object.keys(pendingChanges).length > 0;

  return {
    project: project || null,
    projects,
    isLoading: isLoadingProject,
    isLoadingProjects,
    isSaving,
    lastSaved,
    saveError,
    updateProject,
    createProject,
    loadProject,
    deleteProject,
    clearProject,
    saveNow,
  };
}
