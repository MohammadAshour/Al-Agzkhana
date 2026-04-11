from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConditionViewSet, MedicineViewSet, MedicineInstanceViewSet

router = DefaultRouter()
router.register(r'conditions', ConditionViewSet)
router.register(r'medicines', MedicineViewSet)
router.register(r'instances', MedicineInstanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]