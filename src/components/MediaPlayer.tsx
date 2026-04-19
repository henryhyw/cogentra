import { Download, Pause, Play, Volume2, X } from "lucide-react";
import { formatTimestamp } from "../data/mock";
import { cn } from "../lib/cn";
import IconButton from "./IconButton";

type MediaPlayerProps = {
  currentTimeSec: number;
  durationSec: number;
  isOpen: boolean;
  isPlaying: boolean;
  onClose: () => void;
  onToggleOpen: () => void;
  onTogglePlay: () => void;
};

const waveformBars = Array.from({ length: 60 }, (_, index) => 20 + ((index * 17) % 70));

export default function MediaPlayer({
  currentTimeSec,
  durationSec,
  isOpen,
  isPlaying,
  onClose,
  onToggleOpen,
  onTogglePlay,
}: MediaPlayerProps) {
  const progress = durationSec ? currentTimeSec / durationSec : 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-[248px] right-0 z-30 border-t border-line bg-surface px-6 shadow-e2 transition-[height] duration-220 ease-out",
        isOpen ? "h-24" : "h-16",
      )}
    >
      <div className="flex h-full items-center gap-4">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white transition-colors duration-150 ease-out hover:bg-ink2"
          onClick={onTogglePlay}
          type="button"
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="ml-0.5 h-4 w-4" />}
        </button>
        <button
          className="mono text-12 text-mute transition-colors duration-150 ease-out hover:text-ink"
          onClick={onToggleOpen}
          type="button"
        >
          {formatTimestamp(currentTimeSec)}
        </button>
        <div className="flex-1">
          <svg className="h-10 w-full" preserveAspectRatio="none" viewBox="0 0 600 40">
            {waveformBars.map((height, index) => {
              const x = index * 10 + 1;
              const fill = index / waveformBars.length <= progress ? "#2F5D4E" : "#D9D6CE";
              return <rect key={index} fill={fill} height={height / 3} rx="1.5" width="6" x={x} y={20 - height / 6} />;
            })}
          </svg>
        </div>
        <span className="mono text-12 text-mute">{formatTimestamp(durationSec)}</span>
        <IconButton aria-label="Volume">
          <Volume2 className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Download">
          <Download className="h-4 w-4" />
        </IconButton>
        <IconButton aria-label="Close player" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>
    </div>
  );
}
