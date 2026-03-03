import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const LeaveLedgerView = () => {
  const { user } = useAuth();
  const [ledger, setLedger] = useState([]);
  const [loading, setLoading] = useState(false);
  const kmitOrange = "#F17F08";

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`http://localhost:5000/api/leave/monthly-ledger/${user.employeeId}`);
      const data = await res.json();
      if (res.ok) setLedger(data);
    } catch (err) {
      console.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.employeeId) fetchLedger();
  }, [user.employeeId]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Monthly Ledger</h1>
      </header>

      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={styles.employeeName}>Employee: {user?.firstName} {user?.lastName}</div>
        </div>

        <div className="table-responsive" style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead style={styles.thead}>
              <tr style={styles.headerRow}>
                <th style={styles.th}>MONTH</th>
                <th style={styles.th}>CL</th>
                <th style={styles.th}>CCL</th>
                <th style={styles.th}>OD</th>
                <th style={styles.th}>AL</th>
                <th style={styles.th}>TOTAL</th>
                <th style={styles.th}>LATES</th>
                <th style={styles.th}>AVAILED</th>
                <th style={styles.th}>REMAINING</th>
                <th style={styles.th}>LOP</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" style={styles.tdCenter}>Loading...</td></tr>
              ) : ledger.length === 0 ? (
                <tr><td colSpan="10" style={styles.tdCenter}>No records found.</td></tr>
              ) : (
                ledger.map((row) => (
                  <tr key={row.month} style={styles.tr}>
                    <td style={styles.tdMonth}>{row.month}</td>
                    <td style={styles.td}>{row.cl?.toFixed(1) || '0.0'}</td>
                    <td style={styles.td}>{row.ccl?.toFixed(1) || '0.0'}</td>
                    <td style={styles.td}>{row.od?.toFixed(1) || '0.0'}</td>
                    <td style={styles.td}>{row.al?.toFixed(1) || '0.0'}</td>
                    <td style={styles.td}>{row.total || '0'}</td>
                    <td style={styles.td}>{row.lates || '0'}</td>
                    <td style={styles.td}>{row.availed?.toFixed(1) || '0.0'}</td>
                    <td style={styles.td}>{row.remaining?.toFixed(1) || '0.1'}</td>
                    <td style={row.lop > 0 ? {...styles.td, ...styles.lopCell} : styles.td}>{row.lop?.toFixed(1) || '0.0'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: window.innerWidth <= 768 ? '15px' : '30px', textAlign: 'center' },
  pageTitle: { fontSize: window.innerWidth <= 768 ? '22px' : '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  
  card: { 
    background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)', overflow: 'hidden'
  },
  cardHeader: { 
    background: '#F17F08', padding: window.innerWidth <= 768 ? '12px 15px' : '15px 25px', color: 'white',
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  employeeName: { fontSize: window.innerWidth <= 768 ? '16px' : '18px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' },

  tableWrapper: { overflowX: 'auto', width: '100%', borderTop: 'none', background: 'white' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'center', minWidth: '900px' },
  thead: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  headerRow: { },
  th: { 
    padding: '12px 10px', fontSize: '11px', fontWeight: '800', 
    color: '#64748b', textTransform: 'uppercase', textAlign: 'center', background: '#f8fafc'
  },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
  tdMonth: { padding: '12px 10px', fontSize: '13px', fontWeight: '800', color: '#1e293b', textAlign: 'left', paddingLeft: '20px' },
  td: { padding: '12px 10px', fontSize: '13px', color: '#475569' },
  tdCenter: { padding: '40px', textAlign: 'center', color: '#94a3b8' },
  lopCell: { color: '#ef4444', fontWeight: '700' }
};

export default LeaveLedgerView;
