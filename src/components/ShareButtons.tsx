import React, { useState } from "react";
import {
  Share2,
  Copy,
  Check,
  Linkedin,
  Facebook,
  Twitter,
  MessageCircle,
  Image as ImageIcon,
  Send,
} from "lucide-react";

interface ShareButtonsProps {
  title: string;
  slug: string;
  imageUrl?: string;
  coverImage?: string;
  description?: string;
  category?: string;
  className?: string;
  variant?: "inline" | "block";
}

export function ShareButtons({
  title,
  slug,
  imageUrl,
  coverImage,
  description,
  category,
  className = "",
  variant = "inline",
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [isSharingImage, setIsSharingImage] = useState(false);

  const finalImageUrl = imageUrl || coverImage || "";

  // Generate complete, shareable direct link to this specific article
  const getArticleUrl = () => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set("article", slug);
      return url.toString();
    }
    return `https://v79sl.com/?article=${slug}`;
  };

  const getAbsoluteImageUrl = () => {
    if (!finalImageUrl) {
      return typeof window !== "undefined"
        ? `${window.location.origin}/og-image.png`
        : "https://v79sl.com/og-image.png";
    }
    if (finalImageUrl.startsWith("http://") || finalImageUrl.startsWith("https://")) {
      return finalImageUrl;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "https://v79sl.com";
    return `${origin}${finalImageUrl.startsWith("/") ? "" : "/"}${finalImageUrl}`;
  };

  const articleUrl = getArticleUrl();
  const absoluteImageUrl = getAbsoluteImageUrl();
  const encodedUrl = encodeURIComponent(articleUrl);
  const encodedTitle = encodeURIComponent(`${title} | Vision79 Digital`);
  const encodedImageUrl = encodeURIComponent(absoluteImageUrl);
  const encodedDesc = encodeURIComponent(description || title);
  
  // WhatsApp formatted text with title, description, and link
  const whatsappText = encodeURIComponent(
    `*${title}*\n\n${description ? `${description}\n\n` : ""}📖 Read the full article on Vision79 Digital:\n${articleUrl}`
  );

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      setIsSharingImage(true);
      try {
        // Try sharing with image file if supported
        if (finalImageUrl && navigator.canShare) {
          try {
            const res = await fetch(absoluteImageUrl, { mode: "cors" });
            if (res.ok) {
              const blob = await res.blob();
              const file = new File([blob], `${slug}-cover.jpg`, { type: blob.type || "image/jpeg" });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title,
                  text: `${title} - Read more on Vision79 Digital`,
                  url: articleUrl,
                  files: [file],
                });
                setIsSharingImage(false);
                return;
              }
            }
          } catch {
            // Fall back to standard URL sharing
          }
        }

        // Standard URL share fallback
        await navigator.share({
          title,
          text: description ? `${title}\n\n${description}` : `Read "${title}" on Vision79 Digital`,
          url: articleUrl,
        });
      } catch {
        // User dismissed share dialog
      } finally {
        setIsSharingImage(false);
      }
    }
  };

  return (
    <div
      className={`${
        variant === "block"
          ? "glass rounded-2xl p-5 border border-app-border space-y-4"
          : "flex flex-wrap items-center gap-2"
      } ${className}`}
      aria-label="Share article"
    >
      {variant === "block" && (
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-app-border/60">
          <div className="flex items-center gap-3 min-w-0">
            {finalImageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-app-border bg-slate-900 shadow-sm">
                <img
                  src={finalImageUrl}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-v79-teal font-bold">
                <Share2 className="w-3.5 h-3.5" />
                <span>Share this post</span>
              </div>
              <p className="text-xs text-app-text-sec truncate font-medium max-w-sm sm:max-w-md">
                {title}
              </p>
            </div>
          </div>
          {finalImageUrl && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
              <ImageIcon className="w-3 h-3" />
              Includes Post Image
            </span>
          )}
        </div>
      )}

      {variant === "inline" && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-app-text-muted mr-1">
          <Share2 className="w-3.5 h-3.5 text-v79-teal" />
          <span className="font-bold">Share post:</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {/* WhatsApp */}
        <a
          href={`https://wa.me/?text=${whatsappText}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Share this post on WhatsApp"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-600 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-white border border-emerald-500/20 transition-all active:scale-95 cursor-pointer shadow-sm"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-500/10 hover:bg-[#0A66C2] text-sky-600 hover:text-white dark:text-sky-400 dark:hover:text-white border border-sky-500/20 transition-all active:scale-95 cursor-pointer shadow-sm"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-[#1877F2] text-blue-600 hover:text-white dark:text-blue-400 dark:hover:text-white border border-blue-500/20 transition-all active:scale-95 cursor-pointer shadow-sm"
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
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-500/10 hover:bg-neutral-900 text-app-text hover:text-white dark:text-neutral-300 dark:hover:text-white dark:hover:bg-neutral-800 border border-app-border transition-all active:scale-95 cursor-pointer shadow-sm"
        >
          <Twitter className="w-3.5 h-3.5" />
          <span>X</span>
        </a>

        {/* Pinterest with Post Cover Image */}
        {finalImageUrl && (
          <a
            href={`https://pinterest.com/pin/create/button/?url=${encodedUrl}&media=${encodedImageUrl}&description=${encodedTitle}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Pin this post image on Pinterest"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 hover:bg-red-600 text-red-600 hover:text-white dark:text-red-400 dark:hover:text-white border border-red-500/20 transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Pinterest</span>
          </a>
        )}

        {/* Copy Link */}
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Link copied to clipboard" : "Copy article link"}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 cursor-pointer border shadow-sm ${
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

        {/* Native Mobile Share (Supports OS image attachment) */}
        {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
          <button
            type="button"
            onClick={handleNativeShare}
            disabled={isSharingImage}
            aria-label="Open device sharing options"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-app-surface text-app-text-muted hover:text-app-text border border-app-border transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isSharingImage ? "Sharing..." : "More"}</span>
          </button>
        )}
      </div>
    </div>
  );
}
