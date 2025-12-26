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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Tag,
  Search,
  Eye,
  Edit2,
  Check,
  X,
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

interface SearchResults {
  sources: DocSource[];
  snippets: DocSnippet[];
  query: string;
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [viewingDoc, setViewingDoc] = useState<DocSource | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");

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

  const renameSource = useMutation({
    mutationFn: async ({ id, originalFilename }: { id: number; originalFilename: string }) => {
      return apiRequest('PATCH', `/api/doc-hub/sources/${id}`, { originalFilename });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/doc-hub/sources'] });
      setEditingId(null);
      setEditingName("");
      toast({ title: "Document renamed" });
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

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`/api/doc-hub/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const results = await res.json();
        setSearchResults(results);
      }
    } catch (error) {
      toast({ title: "Search failed", variant: "destructive" });
    }
    setIsSearching(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsing(true);
    
    for (const file of Array.from(files)) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        
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

  const startEditing = (source: DocSource) => {
    setEditingId(source.id);
    setEditingName(source.originalFilename);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveRename = (id: number) => {
    if (editingName.trim()) {
      renameSource.mutate({ id, originalFilename: editingName.trim() });
    }
  };

  const exportMergedContent = (session: MergeSession) => {
    const blob = new Blob([session.mergedContent || ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported successfully" });
  };

  const displayedSources = searchResults ? searchResults.sources : sources;
  const displayedSnippets = searchResults ? searchResults.snippets : snippets;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8" data-testid="doc-hub">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-serif font-bold tracking-tight text-white mb-3">Doc Hub</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">Import, Parse, Merge & Build Manuscripts</p>
      </div>

      <Card className="bg-zinc-950 border border-zinc-800/50 shadow-xl">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <Input
                placeholder="Search all documents and snippets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 bg-black/50 border-zinc-700"
                data-testid="input-search"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching}
              variant="outline"
              className="border-zinc-700"
              data-testid="button-search"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
            {searchResults && (
              <Button
                onClick={() => {
                  setSearchResults(null);
                  setSearchQuery("");
                }}
                variant="ghost"
                size="sm"
                data-testid="button-clear-search"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
          {searchResults && (
            <p className="text-sm text-zinc-400 mt-2">
              Found {searchResults.sources.length} documents and {searchResults.snippets.length} snippets matching "{searchResults.query}"
            </p>
          )}
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 bg-zinc-900/50 border border-zinc-800/50">
          <TabsTrigger value="sources" data-testid="tab-sources">
            <FolderOpen className="w-4 h-4 mr-2" />
            Sources ({displayedSources.length})
          </TabsTrigger>
          <TabsTrigger value="merge" data-testid="tab-merge">
            <Merge className="w-4 h-4 mr-2" />
            Merge
          </TabsTrigger>
          <TabsTrigger value="snippets" data-testid="tab-snippets">
            <Scissors className="w-4 h-4 mr-2" />
            Snippets ({displayedSnippets.length})
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
                  accept=".pdf,.docx,.doc,.txt,.md,.html,.js,.ts,.py,.json,.css,.jsx,.tsx,.rtf"
                  onChange={handleFileUpload}
                  className="hidden"
                  data-testid="input-file-upload"
                />
                <Upload className="w-12 h-12 mx-auto mb-4 text-zinc-500" />
                <h3 className="text-white font-medium mb-2">Drop files here or click to upload</h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Supports Word (.docx), PDF, Text, RTF, Markdown, HTML, and code files
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
          ) : displayedSources.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {displayedSources.map((source) => {
                const FormatIcon = getFormatIcon(source.parsedMetadata?.format);
                const isEditing = editingId === source.id;
                return (
                  <Card 
                    key={source.id} 
                    className="bg-zinc-950 border border-zinc-800/50 hover:border-orange-500/50 transition-colors"
                    data-testid={`source-card-${source.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                            <FormatIcon className="w-5 h-5 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  className="h-7 text-sm bg-black/50 border-zinc-700"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') saveRename(source.id);
                                    if (e.key === 'Escape') cancelEditing();
                                  }}
                                  data-testid={`input-rename-${source.id}`}
                                />
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7" 
                                  onClick={() => saveRename(source.id)}
                                  data-testid={`button-save-rename-${source.id}`}
                                >
                                  <Check className="w-3 h-3 text-green-500" />
                                </Button>
                                <Button 
                                  size="icon" 
                                  variant="ghost" 
                                  className="h-7 w-7" 
                                  onClick={cancelEditing}
                                  data-testid={`button-cancel-rename-${source.id}`}
                                >
                                  <X className="w-3 h-3 text-red-500" />
                                </Button>
                              </div>
                            ) : (
                              <h4 className="text-white font-medium text-sm truncate">
                                {source.originalFilename}
                              </h4>
                            )}
                            <p className="text-xs text-zinc-500">
                              {source.wordCount?.toLocaleString() || 0} words
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] flex-shrink-0">
                          {source.parsedMetadata?.format || 'text'}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                        {source.parsedContent?.substring(0, 150)}...
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-zinc-700"
                          onClick={() => setViewingDoc(source)}
                          data-testid={`button-view-${source.id}`}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
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
                          onClick={() => startEditing(source)}
                          data-testid={`button-rename-${source.id}`}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Rename
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
              <p className="text-zinc-400">
                {searchResults ? "No documents found" : "No documents uploaded yet"}
              </p>
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
                {sources.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-8">
                    Upload documents first to merge them
                  </p>
                ) : (
                  sources.map((source) => (
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
                  ))
                )}
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
          ) : displayedSnippets.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-4">
              {displayedSnippets.map((snippet) => (
                <Card 
                  key={snippet.id} 
                  className="bg-zinc-950 border border-zinc-800/50"
                  data-testid={`snippet-card-${snippet.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <h4 className="text-white font-medium">{snippet.label}</h4>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0"
                          onClick={() => copyToClipboard(snippet.content)}
                          data-testid={`button-copy-snippet-${snippet.id}`}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 w-7 p-0 text-red-500"
                          onClick={() => deleteSnippet.mutate(snippet.id)}
                          data-testid={`button-delete-snippet-${snippet.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-3 mb-2">{snippet.content}</p>
                    {snippet.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {snippet.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[9px]">
                            <Tag className="w-2 h-2 mr-1" />
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
              <p className="text-zinc-400">
                {searchResults ? "No snippets found" : "No snippets saved yet"}
              </p>
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
                    <div className="flex items-start justify-between mb-4 gap-2">
                      <div>
                        <h3 className="text-xl font-serif text-white">{session.title}</h3>
                        <p className="text-sm text-zinc-500">
                          {session.sourceIds?.length || 0} documents merged • 
                          {session.mergedContent?.split(/\s+/).length || 0} words
                        </p>
                      </div>
                      <Badge className={session.status === 'draft' ? 'bg-zinc-700' : 'bg-green-600'}>
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 mb-4">
                      {session.mergedContent?.substring(0, 200)}...
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-zinc-700"
                        onClick={() => {
                          setViewingDoc({
                            id: session.id,
                            originalFilename: session.title,
                            mimeType: 'text/plain',
                            parsedContent: session.mergedContent || '',
                            parsedMetadata: { format: 'manuscript' },
                            wordCount: session.mergedContent?.split(/\s+/).length || 0,
                            status: session.status,
                            createdAt: session.createdAt,
                          });
                        }}
                        data-testid={`button-view-manuscript-${session.id}`}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-zinc-700"
                        onClick={() => copyToClipboard(session.mergedContent || '')}
                        data-testid={`button-copy-manuscript-${session.id}`}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-zinc-700"
                        onClick={() => exportMergedContent(session)}
                        data-testid={`button-export-manuscript-${session.id}`}
                      >
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

      <Dialog open={!!viewingDoc} onOpenChange={() => setViewingDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] bg-zinc-950 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <FileText className="w-5 h-5 text-orange-500" />
              {viewingDoc?.originalFilename}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-4 text-sm text-zinc-400 border-b border-zinc-800 pb-3">
            <span>{viewingDoc?.wordCount?.toLocaleString() || 0} words</span>
            <Badge variant="outline">{viewingDoc?.parsedMetadata?.format || 'text'}</Badge>
            <Button 
              size="sm" 
              variant="outline" 
              className="ml-auto border-zinc-700"
              onClick={() => viewingDoc && copyToClipboard(viewingDoc.parsedContent)}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy All
            </Button>
          </div>
          <ScrollArea className="h-[50vh] mt-4">
            <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
              {viewingDoc?.parsedContent}
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
