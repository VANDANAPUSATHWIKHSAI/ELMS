import { apiFetch } from "../utils/api";
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import collegeLogo from "../assets/logo.png";

const VerifyOTP = () => {
  const [searchParams] = useSearchParams();
  const [employeeId, setEmployeeId] = useState("");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const idParam = searchParams.get("employeeId");
    if (idParam) {
      setEmployeeId(idParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("http://localhost:5000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, otp }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("OTP Verified Successfully!");
        setTimeout(() => {
          navigate(`/reset-password?employeeId=${employeeId}&token=${data.token}`);
        }, 1500);
      } else {
        setError(data.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      setError("Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    pageWrapper: { margin: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif' },
    card: { width: '100%', maxWidth: '420px', padding: '40px', backgroundColor: '#ffffff', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.05)', borderRadius: '16px', border: '1px solid #f1f5f9' },
    logoHeader: { marginBottom: '20px', display: 'flex', justifyContent: 'center', width: '100%' },
    logoImage: { width: '120px', height: 'auto', objectFit: 'contain' },
    title: { fontSize: '24px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' },
    subtitle: { fontSize: '14px', color: '#64748b', margin: '0 0 20px 0', textAlign: 'center' },
    form: { width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' },
    inputWrapper: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#0f172a' },
    inputField: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', backgroundColor: '#ffffff', color: '#0f172a', outline: 'none', width: '100%', boxSizing: 'border-box' },
    submitBtn: { marginTop: '10px', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#F17F08', color: '#ffffff', width: '100%' },
    backLink: { marginTop: '20px', fontSize: '14px', color: '#F17F08', textDecoration: 'none', fontWeight: '500', cursor: 'pointer' }
  };

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <div style={styles.logoHeader}>
          <img src={collegeLogo} alt="KMIT Logo" style={styles.logoImage} />
        </div>
        <h2 style={styles.title}>Verify OTP</h2>
        <p style={styles.subtitle}>Enter the 6-digit OTP sent to your registered email.</p>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          {message && <div style={{color: 'green', textAlign:'center', fontSize: '14px'}}>{message}</div>}
          {error && <div style={{color: 'red', textAlign:'center', fontSize: '14px'}}>{error}</div>}
          
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Employee ID</label>
            <input 
              type="text" 
              style={styles.inputField} 
              value={employeeId} 
              onChange={(e) => setEmployeeId(e.target.value)} 
              required 
              readOnly={!!searchParams.get("employeeId")}
            />
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Enter OTP</label>
            <input 
              type="text" 
              placeholder="6-digit OTP" 
              style={{...styles.inputField, textAlign: 'center', letterSpacing: '8px', fontSize: '20px', fontWeight: 'bold'}} 
              value={otp} 
              onChange={(e) => setOtp(e.target.value)} 
              maxLength={6}
              required 
            />
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
        
        <div style={styles.backLink} onClick={() => navigate("/forgot-password")}>
          Resend OTP
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
