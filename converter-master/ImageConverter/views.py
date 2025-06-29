from django.shortcuts import render
from PIL import Image
from io import BytesIO
from django.http import HttpResponse
from django.core.files.storage import FileSystemStorage
import os
import io
import uuid
from .models import UserProfile
from django.http import HttpResponseRedirect
from django.urls import reverse
from .models import UserProfile
from docx import Document
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import pandas as pd
from django.conf import settings
import pytesseract
import re
import zipfile
from rembg import remove
from django.http import HttpResponse, JsonResponse
from gtts import gTTS
from pydub import AudioSegment
from tempfile import NamedTemporaryFile
from urllib.parse import unquote
import json
import csv
import re
from xml.etree.ElementTree import Element, SubElement, tostring
from django.http import HttpResponse, HttpResponseBadRequest
from django.shortcuts import render
from django.conf import settings
from .forms import UploadForm
# import openai
import qrcode
import qrcode.image.svg
from io import BytesIO
import re
from PIL import Image
from django.http import HttpResponse
from django.shortcuts import render
from django.conf import settings
from .forms import QRCodeForm

# from exceptions import PendingDeprecationWarning
def index(request):
    if request.method == 'POST' and request.FILES.get('image'):
        uploaded_file = request.FILES['image']
        image_format = request.POST.get('format', 'jpg').upper()

        if image_format == 'JPG':
            image_format = 'JPEG'

        allowed_formats = ['JPEG', 'PNG', 'TIFF', 'GIF', 'WEBP', 'BMP', 'HEIF', 'HEIC']
        if image_format not in allowed_formats:
            return render(request, 'index.html', {'error_message': 'Unsupported file format.'})

        try:
            image = Image.open(uploaded_file)

            output_image = BytesIO()
            image.save(output_image, format=image_format)
            output_image.seek(0)

            original_name = os.path.splitext(uploaded_file.name)[0]
            unique_filename = f"{original_name}_{uuid.uuid4().hex}"

            fs = FileSystemStorage(location='media/')
            filename = f"{unique_filename}.{image_format.lower()}"
            fs.save(filename, output_image)

            download_url = fs.url(filename)

            return render(request, 'index.html', {
                'success_message': 'Image converted successfully!',
                'download_url': download_url
            })
        except Exception as e:
            return render(request, 'index.html', {'error_message': f'Error processing image: {str(e)}'})

    return render(request, 'index.html')

# def subscribe(request):
#     # Handle subscription logic here (e.g., Stripe, PayPal, etc.)
    
#     # Example logic to check if user is already subscribed (if needed)
#     if request.user.is_authenticated:
#         user_profile, created = UserProfile.objects.get_or_create(user=request.user)
#         if user_profile.subscription_active:
#             return HttpResponseRedirect(reverse('already_subscribed'))
    
#     # If the subscription is processed successfully, activate the subscription
#     if request.method == 'POST':
#         # Example logic for activating subscription
#         user_profile, created = UserProfile.objects.get_or_create(user=request.user)
#         user_profile.subscription_active = True
#         user_profile.save()
        
#         # Redirect to a success page after subscribing
#         return HttpResponseRedirect(reverse('subscription_success'))
    
#     return render(request, 'subscribe.html')


def resizer(request):
    # Check if the user is logged in and has an active subscription
    is_subscribed = False
    if request.user.is_authenticated:
        try:
            user_profile = UserProfile.objects.get(user=request.user)
            is_subscribed = user_profile.subscription_active
        except UserProfile.DoesNotExist:
            pass  # No subscription information found for this user

    # Handle free image resizing
    if request.method == 'POST' and 'image' in request.FILES:
        image_file = request.FILES['image']
        width = request.POST.get('width')
        height = request.POST.get('height')

        if not width or not height:
            return render(request, 'resize_image.html', {'error_message': 'Width and Height are required.'})

        fs = FileSystemStorage()
        filename = fs.save(image_file.name, image_file)

        try:
            # Open and resize the image
            img = Image.open(fs.path(filename))
            width = int(width)
            height = int(height)
            # Use the updated resampling filter (Image.Resampling.LANCZOS)
            img = img.resize((width, height), Image.Resampling.LANCZOS)

            resized_image = BytesIO()
            img.save(resized_image, format='JPEG')
            resized_image.seek(0)

            resized_filename = f"resized_{filename}"
            fs.save(resized_filename, resized_image)

            download_url = fs.url(resized_filename)

            return render(request, 'resizer.html', {
                'success_message': 'Image resized successfully.',
                'download_url': download_url,
                'is_subscribed': is_subscribed  # Pass the subscription status
            })
        except Exception as e:
            return render(request, 'resizer.html', {'error_message': f'Error resizing the image: {e}', 'is_subscribed': is_subscribed})

    # Handle bulk image resizing (only for subscribed users)
    if is_subscribed and request.method == 'POST' and 'images' in request.FILES:
        images = request.FILES.getlist('images')
        width = request.POST.get('width')
        height = request.POST.get('height')

        if not width or not height:
            return render(request, 'resizer.html', {'error_message': 'Width and Height are required.', 'is_subscribed': is_subscribed})

        fs = FileSystemStorage()
        resized_files = []
        errors = []

        try:
            for image_file in images:
                filename = fs.save(image_file.name, image_file)
                img = Image.open(fs.path(filename))

                width = int(width)
                height = int(height)
                # Use the updated resampling filter (Image.Resampling.LANCZOS)
                img = img.resize((width, height), Image.Resampling.LANCZOS)

                resized_image = BytesIO()
                img.save(resized_image, format='JPEG')
                resized_image.seek(0)

                resized_filename = f"resized_{filename}"
                fs.save(resized_filename, resized_image)

                resized_files.append(fs.url(resized_filename))

            return render(request, 'resizer.html', {
                'success_message': f'{len(resized_files)} images resized successfully.',
                'download_urls': resized_files,
                'is_subscribed': is_subscribed  # Pass the subscription status
            })

        except Exception as e:
            errors.append(f'Error resizing images: {e}')

        return render(request, 'resizer.html', {'error_message': errors, 'is_subscribed': is_subscribed})

    # If no POST request, just show the resizer page with the current subscription status
    return render(request, 'resizer.html', {'is_subscribed': is_subscribed})


def ocr_from_image(image_path):
    try:
        img = Image.open(image_path)
        text = pytesseract.image_to_string(img)
        print(text)
        return text
    except Exception as e:
        print(f"Error reading image: {e}")
        return None

def convert_text_to_pdf(text):
    pdf_file = os.path.join(settings.MEDIA_ROOT, f"{uuid.uuid4()}_converted.pdf")
    c = canvas.Canvas(pdf_file, pagesize=letter)
    c.drawString(100, 750, text)
    c.save()
    return os.path.basename(pdf_file)

def convert_text_to_docx(text):
    docx_file = os.path.join(settings.MEDIA_ROOT, f"{uuid.uuid4()}_converted.docx")
    doc = Document()
    doc.add_paragraph(text)
    doc.save(docx_file)
    return os.path.basename(docx_file)

def clean_text_for_xlsx(text):
    # Function to clean the text, for example removing unwanted characters or formatting.
    # Add any text cleaning logic that fits your data
    return text.strip()

def is_tabular(text):
    """
    Check if the text appears to be tabular, based on delimiters such as spaces, tabs, or commas.
    A basic assumption is that tabular data will have multiple columns, with at least one space separating values.
    """
    lines = text.split('\n')
    
    # For tabular data, there should be a consistent pattern of multiple columns in each row
    for line in lines:
        # Ignore empty lines and check if there are more than one element in the line after cleaning
        if len(line.split()) > 1:  # If a line has more than one word, assume tabular data
            return True
    return False

def convert_text_to_xlsx(text):
    cleaned_text = clean_text_for_xlsx(text)
    
    if is_tabular(cleaned_text):
        rows = [line.split() for line in cleaned_text.split('\n') if line.strip()]
        df = pd.DataFrame(rows)
        xlsx_file = os.path.join(settings.MEDIA_ROOT, f"{uuid.uuid4()}_converted_tabular.xlsx")
    else:
        data = [line.strip() for line in cleaned_text.split('\n') if line.strip()]
        df = pd.DataFrame(data, columns=["Extracted Text"])
        xlsx_file = os.path.join(settings.MEDIA_ROOT, f"{uuid.uuid4()}_converted_text.xlsx")
    
    df.to_excel(xlsx_file, index=False)
    return os.path.basename(xlsx_file)

def convert_image(request):
    if request.method == 'POST' and request.FILES.get('image'):
        image = request.FILES['image']
        format_selected = request.POST.get('format')

        fs = FileSystemStorage(location=settings.MEDIA_ROOT)
        filename = fs.save(image.name, image)
        uploaded_image_path = os.path.join(settings.MEDIA_ROOT, filename)

        text = ocr_from_image(uploaded_image_path)

        if text is None or text.strip() == "":
            return render(request, 'document_converter.html', {
                'error_message': 'Failed to extract text from the image.',
            })

        converted_file = None
        if format_selected == 'pdf':
            converted_file = convert_text_to_pdf(text)
        elif format_selected == 'docx':
            converted_file = convert_text_to_docx(text)
        elif format_selected == 'xlsx':
            converted_file = convert_text_to_xlsx(text)

        # Provide the download link for the converted file
        if converted_file:
            download_url = f"{settings.MEDIA_URL}{converted_file}"
            success_message = "File converted successfully!"
        else:
            success_message = "Failed to convert the file."
            download_url = None

        return render(request, 'document_converter.html', {
            'success_message': success_message,
            'download_url': download_url,
        })

    return render(request, 'document_converter.html')




def compress_files_view(request):
    if request.method == 'POST' and 'files' in request.FILES:
        files = request.FILES.getlist('files')
        
        fs = FileSystemStorage(location=settings.MEDIA_ROOT)
        
        file_paths = []
        
        for file in files:
            print(f"Saving file: {file.name}")
            unique_filename = f"{uuid.uuid4()}_{file.name}"
            filename = fs.save(unique_filename, file)
            file_path = os.path.join(settings.MEDIA_ROOT, filename)
            print(f"File saved at: {file_path}")
            file_paths.append(file_path)
        
        output_filename = f"{uuid.uuid4()}_compressed_files.zip"  # Unique output zip file name
        compressed_file_path = compress_files(file_paths, output_filename)
        
        download_url = f"{settings.MEDIA_URL}{output_filename}"
        
        return render(request, 'compressor.html', {
            'success_message': 'Files compressed successfully!',
            'download_url': download_url,
        })
    
    return render(request, 'compressor.html')


def compress_files(files, output_filename):
    """
    Compress multiple files into a single zip archive.
    
    :param files: List of file paths to compress
    :param output_filename: The name of the output zip file
    :return: Path to the created zip file
    """
    zip_file_path = os.path.join(settings.MEDIA_ROOT, output_filename)
    
    with zipfile.ZipFile(zip_file_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file in files:
            print(f"Checking if file exists: {file}")
            if os.path.exists(file):
                zipf.write(file, os.path.basename(file)) 
            else:
                print(f"File {file} does not exist.")
    
    return os.path.join('media', output_filename)






# # Path to save generated files
# SAVE_PATH = "generated_audio/"

# # Ensure the folder exists
# os.makedirs(SAVE_PATH, exist_ok=True)

# # View to handle text to speech conversion and download
def generate_audio(request):
    # return render(request,'audio.html')
    text = request.GET.get('text', None)
    audio_format = request.GET.get('format', 'mp3')

    if not text:
        return render({"error": "No text provided"}, status=400)

#     try:
#         # Generate speech using gTTS
#         tts = gTTS(text=text, lang='en')
#         mp3_file_path = os.path.join(SAVE_PATH, "temp_audio.mp3")
#         tts.save(mp3_file_path)

#         # Convert MP3 to desired format (WAV or MP3)
#         if audio_format.lower() == 'wav':
#             audio = AudioSegment.from_mp3(mp3_file_path)
#             wav_file_path = os.path.join(SAVE_PATH, "audio.wav")
#             audio.export(wav_file_path, format='wav')
#             os.remove(mp3_file_path)  # Delete the temp MP3 file
#             return serve_audio(wav_file_path, 'audio.wav')

#         # Return MP3 file if no conversion needed
#         return serve_audio(mp3_file_path, 'audio.mp3')

#     except Exception as e:
#         return JsonResponse({"error": str(e)}, status=500)

# # Function to serve audio file
# def serve_audio(file_path, filename):
#     with open(file_path, 'rb') as f:
#         response = HttpResponse(f.read(), content_type='audio/mpeg' if filename.endswith('.mp3') else 'audio/wav')
#         response['Content-Disposition'] = f'attachment; filename="{filename}"'
#         os.remove(file_path)  # Clean up the generated file
#         return response




def remove_background(request):
    success_message = None
    error_message = None
    download_url = None

    if request.method == 'POST' and request.FILES.get('image'):
        try:
            # Retrieve uploaded image
            uploaded_image = request.FILES['image']
            
            # Generate a unique filename to avoid clashes when multiple users upload images
            unique_filename = str(uuid.uuid4()) + os.path.splitext(uploaded_image.name)[1]
            fs = FileSystemStorage()
            filename = fs.save(unique_filename, uploaded_image)

            # Properly decode the file path for file system usage
            uploaded_image_path = unquote(fs.url(filename))  # Decode the URL-encoded path

            # Resolve full file system path to open the image
            full_image_path = os.path.join(settings.BASE_DIR, uploaded_image_path.lstrip('/'))

            # Read the image
            with open(full_image_path, 'rb') as i:
                input_image = i.read()

            # Process the image to remove the background
            output_image = remove(input_image)

            # Save the output image (transparent background) with a unique name
            output_filename = f"output_{unique_filename}"
            output_image_path = os.path.join('media', 'output', output_filename)

            # Create the output directory if it doesn't exist
            output_dir = os.path.join(settings.BASE_DIR, 'media', 'output')
            if not os.path.exists(output_dir):
                os.makedirs(output_dir)

            # Save processed image in the output directory
            output_image_pil = Image.open(io.BytesIO(output_image))
            output_image_pil.save(os.path.join(settings.BASE_DIR, output_image_path), format='PNG')

            # Provide a download link
            download_url = f'/media/output/{output_filename}'
            success_message = "Background successfully removed!"

        except Exception as e:
            error_message = f"An error occurred: {str(e)}"

    return render(request, 'removebg.html', {
        'success_message': success_message,
        'error_message': error_message,
        'download_url': download_url
    })

MAX_FILE_SIZE = 1024 * 1024  # 1MB

def sanitize_xml_tag(name):
    # Remove invalid characters and ensure valid XML tag
    name = re.sub(r'[^a-zA-Z0-9_]', '_', name)
    if re.match(r'^\d', name):
        name = '_' + name
    return name[:100]  # Limit tag length

def convert_json(request):
    if request.method == 'POST':
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            json_file = request.FILES['json_file']
            
            # Security checks
            if json_file.size > MAX_FILE_SIZE:
                return HttpResponseBadRequest("File size exceeds 1MB limit")
            if not json_file.name.lower().endswith('.json'):
                return HttpResponseBadRequest("Invalid file type")

            try:
                # Read and parse JSON securely
                data = json.load(json_file)
            except json.JSONDecodeError:
                return HttpResponseBadRequest("Invalid JSON format")
            
            # Normalize data to list of dictionaries
            if not isinstance(data, list):
                data = [data]

            output_format = form.cleaned_data['format']
            
            try:
                if output_format == 'csv':
                    return generate_csv_response(data)
                elif output_format == 'xml':
                    return generate_xml_response(data)
            except Exception as e:
                return HttpResponseBadRequest(f"Conversion error: {str(e)}")

    else:
        form = UploadForm()
    
    return render(request, 'jsonconverter.html', {'form': form})

def generate_csv_response(data):
    response = HttpResponse(content_type='text/csv')
    response['Content-Disposition'] = 'attachment; filename="converted.csv"'
    
    if not data:
        return response
    
    writer = csv.writer(response)
    headers = list(data[0].keys())
    writer.writerow(headers)
    
    for item in data:
        if not isinstance(item, dict):
            continue
        writer.writerow([str(item.get(key, '')) for key in headers])
    
    return response

def generate_xml_response(data):
    response = HttpResponse(content_type='application/xml')
    response['Content-Disposition'] = 'attachment; filename="converted.xml"'
    
    root = Element('data')
    for item in data:
        if not isinstance(item, dict):
            continue
        entry = SubElement(root, 'entry')
        for key, value in item.items():
            safe_key = sanitize_xml_tag(str(key))
            elem = SubElement(entry, safe_key)
            elem.text = str(value)[:1000]  # Limit text length
    
    response.write(tostring(root, encoding='unicode', xml_declaration=True))
    return response



def sanitize_filename(name):
    return re.sub(r'[^a-zA-Z0-9_-]', '', name)[:50]

def generate_qr(request):
    if request.method == 'POST':
        form = QRCodeForm(request.POST, request.FILES)
        if form.is_valid():
            # Build QR code content
            content_type = form.cleaned_data['content_type']
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )

            if content_type == 'website':
                data = form.cleaned_data['url']
            elif content_type == 'vcard':
                data = f"BEGIN:VCARD\nVERSION:3.0\nN:{form.cleaned_data['name']}\n"
                data += f"ORG:{form.cleaned_data['company']}\n"
                data += f"TEL:{form.cleaned_data['phone']}\n"
                data += f"EMAIL:{form.cleaned_data['email']}\nEND:VCARD"
            elif content_type == 'wifi':
                auth_type = form.cleaned_data['encryption']
                data = f"WIFI:S:{form.cleaned_data['ssid']};T:{auth_type};P:{form.cleaned_data['password']};;"

            # Generate QR code
            qr.add_data(data)
            qr.make(fit=True)
            
            # Create base image with custom colors
            main_color = form.cleaned_data['color']
            img = qr.make_image(fill_color=main_color, back_color="white").convert('RGB')

            # Add logo if provided
            logo = form.cleaned_data.get('logo')
            if logo:
                logo_img = Image.open(logo)
                logo_size = min(img.size) // 4
                logo_img.thumbnail((logo_size, logo_size))
                
                # Center logo
                pos = (
                    (img.size[0] - logo_img.size[0]) // 2,
                    (img.size[1] - logo_img.size[1]) // 2
                )
                img.paste(logo_img, pos)

            # Prepare response
            buffer = BytesIO()
            img.save(buffer, format="PNG")
            buffer.seek(0)
            
            filename = sanitize_filename(
                f"qr-{content_type}-{form.cleaned_data.get('name', '')}"
            ) + ".png"

            response = HttpResponse(buffer, content_type='image/png')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response['Cache-Control'] = 'no-store, max-age=0'
            return response

    else:
        form = QRCodeForm()
    
    return render(request, 'qr_generator.html', {'form': form})


def ai_generate_content(request):
    generated_text = ""

    if request.method == "POST":
        prompt = request.POST.get("prompt")
        if prompt:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=500,
            )
            generated_text = response["choices"][0]["message"]["content"]

    return render(request, "content_generator.html", {"generated_text": generated_text})



def beautiy_json(request):
    return render(request,'jsonbeautifier.html')

def resume_builder(request):
    return render(request, 'resume.html')

    if request.method == 'POST':
        form = UploadForm(request.POST, request.FILES)
        if form.is_valid():
            json_file = request.FILES['json_file']
            
            # Security checks
            if json_file.size > MAX_FILE_SIZE:
                return HttpResponseBadRequest("File size exceeds 1MB limit")
            if not json_file.name.lower().endswith('.json'):
                return HttpResponseBadRequest("Invalid file type")

            try:
                # Read and parse JSON securely
                data = json.load(json_file)
            except json.JSONDecodeError:
                return HttpResponseBadRequest("Invalid JSON format")
            
            # Normalize data to list of dictionaries
            if not isinstance(data, list):
                data = [data]

            # Process the resume data and render the template
            return render(request, 'resume.html', {'data': data})

    else:
        form = UploadForm()
    
    return render(request, 'resume.html', {'form': form})