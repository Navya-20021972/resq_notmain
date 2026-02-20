import os
import cv2
import uuid
from ultralytics import YOLO
from deepface import DeepFace
from django.conf import settings


def detect_person_in_video(missing_person, cctv_video):

    matches = []

    video_path = cctv_video.video.path
    photo_path = missing_person.photo.path

    if not os.path.exists(video_path):
        return []

    # Load YOLO
    model = YOLO("yolov8n.pt")

    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25

    sample_every = int(fps)  # 1 frame per second
    frame_number = 0
    max_frames = int(fps * 30)  # first 30 seconds

    while frame_number < max_frames:

        ret, frame = cap.read()
        if not ret:
            break

        if frame_number % sample_every == 0:

            results = model(frame, classes=[0], verbose=False)
            boxes = results[0].boxes

            if boxes is not None and len(boxes) > 0:

                for box in boxes:

                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())

                    crop = frame[
                        max(0, y1 - 20):min(frame.shape[0], y2 + 20),
                        max(0, x1 - 20):min(frame.shape[1], x2 + 20)
                    ]

                    if crop.size == 0:
                        continue

                    try:
                        faces = DeepFace.extract_faces(
                            img_path=crop,
                            detector_backend="opencv",
                            enforce_detection=False
                        )

                        for face in faces:

                            face_img = face["face"]
                            face_img = cv2.resize(face_img, (224, 224))

                            result = DeepFace.verify(
                                img1_path=photo_path,
                                img2_path=face_img,
                                model_name="ArcFace",
                                enforce_detection=False,
                                silent=True
                            )

                            distance = result.get("distance", 1.0)
                            threshold = result.get("threshold", 0.6)

                            # relaxed threshold for CCTV
                            if distance <= threshold * 1.30:

                                # Save frame image
                                frame_filename = f"detections/{uuid.uuid4()}.jpg"
                                full_path = os.path.join(settings.MEDIA_ROOT, frame_filename)

                                os.makedirs(os.path.dirname(full_path), exist_ok=True)
                                cv2.imwrite(full_path, frame)

                                matches.append({
                                    "confidence": float(1 - distance),
                                    "frame_number": frame_number,
                                    "timestamp_seconds": frame_number / fps,
                                    "frame_path": frame_filename,
                                })

                                cap.release()
                                return matches

                    except:
                        pass

        frame_number += 1

    cap.release()
    return matches
