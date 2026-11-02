import path from "path";
import fs from "fs";
import { ExportJob, ExportSettings, Clip } from "@/types";
import { renderClipVideo, mergeClipsToSingleVideo } from "../lib/ffmpeg/processor";

const jobsDir = path.join(process.cwd(), "temp", "jobs");
if (!fs.existsSync(jobsDir)) {
  fs.mkdirSync(jobsDir, { recursive: true });
}

// Global cross-route map in Node.js
const globalJobs = ((globalThis as any).__clipJobsMap = (globalThis as any).__clipJobsMap || new Map<string, ExportJob>());
const jobs: Map<string, ExportJob> = globalJobs;

function persistJob(job: ExportJob) {
  try {
    const filePath = path.join(jobsDir, `${job.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(job, null, 2), "utf-8");
  } catch (e) {}
}

export function getJob(jobId: string): ExportJob | undefined {
  if (jobs.has(jobId)) {
    return jobs.get(jobId);
  }
  try {
    const filePath = path.join(jobsDir, `${jobId}.json`);
    if (fs.existsSync(filePath)) {
      const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      jobs.set(jobId, parsed);
      return parsed;
    }
  } catch (e) {}
  return undefined;
}

export function createJob(jobId: string, clips: Clip[], settings: ExportSettings): ExportJob {
  const job: ExportJob = {
    id: jobId,
    status: "queued",
    progress: 0,
    currentStage: "Job queued in local FFmpeg queue...",
    logs: [`[${new Date().toLocaleTimeString()}] Export job initialized with ${clips.length} clip(s)`],
    clips: clips.map((c) => ({
      clipId: c.id,
      label: c.label,
      title: c.title || c.label,
      duration: c.duration,
      status: "queued",
      progress: 0,
    })),
    createdAt: Date.now(),
  };

  jobs.set(jobId, job);
  persistJob(job);
  return job;
}

export async function processExportJob(
  jobId: string,
  clips: Clip[],
  settings: ExportSettings,
  videoPath: string
): Promise<void> {
  const job = jobs.get(jobId);
  if (!job) return;

  job.status = "processing";
  job.progress = 5;
  job.currentStage = "Preparing video streams and local render directory...";
  job.logs.push(`[${new Date().toLocaleTimeString()}] Starting FFmpeg worker engine`);

  const processedDir = path.join(process.cwd(), "temp", "processed", jobId);
  if (!fs.existsSync(processedDir)) {
    fs.mkdirSync(processedDir, { recursive: true });
  }

  const renderedFilePaths: string[] = [];

  try {
    const totalClips = clips.length;

    for (let i = 0; i < totalClips; i++) {
      const clip = clips[i];
      const clipItem = job.clips.find((c) => c.clipId === clip.id);
      if (clipItem) {
        clipItem.status = "processing";
        clipItem.progress = 10;
      }

      const label = clip.label || clip.title || `Clip_${i + 1}`;
      const aspectRatio = settings.aspectRatio || "9:16";
      const quality = settings.videoQuality || "1080p";
      const duration = clip.duration !== undefined ? clip.duration : Math.max(1, (clip.endTime || 10) - (clip.startTime || 0));

      job.currentStage = `Processing ${label}: Encoding ${aspectRatio} ${quality} MP4...`;
      job.logs.push(`[${new Date().toLocaleTimeString()}] Rendering ${label} (${clip.startTime || 0}s - ${clip.endTime || duration}s)`);

      const cleanLabel = label.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const outFileName = `${cleanLabel}_${aspectRatio.replace(":", "x")}_${Date.now()}.mp4`;
      const outFilePath = path.join(processedDir, outFileName);

      await renderClipVideo({
        inputPath: videoPath,
        outputPath: outFilePath,
        startTime: clip.startTime || 0,
        duration: duration,
        aspectRatio: aspectRatio,
        quality: quality,
        frameRate: settings.frameRate || 30,
        burnCaptions: Boolean(settings.burnCaptions && clip.captionSettings?.enabled !== false && clip.captionSettings?.style !== "none"),
        captions: clip.captions,
        captionSettings: clip.captionSettings,
        videoSettings: clip.videoSettings,
        keepOriginalAudio: settings.keepOriginalAudio,
        onProgress: (pct, logLine) => {
          if (clipItem) {
            clipItem.progress = pct;
          }
          const clipWeight = 85 / totalClips;
          const overall = Math.round(5 + i * clipWeight + (pct / 100) * clipWeight);
          job.progress = Math.min(95, overall);
          if (logLine && !job.logs[job.logs.length - 1]?.includes(logLine.slice(0, 30))) {
            job.logs.push(`[${new Date().toLocaleTimeString()}] ${logLine}`);
            if (job.logs.length > 50) job.logs.shift();
          }
        },
      });

      renderedFilePaths.push(outFilePath);

      const stats = fs.statSync(outFilePath);
      if (clipItem) {
        clipItem.status = "completed";
        clipItem.progress = 100;
        clipItem.fileName = outFileName;
        clipItem.fileSize = stats.size;
        clipItem.downloadUrl = `/api/download/${jobId}?file=${encodeURIComponent(outFileName)}`;
      }

      job.logs.push(`[${new Date().toLocaleTimeString()}] Successfully rendered ${clip.label} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
    }

    // Merged video
    if (settings.exportType === "merged" && renderedFilePaths.length > 1) {
      job.currentStage = "Merging selected clips into single video...";
      job.logs.push(`[${new Date().toLocaleTimeString()}] Merging clips with FFmpeg concat`);
      const mergedFileName = `merged_${Date.now()}.mp4`;
      const mergedFilePath = path.join(processedDir, mergedFileName);

      await mergeClipsToSingleVideo(renderedFilePaths, mergedFilePath);
      job.mergedDownloadUrl = `/api/download/${jobId}?file=${encodeURIComponent(mergedFileName)}`;
      job.logs.push(`[${new Date().toLocaleTimeString()}] Merged video ready`);
    }

    // Zip archive
    if (renderedFilePaths.length >= 1) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const archiver = require("archiver");
        const zipFileName = `all_clips_${jobId}.zip`;
        const zipFilePath = path.join(processedDir, zipFileName);
        const output = fs.createWriteStream(zipFilePath);
        const archive = archiver("zip", { zlib: { level: 6 } });

        await new Promise<void>((resolve, reject) => {
          output.on("close", resolve);
          archive.on("error", reject);
          archive.pipe(output);

          renderedFilePaths.forEach((fPath) => {
            archive.file(fPath, { name: path.basename(fPath) });
          });

          archive.finalize();
        });

        job.zipDownloadUrl = `/api/download/${jobId}?file=${encodeURIComponent(zipFileName)}`;
        job.logs.push(`[${new Date().toLocaleTimeString()}] ZIP archive ready for 1-click download`);
      } catch (zipErr) {
        console.warn("ZIP creation warning:", zipErr);
      }
    }

    job.status = "completed";
    job.progress = 100;
    job.currentStage = "All clips rendered and ready for download!";
    job.completedAt = Date.now();
    job.logs.push(`[${new Date().toLocaleTimeString()}] Export job finished successfully.`);
    persistJob(job);
  } catch (err: any) {
    console.error("Export job failed:", err);
    job.status = "failed";
    job.error = err.message || "Failed to process video clips";
    job.currentStage = `Error: ${job.error}`;
    job.logs.push(`[${new Date().toLocaleTimeString()}] ERROR: ${job.error}`);
    persistJob(job);
  }
}
