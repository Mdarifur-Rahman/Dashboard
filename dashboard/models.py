from django.db import models

class VehicleMetrics(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    speed = models.FloatField()
    energy = models.FloatField()
    temperature = models.FloatField()

class ChatMessage(models.Model):
    timestamp = models.DateTimeField(auto_now_add=True)
    username = models.CharField(max_length=50)
    message = models.TextField()
