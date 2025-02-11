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

  const initializeMap = useCallback(() => {
    if (!window.ymaps || !currentLocation) return;

    // Если карта уже создана, просто обновляем её центр
    if (MapStore.getMap()) {
      MapStore.getMap().setCenter(currentLocation);
      return;
    }

    const map = new window.ymaps.Map(mapContainerRef.current, {
      center: currentLocation,
      zoom: 14,
      controls: ["zoomControl", "typeSelector", "fullscreenControl"],
      suppressMapOpenBlock: true,
    });

    // Сохраняем карту в MapStore
    MapStore.setMap(map);

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

      // Обработчик успешного построения маршрута
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

      // Обработчик смены активного маршрута (при выборе альтернативного)
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

  // При изменении выбранной точки или текущего местоположения обновляем маршрут
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

  // Обновляем маркер текущего местоположения и центр карты
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

  // Поворот карты при навигации
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

  useEffect(() => {
    initializeMap();
    // В cleanup можно не уничтожать карту, если она должна сохраняться
    // return () => { /* не уничтожаем карту */ };
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
        }}
      />
    </div>
  );
}

export default InteractiveMap;
