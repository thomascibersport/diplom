from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import validate_email
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'first_name',
            'last_name',
            'patronymic',
            'phone',
            'avatar'
        ]
        extra_kwargs = {
            'avatar': {'required': False, 'allow_null': True},
            'email': {'read_only': True},
            'username': {'read_only': True}
        }
class UpdateProfileSerializer(serializers.ModelSerializer):
    avatar = serializers.ImageField(required=False)

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "patronymic", "phone", "avatar"]

    def update(self, instance, validated_data):
        avatar = validated_data.pop("avatar", None)

        if avatar:
            # Удаляем старый аватар, если он был
            if instance.avatar:
                old_avatar_path = instance.avatar.path
                if os.path.exists(old_avatar_path):
                    os.remove(old_avatar_path)

            print(f"Сохраняем аватар: {avatar}")  # Лог для проверки
            instance.avatar = avatar

        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    confirm_password = serializers.CharField(write_only=True)
    privacy_policy_agreed = serializers.BooleanField(
        required=True,
        error_messages={
            'required': 'Необходимо дать согласие на обработку данных'
        }
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
            'phone',
            'first_name',
            'last_name',
            'patronymic',
            'privacy_policy_agreed',
            'avatar'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 6},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'patronymic': {'required': False, 'allow_blank': True}
        }

    def validate(self, data):
        if data['password'] != data.pop('confirm_password'):
            raise serializers.ValidationError({
                'confirm_password': ['Пароли не совпадают']
            })
        
        if not data.get('privacy_policy_agreed'):
            raise serializers.ValidationError({
                'privacy_policy_agreed': ['Требуется согласие на обработку данных']
            })

        return data

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
        validated_data.pop('confirm_password', None)
        return super().create(validated_data)
    def create(self, validated_data):
        validated_data.pop('confirm_password', None)  # Убираем confirm_password перед созданием пользователя
        validated_data.pop('privacy_policy_agreed', None)  # Убираем privacy_policy_agreed перед созданием
        return User.objects.create_user(**validated_data)  # Создаем пользователя через create_user
