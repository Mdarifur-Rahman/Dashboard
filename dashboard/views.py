from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
import requests


@login_required
def dashboard_home(request):
    return render(request, 'dashboard/dashboard.html')


def get_metrics(request):
    api_key = "353fd107fc825a7527724fbd7a65b156"  # Replace with your OpenWeatherMap API key
    base_url = "http://api.openweathermap.org/data/2.5/weather"

    # Default location 
    lat = 0
    lon = 0

    # Initialize temperature
    temperature = None

    # Fetch live temperature
    try:
        response = requests.get(base_url, params={
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric'
        })
        if response.status_code == 200:
            weather_data = response.json()
            temperature = weather_data['main']['temp']  # Get temperature from API
        else:
            print("Weather API Error:", response.json())  # Log API response for debugging
    except Exception as e:
        print("Error connecting to Weather API:", e)

    # Use API temperature or fallback to the last known API value (if saved)
    if temperature is None:
        # You can implement caching here or keep a "last known value"
        print("Using fallback temperature")
        temperature = 30  # Fallback value in case API fails completely

    # Simulate other dynamic data
    data = {
        'speed': 80,          # Example: Speed in km/h
        'energy': 65,         # Example: Battery energy percentage
        'temperature': temperature  # Use live or fallback temperature
    }
    return JsonResponse(data)


def get_gps(request):
    # Placeholder for GPS data
    return JsonResponse({'latitude': 42.2808, 'longitude': -83.7430})

def chat(request):
    # Placeholder for chat messages
    return JsonResponse({'messages': []})

def login_user(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return redirect('dashboard_home')
        else:
            messages.error(request, 'Invalid username or password')
    return render(request, 'dashboard/login.html')


def logout_user(request):
    logout(request)  # Log the user out
    return redirect('login')  # Redirect to the login page after logging out


def register_user(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        password2 = request.POST['password2']
        if password == password2:
            if User.objects.filter(username=username).exists():
                messages.error(request, 'Username already exists')
            else:
                user = User.objects.create_user(username=username, password=password)
                user.save()
                messages.success(request, 'Account created successfully')
                return redirect('login')
        else:
            messages.error(request, 'Passwords do not match')
    return render(request, 'dashboard/register.html')

def dashboard_home(request):
    if not request.user.is_authenticated:
        return redirect('login')
    return render(request, 'dashboard/dashboard.html')


def get_weather(request):
    api_key = "353fd107fc825a7527724fbd7a65b156"  # Replace with your OpenWeatherMap API key
    base_url = "http://api.openweathermap.org/data/2.5/weather"

    # Get latitude and longitude from the request
    lat = request.GET.get('lat')
    lon = request.GET.get('lon')

    if not lat or not lon:
        return JsonResponse({'error': 'Latitude and longitude are required'}, status=400)

    try:
        response = requests.get(base_url, params={
            'lat': lat,
            'lon': lon,
            'appid': api_key,
            'units': 'metric'
        })
        data = response.json()
        if response.status_code == 200:
            temperature = data['main']['temp']
            return JsonResponse({'temperature': temperature})
        else:
            return JsonResponse({'error': data.get('message', 'API error')}, status=response.status_code)
    except Exception as e:
        print("Error fetching weather data:", e)
        return JsonResponse({'error': 'Failed to fetch weather data'}, status=500)



def get_gps(request):
    # Simulating GPS data for demonstration purposes
    # Replace with your real GPS data source
    gps_data = {
        'latitude': 42.2808,  # Example: Ann Arbor, MI
        'longitude': -83.7430,
    }
    return JsonResponse(gps_data)

