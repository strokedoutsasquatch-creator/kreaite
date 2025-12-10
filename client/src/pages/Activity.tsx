import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Image, Smile, 
  Video, Send, Trash2, Flag, Bookmark, Trophy, Target, 
  Zap, Flame, ThumbsUp, Sparkles, Users, Globe, Lock,
  Loader2, X, ChevronDown
} from "lucide-react";

const POST_TYPES = [
  { value: "update", label: "General Update", icon: MessageCircle },
  { value: "milestone", label: "Milestone", icon: Trophy },
  { value: "goal", label: "Goal Set", icon: Target },
  { value: "victory", label: "Victory", icon: Flame },
  { value: "question", label: "Question", icon: Sparkles },
];

const REACTIONS = [
  { type: "like", icon: ThumbsUp, label: "Like" },
  { type: "love", icon: Heart, label: "Love" },
  { type: "celebrate", icon: Sparkles, label: "Celebrate" },
  { type: "support", icon: Users, label: "Support" },
  { type: "fire", icon: Flame, label: "Fire" },
];

interface ActivityPost {
  id: number;
  authorId: string;
  content: string;
  postType: string;
  visibility: string;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  media?: any[];
  reactions?: { reactionType: string; count: number }[];
  comments?: any[];
}

export default function Activity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newPostContent, setNewPostContent] = useState("");
  const [postType, setPostType] = useState("update");
  const [visibility, setVisibility] = useState("public");
  const [showComments, setShowComments] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: posts, isLoading } = useQuery<ActivityPost[]>({
    queryKey: ["/api/activity"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: { content: string; postType: string; visibility: string }) => {
      return apiRequest("POST", "/api/activity", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      setNewPostContent("");
      setPostType("update");
      toast({ title: "Posted!", description: "Your update has been shared with the community." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not create post", variant: "destructive" });
    },
  });

  const reactMutation = useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: number; reactionType: string }) => {
      return apiRequest("POST", `/api/activity/${postId}/react`, { reactionType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: number; content: string }) => {
      return apiRequest("POST", `/api/activity/${postId}/comment`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      setCommentText("");
      toast({ title: "Comment added!" });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("DELETE", `/api/activity/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
      toast({ title: "Post deleted" });
    },
  });

  const handleCreatePost = () => {
    if (!newPostContent.trim()) return;
    createPostMutation.mutate({ content: newPostContent, postType, visibility });
  };

  const getPostTypeIcon = (type: string) => {
    const postTypeData = POST_TYPES.find(pt => pt.value === type);
    return postTypeData?.icon || MessageCircle;
  };

  const getPostTypeBadgeColor = (type: string) => {
    switch (type) {
      case "milestone": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "victory": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "goal": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "question": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-400">Please sign in to view the activity feed</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-activity-title">
            Activity Wall
          </h1>
          <p className="text-gray-400">
            Share your recovery journey and connect with fellow warriors
          </p>
        </div>

        <Card className="bg-gray-900 border-gray-800 p-6 mb-8">
          <div className="flex gap-4">
            <Avatar className="w-12 h-12 border border-orange-500">
              <AvatarImage src={user.profileImageUrl || undefined} />
              <AvatarFallback className="bg-gray-800">
                {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <Textarea
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                placeholder="Share your recovery win, set a goal, or ask the community..."
                className="bg-gray-800 border-gray-700 text-white resize-none min-h-[100px]"
                data-testid="input-new-post"
              />
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Select value={postType} onValueChange={setPostType}>
                    <SelectTrigger className="w-40 bg-gray-800 border-gray-700 text-white" data-testid="select-post-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="w-4 h-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={visibility} onValueChange={setVisibility}>
                    <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white" data-testid="select-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="pod">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Pod Only
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4" />
                          Private
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-add-image">
                    <Image className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-add-gif">
                    <Smile className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" data-testid="button-add-video">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim() || createPostMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-post"
                  >
                    {createPostMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-gray-900 border border-gray-800">
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-all"
            >
              All Posts
            </TabsTrigger>
            <TabsTrigger 
              value="victories"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-victories"
            >
              Victories
            </TabsTrigger>
            <TabsTrigger 
              value="milestones"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-milestones"
            >
              Milestones
            </TabsTrigger>
            <TabsTrigger 
              value="questions"
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-questions"
            >
              Questions
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-6">
            {posts
              .filter(post => {
                if (activeTab === "all") return true;
                if (activeTab === "victories") return post.postType === "victory";
                if (activeTab === "milestones") return post.postType === "milestone";
                if (activeTab === "questions") return post.postType === "question";
                return true;
              })
              .map((post) => {
                const PostTypeIcon = getPostTypeIcon(post.postType);
                return (
                  <Card 
                    key={post.id} 
                    className="bg-gray-900 border-gray-800 p-6"
                    data-testid={`card-post-${post.id}`}
                  >
                    <div className="flex gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gray-800 text-orange-500">
                          U
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">Warrior</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getPostTypeBadgeColor(post.postType)}`}
                            >
                              <PostTypeIcon className="w-3 h-3 mr-1" />
                              {POST_TYPES.find(t => t.value === post.postType)?.label || "Update"}
                            </Badge>
                            <span className="text-gray-500 text-sm">
                              {format(new Date(post.createdAt), "MMM d, h:mm a")}
                            </span>
                            {post.visibility === "pod" && (
                              <Badge variant="outline" className="text-xs text-gray-400 border-gray-600">
                                <Users className="w-3 h-3 mr-1" />
                                Pod
                              </Badge>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" data-testid={`button-post-menu-${post.id}`}>
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Bookmark className="w-4 h-4 mr-2" />
                                Save
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share
                              </DropdownMenuItem>
                              {post.authorId === user.id && (
                                <DropdownMenuItem 
                                  className="text-red-400"
                                  onClick={() => deletePostMutation.mutate(post.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="text-red-400">
                                <Flag className="w-4 h-4 mr-2" />
                                Report
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <p className="text-gray-300 mb-4 whitespace-pre-wrap">{post.content}</p>
                        
                        <div className="flex items-center gap-4 pt-3 border-t border-gray-800">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-400 hover:text-orange-400 gap-2"
                                data-testid={`button-react-${post.id}`}
                              >
                                <Heart className="w-4 h-4" />
                                {post.likeCount > 0 && post.likeCount}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {REACTIONS.map((reaction) => (
                                <DropdownMenuItem 
                                  key={reaction.type}
                                  onClick={() => reactMutation.mutate({ postId: post.id, reactionType: reaction.type })}
                                >
                                  <reaction.icon className="w-4 h-4 mr-2" />
                                  {reaction.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-blue-400 gap-2"
                            onClick={() => setShowComments(showComments === post.id ? null : post.id)}
                            data-testid={`button-comment-${post.id}`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            {post.commentCount > 0 && post.commentCount}
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-green-400 gap-2"
                            data-testid={`button-share-${post.id}`}
                          >
                            <Share2 className="w-4 h-4" />
                            Share
                          </Button>
                        </div>

                        {showComments === post.id && (
                          <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                            <div className="flex gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarImage src={user.profileImageUrl || undefined} />
                                <AvatarFallback className="bg-gray-800 text-sm">
                                  {user.firstName?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 flex gap-2">
                                <Textarea
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  placeholder="Write a comment..."
                                  className="bg-gray-800 border-gray-700 text-white resize-none min-h-[60px]"
                                  data-testid={`input-comment-${post.id}`}
                                />
                                <Button
                                  size="icon"
                                  onClick={() => commentMutation.mutate({ postId: post.id, content: commentText })}
                                  disabled={!commentText.trim() || commentMutation.isPending}
                                  className="bg-orange-500 hover:bg-orange-600"
                                  data-testid={`button-submit-comment-${post.id}`}
                                >
                                  {commentMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                            
                            {post.comments && post.comments.length > 0 && (
                              <div className="space-y-3">
                                {post.comments.map((comment: any) => (
                                  <div key={comment.id} className="flex gap-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="bg-gray-800 text-sm">U</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 bg-gray-800 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-white text-sm">Warrior</span>
                                        <span className="text-gray-500 text-xs">
                                          {format(new Date(comment.createdAt), "MMM d, h:mm a")}
                                        </span>
                                      </div>
                                      <p className="text-gray-300 text-sm">{comment.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center">
            <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No posts yet</h3>
            <p className="text-gray-400 mb-6">
              Be the first to share your recovery journey with the community!
            </p>
            <Button 
              className="bg-orange-500 hover:bg-orange-600"
              onClick={() => document.querySelector<HTMLTextAreaElement>('[data-testid="input-new-post"]')?.focus()}
              data-testid="button-first-post"
            >
              Share Your First Post
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
