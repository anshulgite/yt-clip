"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useClipStore } from "@/stores/clipStore";
import { formatTime } from "@/lib/utils";
import { Clip } from "@/types";

export default function WaveformTimeline() {
  const {
    videoMetadata,
    clips,
    activeClipId,
    setActiveClipId,
    updateClip,
    currentTime,
    setCurrentTime,
    zoomLevel,
  } = useClipStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>([]);
  const [dragState, setDragState] = useState<{
    clipId: string;
    type: "move" | "start" | "end";
    startX: number;
    initialStartTime: number;
    initialEndTime: number;
  } | null>(null);

  const totalDuration = videoMetadata?.duration || 1666; // default 27:46

  // Fetch or generate waveform
  useEffect(() => {
    async function loadWaveform() {
      try {
        const res = await fetch("/api/waveform", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            localPath: videoMetadata?.localPath,
            videoUrl: videoMetadata?.videoUrl,
          }),
        });
        const data = await res.json();
        if (data.peaks && Array.isArray(data.peaks)) {
          setWaveformPeaks(data.peaks);
        }
      } catch (e) {
        console.warn("Waveform fetch failed:", e);
      }
    }
    loadWaveform();
  }, [videoMetadata]);

  // Generate simulated peaks if not yet loaded
  const peaks = waveformPeaks.length > 0 ? waveformPeaks : Array.from({ length: 180 }, (_, i) => {
    return Math.abs(Math.sin(i * 0.12) * 0.6 + Math.cos(i * 0.28) * 0.3 + 0.15);
  });

  // Convert seconds to percentage
  const timeToPercent = useCallback(
    (time: number) => {
      return Math.max(0, Math.min(100, (time / totalDuration) * 100));
    },
    [totalDuration]
  );

  // Convert pixel click on container to seconds
  const pixelToTime = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      return Math.round(pct * totalDuration);
    },
    [totalDuration]
  );

  // Handle Dragging
  const handleMouseDown = (
    e: React.MouseEvent,
    clip: Clip,
    type: "move" | "start" | "end"
  ) => {
    e.stopPropagation();
    setActiveClipId(clip.id);
    setDragState({
      clipId: clip.id,
      type,
      startX: e.clientX,
      initialStartTime: clip.startTime,
      initialEndTime: clip.endTime,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - dragState.startX;
      const deltaTime = (deltaX / rect.width) * totalDuration;

      const clip = clips.find((c) => c.id === dragState.clipId);
      if (!clip) return;

      if (dragState.type === "move") {
        const duration = dragState.initialEndTime - dragState.initialStartTime;
        let newStart = Math.max(0, dragState.initialStartTime + deltaTime);
        let newEnd = newStart + duration;
        if (newEnd > totalDuration) {
          newEnd = totalDuration;
          newStart = totalDuration - duration;
        }
        updateClip(clip.id, {
          startTime: Math.round(newStart),
          endTime: Math.round(newEnd),
        });
      } else if (dragState.type === "start") {
        let newStart = Math.max(0, dragState.initialStartTime + deltaTime);
        if (newStart > clip.endTime - 2) newStart = clip.endTime - 2;
        updateClip(clip.id, { startTime: Math.round(newStart) });
      } else if (dragState.type === "end") {
        let newEnd = Math.min(totalDuration, dragState.initialEndTime + deltaTime);
        if (newEnd < clip.startTime + 2) newEnd = clip.startTime + 2;
        updateClip(clip.id, { endTime: Math.round(newEnd) });
      }
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, clips, totalDuration, updateClip]);

  // Click on timeline to seek
  const handleTimelineClick = (e: React.MouseEvent) => {
    const clickedTime = pixelToTime(e.clientX);
    setCurrentTime(clickedTime);
  };

  // Generate 8 timestamp markers
  const markerCount = 8;
  const timeMarkers = Array.from({ length: markerCount }, (_, i) => {
    const sec = Math.round((i / (markerCount - 1)) * totalDuration);
    return { sec, label: formatTime(sec) };
  });

  return (
    <div className="space-y-2 select-none">
      {/* Waveform Canvas Container */}
      <div
        ref={containerRef}
        onClick={handleTimelineClick}
        style={{ transform: `scaleX(${zoomLevel})`, transformOrigin: "left" }}
        className="relative h-28 w-full bg-[#111222] border border-[#232646] rounded-2xl overflow-hidden cursor-pointer transition-transform duration-150"
      >
        {/* Background audio bars */}
        <div className="absolute inset-0 flex items-center justify-between px-3 gap-[2px] opacity-75">
          {peaks.map((val, idx) => (
            <div
              key={idx}
              style={{ height: `${Math.max(12, val * 85)}%` }}
              className="w-full bg-[#5B46B5] hover:bg-purple-400 rounded-full transition-all"
            />
          ))}
        </div>

        {/* Selected Clip Regions */}
        {clips.map((clip) => {
          const leftPct = timeToPercent(clip.startTime);
          const rightPct = timeToPercent(clip.endTime);
          const widthPct = Math.max(1, rightPct - leftPct);
          const isSelected = activeClipId === clip.id;

          return (
            <div
              key={clip.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveClipId(clip.id);
                setCurrentTime(clip.startTime);
              }}
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                borderColor: clip.color,
                backgroundColor: `${clip.color}33`, // 20% opacity
              }}
              className={`absolute top-0 bottom-0 border-2 rounded-xl flex items-center justify-between z-10 transition-colors shadow-lg ${
                isSelected ? "ring-2 ring-white/40" : "opacity-90 hover:opacity-100"
              }`}
            >
              {/* Left Handle */}
              <div
                onMouseDown={(e) => handleMouseDown(e, clip, "start")}
                className="w-3.5 h-12 bg-white rounded-r-md cursor-ew-resize flex items-center justify-center shadow-md -ml-1 hover:scale-110 transition-transform"
                title="Drag to trim start"
              >
                <div className="w-0.5 h-4 bg-gray-600 rounded-full" />
              </div>

              {/* Center Drag Area & Badge */}
              <div
                onMouseDown={(e) => handleMouseDown(e, clip, "move")}
                className="flex-1 h-full flex flex-col items-center justify-start pt-1.5 cursor-grab active:cursor-grabbing"
              >
                {/* Badge with letter */}
                <div
                  style={{ backgroundColor: clip.color }}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                >
                  {clip.label.replace("Clip ", "")}
                </div>
              </div>

              {/* Right Handle */}
              <div
                onMouseDown={(e) => handleMouseDown(e, clip, "end")}
                className="w-3.5 h-12 bg-white rounded-l-md cursor-ew-resize flex items-center justify-center shadow-md -mr-1 hover:scale-110 transition-transform"
                title="Drag to trim end"
              >
                <div className="w-0.5 h-4 bg-gray-600 rounded-full" />
              </div>
            </div>
          );
        })}

        {/* Current playback head */}
        <div
          style={{ left: `${timeToPercent(currentTime)}%` }}
          className="absolute top-0 bottom-0 w-0.5 bg-white z-20 pointer-events-none transition-all shadow-[0_0_8px_white]"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white -ml-1 -mt-0.5 shadow-md" />
        </div>
      </div>

      {/* Timestamp labels ruler */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono px-1">
        {timeMarkers.map((marker, i) => (
          <span key={i}>{marker.label}</span>
        ))}
      </div>
    </div>
  );
}
