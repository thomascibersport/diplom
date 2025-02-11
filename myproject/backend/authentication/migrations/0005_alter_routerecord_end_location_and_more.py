# Generated by Django 5.1.1 on 2025-02-07 09:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0004_routerecord'),
    ]

    operations = [
        migrations.AlterField(
            model_name='routerecord',
            name='end_location',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='routerecord',
            name='route_distance',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='routerecord',
            name='route_duration',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
        migrations.AlterField(
            model_name='routerecord',
            name='start_location',
            field=models.CharField(max_length=255),
        ),
        migrations.AlterField(
            model_name='routerecord',
            name='trip_duration',
            field=models.CharField(max_length=20),
        ),
        migrations.AlterField(
            model_name='routerecord',
            name='weather_description',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='routerecord',
            name='weather_temperature',
            field=models.CharField(blank=True, max_length=20, null=True),
        ),
    ]
