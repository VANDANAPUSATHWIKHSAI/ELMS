import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Clock, Plus, AlertCircle } from 'lucide-react';

const AdminLateMarksManager = () => {
  const [lateMarks, setLateMarks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    reason: 'Late Arrival'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch late marks
      const resMarks = await apiFetch('http://localhost:5000/api/admin/late-marks/all');
      if (resMarks.ok) setLateMarks(await resMarks.json());

      // Fetch employees for dropdown
      const resEmps = await apiFetch('http://localhost:5000/api/admin/employees');
      if (resEmps.ok) setEmployees(await resEmps.json());

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    try {
      const res = await apiFetch('http://localhost:5000/api/admin/late-marks', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ loading: false, success: "Late mark added successfully", error: null });
        fetchData(); // Refresh table
        setFormData({ ...formData, employeeId: '', reason: 'Late Arrival' });
        setSearchTerm('');
      } else {
        setStatus({ loading: false, success: null, error: data.message || "Failed to add late mark" });
      }
    } catch (err) {
      setStatus({ loading: false, success: null, error: "Server error" });
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Late Marks Manager</h1>
          <p style={styles.subtitle}>Track and assign late arrivals to employees.</p>
        </div>
      </header>

      <div style={styles.grid}>
        {/* ADD FORM */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Clock size={20} color="#F17F08" />
            <h3 style={styles.cardTitle}>Add Late Mark</h3>
          </div>
          
          {status.success && <div style={styles.successMsg}>{status.success}</div>}
          {status.error && <div style={styles.errorMsg}>{status.error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Employee</label>
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
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
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
                            e.preventDefault(); // Prevent blur
                            setSearchTerm(`${emp.firstName} ${emp.lastName} (${emp.employeeId})`);
                            setFormData({ ...formData, employeeId: emp.employeeId });
                            setIsDropdownOpen(false);
                          }}
                        >
                          {emp.firstName} {emp.lastName} ({emp.employeeId})
                        </div>
                      ))}
                    {employees.filter(emp => `${emp.firstName} ${emp.lastName} ${emp.employeeId}`.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                      <div style={{...styles.dropdownItem, color: '#94a3b8', cursor: 'default'}}>No employees found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <input 
                type="date" 
                style={styles.input} 
                required 
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Reason / Note</label>
              <input 
                type="text" 
                style={styles.input} 
                required 
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
              />
            </div>

            <button type="submit" disabled={status.loading} style={styles.submitBtn}>
              {status.loading ? 'Adding...' : <span style={{display:'flex', alignItems:'center', gap:'8px'}}><Plus size={18}/> Assign Late Mark</span>}
            </button>
          </form>
        </div>

        {/* LATE MARKS TABLE */}
        <div style={{...styles.card, flex: 2}}>
          <div style={styles.cardHeader}>
            <AlertCircle size={20} color="#F17F08" />
            <h3 style={styles.cardTitle}>Recent Late Marks</h3>
          </div>
          
          {loading ? (
             <p style={{padding: '20px', color: '#64748b', textAlign: 'center'}}>Loading data...</p>
          ) : lateMarks.length === 0 ? (
             <p style={{padding: '20px', color: '#64748b', textAlign: 'center'}}>No late marks recorded yet.</p>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.trHeading}>
                    <th style={styles.th}>Employee</th>
                    <th style={styles.th}>Date</th>
                    <th style={styles.th}>Reason</th>
                    <th style={styles.th}>Added By</th>
                  </tr>
                </thead>
                <tbody>
                  {lateMarks.map(mark => (
                    <tr key={mark._id} style={styles.tr}>
                      <td style={styles.td}>
                        <strong>{mark.employeeName}</strong>
                        <div style={{fontSize:'12px', color:'#64748b'}}>{mark.employeeId}</div>
                      </td>
                      <td style={styles.td}>{formatDate(mark.date)}</td>
                      <td style={styles.td}>{mark.reason}</td>
                      <td style={styles.td}><span style={styles.badge}>{mark.addedBy}</span></td>
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
  dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155' },
  submitBtn: { background: '#F17F08', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center' },
  successMsg: { background: '#dcfce7', color: '#16a34a', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '500' },
  errorMsg: { background: '#fee2e2', color: '#dc2626', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', fontWeight: '500' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '14px 20px', color: '#334155' },
  badge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold' }
};

export default AdminLateMarksManager;
