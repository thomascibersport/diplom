import axios from 'axios';
import { getToken } from '../utils/auth';
const API_URL = 'http://127.0.0.1:8000/api/authentication/';

export const register = async (userData) => {
    return await axios.post(`${API_URL}register/`, userData); // Убедитесь, что "register/" существует
};

export const login = async (credentials) => {
    return await axios.post(`${API_URL}login/`, credentials);
};

export const getUser = async () => {
    const token = getToken();
    if (!token) {
      throw new Error("No token found");
    }
    try {
      const response = await axios.get(`${API_URL}user/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Ошибка загрузки данных пользователя:", error);
      throw error;
    }
  };
export const updateProfile = async (token, data) => {
    const response = await axios.put("/api/profile", data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response;
  };