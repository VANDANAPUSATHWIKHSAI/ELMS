import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Plus, Edit2, Trash2, CheckCircle, XCircle } from 'lucide-react';

const AdminEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: 'Employee',
    password: 'password123',
    designation: '', mobile: '', gender: '', address: '', aadhaar: '', pan: '', aicteId: '', jntuUid: '', dob: '', doj: ''
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('http://localhost:5000/api/admin/employees');
      const data = await res.json();
      if (res.ok) setEmployees(data);
    } catch (err) {
      showToast('Error loading employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({
      employeeId: '', firstName: '', lastName: '', email: '', department: '', role: 'Employee', password: 'password123',
      designation: '', mobile: '', gender: '', address: '', aadhaar: '', pan: '', aicteId: '', jntuUid: '', dob: '', doj: ''
    });
    setEditMode(false);
    setCurrentId(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (emp) => {
    const formatDate = (d) => d ? new Date(d).toISOString().split('T')[0] : "";
    setFormData({
      employeeId: emp.employeeId || '',
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      department: emp.department || '',
      role: emp.role || 'Employee',
      password: '', // Keep empty unless changing
      designation: emp.designation || '',
      mobile: emp.mobile || '',
      gender: emp.gender || '',
      address: emp.address || '',
      aadhaar: emp.aadhaar || '',
      pan: emp.pan || '',
      aicteId: emp.aicteId || '',
      jntuUid: emp.jntuUid || '',
      dob: formatDate(emp.dob),
      doj: formatDate(emp.doj)
    });
    setCurrentId(emp.employeeId);
    setEditMode(true);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // For Edit, remove empty password
    const payload = { ...formData };
    if (editMode && !payload.password) {
      delete payload.password;
    }

    try {
      const url = editMode 
        ? `http://localhost:5000/api/admin/employees/${currentId}`
        : `http://localhost:5000/api/admin/employees`;
        
      const res = await apiFetch(url, {
        method: editMode ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setShowModal(false);
        fetchEmployees();
      } else {
        showToast(data.message || 'Error saving employee', 'error');
      }
    } catch (err) {
      showToast('Server connection failed', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee? This cannot be undone.')) return;
    
    try {
      const res = await apiFetch(`http://localhost:5000/api/admin/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        showToast(data.message, 'success');
        fetchEmployees();
      } else {
        showToast(data.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      showToast('Server error during deletion', 'error');
    }
  };

  return (
    <div style={styles.container}>
      {toast.visible && (
        <div style={{...styles.toast, backgroundColor: toast.type === 'success' ? '#1e293b' : '#dc2626'}}>
          {toast.type === 'success' ? <CheckCircle size={18} color="#4ade80" /> : <XCircle size={18} color="white" />}
          {toast.message}
        </div>
      )}

      <div style={styles.header}>
        <h2 style={styles.title}>Employee Management</h2>
        <button onClick={openAddModal} style={styles.addButton}>
          <Plus size={16} /> Add Employee
        </button>
      </div>

      <div style={styles.card}>
        {loading ? (
          <p style={{padding: '20px', color: '#64748b'}}>Loading employees...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHeading}>
                  <th style={styles.th}>ID</th>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Dept</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp._id} style={styles.tr}>
                    <td style={styles.td}><strong>{emp.employeeId}</strong></td>
                    <td style={styles.td}>{emp.firstName} {emp.lastName}</td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                        background: emp.role === 'Admin' ? '#fee2e2' : emp.role === 'HoD' ? '#fffbeb' : '#f0fdf4',
                        color: emp.role === 'Admin' ? '#ef4444' : emp.role === 'HoD' ? '#f59e0b' : '#10b981'
                      }}>
                        {emp.role}
                      </span>
                    </td>
                    <td style={styles.td}>{emp.department || '-'}</td>
                    <td style={styles.td}>{emp.email || '-'}</td>
                    <td style={styles.td}>
                      <div style={styles.actionBlock}>
                        <button onClick={() => openEditModal(emp)} style={styles.iconBtnEdit} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(emp.employeeId)} style={styles.iconBtnDel} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {employees.length === 0 && (
              <p style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>No employees found.</p>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={{margin:0, fontSize: '18px'}}>{editMode ? 'Edit Employee' : 'Add New Employee'}</h3>
              <button onClick={() => setShowModal(false)} style={styles.closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form} autoComplete="off">
              <div style={styles.formGrid}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Employee ID *</label>
                  <input required name="employeeId" value={formData.employeeId} onChange={handleInputChange} disabled={editMode} style={styles.input} />
                </div>
                
                {/* Password field is now always shown for Admin. Leaves empty for no change */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{editMode ? 'Reset Password (optional)' : 'Temporary Password *'}</label>
                  <input required={!editMode} name="password" type="password" value={formData.password} onChange={handleInputChange} autoComplete="new-password" style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>First Name *</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Last Name</label>
                  <input name="lastName" value={formData.lastName} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Department</label>
                  <input name="department" value={formData.department} onChange={handleInputChange} style={styles.input} placeholder="e.g. CSE" />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Role</label>
                  <select name="role" value={formData.role} onChange={handleInputChange} style={styles.input}>
                    <option value="Employee">Employee (Teacher)</option>
                    <option value="HoD">Head of Department</option>
                    <option value="Principal">Dean/Principal</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Designation</label>
                  <input name="designation" value={formData.designation} onChange={handleInputChange} style={styles.input} />
                </div>
                
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mobile</label>
                  <input name="mobile" value={formData.mobile} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} style={styles.input}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date of Joining</label>
                  <input type="date" name="doj" value={formData.doj} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Aadhaar Number</label>
                  <input name="aadhaar" value={formData.aadhaar} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>PAN Number</label>
                  <input name="pan" value={formData.pan} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>AICTE ID</label>
                  <input name="aicteId" value={formData.aicteId} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>JNTU Number</label>
                  <input name="jntuUid" value={formData.jntuUid} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={{ ...styles.inputGroup, gridColumn: 'span 2' }}>
                  <label style={styles.label}>Address</label>
                  <input name="address" value={formData.address} onChange={handleInputChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnCancel}>Cancel</button>
                <button type="submit" style={styles.btnSave}>{editMode ? 'Save Changes' : 'Create Account'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1100px', margin: '0 auto' },
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
  modal: { background: 'white', width: '90%', maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  modalHeader: { padding: '20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  closeModal: { background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' },
  form: { padding: '20px', overflowY: 'auto', flex: 1 },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px' },
  modalFooter: { display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' },
  btnCancel: { padding: '10px 16px', borderRadius: '6px', border: '1px solid #cbd5e1', background: 'white', cursor: 'pointer', fontWeight: '600', color: '#64748b' },
  btnSave: { padding: '10px 16px', borderRadius: '6px', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', fontWeight: '600' },

  toast: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'white', padding: '12px 24px', borderRadius: '50px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 2000, fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 0.3s ease-out' }
};

export default AdminEmployees;
