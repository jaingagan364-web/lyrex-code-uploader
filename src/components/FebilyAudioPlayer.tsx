import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2 } from "lucide-react";

const AUDIO_SRC = "/febily-demo.mp3";

function formatTime(seconds: number) {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function FebilyAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const durationFixedRef = useRef(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const commitDuration = () => {
      const d = audio.duration;
      if (isFinite(d) && d > 0) {
        setDuration(d);
        setIsReady(true);
        return true;
      }
      return false;
    };

    const forceDuration = () => {
      if (durationFixedRef.current) return;
      durationFixedRef.current = true;
      const onSeeked = () => {
        audio.removeEventListener("seeked", onSeeked);
        try {
          audio.currentTime = 0;
        } catch {
          /* noop */
        }
        setCurrent(0);
        commitDuration();
      };
      audio.addEventListener("seeked", onSeeked);
      try {
        audio.currentTime = 1e9;
      } catch {
        /* noop */
      }
    };

    const onTime = () => setCurrent(audio.currentTime);
    const onLoaded = () => {
      if (!commitDuration()) forceDuration();
    };
    const onCanPlay = () => {
      commitDuration();
    };
    const onEnd = () => {
      setIsPlaying(false);
      if (isFinite(audio.duration) && audio.duration > 0) {
        setCurrent(audio.duration);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("durationchange", onLoaded);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("ended", onEnd);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    // Trigger metadata load explicitly (helps some production browsers/CDNs)
    try {
      audio.load();
    } catch {
      /* noop */
    }

    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("durationchange", onLoaded);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, []);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
    }
  };

  const seek = (clientX: number) => {
    const el = progressRef.current;
    const audio = audioRef.current;
    if (!el || !audio || !duration) return;
    const rect = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const target = ratio * duration;
    try {
      audio.currentTime = target;
      setCurrent(target);
    } catch {
      /* noop */
    }
  };

  const progressPct = duration ? Math.min(100, (current / duration) * 100) : 0;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-8">
      <audio
        ref={audioRef}
        src={AUDIO_SRC}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
      />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
            <Volume2 className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/45">
              Now Playing
            </div>
            <div className="text-base font-semibold text-white">Real AI Receptionist Call</div>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300 sm:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          Live sample
        </div>
      </div>

      <div className="mt-6 flex items-center gap-4 sm:gap-5">
        <button
          onClick={toggle}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="group flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-[0_10px_40px_rgba(255,255,255,0.15)] transition hover:scale-[1.04] sm:h-16 sm:w-16"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="ml-0.5 h-6 w-6" />
          )}
        </button>

        <div className="flex-1">
          <div
            ref={progressRef}
            onClick={(e) => seek(e.clientX)}
            onTouchStart={(e) => seek(e.touches[0].clientX)}
            className="group relative h-2 cursor-pointer rounded-full bg-white/10"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-white/90 to-white transition-[width] duration-150 ease-linear"
              style={{ width: `${progressPct}%` }}
            />
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/40 bg-white opacity-0 shadow transition group-hover:opacity-100"
              style={{ left: `${progressPct}%` }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-medium tabular-nums text-white/60">
            <span>{formatTime(current)}</span>
            <span>{isReady ? formatTime(duration) : "--:--"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
