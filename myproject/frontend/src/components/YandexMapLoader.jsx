import { useEffect, useCallback } from "react";

const YandexMapLoader = ({ onLoad }) => {
  const stableOnLoad = useCallback(onLoad, [onLoad]);

  useEffect(() => {
    const loadMap = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => setTimeout(() => stableOnLoad(), 100));
        return;
      }

      const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=f2749db0-14ee-4f82-b043-5bb8082c4aa9&lang=ru_RU`;
        script.onload = () => {
          window.ymaps.ready(() => setTimeout(() => stableOnLoad(), 100));
        };
        document.body.appendChild(script);
      }
    };

    loadMap();

    return () => {};
  }, [stableOnLoad]);

  return null;
};

export default YandexMapLoader;