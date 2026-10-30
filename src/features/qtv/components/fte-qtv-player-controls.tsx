import clsx from "clsx";
import { useBoolean, useEventListener } from "usehooks-ts";
import { AutotrackToggle } from "@/components/fte-player/autotrack-toggle";
import { ConsoleToggle } from "@/components/fte-player/console-toggle";
import {
  FullscreenToggle,
  FullWindowToggle,
} from "@/components/fte-player/fullscreen-toggle";
import { MinimapToggle } from "@/components/fte-player/minimap-toggle";
import { SettingsToggle } from "@/components/fte-player/settings";
import { Volume } from "@/components/fte-player/volume";

export function FteQtvPlayerControls() {
  const {
    value: isIdle,
    setTrue: setIsIdle,
    setFalse: setIsActive,
  } = useBoolean(false);

  useEventListener("fteplayer.mouse.idle", setIsIdle);
  useEventListener("fteplayer.mouse.active", setIsActive);

  return (
    // safe area: full-window on notched iphones reaches the rounded corners and the home
    // indicator (insets are 0 elsewhere)
    <div
      className={clsx(
        "flex flex-wrap transition-opacity duration-200 bg-black/60 justify-between items-center pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] sm:pl-[max(0.25rem,env(safe-area-inset-left))] sm:pr-[max(0.25rem,env(safe-area-inset-right))] sm:gap-y-2",
        {
          "opacity-0": isIdle,
        },
      )}
    >
      <div className="flex items-center">
        <Volume />
      </div>

      <div className="flex items-center gap-x-2">
        <AutotrackToggle />
        <div className="hidden lg:block">
          <MinimapToggle />
        </div>
        {/* the console needs a keyboard */}
        <div className="hidden lg:block">
          <ConsoleToggle />
        </div>
        <SettingsToggle />
        <FullWindowToggle />
        <div className="hidden sm:block">
          <FullscreenToggle />
        </div>
      </div>
    </div>
  );
}
