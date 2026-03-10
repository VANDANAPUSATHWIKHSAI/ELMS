import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Building, CheckCircle, ArrowRight, TrendingUp, Percent } from 'lucide-react';
import CalendarWidget from './CalendarWidget';

const PrincipalDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalStaff: 0, pendingLeaves: 0, onLeaveToday: 0, attendancePercent: 0 });
  const [todaysLeaves, setTodaysLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const kmitOrange = "#F17F08";

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const resStats = await apiFetch(`http://localhost:5000/api/principal/stats`);
        if (resStats.ok) setStats(await resStats.json());

        const resToday = await apiFetch(`http://localhost:5000/api/principal/today-leaves`);
        if (resToday.ok) setTodaysLeaves(await resToday.json());
      } catch (err) {
        console.error("Failed to fetch principal stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Principal Dashboard</h1>
        <p style={styles.subtitle}>Institution-wide Overview & Analytics</p>
      </header>

      {/* STATS GRID */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={{...styles.iconWrapper, background: '#e0e7ff', color: '#4f46e5'}}>
            <Users size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Total Staff</p>
            <h3 style={styles.statValue}>{stats.totalStaff}</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.iconWrapper, background: '#fef3c7', color: '#d97706'}}>
            <Clock size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Pending Approvals</p>
            <h3 style={styles.statValue}>{stats.pendingLeaves}</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.iconWrapper, background: '#fee2e2', color: '#dc2626'}}>
            <CheckCircle size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>On Leave Today</p>
            <h3 style={styles.statValue}>{stats.onLeaveToday}</h3>
          </div>
        </div>

        <div style={styles.statCard}>
          <div style={{...styles.iconWrapper, background: '#dcfce7', color: '#16a34a'}}>
            <Percent size={24} />
          </div>
          <div>
            <p style={styles.statLabel}>Attendance %</p>
            <h3 style={styles.statValue}>{stats.attendancePercent}%</h3>
          </div>
        </div>
      </div>


        {/* MAIN CONTENT GRID */}
        <div style={styles.mainGridFull}>
          
          {/* TODAY'S LEAVES CROSS_DEPT */}
          <div style={styles.card}>
             <div style={styles.cardHeader}>
               <h3 style={styles.cardTitle}>Who is on leave today?</h3>
               <button onClick={() => navigate('/principal/reports')} style={styles.viewAllBtn}>
                 View All Reports
               </button>
             </div>
             
             {loading ? (
               <p style={{color: '#64748b', textAlign: 'center'}}>Loading data...</p>
             ) : todaysLeaves.length === 0 ? (
               <div style={{textAlign: 'center', padding: '30px', color: '#64748b', background: '#f8fafc', borderRadius: '12px'}}>
                 <p style={{margin: 0}}>No faculty are on leave today across all departments.</p>
               </div>
             ) : (
               <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                 {todaysLeaves.map(leave => (
                   <div key={leave._id} style={styles.leaveItem}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
                        <div style={styles.avatar}>{leave.employeeName?.[0] || 'U'}</div>
                        <div>
                          <div style={{fontWeight: 'bold', fontSize: '15px', color: '#1e293b'}}>{leave.employeeName}</div>
                          <div style={{fontSize: '13px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px'}}>
                             <span style={{fontWeight: '600', color: kmitOrange}}>{leave.department}</span> • {leave.leaveType}
                          </div>
                        </div>
                      </div>
                      <div style={{fontSize: '12px', fontWeight: 'bold', background: '#e0e7ff', color: '#4f46e5', padding: '6px 12px', borderRadius: '20px'}}>
                         Today
                      </div>
                   </div>
                 ))}
               </div>
              )}
          </div>
          
          {/* PERSONAL CALENDAR CARD */}
          <CalendarWidget />
        </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' },
  statCard: { background: 'white', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  iconWrapper: { width: '56px', height: '56px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statLabel: { margin: '0 0 4px 0', color: '#64748b', fontSize: '14px', fontWeight: '500' },
  statValue: { margin: 0, fontSize: '24px', color: '#1e293b', fontWeight: '800' },

  card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' },
  

  mainGridFull: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px' },
  viewAllBtn: { background: 'none', border: 'none', color: '#F17F08', fontWeight: '600', cursor: 'pointer', fontSize: '14px' },
  leaveItem: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' },
  avatar: { width: '42px', height: '42px', borderRadius: '50%', background: '#cbd5e1', color: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', textTransform: 'uppercase' },
  linkBtn: { display: 'flex', alignItems: 'center', gap: '8px', border: 'none', fontWeight: '600', fontSize: '15px', cursor: 'pointer' }
};

export default PrincipalDashboard;