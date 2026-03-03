import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Home, User, CalendarOff, Search, Shuffle, LogOut, Menu, X, 
  FileCheck, ClipboardList, Users, Settings, Globe, MessageSquare, Mail,
  Clock, BarChart2
} from 'lucide-react';

const Sidebar = ({ isOpen, isMobile, onToggle, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth(); // Added 'user' here
  const kmitOrange = "#F17F08";

  const handleLogout = () => { logout(); navigate("/"); };

  // 1. Base items everyone sees
  const baseItems = [
    // Dynamic Home Path based on role
    { id: 'home', label: 'Home', icon: <Home size={22} />, path: user?.role === 'HoD' ? '/hod-dashboard' : '/home' },
    { id: 'profile', label: 'Profile', icon: <User size={22} />, path: '/profile' },
    { id: 'leaves', label: 'Leaves', icon: <CalendarOff size={22} />, path: '/leaves' },
    { id: 'search', label: 'Search', icon: <Search size={22} />, path: '/search' },
    { id: 'view-leaves', label: 'View Leaves', icon: <ClipboardList size={22} />, path: '/view-leaves-ledger' },
    { id: 'history', label: 'History', icon: <Clock size={22} />, path: '/leave-history' },
    { id: 'adjustments', label: 'Adjustments', icon: <Shuffle size={22} />, path: '/adjustments' },
    { id: 'contact', label: 'Contact', icon: <MessageSquare size={22} />, path: '/contact' },
    { id: 'settings', label: 'Settings', icon: <Settings size={22} />, path: '/settings' },
  ];

  // 2. HoD Items
  const hodItems = [
    // Points to the new Approvals page
    { id: 'approvals', label: 'Approvals', icon: <FileCheck size={22} />, path: '/approvals' },
    { id: 'reports', label: 'Reports', icon: <ClipboardList size={22} />, path: '/reports' }, 
  ];

  // 3. Admin Items
  const adminItems = [
    { id: 'admin-dashboard', label: 'Dashboard', icon: <Home size={22} />, path: '/admin-dashboard' },
    { id: 'admin-employees', label: 'Employees', icon: <Users size={22} />, path: '/admin/employees' },
    { id: 'admin-departments', label: 'Departments', icon: <ClipboardList size={22} />, path: '/admin/departments' },
    { id: 'admin-leavetypes', label: 'Leave Types', icon: <Settings size={22} />, path: '/admin/leave-types' },
    { id: 'admin-allocate', label: 'Allocate Leaves', icon: <ClipboardList size={22} />, path: '/admin/allocate-leave' },
    { id: 'admin-reports', label: 'Reports', icon: <ClipboardList size={22} />, path: '/admin/reports' },
    { id: 'admin-holidays', label: 'Holidays', icon: <ClipboardList size={22} />, path: '/admin/holidays' },
    { id: 'admin-latemarks', label: 'Late Marks', icon: <ClipboardList size={22} />, path: '/admin/late-marks' },
    { id: 'admin-messages', label: 'Messages', icon: <Mail size={22} />, path: '/admin/messages' },
    { id: 'settings', label: 'Account Settings', icon: <Settings size={22} />, path: '/settings' },
  ];

  // 4. Combine menus based on role
  let menuItems = baseItems;
  if (user?.role === 'HoD') {
    menuItems = [...baseItems, ...hodItems];
  } else if (user?.role === 'Admin') {
    menuItems = adminItems; // Admins get their own specific menu
  } else if (user?.role === 'Principal') {
    menuItems = [
      { id: 'principal-dashboard', label: 'Dashboard', icon: <Home size={22} />, path: '/principal-dashboard' },
      { id: 'principal-employees', label: 'All Employees', icon: <Users size={22} />, path: '/principal/employees' },
      { id: 'principal-approvals', label: 'Leave Review', icon: <FileCheck size={22} />, path: '/principal/approvals' },
      { id: 'principal-analytics', label: 'Trends & Analytics', icon: <BarChart2 size={22} />, path: '/principal/analytics' },
      { id: 'principal-reports', label: 'Reports', icon: <Globe size={22} />, path: '/principal/reports' },
      { id: 'principal-messages', label: 'Messages', icon: <Mail size={22} />, path: '/principal/messages' },
      { id: 'settings', label: 'Settings', icon: <Settings size={22} />, path: '/settings' },
    ];
  }

  const sidebarWidth = isMobile ? (isOpen ? '100%' : '0px') : (isOpen ? 'var(--sidebar-width)' : 'var(--sidebar-collapsed)');

  return (
    <>
      {/* MOBILE OVERLAY */}
      {isMobile && isOpen && (
        <div style={styles.overlay} onClick={onClose} />
      )}

      <nav style={{
        ...styles.sidebar,
        width: isMobile ? '100%' : sidebarWidth,
        height: isMobile ? '100dvh' : '100vh',
        minHeight: '100vh',
        opacity: isMobile ? (isOpen ? 1 : 0) : 1,
        pointerEvents: isMobile ? (isOpen ? 'auto' : 'none') : 'auto',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        bottom: isMobile ? 0 : 'auto',
        boxShadow: isMobile && isOpen ? '0 10px 30px rgba(0,0,0,0.5)' : 'none'
      }}>
        
        {/* HEADER: MENU BUTTON + LOGO */}
        <div style={{
          ...styles.header, 
          padding: isOpen ? '0 20px' : '0', 
          justifyContent: (isOpen && !isMobile) || (isMobile && isOpen) ? 'flex-start' : 'center'
        }}>
          {!isMobile && (
            <button onClick={onToggle} style={styles.menuBtn} title="Toggle Menu">
              <Menu size={24} color="#fff" />
            </button>
          )}

          <div style={{
             ...styles.logoWrapper,
             display: (isOpen || !isMobile) ? 'flex' : 'none',
             opacity: isOpen ? 1 : (isMobile ? 0 : 0),
          }}>
             <span style={styles.logoText}>KMIT <span style={{color: 'var(--primary)'}}>ELMS</span></span>
          </div>

          {isMobile && isOpen && (
            <button onClick={onClose} style={{marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer'}}>
              <X size={24} color="#fff" />
            </button>
          )}
        </div>

        {/* MENU ITEMS */}
        <div style={styles.menuList}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const isFirstHodItem = item.id === 'approvals';

            return (
              <React.Fragment key={item.id}>
                {isFirstHodItem && isOpen && (
                  <div style={styles.sectionDivider}>HoD Controls</div>
                )}
                <button 
                  onClick={() => { 
                    navigate(item.path); 
                    if(isMobile) onClose(); 
                  }} 
                  style={{
                    ...styles.menuItem, 
                    justifyContent: isOpen ? 'flex-start' : 'center', 
                    padding: isOpen ? '12px 24px' : '16px 0',
                    color: isActive ? '#fff' : '#94a3b8',
                    background: isActive ? 'linear-gradient(90deg, rgba(241,127,8,0.1) 0%, rgba(0,0,0,0) 100%)' : 'transparent',
                    borderLeft: isActive && isOpen ? `4px solid var(--primary)` : '4px solid transparent',
                  }}
                  title={!isOpen ? item.label : ""} 
                >
                  <div style={{width: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                    {item.icon}
                  </div>
                  
                  <span style={{
                    ...styles.menuText, 
                    display: isOpen ? 'block' : 'none'
                  }}>
                    {item.label}
                  </span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* LOGOUT */}
        <button onClick={handleLogout} style={{
          ...styles.logoutBtn,
          justifyContent: isOpen ? 'flex-start' : 'center',
          padding: isOpen ? '20px 24px' : '20px 0',
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
      
      {/* MOBILE HAMBURGER (Floating when sidebar closed) */}
      {isMobile && !isOpen && (
        <button 
          onClick={onToggle} 
          style={styles.mobileMenuTrigger}
        >
          <Menu size={24} color="#fff" />
        </button>
      )}
    </>
  );
};

const styles = {
  sidebar: { 
    backgroundColor: 'var(--bg-sidebar)', display: 'flex', flexDirection: 'column', 
    height: '100dvh', maxHeight: '100dvh', zIndex: 1000, transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
    overflowX: 'hidden', whiteSpace: 'nowrap', flexShrink: 0 
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 999,
    backdropFilter: 'blur(4px)'
  },
  header: { 
    display: 'flex', alignItems: 'center', height: '70px', transition: 'padding 0.3s ease'
  },
  menuBtn: { 
    background: 'none', border: 'none', cursor: 'pointer', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%',
    transition: 'background 0.2s'
  },
  logoWrapper: { 
    display: 'flex', alignItems: 'center', marginLeft: '12px', transition: 'opacity 0.3s ease', overflow: 'hidden' 
  },
  logoText: { color: '#fff', fontSize: '18px', fontWeight: 'bold' },
  menuList: { 
    flex: 1, 
    marginTop: '5px', 
    overflowY: 'auto',
    paddingBottom: '10px',
    display: 'flex',
    flexDirection: 'column'
  },
  sectionDivider: {
    color: '#64748b', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase',
    padding: '10px 24px 5px 24px', letterSpacing: '1px'
  },
  menuItem: { 
    display: 'flex', alignItems: 'center', width: '100%', border: 'none', 
    cursor: 'pointer', transition: 'all 0.2s ease', overflow: 'hidden', background: 'none',
    minHeight: '44px' // Ensure a minimum touch target size while saving space
  },
  menuText: { fontSize: '13px', fontWeight: '500', marginLeft: '12px', whiteSpace: 'nowrap' },
  logoutBtn: { 
    display: 'flex', alignItems: 'center', border: 'none', background: 'none', 
    color: '#f87171', cursor: 'pointer', borderTop: '1px solid rgba(255,255,255,0.1)', width: '100%',
    paddingBottom: window.innerWidth <= 768 ? '30px' : '20px',
    marginTop: 'auto', // Push to the absolute bottom of the flex container
    minHeight: '60px'
  },
  mobileMenuTrigger: {
    position: 'fixed', top: '10px', left: '10px', width: '45px', height: '45px',
    borderRadius: '10px', backgroundColor: 'var(--primary)', display: 'flex', 
    alignItems: 'center', justifyContent: 'center', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 900, cursor: 'pointer'
  }
};

export default Sidebar;
