import { LogOut, Layout } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuthStore();

  return (
    <nav className="navbar glass">
      <div className="container flex-between nav-content">
        <div className="nav-brand">
          <Layout className="brand-icon" size={24} />
          <span className="brand-text">KanbanFlow</span>
        </div>
        
        <div className="nav-actions">
          <div className="user-info">
            <div className="avatar">{user?.email?.charAt(0).toUpperCase()}</div>
            <span className="user-email">{user?.email}</span>
          </div>
          <button className="btn-icon" onClick={logout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
