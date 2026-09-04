import React from 'react';
import { ProgressIndicator } from '@bug-on/m3-expressive';

export const RouteLoadingFallback: React.FC = () => {
  return (
    <div className="flex min-h-[50vh] w-full items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <ProgressIndicator
          variant="circular"
          shape="wavy"
          size={36}
          aria-label="Đang tải trang..."
        />
        <p className="text-sm font-medium text-m3-on-surface-variant font-md3-expressive">
          Đang tải trang...
        </p>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;
