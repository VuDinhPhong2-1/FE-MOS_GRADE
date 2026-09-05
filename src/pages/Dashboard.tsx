import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, ProgressIndicator, ShapeMedia } from '@bug-on/m3-expressive';
import { useAuth } from '../context/AuthContext';
import { usePageHeader } from '../context/PageActionsContext';
import { schoolService } from '../services/school.service';

interface DashboardStats {
  schoolCount: number | null;
  isLoading: boolean;
}

export default function Dashboard() {
  const { user, getAccessToken } = useAuth();
  const navigate = useNavigate();

  usePageHeader({
    title: 'Trang chủ',
  });
  const [stats, setStats] = useState<DashboardStats>({
    schoolCount: null,
    isLoading: true,
  });

  const isAdmin = user?.role === 'Admin';
  const displayName = user?.fullName || user?.username || 'Thầy/Cô';

  useEffect(() => {
    let isMounted = true;

    const fetchQuickStats = async () => {
      try {
        const schools = await schoolService.getSchools(getAccessToken);
        if (isMounted) {
          setStats({
            schoolCount: schools.length,
            isLoading: false,
          });
        }
      } catch {
        if (isMounted) {
          setStats({
            schoolCount: null,
            isLoading: false,
          });
        }
      }
    };

    void fetchQuickStats();

    return () => {
      isMounted = false;
    };
  }, [getAccessToken]);

  const quickActions = [
    {
      title: 'Quản lý trường học',
      description: 'Xem danh mục các trường, quản lý lớp học và danh sách học sinh.',
      icon: 'business',
      path: '/schools',
      color: 'from-blue-600 to-indigo-600',
    },
    {
      title: 'Xếp lịch coi thi',
      description: 'Lập lịch thi, phân công giáo viên và theo dõi ca chấm.',
      icon: 'calendar_month',
      path: '/teacher-schedule',
      color: 'from-emerald-600 to-teal-600',
    },
    ...(isAdmin
      ? [
        {
          title: 'Quy tắc chấm XML',
          description: 'Cấu hình tiêu chuẩn chấm thi tự động bài làm MOS Word, Excel, PowerPoint.',
          icon: 'rule',
          path: '/xml-grading-rules',
          color: 'from-amber-600 to-orange-600',
        },
        {
          title: 'Phân quyền người dùng',
          description: 'Quản lý tài khoản giáo viên, trạng thái phê duyệt và vai trò hệ thống.',
          icon: 'manage_accounts',
          path: '/permissions',
          color: 'from-violet-600 to-purple-600',
        },
      ]
      : []),
  ];

  const workflowSteps = [
    {
      step: '01',
      title: 'Tạo trường & Lớp',
      desc: 'Thiết lập danh mục cơ sở và lớp học tương ứng cho từng niên khóa.',
      icon: 'domain_add',
    },
    {
      step: '02',
      title: 'Nhập học sinh & Đề thi',
      desc: 'Tải danh sách học sinh theo mẫu và tạo các bài tập/kỳ thi MOS.',
      icon: 'group_add',
    },
    {
      step: '03',
      title: 'Chấm điểm tự động',
      desc: 'Công cụ chấm điểm tự động đọc bài làm và đối soát với quy tắc XML.',
      icon: 'fact_check',
    },
    {
      step: '04',
      title: 'Báo cáo & Đồng bộ Sheet',
      desc: 'Xuất kết quả chi tiết, lưu trữ tự động vào Google Spreadsheet.',
      icon: 'table_chart',
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-4xl bg-linear-to-br from-m3-primary via-m3-primary/90 to-(--md-sys-color-on-primary-container) p-8 text-m3-on-primary shadow-lg sm:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-size-[24px_24px] opacity-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <span>Hệ thống chấm điểm MOS Grader Pro</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Xin chào, {displayName}! 👋
            </h1>
            <p className="text-sm sm:text-base opacity-90 leading-relaxed">
              Chào mừng bạn đến với bảng điều khiển trung tâm. Theo dõi tiến độ chấm thi, quản lý lớp học và xuất báo cáo kết quả nhanh chóng theo tiêu chuẩn Material Design 3 Expressive.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button
                colorStyle="filled"
                size="md"
                onClick={() => navigate('/schools')}
                className="bg-white! text-m3-primary! hover:bg-white/90!"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Icon name="arrow_forward" />
                  <span>Bắt đầu quản lý trường</span>
                </div>
              </Button>
              <Button
                colorStyle="tonal"
                size="md"
                onClick={() => navigate('/teacher-schedule')}
                className="bg-white/15! text-white! hover:bg-white/25!"
              >
                <div className="flex items-center gap-2">
                  <Icon name="event" />
                  <span>Xem lịch coi thi</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Expressive ShapeMedia Showcase */}
          <div className="flex shrink-0 items-center justify-center self-center lg:self-auto">
            <ShapeMedia
              shape="sunny"
              morphTo="verySunny"
              morphOn="hover"
              morphOptions={{
                duration: 0.4,
                easing: [0.34, 1.56, 0.64, 1]
              }}
              className="flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center bg-white/15 shadow-2xl backdrop-blur-md cursor-pointer"
            >
              <div className="grid place-items-center text-center p-3 text-white">
                <Icon name="school" className="text-4xl sm:text-5xl" />
                <span className="mt-1 text-xs font-bold tracking-wider uppercase opacity-90">MOS Grade</span>
              </div>
            </ShapeMedia>
          </div>
        </div>
      </section>

      {/* KPI Stats Overview */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Trường học */}
        <div
          onClick={() => navigate('/schools')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl bg-m3-surface-container p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:bg-m3-surface-container-high hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
              <Icon name="apartment" className="text-2xl" />
            </div>
            <span className="text-xs font-semibold text-m3-on-surface-variant flex items-center gap-1 group-hover:text-m3-primary transition-colors">
              Chi tiết <Icon name="chevron_right" className="text-sm" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Trường đang quản lý
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              {stats.isLoading ? (
                <ProgressIndicator variant="circular" shape="wavy" size={24} aria-label="Đang tải số trường" />
              ) : (
                <span className="text-3xl font-black text-m3-on-surface">
                  {stats.schoolCount ?? '--'}
                </span>
              )}
              <span className="text-xs text-m3-on-surface-variant">cơ sở</span>
            </div>
          </div>
        </div>

        {/* Card 2: Chấm điểm tự động */}
        <div
          onClick={() => navigate('/schools')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl bg-m3-surface-container p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:bg-m3-surface-container-high hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Icon name="verified" className="text-2xl" />
            </div>
            <span className="text-xs font-semibold text-m3-on-surface-variant flex items-center gap-1 group-hover:text-m3-primary transition-colors">
              Mở chấm <Icon name="chevron_right" className="text-sm" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Chế độ chấm thi
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">XML Engine</span>
              <span className="text-xs text-m3-on-surface-variant">Tự động</span>
            </div>
          </div>
        </div>

        {/* Card 3: Ca coi thi */}
        <div
          onClick={() => navigate('/teacher-schedule')}
          className="group relative cursor-pointer overflow-hidden rounded-3xl bg-m3-surface-container p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:bg-m3-surface-container-high hover:shadow-md"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              <Icon name="schedule" className="text-2xl" />
            </div>
            <span className="text-xs font-semibold text-m3-on-surface-variant flex items-center gap-1 group-hover:text-m3-primary transition-colors">
              Xem lịch <Icon name="chevron_right" className="text-sm" />
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Lịch thi & Chấm thi
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-m3-on-surface">Lịch tuần</span>
              <span className="text-xs text-m3-on-surface-variant">Sẵn sàng</span>
            </div>
          </div>
        </div>

        {/* Card 4: Vai trò & Trạng thái */}
        <div className="relative overflow-hidden rounded-3xl bg-m3-surface-container p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400">
              <Icon name="badge" className="text-2xl" />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-m3-primary/10 px-2.5 py-0.5 text-xs font-semibold text-m3-primary">
              {user?.role || 'Giáo viên'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Tài khoản hiện tại
            </p>
            <div className="mt-1 truncate text-lg font-bold text-m3-on-surface" title={user?.email || ''}>
              {user?.email || user?.username}
            </div>
          </div>
        </div>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-m3-on-surface flex items-center gap-2">
            <Icon name="bolt" className="text-m3-primary text-2xl" />
            Lối tắt tác vụ nhanh
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <div
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group flex flex-col justify-between cursor-pointer rounded-3xl bg-m3-surface-container p-6 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:bg-m3-surface-container-high hover:shadow-md"
            >
              <div>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-m3-surface text-m3-primary shadow-xs group-hover:scale-110 transition-transform">
                  <Icon name={action.icon} className="text-2xl" />
                </div>
                <h3 className="text-base font-bold text-m3-on-surface group-hover:text-m3-primary transition-colors">
                  {action.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-m3-on-surface-variant">
                  {action.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-m3-primary">
                <span>Truy cập</span>
                <Icon name="arrow_forward" className="text-sm transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Standard MOS Grader Workflow Guide */}
      <section className="rounded-4xl bg-m3-surface-container p-6 sm:p-8 shadow-xs">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary">
            <Icon name="hub" className="text-xl" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-m3-on-surface">Quy trình làm việc chuẩn trên MOS Grader</h2>
            <p className="text-xs text-m3-on-surface-variant">Các bước hoàn chỉnh từ thiết lập lớp đến xuất điểm số</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((ws) => (
            <div
              key={ws.step}
              className="relative rounded-3xl bg-m3-surface-container-low p-5 transition-all hover:bg-m3-surface-container-high"
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-m3-primary/50">{ws.step}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-m3-surface-container text-m3-on-surface-variant">
                  <Icon name={ws.icon} className="text-lg" />
                </div>
              </div>
              <h4 className="mt-3 text-sm font-bold text-m3-on-surface">{ws.title}</h4>
              <p className="mt-1.5 text-xs leading-relaxed text-m3-on-surface-variant">{ws.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
