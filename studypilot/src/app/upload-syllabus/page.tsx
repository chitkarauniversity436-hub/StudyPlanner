"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UploadCloud, FileText, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

export default function UploadSyllabusPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !subject) {
      setError("Please provide a subject name and select a PDF file.");
      return;
    }

    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("syllabus", file);
    formData.append("subject_name", subject);

    try {
      await api.post("/syllabus/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      // Assuming successful upload and AI plan generation
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to upload syllabus. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-2xl">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <Card className="border-none shadow-xl bg-white">
          <CardHeader className="text-center pb-8 pt-10">
            <div className="mx-auto bg-indigo-100 p-4 rounded-full mb-4 w-16 h-16 flex items-center justify-center">
              <UploadCloud className="h-8 w-8 text-indigo-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">Upload Syllabus</CardTitle>
            <CardDescription className="text-base text-slate-500 mt-2">
              Upload your course syllabus PDF and let AI generate your personalized study plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="subject" className="text-base font-semibold">Subject Name</Label>
                <Input 
                  id="subject" 
                  placeholder="e.g. Data Structures and Algorithms" 
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-12 text-base"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-base font-semibold">Syllabus PDF</Label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleFileChange} 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {file ? (
                    <div className="flex flex-col items-center text-indigo-600">
                      <FileText className="h-10 w-10 mb-3" />
                      <span className="font-medium">{file.name}</span>
                      <span className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500">
                      <UploadCloud className="h-10 w-10 mb-3 text-slate-400" />
                      <span className="font-medium text-slate-700">Click to upload or drag and drop</span>
                      <span className="text-sm mt-1">PDF files only (Max 10MB)</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-14 text-lg font-semibold bg-indigo-600 hover:bg-indigo-700" disabled={loading || !file || !subject}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing Syllabus...
                  </>
                ) : (
                  "Generate Study Plan"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
