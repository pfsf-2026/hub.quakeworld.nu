import { useEffect, useState } from "react";
import { useEventListener } from "usehooks-ts";
import { DISPLAY_MODE_CHANGE } from "@/utils/fullscreen";
import { useFteController } from "./hooks";

// r_tracker_x in config_v11.cfg (fraction of the screen width)
const TRACKER_X = 0.01;

// only touch the cvar on devices that have a safe area
let wasMoved = false;

// notched iphones in full-window landscape: the frag list (top left) is drawn under the
// dynamic island when it is on the left. move it right by the left safe area, which is
// 0 everywhere else (viewport-fit=cover is only set in full-window). ios reports the
// same inset on both sides in landscape, so the island side comes from the orientation
export function useTrackerSafeArea() {
  const fte = useFteController();
  const [insetLeft, setInsetLeft] = useState(0);
  // the viewport-fit change applies on the next layout
  const read = () => (isIslandOnLeft() ? readSafeAreaInsetLeft() : 0);
  const update = () => {
    setInsetLeft(read());
    requestAnimationFrame(() => setInsetLeft(read()));
  };

  useEventListener("resize", update);
  useEventListener("orientationchange", update);
  useEventListener(DISPLAY_MODE_CHANGE, update);

  useEffect(() => {
    if (!fte || (insetLeft === 0 && !wasMoved)) {
      return;
    }

    wasMoved = insetLeft > 0;
    fte.command("r_tracker_x", TRACKER_X + insetLeft / window.innerWidth);
  }, [fte, insetLeft]);
}

// the top of the phone (the island) is on the left: turned counterclockwise.
// window.orientation (ios) 90 is screen.orientation.angle 270
function isIslandOnLeft(): boolean {
  const legacy = (window as Window & { orientation?: number }).orientation;

  if (typeof legacy === "number") {
    return legacy === 90;
  }

  return screen.orientation?.angle === 270;
}

function readSafeAreaInsetLeft(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;padding-left:env(safe-area-inset-left)";
  document.body.appendChild(probe);
  const inset = Number.parseFloat(getComputedStyle(probe).paddingLeft) || 0;
  probe.remove();
  return inset;
}
