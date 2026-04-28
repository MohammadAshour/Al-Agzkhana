from rest_framework import viewsets, status
from django.utils import timezone
from django.db import transaction
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response


from .models import Medicine, MedicineInstance, Condition, Location, Family, FamilyMembership, UserProfile, MedicineSubmission, ActivityLog, Reminder
from .serializers import MedicineSerializer, MedicineInstanceSerializer, ConditionSerializer, LocationSerializer, FamilySerializer, UserProfileSerializer, MedicineSubmissionSerializer, ActivityLogSerializer, ReminderSerializer

def get_user_family(request):
    """Get family_id from query param and verify membership."""
    family_id = request.query_params.get('family_id') or request.data.get('family_id')
    if not family_id:
        return None, Response({'error': 'family_id required'}, status=400)
    try:
        family = Family.objects.get(id=family_id)
    except Family.DoesNotExist:
        return None, Response({'error': 'Family not found'}, status=404)
    is_member = FamilyMembership.objects.filter(family=family, user=request.user).exists()
    is_owner = family.owner == request.user
    if not (is_member or is_owner):
        return None, Response({'error': 'Not a member of this family'}, status=403)
    return family, None

def log_activity(user, family, action, medicine_name, details=None):
    ActivityLog.objects.create(
        user=user,
        family=family,
        action=action,
        medicine_name=medicine_name,
        details=details or {},
    )

class ConditionViewSet(viewsets.ModelViewSet):
    queryset = Condition.objects.all()
    serializer_class = ConditionSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']

class LocationViewSet(viewsets.ModelViewSet):
    serializer_class = LocationSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['name']
    def get_queryset(self):
        family_id = self.request.query_params.get('family_id')
        if family_id:
            return Location.objects.filter(family_id=family_id)
        return Location.objects.none()
    def perform_create(self, serializer):
        family_id = self.request.data.get('family_id')
        family = Family.objects.get(id=family_id)
        serializer.save(family=family)


class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name_ar', 'name_en', 'conditions__name']

class MedicineInstanceViewSet(viewsets.ModelViewSet):
    serializer_class = MedicineInstanceSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter]
    search_fields = ['medicine__name_ar', 'medicine__name_en', 'location__name']

    def get_queryset(self):
        family_id = self.request.query_params.get('family_id')
        if not family_id:
            return MedicineInstance.objects.none()
        queryset = MedicineInstance.objects.filter(family_id=family_id)
        if self.request.query_params.get('expired') == 'true':
            expired_ids = [obj.id for obj in queryset if obj.is_expired]
            queryset = queryset.filter(id__in=expired_ids)
        if self.request.query_params.get('low_stock') == 'true':
            low_ids = [obj.id for obj in queryset if obj.quantity <= obj.min_threshold]
            queryset = queryset.filter(id__in=low_ids)
        return queryset

    def perform_create(self, serializer):
        family_id = self.request.data.get('family_id')
        family = Family.objects.get(id=family_id)
        instance = serializer.save(family=family)
        log_activity(
            user=self.request.user,
            family=family,
            action='add_inventory',
            medicine_name=instance.medicine.name_ar,
            details={'quantity': instance.quantity, 'location': instance.location.name if instance.location else ''},
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        log_activity(
            user=self.request.user,
            family=instance.family,
            action='edit_inventory',
            medicine_name=instance.medicine.name_ar,
            details={'quantity': instance.quantity, 'location': instance.location.name if instance.location else ''},
        )

    def perform_destroy(self, instance):
        log_activity(
            user=self.request.user,
            family=instance.family,
            action='delete_inventory',
            medicine_name=instance.medicine.name_ar,
            details={},
        )
        instance.delete()

    @action(detail=True, methods=['post'], url_path='deduct')
    def deduct(self, request, pk=None):
        with transaction.atomic():
            instance = MedicineInstance.objects.select_for_update().get(pk=pk)
            quantity = int(request.data.get('quantity', 1))
            if quantity <= 0:
                return Response({'error': 'الكمية يجب أن تكون أكبر من صفر'}, status=400)
            if instance.quantity < quantity:
                return Response({'error': f'الكمية المتاحة {instance.quantity} فقط'}, status=400)
            instance.quantity -= quantity
            instance.save()
            log_activity(
                user=request.user,
                family=instance.family,
                action='deduct_dose',
                medicine_name=instance.medicine.name_ar,
                details={'quantity_deducted': quantity, 'remaining': instance.quantity},
            )
            return Response({
                'id': instance.id,
                'quantity': instance.quantity,
                'low_stock': instance.quantity <= instance.min_threshold,
            })

class FamilyViewSet(viewsets.ModelViewSet):
    serializer_class = FamilySerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        owned = Family.objects.filter(owner=user)
        member_of = Family.objects.filter(memberships__user=user)
        return (owned | member_of).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['post'], url_path='join')
    def join(self, request):
        code = request.data.get('code', '').strip().upper()
        try:
            family = Family.objects.get(code=code)
        except Family.DoesNotExist:
            return Response({'error': 'كود غير صحيح'}, status=404)
        if family.owner == request.user:
            return Response({'error': 'أنت صاحب هذه العائلة'}, status=400)
        membership, created = FamilyMembership.objects.get_or_create(
            family=family, user=request.user
        )
        if not created:
            return Response({'error': 'أنت بالفعل عضو'}, status=400)
        return Response(FamilySerializer(family).data)

    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        family = self.get_object()
        if family.owner == request.user:
            return Response({'error': 'المالك لا يمكنه المغادرة'}, status=400)
        FamilyMembership.objects.filter(family=family, user=request.user).delete()
        return Response(status=204)
    
    @action(detail=True, methods=['post'], url_path='remove-member')
    def remove_member(self, request, pk=None):
        family = self.get_object()
        if family.owner != request.user:
            return Response({'error': 'صاحب العائلة فقط يمكنه الحذف'}, status=403)
        user_id = request.data.get('user_id')
        FamilyMembership.objects.filter(family=family, user_id=user_id).delete()
        return Response(status=204)
    
class UserProfileViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='request-moderator')
    def request_moderator(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.role != 'user':
            return Response({'error': 'أنت بالفعل مشرف أو مدير'}, status=400)
        # Flag it — admin will promote via promote endpoint
        return Response({'message': 'تم إرسال طلب الترقية، سيتم مراجعته قريباً'})

    @action(detail=False, methods=['patch'], url_path='promote')
    def promote(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.role != 'admin':
            return Response({'error': 'غير مصرح'}, status=403)
        target_user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        if new_role not in ['user', 'moderator', 'admin']:
            return Response({'error': 'دور غير صحيح'}, status=400)
        try:
            target_profile = UserProfile.objects.get(user_id=target_user_id)
            target_profile.role = new_role
            target_profile.save()
            return Response(UserProfileSerializer(target_profile).data)
        except UserProfile.DoesNotExist:
            return Response({'error': 'المستخدم غير موجود'}, status=404)
        
class MedicineSubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = MedicineSubmissionSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        profile, _ = UserProfile.objects.get_or_create(user=self.request.user)
        if profile.role in ['moderator', 'admin']:
            status_filter = self.request.query_params.get('status')
            if status_filter:
                return MedicineSubmission.objects.filter(status=status_filter).order_by('-submitted_at')
            return MedicineSubmission.objects.all().order_by('-submitted_at')
        return MedicineSubmission.objects.filter(submitted_by=self.request.user).order_by('-submitted_at')

    def perform_create(self, serializer):
        serializer.save(submitted_by=self.request.user)

    @action(detail=True, methods=['patch'], url_path='review')
    def review(self, request, pk=None):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.role not in ['moderator', 'admin']:
            return Response({'error': 'غير مصرح'}, status=403)

        submission = self.get_object()
        if submission.status != 'pending':
            return Response({'error': 'تم مراجعة هذا الطلب مسبقاً'}, status=400)

        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({'error': 'حالة غير صحيحة'}, status=400)

        review_note = request.data.get('review_note', '')
        submission.status = new_status
        submission.reviewer = request.user
        submission.review_note = review_note
        submission.reviewed_at = timezone.now()
        submission.save()

        if new_status == 'approved':
            medicine = Medicine.objects.create(
                name_ar=submission.name_ar,
                name_en=submission.name_en,
                form=submission.form,
                shelf_life_months=submission.shelf_life_months,
                shelf_life_after_opening_months=submission.shelf_life_after_opening_months,
                safe_during_pregnancy=submission.safe_during_pregnancy,
                safe_during_breastfeeding=submission.safe_during_breastfeeding,
                safe_for_diabetics=submission.safe_for_diabetics,
                safe_for_hypertensive=submission.safe_for_hypertensive,
            )
            medicine.conditions.set(submission.conditions.all())

        return Response(MedicineSubmissionSerializer(submission).data)
    
class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ActivityLogSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        family_id = self.request.query_params.get('family_id')
        if not family_id:
            return ActivityLog.objects.none()
        cutoff = timezone.now() - timedelta(days=30)
        return ActivityLog.objects.filter(
            family_id=family_id,
            timestamp__gte=cutoff,
        ).select_related('user')
    
class ReminderViewSet(viewsets.ModelViewSet):
    serializer_class = ReminderSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['patch'], url_path='toggle')
    def toggle(self, request, pk=None):
        reminder = self.get_object()
        reminder.is_active = not reminder.is_active
        reminder.save()
        return Response(ReminderSerializer(reminder).data)