import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CalendarClock, FlaskConical, GraduationCap, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Layout from './components/Layout/Layout';
import GradingView from './pages/GradingView';
import ClassGradingPage from './pages/ClassGradingPage';
import ClassScoreboardPage from './pages/ClassScoreboardPage';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/SchoolList';
import AuthPage from './pages/AuthPage';
import TeacherSchedule from './pages/TeacherSchedule';
import PermissionManagement from './pages/PermissionManagement';
import PublicExamPage from './pages/PublicExamPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-100" />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const AppLayout: React.FC = () => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'schools', label: 'Quản lý trường', icon: GraduationCap, path: '/schools' },
    { id: 'schedule', label: 'Lịch dạy', icon: CalendarClock, path: '/schedule' },
    { id: 'grading-test', label: 'Test chấm điểm', icon: FlaskConical, path: '/grading' },
  ];

  if (user?.role === 'Admin') {
    navItems.push({ id: 'permissions', label: 'Phân quyền', icon: ShieldCheck, path: '/permissions' });
  }

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
        <Route path="/exam/:token" element={<PublicExamPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schools" element={<SchoolList />} />
            <Route path="/schedule" element={<TeacherSchedule />} />
            <Route path="/permissions" element={<PermissionManagement />} />
            <Route path="/grading" element={<GradingView />} />
            <Route path="/grading/class/:classId" element={<ClassGradingPage />} />
            <Route path="/scores/class/:classId" element={<ClassScoreboardPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
