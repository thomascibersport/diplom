# Generated by Django 5.1.1 on 2025-02-11 14:13

import django.contrib.auth.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('auth', '0012_alter_user_first_name_max_length'),
        ('authentication', '0005_customuser_avatar'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='customuser',
            name='patronymic',
        ),
        migrations.RemoveField(
            model_name='customuser',
            name='privacy_policy_agreed',
        ),
        migrations.AddField(
            model_name='customuser',
            name='agree_to_terms',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='customuser',
            name='middle_name',
            field=models.CharField(blank=True, max_length=150, null=True),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='email',
            field=models.EmailField(blank=True, max_length=254, verbose_name='email address'),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='first_name',
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='groups',
            field=models.ManyToManyField(blank=True, related_name='customuser_set', to='auth.group'),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='last_name',
            field=models.CharField(max_length=150),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='phone',
            field=models.CharField(default='', max_length=20),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='user_permissions',
            field=models.ManyToManyField(blank=True, related_name='customuser_permissions_set', to='auth.permission'),
        ),
        migrations.AlterField(
            model_name='customuser',
            name='username',
            field=models.CharField(error_messages={'unique': 'A user with that username already exists.'}, help_text='Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.', max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name='username'),
        ),
        migrations.CreateModel(
            name='RouteRecord',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('start_time', models.DateTimeField()),
                ('end_time', models.DateTimeField()),
                ('start_location', models.CharField(max_length=255)),
                ('end_location', models.CharField(max_length=255)),
                ('trip_duration', models.CharField(max_length=20)),
                ('route_distance', models.CharField(blank=True, max_length=50, null=True)),
                ('route_duration', models.CharField(blank=True, max_length=50, null=True)),
                ('weather_description', models.CharField(blank=True, max_length=255, null=True)),
                ('weather_temperature', models.CharField(blank=True, max_length=20, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='route_records', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
