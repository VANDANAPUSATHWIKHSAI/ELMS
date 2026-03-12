import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { FileCheck, CheckCircle, XCircle, Search, FileText, AlertCircle } from 'lucide-react';

const PrincipalSummerApprovals = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // 'All', 'Approved', 'Rejected'
  const kmitOrange = "#F17F08";

  // Modal & Toast States
  const [modal, setModal] = useState({ isOpen: false, leaveId: null, action: '', currentStatus: '' });
  const [comment, setComment] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      // Principal sees all HOD-decided requests (Approved or Rejected)
      const res = await apiFetch(`http://localhost:5000/api/principal/hod-reviewed-summer`);
      if (res.ok) {
        const allReqs = await res.json();
        setRequests(allReqs);
      }
    } catch (err) {
      console.error("Failed to fetch requests", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const openModal = (leaveId, action, currentStatus) => {
    setModal({ isOpen: true, leaveId, action, currentStatus });
    setComment(''); 
  };

  const closeModal = () => setModal({ isOpen: false, leaveId: null, action: '', currentStatus: '' });

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

  const filteredRequests = requests.filter(req => {
    const matchSearch = !searchTerm ||
      (req.employeeName && req.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.employeeId && req.employeeId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (req.department && req.department.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchFilter = filter === 'All' ||
      (filter === 'Approved' && req.hodApproval?.status === 'Approved') ||
      (filter === 'Rejected' && req.hodApproval?.status === 'Rejected');
    
    return matchSearch && matchFilter;
  });

  const approvedCount = requests.filter(r => r.hodApproval?.status === 'Approved').length;
  const rejectedCount = requests.filter(r => r.hodApproval?.status === 'Rejected').length;

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
              {modal.action === 'Approved' ? '✅ Approve Leave' : '❌ Reject Leave'}
            </h3>
            <p style={styles.modalDesc}>
              HoD had <strong style={{color: modal.currentStatus === 'Approved' ? '#16a34a' : '#dc2626'}}>
                {modal.currentStatus}
              </strong> this leave. 
              {modal.action !== modal.currentStatus && (
                <span style={{color: '#d97706', fontWeight: 'bold'}}> Your decision will override HoD's.</span>
              )}
            </p>
            
            <textarea 
              style={styles.textarea}
              rows="3"
              placeholder="Provide a reason (Optional)..."
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
        <h1 style={styles.pageTitle}>Summer Leave Decision Review</h1>
        <p style={styles.subtitle}>
          Reviewing all Summer Leave decisions made by HoDs. Your decision overrides their initial status.
        </p>
      </header>

      {/* FILTER TABS */}
      <div style={styles.filterBar}>
        {[
          { label: `All (${requests.length})`, value: 'All' },
          { label: `✅ HoD Accepted (${approvedCount})`, value: 'Approved' },
          { label: `❌ HoD Rejected (${rejectedCount})`, value: 'Rejected' },
        ].map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            style={{
              ...styles.filterTab,
              borderBottom: filter === tab.value ? `3px solid ${kmitOrange}` : '3px solid transparent',
              color: filter === tab.value ? kmitOrange : '#64748b',
              fontWeight: filter === tab.value ? '700' : '500',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={styles.card}>
        <div className="hod-header-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileCheck size={22} color={kmitOrange} />
            <h3 style={styles.cardTitle}>Summer Decisions for Review</h3>
          </div>
          
          <div className="hod-search-box">
            <Search size={18} color="#94a3b8" />
            <input 
              type="text" 
              placeholder="Search ID, Name or Dept..." 
              style={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {loading ? <p style={styles.emptyText}>Loading...</p> : filteredRequests.length === 0 ? (
          <div style={styles.emptyState}>
            <CheckCircle size={40} color="#16a34a" style={{marginBottom: '10px'}} />
            <p style={{margin: 0, fontSize: '16px', color: '#334155'}}>No summer leaves to review!</p>
          </div>
        ) : (
          <div style={styles.list}>
            {filteredRequests.map(req => {
              const hodStatus = req.hodApproval?.status;
              return (
                <div key={req._id} className="hod-list-item">
                  <div className="hod-item-main">
                    <div style={styles.avatar}>{req.employeeName ? req.employeeName[0] : '?'}</div>
                    <div style={{ wordBreak: 'break-word', minWidth: 0, flex: 1 }}>
                      <h4 style={styles.empName}>
                          {req.employeeName} <span style={styles.empId}>(ID: {req.employeeId})</span>
                          <div style={{fontSize: '13px', color: kmitOrange, marginTop: '2px'}}>{req.department}</div>
                      </h4>
                      
                      <div style={styles.leaveMeta}>
                        <span style={styles.badge}>
                          {req.leaveType}
                        </span>
                        <span>{formatDate(req.startDate)} — {formatDate(req.endDate)}</span>
                      </div>
                      <div style={{margin: '8px 0', display: 'flex', alignItems: 'center', gap: '10px'}}>
                        <span style={{
                            ...styles.hodStatusBadge,
                            background: hodStatus === 'Approved' ? '#dcfce7' : '#fee2e2',
                            color: hodStatus === 'Approved' ? '#16a34a' : '#dc2626',
                        }}>
                           HoD: {hodStatus === 'Approved' ? 'Accepted' : 'Rejected'}
                        </span>
                        {req.hodApproval?.comment && (
                           <span style={{fontSize: '12px', color: '#64748b', fontStyle: 'italic'}}>"{req.hodApproval.comment}"</span>
                        )}
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
                    </div>
                  </div>

                  <div className="hod-action-btns">
                    <button onClick={() => openModal(req._id, 'Approved', hodStatus)} style={styles.btnApprove}>
                      <CheckCircle size={18} /> Approve
                    </button>
                    <button onClick={() => openModal(req._id, 'Rejected', hodStatus)} style={styles.btnReject}>
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  
  filterBar: { display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' },
  filterTab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },

  modalOverlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(3px)' },
  modalBox: { background: 'white', padding: '30px', borderRadius: '16px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' },
  modalTitle: { margin: '0 0 10px 0', fontSize: '20px', color: '#1e293b' },
  modalDesc: { margin: '0 0 15px 0', fontSize: '14px', color: '#64748b' },
  textarea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', resize: 'none', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
  btnCancel: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer', fontWeight: '600' },
  btnConfirmApprove: { padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: '600' },
  btnConfirmReject: { padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer', fontWeight: '600' },
  
  card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  avatar: { width: '45px', height: '45px', borderRadius: '50%', background: 'linear-gradient(135deg, #F17F08 0%, #ff9f43 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px', flexShrink: 0 },
  empName: { margin: '0 0 5px 0', fontSize: '16px', color: '#1e293b', fontWeight: '700' },
  empId: { color: '#64748b', fontSize: '13px', fontWeight: 'normal' },
  leaveMeta: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#475569', marginBottom: '8px' },
  badge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 },
  hodStatusBadge: { padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', display: 'inline-block' },
  reasonText: { margin: 0, fontSize: '14px', color: '#334155' },
  btnApprove: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  btnReject: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'white', color: '#dc2626', border: '1px solid #dc2626', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' },
  documentLink: { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#F17F08', textDecoration: 'none', fontSize: '13px', fontWeight: '600', padding: '6px 12px', background: '#fff7ed', borderRadius: '6px', border: '1px solid #fde68a' },
  emptyState: { textAlign: 'center', padding: '40px 20px' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: '20px' }
};

export default PrincipalSummerApprovals;

