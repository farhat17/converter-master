
from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='convert_image'),
    path('resizer',views.resizer,name='resizer'),
    path('convert-image/', views.convert_image, name='convert_image'),
    path('compress/', views.compress_files_view, name='compress_files'),
    path('generate_audio/', views.generate_audio, name='generate_audio'),
    path('remove-background/', views.remove_background, name='remove-background'),
    # path('subscribe/', views.subscribe, name='subscribe'),
    # path('subscription-success/', views.subscription_success, name='subscription_success'),
    # path('already-subscribed/', views.already_subscribed, name='already_subscribed'),
    path('jsonconverter/', views.convert_json, name='convert_json'),
    path('jsonbeautifier/', views.beautiy_json, name='beautify_json'),

    #  path("aicontent/", views.ai_generate_content, name="ai_generate"),
    path('qr-generator/', views.generate_qr, name='qr_generator'),
]
