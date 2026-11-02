"use client";

import React, { useState } from "react";
import {
  Plus,
  Scissors,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize,
  ArrowLeft,
  ArrowRight,
  Clock,
  Sparkles,
  Edit2,
  Check,
  Play,
  Pause,
} from "lucide-react";
import { useClipStore } from "@/stores/clipStore";
import { formatTime } from "@/lib/utils";
import VideoPlayer from "../video/VideoPlayer";
import WaveformTimeline from "../timeline/WaveformTimeline";

export default function Screen2Timeline() {
  const {
    videoMetadata,
    clips,
    activeClipId,
    setActiveClipId,
    addClip,
    removeClip,
    splitClip,
    updateClip,
    zoomLevel,
    setZoomLevel,
    setStep,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    setIsTranscribing,
  } = useClipStore();

  const [editingClipId, setEditingClipId] = useState<string | null>(null);
  const [editedTitle, setEditedTitle] = useState("");
  const [isPreviewingAll, setIsPreviewingAll] = useState(false);

  const activeClip = clips.find((c) => c.id === activeClipId) || clips[0];

  // Sequential Multiple Clip Preview Engine
  React.useEffect(() => {
    if (!isPreviewingAll || !isPlaying || clips.length === 0) return;

    const currentIdx = clips.findIndex((c) => c.id === activeClipId);
    const active = currentIdx !== -1 ? clips[currentIdx] : clips[0];

    if (active && currentTime >= active.endTime) {
      const nextIdx = currentIdx + 1;
      if (nextIdx < clips.length) {
        const nextClip = clips[nextIdx];
        setActiveClipId(nextClip.id);
        setCurrentTime(nextClip.startTime);
      } else {
        // Reached end of all clips
        setIsPlaying(false);
        setIsPreviewingAll(false);
        setCurrentTime(clips[0].startTime);
        setActiveClipId(clips[0].id);
      }
    }
  }, [currentTime, isPreviewingAll, isPlaying, clips, activeClipId, setActiveClipId, setCurrentTime, setIsPlaying]);

  const handleAddClip = () => {
    const lastClip = clips[clips.length - 1];
    const newStart = lastClip ? Math.min(lastClip.endTime + 10, (videoMetadata?.duration || 180) - 40) : 0;
    addClip(newStart, newStart + 45);
  };

  const handleSplit = () => {
    if (!activeClip) return;
    splitClip(activeClip.id, currentTime);
  };

  const handleDelete = () => {
    if (!activeClip) return;
    removeClip(activeClip.id);
  };

  const handlePreviewSingleClip = (clip: typeof clips[0]) => {
    setIsPreviewingAll(false);
    setActiveClipId(clip.id);
    setCurrentTime(clip.startTime);
    setIsPlaying(true);
  };

  const handlePreviewAllClips = () => {
    if (clips.length === 0) return;
    if (isPreviewingAll && isPlaying) {
      setIsPlaying(false);
      setIsPreviewingAll(false);
    } else {
      setIsPreviewingAll(true);
      setActiveClipId(clips[0].id);
      setCurrentTime(clips[0].startTime);
      setIsPlaying(true);
    }
  };

  const handleContinueToCaptions = async () => {
    setIsTranscribing(true);
    setStep(3);

    // Trigger caption generation for clips in parallel or sequential
    for (const clip of clips) {
      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId: videoMetadata?.id || videoMetadata?.youtubeId,
            videoTitle: videoMetadata?.title,
            channelTitle: videoMetadata?.channelTitle,
            videoUrl: videoMetadata?.videoUrl,
            localPath: videoMetadata?.localPath,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.duration,
            clipLabel: clip.label,
          }),
        });
        const data = await res.json();
        if (data.captions && data.captions.length > 0) {
          updateClip(clip.id, { captions: data.captions });
        }
      } catch (e) {
        console.warn("Caption generation warning for clip:", clip.id, e);
      }
    }
    setIsTranscribing(false);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-7 animate-fade-in">
      {/* Title & Description */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">
          Select Video Segments
        </h1>
        <p className="text-gray-400 text-sm">
          Drag on the timeline to create multiple clips (A, B, C). Adjust start and end times for each clip.
        </p>
      </div>

      {/* Top Row: Video Player + Video Info Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Synchronized Player (7 cols) */}
        <div className="lg:col-span-7">
          <VideoPlayer />
        </div>

        {/* Video Info Card (5 cols) */}
        <div className="lg:col-span-5 bg-[#121426] border border-[#232746] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Video Info</span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#1B1E38] text-[11px] font-medium text-purple-300 border border-purple-500/20">
              Source: YouTube
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-24 h-16 rounded-xl overflow-hidden bg-[#0A0C16] border border-[#242848] shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={videoMetadata?.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
                alt={videoMetadata?.title || "Video"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white line-clamp-2">
                {videoMetadata?.title || "How I Built a Scalable Product with AI (Full Talk)"}
              </h2>
              <p className="text-xs text-gray-400 mt-1 font-mono">
                {formatTime(videoMetadata?.duration || 1666)} • {videoMetadata?.resolution || "1920 × 1080 (16:9)"}
                {videoMetadata?.viewCount ? ` • ${videoMetadata.viewCount}` : ""}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="pt-2 border-t border-[#1F2342] grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-[#16182E]">
              <p className="text-gray-400 text-[10px]">Clips</p>
              <p className="text-white font-bold mt-0.5">{clips.length}</p>
            </div>
            <div className="p-2 rounded-xl bg-[#16182E]">
              <p className="text-gray-400 text-[10px]">Selected Time</p>
              <p className="text-purple-400 font-bold mt-0.5">
                {formatTime(clips.reduce((acc, c) => acc + c.duration, 0))}
              </p>
            </div>
            <div className="p-2 rounded-xl bg-[#16182E]">
              <p className="text-gray-400 text-[10px]">Active</p>
              <p className="text-indigo-400 font-bold mt-0.5">{activeClip?.label || "None"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        {/* Left Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleAddClip}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all purple-glow-sm shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clip</span>
          </button>

          <button
            onClick={handleSplit}
            disabled={!activeClip}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#17192F] hover:bg-[#202342] text-gray-300 hover:text-white border border-[#272B4D] font-medium text-xs transition-all active:scale-95 disabled:opacity-40"
          >
            <Scissors className="w-3.5 h-3.5 text-indigo-400" />
            <span>Split</span>
          </button>

          <button
            onClick={handleDelete}
            disabled={!activeClip || clips.length <= 1}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#17192F] hover:bg-red-500/20 text-gray-300 hover:text-red-400 border border-[#272B4D] hover:border-red-500/40 font-medium text-xs transition-all active:scale-95 disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Delete</span>
          </button>
        </div>

        {/* Right Zoom Controls */}
        <div className="flex items-center gap-3 bg-[#131528] px-3 py-1.5 rounded-xl border border-[#242848]">
          <button
            onClick={() => setZoomLevel(zoomLevel - 0.25)}
            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-24 h-1 bg-[#262A4E] rounded appearance-none cursor-pointer accent-purple-500"
          />

          <button
            onClick={() => setZoomLevel(zoomLevel + 0.25)}
            className="p-1 rounded text-gray-400 hover:text-white transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel(1)}
            className="flex items-center gap-1 text-[11px] font-semibold text-gray-300 hover:text-white px-2 py-0.5 rounded bg-[#1C1F3A] transition-colors ml-1"
          >
            <Maximize className="w-3 h-3" />
            <span>Fit</span>
          </button>
        </div>
      </div>

      {/* Audio Waveform with Selection Boxes */}
      <WaveformTimeline />

      {/* Selected Clips (N) List with Multi-Clip Preview Engine */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-bold text-white tracking-wide">
              Selected Clips ({clips.length})
            </h2>
            <button
              onClick={handlePreviewAllClips}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all shadow ${
                isPreviewingAll && isPlaying
                  ? "bg-purple-600 text-white shadow-purple-600/30 ring-2 ring-purple-400"
                  : "bg-[#1E2240] hover:bg-[#2A2F57] text-purple-300 border border-purple-500/30"
              }`}
            >
              {isPreviewingAll && isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-white" />
                  <span>Pause Sequence Preview</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-purple-300" />
                  <span>Preview All Clips ({clips.length})</span>
                </>
              )}
            </button>
          </div>
          <span className="text-xs text-gray-400">
            Click any clip card to watch preview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {clips.map((clip) => {
            const isSelected = activeClipId === clip.id;
            const isEditing = editingClipId === clip.id;
            const isClipPlaying = isSelected && isPlaying;

            return (
              <div
                key={clip.id}
                onClick={() => handlePreviewSingleClip(clip)}
                style={{
                  borderColor: isSelected ? clip.color : "#232646",
                }}
                className={`p-3.5 rounded-2xl bg-[#131528] border-2 transition-all cursor-pointer flex items-center gap-3.5 shadow-lg group ${
                  isSelected ? "ring-2 ring-purple-500/20 bg-[#161830]" : "hover:border-[#353966]"
                }`}
              >
                {/* Mini Thumbnail with Play Overlay */}
                <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-black shrink-0 border border-white/10 group/thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={videoMetadata?.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
                    alt={clip.label}
                    className="w-full h-full object-cover"
                  />
                  {/* Play Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                    isClipPlaying ? "opacity-100" : "opacity-0 group-hover/thumb:opacity-100"
                  }`}>
                    <div className="w-6 h-6 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow">
                      {isClipPlaying ? (
                        <Pause className="w-3 h-3 fill-white" />
                      ) : (
                        <Play className="w-3 h-3 fill-white ml-0.5" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[9px] font-mono font-semibold text-white">
                    {formatTime(clip.duration)}
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        style={{ backgroundColor: clip.color }}
                        className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                      >
                        {clip.label.replace("Clip ", "")}
                      </span>
                      {isEditing ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editedTitle}
                            onChange={(e) => setEditedTitle(e.target.value)}
                            className="bg-[#1C1F3A] text-white text-xs px-1.5 py-0.5 rounded border border-purple-500 w-24 focus:outline-none"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              updateClip(clip.id, { title: editedTitle });
                              setEditingClipId(null);
                            }}
                            className="p-1 rounded text-green-400 hover:bg-green-500/20"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-white truncate max-w-[120px]">
                          {clip.title || clip.label}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClipId(clip.id);
                          setEditedTitle(clip.title || clip.label);
                        }}
                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Edit title"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>

                      {clips.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeClip(clip.id);
                          }}
                          className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete clip"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Timestamps */}
                  <div className="space-y-0.5 text-[11px] font-mono text-gray-400">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{formatTime(clip.startTime)} – {formatTime(clip.endTime)}</span>
                    </p>
                    <p className="text-purple-300 font-semibold">
                      Duration: {formatTime(clip.duration)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#1C1F38]">
        <button
          onClick={() => setStep(1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#14162B] hover:bg-[#1D203D] text-gray-300 hover:text-white border border-[#272A4E] text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          onClick={handleContinueToCaptions}
          className="flex items-center gap-2.5 px-7 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all purple-glow hover:scale-105 active:scale-95 shadow-xl"
        >
          <span>Generate AI Captions</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
