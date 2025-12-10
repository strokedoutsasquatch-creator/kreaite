import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { 
  Users, Calendar, Video, FileText, Plus, Settings, 
  Activity, TrendingUp, Clock, CheckCircle2, AlertCircle,
  Loader2, User, ClipboardList, MessageSquare, BarChart3
} from "lucide-react";

interface PatientAssignment {
  id: number;
  therapistId: string;
  patientId: string;
  status: string;
  goals: string[];
  sessionFrequency: string;
  createdAt: string;
}

interface TherapySession {
  id: number;
  therapistId: string;
  patientId: string;
  assignmentId: number;
  scheduledAt: string;
  status: string;
  sessionType: string;
  notes?: string;
}

export default function TherapistDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("patients");
  const [newSessionOpen, setNewSessionOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

  const { data: therapistProfile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/api/therapist/profile"],
  });

  const { data: patients, isLoading: patientsLoading } = useQuery<PatientAssignment[]>({
    queryKey: ["/api/therapist/patients"],
    enabled: !!therapistProfile,
  });

  const { data: sessions } = useQuery<TherapySession[]>({
    queryKey: ["/api/therapy/sessions"],
    enabled: !!therapistProfile,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/therapy/sessions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapy/sessions"] });
      setNewSessionOpen(false);
      toast({ title: "Session scheduled", description: "Therapy session has been scheduled." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not schedule session", variant: "destructive" });
    },
  });

  const saveProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/therapist/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/profile"] });
      toast({ title: "Profile saved", description: "Your therapist profile has been updated." });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-400">Please sign in to access the therapist dashboard</p>
        </Card>
      </div>
    );
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  if (!therapistProfile) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Card className="bg-gray-900 border-gray-800 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 rounded-full bg-orange-500/20 flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-orange-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">Create Therapist Profile</h1>
              <p className="text-gray-400">
                Set up your professional profile to start managing patients
              </p>
            </div>
            
            <TherapistProfileForm onSave={(data) => saveProfileMutation.mutate(data)} />
          </Card>
        </div>
      </div>
    );
  }

  const upcomingSessions = sessions?.filter(s => 
    s.status === "scheduled" && new Date(s.scheduledAt) > new Date()
  ).slice(0, 5);

  const activePatients = patients?.filter(p => p.status === "active") || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-therapist-title">
              Therapist Dashboard
            </h1>
            <p className="text-gray-400">
              Manage your patients and therapy sessions
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={therapistProfile.isVerified ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}>
              {therapistProfile.isVerified ? "Verified" : "Pending Verification"}
            </Badge>
            <Button variant="outline" className="border-gray-700" data-testid="button-edit-profile">
              <Settings className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{activePatients.length}</p>
                <p className="text-gray-400 text-sm">Active Patients</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{upcomingSessions?.length || 0}</p>
                <p className="text-gray-400 text-sm">Upcoming Sessions</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {sessions?.filter(s => s.status === "completed").length || 0}
                </p>
                <p className="text-gray-400 text-sm">Sessions Complete</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {therapistProfile.yearsExperience || 0}+
                </p>
                <p className="text-gray-400 text-sm">Years Experience</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800 p-1">
            <TabsTrigger 
              value="patients" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-patients"
            >
              <Users className="w-4 h-4 mr-2" />
              Patients
            </TabsTrigger>
            <TabsTrigger 
              value="sessions" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-sessions"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Sessions
            </TabsTrigger>
            <TabsTrigger 
              value="prescriptions" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-prescriptions"
            >
              <ClipboardList className="w-4 h-4 mr-2" />
              Prescriptions
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-analytics"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patients" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Your Patients</h2>
              <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-add-patient">
                <Plus className="w-4 h-4 mr-2" />
                Add Patient
              </Button>
            </div>
            
            {patientsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              </div>
            ) : activePatients.length > 0 ? (
              <div className="grid gap-4">
                {activePatients.map((patient) => (
                  <Card 
                    key={patient.id} 
                    className="bg-gray-900 border-gray-800 p-6"
                    data-testid={`card-patient-${patient.id}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gray-800 text-orange-400">
                            P
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-white">Patient #{patient.patientId.slice(0, 8)}</h3>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Clock className="w-3 h-3" />
                            {patient.sessionFrequency || "Weekly"} sessions
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Started</p>
                          <p className="text-white">{format(new Date(patient.createdAt), "MMM d, yyyy")}</p>
                        </div>
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          {patient.status}
                        </Badge>
                        <Button variant="outline" className="border-gray-700" data-testid={`button-view-patient-${patient.id}`}>
                          View Details
                        </Button>
                      </div>
                    </div>
                    {patient.goals && patient.goals.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <p className="text-sm text-gray-400 mb-2">Goals</p>
                        <div className="flex flex-wrap gap-2">
                          {patient.goals.map((goal, i) => (
                            <Badge key={i} variant="outline" className="text-gray-300 border-gray-600">
                              {goal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800 p-12 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No patients yet</h3>
                <p className="text-gray-400 mb-6">
                  Add patients to start managing their recovery journey.
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Patient
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Therapy Sessions</h2>
              <Dialog open={newSessionOpen} onOpenChange={setNewSessionOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600" data-testid="button-schedule-session">
                    <Plus className="w-4 h-4 mr-2" />
                    Schedule Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800">
                  <DialogHeader>
                    <DialogTitle className="text-white">Schedule New Session</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Create a new therapy session with a patient.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label className="text-white">Patient</Label>
                      <Select onValueChange={setSelectedPatient}>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {activePatients.map((p) => (
                            <SelectItem key={p.id} value={p.patientId}>
                              Patient #{p.patientId.slice(0, 8)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Session Type</Label>
                      <Select>
                        <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video Call</SelectItem>
                          <SelectItem value="in_person">In Person</SelectItem>
                          <SelectItem value="phone">Phone Call</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white">Date & Time</Label>
                      <Input type="datetime-local" className="bg-gray-800 border-gray-700 text-white" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setNewSessionOpen(false)} className="border-gray-700">
                      Cancel
                    </Button>
                    <Button 
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => createSessionMutation.mutate({ 
                        patientId: selectedPatient,
                        sessionType: "video",
                        scheduledAt: new Date().toISOString(),
                      })}
                    >
                      Schedule
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {upcomingSessions && upcomingSessions.length > 0 ? (
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <Card key={session.id} className="bg-gray-900 border-gray-800 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                          {session.sessionType === "video" ? (
                            <Video className="w-6 h-6 text-blue-400" />
                          ) : (
                            <User className="w-6 h-6 text-blue-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">
                            {session.sessionType === "video" ? "Video Session" : "In-Person Session"}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            {format(new Date(session.scheduledAt), "EEEE, MMM d 'at' h:mm a")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-500/20 text-blue-400">
                          {session.status}
                        </Badge>
                        {session.sessionType === "video" && (
                          <Button className="bg-orange-500 hover:bg-orange-600">
                            <Video className="w-4 h-4 mr-2" />
                            Join Call
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800 p-12 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No upcoming sessions</h3>
                <p className="text-gray-400">
                  Schedule a session with a patient to get started.
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="prescriptions" className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Exercise Prescriptions</h2>
            <Card className="bg-gray-900 border-gray-800 p-12 text-center">
              <ClipboardList className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Prescribe Exercises</h3>
              <p className="text-gray-400 mb-6">
                Create custom exercise programs for your patients.
              </p>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus className="w-4 h-4 mr-2" />
                Create Prescription
              </Button>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Patient Analytics</h2>
            <Card className="bg-gray-900 border-gray-800 p-12 text-center">
              <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Coming Soon</h3>
              <p className="text-gray-400">
                Patient progress tracking and outcome analytics will be available here.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function TherapistProfileForm({ onSave }: { onSave: (data: any) => void }) {
  const [formData, setFormData] = useState({
    licenseNumber: "",
    licenseState: "",
    specializations: [] as string[],
    bio: "",
    yearsExperience: "",
    education: "",
    acceptingPatients: true,
  });

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white">License Number</Label>
          <Input
            value={formData.licenseNumber}
            onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="Enter license number"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white">License State</Label>
          <Input
            value={formData.licenseState}
            onChange={(e) => setFormData({ ...formData, licenseState: e.target.value })}
            className="bg-gray-800 border-gray-700 text-white"
            placeholder="e.g., CA, NY, TX"
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-white">Years of Experience</Label>
        <Input
          type="number"
          value={formData.yearsExperience}
          onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Years"
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-white">Education & Credentials</Label>
        <Textarea
          value={formData.education}
          onChange={(e) => setFormData({ ...formData, education: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="List your degrees, certifications, and credentials"
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label className="text-white">Professional Bio</Label>
        <Textarea
          value={formData.bio}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="bg-gray-800 border-gray-700 text-white"
          placeholder="Tell patients about your experience and approach to therapy"
          rows={4}
        />
      </div>
      
      <Button onClick={handleSubmit} className="w-full bg-orange-500 hover:bg-orange-600">
        Create Profile
      </Button>
    </div>
  );
}
