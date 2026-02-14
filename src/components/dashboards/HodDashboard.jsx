import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, FileCheck, Users, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HodDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div style={styles.container}>
      {/* SIDEBAR - Purple Theme for HoD */}
      <nav style={styles.sidebar}>
        <div style={styles.logoContainer}>
          <span style={styles.logoText}>KMIT <span style={{color: '#8b5cf6'}}>HoD</span></span>
        </div>
        <div style={styles.menuList}>
          <button style={styles.activeItem}><FileCheck size={20} /> <span style={{marginLeft: 10}}>Approvals</span></button>
          <button style={styles.menuItem}><Users size={20} /> <span style={{marginLeft: 10}}>Dept Staff</span></button>
          <button style={styles.menuItem}><ClipboardList size={20} /> <span style={{marginLeft: 10}}>Reports</span></button>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}><LogOut size={20} /> Log Out</button>
      </nav>

      <main style={styles.mainContent}>
        <h1>Welcome, Head of Department</h1>
        <p>You have <strong>3 Leave Requests</strong> pending approval.</p>
        
        {/* Placeholder for Approval List */}
        <div style={styles.card}>
           <h3>Pending Approvals</h3>
           <p style={{color: '#64748b'}}>• Suresh (Medical Leave) - 2 Days</p>
           <p style={{color: '#64748b'}}>• Ramesh (Casual Leave) - 1 Day</p>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#1e1b4b', color: '#fff', padding: '20px 0', display: 'flex', flexDirection: 'column' },
  logoContainer: { padding: '20px', fontSize: '20px', fontWeight: 'bold' },
  logoText: { color: '#fff' },
  menuList: { flex: 1 },
  activeItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderLeft: '4px solid #8b5cf6', color: '#fff', border: 'none', width: '100%', cursor: 'pointer' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'none', border: 'none', color: '#94a3b8', width: '100%', cursor: 'pointer' },
  logoutBtn: { padding: '20px', background: 'none', border: 'none', color: '#f87171', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' },
  mainContent: { padding: '40px', flex: 1 },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginTop: '20px', border: '1px solid #e2e8f0' }
};

export default HodDashboard;