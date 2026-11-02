import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import { createJob, processExportJob } from "@/workers/jobQueue";
import { downloadYouTubeVideo } from "@/lib/youtube/service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clips, settings, videoUrl, localPath, videoId } = body;

    if (!clips || !Array.isArray(clips) || clips.length === 0) {
      return NextResponse.json({ error: "No clips selected for export." }, { status: 400 });
    }

    const jobId = `job_${uuidv4().slice(0, 8)}`;
    createJob(jobId, clips, settings);

    // Resolve local video file
    const uploadsDir = path.join(process.cwd(), "temp", "uploads");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    let resolvedVideoPath: string | undefined = undefined;

    // Check existing candidates for videoId or localPath
    const candidates = [
      videoId ? path.join(uploadsDir, `${videoId}_h264.mp4`) : "",
      videoId ? path.join(uploadsDir, `${videoId}_stream.mp4`) : "",
      videoId ? path.join(uploadsDir, `${videoId}_playable.mp4`) : "",
      videoId ? path.join(uploadsDir, `${videoId}.mp4`) : "",
      localPath && fs.existsSync(localPath) ? localPath : "",
    ].filter((p): p is string => Boolean(p && fs.existsSync(p)));

    if (candidates.length > 0) {
      resolvedVideoPath = candidates[0];
    } else if (videoUrl && (videoUrl.includes("http") || videoUrl.includes("youtu"))) {
      // Download YouTube video if not yet on disk
      try {
        resolvedVideoPath = await downloadYouTubeVideo(videoUrl, uploadsDir, videoId || jobId);
      } catch (downloadErr) {
        console.warn("YouTube download error, using fallback demo video:", downloadErr);
        resolvedVideoPath = path.join(process.cwd(), "public", "samples", "demo-video.mp4");
      }
    } else {
      resolvedVideoPath = path.join(process.cwd(), "public", "samples", "demo-video.mp4");
    }

    // Launch background worker process
    processExportJob(jobId, clips, settings, resolvedVideoPath).catch((err) => {
      console.error(`Export job ${jobId} failed:`, err);
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Export job initiated successfully",
    });
  } catch (error: any) {
    console.error("Export route error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to start export job" },
      { status: 500 }
    );
  }
}
