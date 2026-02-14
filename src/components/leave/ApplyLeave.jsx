import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Plus, Trash2, Clock, CheckCircle, XCircle } from 'lucide-react';

const ApplyLeave = () => {
  const { user } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    leaveType: 'CL', startDate: '', endDate: '', reason: ''
  });
  const [adjustments, setAdjustments] = useState([]);

  // --- FETCH HISTORY ---
  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`http://localhost:5000/api/leave/history/${user.employeeId}`);
      const data = await res.json();
      if (res.ok) setHistory(data);
    } catch (err) { console.error("Failed to load history"); } 
    finally { setLoadingHistory(false); }
  };

  useEffect(() => { fetchHistory(); }, [user.employeeId]);

  // --- HANDLERS ---
  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const addAdjustment = () => setAdjustments([...adjustments, { date: '', period: '', yearAndSection: '', adjustedWith: '' }]);
  
  const updateAdjustment = (index, field, value) => {
    const newAdj = [...adjustments];
    newAdj[index][field] = value;
    setAdjustments(newAdj);
  };

  const removeAdjustment = (index) => setAdjustments(adjustments.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { employeeId: user.employeeId, ...formData, adjustments };

    try {
      const res = await fetch('http://localhost:5000/api/leave/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok) {
        alert("Leave Applied Successfully!");
        setFormData({ leaveType: 'CL', startDate: '', endDate: '', reason: '' }); 
        setAdjustments([]);
        fetchHistory(); 
      } else {
        alert("Error: " + data.message);
      }
    } catch (err) { alert("Server Error"); }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

  const StatusBadge = ({ status }) => {
    let color = '#f59e0b';
    let icon = <Clock size={14} />;
    
    if (status === 'Approved' || status === 'Auto-Approved') { color = '#10b981'; icon = <CheckCircle size={14} />; }
    else if (status === 'Rejected') { color = '#ef4444'; icon = <XCircle size={14} />; }

    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: color, fontWeight: 'bold', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: `${color}20` }}>
        {icon} {status}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Leaves Management</h1>
      </header>

      <div style={styles.splitLayout}>
        
        {/* LEFT: APPLY FORM */}
        <div style={styles.formCard}>
          <h3 style={styles.sectionTitle}>Apply for Leave</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.group}>
              <label style={styles.label}>Leave Type</label>
              <select name="leaveType" value={formData.leaveType} onChange={handleChange} style={styles.input}>
                <option value="CL">Casual Leave (CL)</option>
                <option value="CCL">Compensatory Leave (CCL)</option>
                <option value="AL">Academic Leave (AL)</option>
                <option value="OD">On Duty (OD)</option>
                <option value="LoP">Loss of Pay (LoP)</option>
              </select>
            </div>

            <div style={styles.row}>
              <div style={styles.group}>
                <label style={styles.label}>From</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>To</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required style={styles.input} />
              </div>
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Reason</label>
              <textarea name="reason" rows="2" value={formData.reason} onChange={handleChange} required style={styles.input} placeholder="Reason..."></textarea>
            </div>

            <div style={styles.adjustmentSection}>
              <div style={styles.adjHeader}>
                <h4 style={{margin:0, fontSize:'14px', color:'#334155'}}>Class Adjustments</h4>
                <button type="button" onClick={addAdjustment} style={styles.addBtn}><Plus size={14} /> Add</button>
              </div>
              {adjustments.map((adj, index) => (
                <div key={index} style={styles.adjRow}>
                  <input type="date" value={adj.date} onChange={(e) => updateAdjustment(index, 'date', e.target.value)} style={styles.smallInput} />
                  <input type="text" placeholder="Period" value={adj.period} onChange={(e) => updateAdjustment(index, 'period', e.target.value)} style={styles.smallInput} />
                  <input type="text" placeholder="Yr/Sec" value={adj.yearAndSection} onChange={(e) => updateAdjustment(index, 'yearAndSection', e.target.value)} style={styles.smallInput} />
                  <input type="text" placeholder="Sub ID" value={adj.adjustedWith} onChange={(e) => updateAdjustment(index, 'adjustedWith', e.target.value)} style={styles.smallInput} />
                  <button type="button" onClick={() => removeAdjustment(index)} style={styles.delBtn}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <button type="submit" style={styles.submitBtn}>Submit Request</button>
          </form>
        </div>

        {/* RIGHT: HISTORY TABLE */}
        <div style={styles.historyCard}>
          <h3 style={styles.sectionTitle}>Leave History</h3>
          <div style={styles.historyContainer}>
            {loadingHistory ? <p>Loading...</p> : (
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeader}>
                    <th style={styles.th}>Type</th>
                    <th style={styles.th}>Dates</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr><td colSpan="3" style={{...styles.td, textAlign:'center', color:'#94a3b8'}}>No history.</td></tr>
                  ) : (
                    history.map((leave) => (
                      <tr key={leave._id} style={styles.tableRow}>
                        <td style={styles.td}>
                          <strong>{leave.leaveType}</strong><br/>
                          <span style={{fontSize:'11px', color:'#64748b'}}>{leave.reason.substring(0,15)}...</span>
                        </td>
                        <td style={styles.td}>
                          {formatDate(leave.startDate)} <br/> 
                          <span style={{fontSize:'11px', color:'#64748b'}}>to {formatDate(leave.endDate)}</span>
                        </td>
                        <td style={styles.td}><StatusBadge status={leave.status} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

const styles = {
  // Container allows the Layout to control scrolling/sizing
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto' },
  header: { marginBottom: '20px' },
  pageTitle: { fontSize: '26px', color: '#1e293b', fontWeight: '700', margin: 0 },

  // SPLIT LAYOUT
  splitLayout: { display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap' },
  
  formCard: { flex: '1', minWidth: '350px', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  historyCard: { flex: '1', minWidth: '350px', background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', maxHeight: '80vh', overflowY: 'auto' },

  sectionTitle: { fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '20px', borderLeft: '4px solid #F17F08', paddingLeft: '10px' },

  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  row: { display: 'flex', gap: '15px' },
  group: { flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  submitBtn: { padding: '12px', background: '#F17F08', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' },

  adjustmentSection: { background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' },
  adjHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  addBtn: { background: '#10b981', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' },
  adjRow: { display: 'flex', gap: '8px', marginBottom: '8px' },
  smallInput: { flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', minWidth: '0' },
  delBtn: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', padding: '0 8px', cursor: 'pointer' },

  table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
  tableHeader: { textAlign: 'left', borderBottom: '2px solid #f1f5f9' },
  th: { padding: '10px', color: '#64748b', fontWeight: '600' },
  tableRow: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 10px', color: '#1e293b', verticalAlign: 'middle' }
};

export default ApplyLeave;