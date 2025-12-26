import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Music,
  Video,
  GraduationCap,
  Image as ImageIcon,
  FileText,
  Save,
  Loader2,
  Tag,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ContentScheduler from "@/components/ContentScheduler";
import type { MarketplaceListing } from "@shared/schema";

const listingFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  subtitle: z.string().max(300, "Subtitle too long").optional(),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000, "Description too long"),
  genre: z.string().min(1, "Genre is required"),
  tags: z.string().optional(),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
  previewUrl: z.string().url().optional().or(z.literal("")),
  isDigitalOnly: z.boolean().default(false),
});

type ListingFormData = z.infer<typeof listingFormSchema>;

const genres = [
  { value: "book", label: "Book", icon: BookOpen },
  { value: "music", label: "Music", icon: Music },
  { value: "video", label: "Video", icon: Video },
  { value: "course", label: "Course", icon: GraduationCap },
  { value: "image", label: "Image Pack", icon: ImageIcon },
  { value: "doctrine", label: "Knowledge Base", icon: FileText },
];

interface ListingFormProps {
  projectId: number;
  existingListing?: MarketplaceListing;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ListingForm({
  projectId,
  existingListing,
  onSuccess,
  onCancel,
}: ListingFormProps) {
  const { toast } = useToast();
  const isEditing = !!existingListing;

  const [scheduledPublishAt, setScheduledPublishAt] = useState<Date | null>(
    existingListing?.scheduledPublishAt ? new Date(existingListing.scheduledPublishAt) : null
  );
  const [scheduledUnpublishAt, setScheduledUnpublishAt] = useState<Date | null>(
    existingListing?.scheduledUnpublishAt ? new Date(existingListing.scheduledUnpublishAt) : null
  );

  const form = useForm<ListingFormData>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: existingListing?.title || "",
      subtitle: existingListing?.subtitle || "",
      description: existingListing?.description || "",
      genre: existingListing?.genre || "",
      tags: existingListing?.tags?.join(", ") || "",
      coverImageUrl: existingListing?.coverImageUrl || "",
      previewUrl: existingListing?.previewUrl || "",
      isDigitalOnly: existingListing?.isDigitalOnly || false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ListingFormData & { scheduledPublishAt?: Date | null; scheduledUnpublishAt?: Date | null }) => {
      const payload = {
        ...data,
        projectId,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        scheduledPublishAt: data.scheduledPublishAt?.toISOString() || null,
        scheduledUnpublishAt: data.scheduledUnpublishAt?.toISOString() || null,
      };
      return apiRequest("POST", "/api/marketplace/listings", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/author/books"] });
      toast({
        title: "Listing Created",
        description: scheduledPublishAt
          ? "Your listing has been scheduled for publication."
          : "Your listing has been created as a draft.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create listing",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ListingFormData & { scheduledPublishAt?: Date | null; scheduledUnpublishAt?: Date | null }) => {
      const payload = {
        ...data,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        scheduledPublishAt: data.scheduledPublishAt?.toISOString() || null,
        scheduledUnpublishAt: data.scheduledUnpublishAt?.toISOString() || null,
      };
      return apiRequest("PATCH", `/api/marketplace/listings/${existingListing?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/author/books"] });
      queryClient.invalidateQueries({ queryKey: ["/api/marketplace/listings", existingListing?.id] });
      toast({
        title: "Listing Updated",
        description: scheduledPublishAt
          ? "Your listing schedule has been updated."
          : "Your listing has been updated.",
      });
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update listing",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ListingFormData) => {
    const payload = {
      ...data,
      scheduledPublishAt,
      scheduledUnpublishAt,
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6" data-testid="listing-form">
      <Card className="bg-black border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">
            {isEditing ? "Edit Listing" : "Create New Listing"}
          </CardTitle>
          <CardDescription>
            Fill in the details below to {isEditing ? "update your" : "create a new"} marketplace listing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter listing title"
                        className="bg-zinc-900/50 border-zinc-700"
                        disabled={isPending}
                        data-testid="input-title"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Subtitle (optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter subtitle"
                        className="bg-zinc-900/50 border-zinc-700"
                        disabled={isPending}
                        data-testid="input-subtitle"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your content..."
                        className="bg-zinc-900/50 border-zinc-700 min-h-[120px] resize-none"
                        disabled={isPending}
                        data-testid="input-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Content Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger
                          className="bg-zinc-900/50 border-zinc-700"
                          data-testid="select-genre"
                        >
                          <SelectValue placeholder="Select content type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-zinc-900 border-zinc-700">
                        {genres.map((genre) => {
                          const Icon = genre.icon;
                          return (
                            <SelectItem
                              key={genre.value}
                              value={genre.value}
                              data-testid={`option-genre-${genre.value}`}
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-4 h-4 text-orange-500" />
                                {genre.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-orange-500" />
                      Tags (optional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter tags separated by commas"
                        className="bg-zinc-900/50 border-zinc-700"
                        disabled={isPending}
                        data-testid="input-tags"
                      />
                    </FormControl>
                    <FormDescription className="text-muted-foreground">
                      Separate tags with commas (e.g., recovery, stroke, motivation)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="coverImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Cover Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          className="bg-zinc-900/50 border-zinc-700"
                          disabled={isPending}
                          data-testid="input-cover-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previewUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Preview URL (optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          className="bg-zinc-900/50 border-zinc-700"
                          disabled={isPending}
                          data-testid="input-preview-url"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isDigitalOnly"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-zinc-800 p-4 bg-zinc-900/30">
                    <div className="space-y-0.5">
                      <FormLabel className="text-white">Digital Only</FormLabel>
                      <FormDescription className="text-muted-foreground">
                        Check if this content is only available digitally (no physical copies)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                        data-testid="switch-digital-only"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </CardContent>
      </Card>

      <ContentScheduler
        scheduledPublishAt={scheduledPublishAt}
        scheduledUnpublishAt={scheduledUnpublishAt}
        onPublishDateChange={setScheduledPublishAt}
        onUnpublishDateChange={setScheduledUnpublishAt}
        disabled={isPending}
      />

      <div className="flex items-center justify-end gap-3">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="border-zinc-700"
            data-testid="button-cancel"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isPending}
          className="bg-orange-500 hover:bg-orange-600 text-black gap-2"
          data-testid="button-save-listing"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {isEditing ? "Update Listing" : "Create Listing"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
