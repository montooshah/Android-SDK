#!/usr/bin/env python3
"""Generate TTS narration and mux with demo video."""

import subprocess
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEMO_DIR = os.path.join(ROOT, "demo")
EDGE_TTS = os.path.expanduser("~/.local/bin/edge-tts")

SEGMENTS = [
    (0, "Meet NinjaParent — the command center for busy parents juggling school life across multiple kids and apps. Sarah has three children at two schools. Gmail, Spider, Parent Pay, and SIMS — all connected, all syncing."),
    (12, "Instead of 47 unread emails, she sees one prioritized queue. Our AI analyzes every message — deadlines, payments, registrations — and ranks what needs attention right now. Trip payment due tomorrow? That's number one."),
    (28, "Every card is actionable. Pay now. Register interest. Sign the permission slip. Each shows the child, the source app, the deadline, and why it's prioritized. No more hunting through newsletters for buried deadlines."),
    (45, "Filter by child instantly. Here's everything for Noah — his overdue maths homework, the science museum trip payment, parents' evening booking. One click, one view."),
    (58, "Filter by type — payments only, homework only, overdue items. Batch your Parent Pay tasks. Clear the homework queue. NinjaParent adapts to how you work."),
    (72, "Mark items complete as you go. Switch to Lily — coding club registration closing Friday, spellings due tomorrow. Every child, every school, one dashboard."),
    (85, "NinjaParent. School life, unified. Never miss what matters."),
]

VOICE = "en-GB-SoniaNeural"


def run(cmd, **kwargs):
    print("+", " ".join(cmd) if isinstance(cmd, list) else cmd)
    subprocess.run(cmd, check=True, **kwargs)


def get_duration(path):
    result = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration", "-of", "json", path],
        capture_output=True, text=True, check=True,
    )
    return float(json.loads(result.stdout)["format"]["duration"])


def generate_tts(text, output):
    run([EDGE_TTS, "--voice", VOICE, "--text", text, "--write-media", output])


def create_silence(seconds, output):
    run([
        "ffmpeg", "-y", "-f", "lavfi", "-i", f"anullsrc=r=24000:cl=mono",
        "-t", str(seconds), "-q:a", "9", output,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    os.makedirs(DEMO_DIR, exist_ok=True)
    work = os.path.join(DEMO_DIR, "tts-work")
    os.makedirs(work, exist_ok=True)

    concat_list = os.path.join(work, "concat.txt")
    parts = []
    cursor = 0.0

    for i, (target_start, text) in enumerate(SEGMENTS):
        seg_audio = os.path.join(work, f"seg_{i:02d}.mp3")
        generate_tts(text, seg_audio)
        dur = get_duration(seg_audio)

        if target_start > cursor:
            silence = os.path.join(work, f"silence_{i:02d}.mp3")
            create_silence(target_start - cursor, silence)
            parts.append(silence)

        parts.append(seg_audio)
        cursor = max(cursor, target_start) + dur

    with open(concat_list, "w") as f:
        for p in parts:
            f.write(f"file '{p}'\n")

    narration = os.path.join(DEMO_DIR, "narration.mp3")
    run([
        "ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", concat_list,
        "-c:a", "libmp3lame", "-q:a", "2", narration,
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    audio_dur = get_duration(narration)
    print(f"Narration duration: {audio_dur:.1f}s")

    video_in = os.path.join(DEMO_DIR, "ninjaparent-demo.mp4")
    if not os.path.exists(video_in):
        print(f"Missing {video_in} — record demo first")
        sys.exit(1)

    video_dur = get_duration(video_in)
    print(f"Video duration: {video_dur:.1f}s")

    # Extend video to match narration if needed
    extended_video = os.path.join(work, "extended.mp4")
    if audio_dur > video_dur:
        pad = audio_dur - video_dur + 0.5
        run([
            "ffmpeg", "-y", "-i", video_in,
            "-vf", f"tpad=stop_mode=clone:stop_duration={pad}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "23", "-pix_fmt", "yuv420p",
            "-an", extended_video,
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        video_src = extended_video
    else:
        video_src = video_in

    output = os.path.join(DEMO_DIR, "ninjaparent-demo-narrated.mp4")
    run([
        "ffmpeg", "-y",
        "-i", video_src,
        "-i", narration,
        "-c:v", "copy" if video_src == video_in else "libx264",
        "-c:a", "aac", "-b:a", "192k",
        "-map", "0:v:0", "-map", "1:a:0",
        "-shortest",
        output,
    ])

    print(f"Narrated video saved to {output}")


if __name__ == "__main__":
    main()
