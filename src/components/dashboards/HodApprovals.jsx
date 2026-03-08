import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { FileCheck, CheckCircle, XCircle, Search, FileText } from 'lucide-react';

const HodApprovals = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const kmitOrange = "#F17F08";

  // Modal & Toast States
  const [modal, setModal] = useState({ isOpen: false, leaveId: null, action: '' });
  const [comment, setComment] = useState('');


  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`http://localhost:5000/api/leave/pending/${encodeURIComponent(user.department)}`);
      if (res.ok) setRequests(await res.json());
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.department) fetchRequests();
  }, [user]);

  const openModal = (leaveId, action) => {
    setModal({ isOpen: true, leaveId, action });
    setComment(''); 
  };

  const closeModal = () => setModal({ isOpen: false, leaveId: null, action: '' });

  const confirmAction = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/leave/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId: modal.leaveId, action: modal.action, comment })
      });
      
      if (res.ok) {
        notify(`Leave successfully ${modal.action.toLowerCase()}!`, "success");
        fetchRequests(); 
        closeModal();
      } else {
        notify("Failed to process request.", "error");
      }
    } catch (err) { 
      notify("Network error occurred.", "error");
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={styles.container}>

      <style>{`
        .hod-header-row { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; margin-bottom: 20px; }
        .hod-search-box { display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 8px 16px; border-radius: 8px; border: 1px solid #e2e8f0; width: 250px; }
        .hod-list-item { display: flex; justify-content: space-between; align-items: flex-start; background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
        .hod-item-main { display: flex; gap: 15px; }
        .hod-action-btns { display: flex; flex-direction: column; gap: 10px; flex-shrink: 0; }
        
        @media (max-width: 600px) {
          .hod-header-row { flex-direction: column; align-items: flex-start; gap: 15px; }
          .hod-search-box { width: 100%; box-sizing: border-box; }
          .hod-list-item { flex-direction: column; gap: 20px; }
          .hod-action-btns { flex-direction: row; width: 100%; justify-content: space-between; gap: 10px; }
          .hod-action-btns button { flex: 1; }
        }
      `}</style>

      {/* CUSTOM MODAL OVERLAY */}
      {modal.isOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>
              {modal.action === 'Approved' ? 'Approve Leave' : 'Reject Leave'}
            </h3>
            <p style={styles.modalDesc}>Please provide a reason (Optional):</p>
            
            <textarea 
              style={styles.textarea}
              rows="3"
              placeholder="Type your comment here..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              autoFocus
            />
            
            <div style={styles.modalActions}>
              <button onClick={closeModal} style={styles.btnCancel}>Cancel</button>
              <button 
                onClick={confirmAction} 
                style={modal.action === 'Approved' ? styles.btnConfirmApprove : styles.btnConfirmReject}
              >
                Confirm {modal.action}
              </button>
            </div>
          </div>
        </div>
      )}

      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Pending Approvals</h1>
        <p style={styles.subtitle}>
          Managing leave requests for <strong style={{color: kmitOrange}}>{user?.department}</strong>.
        </p>
      </header>

      <div style={styles.card}>
        <div className="hod-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={22} color={kmitOrange} />
            <h3 style={styles.cardTitle}>Awaiting Your Action</h3>
          </div>
          
          <div className="hod-search-box">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search by ID or Name..." 
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? <p style={styles.emptyText}>Loading...</p> : requests.length === 0 ? (
          <div style={styles.emptyState}>
            <CheckCircle size={40} color="#16a34a" style={{marginBottom: '10px'}} />
            <p style={{margin: 0, fontSize: '16px', color: '#334155'}}>All caught up!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {requests
              .filter(req => {
                if (!searchTerm) return true;
                const searchLower = searchTerm.toLowerCase();
                const nameMatch = req.employeeName && req.employeeName.toLowerCase().includes(searchLower);
                const idMatch = req.employeeId && req.employeeId.toLowerCase().includes(searchLower);
                return nameMatch || idMatch;
              })
              .map(req => (
              <div key={req._id} className="hod-list-item">
                <div className="hod-item-main">
                  <div style={styles.avatar}>{req.employeeName ? req.employeeName[0] : '?'}</div>
                  <div style={{ wordBreak: 'break-word', minWidth: 0, flex: 1 }}>
                    <h4 style={styles.empName}>{req.employeeName} <span style={styles.empId}>(ID: {req.employeeId})</span></h4>
                    <div style={styles.leaveMeta}>
                      <span style={styles.badge}>
                        {req.leaveType} {req.isHalfDay ? `(${req.halfDayType})` : ''}
                      </span>
                      <span>{formatDate(req.startDate)} — {formatDate(req.endDate)}</span>
                    </div>
                    <p style={styles.reasonText}><strong>Reason:</strong> {req.reason}</p>
                    {req.documentUrl && (
                      <div style={{ marginTop: '10px' }}>
                        <a 
                          href={`${window.location.protocol}//${window.location.hostname}:5000/${(req.documentUrl.startsWith('/') ? req.documentUrl.substring(1) : req.documentUrl).replace(/\\/g, '/')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={styles.documentLink}
                        >
                          <FileText size={16} /> View Attachment
                        </a>
                      </div>
                    )}
                    
                    {/* Display Class Adjustments */}
                    {req.adjustments && req.adjustments.length > 0 && (
                      <div style={{ marginTop: '15px', background: 'white', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <h5 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Class Adjustments ({req.adjustments.length})</h5>
                        <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', color: '#64748b', textAlign: 'left' }}>
                              <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0' }}>Date</th>
                              <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0' }}>Period</th>
                              <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0' }}>Class</th>
                              <th style={{ padding: '6px', borderBottom: '1px solid #e2e8f0' }}>Substitute (Emp ID)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {req.adjustments.map((adj, i) => (
                              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '6px' }}>{formatDate(adj.date)}</td>
                                <td style={{ padding: '6px' }}>{adj.period}</td>
                                <td style={{ padding: '6px' }}>{adj.yearAndSection}</td>
                                <td style={{ padding: '6px', fontWeight: '600', color: '#F17F08' }}>{adj.adjustedWith}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>

                <div className="hod-action-btns">
                  <button onClick={() => openModal(req._id, 'Approved')} style={styles.btnApprove}>
                    <CheckCircle size={18} /> Approve
                  </button>
                  <button onClick={() => openModal(req._id, 'Rejected')} style={styles.btnReject}>
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(2px)' },
  modalBox: { background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', animation: 'fadeIn 0.2s ease-out' },
  modalTitle: { margin: '0 0 10px 0', fontSize: '20px', color: '#1e293b' },
  modalDesc: { margin: '0 0 15px 0', fontSize: '14px', color: '#64748b' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', outline: 'none', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  btnCancel: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600' },
  btnConfirmApprove: { padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '600' },
  btnConfirmReject: { padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: '600' },
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '15px', marginBottom: '20px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '250px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  itemMain: { display: 'flex', gap: '15px' },
  avatar: { width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #F17F08 0%, #ff9f43 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 },
  empName: { margin: '0 0 5px 0', fontSize: '16px', color: '#1e293b', fontWeight: '700' },
  empId: { color: '#64748b', fontSize: '13px', fontWeight: 'normal' },
  leaveMeta: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475569', marginBottom: '8px' },
  badge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 },
  reasonText: { margin: 0, fontSize: '14px', color: '#334155' },
  actionButtons: { display: 'flex', flexDirection: 'column', gap: '10px', flexShrink: 0 },
  btnApprove: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  btnReject: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'white', color: '#dc2626', border: '1px solid #dc2626', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  documentLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#F17F08', textDecoration: 'none', fontSize: '13px', fontWeight: '600', padding: '6px 12px', background: '#fff7ed', borderRadius: '6px', border: '1px solid #fde68a' },
  emptyState: { textAlign: 'center', padding: '40px 20px' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: '20px' }
};

export default HodApprovals;