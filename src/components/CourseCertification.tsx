import React, { useState, useEffect, useRef, useMemo } from "react";
import { 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Printer, 
  FileText, 
  RefreshCw, 
  UserCheck, 
  Timer, 
  ChevronRight, 
  Sparkles, 
  X,
  Play
} from "lucide-react";
import { SaaSApp } from "../types";

interface Lecture {
  id: string;
  title: string;
  duration: string;
  videoSimType: "intro" | "setup" | "deepdive" | "advanced";
  freePreview?: boolean;
}

interface CourseCertificationProps {
  course: SaaSApp;
  allLectures: Lecture[];
  completedLectures: Record<string, boolean>;
  onToggleAllLectures: (complete: boolean) => void;
  onToggleLecture: (id: string, completed: boolean) => void;
}

interface ExamQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

// Rigorous, highly relevant exam definitions for our key masterclasses
const COURSE_EXAMS: Record<number, ExamQuestion[]> = {
  1: [ // Full-Stack TypeScript Masterclass
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
  2: [ // Next.js 15 Intensive Bootcamp
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
  3: [ // Rust Systems Design Blueprint
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

const COOLDOWN_DURATION = 48 * 60 * 60 * 1000; // 48 hours in ms

export function CourseCertification({
  course,
  allLectures,
  completedLectures,
  onToggleAllLectures,
  onToggleLecture
}: CourseCertificationProps) {
  
  // Basic states
  const [studentName, setStudentName] = useState<string>(() => {
    try {
      return localStorage.getItem(`vision79-student-name-${course.id}`) || "";
    } catch {
      return "";
    }
  });

  const [examPassed, setExamPassed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`vision79-exam-passed-${course.id}`) === "true";
    } catch {
      return false;
    }
  });

  const [examFailedAt, setExamFailedAt] = useState<number | null>(() => {
    try {
      const val = localStorage.getItem(`vision79-exam-failed-${course.id}`);
      return val ? Number(val) : null;
    } catch {
      return null;
    }
  });

  // Calculate progress metrics
  const totalCount = allLectures.length;
  const completedCount = allLectures.filter(l => completedLectures[l.id]).length;
  const isLecturesComplete = totalCount > 0 && completedCount === totalCount;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Check if course has an exam (either dynamic from course.exam, or fallback to COURSE_EXAMS)
  const examQuestions = useMemo<ExamQuestion[]>(() => {
    if (course.exam) {
      try {
        const parsed = JSON.parse(course.exam);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse custom course exam JSON:", e);
      }
    }
    return COURSE_EXAMS[course.id] || [];
  }, [course.exam, course.id]);

  const hasExam = examQuestions.length > 0;

  // Active exam taking state
  const [isTakingExam, setIsTakingExam] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [examError, setExamError] = useState("");
  const [showCertModal, setShowCertModal] = useState(false);
  
  // Real-time cooldown countdown state
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Generate unique certificate ID (persistent)
  const certificateId = useMemo(() => {
    let stored = null;
    try {
      stored = localStorage.getItem(`vision79-cert-id-${course.id}`);
    } catch {}
    if (stored) return stored;
    
    // Generate simple premium secure hash
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "V79-";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    code += "-";
    for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
    
    try {
      localStorage.setItem(`vision79-cert-id-${course.id}`, code);
    } catch {}
    return code;
  }, [course.id]);

  // Handle student name change
  const handleNameChange = (name: string) => {
    setStudentName(name);
    try {
      localStorage.setItem(`vision79-student-name-${course.id}`, name);
    } catch {}
  };

  // Cooldown calculation hook
  useEffect(() => {
    if (!examFailedAt) {
      setTimeRemaining(0);
      return;
    }

    const updateTimer = () => {
      const elapsed = Date.now() - examFailedAt;
      const rem = COOLDOWN_DURATION - elapsed;
      setTimeRemaining(rem > 0 ? rem : 0);
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [examFailedAt]);

  const formatCooldown = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
  };

  // Submit Exam Answers
  const handleSubmitExam = (e: React.FormEvent) => {
    e.preventDefault();
    setExamError("");

    // Validate that all questions are answered
    if (Object.keys(selectedAnswers).length < examQuestions.length) {
      setExamError("Validation Error: Please select an answer for all exam questions.");
      return;
    }

    // Check answers
    let allCorrect = true;
    let correctCount = 0;
    examQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      } else {
        allCorrect = false;
      }
    });

    const scoreText = `${correctCount}/${examQuestions.length}`;

    // Post progress tracking to server
    fetch("/api/exam/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appId: course.id,
        studentName: studentName.trim() || "Anonymous Student",
        score: scoreText,
        passed: allCorrect
      })
    }).catch(err => console.error("Error saving exam attempt to server:", err));

    if (allCorrect) {
      // SUCCESS!
      setExamPassed(true);
      setExamFailedAt(null);
      setIsTakingExam(false);
      try {
        localStorage.setItem(`vision79-exam-passed-${course.id}`, "true");
        localStorage.removeItem(`vision79-exam-failed-${course.id}`);
      } catch {}
    } else {
      // FAILED
      const failedTimestamp = Date.now();
      setExamFailedAt(failedTimestamp);
      setIsTakingExam(false);
      try {
        localStorage.setItem(`vision79-exam-failed-${course.id}`, String(failedTimestamp));
      } catch {}
      setExamError("Exam score was insufficient (100% correct required to pass). Professional credential protocols require a 48-hour cool-down review period.");
    }
  };

  // Dev bypass cooldown shortcut
  const handleBypassCooldown = () => {
    setExamFailedAt(null);
    setTimeRemaining(0);
    setSelectedAnswers({});
    try {
      localStorage.removeItem(`vision79-exam-failed-${course.id}`);
    } catch {}
  };

  // Dev pass exam shortcut
  const handleDevPassExam = () => {
    setExamPassed(true);
    setExamFailedAt(null);
    setIsTakingExam(false);
    try {
      localStorage.setItem(`vision79-exam-passed-${course.id}`, "true");
      localStorage.removeItem(`vision79-exam-failed-${course.id}`);
    } catch {}
  };

  // Reset exam so they can take it again or test
  const handleResetExam = () => {
    setExamPassed(false);
    setExamFailedAt(null);
    setSelectedAnswers({});
    try {
      localStorage.removeItem(`vision79-exam-passed-${course.id}`);
      localStorage.removeItem(`vision79-exam-failed-${course.id}`);
    } catch {}
  };

  // Drawing Certificate on High-Res Canvas & Downloading PNG
  const handleDownloadPNG = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 1414; // A4 Landscape ratio (1.414)
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nameToPrint = studentName.trim() || "VISION79 SCHOLAR";

    // 1. Background Fill (Antique Cream Ivory style)
    ctx.fillStyle = "#faf8f4";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Beautiful subtle diagonal grid background pattern
    ctx.strokeStyle = "rgba(180, 150, 100, 0.04)";
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let i = 0; i < canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + canvas.height, canvas.height);
      ctx.stroke();
    }

    // 3. Nested elegant classic borders
    // Outer Border
    ctx.strokeStyle = "#1e293b"; // Slate 800
    ctx.lineWidth = 10;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Gold Inner Border
    ctx.strokeStyle = "#d97706"; // Amber 600
    ctx.lineWidth = 3;
    ctx.strokeRect(60, 60, canvas.width - 120, canvas.height - 120);

    // Fine inner accent line
    ctx.strokeStyle = "rgba(30, 41, 59, 0.2)";
    ctx.lineWidth = 1;
    ctx.strokeRect(72, 72, canvas.width - 144, canvas.height - 144);

    // Corner decorative brackets
    const drawCornerDecoration = (x: number, y: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.fillStyle = "#d97706";
      ctx.fillRect(-2, -2, 40, 5);
      ctx.fillRect(-2, -2, 5, 40);
      ctx.restore();
    };
    drawCornerDecoration(85, 85, 0);
    drawCornerDecoration(canvas.width - 85, 85, Math.PI / 2);
    drawCornerDecoration(canvas.width - 85, canvas.height - 85, Math.PI);
    drawCornerDecoration(85, canvas.height - 85, -Math.PI / 2);

    // 4. Header: Business Name & Crest
    ctx.textAlign = "center";
    ctx.fillStyle = "#1e293b";
    ctx.font = "italic bold 28px sans-serif";
    ctx.fillText("VISION79 ICT SYSTEMS INTEGRATION", canvas.width / 2, 180);

    // Subtle underline banner
    ctx.strokeStyle = "rgba(217, 119, 6, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 250, 205);
    ctx.lineTo(canvas.width / 2 + 250, 205);
    ctx.stroke();

    // 5. Main Title
    ctx.fillStyle = "#0f172a"; // Slate 900
    ctx.font = "bold 64px serif";
    ctx.fillText("CERTIFICATE OF GRADUATION", canvas.width / 2, 290);

    ctx.fillStyle = "#475569"; // Slate 600
    ctx.font = "300 italic 24px sans-serif";
    ctx.fillText("This official credential is proudly awarded to", canvas.width / 2, 370);

    // 6. Student Name in large bold script
    ctx.fillStyle = "#4f46e5"; // Indigo 600
    ctx.font = "bold 68px serif";
    ctx.fillText(nameToPrint.toUpperCase(), canvas.width / 2, 460);

    // Underline for student name
    ctx.strokeStyle = "#4f46e5";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2 - 300, 485);
    ctx.lineTo(canvas.width / 2 + 300, 485);
    ctx.stroke();

    // 7. Statement description
    ctx.fillStyle = "#334155"; // Slate 700
    ctx.font = "normal 22px sans-serif";
    ctx.fillText("for successful comprehensive completion of all masterclass lecture hours,", canvas.width / 2, 550);
    ctx.fillText("practical systems integration labs, and professional certification exams for:", canvas.width / 2, 585);

    // 8. Course Title
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(course.name.toUpperCase(), canvas.width / 2, 670);

    // 9. Extra Metadata
    ctx.fillStyle = "#64748b"; // Slate 500
    ctx.font = "mono 18px monospace";
    const compDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    ctx.fillText(`AUTHORIZED COMPLETION ON: ${compDate.toUpperCase()}`, canvas.width / 2, 740);

    // 10. Golden Seal emblem
    const sealX = canvas.width / 2;
    const sealY = 920;
    
    // Outer shiny radial circle
    const grad = ctx.createRadialGradient(sealX, sealY, 10, sealX, sealY, 75);
    grad.addColorStop(0, "#fef08a"); // light yellow
    grad.addColorStop(0.5, "#fbbf24"); // amber 400
    grad.addColorStop(1, "#b45309"); // amber 700
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 75, 0, Math.PI * 2);
    ctx.fill();
    
    // Border star outlines inside seal
    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sealX, sealY, 66, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#78350f";
    ctx.font = "bold 14px sans-serif";
    ctx.fillText("VISION79", sealX, sealY - 15);
    ctx.font = "bold 12px sans-serif";
    ctx.fillText("OFFICIAL", sealX, sealY + 5);
    ctx.fillText("GRADUATE", sealX, sealY + 25);

    // Star icons on left/right of seal text
    ctx.fillText("★ ★ ★", sealX, sealY - 32);
    ctx.fillText("★ ★ ★", sealX, sealY + 44);

    // 11. Dual Signatures lines
    const sigY = 1140;
    
    // Left Signer
    ctx.fillStyle = "#1e293b";
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(350, sigY);
    ctx.lineTo(650, sigY);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "italic bold 24px serif";
    ctx.fillText(course.instructor || "Vision79 Lead Instructor", 500, sigY - 20);
    ctx.fillStyle = "#64748b";
    ctx.font = "14px sans-serif";
    ctx.fillText("AUTHORIZED COURSE EXAMINER", 500, sigY + 25);

    // Right Signer
    ctx.beginPath();
    ctx.moveTo(canvas.width - 650, sigY);
    ctx.lineTo(canvas.width - 350, sigY);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "italic bold 24px serif";
    ctx.fillText("Vision79 Director", canvas.width - 500, sigY - 20);
    ctx.fillStyle = "#64748b";
    ctx.font = "14px sans-serif";
    ctx.fillText("MANAGING DIRECTOR, V79 GROUP", canvas.width - 500, sigY + 25);

    // 12. Bottom Security details
    ctx.fillStyle = "#475569";
    ctx.font = "bold 15px monospace";
    ctx.fillText(`VERIFIED SECURE CERTIFICATE ID: ${certificateId}`, canvas.width / 2, 1310);
    ctx.font = "12px sans-serif";
    ctx.fillText("SECURITY INTEGRITY SEAL VERIFIED • WEST INDIES TECHNOLOGY INGRESS NETWORK", canvas.width / 2, 1335);

    // Trigger program download link
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `VISION79-Certificate-${course.name.replace(/\s+/g, "-")}.png`;
    link.href = dataUrl;
    link.click();
  };

  // Printing trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5">
      {/* 1. PROGRESS METRICS & ACTIONS */}
      <div className="bg-app-bg/45 p-4 rounded-xl border border-app-border space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-app-text-sec uppercase tracking-wider font-bold">Course Telemetry</span>
          <span className="text-indigo-400 font-bold">{progressPercent}% Completed</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-app-input border border-app-border/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-app-text-muted font-mono">
          <span>{completedCount} / {totalCount} sections complete</span>
          <button
            onClick={() => onToggleAllLectures(!isLecturesComplete)}
            className="text-indigo-400 font-bold hover:underline cursor-pointer bg-transparent border-none outline-none"
          >
            {isLecturesComplete ? "Reset Lectures (Dev)" : "Mark All Done (Test)"}
          </button>
        </div>

        {/* Helper Tip */}
        {!isLecturesComplete && (
          <p className="text-[10px] text-amber-500 font-mono leading-relaxed pt-1 flex items-start gap-1.5 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
            <Play className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <span>Complete all lectures in the curriculum block on the left (or click "Mark All Done") to activate the final qualification.</span>
          </p>
        )}
      </div>

      {/* 2. EXAM STATUS CARD */}
      {isLecturesComplete && (
        <div className="bg-app-bg/45 p-4 rounded-xl border border-app-border space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold font-mono uppercase text-app-text flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-400" />
              Course Graduation Exam
            </h4>
            {hasExam ? (
              <span className="text-[8px] bg-red-500/10 border border-red-500/20 text-red-400 font-bold px-2 py-0.5 rounded uppercase font-mono">
                Exam Required
              </span>
            ) : (
              <span className="text-[8px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded uppercase font-mono">
                No Exam Required
              </span>
            )}
          </div>

          {/* Core logic mapping for Exam */}
          {hasExam ? (
            <>
              {examPassed ? (
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 text-center space-y-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-emerald-400">Exam Passed with 100%! 🎉</p>
                    <p className="text-[10px] text-app-text-muted leading-relaxed font-mono">
                      Your systems architecture answers are validated under student certificate hash <strong>{certificateId}</strong>.
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setShowCertModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-mono px-3 py-1.5 rounded-lg flex items-center gap-1 transition cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      View Certificate
                    </button>
                    <button
                      onClick={handleResetExam}
                      className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono px-2 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      Reset Quiz
                    </button>
                  </div>
                </div>
              ) : examFailedAt && timeRemaining > 0 ? (
                // COOLDOWN STATE ACTIVE
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-red-400">Credential Cooldown Active</p>
                      <p className="text-[10px] text-app-text-muted leading-relaxed font-mono">
                        Your previous exam score did not meet the 100% professional benchmark. In compliance with VISION79 training rules, you can re-attempt this exam in:
                      </p>
                    </div>
                  </div>

                  {/* Dynamic Real-time Countdown Timer */}
                  <div className="bg-zinc-950/40 p-2.5 rounded-lg border border-red-500/10 text-center">
                    <div className="text-red-400 font-bold text-sm tracking-widest font-mono flex items-center justify-center gap-1.5">
                      <Timer className="w-4 h-4 text-red-400 animate-spin" />
                      {formatCooldown(timeRemaining)}
                    </div>
                  </div>

                  <div className="border-t border-app-border/20 pt-2 flex flex-col gap-1">
                    <p className="text-[9px] text-app-text-muted leading-normal font-mono">
                      Please review the course modules to secure your integration credentials.
                    </p>
                    
                    {/* Developer test shortcut */}
                    <button
                      onClick={handleBypassCooldown}
                      className="text-[9px] text-indigo-400 font-bold hover:underline text-left mt-1 cursor-pointer font-mono"
                    >
                      💡 Bypass 48-Hour Cooldown (Testing Mode Shortcut)
                    </button>
                  </div>
                </div>
              ) : isTakingExam ? (
                // ACTIVE EXAM SESSION
                <form onSubmit={handleSubmitExam} className="space-y-4">
                  <p className="text-[10px] text-app-text-muted font-mono leading-relaxed bg-indigo-500/5 p-2 rounded border border-indigo-500/10">
                    📝 <strong>Systems Examination</strong>: Answer all technical questions correctly to secure your certified signature. Failures require a 48-hour cool-down.
                  </p>

                  <div className="space-y-4 divide-y divide-app-border/40">
                    {examQuestions.map((q, idx) => (
                      <div key={idx} className={`space-y-2 ${idx > 0 ? "pt-4" : ""}`}>
                        <p className="text-xs font-bold text-app-text font-display leading-snug">
                          {idx + 1}. {q.question}
                        </p>
                        <div className="space-y-1.5">
                          {q.options.map((opt, optIdx) => (
                            <label 
                              key={optIdx} 
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-[11px] leading-relaxed cursor-pointer transition ${
                                selectedAnswers[idx] === optIdx
                                  ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400"
                                  : "bg-app-input border-app-input-border text-app-text-sec hover:border-app-border"
                              }`}
                            >
                              <input 
                                type="radio" 
                                name={`question-${idx}`}
                                value={optIdx}
                                checked={selectedAnswers[idx] === optIdx}
                                onChange={() => setSelectedAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                                className="mt-0.5 shrink-0"
                              />
                              <span className="font-sans font-light">{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {examError && (
                    <div className="p-2 rounded bg-red-500/5 border border-red-500/10 text-[10px] text-red-400 leading-relaxed font-mono">
                      ⚠️ {examError}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      Submit Architecture Exam
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTakingExam(false)}
                      className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-1 border-t border-app-border/20">
                    <button
                      type="button"
                      onClick={handleDevPassExam}
                      className="text-[9px] text-emerald-400 font-bold hover:underline font-mono cursor-pointer bg-transparent border-none outline-none"
                    >
                      🧪 Cheat: Force Pass Exam
                    </button>
                  </div>
                </form>
              ) : (
                // START EXAM PROMPT
                <div className="space-y-3">
                  <p className="text-[11px] text-app-text-sec leading-relaxed">
                    To graduate and unlock your certificate, you must complete a qualification assessment of <strong>{examQuestions.length} technical questions</strong>.
                  </p>
                  
                  <div className="p-3 bg-indigo-500/5 rounded-xl border border-indigo-500/10 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5" />
                      Exam Rules Overview
                    </div>
                    <ul className="text-[10px] text-app-text-muted space-y-1 list-disc pl-4 leading-normal font-sans">
                      <li>Minimum score of 100% correct is required.</li>
                      <li>In case of failure, a <strong>48-hour cool-down</strong> applies before re-attempting.</li>
                      <li>Includes dynamic sandbox architecture, server ports, and safe coding patterns.</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedAnswers({});
                      setExamError("");
                      setIsTakingExam(true);
                    }}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg tracking-wide uppercase transition duration-200 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-4 h-4" />
                    Start Certification Exam
                  </button>
                </div>
              )}
            </>
          ) : (
            // NO EXAM REQUIRED (FREE/LESSON ONLY COURSE)
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3.5 text-center space-y-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-emerald-400">Course Fully Completed! 🎉</p>
                <p className="text-[10px] text-app-text-muted leading-relaxed font-mono">
                  This starter course does not require an exam. You have unlocked your custom certificate!
                </p>
              </div>
              <button
                onClick={() => setShowCertModal(true)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-bold rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Award className="w-4 h-4" />
                View & Customize Certificate
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. CERTIFICATE OVERLAY PREVIEW MODAL */}
      {showCertModal && (
        <div 
          id="certificate-print-area"
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
          onClick={() => setShowCertModal(false)}
        >
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header controls inside modal */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base font-display">Vision79 Secure Certificate Vault</h3>
                  <p className="text-[10px] text-zinc-400 font-mono">Aetherial system verified & blockchain hashed</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCertModal(false)}
                className="p-1 rounded-full text-zinc-500 hover:text-white transition hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Name Customizer */}
            <div className="p-4 bg-zinc-950/60 rounded-xl border border-zinc-800 space-y-2.5">
              <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider block">
                Enter Certificate Recipient Name:
              </label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={studentName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Dr. Angela Yu"
                  className="flex-1 bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleDownloadPNG}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-lg font-mono flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  <Download className="w-4 h-4" />
                  Download PNG
                </button>
              </div>
              <p className="text-[9px] text-zinc-500 font-mono leading-normal">
                Type any name to instantly update the certificate live. Use 'Download PNG' to export a high-resolution, print-ready document.
              </p>
            </div>

            {/* LIVE CERTIFICATE PARCHMENT PREVIEW CARD */}
            <div className="border border-zinc-800 rounded-xl overflow-hidden bg-[#faf8f4] text-zinc-900 p-8 sm:p-12 shadow-xl relative aspect-[1.414/1] flex flex-col justify-between max-w-full print:border-none print:p-0 print:shadow-none select-none">
              
              {/* Luxury thin border elements inside preview */}
              <div className="absolute inset-4 border border-zinc-800/10 rounded-lg pointer-events-none" />
              <div className="absolute inset-5 border-2 border-amber-600/30 rounded pointer-events-none" />
              
              {/* Antique diagonal background texture simulation */}
              <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_top,rgba(0,0,0,0.1),transparent_70%)] pointer-events-none" />

              <div className="text-center space-y-6 relative z-10 flex-1 flex flex-col justify-between py-2">
                
                {/* Logo & Header */}
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono font-bold tracking-[0.25em] text-zinc-700">
                    VISION79 ICT SYSTEMS INTEGRATION
                  </p>
                  <div className="h-0.5 bg-amber-600/30 w-32 mx-auto" />
                </div>

                {/* Main Plaque Titles */}
                <div className="space-y-3">
                  <h2 className="text-xl sm:text-2xl font-extrabold font-serif tracking-normal text-zinc-900">
                    CERTIFICATE OF GRADUATION
                  </h2>
                  <p className="text-[10px] sm:text-xs font-serif italic text-zinc-500">
                    This official credential is proudly awarded to
                  </p>
                  <h3 className="text-2xl sm:text-3.5xl font-extrabold text-indigo-700 tracking-wide underline decoration-amber-600/40 decoration-wavy py-1 uppercase font-serif">
                    {studentName.trim() || "VISION79 SCHOLAR"}
                  </h3>
                </div>

                {/* Body details text */}
                <p className="text-[9px] sm:text-[11px] text-zinc-600 leading-relaxed font-sans max-w-xl mx-auto font-light">
                  for successful comprehensive completion of all masterclass lecture hours, practical systems integration labs, and professional certification exams for the masterclass:
                </p>

                {/* Course Title */}
                <h4 className="text-xs sm:text-base font-extrabold text-zinc-900 uppercase font-mono max-w-lg mx-auto tracking-normal">
                  {course.name}
                </h4>

                {/* Metadata Stamp */}
                <p className="text-[8px] sm:text-[9px] text-zinc-500 font-mono tracking-wider">
                  AUTHORIZED COMPLETION ON: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }).toUpperCase()}
                </p>

                {/* Golden seal representation */}
                <div className="my-1 shrink-0">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700 flex flex-col items-center justify-center text-amber-950 font-bold text-[6px] tracking-tight mx-auto shadow border border-amber-600">
                    <span className="leading-none">★ ★ ★</span>
                    <span className="font-extrabold leading-none my-0.5">V79 SEAL</span>
                    <span className="leading-none">★ ★ ★</span>
                  </div>
                </div>

                {/* dual signature section */}
                <div className="grid grid-cols-2 gap-8 pt-2 max-w-lg mx-auto text-center shrink-0">
                  <div className="border-t border-zinc-400/40 pt-1.5 space-y-0.5">
                    <p className="text-[10px] font-bold font-serif italic text-zinc-800 leading-none">
                      {course.instructor || "Vision79 Lead Instructor"}
                    </p>
                    <p className="text-[7px] text-zinc-500 font-mono font-semibold uppercase tracking-wider">
                      Course Examiner
                    </p>
                  </div>
                  <div className="border-t border-zinc-400/40 pt-1.5 space-y-0.5">
                    <p className="text-[10px] font-bold font-serif italic text-zinc-800 leading-none">
                      Vision79 Director
                    </p>
                    <p className="text-[7px] text-zinc-500 font-mono font-semibold uppercase tracking-wider">
                      Managing Director
                    </p>
                  </div>
                </div>

              </div>

              {/* Secure identifier footer */}
              <div className="flex items-center justify-between text-[7px] text-zinc-400 font-mono border-t border-zinc-200/50 pt-2 shrink-0 mt-3">
                <span>SECURE ID: {certificateId}</span>
                <span>AUTHENTICITY GUARANTEED BY CARIBBEAN TECHNOLOGY REGISTRY</span>
              </div>

            </div>

            {/* Modal actions footer */}
            <div className="flex gap-3 justify-end border-t border-zinc-800 pt-4">
              <button
                onClick={handlePrint}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs px-4 py-2 rounded-lg font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print / Save PDF
              </button>
              <button
                onClick={handleDownloadPNG}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-5 py-2 rounded-lg font-mono flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download PNG Certificate
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
