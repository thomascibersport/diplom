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
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [geolocationError, setGeolocationError] = useState(null);

  const fetchCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeolocationError("Геолокация не поддерживается вашим браузером.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
      },
      () => {
        setGeolocationError("Не удалось определить местоположение.");
      }
    );
  }, []);

  const fetchWeatherData = useCallback(async (coords) => {
    try {
      setIsLoadingWeather(true);
      const [lat, lon] = coords;
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPEN_WEATHER_API_KEY}&lang=ru`
      );
      const data = await response.json();

      if (!response.ok) {
        setWeather({ error: "Не удалось получить данные о погоде." });
        return;
      }

      setWeather({
        temperature: data.main.temp,
        description: data.weather[0].description,
        id: data.weather[0].id,
      });
    } catch {
      setWeather({ error: "Ошибка при получении данных о погоде." });
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  const handlePointSelected = useCallback((coords) => {
    setSelectedPoint(coords);
    fetchWeatherData(coords);
  }, [fetchWeatherData]);

  const handleRouteDetails = useCallback((details) => {
    setRouteDetails(details);
  }, []);

  useEffect(() => {
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">
          Маршруты доставки
        </h1>

        {geolocationError && (
          <div className="rounded-lg bg-red-100 dark:bg-red-800 p-4 mb-4">
            <p className="text-red-600 dark:text-red-300">{geolocationError}</p>
          </div>
        )}

        {currentLocation && (
          <InteractiveMap
            currentLocation={currentLocation}
            onPointSelected={handlePointSelected}
            onRouteDetails={handleRouteDetails}
          />
        )}

        {selectedPoint && (
          <div className="rounded-lg shadow-md bg-white dark:bg-gray-800 p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Информация о выбранной точке
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Координаты:{" "}
              <span className="font-semibold">
                {selectedPoint[0].toFixed(5)}, {selectedPoint[1].toFixed(5)}
              </span>
            </p>
          </div>
        )}

        {isLoadingWeather && (
          <div className="flex justify-center mt-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {weather && !weather.error && (
          <div className="rounded-lg shadow-md bg-blue-100 dark:bg-blue-800 p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Погода в выбранной точке
            </h3>
            <div className="flex items-center">
              <WeatherAnimation weatherId={weather.id} />
              <div className="ml-4">
                <p className="text-gray-700 dark:text-gray-300">
                  Температура:{" "}
                  <span className="font-semibold">{weather.temperature}°C</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {weather.description.charAt(0).toUpperCase() +
                    weather.description.slice(1)}
                </p>
              </div>
            </div>
          </div>
        )}

        {weather && weather.error && (
          <div className="rounded-lg bg-red-100 dark:bg-red-800 p-4 mt-6">
            <p className="text-red-600 dark:text-red-300">{weather.error}</p>
          </div>
        )}

        {routeDetails && (
          <div className="rounded-lg shadow-md bg-green-100 dark:bg-green-800 p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Данные маршрута
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Расстояние:{" "}
              <span className="font-semibold">{routeDetails.distance}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Время в пути:{" "}
              <span className="font-semibold">{routeDetails.duration}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverRoutePage;
