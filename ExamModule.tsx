import React, { useState, useEffect, useMemo } from "react";
import { 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  FileText, 
  ShieldAlert,
  Search,
  Check,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { SaaSApp } from "../types";

export interface ExamQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ExamModuleProps {
  course: SaaSApp;
  onSave: (examJson: string) => Promise<void>;
  isSubmitting: boolean;
}

interface StudentAttempt {
  id: number;
  appId: number;
  studentName: string;
  score: string;
  passed: number; // 0 or 1
  timestamp: string;
}

// Fallback presets matching CourseCertification.tsx for initial load of seeded courses
const PRESET_EXAMS: Record<number, ExamQuestion[]> = {
  1: [
    {
      question: "Which port is the ONLY externally accessible port in the Vision79 container hosting layer?",
      options: ["Port 80", "Port 3000", "Port 5173", "Port 8080"],
      correctAnswer: 1
    },
    {
      question: "When initializing database or API client SDKs requiring secret environment variables, what is the safest pattern to prevent server startup crashes?",
      options: [
        "Initialize the client globally at top-level module load time",
        "Export a global constant initialized with non-null assertion",
        "Use lazy initialization (instantiate on-demand) with proper guards and clean error reporting",
        "Store the raw API key inside public client-side components with the VITE_ prefix"
      ],
      correctAnswer: 2
    },
    {
      question: "For full-stack apps running under standard node launch commands, which command compiles TypeScript outputs into a single bundled CJS server format?",
      options: [
        "vite dev --port 3000",
        "esbuild server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs",
        "tsc --noEmit --watch",
        "node dist/server.cjs"
      ],
      correctAnswer: 1
    }
  ],
  2: [
    {
      question: "What is the primary benefit of React Server Components (RSCs)?",
      options: [
        "They enable rapid client-side mutations with standard useState hooks",
        "They execute code inside secure web-worker threads in the client browser",
        "They fetch data and render directly on the server, serving static HTML payloads to decrease client JavaScript size",
        "They replace standard SQL databases entirely"
      ],
      correctAnswer: 2
    },
    {
      question: "Which protocol is utilized under the hood when executing Next.js 15 Server Actions?",
      options: [
        "A standard HTTP POST request directed to an encrypted server endpoint",
        "A real-time TCP WebSocket channel",
        "A client-side indexedDB transaction",
        "An automated compile-time build step"
      ],
      correctAnswer: 0
    },
    {
      question: "Why should sensitive environment keys NEVER be prefixed with 'VITE_' or 'NEXT_PUBLIC_'?",
      options: [
        "Because it makes the build fail with fatal syntax errors",
        "Because it bundles the secret keys into client-side code, exposing them to the public browser inspector",
        "Because it prevents Node from running database queries",
        "Because it limits network throughput"
      ],
      correctAnswer: 1
    }
  ],
  3: [
    {
      question: "How does Rust guarantee thread-safe memory handling without utilizing a garbage collector?",
      options: [
        "Through dynamic shared reference counting on virtual machines",
        "Using ownership, strict borrow checker rules, and compile-time lifetimes",
        "By serializing all operations into a single-threaded runtime lock",
        "By restricting integer ranges dynamically"
      ],
      correctAnswer: 1
    },
    {
      question: "Which async engine is standard for designing highly concurrent systems-level services in Rust?",
      options: [
        "The native OS thread scheduler",
        "Green threading virtual layers",
        "The Tokio async event loop",
        "The standard browser event-loop"
      ],
      correctAnswer: 2
    },
    {
      question: "What is the primary architectural advantage of using Zero-Copy deserialization?",
      options: [
        "It speeds up file downloads over low latency networks",
        "It references raw byte slices directly from input buffers without allocating new memory strings",
        "It deletes unused database tables automatically",
        "It compresses CSS stylesheets"
      ],
      correctAnswer: 1
    }
  ]
};

export function ExamModule({ course, onSave, isSubmitting }: ExamModuleProps) {
  const [activeSubTab, setActiveSubTab] = useState<"editor" | "progress">("editor");
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [studentAttempts, setStudentAttempts] = useState<StudentAttempt[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Initialize questions from course.exam or fallbacks
  useEffect(() => {
    if (course.exam) {
      try {
        const parsed = JSON.parse(course.exam);
        if (Array.isArray(parsed)) {
          setQuestions(parsed);
          return;
        }
      } catch (e) {
        console.error("Failed to parse course exam state:", e);
      }
    }

    // Fallback template matching course id, or a starter template
    const fallback = PRESET_EXAMS[course.id];
    if (fallback) {
      setQuestions(JSON.parse(JSON.stringify(fallback)));
    } else {
      setQuestions([
        {
          question: "Sample Question: What is the primary purpose of server-side state hydration?",
          options: [
            "To connect clients dynamically to SQLite servers",
            "To synchronize server-rendered HTML markup with interactive client-side React event listeners",
            "To compress client-side background images",
            "To compile CJS bundles via esbuild"
          ],
          correctAnswer: 1
        }
      ]);
    }
  }, [course.id, course.exam]);

  // Load student attempts
  const fetchStudentAttempts = async () => {
    setLoadingAttempts(true);
    try {
      const res = await fetch(`/api/exam/attempts?appId=${encodeURIComponent(course.id)}`);
      if (res.ok) {
        const data = await res.json();
        setStudentAttempts(data);
      }
    } catch (e) {
      console.error("Failed to load student attempts:", e);
    } finally {
      setLoadingAttempts(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === "progress") {
      fetchStudentAttempts();
    }
  }, [activeSubTab, course.id]);

  // Filter attempts for the selected course
  const filteredAttempts = useMemo(() => {
    return studentAttempts.filter(att => {
      if (att.appId !== course.id) return false;
      if (!searchQuery) return true;
      return att.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [studentAttempts, course.id, searchQuery]);

  // Handle saving
  const handleSaveExam = () => {
    // Validate exam has at least one question
    if (questions.length === 0) {
      alert("Validation Error: Please define at least one exam question.");
      return;
    }

    // Validate each question has at least two options and a valid correctAnswer
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Validation Error: Question #${i + 1} has no text.`);
        return;
      }
      if (!q.options || q.options.length < 2) {
        alert(`Validation Error: Question #${i + 1} must have at least 2 choice options.`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        alert(`Validation Error: Question #${i + 1} contains empty choice values.`);
        return;
      }
      if (q.correctAnswer < 0 || q.correctAnswer >= q.options.length) {
        alert(`Validation Error: Question #${i + 1} correct answer index is out of bounds.`);
        return;
      }
    }

    onSave(JSON.stringify(questions));
  };

  // Add a new blank question
  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question: "New Question Text?",
        options: ["Option A", "Option B", "Option C"],
        correctAnswer: 0
      }
    ]);
  };

  // Delete a question
  const handleDeleteQuestion = (qIdx: number) => {
    const updated = questions.filter((_, idx) => idx !== qIdx);
    setQuestions(updated);
  };

  // Update question text
  const handleUpdateQuestionText = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].question = val;
    setQuestions(updated);
  };

  // Update option text
  const handleUpdateOptionText = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  // Add an option to a question
  const handleAddOption = (qIdx: number) => {
    const updated = [...questions];
    updated[qIdx].options.push(`New Option ${String.fromCharCode(65 + updated[qIdx].options.length)}`);
    setQuestions(updated);
  };

  // Remove an option from a question
  const handleRemoveOption = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    if (updated[qIdx].options.length <= 2) {
      alert("A question must have at least 2 options.");
      return;
    }
    updated[qIdx].options = updated[qIdx].options.filter((_, idx) => idx !== oIdx);
    // Adjust correct answer if it was deleted or out of index
    if (updated[qIdx].correctAnswer >= updated[qIdx].options.length) {
      updated[qIdx].correctAnswer = updated[qIdx].options.length - 1;
    }
    setQuestions(updated);
  };

  // Set correct answer
  const handleSetCorrectAnswer = (qIdx: number, oIdx: number) => {
    const updated = [...questions];
    updated[qIdx].correctAnswer = oIdx;
    setQuestions(updated);
  };

  // Check if a student attempt is currently on a 48-hour cooldown
  const checkCooldownStatus = (timestamp: string, passed: number) => {
    if (passed === 1) return { onCooldown: false, remaining: "" };
    const attemptTime = new Date(timestamp).getTime();
    const cooldownDuration = 48 * 60 * 60 * 1000;
    const elapsed = Date.now() - attemptTime;
    const remaining = cooldownDuration - elapsed;

    if (remaining > 0) {
      const hours = Math.floor(remaining / (3600 * 1000));
      const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
      return { onCooldown: true, remaining: `${hours}h ${mins}m remaining` };
    }
    return { onCooldown: false, remaining: "" };
  };

  return (
    <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col text-sm">
      
      {/* HEADER SECTION */}
      <div className="p-5 border-b border-zinc-800 bg-zinc-950/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <h3 className="font-semibold text-base text-zinc-100 font-display">
              Course Exam & Certification Portal
            </h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Define dynamic exams and monitor student certification progress for <span className="text-zinc-200 font-medium">"{course.name}"</span>
          </p>
        </div>

        {/* SUB-TABS SELECTOR */}
        <div className="flex p-0.5 bg-zinc-800 rounded-lg border border-zinc-700/60 text-xs font-mono">
          <button
            onClick={() => setActiveSubTab("editor")}
            className={`px-3 py-1.5 rounded-md transition-all font-medium ${
              activeSubTab === "editor" 
                ? "bg-zinc-900 text-white shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Exam Editor ({questions.length})
          </button>
          <button
            onClick={() => setActiveSubTab("progress")}
            className={`px-3 py-1.5 rounded-md transition-all font-medium flex items-center gap-1.5 ${
              activeSubTab === "progress" 
                ? "bg-zinc-900 text-white shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Student Logs
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
          </button>
        </div>
      </div>

      {/* CORE ACTIVE PANEL VIEW */}
      <div className="p-6 flex-1 bg-zinc-950/25 min-h-[350px]">
        
        {/* SUBTAB 1: EXAM EDITOR */}
        {activeSubTab === "editor" && (
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-400">
                ADMIN QUESTIONS CONTROL PANEL
              </span>
              <button
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium font-mono transition-colors shadow-lg cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Question
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10 space-y-2">
                <AlertCircle className="w-8 h-8 text-zinc-500 mx-auto" />
                <p className="text-sm font-medium text-zinc-300">No Questions Defined</p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">Click "Add Question" above to construct a new certified masterclass question block.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="p-5 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-4 shadow-sm relative group hover:border-zinc-700/60 transition">
                    
                    {/* Delete Question Floating Button */}
                    <button
                      onClick={() => handleDeleteQuestion(qIdx)}
                      className="absolute top-4 right-4 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Delete Question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Question Header & Input */}
                    <div className="space-y-1.5 max-w-[90%]">
                      <label className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">
                        QUESTION #{qIdx + 1}
                      </label>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                        placeholder="e.g., Which port is utilized under our reverse proxy middleware layer?"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 font-medium placeholder-zinc-600 focus:outline-none focus:border-indigo-500/50 text-sm transition"
                      />
                    </div>

                    {/* Options Grid */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono tracking-wider text-zinc-400 font-medium">
                          ANSWER CHOICE OPTIONS (Mark correct answer on left)
                        </span>
                        <button
                          onClick={() => handleAddOption(qIdx)}
                          className="text-[10px] font-mono text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
                        >
                          + Add Option
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = q.correctAnswer === oIdx;
                          return (
                            <div 
                              key={oIdx} 
                              className={`flex items-center gap-3 p-2 rounded-lg border transition ${
                                isCorrect 
                                  ? "bg-indigo-500/5 border-indigo-500/30" 
                                  : "bg-zinc-950/45 border-zinc-800/80 hover:border-zinc-700/40"
                              }`}
                            >
                              {/* Correct Answer Selection Radio/Checkbox */}
                              <button
                                onClick={() => handleSetCorrectAnswer(qIdx, oIdx)}
                                className={`w-5 h-5 rounded-full flex items-center justify-center border transition cursor-pointer ${
                                  isCorrect 
                                    ? "bg-indigo-500 border-indigo-400 text-white" 
                                    : "border-zinc-700 hover:border-zinc-500"
                                }`}
                                title="Mark as Correct Answer"
                              >
                                {isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              {/* Option Input */}
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleUpdateOptionText(qIdx, oIdx, e.target.value)}
                                placeholder={`Choice Option ${String.fromCharCode(65 + oIdx)}`}
                                className="flex-1 bg-transparent border-none text-zinc-200 placeholder-zinc-600 focus:outline-none text-xs"
                              />

                              {/* Remove Option Button */}
                              {q.options.length > 2 && (
                                <button
                                  onClick={() => handleRemoveOption(qIdx, oIdx)}
                                  className="text-zinc-600 hover:text-rose-400 p-1 rounded transition"
                                  title="Delete Option"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Footer Save Area */}
                <div className="flex items-center justify-between border-t border-zinc-800 pt-5 mt-6">
                  <div className="text-xs text-zinc-500 font-mono">
                    All changes will be compiled into courses dynamically upon saving.
                  </div>
                  <button
                    onClick={handleSaveExam}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-xs font-semibold font-mono transition-colors shadow-lg cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    {isSubmitting ? "Compiling..." : "Save Exam Questions"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SUBTAB 2: STUDENT PROGRESS LOGS */}
        {activeSubTab === "progress" && (
          <div className="space-y-4">
            
            {/* SEARCH AND CONTROLS */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/40 p-3 rounded-xl border border-zinc-800/80">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search student names..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/30"
                />
              </div>

              <button
                onClick={fetchStudentAttempts}
                className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 px-3 py-2 rounded-lg text-xs font-mono transition"
              >
                Reload Data
              </button>
            </div>

            {loadingAttempts ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-xs font-mono text-zinc-500">Querying live student telemetry logs...</p>
              </div>
            ) : filteredAttempts.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10 space-y-2">
                <Users className="w-8 h-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-medium text-zinc-400">No Student Attempt History Found</p>
                <p className="text-[10px] text-zinc-500 max-w-sm mx-auto">Students taking the masterclass exam will log their pass/fail details on the server instantly.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase tracking-wider bg-zinc-950/20">
                      <th className="py-3 px-4 font-semibold">Student Name</th>
                      <th className="py-3 px-4 font-semibold">Score Achieved</th>
                      <th className="py-3 px-4 font-semibold">Credential Status</th>
                      <th className="py-3 px-4 font-semibold">Cooldown Period Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Attempt Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {filteredAttempts.map((att) => {
                      const cooldown = checkCooldownStatus(att.timestamp, att.passed);
                      return (
                        <tr key={att.id} className="hover:bg-zinc-900/20 transition-all">
                          <td className="py-3 px-4 font-medium text-zinc-200">
                            {att.studentName}
                          </td>
                          <td className="py-3 px-4 font-mono text-zinc-300">
                            {att.score}
                          </td>
                          <td className="py-3 px-4">
                            {att.passed === 1 ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                PASSED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
                                <XCircle className="w-3 h-3" />
                                FAILED
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            {cooldown.onCooldown ? (
                              <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded">
                                <Clock className="w-3 h-3 animate-pulse" />
                                48H COOLDOWN ({cooldown.remaining})
                              </span>
                            ) : att.passed === 1 ? (
                              <span className="text-[10px] font-mono text-zinc-500">
                                Certified (Unconditional)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
                                Elapsed (Eligible to Retake)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-zinc-500">
                            {new Date(att.timestamp).toLocaleString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
