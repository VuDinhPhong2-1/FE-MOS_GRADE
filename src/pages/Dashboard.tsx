import { LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="app-card mx-auto max-w-4xl p-10 text-center">
      <LayoutDashboard size={52} className="mx-auto mb-4 text-blue-600/80" />
      <h3 className="text-2xl font-extrabold text-slate-900">Trang tổng quan</h3>
      <p className="mt-2 text-slate-600">
        Màn hình Dashboard đang được hoàn thiện. Bạn có thể bắt đầu từ mục Quản lý trường để thao tác dữ liệu.
      </p>
    </div>
  );
};

export default Dashboard;
