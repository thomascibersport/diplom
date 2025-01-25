from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import RegexValidator

class CustomUser(AbstractUser):
    phone_regex = RegexValidator(
        regex=r'^\+7 \(\d{3}\) - \d{3} - \d{2}-\d{2}$',
        message="Телефон должен быть в формате: '+7 (XXX) - XXX - XX-XX'"
    )
    
    # Явно переопределяем поле username для кастомизации
    username = models.CharField(
        'Логин',
        max_length=150,
        unique=True,
        error_messages={
            'unique': 'Пользователь с таким логином уже существует.',
        },
    )
    
    patronymic = models.CharField(
        'Отчество',
        max_length=30,
        blank=True,
        default=''
    )
    
    phone = models.CharField(
        'Телефон',
        max_length=23,  # Увеличено для соответствия маске (+7 (999) - 999 - 99-99)
        unique=True,
        validators=[phone_regex],
        error_messages={
            'unique': 'Этот номер телефона уже зарегистрирован.',
            'max_length': 'Номер телефона слишком длинный'
        }
    )
    
    email = models.EmailField(
        'Email',
        unique=True,
        error_messages={
            'unique': 'Этот email уже зарегистрирован.',
        }
    )

    privacy_policy_agreed = models.BooleanField(
        'Согласие на обработку данных',
        default=False
    )
    
    def __str__(self):
        return f"{self.last_name} {self.first_name} ({self.username})"