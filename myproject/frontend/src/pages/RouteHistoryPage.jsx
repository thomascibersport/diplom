import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import { getDetailedAddress } from "../utils/geocoding";

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== "") {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === name + "=") {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function RouteHistoryPage() {
  const [routeHistory, setRouteHistory] = useState([]);
  const [locations, setLocations] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Получаем маршруты из API
  useEffect(() => {
    const fetchRouteHistory = async () => {
      try {
        const token = getCookie("token");
        const response = await fetch(
          "http://localhost:8000/api/route-records/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const responseText = await response.text();
        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status}. Response: ${responseText}`
          );
        }
        const data = JSON.parse(responseText);
        setRouteHistory(data);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRouteHistory();
  }, []);

  // После получения маршрутов получаем подробные адреса
  useEffect(() => {
    async function fetchLocations() {
      const locs = { ...locations };

      for (const route of routeHistory) {
        // Для start_location (просто сохраняем значение как есть)
        if (route.start_location && !locs[route.start_location]) {
          locs[route.start_location] = route.start_location; // Используем готовый адрес
        }

        // Для end_location (аналогично)
        if (route.end_location && !locs[route.end_location]) {
          locs[route.end_location] = route.end_location;
        }
      }

      setLocations(locs);
    }

    if (routeHistory.length > 0) {
      fetchLocations();
    }
  }, [routeHistory]);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200 mb-6">
          История маршрутов
        </h1>
        {error && <p className="text-center text-red-600">Ошибка: {error}</p>}
        {loading ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Загрузка...
          </p>
        ) : routeHistory.length === 0 ? (
          <p className="text-center text-gray-600 dark:text-gray-400">
            Нет сохраненных маршрутов.
          </p>
        ) : (
          <ul className="space-y-4">
            {routeHistory.map((route, index) => (
              <li key={index} className="p-4 border rounded-lg bg-white dark:bg-gray-800 shadow flex flex-col">
                <p className="font-semibold text-lg">Маршрут {index + 1}</p>
                <p className="text-gray-700 dark:text-gray-300">
                  🕒{" "}
                  <strong>
                    {new Date(route.start_time).toLocaleString()} —{" "}
                    {new Date(route.end_time).toLocaleString()}
                  </strong>
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  📍 <strong>Откуда:</strong> {route.start_location} ➡️{" "}
                  <strong>Куда:</strong> {route.end_location}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  🚗 <strong>Время в пути:</strong> {route.trip_duration} | 🛣️{" "}
                  <strong>Расстояние:</strong> {route.route_distance}
                </p>
                <p>Средняя скорость: {route.average_speed} км/ч</p>
                {route.weather_description && (
                  <p className="text-gray-700 dark:text-gray-300">
                    ⛅ <strong>Погода:</strong> {route.weather_description} | 🌡️{" "}
                    <strong>Температура:</strong> {route.weather_temperature}°C
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default RouteHistoryPage;
