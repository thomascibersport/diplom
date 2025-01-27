import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { getUser, updateProfile } from "../api/auth";
import { getToken } from "../utils/auth";

function EditProfilePage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [patronymic, setPatronymic] = useState("");
  const [phone, setPhone] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
        setEmail(response.data.email);
        setLastName(response.data.last_name || "");
        setFirstName(response.data.first_name || "");
        setPatronymic(response.data.patronymic || "");
        setPhone(response.data.phone || "");
        setLoading(false);
      } catch (err) {
        console.error("Ошибка загрузки данных пользователя:", err);
        setError("Не удалось загрузить данные профиля.");
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSave = async () => {
    try {
      if (newPassword && newPassword !== confirmNewPassword) {
        setError("Новый пароль и подтверждение не совпадают");
        return;
      }

      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      const updateData = {
        username,
        email,
        last_name: lastName,
        first_name: firstName,
        patronymic,
        phone,
        ...(newPassword && { oldPassword, newPassword })
      };

      const response = await updateProfile(token, updateData);
      
      // Обновляем состояния после успешного сохранения
      setUsername(response.data.username);
      setEmail(response.data.email);
      setLastName(response.data.last_name);
      setFirstName(response.data.first_name);
      setPatronymic(response.data.patronymic);
      setPhone(response.data.phone);
      
      setOldPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      alert("Профиль успешно обновлён!");
      setError(null);
    } catch (err) {
      console.error("Ошибка обновления профиля:", err);
      setError(err.response?.data?.message || "Не удалось обновить профиль.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
          Редактирование профиля
        </h1>
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div className="mb-4 grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Фамилия</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Имя</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Отчество</label>
              <input
                type="text"
                value={patronymic}
                onChange={(e) => setPatronymic(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>

          <div className="mb-6 border-t pt-4">
            <h3 className="text-lg font-medium mb-4 text-gray-700 dark:text-gray-300">
              Смена пароля
            </h3>

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Старый пароль</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                Подтвердите новый пароль
              </label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
          </div>

          {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

          <button
            onClick={handleSave}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
          >
            Сохранить
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditProfilePage;