import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import collegeLogo from '../assets/logo.png'; 

const Layout = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setIsSidebarOpen(true);
      else setIsSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={styles.layoutContainer}>
      
      {/* SIDEBAR */}
      <Sidebar 
        isMobile={isMobile} 
        isOpen={isSidebarOpen} 
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)} /* <--- ADDED THIS FIX */
        onClose={() => setIsSidebarOpen(false)} 
      />

      {/* MAIN CONTENT WRAPPER */}
      <div style={styles.mainContent}>
        
        {/* GLOBAL HEADER */}
        <div style={styles.topBar}>
          <div style={styles.leftSection}>
             {/* Space for future items if needed */}
          </div>
          
          {/* Right: Enlarge Clickable Logo */}
          <div 
            onClick={() => navigate('/home')} 
            style={styles.headerLogoContainer}
            title="Return to Home"
          >
            <img src={collegeLogo} alt="College Logo" style={styles.headerLogo} />
          </div>
        </div>

        {/* PAGE CONTENT */}
        <div style={styles.contentScroll}>
           <Outlet /> 
        </div>
      </div>
    </div>
  );
};

const styles = {
  layoutContainer: { 
    display: 'flex', 
    height: '100vh', 
    width: '100vw', 
    background: 'var(--bg-main)', 
    overflow: 'hidden' 
  },
  mainContent: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    height: '100%', 
    overflow: 'hidden',
    position: 'relative'
  },
  topBar: {
    height: window.innerWidth <= 768 ? '70px' : '100px', 
    padding: window.innerWidth <= 768 ? '0 20px' : '0 40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between', 
    background: 'transparent', 
    flexShrink: 0,
    position: 'relative',
    zIndex: 10
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    minWidth: '40px'
  },
  headerLogoContainer: {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    padding: '10px',
    transition: 'transform 0.2s'
  },
  headerLogo: {
    height: window.innerWidth <= 768 ? '50px' : '80px', 
    width: 'auto',
    objectFit: 'contain'
  },
  contentScroll: { 
    flex: 1, 
    overflowY: 'auto', 
    padding: window.innerWidth <= 768 ? '0 15px 100px 15px' : '0 40px 40px 40px' 
  } 
};

export default Layout;