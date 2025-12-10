import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  User, Bell, Shield, Palette, Volume2, Globe, 
  Camera, Check, X, Loader2, Mail, Lock, Eye, EyeOff
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");
  const [usernameInput, setUsernameInput] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { data: settings, isLoading } = useQuery<any>({
    queryKey: ["/api/settings"],
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/recovery/profile"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Settings saved", description: "Your preferences have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not save settings", variant: "destructive" });
    },
  });

  const updateUsernameMutation = useMutation({
    mutationFn: async (username: string) => {
      return apiRequest("POST", "/api/settings/username", { username });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Username updated", description: "Your new username is now active." });
      setUsernameInput("");
      setUsernameAvailable(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Could not update username", 
        variant: "destructive" 
      });
    },
  });

  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/settings/username/check?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      setUsernameAvailable(data.available);
    } catch {
      setUsernameAvailable(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsernameInput(value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
    setUsernameAvailable(null);
  };

  const handleSaveSetting = (key: string, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-400">Please sign in to access settings</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-settings-title">
            Settings
          </h1>
          <p className="text-gray-400">
            Manage your account preferences and customize your recovery experience
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-900 border border-gray-800 p-1">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-profile"
            >
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-notifications"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger 
              value="privacy" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-privacy"
            >
              <Shield className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger 
              value="accessibility" 
              className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
              data-testid="tab-accessibility"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Accessibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Picture</h2>
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-2 border-orange-500">
                    <AvatarImage src={settings?.customAvatarUrl || user.profileImageUrl} />
                    <AvatarFallback className="bg-gray-800 text-2xl">
                      {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    className="absolute bottom-0 right-0 w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center hover-elevate"
                    data-testid="button-change-avatar"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>
                <div>
                  <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                  <p className="text-orange-500 text-sm mt-1">
                    @{settings?.username || "set-username"}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Username</h2>
              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Choose a unique username for your profile. This will be visible to other members.
                </p>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">@</span>
                    <Input
                      value={usernameInput}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      onBlur={() => checkUsername(usernameInput)}
                      placeholder="your-username"
                      className="pl-8 bg-gray-800 border-gray-700 text-white"
                      data-testid="input-username"
                    />
                    {checkingUsername && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                    )}
                    {!checkingUsername && usernameAvailable === true && (
                      <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {!checkingUsername && usernameAvailable === false && (
                      <X className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <Button
                    onClick={() => updateUsernameMutation.mutate(usernameInput)}
                    disabled={!usernameAvailable || updateUsernameMutation.isPending}
                    className="bg-orange-500 hover:bg-orange-600"
                    data-testid="button-save-username"
                  >
                    {updateUsernameMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
                {usernameAvailable === false && (
                  <p className="text-red-400 text-sm">This username is already taken</p>
                )}
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Display Name</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Use display name instead of real name</Label>
                    <p className="text-gray-400 text-sm">Hide your real name from other members</p>
                  </div>
                  <Switch
                    checked={settings?.displayNamePreference === "username"}
                    onCheckedChange={(checked) => 
                      handleSaveSetting("displayNamePreference", checked ? "username" : "real")
                    }
                    data-testid="switch-display-name"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Language & Region</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-white">Language</Label>
                  <Select 
                    defaultValue={settings?.language || "en"}
                    onValueChange={(value) => handleSaveSetting("language", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-white">Timezone</Label>
                  <Select 
                    defaultValue={settings?.timezone || "America/New_York"}
                    onValueChange={(value) => handleSaveSetting("timezone", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-timezone">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Email Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Recovery Reminders</Label>
                    <p className="text-gray-400 text-sm">Daily check-in and exercise reminders</p>
                  </div>
                  <Switch
                    checked={settings?.emailReminders !== false}
                    onCheckedChange={(checked) => handleSaveSetting("emailReminders", checked)}
                    data-testid="switch-email-reminders"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Pod Activity</Label>
                    <p className="text-gray-400 text-sm">Updates from your accountability pod</p>
                  </div>
                  <Switch
                    checked={settings?.emailPodActivity !== false}
                    onCheckedChange={(checked) => handleSaveSetting("emailPodActivity", checked)}
                    data-testid="switch-email-pod"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Achievement Alerts</Label>
                    <p className="text-gray-400 text-sm">Celebrate your milestones</p>
                  </div>
                  <Switch
                    checked={settings?.emailAchievements !== false}
                    onCheckedChange={(checked) => handleSaveSetting("emailAchievements", checked)}
                    data-testid="switch-email-achievements"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Weekly Progress Report</Label>
                    <p className="text-gray-400 text-sm">Summary of your weekly recovery progress</p>
                  </div>
                  <Switch
                    checked={settings?.emailWeeklyReport !== false}
                    onCheckedChange={(checked) => handleSaveSetting("emailWeeklyReport", checked)}
                    data-testid="switch-email-weekly"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Push Notifications</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Enable Push Notifications</Label>
                    <p className="text-gray-400 text-sm">Get real-time updates on your device</p>
                  </div>
                  <Switch
                    checked={settings?.pushEnabled === true}
                    onCheckedChange={(checked) => handleSaveSetting("pushEnabled", checked)}
                    data-testid="switch-push-enabled"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Sound Effects</Label>
                    <p className="text-gray-400 text-sm">Play sounds for notifications</p>
                  </div>
                  <Switch
                    checked={settings?.soundEnabled !== false}
                    onCheckedChange={(checked) => handleSaveSetting("soundEnabled", checked)}
                    data-testid="switch-sound-enabled"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Profile Visibility</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Public Profile</Label>
                    <p className="text-gray-400 text-sm">Allow others to view your profile</p>
                  </div>
                  <Switch
                    checked={settings?.profilePublic !== false}
                    onCheckedChange={(checked) => handleSaveSetting("profilePublic", checked)}
                    data-testid="switch-profile-public"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Show Progress Stats</Label>
                    <p className="text-gray-400 text-sm">Display your recovery stats on your profile</p>
                  </div>
                  <Switch
                    checked={settings?.showProgressStats !== false}
                    onCheckedChange={(checked) => handleSaveSetting("showProgressStats", checked)}
                    data-testid="switch-show-stats"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Show Achievements</Label>
                    <p className="text-gray-400 text-sm">Display your badges and milestones</p>
                  </div>
                  <Switch
                    checked={settings?.showAchievements !== false}
                    onCheckedChange={(checked) => handleSaveSetting("showAchievements", checked)}
                    data-testid="switch-show-achievements"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Community Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Allow Direct Messages</Label>
                    <p className="text-gray-400 text-sm">Let other members message you directly</p>
                  </div>
                  <Switch
                    checked={settings?.allowDirectMessages !== false}
                    onCheckedChange={(checked) => handleSaveSetting("allowDirectMessages", checked)}
                    data-testid="switch-allow-dm"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Activity Feed Visibility</Label>
                    <p className="text-gray-400 text-sm">Who can see your activity posts</p>
                  </div>
                  <Select 
                    defaultValue={settings?.activityFeedVisibility || "public"}
                    onValueChange={(value) => handleSaveSetting("activityFeedVisibility", value)}
                  >
                    <SelectTrigger className="w-32 bg-gray-800 border-gray-700 text-white" data-testid="select-activity-visibility">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Everyone</SelectItem>
                      <SelectItem value="pod">Pod Only</SelectItem>
                      <SelectItem value="private">Just Me</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Visual Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">High Contrast Mode</Label>
                    <p className="text-gray-400 text-sm">Increase contrast for better visibility</p>
                  </div>
                  <Switch
                    checked={settings?.highContrastMode === true}
                    onCheckedChange={(checked) => handleSaveSetting("highContrastMode", checked)}
                    data-testid="switch-high-contrast"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Reduce Motion</Label>
                    <p className="text-gray-400 text-sm">Minimize animations and transitions</p>
                  </div>
                  <Switch
                    checked={settings?.reduceMotion === true}
                    onCheckedChange={(checked) => handleSaveSetting("reduceMotion", checked)}
                    data-testid="switch-reduce-motion"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="space-y-2">
                  <Label className="text-white">Text Size</Label>
                  <Select 
                    defaultValue={settings?.textSize || "medium"}
                    onValueChange={(value) => handleSaveSetting("textSize", value)}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white" data-testid="select-text-size">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Audio Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Screen Reader Optimized</Label>
                    <p className="text-gray-400 text-sm">Optimize content for screen readers</p>
                  </div>
                  <Switch
                    checked={settings?.screenReaderOptimized === true}
                    onCheckedChange={(checked) => handleSaveSetting("screenReaderOptimized", checked)}
                    data-testid="switch-screen-reader"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Audio Descriptions</Label>
                    <p className="text-gray-400 text-sm">Enable audio descriptions for videos</p>
                  </div>
                  <Switch
                    checked={settings?.audioDescriptions === true}
                    onCheckedChange={(checked) => handleSaveSetting("audioDescriptions", checked)}
                    data-testid="switch-audio-descriptions"
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-gray-900 border-gray-800 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Motor Accessibility</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Keyboard Navigation</Label>
                    <p className="text-gray-400 text-sm">Enhanced keyboard controls</p>
                  </div>
                  <Switch
                    checked={settings?.keyboardNavigation !== false}
                    onCheckedChange={(checked) => handleSaveSetting("keyboardNavigation", checked)}
                    data-testid="switch-keyboard-nav"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">One-Handed Mode</Label>
                    <p className="text-gray-400 text-sm">Optimize controls for one-handed use</p>
                  </div>
                  <Switch
                    checked={settings?.oneHandedMode === true}
                    onCheckedChange={(checked) => handleSaveSetting("oneHandedMode", checked)}
                    data-testid="switch-one-handed"
                  />
                </div>
                <Separator className="bg-gray-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white">Large Touch Targets</Label>
                    <p className="text-gray-400 text-sm">Increase size of buttons and controls</p>
                  </div>
                  <Switch
                    checked={settings?.largeTouchTargets === true}
                    onCheckedChange={(checked) => handleSaveSetting("largeTouchTargets", checked)}
                    data-testid="switch-large-touch"
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
