import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (role && user.role !== role) {
    // If user exists but doesn't have the right role, redirect to their home
    return <Navigate to="/home" />;
  }

  return children;
};

export default ProtectedRoute;