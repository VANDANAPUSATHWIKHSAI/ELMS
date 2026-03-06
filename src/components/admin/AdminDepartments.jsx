import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const AdminDepartments = () => {
  const { notify, showConfirm } = useNotification();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    hodEmployeeId: '',
    description: ''
  });



  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('http://localhost:5000/api/admin/departments');
      if (res.ok) setDepartments(await res.json());
    } catch (err) {
      notify('Error loading departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ name: '', hodEmployeeId: '', description: '' });
    setEditMode(false);
    setCurrentId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setFormData({
      name: dept.name,
      hodEmployeeId: dept.hodEmployeeId || '',
      description: dept.description || ''
    });
    setCurrentId(dept._id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = editMode 
        ? `http://localhost:5000/api/admin/departments/${currentId}`
        : `http://localhost:5000/api/admin/departments`;
        
      const res = await apiFetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        notify(data.message, 'success');
        setShowModal(false);
        fetchDepartments();
      } else {
        notify(data.message || 'Error saving department', 'error');
      }
    } catch (err) {
      notify('Server connection failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this department?', {
        title: 'Confirm Deletion',
        confirmLabel: 'Delete',
        danger: true
    });
    if (!confirmed) return;
    
    try {
      const res = await apiFetch(`http://localhost:5000/api/admin/departments/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        notify(data.message, 'success');
        fetchDepartments();
      } else {
        notify(data.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      notify('Server error during deletion', 'error');
    }
  };

  return (
    <div style={styles.container}>


      <div style={styles.header}>
        <h2 style={styles.title}>Department Management</h2>
        <button onClick={openAddModal} style={styles.addButton}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div style={styles.card}>
        {loading ? (
          <p style={{padding: '20px', color: '#64748b'}}>Loading departments...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHeading}>
                  <th style={styles.th}>Department Name</th>
                  <th style={styles.th}>HoD (Emp ID)</th>
                  <th style={styles.th}>Description</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(dept => (
                  <tr key={dept._id} style={styles.tr}>
                    <td style={styles.td}><strong>{dept.name}</strong></td>
                    <td style={styles.td}>{dept.hodEmployeeId || '-'}</td>
                    <td style={styles.td}>{dept.description || '-'}</td>
                    <td style={styles.td}>
                      <div style={styles.actionBlock}>
                        <button onClick={() => openEditModal(dept)} style={styles.iconBtnEdit} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(dept._id)} style={styles.iconBtnDel} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {departments.length === 0 && (
              <p style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>No departments found.</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0, fontSize: '18px'}}>{editMode ? 'Edit Department' : 'Add New Department'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Department Name *</label>
                 <input required name="name" value={formData.name} onChange={handleInputChange} style={styles.input} placeholder="e.g. Computer Science" />
              </div>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>HoD Employee ID</label>
                 <input name="hodEmployeeId" value={formData.hodEmployeeId} onChange={handleInputChange} style={styles.input} placeholder="e.g. EMP002" />
              </div>
              <div style={styles.inputGroup}>
                 <label style={styles.label}>Description</label>
                 <textarea name="description" value={formData.description} onChange={handleInputChange} rows="2" style={styles.input} placeholder="Short description" />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnCancel}>Cancel</button>
                <button type="submit" style={styles.btnSave}>{editMode ? 'Save Changes' : 'Create Department'}</button>
              </div>
            </form>
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


};

export default AdminDepartments;
