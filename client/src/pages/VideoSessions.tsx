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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import {
  Video, Phone, Calendar as CalendarIcon, Clock, Users, Play,
  Plus, Settings, Mic, MicOff, VideoOff, Monitor, PhoneOff,
  MessageSquare, Loader2, ExternalLink, Copy, CheckCircle2
} from "lucide-react";

interface VideoSession {
  id: number;
  hostId: string;
  sessionType: string;
  title: string;
  description: string;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  duration: number | null;
  maxParticipants: number;
  meetingUrl: string | null;
  roomId: string | null;
  recordingUrl: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  host?: {
    firstName: string;
    lastName: string;
    profileImageUrl: string;
  };
  participants?: {
    userId: string;
    role: string;
    status: string;
    user: {
      firstName: string;
      lastName: string;
      profileImageUrl: string;
    };
  }[];
}

export default function VideoSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<VideoSession | null>(null);
  const [inCall, setInCall] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const [sessionForm, setSessionForm] = useState({
    title: "",
    description: "",
    sessionType: "therapy",
    scheduledAt: "",
    maxParticipants: 2,
  });

  const { data: sessions, isLoading } = useQuery<VideoSession[]>({
    queryKey: ["/api/video/sessions"],
    queryFn: async () => {
      const res = await fetch("/api/video/sessions");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/video/sessions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video/sessions"] });
      setCreateDialogOpen(false);
      setSessionForm({ title: "", description: "", sessionType: "therapy", scheduledAt: "", maxParticipants: 2 });
      toast({ title: "Session scheduled!", description: "Participants will be notified" });
    },
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequest("POST", `/api/video/sessions/${sessionId}/join`, {});
    },
    onSuccess: (_, sessionId) => {
      const session = sessions?.find(s => s.id === sessionId);
      if (session) {
        setActiveSession(session);
        setInCall(true);
      }
    },
  });

  const endSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      return apiRequest("POST", `/api/video/sessions/${sessionId}/end`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/video/sessions"] });
      setInCall(false);
      setActiveSession(null);
      toast({ title: "Session ended" });
    },
  });

  const upcomingSessions = sessions?.filter(s => s.status === "scheduled") || [];
  const liveSessions = sessions?.filter(s => s.status === "live") || [];
  const pastSessions = sessions?.filter(s => s.status === "ended") || [];

  const getSessionTypeLabel = (type: string) => {
    switch (type) {
      case "therapy": return "Therapy Session";
      case "pod_meeting": return "Pod Meeting";
      case "coaching": return "Coaching Call";
      case "group_class": return "Group Class";
      default: return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge className="bg-blue-500/20 text-blue-400">Scheduled</Badge>;
      case "live":
        return <Badge className="bg-green-500/20 text-green-400 animate-pulse">Live</Badge>;
      case "ended":
        return <Badge className="bg-gray-500/20 text-gray-400">Ended</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/20 text-red-400">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (inCall && activeSession) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 bg-gray-900">
          <div className="flex items-center gap-3">
            <Video className="w-6 h-6 text-primary" />
            <div>
              <p className="text-white font-medium">{activeSession.title}</p>
              <p className="text-gray-400 text-sm">{getSessionTypeLabel(activeSession.sessionType)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-red-500/20 text-red-400 animate-pulse">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse" />
              Recording
            </Badge>
            <span className="text-gray-400 text-sm">
              <Clock className="w-4 h-4 inline mr-1" />
              00:15:32
            </span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-4 p-4">
          <div className="bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />
            <div className="text-center z-10">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={user?.profileImageUrl} />
                <AvatarFallback className="bg-gray-700 text-primary text-2xl">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-white font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-gray-400 text-sm">You</p>
            </div>
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
                <VideoOff className="w-12 h-12 text-gray-600" />
              </div>
            )}
          </div>

          <div className="bg-gray-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
            <div className="text-center">
              <Avatar className="w-24 h-24 mx-auto mb-4">
                <AvatarImage src={activeSession.host?.profileImageUrl} />
                <AvatarFallback className="bg-gray-700 text-primary text-2xl">
                  {activeSession.host?.firstName?.[0]}{activeSession.host?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <p className="text-white font-medium">
                {activeSession.host?.firstName} {activeSession.host?.lastName}
              </p>
              <p className="text-gray-400 text-sm">Host</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 p-6 bg-gray-900">
          <Button
            size="lg"
            variant={micEnabled ? "outline" : "destructive"}
            onClick={() => setMicEnabled(!micEnabled)}
            className="rounded-full w-14 h-14"
          >
            {micEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>
          <Button
            size="lg"
            variant={videoEnabled ? "outline" : "destructive"}
            onClick={() => setVideoEnabled(!videoEnabled)}
            className="rounded-full w-14 h-14"
          >
            {videoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
          <Button size="lg" variant="outline" className="rounded-full w-14 h-14">
            <Monitor className="w-6 h-6" />
          </Button>
          <Button size="lg" variant="outline" className="rounded-full w-14 h-14">
            <MessageSquare className="w-6 h-6" />
          </Button>
          <Button
            size="lg"
            variant="destructive"
            onClick={() => {
              if (activeSession.hostId === user?.id) {
                endSessionMutation.mutate(activeSession.id);
              } else {
                setInCall(false);
                setActiveSession(null);
              }
            }}
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-video-sessions-title">
              Video Sessions
            </h1>
            <p className="text-gray-400 mt-1">
              Telemedicine and video coaching calls
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" data-testid="button-schedule-session">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Session
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-800 max-w-md">
              <DialogHeader>
                <DialogTitle className="text-white">Schedule Video Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Session Type</label>
                  <Select
                    value={sessionForm.sessionType}
                    onValueChange={(v) => setSessionForm({ ...sessionForm, sessionType: v })}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="therapy">Therapy Session</SelectItem>
                      <SelectItem value="coaching">Coaching Call</SelectItem>
                      <SelectItem value="pod_meeting">Pod Meeting</SelectItem>
                      <SelectItem value="group_class">Group Class</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Title</label>
                  <Input
                    value={sessionForm.title}
                    onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })}
                    placeholder="Session title..."
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Description</label>
                  <Textarea
                    value={sessionForm.description}
                    onChange={(e) => setSessionForm({ ...sessionForm, description: e.target.value })}
                    placeholder="What will be covered..."
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Date & Time</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start bg-gray-800 border-gray-700">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="bg-gray-900 border-gray-800 w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => {
                          setSelectedDate(date);
                          if (date) {
                            setSessionForm({ ...sessionForm, scheduledAt: date.toISOString() });
                          }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Max Participants</label>
                  <Input
                    type="number"
                    value={sessionForm.maxParticipants}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxParticipants: parseInt(e.target.value) })}
                    min={2}
                    max={50}
                    className="bg-gray-800 border-gray-700"
                  />
                </div>
                <Button
                  onClick={() => createSessionMutation.mutate(sessionForm)}
                  disabled={createSessionMutation.isPending || !sessionForm.title}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  {createSessionMutation.isPending ? "Scheduling..." : "Schedule Session"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {liveSessions.length > 0 && (
          <Card className="bg-gradient-to-r from-green-500/10 to-green-500/5 border-green-500/20 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/20 rounded-xl">
                    <Video className="w-8 h-8 text-green-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-white">{liveSessions[0].title}</h3>
                      <Badge className="bg-green-500/20 text-green-400 animate-pulse">Live Now</Badge>
                    </div>
                    <p className="text-gray-400">{getSessionTypeLabel(liveSessions[0].sessionType)}</p>
                  </div>
                </div>
                <Button
                  onClick={() => joinSessionMutation.mutate(liveSessions[0].id)}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-join-live"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Join Now
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 mb-6">
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">
              Upcoming ({upcomingSessions.length})
            </TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">
              Past ({pastSessions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : upcomingSessions.length > 0 ? (
              upcomingSessions.map((session) => (
                <Card key={session.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          <Video className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                            {getStatusBadge(session.status)}
                          </div>
                          <p className="text-gray-400 text-sm">{getSessionTypeLabel(session.sessionType)}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {format(new Date(session.scheduledAt), "PPP")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {format(new Date(session.scheduledAt), "p")}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {session.participants?.length || 0} / {session.maxParticipants}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.meetingUrl && (
                          <Button size="sm" variant="outline">
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Link
                          </Button>
                        )}
                        <Button
                          onClick={() => joinSessionMutation.mutate(session.id)}
                          className="bg-primary hover:bg-primary/90"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Join
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No upcoming sessions</p>
                <p className="text-gray-500">Schedule a session to get started</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastSessions.length > 0 ? (
              pastSessions.map((session) => (
                <Card key={session.id} className="bg-gray-900 border-gray-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-800 rounded-xl">
                          <Video className="w-6 h-6 text-gray-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-white">{session.title}</h3>
                            {getStatusBadge(session.status)}
                          </div>
                          <p className="text-gray-400 text-sm">{getSessionTypeLabel(session.sessionType)}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{format(new Date(session.scheduledAt), "PPP")}</span>
                            {session.duration && <span>Duration: {session.duration} mins</span>}
                          </div>
                        </div>
                      </div>
                      {session.recordingUrl && (
                        <Button variant="outline" size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          View Recording
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No past sessions</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
