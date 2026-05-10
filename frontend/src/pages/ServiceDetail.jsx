import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { jobApi, feedbackApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import StatusStepper from '../components/StatusStepper';
import ImageGallery from '../components/ImageGallery';
import { ArrowLeft, Send, ChevronDown, Phone, Car, User, IndianRupee, Clock, MessageCircle, CheckCheck, Check, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const LOGO = '/logo.png';

const NEXT_STATUS = {
  RECEIVED:          'INSPECTING',
  INSPECTING:        'AWAITING_APPROVAL',
  AWAITING_APPROVAL: 'IN_PROGRESS',
  IN_PROGRESS:       'QUALITY_CHECK',
  QUALITY_CHECK:     'READY_FOR_PICKUP',
  READY_FOR_PICKUP:  'DELIVERED',
};

const STATUS_LABEL = {
  RECEIVED: 'Received', INSPECTING: 'Inspecting', AWAITING_APPROVAL: 'Awaiting Approval',
  IN_PROGRESS: 'In Progress', QUALITY_CHECK: 'Quality Check', READY_FOR_PICKUP: 'Ready for Pickup',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

function fmt(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function fmtDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob]                   = useState(null);
  const [updates, setUpdates]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [message, setMessage]           = useState('');
  const [sending, setSending]           = useState(false);
  const [advancing, setAdvancing]       = useState(false);
  const [customMsg, setCustomMsg]       = useState('');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [waEnabled, setWaEnabled]       = useState(false);
  const [sending_wa, setSendingWa]      = useState(null);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbRating, setFbRating]         = useState(5);
  const [fbComment, setFbComment]       = useState('');
  const [submittingFb, setSubmittingFb] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  const scrollToBottom = () =>
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);

  const loadJob = async () => {
    try {
      const r = await jobApi.getById(id);
      setJob(r.data);
      setUpdates(r.data.updates || []);
    } catch {
      toast.error('Failed to load service job');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJob();
    jobApi.getDashboard().then(() => {}).catch(() => {});
    // Check WhatsApp status
    fetch('/api/jobs/whatsapp-status')
      .then(r => r.json())
      .then(d => setWaEnabled(d.enabled))
      .catch(() => {});
  }, [id]);

  useEffect(() => { scrollToBottom(); }, [updates]);

  // ── Send chat message ──────────────────────────────────────────
  const sendMessage = async () => {
    const text = message.trim();
    if (!text || sending) return;

    const now = new Date().toISOString().slice(0, 19);
    const optimistic = { id: null, status: null, message: text, sentBy: '7Gears Team', createdAt: now, whatsappSent: false, whatsappSid: null };

    setSending(true);
    setMessage('');
    setUpdates(prev => [...prev, optimistic]);
    scrollToBottom();

    try {
      const r = await jobApi.addUpdate(id, { message: text, sentBy: '7Gears Team' });
      // Replace optimistic entry with real server response
      setUpdates(prev => prev.map(u => u === optimistic ? r.data : u));
      if (r.data.whatsappSent) {
        toast.success('Message sent + WhatsApp delivered ✓', { icon: '📱' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
      setUpdates(prev => prev.filter(u => u !== optimistic));
      setMessage(text);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // ── Request feedback via WhatsApp ─────────────────────────────
  const requestFeedback = async () => {
    try {
      await feedbackApi.request(id);
      setFeedbackSent(true);
      toast.success('Feedback request sent to customer via WhatsApp!', { icon: '⭐' });
    } catch { toast.error('Failed to send feedback request'); }
  };

  const submitFeedback = async () => {
    setSubmittingFb(true);
    try {
      await feedbackApi.submit({ jobId: Number(id), rating: fbRating, comment: fbComment });
      setShowFeedback(false);
      toast.success(`${fbRating}⭐ feedback saved! Thank-you WhatsApp sent.`);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save feedback');
    } finally { setSubmittingFb(false); }
  };

  // ── Send WhatsApp for a specific update ───────────────────────
  const sendWhatsApp = async (updateId) => {
    if (sending_wa) return;
    setSendingWa(updateId);
    try {
      const r = await fetch(`/api/jobs/${id}/updates/${updateId}/send-whatsapp`, { method: 'POST' });
      if (!r.ok) throw new Error(await r.text());
      const updated = await r.json();
      setUpdates(prev => prev.map(u => u.id === updateId ? updated : u));
      toast.success('WhatsApp message sent to customer!', { icon: '📱' });
    } catch (err) {
      toast.error('WhatsApp send failed: ' + (err.message || 'Unknown error'));
    } finally {
      setSendingWa(null);
    }
  };

  // ── Advance status ─────────────────────────────────────────────
  const advanceStatus = async () => {
    const next = NEXT_STATUS[job?.status];
    if (!next || advancing) return;
    setAdvancing(true);
    try {
      const r = await jobApi.updateStatus(id, next, customMsg || undefined, '7Gears Team');
      setJob(r.data);
      setUpdates(r.data.updates || []);
      setCustomMsg('');
      setShowStatusMenu(false);
      const waNote = r.data.updates?.slice(-1)[0]?.whatsappSent ? ' + WhatsApp sent 📱' : '';
      toast.success(`Status → ${STATUS_LABEL[next]}${waNote}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setAdvancing(false);
    }
  };

  const setStatus = async (status) => {
    if (advancing) return;
    setAdvancing(true);
    try {
      const r = await jobApi.updateStatus(id, status, undefined, '7Gears Team');
      setJob(r.data);
      setUpdates(r.data.updates || []);
      setShowStatusMenu(false);
      toast.success(`Status → ${STATUS_LABEL[status]}`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!job)    return <div className="empty-state"><h3>Job not found</h3></div>;

  const nextStatus = NEXT_STATUS[job.status];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button type="button" className="btn btn-icon btn-outline" onClick={() => navigate('/services')}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700 }}>Job #{job.jobNumber}</h1>
            <StatusBadge status={job.status} />
            {waEnabled && (
              <span style={{ fontSize: 11, background: '#dcf8c6', color: '#128C7E', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                📱 WhatsApp Active
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#6b7280' }}>
            {job.vehicleMake} {job.vehicleModel} · {job.vehicleRegistration} · {job.customerName}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <StatusStepper current={job.status} />
      </div>

      {/* Before / After Photo Gallery */}
      <div style={{ marginBottom: 20 }}>
        <ImageGallery jobId={id} />
      </div>

      <div className="content-grid" style={{ gap: 20 }}>
        {/* ── Left: Job Info + Controls ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 15 }}>Vehicle &amp; Customer</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <InfoRow icon={<Car size={15} />} label="Vehicle">
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{job.vehicleRegistration}</span>
                {' — '}{job.vehicleMake} {job.vehicleModel}
                {job.vehicleColor && <span style={{ color: '#6b7280' }}> · {job.vehicleColor}</span>}
              </InfoRow>
              <InfoRow icon={<User size={15} />} label="Customer">{job.customerName}</InfoRow>
              <InfoRow icon={<Phone size={15} />} label="Phone">
                <a href={`tel:${job.customerPhone}`} style={{ color: '#25D366', fontWeight: 600 }}>{job.customerPhone}</a>
                <a href={`https://wa.me/91${job.customerPhone?.replace(/\D/g, '')}`}
                   target="_blank" rel="noreferrer"
                   style={{ marginLeft: 8, fontSize: 12, background: '#25D366', color: 'white', padding: '2px 8px', borderRadius: 10, textDecoration: 'none' }}>
                  WhatsApp
                </a>
              </InfoRow>
              {job.serviceType     && <InfoRow icon={<span>🔧</span>} label="Service">{job.serviceType}</InfoRow>}
              {job.serviceAdvisor  && <InfoRow icon={<User size={15} />} label="Advisor">{job.serviceAdvisor}</InfoRow>}
              {job.technician      && <InfoRow icon={<User size={15} />} label="Technician">{job.technician}</InfoRow>}
              {job.odometerReading && <InfoRow icon={<span>🚗</span>} label="Odometer">{job.odometerReading.toLocaleString('en-IN')} km</InfoRow>}
              {job.estimatedCost   && <InfoRow icon={<IndianRupee size={15} />} label="Estimate">₹{Number(job.estimatedCost).toLocaleString('en-IN')}</InfoRow>}
              {job.actualCost      && <InfoRow icon={<IndianRupee size={15} />} label="Actual">₹{Number(job.actualCost).toLocaleString('en-IN')}</InfoRow>}
              {job.estimatedCompletion && <InfoRow icon={<Clock size={15} />} label="ETA">{fmtDate(job.estimatedCompletion)}</InfoRow>}
              {job.receivedAt      && <InfoRow icon={<Clock size={15} />} label="Received">{fmtDate(job.receivedAt)}</InfoRow>}
              {job.deliveredAt     && <InfoRow icon={<Clock size={15} />} label="Delivered">{fmtDate(job.deliveredAt)}</InfoRow>}
            </div>
            {job.description && (
              <div style={{ marginTop: 16, padding: 12, background: '#f8f9fa', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Description</div>
                <p style={{ fontSize: 14 }}>{job.description}</p>
              </div>
            )}
            {job.notes && (
              <div style={{ marginTop: 10, padding: 12, background: '#fffbeb', borderRadius: 8 }}>
                <div style={{ fontSize: 11, color: '#92400e', fontWeight: 600, marginBottom: 4, textTransform: 'uppercase' }}>Notes</div>
                <p style={{ fontSize: 14 }}>{job.notes}</p>
              </div>
            )}
          </div>

          {/* Status Controls */}
          {job.status !== 'DELIVERED' && job.status !== 'CANCELLED' && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15 }}>Update Status</h3>
                {waEnabled
                  ? <span style={{ fontSize: 11, color: '#128C7E', fontWeight: 600 }}>📱 WhatsApp auto-send ON</span>
                  : <span style={{ fontSize: 11, color: '#9ca3af' }}>WhatsApp: configure credentials</span>
                }
              </div>
              {nextStatus && (
                <>
                  <div className="form-group">
                    <label className="form-label">Custom message (optional — WhatsApp will include it)</label>
                    <textarea className="form-control" value={customMsg}
                      onChange={e => setCustomMsg(e.target.value)}
                      placeholder="E.g. Clutch plate replaced, ready tomorrow..." style={{ minHeight: 60 }} />
                  </div>
                  <button type="button" className="btn btn-success w-full" onClick={advanceStatus}
                    disabled={advancing} style={{ marginBottom: 10, justifyContent: 'center' }}>
                    {advancing ? 'Updating…' : `Advance → "${STATUS_LABEL[nextStatus]}" ${waEnabled ? '+ Send WhatsApp 📱' : ''}`}
                  </button>
                </>
              )}
              <div style={{ position: 'relative' }}>
                <button type="button" className="btn btn-outline w-full" style={{ justifyContent: 'center' }}
                  onClick={() => setShowStatusMenu(s => !s)}>
                  Set Specific Status <ChevronDown size={14} />
                </button>
                {showStatusMenu && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 20, overflow: 'hidden', marginTop: 4 }}>
                    {Object.keys(STATUS_LABEL).filter(s => s !== job.status).map(s => (
                      <button key={s} type="button" onClick={() => setStatus(s)}
                        style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        {STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Feedback Card — show for delivered jobs */}
          {(job.status === 'DELIVERED' || job.status === 'READY_FOR_PICKUP') && (
            <div className="card" style={{ border: '2px solid #fef3c7' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontWeight: 600, fontSize: 15 }}>⭐ Customer Feedback</h3>
              </div>
              {!showFeedback ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button type="button" className="btn btn-outline w-full" style={{ justifyContent: 'center', borderColor: '#f59e0b', color: '#92400e' }}
                    onClick={requestFeedback} disabled={feedbackSent}>
                    <Star size={15} />
                    {feedbackSent ? '✓ Request Sent via WhatsApp' : 'Send Feedback Request via WhatsApp'}
                  </button>
                  <button type="button" className="btn w-full" style={{ justifyContent: 'center', background: '#fef3c7', color: '#92400e', border: 'none' }}
                    onClick={() => setShowFeedback(true)}>
                    Enter Rating Manually
                  </button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 12 }}>
                    <label className="form-label">Customer Rating</label>
                    <div style={{ display: 'flex', gap: 8, fontSize: 28, cursor: 'pointer', margin: '6px 0' }}>
                      {[1,2,3,4,5].map(n => (
                        <span key={n} onClick={() => setFbRating(n)}
                          style={{ color: n <= fbRating ? '#f59e0b' : '#d1d5db', transition: 'color 0.15s', userSelect: 'none' }}>★</span>
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{['','Poor','Fair','Good','Very Good','Excellent'][fbRating]} — {fbRating}/5</div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Customer Comment (optional)</label>
                    <textarea className="form-control" value={fbComment} onChange={e => setFbComment(e.target.value)}
                      placeholder="What did the customer say?" style={{ minHeight: 60 }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="btn btn-outline" onClick={() => setShowFeedback(false)}>Cancel</button>
                    <button type="button" className="btn w-full" style={{ background: '#f59e0b', color: 'white', border: 'none', justifyContent: 'center' }}
                      onClick={submitFeedback} disabled={submittingFb}>
                      {submittingFb ? 'Saving...' : `Save ${fbRating}★ Rating`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        {/* ── Right: WhatsApp Chat ── */}
        <div>
          <div className="wa-chat-container">
            {/* Header */}
            <div className="wa-chat-header">
              <div className="wa-avatar">
                <img src={LOGO} alt="7G"
                  onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = '7G'; }} />
              </div>
              <div className="wa-chat-header-info">
                <h4>7GEARS MOTORS → {job.customerName}</h4>
                <span>{job.customerPhone} · Job #{job.jobNumber}</span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                {waEnabled
                  ? <span style={{ fontSize: 10, background: '#dcf8c6', color: '#128C7E', padding: '2px 6px', borderRadius: 8, fontWeight: 700 }}>LIVE</span>
                  : <span style={{ fontSize: 10, background: 'rgba(255,255,255,0.15)', color: 'white', padding: '2px 6px', borderRadius: 8 }}>MANUAL</span>
                }
              </div>
            </div>

            {/* WhatsApp not configured banner */}
            {!waEnabled && (
              <div style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a', padding: '8px 14px', fontSize: 12, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚠️</span>
                <span>WhatsApp not configured. Click <strong>Send 📱</strong> on any message to send it manually.</span>
              </div>
            )}

            {/* Messages */}
            <div className="wa-messages">
              {updates.length === 0 && (
                <div style={{ textAlign: 'center', color: '#8b9eb5', fontSize: 13, padding: '20px 0' }}>
                  No messages yet
                </div>
              )}
              {updates.map((u, i) => {
                const isSystem = u.sentBy === 'System' || u.sentBy === '7Gears Team' || !u.sentBy;
                const isPending = u.id == null;
                return (
                  <div key={u.id ?? `opt-${i}`} style={{ display: 'flex', flexDirection: 'column', alignItems: isSystem ? 'flex-end' : 'flex-start' }}>
                    <div className={`wa-bubble ${isSystem ? 'wa-bubble-out' : 'wa-bubble-in'}`}
                      style={{ opacity: isPending ? 0.7 : 1 }}>
                      {u.status && (
                        <div className="wa-status-pill">{STATUS_LABEL[u.status] || u.status}</div>
                      )}
                      <div>{u.message}</div>
                      <div className="wa-bubble-time">
                        {fmt(u.createdAt)}
                        {isPending
                          ? <Check size={13} color="#9ca3af" />
                          : u.whatsappSent
                            ? <CheckCheck size={13} color="#34B7F1" />
                            : <Check size={13} color="#9ca3af" />
                        }
                      </div>
                    </div>

                    {/* WhatsApp send/status indicator under each message */}
                    {!isPending && isSystem && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2, marginBottom: 4, paddingRight: 4 }}>
                        {u.whatsappSent ? (
                          <span style={{ fontSize: 10, color: '#128C7E', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CheckCheck size={11} color="#128C7E" /> WhatsApp delivered
                          </span>
                        ) : (
                          <button type="button"
                            onClick={() => sendWhatsApp(u.id)}
                            disabled={sending_wa === u.id}
                            style={{ fontSize: 10, color: '#25D366', background: 'none', border: '1px solid #25D366', borderRadius: 10, padding: '1px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'inherit' }}>
                            <MessageCircle size={10} />
                            {sending_wa === u.id ? 'Sending…' : 'Send 📱'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="wa-input-area">
              <textarea
                ref={inputRef}
                className="wa-input"
                rows={1}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={waEnabled ? 'Type update — sends WhatsApp automatically…' : 'Type a service update (Enter to send)…'}
                disabled={sending}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
              />
              <button type="button" className="wa-send-btn" onClick={sendMessage}
                disabled={sending || !message.trim()}
                style={{ opacity: (!message.trim() || sending) ? 0.5 : 1 }}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, children }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ color: '#6b7280', marginTop: 2, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
        <div style={{ fontSize: 14, marginTop: 1 }}>{children}</div>
      </div>
    </div>
  );
}
