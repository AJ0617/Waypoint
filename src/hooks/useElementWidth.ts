import { useEffect, useRef, useState } from 'react';

/** Tracks an element's content width, clamped to [min, max], for responsive canvas sizing. */
export function useElementWidth(min: number, max: number, fallback: number) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.max(min, Math.min(max, w)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [min, max]);

  return { ref, width };
}
