import { apiFetch } from "../../utils/api";
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { TrendingUp, BarChart2, Info } from 'lucide-react';

const PrincipalAnalytics = () => {
  const { user } = useAuth();
  const [trends, setTrends] = useState([]);
  const [totalStaff, setTotalStaff] = useState(0);
  const [loading, setLoading] = useState(true);
  const kmitOrange = "#F17F08";

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const resStats = await apiFetch(`http://localhost:5000/api/principal/stats`);
        if (resStats.ok) {
          const stats = await resStats.json();
          setTotalStaff(stats.totalStaff);
        }

        const resTrends = await apiFetch(`http://localhost:5000/api/principal/analytics/trends`);
        if (resTrends.ok) setTrends(await resTrends.json());
      } catch (err) {
        console.error("Failed to fetch principal analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalyticsData();
  }, []);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Institutional Analytics</h1>
        <p style={styles.subtitle}>Detailed analysis of leave patterns and trends</p>
      </header>

      {/* TRENDS CARD */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
            <TrendingUp size={22} color={kmitOrange} />
            <h3 style={styles.cardTitle}>Monthly Leave Trends</h3>
          </div>
          <div style={styles.badge}>Last 6 Months</div>
        </div>
        
        <p style={styles.description}>
          This chart represents the total number of leaves taken across all departments each month. 
          Use this to identify peak leave periods and plan institutional resources.
        </p>

        {loading ? (
          <div style={styles.loadingWrapper}>
            <p>Loading analytics data...</p>
          </div>
        ) : (
          <div style={styles.trendsContainer}>
            {(() => {
              const maxCount = Math.max(...trends.map(t => t.count), 1);
              const maxHeight = 200; // Max visual height of the bar in px
              
              return trends.map((t, idx) => (
                <div key={idx} style={styles.trendBarWrapper}>
                  <div style={styles.tooltip}>{t.count} Leaves</div>
                  <div 
                    style={{
                      ...styles.trendBar, 
                      height: `${Math.max(10, (t.count / maxCount) * maxHeight)}px`, 
                    }} 
                  />
                  <span style={styles.trendMonth}>{t.month}</span>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* ADDITIONAL INSIGHTS (Placeholder) */}
      <div style={styles.insightsGrid}>
         <div style={{...styles.card, flex: 1}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px'}}>
               <BarChart2 size={20} color={kmitOrange} />
               <h4 style={{margin: 0, fontSize: '16px'}}>Key Insights</h4>
            </div>
            <ul style={styles.insightList}>
               <li>Highest leave activity typically occurs during mid-semester.</li>
               <li>Tuesday and Wednesday are statistically the lowest leave days.</li>
               <li>Departmental consistency is currently at 94%.</li>
            </ul>
         </div>
         
         <div style={{...styles.card, flex: 1, borderLeft: `4px solid ${kmitOrange}`}}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px'}}>
               <Info size={20} color={kmitOrange} />
               <h4 style={{margin: 0, fontSize: '16px'}}>Management Tip</h4>
            </div>
            <p style={{fontSize: '14px', color: '#64748b', lineHeight: '1.5', margin: 0}}>
               Encourage faculty to plan their Academic Leaves during semester breaks to minimize instructional disruption.
            </p>
         </div>
      </div>
    </div>
  );
};

const styles = {
  container: { width: '100%', maxWidth: '1000px', margin: '0 auto', paddingBottom: '40px' },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '28px', color: '#1e293b', fontWeight: '800', margin: 0 },
  subtitle: { color: '#64748b', marginTop: '8px', fontSize: '15px' },
  
  card: { background: 'white', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)', marginBottom: '24px' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' },
  cardTitle: { margin: 0, fontSize: '18px', color: '#1e293b', fontWeight: '700' },
  badge: { background: '#fff7ed', color: '#c2410c', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' },
  description: { fontSize: '14px', color: '#64748b', marginBottom: '40px', lineHeight: '1.5' },

  loadingWrapper: { height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' },
  
  trendsContainer: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '300px', borderBottom: '1px solid #f1f5f9', paddingBottom: '40px' },
  trendBarWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1, position: 'relative' },
  trendBar: { width: '40px', background: 'linear-gradient(to top, #F17F08, #fbbf24)', borderRadius: '8px 8px 4px 4px', transition: 'height 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  trendMonth: { fontSize: '12px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  tooltip: { background: '#1e293b', color: 'white', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', marginBottom: '5px', fontWeight: '600' },

  insightsGrid: { display: 'flex', gap: '24px', flexWrap: 'wrap' },
  insightList: { paddingLeft: '20px', margin: 0, color: '#64748b', fontSize: '14px', lineHeight: '2' }
};

export default PrincipalAnalytics;
