# Generated by Django 5.1.1 on 2025-02-14 18:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0007_routerecord_average_speed'),
    ]

    operations = [
        migrations.AlterField(
            model_name='routerecord',
            name='average_speed',
            field=models.FloatField(blank=True, null=True, verbose_name='Средняя скорость (км/ч)'),
        ),
    ]
