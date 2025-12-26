import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Flag, X, AlertTriangle, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: number;
  listingTitle?: string;
}

const REPORT_REASONS = [
  { value: "inappropriate", label: "Inappropriate Content" },
  { value: "copyright", label: "Copyright Violation" },
  { value: "spam", label: "Spam or Misleading" },
  { value: "other", label: "Other" },
];

export function ReportModal({ isOpen, onClose, listingId, listingTitle }: ReportModalProps) {
  const { toast } = useToast();
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState("");

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/moderation/report", {
        listingId,
        reason,
        description: description || undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. We'll review this content shortly.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/moderation/reports"] });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Submit Report",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setReason("");
    setDescription("");
    onClose();
  };

  const handleSubmit = () => {
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for your report.",
        variant: "destructive",
      });
      return;
    }
    submitReportMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-black border-gray-800 text-white max-w-md" data-testid="modal-report-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Flag className="w-5 h-5 text-[#FF6B35]" />
            Report Content
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            {listingTitle ? (
              <>Report: <span className="text-white">{listingTitle}</span></>
            ) : (
              "Help us maintain community standards by reporting inappropriate content."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-gray-300">
              Reason for Report <span className="text-[#FF6B35]">*</span>
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger
                id="reason"
                className="bg-gray-900 border-gray-700 text-white focus:border-[#FF6B35] focus:ring-[#FF6B35]"
                data-testid="select-report-reason"
              >
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                {REPORT_REASONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="text-white hover:bg-gray-800 focus:bg-gray-800"
                    data-testid={`option-reason-${option.value}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Additional Details (Optional)
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide any additional context that might help us review this content..."
              className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-[#FF6B35] focus:ring-[#FF6B35] min-h-[100px]"
              data-testid="textarea-report-description"
            />
          </div>

          <div className="flex items-start gap-2 p-3 bg-gray-900/50 rounded-md border border-gray-800">
            <AlertTriangle className="w-4 h-4 text-[#FF6B35] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400">
              False reports may result in action against your account. Please only report content that genuinely violates our community guidelines.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-700 text-gray-300 hover:bg-gray-800"
            data-testid="button-cancel-report"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!reason || submitReportMutation.isPending}
            className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
            data-testid="button-submit-report"
          >
            {submitReportMutation.isPending ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Report
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ReportModal;
