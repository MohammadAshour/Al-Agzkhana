from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConditionViewSet, MedicineViewSet, MedicineInstanceViewSet, LocationViewSet, FamilyViewSet, UserProfileViewSet, MedicineSubmissionViewSet, ActivityLogViewSet, ReminderViewSet, DeviceTokenViewSet
from .auth_views import google_login

router = DefaultRouter()
router.register(r'conditions', ConditionViewSet)
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'medicines', MedicineViewSet)
router.register(r'instances', MedicineInstanceViewSet, basename='instance')
router.register(r'families', FamilyViewSet, basename='family')
router.register(r'profile', UserProfileViewSet, basename='profile')
router.register(r'submissions', MedicineSubmissionViewSet, basename='submission')
router.register(r'activity', ActivityLogViewSet, basename='activity')
router.register(r'reminders', ReminderViewSet, basename='reminder')
router.register(r'devices', DeviceTokenViewSet, basename='device')




urlpatterns = [
    path('', include(router.urls)),
    path("auth/google/", google_login, name="google_login"),
]