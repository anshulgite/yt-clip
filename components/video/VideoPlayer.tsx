"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  Tv,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useClipStore } from "@/stores/clipStore";
import { formatTime } from "@/lib/utils";

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

interface VideoPlayerProps {
  videoUrl?: string;
  className?: string;
}

export default function VideoPlayer({ videoUrl, className }: VideoPlayerProps) {
  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    videoMetadata,
    activeClipId,
    clips,
  } = useClipStore();

  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useIframe, setUseIframe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isClipLoopMode, setIsClipLoopMode] = useState(false);

  const duration = videoMetadata?.duration || 100;
  const youtubeId = videoMetadata?.youtubeId || (videoMetadata?.videoUrl?.match(/[\w-]{11}/)?.[0]);
  const activeClip = clips.find((c) => c.id === activeClipId);

  // Determine browser-compatible stream URL
  const resolveStreamUrl = (): string => {
    if (videoUrl && !videoUrl.includes("youtube.com") && !videoUrl.includes("youtu.be")) {
      return videoUrl;
    }
    if (videoMetadata?.localStreamUrl) {
      return videoMetadata.localStreamUrl;
    }
    if (videoMetadata?.localPath) {
      return `/api/video/stream?path=${encodeURIComponent(videoMetadata.localPath)}`;
    }
    if (videoMetadata?.id) {
      return `/api/video/stream?id=${videoMetadata.id}`;
    }
    return "/api/video/stream?id=demo";
  };

  const streamSrc = resolveStreamUrl();

  // Sync external currentTime changes to video element or iframe
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
    // Also postMessage to YouTube IFrame if active
    if (useIframe && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: "seekTo", args: [currentTime, true] }),
          "*"
        );
      } catch (e) {}
    }
  }, [currentTime, useIframe]);

  // Sync play/pause to YouTube IFrame
  useEffect(() => {
    if (useIframe && iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func: isPlaying ? "playVideo" : "pauseVideo", args: [] }),
          "*"
        );
      } catch (e) {}
    }
  }, [isPlaying, useIframe]);

  const togglePlay = () => {
    if (useIframe) {
      const nextPlay = !isPlaying;
      setIsPlaying(nextPlay);
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func: nextPlay ? "playVideo" : "pauseVideo", args: [] }),
        "*"
      );
      return;
    }

    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      // If previewing active clip and outside clip range, seek to start
      if (activeClip && (videoRef.current.currentTime >= activeClip.endTime || videoRef.current.currentTime < activeClip.startTime)) {
        videoRef.current.currentTime = activeClip.startTime;
      }
      videoRef.current.play().catch((err) => {
        console.warn("[VideoPlayer] play error:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);

      // Clip Loop Mode: constrain playback inside active clip
      if (isClipLoopMode && activeClip && time >= activeClip.endTime) {
        videoRef.current.currentTime = activeClip.startTime;
        setCurrentTime(activeClip.startTime);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
    if (useIframe && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "seekTo", args: [val, true] }),
        "*"
      );
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  // Diagnostic callbacks
  const handleLoadedMetadata = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleCanPlay = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    const err = videoRef.current?.error;
    const msg = err ? `Error code ${err.code}: ${err.message || "Cannot decode video stream"}` : "Stream loading error";
    console.warn("[VideoPlayer] Stream error:", msg);
    setHasError(true);
    setErrorMessage(msg);
    setIsLoading(false);
  };

  return (
    <div className={`relative bg-[#090A14] rounded-2xl overflow-hidden border border-[#232646] group shadow-2xl ${className || ""}`}>
      {/* Top Bar: Switcher between Timeline Synced and YouTube Stream */}
      {youtubeId && (
        <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-2 bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-xs shadow-lg">
          <button
            onClick={() => {
              setUseIframe(false);
              setHasError(false);
              if (videoRef.current) videoRef.current.load();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all text-xs font-semibold ${
              !useIframe
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
            }`}
            title="Local synchronized timeline video player"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Timeline Synced</span>
          </button>
          <button
            onClick={() => setUseIframe(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all text-xs font-semibold ${
              useIframe
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-white/10 text-gray-300 hover:text-white hover:bg-white/20"
            }`}
            title="Official YouTube player"
          >
            <YoutubeIcon className="w-3.5 h-3.5 text-red-300" />
            <span>YouTube Stream</span>
          </button>
        </div>
      )}

      {/* Active Clip Preview Badge */}
      {activeClip && (
        <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-2 bg-black/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-white/10 text-xs">
          <span
            style={{ backgroundColor: activeClip.color }}
            className="w-2.5 h-2.5 rounded-full animate-pulse"
          />
          <span className="font-semibold text-white">{activeClip.label}</span>
          <span className="text-[11px] font-mono text-gray-400">
            {formatTime(activeClip.startTime)} – {formatTime(activeClip.endTime)}
          </span>
          <button
            onClick={() => setIsClipLoopMode(!isClipLoopMode)}
            className={`ml-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors ${
              isClipLoopMode
                ? "bg-purple-600 text-white"
                : "bg-white/10 text-gray-400 hover:text-white"
            }`}
            title={isClipLoopMode ? "Looping within clip" : "Loop entire video"}
          >
            {isClipLoopMode ? "Looping" : "Loop Clip"}
          </button>
        </div>
      )}

      {/* Video Stream Layer */}
      {useIframe && youtubeId ? (
        <div className="w-full aspect-video">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&origin=${encodeURIComponent(
              typeof window !== "undefined" ? window.location.origin : ""
            )}`}
            title={videoMetadata?.title || "YouTube video player"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      ) : (
        <div className="relative w-full aspect-video">
          <video
            ref={videoRef}
            src={streamSrc}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onPlaying={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={handleError}
            onEnded={() => setIsPlaying(false)}
            className="w-full h-full object-cover aspect-video cursor-pointer"
            onClick={togglePlay}
            playsInline
            preload="auto"
          />

          {/* Buffering Indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 pointer-events-none">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin mb-2" />
              <p className="text-xs text-gray-300 font-medium">Buffering video stream...</p>
            </div>
          )}

          {/* Error Message with Retry */}
          {hasError && !useIframe && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center space-y-3 z-20">
              <AlertCircle className="w-10 h-10 text-amber-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-white">Stream Initializing</p>
                <p className="text-xs text-gray-400 max-w-sm">
                  {errorMessage || "Syncing stream with timeline playback. Click retry to connect."}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setHasError(false);
                    if (videoRef.current) {
                      videoRef.current.load();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Stream</span>
                </button>
                {youtubeId && (
                  <button
                    onClick={() => setUseIframe(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                  >
                    <YoutubeIcon className="w-3.5 h-3.5" />
                    <span>Watch via YouTube Player</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Floating Center Play Button if paused */}
          {!isPlaying && !isLoading && !hasError && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer backdrop-blur-[1px]"
            >
              <div className="w-14 h-14 rounded-full bg-purple-600/90 text-white flex items-center justify-center purple-glow shadow-xl hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-white ml-0.5" />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Control Bar (Available in both modes for full control) */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6 flex flex-col gap-2 z-20 opacity-90 group-hover:opacity-100 transition-opacity">
        {/* Scrubber slider */}
        <input
          type="range"
          min="0"
          max={duration}
          step="0.1"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
        />

        <div className="flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            <span className="font-mono text-[11px] text-gray-300">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-1 rounded-md hover:bg-white/10 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
