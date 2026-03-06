import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { Search, Filter, History, CheckCircle, XCircle, Clock, Download, AlertCircle, TrendingDown } from 'lucide-react';
import * as XLSX from 'xlsx';

const PrincipalReports = () => {
  const [activeTab, setActiveTab] = useState('history'); // 'history', 'lop', 'latemarks'
  const [history, setHistory] = useState([]);
  const [lopSummary, setLopSummary] = useState([]);
  const [lateMarkSummary, setLateMarkSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const kmitOrange = "#F17F08";

  useEffect(() => {
    const fetchReportsData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'history') {
          const res = await apiFetch(`http://localhost:5000/api/principal/leave-history`);
          if (res.ok) setHistory(await res.json());
        } else {
          const resSummary = await apiFetch(`http://localhost:5000/api/principal/reports/lop-late-marks`);
          if (resSummary.ok) {
            const data = await resSummary.json();
            setLopSummary(data.lopSummary);
            setLateMarkSummary(data.lateMarkSummary);
          }
        }
      } catch (err) {
        console.error("Failed to load report data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportsData();
  }, [activeTab]);

  const getStatusBadge = (status, actionBy) => {
    let badgeContent;
    if (['Approved', 'Accepted', 'Auto-Approved'].includes(status)) badgeContent = <span style={{...styles.badge, background: '#dcfce7', color: '#16a34a'}}><CheckCircle size={14}/> {status}</span>;
    else if (status === 'Rejected') badgeContent = <span style={{...styles.badge, background: '#fee2e2', color: '#dc2626'}}><XCircle size={14}/> {status}</span>;
    else badgeContent = <span style={{...styles.badge, background: '#fef3c7', color: '#d97706'}}><Clock size={14}/> {status}</span>;

    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
        {badgeContent}
        {actionBy && <span style={{fontSize: '11px', color: '#64748b', fontStyle: 'italic'}}>by {actionBy}</span>}
      </div>
    );
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // Filtering Logic for History
  const filteredHistory = history.filter(req => {
    const matchesSearch = req.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || req.department === filterDept;
    let matchesStatus = true;
    if (filterStatus !== 'All') {
       if (filterStatus === 'Approved') matchesStatus = ['Approved', 'Accepted', 'Auto-Approved'].includes(req.status);
       else matchesStatus = req.status === filterStatus;
    }
    return matchesSearch && matchesDept && matchesStatus;
  });

  const exportToExcel = () => {
    let exportData = [];
    let filename = "Report.xlsx";

    if (activeTab === 'history') {
      exportData = filteredHistory.map(req => ({
        "Faculty Name": req.employeeName,
        "Department": req.department,
        "Leave Type": req.leaveType,
        "Start Date": formatDate(req.startDate),
        "End Date": formatDate(req.endDate),
        "Reason": req.reason,
        "Status": req.status,
        "Applied On": formatDate(req.appliedOn)
      }));
      filename = "Institute_Leave_Report.xlsx";
    } else if (activeTab === 'lop') {
      exportData = lopSummary.map(item => ({
        "Employee ID": item.employeeId,
        "Name": `${item.firstName} ${item.lastName}`,
        "Department": item.department,
        "Total LOP Taken": item.leaveBalance?.lop || 0
      }));
      filename = "LOP_Summary.xlsx";
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Institutional Reports</h1>
          <p style={styles.subtitle}>Global analytics and tracking across all departments.</p>
        </div>
        <button onClick={exportToExcel} style={styles.exportBtn}>
          <Download size={18} /> Export Excel
        </button>
      </header>

      {/* TAB NAVIGATION */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('history')} 
          style={{...styles.tabLink, borderBottom: activeTab === 'history' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'history' ? kmitOrange : '#64748b'}}
        >
          Leave History
        </button>
        <button 
          onClick={() => setActiveTab('lop')} 
          style={{...styles.tabLink, borderBottom: activeTab === 'lop' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'lop' ? kmitOrange : '#64748b'}}
        >
          LOP Summary
        </button>
        <button 
          onClick={() => setActiveTab('latemarks')} 
          style={{...styles.tabLink, borderBottom: activeTab === 'latemarks' ? `3px solid ${kmitOrange}` : '3px solid transparent', color: activeTab === 'latemarks' ? kmitOrange : '#64748b'}}
        >
          Late Mark Analysis
        </button>
      </div>

      <div style={styles.card}>
        {activeTab === 'history' && (
          <>
            <div style={styles.filterTray}>
              <div style={styles.searchBox}>
                 <Search size={18} color="#94a3b8" />
                 <input 
                   type="text" 
                   placeholder="Search faculty name..." 
                   style={styles.searchInput}
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>
              <div style={{display: 'flex', gap: '12px'}}>
                <select style={styles.select} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="All">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending">Pending</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Loading history...</div>
            ) : filteredHistory.length === 0 ? (
              <div style={{padding: '60px', textAlign: 'center', color: '#94a3b8'}}>
                <History size={48} color="#cbd5e1" style={{marginBottom: '16px'}} />
                <p style={{margin: 0, fontSize: '16px'}}>No records found.</p>
              </div>
            ) : (
              <div style={{overflowX: 'auto'}}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHeading}>
                      <th style={styles.th}>Faculty</th>
                      <th style={styles.th}>Dept</th>
                      <th style={styles.th}>Leave Details</th>
                      <th style={styles.th}>Duration</th>
                      <th style={styles.th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map(req => (
                      <tr key={req._id} style={styles.tr}>
                        <td style={{...styles.td, fontWeight: 'bold'}}>{req.employeeName}</td>
                        <td style={{...styles.td, color: kmitOrange, fontWeight: '600'}}>{req.department}</td>
                        <td style={styles.td}>
                          <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                            <span style={styles.typeBadge}>{req.leaveType}</span>
                            <span style={{fontSize: '12px', color: '#64748b'}}>
                              {req.reason}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          {formatDate(req.startDate)} <br/><span style={{color: '#94a3b8', fontSize: '11px'}}>to</span><br/> {formatDate(req.endDate)}
                        </td>
                        <td style={styles.td}>
                          {getStatusBadge(
                            req.status, 
                            (req.status === 'Approved' || req.status === 'Accepted' || req.status === 'Auto-Approved')
                              ? (req.principalApproval?.status === 'Approved' ? req.principalApproval.actionBy : req.hodApproval?.actionBy)
                              : (req.status === 'Rejected' 
                                  ? (req.principalApproval?.status === 'Rejected' ? req.principalApproval.actionBy : req.hodApproval?.actionBy)
                                  : null)
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'lop' && (
          <div style={{padding: '24px'}}>
             <div style={styles.alertCard}>
                <TrendingDown size={24} />
                <div>
                   <h4 style={{margin: '0 0 4px 0'}}>Loss of Pay Summary</h4>
                   <p style={{margin: 0, fontSize: '13px', opacity: 0.9}}>Showing faculty who have exceeded their leave limits this year.</p>
                </div>
             </div>
             
             {loading ? (
               <p style={{textAlign: 'center', padding: '20px'}}>Loading LOP data...</p>
             ) : (
               <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHeading}>
                       <th style={styles.th}>Employee</th>
                       <th style={styles.th}>Department</th>
                       <th style={styles.th}>Total LOP Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lopSummary.map(item => (
                      <tr key={item.employeeId} style={styles.tr}>
                         <td style={{...styles.td, fontWeight: 'bold'}}>{item.firstName} {item.lastName}</td>
                         <td style={styles.td}>{item.department}</td>
                         <td style={{...styles.td, color: '#dc2626', fontWeight: 'bold'}}>{item.leaveBalance?.lop || 0} Days</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
          </div>
        )}

        {activeTab === 'latemarks' && (
          <div style={{padding: '24px'}}>
             <div style={{...styles.alertCard, background: '#fef3c7', color: '#92400e'}}>
                <AlertCircle size={24} />
                <div>
                   <h4 style={{margin: '0 0 4px 0'}}>Late Arrival Frequency</h4>
                   <p style={{margin: 0, fontSize: '13px', opacity: 0.9}}>Ranking staff by number of late arrivals recorded.</p>
                </div>
             </div>

             {loading ? (
               <p style={{textAlign: 'center', padding: '20px'}}>Loading patterns...</p>
             ) : (
               <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHeading}>
                       <th style={styles.th}>Employee</th>
                       <th style={styles.th}>Department</th>
                       <th style={styles.th}>Late Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateMarkSummary.map(item => (
                      <tr key={item.employeeId} style={styles.tr}>
                         <td style={{...styles.td, fontWeight: 'bold'}}>{item.name}</td>
                         <td style={styles.td}>{item.department}</td>
                         <td style={{...styles.td, color: '#d97706', fontWeight: 'bold'}}>{item.count} Marks</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  exportBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 2px 4px rgba(16,185,129,0.2)' },
  
  card: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' },
  filterTray: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '16px' },
  
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '300px', flexGrow: 1, maxWidth: '400px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' },
  select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', fontWeight: '500', outline: 'none', cursor: 'pointer' },
  
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '16px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s', ':hover': { background: '#f8fafc' } },
  td: { padding: '16px 20px', color: '#334155', verticalAlign: 'middle' },
  
  typeBadge: { background: '#eff6ff', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '700', width: 'max-content' },
  badge: { display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: '700', width: 'max-content' },
  tabBar: { display: 'flex', gap: '24px', padding: '0 20px', marginBottom: '-1px', borderBottom: '1px solid #e2e8f0' },
  tabLink: { padding: '12px 4px', fontSize: '14px', fontWeight: '600', border: 'none', background: 'none', cursor: 'pointer', transition: 'all 0.2s' },
  alertCard: { display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', marginBottom: '24px' }
};

export default PrincipalReports;
