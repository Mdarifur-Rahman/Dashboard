// ------------------ GLOBALS & CONSTANTS ------------------
let map, marker, destinationMarker, directionsService, directionsRenderer;
let userLatitude = null,
    userLongitude = null;

const DEFAULT_POSITION = { lat: 42.2808, lng: -83.7430 }; // Ann Arbor, MI
const GEOLOCATION_OPTIONS = { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 };
const MAX_CHART_POINTS = 50;

// ------------------ INIT ------------------
document.addEventListener("DOMContentLoaded", () => {
    console.log("Initializing dashboard...");

    // Start tracking the user’s live location
    trackLiveLocation();

    // Initialize charts
    const speedChart = initializeChart("speedChart", "Speed (km/h)", "#FF6F61", "rgba(255, 111, 97, 0.2)");
    const energyChart = initializeChart("energyChart", "Energy (%)", "#6AB187", "rgba(106, 177, 135, 0.2)");
    const temperatureChart = initializeChart("temperatureChart", "Temperature (°C)", "#4D91FF", "rgba(77, 145, 255, 0.2)");

    // Update metrics and charts periodically
    setInterval(() => {
        updateMetrics();
        updateCharts(speedChart, energyChart, temperatureChart);
    }, 5000);
});

// ------------------ GOOGLE MAP INIT ------------------
window.initMap = function () {
    console.log("Initializing Google Map...");

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 14,
        center: DEFAULT_POSITION,
    });

    marker = new google.maps.Marker({
        position: DEFAULT_POSITION,
        map,
        title: "Your Location",
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();
    directionsRenderer.setMap(map);

    // Set destination by clicking on the map
    map.addListener("click", (event) => {
        setDestination({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    });
};

// ------------------ GEOLOCATION TRACKING ------------------
function trackLiveLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    navigator.geolocation.watchPosition(
        (position) => {
            userLatitude = position.coords.latitude;
            userLongitude = position.coords.longitude;

            document.getElementById("latitude").textContent = userLatitude.toFixed(6);
            document.getElementById("longitude").textContent = userLongitude.toFixed(6);

            updateMarkerPosition({ lat: userLatitude, lng: userLongitude });
            
            // NEW: Update the "Address" field
            reverseGeocode(userLatitude, userLongitude);

        },
        (error) => console.error("Error fetching live location:", error),
        GEOLOCATION_OPTIONS
    );
}

// ------------------ REVERSE GEOCODING ------------------
function reverseGeocode(lat, lng) {
    const geocoder = new google.maps.Geocoder();
    const latlng = { lat, lng };

    geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK") {
            if (results[0]) {
                // Update the "Address" span
                document.getElementById("address").textContent = results[0].formatted_address;
            } else {
                document.getElementById("address").textContent = "No address found.";
            }
        } else {
            console.error("Geocoder failed:", status);
            document.getElementById("address").textContent = "Unable to retrieve address.";
        }
    });
}


// ------------------ MAP UPDATES ------------------
function updateMarkerPosition(position) {
    if (marker) marker.setPosition(position);
    if (map) map.setCenter(position);
}

// ------------------ METRICS ------------------
function updateMetrics() {
    if (!userLatitude || !userLongitude) {
        console.warn("User location not available. Skipping metrics update.");
        return;
    }

    fetch(`/api/metrics/?lat=${userLatitude}&lon=${userLongitude}`)
        .then((response) => response.json())
        .then((data) => {
            document.getElementById("speed").textContent = data.speed || "N/A";
            document.getElementById("energy").textContent = data.energy || "N/A";
            document.getElementById("temperature").textContent = data.temperature
                ? `${data.temperature.toFixed(1)}°C`
                : "N/A";
        })
        .catch((error) => console.error("Error updating metrics:", error));
}

// ------------------ CHART UPDATES ------------------
function updateCharts(speedChart, energyChart, temperatureChart) {
    if (!userLatitude || !userLongitude) return;

    Promise.all([
        fetch(`/api/weather/?lat=${userLatitude}&lon=${userLongitude}`).then((res) => res.json()),
        fetch("/api/metrics/").then((res) => res.json()),
    ])
        .then(([weatherData, metricsData]) => {
            const timestamp = new Date().toLocaleTimeString();

            if (weatherData.temperature !== undefined) {
                updateChartData(temperatureChart, weatherData.temperature, timestamp);
            }
            if (metricsData.speed !== undefined) {
                updateChartData(speedChart, metricsData.speed, timestamp);
            }
            if (metricsData.energy !== undefined) {
                updateChartData(energyChart, metricsData.energy, timestamp);
            }
        })
        .catch((error) => console.error("Error updating charts:", error));
}

// ------------------ DESTINATION & ROUTE ------------------
function setDestination(destination) {
    if (destinationMarker) destinationMarker.setMap(null);

    destinationMarker = new google.maps.Marker({
        position: destination,
        map,
        title: "Destination",
        icon: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
    });

    calculateRoute(marker.getPosition(), destination);
}

function calculateRoute(origin, destination) {
    directionsService.route(
        {
            origin,
            destination,
            travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
            } else {
                console.error("Error calculating route:", status);
                alert("Unable to calculate route.");
            }
        }
    );
}

// ------------------ CHART HELPERS ------------------
function initializeChart(canvasId, label, borderColor, backgroundColor) {
    const ctx = document.getElementById(canvasId).getContext("2d");
    return new Chart(ctx, {
        type: "line",
        data: {
            labels: [],
            datasets: [
                {
                    label,
                    data: [],
                    borderColor,
                    backgroundColor,
                    fill: true,
                    tension: 0.4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: "#333", font: { size: 14, weight: "bold" } },
                },
                tooltip: {
                    backgroundColor: "#fff",
                    titleColor: "#000",
                    bodyColor: "#333",
                },
            },
            scales: {
                x: { 
                    ticks: { color: "#666" }, 
                    grid: { color: "rgba(200, 200, 200, 0.2)" } 
                },
                y: { 
                    ticks: { color: "#666" }, 
                    grid: { color: "rgba(200, 200, 200, 0.2)" } 
                },
            },
        },
    });
}

function updateChartData(chart, value, timestamp) {
    if (chart.data.labels.length >= MAX_CHART_POINTS) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }
    chart.data.labels.push(timestamp);
    chart.data.datasets[0].data.push(value);
    chart.update();
}

