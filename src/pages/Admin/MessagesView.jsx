import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { MessageSquare, CheckCircle, Mail, Clock } from 'lucide-react';

const MessagesView = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/messages/inbox');
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/messages/read/${id}`, { method: 'PUT' });
      if (res.ok) {
        setMessages(messages.map(m => m._id === id ? { ...m, status: 'Read' } : m));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Inbox</h1>
          <p style={styles.subtitle}>View incoming messages and contact submissions.</p>
        </div>
      </header>

      {loading ? (
        <p style={{textAlign: 'center', color: '#64748b'}}>Loading messages...</p>
      ) : error ? (
        <p style={{textAlign: 'center', color: '#dc2626'}}>{error}</p>
      ) : messages.length === 0 ? (
        <div style={styles.emptyState}>
          <Mail size={48} color="#cbd5e1" />
          <p>No messages in your inbox.</p>
        </div>
      ) : (
        <div style={styles.messageList}>
          {messages.map(msg => (
            <div key={msg._id} style={{
              ...styles.messageCard, 
              borderLeft: msg.status === 'Unread' ? '4px solid #F17F08' : '4px solid transparent',
              background: msg.status === 'Unread' ? '#fff' : '#f8fafc'
            }}>
              <div style={styles.cardHeader}>
                <div style={styles.senderInfo}>
                  <strong>{msg.senderName}</strong>
                  <span style={styles.date}>{formatDate(msg.createdAt)}</span>
                </div>
                {msg.status === 'Unread' ? (
                  <button onClick={() => markAsRead(msg._id)} style={styles.readBtn}>
                    <CheckCircle size={14} /> Mark Read
                  </button>
                ) : (
                  <span style={styles.readBadge}>Read</span>
                )}
              </div>
              <h3 style={styles.msgSubject}>{msg.subject}</h3>
              <p style={styles.msgBody}>{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  title: { margin: '0 0 8px 0', fontSize: '28px', color: '#1e293b' },
  subtitle: { margin: 0, color: '#64748b' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8' },
  messageList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  messageCard: { padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'all 0.2s' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  senderInfo: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '15px', color: '#334155' },
  date: { fontSize: '13px', color: '#64748b' },
  readBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  readBadge: { fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', padding: '6px 0' },
  msgSubject: { margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' },
  msgBody: { margin: 0, color: '#475569', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }
};

export default MessagesView;
