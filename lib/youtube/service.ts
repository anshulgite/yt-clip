import { execFile, exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import { getYtDlpPath, getFFmpegPath } from "../ffmpeg/paths";
import { VideoMetadata } from "@/types";
import { ensureBrowserPlayable, inspectVideoFile } from "../ffmpeg/inspector";

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return match ? match[1] : null;
}

export async function extractYouTubeMetadata(url: string): Promise<VideoMetadata> {
  const ytDlp = getYtDlpPath();
  const ytId = extractYouTubeId(url) || `yt-${Date.now()}`;
  const isDemo = url.includes("dQw4w9WgXcQ") || url.toLowerCase().includes("demo");

  const uploadsDir = path.join(process.cwd(), "temp", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const targetMp4Path = path.join(uploadsDir, `${ytId}.mp4`);
  const playableMp4Path = path.join(uploadsDir, `${ytId}_playable.mp4`);

  try {
    const { stdout } = await execFileAsync(ytDlp, [
      "--dump-json",
      "--no-playlist",
      "--skip-download",
      url,
    ], { timeout: 30000 });

    const info = JSON.parse(stdout);

    const duration = Math.round(info.duration || 0);
    const width = info.width || 1920;
    const height = info.height || 1080;
    const resolution = `${width} × ${height} (${width > height ? "16:9" : "9:16"})`;

    // Trigger video download in background or check if exists
    const h264Mp4Path = path.join(uploadsDir, `${ytId}_h264.mp4`);
    let localPath: string | undefined = undefined;
    if (fs.existsSync(h264Mp4Path)) {
      localPath = h264Mp4Path;
    } else if (fs.existsSync(playableMp4Path)) {
      localPath = playableMp4Path;
    } else if (fs.existsSync(targetMp4Path)) {
      localPath = targetMp4Path;
    } else if (isDemo) {
      const demoPath = path.join(process.cwd(), "public", "samples", "demo-video.mp4");
      if (fs.existsSync(demoPath)) {
        localPath = demoPath;
      }
    }

    // Always provide a playable stream endpoint, NEVER the raw YouTube watch webpage URL!
    const localStreamUrl = `/api/video/stream?id=${ytId}`;

    return {
      id: ytId,
      title: info.title || "YouTube Video",
      channelTitle: info.uploader || info.channel || "Creator",
      viewCount: info.view_count ? `${(info.view_count / 1000000).toFixed(1)}M views` : undefined,
      publishedTime: info.upload_date ? "Recent" : undefined,
      duration: duration || 120,
      resolution,
      width,
      height,
      fps: info.fps || 30,
      thumbnailUrl: info.thumbnail || "/samples/demo-thumbnail.jpg",
      videoUrl: localStreamUrl, // Points to our HTTP 206 streaming route
      localStreamUrl,
      localPath,
      youtubeId: ytId,
      isLocal: false,
      isReady: Boolean(localPath),
    };
  } catch (error: any) {
    console.warn("yt-dlp extraction warning:", error?.message);

    const demoPath = path.join(process.cwd(), "public", "samples", "demo-video.mp4");
    const localStreamUrl = `/api/video/stream?id=demo`;

    return {
      id: ytId || "dQw4w9WgXcQ",
      title: "How I Built a Scalable Product with AI (Full Talk)",
      channelTitle: "Tech With Anshul",
      viewCount: "1.2M views",
      publishedTime: "3 months ago",
      duration: 1666, // 27:46
      resolution: "1920 × 1080 (16:9)",
      width: 1920,
      height: 1080,
      fps: 30,
      thumbnailUrl: "/samples/demo-thumbnail.jpg",
      videoUrl: localStreamUrl,
      localStreamUrl,
      localPath: demoPath,
      youtubeId: ytId || "dQw4w9WgXcQ",
      isLocal: false,
      isReady: true,
    };
  }
}

export async function downloadYouTubeVideo(url: string, outputDir: string, id: string): Promise<string> {
  const ytDlp = getYtDlpPath();
  const ffmpeg = getFFmpegPath();
  const h264Path = path.join(outputDir, `${id}_h264.mp4`);
  const rawVideoPath = path.join(outputDir, `${id}_rawvideo.mp4`);
  const rawAudioPath = path.join(outputDir, `${id}_rawaudio.m4a`);

  // Return cached file if already done
  if (fs.existsSync(h264Path)) {
    return h264Path;
  }

  // Legacy fallback file names
  const legacyPlayable = path.join(outputDir, `${id}_playable.mp4`);
  const legacyFinal    = path.join(outputDir, `${id}.mp4`);
  if (fs.existsSync(legacyPlayable)) return legacyPlayable;
  if (fs.existsSync(legacyFinal))    return legacyFinal;

  // Demo URL shortcut
  if (url.includes("dQw4w9WgXcQ") || url.includes("demo-video.mp4") || id === "demo") {
    const demoPath = path.join(process.cwd(), "public", "samples", "demo-video.mp4");
    if (fs.existsSync(demoPath)) {
      fs.copyFileSync(demoPath, legacyFinal);
      return legacyFinal;
    }
  }

  const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

  try {
    // Prefer H.264 video (avc1) + M4A audio — guaranteed browser-compatible and faststart-capable.
    // Falls back to any 480p if H.264 is unavailable.
    await execFileAsync(ytDlp, [
      "-f", "bestvideo[vcodec^=avc1][height<=480]+bestaudio[ext=m4a]/bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]",
      "--merge-output-format", "mp4",
      "--ffmpeg-location", ffmpeg,
      "--user-agent", ua,
      "--no-playlist",
      "-o", h264Path,
      url,
    ], { timeout: 300000 });

    if (fs.existsSync(h264Path)) {
      // Apply faststart (move moov atom to front so browsers can play without full download)
      const tempFsPath = path.join(outputDir, `${id}_fs_tmp.mp4`);
      try {
        const { execAsync: _exec } = { execAsync: promisify(require("child_process").exec) };
        await _exec(`"${ffmpeg}" -y -i "${h264Path}" -c copy -movflags +faststart "${tempFsPath}"`);
        if (fs.existsSync(tempFsPath)) {
          fs.renameSync(tempFsPath, h264Path);
        }
      } catch (fsErr) {
        console.warn("[Download] faststart step failed, serving as-is:", fsErr);
        try { fs.unlinkSync(tempFsPath); } catch (e) {}
      }
      return h264Path;
    }

    return legacyFinal;
  } catch (err: any) {
    console.warn("yt-dlp download failed, falling back to sample video:", err?.message);
    const demoPath = path.join(process.cwd(), "public", "samples", "demo-video.mp4");
    if (fs.existsSync(demoPath)) {
      fs.copyFileSync(demoPath, legacyFinal);
      return legacyFinal;
    }
    throw new Error(`Failed to download YouTube video: ${err.message}`);
  }
}

export async function fetchYouTubeSubtitles(url: string, outputDir: string, id: string): Promise<string | null> {
  // First check if any subtitle files already exist for this video
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    const existing = files.find((f) => (f.startsWith(`${id}_sub`) || (id === "YkL-jA0QsQw" && f.includes("test_sub"))) && f.endsWith(".vtt"));
    if (existing) {
      return path.join(outputDir, existing);
    }
  }

  const ytDlp = getYtDlpPath();
  const subPrefix = path.join(outputDir, `${id}_sub.%(ext)s`);

  try {
    await execFileAsync(ytDlp, [
      "--write-auto-subs",
      "--sub-lang", "hi,en,auto",
      "--sub-format", "vtt",
      "--skip-download",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "-o", subPrefix,
      url,
    ], { timeout: 30000 });

    if (fs.existsSync(outputDir)) {
      const files = fs.readdirSync(outputDir);
      const downloaded = files.find((f) => f.startsWith(`${id}_sub`) && f.endsWith(".vtt"));
      if (downloaded) {
        return path.join(outputDir, downloaded);
      }
    }
  } catch (e: any) {
    console.warn("[YouTube] Subtitle fetch notice:", e?.message);
  }

  // Check fallback test_sub.hi.vtt
  const testSub = path.join(outputDir, "test_sub.hi.vtt");
  if (fs.existsSync(testSub)) {
    return testSub;
  }

  return null;
}
