import fs from "fs";
import { CaptionSegment, ClipCaptionCustomization } from "@/types";

// Convert hex #RRGGBB to ASS &HAABBGGRR format (ASS uses BGR, alpha 00 is opaque)
function hexToAssColor(hex: string): string {
  const cleanHex = hex.replace("#", "");
  if (cleanHex.length === 6) {
    const r = cleanHex.substring(0, 2);
    const g = cleanHex.substring(2, 4);
    const b = cleanHex.substring(4, 6);
    return `&H00${b}${g}${r}&`;
  }
  return "&H00FFFFFF&";
}

function formatAssTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${cs.toString().padStart(2, "0")}`;
}

export function generateAssSubtitles(
  segments: CaptionSegment[],
  settings: ClipCaptionCustomization,
  outputPath: string
): void {
  const fontName = settings.font || "Arial";
  const fontSize = Math.round(settings.fontSize * 0.9) || 48;
  const primaryColor = hexToAssColor(settings.textColor || "#FFFFFF");
  const highlightColor = hexToAssColor(settings.highlightColor || "#FACC15");
  const backColor = "&H80000000&"; // 50% black shadow/background

  // Alignment: 2 = bottom center, 5 = middle center, 8 = top center
  let alignment = 2;
  let marginV = 80;
  if (settings.position === "center") {
    alignment = 5;
    marginV = 0;
  } else if (settings.position === "top") {
    alignment = 8;
    marginV = 80;
  }

  const borderStyle = settings.textBackground === "box" ? 3 : 1;
  const outline = settings.textBackground === "outline" ? 4 : 2;

  let assContent = `[Script Info]
Title: ClipShort AI Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primaryColor},&H000000FF&,&H00000000&,${backColor},-1,0,0,0,100,100,0,0,${borderStyle},${outline},2,${alignment},40,40,${marginV},1
Style: Highlight,${fontName},${fontSize},${highlightColor},&H000000FF&,&H00000000&,${backColor},-1,0,0,0,100,100,0,0,${borderStyle},${outline},2,${alignment},40,40,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  segments.forEach((seg) => {
    const startTime = formatAssTime(seg.start);
    const endTime = formatAssTime(seg.end);

    let textFormatted = seg.text;

    // If word highlighting is enabled and words are present
    if (settings.autoHighlight && seg.words && seg.words.length > 0) {
      textFormatted = seg.words
        .map((w) => {
          if (w.isHighlighted) {
            return `{\\rHighlight}${w.word}{\\rDefault}`;
          }
          return w.word;
        })
        .join(" ");
    }

    assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${textFormatted}\n`;
  });

  fs.writeFileSync(outputPath, assContent, "utf-8");
}
