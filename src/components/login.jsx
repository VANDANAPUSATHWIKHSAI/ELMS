import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { useAuth } from "../context/AuthContext"; // <--- Import Auth
import collegeLogo from "../assets/logo.png"; 

const Login = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [credentials, setCredentials] = useState({ employeeId: '', password: '' });
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth(); // <--- Get login function

  const handleChange = (e) => {
    // If it's the password field, update password, else update employeeId
    const field = e.target.type === 'password' ? 'password' : 'employeeId';
    setCredentials({ ...credentials, [field]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Call the Backend API
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (response.ok) {
        login(data.user); // Save user to memory
        navigate("/home");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      setError("Server error. Ensure 'node server.js' is running.");
    }
  };

  // Styles (Keep your existing styles variable here)
  const styles = {
    // ... paste your existing styles object here ...
    pageWrapper: { margin: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif' },
    loginCard: { width: '100%', maxWidth: '420px', padding: '40px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)', borderRadius: '16px', border: '1px solid #f1f5f9' },
    logoHeader: { marginBottom: '20px', display: 'flex', justifyContent: 'center', width: '100%' },
    logoImage: { width: '120px', height: 'auto', objectFit: 'contain' },
    headerText: { textAlign: 'center', marginBottom: '30px' },
    title: { fontSize: '28px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: 0 },
    form: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
    inputWrapper: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
    inputField: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', width: '100%', boxSizing: 'border-box', transition: 'border-color 0.2s' },
    forgotContainer: { display: 'flex', justifyContent: 'flex-end', marginTop: '4px' },
    forgotLink: { fontSize: '13px', color: '#F17F08', textDecoration: 'none', fontWeight: '500' },
    submitBtn: { marginTop: '10px', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s ease', color: '#ffffff', width: '100%' },
    footer: { marginTop: '40px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.loginCard}>
        <div style={styles.logoHeader}>
          <img src={collegeLogo} alt="KMIT Logo" style={styles.logoImage} onError={(e) => { e.target.style.display = 'none' }} />
        </div>
        <div style={styles.headerText}>
          <h2 style={styles.title}><span style={{color: '#000'}}>KMIT</span> <span style={{color: '#F17F08'}}>ELMS</span></h2>
          <p style={styles.subtitle}>Please log in to your account</p>
        </div>

        <form style={styles.form} onSubmit={handleLogin}>
          {error && <div style={{color: 'red', textAlign:'center', fontSize: '14px'}}>{error}</div>}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Employee ID</label>
            <input type="text" placeholder="Enter Employee ID" style={styles.inputField} value={credentials.employeeId} onChange={handleChange} required />
          </div>
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Password</label>
            <input type="password" placeholder="Enter Password" style={styles.inputField} value={credentials.password} onChange={handleChange} required />
            <div style={styles.forgotContainer}><a href="#" style={styles.forgotLink}>Forgot Password?</a></div>
          </div>
          <button type="submit" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} style={{...styles.submitBtn, backgroundColor: isHovered ? '#D15D00' : '#F17F08'}}>Log In</button>
        </form>
        <div style={styles.footer}><p>© 2026 KMIT-ELMS. All rights reserved.</p></div>
      </div>
    </div>
  );
};

export default Login;