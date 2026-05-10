import { useState, useEffect } from 'react';
import { Star, TrendingUp, ThumbsUp, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { feedbackApi } from '../api';

function Stars({ rating, size = 16 }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= rating ? '#f59e0b' : '#d1d5db', fontSize: size }}>★</span>
      ))}
    </span>
  );
}

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([feedbackApi.getAll(), feedbackApi.stats()])
      .then(([fb, st]) => { setFeedbacks(fb.data); setStats(st.data); })
      .catch(() => toast.error('Failed to load feedback'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const ratingDist = [5,4,3,2,1].map(r => ({
    r,
    count: feedbacks.filter(f => f.rating === r).length,
    pct: feedbacks.length ? Math.round((feedbacks.filter(f => f.rating === r).length / feedbacks.length) * 100) : 0
  }));

  return (
    <div>
      <div className="page-header">
        <div><h1>Customer Feedback</h1><p>{feedbacks.length} reviews collected</p></div>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
        {[
          { icon: <Star size={22} />, label: 'Avg Rating',  value: stats?.averageRating?.toFixed(1) || '—', color: '#f59e0b', bg: '#fef3c7' },
          { icon: <MessageSquare size={22} />, label: 'Total Reviews', value: stats?.totalFeedback || 0,  color: '#3b82f6', bg: '#dbeafe' },
          { icon: <ThumbsUp size={22} />, label: 'Positive',    value: stats?.positiveCount || 0,  color: '#25D366', bg: '#dcf8c6' },
          { icon: <TrendingUp size={22} />, label: 'Satisfaction', value: `${stats?.satisfactionRate || 0}%`, color: '#7c3aed', bg: '#ede9fe' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
            <div className="stat-info"><h3 style={{ color: s.color }}>{s.value}</h3><p>{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        {/* Rating distribution */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Rating Distribution</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ratingDist.map(({ r, count, pct }) => (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Stars rating={r} size={14} />
                <div style={{ flex: 1, background: '#f3f4f6', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, background: r >= 4 ? '#25D366' : r === 3 ? '#f59e0b' : '#ef4444', height: '100%', transition: 'width 0.5s', borderRadius: 4 }} />
                </div>
                <span style={{ fontSize: 12, color: '#6b7280', minWidth: 24 }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent reviews */}
        <div className="card">
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Recent Reviews</h3>
          {feedbacks.length === 0 ? (
            <div className="empty-state" style={{ padding: '20px 0' }}>
              <Star style={{ display: 'block', margin: '0 auto 10px' }} />
              <h3>No feedback yet</h3>
              <p>Send feedback requests after service delivery</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 360, overflowY: 'auto' }}>
              {feedbacks.map(f => (
                <div key={f.id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Stars rating={f.rating} size={16} />
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>{f.createdAt ? new Date(f.createdAt).toLocaleDateString('en-IN') : ''}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Job #{f.jobNumber}</div>
                  {f.comment && <div style={{ fontSize: 13, marginTop: 6, fontStyle: 'italic', color: '#374151' }}>"{f.comment}"</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
