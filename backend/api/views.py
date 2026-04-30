from rest_framework import viewsets, status
from django.utils import timezone
from django.db import transaction, models
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response


from .models import Medicine, MedicineInstance, Condition, Location, Family, FamilyMembership, UserProfile, MedicineSubmission, ActivityLog, Reminder, DeviceToken, ModeratorRequest
from .serializers import MedicineSerializer, MedicineInstanceSerializer, ConditionSerializer, LocationSerializer, FamilySerializer, UserProfileSerializer, ModeratorRequestSerializer, MedicineSubmissionSerializer, ActivityLogSerializer, ReminderSerializer, DeviceTokenSerializer

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
    authentication_classes = [TokenAuthentication]

    def check_mod_or_admin(self, request):
        if not request.user or not request.user.is_authenticated:
            return False
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return profile.role in ['moderator', 'admin']

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return []
        return [IsAuthenticated()]

    def create(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم إضافة الحالات'},
                status=403
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم تعديل الحالات'},
                status=403
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم تعديل الحالات'},
                status=403
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم حذف الحالات'},
                status=403
            )
        return super().destroy(request, *args, **kwargs)

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
    authentication_classes = [TokenAuthentication]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Anyone can view medicines including unauthenticated users
            return []
        if self.action == 'create':
            # Authenticated users can submit but it goes through MedicineSubmission
            # Direct create is moderator/admin only
            return [IsAuthenticated()]
        # update, partial_update, destroy — moderator/admin only
        return [IsAuthenticated()]

    def check_mod_or_admin(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        return profile.role in ['moderator', 'admin']

    def create(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم إضافة الأدوية مباشرة'},
                status=403
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم تعديل الأدوية'},
                status=403
            )
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم تعديل الأدوية'},
                status=403
            )
        return super().partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if not self.check_mod_or_admin(request):
            return Response(
                {'error': 'فقط المشرفون والمديرون يمكنهم حذف الأدوية'},
                status=403
            )
        return super().destroy(request, *args, **kwargs)

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
    
    @action(detail=True, methods=['get'], url_path='members')
    def members(self, request, pk=None):
        family = self.get_object()
        if family.owner != request.user:
            is_member = FamilyMembership.objects.filter(
                family=family, user=request.user
            ).exists()
            if not is_member:
                return Response({'error': 'غير مصرح'}, status=403)

        # Build members list: owner first then rest
        members = []
        members.append({
            'id': family.owner.id,
            'email': family.owner.email,
            'first_name': family.owner.first_name,
            'last_name': family.owner.last_name,
            'is_owner': True,
            'joined_at': family.created_at,
        })
        for membership in family.memberships.select_related('user').order_by('joined_at'):
            members.append({
                'id': membership.user.id,
                'email': membership.user.email,
                'first_name': membership.user.first_name,
                'last_name': membership.user.last_name,
                'is_owner': False,
                'joined_at': membership.joined_at,
            })
        return Response(members)
    
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
        # Check if there's already a pending request
        existing = ModeratorRequest.objects.filter(
            user=request.user, status='pending'
        ).first()
        if existing:
            return Response({'error': 'لديك طلب قيد المراجعة بالفعل'}, status=400)
        ModeratorRequest.objects.create(user=request.user)
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
        
    @action(detail=False, methods=['get'], url_path='pending-counts')
    def pending_counts(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        counts = {}
        if profile.role in ['moderator', 'admin']:
            counts['pending_submissions'] = MedicineSubmission.objects.filter(status='pending').count()
        if profile.role == 'admin':
            counts['pending_moderator_requests'] = ModeratorRequest.objects.filter(status='pending').count()
        return Response(counts)
        

class ModeratorRequestViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    def list(self, request):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.role != 'admin':
            return Response({'error': 'غير مصرح'}, status=403)
        status_filter = request.query_params.get('status', 'pending')
        requests = ModeratorRequest.objects.filter(
            status=status_filter
        ).select_related('user', 'reviewed_by').order_by('-requested_at')
        return Response(ModeratorRequestSerializer(requests, many=True).data)

    @action(detail=True, methods=['patch'], url_path='review')
    def review(self, request, pk=None):
        profile, _ = UserProfile.objects.get_or_create(user=request.user)
        if profile.role != 'admin':
            return Response({'error': 'غير مصرح'}, status=403)
        try:
            mod_request = ModeratorRequest.objects.get(pk=pk)
        except ModeratorRequest.DoesNotExist:
            return Response({'error': 'الطلب غير موجود'}, status=404)
        if mod_request.status != 'pending':
            return Response({'error': 'تم مراجعة هذا الطلب مسبقاً'}, status=400)
        new_status = request.data.get('status')
        if new_status not in ['approved', 'rejected']:
            return Response({'error': 'حالة غير صحيحة'}, status=400)
        mod_request.status = new_status
        mod_request.reviewed_by = request.user
        mod_request.reviewed_at = timezone.now()
        mod_request.save()
        if new_status == 'approved':
            target_profile, _ = UserProfile.objects.get_or_create(user=mod_request.user)
            target_profile.role = 'moderator'
            target_profile.save()
        return Response(ModeratorRequestSerializer(mod_request).data)
    

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

class DeviceTokenViewSet(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        token = request.data.get('token')
        platform = request.data.get('platform', 'web')

        if not token:
            return Response({'error': 'التوكن مطلوب'}, status=400)

        if platform not in ['android', 'ios', 'web']:
            return Response({'error': 'منصة غير صحيحة'}, status=400)

        device_token, created = DeviceToken.objects.update_or_create(
            token=token,
            defaults={
                'user': request.user,
                'platform': platform,
            }
        )

        return Response({
            'id': device_token.id,
            'platform': device_token.platform,
            'created': created,
        })

    @action(detail=False, methods=['delete'], url_path='unregister')
    def unregister(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'التوكن مطلوب'}, status=400)
        DeviceToken.objects.filter(token=token, user=request.user).delete()
        return Response(status=204)

    @action(detail=False, methods=['get'], url_path='list')
    def list_tokens(self, request):
        tokens = DeviceToken.objects.filter(user=request.user)
        return Response(DeviceTokenSerializer(tokens, many=True).data)

class InventorySearchView(viewsets.ViewSet):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='search')
    def search(self, request):
        query = request.query_params.get('q', '').strip()
        family_id = request.query_params.get('family_id')

        if not query:
            return Response({'family_stock': [], 'global_catalog': []})

        # Search family stock first
        family_stock = []
        if family_id:
            instances = MedicineInstance.objects.filter(
                family_id=family_id
            ).filter(
                models.Q(medicine__name_ar__icontains=query) |
                models.Q(medicine__name_en__icontains=query) |
                models.Q(location__name__icontains=query)
            ).select_related('medicine', 'location')
            family_stock = MedicineInstanceSerializer(instances, many=True).data

        # Search global catalog
        medicines = Medicine.objects.filter(
            models.Q(name_ar__icontains=query) |
            models.Q(name_en__icontains=query) |
            models.Q(conditions__name__icontains=query)
        ).distinct()
        global_catalog = MedicineSerializer(medicines, many=True).data

        return Response({
            'family_stock': family_stock,
            'global_catalog': global_catalog,
        })