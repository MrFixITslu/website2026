import { AnimatePresence, motion } from "motion/react";
import { AlertCircle } from "lucide-react";

/**
 * Animates in/out and uses role="alert" so screen readers announce the
 * message the moment it mounts, without needing a persistent aria-live
 * container. Renders nothing when `message` is falsy.
 */
export function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: "auto", marginTop: 4 }}
          exit={{ opacity: 0, height: 0, marginTop: 0 }}
          transition={{ duration: 0.18 }}
          role="alert"
          className="text-[10px] text-rose-400 flex items-center gap-1 overflow-hidden"
        >
          <AlertCircle className="w-3 h-3 shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}
