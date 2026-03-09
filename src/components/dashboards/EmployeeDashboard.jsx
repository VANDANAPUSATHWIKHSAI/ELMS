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
  const [leaves, setLeaves] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null); // Clicked date on calendar
  const [selectedDateInfo, setSelectedDateInfo] = useState(""); // Info to show on click
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

        // Fetch personal leaves
        const resLeaves = await apiFetch(`http://localhost:5000/api/leave/history/${user.employeeId}`);
        if (resLeaves.ok) {
          setLeaves(await resLeaves.json());
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
      <style>{`
        @media (max-width: 768px) {
          .dash-header { flex-direction: column !important; align-items: flex-start !important; }
          .dash-greeting { font-size: 24px !important; }
          .dash-subtitle { font-size: 13px !important; }
          .dash-grid { grid-template-columns: 1fr !important; }
          .dash-card { grid-column: span 1 !important; padding: 10px !important; }
          .date-cell { padding: 8px 0 !important; font-size: 12px !important; }
        }
      `}</style>

        {/* HEADER SECTION */}
        <header style={styles.header} className="dash-header">
          <div>
            <h1 style={styles.greeting} className="dash-greeting">Dashboard</h1>
            <p style={styles.subtitle} className="dash-subtitle">Welcome back! Here is your attendance and leave overview.</p>
          </div>
        </header>

        {/* DASHBOARD GRID */}
        <div style={styles.featureGrid} className="dash-grid">
          
          {/* AVAILABLE LEAVES CARD */}
          <div style={styles.solidCard} className="dash-card">
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
          <div style={{...styles.solidCard, gridColumn: 'span 2'}} className="dash-card">
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
                
                // Helper to check holiday type
                const getHolidayType = (date) => {
                  const d = new Date(date);
                  d.setHours(0,0,0,0);
                  const h = holidays.find(h => {
                    const hStart = new Date(h.startDate);
                    const hEnd = new Date(h.endDate);
                    hStart.setHours(0,0,0,0);
                    hEnd.setHours(0,0,0,0);
                    return d >= hStart && d <= hEnd;
                  });
                  if (h) return h.type;
                  if (d.getDay() === 0) return 'Sunday';
                  return null;
                };

                const isDeductibleHoliday = (date) => {
                  const type = getHolidayType(date);
                  return type && type !== 'Summer Holidays';
                };

                const getApprovedLeave = (date) => {
                  const d = new Date(date);
                  d.setHours(0,0,0,0);
                  return leaves.find(l => {
                    if (!['Approved', 'Accepted', 'Auto-Approved'].includes(l.status)) return false;
                    const sDate = new Date(l.startDate);
                    const eDate = new Date(l.endDate);
                    sDate.setHours(0,0,0,0);
                    eDate.setHours(0,0,0,0);
                    return d >= sDate && d <= eDate;
                  });
                };

                // SANDWICH LOGIC
                let isSandwich = false;
                const holidayType = getHolidayType(cellDate);
                
                if (isDeductibleHoliday(cellDate)) {
                  // Find start of this holiday block
                  let blockStart = new Date(cellDate);
                  while (isDeductibleHoliday(new Date(blockStart).setDate(blockStart.getDate() - 1))) {
                    blockStart.setDate(blockStart.getDate() - 1);
                  }
                  const dayBeforeBlock = new Date(blockStart);
                  dayBeforeBlock.setDate(dayBeforeBlock.getDate() - 1);

                  // Find end of this holiday block
                  let blockEnd = new Date(cellDate);
                  while (isDeductibleHoliday(new Date(blockEnd).setDate(blockEnd.getDate() + 1))) {
                    blockEnd.setDate(blockEnd.getDate() + 1);
                  }
                  const dayAfterBlock = new Date(blockEnd);
                  dayAfterBlock.setDate(dayAfterBlock.getDate() + 1);

                  // It's a sandwich ONLY if both sides have FULL-DAY approved leaves
                  const prevLeave = getApprovedLeave(dayBeforeBlock);
                  const nextLeave = getApprovedLeave(dayAfterBlock);
                  
                  if (prevLeave && !prevLeave.isHalfDay && nextLeave && !nextLeave.isHalfDay) {
                    isSandwich = true;
                  }
                }

                const currentLeave = getApprovedLeave(cellDate);
                const isLeaveDay = !!currentLeave;

                let bgColor = 'transparent';
                let textColor = '#475569';
                let borderColor = 'transparent';
                
                const dateKey = cellDate.toISOString();
                const isSelected = selectedDate === dateKey;

                // Priority Logic: Today > Holiday > Leave
                if (isSelected || isToday) {
                  bgColor = '#FFF7ED'; 
                  textColor = '#C2410C'; 
                  borderColor = '#FDBA74'; 
                } else if (isSandwich) {
                  bgColor = '#FEF2F2'; // Red (Sandwiched)
                  textColor = '#DC2626'; 
                } else if (holidayType) {
                  bgColor = '#F0FDF4'; // Green (Refunded/Standard Holiday)
                  textColor = '#16A34A'; 
                } else if (isLeaveDay) {
                  bgColor = '#FEF2F2'; // Red (Standard Leave)
                  textColor = '#DC2626'; 
                }

                const holidayInfo = holidays.find(h => {
                  const d = new Date(cellDate);
                  d.setHours(0,0,0,0);
                  const hStart = new Date(h.startDate);
                  const hEnd = new Date(h.endDate);
                  hStart.setHours(0,0,0,0);
                  hEnd.setHours(0,0,0,0);
                  return d >= hStart && d <= hEnd;
                });

                const titleParts = [];
                if (isToday) titleParts.push("Today");
                if (holidayInfo) titleParts.push(`Holiday: ${holidayInfo.name}`);
                else if (isSunday) titleParts.push("Sunday");
                
                if (isSandwich) titleParts.push("Sandwich Rule Applied (Deducted)");
                else if (holidayType && isLeaveDay) titleParts.push("Holiday Refunded (Not Deducted)");
                else if (isLeaveDay) titleParts.push("Approved Leave");

                return (
                  <div key={dayNum} 
                    style={{
                      ...styles.dateCell, 
                      backgroundColor: bgColor,
                      color: textColor,
                      border: `1px solid ${borderColor}`,
                    }}
                    title={titleParts.join(' | ')}
                    onMouseDown={() => {
                      if (selectedDate === dateKey) {
                        setSelectedDate(null);
                        setSelectedDateInfo("");
                      } else {
                        setSelectedDate(dateKey);
                        setSelectedDateInfo(titleParts.length > 0 ? titleParts.join(' | ') : 'No special events');
                      }
                    }}
                    className="date-cell"
                  >
                    {dayNum}
                  </div>
                );
              })}
            </div>
            
            {selectedDateInfo && (
              <div style={{
                marginTop: '15px', 
                padding: '12px', 
                background: '#f8fafc', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                color: '#334155', 
                fontSize: '14px', 
                textAlign: 'center',
                fontWeight: '500'
              }}>
                <strong style={{color: kmitOrange}}>Info: </strong> {selectedDateInfo}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '20px', padding: '0 15px', boxSizing: 'border-box' },
  header: { 
    display: 'flex', 
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
    gap: '20px'
  },
  greeting: { margin: 0, fontSize: '28px', color: '#1e293b', fontWeight: '800' },
  subtitle: { color: '#64748b', margin: '4px 0 0 0', fontSize: '15px' },
  
  featureGrid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(3, 1fr)', 
    gap: '20px' 
  },
  solidCard: { 
    background: '#fff', 
    padding: '16px', 
    borderRadius: '10px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 1px 3px -1px rgba(0,0,0,0.02)',
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
  typeBadge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 },
  badge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', width: 'max-content', whiteSpace: 'nowrap', flexShrink: 0 },
  tabContainer: { display: 'flex', gap: '8px', background: '#f8fafc', padding: '4px', borderRadius: '10px' },
  tabButton: { border: 'none', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.2s' }
};

export default EmployeeDashboard;