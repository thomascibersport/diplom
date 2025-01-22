import React, { useEffect, useRef } from "react";
import YandexMapLoader from "./YandexMapLoader";
import MapStore from "../utils/MapStore";

function InteractiveMap({ currentLocation, onPointSelected, onRouteDetails }) {
  const mapContainerRef = useRef(null);
  const multiRouteRef = useRef(null);
  const selectedPointRef = useRef(null);

  const initializeMap = () => {
    if (MapStore.mapInstance) {
      const mapContainer = MapStore.mapInstance.container.getParentElement();
      if (!mapContainerRef.current.contains(mapContainer)) {
        mapContainerRef.current.appendChild(mapContainer);
      }
      MapStore.mapInstance.container.fitToViewport();
      attachEventHandlers(MapStore.mapInstance);
      return;
    }

    if (!window.ymaps) {
      console.error("Yandex.Maps API не загружен");
      return;
    }

    window.ymaps.ready(() => {
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
        buildRoute(map, coords);
      }
    });
  };

  const addPoint = (map, coords) => {
    if (selectedPointRef.current) {
      map.geoObjects.remove(selectedPointRef.current);
    }

    const placemark = new window.ymaps.Placemark(
      coords,
      { hintContent: "Выбранная точка", balloonContent: "Точка маршрута" },
      { preset: "islands#redIcon" }
    );

    map.geoObjects.add(placemark);
    selectedPointRef.current = placemark;
  };

  const buildRoute = (map, endPoint) => {
    if (!currentLocation || !window.ymaps || !window.ymaps.multiRouter) {
      console.error("Не удалось построить маршрут: карта или API не готовы.");
      return;
    }

    try {
      if (multiRouteRef.current) {
        map.geoObjects.remove(multiRouteRef.current);
      }

      const multiRoute = new window.ymaps.multiRouter.MultiRoute(
        {
          referencePoints: [currentLocation, endPoint],
          params: { avoidTrafficJams: true },
        },
        { boundsAutoApply: true }
      );

      // Обработка события успешного построения маршрутов
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
      multiRouteRef.current = multiRoute;
    } catch (error) {
      console.error("Ошибка при построении маршрута:", error);
    }
  };

  useEffect(() => {
    initializeMap();
    return () => {
      if (MapStore.mapInstance) {
        const mapContainer = MapStore.mapInstance.container.getParentElement();
        if (mapContainer && mapContainer.parentElement) {
          mapContainer.parentElement.removeChild(mapContainer);
        }
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
