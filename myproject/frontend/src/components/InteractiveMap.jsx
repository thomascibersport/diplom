import React, { useEffect, useRef, useCallback } from "react";
import YandexMapLoader from "./YandexMapLoader";
import MapStore from "../utils/MapStore";
import throttle from "lodash.throttle";

function InteractiveMap({
  currentLocation,
  selectedPoint,
  isSettingLocation,
  onSetCurrentLocation,
  onPointSelected,
  onRouteDetails,
}) {
  const mapContainerRef = useRef(null);
  const multiRouteRef = useRef(null);
  const selectedPointRef = useRef(null);
  const currentPlacemarkRef = useRef(null);
  const isSettingLocationRef = useRef(isSettingLocation);

  // Обновляем ref при изменении пропса
  useEffect(() => {
    isSettingLocationRef.current = isSettingLocation;
  }, [isSettingLocation]);

  const initializeMap = useCallback(() => {
    if (!window.ymaps || !currentLocation) return;

    if (MapStore.mapInstance) {
      MapStore.mapInstance.setCenter(currentLocation);
      return;
    }

    const map = new window.ymaps.Map(mapContainerRef.current, {
      center: currentLocation,
      zoom: 14,
      controls: ["zoomControl", "typeSelector", "fullscreenControl"],
    });

    MapStore.mapInstance = map;
    updateCurrentPositionMarker(map);
    attachEventHandlers(map);
  }, [currentLocation]);

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
            draggable: false
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

      multiRoute.model.events.add("requesterror", () => {
        onRouteDetails({ error: "Ошибка построения маршрута" });
      });

      map.geoObjects.add(multiRoute);
      multiRouteRef.current = multiRoute;
    }, 1000),
    [currentLocation, onRouteDetails]
  );

  useEffect(() => {
    if (MapStore.mapInstance) {
      if (selectedPoint) {
        try {
          addPoint(MapStore.mapInstance, selectedPoint);
          buildRoute(MapStore.mapInstance, selectedPoint);
        } catch (error) {
          console.error("Ошибка построения маршрута:", error);
          onRouteDetails({ error: "Не удалось построить маршрут" });
        }
      } else {
        // Очищаем маршрут и точку при сбросе selectedPoint
        if (selectedPointRef.current) {
          MapStore.mapInstance.geoObjects.remove(selectedPointRef.current);
          selectedPointRef.current = null;
        }
        if (multiRouteRef.current) {
          MapStore.mapInstance.geoObjects.remove(multiRouteRef.current);
          multiRouteRef.current = null;
        }
        onRouteDetails(null);
      }
    }
  }, [selectedPoint, addPoint, buildRoute, onRouteDetails]);

  useEffect(() => {
    if (MapStore.mapInstance && currentLocation) {
      updateCurrentPositionMarker(MapStore.mapInstance);
      MapStore.mapInstance.setCenter(currentLocation);
    }
  }, [currentLocation, updateCurrentPositionMarker]);

  useEffect(() => {
    if (!MapStore.mapInstance) return;

    if (isSettingLocation) {
      MapStore.mapInstance.balloon.open(
        currentLocation,
        "Кликните на карте, чтобы установить ваше местоположение",
        { closeButton: false }
      );
    } else {
      MapStore.mapInstance.balloon.close();
    }
  }, [isSettingLocation, currentLocation]);

  const attachEventHandlers = useCallback((map) => {
    const clickHandler = (e) => {
      const coords = e.get("coords");
      if (!coords) return;

      // Используем актуальное значение из ref
      if (isSettingLocationRef.current) {
        onSetCurrentLocation(coords);
      } else {
        onPointSelected(coords);
      }
    };

    map.events.add("click", clickHandler);
    return () => map.events.remove("click", clickHandler);
  }, [onSetCurrentLocation, onPointSelected]);

  useEffect(() => {
    initializeMap();

    return () => {
      if (MapStore.mapInstance) {
        MapStore.mapInstance.geoObjects.removeAll();
        MapStore.mapInstance.destroy();
        MapStore.mapInstance = null;
      }
    };
  }, [initializeMap]);

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
        }}
      />
    </div>
  );
}

export default InteractiveMap;