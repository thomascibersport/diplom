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
    throttle((map, endPoint) => {
      if (!currentLocation || !window.ymaps) return;

      if (multiRouteRef.current) {
        map.geoObjects.remove(multiRouteRef.current);
        multiRouteRef.current = null;
      }

      const multiRoute = new window.ymaps.multiRouter.MultiRoute(
        {
          referencePoints: [currentLocation, endPoint],
          params: { avoidTrafficJams: true },
        },
        {
          boundsAutoApply: true,
          routeActiveStrokeWidth: 5,
          routeActiveStrokeColor: "#3b82f6",
          routeStrokeStyle: "solid",
          routeStrokeWidth: 3,
        }
      );

      multiRoute.model.events.add("requestsuccess", () => {
        const activeRoute = multiRoute.getActiveRoute();
        onRouteDetails(
          activeRoute
            ? {
                distance: activeRoute.properties.get("distance").text,
                duration: activeRoute.properties.get("duration").text,
              }
            : { error: "Маршрут не найден" }
        );
      });

      multiRoute.model.events.add("activeroutechange", () => {
        const activeRoute = multiRoute.getActiveRoute();
        onRouteDetails(
          activeRoute
            ? {
                distance: activeRoute.properties.get("distance").text,
                duration: activeRoute.properties.get("duration").text,
              }
            : { error: "Маршрут не найден" }
        );
      });

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
    if (
      mapContainerRef.current &&
      isNavigationMode &&
      typeof userHeading === "number"
    ) {
      mapContainerRef.current.style.transform = `rotate(${-userHeading}deg)`;
    } else if (mapContainerRef.current) {
      mapContainerRef.current.style.transform = "";
    }
  }, [userHeading, isNavigationMode]);

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
          transition: "transform 0.3s ease-out",
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