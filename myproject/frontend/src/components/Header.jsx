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
  const [avatar, setAvatar] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  console.log("Аватар в хедере:", avatar);
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

        // Если есть аватарка — используем её, иначе ставим заглушку
        if (response.data.avatar) {
          setAvatar(`${response.data.avatar}?t=${new Date().getTime()}`); // Добавляем timestamp
        } else {
          setAvatar("/default-avatar.jpg");
        }
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
    document.documentElement.classList.toggle("dark", !isDarkMode);
  };

  const handleProfileSettings = () => {
    navigate("/profile/edit");
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
            <Button
              variant="ghost"
              className="text-white hover:bg-gray-700 flex items-center space-x-2"
            >
              {/* Аватарка пользователя */}
              {avatar ? (
                <img
                  src={avatar}
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                  ?
                </div>
              )}

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
            <DropdownMenuItem onClick={handleLogout}>Выйти</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default Header;
