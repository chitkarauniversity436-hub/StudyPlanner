"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Sparkles, TrendingUp, AlertTriangle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Score {
  subject_name: string;
  score: number;
}

export default function AnalysisPage() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState("");
  const [scores, setScores] = useState<Score[]>([]);

  useEffect(() => {
    const fetchWeaknesses = async () => {
      try {
        const response = await api.get("/tests/weaknesses");
        setAnalysis(response.data.analysis);
        setScores(response.data.scores || []);
      } catch (err) {
        console.error("Failed to fetch analysis", err);
        setAnalysis("Unable to load analysis at this time.");
      } finally {
        setLoading(false);
      }
    };

    fetchWeaknesses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center py-12">
      <div className="w-full max-w-4xl">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Analysis Card */}
          <Card className="flex-1 border-none shadow-xl bg-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-16 bg-gradient-to-bl from-purple-100 to-transparent rounded-bl-full opacity-50 pointer-events-none" />
            <CardHeader className="relative z-10 pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-slate-900">AI Weakness Analysis</CardTitle>
              </div>
              <CardDescription className="text-base text-slate-500">
                Personalized insights based on your recent mock test performances.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-purple-600" />
                  <p>Analyzing your performance...</p>
                </div>
              ) : (
                <div className="prose prose-slate prose-p:leading-relaxed max-w-none whitespace-pre-line text-slate-700 font-medium">
                  {analysis}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Past Scores Card */}
          <Card className="w-full md:w-80 border-none shadow-md bg-white h-fit shrink-0">
            <CardHeader className="bg-slate-50 border-b pb-4 rounded-t-xl">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                Test History
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {scores.length === 0 && !loading ? (
                <div className="text-center text-slate-500 py-4">
                  <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-sm">No test data available.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {scores.map((scoreObj, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 truncate pr-4">{scoreObj.subject_name}</span>
                      <span className={`text-sm font-bold px-2 py-1 rounded-md ${scoreObj.score >= 80 ? 'bg-emerald-100 text-emerald-700' : scoreObj.score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                        {scoreObj.score}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-8">
                <Link href="/mock-tests">
                  <Button variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    Take Another Test
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
