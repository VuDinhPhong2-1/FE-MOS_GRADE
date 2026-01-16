import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { BookOpen, GraduationCap, LayoutDashboard } from 'lucide-react';
import Layout from './components/Layout/Layout';
import GradingView from './pages/GradingView';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/SchoolList';
import AuthPage from './pages/AuthPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import StudentList from './pages/StudentList';

// Protected Route Component
const ProtectedRoute: React.FC = () => {
  const { user } = useAuth();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// App Layout Wrapper
const AppLayout: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, path: '/dashboard' },
    // { id: 'students', label: 'Quản lý học sinh', icon: GraduationCap, path: '/students' },
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
        {/* Public Route */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schools" element={<SchoolList />} />
            <Route path="/grading" element={<GradingView />} />
            {/* <Route path="/students" element={<StudentList />} /> */}
          </Route>
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
