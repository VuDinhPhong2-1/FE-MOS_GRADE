import { Clock, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AccountStatusPage: React.FC = () => {
  const { user, logout } = useAuth();
  const status = user?.teacherApprovalStatus || (user?.role === 'PendingTeacher' ? 'Pending' : undefined);
  const isRejected = status === 'Rejected';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-xl">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-2xl ${isRejected ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
          {isRejected ? <ShieldAlert size={30} /> : <Clock size={30} />}
        </div>

        <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
          {isRejected ? 'Yêu cầu giáo viên đã bị từ chối' : 'Tài khoản đang chờ Admin duyệt'}
        </h1>

        <p className="mt-3 text-sm leading-6 text-slate-600">
          {isRejected
            ? 'Tài khoản của bạn hiện chưa có quyền giáo viên. Vui lòng liên hệ Admin nếu cần xem xét lại.'
            : 'Tài khoản đã tạo, đang chờ Admin duyệt quyền giáo viên. Bạn vẫn có thể đăng nhập để xem trạng thái tài khoản.'}
        </p>

        {user?.teacherApprovalNote && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Ghi chú từ Admin</p>
            <p className="mt-1 whitespace-pre-wrap">{user.teacherApprovalNote}</p>
          </div>
        )}

        <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-600">
          <p><span className="font-semibold text-slate-800">Tài khoản:</span> {user?.fullName || user?.username}</p>
          <p><span className="font-semibold text-slate-800">Email:</span> {user?.email || 'Chưa cập nhật'}</p>
          <p><span className="font-semibold text-slate-800">Trạng thái:</span> {status || 'Pending'}</p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          <LogOut size={16} />
          Đăng xuất
        </button>
      </section>
    </div>
  );
};

export default AccountStatusPage;