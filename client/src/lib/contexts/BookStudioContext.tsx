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
  imagePrompt?: string;
  keyPoints?: string[];
}

export interface AIRecommendations {
  structure?: string[];
  content?: string[];
  marketing?: string[];
  nextSteps?: string[];
  immediate?: string[];
  style?: string[];
}

export interface ContentAnalysis {
  themes?: string[];
  keyTopics?: string[];
  tone?: string;
  strengths?: string[];
  areasForImprovement?: string[];
  suggestedImagePrompts?: Array<{
    prompt: string;
    placement: string;
    purpose: string;
  }>;
  recommendations?: AIRecommendations;
  targetAudience?: string;
  wordCount?: number;
  readingLevel?: string;
  summary?: string;
}

export interface ImagePromptSuggestion {
  id: string;
  chapterNumber?: number;
  title: string;
  prompt: string;
  placement: 'chapter-start' | 'inline' | 'chapter-end' | 'cover';
  purpose: 'narrative' | 'explanatory' | 'decorative' | 'emotional';
  aspectRatio?: string;
  priority: 'high' | 'medium' | 'low';
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

export interface PolishProgress {
  isPolishing: boolean;
  currentPass: 'developmental' | 'line' | 'copy' | 'proofread' | null;
  completedPasses: string[];
  status: string;
}

export interface MarketingBlurbs {
  short: string;
  medium: string;
  long: string;
}

export interface ExportReadiness {
  ready: boolean;
  issues: string[];
  checklist: { item: string; passed: boolean }[];
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
  generateFullBook: (genre: string, description: string, chapterCount?: number, title?: string) => Promise<void>;
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

  recommendations: AIRecommendations | null;
  setRecommendations: (recs: AIRecommendations | null) => void;
  
  contentAnalysis: ContentAnalysis | null;
  setContentAnalysis: (analysis: ContentAnalysis | null) => void;
  
  imagePrompts: ImagePromptSuggestion[];
  setImagePrompts: (prompts: ImagePromptSuggestion[]) => void;
  
  analyzeContent: (content: string, contentType?: string, genre?: string) => Promise<ContentAnalysis | null>;
  isAnalyzingContent: boolean;
  
  generateImagePrompts: () => Promise<void>;
  isGeneratingImagePrompts: boolean;

  polishProgress: PolishProgress;
  qualityPolish: (chapterIndex?: number) => Promise<void>;
  editChapter: (chapterIndex: number, editType: 'developmental' | 'line' | 'copy' | 'proofread') => Promise<void>;
  
  applyFixes: (chapterIndex?: number, useDocumentImports?: boolean) => Promise<void>;
  isApplyingFixes: boolean;
  
  generateBookImage: (prompt: string, style?: string, chapterId?: string) => Promise<string | null>;
  isGeneratingImage: boolean;
  removeImageBackground: (imageId: string) => Promise<void>;
  isRemovingBackground: boolean;
  
  uploadImageToServer: (file: File) => Promise<string | null>;
  isUploadingImage: boolean;
  
  marketingBlurbs: MarketingBlurbs | null;
  generateBlurb: () => Promise<void>;
  isGeneratingBlurb: boolean;
  
  amazonKeywords: string[];
  generateKeywords: () => Promise<void>;
  isGeneratingKeywords: boolean;
  
  exportReadiness: ExportReadiness | null;
  checkExportReadiness: () => Promise<void>;
  exportBook: (format: 'pdf' | 'epub' | 'docx' | 'html') => Promise<string | null>;
  isExporting: boolean;
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
  
  const [recommendations, setRecommendations] = useState<AIRecommendations | null>(null);
  const [contentAnalysis, setContentAnalysis] = useState<ContentAnalysis | null>(null);
  const [imagePrompts, setImagePrompts] = useState<ImagePromptSuggestion[]>([]);
  
  const [polishProgress, setPolishProgress] = useState<PolishProgress>({
    isPolishing: false,
    currentPass: null,
    completedPasses: [],
    status: ''
  });
  
  const [marketingBlurbs, setMarketingBlurbs] = useState<MarketingBlurbs | null>(null);
  const [amazonKeywords, setAmazonKeywords] = useState<string[]>([]);
  const [exportReadiness, setExportReadiness] = useState<ExportReadiness | null>(null);
  
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
      
      // Restore document imports from manuscriptText if available
      if (project.manuscriptText && !project.manuscriptHtml) {
        // If we have manuscriptText but no HTML yet, restore as document import
        const restoredDoc: DocumentImport = {
          id: `doc-restored-${Date.now()}`,
          fileName: project.title || 'Imported Manuscript',
          fileType: 'text/plain',
          content: project.manuscriptText,
          wordCount: project.manuscriptText.split(/\s+/).filter(Boolean).length,
          importedAt: new Date(project.createdAt),
        };
        setDocumentImports([restoredDoc]);
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
    setDocumentImports(prev => {
      const updated = [...prev, newDoc];
      // Persist all imported document content to manuscriptText
      const allContent = updated.map(d => d.content).filter(Boolean).join('\n\n---\n\n');
      scheduleAutosave({ manuscriptText: allContent });
      return updated;
    });
  }, [scheduleAutosave]);

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
    mutationFn: async ({ genre, description, chapterCount, title }: { genre: string; description: string; chapterCount?: number; title?: string }) => {
      const manuscriptContent = documentImports.length > 0 
        ? documentImports.map(d => d.content).filter(Boolean).join('\n\n')
        : undefined;
      
      const response = await apiRequest('POST', '/api/book/generate-full-book', {
        genre,
        description,
        chapterCount: chapterCount || 10,
        title: title || undefined,
        brainstormIdeas: brainstormIdeas.map(i => ({ type: i.type, content: i.content })),
        manuscriptContent
      });
      return response.json();
    },
    onSuccess: (data, variables) => {
      if (data.success && data.outline) {
        const outline: BookOutline = {
          title: variables.title || data.outline.title || 'Untitled Book',
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
            status: 'outline' as const,
            imagePrompt: ch.imagePrompt,
            keyPoints: ch.keyPoints
          }))
        };
        setBookOutline(outline);
        
        if (data.recommendations) {
          setRecommendations(data.recommendations);
        }
        
        const chapterImagePrompts: ImagePromptSuggestion[] = (data.outline.chapters || [])
          .filter((ch: any) => ch.imagePrompt)
          .map((ch: any, idx: number) => ({
            id: `prompt-${idx + 1}-${Date.now()}`,
            chapterNumber: idx + 1,
            title: `Illustration for ${ch.title}`,
            prompt: ch.imagePrompt,
            placement: 'chapter-start' as const,
            purpose: 'narrative' as const,
            priority: 'medium' as const
          }));
        
        if (chapterImagePrompts.length > 0) {
          setImagePrompts(chapterImagePrompts);
        }
        
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

  const analyzeContentMutation = useMutation({
    mutationFn: async ({ content, contentType, genre }: { content: string; contentType?: string; genre?: string }) => {
      const response = await apiRequest('POST', '/api/book/analyze-content', {
        content,
        contentType: contentType || 'manuscript',
        genre: genre || bookOutline?.genre
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.analysis) {
        setContentAnalysis(data.analysis);
        
        if (data.analysis.recommendations) {
          setRecommendations(prev => ({
            ...prev,
            ...data.analysis.recommendations
          }));
        }
        
        if (data.analysis.suggestedImagePrompts && data.analysis.suggestedImagePrompts.length > 0) {
          const newPrompts: ImagePromptSuggestion[] = data.analysis.suggestedImagePrompts.map((p: any, idx: number) => ({
            id: `analysis-prompt-${idx}-${Date.now()}`,
            title: `Suggested Image ${idx + 1}`,
            prompt: p.prompt,
            placement: p.placement === 'chapter-start' ? 'chapter-start' : 'inline',
            purpose: 'narrative' as const,
            priority: 'medium' as const
          }));
          setImagePrompts(prev => [...prev, ...newPrompts]);
        }
        
        toast({ title: "Content Analyzed", description: "AI insights are ready" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Analysis Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateImagePromptsMutation = useMutation({
    mutationFn: async () => {
      if (!bookOutline) throw new Error('No outline available');
      
      const response = await apiRequest('POST', '/api/book/generate-image-prompts', {
        bookTitle: bookOutline.title,
        genre: bookOutline.genre,
        targetAudience: bookOutline.targetAudience,
        chapters: bookOutline.chapters.map(ch => ({
          title: ch.title,
          description: ch.description,
          content: ch.content?.substring(0, 1000)
        }))
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.imagePrompts) {
        const prompts: ImagePromptSuggestion[] = data.imagePrompts.map((p: any) => ({
          id: p.id || `gen-prompt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          chapterNumber: p.chapterNumber,
          title: p.title,
          prompt: p.prompt,
          placement: p.placement || 'inline',
          purpose: p.purpose || 'narrative',
          aspectRatio: p.aspectRatio,
          priority: p.priority || 'medium'
        }));
        setImagePrompts(prompts);
        toast({ title: "Image Prompts Generated", description: `${prompts.length} illustration ideas ready` });
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

  const qualityPolishMutation = useMutation({
    mutationFn: async ({ content, passes }: { content: string; passes?: string[] }) => {
      const response = await apiRequest('POST', '/api/book/quality-polish', {
        content,
        passes: passes || ['developmental', 'line', 'copy', 'proofread']
      });
      return response.json();
    },
    onMutate: () => {
      setPolishProgress({ isPolishing: true, currentPass: 'developmental', completedPasses: [], status: 'Starting developmental edit...' });
    },
    onSuccess: (data) => {
      if (data.success && data.polishedContent) {
        setPolishProgress({ isPolishing: false, currentPass: null, completedPasses: data.passesCompleted || [], status: 'Complete' });
        toast({ title: "Content Polished", description: `${data.passesCompleted?.length || 0} editing passes complete` });
        return data.polishedContent;
      }
    },
    onError: (error: Error) => {
      setPolishProgress({ isPolishing: false, currentPass: null, completedPasses: [], status: '' });
      toast({ title: "Polish Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateBookImageMutation = useMutation({
    mutationFn: async ({ prompt, style, chapterId }: { prompt: string; style?: string; chapterId?: string }) => {
      const response = await apiRequest('POST', '/api/book/images/generate', {
        prompt,
        style: style || 'realistic',
        chapterId,
        bookTitle: bookOutline?.title,
        genre: bookOutline?.genre
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.imageUrl) {
        const newImage: BookImage = {
          id: data.id || `img-${Date.now()}`,
          url: data.imageUrl,
          prompt: data.prompt,
          origin: 'generated',
          hasBackground: true
        };
        setImages(prev => [...prev, newImage]);
        toast({ title: "Image Generated", description: "Your illustration is ready" });
        return data.imageUrl;
      }
    },
    onError: (error: Error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('bookTitle', bookOutline?.title || '');
      
      const response = await fetch('/api/book/images/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.imageUrl) {
        const newImage: BookImage = {
          id: data.id || `img-${Date.now()}`,
          url: data.imageUrl,
          origin: 'uploaded',
          hasBackground: true
        };
        setImages(prev => [...prev, newImage]);
        toast({ title: "Image Uploaded", description: "Your image is ready" });
        return data.imageUrl;
      }
    },
    onError: (error: Error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    }
  });

  const removeBackgroundMutation = useMutation({
    mutationFn: async ({ imageId }: { imageId: string }) => {
      const response = await apiRequest('POST', `/api/book/images/${imageId}/remove-background`, {});
      return { data: await response.json(), imageId };
    },
    onSuccess: ({ data, imageId }) => {
      if (data.success && data.imageUrl) {
        setImages(prev => prev.map(img => 
          img.id === imageId ? { ...img, url: data.imageUrl, hasBackground: false } : img
        ));
        toast({ title: "Background Removed", description: "Image updated" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Remove Background Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateBlurbMutation = useMutation({
    mutationFn: async () => {
      if (!bookOutline) throw new Error('No book outline available');
      const response = await apiRequest('POST', '/api/book/generate-blurb', {
        title: bookOutline.title,
        subtitle: bookOutline.subtitle,
        genre: bookOutline.genre,
        targetAudience: bookOutline.targetAudience,
        chapters: bookOutline.chapters.map(ch => ({ title: ch.title, description: ch.description }))
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setMarketingBlurbs({
          short: data.shortBlurb || data.blurb?.substring(0, 150) || '',
          medium: data.mediumBlurb || data.blurb?.substring(0, 400) || '',
          long: data.longBlurb || data.blurb || ''
        });
        toast({ title: "Blurbs Generated", description: "Marketing copy ready" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateKeywordsMutation = useMutation({
    mutationFn: async () => {
      if (!bookOutline) throw new Error('No book outline available');
      const response = await apiRequest('POST', '/api/book/generate-keywords', {
        title: bookOutline.title,
        genre: bookOutline.genre,
        description: bookOutline.chapters.map(ch => ch.description).join(' '),
        targetAudience: bookOutline.targetAudience
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.keywords) {
        setAmazonKeywords(data.keywords);
        toast({ title: "Keywords Generated", description: `${data.keywords.length} Amazon keywords ready` });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    }
  });

  const exportBookMutation = useMutation({
    mutationFn: async ({ format }: { format: 'pdf' | 'epub' | 'docx' | 'html' }) => {
      if (!bookOutline) throw new Error('No book outline available');
      const response = await apiRequest('POST', '/api/book/export', {
        format,
        bookTitle: bookOutline.title,
        chapters: bookOutline.chapters.map(ch => ({ title: ch.title, content: ch.content })),
        settings: printSettings,
        imagePlacements,
        images
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank');
        }
        toast({ title: "Export Complete", description: `Your book is ready for download` });
        return data.downloadUrl || data.content;
      }
    },
    onError: (error: Error) => {
      toast({ title: "Export Failed", description: error.message, variant: "destructive" });
    }
  });

  const editChapterMutation = useMutation({
    mutationFn: async ({ chapterIndex, editType }: { chapterIndex: number; editType: 'developmental' | 'line' | 'copy' | 'proofread' }) => {
      if (!bookOutline) throw new Error('No outline available');
      const chapter = bookOutline.chapters[chapterIndex];
      if (!chapter?.content) throw new Error('Chapter has no content to edit');
      
      const response = await apiRequest('POST', `/api/book/edit/${editType}`, {
        content: chapter.content,
        title: chapter.title,
        context: `Book: "${bookOutline.title}", Genre: ${bookOutline.genre}`
      });
      return { data: await response.json(), chapterIndex };
    },
    onSuccess: ({ data, chapterIndex }) => {
      if (data.editedContent) {
        setBookOutline(prev => {
          if (!prev) return null;
          const updated = [...prev.chapters];
          updated[chapterIndex] = {
            ...updated[chapterIndex],
            content: data.editedContent,
            wordCount: data.editedContent.split(/\s+/).length
          };
          return { ...prev, chapters: updated };
        });
        toast({ title: "Edit Complete", description: `Chapter ${chapterIndex + 1} polished` });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Edit Failed", description: error.message, variant: "destructive" });
    }
  });

  const applyFixesMutation = useMutation({
    mutationFn: async ({ chapterIndex, useDocumentImports }: { chapterIndex?: number, useDocumentImports?: boolean }) => {
      let content = '';
      
      // Try document imports first if specified or if no outline exists
      if (useDocumentImports || !bookOutline?.chapters?.length) {
        content = documentImports.map(doc => doc.content || '').join('\n\n').trim();
      }
      
      // If no document content, try chapters
      if (!content && bookOutline?.chapters?.length) {
        content = chapterIndex !== undefined && bookOutline.chapters[chapterIndex]
          ? bookOutline.chapters[chapterIndex].content || ''
          : bookOutline.chapters.map(ch => ch.content || '').join('\n\n---CHAPTER BREAK---\n\n');
      }
      
      if (!content.trim()) throw new Error('No content to improve. Please upload a manuscript or generate chapters first.');
      
      const response = await apiRequest('POST', '/api/book/apply-fixes', {
        content,
        recommendations: recommendations
      });
      return { data: await response.json(), chapterIndex, useDocumentImports };
    },
    onSuccess: ({ data, chapterIndex, useDocumentImports }) => {
      if (data.success && data.improvedContent) {
        // If we improved document imports, update them
        if (useDocumentImports || !bookOutline?.chapters?.length) {
          setDocumentImports(prev => {
            const updated = prev.map((doc, idx) => 
              idx === 0 ? { ...doc, content: data.improvedContent } : doc
            );
            // Persist the improved content to the database
            const allContent = updated.map(d => d.content).filter(Boolean).join('\n\n---\n\n');
            scheduleAutosave({ manuscriptText: allContent });
            return updated;
          });
          toast({ 
            title: "Manuscript Improved", 
            description: `Your manuscript has been enhanced based on AI recommendations` 
          });
        } else if (bookOutline) {
          if (chapterIndex !== undefined) {
            setBookOutline(prev => {
              if (!prev) return null;
              const updated = [...prev.chapters];
              updated[chapterIndex] = {
                ...updated[chapterIndex],
                content: data.improvedContent,
                wordCount: data.improvedContent.split(/\s+/).length,
                status: 'complete' as const
              };
              return { ...prev, chapters: updated };
            });
            toast({ 
              title: "Improvements Applied", 
              description: `Chapter ${chapterIndex + 1} improved (${data.stats?.changePercent || 0}% changes)` 
            });
          } else {
            // Split improved content back into chapters
            const improvedChapters = data.improvedContent.split(/---CHAPTER BREAK---/);
            setBookOutline(prev => {
              if (!prev) return null;
              const updated = prev.chapters.map((ch, idx) => ({
                ...ch,
                content: improvedChapters[idx]?.trim() || ch.content,
                wordCount: (improvedChapters[idx]?.trim() || ch.content || '').split(/\s+/).length,
                status: 'complete' as const
              }));
              return { ...prev, chapters: updated };
            });
            toast({ 
              title: "All Improvements Applied", 
              description: `Book improved with ${data.stats?.changePercent || 0}% changes` 
            });
          }
        }
      }
    },
    onError: (error: Error) => {
      toast({ title: "Apply Fixes Failed", description: error.message, variant: "destructive" });
    }
  });

  const generateFullBook = useCallback(async (genre: string, description: string, chapterCount?: number, title?: string) => {
    await generateFullBookMutation.mutateAsync({ genre, description, chapterCount, title });
  }, [generateFullBookMutation]);

  const generateAllChapters = useCallback(async () => {
    await generateAllChaptersMutation.mutateAsync();
  }, [generateAllChaptersMutation]);

  const generateChapter = useCallback(async (chapterIndex: number) => {
    await generateChapterMutation.mutateAsync({ chapterIndex });
  }, [generateChapterMutation]);

  const analyzeContent = useCallback(async (content: string, contentType?: string, genre?: string): Promise<ContentAnalysis | null> => {
    const result = await analyzeContentMutation.mutateAsync({ content, contentType, genre });
    if (result?.analysis) {
      // Store the analysis in context
      setContentAnalysis(result.analysis);
      
      // Also update recommendations if present
      if (result.analysis.recommendations) {
        setRecommendations(result.analysis.recommendations);
      }
    }
    return result?.analysis || null;
  }, [analyzeContentMutation]);

  const generateImagePrompts = useCallback(async () => {
    await generateImagePromptsMutation.mutateAsync();
  }, [generateImagePromptsMutation]);

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

  // Quality Polish - run multi-pass editing on chapter or all content
  const qualityPolish = useCallback(async (chapterIndex?: number) => {
    const content = chapterIndex !== undefined && bookOutline?.chapters[chapterIndex]
      ? bookOutline.chapters[chapterIndex].content || ''
      : bookOutline?.chapters.map(ch => ch.content || '').join('\n\n---\n\n') || '';
    
    if (!content.trim()) {
      toast({ title: "No Content", description: "Generate chapters first", variant: "destructive" });
      return;
    }
    
    const result = await qualityPolishMutation.mutateAsync({ content });
    
    if (result?.polishedContent && bookOutline) {
      if (chapterIndex !== undefined) {
        const updated = [...bookOutline.chapters];
        updated[chapterIndex] = { ...updated[chapterIndex], content: result.polishedContent, status: 'complete' as const };
        setBookOutline({ ...bookOutline, chapters: updated });
      }
    }
  }, [bookOutline, qualityPolishMutation, toast, setBookOutline]);

  // Edit single chapter with specific edit type
  const editChapter = useCallback(async (chapterIndex: number, editType: 'developmental' | 'line' | 'copy' | 'proofread') => {
    if (!bookOutline?.chapters[chapterIndex]?.content) {
      toast({ title: "No Content", description: "Generate chapter first", variant: "destructive" });
      return;
    }
    
    // The mutation handles getting content from bookOutline and updates the chapter on success
    await editChapterMutation.mutateAsync({ chapterIndex, editType });
  }, [bookOutline, editChapterMutation, toast]);

  // Apply AI-recommended fixes to content
  const applyFixes = useCallback(async (chapterIndex?: number, useDocumentImports?: boolean) => {
    // Check for content in either documents or chapters
    const hasDocumentContent = documentImports.some(doc => doc.content?.trim());
    const hasChapterContent = bookOutline?.chapters?.some(ch => ch.content?.trim());
    
    if (!hasDocumentContent && !hasChapterContent) {
      toast({ title: "No Content", description: "Upload a manuscript or generate chapters first", variant: "destructive" });
      return;
    }
    
    await applyFixesMutation.mutateAsync({ chapterIndex, useDocumentImports: useDocumentImports ?? hasDocumentContent });
  }, [bookOutline, documentImports, applyFixesMutation, toast]);

  // Generate book image from prompt
  const generateBookImage = useCallback(async (prompt: string, style?: string, chapterId?: string): Promise<string | null> => {
    const result = await generateBookImageMutation.mutateAsync({ prompt, style, chapterId });
    return result?.imageUrl || null;
  }, [generateBookImageMutation]);

  // Remove image background
  const removeImageBackground = useCallback(async (imageId: string) => {
    await removeBackgroundMutation.mutateAsync({ imageId });
  }, [removeBackgroundMutation]);

  // Upload image to server
  const uploadImageToServer = useCallback(async (file: File): Promise<string | null> => {
    const result = await uploadImageMutation.mutateAsync({ file });
    return result?.imageUrl || null;
  }, [uploadImageMutation]);

  // Generate marketing blurbs
  const generateBlurb = useCallback(async () => {
    await generateBlurbMutation.mutateAsync();
  }, [generateBlurbMutation]);

  // Generate Amazon keywords
  const generateKeywords = useCallback(async () => {
    await generateKeywordsMutation.mutateAsync();
  }, [generateKeywordsMutation]);

  // Export book
  const exportBook = useCallback(async (format: 'pdf' | 'epub' | 'docx' | 'html'): Promise<string | null> => {
    const result = await exportBookMutation.mutateAsync({ format });
    return result?.downloadUrl || null;
  }, [exportBookMutation]);

  // Check export readiness
  const checkExportReadiness = useCallback(async () => {
    const checklist: { item: string; passed: boolean }[] = [];
    const issues: string[] = [];
    
    if (!bookOutline) {
      setExportReadiness({
        ready: false,
        issues: ['No book outline created'],
        checklist: [{ item: 'Create book outline', passed: false }]
      });
      return;
    }
    
    // Check for title
    const hasTitle = !!bookOutline.title?.trim();
    checklist.push({ item: 'Book title defined', passed: hasTitle });
    if (!hasTitle) issues.push('Book title is missing');
    
    // Check for chapters with content
    const chaptersWithContent = bookOutline.chapters.filter(ch => ch.content && ch.content.trim().length > 0);
    const allChaptersHaveContent = chaptersWithContent.length === bookOutline.chapters.length;
    checklist.push({ item: 'All chapters have content', passed: allChaptersHaveContent });
    if (chaptersWithContent.length === 0) {
      issues.push('No chapters have content - generate chapters first');
    } else if (!allChaptersHaveContent) {
      issues.push(`${bookOutline.chapters.length - chaptersWithContent.length} chapters missing content`);
    }
    
    // Check total word count
    const totalWords = bookOutline.chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
    const hasMinWordCount = totalWords >= 1000;
    checklist.push({ item: 'Minimum word count (1,000)', passed: hasMinWordCount });
    if (!hasMinWordCount) {
      issues.push(`Low word count (${totalWords}) - consider adding more content`);
    }
    
    setExportReadiness({
      ready: issues.length === 0,
      issues,
      checklist
    });
  }, [bookOutline]);

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
    recommendations,
    setRecommendations,
    contentAnalysis,
    setContentAnalysis,
    imagePrompts,
    setImagePrompts,
    analyzeContent,
    isAnalyzingContent: analyzeContentMutation.isPending,
    generateImagePrompts,
    isGeneratingImagePrompts: generateImagePromptsMutation.isPending,
    
    // Quality Polish
    polishProgress,
    qualityPolish,
    editChapter,
    
    // Apply Fixes
    applyFixes,
    isApplyingFixes: applyFixesMutation.isPending,
    
    // Image Generation
    generateBookImage,
    isGeneratingImage: generateBookImageMutation.isPending,
    removeImageBackground,
    isRemovingBackground: removeBackgroundMutation.isPending,
    uploadImageToServer,
    isUploadingImage: uploadImageMutation.isPending,
    
    // Marketing
    marketingBlurbs,
    generateBlurb,
    isGeneratingBlurb: generateBlurbMutation.isPending,
    
    // Keywords
    amazonKeywords,
    generateKeywords,
    isGeneratingKeywords: generateKeywordsMutation.isPending,
    
    // Export
    exportBook,
    isExporting: exportBookMutation.isPending,
    exportReadiness,
    checkExportReadiness,
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
