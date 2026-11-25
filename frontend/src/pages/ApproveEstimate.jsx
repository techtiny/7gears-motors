import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { publicApprovalApi } from '../api';

// Public page opened by the customer from the WhatsApp "Send for Approval" link.
// No login — the random token in the URL identifies the estimate.

const inr = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const C = {
  page:   { minHeight: 'calc(100vh / var(--ui-zoom))', background: 'linear-gradient(135deg, #FFF7ED 0%, #FFFBF5 100%)', padding: '16px 12px 40px' },
  wrap:   { maxWidth: 640, margin: '0 auto' },
  card:   { background: 'white', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #F0DDD0', padding: 18, marginBottom: 14 },
  label:  { fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  value:  { fontSize: 15, fontWeight: 600, color: '#111827' },
};

function Banner({ status, respondedAt, comment }) {
  const map = {
    APPROVED:   { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: '✅', title: 'You approved this estimate' },
    REJECTED:   { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '❌', title: 'You rejected this estimate' },
    SUPERSEDED: { bg: '#f3f4f6', border: '#d1d5db', color: '#374151', icon: 'ℹ️', title: 'This estimate has been replaced by a newer one. Please use the latest link sent to you on WhatsApp.' },
    EXPIRED:    { bg: '#f3f4f6', border: '#d1d5db', color: '#374151', icon: '⏰', title: 'This approval link has expired. Please contact 7GEARS MOTORS.' },
  };
  const s = map[status];
  if (!s) return null;
  return (
    <div style={{ ...C.card, background: s.bg, borderColor: s.border, color: s.color }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>{s.icon} {s.title}</div>
      {respondedAt && <div style={{ fontSize: 13, marginTop: 4 }}>on {fmt(respondedAt)}</div>}
      {comment && <div style={{ fontSize: 13, marginTop: 6 }}>Your comment: “{comment}”</div>}
      {status === 'APPROVED' && <div style={{ fontSize: 13, marginTop: 6 }}>Thank you! Our team will proceed with the work.</div>}
      {status === 'REJECTED' && <div style={{ fontSize: 13, marginTop: 6 }}>Our team will contact you shortly.</div>}
    </div>
  );
}

export default function ApproveEstimate() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [confirming, setConfirming] = useState(null); // 'APPROVED' | 'REJECTED'
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    publicApprovalApi.get(token)
      .then(r => setData(r.data))
      .catch(e => setError(e?.response?.data?.message || 'This link is invalid or no longer available.'));
  }, [token]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const r = await publicApprovalApi.respond(token, { decision: confirming, comment });
      setData(r.data);
      setConfirming(null);
    } catch (e) {
      setError(e?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally { setSubmitting(false); }
  };

  const header = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
      <img src="/logo.png" alt="" style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#C0392B' }}>7GEARS MOTORS</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>Material Estimate Approval</div>
      </div>
    </div>
  );

  if (error && !data) return (
    <div style={C.page}><div style={C.wrap}>{header}
      <div style={{ ...C.card, textAlign: 'center', color: '#991b1b' }}>{error}</div>
    </div></div>
  );
  if (!data) return (
    <div style={C.page}><div style={C.wrap}>{header}
      <div style={{ ...C.card, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
    </div></div>
  );

  const shownStatus = data.expired ? 'EXPIRED' : data.status;
  const canRespond = shownStatus === 'PENDING';

  return (
    <div style={C.page}>
      <div style={C.wrap}>
        {header}

        <Banner status={shownStatus} respondedAt={data.respondedAt} comment={data.customerComment} />

        <div style={C.card}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><div style={C.label}>Customer</div><div style={C.value}>{data.customerName}</div></div>
            <div><div style={C.label}>Job No.</div><div style={C.value}>{data.jobNumber}</div></div>
            <div><div style={C.label}>Vehicle</div><div style={C.value}>{data.vehicleNumber}</div></div>
            <div><div style={C.label}>Make / Model</div><div style={C.value}>{data.vehicleName || '-'}</div></div>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>Estimate sent on {fmt(data.sentAt)}</div>
        </div>

        <div style={C.card}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>🔩 Material & Labour</div>
          {data.items.map((it, i) => (
            <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{i + 1}. {it.description}</div>
                <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }}>₹{inr(it.total)}</div>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>Part: ₹{inr(it.amount)}</span>
                {Number(it.labour) > 0 && <span>Labour: ₹{inr(it.labour)}</span>}
                {it.quantity != null && <span>Qty: {it.quantity}</span>}
                {it.remarks && <span>{it.remarks}</span>}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginTop: 10 }}>
            <span>Parts total</span><span>₹{inr(data.partsTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', marginTop: 4 }}>
            <span>Labour total</span><span>₹{inr(data.labourTotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, padding: '12px 14px', background: '#1a1a2e', color: 'white', borderRadius: 10, fontWeight: 700, fontSize: 16 }}>
            <span>Grand Total</span><span>₹{inr(data.grandTotal)}</span>
          </div>
        </div>

        <div style={{ ...C.card, background: '#f9fafb' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 6 }}>NOTE / TERMS &amp; CONDITIONS</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
            {data.terms.map(t => <li key={t}>{t}</li>)}
          </ul>
        </div>

        {canRespond && (
          <div style={C.card}>
            {error && <div style={{ color: '#991b1b', fontSize: 13, marginBottom: 10 }}>{error}</div>}
            {!confirming ? (
              <>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>
                  By approving, you authorise 7GEARS MOTORS to make the above repairs and agree to pay in full.
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn" onClick={() => setConfirming('REJECTED')}
                    style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: 16, background: '#fee2e2', color: '#b91c1c', border: 'none' }}>
                    ❌ Reject
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirming('APPROVED')}
                    style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: 16, background: '#16a34a', color: 'white', border: 'none' }}>
                    ✅ Approve
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>
                  {confirming === 'APPROVED' ? `Approve estimate of ₹${inr(data.grandTotal)}?` : 'Reject this estimate?'}
                </div>
                <textarea className="form-control" rows={3} value={comment} onChange={e => setComment(e.target.value)}
                  maxLength={1000}
                  placeholder={confirming === 'APPROVED' ? 'Any note for us? (optional)' : 'Please tell us why (optional)'}
                  style={{ width: '100%', marginBottom: 12 }} />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}
                    onClick={() => setConfirming(null)} disabled={submitting}>Back</button>
                  <button type="button" className="btn" onClick={submit} disabled={submitting}
                    style={{ flex: 1, justifyContent: 'center', border: 'none', color: 'white',
                      background: confirming === 'APPROVED' ? '#16a34a' : '#dc2626' }}>
                    {submitting ? 'Submitting…' : confirming === 'APPROVED' ? 'Confirm Approve' : 'Confirm Reject'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: 12, color: '#9ca3af', marginTop: 8 }}>
          7GEARS MOTORS · No 5, 1st Street, Easwari Nagar, Selaiyur, Chennai 600 073 · +91 78260 47847
        </div>
      </div>
    </div>
  );
}
