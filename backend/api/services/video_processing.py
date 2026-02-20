import os
import cv2
from django.conf import settings


def extract_frames(cctv_video):
    """
    Extract 1 frame per second from CCTV video
    Save to: media/cctv_videos/frames/<video_id>/
    """

    video_path = cctv_video.video.path
    video_id = cctv_video.id

    output_dir = os.path.join(
        settings.MEDIA_ROOT,
        "cctv_videos",
        "frames",
        str(video_id)
    )
    os.makedirs(output_dir, exist_ok=True)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError("Could not open video file")

    fps = int(cap.get(cv2.CAP_PROP_FPS))
    frame_count = 0
    saved_frames = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        # Save 1 frame per second
        if frame_count % fps == 0:
            frame_name = f"frame_{saved_frames:05d}.jpg"
            frame_path = os.path.join(output_dir, frame_name)
            cv2.imwrite(frame_path, frame)
            saved_frames += 1

        frame_count += 1

    cap.release()
    return saved_frames
