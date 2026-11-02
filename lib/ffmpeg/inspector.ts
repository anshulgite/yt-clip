import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { getFFprobePath, getFFmpegPath } from "./paths";

const execAsync = promisify(exec);

export interface VideoInspection {
  isValid: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  videoCodec?: string;
  audioCodec?: string;
  width?: number;
  height?: number;
  fps?: number;
  duration?: number;
  pixelFormat?: string;
  isBrowserCompatible: boolean;
}

export async function inspectVideoFile(filePath: string): Promise<VideoInspection> {
  if (!fs.existsSync(filePath)) {
    return { isValid: false, hasVideo: false, hasAudio: false, isBrowserCompatible: false };
  }

  const ffprobe = getFFprobePath();

  try {
    const cmd = `"${ffprobe}" -v error -show_entries stream=codec_name,codec_type,pix_fmt,width,height,r_frame_rate,duration -of json "${filePath}"`;
    const { stdout } = await execAsync(cmd);
    const data = JSON.parse(stdout);
    const streams = data.streams || [];

    const videoStream = streams.find((s: any) => s.codec_type === "video");
    const audioStream = streams.find((s: any) => s.codec_type === "audio");

    let fps = 30;
    if (videoStream?.r_frame_rate) {
      const parts = videoStream.r_frame_rate.split("/");
      if (parts.length === 2 && parseInt(parts[1]) > 0) {
        fps = Math.round(parseInt(parts[0]) / parseInt(parts[1]));
      }
    }

    const videoCodec = videoStream?.codec_name?.toLowerCase();
    const audioCodec = audioStream?.codec_name?.toLowerCase();
    const pixelFormat = videoStream?.pix_fmt?.toLowerCase();
    const duration = parseFloat(videoStream?.duration || audioStream?.duration || "0");

    const isBrowserCompatible =
      Boolean(videoStream) &&
      (videoCodec === "h264" || videoCodec === "vp8" || videoCodec === "vp9" || videoCodec === "av1") &&
      (pixelFormat === "yuv420p" || !pixelFormat || pixelFormat.includes("420"));

    return {
      isValid: Boolean(videoStream),
      hasVideo: Boolean(videoStream),
      hasAudio: Boolean(audioStream),
      videoCodec,
      audioCodec,
      width: videoStream?.width,
      height: videoStream?.height,
      fps,
      duration,
      pixelFormat,
      isBrowserCompatible,
    };
  } catch (err) {
    console.warn("ffprobe inspection error:", err);
    return { isValid: false, hasVideo: false, hasAudio: false, isBrowserCompatible: false };
  }
}

export async function ensureBrowserPlayable(inputPath: string, outputPath: string): Promise<string> {
  const ffmpeg = getFFmpegPath();
  const inspection = await inspectVideoFile(inputPath);

  // If already compatible, just faststart remux
  if (inspection.isBrowserCompatible && inspection.videoCodec === "h264" && inspection.audioCodec === "aac") {
    try {
      const remuxCmd = `"${ffmpeg}" -y -i "${inputPath}" -c copy -movflags +faststart "${outputPath}"`;
      await execAsync(remuxCmd);
      return outputPath;
    } catch (e) {
      console.warn("Remux failed, falling back to full transcode:", e);
    }
  }

  // Full transcode to standard H.264 + AAC + yuv420p + faststart
  const transcodeCmd = `"${ffmpeg}" -y -i "${inputPath}" -c:v libx264 -preset veryfast -pix_fmt yuv420p -profile:v high -level 4.0 -c:a aac -b:a 192k -movflags +faststart "${outputPath}"`;
  await execAsync(transcodeCmd);
  return outputPath;
}
