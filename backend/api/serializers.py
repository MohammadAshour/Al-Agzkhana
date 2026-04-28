from rest_framework import serializers
from django.contrib.auth.models import User
from .models import ActivityLog, DeviceToken, Medicine, MedicineInstance, Condition, Location, Family, FamilyMembership, ModeratorRequest, Reminder, UserProfile, MedicineSubmission

class ConditionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Condition
        fields = '__all__'

    def create(self, validated_data):
        from .models import normalize_arabic
        normalized = normalize_arabic(validated_data['name'])
        existing = Condition.objects.filter(normalized_name=normalized).first()
        if existing:
            raise serializers.ValidationError({
                'name': f'هذا العرض موجود بالفعل باسم "{existing.name}"'
            })
        return super().create(validated_data)

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

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name']

class MedicineSubmissionSerializer(serializers.ModelSerializer):
    submitted_by = UserSerializer(read_only=True)
    reviewer = UserSerializer(read_only=True)
    conditions = ConditionSerializer(many=True, read_only=True)
    condition_ids = serializers.PrimaryKeyRelatedField(
        many=True, queryset=Condition.objects.all(), source='conditions', write_only=True, required=False
    )

    class Meta:
        model = MedicineSubmission
        fields = '__all__'
        read_only_fields = ['submitted_by', 'reviewer', 'status', 'reviewed_at']

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

class ActivityLogSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ActivityLog
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'role']

class ModeratorRequestSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    reviewed_by = UserSerializer(read_only=True)

    class Meta:
        model = ModeratorRequest
        fields = '__all__'

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
    
class ReminderSerializer(serializers.ModelSerializer):
    medicine_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Reminder
        fields = '__all__'
        read_only_fields = ['user']

    def get_medicine_name(self, obj):
        return obj.medicine_instance.medicine.name_ar
    
class DeviceTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceToken
        fields = '__all__'
        read_only_fields = ['user']