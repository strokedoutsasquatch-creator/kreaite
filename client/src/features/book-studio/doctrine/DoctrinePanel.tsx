import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Network,
  Plus,
  Trash2,
  ChevronRight,
  ChevronDown,
  Edit3,
  Check,
  X,
  GripVertical,
  FileText,
  BookOpen,
  Lightbulb,
  Target,
  Link2,
} from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { bookStudioApi, DoctrineOutline, DoctrineNode } from "../api";

const nodeTypes = [
  { value: "theme", label: "Theme", icon: Target, color: "bg-purple-500" },
  { value: "topic", label: "Topic", icon: FileText, color: "bg-blue-500" },
  { value: "concept", label: "Concept", icon: Lightbulb, color: "bg-yellow-500" },
  { value: "chapter", label: "Chapter", icon: BookOpen, color: "bg-green-500" },
  { value: "reference", label: "Reference", icon: Link2, color: "bg-gray-500" },
];

interface DoctrinePanelProps {
  projectId: number;
  chapters?: Array<{ id: number; title: string }>;
  isOpen: boolean;
  onClose: () => void;
  onLinkToChapter?: (nodeId: number, chapterId: number) => void;
}

export function DoctrinePanel({
  projectId,
  chapters = [],
  isOpen,
  onClose,
  onLinkToChapter,
}: DoctrinePanelProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());
  const [editingNode, setEditingNode] = useState<number | null>(null);
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNode, setNewNode] = useState({ title: "", content: "", nodeType: "topic", parentId: null as number | null });

  const { data: doctrine, isLoading } = useQuery<DoctrineOutline | null>({
    queryKey: ['/api/projects', projectId, 'doctrine'],
    queryFn: async () => {
      const res = await fetch(bookStudioApi.doctrine.get(projectId));
      return res.json();
    },
    enabled: !!projectId && isOpen,
  });

  const createDoctrineMutation = useMutation({
    mutationFn: () => bookStudioApi.doctrine.create(projectId, { title: "Book Outline" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'doctrine'] });
    },
  });

  const toggleDoctrineMutation = useMutation({
    mutationFn: async (isEnabled: boolean) => {
      if (!doctrine) return;
      await bookStudioApi.doctrine.update(doctrine.id, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'doctrine'] });
    },
  });

  const createNodeMutation = useMutation({
    mutationFn: () => {
      if (!doctrine) return Promise.reject("No doctrine");
      return bookStudioApi.doctrine.createNode(doctrine.id, {
        ...newNode,
        order: doctrine.nodes?.length || 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'doctrine'] });
      setIsAddingNode(false);
      setNewNode({ title: "", content: "", nodeType: "topic", parentId: null });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: (nodeId: number) => bookStudioApi.doctrine.deleteNode(nodeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId, 'doctrine'] });
    },
  });

  const toggleExpand = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getNodeTypeInfo = (type: string) => nodeTypes.find((t) => t.value === type) || nodeTypes[1];

  const renderNode = (node: DoctrineNode, depth: number = 0) => {
    const typeInfo = getNodeTypeInfo(node.nodeType);
    const Icon = typeInfo.icon;
    const isExpanded = expandedNodes.has(node.id);
    const childNodes = doctrine?.nodes?.filter((n) => n.parentId === node.id) || [];
    const hasChildren = childNodes.length > 0;
    const linkedChapter = chapters.find((c) => c.id === node.chapterId);

    return (
      <div key={node.id} className="select-none" data-testid={`doctrine-node-${node.id}`}>
        <div
          className={`flex items-center gap-1 p-1.5 rounded hover:bg-orange-500/10 group`}
          style={{ paddingLeft: `${depth * 16 + 4}px` }}
        >
          <button
            onClick={() => hasChildren && toggleExpand(node.id)}
            className="w-4 h-4 flex items-center justify-center"
            data-testid={`button-toggle-node-${node.id}`}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="w-3 h-3 text-gray-400" />
              ) : (
                <ChevronRight className="w-3 h-3 text-gray-400" />
              )
            ) : (
              <div className="w-1 h-1 rounded-full bg-gray-600" />
            )}
          </button>

          <div className={`w-5 h-5 rounded flex items-center justify-center ${typeInfo.color}`}>
            <Icon className="w-3 h-3 text-white" />
          </div>

          <span className="text-xs text-white flex-1 truncate">{node.title}</span>

          {linkedChapter && (
            <Badge variant="outline" className="text-[9px] px-1 py-0">
              Ch: {linkedChapter.title.substring(0, 10)}
            </Badge>
          )}

          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => {
                setNewNode({ ...newNode, parentId: node.id });
                setIsAddingNode(true);
              }}
              data-testid={`button-add-child-${node.id}`}
            >
              <Plus className="w-3 h-3 text-gray-400" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5 hover:bg-red-500/20"
              onClick={() => deleteNodeMutation.mutate(node.id)}
              data-testid={`button-delete-node-${node.id}`}
            >
              <Trash2 className="w-3 h-3 text-red-400" />
            </Button>
          </div>
        </div>

        {node.content && isExpanded && (
          <p
            className="text-[10px] text-gray-500 mt-0.5 mb-1"
            style={{ paddingLeft: `${depth * 16 + 28}px` }}
          >
            {node.content}
          </p>
        )}

        {isExpanded && childNodes.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  if (!isOpen) return null;

  const rootNodes = doctrine?.nodes?.filter((n) => !n.parentId) || [];

  return (
    <Card className="w-80 h-full bg-black border-orange-500/20 flex flex-col" data-testid="doctrine-panel">
      <CardHeader className="pb-2 border-b border-orange-500/20">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2 text-sm">
            <Network className="w-4 h-4 text-orange-500" />
            Doctrine Outliner
          </CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6" data-testid="button-close-doctrine">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {doctrine && (
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-gray-400">Enable outline view</span>
            <Switch
              checked={doctrine.isEnabled}
              onCheckedChange={(checked) => toggleDoctrineMutation.mutate(checked)}
              data-testid="switch-doctrine-enabled"
            />
          </div>
        )}
      </CardHeader>

      <ScrollArea className="flex-1">
        <CardContent className="p-2">
          {isLoading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Loading...</div>
          ) : !doctrine ? (
            <div className="text-center py-8">
              <Network className="w-10 h-10 mx-auto mb-3 text-orange-500/30" />
              <p className="text-sm text-gray-400 mb-3">No outline yet</p>
              <p className="text-xs text-gray-500 mb-4">
                Create a structured outline to organize themes, topics, and chapters
              </p>
              <Button
                onClick={() => createDoctrineMutation.mutate()}
                disabled={createDoctrineMutation.isPending}
                className="bg-orange-500 hover:bg-orange-600"
                data-testid="button-create-doctrine"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Outline
              </Button>
            </div>
          ) : !doctrine.isEnabled ? (
            <div className="text-center py-8">
              <Network className="w-10 h-10 mx-auto mb-3 text-gray-600" />
              <p className="text-sm text-gray-400">Outline disabled</p>
              <p className="text-xs text-gray-500 mt-1">Toggle the switch above to enable</p>
            </div>
          ) : (
            <div className="space-y-1">
              {rootNodes.length === 0 && !isAddingNode ? (
                <div className="text-center py-4">
                  <p className="text-xs text-gray-500">No nodes yet. Add your first topic.</p>
                </div>
              ) : (
                rootNodes.map((node) => renderNode(node))
              )}

              {isAddingNode && (
                <Card className="bg-black/50 border-orange-500/30 p-2 mt-2" data-testid="card-add-node">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={newNode.nodeType}
                        onChange={(e) => setNewNode({ ...newNode, nodeType: e.target.value })}
                        className="h-7 text-xs bg-black/50 border border-orange-500/30 rounded px-2 text-white"
                        data-testid="select-node-type"
                      >
                        {nodeTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      {newNode.parentId && (
                        <Badge variant="outline" className="text-[10px]">
                          Child node
                        </Badge>
                      )}
                    </div>
                    <Input
                      value={newNode.title}
                      onChange={(e) => setNewNode({ ...newNode, title: e.target.value })}
                      placeholder="Node title"
                      className="h-7 text-xs bg-black/30 border-orange-500/20"
                      data-testid="input-node-title"
                    />
                    <Textarea
                      value={newNode.content}
                      onChange={(e) => setNewNode({ ...newNode, content: e.target.value })}
                      placeholder="Description (optional)"
                      className="min-h-[50px] text-xs bg-black/30 border-orange-500/20"
                      data-testid="textarea-node-content"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => createNodeMutation.mutate()}
                        disabled={!newNode.title.trim() || createNodeMutation.isPending}
                        className="flex-1 bg-orange-500 hover:bg-orange-600"
                        data-testid="button-save-node"
                      >
                        Add
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsAddingNode(false);
                          setNewNode({ title: "", content: "", nodeType: "topic", parentId: null });
                        }}
                        data-testid="button-cancel-node"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </ScrollArea>

      {doctrine?.isEnabled && !isAddingNode && (
        <div className="p-2 border-t border-orange-500/20">
          <Button
            onClick={() => setIsAddingNode(true)}
            className="w-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/30"
            data-testid="button-add-node"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Node
          </Button>
        </div>
      )}
    </Card>
  );
}
