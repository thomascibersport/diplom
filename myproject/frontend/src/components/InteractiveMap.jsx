import React, { useEffect, useRef } from "react";
import YandexMapLoader from "./YandexMapLoader";
import MapStore from "../utils/MapStore"; // Глобальное хранилище карты

function InteractiveMap({ currentLocation, onPointSelected, onRouteDetails }) {
  const mapContainerRef = useRef(null);
  const multiRouteRef = useRef(null); // Сохраняем ссылку на текущий маршрут

  const initializeMap = () => {
    if (MapStore.mapInstance) {
      console.log("Используем существующую карту.");

      // Проверяем, что контейнер карты еще не добавлен в DOM
      const mapContainer = MapStore.mapInstance.container.getParentElement();
      if (!mapContainerRef.current.contains(mapContainer)) {
        mapContainerRef.current.appendChild(mapContainer);
      }

      MapStore.mapInstance.container.fitToViewport();
      attachEventHandlers(MapStore.mapInstance);
      return;
    }

    if (!window.ymaps) return;

    window.ymaps.ready(() => {
      console.log("Инициализируем карту.");
      const map = new window.ymaps.Map(mapContainerRef.current, {
        center: currentLocation,
        zoom: 10,
        controls: ["zoomControl", "typeSelector"],
      });

      MapStore.mapInstance = map;
      attachEventHandlers(map);
    });
  };

  const attachEventHandlers = (map) => {
    map.events.remove("click");
    map.events.add("click", (e) => {
      const coords = e.get("coords");
      if (coords && Array.isArray(coords)) {
        onPointSelected(coords);
        addPoint(map, coords);
        buildRoute(map, currentLocation, coords);
      }
    });
  };

  const addPoint = (map, coords) => {
    const placemark = new window.ymaps.Placemark(
      coords,
      { hintContent: "Выбранная точка", balloonContent: "Точка маршрута" },
      { preset: "islands#redIcon" }
    );

    map.geoObjects.removeAll();
    map.geoObjects.add(placemark);
  };

  const buildRoute = (map, startPoint, endPoint) => {
    if (!window.ymaps || !window.ymaps.multiRouter) {
      console.error("Yandex Maps API не загружен или MultiRouter недоступен");
      return;
    }

    try {
      // Удаляем предыдущий маршрут, если он существует
      if (multiRouteRef.current) {
        map.geoObjects.remove(multiRouteRef.current);
      }

      const multiRoute = new window.ymaps.multiRouter.MultiRoute(
        {
          referencePoints: [startPoint, endPoint],
          params: { avoidTrafficJams: true },
        },
        { boundsAutoApply: true }
      );

      // Обработка события успешной загрузки маршрутов
      multiRoute.model.events.add("requestsuccess", () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          const distance = activeRoute.properties.get("distance").text;
          const duration = activeRoute.properties.get("duration").text;
          console.log("Данные активного маршрута:", { distance, duration });
          onRouteDetails({ distance, duration });
        }
      });

      // Обработка смены активного маршрута
      multiRoute.events.add("activeroutechange", () => {
        const activeRoute = multiRoute.getActiveRoute();
        if (activeRoute) {
          const distance = activeRoute.properties.get("distance").text;
          const duration = activeRoute.properties.get("duration").text;
          console.log("Выбран другой маршрут:", { distance, duration });
          onRouteDetails({ distance, duration });
        }
      });

      map.geoObjects.add(multiRoute);
      multiRouteRef.current = multiRoute; // Сохраняем ссылку на маршрут
    } catch (error) {
      console.error("Ошибка при построении маршрута:", error);
    }
  };

  useEffect(() => {
    initializeMap();

    return () => {
      if (!MapStore.mapInstance) return;

      console.log("Отключаем карту перед размонтированием.");
      const mapContainer = MapStore.mapInstance.container.getParentElement();
      if (mapContainer && mapContainer.parentElement) {
        mapContainer.parentElement.removeChild(mapContainer);
      }
    };
  }, [currentLocation]);

  return (
    <div>
      <YandexMapLoader onLoad={initializeMap} />
      <div ref={mapContainerRef} style={{ width: "100%", height: "400px" }} />
    </div>
  );
}

export default InteractiveMap;