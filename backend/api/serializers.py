from rest_framework import serializers
from .models import MissingPerson


class MissingPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissingPerson
        fields = "__all__"
        read_only_fields = ["reference_id", "status", "created_at"]
from rest_framework import serializers
from .models import (
    Student,
    MissingPerson,
    CCTVVideo,
    Detection
)

# -----------------------------
# 1. STUDENT SERIALIZER
# -----------------------------
from .models import Student

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = "__all__"



# -----------------------------
# 2. MISSING PERSON SERIALIZER
# -----------------------------
class MissingPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissingPerson
        fields = "__all__"
        read_only_fields = (
            "reference_id",
            "status",
            "created_at",
        )


# -----------------------------
# 3. CCTV VIDEO SERIALIZER
# -----------------------------
class CCTVVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CCTVVideo
        fields = "__all__"


# -----------------------------
# 4. DETECTION SERIALIZER
# -----------------------------
class DetectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Detection
        fields = "__all__"
        read_only_fields = (
            "confidence_score",
            "detected_face",
            "frame_number",
            "timestamp",
            "created_at",
        )
from rest_framework import serializers
from .models import CCTVVideo


class CCTVVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = CCTVVideo
        fields = [
            "id",
            "location",
            "video",
            "latitude",
            "longitude",
            "uploaded_at",
            "processed",
        ]
        read_only_fields = ["uploaded_at", "processed"]
