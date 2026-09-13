import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  Clock,
  ArrowRight,
  BookOpen,
  MessageSquare,
  Phone,
  ShieldCheck,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { BlogArticle } from "../types";
import { ShareButtons } from "./ShareButtons";
import { Button } from "./ui/Button";

interface ArticleDetailPageProps {
  slug: string;
  onBack: () => void;
  onNavigate?: (section: string) => void;
  onSelectArticle?: (slug: string) => void;
}

export function ArticleDetailPage({
  slug,
  onBack,
  onNavigate,
  onSelectArticle,
}: ArticleDetailPageProps) {
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setError(null);

    // Fetch the target article
    fetch(`/api/articles/${slug}`)
      .then((r) => {
        if (!r.ok) throw new Error("Article not found");
        return r.json();
      })
      .then((data) => {
        setArticle(data);
        if (data.title) {
          document.title = `${data.title} | Vision79 Digital`;
        }
        if (data.coverImage) {
          let ogImageTag = document.querySelector('meta[property="og:image"]');
          if (!ogImageTag) {
            ogImageTag = document.createElement("meta");
            ogImageTag.setAttribute("property", "og:image");
            document.head.appendChild(ogImageTag);
          }
          ogImageTag.setAttribute("content", data.coverImage);

          let twitterImageTag = document.querySelector('meta[name="twitter:image"]');
          if (!twitterImageTag) {
            twitterImageTag = document.createElement("meta");
            twitterImageTag.setAttribute("name", "twitter:image");
            document.head.appendChild(twitterImageTag);
          }
          twitterImageTag.setAttribute("content", data.coverImage);
        }
      })
      .catch((err) => {
        console.error("Error fetching article:", err);
        setError("Could not load this article. It may have been moved or removed.");
      })
      .finally(() => setLoading(false));

    // Fetch related articles for the bottom section
    fetch("/api/articles")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setRelatedArticles(data.filter((a) => a.slug !== slug).slice(0, 2));
        }
      })
      .catch(() => {});

    return () => {
      document.title = "Managed IT Services & Cybersecurity Saint Lucia | Vision79 Digital";
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-2xl w-full space-y-6 animate-pulse">
          <div className="h-6 w-36 bg-white/10 rounded-lg" />
          <div className="h-10 w-3/4 bg-white/10 rounded-xl" />
          <div className="h-64 bg-white/10 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded w-full" />
            <div className="h-4 bg-white/10 rounded w-5/6" />
            <div className="h-4 bg-white/10 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 py-20 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mx-auto">
          <BookOpen className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold font-display text-app-text dark:text-white">
          Insight Post Not Found
        </h1>
        <p className="text-sm text-app-text-sec max-w-md">
          {error || "The requested article is currently unavailable."}
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={onBack} variant="primary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to All Insights
          </Button>
        </div>
      </div>
    );
  }

  // Estimate reading time from markdown content (~200 words per minute)
  const wordCount = (article.content || "").trim().split(/\s+/).length;
  const readingTimeMinutes = Math.max(2, Math.ceil(wordCount / 200));

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="pt-24 pb-20 px-6 lg:px-8 max-w-4xl mx-auto space-y-8"
    >
      {/* Top Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-app-border">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-app-text-muted hover:text-indigo-400 transition font-mono cursor-pointer group"
          aria-label="Return to previous view"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to All Insights</span>
        </button>

        <div className="flex items-center gap-2 text-[11px] font-mono text-app-text-muted">
          <span>Vision79 Knowledge Base</span>
          <span>/</span>
          <span className="text-indigo-400 uppercase tracking-wider font-semibold">
            {article.category}
          </span>
        </div>
      </div>

      {/* Article Header & Title */}
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Tag className="w-3 h-3" />
            {article.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-mono text-app-text-muted">
            <Clock className="w-3 h-3" />
            {readingTimeMinutes} min read
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-display tracking-tight text-app-text dark:text-white leading-[1.15]">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-app-text-muted pt-1">
          {article.author && (
            <span className="flex items-center gap-1.5 text-app-text dark:text-white font-medium">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              {article.author}
            </span>
          )}
          {article.date && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {article.date}
            </span>
          )}
          <span className="flex items-center gap-1 text-emerald-500">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Expert Advice
          </span>
        </div>

        {/* Quick Social Share Pill Row */}
        <div className="pt-3 pb-2 border-y border-app-border/70">
          <ShareButtons
            title={article.title}
            slug={article.slug}
            imageUrl={article.coverImage}
            coverImage={article.coverImage}
            description={article.description}
            category={article.category}
            variant="inline"
          />
        </div>
      </header>

      {/* Featured Cover Image */}
      {article.coverImage && (
        <div className="rounded-2xl overflow-hidden border border-app-border max-h-[420px] shadow-lg">
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        </div>
      )}

      {/* Article Markdown Body */}
      <div className="prose prose-base sm:prose-lg dark:prose-invert max-w-none prose-headings:font-display prose-headings:font-extrabold prose-headings:text-app-text dark:prose-headings:text-white prose-p:text-app-text-sec prose-p:font-light prose-p:leading-relaxed prose-strong:text-app-text dark:prose-strong:text-white prose-li:text-app-text-sec prose-li:font-light prose-a:text-indigo-400 prose-a:underline hover:prose-a:text-indigo-300 prose-code:text-indigo-400 prose-code:bg-indigo-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded">
        <ReactMarkdown>{article.content || ""}</ReactMarkdown>
      </div>

      {/* End-of-article Share Banner */}
      <div className="pt-8 border-t border-app-border">
        <ShareButtons
          title={article.title}
          slug={article.slug}
          imageUrl={article.coverImage}
          coverImage={article.coverImage}
          description={article.description}
          category={article.category}
          variant="block"
        />
      </div>

      {/* Author & Vision79 Trust Card */}
      <div className="glass rounded-2xl p-6 border border-app-border space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-display text-app-text dark:text-white">
              About Vision79 Digital
            </h2>
            <p className="text-xs text-app-text-sec font-light max-w-xl leading-relaxed">
              Founded by telecommunications architect Neil Verdant (25+ years Caribbean telecom heritage), Vision79 Digital provides enterprise managed IT services, automated daily cloud backups, cybersecurity, and 4-hour on-site SLAs across Saint Lucia.
            </p>
          </div>
          <a
            href="https://wa.me/17587260035?text=Hello%20V79%20Digital,%20I'd%20like%20to%20inquire%20about%20your%20ICT%20support%20services."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition active:scale-95 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat on WhatsApp</span>
          </a>
        </div>
      </div>

      {/* Free Consultation CTA */}
      <div className="rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-indigo-950/40 border border-indigo-500/30 text-center space-y-4">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-indigo-400 font-bold">
          Get Started in Saint Lucia
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
          Need Expert Guidance for Your Business IT?
        </h2>
        <p className="text-xs sm:text-sm text-white/70 max-w-xl mx-auto font-light leading-relaxed">
          Book a 100% free 30-minute discovery consultation. We inspect your network, cloud backups, and cybersecurity vulnerabilities at zero cost.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            onClick={() => onNavigate?.("contact")}
            variant="primary"
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Book Free Assessment
          </Button>
          <a
            href="tel:+17587260035"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition font-mono"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call +1 (758) 726-0035</span>
          </a>
        </div>
      </div>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-app-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-display text-app-text dark:text-white">
              More Insights from V79 Digital
            </h2>
            <button
              onClick={onBack}
              className="text-xs font-mono text-indigo-400 hover:underline cursor-pointer"
            >
              View all insights →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {relatedArticles.map((ra) => (
              <button
                key={ra.slug}
                onClick={() => (onSelectArticle ? onSelectArticle(ra.slug) : onBack())}
                className="glass rounded-xl p-4 border border-app-border hover:border-indigo-500/40 text-left transition-all hover:-translate-y-1 cursor-pointer group space-y-2"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-indigo-400">
                  <span>{ra.category}</span>
                  {ra.date && <span>{ra.date}</span>}
                </div>
                <h3 className="font-bold text-sm font-display text-app-text dark:text-white group-hover:text-indigo-400 transition leading-snug">
                  {ra.title}
                </h3>
                <p className="text-xs text-app-text-sec font-light line-clamp-2 leading-relaxed">
                  {ra.description}
                </p>
                <span className="text-[11px] font-mono text-indigo-400 flex items-center gap-1 group-hover:gap-2 transition-all pt-1">
                  Read article <ArrowRight className="w-3 h-3" />
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Back Button */}
      <div className="pt-6 text-center">
        <Button onClick={onBack} variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
          Back to All Insights & Solutions
        </Button>
      </div>
    </motion.article>
  );
}
