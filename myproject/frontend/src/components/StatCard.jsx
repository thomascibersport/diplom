import React from "react";

function StatCard({ title, value, icon, description }) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 flex items-center space-x-4">
      <div className="text-4xl">{icon}</div>
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );
}

export default StatCard;
