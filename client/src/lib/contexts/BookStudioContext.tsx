import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useBookProject, BookProject } from '@/lib/hooks/useBookProject';

export interface BrainstormIdea {
  id: string;
  content: string;
  type: 'theme' | 'character' | 'plot' | 'setting' | 'audience' | 'goal' | 'note';
  createdAt: Date;
}

export interface BookOutline {
  title: string;
  subtitle?: string;
  hook?: string;
  genre: string;
  targetAudience?: string;
  targetWordCount: number;
  chapters: ChapterOutline[];
}

export interface ChapterOutline {
  id: string;
  number: number;
  title: string;
  description: string;
  targetWordCount: number;
  status: 'outline' | 'generating' | 'draft' | 'complete';
  content?: string;
  wordCount?: number;
}

export interface BookImage {
  id: string;
  url: string;
  prompt?: string;
  origin: 'uploaded' | 'generated';
  hasBackground: boolean;
  analysis?: ImageAnalysis;
  isAnalyzing?: boolean;
}

export interface ImageAnalysis {
  description: string;
  altText: string;
  caption: string;
  placement: {
    recommendation: string;
    suggestedChapter: number;
    position: 'start' | 'middle' | 'end' | 'inline';
    reason: string;
  };
  printReadiness: {
    score: number;
    issues: string[];
  };
}

export interface ImagePlacement {
  id: string;
  imageId: string;
  chapterIndex: number;
  position: number;
  alignment: 'left' | 'center' | 'right' | 'full';
  caption?: string;
  isApproved: boolean;
}

export interface PrintSettings {
  trimSize: string;
  fontSize: number;
  fontFamily: string;
  marginInner: number;
  marginOuter: number;
  marginTop: number;
  marginBottom: number;
}

export interface Source {
  id: string;
  title: string;
  author?: string;
  url?: string;
  citation: string;
  notes?: string;
  createdAt: Date;
}

export interface DocumentImport {
  id: string;
  fileName: string;
  fileType: string;
  content?: string;
  wordCount?: number;
  importedAt: Date;
}

export interface IsbnData {
  isbn?: string;
  format: 'paperback' | 'hardcover' | 'ebook';
  barcodeSettings: {
    includeBarcode: boolean;
    position: 'back-cover' | 'inside-back';
    size: 'standard' | 'compact';
  };
}

export type WorkflowStep = 'start' | 'plan' | 'generate' | 'build' | 'publish';

interface GenerationProgress {
  isGenerating: boolean;
  currentChapter: number;
  totalChapters: number;
  status: string;
}

const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  trimSize: '6x9',
  fontSize: 11,
  fontFamily: 'Georgia',
  marginInner: 0.875,
  marginOuter: 0.625,
  marginTop: 0.75,
  marginBottom: 0.75,
};

const DEFAULT_ISBN_DATA: IsbnData = {
  format: 'paperback',
  barcodeSettings: {
    includeBarcode: true,
    position: 'back-cover',
    size: 'standard',
  },
};

interface BookStudioContextValue {
  currentStep: WorkflowStep;
  setCurrentStep: (step: WorkflowStep) => void;
  
  brainstormIdeas: BrainstormIdea[];
  addBrainstormIdea: (idea: Omit<BrainstormIdea, 'id' | 'createdAt'>) => void;
  removeBrainstormIdea: (id: string) => void;
  clearBrainstormIdeas: () => void;
  
  bookOutline: BookOutline | null;
  setBookOutline: (outline: BookOutline | null) => void;
  
  generationProgress: GenerationProgress;
  generateFullBook: (genre: string, description: string, chapterCount?: number) => Promise<void>;
  generateAllChapters: () => Promise<void>;
  generateChapter: (chapterIndex: number) => Promise<void>;
  
  images: BookImage[];
  addImage: (image: Omit<BookImage, 'id'>) => void;
  removeImage: (id: string) => void;
  analyzeImage: (imageId: string) => Promise<void>;
  
  imagePlacements: ImagePlacement[];
  addImagePlacement: (placement: Omit<ImagePlacement, 'id'>) => void;
  updateImagePlacement: (id: string, updates: Partial<ImagePlacement>) => void;
  removeImagePlacement: (id: string) => void;
  
  manuscriptHtml: string;
  setManuscriptHtml: (html: string) => void;
  insertAtCursor: (html: string) => void;
  
  projectId?: number;
  setProjectId: (id: number | undefined) => void;
  
  printSettings: PrintSettings;
  savePrintSettings: (settings: Partial<PrintSettings>) => void;
  
  sources: Source[];
  addSource: (source: Omit<Source, 'id' | 'createdAt'>) => void;
  removeSource: (id: string) => void;
  
  documentImports: DocumentImport[];
  importDocument: (doc: Omit<DocumentImport, 'id' | 'importedAt'>) => void;
  
  isbnData: IsbnData;
  setIsbnData: (data: Partial<IsbnData>) => void;
  
  isSaving: boolean;
  lastSaved: Date | null;
}

const BookStudioContext = createContext<BookStudioContextValue | null>(null);

const AUTOSAVE_DELAY = 2000;

export function BookStudioProvider({ children, initialProjectId }: { children: ReactNode; initialProjectId?: number }) {
  const { toast } = useToast();
  
  const { 
    project, 
    updateProject, 
    isSaving: projectIsSaving, 
    lastSaved: projectLastSaved,
    loadProject 
  } = useBookProject(initialProjectId);
  
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('start');
  const [brainstormIdeas, setBrainstormIdeas] = useState<BrainstormIdea[]>([]);
  const [bookOutline, setBookOutline] = useState<BookOutline | null>(null);
  const [images, setImages] = useState<BookImage[]>([]);
  const [imagePlacements, setImagePlacements] = useState<ImagePlacement[]>([]);
  const [manuscriptHtml, setManuscriptHtml] = useState('');
  const [projectId, setProjectId] = useState<number | undefined>(initialProjectId);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress>({
    isGenerating: false,
    currentChapter: 0,
    totalChapters: 0,
    status: ''
  });
  
  const [printSettings, setPrintSettings] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [sources, setSources] = useState<Source[]>([]);
  const [documentImports, setDocumentImports] = useState<DocumentImport[]>([]);
  const [isbnData, setIsbnDataState] = useState<IsbnData>(DEFAULT_ISBN_DATA);
  
  const isHydratedRef = useRef(false);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<Partial<BookProject>>({});

  useEffect(() => {
    if (project && !isHydratedRef.current) {
      isHydratedRef.current = true;
      
      if (project.aiKnowledge) {
        const ideas: BrainstormIdea[] = [];
        const knowledge = project.aiKnowledge;
        
        knowledge.themes?.forEach((theme, idx) => {
          ideas.push({
            id: `theme-${idx}`,
            content: theme,
            type: 'theme',
            createdAt: new Date(project.createdAt),
          });
        });
        knowledge.characters?.forEach((char, idx) => {
          ideas.push({
            id: `char-${idx}`,
            content: char,
            type: 'character',
            createdAt: new Date(project.createdAt),
          });
        });
        knowledge.plotPoints?.forEach((plot, idx) => {
          ideas.push({
            id: `plot-${idx}`,
            content: plot,
            type: 'plot',
            createdAt: new Date(project.createdAt),
          });
        });
        knowledge.goals?.forEach((goal, idx) => {
          ideas.push({
            id: `goal-${idx}`,
            content: goal,
            type: 'goal',
            createdAt: new Date(project.createdAt),
          });
        });
        knowledge.keyFacts?.forEach((fact, idx) => {
          ideas.push({
            id: `note-${idx}`,
            content: fact,
            type: 'note',
            createdAt: new Date(project.createdAt),
          });
        });
        
        if (ideas.length > 0) {
          setBrainstormIdeas(ideas);
        }
      }
      
      if (project.manuscriptHtml) {
        setManuscriptHtml(project.manuscriptHtml);
        
        const chapters: ChapterOutline[] = [];
        const chapterRegex = /<h2[^>]*>(?:Chapter\s+\d+:\s*)?([^<]+)<\/h2>/gi;
        let match;
        let chapterNum = 1;
        
        while ((match = chapterRegex.exec(project.manuscriptHtml)) !== null) {
          chapters.push({
            id: `chapter-${chapterNum}`,
            number: chapterNum,
            title: match[1].trim(),
            description: '',
            targetWordCount: 3000,
            status: 'complete',
          });
          chapterNum++;
        }
        
        if (chapters.length > 0) {
          setBookOutline({
            title: project.title,
            subtitle: project.subtitle,
            genre: project.genre || 'fiction',
            targetAudience: project.targetAudience,
            targetWordCount: project.wordCount || 50000,
            chapters,
          });
          setCurrentStep('build');
        }
      }
      
      if (project.imagePlacements && Array.isArray(project.imagePlacements)) {
        setImagePlacements(project.imagePlacements);
      }
      
      setPrintSettings({
        trimSize: project.trimSize || DEFAULT_PRINT_SETTINGS.trimSize,
        fontSize: project.fontSize || DEFAULT_PRINT_SETTINGS.fontSize,
        fontFamily: project.fontFamily || DEFAULT_PRINT_SETTINGS.fontFamily,
        marginInner: project.marginInner || DEFAULT_PRINT_SETTINGS.marginInner,
        marginOuter: project.marginOuter || DEFAULT_PRINT_SETTINGS.marginOuter,
        marginTop: project.marginTop || DEFAULT_PRINT_SETTINGS.marginTop,
        marginBottom: project.marginBottom || DEFAULT_PRINT_SETTINGS.marginBottom,
      });
      
      if (project.currentStep !== undefined) {
        const stepMap: Record<number, WorkflowStep> = {
          0: 'start',
          1: 'plan',
          2: 'generate',
          3: 'build',
          4: 'publish',
        };
        setCurrentStep(stepMap[project.currentStep] || 'start');
      }
    }
  }, [project]);

  useEffect(() => {
    if (projectId && projectId !== initialProjectId) {
      isHydratedRef.current = false;
      loadProject(projectId);
    }
  }, [projectId, initialProjectId, loadProject]);

  const scheduleAutosave = useCallback((changes: Partial<BookProject>) => {
    pendingChangesRef.current = { ...pendingChangesRef.current, ...changes };
    
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
    }
    
    autosaveTimerRef.current = setTimeout(() => {
      if (Object.keys(pendingChangesRef.current).length > 0) {
        updateProject(pendingChangesRef.current);
        pendingChangesRef.current = {};
      }
    }, AUTOSAVE_DELAY);
  }, [updateProject]);

  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  const addBrainstormIdea = useCallback((idea: Omit<BrainstormIdea, 'id' | 'createdAt'>) => {
    const newIdea: BrainstormIdea = {
      ...idea,
      id: `idea-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date()
    };
    setBrainstormIdeas(prev => {
      const updated = [...prev, newIdea];
      
      const aiKnowledge = {
        themes: updated.filter(i => i.type === 'theme').map(i => i.content),
        characters: updated.filter(i => i.type === 'character').map(i => i.content),
        plotPoints: updated.filter(i => i.type === 'plot').map(i => i.content),
        goals: updated.filter(i => i.type === 'goal').map(i => i.content),
        keyFacts: updated.filter(i => i.type === 'note').map(i => i.content),
      };
      scheduleAutosave({ aiKnowledge });
      
      return updated;
    });
  }, [scheduleAutosave]);

  const removeBrainstormIdea = useCallback((id: string) => {
    setBrainstormIdeas(prev => {
      const updated = prev.filter(idea => idea.id !== id);
      
      const aiKnowledge = {
        themes: updated.filter(i => i.type === 'theme').map(i => i.content),
        characters: updated.filter(i => i.type === 'character').map(i => i.content),
        plotPoints: updated.filter(i => i.type === 'plot').map(i => i.content),
        goals: updated.filter(i => i.type === 'goal').map(i => i.content),
        keyFacts: updated.filter(i => i.type === 'note').map(i => i.content),
      };
      scheduleAutosave({ aiKnowledge });
      
      return updated;
    });
  }, [scheduleAutosave]);

  const clearBrainstormIdeas = useCallback(() => {
    setBrainstormIdeas([]);
    scheduleAutosave({ aiKnowledge: { themes: [], characters: [], plotPoints: [], goals: [], keyFacts: [] } });
  }, [scheduleAutosave]);

  const handleSetManuscriptHtml = useCallback((html: string) => {
    setManuscriptHtml(html);
    const wordCount = html.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
    scheduleAutosave({ manuscriptHtml: html, wordCount });
  }, [scheduleAutosave]);

  const savePrintSettings = useCallback((settings: Partial<PrintSettings>) => {
    setPrintSettings(prev => {
      const updated = { ...prev, ...settings };
      scheduleAutosave({
        trimSize: updated.trimSize,
        fontSize: updated.fontSize,
        fontFamily: updated.fontFamily,
        marginInner: updated.marginInner,
        marginOuter: updated.marginOuter,
        marginTop: updated.marginTop,
        marginBottom: updated.marginBottom,
      });
      return updated;
    });
  }, [scheduleAutosave]);

  const addSource = useCallback((source: Omit<Source, 'id' | 'createdAt'>) => {
    const newSource: Source = {
      ...source,
      id: `source-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date(),
    };
    setSources(prev => [...prev, newSource]);
  }, []);

  const removeSource = useCallback((id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
  }, []);

  const importDocument = useCallback((doc: Omit<DocumentImport, 'id' | 'importedAt'>) => {
    const newDoc: DocumentImport = {
      ...doc,
      id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      importedAt: new Date(),
    };
    setDocumentImports(prev => [...prev, newDoc]);
  }, []);

  const setIsbnData = useCallback((data: Partial<IsbnData>) => {
    setIsbnDataState(prev => ({
      ...prev,
      ...data,
      barcodeSettings: {
        ...prev.barcodeSettings,
        ...(data.barcodeSettings || {}),
      },
    }));
  }, []);

  const handleSetCurrentStep = useCallback((step: WorkflowStep) => {
    setCurrentStep(step);
    const stepMap: Record<WorkflowStep, number> = {
      'start': 0,
      'plan': 1,
      'generate': 2,
      'build': 3,
      'publish': 4,
    };
    scheduleAutosave({ currentStep: stepMap[step] });
  }, [scheduleAutosave]);

  const generateFullBookMutation = useMutation({
    mutationFn: async ({ genre, description, chapterCount }: { genre: string; description: string; chapterCount?: number }) => {
      const brainstormContext = brainstormIdeas.length > 0 
        ? `\n\nBrainstorm ideas:\n${brainstormIdeas.map(i => `- [${i.type}] ${i.content}`).join('\n')}`
        : '';
      
      const response = await apiRequest('POST', '/api/book/generate-full-book', {
        genre,
        description: description + brainstormContext,
        chapterCount: chapterCount || 10
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.outline) {
        const outline: BookOutline = {
          title: data.outline.title || 'Untitled Book',
          subtitle: data.outline.subtitle,
          hook: data.outline.hook,
          genre: data.outline.genre || 'fiction',
          targetAudience: data.outline.targetAudience,
          targetWordCount: data.outline.targetWordCount || 50000,
          chapters: (data.outline.chapters || []).map((ch: any, idx: number) => ({
            id: `chapter-${idx + 1}`,
            number: idx + 1,
            title: ch.title || `Chapter ${idx + 1}`,
            description: ch.description || ch.summary || '',
            targetWordCount: ch.targetWordCount || 3000,
            status: 'outline' as const
          }))
        };
        setBookOutline(outline);
        handleSetCurrentStep('plan');
        toast({ 
          title: "Book Outline Generated", 
          description: `"${outline.title}" with ${outline.chapters.length} chapters ready` 
        });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateAllChaptersMutation = useMutation({
    mutationFn: async () => {
      if (!bookOutline) throw new Error('No outline available');
      
      const response = await apiRequest('POST', '/api/book/generate-all-chapters', {
        title: bookOutline.title,
        genre: bookOutline.genre,
        targetAudience: bookOutline.targetAudience,
        chapters: bookOutline.chapters.map(ch => ({
          title: ch.title,
          description: ch.description,
          targetWordCount: ch.targetWordCount
        }))
      });
      return response.json();
    },
    onMutate: () => {
      if (bookOutline) {
        setGenerationProgress({
          isGenerating: true,
          currentChapter: 0,
          totalChapters: bookOutline.chapters.length,
          status: 'Starting generation...'
        });
      }
    },
    onSuccess: (data) => {
      if (data.success && data.chapters) {
        const updatedChapters = bookOutline!.chapters.map((ch, idx) => ({
          ...ch,
          content: data.chapters[idx]?.content || '',
          wordCount: data.chapters[idx]?.wordCount || 0,
          status: 'complete' as const
        }));
        
        setBookOutline(prev => prev ? { ...prev, chapters: updatedChapters } : null);
        
        const fullManuscript = data.chapters
          .map((ch: any, idx: number) => `<h2>Chapter ${idx + 1}: ${bookOutline!.chapters[idx]?.title}</h2>\n${ch.content}`)
          .join('\n\n');
        handleSetManuscriptHtml(fullManuscript);
        
        setGenerationProgress({ isGenerating: false, currentChapter: 0, totalChapters: 0, status: '' });
        handleSetCurrentStep('build');
        
        toast({ 
          title: "Book Generated", 
          description: `${data.chapters.length} chapters with ${data.totalWords?.toLocaleString() || 0} words` 
        });
      }
    },
    onError: (error: Error) => {
      setGenerationProgress({ isGenerating: false, currentChapter: 0, totalChapters: 0, status: '' });
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateChapterMutation = useMutation({
    mutationFn: async ({ chapterIndex }: { chapterIndex: number }) => {
      if (!bookOutline) throw new Error('No outline available');
      const chapter = bookOutline.chapters[chapterIndex];
      if (!chapter) throw new Error('Chapter not found');
      
      const response = await apiRequest('POST', '/api/book/generate-chapter', {
        bookTitle: bookOutline.title,
        genre: bookOutline.genre,
        chapterTitle: chapter.title,
        chapterDescription: chapter.description,
        targetWordCount: chapter.targetWordCount,
        chapterNumber: chapter.number,
        previousContext: bookOutline.chapters
          .slice(0, chapterIndex)
          .filter(ch => ch.content)
          .map(ch => `${ch.title}: ${ch.content?.slice(0, 200)}...`)
          .join('\n')
      });
      return { data: await response.json(), chapterIndex };
    },
    onMutate: ({ chapterIndex }) => {
      setBookOutline(prev => {
        if (!prev) return null;
        const updated = [...prev.chapters];
        updated[chapterIndex] = { ...updated[chapterIndex], status: 'generating' };
        return { ...prev, chapters: updated };
      });
    },
    onSuccess: ({ data, chapterIndex }) => {
      if (data.content) {
        setBookOutline(prev => {
          if (!prev) return null;
          const updated = [...prev.chapters];
          updated[chapterIndex] = {
            ...updated[chapterIndex],
            content: data.content,
            wordCount: data.wordCount || data.content.split(/\s+/).length,
            status: 'complete'
          };
          return { ...prev, chapters: updated };
        });
        toast({ title: "Chapter Generated", description: `Chapter ${chapterIndex + 1} complete` });
      }
    },
    onError: (error: Error, { chapterIndex }) => {
      setBookOutline(prev => {
        if (!prev) return null;
        const updated = [...prev.chapters];
        updated[chapterIndex] = { ...updated[chapterIndex], status: 'outline' };
        return { ...prev, chapters: updated };
      });
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const analyzeImageMutation = useMutation({
    mutationFn: async ({ imageId, imageUrl }: { imageId: string; imageUrl: string }) => {
      const response = await apiRequest('POST', '/api/ai/analyze-image', {
        imageUrl,
        context: bookOutline ? `Book: "${bookOutline.title}" - ${bookOutline.genre}` : undefined,
        chapters: bookOutline?.chapters.map(ch => ch.title)
      });
      return { data: await response.json(), imageId };
    },
    onMutate: ({ imageId }) => {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, isAnalyzing: true } : img
      ));
    },
    onSuccess: ({ data, imageId }) => {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, analysis: data.analysis, isAnalyzing: false } : img
      ));
      
      if (data.analysis?.placement) {
        const suggestedPlacement: ImagePlacement = {
          id: `placement-${Date.now()}`,
          imageId,
          chapterIndex: data.analysis.placement.suggestedChapter || 0,
          position: 0,
          alignment: 'center',
          caption: data.analysis.caption,
          isApproved: false
        };
        setImagePlacements(prev => [...prev, suggestedPlacement]);
        toast({ title: "Placement Suggested", description: data.analysis.placement.reason });
      }
    },
    onError: (error: Error, { imageId }) => {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, isAnalyzing: false } : img
      ));
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateFullBook = useCallback(async (genre: string, description: string, chapterCount?: number) => {
    await generateFullBookMutation.mutateAsync({ genre, description, chapterCount });
  }, [generateFullBookMutation]);

  const generateAllChapters = useCallback(async () => {
    await generateAllChaptersMutation.mutateAsync();
  }, [generateAllChaptersMutation]);

  const generateChapter = useCallback(async (chapterIndex: number) => {
    await generateChapterMutation.mutateAsync({ chapterIndex });
  }, [generateChapterMutation]);

  const addImage = useCallback((image: Omit<BookImage, 'id'>) => {
    const newImage: BookImage = {
      ...image,
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    };
    setImages(prev => [...prev, newImage]);
    return newImage.id;
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages(prev => prev.filter(img => img.id !== id));
    setImagePlacements(prev => prev.filter(p => p.imageId !== id));
  }, []);

  const analyzeImage = useCallback(async (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      await analyzeImageMutation.mutateAsync({ imageId, imageUrl: image.url });
    }
  }, [images, analyzeImageMutation]);

  const addImagePlacement = useCallback((placement: Omit<ImagePlacement, 'id'>) => {
    const newPlacement: ImagePlacement = {
      ...placement,
      id: `placement-${Date.now()}`
    };
    setImagePlacements(prev => [...prev, newPlacement]);
  }, []);

  const updateImagePlacement = useCallback((id: string, updates: Partial<ImagePlacement>) => {
    setImagePlacements(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  const removeImagePlacement = useCallback((id: string) => {
    setImagePlacements(prev => prev.filter(p => p.id !== id));
  }, []);

  const insertAtCursor = useCallback((html: string) => {
    setManuscriptHtml(prev => {
      const updated = prev + html;
      const wordCount = updated.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
      scheduleAutosave({ manuscriptHtml: updated, wordCount });
      return updated;
    });
  }, [scheduleAutosave]);

  const value: BookStudioContextValue = {
    currentStep,
    setCurrentStep: handleSetCurrentStep,
    brainstormIdeas,
    addBrainstormIdea,
    removeBrainstormIdea,
    clearBrainstormIdeas,
    bookOutline,
    setBookOutline,
    generationProgress,
    generateFullBook,
    generateAllChapters,
    generateChapter,
    images,
    addImage,
    removeImage,
    analyzeImage,
    imagePlacements,
    addImagePlacement,
    updateImagePlacement,
    removeImagePlacement,
    manuscriptHtml,
    setManuscriptHtml: handleSetManuscriptHtml,
    insertAtCursor,
    projectId,
    setProjectId,
    printSettings,
    savePrintSettings,
    sources,
    addSource,
    removeSource,
    documentImports,
    importDocument,
    isbnData,
    setIsbnData,
    isSaving: projectIsSaving,
    lastSaved: projectLastSaved,
  };

  return (
    <BookStudioContext.Provider value={value}>
      {children}
    </BookStudioContext.Provider>
  );
}

export function useBookStudio() {
  const context = useContext(BookStudioContext);
  if (!context) {
    throw new Error('useBookStudio must be used within a BookStudioProvider');
  }
  return context;
}
