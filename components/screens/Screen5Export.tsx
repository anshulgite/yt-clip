"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Rocket,
  Film,
  Layers,
  Smartphone,
  Monitor,
  Square,
  Settings2,
  Clock,
  HardDrive,
  Cpu,
  Check,
  ChevronDown,
  ChevronUp,
  Subtitles,
  Loader2,
} from "lucide-react";
import { useClipStore } from "@/stores/clipStore";
import { formatTime } from "@/lib/utils";
import VerticalShortCard from "../video/VerticalShortCard";

export default function Screen5Export() {
  const {
    clips,
    activeClipId,
    setActiveClipId,
    exportSettings,
    updateExportSettings,
    videoMetadata,
    setStep,
    setCurrentJob,
  } = useClipStore();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0];

  const totalDuration = clips.reduce((acc, c) => acc + c.duration, 0);
  const estMbPerMin = exportSettings.videoQuality === "4k" ? 65 : exportSettings.videoQuality === "1080p" ? 25 : 12;
  const estimatedSizeMb = Math.round((totalDuration / 60) * estMbPerMin);

  const handleStartExport = async () => {
    setIsExporting(true);

    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clips,
          settings: exportSettings,
          videoUrl: videoMetadata?.videoUrl,
          localPath: videoMetadata?.localPath,
          videoId: videoMetadata?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to start export");

      if (data.jobId) {
        setCurrentJob({
          id: data.jobId,
          status: "processing",
          progress: 5,
          currentStage: "Starting FFmpeg export pipeline...",
          logs: [`Export job ${data.jobId} submitted to worker queue`],
          clips: clips.map((c) => ({
            clipId: c.id,
            label: c.label,
            title: c.title || c.label,
            duration: c.duration,
            status: "queued",
            progress: 0,
          })),
          createdAt: Date.now(),
        });
      }

      // Advance to Screen 6 Download Center
      setStep(6);
    } catch (err: any) {
      console.warn("Export error, initializing local queue demo:", err);
      setStep(6);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-7 animate-fade-in">
      {/* Title */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
          Export Your Short Videos
        </h1>
        <p className="text-gray-400 text-sm">
          Choose export settings and generate your vertical shorts (9:16) with AI captions.
        </p>
      </div>

      {/* 3-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Export Settings Form (5 cols) */}
        <div className="xl:col-span-5 bg-[#121426] border border-[#232746] rounded-2xl p-5 shadow-2xl space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1F2342]">
            <Settings2 className="w-4 h-4 text-purple-400" />
            <h2 className="text-sm font-bold text-white">Export Settings</h2>
          </div>

          {/* Export Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Export Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => updateExportSettings({ exportType: "individual" })}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  exportSettings.exportType === "individual"
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-md ring-1 ring-purple-500/40"
                    : "bg-[#17192F] border-[#252848] text-gray-400 hover:text-white"
                }`}
              >
                <Film className="w-4 h-4 mt-0.5 text-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Individual Clips</span>
                    {exportSettings.exportType === "individual" && (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Export each clip separately</p>
                </div>
              </button>

              <button
                onClick={() => updateExportSettings({ exportType: "merged" })}
                className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                  exportSettings.exportType === "merged"
                    ? "bg-purple-600/20 border-purple-500 text-white shadow-md ring-1 ring-purple-500/40"
                    : "bg-[#17192F] border-[#252848] text-gray-400 hover:text-white"
                }`}
              >
                <Layers className="w-4 h-4 mt-0.5 text-indigo-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Merged Video</span>
                    {exportSettings.exportType === "merged" && (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">Combine all clips into one</p>
                </div>
              </button>
            </div>
          </div>

          {/* Output Format */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Output Format</label>
            <select
              value={exportSettings.outputFormat}
              onChange={(e) => updateExportSettings({ outputFormat: e.target.value as any })}
              className="w-full bg-[#181A30] border border-[#252848] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="mp4">MP4 (Recommended - High Compatibility)</option>
              <option value="webm">WebM (Fast & Lightweight)</option>
              <option value="mov">MOV (Apple ProRes / QuickTime)</option>
            </select>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "9:16", label: "9:16", sub: "Vertical (Shorts)", icon: Smartphone },
                { id: "16:9", label: "16:9", sub: "YouTube", icon: Monitor },
                { id: "1:1", label: "1:1", sub: "Square", icon: Square },
              ].map((ar) => {
                const Icon = ar.icon;
                const isSel = exportSettings.aspectRatio === ar.id;
                return (
                  <button
                    key={ar.id}
                    onClick={() => updateExportSettings({ aspectRatio: ar.id as any })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSel
                        ? "bg-purple-600/25 border-purple-500 text-purple-300 ring-1 ring-purple-500/50"
                        : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1 text-purple-400" />
                    <span className="block text-xs font-bold text-white">{ar.label}</span>
                    <span className="text-[10px] text-gray-400">{ar.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Quality */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-300">Video Quality</label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: "720p", label: "720p", sub: "HD" },
                { id: "1080p", label: "1080p", sub: "Full HD" },
                { id: "4k", label: "4K", sub: "Ultra HD" },
              ].map((q) => {
                const isSel = exportSettings.videoQuality === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => updateExportSettings({ videoQuality: q.id as any })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isSel
                        ? "bg-purple-600/25 border-purple-500 text-purple-300 ring-1 ring-purple-500/50"
                        : "bg-[#181A30] border-[#252848] text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="block text-xs font-bold text-white">{q.label}</span>
                    <span className="text-[10px] text-gray-400">{q.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frame Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-300">Frame Rate</label>
            <select
              value={exportSettings.frameRate}
              onChange={(e) => updateExportSettings({ frameRate: parseInt(e.target.value) as any })}
              className="w-full bg-[#181A30] border border-[#252848] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
            >
              <option value="30">30 FPS (Recommended - Standard Shorts)</option>
              <option value="60">60 FPS (Ultra Smooth Motion)</option>
            </select>
          </div>

          {/* Hardcode Captions & Original Audio Toggles */}
          <div className="pt-2 border-t border-[#1F2342] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-200">Burn Captions (Hardcode)</span>
                <p className="text-[10px] text-gray-400">Embed stylish subtitles directly into MP4</p>
              </div>
              <input
                type="checkbox"
                checked={exportSettings.burnCaptions}
                onChange={(e) => updateExportSettings({ burnCaptions: e.target.checked })}
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-gray-200">Keep Original Audio</span>
                <p className="text-[10px] text-gray-400">Preserve high-fidelity stereo audio stream</p>
              </div>
              <input
                type="checkbox"
                checked={exportSettings.keepOriginalAudio}
                onChange={(e) => updateExportSettings({ keepOriginalAudio: e.target.checked })}
                className="w-4 h-4 rounded accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Advanced Options Collapsible */}
          <div className="pt-2 border-t border-[#1F2342]">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 hover:text-white"
            >
              <span>Advanced Options</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="pt-3 space-y-3 animate-fade-in text-xs text-gray-300">
                <div>
                  <span className="block text-[11px] text-gray-400 mb-1">Video Bitrate</span>
                  <input
                    type="text"
                    value={exportSettings.videoBitrate || "8000k"}
                    onChange={(e) => updateExportSettings({ videoBitrate: e.target.value })}
                    className="w-full bg-[#181A30] border border-[#252848] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-gray-400 mb-1">Encoding Preset</span>
                  <select
                    value={exportSettings.preset || "fast"}
                    onChange={(e) => updateExportSettings({ preset: e.target.value })}
                    className="w-full bg-[#181A30] border border-[#252848] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="ultrafast">Ultrafast</option>
                    <option value="veryfast">Very Fast</option>
                    <option value="fast">Fast (Balanced)</option>
                    <option value="medium">Medium (Higher Compression)</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Selected Clips & Estimated Output (4 cols) */}
        <div className="xl:col-span-4 space-y-5">
          {/* Selected Clips list */}
          <div className="bg-[#121426] border border-[#232746] rounded-2xl p-5 shadow-2xl space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Selected Clips ({clips.length})
            </h2>

            <div className="space-y-2.5">
              {clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => setActiveClipId(clip.id)}
                  style={{ borderColor: activeClip?.id === clip.id ? clip.color : "#232646" }}
                  className="p-2.5 rounded-xl bg-[#161830] border flex items-center justify-between cursor-pointer hover:border-purple-500/60 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ backgroundColor: clip.color }}
                      className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {clip.label.replace("Clip ", "")}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-white truncate max-w-[140px]">
                        {clip.title || clip.label}
                      </p>
                      <p className="text-[10px] font-mono text-gray-400">
                        {formatTime(clip.startTime)} – {formatTime(clip.endTime)} ({formatTime(clip.duration)})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    <Subtitles className="w-3 h-3" />
                    <span>CC</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Estimated Output Card */}
          <div className="bg-[#121426] border border-[#232746] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#1F2342]">
              <Clock className="w-4 h-4 text-purple-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">Estimated Output</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Clips</span>
                <span className="font-bold text-white">{clips.length}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Total Duration</span>
                <span className="font-mono font-bold text-purple-400">{formatTime(totalDuration)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Estimated Size ({exportSettings.videoQuality})</span>
                <span className="font-mono font-bold text-white">≈ {estimatedSizeMb} - {Math.round(estimatedSizeMb * 1.3)} MB</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-400">Processing Time</span>
                <span className="font-semibold text-emerald-400">≈ 1 – 3 min (Local FFmpeg)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live 9:16 Preview Card (3 cols) */}
        <div className="xl:col-span-3">
          <div className="sticky top-28 space-y-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Active Preview ({activeClip?.label})
            </span>
            {activeClip && (
              <VerticalShortCard
                clip={activeClip}
                videoSrc={videoMetadata?.localStreamUrl || (videoMetadata?.id ? `/api/video/stream?id=${videoMetadata.id}` : "/api/video/stream?id=demo")}
                isActive={true}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#1C1F38]">
        <button
          onClick={() => setStep(4)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14162B] hover:bg-[#1D203D] text-gray-300 hover:text-white border border-[#272A4E] text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleStartExport}
          disabled={isExporting}
          className="flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm transition-all purple-glow hover:scale-105 active:scale-95 shadow-2xl disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Starting Render...</span>
            </>
          ) : (
            <>
              <Rocket className="w-4 h-4" />
              <span>Export {clips.length} Video{clips.length > 1 ? "s" : ""}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
