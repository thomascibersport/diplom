import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DriverRoutePage from "./pages/DriverRoutePage";
import HomePage from "./pages/HomePage";
import Login from "./components/Login";
import Register from "./components/Register";
import EditProfilePage from "./pages/EditProfilePage";
import RouteHistoryPage from "./pages/RouteHistoryPage";
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} /> {/* Новая главная страница */}
        <Route path="/routes" element={<DriverRoutePage />} /> 
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/edit" element={<EditProfilePage />} />
        <Route path="/route-history" element={<RouteHistoryPage />} />
      </Routes>
    </Router>
  );
};

export default App;
