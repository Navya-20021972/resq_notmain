"""
LOCATION: api/views.py
"""
import os
import datetime
import traceback
import logging

from django.contrib.auth import authenticate
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser

from .models import Student, MissingPerson, CCTVVideo, Detection
from .serializers import StudentSerializer, MissingPersonSerializer

logger = logging.getLogger(__name__)


# =====================================================
# VIEWSETS
# =====================================================

class StudentViewSet(ModelViewSet):
    queryset         = Student.objects.all()
    serializer_class = StudentSerializer
    parser_classes   = (MultiPartParser, FormParser)


class MissingPersonViewSet(viewsets.ModelViewSet):
    queryset         = MissingPerson.objects.all()
    serializer_class = MissingPersonSerializer

    @action(detail=False, methods=["get"], url_path="by-reference/(?P<ref_id>[^/.]+)")
    def get_by_reference(self, request, ref_id=None):
        try:
            obj = MissingPerson.objects.get(reference_id=ref_id)
            return Response(self.get_serializer(obj).data)
        except MissingPerson.DoesNotExist:
            return Response({"error": "Not found"}, status=404)


# =====================================================
# ADMIN LOGIN
# =====================================================

@api_view(["POST"])
def admin_login(request):
    user = authenticate(
        request=request,
        username=request.data.get("username"),
        password=request.data.get("password"),
    )
    if user and user.is_staff:
        return Response({"success": True, "username": user.username})
    return Response({"success": False, "error": "Invalid credentials"}, status=401)


# =====================================================
# LEGACY ENDPOINTS (kept intact)
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def process_cctv_video(request, video_id):
    try:
        from .services.video_processing import extract_frames
        video = CCTVVideo.objects.get(id=video_id)
        if video.processed:
            return Response({"message": "Already processed"}, status=400)
        video.processed = True
        video.save()
        return Response({"message": "Done", "frames_saved": extract_frames(video)})
    except CCTVVideo.DoesNotExist:
        return Response({"error": "Video not found"}, status=404)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def run_face_detection(request, missing_person_id, video_id):
    try:
        from .services.detection_service import detect_faces_from_frames
        mp    = MissingPerson.objects.get(id=missing_person_id)
        video = CCTVVideo.objects.get(id=video_id)
        for r in detect_faces_from_frames(mp, video):
            Detection.objects.create(
                missing_person=mp, cctv_video=video,
                detected_face=r["image_path"], confidence_score=r["confidence"],
                timestamp=video.uploaded_at, location=video.location,
                latitude=video.latitude, longitude=video.longitude,
            )
        return Response({"message": "Done"})
    except MissingPerson.DoesNotExist:
        return Response({"error": "Person not found"}, status=404)
    except CCTVVideo.DoesNotExist:
        return Response({"error": "Video not found"}, status=404)


# =====================================================
# USER SIDE
# =====================================================

@api_view(["GET"])
def get_reference_by_email(request, email):
    return Response({
        "references": [str(r.reference_id) for r in MissingPerson.objects.filter(email=email)]
    })


@api_view(["GET"])
def get_report_by_reference(request, reference_id):
    try:
        return Response(MissingPersonSerializer(MissingPerson.objects.get(reference_id=reference_id)).data)
    except MissingPerson.DoesNotExist:
        return Response({"error": "Invalid reference ID"}, status=404)


@api_view(["GET"])
def admin_dashboard(request):
    recent = MissingPerson.objects.order_by("-created_at")[:10]
    return Response({
        "stats": {
            "total_reports": MissingPerson.objects.count(),
            "pending":       MissingPerson.objects.filter(status="Pending Investigation").count(),
            "processing":    MissingPerson.objects.filter(status="Processing").count(),
            "found":         MissingPerson.objects.filter(status="Detected").count(),
        },
        "recent_reports": MissingPersonSerializer(recent, many=True).data,
    })


# =====================================================
# SUBMIT MISSING PERSON
# =====================================================

@api_view(["POST"])
@permission_classes([])
def submit_missing_person(request):
    try:
        name                  = (request.data.get("name")               or "").strip()
        student_id            = (request.data.get("studentId")          or request.data.get("student_id") or "").strip()
        dress_code            = (request.data.get("dressCode")          or "").strip()
        department            = (request.data.get("department")         or "").strip()
        is_outsider           = str(request.data.get("isOutsider", "false")).lower() in ("true", "1", "yes")
        last_seen_location    = (request.data.get("lastSeenLocation")   or "").strip()
        last_seen_location_id = (request.data.get("lastSeenLocationId") or "").strip()
        latitude_raw          =  request.data.get("latitude")
        longitude_raw         =  request.data.get("longitude")
        submitter_email       = (request.data.get("submitterEmail")     or "").strip()
        photo                 = request.FILES.get("photo")

        if not name:               return Response({"error": "Name is required"}, status=400)
        if not submitter_email:    return Response({"error": "Email is required"}, status=400)
        if not last_seen_location: return Response({"error": "Location is required"}, status=400)

        mp = MissingPerson.objects.create(
            name=name, student_id=student_id or None, dress_code=dress_code, department=department,
            is_outsider=is_outsider,
            last_seen_location=last_seen_location,
            last_seen_location_id=last_seen_location_id or None,
            latitude=float(latitude_raw)   if latitude_raw   else None,
            longitude=float(longitude_raw) if longitude_raw  else None,
            email=submitter_email, photo=photo,
            status="Pending Investigation",
        )
        return Response({
            "reference_id":          str(mp.reference_id),
            "name":                  mp.name,
            "student_id":            mp.student_id,
            "department":            mp.department,
            "dress_code":            mp.dress_code,
            "last_seen_location":    mp.last_seen_location,
            "last_seen_location_id": mp.last_seen_location_id,
            "is_outsider":           mp.is_outsider,
            "status":                mp.status,
            "email":                 mp.email,
            "photo":                 mp.photo.url if mp.photo else None,
            "created_at":            mp.created_at.isoformat(),
        }, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# =====================================================
# CHECK STATUS
# =====================================================

@api_view(["GET"])
@permission_classes([])
def check_status(request, reference_id):
    try:
        import base64
        logger.info(f"[check_status] Looking up reference_id: {reference_id}")
        
        mp         = MissingPerson.objects.get(reference_id=reference_id)
        logger.info(f"[check_status] Found person: {mp.name}")
        
        detections = Detection.objects.filter(missing_person=mp, is_match=True).order_by("-created_at")
        logger.info(f"[check_status] Found {detections.count()} detections")

        detected_locs = []
        for d in detections:
            obj = {
                "location":   d.location or "Unknown",
                "timestamp":  d.timestamp.isoformat() if d.timestamp else d.created_at.isoformat(),
                "confidence": float(d.confidence_score),
                "latitude":   d.latitude,
                "longitude":  d.longitude,
                "frame":      request.build_absolute_uri(d.detected_face.url) if d.detected_face else None,
            }
            
            # Encode detected face image as base64
            if d.detected_face and d.detected_face.name:
                try:
                    face_path = os.path.join(settings.MEDIA_ROOT, d.detected_face.name)
                    logger.info(f"[check_status] Looking for face at: {face_path}")
                    if os.path.exists(face_path):
                        with open(face_path, 'rb') as f:
                            face_b64 = base64.b64encode(f.read()).decode('utf-8')
                            obj['face_b64'] = f'data:image/jpeg;base64,{face_b64}'
                            logger.info(f"[check_status] Successfully encoded face image")
                    else:
                        logger.warning(f"[check_status] Face file not found at: {face_path}")
                except Exception as ex:
                    logger.error(f"[check_status] Error encoding face image: {ex}", exc_info=True)
            
            detected_locs.append(obj)

        logger.info(f"[check_status] Returning response with {len(detected_locs)} detection locations")
        
        return Response({
            "reference_id":       str(mp.reference_id),
            "name":               mp.name,
            "student_id":         mp.student_id,
            "status":             mp.status,
            "last_seen_location": mp.last_seen_location,
            "found_location":     mp.found_location,
            "found_location_id":  mp.found_location_id,
            "found_at":           mp.found_at.isoformat() if mp.found_at else None,
            "message":            f"Current status: {mp.status}",
            "detected_locations": detected_locs,
        })
    except MissingPerson.DoesNotExist as nf:
        logger.warning(f"[check_status] Reference not found: {reference_id}")
        return Response({"error": "Not found"}, status=404)
    except Exception as e:
        logger.error(f"[check_status] Unexpected error: {e}\n{traceback.format_exc()}")
        return Response({"error": str(e), "trace": traceback.format_exc()}, status=500)


# =====================================================
# ADMIN STATS
# =====================================================

@api_view(["GET"])
@permission_classes([])
def admin_dashboard_stats(request):
    try:
        all_r  = MissingPerson.objects.all()
        recent = all_r.order_by("-created_at")[:10]

        def row(mp):
            return {
                "reference_id":          str(mp.reference_id),
                "name":                  mp.name,
                "student_id":            mp.student_id,
                "department":            mp.department,
                "status":                mp.status,
                "is_outsider":           mp.is_outsider,
                "photo":                 mp.photo.url if mp.photo else None,
                "created_at":            mp.created_at.isoformat(),
                "last_seen_location":    mp.last_seen_location,
                "last_seen_location_id": mp.last_seen_location_id,
                "found_location":        mp.found_location,
                "found_at":              mp.found_at.isoformat() if mp.found_at else None,
                "email":                 mp.email,
                "dress_code":            mp.dress_code,
            }

        return Response({
            "stats": {
                "total_reports":  all_r.count(),
                "pending":        all_r.filter(status="Pending Investigation").count(),
                "processing":     all_r.filter(status="Processing").count(),
                "found":          all_r.filter(status="Detected").count(),
                "completed":      all_r.filter(status="Completed").count(),
                "total_students": Student.objects.count(),
                "total_videos":   CCTVVideo.objects.count(),
            },
            "recent_reports": [row(mp) for mp in recent],
        })
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# =====================================================
# ADMIN — GET ALL REPORTS
# =====================================================

@api_view(["GET"])
@permission_classes([])
def admin_get_reports(request):
    try:
        return Response([{
            "reference_id":          str(mp.reference_id),
            "name":                  mp.name,
            "student_id":            mp.student_id,
            "department":            mp.department,
            "status":                mp.status,
            "is_outsider":           mp.is_outsider,
            "photo":                 mp.photo.url if mp.photo else None,
            "created_at":            mp.created_at.isoformat(),
            "last_seen_location":    mp.last_seen_location,
            "last_seen_location_id": mp.last_seen_location_id,
            "found_location":        mp.found_location,
            "found_location_id":     mp.found_location_id,
            "found_at":              mp.found_at.isoformat() if mp.found_at else None,
            "email":                 mp.email,
            "dress_code":            mp.dress_code,
        } for mp in MissingPerson.objects.all().order_by("-created_at")])
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# =====================================================
# ADMIN — UPDATE STATUS
# =====================================================

@api_view(["POST", "PATCH"])
@permission_classes([])
def admin_update_status(request, reference_id=None):
    try:
        ref        = reference_id or request.data.get("report_id") or request.data.get("reference_id")
        new_status = request.data.get("status", "").strip()
        if not ref:        return Response({"error": "reference_id required"}, status=400)
        if not new_status: return Response({"error": "status required"}, status=400)

        mp = MissingPerson.objects.get(reference_id=ref)
        mp.status = new_status

        if new_status in ("Detected", "Found", "found"):
            if request.data.get("found_location"):    mp.found_location    = request.data["found_location"]
            if request.data.get("found_location_id"): mp.found_location_id = request.data["found_location_id"]
            try:
                raw     = request.data.get("found_at")
                mp.found_at = datetime.datetime.fromisoformat(raw) if raw else datetime.datetime.now()
            except Exception:
                mp.found_at = datetime.datetime.now()
        mp.save()

        return Response({
            "message":           "Status updated",
            "reference_id":      str(mp.reference_id),
            "status":            mp.status,
            "found_location":    mp.found_location,
            "found_location_id": mp.found_location_id,
            "found_at":          mp.found_at.isoformat() if mp.found_at else None,
        })
    except MissingPerson.DoesNotExist:
        return Response({"error": "Report not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# =====================================================
# ADMIN — STUDENTS
# =====================================================

@api_view(["POST"])
@permission_classes([])
def admin_add_student(request):
    try:
        sid  = (request.data.get("student_id") or "").strip()
        name = (request.data.get("full_name")  or "").strip()
        dept = (request.data.get("department") or "").strip()
        photo = request.FILES.get("photo")

        if not sid:  return Response({"error": "Student ID required"}, status=400)
        if not name: return Response({"error": "Full name required"}, status=400)
        if not dept: return Response({"error": "Department required"}, status=400)
        if Student.objects.filter(student_id=sid).exists():
            return Response({"error": f"Student ID {sid} already exists"}, status=400)

        s = Student.objects.create(student_id=sid, full_name=name, department=dept, photo=photo)
        return Response({
            "id": s.id, "student_id": s.student_id, "full_name": s.full_name,
            "department": s.department, "photo": s.photo.url if s.photo else None,
            "message": "Student added successfully",
        }, status=201)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([])
def admin_get_students(request):
    try:
        return Response([{
            "id": s.id, "student_id": s.student_id, "full_name": s.full_name,
            "department": s.department, "photo": s.photo.url if s.photo else None,
        } for s in Student.objects.all().order_by("full_name")])
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# =====================================================
# ADMIN — UPLOAD CCTV
# =====================================================

@api_view(["POST"])
@permission_classes([])
def admin_upload_cctv(request):
    try:
        video    = request.FILES.get("video")
        location = (request.data.get("location") or "").strip()
        lat_raw  =  request.data.get("latitude",  "")
        lng_raw  =  request.data.get("longitude", "")

        if not video:
            return Response({"error": "No video file. Field name must be 'video', Content-Type must be multipart/form-data."}, status=400)
        if not location:
            return Response({"error": "Location is required"}, status=400)

        allowed = [".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv"]
        ext     = os.path.splitext(video.name)[1].lower()
        if ext not in allowed:
            return Response({"error": f"Invalid file type '{ext}'. Allowed: {', '.join(allowed)}"}, status=400)

        kwargs = {"video": video, "location": location}
        if lat_raw:
            try: kwargs["latitude"]  = float(lat_raw)
            except: pass
        if lng_raw:
            try: kwargs["longitude"] = float(lng_raw)
            except: pass

        cctv = CCTVVideo.objects.create(**kwargs)
        logger.info(f"[CCTV] Uploaded: '{cctv.location}' id={cctv.id}")

        return Response({
            "id":          cctv.id,
            "location":    cctv.location,
            "video_url":   request.build_absolute_uri(cctv.video.url),
            "latitude":    cctv.latitude,
            "longitude":   cctv.longitude,
            "uploaded_at": cctv.uploaded_at.isoformat(),
            "message":     f"✅ Uploaded for '{cctv.location}'",
        }, status=201)
    except Exception as e:
        logger.error(f"[CCTV Upload] {e}\n{traceback.format_exc()}")
        return Response({"error": str(e)}, status=500)


@api_view(["GET"])
@permission_classes([])
def admin_get_cctv_videos(request):
    try:
        return Response([{
            "id":          v.id,
            "location":    v.location,
            "video":       request.build_absolute_uri(v.video.url) if v.video else None,
            "processed":   v.processed,
            "uploaded_at": v.uploaded_at.isoformat() if v.uploaded_at else None,
            "latitude":    v.latitude,
            "longitude":   v.longitude,
        } for v in CCTVVideo.objects.all().order_by("-id")])
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@api_view(["DELETE"])
@permission_classes([])
def admin_delete_cctv(request, video_id):
    try:
        cctv = CCTVVideo.objects.get(id=video_id)
        if cctv.video and os.path.exists(cctv.video.path):
            os.remove(cctv.video.path)
        cctv.delete()
        return Response({"message": "Deleted"})
    except CCTVVideo.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    except Exception as e:
        return Response({"error": str(e)}, status=500)


# =====================================================
# ADMIN — RUN DETECTION  ← MAIN AI ENDPOINT
#
# Called by UploadCCTV.jsx:
#   POST /api/admin/run-detection/
#   body: { report_id: "uuid", video_id: 2 }
#
# Called by DetectionMap.jsx:
#   POST /api/admin/run-detection/
#   body: { report_id: "uuid", cctv_id: "cctv_x", location_id: "cc" }
# =====================================================

@api_view(["POST"])
@permission_classes([])
def admin_run_detection(request, reference_id=None):
    try:
        # ── 1. Resolve report ─────────────────────────────────────────────────
        ref = (
            reference_id
            or request.data.get("report_id")
            or request.data.get("reference_id")
        )
        if not ref:
            return Response({"error": "report_id is required"}, status=400)

        try:
            mp = MissingPerson.objects.get(reference_id=ref)
        except MissingPerson.DoesNotExist:
            return Response({"error": f"No report found for reference_id={ref}"}, status=404)

        if not mp.photo:
            return Response({"error": "This report has no photo uploaded. Cannot run detection."}, status=400)

        # ── 2. Import detection service ───────────────────────────────────────
        try:
            from ai_pipeline.detection_service import detect_person_in_video
        except ImportError as ie:
            logger.error(f"[Detection] Import error: {ie}")
            return Response({"error": "ai_pipeline/detection_service.py not found"}, status=500)

        # ── 3. Decide which videos to scan ────────────────────────────────────
        video_id    = request.data.get("video_id")     # from UploadCCTV.jsx
        cctv_id     = request.data.get("cctv_id")      # from DetectionMap.jsx
        location_id = request.data.get("location_id")  # from DetectionMap.jsx

        if video_id:
            # UploadCCTV.jsx — scan one specific video
            try:
                videos_to_scan = [CCTVVideo.objects.get(id=video_id)]
            except CCTVVideo.DoesNotExist:
                return Response({"error": f"CCTV video id={video_id} not found"}, status=404)

        elif cctv_id or location_id:
            # DetectionMap.jsx — scan by location name
            location_name = mp.last_seen_location or ""
            search_term   = location_name.split("(")[0].strip()
            qs = CCTVVideo.objects.filter(location__icontains=search_term) if search_term else CCTVVideo.objects.none()
            if not qs.exists():
                logger.warning(f"[Detection] No videos for '{search_term}', scanning ALL")
                qs = CCTVVideo.objects.all()
            videos_to_scan = list(qs)

        else:
            # No filter — scan all uploaded videos
            videos_to_scan = list(CCTVVideo.objects.all())

        if not videos_to_scan:
            return Response({
                "message":          "No CCTV videos uploaded yet. Please upload footage first.",
                "status":           "no_videos",
                "detections_count": 0,
                "detections":       [],
            })

        # ── 4. Set status → Processing ────────────────────────────────────────
        mp.status = "Processing"
        mp.save()
        logger.info(f"[Detection] Starting scan: {mp.name} | {len(videos_to_scan)} video(s)")

        # ── 5. Run detection on each video ────────────────────────────────────
        total_matches     = 0
        detection_results = []

        for cctv in videos_to_scan:
            logger.info(f"[Detection] Scanning '{cctv.location}' (id={cctv.id})...")
            try:
                matches = detect_person_in_video(mp, cctv)
            except Exception as det_err:
                logger.error(f"[Detection] Error on video {cctv.id}: {det_err}\n{traceback.format_exc()}")
                matches = []

            for match in matches:
                try:
                    ts = datetime.datetime.now()
                    if cctv.uploaded_at:
                        ts = cctv.uploaded_at + datetime.timedelta(seconds=match.get("timestamp_seconds", 0))

                    det = Detection.objects.create(
                        missing_person   = mp,
                        cctv_video       = cctv,
                        confidence_score = match["confidence"],
                        is_match         = True,
                        frame_number     = match.get("frame_number", 0),
                        timestamp        = ts,
                        location         = cctv.location,
                        latitude         = match.get("latitude") or cctv.latitude,
                        longitude        = match.get("longitude") or cctv.longitude,
                    )

                    # Attach saved frame image
                    fp = match.get("frame_path")
                    if fp:
                        full = os.path.join(settings.MEDIA_ROOT, fp)
                        if os.path.exists(full):
                            det.detected_face.name = fp
                            det.save()

                    face_p = match.get("face_path")
                    detection_results.append({
                        "location":   cctv.location,
                        "confidence": match["confidence"],
                        "timestamp":  ts.isoformat(),
                        "video_id":   cctv.id,
                        "latitude":   match.get("latitude")  or cctv.latitude,
                        "longitude":  match.get("longitude") or cctv.longitude,
                        "frame_url":  request.build_absolute_uri(f"/media/{fp}") if fp else None,
                        "face_url":   request.build_absolute_uri(f"/media/{face_p}") if face_p else None,
                        "frame_b64":  match.get("frame_b64"),
                        "face_b64":   match.get("face_b64"),
                    })
                    total_matches += 1

                except Exception as se:
                    logger.error(f"[Detection] Save error: {se}\n{traceback.format_exc()}")

        # ── 6. Update final status ────────────────────────────────────────────
        if total_matches > 0:
            best = detection_results[0]
            mp.status            = "Detected"
            mp.found_location    = best["location"]
            mp.found_location_id = str(cctv_id or video_id or "")
            mp.found_at          = datetime.datetime.now()
            mp.save()
            message = f"✅ Person FOUND in {total_matches} match(es)!"
            logger.info(f"[Detection] ✅ FOUND: {mp.name} @ {best['location']}")
        else:
            mp.status = "Processing"
            mp.save()
            message = "❌ No match found. Continuing to monitor."
            logger.info(f"[Detection] No match for {mp.name} across {len(videos_to_scan)} video(s)")

        return Response({
            "message":          message,
            "status":           mp.status,
            "person":           mp.name,
            "reference_id":     str(mp.reference_id),
            "detections_count": total_matches,
            "detections":       detection_results,
        })

    except Exception as e:
        logger.error(f"[Detection] Unexpected error: {e}\n{traceback.format_exc()}")
        return Response({"error": str(e), "trace": traceback.format_exc()}, status=500)


# =====================================================
# ADMIN — GET DETECTIONS
# =====================================================

@api_view(["GET"])
@permission_classes([])
def admin_get_detections(request):
    try:
        return Response([{
            "id":           d.id,
            "reference_id": str(d.missing_person.reference_id) if d.missing_person else None,
            "name":         d.missing_person.name if d.missing_person else "",
            "confidence":   float(d.confidence_score),
            "is_match":     d.is_match,
            "frame_number": d.frame_number,
            "location":     d.location or "",
            "latitude":     d.latitude,
            "longitude":    d.longitude,
            "timestamp":    d.timestamp.isoformat() if d.timestamp else None,
            "created_at":   d.created_at.isoformat() if d.created_at else None,
            "frame":        request.build_absolute_uri(d.detected_face.url) if d.detected_face else None,
        } for d in Detection.objects.filter(is_match=True).order_by("-created_at")])
    except Exception as e:
        return Response({"error": str(e)}, status=500)