import { create } from "zustand";
import {
  VideoMetadata,
  Clip,
  ClipCaptionCustomization,
  ClipVideoCustomization,
  ExportSettings,
  ExportJob,
  CaptionSegment,
} from "@/types";

const CLIP_COLORS = [
  "#8B5CF6", // Purple (Clip A)
  "#0EA5E9", // Sky Blue (Clip B)
  "#10B981", // Emerald Green (Clip C)
  "#EC4899", // Pink (Clip D)
  "#F59E0B", // Amber (Clip E)
  "#6366F1", // Indigo (Clip F)
  "#14B8A6", // Teal (Clip G)
];

const DEFAULT_CAPTION_SETTINGS: ClipCaptionCustomization = {
  style: "highlight",
  font: "Inter",
  fontSize: 56,
  textColor: "#FFFFFF",
  highlightColor: "#FACC15", // Warm yellow
  position: "bottom",
  textBackground: "rounded",
  highlightStyle: "background",
  autoHighlight: true,
  autoZoom: true,
  removeSilence: false,
  customPositionY: 80,
  enabled: true,
};

const DEFAULT_VIDEO_SETTINGS: ClipVideoCustomization = {
  cropMode: "center",
  zoomScale: 1.0,
  panX: 0,
  panY: 0,
  blurBackground: true,
};

const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  exportType: "individual",
  outputFormat: "mp4",
  aspectRatio: "9:16",
  videoQuality: "1080p",
  frameRate: 30,
  burnCaptions: true,
  keepOriginalAudio: true,
  videoBitrate: "8000k",
  audioBitrate: "192k",
  preset: "fast",
};

interface ClipStore {
  currentStep: number;
  videoMetadata: VideoMetadata | null;
  clips: Clip[];
  activeClipId: string | null;
  currentTime: number;
  isPlaying: boolean;
  zoomLevel: number;
  exportSettings: ExportSettings;
  currentJob: ExportJob | null;
  isAnalyzing: boolean;
  isTranscribing: boolean;

  // Actions
  setStep: (step: number) => void;
  setVideoMetadata: (metadata: VideoMetadata | null) => void;
  addClip: (startTime?: number, endTime?: number) => void;
  updateClip: (id: string, updates: Partial<Clip>) => void;
  removeClip: (id: string) => void;
  splitClip: (id: string, splitTime: number) => void;
  setActiveClipId: (id: string | null) => void;
  setCurrentTime: (time: number) => void;
  setIsPlaying: (playing: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  updateCaptionSettings: (clipId: string, settings: Partial<ClipCaptionCustomization>) => void;
  updateAllCaptionSettings: (settings: Partial<ClipCaptionCustomization>) => void;
  updateVideoSettings: (clipId: string, settings: Partial<ClipVideoCustomization>) => void;
  updateExportSettings: (settings: Partial<ExportSettings>) => void;
  setCurrentJob: (job: ExportJob | null) => void;
  updateExportJob: (updates: Partial<ExportJob>) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setIsTranscribing: (transcribing: boolean) => void;
  loadDemoProject: () => void;
  resetProject: () => void;
}

export const useClipStore = create<ClipStore>((set, get) => ({
  currentStep: 1,
  videoMetadata: null,
  clips: [],
  activeClipId: null,
  currentTime: 0,
  isPlaying: false,
  zoomLevel: 1,
  exportSettings: DEFAULT_EXPORT_SETTINGS,
  currentJob: null,
  isAnalyzing: false,
  isTranscribing: false,

  setStep: (step) => set({ currentStep: step }),

  setVideoMetadata: (metadata) => {
    set({ videoMetadata: metadata });
    if (metadata && get().clips.length === 0) {
      // Create initial sensible default clips if none exist
      const totalDur = metadata.duration || 120;
      const clip1Start = Math.min(10, Math.floor(totalDur * 0.05));
      const clip1End = Math.min(clip1Start + 45, Math.floor(totalDur * 0.3));
      get().addClip(clip1Start, clip1End);
    }
  },

  addClip: (startTime, endTime) => {
    const { clips, videoMetadata } = get();
    const index = clips.length;
    const labelLetter = String.fromCharCode(65 + index); // A, B, C...
    const color = CLIP_COLORS[index % CLIP_COLORS.length];

    const totalDur = videoMetadata?.duration || 180;
    const start = startTime !== undefined ? startTime : Math.min(index * 60, Math.max(0, totalDur - 40));
    const end = endTime !== undefined ? endTime : Math.min(start + 45, totalDur);

    const newClip: Clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: `Clip ${labelLetter}`,
      color,
      startTime: Math.max(0, start),
      endTime: Math.max(start + 1, end),
      duration: Math.max(1, end - start),
      title: `Clip ${labelLetter}`,
      captions: [
        {
          id: `seg-1`,
          start: 0,
          end: Math.min(6, end - start),
          text: "The key to building scalable products with AI is simplicity.",
          words: [
            { word: "The", start: 0.1, end: 0.3 },
            { word: "key", start: 0.4, end: 0.7 },
            { word: "to", start: 0.8, end: 0.9 },
            { word: "building", start: 1.0, end: 1.5 },
            { word: "scalable", start: 1.6, end: 2.1 },
            { word: "products", start: 2.2, end: 2.7 },
            { word: "with", start: 2.8, end: 3.0 },
            { word: "AI", start: 3.1, end: 3.4 },
            { word: "is", start: 3.5, end: 3.7 },
            { word: "simplicity.", start: 3.8, end: 4.6, isHighlighted: true },
          ],
        },
      ],
      captionSettings: { ...DEFAULT_CAPTION_SETTINGS },
      videoSettings: { ...DEFAULT_VIDEO_SETTINGS },
    };

    const updatedClips = [...clips, newClip];
    set({
      clips: updatedClips,
      activeClipId: newClip.id,
    });
  },

  updateClip: (id, updates) => {
    set((state) => {
      const updated = state.clips.map((c) => {
        if (c.id === id) {
          const startTime = updates.startTime !== undefined ? updates.startTime : c.startTime;
          const endTime = updates.endTime !== undefined ? updates.endTime : c.endTime;
          const duration = Math.max(0.5, endTime - startTime);
          return {
            ...c,
            ...updates,
            startTime,
            endTime,
            duration,
          };
        }
        return c;
      });
      return { clips: updated };
    });
  },

  removeClip: (id) => {
    set((state) => {
      const remaining = state.clips.filter((c) => c.id !== id);
      // Re-label clips A, B, C
      const reIndexed = remaining.map((clip, idx) => ({
        ...clip,
        label: `Clip ${String.fromCharCode(65 + idx)}`,
        color: CLIP_COLORS[idx % CLIP_COLORS.length],
      }));
      return {
        clips: reIndexed,
        activeClipId: reIndexed.length > 0 ? (state.activeClipId === id ? reIndexed[0].id : state.activeClipId) : null,
      };
    });
  },

  splitClip: (id, splitTime) => {
    const { clips } = get();
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    if (splitTime <= clip.startTime + 1 || splitTime >= clip.endTime - 1) return;

    const originalEnd = clip.endTime;
    get().updateClip(id, { endTime: splitTime });

    // Add new clip right after
    const newClipIndex = clips.length;
    const labelLetter = String.fromCharCode(65 + newClipIndex);
    const color = CLIP_COLORS[newClipIndex % CLIP_COLORS.length];

    const splitSecondHalf: Clip = {
      id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: `Clip ${labelLetter}`,
      color,
      startTime: splitTime,
      endTime: originalEnd,
      duration: originalEnd - splitTime,
      title: `Clip ${labelLetter}`,
      captions: [],
      captionSettings: { ...clip.captionSettings },
      videoSettings: { ...clip.videoSettings },
    };

    set((state) => ({
      clips: [...state.clips, splitSecondHalf],
      activeClipId: splitSecondHalf.id,
    }));
  },

  setActiveClipId: (id) => set({ activeClipId: id }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setZoomLevel: (zoom) => set({ zoomLevel: Math.max(0.5, Math.min(5, zoom)) }),

  updateCaptionSettings: (clipId, settings) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, captionSettings: { ...c.captionSettings, ...settings } }
          : c
      ),
    }));
  },

  updateAllCaptionSettings: (settings) => {
    set((state) => {
      const isCaptionsDisabled = settings.enabled === false || settings.style === "none";
      const isCaptionsEnabled = settings.enabled === true || (settings.style && settings.style !== "none");
      const newBurnCaptions = isCaptionsDisabled ? false : (isCaptionsEnabled ? true : state.exportSettings.burnCaptions);

      return {
        clips: state.clips.map((c) => ({
          ...c,
          captionSettings: {
            ...c.captionSettings,
            ...settings,
            enabled: isCaptionsDisabled ? false : (isCaptionsEnabled ? true : c.captionSettings.enabled ?? true),
          },
        })),
        exportSettings: {
          ...state.exportSettings,
          burnCaptions: newBurnCaptions,
        },
      };
    });
  },

  updateVideoSettings: (clipId, settings) => {
    set((state) => ({
      clips: state.clips.map((c) =>
        c.id === clipId
          ? { ...c, videoSettings: { ...c.videoSettings, ...settings } }
          : c
      ),
    }));
  },

  updateExportSettings: (settings) => {
    set((state) => ({
      exportSettings: { ...state.exportSettings, ...settings },
    }));
  },

  setCurrentJob: (job) => set({ currentJob: job }),

  updateExportJob: (updates) => {
    set((state) => ({
      currentJob: state.currentJob ? { ...state.currentJob, ...updates } : null,
    }));
  },

  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setIsTranscribing: (transcribing) => set({ isTranscribing: transcribing }),

  loadDemoProject: () => {
    const demoMetadata: VideoMetadata = {
      id: "dQw4w9WgXcQ",
      title: "How I Built a Scalable Product with AI (Full Talk)",
      channelTitle: "Tech With Anshul",
      viewCount: "1.2M views",
      publishedTime: "3 months ago",
      duration: 1666, // 27:46 in seconds
      resolution: "1920 × 1080 (16:9)",
      width: 1920,
      height: 1080,
      fps: 30,
      thumbnailUrl: "/samples/demo-thumbnail.jpg",
      videoUrl: "/api/video/stream?id=demo",
      localStreamUrl: "/api/video/stream?id=demo",
      youtubeId: "dQw4w9WgXcQ",
      isLocal: false,
      isReady: true,
    };

    const demoClips: Clip[] = [
      {
        id: "clip-a",
        label: "Clip A",
        color: "#8B5CF6", // Purple
        startTime: 130, // 02:10
        endTime: 340,   // 05:40
        duration: 210,  // 03:30
        title: "Simplicity in Scalable AI",
        captions: [
          {
            id: "seg-a1",
            start: 0,
            end: 5.2,
            text: "The key to building scalable products with AI is simplicity.",
            words: [
              { word: "The", start: 0.1, end: 0.3 },
              { word: "key", start: 0.4, end: 0.7 },
              { word: "to", start: 0.8, end: 1.0 },
              { word: "building", start: 1.1, end: 1.6 },
              { word: "scalable", start: 1.7, end: 2.2 },
              { word: "products", start: 2.3, end: 2.8 },
              { word: "with", start: 2.9, end: 3.1 },
              { word: "AI", start: 3.2, end: 3.5 },
              { word: "is", start: 3.6, end: 3.9 },
              { word: "simplicity.", start: 4.0, end: 5.0, isHighlighted: true },
            ],
          },
          {
            id: "seg-a2",
            start: 5.3,
            end: 11.0,
            text: "Most people over-engineer their models before validating user demand.",
            words: [
              { word: "Most", start: 5.4, end: 5.8 },
              { word: "people", start: 5.9, end: 6.3 },
              { word: "over-engineer", start: 6.4, end: 7.2, isHighlighted: true },
              { word: "their", start: 7.3, end: 7.5 },
              { word: "models", start: 7.6, end: 8.1 },
              { word: "before", start: 8.2, end: 8.6 },
              { word: "validating", start: 8.7, end: 9.4 },
              { word: "user", start: 9.5, end: 9.8 },
              { word: "demand.", start: 9.9, end: 10.8 },
            ],
          },
        ],
        captionSettings: {
          style: "highlight",
          font: "Inter",
          fontSize: 56,
          textColor: "#FFFFFF",
          highlightColor: "#FACC15",
          position: "bottom",
          textBackground: "rounded",
          highlightStyle: "background",
          autoHighlight: true,
          autoZoom: true,
          removeSilence: false,
          customPositionY: 80,
        },
        videoSettings: {
          cropMode: "center",
          zoomScale: 1.0,
          panX: 0,
          panY: 0,
          blurBackground: true,
        },
      },
      {
        id: "clip-b",
        label: "Clip B",
        color: "#0EA5E9", // Sky Blue
        startTime: 560, // 09:20
        endTime: 790,   // 13:10
        duration: 230,  // 03:50
        title: "Solving Real User Problems",
        captions: [
          {
            id: "seg-b1",
            start: 0,
            end: 5.5,
            text: "Instead of adding more features, focus on real user problems.",
            words: [
              { word: "Instead", start: 0.1, end: 0.5 },
              { word: "of", start: 0.6, end: 0.8 },
              { word: "adding", start: 0.9, end: 1.3 },
              { word: "more", start: 1.4, end: 1.7 },
              { word: "features,", start: 1.8, end: 2.4 },
              { word: "focus", start: 2.5, end: 2.9 },
              { word: "on", start: 3.0, end: 3.2 },
              { word: "real", start: 3.3, end: 3.7, isHighlighted: true },
              { word: "user", start: 3.8, end: 4.2, isHighlighted: true },
              { word: "problems.", start: 4.3, end: 5.2, isHighlighted: true },
            ],
          },
        ],
        captionSettings: {
          style: "highlight",
          font: "Inter",
          fontSize: 56,
          textColor: "#FFFFFF",
          highlightColor: "#FACC15",
          position: "bottom",
          textBackground: "rounded",
          highlightStyle: "background",
          autoHighlight: true,
          autoZoom: true,
          removeSilence: false,
          customPositionY: 80,
        },
        videoSettings: {
          cropMode: "center",
          zoomScale: 1.0,
          panX: 0,
          panY: 0,
          blurBackground: true,
        },
      },
      {
        id: "clip-c",
        label: "Clip C",
        color: "#10B981", // Emerald Green
        startTime: 1120, // 18:40
        endTime: 1340,   // 22:20
        duration: 220,   // 03:40
        title: "Creating Products That Scale",
        captions: [
          {
            id: "seg-c1",
            start: 0,
            end: 5.8,
            text: "That's how you create a product that actually scales.",
            words: [
              { word: "That's", start: 0.1, end: 0.5 },
              { word: "how", start: 0.6, end: 0.9 },
              { word: "you", start: 1.0, end: 1.2 },
              { word: "create", start: 1.3, end: 1.8 },
              { word: "a", start: 1.9, end: 2.1 },
              { word: "product", start: 2.2, end: 2.7 },
              { word: "that", start: 2.8, end: 3.0 },
              { word: "actually", start: 3.1, end: 3.6, isHighlighted: true },
              { word: "scales.", start: 3.7, end: 4.8, isHighlighted: true },
            ],
          },
        ],
        captionSettings: {
          style: "highlight",
          font: "Inter",
          fontSize: 56,
          textColor: "#FFFFFF",
          highlightColor: "#FACC15",
          position: "bottom",
          textBackground: "rounded",
          highlightStyle: "background",
          autoHighlight: true,
          autoZoom: true,
          removeSilence: false,
          customPositionY: 80,
        },
        videoSettings: {
          cropMode: "center",
          zoomScale: 1.0,
          panX: 0,
          panY: 0,
          blurBackground: true,
        },
      },
    ];

    set({
      videoMetadata: demoMetadata,
      clips: demoClips,
      activeClipId: "clip-a",
      currentStep: 2,
    });
  },

  resetProject: () => {
    set({
      currentStep: 1,
      videoMetadata: null,
      clips: [],
      activeClipId: null,
      currentTime: 0,
      isPlaying: false,
      zoomLevel: 1,
      currentJob: null,
      isAnalyzing: false,
      isTranscribing: false,
    });
  },
}));
