import { LayoutDashboard } from 'lucide-react';

const Dashboard = () => {
  return (
    <div className="app-card mx-auto max-w-4xl p-10 text-center">
      <LayoutDashboard size={52} className="mx-auto mb-4 text-[var(--md-sys-color-primary)]" />
      <h3 className="text-2xl font-extrabold text-[var(--md-sys-color-on-surface)]">Trang tổng quan</h3>
      <p className="mt-2 text-[var(--md-sys-color-on-surface-variant)]">
        Màn hình Dashboard đang được hoàn thiện. Bạn có thể bắt đầu từ mục Quản lý trường để thao tác dữ liệu.
      </p>
    </div>
  );
};

export default Dashboard;
