import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  fullName?: string;
}

const Header = ({ onToggleSidebar, fullName = 'Giao vien' }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-3 sm:px-6">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded hover:bg-gray-100 transition"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      <div className="ml-auto flex items-center gap-2 sm:gap-4 min-w-0">
        <span className="hidden sm:block text-sm text-gray-600 truncate">
          Xin chao, <strong>{fullName}</strong>
        </span>
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
      </div>
    </header>
  );
};

export default Header;
