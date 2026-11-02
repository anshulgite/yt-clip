import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { generateWaveformData, extractAudioFromVideo } from "@/lib/ffmpeg/processor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { localPath, videoUrl } = body;

    const inputVideo = localPath || path.join(process.cwd(), "public", "samples", "demo-video.mp4");

    if (fs.existsSync(inputVideo)) {
      const audioDir = path.join(process.cwd(), "temp", "audio");
      if (!fs.existsSync(audioDir)) fs.mkdirSync(audioDir, { recursive: true });

      const tempAudio = path.join(audioDir, `wave_${Date.now()}.wav`);
      try {
        await extractAudioFromVideo(inputVideo, tempAudio);
        const peaks = await generateWaveformData(tempAudio);
        if (fs.existsSync(tempAudio)) fs.unlinkSync(tempAudio);
        return NextResponse.json({ success: true, peaks });
      } catch (e) {
        console.warn("Waveform extraction failed:", e);
      }
    }

    // Fallback waveform points
    const fallbackPeaks = await generateWaveformData("");
    return NextResponse.json({ success: true, peaks: fallbackPeaks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
