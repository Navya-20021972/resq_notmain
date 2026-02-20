import uuid
from django.db import models
from django.contrib.auth import get_user_model


class Student(models.Model):
    student_id = models.CharField(max_length=50, unique=True)
    full_name = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    photo = models.ImageField(upload_to="students/")

    def __str__(self):
        return self.full_name


class MissingPerson(models.Model):
    reference_id = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True
    )

    name = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True)  # Added blank=True
    dress_code = models.CharField(max_length=200)
    last_seen_location = models.CharField(max_length=200)

    is_outsider = models.BooleanField(default=False)
    photo = models.ImageField(upload_to="missing_persons/")

    email = models.EmailField()
    status = models.CharField(
        max_length=50,
        default="Pending Investigation"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.reference_id}"

class CCTVVideo(models.Model):
    location = models.CharField(max_length=200)
    video = models.FileField(upload_to='cctv_videos/')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    missing_person = models.ForeignKey(
        "MissingPerson",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Select missing person to detect"
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed = models.BooleanField(default=False)

    def __str__(self):
        return f"CCTV @ {self.location}"

    
# -----------------------------
# 4. DETECTION RESULTS
class Detection(models.Model):
    missing_person = models.ForeignKey(
        MissingPerson,
        on_delete=models.CASCADE,
        related_name="detections"
    )

    cctv_video = models.ForeignKey(
        CCTVVideo,
        on_delete=models.CASCADE
    )

    detected_face = models.ImageField(upload_to="detected_faces/")

    # 🔹 Face recognition results
    confidence_score = models.FloatField(default=0)
    is_match = models.BooleanField(default=False)

    frame_number = models.IntegerField()
    timestamp = models.DateTimeField()

    location = models.CharField(max_length=200)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Detection {self.id} - {self.confidence_score}%"

# -----------------------------
# 5. ADMIN PROFILE (OPTIONAL)
# -----------------------------
User = get_user_model()

class AdminUser(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return self.user.username