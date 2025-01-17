import { useEffect } from "react";

function YandexMapLoader({ onLoad }) {
  useEffect(() => {
    if (window.ymaps) {
      console.log("Yandex Maps API уже загружен");
      onLoad();
      return;
    }

    const existingScript = document.querySelector('script[src="https://api-maps.yandex.ru/2.1/?lang=ru_RU"]');
    if (existingScript) {
      console.log("Скрипт Yandex Maps API уже существует");
      existingScript.onload = onLoad;
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=f2749db0-14ee-4f82-b043-5bb8082c4aa9";
    script.async = true;
    script.onload = () => {
      console.log("Yandex Maps API загружен");
      onLoad();
    };
    script.onerror = () => {
      console.error("Ошибка загрузки Yandex Maps API");
    };

    document.body.appendChild(script);
  }, [onLoad]);

  return null;
}

export default YandexMapLoader;
