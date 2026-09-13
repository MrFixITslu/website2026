import React from "react";

interface V79MarkProps {
  className?: string;
  size?: number | string;
}

/**
 * Official V79 Digital Ribbon & Pixel Mark
 * Renders the authentic, high-resolution official brand mark.
 */
export function V79Mark({ className = "w-9 h-9", size }: V79MarkProps) {
  return (
    <img
      src="/v79-mark.png"
      alt="V79 Digital Brand Mark"
      className={`object-contain select-none pointer-events-none drop-shadow-[0_4px_12px_rgba(0,168,232,0.35)] ${className}`}
      style={size ? { width: size, height: size } : undefined}
      loading="eager"
      decoding="async"
      draggable={false}
    />
  );
}

export interface V79OfficialLogoProps {
  className?: string;
  showMark?: boolean;
  showTagline?: boolean;
  inverted?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

/**
 * Full Official V79 Digital Brand Lockup
 */
export function V79OfficialLogo({
  className = "",
  showMark = true,
  showTagline = false,
  inverted = false,
  size = "md",
}: V79OfficialLogoProps) {
  // Size configurations
  const markSizeClasses = {
    sm: "w-7 h-7",
    md: "w-9 h-9 sm:w-10 sm:h-10",
    lg: "w-14 h-14 sm:w-16 sm:h-16",
    xl: "w-16 h-16 sm:w-20 sm:h-20",
  }[size];

  const titleSizeClasses = {
    sm: "text-sm",
    md: "text-base sm:text-lg",
    lg: "text-xl sm:text-2xl",
    xl: "text-2xl sm:text-3xl",
  }[size];

  const taglineSizeClasses = {
    sm: "text-[8px] tracking-[0.18em]",
    md: "text-[9px] sm:text-[10px] tracking-[0.22em]",
    lg: "text-[10px] sm:text-xs tracking-[0.25em]",
    xl: "text-xs sm:text-sm tracking-[0.28em]",
  }[size];

  return (
    <div className={`flex items-center gap-3.5 select-none ${className}`}>
      {showMark && (
        <div className="relative shrink-0 flex items-center justify-center">
          <V79Mark className={`${markSizeClasses} transition-transform duration-200 group-hover:scale-105`} />
        </div>
      )}
      <div className="flex flex-col text-left justify-center">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span
            className={`font-display font-black tracking-tight ${titleSizeClasses} ${
              inverted ? "text-white" : "text-app-text dark:text-white"
            }`}
          >
            V79
          </span>
          <span
            className={`font-display font-bold tracking-tight ${titleSizeClasses} ${
              inverted ? "text-sky-400" : "text-v79-teal dark:text-v79-teal-light"
            }`}
          >
            Digital
          </span>
        </div>
        {showTagline ? (
          <span
            className={`font-mono font-bold uppercase mt-1 ${taglineSizeClasses} ${
              inverted ? "text-sky-300/90" : "text-app-text-sec"
            }`}
          >
            FROM IDEA TO ADVANTAGE
          </span>
        ) : (
          <span
            className={`font-mono font-semibold uppercase mt-0.5 text-[10px] tracking-wider ${
              inverted ? "text-white/70" : "text-app-text-sec"
            }`}
          >
            ICT SOLUTIONS
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Dedicated Full Footer Brand Lockup with Prominent Mark and High-Contrast Visibility
 * Uses the white background mark for light mode and the black/neon circular mark for dark mode.
 */
export function V79FooterLogo({ className = "" }: { className?: string }) {
  const [lightSrc, setLightSrc] = React.useState("/social%20profile%20pics3.png");
  const [darkSrc, setDarkSrc] = React.useState("/social%20profile%20pics.png");

  return (
    <div className={`flex items-center gap-4 select-none ${className}`}>
      {/* Light Mode Logo Image */}
      <div className="relative shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-md border border-slate-200/80 bg-white p-1 block dark:hidden">
        <img
          src={lightSrc}
          alt="Vision79 Digital Logo (Light)"
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl select-none"
          loading="eager"
          decoding="async"
          onError={() => {
            if (lightSrc !== "/v79-footer-light.png") {
              setLightSrc("/v79-footer-light.png");
            }
          }}
        />
      </div>

      {/* Dark Mode Logo Image */}
      <div className="relative shrink-0 items-center justify-center rounded-2xl overflow-hidden shadow-[0_0_24px_rgba(0,229,255,0.35)] border border-sky-500/30 bg-[#020b18] p-1 hidden dark:flex">
        <img
          src={darkSrc}
          alt="Vision79 Digital Logo (Dark)"
          className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-xl select-none"
          loading="eager"
          decoding="async"
          onError={() => {
            if (darkSrc !== "/v79-footer-dark.png") {
              setDarkSrc("/v79-footer-dark.png");
            }
          }}
        />
      </div>

      <div className="flex flex-col text-left justify-center">
        <div className="flex items-baseline gap-2 leading-none">
          <span className="font-display font-black text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white">
            V79
          </span>
          <span className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-v79-teal dark:text-sky-400">
            Digital
          </span>
        </div>
        <span className="font-mono font-bold text-[10px] sm:text-[11px] tracking-[0.25em] uppercase mt-1 text-slate-700 dark:text-v79-teal-light">
          FROM IDEA TO ADVANTAGE
        </span>
        <span className="text-[10px] font-mono text-slate-500 dark:text-white/50 tracking-wider uppercase mt-0.5">
          ENTERPRISE ICT &amp; CYBERSECURITY
        </span>
      </div>
    </div>
  );
}


