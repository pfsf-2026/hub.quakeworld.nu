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
// 0 everywhere else (viewport-fit=cover is only set in full-window)
export function useTrackerSafeArea() {
  const fte = useFteController();
  const [insetLeft, setInsetLeft] = useState(0);
  // the viewport-fit change applies on the next layout
  const update = () => {
    setInsetLeft(readSafeAreaInsetLeft());
    requestAnimationFrame(() => setInsetLeft(readSafeAreaInsetLeft()));
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

function readSafeAreaInsetLeft(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;visibility:hidden;padding-left:env(safe-area-inset-left)";
  document.body.appendChild(probe);
  const inset = Number.parseFloat(getComputedStyle(probe).paddingLeft) || 0;
  probe.remove();
  return inset;
}
