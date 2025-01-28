from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from django.contrib.auth import authenticate, login
from django.shortcuts import redirect
from django.conf import settings
from django.contrib.auth.hashers import check_password
from django.contrib.auth.hashers import make_password, check_password




User = get_user_model()
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Регистрация успешно завершена'}, 
                status=status.HTTP_201_CREATED
            )
        return Response(
            {'errors': serializer.errors}, 
            status=status.HTTP_400_BAD_REQUEST
        )
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_staff": user.is_staff
        })


class LogoutView(APIView):
    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"message": "Successfully logged out"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)
class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data

        # Обновляем основные поля профиля
        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.patronymic = data.get("patronymic", getattr(user, "patronymic", ""))
        user.phone = data.get("phone", getattr(user, "phone", ""))

        # Обработка изменения пароля
        if "oldPassword" in data and "newPassword" in data:
            if not check_password(data["oldPassword"], user.password):
                return Response({"error": "Неверный старый пароль"}, status=status.HTTP_400_BAD_REQUEST)
            if len(data["newPassword"]) < 6:
                return Response({"error": "Пароль должен быть не менее 6 символов"}, status=status.HTTP_400_BAD_REQUEST)
            user.password = make_password(data["newPassword"])

        # Обработка загрузки аватара
        if "avatar" in request.FILES:
            user.avatar = request.FILES["avatar"]

        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "patronymic": getattr(user, "patronymic", ""),
            "phone": getattr(user, "phone", ""),
            "avatar": user.avatar.url if user.avatar else None
        }, status=status.HTTP_200_OK)


class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')  # Или email, если используется email
        password = request.data.get('password')

        user = authenticate(username=username, password=password)

        if user is not None and user.is_active:
            if user.is_staff:
                login(request, user)

                # Формируем ответ с настройкой куки для сессии
                response = Response({'redirect_url': '/admin/'}, status=status.HTTP_200_OK)
                
                # Устанавливаем сессионные куки
                session_key = request.session.session_key
                if not session_key:
                    request.session.create()
                    session_key = request.session.session_key

                response.set_cookie(
                    settings.SESSION_COOKIE_NAME,  # Имя куки из настроек Django
                    session_key,
                    max_age=settings.SESSION_COOKIE_AGE,
                    domain=settings.SESSION_COOKIE_DOMAIN,
                    path=settings.SESSION_COOKIE_PATH,
                    secure=settings.SESSION_COOKIE_SECURE,
                    httponly=settings.SESSION_COOKIE_HTTPONLY,
                    samesite=settings.SESSION_COOKIE_SAMESITE,
                )
                return response
            else:
                # Возвращаем JWT для обычных пользователей
                refresh = RefreshToken.for_user(user)
                return Response({
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }, status=status.HTTP_200_OK)
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "patronymic": getattr(user, "patronymic", ""),  # Если кастомное поле
            "phone": getattr(user, "phone", ""),  # Если кастомное поле
        })