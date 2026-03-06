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
      <style>{`
        .dir-header { margin-bottom: 40px; text-align: center; }
        .dir-title { font-size: 32px; color: #1e293b; font-weight: 800; margin: 0; }
        .dir-search { display: flex; align-items: center; background: white; border-radius: 50px; border: 1px solid #e2e8f0; max-width: 600px; margin: 0 auto 30px auto; box-shadow: 0 4px 20px rgba(0,0,0,0.04); height: 55px; }
        .dir-search input { flex: 1; border: none; outline: none; padding: 0 15px; font-size: 16px; border-radius: 0 50px 50px 0; height: 100%; color: #1e293b; background: transparent; }
        .dir-table { width: 100%; border-collapse: collapse; text-align: left; min-width: 700px; }
        .dir-th { padding: 16px 24px; font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 0.05em; text-transform: uppercase; }
        .dir-td { padding: 16px 24px; font-size: 13px; color: #334155; vertical-align: middle; }
        /* Mobile card layout */
        @media (max-width: 600px) {
          .dir-header { margin-bottom: 20px; }
          .dir-title { font-size: 22px; }
          .dir-search { height: 44px; }
          .dir-search input { font-size: 14px; }
          .dir-table-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
          .dir-table { min-width: 560px; }
          .dir-th, .dir-td { padding: 10px 12px; }
        }
      `}</style>

      <header className="dir-header">
        <h1 className="dir-title">Employee Directory</h1>
        <p style={{color: '#64748b', marginTop: '5px'}}>Find colleagues by Name, ID, or Department</p>
      </header>

      {/* SEARCH BAR */}
      <div className="dir-search">
        <Search size={20} color="#94a3b8" style={{marginLeft: '20px', flexShrink: 0}} />
        <input 
          type="text" 
          placeholder="Search by Name, Dept, or ID..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>

      {/* RESULTS TABLE */}
      {loading ? (
        <p style={{textAlign: 'center', color: '#94a3b8', marginTop: '40px'}}>Searching...</p>
      ) : (
        <div className="dir-table-wrap" style={styles.tableWrapper}>
          <table className="dir-table">
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th className="dir-th">EMPLOYEE</th>
                <th className="dir-th">ID</th>
                <th className="dir-th">DESIGNATION</th>
                <th className="dir-th">DEPARTMENT</th>
                <th className="dir-th">CONTACT INFO</th>
              </tr>
            </thead>
            <tbody>
              {results.length > 0 ? (
                results.map((emp) => (
                  <tr key={emp.employeeId} style={styles.tr}>
                    <td className="dir-td">
                      <div style={styles.employeeCell}>
                        <div style={styles.avatar}>
                          {emp.profileImg && emp.profileImg.trim() ? (
                            <img 
                              src={emp.profileImg.trim().toLowerCase().startsWith('data:image') ? emp.profileImg.trim() : `http://localhost:5000/${emp.profileImg.trim()}`} 
                              alt={emp.firstName} 
                              style={styles.avatarImg} 
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerText = `${emp.firstName[0]}${emp.lastName[0]}`;
                              }}
                            />
                          ) : (
                            `${emp.firstName[0]}${emp.lastName[0]}`
                          )}
                        </div>
                        <span style={styles.name}>{emp.firstName} {emp.lastName}</span>
                      </div>
                    </td>
                    <td className="dir-td"><span style={styles.idText}>{emp.employeeId}</span></td>
                    <td className="dir-td">{emp.designation}</td>
                    <td className="dir-td"><span style={styles.deptBadge}>{emp.department}</span></td>
                    <td className="dir-td">
                      <div style={styles.contactCell}>
                        <div style={styles.contactItem}><Mail size={14} color="#64748b" /><span>{emp.email}</span></div>
                        <div style={styles.contactItem}><Phone size={14} color="#64748b" /><span>{emp.mobile}</span></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : searchTerm && (
                <tr>
                  <td colSpan="5" style={{padding: '40px', textAlign: 'center', color: '#94a3b8'}}>
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
  tableWrapper: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', width: '100%', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' },
  tableHeaderRow: { background: '#fafafa', borderBottom: '1px solid #e2e8f0' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s ease' },
  employeeCell: { display: 'flex', alignItems: 'center', gap: '12px' },
  avatar: { width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #F17F08 0%, #ff9f43 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '13px', overflow: 'hidden', flexShrink: 0 },
  avatarImg: { width: '100%', height: '100%', objectFit: 'cover' },
  name: { fontWeight: '600', color: '#1e293b' },
  idText: { color: '#64748b', fontWeight: '500' },
  deptBadge: { background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' },
  contactCell: { display: 'flex', flexDirection: 'column', gap: '4px' },
  contactItem: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }
};

export default EmployeeSearch;