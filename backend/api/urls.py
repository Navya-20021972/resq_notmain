from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    StudentViewSet,
    MissingPersonViewSet,
    admin_login,
    process_cctv_video,
    run_face_detection,
    get_reference_by_email,
    get_report_by_reference,
    admin_dashboard,
    submit_missing_person,
    check_status,
    admin_get_reports,
    admin_dashboard_stats,
    admin_update_status,
    admin_add_student,
    admin_get_students,
    admin_upload_cctv,
    admin_get_cctv_videos,
    admin_delete_cctv,
    admin_run_detection,
    admin_get_detections,
)

router = DefaultRouter()
router.register(r"students", StudentViewSet)
router.register(r"missing-persons", MissingPersonViewSet)

urlpatterns = [

    # ===== AUTH =====
    path("admin/login/",                                        admin_login),

    # ===== LEGACY =====
    path("cctv/<int:video_id>/process/",                        process_cctv_video),
    path("detect/<int:missing_person_id>/<int:video_id>/",      run_face_detection),

    # ===== USER =====
    path("submit-missing-person/",                              submit_missing_person),
    path("get-reference-by-email/<str:email>/",                 get_reference_by_email),
    path("reports/<uuid:reference_id>/",                        get_report_by_reference),
    path("check-status/<str:reference_id>/",                    check_status),

    # ===== DASHBOARD =====
    path("admin/dashboard/",                                    admin_dashboard),
    path("admin/dashboard-stats/",                              admin_dashboard_stats),

    # ===== REPORTS =====
    path("admin/get-reports/",                                  admin_get_reports),
    path("admin/update-status/<str:reference_id>/",             admin_update_status),
    path("admin/update-report-status/",                         admin_update_status),

    # ===== STUDENTS =====
    path("admin/add-student/",                                  admin_add_student),
    path("admin/get-students/",                                 admin_get_students),

    # ===== CCTV =====
    path("admin/cctv/upload/",                                  admin_upload_cctv),
    path("admin/upload-cctv/",                                  admin_upload_cctv),
    path("admin/get-cctv-videos/",                              admin_get_cctv_videos),
    path("admin/delete-cctv/<int:video_id>/",                   admin_delete_cctv),

    # ===== DETECTION =====
    # This is what UploadCCTV.jsx calls:  POST /api/admin/run-detection/
    # body: { report_id: "uuid", video_id: 2 }
    path("admin/run-detection/",                                admin_run_detection),
    path("admin/run-detection/<str:reference_id>/",             admin_run_detection),
    path("admin/process-detection/<str:reference_id>/",         admin_run_detection),
    path("admin/detections/",                                   admin_get_detections),

    # ===== VIEWSETS =====
    path("", include(router.urls)),
]