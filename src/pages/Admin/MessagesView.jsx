import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { MessageSquare, CheckCircle, Mail, CornerDownRight, Send, X, PenLine } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const MessagesView = () => {
  const { notify } = useNotification();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  
  // Compose new message to employee
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState({ recipientId: '', subject: '', message: '' });
  const [composeSending, setComposeSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await apiFetch('http://localhost:5000/api/messages/inbox');
      if (!res.ok) throw new Error("Failed to fetch messages");
      setMessages(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const res = await apiFetch(`http://localhost:5000/api/messages/read/${id}`, { method: 'PUT' });
      if (res.ok) setMessages(prev => prev.map(m => m._id === id ? { ...m, status: 'Read' } : m));
    } catch (err) { console.error(err); }
  };

  const sendReply = async (msgId) => {
    if (!replyText.trim()) return notify('Reply cannot be empty', 'warning');
    setReplySending(true);
    try {
      const res = await apiFetch(`http://localhost:5000/api/messages/reply/${msgId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText })
      });
      const data = await res.json();
      if (res.ok) {
        notify('Reply sent to employee!', 'success');
        setMessages(prev => prev.map(m => m._id === msgId ? { ...m, reply: replyText, status: 'Read' } : m));
        setReplyingTo(null);
        setReplyText('');
      } else {
        notify(data.message || 'Failed to send reply', 'error');
      }
    } catch (err) {
      notify('Server error', 'error');
    } finally {
      setReplySending(false);
    }
  };

  const sendCompose = async (e) => {
    e.preventDefault();
    setComposeSending(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/messages/send-to-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compose)
      });
      const data = await res.json();
      if (res.ok) {
        notify(data.message, 'success');
        setShowCompose(false);
        setCompose({ recipientId: '', subject: '', message: '' });
      } else {
        notify(data.message || 'Failed to send message', 'error');
      }
    } catch (err) {
      notify('Server error', 'error');
    } finally {
      setComposeSending(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Inbox</h1>
          <p style={styles.subtitle}>View incoming messages and reply, or compose new ones to employees.</p>
        </div>
        <button onClick={() => setShowCompose(!showCompose)} style={styles.composeBtn}>
          <PenLine size={16} /> Compose Message
        </button>
      </header>

      {/* Compose Panel */}
      {showCompose && (
        <div style={styles.composePanel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#1e293b' }}>📝 New Message to Employee</h3>
            <button onClick={() => setShowCompose(false)} style={styles.closeBtn}><X size={18} /></button>
          </div>
          <form onSubmit={sendCompose} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={styles.label}>Employee ID *</label>
              <input
                required
                type="text"
                placeholder="e.g. EMP001"
                value={compose.recipientId}
                onChange={e => setCompose({ ...compose, recipientId: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Subject *</label>
              <input
                required
                type="text"
                placeholder="Subject of your message"
                value={compose.subject}
                onChange={e => setCompose({ ...compose, subject: e.target.value })}
                style={styles.input}
              />
            </div>
            <div>
              <label style={styles.label}>Message *</label>
              <textarea
                required
                rows={4}
                placeholder="Type your message here..."
                value={compose.message}
                onChange={e => setCompose({ ...compose, message: e.target.value })}
                style={{ ...styles.input, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowCompose(false)} style={styles.cancelBtn}>Cancel</button>
              <button type="submit" disabled={composeSending} style={styles.sendBtn}>
                <Send size={14} /> {composeSending ? 'Sending...' : 'Send to Employee'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inbox */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b' }}>Loading messages...</p>
      ) : error ? (
        <p style={{ textAlign: 'center', color: '#dc2626' }}>{error}</p>
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
              borderLeft: msg.status === 'Unread' ? '4px solid #F17F08' : '4px solid #10b981',
              background: msg.status === 'Unread' ? '#fff' : '#f8fafc'
            }}>
              <div style={styles.cardHeader}>
                <div style={styles.senderInfo}>
                  <strong>{msg.senderName}</strong>
                  <span style={styles.date}>{formatDate(msg.createdAt)}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {msg.status === 'Unread' ? (
                    <button onClick={() => markAsRead(msg._id)} style={styles.readBtn}>
                      <CheckCircle size={14} /> Mark Read
                    </button>
                  ) : (
                    <span style={styles.readBadge}>✓ Read</span>
                  )}
                  <button
                    onClick={() => { setReplyingTo(replyingTo === msg._id ? null : msg._id); setReplyText(''); }}
                    style={msg.reply ? styles.repliedBtn : styles.replyBtn}
                  >
                    <CornerDownRight size={14} /> {msg.reply ? 'Edit Reply' : 'Reply'}
                  </button>
                </div>
              </div>
              <h3 style={styles.msgSubject}>{msg.subject}</h3>
              <p style={styles.msgBody}>{msg.message}</p>

              {msg.reply && replyingTo !== msg._id && (
                <div style={styles.existingReply}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <CornerDownRight size={14} color="#10b981" />
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#10b981' }}>YOUR REPLY</span>
                    {msg.repliedAt && <span style={{ fontSize: '11px', color: '#94a3b8' }}>• {formatDate(msg.repliedAt)}</span>}
                  </div>
                  <p style={{ margin: 0, color: '#334155', fontSize: '14px', lineHeight: '1.5' }}>{msg.reply}</p>
                </div>
              )}

              {replyingTo === msg._id && (
                <div style={styles.replyBox}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                    <CornerDownRight size={14} color="#F17F08" />
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#F17F08' }}>Reply to {msg.senderName}</span>
                  </div>
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    rows={3}
                    style={styles.replyTextarea}
                    placeholder="Type your reply here..."
                  />
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} style={styles.cancelBtn}><X size={14} /> Cancel</button>
                    <button onClick={() => sendReply(msg._id)} disabled={replySending} style={styles.sendBtn}>
                      <Send size={14} /> {replySending ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '900px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { margin: '0 0 8px 0', fontSize: '28px', color: '#1e293b' },
  subtitle: { margin: 0, color: '#64748b', fontSize: '14px' },
  composeBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: '#F17F08', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', whiteSpace: 'nowrap' },
  composePanel: { background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' },
  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px', background: '#fff', borderRadius: '12px', border: '1px dashed #cbd5e1', color: '#94a3b8' },
  messageList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  messageCard: { padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' },
  senderInfo: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '15px', color: '#334155' },
  date: { fontSize: '13px', color: '#64748b' },
  readBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#3b82f6', border: 'none', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  readBadge: { fontSize: '12px', color: '#10b981', fontWeight: 'bold', padding: '6px 0' },
  replyBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#fff7ed', color: '#F17F08', border: '1px solid #fed7aa', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  repliedBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', color: '#10b981', border: '1px solid #bbf7d0', padding: '6px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' },
  msgSubject: { margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' },
  msgBody: { margin: 0, color: '#475569', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap' },
  existingReply: { marginTop: '16px', padding: '14px 16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' },
  replyBox: { marginTop: '16px', padding: '16px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' },
  replyTextarea: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '6px' },
  input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  cancelBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: 'white', color: '#64748b', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600' },
  sendBtn: { display: 'flex', alignItems: 'center', gap: '6px', background: '#F17F08', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '700' },
};

export default MessagesView;
