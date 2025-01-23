import React from "react";

const WeatherAnimation = ({ weatherId, description, temperature }) => {
  const getWeatherIcon = (id) => {
    if (id >= 200 && id < 300) return "🌩"; // Гроза
    if (id >= 300 && id < 500) return "🌦"; // Мелкий дождь
    if (id >= 500 && id < 600) return "🌧"; // Дождь
    if (id >= 600 && id < 700) return "❄"; // Снег
    if (id === 800) return "☀"; // Ясно
    if (id > 800) return "☁"; // Облачно
    return "❓"; // Неизвестно
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="text-4xl">{getWeatherIcon(weatherId)}</div>
      <div>
        <p className="text-gray-800 dark:text-gray-200 font-semibold">
          {description}
        </p>
        <p className="text-gray-600 dark:text-gray-400">
          Температура: {temperature}°C
        </p>
      </div>
    </div>
  );
};

// Добавляем экспорт по умолчанию
export default WeatherAnimation;
