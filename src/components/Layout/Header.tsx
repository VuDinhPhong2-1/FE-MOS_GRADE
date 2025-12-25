import { Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  userName?: string;
}

const Header = ({ onToggleSidebar, userName = "Giáo viên" }: HeaderProps) => {
  return (
    <header className="bg-white shadow-sm h-16 flex items-center px-6">
      <button 
        onClick={onToggleSidebar} 
        className="p-2 rounded hover:bg-gray-100 transition"
      >
        <Menu size={20} className="text-gray-600" />
      </button>
      
      <div className="ml-auto flex items-center gap-4">
        <span className="text-sm text-gray-600">
          Xin chào, <strong>{userName}</strong>
        </span>
        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
      </div>
    </header>
  );
};

export default Header;
