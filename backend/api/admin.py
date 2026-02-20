from django.contrib import admin
from .models import (
    Student,
    MissingPerson,
    CCTVVideo,
    Detection,
    AdminUser
)

# -----------------------------
# STUDENT ADMIN
# -----------------------------
from django.contrib import admin
from .models import Student

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("student_id", "full_name", "department")
    list_filter = ("department",)
    search_fields = ("student_id", "full_name")


# -----------------------------
# MISSING PERSON ADMIN
# -----------------------------
@admin.register(MissingPerson)
class MissingPersonAdmin(admin.ModelAdmin):
    list_display = (
        'reference_id',
        'name',
        'department',
        'status',
        'email',
        'is_outsider',
        'created_at',
    )

    list_filter = (
        'status',
        'department',
        'is_outsider',
        'created_at',
    )

    search_fields = (
        'reference_id',
        'name',
        'email',
        'last_seen_location',
    )

    readonly_fields = (
        'reference_id',
        'created_at',
    )

    ordering = ('-created_at',)


# -----------------------------
# CCTV VIDEO ADMIN
# -----------------------------
@admin.register(CCTVVideo)
class CCTVVideoAdmin(admin.ModelAdmin):
    list_display = ('location', 'uploaded_at', 'processed')
    list_filter = ('processed', 'uploaded_at')
    search_fields = ('location',)
    ordering = ('-uploaded_at',)


# -----------------------------
# DETECTION ADMIN (READ-ONLY)
# -----------------------------
@admin.register(Detection)
class DetectionAdmin(admin.ModelAdmin):
    list_display = (
        "missing_person",
        "location",
        "confidence_score",
        "is_match",
        "timestamp",
    )

    list_filter = ("is_match", "location")

    readonly_fields = (
        "missing_person",
        "cctv_video",
        "detected_face",
        "confidence_score",
        "is_match",
        "frame_number",
        "timestamp",
        "location",
        "latitude",
        "longitude",
        "created_at",
    )



# -----------------------------
# ADMIN USER PROFILE
# -----------------------------
@admin.register(AdminUser)
class AdminUserAdmin(admin.ModelAdmin):
    list_display = ('user', 'phone')
    search_fields = ('user__username', 'user__email', 'phone')
