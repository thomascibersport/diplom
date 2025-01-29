import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InputMask from "react-input-mask";
import Header from "../components/Header";
import { getUser, updateProfile } from "../api/auth";
import { getToken } from "../utils/auth";
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

function EditProfilePage() {
  const [profileData, setProfileData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    patronymic: "",
    phone: "",
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 1 });
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [src, setSrc] = useState(null);
  const [passwordVisibility, setPasswordVisibility] = useState({
    oldPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
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
        const user = response.data;
        setProfileData({
          username: user.username,
          email: user.email,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          patronymic: user.patronymic || "",
          phone: user.phone || "",
          oldPassword: "",
          newPassword: "",
          confirmNewPassword: "",
        });
        if (user.avatar) {
          setAvatarPreview(user.avatar);
        }
        setLoading(false);
      } catch (err) {
        console.error("Ошибка загрузки данных пользователя:", err);
        setError("Не удалось загрузить данные профиля.");
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const togglePasswordVisibility = (field) => {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };
  const handleImageUpload = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSrc(reader.result);
        setCropModalOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const getCroppedImg = (image, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob], `avatar_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(blob));
        resolve(file);
      }, 'image/jpeg');
    });
  };
  const handleCropComplete = async (crop) => {
    const image = document.getElementById('crop-image');
    await getCroppedImg(image, crop);
    setCropModalOpen(false);
  };
  const validateInput = () => {
    const {
      first_name,
      last_name,
      patronymic,
      username,
      email,
      phone,
      newPassword,
      confirmNewPassword,
    } = profileData;

    const isCyrillic = /^[А-Яа-яЁё\s-]+$/;
    const isLatin = /^[A-Za-z0-9_]+$/;
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const phoneRegex = /^\+7 \(\d{3}\) - \d{3} - \d{2}-\d{2}$/;


    if (avatarFile && !avatarFile.type.includes('image/')) {
      return "Файл аватарки должен быть изображением";
    }

    if (avatarFile && avatarFile.size > 5 * 1024 * 1024) {
      return "Размер аватарки не должен превышать 5MB";
    }
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
    if (newPassword && newPassword.length < 6) {
      return "Пароль должен быть не менее 6 символов.";
    }
    if (newPassword && newPassword !== confirmNewPassword) {
      return "Новый пароль и подтверждение не совпадают.";
    }
    return null;
  };

  const handleSave = async () => {
    console.log("Сохраняем аватар:", avatarFile); // Дебаг
    
    if (!avatarFile) {
      alert("Файл не выбран!");
      return;
    }
  
    const validationError = validateInput();
    if (validationError) {
      setError(validationError);
      return;
    }
  
    try {
      const token = getToken();
      if (!token) {
        navigate("/login");
        return;
      }
  
      const { oldPassword, newPassword, ...profileFields } = profileData;
      const updateData = {
        ...profileFields,
        ...(oldPassword && newPassword ? { oldPassword, newPassword } : {}),
        avatar: avatarFile,  // Убеждаемся, что файл передается!
      };
  
      console.log("Отправляем данные:", updateData);  // Дебаг
  
      const response = await updateProfile(token, updateData);
  
      alert("Профиль успешно обновлён!");
      setError(null);
    } catch (err) {
      console.error("Ошибка обновления профиля:", err);
      setError(err.response?.data?.message || "Не удалось обновить профиль.");
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData({ ...profileData, [name]: value });
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Загрузка...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
          Редактирование профиля
        </h1>
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">

        <div className="mb-6 flex justify-center">
        <div className="relative">
              <img
                src={avatarPreview}
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200 dark:border-gray-600"
                alt="Аватар"
              />
              <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                📷
              </label>
            </div>
          </div>

          {cropModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 rounded-lg">
                {src && (
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={handleCropComplete}
                  >
                    <img 
                      id="crop-image" 
                      src={src} 
                      alt="Crop preview" 
                    />
                  </ReactCrop>
                )}
                <button
                  onClick={() => setCropModalOpen(false)}
                  className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="text-red-500 text-sm mb-4">{error}</div>
          )}
          
          {["first_name", "last_name", "patronymic", "username", "email"].map((field) => (
            <div key={field} className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                {field === "first_name"
                  ? "Имя"
                  : field === "last_name"
                  ? "Фамилия"
                  : field === "patronymic"
                  ? "Отчество"
                  : field === "username"
                  ? "Имя пользователя"
                  : "Email"}
              </label>
              <input
                type="text"
                name={field}
                value={profileData[field]}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
          ))}
          <div className="mb-4">
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Телефон</label>
            <InputMask
              mask="+7 (999) - 999 - 99-99"
              maskChar={null}
              name="phone"
              value={profileData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          {["oldPassword", "newPassword", "confirmNewPassword"].map((field) => (
            <div key={field} className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">
                {field === "oldPassword"
                  ? "Старый пароль"
                  : field === "newPassword"
                  ? "Новый пароль"
                  : "Подтверждение пароля"}
              </label>
              <div className="relative">
                <input
                  type={passwordVisibility[field] ? "text" : "password"}
                  name={field}
                  value={profileData[field]}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility(field)}
                  className="absolute inset-y-0 right-3 text-gray-500 hover:text-gray-700"
                >
                  {passwordVisibility[field] ? "👁️" : "🔒"}
                </button>
              </div>
            </div>
          ))}
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