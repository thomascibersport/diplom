import React from "react";

function OrdersTable({ orders }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-3 px-4 border">ID Заказа</th>
            <th className="py-3 px-4 border">Клиент</th>
            <th className="py-3 px-4 border">Адрес</th>
            <th className="py-3 px-4 border">Статус</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="py-3 px-4 border">{order.id}</td>
              <td className="py-3 px-4 border">{order.client}</td>
              <td className="py-3 px-4 border">{order.address}</td>
              <td className="py-3 px-4 border">{order.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default OrdersTable;
