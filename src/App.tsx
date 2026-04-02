/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Drishyam } from './pages/Dashboard';
import { Sabha } from './pages/Sabha';
import { Login } from './pages/Login';
import { Attendance } from './pages/Attendance';
import { Sarpanch } from './pages/Sarpanch';
import Lakshya from './pages/Lakshya';
import { Documents } from './pages/Documents';
import { Charcha } from './pages/Charcha';
import { db } from './firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

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
        <Route index element={<Drishyam />} />
        <Route path="sabha" element={<Sabha />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="lakshya" element={<Lakshya />} />
        <Route path="reviews" element={<Charcha />} />
        <Route path="admin" element={<Sarpanch />} />
        <Route path="documents" element={<Documents />} />
      </Route>
    </Routes>
  );
};

export default function App() {
  useEffect(() => {
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'settings', 'connection-test'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
