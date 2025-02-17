import React, { useState, useEffect, useCallback, useRef } from "react";
import InteractiveMap from "../components/InteractiveMap";
import WeatherAnimation from "../components/WeatherAnimation";
import Header from "../components/Header";
import throttle from "lodash.throttle";
import { saveRouteRecord } from "../api/auth";
import MapStore from "../utils/MapStore";
import Cookies from "js-cookie"; // Импорт для проверки токена

const YANDEX_API_KEY = "f2749db0-14ee-4f82-b043-5bb8082c4aa9";
const OPEN_WEATHER_API_KEY = "cba05fac32e986f325878b497331cfc8";
const LOCAL_STORAGE_KEY = "driverManualLocation";

// Функция для расчёта расстояния между двумя точками (в км) по формуле гаверсина
function haversineDistance([lat1, lon1], [lat2, lon2]) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // радиус Земли в км
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function getFullAddress(coords) {
  const [lat, lon] = coords;
  try {
    const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${YANDEX_API_KEY}&geocode=${lon},${lat}&format=json`;
    const response = await fetch(url);
    const data = await response.json();
    const geoObject =
      data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
    if (geoObject) {
      const addressMeta = geoObject.metaDataProperty.GeocoderMetaData.Address;
      const cityComponent =
        addressMeta.Components.find((comp) => comp.kind === "locality") ||
        addressMeta.Components.find((comp) => comp.kind === "province");
      const streetComponent = addressMeta.Components.find(
        (comp) => comp.kind === "street"
      );
      let houseComponent = addressMeta.Components.find(
        (comp) => comp.kind === "house"
      );
      if (!houseComponent) {
        const parts = addressMeta.formatted.split(",");
        const lastPart = parts[parts.length - 1].trim();
        if (/^\d+/.test(lastPart)) {
          houseComponent = { name: lastPart };
        }
      }
      let detailedAddress = "";
      if (cityComponent) {
        detailedAddress += cityComponent.name;
      }
      if (streetComponent) {
        detailedAddress += (detailedAddress ? ", " : "") + streetComponent.name;
      }
      if (houseComponent) {
        detailedAddress +=
          (detailedAddress ? ", " : "") + `д. ${houseComponent.name}`;
      }
      return detailedAddress || addressMeta.formatted;
    }
    return `${lat}, ${lon}`;
  } catch (error) {
    console.error("Ошибка получения адреса:", error);
    return `${lat}, ${lon}`;
  }
}

function DriverRoutePage() {
  // Проверяем наличие токена в куках: если токена нет – пользователь считается гостем
  const isAuthenticated = Boolean(Cookies.get("token"));

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
  const [isLocating, setIsLocating] = useState(false);
  const watchId = useRef(null);
  const retryCount = useRef(0);
  const [isManualLocation, setIsManualLocation] = useState(
    !!localStorage.getItem(LOCAL_STORAGE_KEY)
  );
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState(null);
  const [routeStartTime, setRouteStartTime] = useState(null);
  const [routeStartLocation, setRouteStartLocation] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const demoPositions = useRef([
    [55.751244, 37.618423],
    [55.753930, 37.620795],
    [55.756594, 37.623356]
  ]);
  const demoStep = useRef(0);
  const prevDemoCoords = useRef(null);

  useEffect(() => {
    if (!isDemoMode) return;
  
    const updateDemoLocation = () => {
      if (demoStep.current >= demoPositions.current.length - 1) {
        demoStep.current = 0;
        prevDemoCoords.current = null;
        return;
      }
  
      const newCoords = demoPositions.current[demoStep.current];
      const nextCoords = demoPositions.current[demoStep.current + 1];
  
      const distance = haversineDistance(newCoords, nextCoords);
      const timeDelta = 5;
      const speed = (distance / (timeDelta / 3600)).toFixed(2);
  
      setCurrentLocation(nextCoords);
      setSpeed(speed);
      setIsManualLocation(false);
  
      demoStep.current += 1;
      prevDemoCoords.current = nextCoords;
  
      const timerId = setTimeout(updateDemoLocation, timeDelta * 1000);
      return () => clearTimeout(timerId);
    };
  
    if (demoStep.current === 0) {
      setCurrentLocation(demoPositions.current[0]);
      prevDemoCoords.current = demoPositions.current[0];
    }
  
    const timerId = setTimeout(updateDemoLocation, 5000);
  
    return () => {
      clearTimeout(timerId);
      demoStep.current = 0;
      prevDemoCoords.current = null;
    };
  }, [isDemoMode]);

  const throttledUpdateLocation = useCallback(
    throttle((newLocation, speedValue) => {
      setCurrentLocation(newLocation);
      setSpeed(speedValue ? (speedValue * 3.6).toFixed(2) : 0);
    }, 1000),
    []
  );

  useEffect(() => {
    if (isDemoMode && watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, [isDemoMode]);
  const previousLocationRef = useRef(null);

  useEffect(() => {
    if (isManualLocation && currentLocation) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentLocation));
    }
  }, [currentLocation, isManualLocation]);

  const fetchCurrentLocation = useCallback(() => {
    if (isManualLocation) return;

    const geolocationOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 15000,
    };

    const handleSuccess = (position) => {
      retryCount.current = 0;
      const { latitude, longitude, speed: rawSpeed } = position.coords;
      const newLocation = [latitude, longitude];

      if (
        !currentLocation ||
        haversineDistance(currentLocation, newLocation) > 0.01
      ) {
        previousLocationRef.current = newLocation;
        throttledUpdateLocation(newLocation, rawSpeed);
      }
    };

    const handleError = (error) => {
      console.error("Geolocation error:", error);
      let message = "Ошибка получения местоположения";

      if (error.code === error.TIMEOUT) {
        if (retryCount.current < 3) {
          retryCount.current += 1;
          console.log(`Retrying geolocation (attempt ${retryCount.current})`);
          return;
        }
        message =
          "Тайм-аут запроса. Проверьте подключение и разрешите геолокацию";
      }
      retryCount.current = 0;
      setGeolocationError(message);
    };

    if (navigator.geolocation) {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      watchId.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    }
  }, [isManualLocation, currentLocation, throttledUpdateLocation]);

  const fetchWeatherData = useCallback(
    throttle(async (coords) => {
      try {
        const [lat, lon] = coords;
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPEN_WEATHER_API_KEY}&lang=ru`
        );
        const data = await response.json();
        setWeather(
          response.ok
            ? {
                temperature: data.main.temp,
                description: data.weather[0].description,
                id: data.weather[0].id,
              }
            : { error: "Не удалось получить данные о погоде." }
        );
      } catch (error) {
        setWeather({ error: "Ошибка при получении данных о погоде." });
      }
    }, 10000),
    []
  );

  useEffect(() => {
    if (currentLocation) {
      fetchWeatherData(currentLocation);
    }
  }, [currentLocation, fetchWeatherData]);

  const handleSetCurrentLocation = useCallback((coords) => {
    setCurrentLocation([...coords]);
    setIsManualLocation(true);
    setSelectedPoint(null);
    setRouteDetails(null);
    setIsSettingLocation(false);

    setTimeout(() => {
      const map = MapStore.getMap();
      if (map) {
        map.setCenter(coords);
        map.container.fitToViewport();
      }
    }, 100);
  }, []);

  const handleResetLocation = useCallback(() => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsManualLocation(false);
    setCurrentLocation(null);
    setSelectedPoint(null);
    setRouteDetails(null);
    previousLocationRef.current = null;
    retryCount.current = 0;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation([latitude, longitude]);
        fetchCurrentLocation();
      },
      (error) => setGeolocationError("Ошибка получения местоположения"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [fetchCurrentLocation]);

  useEffect(() => {
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [watchId]);

  useEffect(() => {
    if (!isManualLocation) fetchCurrentLocation();
  }, [fetchCurrentLocation, isManualLocation]);

  useEffect(() => {
    if (isNavigationMode && currentLocation && selectedPoint) {
      const distance = haversineDistance(currentLocation, selectedPoint);
      setRemainingDistance(distance.toFixed(2));
    }
  }, [isNavigationMode, currentLocation, selectedPoint]);

  const handleStartNavigation = () => {
    if (!selectedPoint) return;
    setIsNavigationMode(true);
    setRouteStartTime(Date.now());
    setRouteStartLocation(currentLocation);
  };

  const handleFinishRoute = async () => {
    if (!isNavigationMode) return;
    if (!routeStartTime || !routeStartLocation || !selectedPoint) {
      alert("Ошибка: отсутствуют данные маршрута");
      return;
    }

    const startAddress = await getFullAddress(routeStartLocation);
    const endAddress = await getFullAddress(selectedPoint);
    if (!startAddress || !endAddress) {
      alert("Ошибка получения адресов маршрута");
      return;
    }

    const endTime = Date.now();
    const tripDurationMs = endTime - routeStartTime;
    const seconds = Math.floor((tripDurationMs / 1000) % 60);
    const minutes = Math.floor((tripDurationMs / (1000 * 60)) % 60);
    const hours = Math.floor(tripDurationMs / (1000 * 60 * 60));
    const formattedDuration =
      `${hours.toString().padStart(2, "0")}:` +
      `${minutes.toString().padStart(2, "0")}:` +
      `${seconds.toString().padStart(2, "0")}`;

    const parseDistance = (distanceStr) => {
      if (!distanceStr) return 0;
      const match = distanceStr.match(/[\d,.]+/);
      return parseFloat(match ? match[0].replace(",", ".") : "0");
    };

    const distanceText = routeDetails?.distance || "0 км";
    const distanceKm = parseDistance(distanceText);
    const durationHours = tripDurationMs / (1000 * 60 * 60);
    const averageSpeed = durationHours > 0 ? distanceKm / durationHours : 0;

    const routeRecord = {
      start_time: new Date(routeStartTime).toISOString(),
      end_time: new Date().toISOString(),
      start_location: startAddress,
      end_location: endAddress,
      trip_duration: formattedDuration,
      route_distance: distanceText,
      route_duration: routeDetails?.duration || "",
      weather_description: weather?.description || "",
      weather_temperature: weather?.temperature?.toString() || "",
      average_speed: averageSpeed.toFixed(2),
    };

    try {
      const response = await saveRouteRecord(routeRecord);
      if (!response?.ok) {
        throw new Error("Ошибка при сохранении маршрута");
      }
      const data = await response.json();
      alert("Маршрут успешно сохранён!");
      const storedHistory =
        JSON.parse(localStorage.getItem("routeHistory")) || [];
      storedHistory.push(routeRecord);
      localStorage.setItem("routeHistory", JSON.stringify(storedHistory));
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      alert(error.message || "Произошла ошибка при сохранении");
    }

    setIsNavigationMode(false);
    setRouteStartTime(null);
    setRouteStartLocation(null);
    setSelectedPoint(null);
    setRouteDetails(null);
  };

  useEffect(() => {
    if (geolocationError && !currentLocation) {
      const timer = setTimeout(() => {
        fetchCurrentLocation();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [geolocationError, currentLocation, fetchCurrentLocation]);

  useEffect(() => {
    return () => {
      MapStore.destroyMap();
    };
  }, []);

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
            key={`${currentLocation?.toString()}_${isManualLocation}`}
            currentLocation={currentLocation}
            selectedPoint={selectedPoint}
            isSettingLocation={isSettingLocation}
            isNavigationMode={isNavigationMode}
            onSetCurrentLocation={handleSetCurrentLocation}
            onPointSelected={setSelectedPoint}
            onRouteDetails={setRouteDetails}
          />
        )}
        {!currentLocation && !isManualLocation && (
          <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-800 rounded-lg">
            <p>Получаем текущее местоположение...</p>
          </div>
        )}
        {isLocating && (
          <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-800 rounded-lg">
            <p>Поиск вашего местоположения...</p>
          </div>
        )}
        <div className="mb-4 mt-4 flex justify-center gap-2 flex-wrap">
          <button
            onClick={() => setIsSettingLocation(!isSettingLocation)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isSettingLocation
                ? "bg-green-500 hover:bg-green-600 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
          >
            {isSettingLocation
              ? "Завершить выбор местоположения"
              : "Установить мое местоположение"}
          </button>
          {isManualLocation && (
            <button
              onClick={handleResetLocation}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
            >
              Сбросить ручное местоположение
            </button>
          )}
          {/* Кнопки для начала и завершения маршрута отображаются только для авторизованных пользователей */}
          {isAuthenticated && selectedPoint && routeDetails && !isNavigationMode && (
            <button
              onClick={handleStartNavigation}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
            >
              В путь
            </button>
          )}
          {isAuthenticated && isNavigationMode && (
            <button
              onClick={handleFinishRoute}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
            >
              Завершить маршрут
            </button>
          )}
        </div>
        {weather && !weather.error && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <WeatherAnimation
              weatherId={weather.id}
              description={weather.description}
              temperature={weather.temperature}
            />
          </div>
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
