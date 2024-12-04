import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TimeStateProvider } from './contexts/TimeStateContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { TimerPage } from './pages/TimerPage';
import { Dashboard } from './pages/Dashboard';
import { PomodoroPage } from './pages/PomodoroPage';
import { LoginPage } from './pages/LoginPage';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50">
    <Navigation />
    <div className="max-w-7xl mx-auto px-4 py-8">
      {children}
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TimeStateProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout>
                  <TimerPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/pomodoro" element={
              <ProtectedRoute>
                <AppLayout>
                  <PomodoroPage />
                </AppLayout>
              </ProtectedRoute>
            } />
            <Route path="*" element={
              <ProtectedRoute>
                <AppLayout>
                  <div className="text-center py-12">
                    <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
                    <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
                  </div>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </TimeStateProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;