from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import UserSerializer
from .serializers import RouteRecordSerializer
from .models import RouteRecord  
import requests
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
import json
from django.http import JsonResponse, HttpResponseBadRequest


User = get_user_model()
class RegisterView(APIView):
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "User registered successfully"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        serializer = UserSerializer(user, context={'request': request})
        return Response(serializer.data)


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

        # Обновляем стандартные поля
        user.username = data.get("username", user.username)
        user.email = data.get("email", user.email)

        # Обновляем дополнительные поля ФИО и телефон
        user.first_name = data.get("first_name", user.first_name)
        user.last_name = data.get("last_name", user.last_name)
        user.middle_name = data.get("middle_name", user.middle_name)
        user.phone = data.get("phone", user.phone)

        user.save()

        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "middle_name": user.middle_name,
            "phone": user.phone,
        }, status=status.HTTP_200_OK)




class UploadAvatarView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        user = request.user
        file = request.FILES.get('avatar')

        if not file:
            return Response({"error": "Файл не загружен"}, status=status.HTTP_400_BAD_REQUEST)

        # Проверка типа файла
        if not file.content_type.startswith('image/'):
            return Response({"error": "Разрешены только изображения"}, status=400)

        # Ограничение размера файла (5MB)
        if file.size > 5 * 1024 * 1024:
            return Response({"error": "Файл слишком большой (макс. 5MB)"}, status=400)

        # Удаляем старый аватар
        if user.avatar:
            user.avatar.delete(save=False)

        # Сохраняем новый
        user.avatar.save(f'avatar_{user.id}.jpg', file, save=True)
        
        return Response({
            "message": "Аватар обновлён",
            "avatar_url": user.avatar.url
        }, status=status.HTTP_200_OK)
class UpdatePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not user.check_password(old_password):
            return Response({"error": "Неверный старый пароль."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        return Response({"message": "Пароль успешно изменён."}, status=status.HTTP_200_OK)
class RouteRecordCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("Received data:", request.data)

        data = request.data.copy()
        data["user"] = request.user.id  

        # Проверяем, не существует ли уже такой маршрут
        existing_route = RouteRecord.objects.filter(
            user=request.user,
            start_time=data["start_time"],
            end_time=data["end_time"],
            start_location=data["start_location"],
            end_location=data["end_location"],
        ).first()

        if existing_route:
            return Response({"message": "Этот маршрут уже существует"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = RouteRecordSerializer(data=data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({"message": "Маршрут сохранён", "data": serializer.data}, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
class RouteRecordListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            routes = RouteRecord.objects.filter(user=request.user).order_by('-created_at')
            serializer = RouteRecordSerializer(routes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": "Internal server error"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class RouteRecordDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            route = RouteRecord.objects.get(pk=pk, user=request.user)
        except RouteRecord.DoesNotExist:
            return Response({"error": "Маршрут не найден."}, status=status.HTTP_404_NOT_FOUND)

        route.delete()
        return Response({"message": "Маршрут успешно удалён."}, status=status.HTTP_200_OK)

@csrf_exempt
@require_POST
def proxy_deepseek(request):
    url = "https://api.deepseek.com/v1/routing"
    # Передаем тело запроса без изменений
    response = requests.post(url, data=request.body, headers={
        "Content-Type": request.headers.get("Content-Type", "application/json"),
        "Authorization": request.headers.get("Authorization", "")
    })
    data = response.json()
    # Возвращаем ответ с нужными заголовками CORS
    res = JsonResponse(data)
    res["Access-Control-Allow-Origin"] = "*"
    return res
@csrf_exempt  # если вы не используете CSRF-токены для API-запросов
def deepseek_routing_proxy(request):
    if request.method == 'POST':
        try:
            # Извлекаем данные из запроса
            data = json.loads(request.body)
            # Пример ожидаемых данных:
            # data = {
            #     "start_point": [lat, lon],
            #     "end_point": [lat, lon],
            #     "weather_conditions": { ... },
            #     "options": { ... }
            # }
            
            # Здесь можно сделать запрос к внешнему DeepSeek API:
            external_api_url = "https://external-api.example.com/deepseek-routing"  # замените на реальный URL
            response = requests.post(external_api_url, json=data)
            
            # Если нужно, можно обработать ответ или просто вернуть его клиенту:
            return JsonResponse(response.json())
        except Exception as e:
            return HttpResponseBadRequest(f"Ошибка: {str(e)}")
    else:
        return HttpResponseBadRequest("Метод запроса должен быть POST")