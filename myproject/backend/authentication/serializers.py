from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import RouteRecord

User = get_user_model()
class UserSerializer(serializers.ModelSerializer):
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "avatar", "first_name", "last_name", "middle_name", "phone"]

    def get_avatar(self, obj):
        if obj.avatar:
            return self.context['request'].build_absolute_uri(obj.avatar.url)
        return None

        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'confirm_password',
            'first_name', 'last_name', 'middle_name', 'phone', 'agree_to_terms'
        ]
    
    def validate(self, data):
        if data.get('password') != data.pop('confirm_password'):
            raise serializers.ValidationError("Пароли не совпадают.")
        return data
    
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            middle_name=validated_data.get('middle_name', ''),
            phone=validated_data.get('phone', ''),
            agree_to_terms=validated_data.get('agree_to_terms', False)
        )
        return user
class RouteRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = RouteRecord
        fields = [
            'id',
            'user',
            'start_time',
            'end_time',
            'start_location',
            'end_location',
            'trip_duration',
            'route_distance',
            'route_duration',
            'weather_description',
            'weather_temperature',
            'created_at'
        ]
        read_only_fields = ['user', 'created_at']
        extra_kwargs = {
            'start_time': {'required': True},
            'end_time': {'required': True},
            'start_location': {'required': True},
            'end_location': {'required': True},
            'trip_duration': {'required': True}
        }
def post(self, request):
    print("Received data:", request.data)  # Логирование входящих данных
    data = request.data.copy()
    data['user'] = request.user.id  # Присваиваем текущего пользователя

    serializer = RouteRecordSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        print("Saved data:", serializer.data)  # Логирование сохраненных данных
        return Response(
            {"message": "Маршрут сохранён", "data": serializer.data},
            status=status.HTTP_201_CREATED
        )

    print("Validation errors:", serializer.errors)  # Логирование ошибок валидации
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)