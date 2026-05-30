"use client";

import { useEffect, useRef } from "react";

interface AnimatedCounterProps {
  target: number;
  className?: string;
}

/**
 * Counts up from 0 to `target` with an ease-out animation once the element
 * enters the viewport (IntersectionObserver). Safe to unmount mid-animation.
 */
export function AnimatedCounter({ target, className }: AnimatedCounterProps) {
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const element = counterRef.current;
    if (!element) return;

    let frameId = 0;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;

        const duration = 2000;
        const startTime = performance.now();

        const tick = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / duration, 1);
          const eased = progress * (2 - progress); // ease-out quad
          const current = Math.floor(eased * target);

          if (counterRef.current) {
            counterRef.current.innerText = String(current);
          }

          if (progress < 1) {
            frameId = window.requestAnimationFrame(tick);
            return;
          }

          if (counterRef.current) {
            counterRef.current.innerText = String(target);
          }
        };

        frameId = window.requestAnimationFrame(tick);
        observer.disconnect();
      },
      { threshold: 0.1 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameId);
    };
  }, [target]);

  return (
    <span ref={counterRef} className={className}>
      0
    </span>
  );
}
