import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { Search, Filter, Mail, Phone, Building, Briefcase, User as UserIcon } from 'lucide-react';

const PrincipalEmployees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');

  const kmitOrange = "#F17F08";

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await apiFetch(`http://localhost:5000/api/principal/employees`);
        if (res.ok) setEmployees(await res.json());
      } catch (err) {
        console.error("Failed to load employees", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const departments = ['All', ...new Set(employees.map(emp => emp.department).filter(Boolean))];

  const filteredEmployees = employees.filter(emp => {
    const name = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || 
                          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.pageTitle}>Institutional Directory</h1>
          <p style={styles.subtitle}>View and search all employees across the institution.</p>
        </div>
      </header>

      <div style={styles.card}>
        <div style={styles.filterTray}>
          <div style={styles.searchBox}>
             <Search size={18} color="#94a3b8" />
             <input 
               type="text" 
               placeholder="Search by name or ID..." 
               style={styles.searchInput}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <select style={styles.select} value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
            {departments.map(dept => <option key={dept} value={dept}>{dept === 'All' ? 'All Departments' : dept}</option>)}
          </select>
        </div>

        {loading ? (
          <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Loading staff list...</div>
        ) : filteredEmployees.length === 0 ? (
          <div style={{padding: '60px', textAlign: 'center', color: '#94a3b8'}}>
            <UserIcon size={48} color="#cbd5e1" style={{marginBottom: '16px'}} />
            <p style={{margin: 0, fontSize: '16px'}}>No employees found.</p>
          </div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHeading}>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Department & Role</th>
                  <th style={styles.th}>Contact Info</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map(emp => (
                  <tr key={emp.employeeId} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
                        <div style={styles.avatar}>{emp.firstName[0]}</div>
                        <div>
                          <div style={{fontWeight: 'bold', color: '#1e293b'}}>{emp.firstName} {emp.lastName}</div>
                          <div style={{fontSize: '12px', color: '#64748b'}}>{emp.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', color: kmitOrange}}>
                          <Building size={14} /> {emp.department}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b'}}>
                          <Briefcase size={14} /> {emp.designation || emp.role}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155'}}>
                          <Mail size={14} color="#94a3b8" /> {emp.email || 'N/A'}
                        </div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#334155'}}>
                          <Phone size={14} color="#94a3b8" /> {emp.mobile || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 10px', 
                        borderRadius: '20px', 
                        fontSize: '11px', 
                        fontWeight: 'bold',
                        background: emp.role === 'HoD' ? '#fff3e0' : '#f1f5f9',
                        color: emp.role === 'HoD' ? '#e65100' : '#475569'
                      }}>
                        {emp.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  card: { background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', overflow: 'hidden' },
  filterTray: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', borderBottom: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '16px' },
  searchBox: { display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', width: '300px', flexGrow: 1, maxWidth: '400px' },
  searchInput: { border: 'none', background: 'transparent', outline: 'none', fontSize: '14px', width: '100%' },
  select: { padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', fontWeight: '500', outline: 'none', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' },
  trHeading: { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '16px 20px', color: '#64748b', fontWeight: '600' },
  tr: { borderBottom: '1px solid #f1f5f9', transition: 'background 0.2s' },
  td: { padding: '16px 20px', color: '#334155', verticalAlign: 'middle' },
  avatar: { width: '36px', height: '36px', borderRadius: '50%', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }
};

export default PrincipalEmployees;
