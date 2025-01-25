import { useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import InputMask from "react-input-mask";
import React, { useState, useRef } from "react";
function Register() {
  const [userData, setUserData] = useState({
    first_name: "",
    last_name: "",
    patronymic: "",
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    phone: "",
  });
  const [isAgreed, setIsAgreed] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({
    password: false,
    confirm_password: false,
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateInput = () => {
    const {
      first_name,
      last_name,
      patronymic,
      username,
      password,
      confirm_password,
      phone,
      email,
    } = userData;

    const isCyrillic = /^[А-Яа-яЁё\s-]+$/;
    const isLatin = /^[A-Za-z0-9_]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+7 \(\d{3}\) - \d{3} - \d{2}-\d{2}$/;

    if (!isCyrillic.test(first_name.trim())) {
      return "Имя должно содержать только кириллицу.";
    }
    if (!isCyrillic.test(last_name.trim())) {
      return "Фамилия должна содержать только кириллицу.";
    }
    if (patronymic && !isCyrillic.test(patronymic.trim())) {
      return "Отчество должно содержать только кириллицу.";
    }
    if (!isLatin.test(username.trim())) {
      return "Имя пользователя должно содержать только латиницу и цифры.";
    }
    if (!emailRegex.test(email)) {
      return "Некорректный формат email.";
    }
    if (!phoneRegex.test(phone)) {
      return "Телефон должен быть в формате +7 (XXX) - XXX - XX-XX.";
    }
    if (password.length < 6) {
      return "Пароль должен быть не менее 6 символов.";
    }
    if (password !== confirm_password) {
      return "Пароли не совпадают.";
    }
    if (!isAgreed) {
      return "Необходимо согласие на обработку персональных данных";
    }

    return null;
  };
  const phoneInputRef = useRef(null);
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await register({ ...userData, privacy_policy_agreed: isAgreed });
      navigate("/login");
    } catch (err) {
      const errorData = err.response?.data;
      let errorMessage =
        "Ошибка регистрации. Проверьте данные и попробуйте снова.";

      if (errorData?.errors) {
        const firstErrorKey = Object.keys(errorData.errors)[0];
        if (firstErrorKey) {
          errorMessage = errorData.errors[firstErrorKey][0];
        }
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg w-full max-w-sm">
        <h1 className="text-x2 font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">
          Регистрация
        </h1>
        {error && (
          <div className="bg-red-100 text-red-800 px-3 py-1.5 rounded mb-3 text-xs">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-3">
          {["first_name", "last_name", "patronymic"].map((field) => (
            <div key={field} className="mb-3">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                {field === "first_name"
                  ? "Имя"
                  : field === "last_name"
                  ? "Фамилия"
                  : "Отчество"}
              </label>
              <input
                type="text"
                name={field}
                value={userData[field]}
                onChange={handleInputChange}
                required={field !== "patronymic"}
                className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
              />
            </div>
          ))}

          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Имя пользователя
            </label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
          </div>

          <div className="mb-3">
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
              Телефон
            </label>
            <InputMask
              mask="+7 (999) - 999 - 99-99"
              maskChar={null}
              name="phone"
              value={userData.phone}
              onChange={handleInputChange}
              required
              inputRef={phoneInputRef}
              className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
              beforeMaskedValueChange={(newState, oldState, userInput) => {
                let { value } = newState;
                // Удаляем все символы, кроме цифр и '+'
                const cleaned = value.replace(/[^\d+]/g, "");
                if (cleaned === "+7") return { ...newState, value: "+7" };
                return newState;
              }}
            />
          </div>

          {["password", "confirm_password"].map((field) => (
            <div key={field} className="mb-3">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">
                {field === "password" ? "Пароль" : "Подтверждение пароля"}
              </label>
              <div className="relative">
                <input
                  type={passwordVisibility[field] ? "text" : "password"}
                  name={field}
                  value={userData[field]}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-300"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field)}
                  className="absolute inset-y-0 right-3 text-gray-500 hover:text-gray-700"
                  aria-label={
                    passwordVisibility[field]
                      ? "Скрыть пароль"
                      : "Показать пароль"
                  }
                >
                  {passwordVisibility[field] ? "👁️" : "🔒"}
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="agreement"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              required
            />
            <label
              htmlFor="agreement"
              className="ml-2 text-sm text-gray-600 dark:text-gray-400"
            >
              Я согласен с{" "}
              <a
                href="/privacy-policy"
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                политикой обработки персональных данных
              </a>
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm"
          >
            Зарегистрироваться
          </button>
        </form>
        <p className="mt-3 text-center text-xs text-gray-600 dark:text-gray-400">
          Уже есть аккаунт?{" "}
          <a href="/login" className="text-blue-600 hover:underline text-sm">
            Авторизоваться
          </a>
        </p>
      </div>
    </div>
  );
}

export default Register;
