import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';

const LeaveHistory = () => {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`http://localhost:5000/api/leave/history/${user.employeeId}`);
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch (err) {
      console.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchHistory();
  }, [user.employeeId]);

  const [confirmingId, setConfirmingId] = useState(null);

  const handleCancelRequest = (leaveId) => {
    setConfirmingId(leaveId);
  };

  const handleCancelConfirm = async (leaveId) => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/leave/cancel/${leaveId}`, { method: 'PUT' });
      if (res.ok) {
        setConfirmingId(null);
        fetchHistory();
      }
    } catch (err) {
      console.error("Cancel failed", err);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    return `${d.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })} ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
  };

  const StatusBadge = ({ status }) => {
    let color = '#f59e0b';
    let icon = <Clock size={14} />;
    if (status === 'Approved' || status === 'Auto-Approved') { color = '#10b981'; icon = <CheckCircle size={14} />; }
    else if (status === 'Rejected') { color = '#ef4444'; icon = <XCircle size={14} />; }
    else if (status === 'Cancelled') { color = '#64748b'; icon = <XCircle size={14} />; }
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: color, fontWeight: 'bold', fontSize: '12px', padding: '4px 10px', borderRadius: '50px', background: `${color}15`, border: `1px solid ${color}30` }}>
        {icon} {status}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Leave Summary</h1>
      </header>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.brandLine}></div>
          <h3 style={styles.sectionTitle}>Application Records</h3>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>S.NO</th>
                <th style={styles.th}>LEAVE TYPE</th>
                <th style={styles.th}>FROM / TO</th>
                <th style={styles.th}>DESCRIPTION</th>
                <th style={styles.th}>APPLIED ON</th>
                <th style={styles.th}>STATUS</th>
                <th style={styles.th}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={styles.tdCenter}>Loading...</td></tr>
              ) : history.length === 0 ? (
                <tr><td colSpan="7" style={styles.tdCenter}>No leave history found.</td></tr>
              ) : (
                history.map((leave, index) => (
                  <tr key={leave._id} style={styles.tr}>
                    <td style={styles.td}>{index + 1}</td>
                    <td style={{...styles.td, fontWeight: '600'}}>{leave.leaveType}</td>
                    <td style={styles.td}>
                      <div style={{fontSize: '13px', fontWeight: '500'}}>{formatDate(leave.startDate)}</div>
                      <div style={{fontSize: '11px', color: '#64748b'}}>to {formatDate(leave.endDate)}</div>
                    </td>
                    <td style={styles.td}>
                      <div style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                        {leave.reason}
                      </div>
                      {leave.documentUrl && (
                        <a href={`http://localhost:5000${leave.documentUrl}`} target="_blank" rel="noreferrer" style={styles.attachmentLink}>
                          <FileText size={12} /> View Attachment
                        </a>
                      )}
                    </td>
                    <td style={{...styles.td, fontSize: '12px', color: '#475569'}}>
                      {formatDateTime(leave.appliedOn || leave.createdAt || new Date())}
                    </td>
                    <td style={styles.td}><StatusBadge status={leave.status} /></td>
                    <td style={styles.td}>
                      {leave.status === 'Pending' && (
                        confirmingId === leave._id ? (
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => handleCancelConfirm(leave._id)} style={styles.confirmBtn}>
                              Confirm
                            </button>
                            <button onClick={() => setConfirmingId(null)} style={styles.noBtn}>
                              No
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => handleCancelRequest(leave._id)} style={styles.cancelBtn}>
                            Cancel
                          </button>
                        )
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: window.innerWidth <= 768 ? '15px' : '30px', textAlign: 'center' },
  pageTitle: { fontSize: window.innerWidth <= 768 ? '22px' : '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  
  card: { 
    background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden'
  },
  cardHeader: { 
    display: 'flex', alignItems: 'center', gap: '15px', padding: window.innerWidth <= 768 ? '15px' : '20px 25px', 
    borderBottom: '1px solid #f1f5f9', background: '#fafafa' 
  },
  brandLine: { width: '4px', height: '20px', backgroundColor: '#F17F08', borderRadius: '4px' },
  sectionTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#334155' },

  tableWrapper: { overflowX: 'auto', width: '100%' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' },
  tableHeaderRow: { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '16px 20px', fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
  td: { padding: '16px 20px', fontSize: '14px', color: '#334155', verticalAlign: 'middle' },
  tdCenter: { padding: '40px', textAlign: 'center', color: '#94a3b8' },

  cancelBtn: { 
    background: '#fee2e2', color: '#dc2626', border: 'none', padding: '6px 12px', 
    borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
    transition: 'all 0.2s'
  },
  confirmBtn: { 
    background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', 
    borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700'
  },
  noBtn: { 
    background: '#64748b', color: 'white', border: 'none', padding: '6px 10px', 
    borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '700'
  },
  attachmentLink: { 
    display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '5px', 
    fontSize: '11px', color: '#F17F08', textDecoration: 'none', fontWeight: '600' 
  }
};

export default LeaveHistory;
