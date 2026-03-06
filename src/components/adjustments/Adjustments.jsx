import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { Shuffle, ArrowRight, CheckCircle, XCircle, Search, User } from 'lucide-react';

const Adjustments = () => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const [activeTab, setActiveTab] = useState('incoming'); 
  
  if (!user) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading User Data...</div>;
  }

  // Data States
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [holidays, setHolidays] = useState([]);
  
  // SEARCH STATES
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedColleague, setSelectedColleague] = useState(null); // Stores the full selected user object
  
  // Form States
  const [formData, setFormData] = useState({
    date: '', period: '', classSection: '', reason: ''
  });

  const kmitOrange = "#F17F08";

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (user && user.employeeId) {
      fetchIncoming();
      fetchOutgoing();
      fetchHolidays();
    }
  }, [activeTab, user]);

  const fetchHolidays = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/holidays');
      if (res.ok) setHolidays(await res.json());
    } catch (err) { console.error("Failed to fetch holidays", err); }
  };

  const fetchIncoming = async () => {
    const res = await apiFetch(`http://localhost:5000/api/adjustments/incoming/${user.employeeId}`);
    if (res.ok) setIncoming(await res.json());
  };

  const fetchOutgoing = async () => {
    const res = await apiFetch(`http://localhost:5000/api/adjustments/outgoing/${user.employeeId}`);
    if (res.ok) setOutgoing(await res.json());
  };

  // --- SEARCH LOGIC (Debounced) ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim() && !selectedColleague) {
        performSearch();
      } else if (!searchTerm) {
        setSearchResults([]);
      }
    }, 400); // 400ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    try {
      // Re-using the existing Employee Search API
      const res = await apiFetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        console.log("Search results data sample:", data.length > 0 ? { id: data[0].employeeId, imgPrefix: data[0].profileImg ? data[0].profileImg.substring(0, 50) : 'MISSING' } : 'EMPTY');
        // Filter out self from results
        setSearchResults(data.filter(u => u.employeeId !== user.employeeId));
      }
    } catch (err) { console.error("Search error", err); }
  };

  const selectColleague = (colleague) => {
    setSelectedColleague(colleague);
    setSearchTerm(''); // Clear search text
    setSearchResults([]); // Hide results
  };

  const clearSelection = () => {
    setSelectedColleague(null);
    setSearchTerm('');
  };

  // --- HANDLERS ---
  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!selectedColleague) return notify("Please search and select a colleague.", "warning");

    // Holiday Check
    const isHoliday = holidays.some(h => {
      const hStart = new Date(h.startDate).toISOString().split('T')[0];
      const hEnd = new Date(h.endDate).toISOString().split('T')[0];
      return formData.date >= hStart && formData.date <= hEnd;
    });

    if (isHoliday) {
      return notify("You can't apply adjustments to a holiday", "warning");
    }

    try {
      const res = await apiFetch('http://localhost:5000/api/adjustments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            ...formData, 
            targetEmployeeId: selectedColleague.employeeId,
            requesterId: user.employeeId 
        })
      });
      if (res.ok) {
        notify("Request Sent!", "success");
        // Reset Form
        setFormData({ date: '', period: '', classSection: '', reason: '' });
        clearSelection();
        setActiveTab('outgoing');
      }
    } catch (err) { notify("Failed to send request", "error"); }
  };

  const handleRespond = async (requestId, status) => {
    try {
      const res = await apiFetch('http://localhost:5000/api/adjustments/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, status })
      });
      if (res.ok) {
        notify(`Request ${status}`, "success");
        fetchIncoming(); 
      }
    } catch (err) { notify("Action failed", "error"); }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-GB');

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Class Adjustments</h1>
        <p style={{color: '#64748b'}}>Manage class swaps and substitution requests.</p>
      </header>

      {/* TABS */}
      <div style={styles.tabContainer}>
        <button onClick={() => setActiveTab('incoming')} className="adj-tab" style={activeTab === 'incoming' ? styles.activeTab : styles.tab}>
          Incoming Requests {incoming.filter(i => i.status === 'Pending').length > 0 && <span style={styles.badge}>{incoming.filter(i => i.status === 'Pending').length}</span>}
        </button>
        <button onClick={() => setActiveTab('outgoing')} className="adj-tab" style={activeTab === 'outgoing' ? styles.activeTab : styles.tab}>My Sent Requests</button>
        <button onClick={() => setActiveTab('new')} className="adj-tab" style={activeTab === 'new' ? styles.activeTab : styles.tab}>+ New Request</button>
      </div>

      <div style={styles.content}>
        
        {/* --- 1. NEW REQUEST FORM --- */}
        {activeTab === 'new' && (
          <div style={styles.card} className="adj-card">
            <h3 style={styles.cardTitle}>Submit a Class Adjustment</h3>
            <form onSubmit={handleSendRequest} style={styles.form}>
              
              {/* SEARCH COLLEGUE SECTION */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Select Colleague</label>
                
                {!selectedColleague ? (
                    <div style={{position: 'relative'}}>
                        <div style={styles.searchWrapper}>
                            <Search size={18} color="#94a3b8" />
                            <input 
                                type="text" 
                                placeholder="Search by Employee ID (e.g. 562) or Name..." 
                                style={styles.searchInput}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        
                        {/* SEARCH RESULTS DROPDOWN */}
                        {searchResults.length > 0 && (
                            <div style={styles.resultsDropdown}>
                                {searchResults.map(colleague => (
                                    <div 
                                        key={colleague.employeeId} 
                                        style={styles.resultItem}
                                        onClick={() => selectColleague(colleague)}
                                    >
                                        <div style={styles.avatarSmall}>
                                            {colleague.profileImg && colleague.profileImg.trim() ? (
                                                <img 
                                                    src={colleague.profileImg.trim().toLowerCase().startsWith('data:image') ? colleague.profileImg.trim() : `http://localhost:5000/${colleague.profileImg.trim()}`} 
                                                    alt={colleague.firstName} 
                                                    style={styles.avatarImg} 
                                                    onError={(e) => {
                                                        console.error("Image load error for", colleague.employeeId);
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerText = colleague.firstName[0];
                                                    }}
                                                />
                                            ) : (
                                                colleague.firstName[0]
                                            )}
                                        </div>
                                        <div>
                                            <div style={styles.resultName}>{colleague.firstName} {colleague.lastName}</div>
                                            <div style={styles.resultId}>ID: {colleague.employeeId} • {colleague.department}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    // SELECTED STATE
                    <div style={styles.selectedCard}>
                        <div style={{display:'flex', alignItems:'center', gap:'12px'}}>
                            <div style={styles.avatarSmall}>
                                {selectedColleague.profileImg && selectedColleague.profileImg.trim() ? (
                                    <img 
                                        src={selectedColleague.profileImg.trim().toLowerCase().startsWith('data:image') ? selectedColleague.profileImg.trim() : `http://localhost:5000/${selectedColleague.profileImg.trim()}`} 
                                        alt={selectedColleague.firstName} 
                                        style={styles.avatarImg} 
                                    />
                                ) : (
                                    selectedColleague.firstName[0]
                                )}
                            </div>
                            <div>
                                <div style={styles.selectedName}>{selectedColleague.firstName} {selectedColleague.lastName}</div>
                                <div style={styles.selectedId}>ID: {selectedColleague.employeeId}</div>
                            </div>
                        </div>
                        <button type="button" onClick={clearSelection} style={styles.removeBtn}><XCircle size={20} /></button>
                    </div>
                )}
              </div>

              <div style={styles.row}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date</label>
                  <input type="date" style={styles.input} required 
                    value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Period / Hour</label>
                  <select style={styles.input} required value={formData.period} onChange={(e) => setFormData({...formData, period: e.target.value})}>
                    <option value="">-- Select Period --</option>
                    <option>1st Hour</option><option>2nd Hour</option><option>3rd Hour</option>
                    <option>4th Hour</option><option>5th Hour</option><option>6th Hour</option><option>7th Hour</option>
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Class / Section</label>
                <input type="text" placeholder="e.g. CSE-3A" style={styles.input} required
                   value={formData.classSection} onChange={(e) => setFormData({...formData, classSection: e.target.value})}
                />
              </div>

              <button type="submit" style={styles.submitBtn}>Send Request</button>
            </form>
          </div>
        )}

        {/* --- 2. INCOMING REQUESTS --- */}
        {activeTab === 'incoming' && (
          <div style={styles.listContainer}>
            {incoming.length === 0 ? <p style={styles.emptyText}>No incoming requests.</p> : incoming.map(req => (
              <div key={req._id} style={styles.requestCard}>
                <div style={styles.reqHeader}>
                  <div style={styles.avatar}>{req.requesterName ? req.requesterName[0] : 'U'}</div>
                  <div>
                    <h4 style={styles.reqName}>{req.requesterName || 'Unknown User'}</h4>
                    <p style={styles.reqMeta}>wants to adjust <strong>{req.period}</strong> on <strong>{formatDate(req.date)}</strong></p>
                  </div>
                </div>
                <div style={styles.reqDetails}>
                  Class: <strong>{req.classSection}</strong>
                </div>
                
                {req.status === 'Pending' ? (
                  <div className="adj-actions" style={styles.actionButtons}>
                    <button onClick={() => handleRespond(req._id, 'Accepted')} style={styles.acceptBtn}><CheckCircle size={16}/> Accept</button>
                    <button onClick={() => handleRespond(req._id, 'Rejected')} style={styles.rejectBtn}><XCircle size={16}/> Reject</button>
                  </div>
                ) : (
                  <div style={{...styles.statusBadge, 
                      color: req.status === 'Accepted' ? '#16a34a' : '#dc2626',
                      background: req.status === 'Accepted' ? '#dcfce7' : '#fee2e2'
                  }}>
                    {req.status === 'Accepted' ? <CheckCircle size={16}/> : <XCircle size={16}/>} {req.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* --- 3. OUTGOING REQUESTS --- */}
        {activeTab === 'outgoing' && (
          <div style={styles.listContainer}>
            {outgoing.length === 0 ? <p style={styles.emptyText}>You haven't sent any requests.</p> : outgoing.map(req => (
              <div key={req._id} style={styles.requestCard}>
                 <div style={styles.reqHeader}>
                  <div style={{...styles.avatar, background: '#64748b'}}><User size={20} color="white"/></div>
                  <div>
                    <h4 style={styles.reqName}>To: {req.targetName || 'Unknown'}</h4>
                    <p style={styles.reqMeta}>{req.period} • {formatDate(req.date)}</p>
                  </div>
                </div>
                <div style={{...styles.statusBadge, 
                    color: req.status === 'Accepted' ? '#16a34a' : (req.status === 'Rejected' ? '#dc2626' : '#d97706'),
                    background: req.status === 'Accepted' ? '#dcfce7' : (req.status === 'Rejected' ? '#fee2e2' : '#fef3c7')
                }}>
                  {req.status}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`
        @media (max-width: 768px) {
          .adj-row {
            flex-direction: column !important;
          }
          .adj-card {
            padding: 15px !important;
          }
          .adj-tab {
            padding: 10px !important;
            font-size: 13px !important;
            flex: 1;
            text-align: center;
          }
          .adj-actions {
            flex-direction: column !important;
            width: 100% !important;
          }
          .adj-actions button {
            width: 100% !important;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  
  tabContainer: { display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0' },
  tab: { padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '15px', fontWeight: '600' },
  activeTab: { padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', color: '#F17F08', fontSize: '15px', fontWeight: '700', borderBottom: '3px solid #F17F08' },
  badge: { background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', marginLeft: '6px' },

  card: { background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardTitle: { margin: '0 0 20px 0', fontSize: '18px', color: '#1e293b' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  row: { display: 'flex', gap: '20px' },
  formGroup: { flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#64748b' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' },
  submitBtn: { padding: '14px', background: '#F17F08', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' },

  // SEARCH STYLES
  searchWrapper: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white' },
  searchInput: { border: 'none', outline: 'none', fontSize: '15px', width: '100%' },
  resultsDropdown: { position: 'absolute', top: '105%', left: 0, right: 0, background: 'white', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 10, maxHeight: '200px', overflowY: 'auto' },
  resultItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': {background: '#f8fafc'} },
  resultName: { fontSize: '14px', fontWeight: '600', color: '#1e293b' },
  resultId: { fontSize: '12px', color: '#64748b' },
  avatarSmall: { width: '36px', height: '36px', borderRadius: '50%', background: '#F17F08', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },

  // SELECTED USER STYLES
  selectedCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #F17F08' },
  selectedName: { fontSize: '15px', fontWeight: '700', color: '#9a3412' },
  selectedId: { fontSize: '13px', color: '#c2410c' },
  removeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#c2410c' },

  listContainer: { display: 'flex', flexDirection: 'column', gap: '15px' },
  emptyText: { textAlign: 'center', color: '#94a3b8', padding: '40px' },
  requestCard: { background: 'white', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  reqHeader: { display: 'flex', gap: '15px', alignItems: 'center' },
  avatar: { width: '45px', height: '45px', borderRadius: '50%', background: '#F17F08', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' },
  reqName: { margin: 0, fontSize: '16px', color: '#1e293b' },
  reqMeta: { margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' },
  reqDetails: { fontSize: '14px', color: '#334155', background: '#f8fafc', padding: '5px 10px', borderRadius: '6px' },
  
  actionButtons: { display: 'flex', gap: '10px' },
  acceptBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#16a34a', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  rejectBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#dc2626', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
  statusBadge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }
};

export default Adjustments;