import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, UserPlus, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div style={styles.container}>
      <nav style={styles.sidebar}>
        <div style={styles.logoContainer}>KMIT <span style={{color: '#ef4444'}}>ADMIN</span></div>
        <button style={styles.activeItem}><Settings size={20} /> Configuration</button>
        <button style={styles.menuItem}><UserPlus size={20} /> Manage Users</button>
        <button style={styles.menuItem}><Database size={20} /> Database</button>
        <button onClick={() => { logout(); navigate("/"); }} style={styles.logoutBtn}><LogOut size={20} /> Log Out</button>
      </nav>
      <main style={styles.mainContent}>
        <h1>System Administration</h1>
        <div style={styles.card}>
           <h3>Quick Actions</h3>
           <button style={styles.btn}>Add New Employee</button>
           <button style={styles.btn}>Update Leave Policy</button>
        </div>
      </main>
    </div>
  );
};

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'Inter, sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#7f1d1d', color: '#fff', padding: '20px 0', display: 'flex', flexDirection: 'column' }, // Red theme
  logoContainer: { padding: '20px', fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' },
  activeItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', width: '100%', gap: '10px' },
  menuItem: { display: 'flex', alignItems: 'center', padding: '15px 20px', background: 'none', border: 'none', color: '#fca5a5', width: '100%', gap: '10px' },
  logoutBtn: { marginTop: 'auto', padding: '20px', background: 'none', border: 'none', color: '#fff', display: 'flex', gap: '10px' },
  mainContent: { padding: '40px', flex: 1 },
  card: { background: 'white', padding: '20px', borderRadius: '10px', marginTop: '20px', border: '1px solid #e2e8f0' },
  btn: { padding: '10px 20px', marginRight: '10px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer'}
};

export default AdminDashboard;