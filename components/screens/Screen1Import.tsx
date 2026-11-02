"use client";

import React, { useState } from "react";
import {
  Link2,
  Sparkles,
  Play,
  Clock,
  Monitor,
  Volume2,
  Scissors,
  Subtitles,
  Smartphone,
  ArrowRight,
  Upload,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { useClipStore } from "@/stores/clipStore";
import { formatTime } from "@/lib/utils";

export default function Screen1Import() {
  const {
    videoMetadata,
    setVideoMetadata,
    setStep,
    loadDemoProject,
    isAnalyzing,
    setIsAnalyzing,
  } = useClipStore();

  const [inputUrl, setInputUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAnalyze = async () => {
    if (!inputUrl.trim()) {
      setErrorMsg("Please enter a valid YouTube video link.");
      return;
    }

    setErrorMsg(null);
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: inputUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to analyze video");
      }

      setVideoMetadata(data.metadata);
    } catch (err: any) {
      console.warn("Analysis fallback to demo:", err?.message);
      // If offline or rate limited, gracefully provide the demo project
      loadDemoProject();
      setStep(1); // stay on screen 1 to show the card preview
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setVideoMetadata(data.metadata);
      setInputUrl(file.name);
    } catch (err: any) {
      setErrorMsg(err.message || "File upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-9 animate-fade-in">
      {/* Title & Description */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          Import YouTube Video
        </h1>
        <p className="text-gray-400 text-base">
          Paste a YouTube link to extract, clip and create short-form vertical videos with AI.
        </p>
      </div>

      {/* Input Bar */}
      <div className="space-y-3">
        <div className="relative flex items-center bg-[#131528] rounded-2xl border border-[#272A4E] shadow-2xl focus-within:border-purple-500/80 transition-all p-1.5">
          <div className="pl-4 pr-2 text-gray-400">
            <Link2 className="w-5 h-5 text-gray-400" />
          </div>

          <input
            type="text"
            value={inputUrl}
            onChange={(e) => {
              setInputUrl(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Paste YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
            className="w-full bg-transparent border-0 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-0 py-3"
          />

          {inputUrl && (
            <button
              onClick={() => setInputUrl("")}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-[#1D203D] mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || isUploading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all purple-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Video...</span>
              </>
            ) : (
              <>
                <span>Analyze Video</span>
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Quick Actions / Local upload */}
        <div className="flex items-center justify-between text-xs text-gray-400 px-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-purple-400 hover:text-purple-300 cursor-pointer font-medium transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>{isUploading ? "Uploading file..." : "Or upload local video file"}</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>

          <button
            onClick={() => {
              loadDemoProject();
              setStep(1);
            }}
            className="text-gray-400 hover:text-white underline underline-offset-4 decoration-purple-500/50 hover:decoration-purple-500 transition-colors"
          >
            Load sample demo video
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Video Preview Card (Shown once analyzed or selected) */}
      {videoMetadata && (
        <div className="p-5 rounded-2xl bg-[#131528] border border-[#272B4F] shadow-xl flex flex-col md:flex-row items-start md:items-center gap-6 animate-fade-in">
          {/* Thumbnail with overlay duration & play */}
          <div className="relative w-full md:w-72 h-44 rounded-xl overflow-hidden bg-[#0A0C16] border border-[#242848] shrink-0 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={videoMetadata.thumbnailUrl || "/samples/demo-thumbnail.jpg"}
              alt={videoMetadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity">
              <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white">
                <Play className="w-5 h-5 fill-white ml-0.5" />
              </div>
            </div>
            <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-[11px] font-semibold text-white">
              {formatTime(videoMetadata.duration)}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 space-y-3.5">
            <div>
              <h2 className="text-lg font-bold text-white line-clamp-2">
                {videoMetadata.title}
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                {videoMetadata.channelTitle}
                {videoMetadata.viewCount && ` • ${videoMetadata.viewCount}`}
                {videoMetadata.publishedTime && ` • ${videoMetadata.publishedTime}`}
              </p>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D203D] border border-[#2B2F57] text-xs text-gray-300">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                <span>{formatTime(videoMetadata.duration)}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D203D] border border-[#2B2F57] text-xs text-gray-300">
                <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                <span>{videoMetadata.resolution}</span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D203D] border border-[#2B2F57] text-xs text-gray-300">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Audio + Video</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Highlight Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#121426] border border-[#212444] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
            <Scissors className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Smart Clipping</h3>
            <p className="text-xs text-gray-400">Find best moments automatically</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121426] border border-[#212444] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
            <Subtitles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">AI Captions</h3>
            <p className="text-xs text-gray-400">Auto-generate accurate subtitles</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#121426] border border-[#212444] flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Vertical Shorts (9:16)</h3>
            <p className="text-xs text-gray-400">Convert and export ready-to-publish</p>
          </div>
        </div>
      </div>

      {/* Next Step Button */}
      {videoMetadata && (
        <div className="flex justify-end pt-4">
          <button
            onClick={() => setStep(2)}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all purple-glow hover:scale-105"
          >
            <span>Continue to Timeline</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
