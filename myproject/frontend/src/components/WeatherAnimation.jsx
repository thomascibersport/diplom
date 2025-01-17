import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faCloud, faCloudRain, faSnowflake, faBolt, faSmog } from "@fortawesome/free-solid-svg-icons";
import "../WeatherAnimation.css";

function WeatherAnimation({ weatherId }) {
  const getWeatherIcon = () => {
    if (weatherId === 800) return faSun;
    if (weatherId >= 801 && weatherId <= 804) return faCloud;
    if (weatherId >= 300 && weatherId < 600) return faCloudRain;
    if (weatherId >= 200 && weatherId < 300) return faBolt;
    if (weatherId >= 600 && weatherId < 700) return faSnowflake;
    if (weatherId >= 700 && weatherId < 800) return faSmog;
    return null;
  };

  const weatherIcon = getWeatherIcon();

  return (
    <div
      className="animate__animated animate__fadeIn"
      style={{
        fontSize: "48px",
        color: "#333",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "150px",
        width: "150px",
      }}
    >
      {weatherIcon ? (
        <FontAwesomeIcon icon={weatherIcon} />
      ) : (
        <p style={{ color: "red", fontSize: "14px" }}>Анимация недоступна</p>
      )}
    </div>
  );
}

export default WeatherAnimation;
