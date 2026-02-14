import React, { useState } from 'react';
import { 
  ClipboardList, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight 
} from 'lucide-react';

const EmployeeDashboard = () => {
  const kmitOrange = "#F17F08";

  // --- CALENDAR LOGIC ---
  const [viewDate, setViewDate] = useState(new Date());
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div style={styles.container}>
        {/* HEADER SECTION */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.greeting}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back! Here is your attendance overview.</p>
          </div>
          {/* Removed Notification and Avatar section here */}
        </header>

        {/* DASHBOARD GRID */}
        <div style={styles.featureGrid}>
          
          {/* AVAILABLE LEAVES CARD */}
          <div style={styles.solidCard}>
            <div style={styles.cardHeader}>
              <ClipboardList size={22} color={kmitOrange} />
              <h3 style={styles.cardTitle}>Available Leaves</h3>
            </div>
            <div style={styles.leaveStats}>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>CL (Casual Leave)</span>
                <span style={styles.statValue}>12</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>CCL (Compensatory CL)</span>
                <span style={styles.statValue}>04</span>
              </div>
              <div style={styles.statBox}>
                <span style={styles.statLabel}>AL (Academic Leaves)</span>
                <span style={styles.statValue}>06</span>
              </div>
            </div>
          </div>

          {/* CALENDAR CARD */}
          <div style={{...styles.solidCard, gridColumn: 'span 2'}}>
            <div style={{...styles.cardHeader, justifyContent: 'space-between'}}>
              <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
                <CalendarIcon size={22} color={kmitOrange} />
                <h3 style={styles.cardTitle}>{monthNames[month]} {year}</h3>
              </div>
              <div style={{display:'flex', gap: '10px'}}>
                <button onClick={prevMonth} style={styles.navBtn}><ChevronLeft size={18}/></button>
                <button onClick={nextMonth} style={styles.navBtn}><ChevronRight size={18}/></button>
              </div>
            </div>
            
            <div style={styles.calendarGrid}>
              {days.map(day => <div key={day} style={styles.dayHeader}>{day}</div>)}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} style={styles.dateCell}></div>
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const isToday = dayNum === new Date().getDate() && 
                                month === new Date().getMonth() && 
                                year === new Date().getFullYear();
                return (
                  <div key={dayNum} style={{
                    ...styles.dateCell, 
                    backgroundColor: isToday ? 'rgba(241, 127, 8, 0.15)' : 'transparent',
                    fontWeight: isToday ? 'bold' : 'normal',
                    color: isToday ? kmitOrange : '#475569',
                    border: isToday ? `1px solid ${kmitOrange}` : '1px solid transparent'
                  }}>
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  greeting: { margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: '800' },
  subtitle: { color: '#64748b', margin: '4px 0 0 0' },
  
  featureGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' },
  solidCard: { background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' },
  cardTitle: { margin: 0, fontSize: '17px', color: '#334155', fontWeight: '700' },
  
  leaveStats: { display: 'flex', flexDirection: 'column', gap: '12px' },
  statBox: { background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: '20px', fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: '13px', color: '#475569', fontWeight: '600' },
  
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  dayHeader: { textAlign: 'center', fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', padding: '10px 0' },
  dateCell: { textAlign: 'center', padding: '15px', fontSize: '14px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  navBtn: { border: '1px solid #e2e8f0', background: '#fff', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }
};

export default EmployeeDashboard;