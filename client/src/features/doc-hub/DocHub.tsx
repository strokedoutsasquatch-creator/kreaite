import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  FileText,
  Code,
  FileType,
  Trash2,
  Plus,
  Merge,
  BookOpen,
  Loader2,
  Download,
  Copy,
  Scissors,
  FolderOpen,
  Save,
  Sparkles,
  Tag,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface DocSource {
  id: number;
  originalFilename: string;
  mimeType: string;
  parsedContent: string;
  parsedMetadata: any;
  wordCount: number;
  status: string;
  createdAt: string;
}

interface DocSnippet {
  id: number;
  label: string;
  content: string;
  tags: string[];
  category: string;
  createdAt: string;
}

interface MergeSession {
  id: number;
  title: string;
  description: string;
  sourceIds: number[];
  mergedContent: string;
  status: string;
  createdAt: string;
}

export function DocHub() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("sources");
  const [selectedSources, setSelectedSources] = useState<number[]>([]);
  const [mergeTitle, setMergeTitle] = useState("");
  const [snippetLabel, setSnippetLabel] = useState("");
  const [snippetContent, setSnippetContent] = useState("");
  const [snippetTags, setSnippetTags] = useState("");
  const [isParsing, setIsParsing] = useState(false);

  const { data: sources = [], isLoading: sourcesLoading } = useQuery<DocSource[]>({
    queryKey: ['/api/doc-hub/sources'],
  });

  const { data: snippets = [], isLoading: snippetsLoading } = useQuery<DocSnippet[]>({
    queryKey: ['/api/doc-hub/snippets'],
  });

  const { data: mergeSessions = [], isLoading: mergeLoading } = useQuery<MergeSession[]>({
    queryKey: ['/api/doc-hub/merge'],
  });

  const deleteSource = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/doc-hub/sources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doc-hub/sources'] });
      toast({ title: "Document deleted" });
    },
  });

  const saveSnippet = useMutation({
    mutationFn: async (data: { label: string; content: string; tags: string[] }) => {
      return apiRequest('POST', '/api/doc-hub/snippets', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doc-hub/snippets'] });
      setSnippetLabel("");
      setSnippetContent("");
      setSnippetTags("");
      toast({ title: "Snippet saved" });
    },
  });

  const deleteSnippet = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/doc-hub/snippets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doc-hub/snippets'] });
      toast({ title: "Snippet deleted" });
    },
  });

  const createMerge = useMutation({
    mutationFn: async (data: { title: string; sourceIds: number[]; mergedContent: string }) => {
      return apiRequest('POST', '/api/doc-hub/merge', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doc-hub/merge'] });
      setSelectedSources([]);
      setMergeTitle("");
      toast({ title: "Merge session created" });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsing(true);
    
    for (const file of Array.from(files)) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
        
        const parseRes = await fetch('/api/doc-hub/parse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            content: base64,
            filename: file.name,
            mimeType: file.type,
          }),
        });

        if (!parseRes.ok) throw new Error('Parse failed');
        const parsed = await parseRes.json();

        await apiRequest('POST', '/api/doc-hub/sources', {
          originalFilename: file.name,
          mimeType: parsed.metadata?.format || file.type,
          parsedContent: parsed.content,
          parsedMetadata: parsed.metadata,
          wordCount: parsed.metadata?.wordCount || 0,
        });

        toast({ title: `Parsed: ${file.name}`, description: `${parsed.metadata?.wordCount || 0} words` });
      } catch (error) {
        toast({ title: `Failed to parse ${file.name}`, variant: "destructive" });
      }
    }

    setIsParsing(false);
    queryClient.invalidateQueries({ queryKey: ['/api/doc-hub/sources'] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMerge = () => {
    if (selectedSources.length < 2) {
      toast({ title: "Select at least 2 documents to merge", variant: "destructive" });
      return;
    }
    if (!mergeTitle.trim()) {
      toast({ title: "Enter a title for the merged document", variant: "destructive" });
      return;
    }

    const selectedDocs = sources.filter(s => selectedSources.includes(s.id));
    const mergedContent = selectedDocs.map(d => d.parsedContent).join('\n\n---\n\n');
    
    createMerge.mutate({
      title: mergeTitle,
      sourceIds: selectedSources,
      mergedContent,
    });
  };

  const toggleSourceSelection = (id: number) => {
    setSelectedSources(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const getFormatIcon = (format: string) => {
    if (format === 'code' || format?.includes('script')) return Code;
    if (format === 'pdf') return FileType;
    return FileText;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" data-testid="doc-hub">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-3">Doc Hub</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">Import, Parse, Merge & Build Manuscripts</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 bg-zinc-900/50 border border-zinc-800/50">
          <TabsTrigger value="sources" data-testid="tab-sources">
            <FolderOpen className="w-4 h-4 mr-2" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="merge" data-testid="tab-merge">
            <Merge className="w-4 h-4 mr-2" />
            Merge
          </TabsTrigger>
          <TabsTrigger value="snippets" data-testid="tab-snippets">
            <Scissors className="w-4 h-4 mr-2" />
            Snippet Vault
          </TabsTrigger>
          <TabsTrigger value="manuscripts" data-testid="tab-manuscripts">
            <BookOpen className="w-4 h-4 mr-2" />
            Manuscripts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="space-y-6">
          <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
            <CardContent className="p-6">
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center hover:border-orange-500/50 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.doc,.txt,.md,.html,.js,.ts,.py,.json,.css,.jsx,.tsx"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
                <h3 className="text-white font-medium mb-2">Drop files here or click to upload</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Supports Word (.docx), PDF, Text, Markdown, HTML, and code files
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isParsing}
                  className="bg-orange-500 hover:bg-orange-600"
                  data-testid="button-upload-files"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Select Files
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {sourcesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : sources.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {sources.map((source) => {
                const FormatIcon = getFormatIcon(source.parsedMetadata?.format);
                return (
                  <Card 
                    key={source.id} 
                    className="bg-zinc-950 border border-zinc-800/50 hover:border-orange-500/50 transition-colors"
                    data-testid={`source-card-${source.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded bg-orange-500/20 flex items-center justify-center">
                            <FormatIcon className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <h4 className="text-white font-medium text-sm truncate max-w-[200px]">
                              {source.originalFilename}
                            </h4>
                            <p className="text-xs text-zinc-500">
                              {source.wordCount.toLocaleString()} words
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {source.parsedMetadata?.format || 'text'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                        {source.parsedContent?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-zinc-700"
                          onClick={() => copyToClipboard(source.parsedContent)}
                          data-testid={`button-copy-${source.id}`}
                        >
                          <Copy className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-zinc-700"
                          onClick={() => {
                            setSnippetContent(source.parsedContent?.substring(0, 500) || '');
                            setActiveTab('snippets');
                          }}
                          data-testid={`button-to-snippet-${source.id}`}
                        >
                          <Scissors className="w-3 h-3 mr-1" />
                          Snippet
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-red-500 hover:text-red-400 ml-auto"
                          onClick={() => deleteSource.mutate(source.id)}
                          data-testid={`button-delete-${source.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p className="text-zinc-400">No documents uploaded yet</p>
              <p className="text-xs text-zinc-500 mt-1">Upload Word docs, PDFs, or code files to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="merge" className="space-y-6">
          <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Merge className="w-5 h-5 text-orange-500" />
                Merge Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Merged manuscript title..."
                value={mergeTitle}
                onChange={(e) => setMergeTitle(e.target.value)}
                className="bg-black/50 border-zinc-700"
                data-testid="input-merge-title"
              />
              <p className="text-sm text-zinc-400">
                Select documents to merge ({selectedSources.length} selected)
              </p>
              <ScrollArea className="h-[300px] border border-zinc-800 rounded-lg p-4">
                {sources.map((source) => (
                  <div 
                    key={source.id}
                    onClick={() => toggleSourceSelection(source.id)}
                    className={`p-3 rounded-lg cursor-pointer mb-2 border transition-colors ${
                      selectedSources.includes(source.id)
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-zinc-800 hover:border-zinc-700'
                    }`}
                    data-testid={`merge-source-${source.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm">{source.originalFilename}</span>
                      <span className="text-xs text-zinc-500">{source.wordCount} words</span>
                    </div>
                  </div>
                ))}
              </ScrollArea>
              <Button
                onClick={handleMerge}
                disabled={selectedSources.length < 2 || createMerge.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600"
                data-testid="button-merge"
              >
                {createMerge.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Merge className="w-4 h-4 mr-2" />
                )}
                Merge Selected Documents
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="snippets" className="space-y-6">
          <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Scissors className="w-5 h-5 text-orange-500" />
                Save New Snippet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                placeholder="Snippet label..."
                value={snippetLabel}
                onChange={(e) => setSnippetLabel(e.target.value)}
                className="bg-black/50 border-zinc-700"
                data-testid="input-snippet-label"
              />
              <Textarea
                placeholder="Paste content to save for later..."
                value={snippetContent}
                onChange={(e) => setSnippetContent(e.target.value)}
                className="min-h-[150px] bg-black/50 border-zinc-700"
                data-testid="textarea-snippet-content"
              />
              <Input
                placeholder="Tags (comma separated)..."
                value={snippetTags}
                onChange={(e) => setSnippetTags(e.target.value)}
                className="bg-black/50 border-zinc-700"
                data-testid="input-snippet-tags"
              />
              <Button
                onClick={() => saveSnippet.mutate({
                  label: snippetLabel,
                  content: snippetContent,
                  tags: snippetTags.split(',').map(t => t.trim()).filter(Boolean),
                })}
                disabled={!snippetLabel || !snippetContent || saveSnippet.isPending}
                className="w-full bg-orange-500 hover:bg-orange-600"
                data-testid="button-save-snippet"
              >
                {saveSnippet.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save to Vault
              </Button>
            </CardContent>
          </Card>

          {snippetsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : snippets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {snippets.map((snippet) => (
                <Card 
                  key={snippet.id} 
                  className="bg-zinc-950 border border-zinc-800/50"
                  data-testid={`snippet-card-${snippet.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-white font-medium">{snippet.label}</h4>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-500"
                        onClick={() => deleteSnippet.mutate(snippet.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-3 mb-2">{snippet.content}</p>
                    {snippet.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {snippet.tags.map((tag) => (
                          <Badge key={tag} className="text-[9px] bg-zinc-800 text-zinc-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Scissors className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p className="text-zinc-400">No snippets saved yet</p>
              <p className="text-xs text-zinc-500 mt-1">Save content for future books and projects</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="manuscripts" className="space-y-6">
          {mergeLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : mergeSessions.length > 0 ? (
            <div className="space-y-4">
              {mergeSessions.map((session) => (
                <Card 
                  key={session.id} 
                  className="bg-zinc-950 border border-zinc-800/50"
                  data-testid={`manuscript-card-${session.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-serif text-white">{session.title}</h3>
                        <p className="text-sm text-zinc-500">
                          {session.sourceIds?.length || 0} documents merged
                        </p>
                      </div>
                      <Badge className={session.status === 'draft' ? 'bg-zinc-700' : 'bg-green-600'}>
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4">
                      {session.mergedContent?.substring(0, 200)}...
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="border-zinc-700">
                        <BookOpen className="w-3 h-3 mr-1" />
                        Open in Editor
                      </Button>
                      <Button size="sm" variant="outline" className="border-zinc-700">
                        <Download className="w-3 h-3 mr-1" />
                        Export
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <p className="text-zinc-400">No merged manuscripts yet</p>
              <p className="text-xs text-zinc-500 mt-1">Merge multiple documents to create manuscripts</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
