import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Shield,
  Flag,
  AlertTriangle,
  Check,
  X,
  Eye,
  Clock,
  Filter,
  ChevronDown,
  ExternalLink,
  User,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ContentReport {
  report: {
    id: number;
    listingId: number;
    reporterUserId: string;
    reason: string;
    description: string | null;
    status: string;
    createdAt: string;
    resolvedAt: string | null;
    resolvedBy: string | null;
  };
  listing: {
    id: number;
    title: string;
    coverImageUrl: string | null;
    authorId: string;
    moderationStatus: string;
  } | null;
  reporter: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
  } | null;
}

const REASON_LABELS: Record<string, { label: string; icon: typeof Flag }> = {
  inappropriate: { label: "Inappropriate", icon: AlertTriangle },
  copyright: { label: "Copyright", icon: FileText },
  spam: { label: "Spam", icon: Flag },
  other: { label: "Other", icon: Flag },
};

const STATUS_BADGES: Record<string, { className: string; label: string }> = {
  pending: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pending" },
  reviewed: { className: "bg-blue-500/20 text-blue-400 border-blue-500/30", label: "Reviewed" },
  resolved: { className: "bg-green-500/20 text-green-400 border-green-500/30", label: "Resolved" },
};

const MODERATION_STATUS_BADGES: Record<string, { className: string; label: string }> = {
  pending: { className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", label: "Pending" },
  approved: { className: "bg-green-500/20 text-green-400 border-green-500/30", label: "Approved" },
  rejected: { className: "bg-red-500/20 text-red-400 border-red-500/30", label: "Rejected" },
  flagged: { className: "bg-primary/20 text-primary border", label: "Flagged" },
};

export default function ModerationDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [moderationDialog, setModerationDialog] = useState<{
    isOpen: boolean;
    listingId: number | null;
    action: string;
    notes: string;
  }>({ isOpen: false, listingId: null, action: "", notes: "" });

  const { data: reports, isLoading } = useQuery<ContentReport[]>({
    queryKey: ["/api/moderation/reports", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const response = await fetch(`/api/moderation/reports?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
    enabled: user?.role === "admin",
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/moderation/reports/${reportId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Report Updated", description: "The report status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/reports"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update report.", variant: "destructive" });
    },
  });

  const updateListingMutation = useMutation({
    mutationFn: async ({ listingId, moderationStatus, moderationNotes }: { 
      listingId: number; 
      moderationStatus: string; 
      moderationNotes?: string 
    }) => {
      const response = await apiRequest("PATCH", `/api/moderation/listings/${listingId}/status`, {
        moderationStatus,
        moderationNotes,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Listing Updated", description: "The listing moderation status has been updated." });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/reports"] });
      setModerationDialog({ isOpen: false, listingId: null, action: "", notes: "" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update listing.", variant: "destructive" });
    },
  });

  const handleQuickAction = (listingId: number, action: string) => {
    if (action === "approve") {
      updateListingMutation.mutate({ listingId, moderationStatus: "approved" });
    } else if (action === "reject" || action === "flag") {
      setModerationDialog({ isOpen: true, listingId, action, notes: "" });
    }
  };

  const handleConfirmModeration = () => {
    if (!moderationDialog.listingId) return;
    
    const moderationStatus = moderationDialog.action === "reject" ? "rejected" : "flagged";
    updateListingMutation.mutate({
      listingId: moderationDialog.listingId,
      moderationStatus,
      moderationNotes: moderationDialog.notes || undefined,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-10 w-64 bg-gray-800 mb-8" />
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 bg-gray-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" data-testid="access-denied">
        <Card className="bg-gray-900 border-gray-800 max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="w-12 h-12 text-[#FF6B35] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
            <p className="text-gray-400 mb-4">
              You don't have permission to access the moderation dashboard. This area is restricted to administrators.
            </p>
            <Button
              onClick={() => setLocation("/")}
              className="bg-[#FF6B35] hover:bg-[#FF6B35]/90"
              data-testid="button-go-home"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingCount = reports?.filter((r) => r.report.status === "pending").length || 0;
  const reviewedCount = reports?.filter((r) => r.report.status === "reviewed").length || 0;
  const resolvedCount = reports?.filter((r) => r.report.status === "resolved").length || 0;

  return (
    <div className="min-h-screen bg-background" data-testid="page-moderation-dashboard">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-[#FF6B35]" />
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                Moderation Dashboard
              </h1>
              <p className="text-gray-400 text-sm">Review and manage content reports</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger
                className="w-[180px] bg-gray-900 border-gray-700 text-foreground"
                data-testid="select-status-filter"
              >
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="all" className="text-foreground">All Reports</SelectItem>
                <SelectItem value="pending" className="text-foreground">Pending</SelectItem>
                <SelectItem value="reviewed" className="text-foreground">Reviewed</SelectItem>
                <SelectItem value="resolved" className="text-foreground">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-pending-count">{pendingCount}</p>
                <p className="text-sm text-gray-400">Pending Reports</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Eye className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-reviewed-count">{reviewedCount}</p>
                <p className="text-sm text-gray-400">Under Review</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Check className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground" data-testid="text-resolved-count">{resolvedCount}</p>
                <p className="text-sm text-gray-400">Resolved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40 bg-gray-800" />
            ))}
          </div>
        ) : reports && reports.length > 0 ? (
          <div className="space-y-4">
            {reports.map((item) => {
              const ReasonIcon = REASON_LABELS[item.report.reason]?.icon || Flag;
              const statusBadge = STATUS_BADGES[item.report.status];
              const moderationBadge = item.listing ? MODERATION_STATUS_BADGES[item.listing.moderationStatus] : null;

              return (
                <Card
                  key={item.report.id}
                  className="bg-gray-900 border-gray-800"
                  data-testid={`card-report-${item.report.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex gap-4">
                        {item.listing?.coverImageUrl ? (
                          <img
                            src={item.listing.coverImageUrl}
                            alt={item.listing.title}
                            className="w-16 h-20 object-cover rounded-md bg-gray-800"
                          />
                        ) : (
                          <div className="w-16 h-20 bg-gray-800 rounded-md flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-600" />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground truncate">
                              {item.listing?.title || "Unknown Listing"}
                            </h3>
                            {statusBadge && (
                              <Badge variant="outline" className={statusBadge.className}>
                                {statusBadge.label}
                              </Badge>
                            )}
                            {moderationBadge && (
                              <Badge variant="outline" className={moderationBadge.className}>
                                {moderationBadge.label}
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                            <ReasonIcon className="w-4 h-4 text-[#FF6B35]" />
                            <span>{REASON_LABELS[item.report.reason]?.label || item.report.reason}</span>
                            <span className="text-gray-600">•</span>
                            <User className="w-4 h-4" />
                            <span>
                              {item.reporter?.firstName || item.reporter?.email || "Anonymous"}
                            </span>
                            <span className="text-gray-600">•</span>
                            <span>{new Date(item.report.createdAt).toLocaleDateString()}</span>
                          </div>

                          {item.report.description && (
                            <p className="text-sm text-gray-300 line-clamp-2">
                              {item.report.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.listing && item.report.status !== "resolved" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleQuickAction(item.listing!.id, "approve")}
                              className="bg-green-600 hover:bg-green-700 text-foreground"
                              disabled={updateListingMutation.isPending}
                              data-testid={`button-approve-${item.report.id}`}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAction(item.listing!.id, "flag")}
                              className="border-orange-600 text-primary hover:bg-orange-600/20"
                              disabled={updateListingMutation.isPending}
                              data-testid={`button-flag-${item.report.id}`}
                            >
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Flag
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleQuickAction(item.listing!.id, "reject")}
                              className="border-red-600 text-red-400 hover:bg-red-600/20"
                              disabled={updateListingMutation.isPending}
                              data-testid={`button-reject-${item.report.id}`}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-foreground"
                              data-testid={`button-more-${item.report.id}`}
                            >
                              <ChevronDown className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-gray-900 border-gray-700">
                            {item.listing && (
                              <DropdownMenuItem
                                className="text-foreground hover:bg-gray-800"
                                onClick={() => setLocation(`/listing/${item.listing!.id}`)}
                              >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Listing
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-foreground hover:bg-gray-800"
                              onClick={() => updateReportMutation.mutate({ 
                                reportId: item.report.id, 
                                status: "reviewed" 
                              })}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Mark as Reviewed
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-foreground hover:bg-gray-800"
                              onClick={() => updateReportMutation.mutate({ 
                                reportId: item.report.id, 
                                status: "resolved" 
                              })}
                            >
                              <Check className="w-4 h-4 mr-2" />
                              Mark as Resolved
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="p-12 text-center">
              <Shield className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No Reports Found</h3>
              <p className="text-gray-400">
                {statusFilter === "all"
                  ? "There are no content reports to review at this time."
                  : `There are no ${statusFilter} reports.`}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={moderationDialog.isOpen}
        onOpenChange={(open) => !open && setModerationDialog({ isOpen: false, listingId: null, action: "", notes: "" })}
      >
        <DialogContent className="bg-gray-900 border-gray-800" data-testid="modal-moderation-action">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {moderationDialog.action === "reject" ? (
                <>
                  <X className="w-5 h-5 text-red-400" />
                  Remove Listing
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-primary" />
                  Flag for Review
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {moderationDialog.action === "reject"
                ? "This will remove the listing from the marketplace. Please provide a reason."
                : "This will flag the listing for further review. Please add any notes."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="notes" className="text-gray-300">
              Moderation Notes
            </Label>
            <Textarea
              id="notes"
              value={moderationDialog.notes}
              onChange={(e) => setModerationDialog((prev) => ({ ...prev, notes: e.target.value }))}
              placeholder="Add notes about this moderation action..."
              className="bg-gray-800 border-gray-700 text-foreground mt-2"
              data-testid="textarea-moderation-notes"
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModerationDialog({ isOpen: false, listingId: null, action: "", notes: "" })}
              className="border-gray-700 text-gray-300"
              data-testid="button-cancel-moderation"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmModeration}
              disabled={updateListingMutation.isPending}
              className={moderationDialog.action === "reject" ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
              data-testid="button-confirm-moderation"
            >
              {updateListingMutation.isPending ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
