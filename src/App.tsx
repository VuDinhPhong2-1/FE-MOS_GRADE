import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import type { SidebarNavItem } from './components/Layout/Sidebar';
import RouteLoadingFallback from './components/RouteLoadingFallback';
import { AuthProvider, useAuth } from './context/AuthContext';
import { hasPermission } from './utils/permissions';

// Lazy-loaded page components for optimal bundle splitting
const AuthPage = lazy(() => import('./pages/AuthPage'));
const PublicExamPage = lazy(() => import('./pages/PublicExamPage'));
const AccountStatusPage = lazy(() => import('./pages/AccountStatusPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const SchoolList = lazy(() => import('./pages/SchoolList'));
const TeacherSchedule = lazy(() => import('./pages/TeacherSchedule'));
const AssignmentManagementPage = lazy(() => import('./pages/AssignmentManagementPage'));
const XmlGradingRulesPage = lazy(() => import('./pages/XmlGradingRulesPage'));
const PermissionManagement = lazy(() => import('./pages/PermissionManagement'));
const GradingView = lazy(() => import('./pages/GradingView'));
const ClassGradingPage = lazy(() => import('./pages/ClassGradingPage'));
const ClassScoreboardPage = lazy(() => import('./pages/ClassScoreboardPage'));

const isPendingOrRejectedTeacher = (user: ReturnType<typeof useAuth>['user']) =>
  user?.role === 'PendingTeacher' ||
  (
    user?.role === 'Teacher' &&
    (user?.teacherApprovalStatus === 'Pending' || user?.teacherApprovalStatus === 'Rejected')
  );

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <RouteLoadingFallback />;
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

// Route riêng bảo vệ trang XML rules theo permission thay vì chỉ theo role.
const XmlRulesRoute: React.FC = () => {
  const { user } = useAuth();

  if (!hasPermission(user, 'xmlrules.view')) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

// Route riêng bảo vệ trang Phân quyền — vẫn giữ Admin-only vì đây là trang cấp phát quyền.
const AdminOnlyRoute: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
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
    { id: 'dashboard', label: 'Trang chủ', icon: 'home', path: '/dashboard' },
  ];

  if (canUseTeacherFeatures) {
    navItems.push(
      { id: 'schools', label: 'Trường', icon: 'school', path: '/schools' },
      { id: 'schedule', label: 'Lịch', icon: 'calendar_month', path: '/schedule' },
      { id: 'assignments', label: 'Bài tập', icon: 'assignment', path: '/assignments/exam' },
      { id: 'grading-test', label: 'Thử nghiệm', icon: 'science', path: '/grading' }
    );
  }

  // 👇 Đổi từ role === 'Admin' sang check permission 'xmlrules.view'
  if (hasPermission(user, 'xmlrules.view')) {
    navItems.push({
      id: 'xml-grading-rules',
      label: 'XML Rules',
      icon: 'code',
      path: '/admin/xml-grading-rules',
    });
  }

  // Trang Phân quyền vẫn chỉ dành cho Admin — đây là nơi cấp phát permissions
  // cho người khác nên không nên mở theo permission thường.
  if (user?.role === 'Admin') {
    navItems.push(
      { id: 'permissions', label: 'Phân quyền', icon: 'admin_panel_settings', path: '/permissions' }
    );
  }

  return (
    <Layout navItems={navItems} userName={user?.fullName}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet />
      </Suspense>
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<RouteLoadingFallback />}>
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

                {/* XML Rules: bảo vệ theo permission 'xmlrules.view' */}
                <Route element={<XmlRulesRoute />}>
                  <Route path="/admin/xml-grading-rules" element={<XmlGradingRulesPage />} />
                </Route>

                {/* Phân quyền: vẫn Admin-only */}
                <Route element={<AdminOnlyRoute />}>
                  <Route path="/permissions" element={<PermissionManagement />} />
                </Route>

                <Route path="/grading" element={<GradingView />} />
                <Route path="/grading/class/:classId" element={<ClassGradingPage />} />
                <Route path="/scores/class/:classId" element={<ClassScoreboardPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;