import os
import cv2
import random
import base64
import numpy as np
from deepface import DeepFace
from scipy.spatial.distance import cosine
from ultralytics import YOLO
from django.conf import settings


# ==============================
# SETTINGS
# ==============================

POPULATION_SIZE = 20
GENERATIONS = 5
NUM_KEYFRAMES = 10
THRESHOLD = 0.35

DATABASE_PATH = os.path.join(settings.MEDIA_ROOT, "student_database")
YOLO_MODEL_PATH = os.path.join(settings.BASE_DIR, "best.pt")

# Load YOLO once
yolo_model = YOLO(YOLO_MODEL_PATH)


# ==============================
# IMAGE ENHANCEMENT
# ==============================

def enhance(img):
    img = cv2.convertScaleAbs(img, alpha=1.3, beta=20)
    kernel = np.array([[0,-1,0],[-1,5,-1],[0,-1,0]])
    img = cv2.filter2D(img,-1,kernel)
    return img


# ==============================
# FRAME DIFFERENCE
# ==============================

def frame_difference(f1, f2):
    h1 = cv2.calcHist([f1],[0,1,2],None,[8,8,8],[0,256]*3)
    h2 = cv2.calcHist([f2],[0,1,2],None,[8,8,8],[0,256]*3)
    cv2.normalize(h1,h1)
    cv2.normalize(h2,h2)
    return cv2.compareHist(h1,h2,cv2.HISTCMP_CORREL)


def fitness(candidate, frames):
    score = 0
    for i in range(len(candidate)-1):
        f1 = frames[candidate[i]]
        f2 = frames[candidate[i+1]]
        score += 1 - frame_difference(f1,f2)
    return score


def mutate(candidate, total_frames):
    idx = random.randint(0,len(candidate)-1)
    candidate[idx] = random.randint(0,total_frames-1)
    return candidate


# ==============================
# GA KEYFRAME SELECTION
# ==============================

def select_keyframes(frames):

    total_frames = len(frames)

    population = [
        random.sample(range(total_frames),NUM_KEYFRAMES)
        for _ in range(POPULATION_SIZE)
    ]

    for g in range(GENERATIONS):

        scores = [fitness(c,frames) for c in population]

        sorted_pop = [
            c for _,c in sorted(
                zip(scores,population),
                reverse=True
            )
        ]

        population = sorted_pop[:POPULATION_SIZE//2]

        new_pop = []

        while len(new_pop) < POPULATION_SIZE:

            p1,p2 = random.sample(population,2)

            cut = random.randint(1,NUM_KEYFRAMES-1)

            child = p1[:cut] + p2[cut:]

            if random.random() < 0.2:
                child = mutate(child,total_frames)

            new_pop.append(child)

        population = new_pop

    best = sorted(population,key=lambda c:fitness(c,frames),reverse=True)[0]

    return sorted(best)


# ==============================
# LOAD EMBEDDINGS FOR REPORTED STUDENT
# ==============================

def load_database(student_id):

    embeddings = []

    person_folder = os.path.join(DATABASE_PATH, str(student_id))

    if not os.path.exists(person_folder):
        return embeddings

    for img in os.listdir(person_folder):

        path = os.path.join(person_folder, img)

        try:

            emb = DeepFace.represent(
                img_path=path,
                model_name="ArcFace",
                detector_backend="skip",
                enforce_detection=False
            )[0]["embedding"]

            embeddings.append(emb)

        except:
            continue

    return embeddings


# ==============================
# FACE VALIDATION (NEW)
# ==============================

def is_real_face(face):

    try:

        faces = DeepFace.extract_faces(
            img_path=face,
            detector_backend="retinaface",
            enforce_detection=False
        )

        if len(faces) == 0:
            return False

        return True

    except:
        return False


# ==============================
# MAIN DETECTION FUNCTION
# ==============================

def detect_person_in_video(missing_person, cctv_video):

    student_id = missing_person.student_id

    db_embeddings = load_database(student_id)

    if len(db_embeddings) == 0:
        return []


    video_path = cctv_video.video.path

    cap = cv2.VideoCapture(video_path)

    frames = []
    frame_numbers = []

    frame_id = 0

    while True:

        ret,frame = cap.read()

        if not ret:
            break

        # sample frames (approx 1 fps for 30fps video)
        if frame_id % 30 == 0:

            frames.append(frame)
            frame_numbers.append(frame_id)

        frame_id += 1

    cap.release()

    if len(frames) == 0:
        return []


    keyframes = select_keyframes(frames)

    matches = []


    for k in keyframes:

        frame = frames[k]
        frame_no = frame_numbers[k]

        results = yolo_model(frame)

        boxes = results[0].boxes

        if len(boxes) == 0:
            continue


        for box in boxes.xyxy:

            x1,y1,x2,y2 = map(int,box)

            # ignore tiny detections
            if (x2-x1) < 80 or (y2-y1) < 80:
                continue

            face = frame[y1:y2,x1:x2]

            if face.size == 0:
                continue

            # NEW: verify face
            if not is_real_face(face):
                continue

            face = enhance(face)

            try:

                emb = DeepFace.represent(
                    img_path=face,
                    model_name="ArcFace",
                    detector_backend="skip",
                    enforce_detection=False
                )[0]["embedding"]

            except:
                continue


            best_score = 1

            for db_emb in db_embeddings:

                score = cosine(emb, db_emb)

                if score < best_score:
                    best_score = score


            if best_score < THRESHOLD:

                confidence = 1 - best_score

                annotated = frame.copy()

                cv2.rectangle(
                    annotated,
                    (x1,y1),
                    (x2,y2),
                    (0,255,0),
                    2
                )

                cv2.putText(
                    annotated,
                    f"ID {student_id} {confidence:.2f}",
                    (x1,y1-10),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.6,
                    (0,255,0),
                    2
                )

                frame_file = f"detections/frame_{frame_no}.jpg"
                frame_path = os.path.join(settings.MEDIA_ROOT, frame_file)
                os.makedirs(os.path.dirname(frame_path), exist_ok=True)
                cv2.imwrite(frame_path, annotated)

                face_file = f"detected_faces/face_{frame_no}.jpg"
                face_path = os.path.join(settings.MEDIA_ROOT, face_file)
                os.makedirs(os.path.dirname(face_path), exist_ok=True)
                cv2.imwrite(face_path, face)

                # Encode images as base64
                _, frame_buf = cv2.imencode('.jpg', annotated)
                frame_b64 = base64.b64encode(frame_buf).decode('utf-8')

                _, face_buf = cv2.imencode('.jpg', face)
                face_b64 = base64.b64encode(face_buf).decode('utf-8')

                matches.append({
                    'matched_student_id': student_id,
                    'confidence': confidence,
                    'frame_number': frame_no,
                    'timestamp_seconds': frame_no / 25.0,
                    'frame_path': frame_file,
                    'face_path': face_file,
                    'frame_b64': f'data:image/jpeg;base64,{frame_b64}',
                    'face_b64': f'data:image/jpeg;base64,{face_b64}',
                })


    total = len(matches)

    for i,m in enumerate(matches):
        m['sighting_number'] = i+1
        m['total_sightings'] = total

    return matches
