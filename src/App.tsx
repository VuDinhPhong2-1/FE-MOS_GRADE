import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { GraduationCap, LayoutDashboard } from 'lucide-react';
import Layout from './components/Layout/Layout';
import GradingView from './pages/GradingView';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/SchoolList';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-gray-100" />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppLayout: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'schools', label: 'Quản lý trường', icon: GraduationCap, path: '/schools' },
  ];

  return (
    <Layout navItems={navItems} userName={user?.fullName}>
      <Outlet />
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<AuthPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schools" element={<SchoolList />} />
            <Route path="/grading" element={<GradingView />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
