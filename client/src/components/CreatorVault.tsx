import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Search, 
  Folder, 
  FolderOpen, 
  ChevronRight, 
  ChevronDown,
  FileText, 
  Music, 
  Film, 
  Lightbulb, 
  BookOpen,
  Sparkles,
  Pencil,
  Trash2,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import type { VaultEntry, VaultFolder } from '@shared/schema';

const CATEGORIES = [
  { value: 'all', label: 'All', icon: FileText },
  { value: 'lyric', label: 'Lyric', icon: Music },
  { value: 'manuscript', label: 'Manuscript', icon: BookOpen },
  { value: 'doctrine', label: 'Doctrine', icon: FileText },
  { value: 'idea', label: 'Idea', icon: Lightbulb },
  { value: 'research', label: 'Research', icon: Search },
  { value: 'beat', label: 'Beat', icon: Music },
  { value: 'melody', label: 'Melody', icon: Music },
  { value: 'screenplay', label: 'Screenplay', icon: Film },
  { value: 'jingle', label: 'Jingle', icon: Music },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  lyric: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  manuscript: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  doctrine: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  idea: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  research: 'bg-green-500/20 text-green-300 border-green-500/30',
  beat: 'bg-red-500/20 text-red-300 border-red-500/30',
  melody: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
  screenplay: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
  jingle: 'bg-primary/20 text-orange-300 border',
};

interface FolderNodeProps {
  folder: VaultFolder;
  folders: VaultFolder[];
  selectedFolderId: number | null;
  onSelect: (id: number | null) => void;
  level?: number;
}

function FolderNode({ folder, folders, selectedFolderId, onSelect, level = 0 }: FolderNodeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const children = folders.filter(f => f.parentId === folder.id);
  const hasChildren = children.length > 0;
  const isSelected = selectedFolderId === folder.id;

  return (
    <div style={{ paddingLeft: `${level * 12}px` }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div 
          className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover-elevate transition-colors ${
            isSelected ? 'bg-primary/20 text-primary' : 'text-foreground/80'
          }`}
          onClick={() => onSelect(isSelected ? null : folder.id)}
          data-testid={`folder-item-${folder.id}`}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button size="icon" variant="ghost" className="h-5 w-5 p-0" data-testid={`folder-toggle-${folder.id}`}>
                {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <span className="w-5" />
          )}
          {isOpen ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4" />}
          <span className="text-sm truncate flex-1">{folder.name}</span>
        </div>
        {hasChildren && (
          <CollapsibleContent>
            {children.map(child => (
              <FolderNode 
                key={child.id} 
                folder={child} 
                folders={folders}
                selectedFolderId={selectedFolderId}
                onSelect={onSelect}
                level={level + 1}
              />
            ))}
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

interface EntryCardProps {
  entry: VaultEntry;
  onClick: () => void;
}

function EntryCard({ entry, onClick }: EntryCardProps) {
  const categoryColor = CATEGORY_COLORS[entry.category] || 'bg-gray-500/20 text-gray-300 border-gray-500/30';
  
  return (
    <Card 
      className="hover-elevate cursor-pointer transition-all border-border/50"
      onClick={onClick}
      data-testid={`vault-entry-card-${entry.id}`}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium line-clamp-2">{entry.title}</CardTitle>
          <Badge variant="outline" className={`shrink-0 text-xs ${categoryColor}`}>
            {entry.category}
          </Badge>
        </div>
        {entry.summary && (
          <CardDescription className="line-clamp-2 text-sm">
            {entry.summary}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.tags.slice(0, 3).map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {entry.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{entry.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EntrySkeleton() {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-14" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CreatorVault() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFolderSidebar, setShowFolderSidebar] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [newEntry, setNewEntry] = useState({
    category: 'idea',
    title: '',
    content: '',
    tags: '',
  });

  const [editedEntry, setEditedEntry] = useState({
    title: '',
    content: '',
    summary: '',
    tags: '',
  });

  const entriesQuery = useQuery<VaultEntry[]>({
    queryKey: ['/api/vault/entries', { category: selectedCategory !== 'all' ? selectedCategory : undefined }],
  });

  const foldersQuery = useQuery<VaultFolder[]>({
    queryKey: ['/api/vault/folders'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: { category: string; title: string; content: string; tags: string[] }) => {
      const res = await apiRequest('POST', '/api/vault/entries', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vault/entries'] });
      setCreateDialogOpen(false);
      setNewEntry({ category: 'idea', title: '', content: '', tags: '' });
      toast({ title: 'Entry created', description: 'Your vault entry has been saved.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { title?: string; content?: string; summary?: string; tags?: string[] } }) => {
      const res = await apiRequest('PATCH', `/api/vault/entries/${id}`, data);
      return res.json();
    },
    onSuccess: (updatedEntry) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vault/entries'] });
      setSelectedEntry(updatedEntry);
      setIsEditing(false);
      toast({ title: 'Entry updated', description: 'Your changes have been saved.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/vault/entries/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vault/entries'] });
      setDetailDialogOpen(false);
      setSelectedEntry(null);
      toast({ title: 'Entry deleted', description: 'The vault entry has been removed.' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const filteredEntries = useMemo(() => {
    if (!entriesQuery.data) return [];
    let entries = entriesQuery.data;
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e => 
        e.title.toLowerCase().includes(query) || 
        e.content?.toLowerCase().includes(query) ||
        e.summary?.toLowerCase().includes(query)
      );
    }
    
    return entries;
  }, [entriesQuery.data, searchQuery]);

  const rootFolders = useMemo(() => {
    if (!foldersQuery.data) return [];
    return foldersQuery.data.filter(f => !f.parentId);
  }, [foldersQuery.data]);

  const handleCreateEntry = () => {
    if (!newEntry.title.trim()) {
      toast({ title: 'Title required', description: 'Please enter a title for your entry.', variant: 'destructive' });
      return;
    }
    const tags = newEntry.tags.split(',').map(t => t.trim()).filter(Boolean);
    createMutation.mutate({
      category: newEntry.category,
      title: newEntry.title,
      content: newEntry.content,
      tags,
    });
  };

  const handleUpdateEntry = () => {
    if (!selectedEntry) return;
    const tags = editedEntry.tags.split(',').map(t => t.trim()).filter(Boolean);
    updateMutation.mutate({
      id: selectedEntry.id,
      data: {
        title: editedEntry.title,
        content: editedEntry.content,
        summary: editedEntry.summary,
        tags,
      },
    });
  };

  const openEntryDetail = (entry: VaultEntry) => {
    setSelectedEntry(entry);
    setEditedEntry({
      title: entry.title,
      content: entry.content || '',
      summary: entry.summary || '',
      tags: entry.tags?.join(', ') || '',
    });
    setIsEditing(false);
    setDetailDialogOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-background" data-testid="creator-vault">
      <div className="border-b border-border p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Creator Vault</h1>
            <p className="text-sm text-muted-foreground">Store and organize your creative ideas</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-vault"
              />
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-entry">
                  <Plus className="h-4 w-4 mr-2" />
                  New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Create New Entry</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newEntry.category} onValueChange={(v) => setNewEntry(prev => ({ ...prev, category: v }))}>
                      <SelectTrigger data-testid="select-new-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.filter(c => c.value !== 'all').map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newEntry.title}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter title..."
                      data-testid="input-new-title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newEntry.content}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your content..."
                      rows={6}
                      data-testid="textarea-new-content"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                      id="tags"
                      value={newEntry.tags}
                      onChange={(e) => setNewEntry(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="inspiration, draft, wip"
                      data-testid="input-new-tags"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)} data-testid="button-cancel-create">
                    Cancel
                  </Button>
                  <Button onClick={handleCreateEntry} disabled={createMutation.isPending} data-testid="button-submit-create">
                    {createMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                    Create Entry
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mt-4">
          <ScrollArea className="w-full" type="scroll">
            <TabsList className="inline-flex w-max bg-muted/50" data-testid="tabs-category">
              {CATEGORIES.map(cat => (
                <TabsTrigger 
                  key={cat.value} 
                  value={cat.value}
                  className="gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid={`tab-category-${cat.value}`}
                >
                  <cat.icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>
        </Tabs>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <Collapsible open={showFolderSidebar} onOpenChange={setShowFolderSidebar} className="hidden md:block">
          <div className={`border-r border-border bg-card/50 transition-all ${showFolderSidebar ? 'w-56' : 'w-0'} overflow-hidden`}>
            <div className="p-3 border-b border-border flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Folders</span>
              <CollapsibleTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7" data-testid="button-toggle-folders">
                  <X className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <ScrollArea className="h-[calc(100%-49px)]">
              <div className="p-2">
                <div 
                  className={`flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover-elevate transition-colors ${
                    selectedFolderId === null ? 'bg-primary/20 text-primary' : 'text-foreground/80'
                  }`}
                  onClick={() => setSelectedFolderId(null)}
                  data-testid="folder-item-all"
                >
                  <Folder className="h-4 w-4" />
                  <span className="text-sm">All Entries</span>
                </div>
                {foldersQuery.isLoading ? (
                  <div className="space-y-2 mt-2">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-6 w-full" />)}
                  </div>
                ) : (
                  rootFolders.map(folder => (
                    <FolderNode 
                      key={folder.id} 
                      folder={folder} 
                      folders={foldersQuery.data || []}
                      selectedFolderId={selectedFolderId}
                      onSelect={setSelectedFolderId}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </Collapsible>

        {!showFolderSidebar && (
          <Button 
            size="icon" 
            variant="ghost" 
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-6 rounded-l-none"
            onClick={() => setShowFolderSidebar(true)}
            data-testid="button-show-folders"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}

        <ScrollArea className="flex-1">
          <div className="p-4">
            {entriesQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => <EntrySkeleton key={i} />)}
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">No entries found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchQuery ? 'Try a different search term' : 'Create your first vault entry to get started'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setCreateDialogOpen(true)} data-testid="button-empty-create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Entry
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredEntries.map(entry => (
                  <EntryCard key={entry.id} entry={entry} onClick={() => openEntryDetail(entry)} />
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              {isEditing ? (
                <Input
                  value={editedEntry.title}
                  onChange={(e) => setEditedEntry(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-semibold"
                  data-testid="input-edit-title"
                />
              ) : (
                <DialogTitle className="text-xl">{selectedEntry?.title}</DialogTitle>
              )}
              {selectedEntry && (
                <Badge variant="outline" className={CATEGORY_COLORS[selectedEntry.category] || ''}>
                  {selectedEntry.category}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {isEditing ? (
                <>
                  <div className="space-y-2">
                    <Label>Summary</Label>
                    <Textarea
                      value={editedEntry.summary}
                      onChange={(e) => setEditedEntry(prev => ({ ...prev, summary: e.target.value }))}
                      placeholder="Brief summary..."
                      rows={2}
                      data-testid="textarea-edit-summary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={editedEntry.content}
                      onChange={(e) => setEditedEntry(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Full content..."
                      rows={10}
                      data-testid="textarea-edit-content"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={editedEntry.tags}
                      onChange={(e) => setEditedEntry(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="tag1, tag2, tag3"
                      data-testid="input-edit-tags"
                    />
                  </div>
                </>
              ) : (
                <>
                  {selectedEntry?.summary && (
                    <div>
                      <Label className="text-muted-foreground">Summary</Label>
                      <p className="text-sm mt-1">{selectedEntry.summary}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-muted-foreground">Content</Label>
                    <div className="mt-1 p-3 rounded-md bg-muted/30 whitespace-pre-wrap text-sm">
                      {selectedEntry?.content || 'No content'}
                    </div>
                  </div>
                  {selectedEntry?.tags && selectedEntry.tags.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Tags</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEntry.tags.map((tag, idx) => (
                          <Badge key={idx} variant="secondary">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <div className="flex items-center justify-between w-full gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => toast({ title: 'AI Suggestions', description: 'AI suggestions feature coming soon!' })}
                data-testid="button-ai-suggestions"
              >
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </Button>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)} data-testid="button-cancel-edit">
                      Cancel
                    </Button>
                    <Button onClick={handleUpdateEntry} disabled={updateMutation.isPending} data-testid="button-save-edit">
                      {updateMutation.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      variant="destructive" 
                      size="icon"
                      onClick={() => selectedEntry && deleteMutation.mutate(selectedEntry.id)}
                      disabled={deleteMutation.isPending}
                      data-testid="button-delete-entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="button-edit-entry">
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
