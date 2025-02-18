# Generated by Django 5.1.1 on 2025-01-25 06:07

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0002_alter_customuser_email_alter_customuser_phone_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='phone',
            field=models.CharField(error_messages={'max_length': 'Номер телефона слишком длинный', 'unique': 'Этот номер телефона уже зарегистрирован.'}, max_length=23, unique=True, validators=[django.core.validators.RegexValidator(message="Телефон должен быть в формате: '+7 (XXX) - XXX - XX-XX'", regex='^\\+7 \\(\\d{3}\\) - \\d{3} - \\d{2}-\\d{2}$')], verbose_name='Телефон'),
        ),
    ]
