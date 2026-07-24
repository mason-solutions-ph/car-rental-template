"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Current time in ms quantized to `intervalMs`, or null on the server and
 * during hydration. useSyncExternalStore serves the null server snapshot for
 * the hydration render, then re-renders with real time once subscribed: no
 * mismatch and no setState-in-effect.
 */
export function useNowMs(intervalMs: number): number | null {
  const subscribe = useCallback(
    (onTick: () => void) => {
      const id = setInterval(onTick, intervalMs);
      return () => clearInterval(id);
    },
    [intervalMs]
  );
  const tick = useSyncExternalStore<number | null>(
    subscribe,
    () => Math.floor(Date.now() / intervalMs),
    () => null
  );
  return tick === null ? null : tick * intervalMs;
}
