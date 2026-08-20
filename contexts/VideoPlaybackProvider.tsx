import React, {
  createContext,
  useContext,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Dimensions } from 'react-native';

/**
 * VideoPlaybackProvider
 * ------------------------------------------------------------------
 * Central place that decides WHICH autoplaying video cards should actually
 * play. Rules (matches the product requirement):
 *
 *    • A video STARTS playing only when it is ~100% visible on screen.
 *    • Once playing, it keeps playing until ~30% of it is hidden at the top OR
 *      bottom edge, then it PAUSES.
 *    • Never more than MAX_ACTIVE_VIDEOS play at the same time.
 *    • Among the playing videos, the ones closest to the vertical center of the
 *      screen (the middle videos) play first, then we fill up to the cap with
 *      other eligible videos.
 *
 * Implementation:
 *   1. Every mounted video card registers itself together with a way to
 *      measure its current on-screen vertical position (top/bottom).
 *   2. Whenever the user scrolls (or the layout changes), we re-measure the
 *      registered cards, compute how much is hidden at the top/bottom edge,
 *      apply the start(100%)/stop(30%) hysteresis, prioritize by center
 *      distance, and cap the result at MAX_ACTIVE_VIDEOS.
  *   3. Only active cards create / keep a native video player, so memory stays
 *      low and scrolling stays smooth.
 *
 *   4. Screen-focus awareness: cards from a backgrounded screen (e.g. when
 *      navigating from Home → TopFreelancerList) unregister themselves so they
 *      can't compete for playback slots. Each list component calls pauseAll()
 *      when its screen blurs and markScrolled() when its screen focuses.
 */

export type VideoRect = { top: number; bottom: number };

// A function that measures the card's window position. `measureInWindow` is
// async, so we pass the result back through a callback.
export type VideoMeasureFn = (cb: (rect: VideoRect | null) => void) => void;

export type VideoPlaybackOptions = {
  /** Maximum native players this screen may activate at once. */
  maxActive?: number;
};

type VideoPlaybackContextType = {
  /** Whether the given registered card should currently be playing. */
  isActive: (id: string) => boolean;
  /**
   * Registers a card so it can participate in playback selection.
   * Returns an unsubscribe function to call on unmount.
   */
  register: (id: string, measure: VideoMeasureFn, options?: VideoPlaybackOptions) => () => void;
    /** Call this from the list's onScroll to re-evaluate which videos play. */
  markScrolled: () => void;
  /**
   * Immediately clears all active video selections (pauses every playing card).
   * Call this when the hosting screen loses focus so videos from a backgrounded
   * screen don't keep playing or compete for playback slots on the new screen.
   */
  pauseAll: () => void;
};

const VideoPlaybackContext = createContext<VideoPlaybackContextType | null>(null);

// Hard cap on how many videos can play at the same time.
// Out of N visible cards, only this many play — the rest show their poster
// (paused but player kept alive via everActiveRef for instant resume).
const DEFAULT_MAX_ACTIVE_VIDEOS = 4;

// While a video is already playing, it keeps playing until 30%+ of it is
// hidden at the top OR bottom edge, then it pauses.
const HIDDEN_STOP_RATIO = 0.3;

// A video only STARTS playing when it is essentially 100% visible (a tiny
// tolerance avoids floating-point edge cases in measureInWindow).
const FULLY_VISIBLE_RATIO = 0.02;

// Throttle how often we re-measure on-screen geometry. Each measure call is a
// synchronous bridge round-trip per visible card, so during a fast scroll we
// cap frequency to ~40fps. A guaranteed *trailing* measure (queued via rAF)
// ensures we always settle on the final, accurate geometry — we never drop the
// post-scroll state.
const MEASURE_THROTTLE_MS = 24;

// Defensive no-op fallback (used if a consumer renders without the provider,
// e.g. in tests/isolated previews). Videos simply won't autoplay there.
const NULL_CONTEXT: VideoPlaybackContextType = {
  isActive: () => false,
  register: () => () => {},
  markScrolled: () => {},
  pauseAll: () => {},
};


export function VideoPlaybackProvider({ children }: { children: React.ReactNode }) {
  const registrationsRef = useRef<
    Map<string, { measure: VideoMeasureFn; maxActive: number }>
  >(new Map());

  const [activeIds, setActiveIds] = useState<ReadonlySet<string>>(new Set());
  const activeRef = useRef<ReadonlySet<string>>(new Set());

  // Per-card "currently playing" latch for hysteresis: a card STARTS only when
  // it is ~100% visible, but keeps playing until 30% of it is hidden at an edge.
  const activeStateRef = useRef<Map<string, boolean>>(new Map());

    const rafRef = useRef<number | null>(null);
  const trailingRafRef = useRef<number | null>(null);
  const pendingRef = useRef(false);
  const measuringRef = useRef(false);
  const lastMeasureTsRef = useRef(0);

  const applyActive = useCallback((next: Set<string>) => {
    const prev = activeRef.current;
    let changed = prev.size !== next.size;
    if (!changed) {
      for (const id of next) {
        if (!prev.has(id)) {
          changed = true;
          break;
        }
      }
    }
    if (!changed) return;

    activeRef.current = next;
    setActiveIds(next);
    }, []);

  // ─── Screen focus ───────────────────────────────────────────────────────────
  // Called by list components when their screen loses focus. Immediately clears
  // the active set so every playing card pauses in the same frame — no need to
  // wait for the next measureAll() cycle. The hysteresis latch (activeStateRef)
  // is intentionally NOT cleared so cards can resume smoothly when the user
  // navigates back to the screen.
  const pauseAll = useCallback(() => {
    activeRef.current = new Set();
    setActiveIds(new Set());
  }, []);

  const measureAll = useCallback(() => {
    if (measuringRef.current) return;
    const now = Date.now();
    if (now - lastMeasureTsRef.current < MEASURE_THROTTLE_MS) {
      // Throttle frequent scroll pings. Queue a guaranteed trailing measure so
      // we never settle on stale geometry (see MEASURE_THROTTLE_MS above).
      pendingRef.current = true;
      if (trailingRafRef.current == null) {
        trailingRafRef.current = requestAnimationFrame(() => {
          trailingRafRef.current = null;
          measureAll();
        });
      }
      return;
    }
    lastMeasureTsRef.current = now;
    const regs = registrationsRef.current;
    if (regs.size === 0) return;

    measuringRef.current = true;
    const windowHeight = Dimensions.get('window').height;
    const centerLine = windowHeight / 2;

    const results = new Map<string, VideoRect>();
    const ids = [...regs.keys()];
    let remaining = ids.length;
    let settled = false;

    const settle = () => {
      if (settled) return;
      settled = true;
      measuringRef.current = false;

      // Selection:
      //   1. A card starts playing only when it is ~100% visible.
      //   2. Once playing, it keeps playing until ~30% is hidden at the top OR
      //      bottom edge (then it pauses). This gives hysteresis so videos
      //      don't flicker while scrolling.
      //   3. Among the playing cards we prioritize the ones closest to the
      //      vertical center of the screen (the middle videos play first).
      //   4. We never play more than MAX_ACTIVE_VIDEOS at once.
      const candidates: { id: string; distance: number; maxActive: number }[] = [];
            // Prune the hysteresis latch for cards that have since unmounted so the
      // map can't grow unbounded as the user scrolls through thousands of items.
      for (const id of activeStateRef.current.keys()) {
        if (!registrationsRef.current.has(id)) activeStateRef.current.delete(id);
      }

      const latch = activeStateRef.current;
      results.forEach((rect, id) => {
        // A card may have unmounted mid-measure; ignore stale measurements.
        if (!registrationsRef.current.has(id)) return;
        const totalHeight = rect.bottom - rect.top;
        if (totalHeight <= 0) return;

        const hiddenTop = Math.max(0, -rect.top);
        const hiddenBottom = Math.max(0, rect.bottom - windowHeight);
        const hiddenTopRatio = hiddenTop / totalHeight;
        const hiddenBottomRatio = hiddenBottom / totalHeight;

        const wasPlaying = latch.get(id) ?? false;
        // Start only when fully visible; keep playing until 30% hidden at either edge.
        const eligible = wasPlaying
          ? hiddenTopRatio <= HIDDEN_STOP_RATIO &&
            hiddenBottomRatio <= HIDDEN_STOP_RATIO
          : hiddenTopRatio <= FULLY_VISIBLE_RATIO &&
            hiddenBottomRatio <= FULLY_VISIBLE_RATIO;

        latch.set(id, eligible);
        if (!eligible) return;

        const center = (rect.top + rect.bottom) / 2;
        candidates.push({
          id,
          distance: Math.abs(center - centerLine),
          maxActive: registrationsRef.current.get(id)?.maxActive ?? DEFAULT_MAX_ACTIVE_VIDEOS,
        });
      });

      candidates.sort((a, b) => a.distance - b.distance);
      // A focused screen uses one limit for all of its cards. Picking the
      // smallest value is also safe during screen transitions.
      const maxActive = candidates.length
        ? Math.min(...candidates.map((candidate) => candidate.maxActive))
        : DEFAULT_MAX_ACTIVE_VIDEOS;
      const next = new Set<string>(candidates.slice(0, maxActive).map((c) => c.id));
      applyActive(next);

      // If a re-measure was requested while we were measuring, run again.
      if (pendingRef.current) {
        pendingRef.current = false;
        scheduleMeasureAllRef.current?.();
      }
    };

    const done = () => {
      remaining -= 1;
      if (remaining <= 0) settle();
    };

    // Safety: if any measureInWindow callback never fires, flush what we have.
    setTimeout(() => {
      if (!settled) settle();
    }, 50);

    ids.forEach((id) => {
      const registration = regs.get(id);
      if (!registration) {
        done();
        return;
      }
      registration.measure((rect) => {
        if (rect) results.set(id, rect);
        else results.delete(id);
        done();
      });
    });
  }, [applyActive]);

  const scheduleMeasureAllRef = useRef<(() => void) | null>(null);

  const scheduleMeasureAll = useCallback(() => {
    pendingRef.current = true;
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      pendingRef.current = false;
      measureAll();
    });
  }, [measureAll]);

  scheduleMeasureAllRef.current = scheduleMeasureAll;

    useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      if (trailingRafRef.current != null) cancelAnimationFrame(trailingRafRef.current);
    },
    []
  );

  const register = useCallback(
    (id: string, measure: VideoMeasureFn, options?: VideoPlaybackOptions) => {
      registrationsRef.current.set(id, {
        measure,
        maxActive: Math.max(1, options?.maxActive ?? DEFAULT_MAX_ACTIVE_VIDEOS),
      });
      scheduleMeasureAll();
      return () => {
        registrationsRef.current.delete(id);
        scheduleMeasureAll();
      };
    },
    [scheduleMeasureAll]
  );

    const value = useMemo<VideoPlaybackContextType>(
    () => ({
      isActive: (id: string) => activeIds.has(id),
      register,
      markScrolled: scheduleMeasureAll,
      pauseAll,
    }),
    [activeIds, register, scheduleMeasureAll, pauseAll]
  );

  return <VideoPlaybackContext.Provider value={value}>{children}</VideoPlaybackContext.Provider>;
}


export function useVideoPlayback(): VideoPlaybackContextType {
  const ctx = useContext(VideoPlaybackContext);
  return ctx ?? NULL_CONTEXT;
}
