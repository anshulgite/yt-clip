"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  MoreHorizontal,
  Check,
  Loader2,
} from "lucide-react";
import { Clip } from "@/types";
import { formatTime } from "@/lib/utils";
import { useClipStore } from "@/stores/clipStore";

interface VerticalShortCardProps {
  clip: Clip;
  videoSrc?: string;
  isActive?: boolean;
  onSelect?: () => void;
  onUpdateCaptionText?: (newText: string) => void;
}

export default function VerticalShortCard({
  clip,
  videoSrc,
  isActive,
  onSelect,
  onUpdateCaptionText,
}: VerticalShortCardProps) {
  const { videoMetadata } = useClipStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [captionText, setCaptionText] = useState(
    clip.captions[0]?.text || "The key to building scalable products with AI is simplicity."
  );

  const [isLoaded, setIsLoaded] = useState(false);

  // Guarantee valid playable stream URL, never a raw YouTube watch page
  const resolvedSrc = (() => {
    if (videoSrc && !videoSrc.includes("youtube.com") && !videoSrc.includes("youtu.be")) {
      return videoSrc;
    }
    if (videoMetadata?.localStreamUrl) {
      return videoMetadata.localStreamUrl;
    }
    if (videoMetadata?.id) {
      return `/api/video/stream?id=${videoMetadata.id}`;
    }
    return "/api/video/stream?id=demo";
  })();

  useEffect(() => {
    if (clip.captions[0]?.text) {
      setCaptionText(clip.captions[0].text);
    }
  }, [clip.captions]);

  // Set initial time only when metadata is ready
  useEffect(() => {
    if (videoRef.current && videoRef.current.readyState >= 1) {
      try {
        videoRef.current.currentTime = clip.startTime;
        setCurrentTime(0);
      } catch (e) {}
    }
  }, [clip.startTime]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      setHasError(false);
      setIsLoading(true);

      // If outside clip range, seek to start
      if (videoRef.current.currentTime >= clip.endTime || videoRef.current.currentTime < clip.startTime) {
        try {
          videoRef.current.currentTime = clip.startTime;
        } catch (e) {}
      }

      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsLoading(false);
            setHasError(false);
          })
          .catch((err) => {
            console.warn(`[VerticalShortCard ${clip.label}] initial play error, reloading:`, err);
            if (videoRef.current) {
              videoRef.current.load();
              videoRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setIsLoading(false);
                  setHasError(false);
                })
                .catch((reloadErr) => {
                  console.warn(`[VerticalShortCard ${clip.label}] reload play error:`, reloadErr);
                  setIsLoading(false);
                });
            }
          });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const rawTime = videoRef.current.currentTime;
      // Loop within clip range
      if (rawTime >= clip.endTime) {
        videoRef.current.currentTime = clip.startTime;
        setCurrentTime(0);
      } else {
        const offset = Math.max(0, rawTime - clip.startTime);
        setCurrentTime(offset);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const offset = parseFloat(e.target.value);
    setCurrentTime(offset);
    if (videoRef.current) {
      videoRef.current.currentTime = clip.startTime + offset;
    }
  };

  // Caption styling calculations
  const settings = clip.captionSettings;
  const areCaptionsEnabled = settings?.enabled !== false && settings?.style !== "none";
  const isHighlightStyle = settings.style === "highlight";
  const isBoldStyle = settings.style === "bold";

  const activeSeg = clip.captions.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  ) || clip.captions[0];

  const words = (activeSeg?.words && activeSeg.words.length > 0)
    ? activeSeg.words
    : captionText.split(" ").map((w, i) => ({
        word: w,
        start: i * 0.4,
        end: (i + 1) * 0.4,
        isHighlighted: i === captionText.split(" ").length - 1,
      }));

  // Diagnostic callbacks
  const handleLoadedMetadata = () => {
    setIsLoading(false);
    setHasError(false);
    setIsLoaded(true);
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = clip.startTime;
      } catch (e) {}
    }
  };

  const handleError = () => {
    console.warn(`[VerticalShortCard ${clip.label}] stream buffering note`);
    setIsLoading(false);
  };

  return (
    <div
      onClick={onSelect}
      style={{ borderColor: isActive ? clip.color : "#232646" }}
      className={`flex flex-col bg-[#121426] rounded-2xl border-2 overflow-hidden shadow-2xl transition-all cursor-pointer group ${
        isActive ? "ring-2 ring-purple-500/30 scale-[1.01]" : "hover:border-[#383D6C]"
      }`}
    >
      {/* Card Header */}
      <div className="p-3 bg-[#17192F] border-b border-[#242749] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            style={{ backgroundColor: clip.color }}
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow"
          >
            {clip.label.replace("Clip ", "")}
          </span>
          <span className="text-xs font-mono font-medium text-gray-300">
            {formatTime(clip.startTime)} – {formatTime(clip.endTime)} ({formatTime(clip.duration)})
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(!isEditing);
          }}
          className="p-1 rounded text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Edit caption text"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* 9:16 Vertical Video Frame */}
      <div className="relative aspect-[9/16] w-full bg-[#07080E] overflow-hidden flex items-center justify-center">
        {/* Always keep HTML5 Video Element Mounted in the DOM */}
        <video
          ref={videoRef}
          src={resolvedSrc}
          poster={videoMetadata?.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={() => {
            setIsLoading(false);
            setIsLoaded(true);
          }}
          onPlaying={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onError={handleError}
          className="w-full h-full object-cover scale-[1.02]"
          onClick={togglePlay}
          playsInline
          preload="auto"
        />

        {/* Thumbnail backdrop before first play */}
        {!isPlaying && !isLoaded && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={videoMetadata?.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
            alt={clip.label}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          />
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none z-10">
            <Loader2 className="w-7 h-7 text-purple-400 animate-spin" />
          </div>
        )}

        {/* Center Play Button if paused */}
        {!isPlaying && !isLoading && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/25 backdrop-blur-[0.5px] z-10 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center purple-glow shadow-xl hover:scale-110 transition-transform">
              <Play className="w-5 h-5 fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Superimposed Subtitle Banner (Only if captions are enabled!) */}
        {areCaptionsEnabled && (
        <div
          style={{
            bottom: settings.position === "bottom" ? "18%" : settings.position === "center" ? "42%" : "70%",
          }}
          className="absolute inset-x-3 pointer-events-auto flex justify-center text-center transition-all z-20"
        >
          {isEditing ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 p-2.5 rounded-xl border border-purple-500 w-full flex flex-col gap-2"
            >
              <textarea
                value={captionText}
                onChange={(e) => setCaptionText(e.target.value)}
                className="w-full bg-transparent text-white text-xs border-0 resize-none focus:outline-none"
                rows={2}
              />
              <button
                onClick={() => {
                  setIsEditing(false);
                  onUpdateCaptionText?.(captionText);
                }}
                className="self-end px-2.5 py-1 rounded bg-purple-600 text-white text-[11px] font-semibold flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Done
              </button>
            </div>
          ) : (
            <div
              className={`p-2.5 rounded-xl transition-all max-w-[94%] ${
                settings.textBackground === "box"
                  ? "bg-black/80 backdrop-blur-sm border border-white/10"
                  : settings.textBackground === "outline"
                  ? "drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
                  : "bg-black/60 backdrop-blur-[2px]"
              }`}
            >
              <p
                style={{
                  fontSize: `${Math.round(settings.fontSize * 0.32)}px`,
                  color: settings.textColor || "#FFFFFF",
                  fontFamily: settings.font || "Inter",
                  fontWeight: isBoldStyle ? 800 : 700,
                  lineHeight: 1.25,
                }}
                className="tracking-tight select-none"
              >
                {words.map((w, wIdx) => {
                  const shouldHighlight = settings.autoHighlight && (w.isHighlighted || wIdx === words.length - 1);

                  if (shouldHighlight) {
                    return (
                      <span
                        key={wIdx}
                        style={{
                          backgroundColor: settings.highlightStyle === "background" ? settings.highlightColor : "transparent",
                          color: settings.highlightStyle === "background" ? "#000000" : settings.highlightColor,
                        }}
                        className={`inline-block mx-0.5 px-1 py-0.2 rounded font-black ${
                          settings.highlightStyle === "glow" ? "shadow-[0_0_12px_#FACC15]" : ""
                        }`}
                      >
                        {w.word}{" "}
                      </span>
                    );
                  }

                  return <span key={wIdx}>{w.word} </span>;
                })}
              </p>
            </div>
          )}
        </div>
      )}

        {/* Video Scrubber & Play Controls */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-2.5 pt-4 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity z-30">
          <input
            type="range"
            min="0"
            max={clip.duration || 10}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />

          <div className="flex items-center justify-between text-[11px] text-white">
            <div className="flex items-center gap-2">
              <button onClick={togglePlay} className="p-0.5 hover:text-purple-400">
                {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
              </button>
              <span className="font-mono text-[10px] text-gray-300">
                {formatTime(currentTime)} / {formatTime(clip.duration)}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (videoRef.current) {
                    videoRef.current.muted = !isMuted;
                    setIsMuted(!isMuted);
                  }
                }}
                className="p-0.5 hover:text-purple-400"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  videoRef.current?.requestFullscreen();
                }}
                className="p-0.5 hover:text-purple-400"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
