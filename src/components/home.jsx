import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

// Import the specific dashboards
import EmployeeDashboard from './dashboards/EmployeeDashboard';
import HodDashboard from './dashboards/HodDashboard';
import PrincipalDashboard from './dashboards/PrincipalDashboard';
import AdminDashboard from './dashboards/AdminDashboard';

const Home = () => {
  const { user } = useAuth();

  // Safety check: If no user is logged in, kick them out
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // --- TRAFFIC CONTROLLER ---
  // Based on the role from MongoDB, render the correct view
  switch (user.role) {
    case 'Admin':
      return <AdminDashboard />;
      
    case 'Principal':  // Matches "Principal" from your seed.js
      return <PrincipalDashboard />;
      
    case 'HoD':        // Matches "HoD" from your seed.js
      return <HodDashboard />;
      
    case 'Employee':   // Matches "Employee" from your seed.js
      return <EmployeeDashboard />;
      
    default:
      // Fallback if role is missing or typo
      return <div style={{padding: 50}}>Error: Unknown Role ({user.role})</div>;
  }
};

export default Home;