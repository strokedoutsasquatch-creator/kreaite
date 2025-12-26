import { useState, useEffect } from "react";
import { format, addDays, isBefore, isAfter, startOfDay } from "date-fns";
import { Calendar, Clock, Timer, Globe, CalendarCheck, CalendarX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface ContentSchedulerProps {
  scheduledPublishAt?: Date | null;
  scheduledUnpublishAt?: Date | null;
  onPublishDateChange: (date: Date | null) => void;
  onUnpublishDateChange: (date: Date | null) => void;
  disabled?: boolean;
}

export default function ContentScheduler({
  scheduledPublishAt,
  scheduledUnpublishAt,
  onPublishDateChange,
  onUnpublishDateChange,
  disabled = false,
}: ContentSchedulerProps) {
  const [isSchedulingEnabled, setIsSchedulingEnabled] = useState(
    !!(scheduledPublishAt || scheduledUnpublishAt)
  );
  const [hasUnpublishDate, setHasUnpublishDate] = useState(!!scheduledUnpublishAt);
  const [publishTime, setPublishTime] = useState(
    scheduledPublishAt ? format(scheduledPublishAt, "HH:mm") : "09:00"
  );
  const [unpublishTime, setUnpublishTime] = useState(
    scheduledUnpublishAt ? format(scheduledUnpublishAt, "HH:mm") : "17:00"
  );

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (!isSchedulingEnabled) {
      onPublishDateChange(null);
      onUnpublishDateChange(null);
    }
  }, [isSchedulingEnabled, onPublishDateChange, onUnpublishDateChange]);

  useEffect(() => {
    if (!hasUnpublishDate) {
      onUnpublishDateChange(null);
    }
  }, [hasUnpublishDate, onUnpublishDateChange]);

  const handlePublishDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = publishTime.split(":").map(Number);
      const dateWithTime = new Date(date);
      dateWithTime.setHours(hours, minutes, 0, 0);
      onPublishDateChange(dateWithTime);
    }
  };

  const handleUnpublishDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = unpublishTime.split(":").map(Number);
      const dateWithTime = new Date(date);
      dateWithTime.setHours(hours, minutes, 0, 0);
      onUnpublishDateChange(dateWithTime);
    }
  };

  const handlePublishTimeChange = (time: string) => {
    setPublishTime(time);
    if (scheduledPublishAt) {
      const [hours, minutes] = time.split(":").map(Number);
      const updatedDate = new Date(scheduledPublishAt);
      updatedDate.setHours(hours, minutes, 0, 0);
      onPublishDateChange(updatedDate);
    }
  };

  const handleUnpublishTimeChange = (time: string) => {
    setUnpublishTime(time);
    if (scheduledUnpublishAt) {
      const [hours, minutes] = time.split(":").map(Number);
      const updatedDate = new Date(scheduledUnpublishAt);
      updatedDate.setHours(hours, minutes, 0, 0);
      onUnpublishDateChange(updatedDate);
    }
  };

  const getScheduleStatus = () => {
    if (!scheduledPublishAt) return null;
    const now = new Date();
    if (isBefore(now, scheduledPublishAt)) {
      return { status: "scheduled", label: "Scheduled to publish" };
    }
    if (scheduledUnpublishAt && isBefore(now, scheduledUnpublishAt)) {
      return { status: "live", label: "Currently live" };
    }
    if (scheduledUnpublishAt && isAfter(now, scheduledUnpublishAt)) {
      return { status: "ended", label: "Schedule ended" };
    }
    return { status: "live", label: "Published" };
  };

  const scheduleStatus = getScheduleStatus();

  return (
    <Card className="bg-black border-zinc-800" data-testid="content-scheduler">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Timer className="w-5 h-5 text-orange-500" />
            <CardTitle className="text-lg text-white">Content Scheduling</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="scheduling-toggle" className="text-sm text-muted-foreground">
              Enable scheduling
            </Label>
            <Switch
              id="scheduling-toggle"
              checked={isSchedulingEnabled}
              onCheckedChange={setIsSchedulingEnabled}
              disabled={disabled}
              data-testid="switch-scheduling-toggle"
            />
          </div>
        </div>
      </CardHeader>

      {isSchedulingEnabled && (
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="w-4 h-4" />
            <span data-testid="text-timezone">Timezone: {timezone}</span>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-orange-500" />
                Publish Date & Time
              </Label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "justify-start text-left font-normal border-zinc-700 bg-zinc-900/50 flex-1",
                        !scheduledPublishAt && "text-muted-foreground"
                      )}
                      disabled={disabled}
                      data-testid="button-publish-date"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-orange-500" />
                      {scheduledPublishAt
                        ? format(scheduledPublishAt, "PPP")
                        : "Select publish date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={scheduledPublishAt || undefined}
                      onSelect={handlePublishDateSelect}
                      disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                      initialFocus
                      data-testid="calendar-publish"
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                  <Input
                    type="time"
                    value={publishTime}
                    onChange={(e) => handlePublishTimeChange(e.target.value)}
                    className="w-32 bg-zinc-900/50 border-zinc-700"
                    disabled={disabled}
                    data-testid="input-publish-time"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                id="unpublish-toggle"
                checked={hasUnpublishDate}
                onCheckedChange={setHasUnpublishDate}
                disabled={disabled}
                data-testid="switch-unpublish-toggle"
              />
              <Label htmlFor="unpublish-toggle" className="text-sm text-muted-foreground">
                Set an unpublish date (optional)
              </Label>
            </div>

            {hasUnpublishDate && (
              <div className="space-y-2">
                <Label className="text-white flex items-center gap-2">
                  <CalendarX className="w-4 h-4 text-orange-500" />
                  Unpublish Date & Time
                </Label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal border-zinc-700 bg-zinc-900/50 flex-1",
                          !scheduledUnpublishAt && "text-muted-foreground"
                        )}
                        disabled={disabled}
                        data-testid="button-unpublish-date"
                      >
                        <Calendar className="mr-2 h-4 w-4 text-orange-500" />
                        {scheduledUnpublishAt
                          ? format(scheduledUnpublishAt, "PPP")
                          : "Select unpublish date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-700" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={scheduledUnpublishAt || undefined}
                        onSelect={handleUnpublishDateSelect}
                        disabled={(date) => {
                          const minDate = scheduledPublishAt
                            ? addDays(scheduledPublishAt, 1)
                            : addDays(new Date(), 1);
                          return isBefore(startOfDay(date), startOfDay(minDate));
                        }}
                        initialFocus
                        data-testid="calendar-unpublish"
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                    <Input
                      type="time"
                      value={unpublishTime}
                      onChange={(e) => handleUnpublishTimeChange(e.target.value)}
                      className="w-32 bg-zinc-900/50 border-zinc-700"
                      disabled={disabled}
                      data-testid="input-unpublish-time"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {(scheduledPublishAt || scheduledUnpublishAt) && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <h4 className="text-sm font-medium text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                Schedule Preview
              </h4>
              <div className="bg-zinc-900/50 rounded-lg p-4 space-y-3">
                {scheduleStatus && (
                  <div className="flex items-center gap-2">
                    <Badge
                      className={cn(
                        "text-xs",
                        scheduleStatus.status === "scheduled" &&
                          "bg-orange-500/20 text-orange-500 border-orange-500/30",
                        scheduleStatus.status === "live" &&
                          "bg-green-500/20 text-green-500 border-green-500/30",
                        scheduleStatus.status === "ended" &&
                          "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                      )}
                      data-testid="badge-schedule-status"
                    >
                      {scheduleStatus.label}
                    </Badge>
                  </div>
                )}
                {scheduledPublishAt && (
                  <div className="flex items-center gap-3 text-sm" data-testid="preview-publish">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Goes live:</span>
                    <span className="text-white font-medium">
                      {format(scheduledPublishAt, "PPP 'at' p")}
                    </span>
                  </div>
                )}
                {scheduledUnpublishAt && (
                  <div className="flex items-center gap-3 text-sm" data-testid="preview-unpublish">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Ends:</span>
                    <span className="text-white font-medium">
                      {format(scheduledUnpublishAt, "PPP 'at' p")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
