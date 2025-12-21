import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Save, 
  Send, 
  ArrowLeft, 
  Image as ImageIcon,
  Tag,
  Eye,
  Clock,
  X
} from "lucide-react";
import type { BlogPost } from "@shared/schema";

export default function StoryEditor() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id?: string }>();
  const { toast } = useToast();
  const isEditing = !!params.id;

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  const { data: existingPost, isLoading: postLoading } = useQuery<BlogPost>({
    queryKey: ['/api/blog', params.id],
    enabled: isEditing
  });

  useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title);
      setExcerpt(existingPost.excerpt || "");
      setContent(existingPost.content);
      setHeroImageUrl(existingPost.heroImageUrl || "");
      setTags(existingPost.tags || []);
    }
  }, [existingPost]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/blog', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/me'] });
      toast({
        title: "Story saved!",
        description: "Your draft has been saved successfully."
      });
      setLocation(`/stories/my`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your story. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('PATCH', `/api/blog/${params.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/me'] });
      toast({
        title: "Story updated!",
        description: "Your changes have been saved."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update your story. Please try again.",
        variant: "destructive"
      });
    }
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (isEditing) {
        const res = await apiRequest('POST', `/api/blog/${params.id}/publish`, {});
        return res.json();
      } else {
        const createRes = await apiRequest('POST', '/api/blog', {
          title,
          excerpt,
          content,
          heroImageUrl,
          tags
        });
        const post = await createRes.json();
        const res = await apiRequest('POST', `/api/blog/${post.id}/publish`, {});
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blog'] });
      queryClient.invalidateQueries({ queryKey: ['/api/blog/me'] });
      toast({
        title: "Story published!",
        description: "Your story is now live for the community to read."
      });
      setLocation('/stories');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to publish your story. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleSaveDraft = () => {
    const data = { title, excerpt, content, heroImageUrl, tags, status: 'draft' };
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handlePublish = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title before publishing.",
        variant: "destructive"
      });
      return;
    }
    if (!content.trim() || content.length < 100) {
      toast({
        title: "Content too short",
        description: "Please write at least 100 characters before publishing.",
        variant: "destructive"
      });
      return;
    }
    publishMutation.mutate();
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    setLocation('/api/login');
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/stories/my')}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Stories
          </Button>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {readingTime} min read
            </span>
            <span>{wordCount} words</span>
          </div>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle data-testid="heading-editor">
              {isEditing ? "Edit Your Story" : "Share Your Recovery Story"}
            </CardTitle>
            <CardDescription>
              Your story could inspire thousands of stroke survivors. Take your time and share what matters.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title</Label>
              <Input
                id="title"
                placeholder="Give your story a compelling title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold"
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Short Summary (Optional)</Label>
              <Textarea
                id="excerpt"
                placeholder="A brief summary that appears in the story list..."
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                rows={2}
                data-testid="input-excerpt"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroImage">Cover Image URL (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  id="heroImage"
                  placeholder="https://example.com/image.jpg"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  data-testid="input-hero-image"
                />
                <Button variant="outline" size="icon">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
              {heroImageUrl && (
                <div className="mt-2 rounded-lg overflow-hidden border aspect-video max-w-sm">
                  <img 
                    src={heroImageUrl} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="content">Your Story</Label>
              <Textarea
                id="content"
                placeholder="Share your recovery journey... What happened? What challenges did you face? What helped you? What would you tell other survivors?

Write from the heart - your authentic experience is what will resonate with others."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="min-h-[400px] leading-relaxed"
                data-testid="input-content"
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Tags (up to 5)</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  data-testid="input-tag"
                />
                <Button 
                  variant="outline" 
                  onClick={addTag}
                  disabled={tags.length >= 5}
                  data-testid="button-add-tag"
                >
                  <Tag className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button 
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:text-destructive"
                        data-testid={`button-remove-tag-${index}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-between gap-4">
          <Button 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createMutation.isPending || updateMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="mr-2 h-4 w-4" />
            {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Draft"}
          </Button>
          
          <div className="flex gap-2">
            {isEditing && existingPost?.status === 'draft' && (
              <Button 
                variant="outline"
                onClick={() => setLocation(`/stories/${existingPost.slug}`)}
                data-testid="button-preview"
              >
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            )}
            <Button 
              onClick={handlePublish}
              disabled={publishMutation.isPending || !title.trim() || content.length < 100}
              data-testid="button-publish"
            >
              <Send className="mr-2 h-4 w-4" />
              {publishMutation.isPending ? "Publishing..." : "Publish Story"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}