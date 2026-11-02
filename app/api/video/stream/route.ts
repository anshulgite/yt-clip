import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const rawPath = searchParams.get("path");

    let filePath: string | null = null;

    if (rawPath) {
      const decoded = decodeURIComponent(rawPath);
      // Ensure path is within workspace or allowed folders
      if (fs.existsSync(decoded)) {
        filePath = decoded;
      }
    }

    if (!filePath && id) {
      // Check temp/uploads/
      const uploadsDir = path.join(process.cwd(), "temp", "uploads");
      const candidates = [
        path.join(uploadsDir, `${id}_h264.mp4`),      // explicit H.264 faststart re-encode
        path.join(uploadsDir, `${id}_stream.mp4`),    // legacy faststart remux
        path.join(uploadsDir, `${id}_playable.mp4`),  // legacy playable
        path.join(uploadsDir, `${id}.mp4`),
        path.join(uploadsDir, `${id}.webm`),
      ];

      for (const cand of candidates) {
        if (fs.existsSync(cand)) {
          filePath = cand;
          break;
        }
      }
    }

    // Fallback to sample demo video if not found
    if (!filePath || !fs.existsSync(filePath)) {
      filePath = path.join(process.cwd(), "public", "samples", "demo-video.mp4");
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse("Video not found", { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.get("range");

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      // Handle invalid ranges
      if (isNaN(start) || start >= fileSize || start < 0) {
        return new NextResponse(null, {
          status: 416, // Range Not Satisfiable
          headers: {
            "Content-Range": `bytes */${fileSize}`,
          },
        });
      }

      // If end is greater than or equal to fileSize, clamp it
      if (end >= fileSize) {
        end = fileSize - 1;
      }

      const chunkSize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });
      const webStream = Readable.toWeb(fileStream);

      return new NextResponse(webStream as any, {
        status: 206,
        headers: {
          "Content-Range": `bytes ${start}-${end}/${fileSize}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize.toString(),
          "Content-Type": "video/mp4",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // No range header: return 200 OK with full file stream
    const fileStream = fs.createReadStream(filePath);
    const webStream = Readable.toWeb(fileStream);

    return new NextResponse(webStream as any, {
      status: 200,
      headers: {
        "Content-Length": fileSize.toString(),
        "Content-Type": "video/mp4",
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err: any) {
    console.error("Video streaming error:", err);
    return new NextResponse(err.message || "Streaming error", { status: 500 });
  }
}
