const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const weatherCardsDiv = document.querySelector(".weather-cards");
const currentWeatherDiv = document.querySelector(".current-weather");

const API_KEY = "931add65f661b62e41a10eb706475ea9";  // OpenWeatherMap API key


const createWeatherCard = (cityName, weatherItem, index,aqiText) => {
    const tempCelsius = (weatherItem.main.temp - 273.15).toFixed(2);
    const weatherIcon = `https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png`;
    
    if (index === 0) {  // Main weather card
        return `
            <div class="details">
                <h2>${cityName}</h2>
                <h4>${weatherItem.dt_txt.split(" ")[0]}</h4> 
                <h4>Wind Speed: ${weatherItem.wind.speed} M/s</h4>
                <h4>Humidity: ${weatherItem.main.humidity} %</h4>
                <h4>Air Quality: ${aqiText}</h4>
            </div>
            <img src="graph.png" alt="line-graph" id="line-grap">
            <div class="icon">
                <img src="${weatherIcon}" alt="weather-icon">
                 
                <h4>${weatherItem.weather[0].description}</h4>
            </div>`;
    } else { 
        return `
            <li class="card">
                <h3>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h3>
                <img src="${weatherIcon}" alt="weather-icon">
                <h4>Desc: ${weatherItem.weather[0].description}</h4>
                <h4>Temperature: ${tempCelsius}°C</h4>
                <h4>Wind Speed: ${weatherItem.wind.speed} M/s</h4>
                <h4>Humidity: ${weatherItem.main.humidity} %</h4>
                <h4>Air Quality: ${aqiText}</h4>
                
            </li>`;
    }
};


const getAirQuality = (lat, lon) => {
    const AQI_API_URL = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    
    return fetch(AQI_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status} - ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            const aqi = data.list[0].main.aqi; 
            const aqiDescription = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
            const aqiText = aqiDescription[aqi - 1] || "Unknown";
            return aqiText;
         
        })
        .catch(error => {
            console.error("Error fetching air quality data:", error);
            return "Unavailable";
        });
};


const getWeatherDetails = (cityName, lat, lon) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;
    console.log("Fetching weather data from:", WEATHER_API_URL);
    
    fetch(WEATHER_API_URL)
        .then(res => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status} - ${res.statusText}`);
            }
            return res.json();
        })
        .then(data => {
            console.log("Weather Data:", data);
            
            const uniqueForecastDays = [];
            const fiveDaysForecast = data.list.filter(forecast => {
                const forecastDate = new Date(forecast.dt_txt).getDate();
                if (!uniqueForecastDays.includes(forecastDate)) {
                    uniqueForecastDays.push(forecastDate);
                    return true;
                }
                return false;
            });

           
            cityInput.value = "";
            currentWeatherDiv.innerHTML = "";
            weatherCardsDiv.innerHTML = "";

            
            return getAirQuality(lat, lon)
            .then(aqiText => {
            fiveDaysForecast.forEach((weatherItem, index) => {
                if (index === 0) {
                    currentWeatherDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index,aqiText));
                } else {
                    weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index,aqiText));
                }
            });

           
            console.log(`Updating map to: Latitude: ${lat}, Longitude: ${lon}`);
            updateMap(lat, lon);  
        
        });
    })
        .catch(error => {
            console.error("Error fetching weather forecast:", error);
            alert("An error occurred while fetching the weather forecast: " + error.message);
        });
};


const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (!cityName) return;

    const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    fetch(GEOCODING_API_URL)
    .then(res => {
        if (!res.ok) {
            throw new Error(`HTTP error! Status: ${res.status} - ${res.statusText}`);
        }
        return res.json();
    })
    .then(data => {
        console.log("Geocoding Data:", data); 
        if (!data || data.length === 0) {
            throw new Error("No weather data available for this location.");
        }

        const { lat, lon } = data[0];
        getWeatherDetails(cityName, lat, lon); 
    })
    .catch(error => {
        console.error("Error fetching city coordinates:", error);
        alert("An error occurred while fetching city coordinates: " + error.message);
    });
};



const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            
            fetch(REVERSE_GEOCODING_URL)
                .then(res => res.json())
                .then(data => {
                    const { name } = data[0];
                    getWeatherDetails(name, latitude, longitude);
                })
                .catch(() => alert("An error occurred while fetching the city!"));
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please allow location access.");
            }
        }
    );
};


searchButton.addEventListener("click", getCityCoordinates);
locationButton.addEventListener("click", getUserCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

// Windy API setup
const options = {
    key: 'H3MzWInDcItupZcD6PvvOdQ92hG6mNKw', 
    lat: 19.0760, // Default latitude for Mumbai
    lon: 72.8777, 
    zoom: 10,
};

let windyAPI;

// Initialize the Windy map
windyInit(options, (api) => {
    windyAPI = api;
});


const updateMap = (lat, lon) => {
    console.log(`Updating map to: Latitude: ${lat}, Longitude: ${lon}`); // Log coordinates
    if (windyAPI) {
     
        if (typeof windyAPI.map.setView === 'function') {
            windyAPI.map.setView([lat, lon], 12); 
        } else {
            console.error("setView method not available on windyAPI.map");
        }
    } else {
        console.error("Windy API not initialized.");
    }
};



// Dark mode functionality
const darkModeToggle = document.querySelector('.dark-mode-toggle');
const body = document.body;
const icon = darkModeToggle.querySelector('i');


if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
}


darkModeToggle.addEventListener('click', function () {
    body.classList.toggle('dark-mode');

 
    if (body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'enabled'); 
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'disabled');
    }
});

