import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  type = "danger" // 'danger' or 'warning'
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{...styles.iconWrapper, backgroundColor: type === 'danger' ? '#fee2e2' : '#fef3c7'}}>
            <AlertCircle size={24} color={type === 'danger' ? '#ef4444' : '#f59e0b'} />
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <X size={20} color="#94a3b8" />
          </button>
        </div>
        
        <div style={styles.content}>
          <h3 style={styles.title}>{title}</h3>
          <p style={styles.message}>{message}</p>
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>
            {cancelText}
          </button>
          <button 
            style={{
              ...styles.confirmBtn, 
              backgroundColor: type === 'danger' ? '#ef4444' : '#f59e0b'
            }} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    transform: 'scale(1)',
    transition: 'transform 0.2s ease-out'
  },
  header: {
    padding: '20px 20px 0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    marginTop: '-4px',
    marginRight: '-4px'
  },
  content: {
    padding: '16px 20px 24px 20px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1e293b',
    margin: '0 0 8px 0'
  },
  message: {
    fontSize: '14px',
    color: '#64748b',
    lineHeight: '1.5',
    margin: 0
  },
  footer: {
    padding: '16px 20px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  cancelBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: 'white',
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  confirmBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  }
};

export default ConfirmationModal;
