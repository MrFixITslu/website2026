import { ReactNode, ComponentProps } from "react";
import { motion } from "motion/react";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

// Color/shape only — no padding here, so callers never need to fight
// Tailwind's generated stylesheet order to override it (see Size below).
const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/20 rounded-xl font-bold",
  secondary: "bg-app-aside-bg border border-app-border text-app-text hover:bg-app-aside-bg/80 rounded-xl font-semibold",
  ghost: "text-indigo-400 hover:text-indigo-300 font-semibold",
};

// Padding only applies to primary/secondary — ghost is an inline text link.
// Kept as a separate, mutually-exclusive prop (not something merged into
// variant strings) precisely so it's never in conflict with another padding
// utility on the same element.
const SIZE_CLASSES: Record<Size, string> = {
  md: "px-6 py-3",
  lg: "px-7 py-3.5",
};

const BASE_CLASSES =
  "inline-flex items-center gap-2 text-sm transition-all cursor-pointer " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-app-bg";

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  iconBefore?: ReactNode;
  /** Additive classes only (e.g. "group", "w-full") — not for overriding color/padding/shape, which come from variant+size. */
  className?: string;
  children: ReactNode;
}

// Typed against motion.button/motion.a's own prop types (not raw HTML attributes)
// so spreading `rest` doesn't conflict with Framer Motion's drag event signatures.
type ButtonAsButton = CommonProps &
  Omit<ComponentProps<typeof motion.button>, "className" | "children"> & {
    href?: undefined;
  };

type ButtonAsAnchor = CommonProps &
  Omit<ComponentProps<typeof motion.a>, "className" | "children"> & {
    href: string;
  };

type ButtonProps = ButtonAsButton | ButtonAsAnchor;

/**
 * Shared CTA button. Renders as <a> when `href` is passed, otherwise <button>.
 * Consolidates the primary/secondary/ghost button styles that were previously
 * duplicated as raw className strings across Home/Services/Contact/About.
 */
export function Button({ variant = "primary", size = "md", icon, iconBefore, className = "", children, ...rest }: ButtonProps) {
  const sizeClasses = variant === "ghost" ? "" : SIZE_CLASSES[size];
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${sizeClasses} ${className}`;

  const content = (
    <>
      {iconBefore}
      {children}
      {icon}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    const anchorProps = rest as ComponentProps<typeof motion.a>;
    return (
      <motion.a whileTap={{ scale: 0.97 }} className={classes} {...anchorProps}>
        {content}
      </motion.a>
    );
  }

  const buttonProps = rest as ComponentProps<typeof motion.button>;
  return (
    <motion.button whileTap={{ scale: 0.97 }} className={classes} {...buttonProps}>
      {content}
    </motion.button>
  );
}
