// Native `window.scrollTo({ behavior: "smooth" })` varies a lot across
// browsers, and on most of them a long jump covers the whole distance in
// roughly the same short time as a short one — which reads as an abrupt
// blur rather than a deliberate transition. This animates it manually
// instead: an ease-in-out curve, and a duration that scales gently with
// distance (capped both ends) so short hops stay snappy and long ones feel
// purposeful rather than rushed. Respects prefers-reduced-motion.
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function animateScrollTo(targetY: number) {
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  if (prefersReducedMotion || Math.abs(distance) < 2) {
    window.scrollTo(0, targetY);
    return;
  }

  const duration = Math.min(1100, Math.max(450, Math.abs(distance) * 0.5));
  const startTime = performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}
