import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCw, Search, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import type { TeacherApprovalRequest, TeacherSummary } from '../types/auth.types';

type PermissionInfo = {
  label: string;
  description: string;
};

type TeacherRequestStatusFilter = 'pending' | 'approved' | 'rejected' | 'all';
type ActiveTab = 'requests' | 'permissions';

const PERMISSION_INFO_MAP: Record<string, PermissionInfo> = {
  'users.view': {
    label: 'Xem danh sách người dùng',
    description: 'Cho phép xem danh sách tài khoản trong hệ thống.',
  },
  'users.create': {
    label: 'Tạo người dùng',
    description: 'Cho phép tạo tài khoản người dùng mới.',
  },
  'users.edit': {
    label: 'Sửa người dùng',
    description: 'Cho phép chỉnh sửa thông tin và quyền của người dùng.',
  },
  'users.delete': {
    label: 'Xóa người dùng',
    description: 'Cho phép xóa tài khoản người dùng.',
  },
  'grades.view': {
    label: 'Xem điểm',
    description: 'Cho phép xem điểm và kết quả chấm.',
  },
  'grades.create': {
    label: 'Nhập điểm',
    description: 'Cho phép tạo mới điểm và kết quả chấm.',
  },
  'grades.edit': {
    label: 'Sửa điểm',
    description: 'Cho phép chỉnh sửa điểm đã lưu.',
  },
  'grades.delete': {
    label: 'Xóa điểm',
    description: 'Cho phép xóa bản ghi điểm.',
  },
  'grades.export': {
    label: 'Xuất điểm',
    description: 'Cho phép xuất dữ liệu điểm ra file báo cáo.',
  },
  'projects.view': {
    label: 'Xem project',
    description: 'Cho phép xem danh sách project/bài tập chấm.',
  },
  'projects.create': {
    label: 'Tạo project',
    description: 'Cho phép tạo mới project/bài tập.',
  },
  'projects.edit': {
    label: 'Sửa project',
    description: 'Cho phép cập nhật thông tin project/bài tập.',
  },
  'projects.delete': {
    label: 'Xóa project',
    description: 'Cho phép xóa project/bài tập.',
  },
  'schools.view': {
    label: 'Xem trường',
    description: 'Cho phép xem danh sách và thông tin trường.',
  },
  'schools.create': {
    label: 'Tạo trường',
    description: 'Cho phép tạo mới trường học.',
  },
  'schools.edit': {
    label: 'Sửa trường',
    description: 'Cho phép chỉnh sửa thông tin trường.',
  },
  'schools.delete': {
    label: 'Xóa trường',
    description: 'Cho phép xóa trường học.',
  },
  'students.view': {
    label: 'Xem học sinh',
    description: 'Cho phép xem danh sách và hồ sơ học sinh.',
  },
  'students.create': {
    label: 'Tạo học sinh',
    description: 'Cho phép thêm học sinh mới.',
  },
  'students.edit': {
    label: 'Sửa học sinh',
    description: 'Cho phép chỉnh sửa thông tin học sinh.',
  },
  'students.delete': {
    label: 'Xóa học sinh',
    description: 'Cho phép xóa học sinh khỏi hệ thống.',
  },
  'students.import': {
    label: 'Import học sinh',
    description: 'Cho phép nhập học sinh từ file.',
  },
  'students.bulkimport': {
    label: 'Bulk import học sinh',
    description: 'Cho phép nhập hàng loạt học sinh.',
  },
  'system.logs.view': {
    label: 'Xem log hệ thống',
    description: 'Cho phép xem nhật ký hệ thống.',
  },
  'system.settings.manage': {
    label: 'Quản lý cấu hình hệ thống',
    description: 'Cho phép thay đổi cấu hình hệ thống.',
  },
};

const getPermissionInfo = (permission: string): PermissionInfo => {
  const mapped = PERMISSION_INFO_MAP[permission];
  if (mapped) return mapped;

  return {
    label: permission,
    description: 'Quyền hệ thống chưa có mô tả chi tiết.',
  };
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN');
};

const getStatusLabel = (status?: string) => {
  if (status === 'Approved') return 'Đã duyệt';
  if (status === 'Rejected') return 'Đã từ chối';
  return 'Đang chờ';
};

const PermissionManagement: React.FC = () => {
  const { user, getAccessToken } = useAuth();
  const isAdmin = user?.role === 'Admin';

  const [activeTab, setActiveTab] = useState<ActiveTab>('requests');
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [decidingUserId, setDecidingUserId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [teacherRequests, setTeacherRequests] = useState<TeacherApprovalRequest[]>([]);
  const [requestStatus, setRequestStatus] = useState<TeacherRequestStatusFilter>('pending');
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});
  const [permissionCatalog, setPermissionCatalog] = useState<string[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [teacherKeyword, setTeacherKeyword] = useState('');

  const selectedTeacher = useMemo(
    () => teachers.find((teacher) => teacher.userId === selectedTeacherId) || null,
    [teachers, selectedTeacherId]
  );

  const filteredTeachers = useMemo(() => {
    const keyword = teacherKeyword.trim().toLowerCase();
    if (!keyword) return teachers;

    return teachers.filter((teacher) => {
      const fullName = (teacher.fullName || '').toLowerCase();
      const username = (teacher.username || '').toLowerCase();
      const email = (teacher.email || '').toLowerCase();
      return fullName.includes(keyword) || username.includes(keyword) || email.includes(keyword);
    });
  }, [teacherKeyword, teachers]);

  const selectTeacher = (teacherId: string, source: TeacherSummary[] = teachers) => {
    setSelectedTeacherId(teacherId);
    const teacher = source.find((item) => item.userId === teacherId);
    setSelectedPermissions([...(teacher?.permissions || [])]);
  };

  const loadPermissionData = useCallback(async (preferredTeacherId?: string) => {
    if (!isAdmin) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const [teacherList, catalog] = await Promise.all([
        authService.getTeachers(getAccessToken, true),
        authService.getPermissionCatalog(getAccessToken),
      ]);

      setTeachers(teacherList);
      setPermissionCatalog(catalog.permissions || []);

      if (teacherList.length === 0) {
        setSelectedTeacherId('');
        setSelectedPermissions([]);
        return;
      }

      const targetTeacherId =
        preferredTeacherId && teacherList.some((teacher) => teacher.userId === preferredTeacherId)
          ? preferredTeacherId
          : teacherList[0].userId;
      setSelectedTeacherId(targetTeacherId);
      const targetTeacher = teacherList.find((teacher) => teacher.userId === targetTeacherId);
      setSelectedPermissions([...(targetTeacher?.permissions || [])]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu phân quyền');
    } finally {
      setLoading(false);
    }
  }, [getAccessToken, isAdmin]);

  const loadTeacherRequests = useCallback(async () => {
    if (!isAdmin) return;

    setRequestLoading(true);
    setError('');
    setSuccess('');

    try {
      const requests = await authService.getTeacherRequests(requestStatus, getAccessToken);
      setTeacherRequests(requests);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải yêu cầu giáo viên');
    } finally {
      setRequestLoading(false);
    }
  }, [getAccessToken, isAdmin, requestStatus]);

  useEffect(() => {
    void loadPermissionData();
  }, [loadPermissionData]);

  useEffect(() => {
    void loadTeacherRequests();
  }, [loadTeacherRequests]);

  const togglePermission = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission) ? prev.filter((item) => item !== permission) : [...prev, permission]
    );
  };

  const savePermissions = async () => {
    if (!selectedTeacherId) {
      setError('Vui lòng chọn giáo viên.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const updatedTeacher = await authService.updateTeacherPermissions(
        selectedTeacherId,
        { permissions: selectedPermissions },
        getAccessToken
      );

      setTeachers((prev) =>
        prev.map((teacher) =>
          teacher.userId === updatedTeacher.userId
            ? { ...teacher, permissions: updatedTeacher.permissions || [] }
            : teacher
        )
      );
      setSelectedPermissions([...(updatedTeacher.permissions || [])]);
      setSuccess('Đã lưu phân quyền giáo viên.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu phân quyền');
    } finally {
      setSaving(false);
    }
  };

  const decideTeacherRequest = async (request: TeacherApprovalRequest, decision: 'approve' | 'reject') => {
    if (decision === 'reject' && !decisionNotes[request.userId]?.trim()) {
      setError('Vui lòng nhập ghi chú khi từ chối yêu cầu.');
      return;
    }

    try {
      setDecidingUserId(request.userId);
      setError('');
      setSuccess('');

      await authService.decideTeacherRequest(
        request.userId,
        { decision, note: decisionNotes[request.userId]?.trim() || undefined },
        getAccessToken
      );

      setSuccess(decision === 'approve' ? 'Đã duyệt yêu cầu giáo viên.' : 'Đã từ chối yêu cầu giáo viên.');
      setDecisionNotes((prev) => ({ ...prev, [request.userId]: '' }));
      await Promise.all([loadTeacherRequests(), loadPermissionData(selectedTeacherId)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu giáo viên');
    } finally {
      setDecidingUserId('');
    }
  };

  if (!isAdmin) {
    return (
      <section className="app-card p-6">
        <h1 className="app-section-title text-2xl">Phân quyền giáo viên</h1>
        <p className="mt-3 text-sm text-red-600">Chỉ Admin mới có quyền truy cập chức năng này.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="app-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-blue-50 text-blue-700">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="app-section-title text-2xl">Phân quyền giáo viên</h2>
              <p className="text-sm text-slate-500">
                Admin duyệt tài khoản giáo viên mới và chỉnh permissions cho giáo viên đã duyệt.
              </p>
            </div>
          </div>

          <div className="ml-auto">
            <button
              type="button"
              onClick={() => {
                void loadTeacherRequests();
                void loadPermissionData(selectedTeacherId);
              }}
              className="app-btn-secondary inline-flex items-center gap-2 px-4 py-2 text-sm"
              disabled={loading || requestLoading || saving || Boolean(decidingUserId)}
            >
              <RefreshCw size={16} className={loading || requestLoading ? 'animate-spin' : ''} />
              Làm mới
            </button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {success && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('requests')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === 'requests' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Yêu cầu giáo viên
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`rounded-xl px-4 py-2 text-sm font-semibold ${
            activeTab === 'permissions' ? 'bg-blue-600 text-white shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          Phân quyền đã duyệt
        </button>
      </div>

      {activeTab === 'requests' ? (
        <section className="app-card p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Yêu cầu giáo viên</h3>
              <p className="text-sm text-slate-500">Duyệt hoặc từ chối tài khoản giáo viên mới đăng ký.</p>
            </div>
            <select
              value={requestStatus}
              onChange={(event) => setRequestStatus(event.target.value as TeacherRequestStatusFilter)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="pending">Đang chờ</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Đã từ chối</option>
              <option value="all">Tất cả</option>
            </select>
          </div>

          {requestLoading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Đang tải yêu cầu...
            </div>
          ) : teacherRequests.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Không có yêu cầu giáo viên phù hợp.
            </div>
          ) : (
            <div className="space-y-3">
              {teacherRequests.map((request) => {
                const status = request.teacherApprovalStatus || 'Pending';
                const isPending = status === 'Pending';
                const isBusy = decidingUserId === request.userId;

                return (
                  <article key={request.userId} className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900">{request.fullName || request.username}</h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              status === 'Approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : status === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500">{request.email || request.username}</p>
                        <p className="mt-1 text-xs text-slate-500">Gửi yêu cầu: {formatDateTime(request.teacherApprovalRequestedAt)}</p>
                        {request.teacherApprovalReviewedAt && (
                          <p className="text-xs text-slate-500">
                            Xử lý: {formatDateTime(request.teacherApprovalReviewedAt)} bởi {request.teacherApprovalReviewedBy || 'Admin'}
                          </p>
                        )}
                        {request.teacherApprovalNote && (
                          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                            Ghi chú: {request.teacherApprovalNote}
                          </p>
                        )}
                      </div>

                      {isPending && (
                        <div className="w-full space-y-2 sm:w-80">
                          <textarea
                            value={decisionNotes[request.userId] || ''}
                            onChange={(event) =>
                              setDecisionNotes((prev) => ({ ...prev, [request.userId]: event.target.value }))
                            }
                            className="min-h-20 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Ghi chú khi từ chối (hoặc ghi chú nội bộ)..."
                            disabled={isBusy}
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void decideTeacherRequest(request, 'approve')}
                              disabled={isBusy}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                              Duyệt
                            </button>
                            <button
                              type="button"
                              onClick={() => void decideTeacherRequest(request, 'reject')}
                              disabled={isBusy}
                              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
                            >
                              {isBusy ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                              Từ chối
                            </button>
                          </div>
                        </div>
                      )}

                      {!isPending && (
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-50 text-slate-500">
                          {status === 'Approved' ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <article className="app-card p-4">
            <div className="relative mb-3">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={teacherKeyword}
                onChange={(event) => setTeacherKeyword(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Tìm giáo viên..."
              />
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                Đang tải giáo viên...
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
                Không có giáo viên phù hợp.
              </div>
            ) : (
              <div className="max-h-[560px] space-y-2 overflow-y-auto pr-1">
                {filteredTeachers.map((teacher) => {
                  const isSelected = selectedTeacherId === teacher.userId;
                  return (
                    <button
                      key={teacher.userId}
                      type="button"
                      onClick={() => selectTeacher(teacher.userId)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        isSelected
                          ? 'border-blue-300 bg-blue-50 text-blue-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50/40'
                      }`}
                    >
                      <div className="truncate text-sm font-semibold">{teacher.fullName || teacher.username}</div>
                      <div className="truncate text-xs text-slate-500">{teacher.email || teacher.username}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </article>

          <article className="app-card p-4">
            {!selectedTeacher ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                Chọn giáo viên ở cột trái để chỉnh quyền.
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-slate-900">{selectedTeacher.fullName || selectedTeacher.username}</h3>
                  <p className="text-sm text-slate-500">{selectedTeacher.email || selectedTeacher.username}</p>
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-md bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                    onClick={() => setSelectedPermissions([...permissionCatalog])}
                    disabled={loading || saving}
                  >
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-700 hover:bg-slate-200"
                    onClick={() => setSelectedPermissions([])}
                    disabled={loading || saving}
                  >
                    Bỏ chọn tất cả
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {permissionCatalog.map((permission) => {
                    const checked = selectedPermissions.includes(permission);
                    const permissionInfo = getPermissionInfo(permission);
                    return (
                      <div
                        key={permission}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                          checked
                            ? 'border-blue-200 bg-blue-50 text-blue-800'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => togglePermission(permission)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{permissionInfo.label}</p>
                            <p className="truncate text-xs text-slate-500">{permission}</p>
                          </div>
                        </label>

                        <div className="relative group">
                          <button
                            type="button"
                            className="grid h-5 w-5 place-items-center rounded-full border border-amber-300 bg-amber-50 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
                            aria-label={`Mô tả quyền ${permissionInfo.label}`}
                            title="Xem mô tả quyền"
                          >
                            !
                          </button>
                          <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-64 rounded-md bg-slate-900 px-3 py-2 text-xs text-white shadow-lg group-hover:block group-focus-within:block">
                            <p className="font-semibold">{permissionInfo.label}</p>
                            <p className="mt-1 text-slate-200">{permissionInfo.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void savePermissions()}
                    disabled={saving || loading}
                    className="app-btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                    {saving ? 'Đang lưu...' : 'Lưu phân quyền'}
                  </button>
                </div>
              </>
            )}
          </article>
        </section>
      )}
    </div>
  );
};

export default PermissionManagement;