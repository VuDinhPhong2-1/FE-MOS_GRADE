import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Chip, Icon, LoadingIndicator, ShapeMedia, Text, type ShapeMediaProps } from '@bug-on/m3-expressive';
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

  const quickActions: Array<{
    title: string;
    description: string;
    icon: string;
    path: string;
    shape: ShapeMediaProps['shape'];
    colorClass: string;
  }> = [
      {
        title: 'Quản lý trường học',
        description: 'Xem danh mục các trường, quản lý lớp học và danh sách học sinh.',
        icon: 'apartment',
        path: '/schools',
        shape: 'arch',
        colorClass: 'bg-m3-primary-container text-m3-on-primary-container',
      },
      {
        title: 'Xếp lịch coi thi',
        description: 'Lập lịch thi, phân công giáo viên và theo dõi ca chấm.',
        icon: 'calendar_month',
        path: '/schedule',
        shape: 'clover8Leaf',
        colorClass: 'bg-m3-secondary-container text-m3-on-secondary-container',
      },
      ...(isAdmin
        ? [
          {
            title: 'Quy tắc chấm XML',
            description: 'Cấu hình tiêu chuẩn chấm thi tự động bài làm MOS Word, Excel, PowerPoint.',
            icon: 'rule',
            path: '/admin/xml-grading-rules',
            shape: 'flower' as const,
            colorClass: 'bg-m3-tertiary-container text-m3-on-tertiary-container',
          },
          {
            title: 'Phân quyền người dùng',
            description: 'Quản lý tài khoản giáo viên, trạng thái phê duyệt và vai trò hệ thống.',
            icon: 'manage_accounts',
            path: '/permissions',
            shape: 'pentagon' as const,
            colorClass: 'bg-m3-tertiary text-m3-on-tertiary',
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
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <Card className="relative overflow-hidden p-8 sm:p-10" variant='filled'>
        <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <Chip label="Hệ thống chấm điểm MOS Grader Pro" variant="suggestion" className="rounded-full px-3 py-1 text-xs font-semibold" />
            <Text className="text-2xl font-black tracking-tight sm:text-3xl lg:text-4xl">
              Xin chào, {displayName}! 👋
            </Text>
            <Text className="text-sm sm:text-base opacity-90 leading-relaxed">
              Chào mừng bạn đến với bảng điều khiển trung tâm. Theo dõi tiến độ chấm thi, quản lý lớp học và xuất báo cáo kết quả nhanh chóng.
            </Text>
          </div>
          <div className="flex shrink-0 items-center justify-center self-center lg:self-auto">
            <ShapeMedia
              shape="softBurst"
              morphTo="verySunny"
              morphOn="hover"
              morphOptions={{
                duration: 0.4,
                easing: [0.34, 1.56, 0.64, 1]
              }}
              className="flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center bg-m3-secondary cursor-pointer select-none"
            >
              <div className="grid place-items-center text-center p-3 text-m3-on-secondary">
                <Icon name="school" className="text-4xl sm:text-5xl" variant='rounded' />
                <span className="mt-1 text-xs font-bold tracking-wider uppercase opacity-90">MOS Grade</span>
              </div>
            </ShapeMedia>
          </div>
        </div>
      </Card>

      {/* KPI Stats Overview */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Trường học */}
        <Card
          onClick={() => navigate('/schools')}
          className="group relative cursor-pointer bg-m3-surface-container p-5"
          variant='filled'
        >
          <div className="flex items-center justify-between">
            <ShapeMedia
              shape="arch"
              width={48}
              height={48}
              className="flex h-12 w-12 items-center justify-center bg-m3-primary-container text-m3-on-primary-container select-none"
            >
              <Icon name="apartment" variant='rounded' size={24} />
            </ShapeMedia>
          </div>
          <div className="mt-4">
            <p className="text-xs text-left font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Trường đang quản lý
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              {stats.isLoading ? (
                <LoadingIndicator size={24} aria-label="Đang tải số trường" />
              ) : (
                <span className="text-3xl font-black text-m3-on-surface">
                  {stats.schoolCount ?? '--'}
                </span>
              )}
              <span className="text-xs text-m3-on-surface-variant">cơ sở</span>
            </div>
          </div>
        </Card>

        {/* Card 2: Chấm điểm tự động */}
        <Card
          onClick={() => navigate('/admin/xml-grading-rules')}
          className="group relative cursor-pointer bg-m3-surface-container p-5"
          variant="filled"
        >
          <div className="flex items-center justify-between">
            <ShapeMedia
              shape="circle"
              width={48}
              height={48}
              className="flex h-12 w-12 items-center justify-center bg-m3-secondary-container text-m3-on-secondary-container select-none"
            >
              <Icon name="verified" variant="rounded" size={24} />
            </ShapeMedia>
          </div>
          <div className="mt-4">
            <p className="text-left text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Chế độ chấm thi
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-m3-secondary">XML Engine</span>
              <span className="text-xs text-m3-on-surface-variant">Tự động</span>
            </div>
          </div>
        </Card>

        {/* Card 3: Ca coi thi */}
        <Card
          onClick={() => navigate('/schedule')}
          className="group relative cursor-pointer bg-m3-surface-container p-5"
          variant="filled"
        >
          <div className="flex items-center justify-between">
            <ShapeMedia
              shape="pixelCircle"
              width={48}
              height={48}
              className="flex h-12 w-12 items-center justify-center bg-m3-tertiary-container text-m3-on-tertiary-container select-none"
            >
              <Icon name="schedule" variant="rounded" size={24} />
            </ShapeMedia>
          </div>
          <div className="mt-4">
            <p className="text-left text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Lịch thi & Chấm thi
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-black text-m3-on-surface">Lịch tuần</span>
              <span className="text-xs text-m3-on-surface-variant">Sẵn sàng</span>
            </div>
          </div>
        </Card>

        {/* Card 4: Vai trò & Trạng thái */}
        <Card
          className="relative bg-m3-surface-container p-5"
          variant="filled"
        >
          <div className="flex items-center justify-between">
            <ShapeMedia
              shape="clover4Leaf"
              width={48}
              height={48}
              className="flex h-12 w-12 items-center justify-center bg-m3-primary-container text-m3-on-primary-container select-none"
            >
              <Icon name="badge" variant="rounded" size={24} />
            </ShapeMedia>
            <span className="inline-flex items-center gap-1 rounded-full bg-m3-primary/10 px-2.5 py-0.5 text-xs font-semibold text-m3-primary dark:bg-m3-primary-container/40 dark:text-m3-primary">
              {user?.role || 'Giáo viên'}
            </span>
          </div>
          <div className="mt-4">
            <p className="text-left text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">
              Tài khoản hiện tại
            </p>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="truncate text-2xl font-black text-m3-on-surface" title={user?.email || ''}>
                {user?.email || user?.username}
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* Quick Action Navigation Grid */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-m3-on-surface flex items-center gap-2">
            <Icon name="bolt" className="text-m3-primary" size={24} variant='rounded' />
            Lối tắt tác vụ nhanh
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card
              key={action.path}
              onClick={() => navigate(action.path)}
              className="group flex flex-col justify-between cursor-pointer bg-m3-surface-container p-5"
              variant="filled"
            >
              <div>
                <ShapeMedia
                  shape={action.shape}
                  width={48}
                  height={48}
                  className={`mb-4 flex h-12 w-12 items-center justify-center select-none ${action.colorClass}`}
                >
                  <Icon name={action.icon} variant="rounded" size={24} />
                </ShapeMedia>
                <h3 className="text-left text-base font-bold text-m3-on-surface transition-colors group-hover:text-m3-primary">
                  {action.title}
                </h3>
                <p className="text-left mt-2 text-xs leading-relaxed text-m3-on-surface-variant">
                  {action.description}
                </p>
              </div>
              <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-m3-primary">
                <span>Truy cập</span>
                <Icon name="arrow_forward" className="text-sm transition-transform group-hover:translate-x-1" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Standard MOS Grader Workflow Guide */}
      <section className="rounded-m3-lg bg-m3-surface-container p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-m3-primary/10 text-m3-primary dark:bg-m3-primary-container dark:text-m3-on-primary-container">
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
              className="relative rounded-m3-md bg-m3-surface-container-low p-5 transition-[border-radius,background-color] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:rounded-xl hover:bg-m3-surface-container-high"
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
    </div >
  );
}
