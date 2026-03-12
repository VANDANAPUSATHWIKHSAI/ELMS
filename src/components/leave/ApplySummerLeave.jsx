import { apiFetch } from "../../utils/api";
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Plus, Trash2, CheckCircle, XCircle, Upload, FileText, X } from 'lucide-react';

const ApplySummerLeave = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  
  const [formData, setFormData] = useState({
    leaveType: 'Summer Leave', startDate: '', endDate: '', reason: ''
  });
  const [isHalfDay, setIsHalfDay] = useState(false);
  const [halfDayType, setHalfDayType] = useState('FN'); // 'FN' or 'AN'
  const [isSpecialLeave, setIsSpecialLeave] = useState(true); // Always true for summer.
  const [document, setDocument] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [adjustments, setAdjustments] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);

  // NEW STATES: Balance, Late Marks
  const [leaveBalance, setLeaveBalance] = useState({ cl: 0, ccl: 0, al: 0 });
  const [lateMarks, setLateMarks] = useState([]);
  const [summerQuota, setSummerQuota] = useState(0);
  const [summerTaken, setSummerTaken] = useState(0);
  const [summerRemaining, setSummerRemaining] = useState(0);
  const [allHolidays, setAllHolidays] = useState([]);
  const [hasActiveRequest, setHasActiveRequest] = useState(false);
  const [activeStatus, setActiveStatus] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  const [summerConfig, setSummerConfig] = useState(null);
  const [minDate, setMinDate] = useState('');
  const [maxDate, setMaxDate] = useState('');

  const fetchConfig = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/admin/summer-config');
      if (res.ok) {
        const data = await res.json();
        setSummerConfig(data);
        
        // Update Dates based on config
        const today = new Date();
        if (today.getHours() >= 16) today.setDate(today.getDate() + 1);
        const yyyy = today.getFullYear();
        
        if (data.summerMonths && data.summerMonths.length > 0) {
          const firstMonth = Math.min(...data.summerMonths);
          const lastMonth = Math.max(...data.summerMonths);
          
          const startOfSummer = new Date(yyyy, firstMonth, 1);
          const endOfSummer = new Date(yyyy, lastMonth + 1, 0); // Last day of last month
          
          const todayStr = today.toISOString().split('T')[0];
          const startStr = startOfSummer.toISOString().split('T')[0];
          const endStr = endOfSummer.toISOString().split('T')[0];

          setMinDate(todayStr > startStr ? todayStr : startStr);
          setMaxDate(endStr);
        }
      }
    } catch (err) { console.error("Failed to fetch summer config", err); }
  };

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
      
      const resEligibility = await apiFetch(`http://localhost:5000/api/leave/summer-eligibility/${user.employeeId}`);
      if (resEligibility.ok) {
        const eligibility = await resEligibility.json();
        setSummerQuota(eligibility.quota);
        setHasActiveRequest(eligibility.hasApplied);
        if (eligibility.appliedDetails) {
            setActiveStatus(eligibility.appliedDetails.status);
        }
        
        // Also fetch taken days to show accurate remaining
        const resTaken = await apiFetch(`http://localhost:5000/api/leave/summer-taken/${user.employeeId}`);
        if (resTaken.ok) {
          const takenData = await resTaken.json();
          setSummerTaken(takenData.takenDays);
          setSummerRemaining(eligibility.quota - takenData.takenDays);
        } else {
          setSummerRemaining(eligibility.quota);
        }
      }
      
      const resLM = await apiFetch(`http://localhost:5000/api/late-marks/${user.employeeId}`);
      if (resLM.ok) setLateMarks(await resLM.json());

      const resH = await apiFetch(`http://localhost:5000/api/holidays`);
      if (resH.ok) setAllHolidays(await resH.json());
    } catch(err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => { 
    fetchConfig();
    fetchLeaveTypes();
    fetchUserData();
  }, [user.employeeId]);

  // --- HANDLERS ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate that the selected date falls within a configured summer month
    if ((name === 'startDate' || name === 'endDate') && value && summerConfig?.summerMonths?.length > 0) {
      const selectedMonth = new Date(value).getMonth(); // 0-indexed
      if (!summerConfig.summerMonths.includes(selectedMonth)) {
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const allowedMonths = summerConfig.summerMonths.map(m => monthNames[m]).join(', ');
        notify(`Please select a date within the configured summer months: ${allowedMonths}`, 'error');
        return; // Don't update the field
      }
    }

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

  const calculateSummerDays = (startStr, endStr) => {
    if (!startStr || !endStr) return 0;
    const start = new Date(startStr);
    const end = new Date(endStr);
    
    // Calculate total calendar days inclusive
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

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

    // Check if start date is Sunday or Holiday
    const sDate = new Date(formData.startDate);
    const startDay = sDate.getDay();
    const isStartHoliday = allHolidays.some(h => {
      const hS = new Date(h.startDate);
      const hE = new Date(h.endDate);
      hS.setHours(0,0,0,0);
      hE.setHours(0,0,0,0);
      const cS = new Date(sDate);
      cS.setHours(0,0,0,0);
      return cS >= hS && cS <= hE;
    });

    if (startDay === 0 || isStartHoliday) {
      notify("Summer Leave cannot start on a holiday or Sunday. Please pick a working day to begin your leave.", "error");
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
      // For Summer Leave, count all calendar days (Sandwich Rule applied)
      requestedDays = calculateSummerDays(formData.startDate, formData.endDate);
    }

    // Warning for partial quota
    if (requestedDays < summerRemaining) {
      setConfirmMessage(`You are applying for ${requestedDays} days, but you have ${summerRemaining} days available. Since Summer Leave can only be applied ONCE per year, you will forfeit the remaining ${summerRemaining - requestedDays} days. Do you wish to proceed?`);
      setShowConfirmModal(true);
      return;
    }

    await performSubmit(requestedDays);
  };

  const performSubmit = async (requestedDays) => {
    // For Summer Leave, no basic balance check against cl/ccl needed here.
    const isCustomType = false; 

    // This check is likely not needed for Summer Leave as it has its own quota logic
    // if (isCustomType && requestedDays > availableBalance) {
    //   notify(`Insufficient balance for ${formData.leaveType}. Available: ${availableBalance}, Requested: ${requestedDays}`, "error");
    //   return;
    // }

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
        setFormData({ leaveType: 'Summer Leave', startDate: '', endDate: '', reason: '' }); 
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

  let dynamicMaxDate = maxDate;
  if (formData.startDate && summerRemaining > 0) {
    const sDate = new Date(formData.startDate);
    // Simple addition of days minus 1 (since inclusive)
    sDate.setDate(sDate.getDate() + (summerRemaining - 1));
    
    const dY = sDate.getFullYear();
    const dM = String(sDate.getMonth() + 1).padStart(2, '0');
    const dD = String(sDate.getDate()).padStart(2, '0');
    const computedMax = `${dY}-${dM}-${dD}`;
    
    if (computedMax < maxDate) {
      dynamicMaxDate = computedMax;
    }
  }

  return (
    <div style={styles.container}>
      {showConfirmModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <CheckCircle size={32} color="#F17F08" />
              <h3 style={styles.modalTitle}>Confirm Summer Leave</h3>
            </div>
            <p style={styles.modalBody}>{confirmMessage}</p>
            <div style={styles.modalActions}>
              <button 
                onClick={() => setShowConfirmModal(false)}
                style={styles.cancelBtn}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  // Recalculate requestedDays for performSubmit if not passed
                  let requestedDays = 0;
                  if (isHalfDay) {
                    requestedDays = 0.5;
                  } else {
                    requestedDays = calculateSummerDays(formData.startDate, formData.endDate);
                  }
                  performSubmit(requestedDays);
                }}
                style={styles.confirmBtn}
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}
      <style>{`
        @media (max-width: 768px) {
          .resp-title { font-size: 22px !important; }
          .resp-card { padding: 15px !important; }
          .resp-row { flex-direction: column !important; }
          .resp-halfday { flex-direction: column !important; align-items: flex-start !important; }
          .resp-adj-row { flex-direction: column !important; gap: 5px !important; }
          .resp-submit { width: 100% !important; padding: 12px !important; font-size: 14px !important; }
          @keyframes modalFadeIn {
            from { opacity: 0; transform: scale(0.95) translateY(-10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>

      <header style={styles.header}>
        <h1 style={styles.pageTitle} className="resp-title">Apply for Summer Leave</h1>
      </header>

      <div style={styles.mainLayout}>
        <div style={styles.formCard} className="resp-card">
          <div style={styles.formHeader}>
            <div style={styles.balanceSection}>
              <div style={styles.balanceBadge}>
                SUMMER LEAVE REMAINING: <span style={{ color: '#F17F08', fontSize: '14px' }}>{summerRemaining} Days</span>
              </div>
            </div>
          </div>
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Hardcoded Single Type for Vacation */}
            <div style={styles.specialFields}>
              <select name="leaveType" value={formData.leaveType} onChange={handleChange} style={styles.input} required disabled={hasActiveRequest}>
                <option value="Summer Leave">Summer Leave (Vacation)</option>
              </select>
            </div>
            {hasActiveRequest && activeStatus === 'Pending' && (
              <p style={{ color: '#F17F08', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                * Your Summer Leave request is currently PENDING approval.
              </p>
            )}
            {hasActiveRequest && (activeStatus === 'Approved' || activeStatus === 'Accepted') && (
              <p style={{ color: '#10b981', fontSize: '12px', fontWeight: '600', marginBottom: '10px' }}>
                * Your Summer Leave has been {activeStatus}.
              </p>
            )}
            <div style={styles.row} className="resp-row">
              <div style={styles.group}>
                <label style={styles.label}>From</label>
                <input 
                    type="date" name="startDate" value={formData.startDate} min={minDate} max={maxDate} 
                    onChange={handleChange} required style={styles.input} 
                    disabled={hasActiveRequest || summerRemaining <= 0} 
                />
              </div>
              <div style={styles.group}>
                <label style={styles.label}>To</label>
                <input 
                    type="date" name="endDate" value={formData.endDate} min={formData.startDate || minDate} max={dynamicMaxDate} 
                    onChange={handleChange} required style={{...styles.input, backgroundColor: (isHalfDay || summerRemaining <= 0 || hasActiveRequest) ? '#f1f5f9' : 'white'}} 
                    readOnly={isHalfDay} disabled={hasActiveRequest || summerRemaining <= 0} 
                />
              </div>
            </div>

            <div style={styles.halfDaySection} className="resp-halfday">
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
              <textarea 
                name="reason" rows="3" value={formData.reason} 
                onChange={handleChange} required style={styles.input} 
                placeholder="Enter the reason for your leave..."
                disabled={hasActiveRequest || summerRemaining <= 0}
              ></textarea>
            </div>

            <div style={styles.adjustmentSection}>
              <div style={styles.adjHeader}>
                <h4 style={styles.adjTitle}>Class Adjustments</h4>
                <button 
                  type="button" onClick={addAdjustment} style={styles.addBtn}
                  disabled={hasActiveRequest || summerRemaining <= 0}
                >
                  <Plus size={14} /> Add Adjustment
                </button>
              </div>
              {adjustments.map((adj, index) => (
                <div key={index} style={styles.adjRow} className="resp-adj-row">
                  <input required type="date" value={adj.date} onChange={(e) => updateAdjustment(index, 'date', e.target.value)} style={styles.smallInput} disabled={hasActiveRequest || summerRemaining <= 0} />
                  <select required value={adj.period} onChange={(e) => updateAdjustment(index, 'period', e.target.value)} style={styles.smallInput} disabled={hasActiveRequest || summerRemaining <= 0}>
                    <option value="">-- Period --</option>
                    <option value="1st Hour">1st Hour</option><option value="2nd Hour">2nd Hour</option><option value="3rd Hour">3rd Hour</option>
                    <option value="4th Hour">4th Hour</option><option value="5th Hour">5th Hour</option><option value="6th Hour">6th Hour</option>
                    <option value="7th Hour">7th Hour</option>
                  </select>
                  <input required type="text" placeholder="Yr/Sec" value={adj.yearAndSection} onChange={(e) => updateAdjustment(index, 'yearAndSection', e.target.value)} style={styles.smallInput} disabled={hasActiveRequest || summerRemaining <= 0} />
                  <input required type="text" placeholder="Emp ID" value={adj.adjustedWith} onChange={(e) => updateAdjustment(index, 'adjustedWith', e.target.value)} style={styles.smallInput} disabled={hasActiveRequest || summerRemaining <= 0} />
                  <button type="button" onClick={() => removeAdjustment(index)} style={styles.delBtn} disabled={hasActiveRequest || summerRemaining <= 0}><Trash2 size={14} /></button>
                </div>
              ))}
            </div>

            <button 
              type="submit" 
              style={{...styles.submitBtn, opacity: (hasActiveRequest || summerRemaining <= 0) ? 0.6 : 1, cursor: (hasActiveRequest || summerRemaining <= 0) ? 'not-allowed' : 'pointer'}} 
              className="resp-submit" 
              disabled={hasActiveRequest || summerRemaining <= 0}
            >
              {hasActiveRequest ? (activeStatus === 'Pending' ? "Request Pending" : "Already Applied") : (summerRemaining <= 0 ? "No Quota Available" : "Submit Request")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '800px', margin: '0 auto', paddingBottom: '40px', padding: '0 15px', boxSizing: 'border-box' },
  header: { marginBottom: '30px', textAlign: 'center' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  mainLayout: { display: 'flex', justifyContent: 'center' },
  formCard: { 
    width: '100%', background: 'white', padding: '30px', borderRadius: '16px', 
    border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', boxSizing: 'border-box'
  },
  formHeader: { marginBottom: '25px' },
  balanceSection: { display: 'flex', flexWrap: 'wrap', gap: '8px' },
  balanceBadge: { 
    background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', 
    fontSize: '12px', fontWeight: '700', color: '#334155', border: '1px solid #e2e8f0' 
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(4px)',
  },
  modalContent: {
    background: '#fff',
    borderRadius: '16px',
    padding: '30px',
    width: '90%',
    maxWidth: '450px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    animation: 'modalFadeIn 0.3s ease-out',
  },
  modalHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '20px',
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#1e293b',
    fontWeight: '700',
  },
  modalBody: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#64748b',
    margin: '0 0 25px 0',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  confirmBtn: {
    background: '#F17F08',
    color: '#fff',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  cancelBtn: {
    background: '#f1f5f9',
    color: '#64748b',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  specialLeaveGroup: { background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  checkboxWrapper: { display: 'flex', alignItems: 'center', gap: '10px' },
  checkbox: { cursor: 'pointer', width: '18px', height: '18px', accentColor: '#F17F08' },
  label: { fontSize: '14px', fontWeight: '600', color: '#1e293b', cursor: 'pointer' },
  labelSmall: { fontSize: '14px', fontWeight: '600', color: '#475569', cursor: 'pointer' },
  specialFields: { marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '15px' },
  uploaderSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
  row: { display: 'flex', gap: '15px', flexDirection: 'row' },
  group: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  input: { padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '14px', width: '100%', boxSizing: 'border-box' },
  halfDaySection: { display: 'flex', alignItems: 'center', gap: '15px', flexDirection: 'row' },
  halfDayToggle: { display: 'flex', gap: '5px', background: '#f1f5f9', padding: '4px', borderRadius: '10px' },
  toggleBtn: { padding: '6px 15px', fontSize: '12px', fontWeight: '700', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s' },
  adjustmentSection: { background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  adjHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
  adjTitle: { margin: 0, fontSize: '15px', color: '#1e293b', fontWeight: '700' },
  addBtn: { background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600' },
  adjRow: { display: 'flex', gap: '10px', marginBottom: '10px', flexDirection: 'row' },
  smallInput: { flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '0' },
  delBtn: { background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  submitBtn: { padding: '16px', background: '#F17F08', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '800', fontSize: '16px', cursor: 'pointer', transition: 'transform 0.2s' },
  dropzone: { border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100px' },
  dropzoneContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b' },
  fileSelected: { display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '8px 12px', background: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxSizing: 'border-box' },
  fileName: { fontSize: '13px', color: '#1e293b', fontWeight: '500', flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  removeFileBtn: { background: '#f1f5f9', border: 'none', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }
};

export default ApplySummerLeave;
