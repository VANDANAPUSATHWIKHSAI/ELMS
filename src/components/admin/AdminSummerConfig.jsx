import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../utils/api';
import { Calendar, Layers, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

const AdminSummerConfig = () => {
  const { notify } = useNotification();
  const [config, setConfig] = useState({
    summerMonths: [],
    rules: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/admin/summer-config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      notify("Failed to load configuration", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMonth = (index) => {
    const updatedMonths = config.summerMonths.includes(index)
      ? config.summerMonths.filter(m => m !== index)
      : [...config.summerMonths, index].sort((a, b) => a - b);
    
    setConfig({ ...config, summerMonths: updatedMonths });
  };

  const handleAddRule = () => {
    setConfig({
      ...config,
      rules: [...config.rules, { minYears: 0, maxYears: null, leaveCount: 0 }]
    });
  };

  const handleRemoveRule = (index) => {
    const updatedRules = config.rules.filter((_, i) => i !== index);
    setConfig({ ...config, rules: updatedRules });
  };

  const handleRuleChange = (index, field, value) => {
    const updatedRules = config.rules.map((rule, i) => {
      if (i === index) {
        return { ...rule, [field]: value === "" ? null : Number(value) };
      }
      return rule;
    });
    setConfig({ ...config, rules: updatedRules });
  };

  const handleSave = async () => {
    if (config.summerMonths.length === 0) {
      return notify("Please select at least one summer month", "error");
    }
    if (config.rules.length === 0) {
      return notify("Please add at least one tenure rule", "error");
    }

    setSaving(true);
    try {
      const res = await apiFetch('http://localhost:5000/api/admin/summer-config', {
        method: 'POST',
        body: JSON.stringify(config)
      });
      if (res.ok) {
        notify("Summer configuration updated successfully", "success");
      } else {
        notify("Failed to save configuration", "error");
      }
    } catch (err) {
      notify("Network error", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Loading configuration...</div>;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Summer Leave Configuration</h1>
        <p style={styles.subtitle}>Define summer holiday periods and tenure-based leave quotas.</p>
      </header>

      <div style={styles.grid}>
        {/* Months Selection */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <Calendar size={20} color="#F17F08" />
            <h3 style={styles.cardTitle}>Summer Holiday Months</h3>
          </div>
          <p style={styles.cardDesc}>Select the months during which employees can apply for Summer Leave.</p>
          
          <div style={styles.monthsGrid}>
            {months.map((month, index) => (
              <button
                key={month}
                onClick={() => handleToggleMonth(index)}
                style={{
                  ...styles.monthBtn,
                  background: config.summerMonths.includes(index) ? '#F17F08' : '#f8fafc',
                  color: config.summerMonths.includes(index) ? '#fff' : '#475569',
                  borderColor: config.summerMonths.includes(index) ? '#F17F08' : '#e2e8f0',
                }}
              >
                {month}
              </button>
            ))}
          </div>
        </div>

        {/* Tenure Rules */}
        <div style={{ ...styles.card, flex: 1.5 }}>
          <div style={styles.cardHeader}>
            <Layers size={20} color="#F17F08" />
            <h3 style={styles.cardTitle}>Tenure-based Quotas</h3>
          </div>
          <p style={styles.cardDesc}>Define how many leaves an employee gets based on their years of service.</p>

          <div style={styles.rulesList}>
            {config.rules.map((rule, index) => (
              <div key={index} style={styles.ruleItem}>
                <div style={styles.ruleInputs}>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Min Years</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      style={styles.input}
                      value={rule.minYears}
                      onChange={(e) => handleRuleChange(index, 'minYears', e.target.value)}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Max Years (Optional)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      style={styles.input}
                      placeholder="∞"
                      value={rule.maxYears || ""}
                      onChange={(e) => handleRuleChange(index, 'maxYears', e.target.value)}
                    />
                  </div>
                  <div style={styles.inputGroup}>
                    <label style={styles.label}>Leave Count</label>
                    <input
                      type="number"
                      min="0"
                      style={{ ...styles.input, fontWeight: 'bold', color: '#F17F08' }}
                      value={rule.leaveCount}
                      onChange={(e) => handleRuleChange(index, 'leaveCount', e.target.value)}
                    />
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveRule(index)} 
                  style={styles.iconBtn} 
                  title="Remove Rule"
                >
                  <Trash2 size={18} color="#ef4444" />
                </button>
              </div>
            ))}
          </div>

          <button onClick={handleAddRule} style={styles.addBtn}>
            <Plus size={18} /> Add New Rule
          </button>
        </div>
      </div>

      <div style={styles.footer}>
        <div style={styles.warningBox}>
          <AlertTriangle size={18} color="#b45309" />
          <span>Updates take effect immediately for new leave applications.</span>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          style={{ ...styles.saveBtn, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? 'Saving Changes...' : <><Save size={18} /> Save Configuration</>}
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  title: { margin: '0 0 8px 0', fontSize: '28px', color: '#1e293b', fontWeight: '800' },
  subtitle: { margin: 0, color: '#64748b', fontSize: '15px' },
  grid: { display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' },
  card: { flex: 1, minWidth: '340px', background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' },
  cardDesc: { fontSize: '14px', color: '#64748b', marginBottom: '20px' },
  monthsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' },
  monthBtn: { padding: '10px', borderRadius: '8px', border: '1px solid', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' },
  rulesList: { display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' },
  ruleItem: { display: 'flex', alignItems: 'flex-end', gap: '15px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' },
  ruleInputs: { flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' },
  input: { padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', ':hover': { background: '#fee2e2' } },
  addBtn: { display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: '1px dashed #cbd5e1', color: '#64748b', padding: '12px', borderRadius: '12px', width: '100%', justifyContent: 'center', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', ':hover': { borderColor: '#F17F08', color: '#F17F08', background: '#fffaf0' } },
  saveBtn: { display: 'flex', alignItems: 'center', gap: '10px', background: '#F17F08', color: '#fff', border: 'none', padding: '14px 28px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 10px 15px -3px rgba(241,127,8,0.3)' },
  footer: { marginTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '30px' },
  warningBox: { display: 'flex', alignItems: 'center', gap: '10px', background: '#fffbeb', padding: '12px 20px', borderRadius: '10px', border: '1px solid #fef3c7', color: '#92400e', fontSize: '14px' }
};

export default AdminSummerConfig;
