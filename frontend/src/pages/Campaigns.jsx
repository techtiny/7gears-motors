import { useState, useEffect } from 'react';
import { Megaphone, Play, Plus, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';

const TYPES = [
  { value: 'SERVICE_DUE',        label: '🔧 Service Due Reminder',    desc: 'Customers not serviced in 90+ days' },
  { value: 'BIRTHDAY',           label: '🎂 Birthday Wishes',          desc: 'Customers with birthday today' },
  { value: 'FESTIVAL',           label: '🪔 Festival Greetings',        desc: 'All customers — seasonal offer' },
  { value: 'PROMOTIONAL',        label: '🎁 Promotional Offer',         desc: 'Custom offer to all customers' },
  { value: 'INSURANCE_RENEWAL',  label: '🛡️ Insurance Reminder',        desc: 'Insurance expiring in 30 days' },
  { value: 'PUC_RENEWAL',        label: '📋 PUC Certificate Reminder',  desc: 'PUC expiring in 15 days' },
  { value: 'FOLLOW_UP',          label: '⭐ Post-Service Follow-up',    desc: 'Request feedback after delivery' },
  { value: 'REENGAGEMENT',       label: '👋 Re-engagement',             desc: 'Customers not visited in 6 months' },
];

const STATUS_STYLE = {
  DRAFT:     { bg: '#f3f4f6', color: '#374151', label: 'Draft' },
  RUNNING:   { bg: '#dbeafe', color: '#1e40af', label: 'Running' },
  COMPLETED: { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
  FAILED:    { bg: '#fee2e2', color: '#991b1b', label: 'Failed' },
};

function NewCampaignModal({ onClose, onSave }) {
  const [type, setType] = useState('SERVICE_DUE');
  const [name, setName] = useState('');
  const [template, setTemplate] = useState('');
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoadingTemplate(true);
    api.get(`/campaigns/template/${type}`)
      .then(r => setTemplate(r.data.template))
      .catch(() => {})
      .finally(() => setLoadingTemplate(false));
    const found = TYPES.find(t => t.value === type);
    if (found) setName(found.label);
  }, [type]);

  const submit = async () => {
    if (!name.trim()) return toast.error('Enter a campaign name');
    setSaving(true);
    try {
      await api.post('/campaigns', { name, type, messageTemplate: template });
      toast.success('Campaign created!');
      onSave();
    } catch { toast.error('Failed to create campaign'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>New Campaign</h3>
          <button type="button" className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Campaign Type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {TYPES.map(t => (
                <div key={t.value} onClick={() => setType(t.value)}
                  style={{ padding: '10px 14px', border: `2px solid ${type === t.value ? '#25D366' : '#e5e7eb'}`, borderRadius: 8, cursor: 'pointer', background: type === t.value ? '#f0fdf4' : 'white', transition: 'all 0.15s' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{t.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Campaign Name</label>
            <input className="form-control" value={name} onChange={e => setName(e.target.value)} placeholder="Campaign name..." />
          </div>
          <div className="form-group">
            <label className="form-label">WhatsApp Message Template
              <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 8 }}>Use {'{{name}}'} {'{{vehicle}}'} as placeholders</span>
            </label>
            <textarea className="form-control" value={loadingTemplate ? 'Loading...' : template}
              onChange={e => setTemplate(e.target.value)} style={{ minHeight: 140, fontFamily: 'monospace', fontSize: 13 }} />
          </div>
          {/* Preview */}
          <div style={{ background: '#efeae2', borderRadius: 10, padding: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>PREVIEW — WhatsApp Message</div>
            <div style={{ background: '#dcf8c6', borderRadius: 8, padding: '8px 12px', fontSize: 13, whiteSpace: 'pre-wrap', maxHeight: 160, overflow: 'auto' }}>
              {template.replace(/{{name}}/g, 'Rajesh').replace(/{{vehicle}}/g, 'TN 01 AB 1234')}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-success" onClick={submit} disabled={saving}>
            {saving ? 'Creating...' : '✓ Create Campaign'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [running, setRunning]     = useState(null);

  const load = async () => {
    try { const r = await api.get('/campaigns'); setCampaigns(r.data); }
    catch { toast.error('Failed to load campaigns'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const execute = async (id, name) => {
    if (!window.confirm(`Launch "${name}" now? This will send WhatsApp to all targeted customers.`)) return;
    setRunning(id);
    try {
      const r = await api.post(`/campaigns/${id}/execute`);
      const d = r.data;
      toast.success(`✅ Sent ${d.sent}/${d.targeted} messages!`, { duration: 5000 });
      load();
    } catch { toast.error('Campaign execution failed'); }
    finally { setRunning(null); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Campaigns</h1>
          <p>WhatsApp marketing campaigns for customer engagement</p>
        </div>
        <button className="btn btn-success" onClick={() => setModal(true)}>
          <Plus size={16} /> New Campaign
        </button>
      </div>

      {/* Quick-launch cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
        {TYPES.slice(0, 4).map(t => (
          <div key={t.value} className="card" style={{ borderLeft: '4px solid #25D366', padding: '14px 16px' }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{t.label.split(' ')[0]}</div>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.label.substring(2)}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>All Campaigns</h2>
        {loading ? <div className="loading-center"><div className="spinner" /></div>
          : campaigns.length === 0 ? (
            <div className="empty-state">
              <Megaphone />
              <h3>No campaigns yet</h3>
              <p>Create your first WhatsApp campaign to engage customers</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Campaign</th><th>Type</th><th>Status</th><th>Targeted</th><th>Sent</th><th>Failed</th><th>Date</th><th>Action</th></tr></thead>
                <tbody>
                  {campaigns.map(c => {
                    const st = STATUS_STYLE[c.status] || STATUS_STYLE.DRAFT;
                    const typeInfo = TYPES.find(t => t.value === c.type);
                    return (
                      <tr key={c.id}>
                        <td><div style={{ fontWeight: 600 }}>{c.name}</div></td>
                        <td style={{ fontSize: 13 }}>{typeInfo?.label || c.type}</td>
                        <td><span style={{ background: st.bg, color: st.color, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600 }}>{st.label}</span></td>
                        <td style={{ fontWeight: 600 }}>{c.totalTargeted || '—'}</td>
                        <td style={{ color: '#25D366', fontWeight: 600 }}>{c.totalSent || '—'}</td>
                        <td style={{ color: c.totalFailed > 0 ? '#ef4444' : '#9ca3af' }}>{c.totalFailed || '—'}</td>
                        <td style={{ fontSize: 12, color: '#6b7280' }}>{c.executedAt ? new Date(c.executedAt).toLocaleDateString('en-IN') : new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                        <td>
                          {c.status !== 'COMPLETED' && c.status !== 'RUNNING' && (
                            <button type="button" className="btn btn-success btn-sm"
                              disabled={running === c.id}
                              onClick={() => execute(c.id, c.name)}>
                              <Play size={13} />
                              {running === c.id ? 'Sending...' : 'Launch'}
                            </button>
                          )}
                          {c.status === 'COMPLETED' && <span style={{ color: '#25D366', fontSize: 13 }}>✓ Done</span>}
                          {c.status === 'RUNNING'   && <span style={{ color: '#2563eb', fontSize: 13 }}>⏳ Running</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {modal && <NewCampaignModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
}
