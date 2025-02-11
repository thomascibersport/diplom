import React, { useState, useEffect, useCallback, useRef } from "react";
import InteractiveMap from "../components/InteractiveMap";
import WeatherAnimation from "../components/WeatherAnimation";
import Header from "../components/Header";
import throttle from "lodash.throttle";
import { saveRouteRecord } from "../api/auth";

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

// Функция для вычисления направления (азимута) между двумя координатами
function computeHeading([lat1, lon1], [lat2, lon2]) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δλ = toRad(lon2 - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  let θ = Math.atan2(y, x);
  let bearing = (toDeg(θ) + 360) % 360;
  return bearing;
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
      console.log("Components:", addressMeta.Components);
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

// Функция для запроса оптимального маршрута через DeepSeek API
async function fetchOptimalRoute(
  currentLocation,
  destination,
  weather,
  roadData,
  trafficData
) {
  // Формируем текст запроса (prompt)
  const prompt = `Построй оптимальный маршрут от точки ${currentLocation} до ${destination}. Погода: ${weather.description} при температуре ${weather.temperature}°C. Дорожная обстановка: ${roadData}. Информация о пробках: ${trafficData}. Укажи примерную дистанцию и время в пути.`;

  // Новый базовый URL для OpenRouter и модель "deepseek/deepseek-r1:free"
  const endpoint = "https://openrouter.ai/api/v1/chat/completions";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Новый API-ключ
      Authorization:
        "Bearer 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",
    },
    body: JSON.stringify({
      model: "deepseek/deepseek-r1:free",
      messages: [
        {
          role: "system",
          content:
            "Ты – навигационный помощник, который строит оптимальные маршруты с учётом дорожной обстановки, пробок и погодных условий.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: false,
    }),
  });

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) {
    console.error("Ответ не содержит ожидаемых данных:", data);
    return null;
  }
  return data.choices[0].message.content;
}

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
  const [heading, setHeading] = useState(null);
  const [isSettingLocation, setIsSettingLocation] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const watchId = useRef(null);
  const setWatchId = useRef(null);
  const retryCount = useRef(0);
  const [isManualLocation, setIsManualLocation] = useState(
    !!localStorage.getItem(LOCAL_STORAGE_KEY)
  );
  const [isNavigationMode, setIsNavigationMode] = useState(false);
  const [remainingDistance, setRemainingDistance] = useState(null);
  const [routeStartTime, setRouteStartTime] = useState(null);
  const [routeStartLocation, setRouteStartLocation] = useState(null);
  // Новое состояние для оптимального маршрута от DeepSeek
  const [optimalRoute, setOptimalRoute] = useState(null);

  const previousLocationRef = useRef(null);

  useEffect(() => {
    if (isManualLocation && currentLocation) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentLocation));
    }
  }, [currentLocation, isManualLocation]);

  const throttledUpdateLocation = useCallback(
    throttle((newLocation, speedValue, computedHeading) => {
      setCurrentLocation(newLocation);
      setSpeed(speedValue ? (speedValue * 3.6).toFixed(2) : 0);
      setHeading(computedHeading);
    }, 1000),
    []
  );

  const fetchCurrentLocation = useCallback(() => {
    if (isManualLocation) return;
  
    // Выносим опции геолокации в константу
    const geolocationOptions = {
      enableHighAccuracy: true,
      maximumAge: 10000,
      timeout: 20000
    };
  
    const handleSuccess = (position) => {
      retryCount.current = 0;
      const {
        latitude,
        longitude,
        speed: rawSpeed,
        heading: rawHeading,
      } = position.coords;
      const newLocation = [latitude, longitude];
  
      if (
        !currentLocation ||
        haversineDistance(currentLocation, newLocation) > 0.01
      ) {
        previousLocationRef.current = newLocation;
        throttledUpdateLocation(newLocation, rawSpeed, rawHeading);
      }
    };
  
    const handleError = (error) => {
      console.error("Geolocation error:", error);
      
      // Исправлено: убрано дублирование объявления message
      let message = "Ошибка получения местоположения";
      
      if (error.code === error.TIMEOUT) {
        if (retryCount.current < 3) {
          retryCount.current += 1;
          console.log(`Retrying geolocation (attempt ${retryCount.current})`);
          return; // Продолжаем попытки
        }
        message = "Тайм-аут запроса. Проверьте подключение и разрешите геолокацию";
      }
  
      // Переносим сброс счетчика после обработки ошибки
      retryCount.current = 0;
      setGeolocationError(message);
    };
  
    if (navigator.geolocation) {
      // Очищаем предыдущий watch
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
  
      // Используем useRef для watchId вместо useState
      watchId.current = navigator.geolocation.watchPosition(
        handleSuccess,
        handleError,
        geolocationOptions
      );
    }
  }, [
    isManualLocation, 
    currentLocation, 
    throttledUpdateLocation,
    // Добавляем недостающие зависимости
    watchId,
    retryCount
  ]);

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
    setCurrentLocation(coords);
    setIsManualLocation(true);
    setSelectedPoint(null);
    setRouteDetails(null);
    setIsSettingLocation(false);
  }, []);

  const handleResetLocation = useCallback(() => {
    // Очищаем watch при сбросе
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setIsManualLocation(false);
    setSelectedPoint(null);
    setRouteDetails(null);
    previousLocationRef.current = null;
    retryCount.current = 0;
  
    // Запускаем новый запрос
    fetchCurrentLocation();
  }, [fetchCurrentLocation]);

  // Очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
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

  const startLocationString = routeStartLocation?.join(",");
  const endLocationString = selectedPoint?.join(",");

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
      (hours < 10 ? "0" + hours : hours) +
      ":" +
      (minutes < 10 ? "0" + minutes : minutes) +
      ":" +
      (seconds < 10 ? "0" + seconds : seconds);

    const routeRecord = {
      start_time: new Date(routeStartTime).toISOString(),
      end_time: new Date().toISOString(),
      start_location: startAddress,
      end_location: endAddress,
      trip_duration: formattedDuration,
      route_distance: routeDetails?.distance?.toString() || "",
      route_duration: routeDetails?.duration?.toString() || "",
      weather_description: weather?.description || "",
      weather_temperature: weather?.temperature?.toString() || "",
      route_distance: routeDetails?.distance || "",
      route_duration: routeDetails?.duration || "",
      route_warnings: routeDetails?.warnings?.toString() || "0",
      weather_code: weather?.id?.toString() || "",
    };

    console.log("Данные для отправки:", routeRecord);
    const response = await saveRouteRecord(routeRecord);
    if (!response) {
      console.error("Ошибка: сервер не вернул ответ.");
      alert("Ошибка при сохранении маршрута.");
      return;
    }
    try {
      const data = await response.json();
      alert("Маршрут успешно сохранён!");
    } catch (error) {
      console.error("Ошибка обработки JSON:", error);
      alert("Ошибка обработки ответа сервера.");
    }
    const storedHistory =
      JSON.parse(localStorage.getItem("routeHistory")) || [];
    storedHistory.push(routeRecord);
    localStorage.setItem("routeHistory", JSON.stringify(storedHistory));

    setIsNavigationMode(false);
    setRouteStartTime(null);
    setRouteStartLocation(null);
    setSelectedPoint(null);
    setRouteDetails(null);
  };

  // Используем useEffect для вызова DeepSeek API и получения оптимального маршрута,
  // когда доступны currentLocation, selectedPoint и данные о погоде.
  useEffect(() => {
    async function updateOptimalRoute() {
      if (currentLocation && selectedPoint && weather && !weather.error) {
        // Если нет реальных данных о состоянии дорог и пробках, используем значения по умолчанию.
        const roadData = "Хорошие дорожные условия";
        const trafficData = "Умеренные пробки";
        try {
          const optimal = await fetchOptimalRoute(
            currentLocation.join(", "),
            selectedPoint.join(", "),
            weather,
            roadData,
            trafficData
          );
          setOptimalRoute(optimal);
        } catch (err) {
          console.error(
            "Ошибка получения оптимального маршрута от DeepSeek:",
            err
          );
        }
      }
    }
    updateOptimalRoute();
  }, [currentLocation, selectedPoint, weather, routeDetails]);
  useEffect(() => {
    if (geolocationError && !currentLocation) {
      const timer = setTimeout(() => {
        fetchCurrentLocation();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [geolocationError, currentLocation, fetchCurrentLocation]);
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
            selectedPoint={selectedPoint}
            isSettingLocation={isSettingLocation}
            isNavigationMode={isNavigationMode}
            userHeading={heading}
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
          {selectedPoint && routeDetails && !isNavigationMode && (
            <button
              onClick={handleStartNavigation}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg"
            >
              В путь
            </button>
          )}
          {isNavigationMode && (
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
        {routeDetails?.warnings > 0 && (
          <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-800 rounded-lg shadow">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ На маршруте {routeDetails.warnings} сложных участков
            </p>
          </div>
        )}
        {optimalRoute && (
          <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Оптимальный маршрут от DeepSeek
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{optimalRoute}</p>
          </div>
        )}
        {isNavigationMode && selectedPoint && (
          <div className="mt-4 p-4 bg-green-100 dark:bg-green-800 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Режим навигации
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Оставшееся расстояние до точки:</strong>{" "}
              {remainingDistance !== null
                ? `${remainingDistance} км`
                : "Подсчет..."}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              <strong>Текущая скорость:</strong> {speed} км/ч
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DriverRoutePage;
