import React, { useState, useEffect, useCallback } from "react";
import InteractiveMap from "../components/InteractiveMap";
import WeatherAnimation from "../components/WeatherAnimation";
import Header from "../components/Header";

const OPEN_WEATHER_API_KEY = "cba05fac32e986f325878b497331cfc8";

function DriverRoutePage() {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [weather, setWeather] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(true); // New state for geolocation loading
  const [geolocationError, setGeolocationError] = useState(null);

  // Function to fetch the user's current location
  const fetchCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError("Геолокация не поддерживается вашим браузером.");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
        setIsLocating(false);
        console.log("Получена новая позиция:", latitude, longitude);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setGeolocationError("Разрешение на использование геолокации отклонено.");
            break;
          case error.POSITION_UNAVAILABLE:
            setGeolocationError("Информация о местоположении недоступна.");
            break;
          case error.TIMEOUT:
            setGeolocationError("Превышено время ожидания получения местоположения.");
            break;
          default:
            setGeolocationError("Не удалось определить местоположение.");
            break;
        }
      }
    );
  }, []);

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  const handlePointSelected = useCallback(async (coords) => {
    setSelectedPoint(coords);
    setIsLoading(true);

    try {
      const [lat, lon] = coords;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPEN_WEATHER_API_KEY}&lang=ru`
      );
      const data = await response.json();

      if (!response.ok) {
        console.error("Ошибка ответа:", data.message);
        setWeather({ error: "Не удалось получить данные о погоде." });
        return;
      }

      setWeather({
        temperature: data.main.temp,
        description: data.weather[0].description,
        id: data.weather[0].id,
      });
    } catch (error) {
      console.error("Ошибка получения данных о погоде:", error);
      setWeather({ error: "Ошибка соединения с сервером." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRouteDetails = useCallback((details) => {
    setRouteDetails((prevDetails) => {
      if (
        !prevDetails ||
        prevDetails.distance !== details.distance ||
        prevDetails.duration !== details.duration
      ) {
        console.log("Данные маршрута:", details);
        return details;
      }
      return prevDetails;
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div style={{ fontFamily: "'Roboto', sans-serif", textAlign: "center", padding: "20px" }}>
        <h1 style={{ marginBottom: "20px", fontSize: "28px", color: "#333" }}>Маршруты доставки</h1>

        {isLocating && <p>Определение вашего местоположения...</p>}

        {geolocationError && (
          <p style={{ color: "red", marginBottom: "20px" }}>{geolocationError}</p>
        )}

        {currentLocation && (
          <InteractiveMap
            key={currentLocation.join(",")}
            currentLocation={currentLocation}
            onPointSelected={handlePointSelected}
            onRouteDetails={handleRouteDetails}
          />
        )}

        {selectedPoint && (
          <p style={{ marginTop: "20px", fontSize: "18px", color: "#555" }}>
            Вы выбрали точку: <strong>{selectedPoint[0].toFixed(5)}, {selectedPoint[1].toFixed(5)}</strong>
          </p>
        )}

        {isLoading && <p>Загрузка данных о погоде...</p>}

        {weather && !weather.error && (
          <div style={{
            marginTop: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "20px",
            borderRadius: "8px",
            background: "linear-gradient(145deg, #f5f7fa, #e2e8f0)",
            boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
          }}>
            <WeatherAnimation weatherId={weather.id} />
            <div style={{ marginTop: "10px", fontSize: "18px" }}>
              <p>Температура: <strong>{weather.temperature}°C</strong></p>
              <p style={{ margin: "5px 0", fontSize: "16px", color: "#666" }}>
                {weather.description.charAt(0).toUpperCase() + weather.description.slice(1)}
              </p>
            </div>

            {routeDetails && (
              <div style={{ marginTop: "15px", fontSize: "16px", color: "#555" }}>
                <p>Расстояние: <strong>{routeDetails.distance}</strong></p>
                <p>Время в пути: <strong>{routeDetails.duration}</strong></p>
              </div>
            )}
          </div>
        )}

        {weather && weather.error && <p>{weather.error}</p>}
      </div>
    </div>
  );
}

export default DriverRoutePage;
