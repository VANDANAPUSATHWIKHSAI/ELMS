import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Plus, Edit2, Trash2, Settings } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const AdminLeaveTypes = () => {
  const { notify, showConfirm } = useNotification();
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({ code: '', name: '', defaultDays: 0 });
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/leave-types');
      if (res.ok) setLeaveTypes(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editId ? `http://localhost:5000/api/admin/leave-types/${editId}` : 'http://localhost:5000/api/admin/leave-types';
      const method = editId ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        notify(editId ? "Leave type updated" : "Leave type created", "success");
        fetchTypes();
        setFormData({ code: '', name: '', defaultDays: 0 });
        setEditId(null);
      } else {
        notify(data.message || "Action failed", "error");
      }
    } catch (err) {
      notify("Server error", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (type) => {
    setFormData({ code: type.code, name: type.name, defaultDays: type.defaultDays });
    setEditId(type._id);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm("Are you sure you want to delete this leave type? This may break existing history!", {
        title: "Confirm Deletion",
        confirmLabel: "Delete",
        danger: true
    });
    if (!confirmed) return;
    try {
      const res = await apiFetch(`http://localhost:5000/api/admin/leave-types/${id}`, { method: 'DELETE' });
      if (res.ok) fetchTypes();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Leave Types Management</h1>
          <p style={styles.subtitle}>Configure dynamic leave policies for the institution.</p>
        </div>
      </header>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Settings size={20} color="#F17F08" />
            <h3 style={styles.cardTitle}>{editId ? 'Edit Leave Type' : 'Add New Leave Type'}</h3>
          </div>
          


          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Unique Code (e.g. CL, ML)</label>
              <input 
                type="text" 
                style={styles.input} 
                required 
                disabled={!!editId} // Cannot edit code after creation
                value={formData.code}
                onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Full Name (e.g. Casual Leave)</label>
              <input 
                type="text" 
                style={styles.input} 
                required 
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Default Annual Days</label>
              <input 
                type="number" 
                min="0"
                style={styles.input} 
                required 
                value={formData.defaultDays}
                onChange={e => setFormData({...formData, defaultDays: e.target.value})}
              />
            </div>

            <div style={{display: 'flex', gap: '10px'}}>
              <button type="submit" disabled={saving} style={{...styles.submitBtn, flex: 1}}>
                {saving ? 'Saving...' : (editId ? 'Update' : 'Create')}
              </button>
              {editId && (
                <button type="button" onClick={() => { setEditId(null); setFormData({code:'', name:'', defaultDays:0}); }} style={{...styles.cancelBtn}}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={{...styles.card, flex: 2}}>
          <div style={styles.cardHeader}>
            <Settings size={20} color="#F17F08" />
            <h3 style={styles.cardTitle}>Configured Leave Types</h3>
          </div>
          
          {loading ? (
             <p style={{padding: '20px', color: '#64748b'}}>Loading...</p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHeading}>
                    <th style={styles.th}>Code</th>
                    <th style={styles.th}>Name</th>
                    <th style={styles.th}>Default Days</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveTypes.map(type => (
                    <tr key={type._id} style={styles.tr}>
                      <td style={styles.td}><span style={styles.badge}>{type.code.toUpperCase()}</span></td>
                      <td style={styles.td}>{type.name}</td>
                      <td style={styles.td}>{type.defaultDays} Days</td>
                      <td style={styles.td}>
                        <div style={{display:'flex', gap:'8px'}}>
                          <button onClick={() => handleEdit(type)} style={styles.iconBtn} title="Edit"><Edit2 size={16} color="#3b82f6" /></button>
                          <button onClick={() => handleDelete(type._id)} style={styles.iconBtn} title="Delete"><Trash2 size={16} color="#ef4444" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  title: { margin: '0 0 8px 0', fontSize: '28px', color: '#1e293b' },
  subtitle: { margin: 0, color: '#64748b' },
  grid: { display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' },
  card: { flex: 1, minWidth: '300px', background: '#fff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b' },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  submitBtn: { background: '#F17F08', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  cancelBtn: { background: '#f1f5f9', color: '#475569', border: 'none', padding: '12px 18px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
  successMsg: { background: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '500' },
  errorMsg: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '500' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: '#334155' },
  badge: { background: '#eff6ff', color: '#3b82f6', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }
};

export default AdminLeaveTypes;
