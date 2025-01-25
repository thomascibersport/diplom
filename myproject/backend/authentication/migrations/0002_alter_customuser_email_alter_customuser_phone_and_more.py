# Generated by Django 5.1.1 on 2025-01-25 05:42

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='email',
            field=models.EmailField(error_messages={'unique': 'Этот email уже зарегистрирован.'}, max_length=254, unique=True, verbose_name='Email'),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='phone',
            field=models.CharField(error_messages={'unique': 'Этот номер телефона уже зарегистрирован.'}, max_length=20, unique=True, validators=[django.core.validators.RegexValidator(message="Телефон должен быть в формате: '+7 (XXX) - XXX - XX-XX'", regex='^\\+7 \\(\\d{3}\\) - \\d{3} - \\d{2}-\\d{2}$')], verbose_name='Телефон'),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='username',
            field=models.CharField(error_messages={'unique': 'Пользователь с таким логином уже существует.'}, max_length=150, unique=True, verbose_name='Логин'),
        ),
    ]
