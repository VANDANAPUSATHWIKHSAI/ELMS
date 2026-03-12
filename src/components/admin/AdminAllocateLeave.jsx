import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { CheckCircle, XCircle } from 'lucide-react';

const AdminAllocateLeave = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [leaveTypes, setLeaveTypes] = useState([]);

  const [formData, setFormData] = useState({
    employeeId: '',
    leaveType: 'CCL', // Default to CCL typically given manually
    amount: '',
    reason: ''
  });

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await apiFetch('http://localhost:5000/api/admin/employees');
        if (res.ok) setEmployees(await res.json());
      } catch (err) {
        showToast('Failed to load employee list', 'error');
      }
    };
    const fetchLeaveTypes = async () => {
        try {
          const res = await apiFetch('http://localhost:5000/api/leave-types');
          if (res.ok) setLeaveTypes(await res.json());
        } catch (err) {
          console.error("Failed to fetch leave types", err);
        }
    };
    fetchEmployees();
    fetchLeaveTypes();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.employeeId) return showToast("Select an employee", "error");
    if (!formData.amount || Number(formData.amount) === 0) return showToast("Enter a non-zero valid amount", "error");

    setLoading(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/admin/leaves/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();

      if (res.ok) {
        showToast(data.message, 'success');
        setFormData({ ...formData, amount: '', reason: '', employeeId: '' });
        setSearchTerm('');
      } else {
        showToast(data.message || 'Failed to allocate', 'error');
      }
    } catch (err) {
      showToast('Network error while allocating', 'error');
    } finally {
      setLoading(false);
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
        <h2 style={styles.title}>Manual Leave Allocation</h2>
        <p style={{color: '#64748b'}}>Directly credit (e.g. CCL, manual CL limits) or debit (e.g. LOP penalties) leaves for an employee account.</p>
      </div>

      <div style={styles.card}>
        <form onSubmit={handleSubmit} style={styles.form}>
            
          <div style={styles.inputGroup}>
            <label style={styles.label}>Select Employee *</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setFormData({ ...formData, employeeId: '' }); // Clear selection if user types
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay to allow click
                required={!formData.employeeId}
                style={styles.input}
              />
              {isDropdownOpen && searchTerm.length > 0 && (
                <div style={styles.dropdownList}>
                  {employees
                    .filter(emp => 
                      `${emp.firstName} ${emp.lastName} ${emp.employeeId}`.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map(emp => (
                      <div 
                        key={emp.employeeId} 
                        style={styles.dropdownItem}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur from firing before selection
                          setSearchTerm(`${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
                          setFormData({ ...formData, employeeId: emp.employeeId });
                          setIsDropdownOpen(false);
                        }}
                      >
                        {emp.firstName} {emp.lastName} ({emp.employeeId}) - {emp.department || 'No Dept'}
                      </div>
                    ))}
                  {employees.filter(emp => `${emp.firstName} ${emp.lastName} ${emp.employeeId}`.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <div style={{...styles.dropdownItem, color: '#94a3b8', cursor: 'default'}}>No employees found</div>
                  )}
                </div>
              )}
            </div>
            {formData.employeeId && (
              <span style={{fontSize: '12px', color: '#16a34a', marginTop: '4px'}}>
                <CheckCircle size={12} style={{marginRight: '4px', verticalAlign: 'middle'}}/>
                Selected: {formData.employeeId}
              </span>
            )}
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Leave Type *</label>
              <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} required style={styles.input}>
                {leaveTypes
                  .filter(type => ['CL', 'CCL'].includes(type.code.toUpperCase()))
                  .map(type => (
                    <option key={type._id} value={type.code.toUpperCase()}>
                      {type.name} ({type.code.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Amount (Days) *</label>
              <input 
                type="number" step="0.5" 
                name="amount" value={formData.amount} 
                onChange={handleInputChange} required 
                style={styles.input} 
                placeholder="e.g. 1.0 or -2.0" 
              />
              <span style={{fontSize: '11px', color: '#64748b', marginTop: '4px'}}>
                 Use negative numbers to deduct leaves.
              </span>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Reason / Reference</label>
            <textarea 
              name="reason" value={formData.reason} 
              onChange={handleInputChange} rows="2" 
              style={styles.input} placeholder="e.g. Weekend duty on 24-02-2026"
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
             {loading ? 'Processing...' : 'Apply Allocation'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '800px', margin: '0 auto' },
  header: { marginBottom: '20px' },
  title: { fontSize: '24px', color: '#1e293b', margin: '0 0 8px 0', fontWeight: '700' },
  
  card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', padding: '30px' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#475569' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' },
  
  submitBtn: { padding: '14px', background: '#F17F08', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '15px' },
  toast: { position: 'fixed', bottom: '30px', left: '50%', transform: 'translateX(-50%)', color: 'white', padding: '12px 24px', borderRadius: '50px', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', zIndex: 2000, fontWeight: '500', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', animation: 'fadeInUp 0.3s ease-out' }
};

export default AdminAllocateLeave;
