import React from 'react';
import { ProgressIndicator } from '@bug-on/m3-expressive';

interface RouteLoadingFallbackProps {
  fullScreen?: boolean;
  message?: string;
}

export const RouteLoadingFallback: React.FC<RouteLoadingFallbackProps> = ({
  fullScreen = false,
  message = 'Đang tải trang...',
}) => {
  return (
    <div
      className={`flex w-full items-center justify-center p-8 ${
        fullScreen
          ? 'fixed inset-0 z-50 min-h-screen bg-m3-surface text-m3-on-surface'
          : 'min-h-[50vh]'
      }`}
    >
      <div className="flex flex-col items-center gap-3">
        <ProgressIndicator
          variant="circular"
          shape="wavy"
          size={36}
          aria-label={message}
        />
        <p className="text-sm font-medium text-m3-on-surface-variant font-md3-expressive animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

export default RouteLoadingFallback;

