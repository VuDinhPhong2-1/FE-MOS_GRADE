import React, { memo, useMemo } from 'react';
import { Card, CardContent, Icon } from '@bug-on/m3-expressive';
import type { Class } from '../../../types/class.types';

interface ClassStatsGridProps {
  classes: Class[];
}

interface StatItemProps {
  label: string;
  value: string | number;
  icon: string;
  iconBgClass: string;
  iconColorClass: string;
  textColorClass?: string;
}

const StatCard: React.FC<StatItemProps> = ({
  label,
  value,
  icon,
  iconBgClass,
  iconColorClass,
  textColorClass,
}) => (
  <Card variant="filled" className="rounded-3xl border-none bg-m3-surface-container p-5 text-m3-on-surface shadow-xs">
    <CardContent className="p-0">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-m3-on-surface-variant">{label}</p>
          <p className={`mt-1 text-2xl font-bold tracking-tight ${textColorClass || ''}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconBgClass} ${iconColorClass}`}>
          <Icon name={icon} size={24} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const ClassStatsGrid: React.FC<ClassStatsGridProps> = memo(({ classes }) => {
  const activeCount = useMemo(() => classes.filter((c) => c.isActive).length, [classes]);
  const totalStudents = useMemo(
    () => classes.reduce((sum, cls) => sum + (cls.currentStudents || 0), 0),
    [classes]
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Tổng số lớp"
        value={classes.length}
        icon="menu_book"
        iconBgClass="bg-m3-primary/10"
        iconColorClass="text-m3-primary"
      />
      <StatCard
        label="Đang hoạt động"
        value={activeCount}
        icon="group"
        iconBgClass="bg-emerald-500/10"
        iconColorClass="text-emerald-600 dark:text-emerald-400"
        textColorClass="text-emerald-600 dark:text-emerald-400"
      />
      <StatCard
        label="Tổng học sinh"
        value={totalStudents}
        icon="person"
        iconBgClass="bg-amber-500/10"
        iconColorClass="text-amber-600 dark:text-amber-400"
        textColorClass="text-amber-600 dark:text-amber-400"
      />
      <StatCard
        label="Năm học"
        value="2024-2025"
        icon="calendar_today"
        iconBgClass="bg-sky-500/10"
        iconColorClass="text-sky-600 dark:text-sky-400"
        textColorClass="text-sky-600 dark:text-sky-400"
      />
    </div>
  );
});

ClassStatsGrid.displayName = 'ClassStatsGrid';
