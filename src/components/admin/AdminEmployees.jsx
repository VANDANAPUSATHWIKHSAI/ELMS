import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Eye, EyeOff, Search } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const AdminEmployees = () => {
  const { notify, showConfirm } = useNotification();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [availableHods, setAvailableHods] = useState([]);
  const [hodLoading, setHodLoading] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    department: '',
    role: 'Employee',
    teachingYear: '',
    hodId: '',
    password: 'password123',
    designation: '', mobile: '', gender: '', address: '', aadhaar: '', pan: '', aicteId: '', jntuUid: '', dob: '', doj: ''
  });



  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('http://localhost:5000/api/admin/employees');
      const data = await res.json();
      if (res.ok) setEmployees(data);
    } catch (err) {
      notify('Error loading employees', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/admin/departments');
      if (res.ok) setDepartments(await res.json());
    } catch (err) { console.error("Error fetching departments", err); }
  };

  const filteredEmployees = employees.filter(emp => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase();
    
    return (
      emp.employeeId?.toLowerCase().includes(query) ||
      fullName.includes(query) ||
      emp.department?.toLowerCase().includes(query) ||
      emp.email?.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);
  const handleInputChange = (e) => {
    let { name, value } = e.target;
    
    if (name === 'mobile') {
      value = value.replace(/\D/g, '').slice(0, 10);
    } else if (name === 'aadhaar') {
      value = value.replace(/\D/g, '').slice(0, 12);
    } else if (name === 'pan') {
      value = value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10).toUpperCase();
    }
    
    setFormData({ ...formData, [name]: value });
  };

  useEffect(() => {
    const fetchHods = async () => {
      if (!formData.department) {
        setAvailableHods([]);
        return;
      }
      setHodLoading(true);
      try {
        const params = new URLSearchParams({
          department: formData.department,
          teachingYear: formData.teachingYear
        }).toString();
        const res = await apiFetch(`http://localhost:5000/api/admin/available-hods?${params}`);
        if (res.ok) {
          setAvailableHods(await res.json());
        }
      } catch (err) { console.error("Error fetching HODs", err); }
      finally { setHodLoading(false); }
    };
    if (showModal) fetchHods();
  }, [formData.department, formData.teachingYear, showModal]);

  const resetForm = () => {
    setFormData({
      employeeId: '', firstName: '', lastName: '', email: '', department: '', role: 'Employee', teachingYear: '', hodId: '', password: 'password123',
      designation: '', mobile: '', gender: '', address: '', aadhaar: '', pan: '', aicteId: '', jntuUid: '', dob: '', doj: ''
    });
    setEditMode(false);
    setCurrentId(null);
    setAvailableHods([]);
  };

  const openAddModal = () => {
    resetForm();
    setShowPassword(false);
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
      teachingYear: emp.teachingYear || '',
      password: '', // Keep empty unless changing
      designation: emp.designation || '',
      mobile: emp.mobile || '',
      gender: emp.gender || '',
      address: emp.address || '',
      aadhaar: emp.aadhaar || '',
      pan: emp.pan || '',
      aicteId: emp.aicteId || '',
      jntuUid: emp.jntuUid || '',
      hodId: emp.hodId || '',
      dob: formatDate(emp.dob),
      doj: formatDate(emp.doj)
    });
    setCurrentId(emp.employeeId);
    setEditMode(true);
    setShowPassword(false);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // 1. Email Validation
    const emailParts = formData.email.split('@');
    if (emailParts.length !== 2) return notify("Email must contain exactly one @", "warning");
    
    const [localPart, domain] = emailParts;
    if (!localPart) return notify("Email must have characters before @", "warning");
    if (!domain) return notify("Email must have a domain after @", "warning");
    if (formData.email.includes(" ")) return notify("Email cannot contain spaces", "warning");

    // Local part allowed chars: a-z A-Z 0-9 . _ % + -
    if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
      return notify("Invalid characters in email local part", "warning");
    }

    if (!domain.includes(".")) return notify("Domain must contain at least one dot (.)", "warning");
    if (domain.startsWith(".") || domain.endsWith(".")) return notify("Domain cannot start or end with a dot (.)", "warning");

    // Domain allowed chars: a-z A-Z 0-9 - .
    if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
      return notify("Invalid characters in email domain", "warning");
    }

    // 2. Mobile Validation: Exactly 10 digits, numbers only
    if (!/^\d{10}$/.test(formData.mobile)) {
      return notify("Mobile number must contain exactly 10 digits", "warning");
    }

    // 3. Aadhaar Validation: Exactly 12 digits, numbers only
    if (!/^\d{12}$/.test(formData.aadhaar)) {
      return notify("Aadhaar number must contain exactly 12 digits", "warning");
    }

    // 4. PAN Validation: Exactly 10 alphanumeric characters
    if (!/^[a-zA-Z0-9]{10}$/.test(formData.pan)) {
      return notify("PAN number must contain exactly 10 alphanumeric characters", "warning");
    }
    
    // For Edit, remove empty password
    const payload = { ...formData };
    if (editMode && !payload.password) {
      delete payload.password;
    }

    if (!payload.aicteId || payload.aicteId.trim() === '') {
      payload.aicteId = 'NA';
    }
    if (!payload.jntuUid || payload.jntuUid.trim() === '') {
      payload.jntuUid = 'NA';
    }

    setIsSubmitting(true);
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
        notify(data.message, 'success');
        setShowModal(false);
        fetchEmployees();
      } else {
        notify(data.message || 'Error saving employee', 'error');
      }
    } catch (err) {
      notify('Server connection failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm('Are you sure you want to delete this employee? This cannot be undone.', {
      title: 'Confirm Deletion',
      confirmLabel: 'Delete',
      danger: true
    });
    if (!confirmed) return;
    
    try {
      const res = await apiFetch(`http://localhost:5000/api/admin/employees/${id}`, { method: 'DELETE' });
      const data = await res.json();
      
      if (res.ok) {
        notify(data.message, 'success');
        fetchEmployees();
      } else {
        notify(data.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      notify('Server error during deletion', 'error');
    }
  };

  return (
    <div style={styles.container}>


      <div style={styles.header(isMobile)}>
        <h2 style={styles.title}>Employee Management</h2>
        <div style={styles.headerActions(isMobile)}>
           <div style={styles.searchWrapper(isMobile)}>
              <Search size={18} style={styles.searchIcon} />
              <input 
                type="text" 
                placeholder="Search by name, ID, dept..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
           </div>
           <button onClick={openAddModal} style={styles.addButton(isMobile)}>
             <Plus size={16} /> Add Employee
           </button>
        </div>
      </div>

      <div style={styles.card}>
        {loading ? (
          <p style={{padding: '20px', color: '#64748b'}}>Loading employees...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                  <tr style={styles.trHeading}>
                    <th style={styles.th(isMobile)}>ID</th>
                    <th style={styles.th(isMobile)}>Name</th>
                    <th style={styles.th(isMobile)}>Year</th>
                    <th style={styles.th(isMobile)}>HOD</th>
                    <th style={styles.th(isMobile)}>Dept</th>
                    <th style={styles.th(isMobile)}>Email</th>
                    <th style={styles.th(isMobile)}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map(emp => (
                    <tr key={emp._id} style={styles.tr}>
                      <td style={styles.td(isMobile)}><strong>{emp.employeeId}</strong></td>
                      <td style={styles.td(isMobile)}>{emp.firstName} {emp.lastName}</td>
                      <td style={styles.td(isMobile)}>
                        <span style={{
                          padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold',
                          background: '#f0fdf4',
                          color: '#10b981'
                        }}>
                          {emp.teachingYear || 'N/A'}
                        </span>
                      </td>
                      <td style={styles.td(isMobile)}>
                        <span style={{ color: '#64748b', fontSize: '12px' }}>{emp.hodId || 'Not Assigned'}</span>
                      </td>
                      <td style={styles.td(isMobile)}>{emp.department || '-'}</td>
                      <td style={styles.td(isMobile)}>{emp.email || '-'}</td>
                      <td style={styles.td(isMobile)}>
                      <div style={styles.actionBlock}>
                        <button onClick={() => openEditModal(emp)} style={styles.iconBtnEdit} title="Edit"><Edit2 size={16} /></button>
                        <button onClick={() => handleDelete(emp.employeeId)} style={styles.iconBtnDel} title="Delete"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEmployees.length === 0 && (
              <p style={{padding: '20px', textAlign: 'center', color: '#94a3b8'}}>
                {searchQuery ? `No employees matching "${searchQuery}"` : 'No employees found.'}
              </p>
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
              <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: '16px' } : styles.formGrid}>
                {/* Row 1: ID & DOB */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Employee ID *</label>
                  <input required name="employeeId" value={formData.employeeId} onChange={handleInputChange} disabled={editMode} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date of Birth *</label>
                  <input required type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={styles.input} />
                </div>

                {/* Row 2: Names Together */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>First Name *</label>
                  <input required name="firstName" value={formData.firstName} onChange={handleInputChange} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Last Name *</label>
                  <input required name="lastName" value={formData.lastName} onChange={handleInputChange} style={styles.input} />
                </div>

                {/* Row 3: Joining & Contact */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Date of Joining *</label>
                  <input required type="date" name="doj" value={formData.doj} onChange={handleInputChange} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Mobile *</label>
                  <input required name="mobile" value={formData.mobile} onChange={handleInputChange} style={styles.input} />
                </div>

                {/* Row 4: Email & Dept */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Email *</label>
                  <input required type="email" name="email" value={formData.email} onChange={handleInputChange} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Department *</label>
                  <select required name="department" value={formData.department} onChange={handleInputChange} style={styles.input}>
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept._id} value={dept.name}>{dept.name}</option>
                    ))}
                  </select>
                </div>

                {/* Row 5: Prof Details */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Designation *</label>
                  <select required name="designation" value={formData.designation} onChange={handleInputChange} style={styles.input}>
                    <option value="">Select Designation</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Teaching Year *</label>
                  <select required name="teachingYear" value={formData.teachingYear} onChange={handleInputChange} style={styles.input}>
                    <option value="">Select Year</option>
                    <option value="1st yr">1st yr</option>
                    <option value="2nd yr">2nd yr</option>
                    <option value="3rd yr">3rd yr</option>
                    <option value="4th yr">4th yr</option>
                  </select>
                </div>

                {/* Row 6: Gender & Password */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Gender *</label>
                  <select required name="gender" value={formData.gender} onChange={handleInputChange} style={styles.input}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>{editMode ? 'Reset Password (optional)' : 'Temporary Password *'}</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      required={!editMode} 
                      name="password" 
                      type={showPassword ? "text" : "password"} 
                      value={formData.password} 
                      onChange={handleInputChange} 
                      autoComplete="new-password" 
                      style={{ ...styles.input, width: '100%', boxSizing: 'border-box' }} 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Row 7: Gov IDs */}
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Aadhaar Number *</label>
                  <input required name="aadhaar" value={formData.aadhaar} onChange={handleInputChange} style={styles.input} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>PAN Number *</label>
                  <input required name="pan" value={formData.pan} onChange={handleInputChange} style={styles.input} />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>JNTU Number</label>
                  <input name="jntuUid" value={formData.jntuUid} onChange={handleInputChange} style={styles.input} />
                </div>

                {/* HOD Selection */}
                <div style={{ ...styles.inputGroup, ...(isMobile ? {} : { gridColumn: 'span 2' }) }}>
                  <label style={styles.label}>Assigned HOD (For Leave Permissions) *</label>
                  <select required name="hodId" value={formData.hodId} onChange={handleInputChange} style={styles.input}>
                    <option value="">{hodLoading ? 'Loading HODs...' : 'Select HOD'}</option>
                    {availableHods.map(hod => (
                      <option key={hod.employeeId} value={hod.employeeId}>
                        {hod.firstName} {hod.lastName} ({hod.employeeId}) - {hod.department} {Array.isArray(hod.teachingYear) ? hod.teachingYear.join(', ') : hod.teachingYear}
                      </option>
                    ))}
                  </select>
                  {!hodLoading && availableHods.length === 0 && formData.department && formData.teachingYear && (
                    <span style={{ fontSize: '11px', color: '#ef4444' }}>* No HODs found for this Dept/Year. Please create an HOD first.</span>
                  )}
                </div>

                {/* Row 9: Address */}
                <div style={{ ...styles.inputGroup, ...(isMobile ? {} : { gridColumn: 'span 2' }) }}>
                  <label style={styles.label}>Address *</label>
                  <input required name="address" value={formData.address} onChange={handleInputChange} style={styles.input} />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnCancel}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ ...styles.btnSave, opacity: isSubmitting ? 0.7 : 1 }}>
                  {isSubmitting ? 'Saving...' : editMode ? 'Save Changes' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1100px', margin: '0 auto', paddingBottom: '40px' },
  header: isMobile => ({ 
    display: 'flex', 
    flexDirection: isMobile ? 'column' : 'row',
    justifyContent: 'space-between', 
    alignItems: isMobile ? 'flex-start' : 'center', 
    marginBottom: '20px',
    gap: isMobile ? '15px' : '0'
  }),
  title: { fontSize: '24px', color: '#1e293b', margin: 0, fontWeight: '700' },
  addButton: isMobile => ({ 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: '8px', 
    background: '#F17F08', 
    color: 'white', 
    border: 'none', 
    padding: '10px 16px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: 'bold',
    width: isMobile ? '100%' : 'auto'
  }),
  
  headerActions: isMobile => ({ 
    display: 'flex', 
    flexDirection: isMobile ? 'column' : 'row',
    alignItems: 'center', 
    gap: '15px',
    width: isMobile ? '100%' : 'auto'
  }),
  searchWrapper: isMobile => ({ 
    position: 'relative', 
    width: isMobile ? '100%' : '280px' 
  }),
  searchIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' },
  searchInput: { width: '100%', padding: '10px 15px 10px 40px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', transition: 'border-color 0.2s', color: '#1e293b' },
  
  card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: isMobile => ({ padding: isMobile ? '12px 10px' : '14px 20px', color: '#64748b', fontWeight: '600' }),
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: isMobile => ({ padding: isMobile ? '12px 10px' : '14px 20px', color: '#334155' }),
  
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


};

export default AdminEmployees;
