import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

const AdminHolidays = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    type: 'Festival'
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const fetchHolidays = async () => {
    try {
      setLoading(true);
      const host = window.location.hostname;
      const res = await apiFetch(`http://${host}:5000/api/holidays`); // Public endpoint for getting holidays
      if (res.ok) setHolidays(await res.json());
    } catch (err) {
      showToast('Error loading holidays', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHolidays(); }, []);

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const resetForm = () => {
    setFormData({ name: '', startDate: '', endDate: '', type: 'Festival' });
    setEditMode(false);
    setCurrentId(null);
  };

  const openAddModal = () => { resetForm(); setShowModal(true); };

  const openEditModal = (hol) => {
    const sDateStr = new Date(hol.startDate).toISOString().split('T')[0];
    const eDateStr = new Date(hol.endDate).toISOString().split('T')[0];

    setFormData({ 
      name: hol.name, 
      startDate: sDateStr, 
      endDate: eDateStr, 
      type: hol.type || 'Festival' 
    });
    setCurrentId(hol._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const host = window.location.hostname;
      const baseUrl = `http://${host}:5000/api/admin/holidays`;
      const url = editMode ? `${baseUrl}/${currentId}` : baseUrl;
      
      const res = await apiFetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message, 'success');
        setShowModal(false);
        fetchHolidays();
      } else {
        showToast(data.message || 'Error saving holiday', 'error');
      }
    } catch (err) { showToast('Server connection failed', 'error'); }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      setLoading(true);
      const host = window.location.hostname;
      const res = await apiFetch(`http://${host}:5000/api/admin/holidays/${deletingId}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        showToast(data.message || "Holiday Deleted", 'success');
        setShowDeleteModal(false);
        setDeletingId(null);
        await fetchHolidays();
      } else { 
        showToast(data.message || 'Failed to delete', 'error'); 
        console.error("Delete failed:", data);
      }
    } catch (err) { 
      showToast('Server error during deletion', 'error'); 
      console.error("Delete exception:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  // Helper to format display date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatRange = (start, end) => {
    const s = formatDate(start);
    const e = formatDate(end);
    if (s === e) return s;
    return `${s} — ${e}`;
  };

  return (
    <div style={styles.container}>
      {toast.visible && (
        <div style={{...styles.toast, backgroundColor: toast.type === 'success' ? '#10b981' : '#dc2626'}}>
          {toast.type === 'success' ? <CheckCircle size={18} color="white" /> : <XCircle size={18} color="white" />}
          {toast.message}
        </div>
      )}

      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Holiday Management</h2>
          <p style={{color: '#64748b', margin: '4px 0 0 0'}}>Manage academic and public holidays across the institution.</p>
        </div>
        <button onClick={openAddModal} style={styles.addButton}>
          <Plus size={16} /> Add Holiday
        </button>
      </div>

      <div style={styles.card}>
        {loading ? ( <p style={{padding: '20px', color: '#64748b'}}>Loading...</p> ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHeading}>
                  <th style={styles.th}>Date / Period</th>
                  <th style={styles.th}>Holiday Name</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(hol => (
                  <tr key={hol._id} style={styles.tr}>
                    <td style={styles.td}><strong>{formatRange(hol.startDate, hol.endDate)}</strong></td>
                    <td style={styles.td}>{hol.name}</td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge, 
                        background: hol.type === 'National' ? '#fee2e2' : hol.type === 'Optional' ? '#fef3c7' : hol.type === 'Summer Holidays' ? '#dcfce7' : '#f1f5f9',
                        color: hol.type === 'National' ? '#ef4444' : hol.type === 'Optional' ? '#d97706' : hol.type === 'Summer Holidays' ? '#16a34a' : '#64748b'
                      }}>
                        {hol.type}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionBlock}>
                        <button onClick={() => openEditModal(hol)} style={styles.iconBtnEdit} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => confirmDelete(hol._id)} style={styles.iconBtnDel} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {holidays.length === 0 && (
              <p style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>No holidays found.</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0, fontSize: '18px'}}>{editMode ? 'Edit Holiday' : 'Add New Holiday'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Holiday Name *</label>
                 <input 
                    required 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    style={styles.input} 
                    list="common-holidays"
                    placeholder="Select or type holiday name" 
                 />
                 <datalist id="common-holidays">
                    <option value="New Year's Day" />
                    <option value="Makara Sankranti" />
                    <option value="Republic Day" />
                    <option value="Maha Shivaratri" />
                    <option value="Holi" />
                    <option value="Ugadi" />
                    <option value="Eid ul-Fitr" />
                    <option value="Ambedkar Jayanti" />
                    <option value="May Day" />
                    <option value="Bakrid" />
                    <option value="Independence Day" />
                    <option value="Muharram" />
                    <option value="Ganesh Chaturthi" />
                    <option value="Gandhi Jayanti" />
                    <option value="Dussehra" />
                    <option value="Diwali" />
                    <option value="Christmas" />
                    <option value="Second Saturday" />
                    <option value="Institutional Holiday" />
                 </datalist>
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <div style={{...styles.inputGroup, flex: 1}}>
                  <label style={styles.label}>From Date *</label>
                  <input required type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} style={styles.input} />
                </div>
                <div style={{...styles.inputGroup, flex: 1}}>
                  <label style={styles.label}>To Date *</label>
                  <input required type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} style={styles.input} />
                </div>
              </div>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Holiday Type *</label>
                 <select 
                    required
                    name="type" 
                    value={formData.type} 
                    onChange={handleInputChange} 
                    style={styles.input}
                 >
                    <option value="Festival">Festival</option>
                    <option value="National">National</option>
                    <option value="Optional">Optional</option>
                    <option value="Summer Holidays">Summer Holidays</option>
                    <option value="Other">Other</option>
                 </select>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnCancel}>Cancel</button>
                <button type="submit" style={styles.btnSave}>{editMode ? 'Save Changes' : 'Create Holiday'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showDeleteModal && (
        <div style={styles.modalOverlay}>
          <div style={{...styles.modal, maxWidth: '400px'}}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0, fontSize: '18px'}}>Confirm Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} style={styles.closeModal}>&times;</button>
            </div>
            <div style={{padding: '20px', color: '#475569'}}>
              Are you sure you want to delete this holiday? This will also reverse any leave refunds given for these dates.
            </div>
            <div style={{...styles.modalFooter, padding: '20px', background: '#f8fafc'}}>
              <button onClick={() => setShowDeleteModal(false)} style={styles.btnCancel}>Cancel</button>
              <button onClick={handleDelete} style={{...styles.btnSave, background: '#ef4444'}}>
                {loading ? 'Deleting...' : 'Delete Holiday'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '900px', margin: '0 auto' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '24px', color: '#1e293b', margin: 0, fontWeight: '700' },
  addButton: { display: 'flex', alignItems: 'center', gap: '8px', background: '#F17F08', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
  
  card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: '#334155' },
  badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
  
  actionBlock: { display: 'flex', gap: '10px' },
  iconBtnEdit: { background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' },
  iconBtnDel: { background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modal: { background: 'white', width: '90%', maxWidth: '500px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalHeader: { padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeModal: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' },
  form: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px' },
  btnCancel: { padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  btnSave: { padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '600' },

  toast: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'white', padding: '12px 24px', borderRadius: '50px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 2000, fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 0.3s ease-out' }
};

export default AdminHolidays;
