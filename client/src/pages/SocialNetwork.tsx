import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Users, UserPlus, UserCheck, UserX, Search, MapPin, Calendar,
  Heart, MessageCircle, Share2, MoreHorizontal, Flame, Trophy,
  Video, Image as ImageIcon, Send, ExternalLink, Loader2, Check
} from "lucide-react";
import { SiFacebook, SiX, SiLinkedin, SiInstagram } from "react-icons/si";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl: string;
  profile?: {
    bio: string;
    location: string;
    strokeDate: string;
    strokeType: string;
    recoveryGoals: string[];
  };
  settings?: {
    username: string;
    displayName: string;
    avatarUrl: string;
    bannerUrl: string;
  };
  stats?: {
    followers: number;
    following: number;
    posts: number;
    streak: number;
    recoveryScore: number;
  };
  isFollowing?: boolean;
}

interface Post {
  id: number;
  authorId: string;
  content: string;
  postType: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  createdAt: string;
  author?: UserProfile;
  media?: { mediaType: string; mediaUrl: string }[];
  hasLiked?: boolean;
}

export default function SocialNetwork() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const { data: feed, isLoading: feedLoading } = useQuery<Post[]>({
    queryKey: ["/api/social/feed"],
    queryFn: async () => {
      const res = await fetch("/api/activity");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: suggestedUsers } = useQuery<UserProfile[]>({
    queryKey: ["/api/social/suggested"],
    queryFn: async () => {
      const res = await fetch("/api/users/search");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: followers } = useQuery<UserProfile[]>({
    queryKey: ["/api/social/followers"],
    queryFn: async () => {
      const res = await fetch("/api/social/followers");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: following } = useQuery<UserProfile[]>({
    queryKey: ["/api/social/following"],
    queryFn: async () => {
      const res = await fetch("/api/social/following");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("POST", `/api/social/follow/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/suggested"] });
      queryClient.invalidateQueries({ queryKey: ["/api/social/following"] });
      toast({ title: "Followed!" });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/social/follow/${userId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/following"] });
      toast({ title: "Unfollowed" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest("POST", "/api/activity", { content, postType: "update", visibility: "public" });
    },
    onSuccess: () => {
      setNewPostContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/feed"] });
      toast({ title: "Posted!" });
    },
  });

  const likePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("POST", `/api/activity/${postId}/react`, { reactionType: "like" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/social/feed"] });
    },
  });

  const shareToSocial = (platform: string) => {
    if (!selectedPost) return;
    const text = encodeURIComponent(selectedPost.content);
    const url = encodeURIComponent(`https://strokerecoveryacademy.com/post/${selectedPost.id}`);
    
    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${text}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, "_blank", "width=600,height=400");
      toast({ title: `Shared to ${platform}!` });
    }
    setShareDialogOpen(false);
  };

  const formatTimeAgo = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-social-title">
              Recovery Network
            </h1>
            <p className="text-gray-400 mt-1">
              Connect with fellow stroke survivors
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="bg-gray-700 text-primary">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Share your recovery journey..."
                      className="bg-gray-800 border-gray-700 min-h-[100px]"
                      data-testid="input-new-post"
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Photo
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Video className="w-4 h-4 mr-2" />
                          Video
                        </Button>
                      </div>
                      <Button
                        onClick={() => createPostMutation.mutate(newPostContent)}
                        disabled={!newPostContent.trim() || createPostMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                        data-testid="button-post"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-gray-900">
                <TabsTrigger value="feed" data-testid="tab-feed">Feed</TabsTrigger>
                <TabsTrigger value="followers" data-testid="tab-followers">
                  Followers ({followers?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="following" data-testid="tab-following">
                  Following ({following?.length || 0})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="feed" className="mt-6 space-y-4">
                {feedLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </div>
                ) : feed && feed.length > 0 ? (
                  feed.map((post) => (
                    <Card key={post.id} className="bg-gray-900 border-gray-800" data-testid={`post-${post.id}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={post.author?.profileImageUrl} />
                            <AvatarFallback className="bg-gray-700 text-primary">
                              {post.author?.firstName?.[0]}{post.author?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">
                                  {post.author?.firstName} {post.author?.lastName}
                                </p>
                                <p className="text-gray-500 text-sm">{formatTimeAgo(post.createdAt)}</p>
                              </div>
                              <Button size="icon" variant="ghost">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </div>
                            <p className="text-white mt-3">{post.content}</p>
                            {post.media && post.media.length > 0 && (
                              <div className="mt-4 rounded-xl overflow-hidden">
                                {post.media[0].mediaType === "video" ? (
                                  <video src={post.media[0].mediaUrl} controls className="w-full" />
                                ) : (
                                  <img src={post.media[0].mediaUrl} alt="" className="w-full" />
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-6 mt-4">
                              <button
                                onClick={() => likePostMutation.mutate(post.id)}
                                className={`flex items-center gap-2 ${post.hasLiked ? "text-red-500" : "text-gray-400"} hover:text-red-500 transition-colors`}
                              >
                                <Heart className={`w-5 h-5 ${post.hasLiked ? "fill-current" : ""}`} />
                                <span>{post.likeCount}</span>
                              </button>
                              <button className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.commentCount}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedPost(post);
                                  setShareDialogOpen(true);
                                }}
                                className="flex items-center gap-2 text-gray-400 hover:text-primary transition-colors"
                              >
                                <Share2 className="w-5 h-5" />
                                <span>{post.shareCount}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">No posts yet</p>
                    <p className="text-gray-500">Follow people to see their updates here</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="followers" className="mt-6 space-y-4">
                {followers && followers.length > 0 ? (
                  followers.map((follower) => (
                    <Card key={follower.id} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={follower.profileImageUrl} />
                              <AvatarFallback className="bg-gray-700 text-primary">
                                {follower.firstName?.[0]}{follower.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium">
                                {follower.firstName} {follower.lastName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                @{follower.settings?.username || "user"}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => followMutation.mutate(follower.id)}
                            variant="outline"
                            size="sm"
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Follow Back
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No followers yet</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="following" className="mt-6 space-y-4">
                {following && following.length > 0 ? (
                  following.map((followed) => (
                    <Card key={followed.id} className="bg-gray-900 border-gray-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={followed.profileImageUrl} />
                              <AvatarFallback className="bg-gray-700 text-primary">
                                {followed.firstName?.[0]}{followed.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium">
                                {followed.firstName} {followed.lastName}
                              </p>
                              <p className="text-gray-400 text-sm">
                                @{followed.settings?.username || "user"}
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => unfollowMutation.mutate(followed.id)}
                            variant="outline"
                            size="sm"
                            className="text-red-400 border-red-400/50 hover:bg-red-500/10"
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Unfollow
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">Not following anyone yet</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Find Survivors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name..."
                  className="bg-gray-800 border-gray-700 mb-4"
                  data-testid="input-search-users"
                />
                <div className="space-y-3">
                  {suggestedUsers?.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={u.profileImageUrl} />
                          <AvatarFallback className="bg-gray-700 text-primary">
                            {u.firstName?.[0]}{u.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white text-sm font-medium">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {u.stats?.followers || 0} followers
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={u.isFollowing ? "outline" : "default"}
                        onClick={() => {
                          if (u.isFollowing) {
                            unfollowMutation.mutate(u.id);
                          } else {
                            followMutation.mutate(u.id);
                          }
                        }}
                        className={u.isFollowing ? "" : "bg-primary hover:bg-primary/90"}
                      >
                        {u.isFollowing ? (
                          <>
                            <Check className="w-3 h-3 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Top Recoverers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((rank) => (
                    <div key={rank} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        rank === 1 ? "bg-yellow-500/20 text-yellow-500" :
                        rank === 2 ? "bg-gray-400/20 text-gray-400" :
                        "bg-orange-500/20 text-orange-500"
                      }`}>
                        {rank}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gray-700 text-primary">
                          U{rank}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">Top Survivor {rank}</p>
                        <div className="flex items-center gap-1 text-primary text-xs">
                          <Flame className="w-3 h-3" />
                          {100 - rank * 10} day streak
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Share to Social Media</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <Button
                onClick={() => shareToSocial("facebook")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <SiFacebook className="w-5 h-5 mr-2" />
                Facebook
              </Button>
              <Button
                onClick={() => shareToSocial("twitter")}
                className="bg-sky-500 hover:bg-sky-600"
              >
                <SiX className="w-5 h-5 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={() => shareToSocial("linkedin")}
                className="bg-blue-700 hover:bg-blue-800"
              >
                <SiLinkedin className="w-5 h-5 mr-2" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`https://strokerecoveryacademy.com/post/${selectedPost?.id}`);
                  toast({ title: "Link copied!" });
                  setShareDialogOpen(false);
                }}
              >
                <ExternalLink className="w-5 h-5 mr-2" />
                Copy Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
