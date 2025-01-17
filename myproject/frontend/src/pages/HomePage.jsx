import React from "react";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import OrdersTable from "../components/OrdersTable";
import ActivityChart from "../components/ActivityChart"

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <Header />
      <div className="p-6">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-800 dark:text-gray-200">
          Панель управления
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <StatCard
            title="Активные заказы"
            value="25"
            icon="📦"
            description="Количество заказов в процессе"
          />
          <StatCard
            title="Маршруты на сегодня"
            value="12"
            icon="🛣️"
            description="Запланированные маршруты"
          />
          <StatCard
            title="Занятые склады"
            value="3"
            icon="🏢"
            description="Склады с активными заказами"
          />
        </div>
        <div>
          <ActivityChart></ActivityChart>
        </div>
        <OrdersTable
          orders={[
            { id: 1, client: "Иван Иванов", address: "Москва, ул. Ленина, 1", status: "Доставляется" },
            { id: 2, client: "Петр Петров", address: "Санкт-Петербург, пр. Невский, 10", status: "В пути" },
            { id: 3, client: "Мария Смирнова", address: "Екатеринбург, ул. Мира, 5", status: "Доставлено" },
          ]}
        />
      </div>
    </div>
  );
};

export default HomePage;
