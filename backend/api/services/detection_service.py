import os
import cv2
import uuid
import random
import logging
import numpy as np
from ultralytics import YOLO
from deepface import DeepFace
from scipy.spatial.distance import cosine
from django.conf import settings

logger = logging.getLogger(__name__)

# ----- GA SETTINGS -----
POPULATION_SIZE = 20
GENERATIONS = 5
MUTATION_RATE = 0.1
NUM_KEYFRAMES = 10
COSINE_THRESHOLD = 0.25  # stricter threshold — lower = harder to match

# YOLO class 0 = "person" in COCO dataset
YOLO_PERSON_CLASS = 0


def _frame_difference_score(f1, f2):
    """Compare two frames using color histogram correlation."""
    h1 = cv2.calcHist([f1], [0, 1, 2], None, [8, 8, 8], [0, 256] * 3)
    h2 = cv2.calcHist([f2], [0, 1, 2], None, [8, 8, 8], [0, 256] * 3)
    cv2.normalize(h1, h1)
    cv2.normalize(h2, h2)
    return cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL)


def _mutate(candidate, total_frames):
    """Randomly mutate one keyframe index."""
    if random.random() < MUTATION_RATE:
        idx = random.randint(0, len(candidate) - 1)
        candidate[idx] = random.randint(0, total_frames - 1)
    return candidate


def _fitness(candidate, all_frames):
    """Fitness = sum of dissimilarity between consecutive keyframes."""
    score = 0
    for i in range(len(candidate) - 1):
        f1 = all_frames[candidate[i]]
        f2 = all_frames[candidate[i + 1]]
        score += 1 - _frame_difference_score(f1, f2)
    return score


def _select_keyframes_ga(all_frames, num_keyframes):
    """Use a Genetic Algorithm to pick the most diverse keyframes."""
    frame_count = len(all_frames)
    if frame_count == 0:
        return []

    nk = min(num_keyframes, frame_count)

    population = [
        random.sample(range(frame_count), nk)
        for _ in range(POPULATION_SIZE)
    ]

    for _ in range(GENERATIONS):
        fitness_scores = [_fitness(c, all_frames) for c in population]
        sorted_pop = [
            c for _, c in sorted(
                zip(fitness_scores, population), reverse=True
            )
        ]
        population = sorted_pop[: POPULATION_SIZE // 2]

        new_population = []
        while len(new_population) < POPULATION_SIZE:
            parents = random.sample(population, 2)
            cross_point = random.randint(1, nk - 1)
            child = parents[0][:cross_point] + parents[1][cross_point:]
            child = _mutate(child, frame_count)
            new_population.append(child)
        population = new_population

    best = sorted(
        population,
        key=lambda c: _fitness(c, all_frames),
        reverse=True,
    )[0]
    return sorted(best)


def _get_face_embedding(image_path, is_reference=False):
    """
    Extract FaceNet embedding using DeepFace WITH actual face detection.
    - Uses 'opencv' detector to verify a real human face exists.
    - Returns None if no face is found (rejects diagrams, random objects).
    """
    try:
        result = DeepFace.represent(
            img_path=image_path,
            model_name="Facenet",
            detector_backend="opencv",   # ACTUALLY detect faces, don't skip
            enforce_detection=True,       # REJECT if no face found
        )
        if not result:
            return None
        return result[0]["embedding"]
    except Exception as e:
        if is_reference:
            logger.warning(f"No face detected in reference photo: {e}")
        else:
            logger.debug(f"No face in crop {image_path}: {e}")
        return None


def detect_person_in_video(missing_person, cctv_video):
    """
    Full detection pipeline:
    1. Load video frames
    2. GA-based keyframe selection
    3. YOLO person detection on keyframes (filter to person class only)
    4. DeepFace face detection on person crops (rejects non-face regions)
    5. FaceNet embedding + cosine distance matching (strict threshold)
    """
    matches = []

    video_path = str(cctv_video.video.path)
    photo_path = str(missing_person.photo.path)

    if not os.path.exists(video_path):
        logger.warning(f"Video not found: {video_path}")
        return []

    if not os.path.exists(photo_path):
        logger.warning(f"Photo not found: {photo_path}")
        return []

    # --- Load YOLO model ---
    model_path = os.path.join(settings.BASE_DIR, "yolov8n.pt")
    if not os.path.exists(model_path):
        model_path = "yolov8n.pt"
    model = YOLO(model_path)

    # --- Get reference face embedding (with real face detection) ---
    ref_embedding = _get_face_embedding(photo_path, is_reference=True)
    if ref_embedding is None:
        logger.error("Reference photo has no detectable human face — aborting.")
        return []

    logger.info("Reference face embedding generated successfully.")

    # --- Load all video frames ---
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 25
    all_frames = []
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        all_frames.append(frame)
    cap.release()

    frame_count = len(all_frames)
    if frame_count == 0:
        logger.warning("Video has no frames.")
        return []

    logger.info(f"Loaded {frame_count} frames from video.")

    # --- GA keyframe selection ---
    keyframe_indices = _select_keyframes_ga(all_frames, NUM_KEYFRAMES)
    logger.info(f"Selected {len(keyframe_indices)} keyframes via GA.")

    # --- Ensure output dirs ---
    detected_faces_dir = os.path.join(settings.MEDIA_ROOT, "detected_faces")
    detections_dir = os.path.join(settings.MEDIA_ROOT, "detections")
    os.makedirs(detected_faces_dir, exist_ok=True)
    os.makedirs(detections_dir, exist_ok=True)

    # --- Process each keyframe ---
    for keyframe_idx in keyframe_indices:
        frame = all_frames[keyframe_idx]
        results = model(frame, verbose=False)

        boxes = results[0].boxes
        for i, box in enumerate(boxes.xyxy):
            # FIX 1: Only process "person" detections (class 0), skip cars/objects
            cls_id = int(boxes.cls[i])
            if cls_id != YOLO_PERSON_CLASS:
                continue

            x1, y1, x2, y2 = map(int, box)

            # Clamp to frame bounds
            h, w = frame.shape[:2]
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            person_crop = frame[y1:y2, x1:x2]
            if person_crop.size == 0:
                continue

            # Save person crop temporarily
            face_filename = f"detected_faces/{uuid.uuid4()}.jpg"
            face_full_path = os.path.join(settings.MEDIA_ROOT, face_filename)
            cv2.imwrite(face_full_path, person_crop)

            # FIX 2: Use real face detection — rejects crops with no face
            det_emb = _get_face_embedding(face_full_path)
            if det_emb is None:
                # No face found in this person crop — clean up and skip
                try:
                    os.remove(face_full_path)
                except OSError:
                    pass
                continue

            # FIX 3: Strict cosine distance matching
            distance = cosine(det_emb, ref_embedding)
            logger.debug(
                f"Keyframe {keyframe_idx}: cosine distance = {distance:.4f}"
            )

            if distance < COSINE_THRESHOLD:
                # Save the annotated frame
                annotated = frame.copy()
                cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 0, 255), 2)
                frame_filename = f"detections/{uuid.uuid4()}.jpg"
                frame_full_path = os.path.join(
                    settings.MEDIA_ROOT, frame_filename
                )
                cv2.imwrite(frame_full_path, annotated)

                confidence = float(1 - distance)
                logger.info(
                    f"MATCH at keyframe {keyframe_idx} "
                    f"(confidence={confidence:.3f}, distance={distance:.4f})"
                )

                matches.append({
                    "confidence": confidence,
                    "frame_number": keyframe_idx,
                    "timestamp_seconds": keyframe_idx / fps,
                    "frame_path": frame_filename,
                    "face_path": face_filename,
                })
            else:
                # Not a match — clean up the saved crop
                try:
                    os.remove(face_full_path)
                except OSError:
                    pass

    return matches
