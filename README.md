# ClipShort AI – Personal AI Video Clipper & Shorts Generator

A web-based AI Video Clipper and Short-Form Vertical Video Generator built with **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **FFmpeg**, and **OpenAI Whisper**.

> **Personal Use Only**: 100% free for local personal use. No subscriptions, credits, paywalls, or artificial limits.

---

## Key Features

1. **Screen 1: Import YouTube Video**
   - Instant YouTube URL metadata extraction using standalone `yt-dlp`.
   - Local video upload (.mp4, .mov, .mkv).
   - 1-click sample demo video preview ("How I Built a Scalable Product with AI (Full Talk)" by Tech With Anshul).
   - High-fidelity preview card showing thumbnail, duration, resolution (16:9), and audio/video badges.

2. **Screen 2: Video Timeline Editor**
   - Synchronized HTML5 video player with time scrubbing.
   - Interactive audio waveform timeline with time rulers (00:00, 02:30, ...).
   - Multi-clip draggable & resizable selection boxes labeled A (Purple), B (Sky Blue), C (Emerald Green).
   - Add clip, Split at playhead, Delete, Zoom in/out, and Fit controls.
   - Selected Clips cards with duration, start/end timestamps, and editable titles.

3. **Screen 3: AI Captions & Clip Previews**
   - AI transcription powered by OpenAI Whisper (with intelligent local speech timing fallback).
   - Side-by-side vertical 9:16 video cards for each selected clip.
   - Live synchronized word-highlighted captions overlaid on 9:16 video frames.
   - Caption Settings panel: Styles (Default, Bold, Highlight, Minimal), Fonts (Inter, Outfit, Montserrat, Roboto, Arial), Text size slider, Text color swatches, Highlight styles, and Top/Center/Bottom positioning.

4. **Screen 4: Customize Your Shorts**
   - Fine-tune captions, framing, and visual style for each clip.
   - Interactive 9:16 preview with draggable caption bounding box and corner resize handles.
   - Tabbed customizer:
     - **Captions**: Styles, Fonts, Size, Text Color, Highlight Color, Background styling, AI auto word highlight toggle, punch-in zoom toggle, remove silence toggle.
     - **Video**: 9:16 Center Crop, Face Tracking, Zoom Scale (1.0x - 2.0x), Pan X/Y offset, background blur.
     - **Layout**: Safe areas for TikTok, Instagram Reels, and YouTube Shorts.
     - **Branding**: Watermark / Creator handle overlay, animated progress bar.

5. **Screen 5: Export Settings**
   - Individual Clips export or Merged Single Video option.
   - Formats: MP4 (H.264 / AAC), WebM, MOV.
   - Aspect ratios: 9:16 Vertical Shorts, 16:9 Landscape, 1:1 Square.
   - Resolutions: 720p HD, 1080p Full HD, 4K Ultra HD (100% unlocked, no paywall).
   - Frame rates: 30 FPS, 60 FPS.
   - Hardcoded subtitles toggle (burned directly into video frames with FFmpeg ASS filters).
   - Real-time estimated output file size and processing duration.

6. **Screen 6: Export Progress & Download Center**
   - Real-time FFmpeg encoding progress bar and status stage indicators.
   - Collapsible terminal viewer with real-time FFmpeg console logs.
   - Rendered video cards with playable 9:16 preview and direct MP4 download buttons.
   - 1-click "Download All (ZIP Archive)" button.
   - "Create Another Project" to instantly start a new clipping session.

---

## Project Structure

```text
yt-clip/
├── app/
│   ├── api/
│   │   ├── download/[jobId]/route.ts  # MP4 and ZIP downloads
│   │   ├── export/route.ts            # Start export job
│   │   ├── export/[jobId]/route.ts    # Poll job status & progress
│   │   ├── import/route.ts            # YouTube metadata & file uploads
│   │   ├── transcribe/route.ts        # Whisper speech-to-text
│   │   └── waveform/route.ts          # Audio waveform peak extraction
│   ├── globals.css                    # Dark theme design system & glow effects
│   ├── layout.tsx                     # Inter font & app layout
│   └── page.tsx                       # Single-page multi-screen workflow coordinator
├── bin/                               # Portable standalone binaries
│   ├── ffmpeg.exe                     # Local FFmpeg engine
│   ├── ffprobe.exe                    # Local FFprobe engine
│   └── yt-dlp.exe                     # YouTube video & metadata extractor
├── components/
│   ├── captions/                      # Caption editor components
│   ├── export/                        # Export settings & cards
│   ├── header/Header.tsx              # 5-step stepper navigation & user profile
│   ├── screens/                       # 6 Workflow screens
│   │   ├── Screen1Import.tsx
│   │   ├── Screen2Timeline.tsx
│   │   ├── Screen3Captions.tsx
│   │   ├── Screen4Customize.tsx
│   │   ├── Screen5Export.tsx
│   │   └── Screen6DownloadCenter.tsx
│   ├── sidebar/Sidebar.tsx            # Left navigation & local engine status
│   ├── timeline/WaveformTimeline.tsx  # WaveSurfer interactive waveform
│   └── video/                         # Video player & 9:16 preview cards
├── lib/
│   ├── ffmpeg/                        # Processor, paths & ASS subtitle generator
│   ├── transcription/                 # OpenAI Whisper & speech generator
│   ├── youtube/                       # YouTube metadata & download service
│   └── utils.ts                       # Class names & time formatters
├── stores/clipStore.ts                # Zustand global state management
├── types/index.ts                     # TypeScript definitions
├── workers/jobQueue.ts                # Background FFmpeg export worker queue
├── public/samples/                    # Pre-generated demo video and thumbnails
└── temp/                              # Local temporary working directory
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v24)
- **Local binaries**: FFmpeg, FFprobe, and yt-dlp are bundled locally inside the `bin/` directory.

### 2. Environment Setup
Copy the example environment file:
```bash
cp .env.example .env.local
```
*(Optional)* Add your OpenAI API key for real Whisper speech-to-text:
```env
OPENAI_API_KEY=sk-...
```
> If no API key is provided, ClipShort AI automatically uses its intelligent local speech timing engine, so you can explore all subtitle styles, animations, and exports offline.

### 3. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 100% Local & Free Architecture
- No SaaS accounts or authentication required.
- No payment processing, subscription banners, or credit limitations.
- All video clipping, ASS subtitle generation, audio extraction, and MP4 encoding run locally on your machine via FFmpeg.
