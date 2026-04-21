from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from .models import Medicine, MedicineInstance, Condition, Location, Family, FamilyMembership
from .serializers import MedicineSerializer, MedicineInstanceSerializer, ConditionSerializer, LocationSerializer, FamilySerializer

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
        return queryset

    def perform_create(self, serializer):
        family_id = self.request.data.get('family_id')
        family = Family.objects.get(id=family_id)
        serializer.save(family=family)

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