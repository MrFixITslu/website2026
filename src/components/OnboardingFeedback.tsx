import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Star, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  Award, 
  User, 
  MessageCircle, 
  HelpCircle
} from "lucide-react";
import { SaaSApp } from "../types";
import { AppLogo } from "./AppLogo";

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

interface OnboardingFeedbackProps {
  app: SaaSApp;
  onBack: () => void;
}

export function OnboardingFeedback({ app, onBack }: OnboardingFeedbackProps) {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [userName, setUserName] = useState("");
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [feedbackType, setFeedbackType] = useState<"feedback" | "idea">("idea");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/feedback?appId=${app.id}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbacks(data);
      }
    } catch (err) {
      console.error("Error loading onboarding feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [app.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setSubmitError("Please write an onboarding suggestion or feedback comment.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: app.id,
          appName: app.name,
          rating,
          comment: comment.trim(),
          userName: userName.trim() || "Anonymous Student",
          feedbackType
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit comment.");
      }

      setSubmitSuccess(true);
      setComment("");
      setUserName("");
      setRating(5);
      setFeedbackType("idea");
      fetchFeedbacks();
    } catch (err: any) {
      setSubmitError(err.message || "An exception occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate stats
  const totalCount = feedbacks.length;
  const averageRating = totalCount > 0 
    ? feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / totalCount 
    : (app.rating || 0);

  // Rating distribution
  const distribution = [0, 0, 0, 0, 0]; // 5 to 1 star index mapping
  feedbacks.forEach(f => {
    const idx = 5 - Math.max(1, Math.min(5, f.rating));
    if (idx >= 0 && idx < 5) distribution[idx]++;
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Back Button with subtle arrow slide */}
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-mono font-bold text-app-text-muted hover:text-indigo-400 group cursor-pointer transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
        BACK TO DISCOVER
      </button>

      {/* Hero Banner Header */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-2xl border border-app-border bg-app-btn-sec/5 shadow-lg space-y-3">
        {/* Visual ambient accent glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-12 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl -z-10" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-4 items-start sm:items-center">
            <div className="w-16 h-16 bg-app-btn-sec rounded-2xl flex items-center justify-center border border-app-border shrink-0">
              <AppLogo logoUrl={app.logoUrl} />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-mono bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold">
                {app.name} Onboarding Suggestion Hub
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-app-text font-display">
                {app.name} Onboarding Feedback
              </h1>
              <p className="text-xs sm:text-sm text-app-text-sec max-w-2xl font-light">
                {app.subtitle} — Help us improve {app.name}! Share your onboarding suggestions, request integrations, report bugs, and rate this tool on our 5-gold-star scale.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-app-aside-bg/60 border border-app-border px-3.5 py-2 rounded-xl">
            <Award className="w-5 h-5 text-amber-400 animate-pulse" />
            <div className="text-right font-mono">
              <span className="block text-xs font-bold text-app-text">5-Star Standard</span>
              <span className="block text-[9px] text-app-text-muted uppercase">{app.pricingType} Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Rating & Distribution Metrics Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Core Rating display */}
        <div className="p-6 rounded-2xl border border-app-border bg-app-aside-bg/40 flex flex-col items-center justify-center text-center space-y-3 shadow-md relative">
          <div className="space-y-1">
            <span className="text-5xl font-extrabold font-display text-app-text">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex items-center justify-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`}
                />
              ))}
            </div>
          </div>
          <p className="text-[10px] text-app-text-muted font-mono uppercase tracking-widest leading-none">
            {totalCount > 0 ? `${totalCount} Verified Reviews` : "No reviews yet"}
          </p>
        </div>

        {/* Distribution Bar Chart */}
        <div className="md:col-span-2 p-6 rounded-2xl border border-app-border bg-app-aside-bg/40 space-y-3.5 shadow-md">
          <h3 className="text-[11px] font-bold text-app-text font-mono uppercase tracking-wider">
            {app.name} Onboarding Quality Breakdown
          </h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((stars, idx) => {
              const count = distribution[idx];
              const percentage = totalCount > 0 ? (count / totalCount) * 105 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs font-mono">
                  <span className="w-12 text-app-text-sec text-right flex items-center justify-end gap-1 shrink-0">
                    {stars} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0 inline" />
                  </span>
                  <div className="flex-1 h-2 bg-app-input/50 rounded-full overflow-hidden border border-app-border/10">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    />
                  </div>
                  <span className="w-12 text-app-text-muted text-left text-[11px]">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Two Column Grid: Form & Feedbacks List */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Form Container */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 sm:p-6 rounded-2xl border border-app-border bg-app-aside-bg/60 space-y-4 shadow-xl">
            <h4 className="text-xs font-bold text-app-text uppercase tracking-wide font-mono flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Rate & Suggest for {app.name}
            </h4>

            {submitSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-5 h-5 animate-bounce" />
                </div>
                <p className="text-sm font-bold text-emerald-400">Onboarding Feedback Saved!</p>
                <p className="text-[11px] text-app-text-sec leading-relaxed">
                  Thank you! Your suggestions and rating for <strong>{app.name}</strong> have been persisted. The administrator can now review and respond to implemented items.
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="text-xs text-indigo-400 font-mono hover:underline cursor-pointer pt-1 block mx-auto bg-transparent border-none outline-none"
                >
                  Submit another suggestion
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-app-text-muted uppercase tracking-wider block">
                    Your Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-muted/60" />
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Sarah Connor (or anonymous)"
                      className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                    />
                  </div>
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
                      ? "💡 Recommend a new onboarding step, integration, or feature. No star rating required." 
                      : "💬 Provide general comments, report bugs, or rate the overall tool experience."}
                  </p>
                </div>

                {/* Stars Rating Selector */}
                {feedbackType === "feedback" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-app-text-muted uppercase tracking-wider block">
                      Quality Rating (5-Gold Star Scale)
                    </label>
                    <div className="flex gap-2 py-2">
                      {[1, 2, 3, 4, 5].map((starVal) => {
                        const isHighlighted = hoveredRating !== null ? starVal <= hoveredRating : starVal <= rating;
                        return (
                          <button
                            key={starVal}
                            type="button"
                            onClick={() => setRating(starVal)}
                            onMouseEnter={() => setHoveredRating(starVal)}
                            onMouseLeave={() => setHoveredRating(null)}
                            className="focus:outline-none hover:scale-120 transition-all duration-150 bg-transparent border-none p-0 cursor-pointer text-amber-400"
                          >
                            <Star
                              className={`w-7 h-7 transition-all ${
                                isHighlighted
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.35)]"
                                  : "text-zinc-700 hover:text-zinc-600"
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                    <span className="text-[10px] text-app-text-muted font-mono block italic">
                      {rating === 5 && "⭐ Excellent - Flawless onboarding"}
                      {rating === 4 && "⭐ Very Good - Polished experience"}
                      {rating === 3 && "⭐ Good - Average experience"}
                      {rating === 2 && "⭐ Fair - Needs visual/functional polish"}
                      {rating === 1 && "⭐ Needs Improvement - Critical issues"}
                    </span>
                  </div>
                )}

                {/* Suggestions text area */}
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-app-text-muted uppercase tracking-wider block">
                    Suggestions & Comments for Onboarding
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder={`Provide detailed suggestions, ideas for better onboarding steps, or integration requests for ${app.name}...`}
                    className="w-full bg-app-input border border-app-input-border text-app-text rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 leading-relaxed resize-none"
                  />
                </div>

                {submitError && (
                  <p className="text-[10px] text-rose-400 font-mono leading-normal bg-rose-500/5 p-2.5 rounded border border-rose-500/10">
                    ⚠️ {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition duration-200 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

          {/* Quick FAQ / Guide */}
          <div className="p-5 rounded-2xl border border-app-border bg-app-btn-sec/5 space-y-2">
            <h5 className="text-[11px] font-bold font-mono uppercase tracking-wide text-app-text flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-app-text-muted" /> {app.name} Onboarding FAQ
            </h5>
            <p className="text-[10px] text-app-text-sec leading-relaxed">
              When you submit comments or request integrations for <strong>{app.name}</strong>, our administrator gets notified immediately. They review your stars rating, adjust the tool onboarding features accordingly, and publish their official response status live on this screen.
            </p>
          </div>
        </div>

        {/* Comments List Panel */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-app-text uppercase tracking-wide font-mono flex items-center gap-2">
              <MessageCircle className="w-4.5 h-4.5 text-indigo-400" />
              {app.name} Onboarding Suggestions Registry ({totalCount})
            </h4>
            <span className="text-[9px] text-app-text-muted font-mono uppercase tracking-widest">
              Live updates
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-app-border bg-app-aside-bg/30 space-y-3 animate-pulse">
                  <div className="flex justify-between items-center">
                    <div className="h-3 bg-app-border/70 rounded w-1/3" />
                    <div className="h-3 bg-app-border/70 rounded w-12" />
                  </div>
                  <div className="h-2.5 bg-app-border/50 rounded w-5/6" />
                  <div className="h-2 bg-app-border/40 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-app-border rounded-2xl text-app-text-muted space-y-2.5">
              <MessageSquare className="w-10 h-10 text-zinc-700 mx-auto" />
              <p className="text-xs font-semibold">No onboarding suggestions yet.</p>
              <p className="text-[10px] leading-normal font-mono text-app-text-muted max-w-sm mx-auto">
                Be the absolute first person to rate <strong>{app.name}</strong> and request specific onboarding integrations!
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[580px] overflow-y-auto pr-2">
              {feedbacks.map((f) => (
                <div
                  key={f.id}
                  className={`p-4 rounded-xl border text-xs space-y-3 transition-all relative ${
                    f.onboarded === 1
                      ? "bg-emerald-500/5 border-emerald-500/20 shadow-sm"
                      : "bg-app-btn-sec/5 border-app-border/60 hover:border-app-border"
                  }`}
                >
                  {/* Top line */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <span className="font-bold text-app-text">
                          {f.userName || "Anonymous Student"}
                        </span>
                        {f.feedbackType === "idea" ? (
                          f.onboarded === 1 ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-bold uppercase tracking-wide border border-emerald-500/25">
                                Suggestion Onboarded & Implemented ✅
                              </span>
                              {f.onboardedAt && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-emerald-300 font-mono border border-emerald-500/10 flex items-center gap-1">
                                  ⏱️ Onboarded in {getDurationText(f.createdAt, f.onboardedAt)}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-mono font-bold uppercase tracking-wide border border-amber-500/25">
                              Suggestion 💡
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-mono font-bold uppercase tracking-wide border border-indigo-500/25">
                            Feedback 💬
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-app-text-muted font-mono block">
                        {new Date(f.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>

                    {f.feedbackType !== "idea" && (
                      <div className="flex gap-0.5 text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <Star
                            key={idx}
                            className={`w-3.5 h-3.5 ${idx < f.rating ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Comment */}
                  <p className="text-app-text-sec leading-relaxed text-[11px] font-light">
                    {f.comment}
                  </p>

                  {/* Onboarded administrator response block */}
                  {f.onboarded === 1 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 space-y-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400 font-mono uppercase tracking-wide">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        Administrator Response
                      </div>
                      <p className="text-[10px] text-app-text-sec leading-relaxed pl-5 italic font-mono">
                        "{f.onboardedComment}"
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
