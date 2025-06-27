# forms.py

from django import forms
from django.core.validators import URLValidator, ValidationError

class ImageUploadForm(forms.Form):
    image = forms.ImageField()
    output_format = forms.ChoiceField(choices=[
        ('JPEG', 'JPEG'),
        ('PNG', 'PNG'),
        ('GIF', 'GIF'),
        ('BMP', 'BMP'),
        ('TIFF', 'TIFF'),
        ('HEIC','HEIC'),
        ('WEBP', 'WEBP'),
    ])
class UploadForm(forms.Form):
    json_file = forms.FileField(label='JSON File', allow_empty_file=False)
    format = forms.ChoiceField(choices=(('csv', 'CSV'), ('xml', 'XML')))



class QRCodeForm(forms.Form):
    CONTENT_TYPES = (
        ('website', 'Website URL'),
        ('vcard', 'Business Card'),
        ('wifi', 'WiFi Credentials'),
    )
    
    content_type = forms.ChoiceField(choices=CONTENT_TYPES, widget=forms.RadioSelect)
    url = forms.URLField(required=False, validators=[URLValidator()])
    # vCard fields
    name = forms.CharField(required=False, max_length=100)
    company = forms.CharField(required=False, max_length=100)
    phone = forms.CharField(required=False, max_length=20)
    email = forms.EmailField(required=False)
    # WiFi fields
    ssid = forms.CharField(required=False, max_length=32)
    password = forms.CharField(required=False, max_length=64, widget=forms.PasswordInput)
    encryption = forms.ChoiceField(
        required=False,
        choices=(('WPA', 'WPA/WPA2'), ('WEP', 'WEP'), ('nopass', 'No Password'))
    )
    # Design fields
    color = forms.CharField(max_length=7, widget=forms.TextInput(attrs={'type': 'color'}))
    logo = forms.ImageField(required=False)  # 200KB limit

    def clean(self):
        cleaned_data = super().clean()
        content_type = cleaned_data.get('content_type')
        
        if content_type == 'website' and not cleaned_data.get('url'):
            raise ValidationError("URL is required for website QR codes")
        if content_type == 'vcard' and not cleaned_data.get('name'):
            raise ValidationError("Name is required for business cards")
        if content_type == 'wifi' and not cleaned_data.get('ssid'):
            raise ValidationError("SSID is required for WiFi QR codes")
            
        return cleaned_data