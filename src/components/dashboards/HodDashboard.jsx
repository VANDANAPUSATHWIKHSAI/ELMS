import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ArrowRight } from 'lucide-react';
import CalendarWidget from './CalendarWidget';

const HodDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState({ pending: 0, autoApproved: 0 });
  const [todaysLeaves, setTodaysLeaves] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const kmitOrange = "#F17F08";

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await apiFetch(`http://localhost:5000/api/leave/summary/${encodeURIComponent(user.department)}`);
        if (res.ok) {
          setSummary(await res.json());
        }
      } catch (err) { console.error("Failed to fetch summary"); }
    };

    const fetchTodaysLeaves = async () => {
      setLoadingToday(true);
      try {
        const res = await apiFetch(`http://localhost:5000/api/hod/today-leaves/${encodeURIComponent(user.department)}`);
        if (res.ok) setTodaysLeaves(await res.json());
      } catch (err) { console.error("Failed to fetch today's leaves"); }
      finally { setLoadingToday(false); }
    };

    if (user?.department) {
      fetchSummary();
      fetchTodaysLeaves();
    }
  }, [user]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>HOD Dashboard</h1>
        <p style={styles.subtitle}>Overview for <strong style={{color: kmitOrange}}>{user?.department}</strong> Department</p>
      </header>

      <div style={styles.grid}>
        {/* PENDING CARD */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{...styles.iconBox, background: '#fef3c7', color: '#d97706'}}>
              <Clock size={24} />
            </div>
            <h3 style={styles.cardTitle}>Pending Approvals</h3>
          </div>
          <div style={styles.cardNumber}>{summary.pending}</div>
          <p style={styles.cardDesc}>Leaves awaiting your action</p>
          <button onClick={() => navigate('/approvals')} style={styles.linkBtn}>
            Go to Approvals <ArrowRight size={16} />
          </button>
        </div>

        {/* TODAY'S LEAVES SECTION */}
        <div style={{...styles.card, gridColumn: 'span 1'}}>
           <div style={styles.cardHeader}>
             <h3 style={styles.cardTitle}>Who is on leave today?</h3>
           </div>
           
           {loadingToday ? (
             <p style={{color: '#64748b'}}>Loading...</p>
           ) : todaysLeaves.length === 0 ? (
             <div style={{textAlign: 'center', padding: '20px', color: '#64748b'}}>
               <p>No faculty on leave today.</p>
             </div>
           ) : (
             <div style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px'}}>
               {todaysLeaves.map(leave => (
                 <div key={leave._id} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0'}}>
                    <div>
                      <div style={{fontWeight: 'bold', fontSize: '14px', color: '#1e293b'}}>{leave.employeeName}</div>
                      <div style={{fontSize: '12px', color: '#64748b'}}>{leave.leaveType} • {leave.reason}</div>
                    </div>
                    <div style={{fontSize: '11px', fontWeight: 'bold', background: '#e0e7ff', color: '#4f46e5', padding: '4px 8px', borderRadius: '12px'}}>
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
  
  linkBtn: { marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: '#F17F08', fontWeight: '600', fontSize: '15px', cursor: 'pointer', padding: 0 }
};

export default HodDashboard;