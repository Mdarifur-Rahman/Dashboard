from django.urls import path
from . import views

urlpatterns = [
    path('api/weather/', views.get_weather, name='get_weather'),
    path('', views.dashboard_home, name='dashboard_home'),
    path('api/metrics/', views.get_metrics, name='get_metrics'),
    path('api/gps/', views.get_gps, name='get_gps'),
    path('api/chat/', views.chat, name='chat'),
]
