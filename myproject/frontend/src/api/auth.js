import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/authentication/";

export const register = async (userData) => {
  return await axios.post(`${API_URL}register/`, userData);
};

export const login = async (credentials) => {
  return await axios.post(`${API_URL}login/`, credentials);
};

export const getUser = async (token) => {
  const response = await axios.get(`${API_URL}user/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

export const updateProfile = async (token, data) => {
  const formData = new FormData();

  for (const key in data) {
    if (data[key] !== null) {
      formData.append(key, data[key]);
    }
  }

  console.log("Отправляем аватар:", formData.get("avatar"));  // Дебаг

  return await axios.put(`${API_URL}profile/update/`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
