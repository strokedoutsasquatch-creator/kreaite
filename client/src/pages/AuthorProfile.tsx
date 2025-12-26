import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import CreatorHeader from "@/components/CreatorHeader";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  User,
  Camera,
  Image as ImageIcon,
  Link as LinkIcon,
  Globe,
  BookOpen,
  Award,
  Settings,
  BarChart3,
  Users,
  DollarSign,
  TrendingUp,
  ExternalLink,
  Save,
  Upload,
  Mic,
  Video,
  Plus,
  X,
  Trash2,
  Copy,
  Eye,
} from "lucide-react";
import { SiX, SiInstagram, SiFacebook, SiLinkedin, SiTiktok, SiYoutube, SiAmazon, SiGoodreads } from "react-icons/si";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AuthorProfile as AuthorProfileType } from "@shared/schema";

const GENRE_OPTIONS = [
  "Fiction", "Non-Fiction", "Mystery", "Thriller", "Romance", "Fantasy",
  "Science Fiction", "Horror", "Biography", "Self-Help", "Business",
  "Health & Wellness", "History", "Poetry", "Children's", "Young Adult",
  "Memoir", "Travel", "Cooking", "Art & Photography"
];

const THEME_OPTIONS = [
  { value: "default", label: "Default (Dark)" },
  { value: "dark", label: "Dark Mode" },
  { value: "light", label: "Light Mode" },
  { value: "custom", label: "Custom" },
];

const profileFormSchema = z.object({
  penName: z.string().min(1, "Pen name is required"),
  tagline: z.string().max(150, "Tagline must be 150 characters or less").optional(),
  bio: z.string().optional(),
  shortBio: z.string().max(150, "Short bio must be 150 characters or less").optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  bannerUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  audioBioUrl: z.string().url().optional().or(z.literal("")),
  videoBioUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().optional(),
  instagramUrl: z.string().optional(),
  facebookUrl: z.string().optional(),
  linkedinUrl: z.string().optional(),
  tiktokUrl: z.string().optional(),
  youtubeUrl: z.string().optional(),
  amazonUrl: z.string().optional(),
  goodreadsUrl: z.string().optional(),
  newsletterUrl: z.string().optional(),
  genres: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  storefrontEnabled: z.boolean().optional(),
  storefrontTheme: z.string().optional(),
  storefrontSlug: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function StatCard({ 
  title, 
  value, 
  icon: Icon,
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-3 rounded-full bg-orange-500/10">
            <Icon className="w-5 h-5 text-orange-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function AuthorProfile() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedProfile, setSelectedProfile] = useState<AuthorProfileType | null>(null);
  const [newAchievement, setNewAchievement] = useState("");
  const [achievements, setAchievements] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  const { data: profiles, isLoading: profilesLoading } = useQuery<AuthorProfileType[]>({
    queryKey: ["/api/author-profiles"],
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/author/stats"],
    enabled: !!user,
  });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      penName: "",
      tagline: "",
      bio: "",
      shortBio: "",
      photoUrl: "",
      bannerUrl: "",
      websiteUrl: "",
      audioBioUrl: "",
      videoBioUrl: "",
      twitterUrl: "",
      instagramUrl: "",
      facebookUrl: "",
      linkedinUrl: "",
      tiktokUrl: "",
      youtubeUrl: "",
      amazonUrl: "",
      goodreadsUrl: "",
      newsletterUrl: "",
      genres: [],
      achievements: [],
      storefrontEnabled: true,
      storefrontTheme: "default",
      storefrontSlug: "",
    },
  });

  useEffect(() => {
    if (profiles && profiles.length > 0 && !selectedProfile) {
      const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
      setSelectedProfile(defaultProfile);
    }
  }, [profiles, selectedProfile]);

  useEffect(() => {
    if (selectedProfile) {
      const socialLinks = selectedProfile.socialLinks as Record<string, string> || {};
      const publisherInfo = selectedProfile.publisherInfo as Record<string, unknown> || {};
      
      form.reset({
        penName: selectedProfile.penName || "",
        tagline: socialLinks.tagline || "",
        bio: selectedProfile.bio || "",
        shortBio: selectedProfile.shortBio || "",
        photoUrl: selectedProfile.photoUrl || "",
        bannerUrl: socialLinks.bannerUrl || "",
        websiteUrl: selectedProfile.websiteUrl || "",
        audioBioUrl: socialLinks.audioBioUrl || "",
        videoBioUrl: socialLinks.videoBioUrl || "",
        twitterUrl: socialLinks.twitter || "",
        instagramUrl: socialLinks.instagram || "",
        facebookUrl: socialLinks.facebook || "",
        linkedinUrl: socialLinks.linkedin || "",
        tiktokUrl: socialLinks.tiktok || "",
        youtubeUrl: socialLinks.youtube || "",
        amazonUrl: socialLinks.amazon || "",
        goodreadsUrl: socialLinks.goodreads || "",
        newsletterUrl: socialLinks.newsletter || "",
        genres: selectedProfile.genres || [],
        achievements: (publisherInfo.achievements as string[]) || [],
        storefrontEnabled: publisherInfo.storefrontEnabled !== false,
        storefrontTheme: (publisherInfo.storefrontTheme as string) || "default",
        storefrontSlug: (publisherInfo.storefrontSlug as string) || selectedProfile.penName?.toLowerCase().replace(/\s+/g, "-") || "",
      });
      setSelectedGenres(selectedProfile.genres || []);
      setAchievements((publisherInfo.achievements as string[]) || []);
    }
  }, [selectedProfile, form]);

  const createProfileMutation = useMutation({
    mutationFn: async (data: Partial<ProfileFormValues>) => {
      return await apiRequest("POST", "/api/author-profiles", {
        penName: data.penName || `${user?.firstName || "Author"}'s Profile`,
        isDefault: !profiles || profiles.length === 0,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-profiles"] });
      toast({ title: "Profile created successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create profile", description: error.message, variant: "destructive" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      if (!selectedProfile) throw new Error("No profile selected");
      
      const socialLinks = {
        tagline: data.tagline,
        bannerUrl: data.bannerUrl,
        audioBioUrl: data.audioBioUrl,
        videoBioUrl: data.videoBioUrl,
        twitter: data.twitterUrl,
        instagram: data.instagramUrl,
        facebook: data.facebookUrl,
        linkedin: data.linkedinUrl,
        tiktok: data.tiktokUrl,
        youtube: data.youtubeUrl,
        amazon: data.amazonUrl,
        goodreads: data.goodreadsUrl,
        newsletter: data.newsletterUrl,
      };
      
      const publisherInfo = {
        achievements: achievements,
        storefrontEnabled: data.storefrontEnabled,
        storefrontTheme: data.storefrontTheme,
        storefrontSlug: data.storefrontSlug,
      };

      return await apiRequest("PATCH", `/api/author-profiles/${selectedProfile.id}`, {
        penName: data.penName,
        bio: data.bio,
        shortBio: data.shortBio,
        photoUrl: data.photoUrl,
        websiteUrl: data.websiteUrl,
        socialLinks,
        genres: selectedGenres,
        publisherInfo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-profiles"] });
      toast({ title: "Profile updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update profile", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  const addAchievement = () => {
    if (newAchievement.trim() && !achievements.includes(newAchievement.trim())) {
      setAchievements([...achievements, newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (achievement: string) => {
    setAchievements(achievements.filter(a => a !== achievement));
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter(g => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  const storefrontUrl = selectedProfile 
    ? `${window.location.origin}/author/${form.watch("storefrontSlug") || selectedProfile.penName?.toLowerCase().replace(/\s+/g, "-")}`
    : "";

  const copyStorefrontUrl = () => {
    navigator.clipboard.writeText(storefrontUrl);
    toast({ title: "URL copied to clipboard" });
  };

  if (authLoading || profilesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <CreatorHeader />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <ProfileSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <CreatorHeader />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Sign in to manage your author profile</h1>
          <p className="text-muted-foreground mb-8">Create your public author storefront and manage your brand</p>
          <Button asChild>
            <a href="/api/login" data-testid="link-login">Sign In</a>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <CreatorHeader />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold font-serif" data-testid="text-page-title">Author Profile</h1>
            <p className="text-muted-foreground">Manage your author brand and public storefront</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/author/${form.watch("storefrontSlug") || selectedProfile.penName?.toLowerCase().replace(/\s+/g, "-")}`, "_blank")}
                data-testid="button-preview-storefront"
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Storefront
              </Button>
            )}
            <Button
              onClick={() => createProfileMutation.mutate({})}
              disabled={createProfileMutation.isPending}
              data-testid="button-new-profile"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Profile
            </Button>
          </div>
        </div>

        {profiles && profiles.length > 1 && (
          <div className="mb-6">
            <Label className="mb-2 block">Select Profile</Label>
            <Select
              value={selectedProfile?.id?.toString()}
              onValueChange={(value) => {
                const profile = profiles.find(p => p.id.toString() === value);
                if (profile) setSelectedProfile(profile);
              }}
            >
              <SelectTrigger className="w-64" data-testid="select-profile">
                <SelectValue placeholder="Select a profile" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id.toString()}>
                    {profile.penName} {profile.isDefault && "(Default)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {!selectedProfile && profiles?.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No Author Profile Yet</h2>
              <p className="text-muted-foreground mb-6">Create your first author profile to build your public storefront</p>
              <Button
                onClick={() => createProfileMutation.mutate({})}
                disabled={createProfileMutation.isPending}
                data-testid="button-create-first-profile"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Profile
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedProfile && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 gap-1">
                  <TabsTrigger value="profile" data-testid="tab-profile">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </TabsTrigger>
                  <TabsTrigger value="social" data-testid="tab-social">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Social
                  </TabsTrigger>
                  <TabsTrigger value="author" data-testid="tab-author">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Author Info
                  </TabsTrigger>
                  <TabsTrigger value="storefront" data-testid="tab-storefront">
                    <Settings className="w-4 h-4 mr-2" />
                    Storefront
                  </TabsTrigger>
                  <TabsTrigger value="stats" data-testid="tab-stats">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Stats
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Header</CardTitle>
                      <CardDescription>Your profile photo and banner for your public storefront</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="relative h-48 bg-gradient-to-r from-orange-500/20 to-orange-600/10 rounded-lg overflow-hidden">
                        {form.watch("bannerUrl") && (
                          <img 
                            src={form.watch("bannerUrl")} 
                            alt="Banner" 
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/30" />
                        <div className="absolute bottom-4 right-4">
                          <FormField
                            control={form.control}
                            name="bannerUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="flex items-center gap-2">
                                    <Input
                                      placeholder="Banner image URL"
                                      className="w-64 bg-black/50 backdrop-blur"
                                      {...field}
                                      data-testid="input-banner-url"
                                    />
                                    <Button type="button" size="icon" variant="secondary">
                                      <ImageIcon className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="absolute -bottom-12 left-6">
                          <div className="relative">
                            <Avatar className="w-24 h-24 border-4 border-background">
                              <AvatarImage src={form.watch("photoUrl")} />
                              <AvatarFallback className="text-2xl bg-orange-500/20">
                                {form.watch("penName")?.charAt(0) || "A"}
                              </AvatarFallback>
                            </Avatar>
                            <Button
                              type="button"
                              size="icon"
                              className="absolute -bottom-1 -right-1 rounded-full w-8 h-8"
                              variant="secondary"
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-14 grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="photoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Profile Photo URL</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://example.com/photo.jpg"
                                  {...field}
                                  data-testid="input-photo-url"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="penName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pen Name *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Your author name"
                                  {...field}
                                  data-testid="input-pen-name"
                                />
                              </FormControl>
                              <FormDescription>This becomes your storefront URL</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="tagline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tagline</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Award-winning author of..."
                                maxLength={150}
                                {...field}
                                data-testid="input-tagline"
                              />
                            </FormControl>
                            <FormDescription>
                              {(field.value?.length || 0)}/150 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Biography</CardTitle>
                      <CardDescription>Tell readers about yourself</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Biography</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Share your story, writing journey, and what inspires you..."
                                className="min-h-[200px] resize-y"
                                {...field}
                                data-testid="textarea-bio"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="shortBio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Short Bio (for book backs)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="A brief bio for your book covers..."
                                maxLength={150}
                                className="resize-none"
                                {...field}
                                data-testid="textarea-short-bio"
                              />
                            </FormControl>
                            <FormDescription>
                              {(field.value?.length || 0)}/150 characters
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="audioBioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Mic className="w-4 h-4" />
                                Audio Bio URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Link to audio introduction"
                                  {...field}
                                  data-testid="input-audio-bio"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="videoBioUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Video Intro URL
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Link to video introduction"
                                  {...field}
                                  data-testid="input-video-bio"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="social" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Social Links</CardTitle>
                      <CardDescription>Connect your social media profiles</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name="websiteUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Globe className="w-4 h-4" />
                              Website
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://yourwebsite.com"
                                {...field}
                                data-testid="input-website"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="twitterUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiX className="w-4 h-4" />
                                Twitter / X
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://twitter.com/yourhandle"
                                  {...field}
                                  data-testid="input-twitter"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="instagramUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiInstagram className="w-4 h-4" />
                                Instagram
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://instagram.com/yourhandle"
                                  {...field}
                                  data-testid="input-instagram"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="facebookUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiFacebook className="w-4 h-4" />
                                Facebook
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://facebook.com/yourpage"
                                  {...field}
                                  data-testid="input-facebook"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiLinkedin className="w-4 h-4" />
                                LinkedIn
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://linkedin.com/in/yourprofile"
                                  {...field}
                                  data-testid="input-linkedin"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tiktokUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiTiktok className="w-4 h-4" />
                                TikTok
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://tiktok.com/@yourhandle"
                                  {...field}
                                  data-testid="input-tiktok"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="youtubeUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiYoutube className="w-4 h-4" />
                                YouTube
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://youtube.com/c/yourchannel"
                                  {...field}
                                  data-testid="input-youtube"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="amazonUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiAmazon className="w-4 h-4" />
                                Amazon Author Page
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://amazon.com/author/yourname"
                                  {...field}
                                  data-testid="input-amazon"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="goodreadsUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center gap-2">
                                <SiGoodreads className="w-4 h-4" />
                                Goodreads
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="https://goodreads.com/author/show/yourname"
                                  {...field}
                                  data-testid="input-goodreads"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="newsletterUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Newsletter Signup URL</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="https://yoursite.com/newsletter"
                                {...field}
                                data-testid="input-newsletter"
                              />
                            </FormControl>
                            <FormDescription>
                              Link to your email newsletter signup page
                            </FormDescription>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="author" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Genres</CardTitle>
                      <CardDescription>Select the genres you write in</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {GENRE_OPTIONS.map((genre) => (
                          <Badge
                            key={genre}
                            variant={selectedGenres.includes(genre) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              selectedGenres.includes(genre)
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "hover:bg-orange-500/10"
                            }`}
                            onClick={() => toggleGenre(genre)}
                            data-testid={`badge-genre-${genre.toLowerCase().replace(/\s+/g, "-")}`}
                          >
                            {genre}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Achievements & Awards
                      </CardTitle>
                      <CardDescription>List your writing achievements and awards</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add an achievement or award..."
                          value={newAchievement}
                          onChange={(e) => setNewAchievement(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                          data-testid="input-new-achievement"
                        />
                        <Button
                          type="button"
                          onClick={addAchievement}
                          disabled={!newAchievement.trim()}
                          data-testid="button-add-achievement"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>

                      {achievements.length > 0 && (
                        <div className="space-y-2">
                          {achievements.map((achievement, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 p-3 bg-muted/50 rounded-md"
                              data-testid={`achievement-${index}`}
                            >
                              <div className="flex items-center gap-2">
                                <Award className="w-4 h-4 text-orange-500" />
                                <span>{achievement}</span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeAchievement(achievement)}
                                data-testid={`button-remove-achievement-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="storefront" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Storefront Settings</CardTitle>
                      <CardDescription>Configure your public author storefront</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="storefrontEnabled"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Enable Public Storefront</FormLabel>
                              <FormDescription>
                                Make your author page visible to the public
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="switch-storefront-enabled"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="storefrontSlug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custom URL Slug</FormLabel>
                            <FormControl>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground text-sm">/author/</span>
                                <Input
                                  placeholder="your-name"
                                  {...field}
                                  data-testid="input-storefront-slug"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Your storefront will be available at: {storefrontUrl}
                            </FormDescription>
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-2">
                        <Input
                          value={storefrontUrl}
                          readOnly
                          className="flex-1"
                          data-testid="input-storefront-url-preview"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={copyStorefrontUrl}
                          data-testid="button-copy-url"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(storefrontUrl, "_blank")}
                          data-testid="button-open-storefront"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>

                      <FormField
                        control={form.control}
                        name="storefrontTheme"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Theme</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger data-testid="select-theme">
                                  <SelectValue placeholder="Select a theme" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {THEME_OPTIONS.map((theme) => (
                                  <SelectItem key={theme.value} value={theme.value}>
                                    {theme.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="stats" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                      title="Total Books"
                      value={(stats as any)?.totalBooks || 0}
                      icon={BookOpen}
                    />
                    <StatCard
                      title="Total Sales"
                      value={(stats as any)?.totalSales || 0}
                      icon={TrendingUp}
                    />
                    <StatCard
                      title="Total Earnings"
                      value={`$${(((stats as any)?.totalEarnings || 0) / 100).toFixed(2)}`}
                      icon={DollarSign}
                    />
                    <StatCard
                      title="Followers"
                      value={(stats as any)?.followerCount || 0}
                      icon={Users}
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Overview</CardTitle>
                      <CardDescription>Your author statistics at a glance</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center py-12">
                      <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Detailed analytics will appear here as you publish more books
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                  data-testid="button-reset"
                >
                  Reset Changes
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
