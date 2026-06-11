import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GraduationCap, Sparkles, BookOpen, Brain, CalendarDays } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Header */}
      <header className="px-6 lg:px-14 h-20 flex items-center justify-between border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2" href="#">
          <div className="bg-primary/10 p-2 rounded-xl">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">StudyPilot AI</span>
        </Link>
        <nav className="flex gap-4 sm:gap-6">
          <Link href="/login">
            <Button variant="ghost" className="font-medium hover:bg-slate-100">Sign In</Button>
          </Link>
          <Link href="/register">
            <Button className="font-semibold bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all">Get Started</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-6 lg:px-8 py-24 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

        <div className="z-10 max-w-4xl space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            <span>The ultimate AI study companion for college students</span>
          </div>
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
            Master your syllabus with <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
              AI-driven planning
            </span>
          </h1>
          <p className="mx-auto max-w-[700px] text-lg sm:text-xl text-slate-600 leading-relaxed">
            Upload your syllabus, set your exam dates, and let AI generate a dynamic, day-by-day study schedule. Ace your exams with personalized mock tests and weakness analysis.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto font-semibold text-lg h-14 px-8 bg-slate-900 text-white hover:bg-slate-800 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
                Start Studying for Free
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="w-full sm:w-auto font-medium text-lg h-14 px-8 border-slate-200 hover:bg-slate-50">
                Explore Features
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="w-full py-24 bg-white">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2">
              <div className="p-4 bg-indigo-100 rounded-2xl">
                <CalendarDays className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Dynamic Planning</h3>
              <p className="text-slate-600">Auto-replanning shifts missed tasks automatically so you never fall behind.</p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2">
              <div className="p-4 bg-purple-100 rounded-2xl">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Smart Weakness Detection</h3>
              <p className="text-slate-600">Analyze your mock test scores and get AI suggestions to improve weak areas.</p>
            </div>
            <div className="flex flex-col items-center space-y-4 text-center p-6 rounded-3xl bg-slate-50 border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-2 sm:col-span-2 lg:col-span-1">
              <div className="p-4 bg-pink-100 rounded-2xl">
                <BookOpen className="h-8 w-8 text-pink-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Mock Tests</h3>
              <p className="text-slate-600">Generate personalized MCQs, short, and long questions tailored to your syllabus.</p>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="w-full py-8 text-center border-t border-slate-200 bg-white">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} StudyPilot AI. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
