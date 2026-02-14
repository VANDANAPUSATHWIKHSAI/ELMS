import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, User, CalendarOff, Search, Shuffle, LogOut, Menu, X
} from 'lucide-react';

const Sidebar = ({ isOpen, isMobile, onToggle, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const kmitOrange = "#F17F08";

  const handleLogout = () => { logout(); navigate("/"); };

  const menuItems = [
    { id: 'home', label: 'Home', icon: <Home size={22} />, path: '/home' },
    { id: 'profile', label: 'Profile', icon: <User size={22} />, path: '/profile' },
    { id: 'leaves', label: 'Leaves', icon: <CalendarOff size={22} />, path: '/leaves' },
    { id: 'search', label: 'Search', icon: <Search size={22} />, path: '/search' },
    { id: 'adjustments', label: 'Adjustments', icon: <Shuffle size={22} />, path: '/adjustments' },
  ];

  const sidebarWidth = isMobile ? (isOpen ? '260px' : '0px') : (isOpen ? '260px' : '70px');

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobile && isOpen && (
        <div style={styles.overlay} onClick={onClose} />
      )}

      <nav style={{
        ...styles.sidebar,
        width: sidebarWidth,
        transform: isMobile && !isOpen ? 'translateX(-100%)' : 'none',
        position: isMobile ? 'fixed' : 'relative',
        boxShadow: isMobile && isOpen ? '4px 0 15px rgba(0,0,0,0.3)' : 'none'
      }}>
        
        {/* HEADER: MENU BUTTON + LOGO */}
        <div style={{
          ...styles.header, 
          padding: isOpen ? '0 20px' : '0', 
          justifyContent: isOpen ? 'flex-start' : 'center' // Perfect center when closed
        }}>
          {/* Menu Toggle */}
          <button onClick={onToggle} style={styles.menuBtn} title="Toggle Menu">
            <Menu size={24} color="#fff" />
          </button>

          {/* Logo Text (Completely removed from flow when closed) */}
          <div style={{
             ...styles.logoWrapper,
             display: isOpen ? 'flex' : 'none', // Critical fix for centering
             opacity: isOpen ? 1 : 0,
          }}>
             <span style={styles.logoText}>KMIT <span style={{color: kmitOrange}}>ELMS</span></span>
          </div>

          {/* Close X (Mobile Only) */}
          {isMobile && isOpen && (
            <button onClick={onClose} style={{marginLeft: 'auto', background: 'none', border: 'none'}}>
              <X size={24} color="#fff" />
            </button>
          )}
        </div>

        {/* MENU ITEMS */}
        <div style={styles.menuList}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button 
                key={item.id}
                onClick={() => { 
                  navigate(item.path); 
                  if(isMobile) onClose(); 
                }} 
                style={{
                  ...styles.menuItem, 
                  justifyContent: isOpen ? 'flex-start' : 'center', 
                  padding: isOpen ? '16px 24px' : '16px 0',
                  color: isActive ? '#fff' : '#94a3b8',
                  background: isActive ? 'linear-gradient(90deg, rgba(241,127,8,0.1) 0%, rgba(0,0,0,0) 100%)' : 'transparent',
                  borderLeft: isActive && isOpen ? `4px solid ${kmitOrange}` : '4px solid transparent',
                }}
                title={!isOpen ? item.label : ""} 
              >
                {/* Fixed width container for icon ensures consistent alignment */}
                <div style={{width: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                  {item.icon}
                </div>
                
                <span style={{
                  ...styles.menuText, 
                  display: isOpen ? 'block' : 'none' // Remove text from flow when closed
                }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* LOGOUT */}
        <button onClick={handleLogout} style={{
          ...styles.logoutBtn,
          justifyContent: isOpen ? 'flex-start' : 'center',
          padding: isOpen ? '24px' : '24px 0',
        }}>
          <div style={{width: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <LogOut size={22} />
          </div>
          <span style={{
             ...styles.menuText, 
             display: isOpen ? 'block' : 'none'
          }}>
            Log Out
          </span>
        </button>
      </nav>
    </>
  );
};

const styles = {
  sidebar: { 
    backgroundColor: '#000000', 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100vh', 
    zIndex: 1000, 
    transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
    overflowX: 'hidden', 
    whiteSpace: 'nowrap',
    flexShrink: 0 
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
    backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999
  },
  header: { 
    display: 'flex', 
    alignItems: 'center', 
    height: '70px', 
    // Removed 'gap' here to prevent off-center push
    transition: 'padding 0.3s ease'
  },
  menuBtn: { 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    padding: '8px',
    borderRadius: '50%',
    transition: 'background 0.2s',
    ':hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
  },
  logoWrapper: { 
    display: 'flex', 
    alignItems: 'center', 
    marginLeft: '12px', // Moved gap here
    transition: 'opacity 0.3s ease', 
    overflow: 'hidden' 
  },
  logoText: { color: '#fff', fontSize: '18px', fontWeight: 'bold' },
  menuList: { flex: 1, marginTop: '20px' },
  menuItem: { 
    display: 'flex', 
    alignItems: 'center', 
    width: '100%', 
    border: 'none', 
    cursor: 'pointer', 
    transition: 'all 0.2s ease', 
    overflow: 'hidden' 
  },
  menuText: { fontSize: '15px', fontWeight: '500', marginLeft: '12px', whiteSpace: 'nowrap' },
  logoutBtn: { 
    display: 'flex', 
    alignItems: 'center', 
    border: 'none', 
    background: 'none', 
    color: '#f87171', 
    cursor: 'pointer', 
    borderTop: '1px solid rgba(255,255,255,0.1)', 
    width: '100%' // Ensure full width for centering
  },
};

export default Sidebar;