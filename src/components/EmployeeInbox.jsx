import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Mail, CornerDownRight, Inbox, Clock } from 'lucide-react';

const EmployeeInbox = () => {
  const [replies, setReplies] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const [repliesRes, receivedRes] = await Promise.all([
        apiFetch('http://localhost:5000/api/messages/my-replies'),
        apiFetch('http://localhost:5000/api/messages/received')
      ]);
      
      if (repliesRes.ok) setReplies(await repliesRes.json());
      if (receivedRes.ok) setReceived(await receivedRes.json());
    } catch (err) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markReceivedRead = async (id) => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/messages/received/read/${id}`, { method: 'PUT' });
      if (res.ok) setReceived(prev => prev.map(m => m._id === id ? { ...m, status: 'Read' } : m));
    } catch (err) { console.error(err); }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Loading your inbox...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>My Inbox</h1>
        <p style={styles.subtitle}>View messages from administration and replies to your queries.</p>
      </header>

      <div style={styles.sectionsGrid}>
        {/* SECTION 1: DIRECT MESSAGES FROM ADMIN */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <Inbox size={20} color="#3b82f6" />
            <h2 style={{...styles.sectionTitle, color: '#3b82f6'}}>Admin Communications</h2>
          </div>
          
          {received.length === 0 ? (
            <div style={styles.emptyState}>
              <Mail size={32} color="#cbd5e1" />
              <p>No direct messages from administration yet.</p>
            </div>
          ) : (
            <div style={styles.messageList}>
              {received.map(msg => (
                <div key={msg._id} style={{
                  ...styles.msgCard,
                  borderLeft: msg.status === 'Unread' ? '4px solid #3b82f6' : '4px solid #e2e8f0',
                  background: msg.status === 'Unread' ? '#eff6ff' : '#fff'
                }}>
                  <div style={styles.cardTop}>
                    <div>
                      <strong style={styles.subject}>{msg.subject}</strong>
                      <div style={styles.meta}>From: {msg.senderName} • {formatDate(msg.createdAt)}</div>
                    </div>
                    {msg.status === 'Unread' && (
                      <button onClick={() => markReceivedRead(msg._id)} style={styles.readBtn}>Mark Read</button>
                    )}
                  </div>
                  <p style={styles.body}>{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 2: REPLIES TO USER'S MESSAGES */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <CornerDownRight size={20} color="#10b981" />
            <h2 style={{...styles.sectionTitle, color: '#10b981'}}>Replies to My Sent Messages</h2>
          </div>

          {replies.length === 0 ? (
            <div style={styles.emptyState}>
              <Clock size={32} color="#cbd5e1" />
              <p>No replies to your sent messages yet.</p>
            </div>
          ) : (
            <div style={styles.messageList}>
              {replies.map(msg => (
                <div key={msg._id} style={styles.replyThread}>
                   <div style={styles.originalMsg}>
                     <span style={styles.subject}>{msg.subject}</span>
                     <p style={{...styles.body, fontStyle: 'italic', color: '#64748b', fontSize: '13px'}}>Me: {msg.message}</p>
                   </div>
                   <div style={styles.replyBubble}>
                      <div style={styles.bubbleHeader}>
                        <CornerDownRight size={12} color="#10b981" />
                        <span>REPLY • {formatDate(msg.repliedAt)}</span>
                      </div>
                      <p style={styles.body}>{msg.reply}</p>
                   </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '20px' },
  header: { marginBottom: '30px' },
  title: { fontSize: '28px', color: '#1e293b', margin: '0 0 8px 0' },
  subtitle: { color: '#64748b', margin: 0 },
  sectionsGrid: { display: 'flex', flexDirection: 'column', gap: '30px' },
  section: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', margin: 0, fontWeight: '700' },
  emptyState: { padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '14px' },
  messageList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  msgCard: { padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' },
  subject: { fontSize: '15px', color: '#0f172a' },
  meta: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  body: { margin: '8px 0 0 0', color: '#334155', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  readBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' },
  replyThread: { display: 'flex', flexDirection: 'column', gap: '10px' },
  originalMsg: { padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' },
  replyBubble: { marginLeft: '20px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' },
  bubbleHeader: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }
};

export default EmployeeInbox;
