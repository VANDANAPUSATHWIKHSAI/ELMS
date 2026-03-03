import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  ClipboardList, Calendar as CalendarIcon, 
  ChevronLeft, ChevronRight, History, CheckCircle, XCircle, Clock, AlertCircle
} from 'lucide-react';

const EmployeeDashboard = () => {
  const { user } = useAuth(); // Get logged-in user info
  const [leaveBalance, setLeaveBalance] = useState({ cl: 0, ccl: 0, al: 0 });
  const [quarterlyStats, setQuarterlyStats] = useState({ quarters: [], summary: {} });
  const [lateMarks, setLateMarks] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // Clicked date on calendar
  const kmitOrange = "#F17F08";

  // --- 1. FETCH DATA (Real-time balance & Personal History) ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.employeeId) return;

      try {
        // Fetch specific user balance
        const resBalance = await apiFetch(`http://localhost:5000/api/user/${user.employeeId}`);
        const dataBalance = await resBalance.json();
        if (resBalance.ok && dataBalance.leaveBalance) {
          setLeaveBalance(dataBalance.leaveBalance);
        }

        // Fetch quarterly stats
        const resQuarterly = await apiFetch(`http://localhost:5000/api/leave/quarterly-ledger/${user.employeeId}`);
        if (resQuarterly.ok) {
          const qData = await resQuarterly.json();
          console.log("Quarterly Data Received:", qData);
          setQuarterlyStats(qData);
        } else {
          console.error("Failed to fetch quarterly stats", await resQuarterly.text());
        }

        // Fetch late marks
        const resLateMarks = await apiFetch(`http://localhost:5000/api/late-marks/${user.employeeId}`);
        if (resLateMarks.ok) {
          setLateMarks(await resLateMarks.json());
        }

        // Fetch holidays
        const resHolidays = await apiFetch(`http://localhost:5000/api/holidays`);
        if (resHolidays.ok) {
          setHolidays(await resHolidays.json());
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchDashboardData();
  }, [user]);

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

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  
  return (
    <div style={styles.container}>
        {/* HEADER SECTION */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.greeting}>Dashboard</h1>
            <p style={styles.subtitle}>Welcome back! Here is your attendance and leave overview.</p>
          </div>
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
              {/* CL Quarterly Stat */}
              <div style={styles.statBox}>
                <div>
                  <span style={styles.statLabel}>CL LEFT (Q{quarterlyStats.summary?.currentQuarterIndex + 1})</span>
                  <div style={styles.statValue}>{quarterlyStats.summary?.clRemaining ?? 0}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <span style={{...styles.statLabel, color: '#94a3b8'}}>USED</span>
                  <div style={{fontSize: '14px', fontWeight: '700', color: '#64748b'}}>{quarterlyStats.quarters?.[quarterlyStats.summary?.currentQuarterIndex]?.clUsed ?? 0}</div>
                </div>
              </div>

              {/* CCL Quarterly Stat */}
              <div style={styles.statBox}>
                <div>
                  <span style={styles.statLabel}>CCL LEFT</span>
                  <div style={styles.statValue}>{quarterlyStats.summary?.cclRemaining ?? 0}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <span style={{...styles.statLabel, color: '#94a3b8'}}>USED</span>
                  <div style={{fontSize: '14px', fontWeight: '700', color: '#64748b'}}>{quarterlyStats.quarters?.[quarterlyStats.summary?.currentQuarterIndex]?.cclUsed ?? 0}</div>
                </div>
              </div>

              {/* AL Stat (Yearly) */}
              <div style={styles.statBox}>
                <div>
                  <span style={styles.statLabel}>AL LEFT (YEAR)</span>
                  <div style={styles.statValue}>{quarterlyStats.summary?.alRemaining ?? 0}</div>
                </div>
                <div style={{textAlign: 'right'}}>
                  <span style={{...styles.statLabel, color: '#94a3b8'}}>TOTAL</span>
                  <div style={{fontSize: '14px', fontWeight: '700', color: '#64748b'}}>{quarterlyStats.summary?.alLimit ?? 0}</div>
                </div>
              </div>

              {/* LOP Row */}
              <div style={styles.statBox}>
                <span style={styles.statLabel}>LOP TAKEN (YEAR)</span>
                <span style={styles.statValue}>{leaveBalance.lop ?? 0}</span>
              </div>
            </div>

            {/* LATE MARKS ALERT */}
            {lateMarks.length > 0 && (
              <div style={{marginTop: '20px', padding: '16px', background: '#fee2e2', borderRadius: '12px', borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                <AlertCircle size={24} color="#ef4444" style={{flexShrink: 0, marginTop: '2px'}} />
                <div>
                  <h4 style={{margin: '0 0 6px 0', color: '#991b1b', fontSize: '15px'}}>Attention: Late Arrivals</h4>
                  <p style={{margin: 0, color: '#b91c1c', fontSize: '13px'}}>You have <strong>{lateMarks.length}</strong> late mark(s) recorded.</p>
                  <p style={{margin: '4px 0 0 0', color: '#ef4444', fontSize: '12px'}}>Last: {formatDate(lateMarks[0].date)}</p>
                </div>
              </div>
            )}
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
                const cellDate = new Date(year, month, dayNum);
                const isToday = dayNum === new Date().getDate() && 
                                 month === new Date().getMonth() && 
                                 year === new Date().getFullYear();
                
                const isSunday = cellDate.getDay() === 0;
                
                // Check if this date is a holiday
                const holidayInfo = holidays.find(h => {
                  const hDate = new Date(h.date);
                  return hDate.getDate() === dayNum && hDate.getMonth() === month && hDate.getFullYear() === year;
                });

                let bgColor = 'transparent';
                let textColor = '#475569';
                let borderColor = 'transparent';
                
                const dateKey = cellDate.toISOString();
                const isSelected = selectedDate === dateKey;

                if (isSelected || isToday) {
                  bgColor = '#FFF7ED'; // Very light orange
                  textColor = '#C2410C'; // Darker orange text
                  borderColor = '#FDBA74'; // Orange border
                } else if (isSunday || holidayInfo) {
                  bgColor = '#F0FDF4'; // Light green background for Sundays/Holidays
                  textColor = '#16A34A'; // Green text
                }

                return (
                  <div key={dayNum} 
                    style={{
                      ...styles.dateCell, 
                      backgroundColor: bgColor,
                      color: textColor,
                      border: `1px solid ${borderColor}`,
                    }}
                    title={holidayInfo ? holidayInfo.name : (isSunday ? 'Sunday' : '')}
                    onMouseDown={() => setSelectedDate(dateKey)}
                    onMouseUp={() => setTimeout(() => setSelectedDate(null), 300)}
                  >
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
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '20px' },
  header: { 
    display: 'flex', 
    flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
    justifyContent: 'space-between', 
    alignItems: window.innerWidth <= 768 ? 'flex-start' : 'center', 
    marginBottom: '20px',
    gap: '20px'
  },
  greeting: { margin: 0, fontSize: window.innerWidth <= 768 ? '24px' : '28px', color: '#1e293b', fontWeight: '800' },
  subtitle: { color: '#64748b', margin: '4px 0 0 0', fontSize: window.innerWidth <= 768 ? '13px' : '15px' },
  
  featureGrid: { 
    display: 'grid', 
    gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(3, 1fr)', 
    gap: '20px' 
  },
  solidCard: { 
    background: '#fff', 
    padding: window.innerWidth <= 768 ? '10px' : '12px', 
    borderRadius: '10px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 1px 3px -1px rgba(0,0,0,0.02)',
    gridColumn: window.innerWidth <= 768 ? 'span 1' : 'auto'
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  cardTitle: { margin: 0, fontSize: '16px', color: '#334155', fontWeight: '700' },
  
  leaveStats: { display: 'flex', flexDirection: 'column', gap: '12px' },
  statBox: { background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: '18px', fontWeight: '800', color: '#1e293b' },
  statLabel: { fontSize: '12px', color: '#475569', fontWeight: '600' },
  
  calendarGrid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' },
  dayHeader: { textAlign: 'center', fontSize: '13px', fontWeight: '600', color: '#64748b', paddingBottom: '12px' },
  dateCell: { 
    textAlign: 'center', 
    padding: '12px 0', 
    fontSize: '14px', 
    borderRadius: '8px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  navBtn: { border: '1px solid #e2e8f0', background: '#fff', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  // ... (rest of the unused table styles can remain or be truncated)
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: '#334155' },
  typeBadge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
  badge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', width: 'max-content' },
  tabContainer: { display: 'flex', gap: '8px', background: '#f8fafc', padding: '4px', borderRadius: '10px' },
  tabButton: { border: 'none', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }
};

export default EmployeeDashboard;