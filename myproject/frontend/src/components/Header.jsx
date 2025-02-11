import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { getUser } from "../api/auth";
import { getToken, logout as clearToken } from "../utils/auth";

function Header() {
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState("/default-avatar.png"); // Состояние для аватарки
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Инициализация темы из localStorage
    const savedTheme = localStorage.getItem("theme");
    return savedTheme ? savedTheme === "dark" : false;
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Применяем тему при загрузке и изменении
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getToken();
        if (!token) {
          navigate("/login");
          return;
        }
        const response = await getUser(token);
        setUsername(response.data.username);
        // Устанавливаем аватарку, если есть, или значение по умолчанию
        setAvatar(response.data.avatar || "/default-avatar.png");
      } catch (error) {
        console.error("Ошибка загрузки данных пользователя:", error);
        clearToken();
        navigate("/login");
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    clearToken();
    navigate("/login");
  };

  const handleThemeChange = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  const handleProfileSettings = () => {
    navigate("/profile/edit");
  };

  return (
    <header className="bg-gray-800 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          Delivery System
        </Link>

        <nav className="flex space-x-4">
          <Link to="/routes" className="hover:text-gray-300">
            Маршруты
          </Link>
        </nav>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-white hover:bg-gray-700">
              {/* Аватарка в кружочке */}
              <img
                src={avatar}
                alt="avatar"
                className="w-10 h-10 rounded-full object-cover"
              />
              <span>{username || "Загрузка..."}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white text-black shadow-lg rounded-lg mt-2">
            <DropdownMenuItem onClick={handleProfileSettings}>
              Настройки профиля
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleThemeChange}>
              {isDarkMode ? "Светлая тема" : "Тёмная тема"}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/route-history">История маршрутов</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Выйти
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
