import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Linkedin,
  Facebook,
  Twitter,
  MessageCircle,
} from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
  category?: string;
  className?: string;
  variant?: "inline" | "block";
}

export function ShareButtons({
  title,
  slug,
  category,
  className = "",
  variant = "inline",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  // Generate complete, shareable direct link to this specific article
  const getArticleUrl = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set("article", slug);
      return url.toString();
    }
    return `https://v79sl.com/?article=${slug}`;
  };

  const articleUrl = getArticleUrl();
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(`${title} | Vision79 Digital`);
  const whatsappText = encodeURIComponent(`${title} - Read more on Vision79 Digital:\n${articleUrl}`);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(articleUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = articleUrl;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: `Read "${title}" from Vision79 Digital`,
          url: articleUrl,
        });
      } catch {
        // user dismissed share sheet
      }
    }
  };

  return (
    <div
      className={`${
        variant === "block"
          ? "glass rounded-2xl p-4 sm:p-5 border border-app-border space-y-3"
          : "flex flex-wrap items-center gap-2"
      } ${className}`}
      aria-label="Share article"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-app-text-muted">
        <Share2 className="w-3.5 h-3.5 text-v79-teal" />
        <span className="font-bold">Share this post:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share this post on WhatsApp"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-white border border-emerald-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>WhatsApp</span>
        </a>

        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share this post on LinkedIn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-[#0A66C2] text-sky-600 hover:text-white dark:text-sky-400 dark:hover:text-white border border-sky-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Linkedin className="w-3.5 h-3.5" />
          <span>LinkedIn</span>
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share this post on Facebook"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-[#1877F2] text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white border border-blue-500/20 transition-all active:scale-95 cursor-pointer"
        >
          <Facebook className="w-3.5 h-3.5" />
          <span>Facebook</span>
        </a>

        {/* X / Twitter */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share this post on X (formerly Twitter)"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-500/10 hover:bg-neutral-900 text-app-text hover:text-white dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800 border border-app-border transition-all active:scale-95 cursor-pointer"
        >
          <Twitter className="w-3.5 h-3.5" />
          <span>X</span>
        </a>

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Link copied to clipboard" : "Copy article link"}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer border ${
            copied
              ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
              : "bg-app-surface text-app-text border-app-border hover:border-v79-teal/50 hover:text-v79-teal"
          }`}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-white" />
              <span>Link Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Link</span>
            </>
          )}
        </button>

        {/* Native Mobile Share if supported */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            type="button"
            onClick={handleNativeShare}
            aria-label="Open device sharing options"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-surface text-app-text-muted hover:text-app-text border border-app-border transition-all active:scale-95 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>More</span>
          </button>
        )}
      </div>
    </div>
  );
}
