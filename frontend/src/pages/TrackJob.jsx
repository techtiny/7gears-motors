import { useState } from 'react';
import { jobApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import StatusStepper from '../components/StatusStepper';
import { Search, Phone, Car } from 'lucide-react';
import toast from 'react-hot-toast';

const LOGO = '/logo.png';

const STATUS_LABEL = {
  RECEIVED: 'Received', INSPECTING: 'Inspecting', AWAITING_APPROVAL: 'Awaiting Approval',
  IN_PROGRESS: 'In Progress', QUALITY_CHECK: 'Quality Check', READY_FOR_PICKUP: 'Ready for Pickup',
  DELIVERED: 'Delivered', CANCELLED: 'Cancelled',
};

function fmt(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function TrackJob() {
  const [jobNumber, setJobNumber] = useState('');
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const track = async (e) => {
    e?.preventDefault();
    if (!jobNumber.trim()) return;
    setLoading(true);
    setSearched(true);
    setJob(null);
    try {
      const r = await jobApi.track(jobNumber.trim().toUpperCase());
      setJob(r.data);
    } catch {
      toast.error('Job not found. Please check the job number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Track Vehicle</h1>
          <p>Enter your job number to check service status</p>
        </div>
      </div>

      {/* Search Card */}
      <div className="card" style={{ maxWidth: 560, marginBottom: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src={LOGO} alt="7Gears" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', marginBottom: 12 }}
            onError={e => e.target.style.display = 'none'} />
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Track Your Service</h2>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Enter the job number provided at vehicle drop-off</p>
        </div>
        <form onSubmit={track} style={{ display: 'flex', gap: 10 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} size={16} />
            <input className="form-control" style={{ paddingLeft: 40, fontFamily: 'monospace', fontWeight: 600, fontSize: 16, textTransform: 'uppercase' }}
              value={jobNumber} onChange={e => setJobNumber(e.target.value.toUpperCase())}
              placeholder="7GM00001" />
          </div>
          <button type="submit" className="btn btn-success" disabled={loading || !jobNumber.trim()}>
            {loading ? 'Tracking...' : 'Track'}
          </button>
        </form>
        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12, textAlign: 'center' }}>
          Job numbers start with <strong>7GM</strong> followed by 5 digits
        </p>
      </div>

      {/* Results */}
      {loading && <div className="loading-center"><div className="spinner" /></div>}

      {job && (
        <div style={{ maxWidth: 700, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Status Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Job Number</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#c0392b', fontFamily: 'monospace' }}>{job.jobNumber}</div>
              </div>
              <StatusBadge status={job.status} />
            </div>

            <StatusStepper current={job.status} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
              <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Car size={16} color="#6b7280" />
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Vehicle</span>
                </div>
                <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 15 }}>{job.vehicleRegistration}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{job.vehicleMake} {job.vehicleModel}</div>
                {job.vehicleColor && <div style={{ fontSize: 12, color: '#9ca3af' }}>{job.vehicleColor}</div>}
              </div>
              <div style={{ background: '#f8f9fa', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Phone size={16} color="#6b7280" />
                  <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase' }}>Owner</span>
                </div>
                <div style={{ fontWeight: 600 }}>{job.customerName}</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{job.customerPhone}</div>
              </div>
            </div>

            {job.estimatedCompletion && (
              <div style={{ marginTop: 16, background: '#dcf8c6', borderRadius: 10, padding: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>⏰</span>
                <div>
                  <div style={{ fontSize: 12, color: '#128C7E', fontWeight: 600 }}>Estimated Completion</div>
                  <div style={{ fontWeight: 600 }}>{new Date(job.estimatedCompletion).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp-style Updates */}
          <div className="wa-chat-container" style={{ height: 'auto', minHeight: 300 }}>
            <div className="wa-chat-header">
              <div className="wa-avatar">
                <img src={LOGO} alt="7G" onError={e => { e.target.style.display = 'none'; e.target.parentElement.textContent = '7G'; }} />
              </div>
              <div className="wa-chat-header-info">
                <h4>7GEARS MOTORS</h4>
                <span>Service Updates · {job.jobNumber}</span>
              </div>
            </div>

            <div className="wa-messages" style={{ height: 220 }}>
              {job.updates?.length === 0 && (
                <div style={{ textAlign: 'center', color: '#8b9eb5', fontSize: 13, padding: 16 }}>No updates yet</div>
              )}
              {job.updates?.map((u, i) => (
                <div key={u.id || i} className="wa-bubble wa-bubble-out">
                  {u.status && (
                    <div className="wa-status-pill">{STATUS_LABEL[u.status] || u.status}</div>
                  )}
                  <div>{u.message}</div>
                  <div className="wa-bubble-time">
                    {fmt(u.createdAt)}
                    <span style={{ color: '#34B7F1' }}>✓✓</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="card" style={{ background: '#1a1a2e', color: 'white' }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Need Help?</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <a href="tel:+917826047847" className="btn btn-outline" style={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}>
                <Phone size={15} /> +91 78260 47847
              </a>
              <a href="https://wa.me/917826047847" target="_blank" rel="noreferrer" className="btn btn-success">
                <span>WhatsApp Us</span>
              </a>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 10 }}>
              5, 1st Street, Easwari Nagar, Selaiyur, Tambaram, Chennai - 600073
            </p>
          </div>
        </div>
      )}

      {searched && !loading && !job && (
        <div className="card" style={{ maxWidth: 480 }}>
          <div className="empty-state" style={{ padding: '24px 0' }}>
            <Search />
            <h3>Job not found</h3>
            <p>Please check your job number and try again</p>
          </div>
        </div>
      )}
    </div>
  );
}
