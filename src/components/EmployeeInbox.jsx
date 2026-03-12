import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Mail, CornerDownRight, Inbox, Clock, Send, Trash2 } from 'lucide-react';
import ConfirmationModal from './common/ConfirmationModal';

const EmployeeInbox = () => {
  const [replies, setReplies] = useState([]);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const [repliesRes, receivedRes, sentRes] = await Promise.all([
        apiFetch(`${window.location.protocol}//${window.location.hostname}:5000/api/messages/my-replies`),
        apiFetch(`${window.location.protocol}//${window.location.hostname}:5000/api/messages/received`),
        apiFetch(`${window.location.protocol}//${window.location.hostname}:5000/api/messages/sent`)
      ]);
      
      if (repliesRes.ok) setReplies(await repliesRes.json());
      if (receivedRes.ok) setReceived(await receivedRes.json());
      if (sentRes.ok) setSent(await sentRes.json());
    } catch (err) {
      console.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const markReceivedRead = async (id) => {
    try {
      const res = await apiFetch(`${window.location.protocol}//${window.location.hostname}:5000/api/messages/received/read/${id}`, { method: 'PUT' });
      if (res.ok) {
        setReceived(prev => prev.map(m => m._id === id ? { ...m, status: 'Read' } : m));
        window.dispatchEvent(new Event('messagesUpdated'));
      }
    } catch (err) { console.error(err); }
  };

  const markReplyRead = async (id) => {
    try {
      const res = await apiFetch(`${window.location.protocol}//${window.location.hostname}:5000/api/messages/my-replies/read/${id}`, { method: 'PUT' });
      if (res.ok) {
        setReplies(prev => prev.map(m => m._id === id ? { ...m, replyStatus: 'Read' } : m));
        window.dispatchEvent(new Event('messagesUpdated'));
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteClick = (id) => {
    setIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!idToDelete) return;
    const id = idToDelete;
    setDeletingId(id);
    try {
      const res = await apiFetch(`${window.location.protocol}//${window.location.hostname}:5000/api/messages/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setReceived(prev => prev.filter(m => m._id !== id));
        setReplies(prev => prev.filter(m => m._id !== id));
        setSent(prev => prev.filter(m => m._id !== id));
        window.dispatchEvent(new Event('messagesUpdated'));
      }
    } catch (err) { console.error(err); }
    finally { 
      setDeletingId(null);
      setIdToDelete(null);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleString('en-GB', { 
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  if (loading) return <div style={{padding: '40px', textAlign: 'center', color: '#64748b'}}>Loading your inbox...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>My Inbox</h1>
        <p style={styles.subtitle}>View messages from leadership and replies to your queries.</p>
      </header>

      {/* Tab Switcher */}
      <div style={styles.tabBar}>
        <button 
          onClick={() => setActiveTab('received')} 
          style={{...styles.tab, borderBottom: activeTab === 'received' ? '3px solid #3b82f6' : 'none', color: activeTab === 'received' ? '#3b82f6' : '#64748b'}}
        >
          <Inbox size={18} /> Inbox ({received.length + replies.length})
          {(received.filter(m => m.status === 'Unread').length + replies.filter(m => m.replyStatus === 'Unread').length) > 0 && (
            <span style={{...styles.headerBadge, marginLeft: '8px', padding: '2px 6px', fontSize: '10px'}}>
              {received.filter(m => m.status === 'Unread').length + replies.filter(m => m.replyStatus === 'Unread').length} New
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('sent')} 
          style={{...styles.tab, borderBottom: activeTab === 'sent' ? '3px solid #3b82f6' : 'none', color: activeTab === 'sent' ? '#3b82f6' : '#64748b'}}
        >
          <Mail size={18} /> Sent ({sent.length})
        </button>
      </div>

      {activeTab === 'received' ? (
        <div style={styles.sectionsGrid}>
          {/* SECTION 1: DIRECT MESSAGES FROM ADMIN */}
          <div style={styles.section}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Inbox size={20} color="#3b82f6" />
                <h2 style={{...styles.sectionTitle, color: '#3b82f6'}}>Official Communications</h2>
              </div>
              {received.filter(m => m.status === 'Unread').length > 0 && (
                <span style={styles.headerBadge}>
                  {received.filter(m => m.status === 'Unread').length} New
                </span>
              )}
            </div>
            
            {received.length === 0 ? (
              <div style={styles.emptyState}>
                <Mail size={32} color="#cbd5e1" />
                <p>No direct messages from leadership yet.</p>
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
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        {msg.status === 'Unread' && (
                          <button onClick={() => markReceivedRead(msg._id)} style={styles.readBtn}>Mark Read</button>
                        )}
                        <button 
                          onClick={() => handleDeleteClick(msg._id)} 
                          disabled={deletingId === msg._id}
                          style={styles.deleteBtn}
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CornerDownRight size={20} color="#10b981" />
                <h2 style={{...styles.sectionTitle, color: '#10b981'}}>Replies to My Sent Messages</h2>
              </div>
              {replies.filter(m => m.replyStatus === 'Unread').length > 0 && (
                <span style={{...styles.headerBadge, backgroundColor: '#10b981'}}>
                  {replies.filter(m => m.replyStatus === 'Unread').length} New
                </span>
              )}
            </div>
            
            {replies.length === 0 ? (
              <div style={styles.emptyState}>
                <Clock size={32} color="#cbd5e1" />
                <p>No replies to your queries yet.</p>
              </div>
            ) : (
              <div style={styles.messageList}>
                {replies.map(msg => (
                  <div key={msg._id} style={{
                    ...styles.msgCard, 
                    borderLeft: msg.replyStatus === 'Unread' ? '4px solid #10b981' : '4px solid #e2e8f0',
                    background: msg.replyStatus === 'Unread' ? '#f0fdf4' : '#fff'
                  }}>
                    <div style={styles.cardTop}>
                      <div style={{...styles.meta, marginBottom: '8px'}}>Re: {msg.subject} • Replied on {formatDate(msg.repliedAt)}</div>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        {msg.replyStatus === 'Unread' && (
                          <button onClick={() => markReplyRead(msg._id)} style={{...styles.readBtn, backgroundColor: '#10b981'}}>Mark Read</button>
                        )}
                        <button 
                          onClick={() => handleDeleteClick(msg._id)} 
                          disabled={deletingId === msg._id}
                          style={styles.deleteBtn}
                          title="Delete message"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={styles.replyBubble}>
                      <p style={{margin: 0}}>{msg.reply}</p>
                    </div>
                    <div style={{marginTop: '12px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '13px'}}>
                      <span style={{color: '#64748b', fontWeight: 'bold'}}>Original Message:</span>
                      <p style={{margin: '4px 0 0 0', color: '#94a3b8'}}>{msg.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* SENT TAB */
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={{...styles.sectionTitle, color: '#3b82f6'}}>Messages I've Sent</h2>
          </div>
          {sent.length === 0 ? (
            <div style={styles.emptyState}>
              <Send size={32} color="#cbd5e1" />
              <p>You haven't sent any messages yet.</p>
            </div>
          ) : (
            <div style={styles.messageList}>
              {sent.map(msg => (
                <div key={msg._id} style={{...styles.msgCard, borderLeft: '4px solid #e2e8f0'}}>
                  <div style={styles.cardTop}>
                    <div>
                      <strong style={styles.subject}>{msg.subject}</strong>
                      <div style={styles.meta}>To: {msg.recipientName} • {formatDate(msg.createdAt)}</div>
                    </div>
                    <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                      {msg.status === 'Read' && <span style={{fontSize: '12px', color: '#10b981', fontWeight: 'bold'}}>✓ Seen</span>}
                      <button 
                        onClick={() => handleDeleteClick(msg._id)} 
                        disabled={deletingId === msg._id}
                        style={styles.deleteBtn}
                        title="Delete message"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={styles.body}>{msg.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmText="Delete Message"
      />
    </div>
  );
};

const styles = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '16px' },
  header: { marginBottom: '30px' },
  title: { fontSize: '28px', color: '#1e293b', margin: '0 0 8px 0' },
  subtitle: { color: '#64748b', margin: 0 },
  tabBar: { display: 'flex', gap: '20px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' },
  tab: { display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '15px', fontWeight: '600', transition: 'all 0.2s' },
  sectionsGrid: { display: 'flex', flexDirection: 'column', gap: '30px' },
  section: { background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' },
  sectionTitle: { fontSize: '18px', margin: 0, fontWeight: '700' },
  emptyState: { padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', color: '#94a3b8', fontSize: '14px' },
  messageList: { display: 'flex', flexDirection: 'column', gap: '16px' },
  msgCard: { padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' },
  subject: { fontSize: '15px', color: '#0f172a' },
  meta: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  body: { margin: '8px 0 0 0', color: '#334155', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' },
  readBtn: { background: '#3b82f6', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' },
  deleteBtn: { background: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', padding: '5px 8px', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' },
  replyBubble: { padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' },
  headerBadge: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 'bold',
    marginLeft: 'auto'
  }
};

export default EmployeeInbox;
