// Header.jsx
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
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = getToken();
        if (!token) {
          navigate("/login"); // Перенаправление на страницу входа, если токена нет
          return;
        }
        const response = await getUser(token);
        setUsername(response.data.username); // Установка имени пользователя
      } catch (error) {
        console.error("Ошибка загрузки данных пользователя:", error);
        clearToken();
        navigate("/login"); // Перенаправление на страницу входа в случае ошибки
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    clearToken(); // Удаление токена из localStorage
    navigate("/login"); // Перенаправление на страницу входа
  };

  const handleThemeChange = () => {
    setIsDarkMode((prevMode) => !prevMode);
    document.documentElement.classList.toggle("dark", !isDarkMode); // Смена темы
  };

  const handleProfileSettings = () => {
    navigate("/profile/edit"); // Перенаправление на страницу редактирования профиля
  };

  return (
    <header className="bg-gray-800 text-white py-4 px-6 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        {/* Логотип */}
        <Link to="/" className="text-2xl font-bold hover:text-gray-300">
          Delivery System
        </Link>

        {/* Ссылки */}
        <nav className="flex space-x-4">
          <Link to="/routes" className="hover:underline hover:text-gray-300">
            Маршруты
          </Link>
        </nav>

        {/* Выпадающее меню пользователя */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="text-white hover:bg-gray-700">
              {username || "Загрузка..."}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-white text-black shadow-lg rounded-lg mt-2">
            <DropdownMenuItem onClick={handleProfileSettings}>
              Настройки профиля
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleThemeChange}>
              {isDarkMode ? "Светлая тема" : "Тёмная тема"}
            </DropdownMenuItem>
            {/* Новая ссылка на страницу истории маршрутов */}
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
