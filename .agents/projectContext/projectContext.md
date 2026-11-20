# ClipShort AI (yt-clip) — Complete Project Context

## 1. Project Overview & Mission

**ClipShort AI** is a personal, web-based AI video clipper and short-form vertical video (Shorts / TikTok / Reels) generator built on **Next.js 16 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS v4**, **Zustand**, and a local **FFmpeg / yt-dlp** engine.

### Core Philosophy
- **100% Free & Personal**: Zero subscriptions, credits, paywalls, or artificial export limits.
- **Local Media Processing**: Video transcoding, audio waveform extraction, VTT parsing, ASS subtitle generation, and MP4 encoding run locally on the user's machine without external SaaS costs.
- **Graceful Fallbacks**: Works out of the box with zero configuration (using bundled binaries and smart offline speech generation) or optionally with OpenAI Whisper (`OPENAI_API_KEY`) for speech-to-text.

---

## 2. Technology Stack & Key Dependencies

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | Next.js 16.4.4 (Turbopack) | App Router, Server-side API endpoints, Client components |
| **Language** | TypeScript 5 & Node.js 20+ | End-to-end type safety |
| **UI & Styling** | React 19, Tailwind CSS v4, Lucide React | Modern dark-themed dashboard, responsive controls |
| **State Store** | Zustand 5 | Centralized reactive workflow state (`useClipStore`) |
| **Audio Visualization**| WaveSurfer.js 8 | Synchronized waveform timeline with interactive time rulers |
| **Media Engines** | Portable FFmpeg, FFprobe, yt-dlp | Bundled in `bin/` for video trimming, filtering, subtitle burning |
| **Subtitles & Text** | ASS (Advanced SubStation Alpha) | Pixel-accurate animated word highlighting burned via FFmpeg |
| **Archival & Confetti**| Archiver 8, Canvas-Confetti | 1-click ZIP export bundles, celebration animations |

---

## 3. Directory & File Map

```text
yt-clip/
├── .agents/
│   └── projectContext/
│       ├── SKILL.md                   # Antigravity agent skill definition
│       └── projectContext.md          # Comprehensive architecture & context guide
├── app/
│   ├── api/
│   │   ├── download/[jobId]/route.ts  # Serves rendered MP4 clips and ZIP files (HTTP 206)
│   │   ├── export/route.ts            # Receives export requests, enqueues background job
│   │   ├── export/[jobId]/route.ts    # Polling endpoint for job status, percentage, FFmpeg logs
│   │   ├── import/route.ts            # Handles YouTube metadata extraction and multipart file uploads
│   │   ├── transcribe/route.ts        # Whisper AI speech-to-text with local VTT/smart fallback
│   │   ├── video/stream/route.ts      # HTTP 206 chunked video streaming for timeline scrubbing
│   │   └── waveform/route.ts          # Extracts 120-point audio peaks using FFmpeg
│   ├── globals.css                    # Tailwind CSS v4 design system, animations & dark glow
│   ├── layout.tsx                     # Root HTML wrapper with Inter font
│   └── page.tsx                       # Master screen coordinator switching screens 1-6
├── bin/                               # Portable standalone executables
│   ├── ffmpeg.exe                     # Local FFmpeg engine
│   ├── ffprobe.exe                    # Local FFprobe inspection tool
│   └── yt-dlp.exe                     # YouTube video and metadata extractor
├── components/
│   ├── captions/                      # Caption styling & customization controls
│   ├── export/                        # Export cards and format selection widgets
│   ├── header/Header.tsx              # 6-step progress stepper and project actions
│   ├── screens/                       # The 6 workflow steps:
│   │   ├── Screen1Import.tsx          # Step 1: YouTube URL import or local file upload
│   │   ├── Screen2Timeline.tsx        # Step 2: Synchronized video player and waveform timeline
│   │   ├── Screen3Captions.tsx        # Step 3: Vertical 9:16 clip previews with live captions
│   │   ├── Screen4Customize.tsx       # Step 4: Caption placement, typography, framing, safe areas
│   │   ├── Screen5Export.tsx          # Step 5: Format, quality (720p-4K), FPS, burning options
│   │   └── Screen6DownloadCenter.tsx  # Step 6: Real-time FFmpeg progress, logs, ZIP download
│   ├── sidebar/Sidebar.tsx            # Left navigation bar and engine status indicator
│   ├── timeline/WaveformTimeline.tsx  # Interactive WaveSurfer waveform with draggable clip regions
│   └── video/                         # HTML5 video player and 9:16 VerticalShortCard previews
├── lib/
│   ├── ffmpeg/
│   │   ├── inspector.ts               # Video format inspection & browser compatibility checker
│   │   ├── paths.ts                   # Resolves paths for ffmpeg, ffprobe, and yt-dlp
│   │   ├── processor.ts               # FFmpeg execution engine (trim, crop, filter, burn)
│   │   └── subtitles.ts               # Generates ASS subtitle files with word highlight tags
│   ├── transcription/
│   │   ├── vttParser.ts               # Parses YouTube VTT subtitles into clip-relative segments
│   │   └── whisper.ts                 # OpenAI Whisper API client with offline smart generator
│   ├── youtube/
│   │   └── service.ts                 # yt-dlp wrapper for metadata, downloading, and subtitles
│   └── utils.ts                       # Tailwind merge (cn) and timestamp formatting utilities
├── public/
│   └── samples/                       # Pre-generated sample demo video, thumbnail, and demo assets
├── stores/
│   └── clipStore.ts                   # Zustand store (currentStep, videoMetadata, clips, jobs)
├── temp/                              # Local working directory (uploads, audio, processed, jobs)
├── types/
│   └── index.ts                       # Core TypeScript definitions (Clip, VideoMetadata, ExportJob)
├── workers/
│   └── jobQueue.ts                    # In-memory and disk-persisted background export task runner
├── package.json                       # Next.js scripts and dependencies
├── projectContext.md                  # Root copy of project documentation
└── start.bat                          # 1-Click launcher for Windows
```

---

## 4. The 6-Screen Architecture

The user interface follows a progressive linear workflow coordinated by `app/page.tsx` through `currentStep` (1 through 6):

```
[Screen 1: Import] ──► [Screen 2: Timeline] ──► [Screen 3: Captions]
                              │
[Screen 6: Download] ◄── [Screen 5: Export] ◄── [Screen 4: Customize]
```

1. **Screen 1 (Import)**:
   - Paste YouTube URL (extracted via `yt-dlp --dump-json`).
   - Upload local `.mp4`, `.mov`, `.mkv` files (auto-converted to browser-compatible H.264 / AAC / faststart via `inspector.ts`).
   - 1-click "Try Demo Video" to instantly explore the app with zero file uploads.
2. **Screen 2 (Timeline)**:
   - Synchronized HTML5 video player + WaveSurfer audio timeline.
   - Draggable & resizable multi-clip regions (Clip A - Purple, Clip B - Blue, Clip C - Green, etc.).
   - Actions: Add Clip, Split at Playhead, Delete, Zoom In/Out, Fit.
3. **Screen 3 (AI Captions)**:
   - Displays side-by-side vertical 9:16 cards for each selected clip.
   - Synchronized word-highlighted animated captions overlaid on video frames.
   - Caption styling toolbar: Styles (Default, Bold, Highlight, Minimal), Fonts (Inter, Montserrat, Roboto, Outfit, Arial), font size, text colors.
4. **Screen 4 (Customize)**:
   - Fine-tune framing: 9:16 Center Crop, Zoom Scale (1.0x - 2.0x), Pan X/Y offsets, Background Blur.
   - Interactive draggable caption box directly over the 9:16 preview canvas.
   - Social platform safe area overlays for TikTok, Instagram Reels, and YouTube Shorts.
   - Creator branding: Watermark / handle overlay and animated progress bar.
5. **Screen 5 (Export Settings)**:
   - Mode: Individual Clips or Merged Single Video.
   - Aspect ratios: 9:16 (Vertical), 16:9 (Landscape), 1:1 (Square).
   - Resolutions: 720p HD, 1080p Full HD, 4K Ultra HD.
   - Frame rates: 30 FPS, 60 FPS.
   - Subtitle burning: Hardcoded ASS subtitles burned into video stream.
   - Real-time estimated file size and processing duration calculation.
6. **Screen 6 (Download Center)**:
   - Live FFmpeg encoding progress bar and current stage indicator.
   - Real-time collapsible terminal viewer streaming FFmpeg console logs.
   - Rendered video cards with playable preview and direct `.mp4` downloads.
   - 1-click "Download All (ZIP Archive)" generated with `archiver`.

---

## 5. Media Processing Pipeline & FFmpeg Engine

### Portable Binaries (`lib/ffmpeg/paths.ts`)
The application inspects `bin/` at the root for `ffmpeg.exe`, `ffprobe.exe`, and `yt-dlp.exe`. If not present, it falls back to `@ffmpeg-installer`, `@ffprobe-installer`, or the system `PATH`.

### Subtitle Burning (`lib/ffmpeg/subtitles.ts`)
Word-level animation is implemented via Advanced SubStation Alpha (`.ass`) files:
- Converts hex color codes (e.g. `#FACC15`) to ASS BGR format (`&H0015CCFA&`).
- Assigns styles: `Default` for standard words, `Highlight` for the currently spoken word.
- Injects `{\rHighlight}word{\rDefault}` tags dynamically.

### Video Rendering (`lib/ffmpeg/processor.ts`)
- Executes FFmpeg child processes with filter graphs:
  - Trims clip range: `-ss [start] -t [duration]`
  - Aspect ratio cropping and background blurring: splits input into blurred background (`boxblur`) and centered/zoomed foreground, stacked with `overlay`.
  - Subtitle burning: uses the `-vf ass="path/to/subtitles.ass"` filter.
  - Video encoding: `libx264`, preset `fast`, `yuv420p` pixel format, `-movflags +faststart` for instant web streaming.

---

## 6. Global State Management (`stores/clipStore.ts`)

Centralized in Zustand:
- `currentStep`: `1 | 2 | 3 | 4 | 5 | 6`
- `videoMetadata`: Metadata of loaded video (duration, resolution, streams).
- `clips`: Array of `Clip` objects containing timestamps, caption segments, styling, and video framing settings.
- `activeClipId`: ID of currently selected clip.
- `currentTime`, `isPlaying`, `zoomLevel`: Timeline playback state.
- `exportSettings`: Export configuration (resolution, fps, format, burn settings).
- `currentJob`: Active `ExportJob` tracking stage, progress percentage, logs, and downloads.

---

## 7. Operational & Developer Guidelines

- **Windows 1-Click Launch**: Double-clicking `start.bat` verifies Node.js, ensures `.env.local` exists, installs dependencies if `node_modules` is absent, opens `http://localhost:3000`, and starts the development server.
- **Node.js Scripts on Windows**: Always invoke `npm.cmd` rather than bare `npm` in Windows batch/PowerShell environments to prevent script execution policy blocks.
- **Video Scrubbing**: All video elements must point to `/api/video/stream?id=...` which implements HTTP 206 partial range streaming. Never feed direct static file paths to the browser video element.
- **Temporary Files**: Working files reside in `temp/` (`temp/uploads`, `temp/audio`, `temp/jobs`, `temp/processed`) and are excluded from version control via `.gitignore`.

