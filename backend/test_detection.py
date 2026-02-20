"""
Test YOLOv8 + DeepFace detection pipeline.

Run:
  cd backend
  activate venv
  python test_detection.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'missing_student_tracker.settings')
django.setup()

from api.models import MissingPerson, CCTVVideo

print("=" * 65)
print("  YOLOV8 + DEEPFACE DETECTION TEST")
print("=" * 65)

# ------------------------------------------------------------------
# Pick first missing person and first CCTV video
# ------------------------------------------------------------------

mp = MissingPerson.objects.filter(photo__isnull=False).first()
video = CCTVVideo.objects.first()

if not mp:
    print("No missing person with photo")
    exit()

if not video:
    print("No CCTV video uploaded")
    exit()

print(f"\nMissing person : {mp.name}")
print(f"Photo          : {mp.photo.path}")
print(f"Photo exists   : {os.path.exists(mp.photo.path)}")

print(f"\nCCTV video     : {video.location}")
print(f"File           : {video.video.path}")
print(f"File exists    : {os.path.exists(video.video.path)}")

# ------------------------------------------------------------------
# Run detection
# ------------------------------------------------------------------

print("\n" + "-" * 65)
print("Running detection on first 30 seconds...")
print("-" * 65)

try:
    import cv2
    import numpy as np
    from ultralytics import YOLO
    from deepface import DeepFace

    # Load YOLO model
    model = YOLO("yolov8n.pt")

    cap = cv2.VideoCapture(video.video.path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25

    sample_every = max(1, int(fps))  # 1 frame per second
    max_frames = int(fps * 30)       # 30 seconds

    frame_num = 0
    found = False

    print(f"\n{'Frame':>7} {'Time':>7} {'Persons':>8} {'Model':>12} {'Dist':>8} {'Thresh':>8} {'Match':>7}")
    print("-" * 65)

    while frame_num < max_frames:

        ret, frame = cap.read()
        if not ret:
            break

        if frame_num % sample_every == 0:

            ts = frame_num / fps

            # Detect persons only (class 0)
            results = model(frame, classes=[0], verbose=False)
            boxes = results[0].boxes
            n_persons = len(boxes) if boxes is not None else 0

            if n_persons > 0:

                for box in boxes:

                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

                    # Add small margin
                    crop = frame[
                        max(0, y1 - 20):min(frame.shape[0], y2 + 20),
                        max(0, x1 - 20):min(frame.shape[1], x2 + 20)
                    ]

                    if crop.size == 0:
                        continue

                    try:
                        # Extract faces from cropped person
                        faces = DeepFace.extract_faces(
                            img_path=crop,
                            detector_backend="opencv",
                            enforce_detection=False
                        )

                        for face in faces:

                            face_img = face["face"]
                            face_img = cv2.resize(face_img, (224, 224))

                            # Try multiple strong models
                            for df_model in ["ArcFace", "Facenet512", "Facenet"]:

                                r = DeepFace.verify(
                                    img1_path=mp.photo.path,
                                    img2_path=face_img,
                                    model_name=df_model,
                                    enforce_detection=False,
                                    silent=True,
                                )

                                dist = r.get("distance", 1.0)
                                thresh = r.get("threshold", 0.6)

                                # Relax threshold slightly for CCTV blur
                                match = dist <= thresh * 1.25

                                status = "YES" if match else "no"

                                print(f"{frame_num:>7} {ts:>6.1f}s {n_persons:>8} {df_model:>12} {dist:>8.4f} {thresh:>8.4f} {status:>7}")

                                if match:
                                    found = True
                                    break

                            if found:
                                break

                    except Exception as e:
                        print("Face processing error")

                    if found:
                        break

            else:
                print(f"{frame_num:>7} {ts:>6.1f}s {n_persons:>8}")

        if found:
            break

        frame_num += 1

    cap.release()

    print("-" * 65)

    if found:
        print("\n✅ SUCCESS — Match detected!")
    else:
        print("\n❌ No match found.")
        print("Possible reasons:")
        print("  1. Face not clearly visible")
        print("  2. CCTV resolution too low")
        print("  3. Lighting difference")
        print("  4. Try increasing threshold multiplier to 1.35")

except Exception as e:
    import traceback
    print(f"\nTest failed: {e}")
    traceback.print_exc()

print("\n" + "=" * 65)
