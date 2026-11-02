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
} from "lucide-react";
import { useClipStore } from "@/stores/clipStore";
import { formatTime } from "@/lib/utils";
import { CaptionStyle, CaptionFont, TextBackground } from "@/types";

const TEXT_COLORS = ["#FFFFFF", "#FACC15", "#8B5CF6", "#0EA5E9", "#10B981", "#EC4899"];
const HIGHLIGHT_COLORS = ["#FACC15", "#FEF08A", "#DDD6FE", "#BAE6FD", "#A7F3D0"];

export default function Screen4Customize() {
  const {
    clips,
    activeClipId,
    setActiveClipId,
    updateCaptionSettings,
    updateVideoSettings,
    updateAllCaptionSettings,
    videoMetadata,
    setStep,
  } = useClipStore();

  const [activeTab, setActiveTab] = useState<"captions" | "video" | "layout" | "branding">("captions");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      setCurrentTime(0);
    }
  }, [activeClip?.id, activeClip?.startTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      if (videoRef.current.currentTime >= activeClip.endTime || videoRef.current.currentTime < activeClip.startTime) {
        videoRef.current.currentTime = activeClip.startTime;
      }
      videoRef.current.play().catch((err) => {
        console.warn("[Screen4Customize] play error:", err);
      });
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && activeClip) {
      const rawTime = videoRef.current.currentTime;
      if (rawTime >= activeClip.endTime) {
        videoRef.current.currentTime = activeClip.startTime;
        setCurrentTime(0);
      } else {
        setCurrentTime(Math.max(0, rawTime - activeClip.startTime));
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (videoRef.current && activeClip) {
      videoRef.current.currentTime = activeClip.startTime + val;
    }
  };

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
        <div className="lg:col-span-5 flex justify-center">
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
        </div>

        {/* Right Column: Customization Tabs (4 cols) */}
        <div className="lg:col-span-4 bg-[#121426] border border-[#232746] rounded-2xl p-5 shadow-2xl space-y-5">
          {/* Tabs */}
          <div className="flex items-center p-1 bg-[#17192F] rounded-xl border border-[#232646]">
            {[
              { id: "captions", label: "Captions", icon: Subtitles },
              { id: "video", label: "Video", icon: Video },
              { id: "layout", label: "Layout", icon: Layout },
              { id: "branding", label: "Branding", icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md purple-glow-sm"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

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

          {/* Tab Content: Video */}
          {activeTab === "video" && vidSettings && activeClip && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Crop Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "center", label: "Center 9:16" },
                    { id: "face", label: "Face Tracking" },
                    { id: "left", label: "Left Crop" },
                    { id: "right", label: "Right Crop" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => updateVideoSettings(activeClip.id, { cropMode: mode.id as any })}
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
