import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/login";
import Layout from "./components/Layout"; // <--- Import Layout
import EmployeeSearch from "./components/search/EmployeeSearch";

// Pages
import Home from "./components/home";
import Profile from "./components/profile";
import ApplyLeave from "./components/leave/ApplyLeave"; // Ensure path matches your folder name

const Placeholder = ({ title }) => (
  <div style={{ padding: '50px', textAlign: 'center' }}>
    <h1 style={{ color: '#F17F08' }}>{title}</h1>
    <p>Under Development</p>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />

          {/* PROTECTED ROUTES (Wrapped in Layout) */}
          <Route element={<Layout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/leaves" element={<ApplyLeave />} />
            <Route path="/search" element={<EmployeeSearch />} />
            <Route path="/adjustments" element={<Placeholder title="Adjustments" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;