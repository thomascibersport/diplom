import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/authentication/';

export const register = async (userData) => {
    return await axios.post(`${API_URL}register/`, userData);
};

export const login = async (credentials) => {
    return await axios.post(`${API_URL}login/`, credentials);
};

export const getUser = async (token) => {
    return await axios.get(`${API_URL}user/`, {
        headers: {
            Authorization: `Bearer ${token}`, // Убедитесь, что токен передаётся
        },
    });
};
export const updateProfile = async (token, userData) => {
    return await axios.put("http://127.0.0.1:8000/api/authentication/profile/update/", userData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  };