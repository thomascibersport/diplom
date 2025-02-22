import React, { useEffect, useRef, useCallback } from "react";
import YandexMapLoader from "./YandexMapLoader";
import MapStore from "../utils/MapStore";
import throttle from "lodash.throttle";

function InteractiveMap({
  currentLocation,
  selectedPoint,
  isSettingLocation,
  isNavigationMode,
  userHeading,
  onSetCurrentLocation,
  onPointSelected,
  onRouteDetails,
}) {
  const mapContainerRef = useRef(null);
  const multiRouteRef = useRef(null);
  const selectedPointRef = useRef(null);
  const currentPlacemarkRef = useRef(null);
  const isSettingLocationRef = useRef(isSettingLocation);

  useEffect(() => {
    isSettingLocationRef.current = isSettingLocation;
  }, [isSettingLocation]);
  const InteractiveMap = ({ onMapReady }) => {
    const mapContainerRef = useRef(null);
  
    useEffect(() => {
      if (!window.ymaps) {
        console.error("Яндекс API не загружен");
        return;
      }
      window.ymaps.ready(() => {
        if (mapContainerRef.current) {
          const map = new window.ymaps.Map(mapContainerRef.current, {
            center: [55.76, 37.64],
            zoom: 10,
          });
          if (onMapReady) {
            onMapReady(map);
          }
        } else {
          console.error("Контейнер карты не найден");
        }
      });
    }, [onMapReady]);
  }
  // Объявляем функции до их использования
  const updateCurrentPositionMarker = useCallback(
    (map) => {
      if (!currentLocation) return;

      if (currentPlacemarkRef.current) {
        currentPlacemarkRef.current.geometry.setCoordinates(currentLocation);
      } else {
        currentPlacemarkRef.current = new window.ymaps.Placemark(
          currentLocation,
          { hintContent: "Ваше местоположение" },
          {
            preset: "islands#blueCircleIcon",
            iconColor: "#3b82f6",
            draggable: false,
          }
        );
      }

      if (map.geoObjects.indexOf(currentPlacemarkRef.current) === -1) {
        map.geoObjects.add(currentPlacemarkRef.current);
      }
    },
    [currentLocation]
  );

  const addPoint = useCallback((map, coords) => {
    if (selectedPointRef.current) {
      map.geoObjects.remove(selectedPointRef.current);
    }

    const placemark = new window.ymaps.Placemark(
      coords,
      { hintContent: "Конечная точка", balloonContent: "Точка назначения" },
      { preset: "islands#redIcon" }
    );

    map.geoObjects.add(placemark);
    selectedPointRef.current = placemark;
  }, []);

  const buildRoute = useCallback(
    throttle(async (map, endPoint) => {
      if (!currentLocation || !window.ymaps) return;
  
      // Удаляем предыдущий маршрут, если он существует
      if (multiRouteRef.current) {
        map.geoObjects.remove(multiRouteRef.current);
        multiRouteRef.current = null;
      }
  
      // Создаём объект MultiRoute для получения нескольких маршрутов
      const multiRoute = new window.ymaps.multiRouter.MultiRoute(
        {
          referencePoints: [currentLocation, endPoint],
          params: {
            avoidTrafficJams: true,
            results: 3, // Запрашиваем 3 альтернативных маршрута
          },
        },
        {
          boundsAutoApply: true,
          routeActiveStrokeWidth: 5,
          routeActiveStrokeColor: "#3b82f6",
          routeStrokeStyle: "solid",
          routeStrokeWidth: 3,
        }
      );
  
      // Обрабатываем успешное получение маршрутов
      multiRoute.model.events.add("requestsuccess", async () => {
        const routes = multiRoute.getRoutes();
        if (routes.getLength() > 0) {
          // Собираем данные о всех маршрутах
          const routeData = [];
          for (let i = 0; i < routes.getLength(); i++) {
            const route = routes.get(i);
            const distance = route.properties.get("distance").text; // Например, "10 км"
            const duration = route.properties.get("duration").text; // Например, "20 мин"
            routeData.push(`Маршрут ${i + 1}: расстояние ${distance}, время ${duration}.`);
          }
  
          // Формируем промпт для ИИ Qwen
          const prompt = `У меня есть следующие маршруты:\n${routeData.join("\n")}\nКакой из них самый быстрый и оптимальный?`;
  
          try {
            // Отправляем запрос в API Qwen
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer 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",
              },
              body: JSON.stringify({
                model: "qwen/qwen-vl-plus:free",
                messages: [{ role: "user", content: prompt }],
              }),
            });
  
            if (!response.ok) {
              throw new Error("Ошибка при запросе к API Qwen");
            }
  
            const data = await response.json();
            const answer = data.choices[0].message.content.trim(); // Получаем ответ от Qwen
  
            // Извлекаем номер выбранного маршрута из ответа
            const match = answer.match(/маршрут (\d)/i);
            if (match) {
              const routeIndex = parseInt(match[1], 10) - 1; // Преобразуем в индекс (0-based)
              if (routeIndex >= 0 && routeIndex < routes.getLength()) {
                const optimalRoute = routes.get(routeIndex);
                multiRoute.setActiveRoute(optimalRoute); // Устанавливаем оптимальный маршрут
                onRouteDetails({
                  distance: optimalRoute.properties.get("distance").text,
                  duration: optimalRoute.properties.get("duration").text,
                });
              } else {
                throw new Error("Некорректный номер маршрута в ответе");
              }
            } else {
              throw new Error("Не удалось извлечь номер маршрута из ответа");
            }
          } catch (error) {
            console.error("Ошибка при работе с API Qwen:", error);
            // Fallback: выбираем маршрут с минимальным временем
            let optimalRoute = routes.get(0);
            let minDuration = optimalRoute.properties.get("duration").value;
  
            for (let i = 1; i < routes.getLength(); i++) {
              const route = routes.get(i);
              const duration = route.properties.get("duration").value;
              if (duration < minDuration) {
                minDuration = duration;
                optimalRoute = route;
              }
            }
  
            multiRoute.setActiveRoute(optimalRoute);
            onRouteDetails({
              distance: optimalRoute.properties.get("distance").text,
              duration: optimalRoute.properties.get("duration").text,
            });
          }
        } else {
          onRouteDetails({ error: "Маршрут не найден" });
        }
      });
  
      // Добавляем маршрут на карту
      map.geoObjects.add(multiRoute);
      multiRouteRef.current = multiRoute;
    }, 1000),
    [currentLocation, onRouteDetails]
  );

  const attachEventHandlers = useCallback(
    (map) => {
      const clickHandler = (e) => {
        const coords = e.get("coords");
        if (!coords) return;

        if (isSettingLocationRef.current) {
          onSetCurrentLocation(coords);
        } else {
          onPointSelected(coords);
        }
      };

      map.events.add("click", clickHandler);
      return () => map.events.remove("click", clickHandler);
    },
    [onSetCurrentLocation, onPointSelected]
  );

// InteractiveMap.js
const initializeMap = useCallback(() => {
  if (!mapContainerRef.current) {
    console.error("Контейнер карты не найден");
    return;
  }
  if (!window.ymaps) return;

  const map = MapStore.getMap();
  if (map) {
    // Обновляем существующую карту
    map.setCenter(currentLocation || [55.751574, 37.573856]);
    updateCurrentPositionMarker(map);
    return;
  }

  // Создаем новую карту
  const newMap = new window.ymaps.Map(mapContainerRef.current, {
    center: currentLocation || [55.751574, 37.573856],
    zoom: 14,
    controls: ["zoomControl", "typeSelector", "fullscreenControl"],
    suppressMapOpenBlock: true,
  });

  MapStore.setMap(newMap);
  updateCurrentPositionMarker(newMap);
  attachEventHandlers(newMap);
}, [currentLocation, updateCurrentPositionMarker, attachEventHandlers]);

  useEffect(() => {
    const map = MapStore.getMap();
    if (map && selectedPoint && isNavigationMode) {
      try {
        buildRoute(map, selectedPoint);
      } catch (error) {
        console.error("Ошибка обновления маршрута:", error);
        onRouteDetails({ error: "Не удалось обновить маршрут" });
      }
    }
  }, [currentLocation, isNavigationMode, selectedPoint, buildRoute, onRouteDetails]);

  useEffect(() => {
    const map = MapStore.getMap();
    if (map && currentLocation) {
      updateCurrentPositionMarker(map);
      map.setCenter(currentLocation);
    }
  }, [currentLocation, updateCurrentPositionMarker]);

  useEffect(() => {
    const map = MapStore.getMap();
    if (!map) return;

    if (isSettingLocation) {
      map.balloon.open(
        currentLocation,
        "Кликните на карте, чтобы установить ваше местоположение",
        { closeButton: false }
      );
    } else {
      map.balloon.close();
    }
  }, [isSettingLocation, currentLocation]);



  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  useEffect(() => {
    const map = MapStore.getMap();
    if (map) {
      if (selectedPoint) {
        try {
          addPoint(map, selectedPoint);
          buildRoute(map, selectedPoint);
        } catch (error) {
          console.error("Ошибка построения маршрута:", error);
          onRouteDetails({ error: "Не удалось построить маршрут" });
        }
      } else {
        if (selectedPointRef.current) {
          map.geoObjects.remove(selectedPointRef.current);
          selectedPointRef.current = null;
        }
        if (multiRouteRef.current) {
          map.geoObjects.remove(multiRouteRef.current);
          multiRouteRef.current = null;
        }
        onRouteDetails(null);
      }
    }
  }, [selectedPoint, addPoint, buildRoute, onRouteDetails]);
  useEffect(() => {
    return () => {
      // Удаляем все объекты с карты перед уничтожением
      const map = MapStore.getMap();
      if (map) {
        map.geoObjects.removeAll();
        map.destroy();
      }
      MapStore.destroyMap();
    };
  }, []);
  useEffect(() => {
    const handleResize = () => {
      const map = MapStore.getMap();
      if (map) {
        setTimeout(() => map.container.fitToViewport(), 100);
      }
    };
  
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return (
    <div>
      <YandexMapLoader onLoad={initializeMap} />
      <div
        ref={mapContainerRef}
        style={{
          width: "100%",
          height: "500px",
          borderRadius: "0.75rem",
          overflow: "hidden",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          opacity: currentLocation ? 1 : 0.7,
        }}
      />
      {!currentLocation && (
        <div className="mt-2 text-yellow-600">
          Ожидание актуальных координат...
        </div>
      )}
    </div>
  );
}

export default InteractiveMap;