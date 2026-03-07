import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Users, Calendar, ClipboardList } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalEmployees: 0, pendingLeaves: 0, totalDepartments: 0 });
  const [loading, setLoading] = useState(true);

  // For a real app, you'd fetch these stats from a dedicated /api/admin/stats endpoint.
  // For now, we'll quickly aggregate them from existing endpoints.
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await apiFetch('http://localhost:5000/api/admin/reports/stats');
        if (res.ok) {
           setStats(await res.json());
        }
      } catch (err) {
        console.error("Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div style={{padding: '40px'}}>Loading dashboard...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Admin Dashboard</h1>
        <p style={styles.subtitle}>System Overview and Quick Stats</p>
      </header>

      <div style={styles.grid}>
        
        {/* TOTAL EMPLOYEES */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{...styles.iconBox, background: '#e0e7ff', color: '#4f46e5'}}>
              <Users size={24} />
            </div>
            <h3 style={styles.cardTitle}>Total Employees</h3>
          </div>
          <div style={styles.cardNumber}>{stats.totalEmployees}</div>
          <p style={styles.cardDesc}>Registered accounts in the system</p>
        </div>

        {/* TOTAL DEPARTMENTS */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{...styles.iconBox, background: '#fef3c7', color: '#d97706'}}>
              <ClipboardList size={24} />
            </div>
            <h3 style={styles.cardTitle}>Departments</h3>
          </div>
          <div style={styles.cardNumber}>{stats.totalDepartments}</div>
          <p style={styles.cardDesc}>Active departments</p>
        </div>

        {/* PENDING LEAVES (GLOBAL) */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{...styles.iconBox, background: '#fee2e2', color: '#ef4444'}}>
              <Calendar size={24} />
            </div>
            <h3 style={styles.cardTitle}>Global Pending Leaves</h3>
          </div>
          <div style={styles.cardNumber}>{stats.pendingLeaves}</div>
          <p style={styles.cardDesc}>Awaiting HOD/Principal Approval</p>
        </div>

      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' },
  card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
  iconBox: { width: '50px', height: '50px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' },
  cardNumber: { fontSize: '42px', fontWeight: '800', color: '#1e293b', margin: '10px 0 0 0' },
  cardDesc: { color: '#64748b', fontSize: '14px', margin: '5px 0 20px 0' },
};

export default AdminDashboard;
