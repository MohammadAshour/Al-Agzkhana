from rest_framework import viewsets
from rest_framework.filters import SearchFilter
from .models import Medicine, MedicineInstance, Condition
from .serializers import MedicineSerializer, MedicineInstanceSerializer, ConditionSerializer

class ConditionViewSet(viewsets.ModelViewSet):
    queryset = Condition.objects.all()
    serializer_class = ConditionSerializer
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
    search_fields = ['medicine__name_ar', 'medicine__name_en', 'location']