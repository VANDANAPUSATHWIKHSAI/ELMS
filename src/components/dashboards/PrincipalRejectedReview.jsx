import React, { useState, useEffect } from 'react';
import { apiFetch } from "../../utils/api";
import { Check, X, Search, FileText, Calendar, Filter } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const PrincipalRejectedReview = () => {
  const { notify } = useNotification();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); // 'All', 'Approved', 'Rejected'
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [actionType, setActionType] = useState(''); // 'Approved' or 'Rejected'
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const kmitOrange = "#F17F08";

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('http://localhost:5000/api/principal/hod-reviewed');
      if (res.ok) {
        setRequests(await res.json());
      } else {
        notify("Failed to load leave reviews", "error");
      }
    } catch (err) {
      notify("Error connecting to server", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async () => {
    if (!selectedLeave || !actionType) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/leave/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaveId: selectedLeave._id,
          action: actionType,
          comment: comment || `${actionType} by Principal`
        })
      });
      if (res.ok) {
        notify(`Leave ${actionType} by Principal successfully`, "success");
        setSelectedLeave(null);
        setComment('');
        setActionType('');
        fetchRequests();
      } else {
        const d = await res.json();
        notify(d.message || "Failed to process action", "error");
      }
    } catch (err) {
      notify("Error processing request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const filteredRequests = requests.filter(req => {
    const matchSearch = !searchTerm ||
      (req.employeeName && req.employeeName.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>HoD Decision Review</h1>
          <p style={styles.subtitle}>
            Review all HoD-decided leaves before their start date. Your decision overrides the HoD's.
          </p>
        </div>
      </header>

      {/* FILTER TABS */}
      <div style={styles.filterBar}>
        {[
          { label: `All (${requests.length})`, value: 'All' },
          { label: `✅ HoD Approved (${approvedCount})`, value: 'Approved' },
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
          <div style={styles.countBadge}>
            <Filter size={14} /> {filteredRequests.length} leaves
          </div>
        </div>

        {loading ? (
          <div style={styles.emptyState}>Loading...</div>
        ) : filteredRequests.length === 0 ? (
          <div style={styles.emptyState}>
            <Calendar size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
            <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>No leaves to review.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Faculty</th>
                  <th style={styles.th}>Dept</th>
                  <th style={styles.th}>Leave Details</th>
                  <th style={styles.th}>Dates</th>
                  <th style={styles.th}>HoD Decision</th>
                  <th style={styles.th}>HoD Comment</th>
                  <th style={styles.th}>Principal Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(req => {
                  const hodDecided = req.hodApproval?.status;
                  return (
                    <tr key={req._id} style={styles.tr}>
                      <td style={{ ...styles.td, fontWeight: 'bold' }}>{req.employeeName}</td>
                      <td style={{ ...styles.td, color: kmitOrange, fontWeight: '600' }}>{req.department}</td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={styles.typeBadge}>{req.leaveType} {req.isHalfDay ? `(${req.halfDayType})` : ''}</span>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>{req.reason}</span>
                          {req.documentUrl && (
                            <a
                              href={`${window.location.protocol}//${window.location.hostname}:5000/${(req.documentUrl.startsWith('/') ? req.documentUrl.substring(1) : req.documentUrl).replace(/\\/g, '/')}`}
                              target="_blank" rel="noopener noreferrer"
                              style={styles.docLink}
                            >
                              <FileText size={12} /> Attachment
                            </a>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        {formatDate(req.startDate)}<br />to<br />{formatDate(req.endDate)}
                      </td>
                      <td style={styles.td}>
                        <span style={{
                          ...styles.hodBadge,
                          background: hodDecided === 'Approved' ? '#dcfce7' : '#fee2e2',
                          color: hodDecided === 'Approved' ? '#16a34a' : '#dc2626',
                        }}>
                          {hodDecided === 'Approved' ? '✅ Approved' : '❌ Rejected'}
                        </span>
                      </td>
                      <td style={{ ...styles.td, fontStyle: 'italic', color: '#64748b', fontSize: '12px' }}>
                        "{req.hodApproval?.comment || 'No comment'}"
                      </td>
                      <td style={styles.td}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => { setSelectedLeave(req); setActionType('Approved'); }}
                            style={styles.btnApprove}
                            title="Approve this leave"
                          >
                            <Check size={15} /> Approve
                          </button>
                          <button
                            onClick={() => { setSelectedLeave(req); setActionType('Rejected'); }}
                            style={styles.btnReject}
                            title="Reject this leave"
                          >
                            <X size={15} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACTION MODAL */}
      {selectedLeave && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>
              {actionType === 'Approved' ? '✅ Approve Leave' : '❌ Reject Leave'}
            </h3>
            <p style={{ color: '#64748b', marginBottom: '4px' }}>
              Employee: <strong>{selectedLeave.employeeName}</strong>
            </p>
            <p style={{ color: '#64748b', marginBottom: '4px' }}>
              Leave: <strong>{selectedLeave.leaveType}</strong> · {formatDate(selectedLeave.startDate)} to {formatDate(selectedLeave.endDate)}
            </p>
            <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '13px' }}>
              HoD had <strong style={{ color: selectedLeave.hodApproval?.status === 'Approved' ? '#16a34a' : '#dc2626' }}>
                {selectedLeave.hodApproval?.status}
              </strong> this leave.
              {actionType !== selectedLeave.hodApproval?.status && (
                <span style={{ color: '#d97706', fontWeight: '600' }}>
                  {' '}Balance will be {actionType === 'Approved' ? 're-deducted' : 'refunded'} accordingly.
                </span>
              )}
            </p>
            <textarea
              placeholder="Optional comments for the employee..."
              style={styles.modalTextarea}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <div style={styles.modalActions}>
              <button onClick={() => { setSelectedLeave(null); setComment(''); }} style={styles.cancelBtn}>
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={submitting}
                style={{
                  ...styles.confirmBtn,
                  background: actionType === 'Approved' ? '#16a34a' : '#dc2626',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting ? 'Processing...' : `Confirm ${actionType}`}
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
  header: { marginBottom: '24px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '14px' },

  filterBar: { display: 'flex', gap: '4px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' },
  filterTab: { padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', transition: 'all 0.2s' },

  card: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '300px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' },
  countBadge: { display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '13px', fontWeight: '600' },

  emptyState: { padding: '60px', textAlign: 'center', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center' },

  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHead: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px 18px', color: '#64748b', fontWeight: '600', fontSize: '13px' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 18px', color: '#334155', verticalAlign: 'top' },

  typeBadge: { display: 'inline-block', background: '#eff6ff', color: '#3b82f6', padding: '3px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap', flexShrink: 0 },
  hodBadge: { display: 'inline-block', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  docLink: { display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ea580c', textDecoration: 'none', fontSize: '11px', fontWeight: '700' },

  btnApprove: { display: 'flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#16a34a', border: '1px solid #86efac', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' },
  btnReject: { display: 'flex', alignItems: 'center', gap: '4px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' },

  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' },
  modalContent: { background: 'white', padding: '30px', borderRadius: '16px', width: '460px', maxWidth: '95%', boxShadow: '0 25px 50px rgba(0,0,0,0.25)' },
  modalTitle: { margin: '0 0 16px 0', fontSize: '20px', color: '#1e293b', fontWeight: '700' },
  modalTextarea: { width: '100%', height: '90px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', resize: 'none', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' },
  cancelBtn: { padding: '10px 18px', border: '1px solid #cbd5e1', background: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  confirmBtn: { padding: '10px 18px', border: 'none', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }
};

export default PrincipalRejectedReview;
