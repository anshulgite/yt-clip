export interface VideoMetadata {
  id: string;
  title: string;
  channelTitle?: string;
  viewCount?: string | number;
  publishedTime?: string;
  duration: number; // in seconds
  resolution: string;
  width?: number;
  height?: number;
  fps?: number;
  thumbnailUrl: string;
  videoUrl: string;
  localPath?: string;
  localStreamUrl?: string;
  youtubeId?: string;
  audioPath?: string;
  waveformData?: number[];
  isLocal?: boolean;
  isReady?: boolean;
}

export interface CaptionWord {
  word: string;
  start: number; // relative to clip start
  end: number;
  isHighlighted?: boolean;
}

export interface CaptionSegment {
  id: string;
  start: number; // relative to clip start in seconds
  end: number;
  text: string;
  words?: CaptionWord[];
}

export type CaptionStyle = "default" | "bold" | "highlight" | "minimal" | "outline" | "none";
export type CaptionFont = "Inter" | "Outfit" | "Montserrat" | "Roboto" | "Arial";
export type CaptionPosition = "top" | "center" | "bottom";
export type TextBackground = "rounded" | "none" | "box" | "outline" | "shadow";
export type HighlightStyle = "background" | "text" | "glow" | "pill";

export interface ClipCaptionCustomization {
  style: CaptionStyle;
  font: CaptionFont;
  fontSize: number; // in px
  textColor: string;
  highlightColor: string;
  position: CaptionPosition;
  textBackground: TextBackground;
  highlightStyle: HighlightStyle;
  autoHighlight: boolean;
  autoZoom: boolean;
  removeSilence: boolean;
  customPositionY?: number; // 0 - 100 percent
  enabled?: boolean; // When false, captions are skipped/omitted
}

export interface ClipVideoCustomization {
  cropMode: "center" | "face" | "left" | "right" | "custom";
  zoomScale: number;
  panX: number;
  panY: number;
  blurBackground: boolean;
}

export interface Clip {
  id: string;
  label: string; // "A", "B", "C", ...
  color: string; // hex
  startTime: number; // in seconds
  endTime: number; // in seconds
  duration: number; // in seconds
  title?: string;
  captions: CaptionSegment[];
  captionSettings: ClipCaptionCustomization;
  videoSettings: ClipVideoCustomization;
  previewUrl?: string;
  status?: "idle" | "transcribing" | "rendering" | "completed" | "error";
  outputPath?: string;
  outputSize?: number;
  errorMessage?: string;
}

export interface ExportSettings {
  exportType: "individual" | "merged";
  outputFormat: "mp4" | "webm" | "mov";
  aspectRatio: "9:16" | "16:9" | "1:1";
  videoQuality: "720p" | "1080p" | "4k";
  frameRate: 30 | 60;
  burnCaptions: boolean;
  keepOriginalAudio: boolean;
  videoBitrate?: string;
  audioBitrate?: string;
  preset?: string;
}

export interface ExportClipItem {
  clipId: string;
  label: string;
  title: string;
  duration: number;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export interface ExportJob {
  id: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  currentStage: string;
  logs: string[];
  clips: ExportClipItem[];
  mergedDownloadUrl?: string;
  zipDownloadUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}
