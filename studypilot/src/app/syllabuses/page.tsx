"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, FileText, BookOpen, Search, Calendar, File, Trash2 } from "lucide-react";
import Link from "next/link";
import api from "@/lib/api";

interface Syllabus {
  id: number;
  subject_name: string;
  syllabus_text: string | null;
  file_path: string | null;
}

export default function SyllabusesPage() {
  const [loading, setLoading] = useState(true);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSyllabuses = syllabuses.filter(s => s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    const fetchSyllabuses = async () => {
      try {
        const response = await api.get("/syllabus");
        setSyllabuses(response.data.syllabuses || []);
      } catch (err) {
        console.error("Failed to fetch syllabuses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSyllabuses();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this syllabus and its PDF?")) return;
    try {
      await api.delete(`/syllabus/${id}`);
      setSyllabuses(syllabuses.filter(s => s.id !== id));
    } catch (err) {
      alert("Failed to delete syllabus");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center py-12">
      <div className="w-full max-w-5xl">
        <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>
        
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-indigo-600" />
              My Study Materials
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              View all the PDF syllabuses you have uploaded for your subjects.
            </p>
          </div>
          <Link href="/upload-syllabus">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Upload New Syllabus
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500">
            <Loader2 className="h-10 w-10 animate-spin mb-4 text-indigo-600" />
            <p className="text-lg">Loading your study materials...</p>
          </div>
        ) : syllabuses.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="bg-indigo-100 p-4 rounded-full mb-4">
                <FileText className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Syllabuses Found</h3>
              <p className="text-slate-500 mb-6 max-w-md">
                You haven't uploaded any PDF syllabuses yet. Upload a syllabus to generate a smart study plan and tailored mock tests.
              </p>
              <Link href="/upload-syllabus">
                <Button className="bg-indigo-600 hover:bg-indigo-700">Upload Your First Syllabus</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Search subjects..." 
                className="pl-10 h-12 bg-white border-slate-200 shadow-sm rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {filteredSyllabuses.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No subjects match your search.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {filteredSyllabuses.map((syl, index) => (
                  <div key={`${syl.id}-${index}`} className="group relative">
                    {/* Simulated Stack Effect */}
                    <div className="absolute top-0 left-0 w-full h-full bg-slate-200 rounded-xl transform translate-x-2 translate-y-2 -z-10 transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                    <div className="absolute top-0 left-0 w-full h-full bg-slate-100 rounded-xl transform translate-x-1 translate-y-1 -z-10 transition-transform group-hover:translate-x-1.5 group-hover:translate-y-1.5" />
                    
                    <Card className="border-slate-200 shadow-sm bg-white overflow-hidden flex flex-col h-[400px] transition-all group-hover:-translate-y-1 group-hover:-translate-x-1">
                      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 p-4 flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-sm">
                            <File className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 line-clamp-1">{syl.subject_name}</h3>
                            <div className="flex items-center text-xs text-slate-500 mt-1 gap-2">
                              <span className="flex items-center"><FileText className="h-3 w-3 mr-1"/> {syl.syllabus_text ? Math.round(syl.syllabus_text.length / 5) : 0} words</span>
                              <span>•</span>
                              <span className="flex items-center"><Calendar className="h-3 w-3 mr-1"/> Recently Added</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(syl.id)}>
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      <CardContent className="p-0 flex-1 relative bg-slate-50/50">
                        <div className="absolute inset-0">
                          {syl.file_path ? (
                            <iframe 
                              src={`http://localhost:5000${syl.file_path}`} 
                              className="w-full h-full border-none"
                              title={`${syl.subject_name} PDF`}
                            />
                          ) : syl.syllabus_text ? (
                            <div className="p-6 overflow-y-auto h-full">
                              <div className="text-sm text-slate-700 leading-relaxed space-y-4">
                                <h4 className="text-sm font-semibold tracking-wide text-indigo-600 uppercase mb-2">Extracted Content</h4>
                                <p className="whitespace-pre-wrap font-mono text-xs text-slate-600">{syl.syllabus_text}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-slate-400 italic">
                              No document available.
                            </div>
                          )}
                        </div>
                        {/* Realistic Fade out at bottom (only for text) */}
                        {!syl.file_path && <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />}
                      </CardContent>
                      
                      <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">Ready</span>
                          {syl.file_path && (
                            <a href={`http://localhost:5000${syl.file_path}`} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" variant="ghost" className="h-6 text-xs px-2 text-slate-500 hover:text-indigo-600">Open</Button>
                            </a>
                          )}
                        </div>
                        <Link href="/mock-tests">
                          <Button size="sm" variant="outline" className="text-indigo-600 hover:bg-indigo-50 border-indigo-200">
                            Generate Test
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
