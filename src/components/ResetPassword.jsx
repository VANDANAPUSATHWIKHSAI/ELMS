import { apiFetch } from "../utils/api"; 
import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import collegeLogo from "../assets/logo.png";
import { Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const employeeId = searchParams.get("employeeId");
  const token = searchParams.get("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await apiFetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, token, newPassword }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage("Password updated successfully! Redirecting to login...");
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        setError(data.message || "Failed to update password.");
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
    submitBtn: { marginTop: '10px', padding: '14px', borderRadius: '8px', border: 'none', fontSize: '16px', fontWeight: '700', cursor: 'pointer', backgroundColor: '#F17F08', color: '#ffffff', width: '100%' }
  };

  if (!employeeId || !token) {
    return (
      <div style={styles.pageWrapper}>
        <div style={styles.card}>
          <h2 style={{color: 'red'}}>Invalid Session</h2>
          <p>Please restart the password reset process.</p>
          <button style={styles.submitBtn} onClick={() => navigate("/")}>Go to Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.card}>
        <div style={styles.logoHeader}>
          <img src={collegeLogo} alt="KMIT Logo" style={styles.logoImage} />
        </div>
        <h2 style={styles.title}>Reset Password</h2>
        <p style={styles.subtitle}>Enter your new password below to update your account.</p>
        
        <form style={styles.form} onSubmit={handleSubmit}>
          {message && <div style={{color: 'green', textAlign:'center', fontSize: '14px'}}>{message}</div>}
          {error && <div style={{color: 'red', textAlign:'center', fontSize: '14px'}}>{error}</div>}
          
          <div style={styles.inputWrapper}>
            <label style={styles.label}>New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showNewPassword ? "text" : "password"} 
                placeholder="Enter new password" 
                style={styles.inputField} 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                placeholder="Confirm new password" 
                style={styles.inputField} 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
