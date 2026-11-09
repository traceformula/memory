import { useEffect, useRef, useState } from "react";

// Re-renders every `ms` while `on`, for clocks.
export function useTick(on, ms = 200) {
  const [, set] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [on, ms]);
}


// Keyboard shortcuts for the whole page, ignored while typing in a form field.
export function useKeys(handler) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  useEffect(() => {
    const f = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      ref.current(e);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
}
