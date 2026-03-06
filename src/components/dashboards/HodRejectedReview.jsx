import React, { useState, useEffect } from 'react';
import { apiFetch } from "../../utils/api";
import { Check, Search, Calendar } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

const HodRejectedReview = () => {
  const { notify } = useNotification();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [comment, setComment] = useState('');

  const kmitOrange = "#F17F08";

  const fetchRejectedRequests = async () => {
    if (!user?.department && !user?.dept) return;
    try {
      setLoading(true);
      const res = await apiFetch(`http://localhost:5000/api/hod/principal-rejected/${encodeURIComponent(user.department || user.dept)}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      } else {
        notify("Failed to load rejected requests");
      }
    } catch (err) {
      notify("Error connecting to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRejectedRequests();
  }, [user]);

  const handleAccept = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/leave/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          leaveId: selectedLeave._id, 
          action: 'Approved', 
          comment: comment || "Accepted/Overruled by HoD" 
        })
      });
      if (res.ok) {
        notify("Leave Accepted & Overruled Successfully");
        setSelectedLeave(null);
        setComment('');
        fetchRejectedRequests();
      } else {
        notify("Failed to process action");
      }
    } catch (err) {
      notify("Error processing request");
    }
  };

  const filteredRequests = requests.filter(req => 
    req.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric' 
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Rejected Leaves Review</h1>
          <p style={styles.subtitle}>Review and overrule upcoming leaves rejected by the Principal.</p>
        </div>
      </header>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
           <div style={styles.searchBox}>
              <Search size={18} color="#94a3b8" />
              <input 
                type="text" 
                placeholder="Search faculty..." 
                style={styles.searchInput}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <div style={styles.badge}>
             Total: {filteredRequests.length}
           </div>
        </div>

        {loading ? (
           <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Loading...</div>
        ) : filteredRequests.length === 0 ? (
           <div style={{padding: '60px', textAlign: 'center', color: '#94a3b8'}}>
             <Calendar size={48} color="#cbd5e1" style={{marginBottom: '16px'}} />
             <p style={{margin: 0, fontSize: '16px'}}>No Principal-rejected leaves to review.</p>
           </div>
        ) : (
           <div style={{overflowX: 'auto'}}>
             <table style={styles.table}>
                <thead>
                  <tr style={styles.trHeading}>
                    <th style={styles.th}>Faculty Name</th>
                    <th style={styles.th}>Leave Details</th>
                    <th style={styles.th}>Duration</th>
                    <th style={styles.th}>Principal Reason</th>
                    <th style={styles.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map(req => (
                    <tr key={req._id} style={styles.tr}>
                      <td style={{...styles.td, fontWeight: 'bold'}}>{req.employeeName}</td>
                      <td style={styles.td}>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                          <span style={styles.typeBadge}>
                            {req.leaveType} {req.isHalfDay ? `(${req.halfDayType})` : ''}
                          </span>
                          <span style={{fontSize: '12px', color: '#64748b'}}>{req.reason}</span>
                        </div>
                      </td>
                      <td style={styles.td}>
                        {formatDate(req.startDate)} <br/>to<br/> {formatDate(req.endDate)}
                      </td>
                      <td style={styles.td}>
                         <div style={{color: '#dc2626', fontSize: '12px', fontStyle: 'italic'}}>
                           "{req.principalApproval?.comment || 'No reason provided'}"
                         </div>
                      </td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => setSelectedLeave(req)}
                          style={styles.acceptBtn}
                        >
                          <Check size={16} /> Accept
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        )}
      </div>

      {selectedLeave && (
         <div style={styles.modalOverlay}>
           <div style={styles.modalContent}>
             <h3 style={styles.modalTitle}>Confirm Overrule/Acceptance</h3>
             <p style={{color: '#64748b', marginBottom: '8px'}}>
               Are you sure you want to approve the leave for <strong>{selectedLeave.employeeName}</strong>? 
               This will reverse the Principal's rejection and re-deduct leave balance.
             </p>
             
             <textarea
                placeholder="Comments for the overrule..."
                style={styles.modalTextarea}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
             />

             <div style={styles.modalActions}>
                <button onClick={() => setSelectedLeave(null)} style={styles.cancelBtn}>Cancel</button>
                <button onClick={handleAccept} style={styles.confirmBtn}>Confirm Acceptance</button>
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
  badge: { background: '#fef2f2', color: '#dc2626', padding: '6px 16px', borderRadius: '20px', fontWeight: 'bold', fontSize: '14px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '16px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
  td: { padding: '16px 20px', color: '#334155' },
  typeBadge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', width: 'fit-content' },
  acceptBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modalContent: { background: 'white', padding: '30px', borderRadius: '16px', width: '450px', maxWidth: '95%' },
  modalTitle: { margin: '0 0 16px 0', fontSize: '20px', color: '#1e293b' },
  modalTextarea: { width: '100%', height: '100px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none', marginTop: '16px', fontFamily: 'inherit' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { padding: '10px 16px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  confirmBtn: { padding: '10px 16px', border: 'none', background: '#16a34a', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default HodRejectedReview;
