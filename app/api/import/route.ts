import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { extractYouTubeMetadata, downloadYouTubeVideo } from "@/lib/youtube/service";
import { getFFprobePath, getFFmpegPath } from "@/lib/ffmpeg/paths";
import { ensureBrowserPlayable, inspectVideoFile } from "@/lib/ffmpeg/inspector";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const uploadsDir = path.join(process.cwd(), "temp", "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileExt = path.extname(file.name) || ".mp4";
      const fileId = `upload-${Date.now()}`;
      const rawFilePath = path.join(uploadsDir, `${fileId}_raw${fileExt}`);
      const playableFilePath = path.join(uploadsDir, `${fileId}_playable.mp4`);

      const buffer = Buffer.from(await file.arrayBuffer());
      fs.writeFileSync(rawFilePath, buffer);

      // Convert to standard browser playable H.264 / AAC / faststart
      await ensureBrowserPlayable(rawFilePath, playableFilePath);
      try {
        fs.unlinkSync(rawFilePath);
      } catch (e) {}

      // Probe video using ffprobe
      const inspection = await inspectVideoFile(playableFilePath);
      const width = inspection.width || 1920;
      const height = inspection.height || 1080;
      const duration = Math.round(inspection.duration || 60);

      // Generate thumbnail
      const ffmpeg = getFFmpegPath();
      const thumbDir = path.join(process.cwd(), "public", "samples");
      if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
      const thumbFileName = `${fileId}_thumb.jpg`;
      const thumbPath = path.join(thumbDir, thumbFileName);

      try {
        await execAsync(`"${ffmpeg}" -y -ss 00:00:01 -i "${playableFilePath}" -vframes 1 -q:v 2 "${thumbPath}"`);
      } catch (thErr) {
        console.warn("Thumbnail generation warning:", thErr);
      }

      const streamUrl = `/api/video/stream?id=${fileId}`;

      const metadata = {
        id: fileId,
        title: file.name.replace(/\.[^/.]+$/, ""),
        channelTitle: "Local File",
        duration,
        resolution: `${width} × ${height} (${width > height ? "16:9" : "9:16"})`,
        width,
        height,
        thumbnailUrl: `/samples/${thumbFileName}`,
        videoUrl: streamUrl,
        localStreamUrl: streamUrl,
        localPath: playableFilePath,
        isLocal: true,
        isReady: true,
      };

      return NextResponse.json({ success: true, metadata });
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Please provide a valid YouTube URL." }, { status: 400 });
    }

    const metadata = await extractYouTubeMetadata(url);

    // Trigger local video preparation in the background so it's ready when user navigates to timeline/captions
    const uploadsDir = path.join(process.cwd(), "temp", "uploads");
    downloadYouTubeVideo(url, uploadsDir, metadata.id).then((p) => {
      console.log(`Video ${metadata.id} prepared at:`, p);
    }).catch((e) => {
      console.warn(`Video ${metadata.id} download note:`, e.message);
    });

    return NextResponse.json({ success: true, metadata });
  } catch (error: any) {
    console.error("Video import error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze video." },
      { status: 500 }
    );
  }
}
