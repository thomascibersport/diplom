import Cookies from "js-cookie";

// Сохраняем токен в куки
export const saveToken = (token) => {
  // Параметры можно настроить: 
  // secure: true (только по HTTPS), sameSite: 'Strict' или 'Lax'
  Cookies.set("token", token, { secure: true, sameSite: "Strict" });
};

// Получаем токен из куки
export const getToken = () => Cookies.get("token");

// Удаляем токен из куки
export const removeToken = () => Cookies.remove("token");

// Проверяем, существует ли токен
export const isAuthenticated = () => {
  const token = getToken();
  return !!token;
};

// Выход (удаление токена)
export const logout = () => {
  removeToken();
};