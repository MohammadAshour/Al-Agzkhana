from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConditionViewSet, MedicineViewSet, MedicineInstanceViewSet, LocationViewSet
from .auth_views import google_login

router = DefaultRouter()
router.register(r'conditions', ConditionViewSet)
router.register(r'locations', LocationViewSet)
router.register(r'medicines', MedicineViewSet)
router.register(r'instances', MedicineInstanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path("auth/google/", google_login, name="google_login"),
]