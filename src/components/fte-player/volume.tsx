import { useFteController, useFtePolledValue } from "@/lib/fte/hooks";
import { isIOS } from "@/utils/ios";
import { VolumeSlider } from "./volume-slider";
import { VolumeToggle } from "./volume-toggle";

export const Volume = () => {
  const fte = useFteController();
  const volume = useFtePolledValue("volume", () => fte?.getVolume() ?? 0);
  const isMuted = useFtePolledValue("volume", () => fte?.isMuted() ?? false);

  if (!fte) {
    return null;
  }

  function handleToggleClick() {
    if (!fte) {
      return;
    }

    // ios: the volume buttons set the loudness, unmute plays at full player volume
    if (isIOS() && fte.isMuted()) {
      fte.setVolume(fte.getMaxVolume());
      return;
    }

    fte.toggleMute();
  }

  function handleVolumeChange(volume: number) {
    if (!fte) {
      return;
    }

    fte.setVolume(volume);
  }

  return (
    <>
      <VolumeToggle
        isEnabled={!isMuted}
        onClick={handleToggleClick}
        volume={volume}
      />
      {/* ios: pages cannot read or follow the device volume, a second volume control would only conflict with it */}
      {!isIOS() && (
        <VolumeSlider
          volume={volume}
          isMuted={isMuted}
          maxVolume={fte.getMaxVolume()}
          onChange={handleVolumeChange}
        />
      )}
    </>
  );
};
