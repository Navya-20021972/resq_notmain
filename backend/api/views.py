from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action

from .models import Student, MissingPerson, CCTVVideo, Detection
from .serializers import (
    StudentSerializer,
    MissingPersonSerializer,
)

# =====================================================
# VIEWSETS
# =====================================================

class StudentViewSet(ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    parser_classes = (MultiPartParser, FormParser)


class MissingPersonViewSet(viewsets.ModelViewSet):
    queryset = MissingPerson.objects.all()
    serializer_class = MissingPersonSerializer

    @action(detail=False, methods=['get'], url_path='by-reference/(?P<ref_id>[^/.]+)')
    def get_by_reference(self, request, ref_id=None):
        try:
            obj = MissingPerson.objects.get(reference_id=ref_id)
            serializer = self.get_serializer(obj)
            return Response(serializer.data)
        except MissingPerson.DoesNotExist:
            return Response({"error": "Not found"}, status=404)

# =====================================================
# ADMIN LOGIN
# =====================================================

@api_view(["POST"])
def admin_login(request):
    username = request.data.get("username")
    password = request.data.get("password")

    user = authenticate(
        request=request,
        username=username,
        password=password
    )

    if user is not None and user.is_staff:
        return Response({
            "success": True,
            "username": user.username
        })

    return Response(
        {"success": False, "error": "Invalid credentials"},
        status=status.HTTP_401_UNAUTHORIZED
    )


# =====================================================
# CCTV PROCESSING
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def process_cctv_video(request, video_id):
    try:
        from .services.video_processing import extract_frames

        video = CCTVVideo.objects.get(id=video_id)

        if video.processed:
            return Response(
                {"message": "Video already processed"},
                status=status.HTTP_400_BAD_REQUEST
            )

        frames_count = extract_frames(video)
        video.processed = True
        video.save()

        return Response({
            "message": "Frames extracted successfully",
            "frames_saved": frames_count
        })

    except CCTVVideo.DoesNotExist:
        return Response(
            {"error": "Video not found"},
            status=status.HTTP_404_NOT_FOUND
        )


# =====================================================
# FACE DETECTION
# =====================================================

@api_view(["POST"])
@permission_classes([IsAdminUser])
def run_face_detection(request, missing_person_id, video_id):
    try:
        from .services.detection_service import detect_faces_from_frames

        missing_person = MissingPerson.objects.get(id=missing_person_id)
        video = CCTVVideo.objects.get(id=video_id)

        results = detect_faces_from_frames(missing_person, video)

        for r in results:
            Detection.objects.create(
                missing_person=missing_person,
                cctv_video=video,
                detected_face=r["image_path"],
                confidence_score=r["confidence"],
                timestamp=video.uploaded_at,
                location=video.location,
                latitude=video.latitude,
                longitude=video.longitude
            )

        return Response({
            "message": "Face detection completed",
            "faces_detected": len(results)
        })

    except MissingPerson.DoesNotExist:
        return Response({"error": "Missing person not found"}, status=404)
    except CCTVVideo.DoesNotExist:
        return Response({"error": "CCTV video not found"}, status=404)


# =====================================================
# USER QUERIES
# =====================================================

@api_view(["GET"])
def get_reference_by_email(request, email):
    records = MissingPerson.objects.filter(email=email)
    references = [str(r.reference_id) for r in records]
    return Response({"references": references})


@api_view(["GET"])
def get_report_by_reference(request, reference_id):
    try:
        report = MissingPerson.objects.get(reference_id=reference_id)
    except MissingPerson.DoesNotExist:
        return Response(
            {"error": "Invalid reference ID"},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = MissingPersonSerializer(report)
    return Response(serializer.data)


@api_view(["GET"])
def admin_dashboard(request):
    total = MissingPerson.objects.count()
    pending = MissingPerson.objects.filter(status="Pending Investigation").count()
    processing = MissingPerson.objects.filter(status="Processing").count()
    found = MissingPerson.objects.filter(status="Detected").count()

    recent = MissingPerson.objects.order_by("-created_at")[:10]

    return Response({
        "stats": {
            "total_reports": total,
            "pending": pending,
            "processing": processing,
            "found": found,
        },
        "recent_reports": MissingPersonSerializer(recent, many=True).data
    })
# =====================================================
# PASTE THIS AT THE BOTTOM OF YOUR EXISTING views.py
# =====================================================

# =====================================================
# PASTE THIS AT THE BOTTOM OF YOUR EXISTING views.py
# =====================================================

import os
import datetime
import traceback
import logging

logger = logging.getLogger(__name__)


# ── Submit missing person ─────────────────────────────
@api_view(['POST'])
@permission_classes([])
def submit_missing_person(request):
    try:
        name               = request.data.get('name') or request.POST.get('name', '').strip()
        dress_code         = request.data.get('dressCode') or request.POST.get('dressCode', '').strip()
        department         = request.data.get('department') or request.POST.get('department', '').strip()
        is_outsider_raw    = request.data.get('isOutsider') or request.POST.get('isOutsider', 'false')
        is_outsider        = str(is_outsider_raw).lower() in ('true', '1', 'yes')
        last_seen_location = request.data.get('lastSeenLocation') or request.POST.get('lastSeenLocation', '').strip()
        submitter_email    = request.data.get('submitterEmail') or request.POST.get('submitterEmail', '').strip()
        photo              = request.FILES.get('photo')

        if not name:
            return Response({'error': 'Name is required'}, status=400)
        if not submitter_email:
            return Response({'error': 'Email is required'}, status=400)

        mp = MissingPerson.objects.create(
            name=name, dress_code=dress_code, department=department,
            is_outsider=is_outsider, last_seen_location=last_seen_location,
            email=submitter_email, photo=photo, status='Pending Investigation',
        )
        return Response({
            'reference_id':       str(mp.reference_id),
            'name':               mp.name,
            'department':         mp.department,
            'dress_code':         mp.dress_code,
            'last_seen_location': mp.last_seen_location,
            'is_outsider':        mp.is_outsider,
            'status':             mp.status,
            'email':              mp.email,
            'photo':              mp.photo.url if mp.photo else None,
            'created_at':         mp.created_at.isoformat(),
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Check status (used by user frontend) ─────────────
@api_view(['GET'])
@permission_classes([])
def check_status(request, reference_id):
    try:
        mp         = MissingPerson.objects.get(reference_id=reference_id)
        detections = Detection.objects.filter(
            missing_person=mp, is_match=True
        ).order_by('-created_at')

        detected_locations = [{
            'location':   d.location or 'Unknown',
            'timestamp':  d.timestamp.isoformat() if d.timestamp else d.created_at.isoformat(),
            'confidence': float(d.confidence_score),
            'latitude':   d.latitude,
            'longitude':  d.longitude,
            'frame':      request.build_absolute_uri(d.detected_face.url) if d.detected_face else None,
        } for d in detections]

        return Response({
            'reference_id':       str(mp.reference_id),
            'name':               mp.name,
            'status':             mp.status,
            'message':            f'Current status: {mp.status}',
            'detected_locations': detected_locations,
        })
    except MissingPerson.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin dashboard stats ─────────────────────────────
@api_view(['GET'])
@permission_classes([])
def admin_dashboard_stats(request):
    try:
        all_reports = MissingPerson.objects.all()
        recent      = all_reports.order_by('-created_at')[:10]

        def mp_dict(mp):
            return {
                'reference_id':       str(mp.reference_id),
                'name':               mp.name,
                'department':         mp.department,
                'status':             mp.status,
                'is_outsider':        mp.is_outsider,
                'photo':              mp.photo.url if mp.photo else None,
                'created_at':         mp.created_at.isoformat(),
                'last_seen_location': mp.last_seen_location,
                'email':              mp.email,
                'dress_code':         mp.dress_code,
            }

        return Response({
            'stats': {
                'total_reports':  all_reports.count(),
                'pending':        all_reports.filter(status='Pending Investigation').count(),
                'processing':     all_reports.filter(status='Processing').count(),
                'found':          all_reports.filter(status='Detected').count(),
                'completed':      all_reports.filter(status='Completed').count(),
                'total_students': Student.objects.count(),
                'total_videos':   CCTVVideo.objects.count(),
            },
            'recent_reports': [mp_dict(mp) for mp in recent],
        })
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin get all reports ─────────────────────────────
@api_view(['GET'])
@permission_classes([])
def admin_get_reports(request):
    try:
        reports = MissingPerson.objects.all().order_by('-created_at')
        data = [{
            'reference_id':       str(mp.reference_id),
            'name':               mp.name,
            'department':         mp.department,
            'status':             mp.status,
            'is_outsider':        mp.is_outsider,
            'photo':              mp.photo.url if mp.photo else None,
            'created_at':         mp.created_at.isoformat(),
            'last_seen_location': mp.last_seen_location,
            'email':              mp.email,
            'dress_code':         mp.dress_code,
        } for mp in reports]
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin update status ───────────────────────────────
@api_view(['POST', 'PATCH'])
@permission_classes([])
def admin_update_status(request, reference_id):
    try:
        mp         = MissingPerson.objects.get(reference_id=reference_id)
        new_status = request.data.get('status', '')
        if not new_status:
            return Response({'error': 'Status required'}, status=400)
        mp.status = new_status
        mp.save()
        return Response({'message': 'Updated', 'status': mp.status})
    except MissingPerson.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin add student ─────────────────────────────────
@api_view(['POST'])
@permission_classes([])
def admin_add_student(request):
    try:
        student_id = request.data.get('student_id') or request.POST.get('student_id', '').strip()
        full_name  = request.data.get('full_name')  or request.POST.get('full_name', '').strip()
        department = request.data.get('department') or request.POST.get('department', '').strip()
        photo      = request.FILES.get('photo')

        if not student_id:
            return Response({'error': 'Student ID required'}, status=400)
        if not full_name:
            return Response({'error': 'Full name required'}, status=400)
        if not department:
            return Response({'error': 'Department required'}, status=400)
        if Student.objects.filter(student_id=student_id).exists():
            return Response({'error': f'Student ID {student_id} already exists'}, status=400)

        student = Student.objects.create(
            student_id=student_id, full_name=full_name,
            department=department, photo=photo,
        )
        return Response({
            'id':         student.id,
            'student_id': student.student_id,
            'full_name':  student.full_name,
            'department': student.department,
            'photo':      student.photo.url if student.photo else None,
            'message':    'Student added successfully',
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin get students ────────────────────────────────
@api_view(['GET'])
@permission_classes([])
def admin_get_students(request):
    try:
        students = Student.objects.all().order_by('full_name')
        data = [{
            'id':         s.id,
            'student_id': s.student_id,
            'full_name':  s.full_name,
            'department': s.department,
            'photo':      s.photo.url if s.photo else None,
        } for s in students]
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin upload CCTV ─────────────────────────────────
@api_view(['POST'])
@permission_classes([])
def admin_upload_cctv(request):
    try:
        video    = request.FILES.get('video')
        location = request.data.get('location') or request.POST.get('location', '').strip()
        latitude  = request.data.get('latitude')  or request.POST.get('latitude', None)
        longitude = request.data.get('longitude') or request.POST.get('longitude', None)

        if not video:
            return Response({'error': 'Video required'}, status=400)
        if not location:
            return Response({'error': 'Location required'}, status=400)

        kwargs = {'video': video, 'location': location}
        if latitude:
            try: kwargs['latitude'] = float(latitude)
            except: pass
        if longitude:
            try: kwargs['longitude'] = float(longitude)
            except: pass

        cctv = CCTVVideo.objects.create(**kwargs)
        return Response({
            'id':       cctv.id,
            'location': cctv.location,
            'message':  'CCTV video uploaded successfully',
        }, status=201)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin get CCTV videos ─────────────────────────────
@api_view(['GET'])
@permission_classes([])
def admin_get_cctv_videos(request):
    try:
        videos = CCTVVideo.objects.all().order_by('-id')
        data = [{
            'id':          v.id,
            'location':    v.location,
            'video':       v.video.url if v.video else None,
            'processed':   v.processed,
            'uploaded_at': v.uploaded_at.isoformat() if v.uploaded_at else None,
            'latitude':    v.latitude,
            'longitude':   v.longitude,
        } for v in videos]
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


# ── Admin run detection ───────────────────────────────
@api_view(['POST'])
@permission_classes([])
def admin_run_detection(request, reference_id=None):
    """
    Run AI face detection for a missing person against CCTV videos.
    Updates MissingPerson.status and creates Detection records.
    Detection model fields: id, missing_person, cctv_video, detected_face,
    confidence_score, is_match, frame_number, timestamp, location,
    latitude, longitude, created_at
    """
    try:
        ref = reference_id or request.data.get('reference_id')
        if not ref:
            return Response({'error': 'reference_id required'}, status=400)

        mp = MissingPerson.objects.get(reference_id=ref)

        if not mp.photo:
            return Response({'error': 'Missing person has no photo uploaded'}, status=400)

        # Optional: target specific video
        video_id = request.data.get('video_id')
        if video_id:
            videos = CCTVVideo.objects.filter(id=video_id)
        else:
            videos = CCTVVideo.objects.all()

        if not videos.exists():
            return Response({
                'message':          'No CCTV videos uploaded yet. Please upload footage first.',
                'status':           'no_videos',
                'detections_count': 0,
            })

        # Set status to Processing
        mp.status = 'Processing'
        mp.save()

        total_matches    = 0
        detection_results = []

        for cctv in videos:
            try:
                from .services.detection_service import detect_person_in_video
                matches = detect_person_in_video(mp, cctv)
            except ImportError:
                logger.error("detection_service not found — create api/services/detection_service.py")
                matches = []
            except Exception as de:
                logger.error(f"Detection service error for video {cctv.id}: {de}")
                matches = []

            for match in matches:
                try:
                    # Build timestamp
                    ts = datetime.datetime.now()
                    if cctv.uploaded_at:
                        ts = cctv.uploaded_at + datetime.timedelta(
                            seconds=match.get('timestamp_seconds', 0)
                        )

                    # Create Detection record using exact model fields
                    det = Detection.objects.create(
                        missing_person=mp,
                        cctv_video=cctv,
                        confidence_score=match.get('confidence', 0),
                        is_match=True,
                        frame_number=match.get('frame_number', 0),
                        timestamp=ts,
                        location=cctv.location,
                        latitude=cctv.latitude,
                        longitude=cctv.longitude,
                    )

                    # Save matched frame image if available
                    frame_path = match.get('frame_path')
                    if frame_path:
                        from django.conf import settings
                        full_path = os.path.join(settings.MEDIA_ROOT, frame_path)
                        if os.path.exists(full_path):
                            det.detected_face.name = frame_path
                            det.save()

                    detection_results.append({
                        'location':   cctv.location,
                        'confidence': match.get('confidence', 0),
                        'timestamp':  ts.isoformat(),
                        'video_id':   cctv.id,
                        'latitude':   cctv.latitude,
                        'longitude':  cctv.longitude,
                    })
                    total_matches += 1

                except Exception as save_err:
                    logger.error(f"Save detection error: {save_err}\n{traceback.format_exc()}")

        # Update final status
        if total_matches > 0:
            mp.status = 'Detected'
            mp.save()
            message = f'✅ Person FOUND in {total_matches} location(s)!'
        else:
            mp.status = 'Processing'
            mp.save()
            message = 'No match found in current CCTV footage. Continuing to monitor.'

        return Response({
            'message':          message,
            'status':           mp.status,
            'person':           mp.name,
            'reference_id':     str(mp.reference_id),
            'detections_count': total_matches,
            'detections':       detection_results,
        })

    except MissingPerson.DoesNotExist:
        return Response({'error': 'Report not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e), 'trace': traceback.format_exc()}, status=500)


# ── Admin get all detections ──────────────────────────
@api_view(['GET'])
@permission_classes([])
def admin_get_detections(request):
    try:
        detections = Detection.objects.filter(is_match=True).order_by('-created_at')
        data = [{
            'id':            d.id,
            'reference_id':  str(d.missing_person.reference_id) if d.missing_person else None,
            'name':          d.missing_person.name if d.missing_person else '',
            'confidence':    float(d.confidence_score),
            'is_match':      d.is_match,
            'frame_number':  d.frame_number,
            'location':      d.location or '',
            'latitude':      d.latitude,
            'longitude':     d.longitude,
            'timestamp':     d.timestamp.isoformat() if d.timestamp else None,
            'created_at':    d.created_at.isoformat() if d.created_at else None,
            'frame':         d.detected_face.url if d.detected_face else None,
        } for d in detections]
        return Response(data)
    except Exception as e:
        return Response({'error': str(e)}, status=500)