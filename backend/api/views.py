from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from .models import Medicine, MedicineInstance, Condition, Location
from .serializers import MedicineSerializer, MedicineInstanceSerializer, ConditionSerializer, LocationSerializer

class ConditionViewSet(viewsets.ModelViewSet):
    queryset = Condition.objects.all()
    serializer_class = ConditionSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name']

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name_ar', 'name_en', 'conditions__name']

class MedicineInstanceViewSet(viewsets.ModelViewSet):
    queryset = MedicineInstance.objects.all()
    serializer_class = MedicineInstanceSerializer
    filter_backends = [SearchFilter]
    search_fields = ['medicine__name_ar', 'medicine__name_en', 'location__name']
    
    def get_queryset(self):
        queryset = MedicineInstance.objects.all()
        is_expired_requested = self.request.query_params.get('expired')
        if is_expired_requested == 'true':
            expired_ids = [obj.id for obj in queryset if obj.is_expired]
            queryset = queryset.filter(id__in=expired_ids)
        return queryset