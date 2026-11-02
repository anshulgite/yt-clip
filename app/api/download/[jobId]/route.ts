import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { Readable } from "stream";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Support streaming a local uploaded video directly
    if (jobId === "local") {
      const rawPath = searchParams.get("path");
      if (!rawPath) return new NextResponse("File path required", { status: 400 });
      const filePath = decodeURIComponent(rawPath);
      if (!fs.existsSync(filePath)) return new NextResponse("File not found", { status: 404 });

      return streamFileWithRange(filePath, req);
    }

    const fileName = searchParams.get("file");
    if (!fileName) {
      return new NextResponse("Missing file parameter", { status: 400 });
    }

    // Prevent directory traversal
    const safeName = path.basename(fileName);
    const filePath = path.join(process.cwd(), "temp", "processed", jobId, safeName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse("File not found on server", { status: 404 });
    }

    return streamFileWithRange(filePath, req, safeName);
  } catch (err: any) {
    console.error("Download route error:", err);
    return new NextResponse(err.message || "Download error", { status: 500 });
  }
}

function streamFileWithRange(filePath: string, req: NextRequest, fileName?: string): NextResponse {
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const isZip = filePath.endsWith(".zip");
  const contentType = isZip ? "application/zip" : "video/mp4";
  const safeName = fileName || path.basename(filePath);

  const range = req.headers.get("range");

  if (!isZip && range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    let end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (isNaN(start) || start >= fileSize || start < 0) {
      return new NextResponse(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${fileSize}` },
      });
    }

    if (end >= fileSize) end = fileSize - 1;

    const chunkSize = end - start + 1;
    const stream = fs.createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(stream);

    return new NextResponse(webStream as any, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunkSize.toString(),
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${safeName}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Full file stream with Accept-Ranges
  const stream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(stream);

  return new NextResponse(webStream as any, {
    status: 200,
    headers: {
      "Content-Length": fileSize.toString(),
      "Content-Type": contentType,
      "Content-Disposition": isZip ? `attachment; filename="${safeName}"` : `inline; filename="${safeName}"`,
      "Accept-Ranges": "bytes",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
