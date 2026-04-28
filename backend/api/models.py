from django.db import models
from django.contrib.auth.models import User
from datetime import date
from dateutil.relativedelta import relativedelta
import random, string
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('user', 'مستخدم'),
        ('moderator', 'مشرف'),
        ('admin', 'مدير'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')

    def __str__(self):
        return f"{self.user.email} - {self.role}"


def generate_family_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))


class Condition(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name


class Medicine(models.Model):
    name_ar = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200, blank=True)
    FORM_CHOICES = [
    ('tablet', 'قرص'),
    ('capsule', 'كبسولة'),
    ('syrup', 'شراب'),
    ('drops', 'قطرة'),
    ('cream', 'كريم'),
    ('injection', 'حقنة'),
    ('inhaler', 'بخاخ'),
    ('suppository', 'تحميلة'),
    ('patch', 'لصقة'),
    ('other', 'أخرى'),
    ]
    form = models.CharField(max_length=20, choices=FORM_CHOICES, default='other')
    shelf_life_months = models.PositiveIntegerField()
    shelf_life_after_opening_months = models.PositiveIntegerField()
    conditions = models.ManyToManyField(Condition)
    safe_during_pregnancy = models.BooleanField(default=False)
    safe_during_breastfeeding = models.BooleanField(default=False)
    safe_for_diabetics = models.BooleanField(default=False)
    safe_for_hypertensive = models.BooleanField(default=False)

    def __str__(self):
        return self.name_ar


class Family(models.Model):
    name = models.CharField(max_length=200)
    code = models.CharField(max_length=20, unique=True, default=generate_family_code)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_families')
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class FamilyMembership(models.Model):
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='family_memberships')
    joined_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        unique_together = ('family', 'user')

class Location(models.Model):
    name = models.CharField(max_length=200)
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='locations', null=True)

    def __str__(self):
        return self.name
        

class MedicineInstance(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    production_date = models.DateField()
    open_date = models.DateField(null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True)
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='instances', null=True)
    quantity = models.PositiveIntegerField(default=1)
    min_threshold = models.PositiveIntegerField(default=1)

    @property
    def expiry_date(self):
        full_expiry = self.production_date + relativedelta(months=self.medicine.shelf_life_months)
        if self.open_date and self.medicine.form in ['syrup', 'drops']:
            open_expiry = self.open_date + relativedelta(months=self.medicine.shelf_life_after_opening_months)
            return min(full_expiry, open_expiry)
        return full_expiry

    @property
    def is_expired(self):
        return self.expiry_date < date.today()

    def __str__(self):
        return f"{self.medicine.name_ar} - {self.location}"
    
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.get_or_create(user=instance)