import React, { useState, useEffect } from 'react';
import { apiFetch } from "../../utils/api";
import { useAuth } from '../../context/AuthContext';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarWidget = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDateInfo, setSelectedDateInfo] = useState("");
  const [viewDate, setViewDate] = useState(new Date());
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const kmitOrange = "#F17F08";

  useEffect(() => {
    const fetchPersonalData = async () => {
      try {
        const resHolidays = await apiFetch(`http://localhost:5000/api/holidays`);
        if (resHolidays.ok) setHolidays(await resHolidays.json());

        if (user?.employeeId) {
          const resLeaves = await apiFetch(`http://localhost:5000/api/leave/history/${user.employeeId}`);
          if (resLeaves.ok) setLeaves(await resLeaves.json());
        }
      } catch (err) {
        console.error("Failed to fetch calendar data", err);
      }
    };
    fetchPersonalData();
  }, [user]);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  return (
    <div style={{...styles.solidCard, gridColumn: isMobile ? 'span 1' : 'span 2'}} className="dash-card">
      <div style={{...styles.cardHeader, justifyContent: 'space-between', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '12px' : '8px'}}>
        <div style={{display:'flex', alignItems:'center', gap: '10px'}}>
          <CalendarIcon size={22} color={kmitOrange} />
          <h3 style={styles.cardTitle}>{monthNames[month]} {year}</h3>
        </div>
        <div style={{display:'flex', gap: '10px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'flex-end'}}>
          <button onClick={prevMonth} style={styles.navBtn}><ChevronLeft size={18}/></button>
          <button onClick={nextMonth} style={styles.navBtn}><ChevronRight size={18}/></button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(100px, 1fr))', 
        gap: '12px', 
        marginBottom: '20px', 
        fontSize: '11px', 
        fontWeight: '600', 
        color: '#64748b',
        background: '#f8fafc',
        padding: '12px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FFEDD5', border: '1px solid #FDBA74' }}></div>
          <span>Today</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FEE2E2', border: '1px solid #FCA5A5' }}></div>
          <span>Approved</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FEF3C7', border: '1px solid #FCD34D' }}></div>
          <span>Pending</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#DCFCE7', border: '1px solid #86EFAC' }}></div>
          <span>Holiday / Sun</span>
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

          const getPendingLeave = (date) => {
            const d = new Date(date);
            d.setHours(0,0,0,0);
            return leaves.find(l => {
              if (l.status !== 'Pending') return false;
              const sDate = new Date(l.startDate);
              const eDate = new Date(l.endDate);
              sDate.setHours(0,0,0,0);
              eDate.setHours(0,0,0,0);
              return d >= sDate && d <= eDate;
            });
          };

          let isSandwich = false;
          const holidayType = getHolidayType(cellDate);
          
          if (isDeductibleHoliday(cellDate)) {
            let blockStart = new Date(cellDate);
            while (isDeductibleHoliday(new Date(blockStart).setDate(blockStart.getDate() - 1))) {
              blockStart.setDate(blockStart.getDate() - 1);
            }
            const dayBeforeBlock = new Date(blockStart);
            dayBeforeBlock.setDate(dayBeforeBlock.getDate() - 1);

            let blockEnd = new Date(cellDate);
            while (isDeductibleHoliday(new Date(blockEnd).setDate(blockEnd.getDate() + 1))) {
              blockEnd.setDate(blockEnd.getDate() + 1);
            }
            const dayAfterBlock = new Date(blockEnd);
            dayAfterBlock.setDate(dayAfterBlock.getDate() + 1);

            const prevLeave = getApprovedLeave(dayBeforeBlock);
            const nextLeave = getApprovedLeave(dayAfterBlock);
            
            if (prevLeave && !prevLeave.isHalfDay && prevLeave.leaveType !== 'Summer Leave' &&
                nextLeave && !nextLeave.isHalfDay && nextLeave.leaveType !== 'Summer Leave') {
              isSandwich = true;
            }
          }

          const currentLeave = getApprovedLeave(cellDate);
          const isLeaveDay = !!currentLeave;
          const currentPendingLeave = getPendingLeave(cellDate);
          const isPendingLeaveDay = !!currentPendingLeave;

          let bgColor = 'transparent';
          let textColor = '#475569';
          let borderColor = 'transparent';
          
          const dateKey = cellDate.toISOString();
          const isSelected = selectedDate === dateKey;

          if (isSelected || isToday) {
            bgColor = '#FFEDD5'; 
            textColor = '#9A3412'; 
            borderColor = '#FDBA74'; 
          } else if (isSandwich) {
            bgColor = '#FEE2E2'; 
            textColor = '#991B1B'; 
          } else if (holidayType) {
            bgColor = '#DCFCE7'; 
            textColor = '#166534'; 
          } else if (isLeaveDay) {
            bgColor = '#FEE2E2'; 
            textColor = '#991B1B'; 
          } else if (isPendingLeaveDay) {
            bgColor = '#FEF3C7'; 
            textColor = '#D97706'; 
            borderColor = '#FCD34D';
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
          else if (isLeaveDay) titleParts.push(`Approved Leave (${currentLeave?.leaveType})`);
          else if (isPendingLeaveDay) titleParts.push(`Pending Leave (${currentPendingLeave?.leaveType})`);

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
  );
};

const styles = {
  solidCard: { 
    background: '#fff', 
    padding: '24px', 
    borderRadius: '16px', 
    border: '1px solid #e2e8f0', 
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)',
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' },
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
  navBtn: { border: '1px solid #e2e8f0', background: '#fff', padding: '6px', borderRadius: '8px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center' }
};

export default CalendarWidget;
