import * as Slider from "@radix-ui/react-slider";
import clsx from "clsx";
import { type MouseEvent, useEffect, useRef, useState } from "react";
import { useClipEditor } from "@/features/demo-player/clips/clip-editor";
import { useClipPlaylist } from "@/features/demo-player/clips/clip-playlist";
import { getTrackBackground } from "@/features/demo-player/utils/track-background";
import { useHover } from "@/hooks/use-hover";
import { useThrottle } from "@/hooks/use-throttle";
import { useUpdateInterval } from "@/hooks/use-update-interval";
import { useFteController } from "@/lib/fte/hooks";
import { useUrlClipParams } from "@/utils/game-url";
import { isIOS } from "@/utils/ios";
import { formatElapsed } from "@/utils/time";

export function TimeSlider() {
  const fte = useFteController();
  const sliderWrapperRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const isHover = useHover(sliderWrapperRef);
  const sliderRootRef = useRef<HTMLDivElement | null>(null);

  const countdownLength = fte ? fte.getCountdownDuration() : 10;
  const maxValue = fte ? fte.getDemoDuration() : 1210;

  // update tooltip directly (no re-render), only while hovering the slider
  function handleMouseMove(e: MouseEvent) {
    if (!tooltipRef.current || !sliderRootRef.current) {
      return;
    }

    const { left, width: sliderWidth } =
      sliderRootRef.current.getBoundingClientRect();
    const elementX = e.pageX - (left + window.scrollX);
    const progress = elementX / sliderWidth;
    const seekTime = Math.round(progress * maxValue);

    tooltipRef.current.textContent = formatElapsed(seekTime - countdownLength);
    tooltipRef.current.style.left = `${elementX - 10}px`; // -10 to center tooltip
  }

  return (
    <>
      <div
        className={clsx(
          { hidden: !isHover },
          "absolute bottom-24 text-xs font-mono px-2 py-1 bg-violet-800 text-white rounded z-50",
        )}
        ref={tooltipRef}
      />
      <div
        className="w-full"
        ref={sliderWrapperRef}
        onMouseMove={handleMouseMove}
      >
        <div ref={sliderRootRef}>
          <SliderRoot max={maxValue} countdownLength={countdownLength} />
        </div>
      </div>
    </>
  );
}

// touch (ios): no hover, so the slider is finger sized, shows the time while dragging
// and seeks once on release (seeking on every move stutters on phones)
const isTouch = isIOS();

const SliderRoot = ({
  max,
  countdownLength,
}: {
  max: number;
  countdownLength: number;
}) => {
  const fte = useFteController();
  const { range: clipRange, isEnabled: clipEditorEnabled } = useClipEditor();
  const { from, to, hasParams } = useUrlClipParams();
  const { clips } = useClipPlaylist();
  const [jump, setJump] = useState<number>(-1);
  const throttledJump = useThrottle(jump, 200);
  const [dragValue, setDragValue] = useState<number | null>(null);
  const releaseTimeout = useRef<number | undefined>(undefined);
  const restTimeout = useRef<number | undefined>(undefined);
  const seek = useSingleSeek();
  useUpdateInterval(fte ? 100 : null);

  useEffect(() => {
    if (fte) {
      if (jump < 0) {
        return;
      }
      fte.demoJump(throttledJump);
    }
  }, [fte, throttledJump]);

  if (!fte) {
    return null;
  }

  function handleValueChange(values: number[]) {
    if (values.length === 0) {
      return;
    }

    if (isTouch) {
      window.clearTimeout(releaseTimeout.current);
      setDragValue(values[0]);
      // scrubbing: seek where the finger rests, not on every move
      window.clearTimeout(restTimeout.current);
      restTimeout.current = window.setTimeout(
        () => seek(values[0]),
        SCRUB_REST_MS,
      );
    } else if (fte) {
      setJump(values[0]);
    }
  }

  function handleValueCommit(values: number[]) {
    if (!isTouch || !fte || values.length === 0) {
      return;
    }

    window.clearTimeout(restTimeout.current);
    seek(values[0]);
    // keep the thumb where it was released until the engine has caught up
    releaseTimeout.current = window.setTimeout(() => setDragValue(null), 500);
  }

  const isDragging = dragValue !== null;
  const value = dragValue ?? fte.getDemoElapsedTime();

  const min = 0;
  let range = [0, 0];
  let rangeColors = ["#444", "#80f", "#444"];

  if (clipEditorEnabled) {
    range = clipRange;
  } else if (hasParams) {
    range = [from, to];
  } else if (clips.length > 0) {
    range = mergeRanges(clips.map((c) => [c.from, c.to])).flat();
    rangeColors = [...range.map((_, i) => (i % 2 ? "#80f" : "#444")), "#444"];
  }

  const useRange = range[1] > 0;

  return (
    <Slider.Root
      className={clsx(
        "relative flex items-center select-none touch-none w-full group cursor-pointer transition-opacity duration-500",
        isTouch ? "h-11" : "h-8",
      )}
      value={[value]}
      onValueChange={handleValueChange}
      onValueCommit={handleValueCommit}
      // ios may cancel a touch (system gesture): drop the drag, no seek
      onPointerCancel={() => setDragValue(null)}
      min={min}
      max={max}
      step={1}
    >
      {isTouch && isDragging && (
        <div
          className="absolute bottom-full -translate-x-1/2 mb-1 text-xs font-mono px-2 py-1 bg-violet-800 text-white rounded z-50 pointer-events-none"
          style={{
            left: `clamp(1.75rem, ${(value / max) * 100}%, calc(100% - 1.75rem))`,
          }}
        >
          {formatElapsed(value - countdownLength)}
        </div>
      )}

      <div
        className={clsx("absolute w-full h-2", {
          "opacity-0": !useRange,
        })}
        style={{
          background: getTrackBackground({
            values: range,
            colors: rangeColors,
            min,
            max,
          }),
        }}
      />

      <Slider.Track
        className={clsx(
          "relative grow transition-size group-hover:h-2 bg-gray-500",
          isTouch ? "h-2 rounded-full" : "h-1",
          { "opacity-0": useRange },
        )}
      >
        <Slider.Range
          className={clsx(
            "absolute h-full bg-violet-700 group-hover:bg-violet-600",
            { "opacity-0": useRange },
          )}
        />
      </Slider.Track>

      <Slider.Thumb
        className={clsx(
          "block focus:outline-hidden pointer-events-none transition-size",
          isTouch
            ? clsx("w-5 h-5 rounded-full bg-white shadow", {
                "scale-125": isDragging,
              })
            : {
                "w-1 h-5 bg-white": useRange,
                "w-1 h-3 bg-violet-500 group-hover:bg-white group-hover:h-5":
                  !useRange,
              },
        )}
      />
    </Slider.Root>
  );
};

// touch scrubbing: how long the finger rests before the demo seeks there
const SCRUB_REST_MS = 200;
// a seek is done when playback is this close to the target (seconds), or after the timeout
const SEEK_DONE_DISTANCE = 1.5;
const SEEK_TIMEOUT_MS = 1500;

// one seek at a time: a seek requested while the engine is still seeking waits,
// and only the latest one runs (queued seeks make playback jitter on phones)
function useSingleSeek() {
  const fte = useFteController();
  const state = useRef<{ busy: boolean; next: number | null }>({
    busy: false,
    next: null,
  });

  function seek(time: number) {
    if (!fte) {
      return;
    }

    if (state.current.busy) {
      state.current.next = time;
      return;
    }

    state.current.busy = true;
    fte.demoJump(time);
    const startedAt = Date.now();

    const poll = window.setInterval(() => {
      const isDone =
        Math.abs(fte.getDemoElapsedTime() - time) < SEEK_DONE_DISTANCE ||
        Date.now() - startedAt > SEEK_TIMEOUT_MS;

      if (!isDone) {
        return;
      }

      window.clearInterval(poll);
      state.current.busy = false;
      const { next } = state.current;
      state.current.next = null;

      if (next !== null && next !== time) {
        seek(next);
      }
    }, 50);
  }

  return seek;
}

// sorted, non-overlapping ranges (required by getTrackBackground)
function mergeRanges(ranges: number[][]): number[][] {
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: number[][] = [];

  for (const [from, to] of sorted) {
    const last = merged[merged.length - 1];

    if (last && from <= last[1]) {
      last[1] = Math.max(last[1], to);
    } else {
      merged.push([from, to]);
    }
  }

  return merged;
}
