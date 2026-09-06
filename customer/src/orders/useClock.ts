import { useEffect, useState } from "react";

// Returns a live epoch timestamp (ms) that updates on the given interval.
// Used instead of calling Date.now() during render, which is impure. The initial
// value is computed lazily in the state initialiser (also outside render) so the
// returned value is always a snapshot from a tick, never a render-time call.
export function useClock(intervalMs = 60000): number {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const start = setTimeout(() => setNow(Date.now()), intervalMs);
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => {
      clearTimeout(start);
      clearInterval(interval);
    };
  }, [intervalMs]);

  return now;
}
