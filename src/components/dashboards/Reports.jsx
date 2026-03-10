import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shuffle, CheckCircle, XCircle, Clock, ArrowRight, FileText, History } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Tab can be: 'adjustments', 'approved', 'pending', 'daywise', 'monthly'
  const [activeTab, setActiveTab] = useState('adjustments');
  
  // Specific filters for timeline tabs
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  
  const kmitOrange = "#F17F08";

  useEffect(() => {
    if (activeTab === 'adjustments' && user?.department) {
      fetchAdjustments();
    } else if (['approved', 'pending', 'daywise', 'monthly'].includes(activeTab) && user?.department) {
      // Don't fetch daywise/monthly immediately if no date/month is selected
      if (activeTab === 'daywise' && !dateFilter) { setHistory([]); return; }
      if (activeTab === 'monthly' && !monthFilter) { setHistory([]); return; }
      fetchHistory();
    }
  }, [activeTab, user, dateFilter, monthFilter]);

  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`http://localhost:5000/api/adjustments/department/${encodeURIComponent(user.department)}`);
      if (res.ok) setAdjustments(await res.json());
    } catch (err) { console.error("Failed to fetch adjustments"); } 
    finally { setLoading(false); }
  };

  const fetchHistory = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/hod/leave-history/${encodeURIComponent(user.department)}?`;
      
      if (activeTab === 'approved') url += `status=Approved&`;
      if (activeTab === 'pending') url += `status=Pending&`;
      if (activeTab === 'daywise' && dateFilter) url += `date=${dateFilter}&`;
      if (activeTab === 'monthly' && monthFilter) url += `month=${monthFilter}&`;
      
      const res = await apiFetch(url);
      if (res.ok) setHistory(await res.json());
    } catch (err) { console.error("Failed to fetch leave history"); } 
    finally { setLoading(false); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const getStatusBadge = (status) => {
    if (status === 'Approved' || status === 'Accepted' || status === 'Auto-Approved') return <span style={{...styles.badge, background: '#dcfce7', color: '#16a34a'}}><CheckCircle size={14}/> {status}</span>;
    if (status === 'Rejected') return <span style={{...styles.badge, background: '#fee2e2', color: '#dc2626'}}><XCircle size={14}/> {status}</span>;
    return <span style={{...styles.badge, background: '#fef3c7', color: '#d97706'}}><Clock size={14}/> Pending</span>;
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Department Reports</h1>
        <p style={styles.subtitle}>View reports and monitor activity for <strong style={{color: kmitOrange}}>{user?.department}</strong></p>
      </header>

      <style>{`
        .adj-flow { display: flex; align-items: center; gap: 20px; flex: 1; min-width: 300px; }
        .adj-person { display: flex; align-items: center; gap: 10px; width: 30%; }
        .adj-middle { display: flex; flex-direction: column; align-items: center; flex: 1; text-align: center; }
        
        @media (max-width: 768px) {
          .adj-flow { flex-direction: column; gap: 12px; align-items: stretch; min-width: 100%; }
          .adj-person { width: 100%; justify-content: flex-start; }
          .adj-person.substitute { flex-direction: row; text-align: left; }
          .adj-middle { align-items: flex-start; border-left: 2px solid #e2e8f0; margin-left: 20px; padding-left: 15px; }
          .adj-date { display: inline-block; margin-left: 10px; }
          .adj-arrow { display: none !important; }
        }
      `}</style>

      {/* TABS (Horizontal Scrollable for many options) */}
      <div style={{...styles.tabContainer, overflowX: 'auto', whiteSpace: 'nowrap'}}>
        <button 
          onClick={() => { setActiveTab('adjustments'); }}
          style={{...styles.tab, borderBottom: activeTab === 'adjustments' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'adjustments' ? kmitOrange : '#64748b'}}
        >
          Class Adjustments
        </button>
        <button 
          onClick={() => { setActiveTab('approved'); }}
          style={{...styles.tab, borderBottom: activeTab === 'approved' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'approved' ? kmitOrange : '#64748b'}}
        >
          Approved Leaves
        </button>
        <button 
          onClick={() => { setActiveTab('pending'); }}
          style={{...styles.tab, borderBottom: activeTab === 'pending' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'pending' ? kmitOrange : '#64748b'}}
        >
          Pending Leaves
        </button>
        <button 
          onClick={() => { setActiveTab('daywise'); }}
          style={{...styles.tab, borderBottom: activeTab === 'daywise' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'daywise' ? kmitOrange : '#64748b'}}
        >
          Day-wise Report
        </button>
        <button 
          onClick={() => { setActiveTab('monthly'); }}
          style={{...styles.tab, borderBottom: activeTab === 'monthly' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'monthly' ? kmitOrange : '#64748b'}}
        >
          Monthly Report
        </button>
      </div>

      <div style={styles.content}>
        
        {/* --- 1. CLASS ADJUSTMENTS TAB --- */}
        {activeTab === 'adjustments' && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <Shuffle size={22} color={kmitOrange} />
              <h3 style={styles.cardTitle}>Class Adjustment Monitor</h3>
            </div>

            {loading ? <p style={styles.emptyText}>Loading records...</p> : adjustments.length === 0 ? (
              <p style={styles.emptyText}>No class adjustments found in your department.</p>
            ) : (
              <div style={styles.list}>
                {adjustments.map(adj => (
                  <div key={adj._id} style={styles.listItem}>
                    <div className="adj-flow">
                      
                      {/* Requester */}
                      <div className="adj-person">
                        <div style={styles.avatar}>{adj.requesterName ? adj.requesterName[0] : '?'}</div>
                        <div>
                          <div style={styles.name}>{adj.requesterName}</div>
                          <div style={styles.role}>Original Faculty</div>
                        </div>
                      </div>
                      
                      {/* Arrow & Class Details */}
                      <div className="adj-middle">
                        <div style={{display: 'flex', alignItems: 'center'}}>
                          <div style={styles.classInfo}>
                            <strong>{adj.classSection}</strong> • {adj.period}
                          </div>
                          <span className="adj-date" style={styles.dateInfo}>{formatDate(adj.date)}</span>
                        </div>
                        <ArrowRight className="adj-arrow" size={20} color="#94a3b8" style={{margin: '5px 0'}} />
                      </div>

                      {/* Substitute */}
                      <div className="adj-person substitute" style={{textAlign: 'right', flexDirection: 'row-reverse'}}>
                        <div style={{...styles.avatar, background: '#64748b'}}>{adj.targetName ? adj.targetName[0] : '?'}</div>
                        <div>
                          <div style={styles.name}>{adj.targetName}</div>
                          <div style={styles.role}>Substitute</div>
                        </div>
                      </div>

                    </div>
                    
                    <div style={styles.statusWrapper}>
                      {getStatusBadge(adj.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- 2. LEAVE REPORTS TABS --- */}
        {['approved', 'pending', 'daywise', 'monthly'].includes(activeTab) && (
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <History size={22} color={kmitOrange} />
              <h3 style={styles.cardTitle}>
                {activeTab === 'approved' && 'Approved Leave History'}
                {activeTab === 'pending' && 'Pending Leave History'}
                {activeTab === 'daywise' && 'Day-wise Leave Report'}
                {activeTab === 'monthly' && 'Monthly Leave Report'}
              </h3>
            </div>
            
            {/* SPECIFIC FILTERS FOR DAY-WISE AND MONTHLY */}
            {activeTab === 'daywise' && (
              <div style={styles.filterBar}>
                <span style={{fontSize: '14px', color: '#475569', fontWeight: '600'}}>Select Date:</span>
                <input 
                  type="date" 
                  style={styles.filterControl} 
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            )}

            {activeTab === 'monthly' && (
              <div style={styles.filterBar}>
                <span style={{fontSize: '14px', color: '#475569', fontWeight: '600'}}>Select Month:</span>
                <input 
                  type="month" 
                  style={styles.filterControl} 
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                />
              </div>
            )}
            
            {loading ? <p style={styles.emptyText}>Loading records...</p> : 
              (activeTab === 'daywise' && !dateFilter) ? <p style={styles.emptyText}>Please select a date to view the day-wise report.</p> :
              (activeTab === 'monthly' && !monthFilter) ? <p style={styles.emptyText}>Please select a month to view the monthly report.</p> :
              history.length === 0 ? (
              <p style={styles.emptyText}>No matching records found for this criteria.</p>
            ) : (
               <div style={{overflowX: 'auto'}}>
                 <table style={styles.table}>
                    <thead>
                      <tr style={styles.trHeading}>
                        <th style={styles.th}>Employee</th>
                        <th style={styles.th}>Leave Type</th>
                        <th style={styles.th}>Duration</th>
                        <th style={styles.th}>Status</th>
                        <th style={styles.th}>Action By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(req => (
                        <tr key={req._id} style={styles.tr}>
                          <td style={styles.td}>
                             <strong>{req.employeeName}</strong><br/>
                             <span style={{fontSize: '12px', color: '#64748b'}}>ID: {req.employeeId}</span>
                          </td>
                          <td style={styles.td}>
                             <span style={styles.typeBadge}>{req.leaveType}</span>
                          </td>
                          <td style={styles.td}>
                             {formatDate(req.startDate)} to {formatDate(req.endDate)}
                          </td>
                          <td style={styles.td}>
                            {getStatusBadge(req.status)}
                          </td>
                          <td style={styles.td}>
                            {req.status !== 'Pending' && (
                              <span style={{ fontSize: '12px', color: '#475569', fontWeight: '600', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', whiteSpace: 'nowrap' }}>
                                { (req.status === 'Approved' || req.status === 'Accepted' || req.status === 'Auto-Approved')
                                  ? (req.principalApproval?.status === 'Approved' ? `by ${req.principalApproval.actionBy === 'Principal' ? 'Dr. B.L. Maheswari' : req.principalApproval.actionBy}` : (req.hodApproval?.actionBy ? `by ${req.hodApproval?.actionBy}` : ''))
                                  : (req.principalApproval?.status === 'Rejected' ? `by ${req.principalApproval.actionBy === 'Principal' ? 'Dr. B.L. Maheswari' : req.principalApproval.actionBy}` : (req.hodApproval?.actionBy ? `by ${req.hodApproval?.actionBy}` : ''))
                                }
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' },
  tab: { padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600' },
  
  card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: '30px' },
  filterBar: { display: 'flex', gap: '15px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center', background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  filterControl: { padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', background: 'white', color: '#1e293b' },
  
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  listItem: { background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' },
  
  adjFlow: { display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '300px' },
  person: { display: 'flex', alignItems: 'center', gap: '10px', width: '30%' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', background: '#F17F08', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px', flexShrink: 0 },
  name: { fontSize: '15px', fontWeight: '700', color: '#1e293b' },
  role: { fontSize: '12px', color: '#64748b' },
  
  middleSection: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 },
  classInfo: { fontSize: '14px', fontWeight: '700', color: '#334155', background: 'white', padding: '4px 10px', borderRadius: '20px', border: '1px solid #e2e8f0' },
  dateInfo: { fontSize: '13px', color: '#64748b', fontWeight: '600' },
  
  statusWrapper: { flexShrink: 0 },
  badge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', width: 'max-content', whiteSpace: 'nowrap', flexShrink: 0 },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: '#334155' },
  typeBadge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', width: 'max-content', flexShrink: 0 },
};

export default Reports;