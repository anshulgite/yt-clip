import path from "path";
import fs from "fs";

export function getFFmpegPath(): string {
  const isWin = process.platform === "win32";
  const localBin = path.join(process.cwd(), "bin", isWin ? "ffmpeg.exe" : "ffmpeg");
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  const nmBin = path.join(process.cwd(), "node_modules", "@ffmpeg-installer", "win32-x64", "ffmpeg.exe");
  if (fs.existsSync(nmBin)) {
    return nmBin;
  }

  return "ffmpeg";
}

export function getFFprobePath(): string {
  const isWin = process.platform === "win32";
  const localBin = path.join(process.cwd(), "bin", isWin ? "ffprobe.exe" : "ffprobe");
  if (fs.existsSync(localBin)) {
    return localBin;
  }

  const nmBin = path.join(process.cwd(), "node_modules", "@ffprobe-installer", "win32-x64", "ffprobe.exe");
  if (fs.existsSync(nmBin)) {
    return nmBin;
  }

  return "ffprobe";
}

export function getYtDlpPath(): string {
  const isWin = process.platform === "win32";
  const localBin = path.join(process.cwd(), "bin", isWin ? "yt-dlp.exe" : "yt-dlp");
  if (fs.existsSync(localBin)) {
    return localBin;
  }
  return "yt-dlp";
}
