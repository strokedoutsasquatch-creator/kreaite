import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pill, Droplet, Activity, Clock, Bell, Trash2, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const reminderSchema = z.object({
  type: z.enum(["medication", "appointment", "hydration", "exercise", "stand"]),
  title: z.string().min(1),
  description: z.string().optional(),
  time: z.string(),
  days: z.array(z.string()),
});

type ReminderInput = z.infer<typeof reminderSchema>;

const standGoalSchema = z.object({
  hourlyGoal: z.number().min(1).max(4),
  dailyStandTarget: z.number().min(5).max(24),
  startHour: z.number().min(0).max(23),
  endHour: z.number().min(0).max(23),
});

const hydrationGoalSchema = z.object({
  dailyTarget: z.number().min(4).max(16),
  glassSize: z.number().min(4).max(32),
  reminderInterval: z.number().min(15).max(180),
});

const exerciseGoalSchema = z.object({
  dailyMinutes: z.number().min(5).max(180),
  weeklyDays: z.number().min(1).max(7),
});

export default function Reminders() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReminder, setSelectedReminder] = useState<any | null>(null);

  const { data: reminders = [] } = useQuery({
    queryKey: ["/api/reminders"],
    queryFn: async () => {
      const res = await fetch("/api/reminders");
      return res.json();
    },
  });

  const { data: standData } = useQuery({
    queryKey: ["/api/wellness/stand-goal"],
    queryFn: async () => {
      const res = await fetch("/api/wellness/stand-goal");
      return res.json();
    },
  });

  const { data: hydrationData } = useQuery({
    queryKey: ["/api/wellness/hydration-goal"],
    queryFn: async () => {
      const res = await fetch("/api/wellness/hydration-goal");
      return res.json();
    },
  });

  const { data: exerciseData } = useQuery({
    queryKey: ["/api/wellness/exercise-goal"],
    queryFn: async () => {
      const res = await fetch("/api/wellness/exercise-goal");
      return res.json();
    },
  });

  const createReminderMutation = useMutation({
    mutationFn: (data: ReminderInput) => apiRequest("POST", "/api/reminders", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      setOpenDialog(false);
      form.reset();
    },
  });

  const deleteReminderMutation = useMutation({
    mutationFn: (id: number) => apiRequest("DELETE", `/api/reminders/${id}`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/reminders"] }),
  });

  const updateStandGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/wellness/stand-goal", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wellness/stand-goal"] }),
  });

  const logStandMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/stand-log", { duration: 0 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wellness/stand-goal"] }),
  });

  const updateHydrationGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/wellness/hydration-goal", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wellness/hydration-goal"] }),
  });

  const logHydrationMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/hydration-log", { amount: 8 }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wellness/hydration-goal"] }),
  });

  const updateExerciseGoalMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/wellness/exercise-goal", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wellness/exercise-goal"] }),
  });

  const logExerciseMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/wellness/exercise-log", { type: "Walking", duration: 30, intensity: "moderate" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/wellness/exercise-goal"] }),
  });

  const form = useForm<ReminderInput>({
    resolver: zodResolver(reminderSchema),
    defaultValues: {
      type: "medication",
      title: "",
      description: "",
      time: "09:00",
      days: ["daily"],
    },
  });

  const handleAddReminder = (data: ReminderInput) => {
    createReminderMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-black p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-orange-500">Wellness & Reminders</h1>
        <p className="text-gray-400 mb-8">Stay active, hydrated, and on track with your recovery goals</p>

        {/* Wellness Trackers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stand Goal */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-500">
                <Clock className="w-5 h-5" />
                Stand Reminder
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Today: {standData?.todayCount || 0} stands</p>
                <p className="text-2xl font-bold text-orange-500">{standData?.goal?.dailyStandTarget || 12} goal</p>
              </div>
              <Button
                onClick={() => logStandMutation.mutate()}
                disabled={logStandMutation.isPending}
                className="w-full bg-orange-600 hover:bg-orange-700"
                data-testid="button-log-stand"
              >
                Log Stand Now
              </Button>
            </CardContent>
          </Card>

          {/* Hydration Goal */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-500">
                <Droplet className="w-5 h-5" />
                Hydration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Today: {hydrationData?.todayAmount || 0} oz</p>
                <p className="text-2xl font-bold text-blue-500">{(hydrationData?.goal?.dailyTarget || 8) * 8} oz goal</p>
              </div>
              <Button
                onClick={() => logHydrationMutation.mutate()}
                disabled={logHydrationMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
                data-testid="button-log-hydration"
              >
                Log Water
              </Button>
            </CardContent>
          </Card>

          {/* Exercise Goal */}
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-500">
                <Activity className="w-5 h-5" />
                Exercise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-400">Today: {exerciseData?.todayDuration || 0} min</p>
                <p className="text-2xl font-bold text-green-500">{exerciseData?.goal?.dailyMinutes || 30} min goal</p>
              </div>
              <Button
                onClick={() => logExerciseMutation.mutate()}
                disabled={logExerciseMutation.isPending}
                className="w-full bg-green-600 hover:bg-green-700"
                data-testid="button-log-exercise"
              >
                Log Exercise
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Reminders List */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-orange-500" />
                Medication & Appointment Reminders
              </CardTitle>
              <Button
                onClick={() => setOpenDialog(true)}
                className="bg-orange-600 hover:bg-orange-700 gap-2"
                data-testid="button-add-reminder"
              >
                <Plus className="w-4 h-4" />
                Add Reminder
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {reminders.length === 0 ? (
              <p className="text-gray-400 py-8 text-center">No reminders yet. Create one to stay on track!</p>
            ) : (
              <div className="space-y-4">
                {reminders.map((reminder: any) => (
                  <div key={reminder.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-4">
                      {reminder.type === "medication" && <Pill className="w-5 h-5 text-red-500" />}
                      {reminder.type === "appointment" && <Clock className="w-5 h-5 text-blue-500" />}
                      <div>
                        <p className="font-semibold">{reminder.title}</p>
                        <p className="text-sm text-gray-400">{reminder.time} • {reminder.days.join(", ")}</p>
                        {reminder.description && <p className="text-sm text-gray-300">{reminder.description}</p>}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteReminderMutation.mutate(reminder.id)}
                      data-testid={`button-delete-reminder-${reminder.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Reminder Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>Add Reminder</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddReminder)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white">
                        <option value="medication">Medication</option>
                        <option value="appointment">Appointment</option>
                        <option value="stand">Stand</option>
                        <option value="hydration">Hydration</option>
                        <option value="exercise">Exercise</option>
                      </select>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Take medicine" className="bg-gray-800 border-gray-700" data-testid="input-reminder-title" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" className="bg-gray-800 border-gray-700" data-testid="input-reminder-time" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={createReminderMutation.isPending} className="w-full bg-orange-600 hover:bg-orange-700" data-testid="button-submit-reminder">
                Create Reminder
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
