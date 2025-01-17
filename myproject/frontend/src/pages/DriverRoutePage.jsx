import React, { useState } from "react";
import InteractiveMap from "../components/InteractiveMap";
import WeatherAnimation from "../components/WeatherAnimation";
import Header from "../components/Header";

const OPEN_WEATHER_API_KEY = "cba05fac32e986f325878b497331cfc8";

function DriverRoutePage() {
  const [currentLocation] = useState([55.7558, 37.6173]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [weather, setWeather] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePointSelected = async (coords) => {
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
  };

  const handleRouteDetails = (details) => {
    console.log("Данные маршрута:", details);
    setRouteDetails(details);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div style={{ fontFamily: "'Roboto', sans-serif", textAlign: "center", padding: "20px" }}>
        <h1 style={{ marginBottom: "20px", fontSize: "28px", color: "#333" }}>Маршруты доставки</h1>

        <InteractiveMap
          currentLocation={currentLocation}
          onPointSelected={handlePointSelected}
          onRouteDetails={handleRouteDetails}
        />

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
