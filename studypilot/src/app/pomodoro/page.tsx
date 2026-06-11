"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, RotateCcw, Coffee, BookOpen } from "lucide-react";
import Link from "next/link";

type TimerMode = "study" | "break";

export default function PomodoroPage() {
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>("study"); // study or break

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      // Auto switch modes
      if (mode === "study") {
        setMode("break");
        setTimeLeft(5 * 60);
      } else {
        setMode("study");
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
      // Play a sound or notification here
      if (typeof window !== "undefined") {
        new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg').play().catch(e => console.log('Audio play failed'));
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === "study" ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsRunning(false);
    setTimeLeft(newMode === "study" ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progressPercentage = mode === "study" 
    ? ((25 * 60 - timeLeft) / (25 * 60)) * 100 
    : ((5 * 60 - timeLeft) / (5 * 60)) * 100;

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-xl">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <Card className={`border-none shadow-2xl relative overflow-hidden transition-all duration-500 ${mode === "study" ? "bg-indigo-600" : "bg-emerald-500"}`}>
          {/* Circular Progress Indicator Background */}
          <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-0 p-32 bg-black/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          
          <CardHeader className="text-center pb-2 relative z-10">
            <CardTitle className="text-2xl font-bold text-white flex justify-center items-center gap-2">
              {mode === "study" ? <BookOpen className="h-6 w-6" /> : <Coffee className="h-6 w-6" />}
              {mode === "study" ? "Focus Session" : "Short Break"}
            </CardTitle>
            <CardDescription className="text-white/80">
              {mode === "study" ? "Stay focused and complete your tasks." : "Relax and recharge your brain."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center py-8 relative z-10">
            {/* Timer Display */}
            <div className="relative w-64 h-64 flex items-center justify-center mb-8">
              {/* SVG Circle Progress */}
              <svg className="absolute w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="4" 
                />
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="4" 
                  strokeDasharray="283" 
                  strokeDashoffset={283 - (283 * progressPercentage) / 100}
                  className="transition-all duration-1000 ease-linear"
                />
              </svg>
              <span className="text-7xl font-extrabold text-white tracking-tighter tabular-nums drop-shadow-md">
                {formatTime(timeLeft)}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-8">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={resetTimer}
                className="w-12 h-12 rounded-full border-none bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
              <Button 
                onClick={toggleTimer}
                className="w-20 h-20 rounded-full border-none bg-white hover:bg-white/90 text-slate-900 shadow-xl transition-all hover:scale-105"
              >
                {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
              </Button>
            </div>

            {/* Mode Switcher */}
            <div className="flex bg-white/20 p-1 rounded-full backdrop-blur-md">
              <button 
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${mode === "study" ? "bg-white text-indigo-600 shadow-sm" : "text-white hover:bg-white/10"}`}
                onClick={() => switchMode("study")}
              >
                Pomodoro
              </button>
              <button 
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${mode === "break" ? "bg-white text-emerald-600 shadow-sm" : "text-white hover:bg-white/10"}`}
                onClick={() => switchMode("break")}
              >
                Short Break
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
