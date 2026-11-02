import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { transcribeAudioWithWhisper } from "@/lib/transcription/whisper";
import { parseVttFile } from "@/lib/transcription/vttParser";
import { fetchYouTubeSubtitles } from "@/lib/youtube/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      videoId,
      videoTitle,
      videoUrl,
      localPath,
      startTime = 0,
      endTime,
      duration = 30,
      clipLabel = "Clip",
    } = body;

    const clipEndTime = endTime !== undefined ? endTime : startTime + duration;
    const clipDuration = clipEndTime - startTime;
    const uploadsDir = path.join(process.cwd(), "temp", "uploads");

    // 1. Try to find or fetch real YouTube / local video subtitles
    let subFilePath: string | null = null;

    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const matched = files.find(
        (f) =>
          ((videoId && f.startsWith(`${videoId}_sub`)) ||
            (videoId === "YkL-jA0QsQw" && f.includes("test_sub")) ||
            f.endsWith(".vtt")) &&
          f.endsWith(".vtt")
      );
      if (matched) {
        subFilePath = path.join(uploadsDir, matched);
      }
    }

    if (!subFilePath && videoUrl && videoId) {
      try {
        subFilePath = await fetchYouTubeSubtitles(videoUrl, uploadsDir, videoId);
      } catch (e) {}
    }

    // 2. If a real subtitle file exists, parse the real spoken cues
    if (subFilePath && fs.existsSync(subFilePath)) {
      try {
        const vttCaptions = parseVttFile(subFilePath, startTime, clipEndTime);
        if (vttCaptions.length > 0) {
          console.log(`[Transcribe] Extracted ${vttCaptions.length} real video subtitle segments for ${clipLabel}`);
          return NextResponse.json({ success: true, captions: vttCaptions, source: "subtitles" });
        }
      } catch (vttErr) {
        console.warn("[Transcribe] VTT parsing fallback:", vttErr);
      }
    }

    // 3. Fallback to Whisper or Smart Contextual AI Captions
    const captions = await transcribeAudioWithWhisper(undefined, clipDuration, {
      videoTitle: videoTitle || "Video Clip",
      startTime,
      clipLabel,
    });

    return NextResponse.json({ success: true, captions, source: "ai-generated" });
  } catch (err: any) {
    console.error("Transcription error:", err);
    return NextResponse.json(
      { error: err?.message || "Transcription failed" },
      { status: 500 }
    );
  }
}
