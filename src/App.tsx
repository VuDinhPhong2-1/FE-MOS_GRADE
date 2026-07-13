import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CalendarClock, ClipboardList, FlaskConical, GraduationCap, LayoutDashboard, ShieldCheck } from 'lucide-react';
import Layout from './components/Layout/Layout';
import type { SidebarNavItem } from './components/Layout/Sidebar';
import GradingView from './pages/GradingView';
import AssignmentManagementPage from './pages/AssignmentManagementPage';
import ClassGradingPage from './pages/ClassGradingPage';
import ClassScoreboardPage from './pages/ClassScoreboardPage';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/SchoolList';
import AuthPage from './pages/AuthPage';
import TeacherSchedule from './pages/TeacherSchedule';
import PermissionManagement from './pages/PermissionManagement';
import PublicExamPage from './pages/PublicExamPage';
import AccountStatusPage from './pages/AccountStatusPage';
import { AuthProvider, useAuth } from './context/AuthContext';

const isPendingOrRejectedTeacher = (user: ReturnType<typeof useAuth>['user']) =>
  user?.role === 'PendingTeacher' ||
  (
    user?.role === 'Teacher' &&
    (user?.teacherApprovalStatus === 'Pending' || user?.teacherApprovalStatus === 'Rejected')
  );

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-slate-100" />;
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

const ApprovedTeacherRoute: React.FC = () => {
  const { user } = useAuth();

  if (isPendingOrRejectedTeacher(user)) {
    return <Navigate to="/account-status" replace />;
  }

  return <Outlet />;
};

const AppLayout: React.FC = () => {
  const { user } = useAuth();

  if (isPendingOrRejectedTeacher(user)) {
    return <Navigate to="/account-status" replace />;
  }

  const canUseTeacherFeatures = user?.role === 'Teacher' || user?.role === 'Admin';

  const navItems: SidebarNavItem[] = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, path: '/dashboard' },
  ];

  if (canUseTeacherFeatures) {
    navItems.push(
      { id: 'schools', label: 'Quản lý trường', icon: GraduationCap, path: '/schools' },
      { id: 'schedule', label: 'Lịch dạy', icon: CalendarClock, path: '/schedule' },
      {
        id: 'assignments',
        label: 'Quản lý bài tập',
        icon: ClipboardList,
        path: '/assignments',
        children: [
          { id: 'assignments-exam', label: 'Tạo ca thi', path: '/assignments/exam' },
        ],
      },
      { id: 'grading-test', label: 'Test chấm điểm', icon: FlaskConical, path: '/grading' }
    );
  }

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
          <Route path="/account-status" element={<AccountStatusPage />} />
          <Route element={<ApprovedTeacherRoute />}>
            <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/schools" element={<SchoolList />} />
            <Route path="/schedule" element={<TeacherSchedule />} />
            <Route path="/assignments" element={<Navigate to="/assignments/exam" replace />} />
            <Route path="/assignments/filters" element={<Navigate to="/assignments/exam" replace />} />
            <Route path="/assignments/list" element={<Navigate to="/assignments/exam" replace />} />
            <Route path="/assignments/form" element={<Navigate to="/assignments/exam" replace />} />
            <Route path="/assignments/exam" element={<AssignmentManagementPage section="exam" />} />
            <Route path="/permissions" element={<PermissionManagement />} />
            <Route path="/grading" element={<GradingView />} />
            <Route path="/grading/class/:classId" element={<ClassGradingPage />} />
            <Route path="/scores/class/:classId" element={<ClassScoreboardPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
