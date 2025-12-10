import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { 
  Hand, Brain, MessageSquare, Footprints, Trophy, Timer, Target, 
  Star, Play, Lock, Zap, TrendingUp, Award, Flame, ChevronRight,
  Loader2, BarChart3, Clock
} from "lucide-react";

const CATEGORIES = [
  { id: "upper_extremity", name: "Upper Extremity", icon: Hand, description: "Hand, arm, and shoulder exercises", color: "text-orange-400" },
  { id: "cognitive", name: "Cognitive", icon: Brain, description: "Memory, attention, and problem-solving", color: "text-purple-400" },
  { id: "speech_language", name: "Speech & Language", icon: MessageSquare, description: "Aphasia and communication exercises", color: "text-blue-400" },
  { id: "balance_gait", name: "Balance & Gait", icon: Footprints, description: "Walking, posture, and balance", color: "text-green-400" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  advanced: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  expert: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface Exercise {
  id: number;
  name: string;
  slug: string;
  description: string;
  category: string;
  difficulty: string;
  targetArea: string[];
  gameType: string;
  instructions: string;
  estimatedTime: number;
  pointsValue: number;
  isActive: boolean;
}

interface ExerciseScore {
  exerciseId: number;
  highScore: number;
  totalSessions: number;
  averageScore: number;
  averageAccuracy: number;
  totalTime: number;
  streak: number;
  lastPlayedAt: string;
}

export default function Exercises() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [gameActive, setGameActive] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameStartTime, setGameStartTime] = useState<Date | null>(null);

  const { data: exercises, isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises", selectedCategory !== "all" ? selectedCategory : undefined],
  });

  const { data: userScores } = useQuery<ExerciseScore[]>({
    queryKey: ["/api/exercises/scores"],
    enabled: !!user,
  });

  const recordSessionMutation = useMutation({
    mutationFn: async (data: { exerciseId: number; score: number; accuracy: number; duration: number }) => {
      return apiRequest("POST", "/api/exercises/session", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises/scores"] });
      toast({ title: "Session recorded!", description: "Your progress has been saved." });
    },
  });

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.icon || Brain;
  };

  const getScoreForExercise = (exerciseId: number): ExerciseScore | undefined => {
    return userScores?.find(s => s.exerciseId === exerciseId);
  };

  const calculateTotalProgress = () => {
    if (!userScores || userScores.length === 0) return 0;
    const totalSessions = userScores.reduce((sum, s) => sum + s.totalSessions, 0);
    return Math.min(100, totalSessions * 2); // 50 sessions = 100%
  };

  const calculateStreak = () => {
    if (!userScores || userScores.length === 0) return 0;
    return Math.max(...userScores.map(s => s.streak));
  };

  const startExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setGameActive(true);
    setGameScore(0);
    setGameStartTime(new Date());
  };

  const endExercise = (score: number, accuracy: number) => {
    if (!selectedExercise || !gameStartTime) return;
    
    const duration = Math.round((new Date().getTime() - gameStartTime.getTime()) / 1000);
    
    recordSessionMutation.mutate({
      exerciseId: selectedExercise.id,
      score,
      accuracy,
      duration,
    });
    
    setGameActive(false);
    setSelectedExercise(null);
    setGameStartTime(null);
  };

  const filteredExercises = exercises?.filter(e => 
    selectedCategory === "all" || e.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="text-exercises-title">
            Therapeutic Exercise Games
          </h1>
          <p className="text-gray-400 text-lg">
            Build strength, cognition, and confidence through gamified recovery exercises
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{userScores?.length || 0}</p>
                <p className="text-gray-400 text-sm">Exercises Played</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{calculateTotalProgress()}%</p>
                <p className="text-gray-400 text-sm">Overall Progress</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Flame className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{calculateStreak()}</p>
                <p className="text-gray-400 text-sm">Best Streak</p>
              </div>
            </div>
          </Card>
          <Card className="bg-gray-900 border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {userScores ? Math.round(userScores.reduce((sum, s) => sum + s.totalTime, 0) / 60) : 0}m
                </p>
                <p className="text-gray-400 text-sm">Total Time</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            onClick={() => setSelectedCategory("all")}
            className={selectedCategory === "all" ? "bg-orange-500 hover:bg-orange-600" : "border-gray-700 text-gray-300"}
            data-testid="button-category-all"
          >
            All Categories
          </Button>
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "bg-orange-500 hover:bg-orange-600" : "border-gray-700 text-gray-300"}
                data-testid={`button-category-${category.id}`}
              >
                <Icon className={`w-4 h-4 mr-2 ${category.color}`} />
                {category.name}
              </Button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
          </div>
        ) : filteredExercises && filteredExercises.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExercises.map((exercise) => {
              const CategoryIcon = getCategoryIcon(exercise.category);
              const score = getScoreForExercise(exercise.id);
              
              return (
                <Card 
                  key={exercise.id}
                  className="bg-gray-900 border-gray-800 overflow-hidden hover-elevate transition-all duration-300"
                  data-testid={`card-exercise-${exercise.id}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center">
                        <CategoryIcon className="w-7 h-7 text-orange-400" />
                      </div>
                      <Badge 
                        variant="outline" 
                        className={DIFFICULTY_COLORS[exercise.difficulty] || DIFFICULTY_COLORS.beginner}
                      >
                        {exercise.difficulty}
                      </Badge>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-white mb-2">{exercise.name}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{exercise.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Timer className="w-4 h-4" />
                        {exercise.estimatedTime}min
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {exercise.pointsValue} pts
                      </span>
                    </div>

                    {score && (
                      <div className="bg-gray-800 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-400">High Score</span>
                          <span className="text-orange-400 font-bold">{score.highScore}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Sessions</span>
                          <span className="text-white">{score.totalSessions}</span>
                        </div>
                      </div>
                    )}

                    <Button 
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      onClick={() => startExercise(exercise)}
                      data-testid={`button-play-${exercise.id}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {score ? "Play Again" : "Start Exercise"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="bg-gray-900 border-gray-800 p-12 text-center">
            <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No exercises found</h3>
            <p className="text-gray-400">
              {selectedCategory !== "all" 
                ? "Try selecting a different category"
                : "Exercises are being added soon!"}
            </p>
          </Card>
        )}

        <Dialog open={gameActive} onOpenChange={setGameActive}>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-2xl text-white">
                {selectedExercise?.name}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedExercise?.instructions || selectedExercise?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-8">
              <div className="bg-gray-800 rounded-xl p-8 min-h-[300px] flex flex-col items-center justify-center">
                {selectedExercise?.gameType === "finger_tap" && (
                  <FingerTapGame 
                    onComplete={(score, accuracy) => endExercise(score, accuracy)}
                    pointsValue={selectedExercise.pointsValue}
                  />
                )}
                {selectedExercise?.gameType === "memory" && (
                  <MemoryGame 
                    onComplete={(score, accuracy) => endExercise(score, accuracy)}
                    pointsValue={selectedExercise.pointsValue}
                  />
                )}
                {!["finger_tap", "memory"].includes(selectedExercise?.gameType || "") && (
                  <div className="text-center">
                    <Zap className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <p className="text-xl text-white mb-4">Exercise Demo</p>
                    <p className="text-gray-400 mb-6">
                      Follow the on-screen instructions to complete this exercise.
                    </p>
                    <Button 
                      onClick={() => endExercise(Math.floor(Math.random() * 50) + 50, Math.floor(Math.random() * 30) + 70)}
                      className="bg-orange-500 hover:bg-orange-600"
                    >
                      Complete Exercise
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function FingerTapGame({ onComplete, pointsValue }: { onComplete: (score: number, accuracy: number) => void; pointsValue: number }) {
  const [taps, setTaps] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameStarted, setGameStarted] = useState(false);

  const startGame = () => {
    setGameStarted(true);
    setTaps(0);
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTap = () => {
    if (timeLeft > 0) {
      setTaps(prev => prev + 1);
    }
  };

  if (timeLeft === 0 && gameStarted) {
    const score = Math.min(100, Math.round((taps / 60) * 100));
    const accuracy = Math.min(100, Math.round((taps / 45) * 100));
    return (
      <div className="text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <p className="text-3xl font-bold text-white mb-2">{taps} Taps!</p>
        <p className="text-gray-400 mb-4">Score: {score} | Accuracy: {accuracy}%</p>
        <Button onClick={() => onComplete(score, accuracy)} className="bg-orange-500 hover:bg-orange-600">
          Save Results
        </Button>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="text-center">
        <Hand className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <p className="text-xl text-white mb-4">Finger Tap Challenge</p>
        <p className="text-gray-400 mb-6">Tap the button as many times as you can in 30 seconds!</p>
        <Button onClick={startGame} className="bg-orange-500 hover:bg-orange-600">
          Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-5xl font-bold text-orange-500 mb-2">{timeLeft}s</p>
      <p className="text-2xl text-white mb-6">Taps: {taps}</p>
      <button
        onClick={handleTap}
        className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white text-2xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-transform"
      >
        TAP!
      </button>
    </div>
  );
}

function MemoryGame({ onComplete, pointsValue }: { onComplete: (score: number, accuracy: number) => void; pointsValue: number }) {
  const [sequence, setSequence] = useState<number[]>([]);
  const [userSequence, setUserSequence] = useState<number[]>([]);
  const [showingSequence, setShowingSequence] = useState(false);
  const [round, setRound] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [activeButton, setActiveButton] = useState<number | null>(null);

  const colors = ["bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500"];

  const startRound = () => {
    const newSequence = [...sequence, Math.floor(Math.random() * 4)];
    setSequence(newSequence);
    setUserSequence([]);
    setShowingSequence(true);
    
    let i = 0;
    const interval = setInterval(() => {
      if (i >= newSequence.length) {
        clearInterval(interval);
        setActiveButton(null);
        setShowingSequence(false);
        return;
      }
      setActiveButton(newSequence[i]);
      setTimeout(() => setActiveButton(null), 500);
      i++;
    }, 800);
  };

  const handleButtonClick = (index: number) => {
    if (showingSequence) return;
    
    const newUserSequence = [...userSequence, index];
    setUserSequence(newUserSequence);
    setActiveButton(index);
    setTimeout(() => setActiveButton(null), 200);
    
    if (sequence[newUserSequence.length - 1] !== index) {
      setGameOver(true);
      return;
    }
    
    if (newUserSequence.length === sequence.length) {
      setRound(round + 1);
      setTimeout(startRound, 1000);
    }
  };

  if (gameOver) {
    const score = Math.round((round / 10) * 100);
    const accuracy = Math.round((round / (round + 1)) * 100);
    return (
      <div className="text-center">
        <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <p className="text-3xl font-bold text-white mb-2">Round {round - 1} Complete!</p>
        <p className="text-gray-400 mb-4">Score: {score} | Accuracy: {accuracy}%</p>
        <Button onClick={() => onComplete(score, accuracy)} className="bg-orange-500 hover:bg-orange-600">
          Save Results
        </Button>
      </div>
    );
  }

  if (sequence.length === 0) {
    return (
      <div className="text-center">
        <Brain className="w-16 h-16 text-purple-500 mx-auto mb-4" />
        <p className="text-xl text-white mb-4">Memory Sequence Game</p>
        <p className="text-gray-400 mb-6">Watch the sequence and repeat it back!</p>
        <Button onClick={startRound} className="bg-orange-500 hover:bg-orange-600">
          Start Game
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center">
      <p className="text-xl text-white mb-4">Round {round}</p>
      <p className="text-gray-400 mb-6">
        {showingSequence ? "Watch the sequence..." : "Repeat the sequence!"}
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-[200px] mx-auto">
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            onClick={() => handleButtonClick(i)}
            disabled={showingSequence}
            className={`w-20 h-20 rounded-lg ${colors[i]} ${
              activeButton === i ? "ring-4 ring-white scale-110" : ""
            } transition-all duration-200 disabled:opacity-50`}
          />
        ))}
      </div>
    </div>
  );
}
