import React, { useState, useEffect, useCallback } from "react";
import InteractiveMap from "../components/InteractiveMap";
import WeatherAnimation from "../components/WeatherAnimation";
import Header from "../components/Header";
import throttle from "lodash.throttle";

const OPEN_WEATHER_API_KEY = "cba05fac32e986f325878b497331cfc8";
const LOCAL_STORAGE_KEY = "driverManualLocation";

function DriverRoutePage() {
  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    return saved || null;
  });
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [weather, setWeather] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [geolocationError, setGeolocationError] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [isManualLocation, setIsManualLocation] = useState(!!localStorage.getItem(LOCAL_STORAGE_KEY));

  // Сохраняем ручное местоположение
  useEffect(() => {
    if (isManualLocation && currentLocation) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentLocation));
    }
  }, [currentLocation, isManualLocation]);

  const fetchCurrentLocation = useCallback(() => {
    if (isManualLocation) return;

    if (!navigator.geolocation) {
      setGeolocationError("Геолокация не поддерживается вашим браузером.");
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        setCurrentLocation([latitude, longitude]);
        setSpeed(speed ? (speed * 3.6).toFixed(2) : 0);
      },
      (error) => {
        setGeolocationError("Не удалось определить местоположение.");
        console.error("Geolocation error:", error);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(id);
  }, [isManualLocation]);

  const fetchWeatherData = useCallback(
    throttle(async (coords) => {
      try {
        const [lat, lon] = coords;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPEN_WEATHER_API_KEY}&lang=ru`
        );
        const data = await response.json();

        setWeather(response.ok ? {
          temperature: data.main.temp,
          description: data.weather[0].description,
          id: data.weather[0].id,
        } : { error: "Не удалось получить данные о погоде." });
      } catch (error) {
        setWeather({ error: "Ошибка при получении данных о погоде." });
      }
    }, 10000),
    []
  );

  const handleSetCurrentLocation = useCallback((coords) => {
    setCurrentLocation(coords);
    setIsManualLocation(true);
    setSelectedPoint(null);
    setRouteDetails(null);
    setIsSettingLocation(false);
  }, []);

  const handleResetLocation = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsManualLocation(false);
    setCurrentLocation(null);
    setSelectedPoint(null);
    setRouteDetails(null);
  }, []);

  useEffect(() => {
    if (!isManualLocation) fetchCurrentLocation();
  }, [fetchCurrentLocation, isManualLocation]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">
          Маршруты доставки
        </h1>

        <div className="mb-4 flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSettingLocation(!isSettingLocation)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isSettingLocation 
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isSettingLocation 
              ? 'Завершить выбор местоположения' 
              : 'Установить мое местоположение'}
          </button>

          {isManualLocation && (
            <button
              onClick={handleResetLocation}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Сбросить ручное местоположение
            </button>
          )}
        </div>

        {geolocationError && (
          <div className="rounded-lg bg-red-100 dark:bg-red-800 p-4 mb-4">
            <p className="text-red-600 dark:text-red-300">{geolocationError}</p>
          </div>
        )}

        {currentLocation && (
          <InteractiveMap
            currentLocation={currentLocation}
            selectedPoint={selectedPoint}
            isSettingLocation={isSettingLocation}
            onSetCurrentLocation={handleSetCurrentLocation}
            onPointSelected={setSelectedPoint}
            onRouteDetails={setRouteDetails}
          />
        )}

        {speed !== null && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Скорость движения
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Текущая скорость:</strong> {speed} км/ч
            </p>
          </div>
        )}

        {weather && !weather.error && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <WeatherAnimation
              weatherId={weather.id}
              description={weather.description}
              temperature={weather.temperature}
            />
          </div>
        )}

        {weather && weather.error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-800 rounded-lg shadow">
            <p className="text-red-600 dark:text-red-300">{weather.error}</p>
          </div>
        )}

        {routeDetails && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Детали маршрута
            </h2>
            {routeDetails.error ? (
              <p className="text-red-500 dark:text-red-400">
                {routeDetails.error}
              </p>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Расстояние:</strong> {routeDetails.distance}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  <strong>Время в пути:</strong> {routeDetails.duration}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverRoutePage;