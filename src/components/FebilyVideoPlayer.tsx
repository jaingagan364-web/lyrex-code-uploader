export default function FebilyVideoPlayer() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <video
        className="aspect-video h-auto w-full object-contain"
        controls
        playsInline
        preload="metadata"
        aria-label="Febily customer call demonstration"
      >
        <source src="/lv_0_20260915124828.mp4" type="video/mp4" />
        Your browser does not support video playback.
      </video>
    </div>
  );
}
