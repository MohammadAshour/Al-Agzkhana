from django.db import models
from datetime import date
from dateutil.relativedelta import relativedelta

class Condition(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name

class Medicine(models.Model):
    name_ar = models.CharField(max_length=200)
    name_en = models.CharField(max_length=200, blank=True)
    shelf_life_months = models.PositiveIntegerField()
    shelf_life_after_opening_months = models.PositiveIntegerField()
    conditions = models.ManyToManyField(Condition)
    safe_during_pregnancy = models.BooleanField(default=False)
    safe_during_breastfeeding = models.BooleanField(default=False)
    safe_for_diabetics = models.BooleanField(default=False)
    safe_for_hypertensive = models.BooleanField(default=False)

    def __str__(self):
        return self.name_ar

class Location(models.Model):
    name = models.CharField(max_length=200)

    def __str__(self):
        return self.name
        
class MedicineInstance(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    production_date = models.DateField()
    open_date = models.DateField(null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.SET_NULL, null=True)

    @property
    def expiry_date(self):
        full_expiry = self.production_date + relativedelta(months=self.medicine.shelf_life_months)
        if self.open_date:
            open_expiry = self.open_date + relativedelta(months=self.medicine.shelf_life_after_opening_months)
            return min(full_expiry, open_expiry)
        return full_expiry

    @property
    def is_expired(self):
        return self.expiry_date < date.today()

    def __str__(self):
        return f"{self.medicine.name_ar} - {self.location}"