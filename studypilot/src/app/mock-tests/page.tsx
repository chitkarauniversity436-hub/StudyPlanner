"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, BrainCircuit, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
}

export default function MockTestsPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await api.get('/syllabus');
        const subjects = res.data.syllabuses.map((s: any) => s.subject_name);
        setAvailableSubjects(Array.from(new Set(subjects)));
        if (subjects.length > 0 && !subject) {
          setSubject(subjects[0]);
        }
      } catch (err) {
        console.error("Failed to fetch subjects", err);
      }
    };
    fetchSubjects();
  }, []);

  const generateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject) return;

    setLoading(true);
    setScore(null);
    setAnswers({});
    setErrorMsg("");
    
    try {
      const response = await api.post("/tests/generate", { subject_name: subject, question_count: questionCount });
      setQuestions(response.data.questions);
    } catch (err: any) {
      console.error("Failed to generate test", err);
      setErrorMsg(err.response?.data?.error || "Failed to generate test.");
    } finally {
      setLoading(false);
    }
  };

  const submitTest = async () => {
    let currentScore = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        currentScore++;
      }
    });

    const finalScorePercentage = Math.round((currentScore / questions.length) * 100);
    setScore(finalScorePercentage);

    setSubmitting(true);
    try {
      await api.post("/tests/submit", { subject_name: subject, score: finalScorePercentage });
    } catch (err) {
      console.error("Failed to submit score", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center py-12">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
          <Link href="/analysis" className="text-sm font-medium text-indigo-600 hover:underline">
            View Weakness Analysis →
          </Link>
        </div>

        {questions.length === 0 ? (
          <Card className="border-none shadow-xl bg-white overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 bg-gradient-to-bl from-indigo-100 to-transparent rounded-bl-full opacity-50 pointer-events-none" />
            <CardHeader className="text-center pb-8 pt-12 relative z-10">
              <div className="mx-auto bg-indigo-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
                <BrainCircuit className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">AI Mock Test Generator</CardTitle>
              <CardDescription className="text-base text-slate-500 mt-2">
                Enter a subject to generate a quick personalized quiz and test your knowledge.
              </CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <form onSubmit={generateTest} className="space-y-6 max-w-md mx-auto">
                <div className="space-y-3">
                  <Label htmlFor="subject" className="text-base font-semibold">Subject Name</Label>
                  {availableSubjects.length > 0 ? (
                    <select 
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="flex h-12 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="" disabled>Select a subject</option>
                      {availableSubjects.map((sub, i) => (
                        <option key={i} value={sub}>{sub}</option>
                      ))}
                    </select>
                  ) : (
                    <Input 
                      id="subject" 
                      placeholder="e.g. Database Management Systems" 
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="h-12 text-base"
                    />
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="questionCount" className="text-base font-semibold">Number of Questions</Label>
                  <Input 
                    id="questionCount" 
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value) || 5)}
                    className="h-12 text-base"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm font-medium">
                    {errorMsg}
                  </div>
                )}

                <Button type="submit" className="w-full h-14 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.02]" disabled={loading || !subject}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating Test...
                    </>
                  ) : (
                    "Generate Test"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-none shadow-md bg-indigo-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl">{subject} Mock Test</CardTitle>
                <CardDescription className="text-indigo-200">Answer the questions below and submit to see your score.</CardDescription>
              </CardHeader>
            </Card>

            {questions.map((q, index) => (
              <Card key={q.id} className={`border-slate-200 shadow-sm ${score !== null ? (answers[q.id] === q.correctAnswer ? 'border-emerald-500 bg-emerald-50' : 'border-destructive bg-red-50') : ''}`}>
                <CardHeader>
                  <CardTitle className="text-lg leading-relaxed flex items-start gap-3">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-md text-sm shrink-0">Q{index + 1}</span>
                    {q.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {q.options.map((opt) => (
                      <label 
                        key={opt} 
                        className={`flex items-center space-x-3 p-4 rounded-xl border cursor-pointer transition-all ${answers[q.id] === opt ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 hover:bg-slate-50'} ${score !== null && 'pointer-events-none'}`}
                      >
                        <input
                          type="radio"
                          name={`question-${q.id}`}
                          value={opt}
                          checked={answers[q.id] === opt}
                          onChange={() => setAnswers({ ...answers, [q.id]: opt })}
                          className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-600"
                          disabled={score !== null}
                        />
                        <span className="text-slate-700 font-medium">{opt}</span>
                        {score !== null && opt === q.correctAnswer && <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-500" />}
                        {score !== null && answers[q.id] === opt && answers[q.id] !== q.correctAnswer && <XCircle className="ml-auto h-5 w-5 text-destructive" />}
                      </label>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {score === null ? (
              <Button onClick={submitTest} className="w-full h-14 text-lg font-semibold shadow-md" disabled={Object.keys(answers).length < questions.length || submitting}>
                {submitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Submit Test"}
              </Button>
            ) : (
              <Card className="border-none shadow-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-center p-8">
                <CardTitle className="text-3xl mb-2">Test Complete!</CardTitle>
                <div className="text-6xl font-extrabold my-4">{score}%</div>
                <p className="text-emerald-100 font-medium text-lg mb-6">Your score has been saved for weakness analysis.</p>
                <div className="flex justify-center gap-4">
                  <Button variant="secondary" onClick={() => setQuestions([])}>Take Another Test</Button>
                  <Link href="/analysis">
                    <Button variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-teal-600">View Analysis</Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
