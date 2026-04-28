from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Medicine, MedicineInstance, Condition, Location, Family, FamilyMembership, UserProfile

class ConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condition
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = '__all__'

class MedicineSerializer(serializers.ModelSerializer):
    conditions = ConditionSerializer(many=True, read_only=True)
    condition_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Condition.objects.all(), source='conditions', write_only=True
    )

    class Meta:
        model = Medicine
        fields = '__all__'

class MedicineInstanceSerializer(serializers.ModelSerializer):
    medicine = MedicineSerializer(read_only=True)
    medicine_id = serializers.PrimaryKeyRelatedField(
        queryset=Medicine.objects.all(), source='medicine', write_only=True
    )
    location = LocationSerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), source='location', write_only=True, allow_null=True
    )
    expiry_date = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = MedicineInstance
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role']
class FamilyMembershipSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = FamilyMembership
        fields = ['id', 'user', 'joined_at']
class FamilySerializer(serializers.ModelSerializer):
    memberships = FamilyMembershipSerializer(many=True, read_only=True)
    owner = UserSerializer(read_only=True)
    member_count = serializers.SerializerMethodField()
    class Meta:
        model = Family
        fields = ['id', 'name', 'code', 'owner', 'memberships', 'member_count', 'created_at']
    def get_member_count(self, obj):
        return obj.memberships.count()