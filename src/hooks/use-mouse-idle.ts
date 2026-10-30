import { useEffect, useRef } from "react";

// idle after `timeout` ms without mouse movement or pointer presses (touch taps) over the element (or document)
export function useMouseIdle({
  elementId,
  timeout,
  onIdle,
  onActive,
}: {
  elementId: string;
  timeout: number;
  onIdle: () => void;
  onActive: () => void;
}) {
  const callbacks = useRef({ onIdle, onActive });
  callbacks.current = { onIdle, onActive };

  useEffect(() => {
    const target = document.getElementById(elementId) ?? document;
    const throttleMs = 200;
    let isIdle = false;
    let lastMoveAt = 0;
    // touch: a held finger (e.g. dragging the time slider) moves no mouse, stay active
    let isTouchDown = false;
    let timer = window.setTimeout(setIdle, timeout);

    function setIdle() {
      if (isTouchDown) {
        return;
      }

      isIdle = true;
      callbacks.current.onIdle();
    }

    function handleMove() {
      const now = Date.now();

      if (now - lastMoveAt < throttleMs) {
        return;
      }
      lastMoveAt = now;

      if (isIdle) {
        isIdle = false;
        callbacks.current.onActive();
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(setIdle, timeout);
    }

    function handlePointerDown(e: Event) {
      if ((e as PointerEvent).pointerType === "touch") {
        isTouchDown = true;
      }

      handleMove();
    }

    function handlePointerUp(e: Event) {
      if ((e as PointerEvent).pointerType !== "touch" || !isTouchDown) {
        return;
      }

      isTouchDown = false;
      window.clearTimeout(timer);
      timer = window.setTimeout(setIdle, timeout);
    }

    // capture: the engine canvas handles (and may stop) pointer events.
    // release on window: the finger may be lifted outside the element
    target.addEventListener("mousemove", handleMove);
    target.addEventListener("pointerdown", handlePointerDown, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerUp, true);
    return () => {
      window.clearTimeout(timer);
      target.removeEventListener("mousemove", handleMove);
      target.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("pointercancel", handlePointerUp, true);
    };
  }, [elementId, timeout]);
}
