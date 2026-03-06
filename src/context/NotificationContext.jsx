import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, HelpCircle, X } from 'lucide-react';

const NotificationContext = createContext(null);

// ─── TOAST COMPONENT ────────────────────────────────────────────────────────
const iconMap = {
  success: <CheckCircle size={20} color="#22c55e" />,
  error:   <XCircle    size={20} color="#ef4444" />,
  warning: <AlertCircle size={20} color="#f59e0b" />,
  info:    <Info        size={20} color="#3b82f6" />,
};

const Toast = ({ notifications, removeNotification }) => (
  <div style={toastWrap}>
    {notifications.map(n => (
      <div key={n.id} style={{ ...toastBase, ...toastVariant[n.type] }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {iconMap[n.type] || iconMap.info}
          <span style={{ fontSize: 14, fontWeight: 500, color: '#1e293b' }}>{n.message}</span>
        </span>
        <button onClick={() => removeNotification(n.id)} style={dismissBtn} aria-label="Dismiss">
          <X size={14} color="#64748b" />
        </button>
      </div>
    ))}
  </div>
);

// ─── CONFIRM DIALOG COMPONENT ────────────────────────────────────────────────
const ConfirmDialog = ({ config, onConfirm, onCancel }) => {
  if (!config) return null;
  return (
    <div style={overlayStyle}>
      <div style={dialogBox}>
        <div style={dialogIcon}>
          <HelpCircle size={36} color="#F17F08" />
        </div>
        <h3 style={dialogTitle}>{config.title || 'Are you sure?'}</h3>
        <p style={dialogMsg}>{config.message}</p>
        <div style={dialogActions}>
          <button onClick={onCancel} style={btnCancel}>Cancel</button>
          <button onClick={onConfirm}
            style={{
              ...btnConfirm,
              background: config.danger ? '#ef4444' : '#F17F08'
            }}>
            {config.confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PROVIDER ────────────────────────────────────────────────────────────────
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [confirmConfig, setConfirmConfig]   = useState(null);
  const [confirmResolve, setConfirmResolve] = useState(null);

  const notify = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), duration);
  }, []);

  const removeNotification = useCallback(id => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Returns a Promise<boolean> — true = confirmed, false = cancelled
  const showConfirm = useCallback((message, { title, confirmLabel, danger } = {}) => {
    return new Promise(resolve => {
      setConfirmConfig({ message, title, confirmLabel, danger });
      setConfirmResolve(() => resolve);
    });
  }, []);

  const handleConfirm = () => {
    confirmResolve && confirmResolve(true);
    setConfirmConfig(null);
    setConfirmResolve(null);
  };

  const handleCancel = () => {
    confirmResolve && confirmResolve(false);
    setConfirmConfig(null);
    setConfirmResolve(null);
  };

  return (
    <NotificationContext.Provider value={{ notify, showConfirm }}>
      {children}
      <Toast notifications={notifications} removeNotification={removeNotification} />
      <ConfirmDialog config={confirmConfig} onConfirm={handleConfirm} onCancel={handleCancel} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

// ─── STYLES ──────────────────────────────────────────────────────────────────
const toastWrap = {
  position: 'fixed', bottom: 30, left: '50%', transform: 'translateX(-50%)',
  display: 'flex', flexDirection: 'column', gap: 10, zIndex: 99999,
  alignItems: 'center', pointerEvents: 'none',
};
const toastBase = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  padding: '12px 18px', borderRadius: 12, minWidth: 280, maxWidth: 440,
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)', animation: 'slideUp 0.3s ease',
  pointerEvents: 'all', border: '1px solid transparent',
};
const toastVariant = {
  success: { background: '#f0fdf4', borderColor: '#bbf7d0' },
  error:   { background: '#fef2f2', borderColor: '#fecaca' },
  warning: { background: '#fffbeb', borderColor: '#fde68a' },
  info:    { background: '#eff6ff', borderColor: '#bfdbfe' },
};
const dismissBtn = {
  background: 'none', border: 'none', cursor: 'pointer', padding: 2,
  display: 'flex', alignItems: 'center', borderRadius: 4, flexShrink: 0,
};
const overlayStyle = {
  position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 99998, backdropFilter: 'blur(3px)',
};
const dialogBox = {
  background: '#fff', borderRadius: 20, padding: '36px 32px',
  maxWidth: 420, width: '90%', textAlign: 'center',
  boxShadow: '0 25px 60px rgba(0,0,0,0.18)', animation: 'fadeIn 0.2s ease',
};
const dialogIcon  = { marginBottom: 16 };
const dialogTitle = { margin: '0 0 8px 0', fontSize: 20, fontWeight: 700, color: '#1e293b' };
const dialogMsg   = { margin: '0 0 28px 0', fontSize: 15, color: '#64748b', lineHeight: 1.5 };
const dialogActions = { display: 'flex', justifyContent: 'center', gap: 12 };
const btnCancel   = {
  padding: '10px 22px', borderRadius: 10, border: '1px solid #cbd5e1',
  background: '#fff', color: '#64748b', cursor: 'pointer', fontWeight: 600, fontSize: 14,
};
const btnConfirm  = {
  padding: '10px 22px', borderRadius: 10, border: 'none',
  color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 14,
};
