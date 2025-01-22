import { useEffect, useCallback } from "react";

function YandexMapLoader({ onLoad }) {
  const stableOnLoad = useCallback(onLoad, []);

  useEffect(() => {
    if (window.ymaps) {
      console.log("Yandex Maps API уже загружен");
      window.ymaps.ready(stableOnLoad);
      return;
    }

    const existingScript = document.querySelector('script[src="https://api-maps.yandex.ru/2.1/?lang=ru_RU"]');
    if (existingScript) {
      console.log("Скрипт Yandex Maps API уже существует");
      if (!existingScript.onload) {
        existingScript.onload = () => {
          console.log("Yandex Maps API успешно загружен");
          window.ymaps.ready(stableOnLoad);
        };
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://api-maps.yandex.ru/2.1/?lang=ru_RU&apikey=f2749db0-14ee-4f82-b043-5bb8082c4aa9";
    script.async = true;
    script.onload = () => {
      console.log("Yandex Maps API успешно загружен");
      window.ymaps.ready(stableOnLoad);
    };
    script.onerror = () => {
      console.error("Ошибка загрузки Yandex Maps API");
    };

    document.body.appendChild(script);

    return () => {
      if (script.parentElement) {
        script.parentElement.removeChild(script);
      }
    };
  }, [stableOnLoad]);

  return null;
}

export default YandexMapLoader;
