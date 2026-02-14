import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const PrincipalDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.logoContainer}>KMIT <span style={{color: '#06b6d4'}}>DEAN</span></div>
        <button style={styles.activeItem}><Globe size={20} /> Global View</button>
        <button style={styles.menuItem}><BarChart3 size={20} /> Analytics</button>
        <button onClick={() => { logout(); navigate("/"); }} style={styles.logoutBtn}><LogOut size={20} /> Log Out</button>
      </nav>
      <main style={styles.mainContent}>
        <h1>Institute Overview</h1>
        <div style={styles.card}>
           <h3>Today's Stats</h3>
           <p>Total Staff on Leave: <strong>12</strong></p>
           <p>Departments Active: <strong>5</strong></p>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#155e75', color: '#fff', padding: '20px 0', display: 'flex', flexDirection: 'column' }, // Cyan theme
  logoContainer: { padding: '20px', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' },
  activeItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '100%', gap: '10px' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'none', border: 'none', color: '#cbd5e1', width: '100%', gap: '10px' },
  logoutBtn: { marginTop: 'auto', padding: '20px', background: 'none', border: 'none', color: '#fff', display: 'flex', gap: '10px' },
  mainContent: { padding: '40px', flex: 1 },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginTop: '20px', border: '1px solid #e2e8f0' }
};

export default PrincipalDashboard;