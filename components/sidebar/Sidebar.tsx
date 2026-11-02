"use client";

import React from "react";
import { Scissors, Folder, LayoutGrid, DownloadCloud, Sparkles, HardDrive, CheckCircle2 } from "lucide-react";
import { useClipStore } from "@/stores/clipStore";

export default function Sidebar() {
  const { currentStep, setStep, clips, resetProject } = useClipStore();

  return (
    <aside className="w-64 bg-[#0F101D] border-r border-[#1E2138] flex flex-col justify-between p-5 min-h-screen select-none">
      {/* Brand & Nav */}
      <div className="space-y-6">
        {/* Brand Logo */}
        <div
          onClick={resetProject}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center purple-glow-sm group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-lg tracking-tight text-white">ClipShort</span>
              <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">AI</span>
            </div>
            <p className="text-[11px] text-gray-400">Personal Video Clipper</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1.5 pt-2">
          <button
            onClick={() => setStep(1)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
              currentStep >= 1
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white purple-glow shadow-md"
                : "text-gray-400 hover:text-white hover:bg-[#181A2E]"
            }`}
          >
            <Scissors className="w-4 h-4" />
            <span>Create Clip</span>
            {clips.length > 0 && (
              <span className="ml-auto text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
                {clips.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              if (clips.length > 0) setStep(2);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-[#16182C] transition-colors"
          >
            <Folder className="w-4 h-4 text-gray-400" />
            <span>Projects</span>
          </button>

          <button
            onClick={() => {
              if (clips.length > 0) setStep(4);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-[#16182C] transition-colors"
          >
            <LayoutGrid className="w-4 h-4 text-gray-400" />
            <span>Templates</span>
          </button>

          <button
            onClick={() => {
              if (clips.length > 0) setStep(6);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-[#16182C] transition-colors"
          >
            <DownloadCloud className="w-4 h-4 text-gray-400" />
            <span>Exports</span>
          </button>
        </nav>
      </div>

      {/* Local Engine & System Status (Free Personal Local Use - No SaaS paywalls) */}
      <div className="pt-4 border-t border-[#1C1F38] space-y-3">
        <div className="p-3.5 rounded-xl bg-[#141628] border border-[#232746]">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-gray-200">Local Engine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-400">
            FFmpeg • Whisper STT • 100% Free Local Processing
          </p>
          <div className="mt-2.5 pt-2 border-t border-[#1F233E] flex items-center justify-between text-[11px] text-gray-400">
            <span>Storage: Local</span>
            <span className="text-purple-300 font-medium">No Limits</span>
          </div>
        </div>

        <div className="flex items-center justify-between px-2 text-[11px] text-gray-400">
          <span>ClipShort AI v1.0</span>
          <span>Personal Edition</span>
        </div>
      </div>
    </aside>
  );
}
