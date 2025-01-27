import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api/auth";
import { saveToken, isAuthenticated } from "../utils/auth";

function Login() {
  const [credentials, setCredentials] = useState({ 
    username: "", 
    password: ""
  });
  const [error, setError] = useState(null);
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      navigate("/");
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(credentials);

      // Проверяем наличие redirect_url в ответе
      if (response.data.redirect_url) {
        // Редирект на админ панель
        window.location.href = response.data.redirect_url;
      } else {
        // Сохраняем токен и редиректим на главную страницу
        saveToken(response.data.access);
        navigate("/");
      }
    } catch (err) {
      console.error("Ошибка авторизации:", err);
      setError("Неверное имя пользователя или пароль.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 text-center">
          Вход в систему
        </h1>
        {error && (
          <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4 text-sm dark:bg-red-200 dark:text-red-900">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Имя пользователя</label>
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          {["password"].map((field) => (
            <div key={field} className="mb-6">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                {field === "password" ? "Пароль" : "Подтверждение пароля"}
              </label>
              <div className="relative">
                <input
                  type={passwordVisibility[field] ? "text" : "password"}
                  name={field}
                  value={credentials[field]}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300 pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  aria-label={passwordVisibility[field] ? "Скрыть пароль" : "Показать пароль"}
                >
                  {passwordVisibility[field] ? "👁️" : "🔒"}
                </button>
              </div>
            </div>
          ))}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 dark:bg-blue-700 dark:hover:bg-blue-800"
          >
            Войти
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600 dark:text-gray-400">
          Нет аккаунта?{" "}
          <a href="/register" className="text-blue-600 hover:underline dark:text-blue-400">
            Зарегистрироваться
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;