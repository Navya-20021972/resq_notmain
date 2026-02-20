import os
from django.conf import settings


def recognize_face(missing_person, detection):
    """
    Compare detected face with missing person's reference image
    """

    # 🚨 Import INSIDE function (VERY IMPORTANT)
    from deepface import DeepFace

    reference_image = missing_person.photo.path
    detected_face = os.path.join(
        settings.MEDIA_ROOT,
        detection.detected_face.name
    )

    if not os.path.exists(reference_image) or not os.path.exists(detected_face):
        return None

    try:
        result = DeepFace.verify(
            img1_path=reference_image,
            img2_path=detected_face,
            model_name="ArcFace",     # Best for CCTV
            detector_backend="retinaface",
            enforce_detection=False
        )

        confidence = (1 - result["distance"]) * 100

        return {
            "verified": result["verified"],
            "confidence": round(confidence, 2)
        }

    except Exception as e:
        return {
            "verified": False,
            "confidence": 0,
            "error": str(e)
        }
