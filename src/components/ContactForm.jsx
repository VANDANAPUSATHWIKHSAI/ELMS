import React, { useState } from 'react';
import { apiFetch } from '../utils/api';
import { Send, MessageSquare } from 'lucide-react';

const ContactForm = () => {
  const [recipientRole, setRecipientRole] = useState('Admin');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState({ loading: false, success: null, error: null });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    try {
      const res = await apiFetch('http://localhost:5000/api/messages/send', {
        method: 'POST',
        body: JSON.stringify({ recipientRole, subject, message })
      });
      const data = await res.json();
      
      if (res.ok) {
        setStatus({ loading: false, success: "Message sent successfully!", error: null });
        setSubject('');
        setMessage('');
      } else {
        setStatus({ loading: false, success: null, error: data.message || "Failed to send message" });
      }
    } catch (err) {
      setStatus({ loading: false, success: null, error: "Server Error" });
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <MessageSquare size={24} color="#F17F08" />
        <h2 style={styles.title}>Contact Administration</h2>
      </div>
      
      {status.success && <div style={styles.successMsg}>{status.success}</div>}
      {status.error && <div style={styles.errorMsg}>{status.error}</div>}

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label style={styles.label}>Send To</label>
          <select 
            value={recipientRole} 
            onChange={e => setRecipientRole(e.target.value)}
            style={styles.input}
          >
            <option value="Admin">System Admin</option>
            <option value="Principal">Dean / Principal</option>
            <option value="HoD">Head of Department (HoD)</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Subject</label>
          <input 
            type="text" 
            value={subject} 
            onChange={e => setSubject(e.target.value)}
            required
            style={styles.input}
            placeholder="What is this regarding?"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Message</label>
          <textarea 
            value={message} 
            onChange={e => setMessage(e.target.value)}
            required
            style={{...styles.input, minHeight: '120px', resize: 'vertical'}}
            placeholder="Type your message here..."
          />
        </div>

        <button type="submit" disabled={status.loading} style={styles.submitBtn}>
          {status.loading ? 'Sending...' : <span style={{display:'flex', alignItems:'center', gap:'8px'}}><Send size={18}/> Send Message</span>}
        </button>
      </form>
    </div>
  );
};

const styles = {
  card: { background: '#fff', padding: '30px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: '600px', margin: '0 auto' },
  header: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' },
  title: { margin: 0, fontSize: '20px', color: '#1e293b' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { fontSize: '14px', fontWeight: '600', color: '#475569' },
  input: { padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px', outline: 'none', transition: 'border 0.2s', width: '100%', boxSizing: 'border-box' },
  submitBtn: { background: '#F17F08', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', transition: 'background 0.2s' },
  successMsg: { background: '#dcfce7', color: '#16a34a', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' },
  errorMsg: { background: '#fee2e2', color: '#dc2626', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', fontWeight: '500' }
};

export default ContactForm;
