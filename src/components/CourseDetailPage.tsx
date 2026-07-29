import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, 
  Pause, 
  Volume2, 
  Lock, 
  CheckCircle2, 
  ArrowLeft, 
  Star, 
  BookOpen, 
  Clock, 
  Infinity, 
  CreditCard, 
  ChevronDown, 
  ChevronUp, 
  Award, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Code, 
  Video,
  FileText,
  BadgeAlert,
  Headphones
} from "lucide-react";
import { SaaSApp } from "../types";
import { CourseCertification } from "./CourseCertification";
import ReactMarkdown from "react-markdown";

const getDurationText = (created: string, onboarded?: string) => {
  if (!created || !onboarded) return "";
  const diffMs = new Date(onboarded).getTime() - new Date(created).getTime();
  if (diffMs <= 0) return "instant";
  const diffMins = Math.floor(diffMs / (60 * 1000));
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ${diffHours % 24}h`;
};

interface CourseDetailPageProps {
  course: SaaSApp;
  onBack: () => void;
}

interface Lecture {
  id: string;
  title: string;
  duration: string;
  freePreview?: boolean;
  videoUrl?: string;
  audioUrl?: string;
  readingMaterial?: string;
}

interface Chapter {
  title: string;
  lectures: Lecture[];
}

export function CourseDetailPage({ course, onBack }: CourseDetailPageProps) {
  // Persistence state for course purchases
  const [isEnrolled, setIsEnrolled] = useState<boolean>(false);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);

  // A stable per-device student identifier (previously this was a hardcoded
  // fake value shown to every visitor). It's generated once and persisted so
  // it's at least real and consistent, though it's not tied to a real account
  // since this app has no customer authentication system.
  const [studentId] = useState<string>(() => {
    try {
      const existing = localStorage.getItem("vision79-student-id");
      if (existing) return existing;
      const generated = `v79-${crypto.randomUUID().slice(0, 8)}`;
      localStorage.setItem("vision79-student-id", generated);
      return generated;
    } catch {
      return "v79-guest";
    }
  });
  
  // Completed lectures state
  const [completedLectures, setCompletedLectures] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(`vision79-completed-lectures-${course.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const handleToggleLectureComplete = (lecId: string, completed: boolean) => {
    setCompletedLectures(prev => {
      const updated = { ...prev, [lecId]: completed };
      try {
        localStorage.setItem(`vision79-completed-lectures-${course.id}`, JSON.stringify(updated));
      } catch (e) {
        console.warn("Blocked writing to localStorage:", e);
      }
      return updated;
    });
  };

  const handleToggleAllLectures = (complete: boolean) => {
    const allLecIds = chapters.flatMap(c => c.lectures).map(l => l.id);
    const updated: Record<string, boolean> = {};
    if (complete) {
      allLecIds.forEach(id => {
        updated[id] = true;
      });
    }
    setCompletedLectures(updated);
    try {
      localStorage.setItem(`vision79-completed-lectures-${course.id}`, JSON.stringify(updated));
    } catch (e) {
      console.warn("Blocked writing to localStorage:", e);
    }
  };
  
  // Checking/resetting purchase state based on price/type
  const isPromoActive = (c: any) => {
    if (c.category !== "courses" || !c.createdAt) return false;
    const createdDate = new Date(c.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  };

  const originalPrice = course.price !== undefined && course.price !== null ? Number(course.price) : 0;
  const hasPromo = isPromoActive(course) && originalPrice > 0;
  const displayPrice = hasPromo ? originalPrice * 0.5 : originalPrice;
  const isPaid = displayPrice > 0 || course.pricingType === "premium";

  useEffect(() => {
    if (!isPaid) {
      setIsEnrolled(true);
    } else {
      let stored = null;
      try {
        stored = localStorage.getItem(`vision79-enrolled-${course.id}`);
      } catch (e) {
        console.warn("Blocked accessing localStorage:", e);
      }
      if (stored === "true") {
        setIsEnrolled(true);
      }
    }
  }, [course.id, isPaid]);

  // Collapsible Chapters
  const [expandedChapters, setExpandedChapters] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false
  });

  // Active Info Tab: 'overview' | 'curriculum' | 'notes' | 'qa' | 'resources' | 'feedback'
  const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "notes" | "qa" | "resources" | "feedback">("overview");

  // Feedback/Ratings states
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [ratingInput, setRatingInput] = useState(5);
  const [commentInput, setCommentInput] = useState("");
  const [userNameInput, setUserNameInput] = useState("");
  const [feedbackType, setFeedbackType] = useState<"feedback" | "idea">("idea");

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch(`/api/feedback?appId=${course.id}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (e) {
      console.error("Error fetching feedbacks:", e);
    }
  };

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) {
      setSubmitError("Please write a suggestion or feedback comment.");
      return;
    }
    setIsSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: course.id,
          appName: course.name,
          rating: ratingInput,
          comment: commentInput,
          userName: userNameInput.trim() || "Anonymous Student",
          feedbackType
        })
      });
      if (res.ok) {
        setSubmitSuccess(true);
        setCommentInput("");
        setRatingInput(5);
        setFeedbackType("idea");
        fetchFeedbacks();
      } else {
        const data = await res.json();
        setSubmitError(data.error || "Failed to submit feedback.");
      }
    } catch (err) {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
    // Reset submission feedback states when course changes
    setSubmitSuccess(false);
    setSubmitError("");
    setCommentInput("");
    setRatingInput(5);
    setFeedbackType("idea");
  }, [course.id]);

  // Notes state
  const [studentNote, setStudentNote] = useState<string>(() => {
    try {
      return localStorage.getItem(`vision79-note-${course.id}`) || "";
    } catch (e) {
      console.warn("Blocked accessing localStorage:", e);
      return "";
    }
  });

  // QA State
  const [questions, setQuestions] = useState<Array<{ id: number; author: string; text: string; date: string; replies: Array<{ author: string; text: string; date: string; isInstructor?: boolean }> }>>([]);
  const [newQuestionTxt, setNewQuestionTxt] = useState("");

  // Enrollment state (no payment processor connected - see handleCheckoutSubmit)
  const [isPaying, setIsPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Native <video>/<audio> element playback state (real media only - there is
  // no simulated/fake playback path; lectures without an uploaded video or
  // audio file simply show an honest "not available yet" placeholder).
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  // Apply the chosen playback speed to whichever real media element is
  // currently mounted, so the speed control in the footer actually does
  // something instead of just changing its own highlighted state.
  useEffect(() => {
    if (videoElRef.current) videoElRef.current.playbackRate = playbackSpeed;
    if (audioElRef.current) audioElRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed, activeLecture]);

  const chapters: Chapter[] = useMemo(() => {
    if (course.curriculum) {
      try {
        const parsed = JSON.parse(course.curriculum);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as Chapter[];
        }
      } catch (e) {
        console.error("Failed to parse course curriculum JSON:", e);
      }
    }
    // No real curriculum has been authored for this course yet. Previously
    // this returned a hardcoded fake demo curriculum ("Block 1: Production
    // Core Architecture Swaps & Setup" etc.) with made-up lecture titles and
    // durations - that data didn't correspond to anything real, so it has
    // been removed. Callers should render an empty/curriculum-pending state.
    return [];
  }, [course.curriculum]);

  // Set default initial active lecture
  useEffect(() => {
    if (chapters.length > 0 && chapters[0].lectures.length > 0) {
      setActiveLecture(chapters[0].lectures[0]);
    }
  }, [course.id, chapters]);

  const handleSelectLecture = (lec: Lecture) => {
    if (!isEnrolled && !lec.freePreview) {
      alert("This chapter is premium locked. Complete enrollment payment details on the right to access.");
      return;
    }
    setActiveLecture(lec);
  };

  const handleToggleChapter = (index: number) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Enrollment handler. No payment processor is connected in this app, so
  // this does not collect or simulate charging a card - it honestly records
  // enrollment for this device only.
  const handleCheckoutSubmit = () => {
    setPayError(null);
    setIsPaying(true);
    setIsEnrolled(true);
    try {
      localStorage.setItem(`vision79-enrolled-${course.id}`, "true");
    } catch (e) {
      console.warn("Blocked writing to localStorage:", e);
      setPayError("Couldn't save your enrollment on this device. Check your browser's storage settings and try again.");
      setIsEnrolled(false);
    } finally {
      setIsPaying(false);
    }
  };

  const saveNote = (txt: string) => {
    setStudentNote(txt);
    try {
      localStorage.setItem(`vision79-note-${course.id}`, txt);
    } catch (e) {
      console.warn("Blocked writing to localStorage:", e);
    }
  };

  const submitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionTxt.trim()) return;

    const newQ = {
      id: Date.now(),
      author: "You (Student)",
      text: newQuestionTxt,
      date: "Just now",
      replies: []
    };

    setQuestions([newQ, ...questions]);
    setNewQuestionTxt("");
  };

  return (
    <div id="course-details-layout" className="w-full flex flex-col min-h-screen text-app-text antialiased">
      
      {/* PROFESSIONAL TITLE BACK ACTION BAR */}
      <div className="flex items-center justify-between border-b border-app-border bg-app-aside-bg/30 p-4 sticky top-0 backdrop-blur-md z-40">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-mono font-medium hover:text-indigo-400 text-app-text-sec transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Courses Catalog
        </button>
        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono tracking-wider px-2.5 py-0.5 rounded-full uppercase">
          Vision79 Masterclass
        </span>
      </div>

      {/* MIDNIGHT GRANGE VISION79 HERO banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-indigo-950 text-white p-6 sm:p-10 border-b border-indigo-950 flex flex-col gap-4 relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_40%)]" />
        
        <div className="max-w-4xl relative z-10 space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-yellow-500 text-black font-extrabold uppercase px-2.5 py-0.5 rounded tracking-wide">
              Bestseller
            </span>
            <div className="flex items-center gap-1.5 text-xs text-indigo-400">
              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
              <span className="font-bold text-white text-sm">{course.rating || 4.9}</span>
              <span className="text-zinc-400 font-normal">(1,420 ratings) • 12,504 students</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-white font-display">
            {course.name}
          </h1>
          
          <p className="text-sm sm:text-base text-zinc-300 font-light max-w-2xl">
            {course.subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-mono text-zinc-400">
            <div>
              Instructor: <span className="text-indigo-400 underline font-semibold">{course.instructor || "Dr. Angela Yu"}</span>
            </div>
            <div>
              Last updated: <span className="text-zinc-300">June 2026</span>
            </div>
            <div>
              Language: <span className="text-zinc-300">English [CC]</span>
            </div>
          </div>
        </div>
      </div>

      {/* CORE DOUBLE COLUMNS DETAIL WRAPPER */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CURRICULUM + VIDEO PLAYER + NOTES */}
        <div className="lg:col-span-8 flex flex-col gap-6 min-w-0">
          
          {/* INTERACTIVE VIDEO LESSON SIMULATOR STREAM PLAYER */}
          <div className="relative overflow-hidden rounded-2xl border border-app-border bg-black shadow-2xl group flex flex-col">
            
            {/* STAGE HEADER METRICS */}
            <div className="p-3 bg-zinc-950 border-b border-app-border/40 flex items-center justify-between text-xs font-mono text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="truncate max-w-[240px] text-zinc-200">
                  Streaming {activeLecture ? activeLecture.title : "Initialization"}
                </span>
              </div>
              <span className="text-[10px] text-zinc-500">{activeLecture?.duration} • SIMULATOR</span>
            </div>

            {/* LIVE DISPLAY VIDEO SCREEN CANVAS */}
            <div className="relative aspect-video w-full bg-gradient-to-b from-zinc-950 to-zinc-900 border-b border-app-border/20 flex flex-col items-center justify-center overflow-hidden text-center select-none">
              
              {activeLecture?.videoUrl ? (
                <div className="absolute inset-0 w-full h-full bg-black z-10 select-auto">
                  {(!isEnrolled && !activeLecture.freePreview) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-zinc-950/95 z-20 space-y-4">
                      <Lock className="w-12 h-12 text-indigo-400 animate-pulse" />
                      <p className="text-sm font-semibold tracking-wide text-zinc-100 uppercase font-mono">Subscribe to unlock this Lecture 🔒</p>
                      <p className="text-xs text-zinc-400 max-w-md">Unlock full lifetime access to all {course.lessonsCount || chapters.reduce((sum, c) => sum + c.lectures.length, 0)} curriculum sections today.</p>
                    </div>
                  ) : (
                    <video 
                      ref={videoElRef}
                      src={activeLecture.videoUrl} 
                      controls 
                      className="w-full h-full object-contain" 
                      onClick={(e) => e.stopPropagation()}
                      onLoadedMetadata={() => { if (videoElRef.current) videoElRef.current.playbackRate = playbackSpeed; }}
                    />
                  )}
                </div>
              ) : activeLecture?.audioUrl ? (
                <div className="absolute inset-0 w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-8 z-10 select-auto">
                  {(!isEnrolled && !activeLecture.freePreview) ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-zinc-950/95 z-20 space-y-4">
                      <Lock className="w-12 h-12 text-indigo-400 animate-pulse" />
                      <p className="text-sm font-semibold tracking-wide text-zinc-100 uppercase font-mono">Subscribe to unlock this Lecture 🔒</p>
                      <p className="text-xs text-zinc-400 max-w-md">Unlock full lifetime access to all {course.lessonsCount || chapters.reduce((sum, c) => sum + c.lectures.length, 0)} curriculum sections today.</p>
                    </div>
                  ) : (
                    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-4 shadow-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                          <Headphones className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] text-zinc-500 font-mono tracking-wider">AUDIO LECTURE</p>
                          <p className="text-xs font-bold text-zinc-100 truncate max-w-[280px]">{activeLecture.title}</p>
                        </div>
                      </div>
                      <audio 
                        ref={audioElRef}
                        src={activeLecture.audioUrl} 
                        controls 
                        className="w-full" 
                        onClick={(e) => e.stopPropagation()}
                        onLoadedMetadata={() => { if (audioElRef.current) audioElRef.current.playbackRate = playbackSpeed; }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative z-10 flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600">
                    <Video className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-semibold tracking-wide text-zinc-300">
                    No video or audio has been uploaded for this lecture yet
                  </p>
                  <p className="text-xs text-zinc-500 max-w-sm">
                    {activeLecture?.title || "This lecture"} doesn't have media attached. Check back once the instructor uploads it, or mark it complete manually below once you've reviewed the material.
                  </p>
                </div>
              )}
            </div>

            {/* MEDIA CONTROLS FOOTER (only meaningful once real media exists - native
                <video>/<audio> elements above already provide their own transport
                controls, so this footer is limited to playback-speed preference,
                which the media elements read via playbackRate). */}
            <div className="p-3.5 bg-zinc-950/90 flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
              <div className="flex items-center gap-2 text-zinc-400">
                <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
                <span className="text-[10px] font-mono uppercase bg-zinc-900 border border-zinc-800 px-1 py-0.5 rounded text-zinc-400 font-bold select-none">
                  {activeLecture?.videoUrl || activeLecture?.audioUrl ? "Media Ready" : "No Media"}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center p-0.5 rounded border border-zinc-800 bg-zinc-900">
                  {[1, 1.25, 1.5, 2].map((sp) => (
                    <button
                      key={sp}
                      onClick={() => setPlaybackSpeed(sp)}
                      className={`px-1.5 py-0.5 text-[9px] font-mono rounded cursor-pointer ${playbackSpeed === sp ? "bg-indigo-600 text-white font-bold" : "text-zinc-500"}`}
                    >
                      {sp}x
                    </button>
                  ))}
                </div>
                <div className="text-[10px] text-zinc-400 border border-zinc-800 rounded bg-zinc-900/60 px-2 py-0.5 select-none font-mono">
                  {isEnrolled ? "ENROLLED VIEW" : "PREVIEW MODE"}
                </div>
              </div>
            </div>
          </div>

          {/* LECTURE SUPPLEMENTARY READING MATERIAL & TEXTBOOK STUDY NOTES */}
          {activeLecture && activeLecture.readingMaterial && (
            <div id="lecture-reading-material-section" className="p-6 rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.02] space-y-4 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-3">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-widest text-indigo-400 font-bold">Lecture Reading Material</h4>
                  <p className="text-[10px] text-app-text-muted font-mono leading-none mt-0.5">Supplementary Study Guide & Lesson Notes</p>
                </div>
              </div>
              <div className="text-sm text-app-text-sec leading-relaxed font-sans whitespace-pre-line bg-app-input/30 border border-app-border/40 p-4 rounded-xl">
                {activeLecture.readingMaterial}
              </div>
            </div>
          )}

          {/* LOWER SECTION TABS DECK */}
          <div className="border border-app-border bg-app-aside-bg/30 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex border-b border-app-border bg-app-btn-sec/20 overflow-x-auto scrollbar-none">
              {(["overview", "curriculum", "notes", "qa", "resources", "feedback"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 min-w-[80px] py-3 text-xs font-mono font-medium tracking-wide uppercase transition-all duration-200 cursor-pointer ${
                    activeTab === tab
                      ? "border-b-2 border-indigo-500 text-app-text font-bold"
                      : "text-app-text-muted hover:text-app-text"
                  }`}
                >
                  {tab === "overview" ? "About" :
                   tab === "curriculum" ? "Curriculum" :
                   tab === "notes" ? "Notes" :
                   tab === "qa" ? "Q&A" :
                   tab === "resources" ? "Resources" : "Feedback"}
                </button>
              ))}
            </div>

            {/* TAB PANELS CONTAINER */}
            <div className="p-5 sm:p-6 min-h-[280px]">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-mono text-app-text-muted pb-1">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>About This Course / Technical Solution Overview</span>
                    </div>
                    {course.description && (
                      <div className="bg-app-bg/40 border border-app-border/60 p-5 rounded-xl whitespace-pre-line leading-relaxed text-xs sm:text-sm text-app-text-sec">
                        {course.description}
                      </div>
                    )}
                    {course.syllabus ? (
                      <div className="space-y-3 pt-2">
                        <h3 className="text-sm font-semibold tracking-wide text-app-text uppercase font-mono border-b border-app-border pb-2 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-400" />
                          Course Syllabus & Overview
                        </h3>
                        <div className="markdown-body text-xs sm:text-sm text-app-text-sec leading-relaxed p-5 bg-app-bg/25 border border-app-border/40 rounded-xl space-y-3">
                          <ReactMarkdown>{course.syllabus}</ReactMarkdown>
                        </div>
                      </div>
                    ) : !course.description ? (
                      <div className="bg-app-bg/40 border border-app-border/60 p-5 rounded-xl text-xs sm:text-sm text-app-text-muted italic">
                        No overview or syllabus text provided for this course yet.
                      </div>
                    ) : null}
                  </motion.div>
                )}
                {activeTab === "curriculum" && (
                  <motion.div
                    key="curriculum-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between text-xs text-app-text-muted font-mono pb-2">
                      <span>Total lectures count: {course.lessonsCount || chapters.reduce((sum, c) => sum + c.lectures.length, 0)} Lectures</span>
                      <span>Total hours duration: {course.duration || "Not specified"} total hours</span>
                    </div>

                    <div className="space-y-3.5">
                      {chapters.map((chapter, chapIdx) => {
                        const isOpen = expandedChapters[chapIdx];
                        return (
                          <div key={chapIdx} className="rounded-xl border border-app-border bg-app-btn-sec/10 overflow-hidden">
                            <button
                              onClick={() => handleToggleChapter(chapIdx)}
                              className="w-full flex items-center justify-between p-3.5 bg-app-btn-sec/20 hover:bg-app-btn-sec/30 text-left text-xs font-semibold text-app-text transition"
                            >
                              <span className="font-display pr-4 truncate font-bold text-app-text">{chapter.title}</span>
                              <div className="flex items-center gap-3 font-mono text-[10px] text-app-text-muted shrink-0">
                                <span>{chapter.lectures.length} Lectures</span>
                                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </div>
                            </button>
                            
                            {isOpen && (
                              <div className="divide-y divide-app-border/40 bg-app-bg/30">
                                {chapter.lectures.map((lec) => {
                                  const isLecActive = activeLecture?.id === lec.id;
                                  const isLocked = !isEnrolled && !lec.freePreview;
                                  return (
                                    <div 
                                      key={lec.id}
                                      onClick={() => handleSelectLecture(lec)}
                                      className={`flex items-center justify-between p-3.5 text-xs transition cursor-pointer ${
                                        isLecActive ? "bg-indigo-500/5 text-indigo-400" : "hover:bg-app-btn-sec/5 text-app-text-sec"
                                      }`}
                                    >
                                      <div className="flex items-center space-x-3 min-w-0 pr-4">
                                        {(!isLocked && isEnrolled) ? (
                                          <input 
                                            type="checkbox"
                                            checked={!!completedLectures[lec.id]}
                                            onChange={(e) => {
                                              e.stopPropagation();
                                              handleToggleLectureComplete(lec.id, e.target.checked);
                                            }}
                                            className="w-4 h-4 rounded border-zinc-700 dark:border-zinc-500 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                                            title="Mark as Completed"
                                          />
                                        ) : isLocked ? (
                                          <Lock className="w-3.5 h-3.5 text-app-text-muted/60 shrink-0" />
                                        ) : isLecActive ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                        ) : (
                                          <Play className="w-3.5 h-3.5 text-indigo-400/80 shrink-0" />
                                        )}
                                        <span className={`truncate font-medium ${isLocked ? "text-app-text-muted/70" : completedLectures[lec.id] ? "text-app-text-muted line-through decoration-zinc-500/40" : ""}`}>
                                          {lec.title}
                                        </span>
                                      </div>
                                      
                                      <div className="flex items-center gap-3 font-mono text-[10px] text-app-text-muted shrink-0">
                                        {lec.freePreview && !isLocked && (
                                          <span className="text-[8px] bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold px-1.5 py-0.5 rounded uppercase">
                                            Preview
                                          </span>
                                        )}
                                        <span>{lec.duration}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {activeTab === "notes" && (
                  <motion.div
                    key="notes-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-mono text-app-text-muted pb-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Take interactive notes that auto-save instantly to your local vault.</span>
                    </div>

                    <textarea
                      value={studentNote}
                      onChange={(e) => saveNote(e.target.value)}
                      placeholder="# Course Notes Setup...&#10;- Important secret swapper models go in process.env&#10;- Use ALTER TABLE statements dynamically in sqlite pre-loads&#10;- Deploying behind Nginx reverse-proxies require binding to host 0.0.0.0..."
                      rows={8}
                      className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-3 text-xs font-mono placeholder:text-app-text-muted/50 focus:outline-none focus:border-indigo-500 transition-all leading-relaxed"
                    />
                    <div className="flex items-center justify-between text-[10px] font-mono text-app-text-muted">
                      <span>Notes storage: Local secure sandbox browser vault</span>
                      <span>{studentNote.length} characters written</span>
                    </div>
                  </motion.div>
                )}

                {activeTab === "qa" && (
                  <motion.div
                    key="qa-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Add question form */}
                    <form onSubmit={submitQuestion} className="flex gap-2">
                      <input
                        type="text"
                        value={newQuestionTxt}
                        onChange={(e) => setNewQuestionTxt(e.target.value)}
                        placeholder="Ask deep architectural questions about this course layout..."
                        className="flex-1 bg-app-input border border-app-input-border text-app-text rounded-xl p-2.5 text-xs placeholder:text-app-text-muted/50 focus:outline-none focus:border-indigo-500"
                      />
                      <button 
                        type="submit"
                        className="bg-app-text text-app-bg px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 hover:opacity-90"
                      >
                        <Send className="w-3 h-3" />
                        Ask Q
                      </button>
                    </form>

                    {/* Questions loop */}
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {questions.map((q) => (
                        <div key={q.id} className="p-4 rounded-xl border border-app-border bg-app-btn-sec/5 space-y-3">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="font-semibold text-app-text-sec">{q.author}</span>
                            <span className="text-app-text-muted">{q.date}</span>
                          </div>
                          
                          <p className="text-xs text-app-text font-medium leading-relaxed">
                            {q.text}
                          </p>

                          {q.replies.map((rep, idx) => (
                            <div key={idx} className="pl-4 border-l-2 border-indigo-500 ml-2 space-y-1">
                              <div className="flex items-center gap-1 text-[9px] font-mono">
                                <span className="font-bold text-indigo-400">{rep.author}</span>
                                {rep.isInstructor && (
                                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[7px] px-1 py-0.2 rounded font-extrabold uppercase">
                                    Instructor Co-pilot
                                  </span>
                                )}
                                <span className="text-app-text-muted ml-auto">{rep.date}</span>
                              </div>
                              <p className="text-xs text-app-text-sec bg-app-btn-sec/10 p-2.5 rounded-lg border border-app-border/30 italic leading-relaxed">
                                "{rep.text}"
                              </p>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "resources" && (
                  <motion.div
                    key="resources-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/5 hover:border-indigo-500/40 transition flex items-start gap-3">
                        <Code className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-semibold text-app-text truncate">VISION79 Core Stack Boilerplate</p>
                          <p className="text-[10px] text-app-text-muted leading-relaxed">Boilerplate template complete with dynamic SQLite setup schemas and port maps.</p>
                          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-400 font-mono inline-block pt-1 hover:underline">
                            Download Source .zip →
                          </a>
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-app-border bg-app-btn-sec/5 hover:border-indigo-500/40 transition flex items-start gap-3">
                        <FileText className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs font-semibold text-app-text truncate">Production Alter Migration Script</p>
                          <p className="text-[10px] text-app-text-muted leading-relaxed">Reference script compiling dynamic columns migration commands cleanly.</p>
                          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 font-mono inline-block pt-1 hover:underline">
                            View Raw TS Snippet →
                          </a>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "feedback" && (
                  <motion.div
                    key="feedback-tab"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* FEEDBACK OVERVIEW STATS CARD */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl border border-app-border bg-app-btn-sec/5 items-center">
                      <div className="text-center space-y-1 md:border-r border-app-border/40 py-2">
                        <span className="text-3xl font-bold font-display text-app-text">
                          {(feedbacks.length > 0
                            ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
                            : (course.rating || 4.7).toFixed(1))}
                        </span>
                        <div className="flex justify-center gap-0.5 text-amber-400">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const avg = feedbacks.length > 0
                              ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
                              : course.rating || 4.7;
                            return (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-zinc-600"}`}
                              />
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-app-text-muted font-mono uppercase tracking-wide">
                          Course rating based on {feedbacks.length} feedbacks
                        </p>
                      </div>

                      <div className="col-span-2 space-y-2 px-3">
                        <h4 className="text-xs font-semibold text-app-text font-display flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-400" />
                          Help Us Improve {course.name}!
                        </h4>
                        <p className="text-[10px] text-app-text-sec leading-relaxed">
                          Your ratings and recommendations directly steer our updates. Once your suggestions are onboarded and implemented into <strong>{course.name}</strong>, you will see an "Idea Onboarded & Implemented" badge with responses from the instructor.
                        </p>
                      </div>
                    </div>

                    {/* TWO COLUMN GRID: LEFT = INPUT FORM, RIGHT = COMMUNITY FEEDBACK */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                      
                      {/* FEEDBACK INPUT FORM */}
                      <div className="lg:col-span-2 space-y-4">
                        <div className="p-4 rounded-xl border border-app-border bg-app-aside-bg/40 space-y-3.5">
                          <h4 className="text-xs font-bold text-app-text uppercase tracking-wide font-mono flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-indigo-400" />
                            Leave your feedback for {course.name}
                          </h4>

                          {submitSuccess ? (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <p className="text-xs font-bold text-emerald-400">Feedback Submitted!</p>
                              <p className="text-[10px] text-app-text-muted leading-normal">
                                Thank you for your review. It has been saved.
                              </p>
                              <button
                                onClick={() => setSubmitSuccess(false)}
                                className="text-[10px] text-indigo-400 font-mono hover:underline cursor-pointer pt-1 block mx-auto bg-transparent border-none outline-none"
                              >
                                Submit another suggestion
                              </button>
                            </motion.div>
                          ) : (
                            <form onSubmit={handleSubmitFeedback} className="space-y-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-mono text-app-text-muted uppercase tracking-wider block">
                                  Your Name
                                </label>
                                <input
                                  type="text"
                                  value={userNameInput}
                                  onChange={(e) => setUserNameInput(e.target.value)}
                                  placeholder="e.g. Alex J. (or leave anonymous)"
                                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500"
                                />
                              </div>

                              {/* Feedback Type Selector */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-mono text-app-text-muted uppercase tracking-wider block">
                                  Submission Type
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setFeedbackType("idea")}
                                    className={`py-2 px-3 text-[11px] font-mono rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                                      feedbackType === "idea"
                                        ? "bg-amber-500/10 border-amber-500/40 text-amber-500 font-bold"
                                        : "bg-app-input border-app-input-border text-app-text-sec hover:text-app-text"
                                    }`}
                                  >
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                    <span>Make Suggestion</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setFeedbackType("feedback")}
                                    className={`py-2 px-3 text-[11px] font-mono rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                                      feedbackType === "feedback"
                                        ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold"
                                        : "bg-app-input border-app-input-border text-app-text-sec hover:text-app-text"
                                    }`}
                                  >
                                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                                    <span>Give Feedback</span>
                                  </button>
                                </div>
                                <p className="text-[9px] text-app-text-muted font-mono leading-normal mt-1">
                                  {feedbackType === "idea" 
                                    ? "💡 Recommend a new course step, curriculum integration, or resource. No star rating required." 
                                    : "💬 Provide general comments, report bugs, or rate the overall course experience."}
                                </p>
                              </div>

                              {feedbackType === "feedback" && (
                                <div className="space-y-1">
                                  <label className="text-[10px] font-mono text-app-text-muted uppercase tracking-wider block">
                                    Your Rating
                                  </label>
                                  <div className="flex gap-1.5 py-1">
                                    {[1, 2, 3, 4, 5].map((stars) => (
                                      <button
                                        key={stars}
                                        type="button"
                                        onClick={() => setRatingInput(stars)}
                                        className="p-1 focus:outline-none hover:scale-115 transition bg-transparent border-none"
                                      >
                                        <Star
                                          className={`w-5 h-5 transition-all ${
                                            stars <= ratingInput
                                              ? "fill-amber-400 text-amber-400"
                                              : "text-zinc-600 hover:text-zinc-500"
                                          }`}
                                        />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="space-y-1">
                                <label className="text-[10px] font-mono text-app-text-muted uppercase tracking-wider block">
                                  Suggestions & Improvement Feedback
                                </label>
                                <textarea
                                  value={commentInput}
                                  onChange={(e) => setCommentInput(e.target.value)}
                                  rows={3}
                                  placeholder="Describe how we can make this course/curriculum better..."
                                  className="w-full bg-app-input border border-app-input-border text-app-text rounded-lg p-2.5 text-xs focus:outline-none focus:border-indigo-500 leading-relaxed resize-none"
                                />
                              </div>

                              {submitError && (
                                <p className="text-[10px] text-red-400 font-mono leading-normal bg-red-500/5 p-2 rounded border border-red-500/10">
                                  ⚠️ {submitError}
                                </p>
                              )}

                              <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full py-2 px-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition duration-200 cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                              >
                                {isSubmitting ? (
                                  <>
                                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    {feedbackType === "idea" ? "Submitting suggestion..." : "Submitting feedback..."}
                                  </>
                                ) : (
                                  <>
                                    <Send className="w-3.5 h-3.5" />
                                    {feedbackType === "idea" ? "Submit Suggestion" : "Submit Feedback & Rating"}
                                  </>
                                )}
                              </button>
                            </form>
                          )}
                        </div>
                      </div>

                      {/* COMMUNITY FEEDBACK LIST */}
                      <div className="lg:col-span-3 space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                        <h4 className="text-xs font-bold text-app-text uppercase tracking-wide font-mono">
                          What other students say
                        </h4>

                        {feedbacks.length === 0 ? (
                          <div className="p-8 text-center border border-dashed border-app-border/60 rounded-xl text-app-text-muted space-y-1">
                            <MessageSquare className="w-8 h-8 text-zinc-700 mx-auto" />
                            <p className="text-xs font-medium">No feedback yet.</p>
                            <p className="text-[10px] leading-normal font-mono text-app-text-muted">
                              Be the first to submit a suggestion and guide future upgrades!
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {feedbacks.map((item) => (
                              <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition relative ${
                                  item.onboarded === 1
                                    ? "bg-emerald-500/5 border-emerald-500/20"
                                    : item.feedbackType === "idea"
                                    ? "bg-amber-500/[0.01] border-amber-500/15"
                                    : "bg-app-btn-sec/5 border-app-border/60 hover:border-app-border"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      <span className="font-bold text-app-text">
                                        {item.userName || "Anonymous"}
                                      </span>
                                      {item.feedbackType === "idea" ? (
                                        item.onboarded === 1 ? (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold uppercase tracking-wide border border-emerald-500/25">
                                              Suggestion Onboarded & Implemented ✅
                                            </span>
                                            {item.onboardedAt && (
                                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono border border-emerald-500/10 flex items-center gap-1">
                                                ⏱️ Onboarded in {getDurationText(item.createdAt, item.onboardedAt)}
                                              </span>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold uppercase tracking-wide border border-amber-500/25">
                                            Suggestion 💡
                                          </span>
                                        )
                                      ) : (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono font-bold uppercase tracking-wide border border-indigo-500/15">
                                          Feedback 💬
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] text-app-text-muted font-mono block">
                                      {new Date(item.createdAt).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric"
                                      })}
                                    </span>
                                  </div>

                                  {item.feedbackType !== "idea" && (
                                    <div className="flex gap-0.5 text-amber-400 shrink-0">
                                      {Array.from({ length: 5 }).map((_, idx) => (
                                        <Star
                                          key={idx}
                                          className={`w-3 h-3 ${idx < item.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`}
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <p className="text-app-text-sec leading-relaxed text-[11px]">
                                  {item.comment}
                                </p>

                                {/* ONBOARDED BADGE & INSTRUCTOR'S UPDATE MESSAGE */}
                                {item.onboarded === 1 && (
                                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5 space-y-1 mt-1">
                                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-wide">
                                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                                      Onboarded & Implemented in V79! ✅
                                    </div>
                                    <p className="text-[10px] text-app-text-sec leading-relaxed pl-5 italic font-mono">
                                      "{item.onboardedComment}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STICKY PURCHASE WALL CHECKOUT */}
        <div className="lg:col-span-4 sticky top-24 h-max flex flex-col gap-6">
          
          <AnimatePresence mode="wait">
            {!isEnrolled ? (
              <motion.div
                key="checkout-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-app-aside-bg/40 border-2 border-indigo-500/25 p-5 sm:p-6 rounded-2xl space-y-5 shadow-xl relative overflow-hidden"
              >
                {/* Glow border element */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500" />
                
                <div className="space-y-1.5 text-center sm:text-left">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded">
                    Enrollment
                  </span>
                  <div className="flex items-baseline justify-center sm:justify-start gap-2 pt-2">
                    <span className="text-3xl font-extrabold text-app-text font-display">${displayPrice.toFixed(2)}</span>
                    {hasPromo && (
                      <>
                        <span className="text-xs text-app-text-muted line-through font-mono">${originalPrice.toFixed(2)}</span>
                        <span className="text-xs text-emerald-500 font-bold">50% OFF (Launch Promo)</span>
                      </>
                    )}
                  </div>
                  {hasPromo && (
                    <p className="text-[10px] text-emerald-400 font-mono tracking-normal block pt-1 font-bold">
                      Launch promo: 50% off automatically applied (first 30 days after this course was published).
                    </p>
                  )}
                </div>

                {/* Honest enrollment action: this app does not have a live
                    payment processor wired in yet, so it does not collect
                    card details or claim to charge anything. Enrollment is
                    recorded so the curriculum can be previewed end-to-end;
                    real checkout can be added once a processor (e.g. Stripe)
                    is connected with real API keys. */}
                <div className="space-y-3">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 leading-relaxed">
                    Payment processing isn't connected yet, so enrolling here won't charge a card. Enrolling unlocks the full curriculum preview on this device.
                  </div>

                  {payError && (
                    <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/10 text-[10px] text-red-500 leading-normal font-medium">
                      {payError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleCheckoutSubmit}
                    disabled={isPaying}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl tracking-wide uppercase transition duration-200 cursor-pointer flex items-center justify-center gap-2 mt-2 shadow-lg disabled:opacity-40"
                  >
                    {isPaying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Enrolling...
                      </>
                    ) : (
                      <>
                        Enroll{displayPrice > 0 ? ` (${displayPrice.toFixed(2)} - not charged)` : ""}
                      </>
                    )}
                  </button>
                </div>

                <div className="border-t border-app-border/40 pt-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-[10px] text-app-text-sec">
                    <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Study duration: {course.duration || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-app-text-sec">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Lectures: {course.lessonsCount || chapters.reduce((sum, c) => sum + c.lectures.length, 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-app-text-sec">
                    <Infinity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Full lifetime access with zero expiry</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-app-text-sec">
                    <Award className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Certificate of completion on graduation</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="enrolled-success-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-app-aside-bg/40 border-2 border-emerald-500/20 p-5 sm:p-6 rounded-2xl space-y-4 shadow-xl text-center relative"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto mb-1">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <h3 className="font-bold text-app-text text-base font-display">Enrollment Activated! ✅</h3>
                  <p className="text-[10px] text-app-text-muted leading-relaxed font-mono">
                    Full lifetime access authenticated successfully. Expand any curriculum block on the left, mark off your lectures, and unlock graduation certifications!
                  </p>
                </div>

                <div className="bg-app-bg p-3.5 rounded-xl border border-app-border text-left space-y-2">
                  <div className="flex justify-between text-[9px] font-mono text-app-text-muted">
                    <span>STUDENT ID</span>
                    <span className="font-bold">{studentId}</span>
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-app-text-muted">
                    <span>COURSE</span>
                    <span className="font-bold text-emerald-400 uppercase truncate max-w-[180px]">{course.name}</span>
                  </div>
                </div>

                {/* Automated Certification & Exam block */}
                <div className="border-t border-app-border/40 pt-4 text-left">
                  <CourseCertification 
                    course={course}
                    allLectures={chapters.flatMap(c => c.lectures)}
                    completedLectures={completedLectures}
                    onToggleAllLectures={handleToggleAllLectures}
                    onToggleLecture={handleToggleLectureComplete}
                  />
                </div>

                <p className="text-[9px] text-app-text-muted font-mono leading-tight bg-zinc-500/5 p-2 rounded-lg">
                  💡 Tip: Use your notes tab on the left. It updates dynamically with your workspace.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>

    </div>
  );
}
