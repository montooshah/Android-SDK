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
    (0, "NinjaParent brings school life into one place. Connect Gmail and Outlook once — we read school emails and turn them into clear actions."),
    (9, "During setup, link the inboxes where newsletters and Parent Pay alerts actually land. Gmail for home, Outlook for work — both stay in sync."),
    (20, "Your Today view shows what matters now. Trip deposits, homework deadlines, and permission slips — ranked by urgency, not inbox order."),
    (32, "Filter by child or type. Here's everything for Noah — payments, homework, events — without digging through forty-seven unread emails."),
    (44, "Tap to mark items done as you go. One queue, one dashboard, every child and every school."),
    (52, "In Settings, Gmail and Outlook stay connected with read-only access. Your data stays yours — we never send on your behalf."),
    (63, "Switch between kids in a tap. Lily, Noah, Mia — each with their own school life, all in your pocket."),
    (72, "NinjaParent. School life, unified."),
]

VOICE = "en-GB-RyanNeural"
RATE = "+8%"


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
