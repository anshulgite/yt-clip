"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Subtitles,
  Video,
  Layout,
  Shield,
  Sparkles,
  Target,
  MicOff,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Check,
  Eye,
  EyeOff,
  Square,
  Columns2,
} from "lucide-react";
import { useClipStore, DEFAULT_DUAL_BOX } from "@/stores/clipStore";
import { formatTime } from "@/lib/utils";
import { CaptionStyle, CaptionFont, TextBackground, BorderType, CropBox, DualBoxSettings, CropMode } from "@/types";

const TEXT_COLORS = ["#FFFFFF", "#FACC15", "#8B5CF6", "#0EA5E9", "#10B981", "#EC4899"];
const HIGHLIGHT_COLORS = ["#FACC15", "#FEF08A", "#DDD6FE", "#BAE6FD", "#A7F3D0"];
const BORDER_COLORS = ["#00F0FF", "#A855F7", "#22C55E", "#EC4899", "#FACC15", "#EF4444", "#FFFFFF", "#FF6B00"];

export default function Screen4Customize() {
  const {
    clips,
    activeClipId,
    setActiveClipId,
    updateCaptionSettings,
    updateVideoSettings,
    updateAllVideoSettings,
    updateAllCaptionSettings,
    videoMetadata,
    setStep,
  } = useClipStore();

  const [activeTab, setActiveTab] = useState<"split" | "captions" | "border" | "video" | "layout" | "branding">("split");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTopRef = useRef<HTMLVideoElement>(null);
  const videoBottomRef = useRef<HTMLVideoElement>(null);
  const container16x9Ref = useRef<HTMLDivElement>(null);

  // Dual-box split-screen states
  const [splitPreviewView, setSplitPreviewView] = useState<"stacked" | "boxes">("boxes");
  const [activeBoxKey, setActiveBoxKey] = useState<"box1" | "box2">("box1");

  const [dragState, setDragState] = useState<{
    type: "move" | "resize";
    boxKey: "box1" | "box2";
    handle?: "nw" | "ne" | "sw" | "se";
    startX: number;
    startY: number;
    initialBox: CropBox;
    containerRect: DOMRect;
  } | null>(null);

  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0];
  const capSettings = activeClip?.captionSettings;
  const vidSettings = activeClip?.videoSettings;
  const isCaptionsEnabled = capSettings ? (capSettings.enabled !== false && capSettings.style !== "none") : true;

  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Guarantee valid playable stream URL, never a raw YouTube watch page
  const streamSrc = (() => {
    if (videoMetadata?.localStreamUrl) return videoMetadata.localStreamUrl;
    if (videoMetadata?.id) return `/api/video/stream?id=${videoMetadata.id}`;
    if (videoMetadata?.localPath) return `/api/video/stream?path=${encodeURIComponent(videoMetadata.localPath)}`;
    return "/api/video/stream?id=demo";
  })();

  // Sync to active clip start time on clip switch
  useEffect(() => {
    if (videoRef.current && activeClip) {
      videoRef.current.currentTime = activeClip.startTime;
      if (videoTopRef.current) videoTopRef.current.currentTime = activeClip.startTime;
      if (videoBottomRef.current) videoBottomRef.current.currentTime = activeClip.startTime;
      setCurrentTime(0);
    }
  }, [activeClip?.id, activeClip?.startTime]);

  // Sync stacked videos when view mode switches
  useEffect(() => {
    if (splitPreviewView === "stacked" && activeClip) {
      const cur = videoRef.current?.currentTime ?? activeClip.startTime;
      if (videoTopRef.current) videoTopRef.current.currentTime = cur;
      if (videoBottomRef.current) videoBottomRef.current.currentTime = cur;
      if (isPlaying) {
        videoTopRef.current?.play().catch(() => {});
        videoBottomRef.current?.play().catch(() => {});
      }
    }
  }, [splitPreviewView, isPlaying, activeClip]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      if (videoTopRef.current) videoTopRef.current.pause();
      if (videoBottomRef.current) videoBottomRef.current.pause();
      setIsPlaying(false);
    } else {
      const cur = videoRef.current.currentTime;
      if (cur >= activeClip.endTime || cur < activeClip.startTime) {
        videoRef.current.currentTime = activeClip.startTime;
        if (videoTopRef.current) videoTopRef.current.currentTime = activeClip.startTime;
        if (videoBottomRef.current) videoBottomRef.current.currentTime = activeClip.startTime;
      } else {
        if (videoTopRef.current) videoTopRef.current.currentTime = cur;
        if (videoBottomRef.current) videoBottomRef.current.currentTime = cur;
      }
      videoRef.current.play().catch((err) => {
        console.warn("[Screen4Customize] play error:", err);
      });
      if (videoTopRef.current) videoTopRef.current.play().catch(() => {});
      if (videoBottomRef.current) videoBottomRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && activeClip) {
      const rawTime = videoRef.current.currentTime;
      if (rawTime >= activeClip.endTime) {
        videoRef.current.currentTime = activeClip.startTime;
        if (videoTopRef.current) videoTopRef.current.currentTime = activeClip.startTime;
        if (videoBottomRef.current) videoBottomRef.current.currentTime = activeClip.startTime;
        setCurrentTime(0);
      } else {
        setCurrentTime(Math.max(0, rawTime - activeClip.startTime));
        if (videoTopRef.current && Math.abs(videoTopRef.current.currentTime - rawTime) > 0.3) {
          videoTopRef.current.currentTime = rawTime;
        }
        if (videoBottomRef.current && Math.abs(videoBottomRef.current.currentTime - rawTime) > 0.3) {
          videoBottomRef.current.currentTime = rawTime;
        }
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current && activeClip) {
      const targetT = activeClip.startTime + val;
      videoRef.current.currentTime = targetT;
      if (videoTopRef.current) videoTopRef.current.currentTime = targetT;
      if (videoBottomRef.current) videoBottomRef.current.currentTime = targetT;
    }
  };

  const currentDualBox = vidSettings?.dualBox || DEFAULT_DUAL_BOX;
  const b1 = currentDualBox.box1;
  const b2 = currentDualBox.box2;

  const startDrag = (
    e: React.MouseEvent,
    boxKey: "box1" | "box2",
    type: "move" | "resize",
    handle?: "nw" | "ne" | "sw" | "se"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!container16x9Ref.current || !activeClip) return;
    setActiveBoxKey(boxKey);
    const containerRect = container16x9Ref.current.getBoundingClientRect();
    const curDual = vidSettings?.dualBox || DEFAULT_DUAL_BOX;
    const initialBox = { ...(curDual[boxKey]) };

    setDragState({
      type,
      boxKey,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialBox,
      containerRect,
    });
  };

  useEffect(() => {
    if (!dragState || !activeClip) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { type, boxKey, handle, startX, startY, initialBox, containerRect } = dragState;
      const W = containerRect.width;
      const H = containerRect.height;
      if (W <= 0 || H <= 0) return;

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const curDual = vidSettings?.dualBox || DEFAULT_DUAL_BOX;

      if (type === "move") {
        const dxPct = (dx / W) * 100;
        const dyPct = (dy / H) * 100;

        const newX = Math.max(0, Math.min(100 - initialBox.width, initialBox.x + dxPct));
        const newY = Math.max(0, Math.min(100 - initialBox.height, initialBox.y + dyPct));

        updateVideoSettings(activeClip.id, {
          dualBox: {
            ...curDual,
            [boxKey]: {
              ...initialBox,
              x: Math.round(newX * 10) / 10,
              y: Math.round(newY * 10) / 10,
            },
          },
        });
      } else if (type === "resize") {
        const initWpx = (initialBox.width / 100) * W;
        const initHpx = (initialBox.height / 100) * H;
        const initXpx = (initialBox.x / 100) * W;
        const initYpx = (initialBox.y / 100) * H;

        let newWpx = initWpx;
        let newHpx = initHpx;
        let newXpx = initXpx;
        let newYpx = initYpx;

        if (handle === "se") {
          newWpx = Math.max(50, Math.min(W - initXpx, initWpx + dx));
          newHpx = newWpx / 1.125;
          if (initYpx + newHpx > H) {
            newHpx = H - initYpx;
            newWpx = newHpx * 1.125;
          }
        } else if (handle === "sw") {
          const allowedDx = Math.min(initWpx - 50, Math.max(-initXpx, dx));
          newWpx = initWpx - allowedDx;
          newHpx = newWpx / 1.125;
          if (initYpx + newHpx > H) {
            newHpx = H - initYpx;
            newWpx = newHpx * 1.125;
          }
          newXpx = initXpx + (initWpx - newWpx);
        } else if (handle === "ne") {
          newWpx = Math.max(50, Math.min(W - initXpx, initWpx + dx));
          newHpx = newWpx / 1.125;
          if (initYpx + initHpx - newHpx < 0) {
            newHpx = initYpx + initHpx;
            newWpx = newHpx * 1.125;
          }
          newYpx = initYpx + (initHpx - newHpx);
        } else if (handle === "nw") {
          newWpx = Math.max(50, initWpx - dx);
          newHpx = newWpx / 1.125;
          if (initXpx + initWpx - newWpx < 0) {
            newWpx = initXpx + initWpx;
            newHpx = newWpx / 1.125;
          }
          if (initYpx + initHpx - newHpx < 0) {
            newHpx = initYpx + initHpx;
            newWpx = newHpx * 1.125;
          }
          newXpx = initXpx + (initWpx - newWpx);
          newYpx = initYpx + (initHpx - newHpx);
        }

        const newXPct = Math.max(0, Math.min(100, (newXpx / W) * 100));
        const newYPct = Math.max(0, Math.min(100, (newYpx / H) * 100));
        const newWPct = Math.max(5, Math.min(100, (newWpx / W) * 100));
        const newHPct = Math.max(5, Math.min(100, (newHpx / H) * 100));

        updateVideoSettings(activeClip.id, {
          dualBox: {
            ...curDual,
            [boxKey]: {
              x: Math.round(newXPct * 10) / 10,
              y: Math.round(newYPct * 10) / 10,
              width: Math.round(newWPct * 10) / 10,
              height: Math.round(newHPct * 10) / 10,
            },
          },
        });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, activeClip?.id, vidSettings?.dualBox, updateVideoSettings]);

  const activeSeg = activeClip?.captions[0] || {
    text: "The key to building scalable products with AI is simplicity.",
    words: [
      { word: "The", start: 0, end: 0.3 },
      { word: "key", start: 0.4, end: 0.7 },
      { word: "to", start: 0.8, end: 1.0 },
      { word: "building", start: 1.1, end: 1.5 },
      { word: "scalable", start: 1.6, end: 2.1 },
      { word: "products", start: 2.2, end: 2.7 },
      { word: "with", start: 2.8, end: 3.0 },
      { word: "AI", start: 3.1, end: 3.4 },
      { word: "is", start: 3.5, end: 3.8 },
      { word: "simplicity.", start: 3.9, end: 4.8, isHighlighted: true },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-7 animate-fade-in">
      {/* Title */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
          Customize Your Shorts
        </h1>
        <p className="text-gray-400 text-sm">
          Fine-tune captions, layout, and visual style for each selected clip.
        </p>
      </div>

      {/* Prominent Cropping & Layout Mode Switcher Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#171A34] via-[#121428] to-[#1F1735] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Columns2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Video Cropping & Layout Mode</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-cyan-400 to-purple-400 text-black">
                NEW FEATURE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Current mode:{" "}
              <span className="font-semibold text-white">
                {vidSettings?.cropMode === "split"
                  ? "✂️ Dual-Box Split-Screen (Podcast 2-Speaker Mode)"
                  : "📱 Standard Single 9:16 Vertical Crop"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-[#0E1020] p-1.5 rounded-xl border border-[#252848]">
          <button
            type="button"
            onClick={() => {
              if (activeClip) updateVideoSettings(activeClip.id, { cropMode: "center" });
              setActiveTab("video");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              vidSettings?.cropMode !== "split"
                ? "bg-purple-600 text-white shadow-md"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <span>📱 Standard 9:16</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (activeClip) updateVideoSettings(activeClip.id, { cropMode: "split" });
              setSplitPreviewView("boxes");
              setActiveTab("split");
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              vidSettings?.cropMode === "split"
                ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                : "text-cyan-300 hover:text-white hover:bg-cyan-950/40 border border-cyan-500/30"
            }`}
          >
            <Columns2 className="w-4 h-4" />
            <span>✂️ Split-Screen (2-Box)</span>
          </button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Selected Clips Selector (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Selected Clips ({clips.length})
          </h2>

          <div className="space-y-2.5">
            {clips.map((clip) => {
              const isSelected = activeClip?.id === clip.id;

              return (
                <div
                  key={clip.id}
                  onClick={() => setActiveClipId(clip.id)}
                  style={{ borderColor: isSelected ? clip.color : "#232646" }}
                  className={`p-3 rounded-2xl bg-[#121426] border-2 transition-all cursor-pointer flex items-center justify-between shadow-md ${
                    isSelected ? "ring-2 ring-purple-500/30 bg-[#161830]" : "hover:border-[#333760]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={videoMetadata?.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
                        alt={clip.label}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          style={{ backgroundColor: clip.color }}
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                        >
                          {clip.label.replace("Clip ", "")}
                        </span>
                        <span className="text-xs font-bold text-white">{clip.title || clip.label}</span>
                      </div>
                      <p className="text-[11px] font-mono text-gray-400 mt-0.5">
                        {formatTime(clip.startTime)} – {formatTime(clip.endTime)}
                      </p>
                      <p className="text-[10px] font-mono text-purple-300">
                        {formatTime(clip.duration)}
                      </p>
                    </div>
                  </div>

                  {/* Radio / Selection Circle */}
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-purple-500 bg-purple-600 text-white"
                        : "border-gray-600 bg-transparent"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: 9:16 Canvas with Interactive Bounding Box (5 cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          {/* If Split-Screen mode is active, show the view mode switcher */}
          {vidSettings?.cropMode === "split" && (
            <div className="flex items-center gap-1.5 p-1 bg-[#17192F] rounded-xl border border-[#232646] mb-3 w-full max-w-[360px]">
              <button
                type="button"
                onClick={() => setSplitPreviewView("stacked")}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  splitPreviewView === "stacked"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>📱 9:16 Output</span>
              </button>
              <button
                type="button"
                onClick={() => setSplitPreviewView("boxes")}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  splitPreviewView === "boxes"
                    ? "bg-purple-600 text-white shadow-md"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <Columns2 className="w-3.5 h-3.5" />
                <span>✂️ 16:9 Crop Boxes</span>
              </button>
            </div>
          )}

          {vidSettings?.cropMode === "split" && splitPreviewView === "boxes" ? (
            /* 16:9 Interactive Dual-Box Editor */
            <div className="w-full flex flex-col items-center gap-2">
              <div
                ref={container16x9Ref}
                className="relative aspect-video w-full max-w-[560px] bg-black rounded-2xl overflow-hidden border-2 border-[#2C3058] shadow-2xl select-none group"
              >
                {/* Badges */}
                <div className="absolute top-2.5 inset-x-3 flex items-center justify-between z-30 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold flex items-center gap-1.5 shadow-lg">
                    <Columns2 className="w-3.5 h-3.5" />
                    <span>Dual-Box 9:8 Crop Editor</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-[11px]">
                    16:9 Source
                  </span>
                </div>

                {/* 16:9 Video */}
                {hasError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={videoMetadata?.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
                    alt={activeClip?.label || "Clip"}
                    className="w-full h-full object-cover opacity-85"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    src={streamSrc}
                    loop
                    muted={isMuted}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => {
                      setIsLoading(false);
                      setHasError(false);
                      if (videoRef.current && activeClip) {
                        videoRef.current.currentTime = activeClip.startTime;
                      }
                    }}
                    onError={() => {
                      setHasError(true);
                      setIsLoading(false);
                    }}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={togglePlay}
                    playsInline
                    preload="metadata"
                  />
                )}

                {/* Box 1 (Top Speaker) */}
                <div
                  style={{
                    left: `${b1.x}%`,
                    top: `${b1.y}%`,
                    width: `${b1.width}%`,
                    height: `${b1.height}%`,
                  }}
                  onMouseDown={(e) => startDrag(e, "box1", "move")}
                  className={`absolute border-2 rounded-lg cursor-move z-20 transition-[border-color,background-color] ${
                    activeBoxKey === "box1"
                      ? "border-[#00F0FF] bg-[#00F0FF]/15 shadow-[0_0_15px_rgba(0,240,255,0.4)]"
                      : "border-[#00F0FF]/60 bg-[#00F0FF]/10 hover:border-[#00F0FF]"
                  }`}
                >
                  <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-[#00F0FF] text-black font-bold text-[10px] font-mono shadow flex items-center gap-1 select-none pointer-events-none">
                    <span>Box 1 (Top)</span>
                    <span className="opacity-75">9:8</span>
                  </div>

                  {/* 4 Corner Handles */}
                  <span
                    onMouseDown={(e) => startDrag(e, "box1", "resize", "nw")}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-[#00F0FF] rounded-sm cursor-nwse-resize shadow ring-1 ring-black"
                  />
                  <span
                    onMouseDown={(e) => startDrag(e, "box1", "resize", "ne")}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#00F0FF] rounded-sm cursor-nesw-resize shadow ring-1 ring-black"
                  />
                  <span
                    onMouseDown={(e) => startDrag(e, "box1", "resize", "sw")}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-[#00F0FF] rounded-sm cursor-nesw-resize shadow ring-1 ring-black"
                  />
                  <span
                    onMouseDown={(e) => startDrag(e, "box1", "resize", "se")}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#00F0FF] rounded-sm cursor-nwse-resize shadow ring-1 ring-black"
                  />
                </div>

                {/* Box 2 (Bottom Speaker) */}
                <div
                  style={{
                    left: `${b2.x}%`,
                    top: `${b2.y}%`,
                    width: `${b2.width}%`,
                    height: `${b2.height}%`,
                  }}
                  onMouseDown={(e) => startDrag(e, "box2", "move")}
                  className={`absolute border-2 rounded-lg cursor-move z-20 transition-[border-color,background-color] ${
                    activeBoxKey === "box2"
                      ? "border-[#A855F7] bg-[#A855F7]/15 shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                      : "border-[#A855F7]/60 bg-[#A855F7]/10 hover:border-[#A855F7]"
                  }`}
                >
                  <div className="absolute -top-6 left-0 px-2 py-0.5 rounded bg-[#A855F7] text-white font-bold text-[10px] font-mono shadow flex items-center gap-1 select-none pointer-events-none">
                    <span>Box 2 (Bottom)</span>
                    <span className="opacity-75">9:8</span>
                  </div>

                  {/* 4 Corner Handles */}
                  <span
                    onMouseDown={(e) => startDrag(e, "box2", "resize", "nw")}
                    className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-[#A855F7] rounded-sm cursor-nwse-resize shadow ring-1 ring-black"
                  />
                  <span
                    onMouseDown={(e) => startDrag(e, "box2", "resize", "ne")}
                    className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-[#A855F7] rounded-sm cursor-nesw-resize shadow ring-1 ring-black"
                  />
                  <span
                    onMouseDown={(e) => startDrag(e, "box2", "resize", "sw")}
                    className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-[#A855F7] rounded-sm cursor-nesw-resize shadow ring-1 ring-black"
                  />
                  <span
                    onMouseDown={(e) => startDrag(e, "box2", "resize", "se")}
                    className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-[#A855F7] rounded-sm cursor-nwse-resize shadow ring-1 ring-black"
                  />
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity z-30">
                  <input
                    type="range"
                    min="0"
                    max={activeClip?.duration || 10}
                    step="0.1"
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex items-center justify-between text-xs text-white">
                    <div className="flex items-center gap-2.5">
                      <button onClick={togglePlay} className="p-0.5 hover:text-purple-400">
                        {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                      </button>
                      <span className="font-mono text-[11px] text-gray-300">
                        {formatTime(currentTime)} / {formatTime(activeClip?.duration || 0)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.muted = !isMuted;
                            setIsMuted(!isMuted);
                          }
                        }}
                        className="p-0.5 hover:text-purple-400"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 text-center">
                💡 Drag boxes over speakers. Drag corners to resize (9:8 aspect ratio locked). Switch to <span className="text-purple-300 font-semibold">&quot;9:16 Output&quot;</span> to preview stacked short.
              </p>
            </div>
          ) : vidSettings?.cropMode === "split" && splitPreviewView === "stacked" ? (
            /* 9:16 Live Stacked Preview */
            <div
              className="relative aspect-[9/16] w-full max-w-[360px] bg-black rounded-3xl overflow-hidden border-2 border-[#2C3058] shadow-2xl group flex flex-col cursor-pointer select-none"
              onClick={togglePlay}
            >
              {/* Master Video for Audio & Time Clock (Hidden) */}
              <video
                ref={videoRef}
                src={streamSrc}
                loop
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={() => {
                  setIsLoading(false);
                  setHasError(false);
                  if (videoRef.current && activeClip) {
                    videoRef.current.currentTime = activeClip.startTime;
                  }
                  if (videoTopRef.current && activeClip) {
                    videoTopRef.current.currentTime = activeClip.startTime;
                  }
                  if (videoBottomRef.current && activeClip) {
                    videoBottomRef.current.currentTime = activeClip.startTime;
                  }
                }}
                onError={() => {
                  setHasError(true);
                  setIsLoading(false);
                }}
                className="hidden"
                playsInline
                preload="auto"
              />

              {/* Top Half: Box 1 */}
              <div className="relative h-1/2 w-full overflow-hidden border-b-2 border-purple-500/40 bg-black">
                <video
                  ref={videoTopRef}
                  src={streamSrc}
                  loop
                  muted
                  preload="auto"
                  className="absolute pointer-events-none"
                  style={{
                    width: `${(100 / (b1.width || 45)) * 100}%`,
                    height: `${(100 / (b1.height || 80)) * 100}%`,
                    left: `-${((b1.x || 5) / (b1.width || 45)) * 100}%`,
                    top: `-${((b1.y || 10) / (b1.height || 80)) * 100}%`,
                    maxWidth: "none",
                  }}
                  playsInline
                />
                <div className="absolute top-2.5 left-2.5 z-10 px-2 py-0.5 rounded bg-[#00F0FF]/90 text-black font-mono text-[10px] font-bold shadow">
                  Box 1 (Top)
                </div>
              </div>

              {/* Bottom Half: Box 2 */}
              <div className="relative h-1/2 w-full overflow-hidden bg-black">
                <video
                  ref={videoBottomRef}
                  src={streamSrc}
                  loop
                  muted
                  preload="auto"
                  className="absolute pointer-events-none"
                  style={{
                    width: `${(100 / (b2.width || 45)) * 100}%`,
                    height: `${(100 / (b2.height || 80)) * 100}%`,
                    left: `-${((b2.x || 50) / (b2.width || 45)) * 100}%`,
                    top: `-${((b2.y || 10) / (b2.height || 80)) * 100}%`,
                    maxWidth: "none",
                  }}
                  playsInline
                />
                <div className="absolute bottom-12 left-2.5 z-10 px-2 py-0.5 rounded bg-[#A855F7]/90 text-white font-mono text-[10px] font-bold shadow">
                  Box 2 (Bottom)
                </div>
              </div>

              {/* Center Play Button if paused */}
              {!isPlaying && (
                <div
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[0.5px] z-20 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-full bg-purple-600/90 text-white flex items-center justify-center purple-glow shadow-xl hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
              )}

              {/* Clip Border Overlay (Neon / Blur / Solid) */}
              {vidSettings?.borderType && vidSettings.borderType !== "none" && (
                <div
                  className="absolute inset-0 pointer-events-none z-10 rounded-3xl transition-all"
                  style={{
                    border: `${vidSettings.borderWidth || 10}px solid ${
                      vidSettings.borderType === "blur"
                        ? `${vidSettings.borderColor || "#00F0FF"}99`
                        : vidSettings.borderColor || "#00F0FF"
                    }`,
                    boxShadow:
                      vidSettings.borderType === "neon"
                        ? `0 0 ${(vidSettings.borderWidth || 10) * 2.2}px ${vidSettings.borderColor || "#00F0FF"}, inset 0 0 ${(vidSettings.borderWidth || 10) * 1.5}px ${vidSettings.borderColor || "#00F0FF"}`
                        : vidSettings.borderType === "blur"
                        ? `0 0 ${(vidSettings.borderWidth || 10) * 2.5}px ${(vidSettings.borderWidth || 10)}px ${vidSettings.borderColor || "#00F0FF"}66, inset 0 0 ${(vidSettings.borderWidth || 10) * 2}px rgba(0,0,0,0.65)`
                        : "none",
                  }}
                />
              )}

              {/* Draggable/Interactive Caption Box with Handles */}
              {isCaptionsEnabled ? (
                <div
                  style={{
                    bottom: capSettings?.position === "top" ? "68%" : capSettings?.position === "center" ? "42%" : "20%",
                  }}
                  className="absolute inset-x-4 z-20 flex justify-center pointer-events-auto cursor-move"
                >
                  <div className="relative p-3.5 rounded-2xl bg-black/80 backdrop-blur-md border-2 border-purple-400 dashed-outline shadow-[0_0_20px_rgba(139,92,246,0.4)] max-w-full">
                    {/* 4 Corner Handles */}
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />

                    <p
                      style={{
                        fontSize: `${Math.round((capSettings?.fontSize || 56) * 0.36)}px`,
                        color: capSettings?.textColor || "#FFFFFF",
                        fontFamily: capSettings?.font || "Inter",
                        fontWeight: capSettings?.style === "bold" ? 800 : 700,
                        lineHeight: 1.25,
                      }}
                      className="text-center tracking-tight select-none"
                    >
                      {(activeSeg.words || []).map((w, wIdx) => {
                        const shouldHighlight =
                          capSettings?.autoHighlight && (w.isHighlighted || wIdx === (activeSeg.words?.length || 1) - 1);

                        if (shouldHighlight) {
                          return (
                            <span
                              key={wIdx}
                              style={{
                                backgroundColor: capSettings?.highlightColor || "#FACC15",
                                color: "#000000",
                              }}
                              className="inline-block mx-0.5 px-1.5 py-0.5 rounded font-black shadow-md"
                            >
                              {w.word}{" "}
                            </span>
                          );
                        }
                        return <span key={wIdx}>{w.word} </span>;
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute top-12 left-3 z-20 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 font-medium flex items-center gap-1.5 shadow-md">
                    <EyeOff className="w-3 h-3 text-gray-400" />
                    <span>Captions Disabled</span>
                  </span>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity z-30">
                <input
                  type="range"
                  min="0"
                  max={activeClip?.duration || 10}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />

                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2.5">
                    <button onClick={togglePlay} className="p-0.5 hover:text-purple-400">
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <span className="font-mono text-[11px] text-gray-300">
                      {formatTime(currentTime)} / {formatTime(activeClip?.duration || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-0.5 hover:text-purple-400"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => videoRef.current?.requestFullscreen()}
                      className="p-0.5 hover:text-purple-400"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Single Crop 9:16 Preview Canvas */
            <div className="relative aspect-[9/16] w-full max-w-[360px] bg-black rounded-3xl overflow-hidden border-2 border-[#2C3058] shadow-2xl group">
              {/* Top Badges */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20 pointer-events-none">
                <div
                  style={{ backgroundColor: activeClip?.color || "#8B5CF6" }}
                  className="px-2.5 py-1 rounded-lg text-white font-mono text-xs font-bold flex items-center gap-1.5 shadow-lg"
                >
                  <span>{activeClip?.label.replace("Clip ", "")}</span>
                  <span>{formatTime(activeClip?.duration || 0)}</span>
                </div>

                <div className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/20 text-white font-mono text-xs font-semibold">
                  9:16
                </div>
              </div>

              {/* Video Background */}
              {hasError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={videoMetadata?.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
                  alt={activeClip?.label || "Clip"}
                  className="w-full h-full object-cover opacity-85"
                />
              ) : (
                <video
                  ref={videoRef}
                  src={streamSrc}
                  loop
                  muted={isMuted}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={() => {
                    setIsLoading(false);
                    setHasError(false);
                    if (videoRef.current && activeClip) {
                      videoRef.current.currentTime = activeClip.startTime;
                    }
                  }}
                  onError={() => {
                    console.warn("[Screen4Customize] video error with src:", streamSrc);
                    setHasError(true);
                    setIsLoading(false);
                  }}
                  style={{
                    transform: `scale(${vidSettings?.zoomScale || 1}) translate(${vidSettings?.panX || 0}px, ${vidSettings?.panY || 0}px)`,
                  }}
                  className="w-full h-full object-cover transition-transform"
                  onClick={togglePlay}
                  playsInline
                  preload="metadata"
                />
              )}

              {/* Clip Border Overlay (Neon / Blur / Solid) */}
              {vidSettings?.borderType && vidSettings.borderType !== "none" && (
                <div
                  className="absolute inset-0 pointer-events-none z-10 rounded-3xl transition-all"
                  style={{
                    border: `${vidSettings.borderWidth || 10}px solid ${
                      vidSettings.borderType === "blur"
                        ? `${vidSettings.borderColor || "#00F0FF"}99`
                        : vidSettings.borderColor || "#00F0FF"
                    }`,
                    boxShadow:
                      vidSettings.borderType === "neon"
                        ? `0 0 ${(vidSettings.borderWidth || 10) * 2.2}px ${vidSettings.borderColor || "#00F0FF"}, inset 0 0 ${(vidSettings.borderWidth || 10) * 1.5}px ${vidSettings.borderColor || "#00F0FF"}`
                        : vidSettings.borderType === "blur"
                        ? `0 0 ${(vidSettings.borderWidth || 10) * 2.5}px ${(vidSettings.borderWidth || 10)}px ${vidSettings.borderColor || "#00F0FF"}66, inset 0 0 ${(vidSettings.borderWidth || 10) * 2}px rgba(0,0,0,0.65)`
                        : "none",
                  }}
                />
              )}

              {/* Draggable/Interactive Caption Box with Handles */}
              {isCaptionsEnabled ? (
                <div
                  style={{
                    bottom: capSettings?.position === "top" ? "68%" : capSettings?.position === "center" ? "42%" : "20%",
                  }}
                  className="absolute inset-x-4 z-20 flex justify-center pointer-events-auto cursor-move"
                >
                  <div className="relative p-3.5 rounded-2xl bg-black/80 backdrop-blur-md border-2 border-purple-400 dashed-outline shadow-[0_0_20px_rgba(139,92,246,0.4)] max-w-full">
                    {/* 4 Corner Handles */}
                    <span className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />
                    <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />
                    <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />
                    <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-purple-400 rounded-sm shadow" />

                    <p
                      style={{
                        fontSize: `${Math.round((capSettings?.fontSize || 56) * 0.36)}px`,
                        color: capSettings?.textColor || "#FFFFFF",
                        fontFamily: capSettings?.font || "Inter",
                        fontWeight: capSettings?.style === "bold" ? 800 : 700,
                        lineHeight: 1.25,
                      }}
                      className="text-center tracking-tight select-none"
                    >
                      {(activeSeg.words || []).map((w, wIdx) => {
                        const shouldHighlight =
                          capSettings?.autoHighlight && (w.isHighlighted || wIdx === (activeSeg.words?.length || 1) - 1);

                        if (shouldHighlight) {
                          return (
                            <span
                              key={wIdx}
                              style={{
                                backgroundColor: capSettings?.highlightColor || "#FACC15",
                                color: "#000000",
                              }}
                              className="inline-block mx-0.5 px-1.5 py-0.5 rounded font-black shadow-md"
                            >
                              {w.word}{" "}
                            </span>
                          );
                        }
                        return <span key={wIdx}>{w.word} </span>;
                      })}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="absolute top-12 left-3 z-20 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md border border-white/10 text-[11px] text-gray-300 font-medium flex items-center gap-1.5 shadow-md">
                    <EyeOff className="w-3 h-3 text-gray-400" />
                    <span>Captions Disabled</span>
                  </span>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity z-30">
                <input
                  type="range"
                  min="0"
                  max={activeClip?.duration || 10}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />

                <div className="flex items-center justify-between text-xs text-white">
                  <div className="flex items-center gap-2.5">
                    <button onClick={togglePlay} className="p-0.5 hover:text-purple-400">
                      {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
                    </button>
                    <span className="font-mono text-[11px] text-gray-300">
                      {formatTime(currentTime)} / {formatTime(activeClip?.duration || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.muted = !isMuted;
                          setIsMuted(!isMuted);
                        }
                      }}
                      className="p-0.5 hover:text-purple-400"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => videoRef.current?.requestFullscreen()}
                      className="p-0.5 hover:text-purple-400"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Customization Tabs (4 cols) */}
        <div className="lg:col-span-4 bg-[#121426] border border-[#232746] rounded-2xl p-5 shadow-2xl space-y-5">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-[#17192F] rounded-xl border border-[#232646] gap-1 overflow-x-auto">
            {[
              { id: "split", label: "Split", icon: Columns2, badge: "NEW" },
              { id: "captions", label: "Captions", icon: Subtitles },
              { id: "border", label: "Border", icon: Square },
              { id: "video", label: "Video", icon: Video },
              { id: "layout", label: "Layout", icon: Layout },
              { id: "branding", label: "Branding", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    if (tab.id === "split") {
                      if (activeClip && vidSettings?.cropMode !== "split") {
                        updateVideoSettings(activeClip.id, { cropMode: "split" });
                      }
                      setSplitPreviewView("boxes");
                    }
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-lg text-xs font-semibold relative transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md purple-glow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{tab.label}</span>
                  {tab.badge && (
                    <span className="absolute -top-1 -right-0.5 px-1 py-0.2 rounded-full text-[8px] font-extrabold bg-cyan-400 text-black leading-tight shadow">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content: Split-Screen (Dedicated Top-Level Tab) */}
          {activeTab === "split" && vidSettings && activeClip && (
            <div className="space-y-4 animate-fade-in">
              {/* Master Split-Screen Switch */}
              <div className="p-3.5 rounded-xl bg-[#181A30] border border-[#252848] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      vidSettings.cropMode === "split"
                        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                        : "bg-gray-800 text-gray-400 border border-gray-700"
                    }`}
                  >
                    <Columns2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Dual-Box Mode</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          vidSettings.cropMode === "split"
                            ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {vidSettings.cropMode === "split" ? "ACTIVE" : "OFF"}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {vidSettings.cropMode === "split"
                        ? "2 boxes stacked vertically to 9:16"
                        : "Single 9:16 vertical crop active"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextMode = vidSettings.cropMode === "split" ? "center" : "split";
                    updateVideoSettings(activeClip.id, { cropMode: nextMode });
                    if (nextMode === "split") setSplitPreviewView("boxes");
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    vidSettings.cropMode === "split"
                      ? "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30"
                      : "bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold shadow-md"
                  }`}
                >
                  {vidSettings.cropMode === "split" ? "Disable" : "Enable Split-Screen"}
                </button>
              </div>

              {vidSettings.cropMode !== "split" ? (
                <div className="p-4 rounded-xl bg-[#141628] border border-dashed border-cyan-500/30 text-center space-y-3">
                  <Columns2 className="w-7 h-7 text-cyan-400 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Split-Screen is Currently Off</p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Enable Dual-Box Split-Screen to crop two speakers (or two points of interest) from horizontal video and stack them into a vertical short.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      updateVideoSettings(activeClip.id, { cropMode: "split" });
                      setSplitPreviewView("boxes");
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-bold text-xs shadow-lg hover:scale-105 transition-all"
                  >
                    ⚡ Turn ON Split-Screen
                  </button>
                </div>
              ) : (
                /* Full Dual-Box Controls */
                <div className="space-y-3.5">
                  {/* View Mode Toggle: Boxes vs Stacked */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Canvas Preview Mode</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSplitPreviewView("boxes")}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                          splitPreviewView === "boxes"
                            ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 shadow"
                            : "border-[#252848] bg-[#181A30] text-gray-400 hover:text-white"
                        }`}
                      >
                        <Columns2 className="w-3.5 h-3.5" />
                        <span>✂️ 16:9 Crop Boxes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitPreviewView("stacked")}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border ${
                          splitPreviewView === "stacked"
                            ? "border-purple-500 bg-purple-600/30 text-purple-300 shadow"
                            : "border-[#252848] bg-[#181A30] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span>📱 9:16 Output</span>
                      </button>
                    </div>
                  </div>

                  {/* Target Box Selector */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-gray-300">Select Box to Position & Resize</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setActiveBoxKey("box1"); setSplitPreviewView("boxes"); }}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          activeBoxKey === "box1"
                            ? "border-[#00F0FF] bg-[#00F0FF]/20 text-[#00F0FF] shadow"
                            : "border-[#252848] bg-[#181A30] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#00F0FF]" />
                        <span>Box 1 (Top Speaker)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setActiveBoxKey("box2"); setSplitPreviewView("boxes"); }}
                        className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          activeBoxKey === "box2"
                            ? "border-[#A855F7] bg-[#A855F7]/20 text-[#A855F7] shadow"
                            : "border-[#252848] bg-[#181A30] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#A855F7]" />
                        <span>Box 2 (Bottom Speaker)</span>
                      </button>
                    </div>
                  </div>

                  {/* Sliders for active box */}
                  <div className="p-3 rounded-xl bg-[#181A30] border border-[#252848] space-y-2.5">
                    <div className="flex items-center justify-between text-xs pb-1 border-b border-[#222544]">
                      <span className="font-semibold text-gray-300">
                        {activeBoxKey === "box1" ? "Box 1 (Top Speaker)" : "Box 2 (Bottom Speaker)"}
                      </span>
                      <span className="font-mono text-cyan-400 text-[11px]">9:8 Ratio Locked</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Horizontal Position (X)</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {(activeBoxKey === "box1" ? b1.x : b2.x).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, 100 - (activeBoxKey === "box1" ? b1.width : b2.width))}
                        step="0.5"
                        value={activeBoxKey === "box1" ? b1.x : b2.x}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const curDual = vidSettings.dualBox || DEFAULT_DUAL_BOX;
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              ...curDual,
                              [activeBoxKey]: {
                                ...(activeBoxKey === "box1" ? b1 : b2),
                                x: val,
                              },
                            },
                          });
                        }}
                        className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Vertical Position (Y)</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {(activeBoxKey === "box1" ? b1.y : b2.y).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, 100 - (activeBoxKey === "box1" ? b1.height : b2.height))}
                        step="0.5"
                        value={activeBoxKey === "box1" ? b1.y : b2.y}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const curDual = vidSettings.dualBox || DEFAULT_DUAL_BOX;
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              ...curDual,
                              [activeBoxKey]: {
                                ...(activeBoxKey === "box1" ? b1 : b2),
                                y: val,
                              },
                            },
                          });
                        }}
                        className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Box Size (9:8 Locked)</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {(activeBoxKey === "box1" ? b1.width : b2.width).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="1"
                        value={activeBoxKey === "box1" ? b1.width : b2.width}
                        onChange={(e) => {
                          const wVal = parseFloat(e.target.value);
                          const hVal = Math.min(100, Math.round((wVal / 0.6328125) * 10) / 10);
                          const curDual = vidSettings.dualBox || DEFAULT_DUAL_BOX;
                          const targetBox = activeBoxKey === "box1" ? b1 : b2;
                          const clampedX = Math.min(targetBox.x, 100 - wVal);
                          const clampedY = Math.min(targetBox.y, 100 - hVal);

                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              ...curDual,
                              [activeBoxKey]: {
                                x: clampedX,
                                y: clampedY,
                                width: wVal,
                                height: hVal,
                              },
                            },
                          });
                        }}
                        className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-gray-400">Quick Layout Presets</label>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              box1: { x: 5, y: 10, width: 45, height: 80 },
                              box2: { x: 50, y: 10, width: 45, height: 80 },
                            },
                          });
                        }}
                        className="p-1.5 rounded-lg bg-[#181A30] border border-[#252848] hover:border-cyan-500/50 text-cyan-300 text-center transition-all"
                      >
                        Left / Right
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              box1: { x: 50, y: 10, width: 45, height: 80 },
                              box2: { x: 5, y: 10, width: 45, height: 80 },
                            },
                          });
                        }}
                        className="p-1.5 rounded-lg bg-[#181A30] border border-[#252848] hover:border-purple-500/50 text-purple-300 text-center transition-all"
                      >
                        Inverted
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              box1: { x: 27, y: 5, width: 46, height: 72 },
                              box2: { x: 27, y: 23, width: 46, height: 72 },
                            },
                          });
                        }}
                        className="p-1.5 rounded-lg bg-[#181A30] border border-[#252848] hover:border-white/50 text-white text-center transition-all"
                      >
                        Centered
                      </button>
                    </div>
                  </div>

                  {/* Apply to All Clips */}
                  <button
                    type="button"
                    onClick={() => {
                      updateAllVideoSettings({
                        cropMode: "split",
                        dualBox: vidSettings.dualBox || DEFAULT_DUAL_BOX,
                      });
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Split-Screen to All Clips</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Captions */}
          {activeTab === "captions" && capSettings && (
            <div className="space-y-4 animate-fade-in">
              {/* Master Captions Toggle */}
              <div className="p-3 rounded-xl bg-[#181A30] border border-[#252848] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isCaptionsEnabled
                        ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        : "bg-gray-800 text-gray-500 border border-gray-700"
                    }`}
                  >
                    {isCaptionsEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>AI Captions</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isCaptionsEnabled
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {isCaptionsEnabled ? "Active" : "Disabled (Off)"}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-400">
                      {isCaptionsEnabled
                        ? "Captions will be burned into this clip"
                        : "Clean video without captions will be exported"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextState = !isCaptionsEnabled;
                    updateAllCaptionSettings({
                      enabled: nextState,
                      style: nextState ? (capSettings.style === "none" ? "default" : capSettings.style) : "none",
                    });
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isCaptionsEnabled
                      ? "bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30"
                      : "bg-purple-600 hover:bg-purple-500 text-white shadow-md purple-glow-sm"
                  }`}
                >
                  {isCaptionsEnabled ? "Remove Captions" : "Enable Captions"}
                </button>
              </div>

              {!isCaptionsEnabled && (
                <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs text-purple-300">
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-purple-400 shrink-0" />
                    <span>Captions are removed. Video will export clean.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateAllCaptionSettings({ enabled: true, style: "default" })}
                    className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] shrink-0"
                  >
                    Restore
                  </button>
                </div>
              )}

              {/* Caption Style */}
              <div className={`space-y-1.5 transition-opacity ${!isCaptionsEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-gray-300">Caption Style</label>
                  {isCaptionsEnabled && (
                    <button
                      type="button"
                      onClick={() => updateAllCaptionSettings({ style: "none", enabled: false })}
                      className="text-[10px] text-red-400 hover:underline flex items-center gap-1"
                    >
                      <EyeOff className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[
                    { id: "none", label: "None" },
                    { id: "default", label: "Default" },
                    { id: "bold", label: "Bold" },
                    { id: "highlight", label: "Highlight" },
                    { id: "modern", label: "Modern" },
                    { id: "outline", label: "Outline" },
                  ].map((s) => {
                    const isSelected = (s.id === "none" && !isCaptionsEnabled) || (capSettings.style === s.id && isCaptionsEnabled);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (s.id === "none") {
                            updateAllCaptionSettings({ style: "none", enabled: false });
                          } else {
                            updateAllCaptionSettings({ style: s.id as CaptionStyle, enabled: true });
                          }
                        }}
                        className={`p-2 rounded-xl text-center border text-[11px] font-medium transition-all ${
                          isSelected
                            ? "bg-purple-600/30 border-purple-500 text-purple-300 font-bold"
                            : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="block text-xs font-extrabold mb-0.5">{s.id === "none" ? "Ø" : "Aa"}</span>
                        <span className="text-[9px] block truncate">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font */}
              <div className={`space-y-1.5 transition-opacity ${!isCaptionsEnabled ? "opacity-50 pointer-events-none" : ""}`}>
                <label className="text-xs font-semibold text-gray-300">Font</label>
                <select
                  value={capSettings.font}
                  onChange={(e) => updateAllCaptionSettings({ font: e.target.value as CaptionFont })}
                  className="w-full bg-[#181A30] border border-[#252848] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="Inter">Inter SemiBold</option>
                  <option value="Outfit">Outfit Bold</option>
                  <option value="Montserrat">Montserrat Black</option>
                  <option value="Roboto">Roboto Condensed</option>
                  <option value="Arial">Arial Bold</option>
                </select>
              </div>

              {/* Text Size */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Text Size</span>
                  <span className="font-mono text-purple-400 font-bold">{capSettings.fontSize} px</span>
                </div>
                <input
                  type="range"
                  min="32"
                  max="72"
                  value={capSettings.fontSize}
                  onChange={(e) => updateAllCaptionSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              {/* Text Color & Highlight Color */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Text Color</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {TEXT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateAllCaptionSettings({ textColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-md transition-all ${
                          capSettings.textColor === c ? "ring-2 ring-purple-500 scale-110" : "opacity-75 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Highlight Color</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateAllCaptionSettings({ highlightColor: c })}
                        style={{ backgroundColor: c }}
                        className={`w-6 h-6 rounded-md transition-all ${
                          capSettings.highlightColor === c ? "ring-2 ring-purple-500 scale-110" : "opacity-75 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Position */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Position</label>
                <div className="grid grid-cols-3 gap-2">
                  {["top", "center", "bottom"].map((pos) => (
                    <button
                      key={pos}
                      onClick={() => updateAllCaptionSettings({ position: pos as any })}
                      className={`py-1.5 rounded-xl border text-xs capitalize transition-all ${
                        capSettings.position === pos
                          ? "bg-purple-600/30 border-purple-500 text-purple-300 font-bold"
                          : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                      }`}
                    >
                      {pos}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Background */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Text Background</label>
                <select
                  value={capSettings.textBackground}
                  onChange={(e) => updateAllCaptionSettings({ textBackground: e.target.value as TextBackground })}
                  className="w-full bg-[#181A30] border border-[#252848] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="rounded">Rounded Box</option>
                  <option value="none">None (Transparent)</option>
                  <option value="box">Solid Box</option>
                  <option value="outline">Text Outline</option>
                  <option value="shadow">Drop Shadow</option>
                </select>
              </div>

              {/* Advanced Toggles */}
              <div className="pt-3 border-t border-[#1F2342] space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Advanced</h3>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs text-gray-200">Auto word highlight (AI)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={capSettings.autoHighlight}
                    onChange={(e) => updateAllCaptionSettings({ autoHighlight: e.target.checked })}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs text-gray-200">Add punch-in zoom (auto)</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={capSettings.autoZoom}
                    onChange={(e) => updateAllCaptionSettings({ autoZoom: e.target.checked })}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MicOff className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-200">Remove silence & filler words</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={capSettings.removeSilence}
                    onChange={(e) => updateAllCaptionSettings({ removeSilence: e.target.checked })}
                    className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                  />
                </div>
              </div>

              {isCaptionsEnabled && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => updateAllCaptionSettings({ enabled: false, style: "none" })}
                    className="w-full py-2.5 px-3 rounded-xl border border-red-500/25 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Don&apos;t want captions? Remove Captions</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Border */}
          {activeTab === "border" && vidSettings && activeClip && (
            <div className="space-y-4 animate-fade-in">
              {/* Border Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Border Style</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: "none", label: "None", desc: "No Border" },
                    { id: "neon", label: "Neon Glow", desc: "Cyberpunk" },
                    { id: "blur", label: "Blur Soft", desc: "Frosted" },
                    { id: "solid", label: "Solid", desc: "Clean" },
                  ].map((b) => {
                    const isSelected = (vidSettings.borderType || "none") === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => updateVideoSettings(activeClip.id, { borderType: b.id as BorderType })}
                        className={`p-2 rounded-xl text-center border transition-all ${
                          isSelected
                            ? "bg-purple-600/30 border-purple-500 text-purple-300 font-bold shadow-sm"
                            : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="text-xs block font-bold">{b.label}</span>
                        <span className="text-[9px] block text-gray-400">{b.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Only show color & thickness if border is enabled */}
              {vidSettings.borderType && vidSettings.borderType !== "none" && (
                <>
                  {/* Border Color */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-gray-300">Border Color</label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-purple-400">{vidSettings.borderColor || "#00F0FF"}</span>
                        <input
                          type="color"
                          value={vidSettings.borderColor || "#00F0FF"}
                          onChange={(e) => updateVideoSettings(activeClip.id, { borderColor: e.target.value })}
                          className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {BORDER_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => updateVideoSettings(activeClip.id, { borderColor: c })}
                          style={{ backgroundColor: c }}
                          className={`w-7 h-7 rounded-lg transition-all ${
                            (vidSettings.borderColor || "#00F0FF") === c
                              ? "ring-2 ring-white scale-110 shadow-lg"
                              : "opacity-75 hover:opacity-100 hover:scale-105"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Border Thickness */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-300">Border Thickness</span>
                      <span className="font-mono text-purple-400 font-bold">{vidSettings.borderWidth || 10} px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="28"
                      step="2"
                      value={vidSettings.borderWidth || 10}
                      onChange={(e) => updateVideoSettings(activeClip.id, { borderWidth: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Quick Presets</label>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => updateVideoSettings(activeClip.id, { borderType: "neon", borderColor: "#00F0FF", borderWidth: 12 })}
                        className="p-2 rounded-xl bg-[#181A30] border border-[#252848] hover:border-cyan-500/50 text-cyan-300 text-left transition-all"
                      >
                        ⚡ Cyber Cyan (Neon)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateVideoSettings(activeClip.id, { borderType: "neon", borderColor: "#A855F7", borderWidth: 14 })}
                        className="p-2 rounded-xl bg-[#181A30] border border-[#252848] hover:border-purple-500/50 text-purple-300 text-left transition-all"
                      >
                        ✨ Purple Glow (Neon)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateVideoSettings(activeClip.id, { borderType: "blur", borderColor: "#FFFFFF", borderWidth: 16 })}
                        className="p-2 rounded-xl bg-[#181A30] border border-[#252848] hover:border-white/50 text-gray-200 text-left transition-all"
                      >
                        🌫️ Frosted Frame (Blur)
                      </button>
                      <button
                        type="button"
                        onClick={() => updateVideoSettings(activeClip.id, { borderType: "solid", borderColor: "#FFFFFF", borderWidth: 8 })}
                        className="p-2 rounded-xl bg-[#181A30] border border-[#252848] hover:border-white/50 text-white text-left transition-all"
                      >
                        ⬜ Clean Minimal (Solid)
                      </button>
                    </div>
                  </div>

                  {/* Apply to All Clips Button */}
                  <div className="pt-2 border-t border-[#1F2342]">
                    <button
                      type="button"
                      onClick={() =>
                        updateAllVideoSettings({
                          borderType: vidSettings.borderType,
                          borderColor: vidSettings.borderColor,
                          borderWidth: vidSettings.borderWidth,
                        })
                      }
                      className="w-full py-2 px-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Border to All Clips</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab Content: Video */}
          {activeTab === "video" && vidSettings && activeClip && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Crop Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "center", label: "Center 9:16" },
                    { id: "split", label: "Split (2-Box)" },
                    { id: "face", label: "Face Tracking" },
                    { id: "left", label: "Left Crop" },
                    { id: "right", label: "Right Crop" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        updateVideoSettings(activeClip.id, { cropMode: mode.id as any });
                        if (mode.id === "split") {
                          setSplitPreviewView("boxes");
                        }
                      }}
                      className={`p-2 rounded-xl text-xs border transition-all ${
                        vidSettings.cropMode === mode.id
                          ? "bg-purple-600/30 border-purple-500 text-purple-300 font-bold"
                          : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {vidSettings.cropMode === "split" ? (
                /* Dual-Box Controls */
                <div className="p-3.5 rounded-xl bg-[#181A30] border border-[#252848] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Columns2 className="w-4 h-4 text-cyan-400" />
                      Dual-Box Split Screen (Podcast)
                    </span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded font-mono">
                      1080x1920 Stacked
                    </span>
                  </div>

                  {/* Target Box Switcher */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setActiveBoxKey("box1"); setSplitPreviewView("boxes"); }}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        activeBoxKey === "box1"
                          ? "border-[#00F0FF] bg-[#00F0FF]/20 text-[#00F0FF] shadow"
                          : "border-[#252848] bg-[#121426] text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#00F0FF]" />
                      <span>Box 1 (Top Speaker)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveBoxKey("box2"); setSplitPreviewView("boxes"); }}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        activeBoxKey === "box2"
                          ? "border-[#A855F7] bg-[#A855F7]/20 text-[#A855F7] shadow"
                          : "border-[#252848] bg-[#121426] text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#A855F7]" />
                      <span>Box 2 (Bottom Speaker)</span>
                    </button>
                  </div>

                  {/* Active Box Coordinate Sliders */}
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Horizontal Position (X)</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {(activeBoxKey === "box1" ? b1.x : b2.x).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, 100 - (activeBoxKey === "box1" ? b1.width : b2.width))}
                        step="0.5"
                        value={activeBoxKey === "box1" ? b1.x : b2.x}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const curDual = vidSettings.dualBox || DEFAULT_DUAL_BOX;
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              ...curDual,
                              [activeBoxKey]: {
                                ...(activeBoxKey === "box1" ? b1 : b2),
                                x: val,
                              },
                            },
                          });
                        }}
                        className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Vertical Position (Y)</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {(activeBoxKey === "box1" ? b1.y : b2.y).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={Math.max(0, 100 - (activeBoxKey === "box1" ? b1.height : b2.height))}
                        step="0.5"
                        value={activeBoxKey === "box1" ? b1.y : b2.y}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          const curDual = vidSettings.dualBox || DEFAULT_DUAL_BOX;
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              ...curDual,
                              [activeBoxKey]: {
                                ...(activeBoxKey === "box1" ? b1 : b2),
                                y: val,
                              },
                            },
                          });
                        }}
                        className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Box Scale (9:8 Locked)</span>
                        <span className="font-mono text-cyan-400 font-bold">
                          {(activeBoxKey === "box1" ? b1.width : b2.width).toFixed(1)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        step="1"
                        value={activeBoxKey === "box1" ? b1.width : b2.width}
                        onChange={(e) => {
                          const wVal = parseFloat(e.target.value);
                          const hVal = Math.min(100, Math.round((wVal / 0.6328125) * 10) / 10);
                          const curDual = vidSettings.dualBox || DEFAULT_DUAL_BOX;
                          const targetBox = activeBoxKey === "box1" ? b1 : b2;
                          const clampedX = Math.min(targetBox.x, 100 - wVal);
                          const clampedY = Math.min(targetBox.y, 100 - hVal);

                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              ...curDual,
                              [activeBoxKey]: {
                                x: clampedX,
                                y: clampedY,
                                width: wVal,
                                height: hVal,
                              },
                            },
                          });
                        }}
                        className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Quick Presets */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-[11px] font-semibold text-gray-400">Quick Layout Presets</label>
                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={() => {
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              box1: { x: 5, y: 10, width: 45, height: 80 },
                              box2: { x: 50, y: 10, width: 45, height: 80 },
                            },
                          });
                        }}
                        className="p-1.5 rounded-lg bg-[#121426] border border-[#252848] hover:border-cyan-500/50 text-cyan-300 text-center transition-all"
                      >
                        Left / Right
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              box1: { x: 50, y: 10, width: 45, height: 80 },
                              box2: { x: 5, y: 10, width: 45, height: 80 },
                            },
                          });
                        }}
                        className="p-1.5 rounded-lg bg-[#121426] border border-[#252848] hover:border-purple-500/50 text-purple-300 text-center transition-all"
                      >
                        Inverted
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateVideoSettings(activeClip.id, {
                            dualBox: {
                              box1: { x: 27, y: 5, width: 46, height: 72 },
                              box2: { x: 27, y: 23, width: 46, height: 72 },
                            },
                          });
                        }}
                        className="p-1.5 rounded-lg bg-[#121426] border border-[#252848] hover:border-white/50 text-white text-center transition-all"
                      >
                        Centered
                      </button>
                    </div>
                  </div>

                  {/* Apply to All Clips */}
                  <button
                    type="button"
                    onClick={() => {
                      updateAllVideoSettings({
                        cropMode: "split",
                        dualBox: vidSettings.dualBox || DEFAULT_DUAL_BOX,
                      });
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply Split-Screen to All Clips</span>
                  </button>
                </div>
              ) : (
                /* Standard Zoom / Pan Controls */
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-300">Zoom Scale</span>
                      <span className="font-mono text-purple-400 font-bold">{vidSettings.zoomScale.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="2.0"
                      step="0.05"
                      value={vidSettings.zoomScale}
                      onChange={(e) => updateVideoSettings(activeClip.id, { zoomScale: parseFloat(e.target.value) })}
                      className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-300">Horizontal Pan (X)</span>
                      <span className="font-mono text-gray-400">{vidSettings.panX}px</span>
                    </div>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      value={vidSettings.panX}
                      onChange={(e) => updateVideoSettings(activeClip.id, { panX: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1F2342]">
                    <span className="text-xs text-gray-200">Blur Background Padding</span>
                    <input
                      type="checkbox"
                      checked={vidSettings.blurBackground}
                      onChange={(e) => updateVideoSettings(activeClip.id, { blurBackground: e.target.checked })}
                      className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tab Content: Layout */}
          {activeTab === "layout" && (
            <div className="space-y-4 animate-fade-in text-xs text-gray-300">
              <div className="p-3 rounded-xl bg-[#181A30] border border-[#252848] space-y-2">
                <p className="font-bold text-white">Framing & Safe Area</p>
                <p className="text-gray-400 text-[11px]">
                  All captions are automatically positioned inside the TikTok, Instagram Reels, and YouTube Shorts UI safe zones.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-300">Aspect Ratio Preset</label>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500 text-purple-300 font-bold text-center">
                    9:16 Shorts
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#181A30] border border-[#252848] text-gray-400 text-center">
                    1:1 Square
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#181A30] border border-[#252848] text-gray-400 text-center">
                    16:9 Wide
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Branding */}
          {activeTab === "branding" && (
            <div className="space-y-4 animate-fade-in text-xs text-gray-300">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Creator Watermark / Handle</label>
                <input
                  type="text"
                  placeholder="@yourhandle"
                  className="w-full bg-[#181A30] border border-[#252848] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#181A30] border border-[#252848] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Top Progress Bar</span>
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-purple-600" />
                </div>
                <p className="text-[11px] text-gray-400">
                  Renders an animated horizontal progress bar at the top of the short video.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#1C1F38]">
        <button
          onClick={() => setStep(3)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14162B] hover:bg-[#1D203D] text-gray-300 hover:text-white border border-[#272A4E] text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => setStep(5)}
          className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all purple-glow hover:scale-105 active:scale-95 shadow-xl"
        >
          <span>Export Video</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
