import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone } from 'lucide-react';

const EmployeeSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch initial data on mount
  useEffect(() => {
    performSearch('');
  }, []);

  // Debounce Logic: Wait 500ms after user stops typing before calling API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      performSearch(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (query) => {
    setLoading(true);
    try {
      const res = await apiFetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (res.ok) {
        setResults(data);
      }
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Employee Directory</h1>
        <p style={{color: '#64748b', marginTop: '5px'}}>Find colleagues by Name, ID, or Department</p>
      </header>

      {/* SEARCH BAR */}
      <div style={styles.searchBarContainer}>
        <Search size={20} color="#94a3b8" style={{marginLeft: '20px'}} />
        <input 
          type="text" 
          placeholder="Search by Name, Dept, or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
          autoFocus
        />
      </div>

      {/* RESULTS TABLE */}
      {loading ? (
        <p style={{textAlign: 'center', color: '#94a3b8', marginTop: '40px'}}>Searching...</p>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.th}>EMPLOYEE</th>
                <th style={styles.th}>ID</th>
                <th style={styles.th}>DESIGNATION</th>
                <th style={styles.th}>DEPARTMENT</th>
                <th style={styles.th}>CONTACT INFO</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? (
                results.map((emp) => (
                  <tr key={emp.employeeId} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.employeeCell}>
                        <div style={styles.avatar}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <span style={styles.name}>{emp.firstName} {emp.lastName}</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.idText}>{emp.employeeId}</span>
                    </td>
                    <td style={styles.td}>{emp.designation}</td>
                    <td style={styles.td}>
                      <span style={styles.deptBadge}>{emp.department}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.contactCell}>
                        <div style={styles.contactItem}>
                          <Mail size={14} color="#64748b" />
                          <span>{emp.email}</span>
                        </div>
                        <div style={styles.contactItem}>
                          <Phone size={14} color="#64748b" />
                          <span>{emp.mobile}</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : searchTerm && (
                <tr>
                  <td colSpan="5" style={{...styles.td, textAlign: 'center', padding: '40px', color: '#94a3b8'}}>
                    No employees found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: window.innerWidth <= 768 ? '20px' : '40px', textAlign: 'center' },
  pageTitle: { fontSize: window.innerWidth <= 768 ? '24px' : '32px', color: '#1e293b', fontWeight: '800', margin: 0 },
  
  searchBarContainer: { 
    display: 'flex', alignItems: 'center', background: 'white', 
    borderRadius: '50px', border: '1px solid #e2e8f0', 
    maxWidth: '600px', margin: '0 auto 30px auto', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: window.innerWidth <= 768 ? '45px' : '55px',
    width: window.innerWidth <= 768 ? '100%' : 'auto'
  },
  searchInput: { 
    flex: 1, border: 'none', outline: 'none', padding: '0 15px', 
    fontSize: window.innerWidth <= 768 ? '14px' : '16px', borderRadius: '0 50px 50px 0', height: '100%',
    color: '#1e293b'
  },

  tableWrapper: {
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
    width: '100%',
    boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    minWidth: '800px'
  },
  tableHeaderRow: {
    background: '#fafafa',
    borderBottom: '1px solid #e2e8f0'
  },
  th: {
    padding: window.innerWidth <= 768 ? '12px 15px' : '16px 24px',
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.2s ease'
  },
  td: {
    padding: window.innerWidth <= 768 ? '12px 15px' : '16px 24px',
    fontSize: '13px',
    color: '#334155',
    verticalAlign: 'middle'
  },
  employeeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: { 
    width: '32px', height: '32px', borderRadius: '8px', 
    background: 'linear-gradient(135deg, #F17F08 0%, #ff9f43 100%)', 
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
    fontWeight: '700', fontSize: '13px'
  },
  name: { fontWeight: '600', color: '#1e293b' },
  idText: { color: '#64748b', fontWeight: '500' },
  deptBadge: { 
    background: '#f1f5f9', 
    color: '#475569', 
    padding: '4px 10px', 
    borderRadius: '6px', 
    fontSize: '11px', 
    fontWeight: '600' 
  },
  contactCell: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b'
  }
};

export default EmployeeSearch;