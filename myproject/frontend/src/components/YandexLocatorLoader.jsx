import React, { useEffect, useState } from "react";

const YandexLocatorLoader = ({ onLoad, onError }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocation = async () => {
      const endpoint =
        "https://locator.api.maps.yandex.ru/v1/locate?apikey=95685747-2a6f-4c58-82ea-7d3482aa4e61";
      
      // Тело запроса можно дополнить, если доступны данные (например, по Wi‑Fi)
      const body = JSON.stringify({
        version: "1.1",
        host: window.location.hostname,
        data: {
          wifiAccessPoints: [] // Если есть данные о Wi‑Fi, их можно передать здесь
        }
      });

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body
          // Если вы попробуете использовать mode: "no-cors", то получите opaque-ответ,
          // который нельзя разобрать – поэтому для корректной работы нужен серверный прокси
        });

        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const data = await response.json();
        // Предполагается, что ответ содержит поле location: { lat: число, lon: число, ... }
        if (data && data.location) {
          onLoad(data.location);
        } else {
          throw new Error("Неверная структура ответа API");
        }
      } catch (err) {
        if (onError) {
          onError(err);
        } else {
          console.error("Ошибка получения местоположения через Яндекс Локатор:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();
  }, [onLoad, onError]);

  if (loading) {
    return <div>Загрузка местоположения...</div>;
  }
  return null;
};

export default YandexLocatorLoader;
