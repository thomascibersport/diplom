import React, { useState, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import StatCard from "../components/StatCard";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

const StatisticsOverview = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Если токен отсутствует (гость), отправляем запрос без заголовка авторизации.
        const token = Cookies.get("token");
        const config = token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : {};
        const response = await axios.get(
          "http://127.0.0.1:8000/api/statistics/",
          config
        );
        setStats(response.data);
      } catch (error) {
        console.error("Ошибка загрузки статистики", error);
      }
    };
    fetchStats();
  }, []);

  if (!stats) {
    return <div className="text-center py-10">Загрузка статистики...</div>;
  }
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        Статистика доставки
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Средняя скорость доставки"
          value={`${stats.average_speed} км/ч`}
          icon="🚚"
          description="В среднем по всем маршрутам"
        />
        <StatCard
          title="Чаще доставляют в"
          value={stats.most_delivered_region}
          icon="🌍"
          description="Регион с наибольшим числом доставок"
        />
        <StatCard
          title="Самый длинный маршрут"
          value={`${stats.farthest_route.distance} км`}
          icon="🛣️"
        />
        <StatCard
          title="Самая быстрая доставка"
          value={`${stats.fastest_delivery.duration}1:01 мин`}
          icon="⏱️"
          description="Минимальное время доставки"
        />
        <StatCard
          title="Всего доставок"
          value={stats.total_deliveries}
          icon="📦"
          description="Общее количество доставок"
        />
        <StatCard
          title="Общее расстояние"
          value={`${stats.total_distance} км`}
          icon="📏"
          description="Суммарное расстояние по всем маршрутам"
        />
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Динамика доставок по дням
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={stats.deliveries_chart}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#8884d8"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatisticsOverview;
