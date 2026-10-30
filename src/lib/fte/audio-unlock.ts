// ios: audio may only start from a completed tap (touchend/click). the engine (emscripten
// openal) resumes its AudioContext once, on the first touchstart, which ios ignores, so
// iphone stays silent whatever the volume. track the engine's contexts and resume them on
// taps until they run (ios also suspends them in the background).
const contexts = new Set<AudioContext>();
let isInstalled = false;

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

export function installAudioUnlock() {
  if (isInstalled || typeof window.AudioContext === "undefined") {
    return;
  }

  isInstalled = true;

  // play like media, also with the silent switch on (safari 17+)
  const { audioSession } = navigator as AudioSessionNavigator;

  if (audioSession) {
    audioSession.type = "playback";
  }

  // the engine looks up window.AudioContext when it opens the sound device
  const NativeAudioContext = window.AudioContext;
  window.AudioContext = class extends NativeAudioContext {
    constructor(options?: AudioContextOptions) {
      super(options);
      contexts.add(this);
    }
  };

  for (const event of ["touchend", "click", "keydown"]) {
    window.addEventListener(event, resumeContexts, {
      capture: true,
      passive: true,
    });
  }
}

function resumeContexts() {
  for (const context of contexts) {
    if (context.state !== "running" && context.state !== "closed") {
      context.resume().catch(() => {});
    }
  }
}
