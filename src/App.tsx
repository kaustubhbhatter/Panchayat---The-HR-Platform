/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Teams } from './pages/Teams';
import { Login } from './pages/Login';
import { ResetPassword } from './pages/ResetPassword';
import { Attendance } from './pages/Attendance';
import { Admin } from './pages/Admin';
import { Documents } from './pages/Documents';
import { Reviews } from './pages/Reviews';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#F4F7FE]">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <AppProvider>
              <Layout />
            </AppProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="teams" element={<Teams />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="admin" element={<Admin />} />
        <Route path="documents" element={<Documents />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
