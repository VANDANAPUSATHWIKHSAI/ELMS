import { apiFetch } from "../utils/api";
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import collegeLogo from "../assets/logo.png";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const [emailOrId, setEmailOrId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmailOrId(emailParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(data.message || "OTP sent successfully!");
        // Redirect to OTP verification page after 2 seconds
        setTimeout(() => {
          navigate(`/verify-otp?employeeId=${data.employeeId || emailOrId}`);
        }, 2000);
      } else {
        setError(data.message || "Failed to process request.");
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
        <h2 style={styles.title}>Forgot Password?</h2>
        <p style={styles.subtitle}>Enter your Employee ID or Email address to receive an OTP.</p>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          {message && <div style={{color: 'green', textAlign:'center', fontSize: '14px'}}>{message}</div>}
          {error && <div style={{color: 'red', textAlign:'center', fontSize: '14px'}}>{error}</div>}
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Employee ID / Email</label>
            <input 
              type="text" 
              placeholder="Enter Employee ID or Email" 
              style={styles.inputField} 
              value={emailOrId} 
              onChange={(e) => setEmailOrId(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
        
        <div style={styles.backLink} onClick={() => navigate("/")}>
          Back to Login
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
