import { apiFetch } from "../../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Plus, Trash2, CheckCircle, XCircle, Upload, FileText, X } from 'lucide-react';

const ApplyLeave = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  
  const [formData, setFormData] = useState({
    leaveType: 'Standard', startDate: '', endDate: '', reason: ''
  });
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('FN'); // 'FN' or 'AN'
  const [isSpecialLeave, setIsSpecialLeave] = useState(false);
  const [document, setDocument] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [adjustments, setAdjustments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // NEW STATES: Balance, Late Marks
  const [leaveBalance, setLeaveBalance] = useState({ cl: 0, ccl: 0, al: 0 });
  const [lateMarks, setLateMarks] = useState([]);

  // --- DATE CONSTRAINTS ---
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    const today = new Date();
    // Assuming college timings complete at 16:00 (4 PM)
    if (today.getHours() >= 16) {
      today.setDate(today.getDate() + 1);
    }
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setMinDate(`${yyyy}-${mm}-${dd}`);
  }, []);



  const fetchLeaveTypes = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/leave-types');
      if (res.ok) {
        const types = await res.json();
        setLeaveTypes(types);
      }
    } catch(err) {
      console.error("Failed to fetch leave types");
    }
  };

  const fetchUserData = async () => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/user/${user.employeeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.leaveBalance) setLeaveBalance(data.leaveBalance);
      }
      
      const resLM = await apiFetch(`http://localhost:5000/api/late-marks/${user.employeeId}`);
      if (resLM.ok) setLateMarks(await resLM.json());
    } catch(err) {
      console.error("Failed to fetch user extra data");
    }
  };

  useEffect(() => { 
    fetchLeaveTypes();
    fetchUserData();
  }, [user.employeeId]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (isHalfDay && name === 'startDate') {
        updated.endDate = value;
      }
      return updated;
    });
  };

  const handleHalfDayToggle = (e) => {
    const checked = e.target.checked;
    setIsHalfDay(checked);
    if (checked && formData.startDate) {
      setFormData(prev => ({ ...prev, endDate: prev.startDate }));
    }
  };
  
  const handleSpecialToggle = (e) => {
    const checked = e.target.checked;
    setIsSpecialLeave(checked);
    setFormData(prev => ({ ...prev, leaveType: checked ? 'AL' : 'Standard' }));
  };

  const addAdjustment = () => setAdjustments([...adjustments, { date: '', period: '', yearAndSection: '', adjustedWith: '' }]);
  
  const updateAdjustment = (index, field, value) => {
    const newAdj = [...adjustments];
    newAdj[index][field] = value;
    setAdjustments(newAdj);
  };

  const removeAdjustment = (index) => setAdjustments(adjustments.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.startDate < minDate) {
      notify("Cannot apply leave for past dates or after 4 PM today.", "error");
      return;
    }

    if (formData.endDate < formData.startDate) {
      notify("End date cannot be earlier than start date.", "error");
      return;
    }

    if (formData.leaveType === 'AL' && !document) {
      notify("Supporting document is mandatory for Academic Leave (AL).", "error");
      return;
    }

    // --- Dynamic Balance Validation ---
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    let requestedDays = 0;

    if (isHalfDay) {
      requestedDays = 0.5;
    } else {
      // Basic day count
      requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    }

    const leaveTypeKey = formData.leaveType.toLowerCase();
    const availableBalance = leaveBalance[leaveTypeKey] ?? 0;

    // Strict validation for custom types (anything except OD, and if not Standard overflow types)
    // Actually, following user's "any leave type" - usually non-standard ones should be strict.
    const isCustomType = !['STANDARD', 'OD', 'AL', 'CL', 'CCL'].includes(formData.leaveType.toUpperCase());

    if (isCustomType && requestedDays > availableBalance) {
      notify(`Insufficient balance for ${formData.leaveType}. Available: ${availableBalance}, Requested: ${requestedDays}`, "error");
      return;
    }

    const payload = new FormData();
    payload.append('employeeId', user.employeeId);
    payload.append('leaveType', formData.leaveType);
    payload.append('startDate', formData.startDate);
    payload.append('endDate', formData.endDate);
    payload.append('reason', formData.reason);
    payload.append('isHalfDay', isHalfDay);
    if (isHalfDay) {
      payload.append('halfDayType', halfDayType);
    }
    payload.append('adjustments', JSON.stringify(adjustments));
    if (document) {
      payload.append('document', document);
    }

    try {
      const token = localStorage.getItem('token');
      
      const res = await apiFetch(`http://localhost:5000/api/leave/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });
      
      const data = await res.json();
      if (res.ok) {
        notify("Leave Applied Successfully!", "success");
        setFormData({ leaveType: isSpecialLeave ? 'AL' : 'Standard', startDate: '', endDate: '', reason: '' }); 
        setIsHalfDay(false);
        setDocument(null);
        setAdjustments([]);
        fetchUserData(); // Refresh balances
      } else {
        notify(data.message || "Failed to apply.", "error");
      }
    } catch (err) { 
        notify("Network error. Server might be down.", "error");
    }
  };

  return (
    <div style={styles.container}>


      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Apply for Leave</h1>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.formCard}>
          <div style={styles.formHeader}>
            <div style={styles.balanceSection}>
              {leaveTypes.map(type => {
                const code = type.code.toUpperCase();
                const balKey = type.code.toLowerCase();
                const balance = leaveBalance[balKey] ?? 0;
                return (
                  <div key={type._id} style={styles.balanceBadge}>
                    {code}: <span style={{ color: '#F17F08' }}>{balance}</span>
                  </div>
                );
              })}
              {/* If leaveBalance has something not in leaveTypes (like LOP if not defined) */}
              {Object.entries(leaveBalance)
                .filter(([k]) => k.toLowerCase() === 'lop' && !leaveTypes.some(t => t.code.toLowerCase() === 'lop'))
                .map(([k, v]) => (
                  <div key={k} style={styles.balanceBadge}>
                    {k.toUpperCase()}: <span style={{ color: '#F17F08' }}>{v}</span>
                  </div>
                ))
              }
            </div>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.specialLeaveGroup}>
              <div style={styles.checkboxWrapper}>
                <input 
                  type="checkbox" 
                  id="specialLeaveCheck" 
                  checked={isSpecialLeave} 
                  onChange={handleSpecialToggle} 
                  style={styles.checkbox} 
                />
                <label htmlFor="specialLeaveCheck" style={styles.label}>
                  Is this a Special Leave (AL / OD)?
                </label>
              </div>
              
              {isSpecialLeave && (
                <div style={styles.specialFields}>
                  <select name="leaveType" value={formData.leaveType} onChange={handleChange} style={styles.input} required>
                    <option value="">-- Choose Leave Type --</option>
                    {/* Include Hardcoded OD as it's a core institutional leave type */}
                    <option value="OD">On Duty (OD)</option>
                    
                    {leaveTypes
                      .filter(type => !['CL', 'CCL', 'LOP'].includes(type.code.toUpperCase()))
                      .map(type => (
                      <option key={type._id} value={type.code.toUpperCase()}>
                        {type.name} ({type.code.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  
                  <div style={styles.uploaderSection}>
                    <label style={styles.fieldLabel}>Upload Supporting Document ({formData.leaveType === 'AL' || formData.leaveType === 'OD' ? 'Required' : 'Optional'})</label>
                    <div 
                      style={{
                        ...styles.dropzone,
                        borderColor: isDragging ? '#F17F08' : '#cbd5e1',
                        background: isDragging ? '#fff7ed' : '#f8fafc'
                      }}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragging(false);
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          setDocument(e.dataTransfer.files[0]);
                        }
                      }}
                      onClick={() => fileInputRef.current.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={(e) => setDocument(e.target.files[0])} 
                        style={{ display: 'none' }}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                      {!document ? (
                        <div style={styles.dropzoneContent}>
                          <Upload size={24} color="#64748b" />
                          <span>Click or Drag file to upload</span>
                        </div>
                      ) : (
                        <div style={styles.fileSelected}>
                          <FileText size={20} color="#F17F08" />
                          <span style={styles.fileName}>{document.name}</span>
                          <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); setDocument(null); }}
                            style={styles.removeFileBtn}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={styles.row}>
              <div style={styles.group}>
                <label style={styles.label}>From</label>
                <input type="date" name="startDate" value={formData.startDate} min={minDate} onChange={handleChange} required style={styles.input} />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>To</label>
                <input type="date" name="endDate" value={formData.endDate} min={formData.startDate || minDate} onChange={handleChange} required style={{...styles.input, backgroundColor: isHalfDay ? '#f1f5f9' : 'white'}} readOnly={isHalfDay} />
              </div>
            </div>

            <div style={styles.halfDaySection}>
              <div style={styles.checkboxWrapper}>
                <input 
                  type="checkbox" 
                  id="halfDayCheck" 
                  checked={isHalfDay} 
                  onChange={handleHalfDayToggle} 
                  style={styles.checkbox} 
                />
                <label htmlFor="halfDayCheck" style={styles.labelSmall}>
                  Half-Day
                </label>
              </div>

              {isHalfDay && (
                <div style={styles.halfDayToggle}>
                  <button 
                    type="button"
                    onClick={() => setHalfDayType('FN')}
                    style={{
                      ...styles.toggleBtn,
                      backgroundColor: halfDayType === 'FN' ? 'white' : 'transparent',
                      color: halfDayType === 'FN' ? '#F17F08' : '#64748b',
                    }}
                  >
                    Forenoon (FN)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setHalfDayType('AN')}
                    style={{
                      ...styles.toggleBtn,
                      backgroundColor: halfDayType === 'AN' ? 'white' : 'transparent',
                      color: halfDayType === 'AN' ? '#F17F08' : '#64748b',
                    }}
                  >
                    Afternoon (AN)
                  </button>
                </div>
              )}
            </div>

            <div style={styles.group}>
              <label style={styles.label}>Reason</label>
              <textarea name="reason" rows="3" value={formData.reason} onChange={handleChange} required style={styles.input} placeholder="Enter the reason for your leave..."></textarea>
            </div>

            <div style={styles.adjustmentSection}>
              <div style={styles.adjHeader}>
                <h4 style={styles.adjTitle}>Class Adjustments</h4>
                <button type="button" onClick={addAdjustment} style={styles.addBtn}><Plus size={14} /> Add Adjustment</button>
              </div>
              {adjustments.map((adj, index) => (
                <div key={index} style={styles.adjRow}>
                  <input required type="date" value={adj.date} onChange={(e) => updateAdjustment(index, 'date', e.target.value)} style={styles.smallInput} />
                  <select required value={adj.period} onChange={(e) => updateAdjustment(index, 'period', e.target.value)} style={styles.smallInput}>
                    <option value="">-- Period --</option>
                    <option value="1st Hour">1st Hour</option><option value="2nd Hour">2nd Hour</option><option value="3rd Hour">3rd Hour</option>
                    <option value="4th Hour">4th Hour</option><option value="5th Hour">5th Hour</option><option value="6th Hour">6th Hour</option>
                    <option value="7th Hour">7th Hour</option>
                  </select>
                  <input required type="text" placeholder="Yr/Sec" value={adj.yearAndSection} onChange={(e) => updateAdjustment(index, 'yearAndSection', e.target.value)} style={styles.smallInput} />
                  <input required type="text" placeholder="Sub ID" value={adj.adjustedWith} onChange={(e) => updateAdjustment(index, 'adjustedWith', e.target.value)} style={styles.smallInput} />
                  <button type="button" onClick={() => removeAdjustment(index)} style={styles.delBtn}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <button type="submit" style={styles.submitBtn}>Submit Request</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: window.innerWidth <= 768 ? '15px' : '30px', textAlign: 'center' },
  pageTitle: { fontSize: window.innerWidth <= 768 ? '22px' : '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  


  mainLayout: { display: 'flex', justifyContent: 'center' },
  formCard: { 
    width: '100%', background: 'white', padding: window.innerWidth <= 768 ? '15px' : '30px', borderRadius: '16px', 
    border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' 
  },
  formHeader: { marginBottom: '25px' },
  balanceSection: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  balanceBadge: { 
    background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', 
    fontSize: '12px', fontWeight: '700', color: '#334155', border: '1px solid #e2e8f0' 
  },

  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  specialLeaveGroup: { 
    background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' 
  },
  checkboxWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
  checkbox: { cursor: 'pointer', width: '18px', height: '18px', accentColor: '#F17F08' },
  label: { fontSize: '14px', fontWeight: '600', color: '#1e293b', cursor: 'pointer' },
  labelSmall: { fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' },
  
  specialFields: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' },
  uploaderSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '13px', fontWeight: '600', color: '#64748b' },

  row: { display: 'flex', gap: '15px', flexDirection: window.innerWidth <= 768 ? 'column' : 'row' },
  group: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { 
    padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', 
    outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' 
  },
  
  halfDaySection: { display: 'flex', alignItems: 'center', gap: '15px', flexDirection: window.innerWidth <= 768 ? 'column' : 'row', alignItems: 'flex-start' },
  halfDayToggle: { 
    display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' 
  },
  toggleBtn: { 
    padding: '6px 15px', fontSize: '12px', fontWeight: '700', border: 'none', 
    borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' 
  },

  adjustmentSection: { 
    background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' 
  },
  adjHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  adjTitle: { margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' },
  addBtn: { 
    background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', 
    borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600'
  },
  adjRow: { display: 'flex', gap: '10px', marginBottom: '10px', flexDirection: window.innerWidth <= 768 ? 'column' : 'row' },
  smallInput: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' },
  delBtn: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer' },

  submitBtn: { 
    padding: '16px', background: '#F17F08', color: 'white', border: 'none', 
    borderRadius: '12px', fontWeight: '800', fontSize: '16px', 
    cursor: 'pointer', transition: 'transform 0.2s'
  },

  dropzone: {
    border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '20px', 
    textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', 
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px'
  },
  dropzoneContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' },
  fileSelected: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0' },
  fileName: { fontSize: '13px', color: '#1e293b', fontWeight: '500', flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  removeFileBtn: { background: '#f1f5f9', border: 'none', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }
};

export default ApplyLeave;
