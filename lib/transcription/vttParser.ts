import fs from "fs";
import type { CaptionSegment, CaptionWord } from "../../types/index";

function parseVttTimestamp(timestamp: string): number {
  const parts = timestamp.trim().split(":");
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2].replace(",", "."));
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1].replace(",", "."));
    return minutes * 60 + seconds;
  }
  return 0;
}

function cleanVttText(rawText: string): string {
  return rawText
    .replace(/<[^>]+>/g, " ") // remove HTML/VTT tags like <00:00:00.000> or <c>
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

interface RawCue {
  start: number;
  end: number;
  text: string;
}

export function parseVttFile(
  filePath: string,
  clipStartTime: number,
  clipEndTime: number
): CaptionSegment[] {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  return parseVttContent(content, clipStartTime, clipEndTime);
}

export function parseVttContent(
  vttContent: string,
  clipStartTime: number,
  clipEndTime: number
): CaptionSegment[] {
  const lines = vttContent.split(/\r?\n/);
  const rawCues: RawCue[] = [];

  let currentStart: number | null = null;
  let currentEnd: number | null = null;
  let currentTextLines: string[] = [];

  const timeRegex = /((?:\d{2}:)?\d{2}:\d{2}[\.,]\d{3})\s*-->\s*((?:\d{2}:)?\d{2}:\d{2}[\.,]\d{3})/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    const match = line.match(timeRegex);
    if (match) {
      if (currentStart !== null && currentEnd !== null && currentTextLines.length > 0) {
        const text = cleanVttText(currentTextLines.join(" "));
        if (text) {
          rawCues.push({ start: currentStart, end: currentEnd, text });
        }
      }
      currentStart = parseVttTimestamp(match[1]);
      currentEnd = parseVttTimestamp(match[2]);
      currentTextLines = [];
    } else if (currentStart !== null && line && !line.startsWith("WEBVTT") && !line.startsWith("Kind:") && !line.startsWith("Language:") && !line.startsWith("NOTE")) {
      currentTextLines.push(line);
    }
  }

  // Push last cue
  if (currentStart !== null && currentEnd !== null && currentTextLines.length > 0) {
    const text = cleanVttText(currentTextLines.join(" "));
    if (text) {
      rawCues.push({ start: currentStart, end: currentEnd, text });
    }
  }

  // Filter cues within clip range [clipStartTime, clipEndTime]
  const clipDuration = clipEndTime - clipStartTime;
  const filteredCues = rawCues.filter(
    (cue) => cue.end > clipStartTime && cue.start < clipEndTime
  );

  if (filteredCues.length === 0) return [];

  // Deduplicate adjacent cues with identical text
  const dedupedCues: RawCue[] = [];
  let lastText = "";
  for (const c of filteredCues) {
    if (c.text !== lastText) {
      dedupedCues.push(c);
      lastText = c.text;
    }
  }

  // Convert to clip-relative CaptionSegment[]
  const segments: CaptionSegment[] = [];

  dedupedCues.forEach((cue, idx) => {
    const relStart = Math.max(0, cue.start - clipStartTime);
    const relEnd = Math.min(clipDuration, Math.max(relStart + 0.8, cue.end - clipStartTime));

    const words = cue.text.split(" ").filter(Boolean);
    if (words.length === 0) return;

    const wordDuration = (relEnd - relStart) / words.length;
    const captionWords: CaptionWord[] = words.map((w, wIdx) => {
      const wStart = Math.round((relStart + wIdx * wordDuration) * 100) / 100;
      const wEnd = Math.round((relStart + (wIdx + 1) * wordDuration) * 100) / 100;
      const isHighlighted = wIdx === words.length - 1;

      return {
        word: w,
        start: wStart,
        end: wEnd,
        isHighlighted,
      };
    });

    segments.push({
      id: `vtt-seg-${idx + 1}-${Date.now()}`,
      start: Math.round(relStart * 100) / 100,
      end: Math.round(relEnd * 100) / 100,
      text: cue.text,
      words: captionWords,
    });
  });

  return segments;
}
