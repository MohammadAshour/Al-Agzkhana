from django.db import models

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

    def __str__(self):
        return self.name_ar

class MedicineInstance(models.Model):
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    production_date = models.DateField()
    open_date = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=200)

    def __str__(self):
        return f"{self.medicine.name_ar} - {self.location}"