import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Briefcase } from 'lucide-react';

const EmployeeSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const kmitOrange = "#F17F08";

  // Debounce Logic: Wait 500ms after user stops typing before calling API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/users/search?query=${encodeURIComponent(searchTerm)}`);
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

      {/* RESULTS GRID */}
      {loading ? (
        <p style={{textAlign: 'center', color: '#94a3b8', marginTop: '40px'}}>Searching...</p>
      ) : (
        <div style={styles.grid}>
          {results.length > 0 ? (
            results.map((emp) => (
              <div key={emp.employeeId} style={styles.card}>
                <div style={styles.cardHeader}>
                  <div style={styles.avatar}>
                    {emp.firstName[0]}{emp.lastName[0]}
                  </div>
                  <div>
                    <h3 style={styles.name}>{emp.firstName} {emp.lastName}</h3>
                    <span style={styles.idBadge}>{emp.employeeId}</span>
                  </div>
                </div>
                
                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <Briefcase size={16} color={kmitOrange} />
                    <span style={styles.infoText}>
                      {emp.designation} <span style={{color:'#cbd5e1', margin: '0 5px'}}>|</span> {emp.department}
                    </span>
                  </div>
                  <div style={styles.infoRow}>
                    <Mail size={16} color="#64748b" />
                    <span style={styles.infoText}>{emp.email}</span>
                  </div>
                  <div style={styles.infoRow}>
                    <Phone size={16} color="#64748b" />
                    <span style={styles.infoText}>{emp.mobile}</span>
                  </div>
                </div>
              </div>
            ))
          ) : searchTerm && (
            <div style={{gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', marginTop: '40px'}}>
              No employees found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '40px', textAlign: 'center' },
  pageTitle: { fontSize: '32px', color: '#1e293b', fontWeight: '800', margin: 0 },
  
  searchBarContainer: { 
    display: 'flex', alignItems: 'center', background: 'white', 
    borderRadius: '50px', border: '1px solid #e2e8f0', 
    maxWidth: '600px', margin: '0 auto 50px auto', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.04)', height: '55px',
    transition: 'all 0.2s',
  },
  searchInput: { 
    flex: 1, border: 'none', outline: 'none', padding: '0 20px', 
    fontSize: '16px', borderRadius: '0 50px 50px 0', height: '100%',
    color: '#1e293b'
  },

  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
  
  card: { 
    background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', 
    overflow: 'hidden', transition: 'all 0.2s ease', cursor: 'default',
    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
  },
  
  cardHeader: { padding: '20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' },
  avatar: { 
    width: '50px', height: '50px', borderRadius: '12px', 
    background: 'linear-gradient(135deg, #F17F08 0%, #ff9f43 100%)', 
    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', 
    fontWeight: 'bold', fontSize: '18px', boxShadow: '0 4px 10px rgba(241, 127, 8, 0.2)' 
  },
  name: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' },
  idBadge: { fontSize: '12px', background: 'white', border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px', color: '#64748b', fontWeight: '600', marginTop: '4px', display: 'inline-block' },
  
  cardBody: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' },
  infoRow: { display: 'flex', alignItems: 'center', gap: '12px' },
  infoText: { fontSize: '14px', color: '#475569', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }
};

export default EmployeeSearch;