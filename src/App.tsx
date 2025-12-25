import { Routes, Route, Navigate } from 'react-router-dom';
import { BookOpen, GraduationCap, LayoutDashboard } from 'lucide-react';
import Layout from './components/Layout/Layout';
import GradingView from './pages/GradingView';
import StudentList from './pages/StudentList';
import Dashboard from './pages/Dashboard';
import SchoolList from './pages/SchoolList';

function App() {
  const navItems = [
    { id: 'dashboard', label: 'Trang chủ', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'students', label: 'Quản lý học sinh', icon: GraduationCap, path: '/students' },
    { id: 'schools', label: 'Quản lý trường', icon: GraduationCap, path: '/schools' },
    // { id: 'grading', label: 'Chấm điểm thi', icon: BookOpen, path: '/grading' },
  ];

  return (
    <Layout navItems={navItems} userName="Giáo viên">
      <Routes>
        <Route path="/" element={<Navigate to="/grading" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* <Route path="/students" element={<StudentList />} /> */}
        <Route path="/grading" element={<GradingView />} />
        <Route path="/schools" element={<SchoolList />} />
      </Routes>
    </Layout>
  );
}

export default App;
