import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Settings, Lock, CheckCircle, XCircle } from 'lucide-react';

const AccountSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return showToast("New passwords do not match", "error");
    }

    setLoading(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/users/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Token is required for authMiddleware
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message, 'success');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(data.message || 'Failed to change password', 'error');
      }
    } catch (err) {
      showToast('Network error', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {toast.visible && (
        <div style={{...styles.toast, backgroundColor: toast.type === 'success' ? '#10b981' : '#dc2626'}}>
          {toast.type === 'success' ? <CheckCircle size={18} color="white" /> : <XCircle size={18} color="white" />}
          {toast.message}
        </div>
      )}

      <div style={styles.header}>
        <h2 style={styles.title}>Account & Settings</h2>
        <p style={{color: '#64748b', margin: '4px 0 0 0'}}>Manage your administrator account and system preferences.</p>
      </div>

      <div style={styles.grid}>
        
        {/* CHANGE PASSWORD CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Lock size={20} color="#1e293b" />
            <h3 style={styles.cardTitle}>Change Password</h3>
          </div>
          
          <form onSubmit={submitPasswordChange} style={styles.form}>
            <div style={styles.inputGroup}>
               <label style={styles.label}>Current Password</label>
               <input 
                 type="password" name="currentPassword" required 
                 value={passwordData.currentPassword} onChange={handlePasswordChange} 
                 style={styles.input} placeholder="Enter current password" 
               />
            </div>
            
            <div style={styles.inputGroup}>
               <label style={styles.label}>New Password</label>
               <input 
                 type="password" name="newPassword" required 
                 value={passwordData.newPassword} onChange={handlePasswordChange} 
                 style={styles.input} placeholder="Enter new password" 
               />
            </div>
            
            <div style={styles.inputGroup}>
               <label style={styles.label}>Confirm New Password</label>
               <input 
                 type="password" name="confirmPassword" required 
                 value={passwordData.confirmPassword} onChange={handlePasswordChange} 
                 style={styles.input} placeholder="Confirm new password" 
               />
            </div>

            <button type="submit" disabled={loading} style={styles.btnSave}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* SYSTEM CONFIGURATION CARD (Mock for now) */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Settings size={20} color="#1e293b" />
            <h3 style={styles.cardTitle}>System Configuration</h3>
          </div>
          <div style={{color: '#64748b', fontSize: '14px', lineHeight: '1.6'}}>
            <p><strong>Current Academic Year:</strong> 2026-2027</p>
            <p><strong>Allowed CL per Year:</strong> 15</p>
            <p><strong>Allowed AL per Year:</strong> 10</p>
            <p style={{marginTop: '20px', fontStyle: 'italic', fontSize: '12px'}}>
              Global system configuration settings will be editable in a future update. For now, they are read-only to prevent workflow disruption.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1000px', margin: '0 auto' },
  header: { marginBottom: '30px' },
  title: { fontSize: '24px', color: '#1e293b', margin: 0, fontWeight: '700' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' },
  
  card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '24px', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '600' },
  
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  
  btnSave: { padding: '12px', borderRadius: '6px', border: 'none', background: '#F17F08', color: 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', marginTop: '10px' },

  toast: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'white', padding: '12px 24px', borderRadius: '50px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 2000, fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 0.3s ease-out' }
};

export default AccountSettings;
