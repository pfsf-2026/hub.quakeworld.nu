import { isIOS } from "@/utils/ios";

// the engine (vikpe/fteqw ftejslib.js) reads mouse positions as canvas pixels but touch
// positions as raw page coordinates (no canvas offset, no devicePixelRatio), so on iphone
// taps land elsewhere for the engine: wrong double tap zones (seek / fullscreen), player
// info and minimap taps. touches on the canvas report canvas pixels, like the mouse.
let isInstalled = false;

export function installTouchPositionFix() {
  if (isInstalled || !isIOS() || typeof Touch === "undefined") {
    return;
  }

  const pageX = Object.getOwnPropertyDescriptor(Touch.prototype, "pageX");
  const pageY = Object.getOwnPropertyDescriptor(Touch.prototype, "pageY");

  if (!pageX?.get || !pageY?.get) {
    return;
  }

  isInstalled = true;
  const getPageX = pageX.get;
  const getPageY = pageY.get;

  Object.defineProperty(Touch.prototype, "pageX", {
    ...pageX,
    get(this: Touch) {
      const canvas = getEngineCanvas(this);

      if (!canvas) {
        return getPageX.call(this);
      }

      const rect = canvas.getBoundingClientRect();
      return (this.clientX - rect.left) * (canvas.width / rect.width);
    },
  });

  Object.defineProperty(Touch.prototype, "pageY", {
    ...pageY,
    get(this: Touch) {
      const canvas = getEngineCanvas(this);

      if (!canvas) {
        return getPageY.call(this);
      }

      const rect = canvas.getBoundingClientRect();
      return (this.clientY - rect.top) * (canvas.height / rect.height);
    },
  });
}

function getEngineCanvas(touch: Touch): HTMLCanvasElement | null {
  const { target } = touch;
  return target instanceof HTMLCanvasElement && target.id === "fteCanvas"
    ? target
    : null;
}
