import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Clock, CheckCircle, XCircle, Search, Filter, FileText } from 'lucide-react';

const AdminReports = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState([]);

  // Filters state
  const [reportType, setReportType] = useState('all'); // all, monthly, daily, approved, pending, employee
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [filterEmployeeId, setFilterEmployeeId] = useState('');
  
  // Search Autocomplete State
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchReports();
  }, [reportType]); // Re-fetch when reportType changes

  const fetchEmployees = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/admin/employees');
      if (res.ok) setEmployees(await res.json());
    } catch (err) { console.error("Failed to load employees"); }
  };

  const fetchReports = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);

    let queryParams = new URLSearchParams();

    if (reportType === 'monthly') queryParams.append('month', filterMonth);
    if (reportType === 'daily') queryParams.append('date', filterDate);
    if (reportType === 'approved') queryParams.append('status', 'Approved');
    if (reportType === 'pending') queryParams.append('status', 'Pending');
    if (reportType === 'employee') {
      if (!filterEmployeeId) {
        setLoading(false);
        return; // Don't fetch if no employee selected
      }
      queryParams.append('employeeId', filterEmployeeId);
    }

    try {
      const res = await apiFetch(`http://localhost:5000/api/admin/reports/advanced?${queryParams.toString()}`);
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  const StatusBadge = ({ status, actionBy }) => {
    let color = '#f59e0b';
    let icon = <Clock size={14} />;
    
    if (status === 'Approved' || status === 'Auto-Approved') { color = '#10b981'; icon = <CheckCircle size={14} />; }
    else if (status === 'Rejected') { color = '#ef4444'; icon = <XCircle size={14} />; }

    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: color, fontWeight: 'bold', fontSize: '12px', padding: '4px 8px', borderRadius: '12px', background: `${color}20`, width: 'max-content' }}>
          {icon} {status}
        </span>
        {actionBy && <span style={{fontSize: '11px', color: '#64748b', fontStyle: 'italic'}}>by {actionBy}</span>}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Institution-Wide Leave Reports</h2>
        <p style={{color: '#64748b'}}>Generate custom reports across all departments.</p>
      </header>

      {/* FILTER CONTROLS */}
      <div style={styles.filterCard}>
        <div style={styles.tabs}>
           <button onClick={() => setReportType('all')} style={reportType === 'all' ? styles.activeTab : styles.tab}>All History</button>
           <button onClick={() => setReportType('monthly')} style={reportType === 'monthly' ? styles.activeTab : styles.tab}>Monthly</button>
           <button onClick={() => setReportType('daily')} style={reportType === 'daily' ? styles.activeTab : styles.tab}>Day-wise</button>
           <button onClick={() => setReportType('approved')} style={reportType === 'approved' ? styles.activeTab : styles.tab}>Approved</button>
           <button onClick={() => setReportType('pending')} style={reportType === 'pending' ? styles.activeTab : styles.tab}>Pending</button>
           <button onClick={() => setReportType('employee')} style={reportType === 'employee' ? styles.activeTab : styles.tab}>Employee-wise</button>
        </div>

        <form onSubmit={fetchReports} style={styles.formLayer}>
           {reportType === 'monthly' && (
             <div style={styles.filterGroup}>
               <label style={styles.label}>Select Month</label>
               <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} style={styles.input} />
             </div>
           )}
           {reportType === 'daily' && (
             <div style={styles.filterGroup}>
               <label style={styles.label}>Select Date</label>
               <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} style={styles.input} />
             </div>
           )}
           {reportType === 'employee' && (
             <div style={styles.filterGroup}>
               <label style={styles.label}>Select Employee</label>
               <div style={{ position: 'relative' }}>
                 <input
                   type="text"
                   placeholder="Search by name or ID..."
                   value={searchTerm}
                   onChange={(e) => {
                     setSearchTerm(e.target.value);
                     setFilterEmployeeId(''); // Clear selection on type
                     setIsDropdownOpen(true);
                   }}
                   onFocus={() => setIsDropdownOpen(true)}
                   onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)} // Delay for click
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
                             setFilterEmployeeId(emp.employeeId);
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
           )}

           {(reportType === 'monthly' || reportType === 'daily' || reportType === 'employee') && (
             <button type="submit" style={styles.searchBtn} disabled={loading}>
               <Search size={16} /> {loading ? "Searching..." : "Generate Report"}
             </button>
           )}
        </form>
      </div>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <FileText size={20} color="#F17F08" />
          <h3 style={{margin:0, fontSize: '16px', color: '#1e293b'}}>Report Results ({history.length} records)</h3>
        </div>

        {loading ? (
          <p style={{padding: '30px', color: '#64748b', textAlign: 'center'}}>Loading reports...</p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHeading}>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Dept</th>
                  <th style={styles.th}>Leave Type</th>
                  <th style={styles.th}>Dates</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {history.map(leave => (
                  <tr key={leave._id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{leave.employeeName}</strong>
                      <div style={{fontSize: '11px', color: '#64748b'}}>{leave.employeeId}</div>
                    </td>
                    <td style={styles.td}>{leave.department}</td>
                    <td style={styles.td}><span style={styles.typeBadge}>{leave.leaveType}</span></td>
                    <td style={styles.td}>
                      <div style={{fontWeight: '500'}}>{formatDate(leave.startDate)}</div>
                      <div style={{fontSize: '11px', color: '#64748b'}}>to {formatDate(leave.endDate)}</div>
                    </td>
                    <td style={styles.td}>
                       <span style={{fontSize: '13px', display: 'block', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}} title={leave.reason}>
                         {leave.reason}
                       </span>
                    </td>
                    <td style={styles.td}>
                      <StatusBadge 
                        status={leave.status} 
                        actionBy={
                          (leave.status === 'Approved' || leave.status === 'Auto-Approved')
                            ? (leave.principalApproval?.status === 'Approved' ? leave.principalApproval.actionBy : leave.hodApproval?.actionBy)
                            : (leave.status === 'Rejected'
                                ? (leave.principalApproval?.status === 'Rejected' ? leave.principalApproval.actionBy : leave.hodApproval?.actionBy)
                                : null)
                        } 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {history.length === 0 && (
              <div style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>
                <Search size={32} style={{opacity: 0.5, marginBottom: '10px'}} />
                <p style={{margin: 0}}>No leave records found for the selected criteria.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { padding: '20px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' },
  header: { marginBottom: '20px' },
  title: { fontSize: '24px', color: '#1e293b', margin: '0 0 8px 0', fontWeight: '800' },
  
  filterCard: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', padding: '20px', marginBottom: '24px' },
  tabs: { display: 'flex', gap: '10px', flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', marginBottom: '16px' },
  tab: { padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: '20px', background: 'white', color: '#64748b', fontWeight: '600', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  activeTab: { padding: '8px 16px', border: '1px solid #F17F08', borderRadius: '20px', background: '#fff7ed', color: '#ea580c', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: 'all 0.2s' },
  
  formLayer: { display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' },
  filterGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 250px', maxWidth: '100%' },
  label: { fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', background: '#f8fafc', width: '100%' },
  searchBtn: { padding: '10px 20px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', height: '40px', marginTop: 'auto', whiteSpace: 'nowrap' },
  dropdownList: { position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 100, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  dropdownItem: { padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '13px', color: '#334155', background: '#fff' },

  card: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', overflow: 'hidden' },
  cardHeader: { padding: '16px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' },
  tableWrapper: { overflowX: 'auto', maxHeight: '600px' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#fff', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '14px 20px', color: '#475569', fontWeight: '700', position: 'sticky', top: 0, backgroundColor: '#f8fafc', zIndex: 1 },
  tr: { borderBottom: '1px solid #f1f5f9', ':hover': { backgroundColor: '#f8fafc' } },
  td: { padding: '14px 20px', color: '#334155' },
  typeBadge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700' },
};

export default AdminReports;
