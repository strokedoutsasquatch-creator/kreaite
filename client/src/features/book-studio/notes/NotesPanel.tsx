import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  StickyNote,
  Plus,
  Check,
  Trash2,
  Search,
  Lightbulb,
  ListTodo,
  FileText,
  Edit3,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { bookStudioApi, ProjectNote } from "../api";

const noteTypes = [
  { value: "research", label: "Research", icon: Search, color: "bg-blue-500" },
  { value: "todo", label: "To-Do", icon: ListTodo, color: "bg-orange-500" },
  { value: "idea", label: "Idea", icon: Lightbulb, color: "bg-yellow-500" },
  { value: "revision", label: "Revision", icon: Edit3, color: "bg-purple-500" },
  { value: "general", label: "General", icon: FileText, color: "bg-gray-500" },
];

const priorities = [
  { value: "low", label: "Low", color: "text-gray-400" },
  { value: "normal", label: "Normal", color: "text-foreground" },
  { value: "high", label: "High", color: "text-primary" },
  { value: "urgent", label: "Urgent", color: "text-red-500" },
];

interface NotesPanelProps {
  projectId: number;
  chapterId?: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NotesPanel({ projectId, chapterId, isOpen, onClose }: NotesPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [newNote, setNewNote] = useState({ content: "", noteType: "general", priority: "normal" });
  const [expandedNotes, setExpandedNotes] = useState<Set<number>>(new Set());

  const { data: notes = [], isLoading } = useQuery<ProjectNote[]>({
    queryKey: ['/api/projects', projectId, 'notes', filterType, filterStatus],
    queryFn: async () => {
      const params: any = {};
      if (filterType !== "all") params.noteType = filterType;
      if (filterStatus !== "all") params.status = filterStatus;
      const res = await fetch(bookStudioApi.notes.list(projectId, params));
      return res.json();
    },
    enabled: !!projectId && isOpen,
  });

  const createMutation = useMutation({
    mutationFn: () => bookStudioApi.notes.create(projectId, {
      ...newNote,
      chapterId: chapterId || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'notes'] });
      setNewNote({ content: "", noteType: "general", priority: "normal" });
      setIsAdding(false);
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (noteId: number) => bookStudioApi.notes.resolve(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'notes'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (noteId: number) => bookStudioApi.notes.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'notes'] });
    },
  });

  const toggleExpand = (noteId: number) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  if (!isOpen) return null;

  const getNoteTypeInfo = (type: string) => noteTypes.find(t => t.value === type) || noteTypes[4];
  const getPriorityInfo = (priority: string) => priorities.find(p => p.value === priority) || priorities[1];

  const filteredNotes = notes.filter(note => {
    if (chapterId && note.chapterId !== chapterId) return false;
    return true;
  });

  return (
    <Card className="w-80 h-full bg-background border flex flex-col" data-testid="notes-panel">
      <CardHeader className="pb-2 border-b border">
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground flex items-center gap-2 text-sm">
            <StickyNote className="w-4 h-4 text-primary" />
            Notes {filteredNotes.length > 0 && `(${filteredNotes.length})`}
          </CardTitle>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="h-6 w-6"
            data-testid="button-close-notes"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 mt-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-7 text-xs bg-card border" data-testid="select-note-type-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {noteTypes.map(type => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 text-xs bg-card border" data-testid="select-note-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-2 space-y-2">
          {isAdding && (
            <Card className="bg-card border p-2" data-testid="card-new-note">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Select value={newNote.noteType} onValueChange={(v) => setNewNote({ ...newNote, noteType: v })}>
                    <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-new-note-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {noteTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newNote.priority} onValueChange={(v) => setNewNote({ ...newNote, priority: v })}>
                    <SelectTrigger className="h-7 text-xs flex-1" data-testid="select-new-note-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => (
                        <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  placeholder="Write your note..."
                  className="min-h-[80px] text-sm bg-card/80 border"
                  data-testid="textarea-new-note"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => createMutation.mutate()}
                    disabled={!newNote.content.trim() || createMutation.isPending}
                    className="flex-1 bg-orange-500 hover:bg-orange-600"
                    data-testid="button-save-note"
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsAdding(false)}
                    data-testid="button-cancel-note"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Loading notes...</div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs mt-1">Add notes for research, ideas, or revisions</p>
            </div>
          ) : (
            filteredNotes.map((note) => {
              const typeInfo = getNoteTypeInfo(note.noteType);
              const priorityInfo = getPriorityInfo(note.priority);
              const Icon = typeInfo.icon;
              const isExpanded = expandedNotes.has(note.id);
              const isResolved = note.status === 'resolved';

              return (
                <Card
                  key={note.id}
                  className={`bg-card/80 border p-2 ${isResolved ? 'opacity-60' : ''}`}
                  data-testid={`card-note-${note.id}`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center ${typeInfo.color}`}>
                      <Icon className="w-3 h-3 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {typeInfo.label}
                        </Badge>
                        <span className={`text-[10px] ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                        {isResolved && (
                          <Badge className="text-[10px] px-1 py-0 bg-green-500/20 text-green-400">
                            Resolved
                          </Badge>
                        )}
                      </div>
                      <p
                        className={`text-xs text-gray-300 ${isExpanded ? '' : 'line-clamp-2'} cursor-pointer`}
                        onClick={() => toggleExpand(note.id)}
                      >
                        {note.content}
                      </p>
                      {note.content.length > 100 && (
                        <button
                          onClick={() => toggleExpand(note.id)}
                          className="text-[10px] text-primary hover:text-primary mt-1 flex items-center gap-1"
                          data-testid={`button-expand-note-${note.id}`}
                        >
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'Less' : 'More'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {!isResolved && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5 hover:bg-green-500/20"
                          onClick={() => resolveMutation.mutate(note.id)}
                          data-testid={`button-resolve-note-${note.id}`}
                        >
                          <Check className="w-3 h-3 text-green-400" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 hover:bg-red-500/20"
                        onClick={() => deleteMutation.mutate(note.id)}
                        data-testid={`button-delete-note-${note.id}`}
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </CardContent>
      </ScrollArea>

      {!isAdding && (
        <div className="p-2 border-t border">
          <Button
            onClick={() => setIsAdding(true)}
            className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border"
            data-testid="button-add-note"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </div>
      )}
    </Card>
  );
}
