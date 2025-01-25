import { useEffect, useRef } from "react";

const YandexMapLoader = ({ onLoad }) => {
  const isScriptAdded = useRef(false);

  useEffect(() => {
    if (isScriptAdded.current) return;

    const loadMap = () => {
      if (window.ymaps) {
        window.ymaps.ready(() => onLoad());
        return;
      }

      const existingScript = document.querySelector('script[src*="api-maps.yandex.ru"]');
      if (!existingScript) {
        isScriptAdded.current = true;
        const script = document.createElement('script');
        script.src = `https://api-maps.yandex.ru/2.1/?apikey=f2749db0-14ee-4f82-b043-5bb8082c4aa9&lang=ru_RU`;
        script.onload = () => window.ymaps.ready(() => onLoad());
        document.body.appendChild(script);
      }
    };

    loadMap();
  }, [onLoad]);

  return null;
};

export default YandexMapLoader;