import React from "react";

// Original uploaded artwork: do not crop, recolour, filter or rebuild as text.
const LOGO_SRC = "/v79-digital-original.png";
const LOGO_ALT = "V79 Digital — From Idea to Advantage";

interface V79MarkProps {
  className?: string;
  size?: number | string;
}

export function V79Mark({ className = "w-14 h-14", size }: V79MarkProps) {
  return (
    <img src={LOGO_SRC} alt={LOGO_ALT} width={1254} height={1254}
      className={`block object-contain shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      decoding="async" draggable={false} />
  );
}

export interface V79OfficialLogoProps {
  className?: string;
  showMark?: boolean;
  showTagline?: boolean;
  inverted?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

// Legacy display flags remain accepted for callers, but the artwork stays intact.
export function V79OfficialLogo({
  className = "", size = "md",
}: V79OfficialLogoProps) {
  const sizes = {
    sm: "w-12 h-12",
    md: "w-24 h-24",
    lg: "w-48 h-48 sm:w-56 sm:h-56",
    xl: "w-60 h-60 sm:w-72 sm:h-72",
  };
  return <V79Mark className={`${sizes[size]} ${className}`} />;
}

export function V79FooterLogo({ className = "" }: { className?: string }) {
  return <V79OfficialLogo size="lg" className={className} />;
}
