"use client";

import React from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Subtitles,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { useClipStore } from "@/stores/clipStore";
import VerticalShortCard from "../video/VerticalShortCard";
import { CaptionStyle, CaptionFont, HighlightStyle, CaptionPosition } from "@/types";

const COLOR_SWATCHES = [
  "#FFFFFF", // White
  "#FACC15", // Yellow
  "#8B5CF6", // Purple
  "#0EA5E9", // Sky Blue
  "#10B981", // Emerald Green
  "#EC4899", // Pink
];

export default function Screen3Captions() {
  const {
    clips,
    activeClipId,
    setActiveClipId,
    updateCaptionSettings,
    updateAllCaptionSettings,
    updateClip,
    videoMetadata,
    setStep,
  } = useClipStore();

  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0];
  const settings = activeClip?.captionSettings;
  const isCaptionsEnabled = settings ? (settings.enabled !== false && settings.style !== "none") : true;

  const handleStyleChange = (style: CaptionStyle) => {
    if (style === "none") {
      updateAllCaptionSettings({ style: "none", enabled: false });
    } else {
      updateAllCaptionSettings({ style, enabled: true });
    }
  };

  const handleFontChange = (font: CaptionFont) => {
    updateAllCaptionSettings({ font });
  };

  const handleSizeChange = (fontSize: number) => {
    updateAllCaptionSettings({ fontSize });
  };

  const handleColorChange = (textColor: string) => {
    updateAllCaptionSettings({ textColor });
  };

  const handlePositionChange = (position: CaptionPosition) => {
    updateAllCaptionSettings({ position });
  };

  const handleHighlightStyleChange = (highlightStyle: HighlightStyle) => {
    updateAllCaptionSettings({ highlightStyle });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-7 animate-fade-in">
      {/* Title & Description */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
          AI Captions & Clip Previews
        </h1>
        <p className="text-gray-400 text-sm">
          AI has generated captions for your selected clips. Review, edit, customize, or skip captions before export.
        </p>
      </div>

      {/* Main Grid: 3 Vertical 9:16 Previews + Caption Settings Panel */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Previews (8 cols) */}
        <div className="xl:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {clips.map((clip) => (
              <VerticalShortCard
                key={clip.id}
                clip={clip}
                videoSrc={videoMetadata?.localStreamUrl || (videoMetadata?.id ? `/api/video/stream?id=${videoMetadata.id}` : "/api/video/stream?id=demo")}
                isActive={activeClip?.id === clip.id}
                onSelect={() => setActiveClipId(clip.id)}
                onUpdateCaptionText={(text) => {
                  const updatedCaps = [...clip.captions];
                  if (updatedCaps[0]) updatedCaps[0].text = text;
                  updateClip(clip.id, { captions: updatedCaps });
                }}
              />
            ))}
          </div>
        </div>

        {/* Caption Settings Panel (4 cols) */}
        {settings && (
          <div className="xl:col-span-4 bg-[#121426] border border-[#232746] rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#1E2240]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Subtitles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">Caption Settings</h2>
                  <p className="text-[11px] text-gray-400">Customizes all clips in project</p>
                </div>
              </div>

              {/* Fast Skip / Enable Captions Toggle */}
              <button
                onClick={() => {
                  const nextState = !isCaptionsEnabled;
                  updateAllCaptionSettings({
                    enabled: nextState,
                    style: nextState ? "highlight" : "none",
                  });
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow ${
                  isCaptionsEnabled
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 hover:bg-purple-600/50"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                }`}
                title={isCaptionsEnabled ? "Click to skip captions" : "Click to enable captions"}
              >
                {isCaptionsEnabled ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-purple-400" />
                    <span>Captions ON</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                    <span>Skip Captions</span>
                  </>
                )}
              </button>
            </div>

            {/* If Captions are Skipped, show a helpful banner */}
            {!isCaptionsEnabled ? (
              <div className="p-4 rounded-xl bg-[#181A30] border border-dashed border-amber-500/30 text-center space-y-3">
                <EyeOff className="w-7 h-7 text-amber-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Captions Skipped</p>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Captions are disabled for this export. Your clips will render clean video without any subtitle text.
                  </p>
                </div>
                <button
                  onClick={() => updateAllCaptionSettings({ enabled: true, style: "highlight" })}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow"
                >
                  Enable AI Captions
                </button>
              </div>
            ) : (
              <>
                {/* Caption Style Options */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-300">Caption Style</label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {[
                      { id: "highlight", label: "Highlight" },
                      { id: "bold", label: "Bold" },
                      { id: "default", label: "Default" },
                      { id: "minimal", label: "Minimal" },
                      { id: "none", label: "Skip" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => handleStyleChange(s.id as CaptionStyle)}
                        className={`py-2 px-1 rounded-xl text-center border text-xs font-medium transition-all ${
                          (s.id === "none" && !isCaptionsEnabled) || (settings.style === s.id && isCaptionsEnabled)
                            ? "bg-purple-600/30 border-purple-500 text-purple-300 font-bold"
                            : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                        }`}
                      >
                        <span className="block text-sm font-extrabold mb-0.5">
                          {s.id === "none" ? "Ø" : "Aa"}
                        </span>
                        <span className="text-[10px]">{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

            {/* Font Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Font</label>
              <select
                value={settings.font}
                onChange={(e) => handleFontChange(e.target.value as CaptionFont)}
                className="w-full bg-[#181A30] border border-[#252848] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Inter">Inter Semibold</option>
                <option value="Outfit">Outfit Bold</option>
                <option value="Montserrat">Montserrat Black</option>
                <option value="Roboto">Roboto Condensed</option>
                <option value="Arial">Arial Bold</option>
              </select>
            </div>

            {/* Text Size Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-gray-300">Text Size</span>
                <span className="font-mono text-purple-400 font-semibold">{settings.fontSize} px</span>
              </div>
              <input
                type="range"
                min="32"
                max="72"
                value={settings.fontSize}
                onChange={(e) => handleSizeChange(parseInt(e.target.value))}
                className="w-full h-1.5 bg-[#1F223D] rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
            </div>

            {/* Text Color Swatches */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Text Color</label>
              <div className="flex items-center gap-2.5">
                {COLOR_SWATCHES.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-lg transition-transform ${
                      settings.textColor === color
                        ? "ring-2 ring-purple-500 scale-110 shadow-md"
                        : "opacity-80 hover:opacity-100 hover:scale-105"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Highlight Style */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Highlight Style</label>
              <select
                value={settings.highlightStyle}
                onChange={(e) => handleHighlightStyleChange(e.target.value as HighlightStyle)}
                className="w-full bg-[#181A30] border border-[#252848] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="background">Background (Rounded Box)</option>
                <option value="text">Text Color Only</option>
                <option value="glow">Neon Glow</option>
                <option value="pill">Pill Tag</option>
              </select>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-300">Position</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "top", label: "Top" },
                  { id: "center", label: "Center" },
                  { id: "bottom", label: "Bottom" },
                ].map((pos) => (
                  <button
                    key={pos.id}
                    onClick={() => handlePositionChange(pos.id as CaptionPosition)}
                    className={`py-2 rounded-xl border text-xs font-medium transition-all ${
                      settings.position === pos.id
                        ? "bg-purple-600/30 border-purple-500 text-purple-300 font-semibold"
                        : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    )}
  </div>

      {/* Bottom AI Caption Summary Banner */}
      <div className="p-4 rounded-xl bg-[#121426] border border-[#212444] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">AI Caption Summary</h3>
            <p className="text-[11px] text-gray-400">
              Captions generated using OpenAI Whisper • Language: English • Auto-synced with timestamps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified</span>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#1C1F38]">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14162B] hover:bg-[#1D203D] text-gray-300 hover:text-white border border-[#272A4E] text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={() => setStep(4)}
          className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all purple-glow hover:scale-105 active:scale-95 shadow-xl"
        >
          <span>Continue to Customize</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
