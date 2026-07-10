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
    (0, "Forty-seven school emails. Three kids. Two schools. NinjaParent turns that chaos into one AI-prioritized queue."),
    (8, "Connect Gmail and Outlook once — every newsletter, Parent Pay alert, and homework reminder flows in automatically."),
    (18, "The AI daily brief tells you what matters first. Not your inbox order — urgency, deadlines, and consequences."),
    (28, "Trip deposit due tomorrow — forty-five pounds, scored ninety-eight. Tap Pay now, or jump straight to the original email."),
    (40, "Filter by child or type. Everything for Noah — payments, homework, overdue — in one tap."),
    (50, "Mark items done as you go. Critical homework flagged before the teacher sends another reminder."),
    (58, "Gmail and Outlook stay connected with read-only access. Edit your children anytime — we match emails to the right kid."),
    (68, "Lily, Noah, Mia — each with their own school life, one dashboard in your pocket."),
    (76, "NinjaParent. School life, unified. Built with Cursor."),
]

VOICE = "en-GB-RyanNeural"
RATE = "+10%"


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
    run([EDGE_TTS, "--voice", VOICE, "--rate", RATE, "--text", text, "--write-media", output])


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

    extended_video = os.path.join(work, "extended.mp4")
    if audio_dur > video_dur:
        pad = audio_dur - video_dur + 0.5
        run([
            "ffmpeg", "-y", "-i", video_in,
            "-vf", f"tpad=stop_mode=clone:stop_duration={pad}",
            "-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p",
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
