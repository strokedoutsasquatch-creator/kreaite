import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, BookOpen, GraduationCap, Image, Plus, Trash2, Edit, Star, 
  Check, Globe, Link2, Camera, FileText, Settings, Sparkles,
  Music, Video, Film, Palette
} from "lucide-react";

const authorProfileSchema = z.object({
  penName: z.string().min(1, "Pen name is required"),
  realName: z.string().optional(),
  bio: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  socialLinks: z.record(z.string()).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  isDefault: z.boolean().default(false),
});

const publishingPresetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  trimSize: z.string().min(1, "Trim size is required"),
  margins: z.object({
    top: z.number(),
    bottom: z.number(),
    inside: z.number(),
    outside: z.number(),
  }).optional(),
  fontFamily: z.string().optional(),
  fontSize: z.number().optional(),
  lineSpacing: z.number().optional(),
  paperType: z.string().optional(),
  binding: z.string().optional(),
  isDefault: z.boolean().default(false),
});

const coursePresetSchema = z.object({
  name: z.string().min(1, "Name is required"),
  defaultQuizType: z.string().optional(),
  passingScore: z.number().min(0).max(100).optional(),
  certificateTemplate: z.string().optional(),
  videoLengthPreference: z.string().optional(),
  lessonStructure: z.string().optional(),
  isDefault: z.boolean().default(false),
});

type AuthorProfile = z.infer<typeof authorProfileSchema> & { id: number };
type PublishingPreset = z.infer<typeof publishingPresetSchema> & { id: number };
type CoursePreset = z.infer<typeof coursePresetSchema> & { id: number };
type InspirationItem = { id: number; imageUrl: string; category: string; notes?: string };

export default function CreatorSettings() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profiles");
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [publishingDialogOpen, setPublishingDialogOpen] = useState(false);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [inspirationDialogOpen, setInspirationDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<AuthorProfile | null>(null);
  const [editingPreset, setEditingPreset] = useState<PublishingPreset | null>(null);
  const [editingCourse, setEditingCourse] = useState<CoursePreset | null>(null);

  const { data: profiles = [], isLoading: profilesLoading } = useQuery<AuthorProfile[]>({
    queryKey: ["/api/author-profiles"],
  });

  const { data: publishingPresets = [], isLoading: presetsLoading } = useQuery<PublishingPreset[]>({
    queryKey: ["/api/publishing-presets"],
  });

  const { data: coursePresets = [], isLoading: coursesLoading } = useQuery<CoursePreset[]>({
    queryKey: ["/api/course-presets"],
  });

  const { data: inspiration = [], isLoading: inspirationLoading } = useQuery<InspirationItem[]>({
    queryKey: ["/api/inspiration"],
  });

  const profileForm = useForm<z.infer<typeof authorProfileSchema>>({
    resolver: zodResolver(authorProfileSchema),
    defaultValues: { penName: "", realName: "", bio: "", website: "", photoUrl: "", isDefault: false },
  });

  const publishingForm = useForm<z.infer<typeof publishingPresetSchema>>({
    resolver: zodResolver(publishingPresetSchema),
    defaultValues: { 
      name: "", trimSize: "6x9", fontFamily: "Garamond", fontSize: 11, 
      lineSpacing: 1.5, paperType: "cream", binding: "paperback", isDefault: false 
    },
  });

  const courseForm = useForm<z.infer<typeof coursePresetSchema>>({
    resolver: zodResolver(coursePresetSchema),
    defaultValues: { 
      name: "", defaultQuizType: "multiple_choice", passingScore: 70, 
      certificateTemplate: "professional", videoLengthPreference: "5-10min", 
      lessonStructure: "video-reading-quiz", isDefault: false 
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: (data: z.infer<typeof authorProfileSchema>) => 
      apiRequest("POST", "/api/author-profiles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-profiles"] });
      setProfileDialogOpen(false);
      profileForm.reset();
      toast({ title: "Author profile created" });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AuthorProfile> }) =>
      apiRequest("PATCH", `/api/author-profiles/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-profiles"] });
      setProfileDialogOpen(false);
      setEditingProfile(null);
      toast({ title: "Profile updated" });
    },
  });

  const deleteProfileMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/author-profiles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-profiles"] });
      toast({ title: "Profile deleted" });
    },
  });

  const setDefaultProfileMutation = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/author-profiles/${id}/set-default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/author-profiles"] });
      toast({ title: "Default profile updated" });
    },
  });

  const createPresetMutation = useMutation({
    mutationFn: (data: z.infer<typeof publishingPresetSchema>) =>
      apiRequest("POST", "/api/publishing-presets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publishing-presets"] });
      setPublishingDialogOpen(false);
      publishingForm.reset();
      toast({ title: "Publishing preset created" });
    },
  });

  const deletePresetMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/publishing-presets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/publishing-presets"] });
      toast({ title: "Preset deleted" });
    },
  });

  const createCourseMutation = useMutation({
    mutationFn: (data: z.infer<typeof coursePresetSchema>) =>
      apiRequest("POST", "/api/course-presets", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/course-presets"] });
      setCourseDialogOpen(false);
      courseForm.reset();
      toast({ title: "Course preset created" });
    },
  });

  const deleteCourseMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/course-presets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/course-presets"] });
      toast({ title: "Course preset deleted" });
    },
  });

  const deleteInspirationMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/inspiration/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspiration"] });
      toast({ title: "Inspiration removed" });
    },
  });

  const onProfileSubmit = (data: z.infer<typeof authorProfileSchema>) => {
    if (editingProfile) {
      updateProfileMutation.mutate({ id: editingProfile.id, data });
    } else {
      createProfileMutation.mutate(data);
    }
  };

  const trimSizes = [
    { value: "5x8", label: '5" x 8" (Digest)' },
    { value: "5.5x8.5", label: '5.5" x 8.5" (US Trade)' },
    { value: "6x9", label: '6" x 9" (US Trade)' },
    { value: "8.5x11", label: '8.5" x 11" (Letter)' },
    { value: "5.06x7.81", label: '5.06" x 7.81" (Royal)' },
    { value: "6.14x9.21", label: '6.14" x 9.21" (Crown Quarto)' },
  ];

  return (
    <div className="min-h-screen bg-black text-white p-6" data-testid="page-creator-settings">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="h-8 w-8 text-[#FF6B35]" />
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Creator Settings</h1>
            <p className="text-zinc-400">Manage your profiles, presets, and brand assets</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
            <TabsTrigger value="profiles" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white" data-testid="tab-profiles">
              <User className="h-4 w-4 mr-2" />
              Author Profiles
            </TabsTrigger>
            <TabsTrigger value="publishing" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white" data-testid="tab-publishing">
              <BookOpen className="h-4 w-4 mr-2" />
              Publishing Presets
            </TabsTrigger>
            <TabsTrigger value="courses" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white" data-testid="tab-courses">
              <GraduationCap className="h-4 w-4 mr-2" />
              Course Presets
            </TabsTrigger>
            <TabsTrigger value="inspiration" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white" data-testid="tab-inspiration">
              <Image className="h-4 w-4 mr-2" />
              Inspiration Library
            </TabsTrigger>
            <TabsTrigger value="brand" className="data-[state=active]:bg-[#FF6B35] data-[state=active]:text-white" data-testid="tab-brand">
              <Palette className="h-4 w-4 mr-2" />
              Brand Kit
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profiles" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Author Profiles</h2>
                <p className="text-zinc-400 text-sm">Create and manage author identities for your books</p>
              </div>
              <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" data-testid="button-create-profile">
                    <Plus className="h-4 w-4 mr-2" />
                    New Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle>{editingProfile ? "Edit Profile" : "Create Author Profile"}</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Set up your author identity for book publishing
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...profileForm}>
                    <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                      <FormField
                        control={profileForm.control}
                        name="penName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pen Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your author name" className="bg-zinc-800 border-zinc-700" {...field} data-testid="input-pen-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="realName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Real Name (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="For copyright" className="bg-zinc-800 border-zinc-700" {...field} data-testid="input-real-name" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Author Bio</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Tell readers about yourself..." className="bg-zinc-800 border-zinc-700 min-h-24" {...field} data-testid="input-bio" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={profileForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." className="bg-zinc-800 border-zinc-700" {...field} data-testid="input-website" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="photoUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Photo URL</FormLabel>
                              <FormControl>
                                <Input placeholder="https://..." className="bg-zinc-800 border-zinc-700" {...field} data-testid="input-photo" />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={profileForm.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} data-testid="switch-default-profile" />
                            </FormControl>
                            <FormLabel className="!mt-0">Set as default profile</FormLabel>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setProfileDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-[#FF6B35] hover:bg-[#e55a2b]" disabled={createProfileMutation.isPending} data-testid="button-save-profile">
                          {createProfileMutation.isPending ? "Saving..." : "Save Profile"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {profilesLoading ? (
              <div className="grid md:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6">
                      <Skeleton className="h-12 w-12 rounded-full mb-4" />
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : profiles.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 border-dashed">
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Author Profiles Yet</h3>
                  <p className="text-zinc-400 mb-4">Create your first author profile to get started</p>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" onClick={() => setProfileDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Profile
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {profiles.map((profile) => (
                  <Card key={profile.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors" data-testid={`card-profile-${profile.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-orange-600 flex items-center justify-center text-white font-bold text-lg">
                            {profile.penName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{profile.penName}</h3>
                              {profile.isDefault && (
                                <Badge variant="secondary" className="bg-[#FF6B35]/20 text-[#FF6B35] text-xs">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                            </div>
                            {profile.realName && <p className="text-sm text-zinc-400">{profile.realName}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingProfile(profile); setProfileDialogOpen(true); }} data-testid={`button-edit-profile-${profile.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-300" onClick={() => deleteProfileMutation.mutate(profile.id)} data-testid={`button-delete-profile-${profile.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {profile.bio && <p className="text-sm text-zinc-400 mt-4 line-clamp-2">{profile.bio}</p>}
                      <div className="flex items-center gap-4 mt-4">
                        {profile.website && (
                          <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-[#FF6B35] text-sm flex items-center gap-1 hover:underline">
                            <Globe className="h-3 w-3" /> Website
                          </a>
                        )}
                        {!profile.isDefault && (
                          <Button variant="ghost" size="sm" className="text-xs" onClick={() => setDefaultProfileMutation.mutate(profile.id)} data-testid={`button-set-default-${profile.id}`}>
                            <Check className="h-3 w-3 mr-1" /> Set as Default
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="publishing" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Publishing Presets</h2>
                <p className="text-zinc-400 text-sm">Save book formatting settings for quick reuse</p>
              </div>
              <Dialog open={publishingDialogOpen} onOpenChange={setPublishingDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" data-testid="button-create-preset">
                    <Plus className="h-4 w-4 mr-2" />
                    New Preset
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Publishing Preset</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Configure book formatting settings
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...publishingForm}>
                    <form onSubmit={publishingForm.handleSubmit((data) => createPresetMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={publishingForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preset Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Fiction Paperback" className="bg-zinc-800 border-zinc-700" {...field} data-testid="input-preset-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={publishingForm.control}
                        name="trimSize"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Trim Size</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700" data-testid="select-trim-size">
                                  <SelectValue placeholder="Select size" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                {trimSizes.map((size) => (
                                  <SelectItem key={size.value} value={size.value}>{size.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={publishingForm.control}
                          name="fontFamily"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Font Family</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                  <SelectItem value="Garamond">Garamond</SelectItem>
                                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                  <SelectItem value="Georgia">Georgia</SelectItem>
                                  <SelectItem value="Palatino">Palatino</SelectItem>
                                  <SelectItem value="Baskerville">Baskerville</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={publishingForm.control}
                          name="fontSize"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Font Size (pt)</FormLabel>
                              <FormControl>
                                <Input type="number" className="bg-zinc-800 border-zinc-700" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={publishingForm.control}
                          name="paperType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paper Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                  <SelectItem value="cream">Cream (Recommended)</SelectItem>
                                  <SelectItem value="white">White</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={publishingForm.control}
                          name="binding"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Binding</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-800 border-zinc-700">
                                  <SelectItem value="paperback">Paperback</SelectItem>
                                  <SelectItem value="hardcover">Hardcover</SelectItem>
                                  <SelectItem value="casewrap">Case Wrap</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={publishingForm.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Set as default preset</FormLabel>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setPublishingDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-[#FF6B35] hover:bg-[#e55a2b]" disabled={createPresetMutation.isPending} data-testid="button-save-preset">
                          {createPresetMutation.isPending ? "Saving..." : "Save Preset"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {presetsLoading ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : publishingPresets.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 border-dashed">
                <CardContent className="p-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Publishing Presets</h3>
                  <p className="text-zinc-400 mb-4">Create presets to speed up your book formatting</p>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" onClick={() => setPublishingDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Preset
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {publishingPresets.map((preset) => (
                  <Card key={preset.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors" data-testid={`card-preset-${preset.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-[#FF6B35]" />
                          <h3 className="font-semibold">{preset.name}</h3>
                        </div>
                        {preset.isDefault && (
                          <Badge variant="secondary" className="bg-[#FF6B35]/20 text-[#FF6B35] text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-zinc-400">
                        <div className="flex justify-between">
                          <span>Trim Size:</span>
                          <span className="text-white">{preset.trimSize}"</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Font:</span>
                          <span className="text-white">{preset.fontFamily} {preset.fontSize}pt</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Paper:</span>
                          <span className="text-white capitalize">{preset.paperType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Binding:</span>
                          <span className="text-white capitalize">{preset.binding}</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => deletePresetMutation.mutate(preset.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Course Presets</h2>
                <p className="text-zinc-400 text-sm">Configure default settings for course creation</p>
              </div>
              <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" data-testid="button-create-course-preset">
                    <Plus className="h-4 w-4 mr-2" />
                    New Preset
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Create Course Preset</DialogTitle>
                    <DialogDescription className="text-zinc-400">
                      Configure default course settings
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...courseForm}>
                    <form onSubmit={courseForm.handleSubmit((data) => createCourseMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={courseForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preset Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Interactive Course" className="bg-zinc-800 border-zinc-700" {...field} data-testid="input-course-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={courseForm.control}
                        name="defaultQuizType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Quiz Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True/False</SelectItem>
                                <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                                <SelectItem value="mixed">Mixed Types</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={courseForm.control}
                        name="passingScore"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Passing Score (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" className="bg-zinc-800 border-zinc-700" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={courseForm.control}
                        name="lessonStructure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesson Structure</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-700">
                                <SelectItem value="video-reading-quiz">Video → Reading → Quiz</SelectItem>
                                <SelectItem value="reading-quiz">Reading → Quiz</SelectItem>
                                <SelectItem value="video-quiz">Video → Quiz</SelectItem>
                                <SelectItem value="flexible">Flexible (Custom Order)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={courseForm.control}
                        name="isDefault"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3">
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormLabel className="!mt-0">Set as default preset</FormLabel>
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={() => setCourseDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-[#FF6B35] hover:bg-[#e55a2b]" disabled={createCourseMutation.isPending} data-testid="button-save-course-preset">
                          {createCourseMutation.isPending ? "Saving..." : "Save Preset"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            {coursesLoading ? (
              <div className="grid md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-6"><Skeleton className="h-24 w-full" /></CardContent>
                  </Card>
                ))}
              </div>
            ) : coursePresets.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 border-dashed">
                <CardContent className="p-12 text-center">
                  <GraduationCap className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Course Presets</h3>
                  <p className="text-zinc-400 mb-4">Create presets to streamline course creation</p>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" onClick={() => setCourseDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Create Preset
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-4">
                {coursePresets.map((preset) => (
                  <Card key={preset.id} className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors" data-testid={`card-course-${preset.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-5 w-5 text-[#FF6B35]" />
                          <h3 className="font-semibold">{preset.name}</h3>
                        </div>
                        {preset.isDefault && (
                          <Badge variant="secondary" className="bg-[#FF6B35]/20 text-[#FF6B35] text-xs">Default</Badge>
                        )}
                      </div>
                      <div className="space-y-2 text-sm text-zinc-400">
                        <div className="flex justify-between">
                          <span>Quiz Type:</span>
                          <span className="text-white capitalize">{preset.defaultQuizType?.replace("_", " ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Passing Score:</span>
                          <span className="text-white">{preset.passingScore}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Structure:</span>
                          <span className="text-white capitalize">{preset.lessonStructure?.replace(/-/g, " → ")}</span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
                        <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => deleteCourseMutation.mutate(preset.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inspiration" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Inspiration Library</h2>
                <p className="text-zinc-400 text-sm">Save cover designs, layouts, and visual references</p>
              </div>
              <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" onClick={() => setInspirationDialogOpen(true)} data-testid="button-add-inspiration">
                <Plus className="h-4 w-4 mr-2" />
                Add Inspiration
              </Button>
            </div>

            {inspirationLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
                ))}
              </div>
            ) : inspiration.length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800 border-dashed">
                <CardContent className="p-12 text-center">
                  <Image className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Inspiration Saved</h3>
                  <p className="text-zinc-400 mb-4">Add cover designs, layouts, and visual references</p>
                  <Button className="bg-[#FF6B35] hover:bg-[#e55a2b]" onClick={() => setInspirationDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Inspiration
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {inspiration.map((item) => (
                  <div key={item.id} className="relative group aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800" data-testid={`inspiration-${item.id}`}>
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button variant="destructive" size="icon" onClick={() => deleteInspirationMutation.mutate(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <Badge className="absolute bottom-2 left-2 bg-black/80">{item.category}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="brand" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Brand Kit</h2>
                <p className="text-zinc-400 text-sm">Manage colors, logos, and brand assets across all studios</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-[#FF6B35]" />
                    Brand Colors
                  </CardTitle>
                  <CardDescription>Colors used across your content</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="text-center">
                      <div className="h-12 w-12 mx-auto rounded-lg bg-[#FF6B35] border border-zinc-700"></div>
                      <span className="text-xs text-zinc-400 mt-1 block">Primary</span>
                    </div>
                    <div className="text-center">
                      <div className="h-12 w-12 mx-auto rounded-lg bg-black border border-zinc-700"></div>
                      <span className="text-xs text-zinc-400 mt-1 block">Background</span>
                    </div>
                    <div className="text-center">
                      <div className="h-12 w-12 mx-auto rounded-lg bg-white border border-zinc-700"></div>
                      <span className="text-xs text-zinc-400 mt-1 block">Text</span>
                    </div>
                    <div className="text-center">
                      <div className="h-12 w-12 mx-auto rounded-lg bg-zinc-800 border border-zinc-700"></div>
                      <span className="text-xs text-zinc-400 mt-1 block">Card</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-[#FF6B35]" />
                    Cross-Studio Integration
                  </CardTitle>
                  <CardDescription>Your brand kit works across all studios</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50">
                      <BookOpen className="h-6 w-6 text-[#FF6B35] mb-2" />
                      <span className="text-xs">Books</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50">
                      <Music className="h-6 w-6 text-[#FF6B35] mb-2" />
                      <span className="text-xs">Music</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50">
                      <Video className="h-6 w-6 text-[#FF6B35] mb-2" />
                      <span className="text-xs">Video</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50">
                      <Film className="h-6 w-6 text-[#FF6B35] mb-2" />
                      <span className="text-xs">Movies</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50">
                      <GraduationCap className="h-6 w-6 text-[#FF6B35] mb-2" />
                      <span className="text-xs">Courses</span>
                    </div>
                    <div className="flex flex-col items-center p-3 rounded-lg bg-zinc-800/50">
                      <Camera className="h-6 w-6 text-[#FF6B35] mb-2" />
                      <span className="text-xs">Images</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}