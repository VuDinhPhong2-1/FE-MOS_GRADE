import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';

export interface PageAction {
  id: string;
  label: string;
  icon?: string; // Material Symbol snake_case name (ví dụ: 'add', 'refresh', 'file_upload')
  onClick: () => void;
  colorStyle?: 'filled' | 'outlined' | 'tonal' | 'text' | 'elevated';
  variant?: 'filled' | 'outlined' | 'tonal' | 'text' | 'elevated'; // alias for colorStyle
  disabled?: boolean;
  className?: string;
}

export interface PageHeaderConfig {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: PageAction[];
}

interface PageActionsContextType {
  config: PageHeaderConfig;
  setConfig: React.Dispatch<React.SetStateAction<PageHeaderConfig>>;
}

const PageActionsContext = createContext<PageActionsContextType | undefined>(undefined);

export const PageActionsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PageHeaderConfig>({});

  const value = useMemo(() => ({ config, setConfig }), [config]);

  return (
    <PageActionsContext.Provider value={value}>
      {children}
    </PageActionsContext.Provider>
  );
};

export const usePageActionsContext = (): PageActionsContextType => {
  const context = useContext(PageActionsContext);
  if (!context) {
    throw new Error('usePageActionsContext must be used within a PageActionsProvider');
  }
  return context;
};

/**
 * Hook cho phép mỗi page đăng ký Title, Subtitle và các action buttons lên Header / FABMenu
 */
export const usePageHeader = (
  pageConfig: PageHeaderConfig,
  deps: React.DependencyList = []
) => {
  const { setConfig } = usePageActionsContext();

  useEffect(() => {
    setConfig({
      title: pageConfig.title,
      subtitle: pageConfig.subtitle,
      actions: pageConfig.actions,
    });

    return () => {
      setConfig({});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
