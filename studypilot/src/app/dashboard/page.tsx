"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LogOut, BookOpen, Flame, Calendar, Trophy, PlusCircle, CheckCircle2, BrainCircuit, Rocket, Trash2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface Task {
  id: number;
  task: string;
  status: boolean;
}

interface Stats {
  upcomingExam: string | null;
  studyStreak: number;
  maxStreak: number;
  totalActiveDays: number;
  totalTasksYear: number;
  submissions: { date: string; count: number }[];
  xp: number;
  level: number;
  todayTotalTasks: number;
  todayCompletedTasks: number;
}

const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 4000,
  8: 8000,
  9: 15000,
  10: 30000
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState("");
  const [addingTask, setAddingTask] = useState(false);
  const [stats, setStats] = useState<Stats>({ 
    studyStreak: 0, 
    upcomingExam: null,
    maxStreak: 0,
    totalActiveDays: 0,
    totalTasksYear: 0,
    submissions: [],
    xp: 0,
    level: 1,
    todayTotalTasks: 0,
    todayCompletedTasks: 0
  });
  
  const progressPercentage = stats.todayTotalTasks > 0 ? Math.round((stats.todayCompletedTasks / stats.todayTotalTasks) * 100) : 0;

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
    } else {
      setUser(JSON.parse(userData));
      fetchTasks();
    }
  }, [router]);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/study-plan');
      const formattedTasks = res.data.tasks.map((t: any) => ({
        ...t,
        status: t.status === 1 || t.status === true
      }));
      setTasks(formattedTasks);

      fetchStats();
    } catch (err) {
      console.error("Failed to fetch tasks/stats", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsRes = await api.get('/study-plan/stats');
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  const toggleTask = async (id: number) => {
    // Optimistic UI update
    setTasks(tasks.map(t => t.id === id ? { ...t, status: !t.status } : t));
    try {
      const res = await api.put(`/study-plan/${id}/toggle`);
      // Update heatmap stats dynamically when a task is checked
      fetchTasks();
      fetchStats(); // Fetch stats to update XP!
      
      const toggledTask = tasks.find(t => t.id === id);
      if (!toggledTask?.status) {
        if (res.data.xpData?.leveledUp) {
          toast.success(`🎉 LEVEL UP! You reached Level ${res.data.xpData.level}!`);
        } else {
          toast.success("Task completed! +20 XP 🚀");
        }
      }
    } catch (err) {
      console.error("Failed to toggle task", err);
      toast.error("Failed to update task.");
      // Revert on failure
      setTasks(tasks.map(t => t.id === id ? { ...t, status: !t.status } : t));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    setAddingTask(true);
    try {
      const res = await api.post('/study-plan/custom', { task: newTask });
      setTasks([res.data.task, ...tasks]);
      setNewTask("");
      fetchStats();
      toast.success("Task added successfully!");
    } catch (err) {
      console.error("Failed to add task", err);
      toast.error("Failed to add task");
    } finally {
      setAddingTask(false);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (!confirm("Are you sure you want to remove this task?")) return;
    try {
      await api.delete(`/study-plan/${id}`);
      setTasks(tasks.filter(t => t.id !== id));
      fetchStats();
      toast.success("Task removed!");
    } catch (err) {
      console.error("Failed to delete task", err);
      toast.error("Failed to remove task");
    }
  };

  const handleReplan = async () => {
    try {
      toast.loading("Rescheduling your tasks...", { id: "replan" });
      const res = await api.post('/study-plan/replan');
      if (res.data.message) {
        toast.success("Schedules updated successfully!", { id: "replan" });
        fetchTasks();
      }
    } catch (error) {
      toast.error("Failed to replan", { id: "replan" });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="px-6 h-16 flex items-center justify-between border-b bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl text-slate-900">StudyPilot AI</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-600">Welcome, {user.name}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-destructive">
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Here is an overview of your study progress today.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/pomodoro">
              <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">Pomodoro Timer</Button>
            </Link>
            <Button 
              variant="secondary" 
              className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              onClick={handleReplan}
            >
              Auto Replan
            </Button>
            <Link href="/mock-tests">
              <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">Mock Test</Button>
            </Link>
            <Link href="/syllabuses">
              <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                <BookOpen className="mr-2 h-4 w-4" /> My Syllabuses
              </Button>
            </Link>
            <Link href="/upload-syllabus">
              <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
                Upload Syllabus
              </Button>
            </Link>
          </div>
        </div>

        {/* Gamification Level Bar */}
        <Card className="mb-8 border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50 to-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4 group-hover:rotate-12 transition-transform duration-700">
            <Trophy className="w-24 h-24 text-indigo-600" />
          </div>
          <CardContent className="pt-6 relative z-10">
            <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-sm font-semibold text-indigo-500 uppercase tracking-wider mb-1">Your Rank</p>
                <div className="flex items-baseline gap-2">
                  <h2 className="text-3xl font-black text-slate-800">Level {stats.level}</h2>
                  <span className="text-slate-500 text-sm font-medium">{stats.xp} XP total</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium mb-1">Next Level: {XP_THRESHOLDS[stats.level + 1] || 'MAX'} XP</p>
              </div>
            </div>
            
            <div className="relative h-4 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out"
                style={{ 
                  width: `${stats.level >= 10 ? 100 : ((stats.xp - XP_THRESHOLDS[stats.level]) / (XP_THRESHOLDS[stats.level + 1] - XP_THRESHOLDS[stats.level])) * 100}%` 
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-sm bg-white hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Today's Progress</CardTitle>
              <Trophy className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{progressPercentage}%</div>
              <Progress value={progressPercentage} className="h-2 mt-3" />
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-md hover:shadow-lg transition-all hover:scale-[1.02] duration-300 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.studyStreak} Days</div>
              <p className="text-xs text-slate-400 mt-1">{stats.studyStreak > 0 ? "Keep it up!" : "Start today!"}</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-all hover:scale-[1.02] duration-300 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Tasks Completed</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.todayCompletedTasks} / {stats.todayTotalTasks}</div>
              <p className="text-xs text-slate-400 mt-1">Daily goal</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-md hover:shadow-lg transition-all hover:scale-[1.02] duration-300 bg-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Upcoming Exam</CardTitle>
              <Calendar className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stats.upcomingExam || "None"}</div>
              <p className="text-xs text-slate-400 mt-1">Final Goal</p>
            </CardContent>
          </Card>
        </div>

        {/* Contribution Heatmap */}
        <Card className="border-none shadow-sm col-span-1 lg:col-span-2 overflow-hidden bg-white">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-slate-500 mb-6 gap-2">
              <div>
                <span className="text-slate-900 font-bold text-lg">{stats.totalTasksYear}</span> tasks completed in the past one year
              </div>
              <div className="flex space-x-6">
                <span>Total active days: <span className="font-bold text-slate-900">{stats.totalActiveDays}</span></span>
                <span>Max streak: <span className="font-bold text-slate-900">{stats.maxStreak}</span></span>
              </div>
            </div>
            
            <div className="flex overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-200">
              <div className="grid grid-flow-col gap-[3px]" style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}>
                {stats.submissions.map((day, i) => {
                  let colorClass = 'bg-slate-100';
                  if (day.count === 1) colorClass = 'bg-emerald-200';
                  else if (day.count === 2) colorClass = 'bg-emerald-400';
                  else if (day.count === 3) colorClass = 'bg-emerald-600';
                  else if (day.count >= 4) colorClass = 'bg-emerald-800';

                  return (
                    <div 
                      key={i} 
                      className={`w-3.5 h-3.5 rounded-sm ${colorClass} hover:ring-2 hover:ring-slate-400 transition-all cursor-pointer`} 
                      title={`${day.count} tasks on ${day.date}`} 
                    />
                  );
                })}
              </div>
            </div>
            
            <div className="flex justify-end items-center mt-4 text-xs text-slate-400 gap-2">
              <span>Less</span>
              <div className="w-3.5 h-3.5 rounded-sm bg-slate-100"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-200"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-600"></div>
              <div className="w-3.5 h-3.5 rounded-sm bg-emerald-800"></div>
              <span>More</span>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200 shadow-sm col-span-1 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle>Today's Tasks</CardTitle>
                <CardDescription>Check off your tasks as you complete them.</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <form onSubmit={handleAddTask} className="flex gap-2">
                <Input 
                  placeholder="Add a custom task to your to-do list..." 
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={addingTask || !newTask.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                  <PlusCircle className="h-4 w-4 mr-2" /> Add
                </Button>
              </form>

              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-6 text-slate-500">Loading your tasks...</div>
                ) : tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4 border-4 border-indigo-100">
                      <Rocket className="h-10 w-10 text-indigo-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800">Your Journey Begins Here</h3>
                    <p className="text-sm text-slate-500 max-w-sm mt-2 mb-6">
                      You have no active tasks. Upload your first syllabus and let our AI instantly generate your personalized study plan!
                    </p>
                    <Link href="/upload-syllabus">
                      <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md">
                        <PlusCircle className="mr-2 h-4 w-4" /> Upload Syllabus Now
                      </Button>
                    </Link>
                  </div>
                ) : (
                  tasks.map((task) => (
                    <div key={task.id} className={`flex items-center space-x-3 p-4 rounded-xl border transition-all ${task.status ? 'bg-slate-50 border-emerald-100' : 'bg-white border-slate-100 hover:border-indigo-100'}`}>
                      <Checkbox 
                        id={`task-${task.id}`} 
                        checked={task.status} 
                        onCheckedChange={() => toggleTask(task.id)}
                        className={task.status ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" : ""}
                      />
                      <label 
                        htmlFor={`task-${task.id}`} 
                        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1 ${task.status ? 'text-slate-400 line-through' : 'text-slate-700'}`}
                      >
                        {task.task}
                      </label>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" 
                        onClick={() => handleDeleteTask(task.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </main>
    </div>
  );
}
