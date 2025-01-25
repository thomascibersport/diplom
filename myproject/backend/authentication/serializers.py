from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.core.validators import validate_email

User = get_user_model()

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
            'privacy_policy_agreed'
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