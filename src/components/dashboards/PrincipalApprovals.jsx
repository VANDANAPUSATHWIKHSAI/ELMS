import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { Check, X, Search, FileText, AlertTriangle, Clock as ClockIcon } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const PrincipalApprovals = () => {
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'escalated'
  const [requests, setRequests] = useState([]);
  const [escalations, setEscalations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(null); // 'Approved' or 'Rejected'
  const [comment, setComment] = useState('');

  const kmitOrange = "#F17F08";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'pending' ? 'pending' : 'escalations';
      const res = await apiFetch(`http://localhost:5000/api/principal/${endpoint}`);
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'pending') setRequests(data);
        else setEscalations(data);
      }
    } catch (err) {
      notify("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [activeTab]);

  const handleAction = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/leave/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leaveId: selectedLeave._id, action: actionType, comment })
      });
      if (res.ok) {
        notify(`Leave ${actionType} Successfully`);
        setSelectedLeave(null);
        setComment('');
        fetchRequests();
      } else {
         notify("Failed to process action");
      }
    } catch (err) {
      notify("Error processing request");
    }
  };

  const currentList = activeTab === 'pending' ? requests : escalations;

  const filteredRequests = currentList.filter(req => 
    req.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const getEscalationReason = (req) => {
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const appliedOn = new Date(req.appliedOn);
    
    if (appliedOn <= twoDaysAgo) return "Delayed (>2 Days)";
    if (['AL', 'OD'].includes(req.leaveType)) return "Requires Ratification";
    return "Policy Review";
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Leave Review & Ratifications</h1>
          <p style={styles.subtitle}>Review globally escalated or pending leave requests.</p>
        </div>
      </header>

      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('pending')} 
          style={{...styles.tabLink, borderBottom: activeTab === 'pending' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'pending' ? kmitOrange : '#64748b'}}
        >
          All Pending ({requests.length})
        </button>
        <button 
          onClick={() => setActiveTab('escalated')} 
          style={{...styles.tabLink, borderBottom: activeTab === 'escalated' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'escalated' ? kmitOrange : '#64748b'}}
        >
          Escalations
        </button>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
           <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search by name or department..." 
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>

        {loading ? (
           <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Loading requests...</div>
        ) : filteredRequests.length === 0 ? (
           <div style={{padding: '60px', textAlign: 'center', color: '#94a3b8'}}>
             <FileText size={48} color="#cbd5e1" style={{marginBottom: '16px'}} />
             <p style={{margin: 0, fontSize: '16px'}}>No {activeTab} requests found.</p>
           </div>
        ) : (
           <div style={{overflowX: 'auto'}}>
             <table style={styles.table}>
               <thead>
                 <tr style={styles.trHeading}>
                   <th style={styles.th}>Faculty Name</th>
                   <th style={styles.th}>Dept</th>
                   <th style={styles.th}>Leave Details</th>
                   <th style={styles.th}>Duration</th>
                   <th style={styles.th}>Status/Reason</th>
                   <th style={styles.th}>Actions</th>
                 </tr>
               </thead>
               <tbody>
                 {filteredRequests.map(req => (
                   <tr key={req._id} style={styles.tr}>
                     <td style={{...styles.td, fontWeight: 'bold'}}>{req.employeeName}</td>
                     <td style={{...styles.td, color: kmitOrange, fontWeight: '600'}}>
                       {req.department}
                     </td>
                     <td style={styles.td}>
                       <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                         <span style={styles.typeBadge}>
                           {req.leaveType} {req.isHalfDay ? `(${req.halfDayType})` : ''}
                         </span>
                         <span style={{fontSize: '12px', color: '#64748b'}}>{req.reason}</span>
                         {req.documentUrl && (
                           <a 
                             href={`${window.location.protocol}//${window.location.hostname}:5000/${(req.documentUrl.startsWith('/') ? req.documentUrl.substring(1) : req.documentUrl).replace(/\\/g, '/')}`} 
                             target="_blank" 
                             rel="noopener noreferrer"
                             style={styles.documentLink}
                           >
                             <FileText size={12} /> Attachment
                           </a>
                         )}

                         {/* Display Class Adjustments inline for Principal */}
                         {req.adjustments && req.adjustments.length > 0 && (
                            <div style={{ marginTop: '10px', background: '#f8fafc', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', width: 'fit-content' }}>
                              <strong style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase' }}>Class Adjustments ({req.adjustments.length})</strong>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                                {req.adjustments.map((adj, i) => (
                                  <div key={i} style={{ fontSize: '12px', color: '#334155' }}>
                                    • {formatDate(adj.date)} (P{adj.period.replace(/\D/g,'')}) - {adj.yearAndSection} → <span style={{color: '#F17F08', fontWeight: 'bold'}}>{adj.adjustedWith}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                         )}
                       </div>
                     </td>
                     <td style={styles.td}>
                       {formatDate(req.startDate)} <br/>to<br/> {formatDate(req.endDate)}
                     </td>
                     <td style={styles.td}>
                        {activeTab === 'escalated' ? (
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#dc2626', fontSize: '12px', fontWeight: '700'}}>
                            <AlertTriangle size={14} /> {getEscalationReason(req)}
                          </div>
                        ) : (
                          <div style={{display: 'flex', alignItems: 'center', gap: '6px', color: '#d97706', fontSize: '12px', fontWeight: '700'}}>
                             <ClockIcon size={14} /> Pending
                          </div>
                        )}
                     </td>
                     <td style={styles.td}>
                       <div style={{display: 'flex', gap: '8px'}}>
                         <button 
                           onClick={() => { setSelectedLeave(req); setActionType('Approved'); }}
                           style={{...styles.actionBtn, background: '#dcfce7', color: '#16a34a'}}
                           title="Approve"
                         >
                           <Check size={18} />
                         </button>
                         <button 
                           onClick={() => { setSelectedLeave(req); setActionType('Rejected'); }}
                           style={{...styles.actionBtn, background: '#fee2e2', color: '#dc2626'}}
                           title="Reject"
                         >
                           <X size={18} />
                         </button>
                       </div>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}
      </div>


      {/* ACTION MODAL */}
      {selectedLeave && (
         <div style={styles.modalOverlay}>
           <div style={styles.modalContent}>
             <h3 style={styles.modalTitle}>Confirm Action: {actionType}</h3>
             <p style={{color: '#64748b', marginBottom: '8px'}}>Leave application by <strong>{selectedLeave.employeeName}</strong> for <strong>{selectedLeave.leaveType}</strong>.</p>
             
             <textarea
                placeholder="Optional comments for the applicant..."
                style={styles.modalTextarea}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
             />

             <div style={styles.modalActions}>
                <button onClick={() => setSelectedLeave(null)} style={styles.cancelBtn}>Cancel</button>
                <button 
                  onClick={handleAction} 
                  style={{
                    ...styles.confirmBtn, 
                    background: actionType === 'Approved' ? '#16a34a' : '#dc2626'
                  }}
                >
                  Confirm {actionType}
                </button>
             </div>
           </div>
         </div>
      )}

    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  
  card: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e2e8f0' },
  
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '300px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' },
  
  badge: { background: '#fffbeb', color: '#b45309', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' },
  tabBar: { display: 'flex', gap: '24px', padding: '0 20px', marginBottom: '-1px', borderBottom: '1px solid #e2e8f0' },
  tabLink: { padding: '12px 4px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.2s' },
  
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '16px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } },
  td: { padding: '16px 20px', color: '#334155' },
  
  typeBadge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', width: 'fit-content', whiteSpace: 'nowrap', flexShrink: 0 },
  documentLink: { display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c', textDecoration: 'none', fontSize: '11px', fontWeight: '700', marginTop: '4px' },
  actionBtn: { border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '16px', width: '400px', maxWidth: '90%' },
  modalTitle: { margin: '0 0 16px 0', fontSize: '20px', color: '#1e293b' },
  modalTextarea: { width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none', marginTop: '16px', fontFamily: 'inherit' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { padding: '10px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  confirmBtn: { padding: '10px 16px', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default PrincipalApprovals;
