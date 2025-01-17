export const saveToken = (token) => localStorage.setItem("token", token);
export const getToken = () => localStorage.getItem("token");
export const removeToken = () => localStorage.removeItem("token");

export const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    return !!token; // Возвращает true, если токен существует
  };
export const logout = () => {
    localStorage.removeItem("token"); // Удаление токена
  };
