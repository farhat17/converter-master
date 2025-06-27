
from django.db import models
from django.contrib.auth.models import User

class Image(models.Model):
    image = models.ImageField(upload_to='images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    subscription_active = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username
