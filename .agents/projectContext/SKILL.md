---
name: projectContext
description: Comprehensive project context, architecture, tech stack, API routes, state management, and developer guidelines for the ClipShort AI (yt-clip) application.
---

# ClipShort AI (yt-clip) — Developer & Agent Skill

This skill provides full contextual grounding, architecture maps, API references, state store definitions, and operational workflows for **ClipShort AI (`yt-clip`)**.

---

## When to Activate This Skill
Use this skill whenever you need to:
1. Understand the architecture, tech stack, or directory organization of `yt-clip`.
2. Modify or add features to the 6 workflow screens (`components/screens/Screen*.tsx`).
3. Work on video processing, audio waveforms, or FFmpeg filters (`lib/ffmpeg/`).
4. Update subtitle generation or OpenAI Whisper / local fallback transcription (`lib/transcription/`).
5. Work with YouTube importing or `yt-dlp` services (`lib/youtube/`).
6. Debug or extend the background export queue (`workers/jobQueue.ts`) or export API routes.
7. Manage global state in `stores/clipStore.ts` or data contracts in `types/index.ts`.

---

## 1. System Architecture & Tech Stack

- **Framework**: Next.js 16.4.4 (App Router, Turbopack)
- **Runtime**: Node.js 20+ on Windows / POSIX
- **UI & Design**: React 19, Tailwind CSS v4, Lucide React, Canvas-Confetti
- **State Store**: Zustand 5 (`stores/clipStore.ts`)
- **Waveform Timeline**: WaveSurfer.js 8 (`components/timeline/WaveformTimeline.tsx`)
- **Media Engine**: Local standalone binaries in `bin/` (`ffmpeg.exe`, `ffprobe.exe`, `yt-dlp.exe`)
- **Subtitles**: ASS (Advanced SubStation Alpha) with synchronized word-level highlighting
- **Export Packaging**: Archiver 8 (multi-clip ZIP bundles)

---

## 2. Directory Structure

```text
yt-clip/
├── .agents/
│   └── projectContext/
│       ├── SKILL.md                   # This skill definition file
│       └── projectContext.md          # Comprehensive project context reference
├── app/
│   ├── api/
│   │   ├── download/[jobId]/route.ts  # HTTP 206 partial-range video/ZIP download
│   │   ├── export/route.ts            # Enqueue rendering job
│   │   ├── export/[jobId]/route.ts    # Poll job status, progress, logs
│   │   ├── import/route.ts            # YouTube metadata & multipart file upload
│   │   ├── transcribe/route.ts        # Whisper / VTT / Contextual speech transcription
│   │   ├── video/stream/route.ts      # HTTP 206 chunked video streaming for HTML5 player
│   │   └── waveform/route.ts          # 120-point audio peak generation
│   ├── globals.css                    # Tailwind CSS v4 dark design system & glow effects
│   ├── layout.tsx                     # Root HTML & Inter font layout
│   └── page.tsx                       # Master screen switcher (Steps 1 to 6)
├── bin/                               # Portable standalone binaries (ffmpeg, ffprobe, yt-dlp)
├── components/
│   ├── captions/                      # Caption styling & customization panels
│   ├── export/                        # Export settings & clip preview cards
│   ├── header/Header.tsx              # 6-step progress stepper & project navigation
│   ├── screens/                       # Workflow screen implementations (Screen1 to Screen6)
│   ├── sidebar/Sidebar.tsx            # Navigation sidebar & engine health indicator
│   ├── timeline/WaveformTimeline.tsx  # WaveSurfer interactive audio timeline
│   └── video/                         # Video player & 9:16 vertical short preview cards
├── lib/
│   ├── ffmpeg/                        # Inspector, paths, command processor, ASS subtitle builder
│   ├── transcription/                 # OpenAI Whisper client, VTT parser, mock speech generator
│   ├── youtube/                       # yt-dlp wrapper for metadata, video & subtitle downloads
│   └── utils.ts                       # Class names merger (cn) and timestamp formatters
├── public/samples/                    # Bundled demo video, thumbnails, and sample assets
├── stores/clipStore.ts                # Zustand global state store
├── temp/                              # Local scratchpad for uploads, audio, processed videos, jobs
├── types/index.ts                     # TypeScript data interfaces
├── workers/jobQueue.ts                # Async export queue & status manager
└── start.bat                          # 1-Click Windows development launcher
```

---

## 3. Workflow Screens (1 through 6)

| Step | Component | Responsibilities |
| :--- | :--- | :--- |
| **1. Import** | `Screen1Import.tsx` | Accepts YouTube URL, handles local file uploads, triggers probe, supports 1-click sample demo. |
| **2. Timeline** | `Screen2Timeline.tsx` | WaveSurfer waveform scrubbing, multi-clip range selection (Clips A, B, C with distinct colors), split, zoom. |
| **3. Captions** | `Screen3Captions.tsx` | Transcribes audio via Whisper/VTT, previews synchronized word highlighting, caption styling controls. |
| **4. Customize** | `Screen4Customize.tsx` | Interactive 9:16 preview with draggable caption bounding box, framing/zoom, background blur, safe areas. |
| **5. Export** | `Screen5Export.tsx` | Export format (MP4/WebM/MOV), resolution (720p/1080p/4K), FPS (30/60), individual vs. merged video. |
| **6. Download** | `Screen6DownloadCenter.tsx`| Live progress bar, streaming terminal logs, playable output cards, single clip & ZIP download buttons. |

---

## 4. Key Developer Rules & Conventions

1. **Windows Script Compatibility**:
   - In `.bat` or Windows automation scripts, never use bare parentheses inside `if (...)` blocks without proper escaping (`^)` or avoiding parentheses in `echo`).
   - Call `npm.cmd` explicitly instead of `npm` to bypass PowerShell script execution policy blocks.
2. **Video Streaming & Range Requests**:
   - HTML5 video elements require HTTP 206 Partial Content headers (`Accept-Ranges`, `Content-Range`) for scrubbing. Always route playback through `/api/video/stream?id=...`.
3. **FFmpeg Subtitle Encoding**:
   - Subtitles burned using the `-vf ass="..."` filter require ASS color format (`&HAABBGGRR&` where alpha is inverted and color order is Blue-Green-Red). Use `hexToAssColor()` in `lib/ffmpeg/subtitles.ts`.
4. **Temporary File Storage**:
   - Use `temp/uploads/`, `temp/audio/`, `temp/jobs/`, and `temp/processed/` for intermediate data.
   - Do not commit generated files to git (enforced by `.gitignore`).
5. **No Paywalls or SaaS Restrictions**:
   - ClipShort AI is designed to be 100% free and locally functional. Do not introduce artificial limits, credits, or mandatory paid APIs.

