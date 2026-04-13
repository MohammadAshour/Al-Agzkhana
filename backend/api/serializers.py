from rest_framework import serializers
from .models import Medicine, MedicineInstance, Condition, Location

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
        queryset=Location.objects.all(), source='location', write_only=True
    )
    expiry_date = serializers.ReadOnlyField()
    is_expired = serializers.ReadOnlyField()

    class Meta:
        model = MedicineInstance
        fields = '__all__'
