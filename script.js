// Weather PWA - CIS 503
// app.js

const DEFAULT_LOCATION = "48706";
const DEFAULT_CALENDAR = "";

const weatherElement = document.getElementById("weather");
const locationElement = document.getElementById("location");
const scheduleElement = document.getElementById("schedule");

const settingsButton = document.getElementById("settingsButton");
const settingsSection = document.getElementById("settings");

const locationInput = document.getElementById("locationInput");
const changeLocationButton = document.getElementById("changeLocation");

const calendarInput = document.getElementById("calendarInput");
const changeCalendarButton = document.getElementById("changeCalendar");

// Get saved settings or use defaults
let savedLocation = localStorage.getItem("weatherLocation") || DEFAULT_LOCATION;
let savedCalendar = localStorage.getItem("calendarId") || DEFAULT_CALENDAR;

// Put saved values into the settings boxes
locationInput.value = savedLocation;
calendarInput.value = savedCalendar;

// Show/hide settings
settingsButton.addEventListener("click", function () {
    if (settingsSection.style.display === "none" ||
        settingsSection.style.display === "") {
        settingsSection.style.display = "block";
    } else {
        settingsSection.style.display = "none";
    }
});

// Change location
changeLocationButton.addEventListener("click", function () {
    const newLocation = locationInput.value.trim();

    if (newLocation === "") {
        alert("Please enter a ZIP code or city.");
        return;
    }

    localStorage.setItem("weatherLocation", newLocation);
    savedLocation = newLocation;

    loadWeather();
});

// Change calendar
changeCalendarButton.addEventListener("click", function () {
    const newCalendar = calendarInput.value.trim();

    localStorage.setItem("calendarId", newCalendar);
    savedCalendar = newCalendar;

    loadSchedule();
});

// Load weather
async function loadWeather() {
    weatherElement.textContent = "Loading today's weather...";
    locationElement.textContent = savedLocation;

    try {
        // Geocoding API
        const geoURL =
            "https://geocoding-api.open-meteo.com/v1/search?name=" +
            encodeURIComponent(savedLocation) +
            "&count=1&language=en&format=json";

        const geoResponse = await fetch(geoURL);

        if (!geoResponse.ok) {
            throw new Error("Could not find location.");
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error("Location not found.");
        }

        const place = geoData.results[0];

        const latitude = place.latitude;
        const longitude = place.longitude;

        const placeName = place.name || savedLocation;
        const state = place.admin1 || "";
        const country = place.country || "";

        locationElement.textContent =
            [placeName, state, country]
                .filter(Boolean)
                .join(", ");

        // Weather API
        const weatherURL =
            "https://api.open-meteo.com/v1/forecast" +
            "?latitude=" + latitude +
            "&longitude=" + longitude +
            "&current=temperature_2m,weather_code" +
            "&temperature_unit=fahrenheit" +
            "&timezone=auto";

        const weatherResponse = await fetch(weatherURL);

        if (!weatherResponse.ok) {
            throw new Error("Weather service unavailable.");
        }

        const weatherData = await weatherResponse.json();

        const temperature =
            Math.round(weatherData.current.temperature_2m);

        const weatherCode =
            weatherData.current.weather_code;

        const description =
            getWeatherDescription(weatherCode);

        weatherElement.textContent =
            `${description}, ${temperature}°F`;

    } catch (error) {
        console.error(error);

        weatherElement.textContent =
            "Unable to load weather.";

        locationElement.textContent =
            savedLocation;
    }
}

// Convert Open-Meteo weather codes to descriptions
function getWeatherDescription(code) {

    if (code === 0) {
        return "Clear sky";
    }

    if (code === 1 || code === 2 || code === 3) {
        return "Partly cloudy";
    }

    if (code === 45 || code === 48) {
        return "Foggy";
    }

    if (code >= 51 && code <= 57) {
        return "Drizzle";
    }

    if (code >= 61 && code <= 67) {
        return "Rain";
    }

    if (code >= 71 && code <= 77) {
        return "Snow";
    }

    if (code >= 80 && code <= 82) {
        return "Rain showers";
    }

    if (code === 85 || code === 86) {
        return "Snow showers";
    }

    if (code >= 95 && code <= 99) {
        return "Thunderstorm";
    }

    return "Unknown weather";
}

// Load schedule
function loadSchedule() {

    scheduleElement.innerHTML = "";

    const calendarId =
        localStorage.getItem("calendarId") || "";

    if (calendarId === "") {

        const row = document.createElement("tr");

        row.innerHTML =
            `<td colspan="3">
                No Google Calendar configured.
             </td>`;

        scheduleElement.appendChild(row);

        return;
    }

    // Placeholder schedule information
    // A public Google Calendar can be connected later.
    const row = document.createElement("tr");

    row.innerHTML =
        `<td colspan="3">
            Calendar configured: ${escapeHTML(calendarId)}
         </td>`;

    scheduleElement.appendChild(row);
}

// Prevent HTML injection when displaying calendar ID
function escapeHTML(value) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Register service worker if available
if ("serviceWorker" in navigator) {

    window.addEventListener("load", function () {

        navigator.serviceWorker
            .register("service-worker.js")
            .then(function (registration) {
                console.log(
                    "Service worker registered:",
                    registration.scope
                );
            })
            .catch(function (error) {
                console.log(
                    "Service worker registration failed:",
                    error
                );
            });

    });
}

// Start application
loadWeather();
loadSchedule();
