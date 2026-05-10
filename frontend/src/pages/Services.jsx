import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApi, vehicleApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import { Search, Plus, Wrench, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const SERVICE_TYPES = [
  'Periodic Service', 'AC Repair', 'Tire Care', 'Battery', 'Denting & Painting',
  'Car Spa', 'Detailing', 'Full Inspection', 'Clutch Work', 'Windshield',
  'Suspension', 'Insurance Claim', 'Oil Change', 'Brake Service', 'Other'
];

const STATUSES = ['', 'RECEIVED', 'INSPECTING', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'QUALITY_CHECK', 'READY_FOR_PICKUP', 'DELIVERED', 'CANCELLED'];
const STATUS_LABELS = { '': 'All', RECEIVED: 'Received', INSPECTING: 'Inspecting', AWAITING_APPROVAL: 'Awaiting Approval', IN_PROGRESS: 'In Progress', QUALITY_CHECK: 'Quality Check', READY_FOR_PICKUP: 'Ready', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };

function NewJobModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    vehicleId: '', description: '', serviceType: '', serviceAdvisor: '',
    technician: '', odometerReading: '', estimatedCost: '', estimatedCompletion: '', notes: '',
  });
  const [vehicles, setVehicles] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    vehicleApi.getAll({}).then(r => setVehicles(r.data)).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.vehicleId) return toast.error('Please select a vehicle');
    setSaving(true);
    try {
      const payload = {
        ...form,
        vehicleId: Number(form.vehicleId),
        odometerReading: form.odometerReading ? Number(form.odometerReading) : null,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
        estimatedCompletion: form.estimatedCompletion ? form.estimatedCompletion + ':00' : null,
      };
      await jobApi.create(payload);
      toast.success('Service job created!');
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 640 }}>
        <div className="modal-header">
          <h3>New Service Job</h3>
          <button className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Vehicle *</label>
              <select className="form-control" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)}>
                <option value="">Select vehicle...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNumber} — {v.make} {v.model} ({v.customerName})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Service Type</label>
              <select className="form-control" value={form.serviceType} onChange={e => set('serviceType', e.target.value)}>
                <option value="">Select service type</option>
                {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the work needed..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Service Advisor</label>
                <input className="form-control" value={form.serviceAdvisor} onChange={e => set('serviceAdvisor', e.target.value)} placeholder="Advisor name" />
              </div>
              <div className="form-group">
                <label className="form-label">Technician</label>
                <input className="form-control" value={form.technician} onChange={e => set('technician', e.target.value)} placeholder="Technician name" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Odometer (km)</label>
                <input className="form-control" type="number" value={form.odometerReading} onChange={e => set('odometerReading', e.target.value)} placeholder="Current reading" />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Cost (₹)</label>
                <input className="form-control" type="number" value={form.estimatedCost} onChange={e => set('estimatedCost', e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Estimated Completion</label>
              <input className="form-control" type="datetime-local" value={form.estimatedCompletion} onChange={e => set('estimatedCompletion', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-control" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Internal notes..." style={{ minHeight: 60 }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Services() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (query) params.q = query;
      else if (statusFilter) params.status = statusFilter;
      const r = await jobApi.getAll(params);
      setJobs(r.data);
    } catch { toast.error('Failed to load jobs'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Service Jobs</h1>
          <p>{jobs.length} job{jobs.length !== 1 ? 's' : ''} found</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> New Job
        </button>
      </div>

      <div className="card">
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={e => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 10, flex: 1, flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
              <Search className="search-icon" />
              <input className="form-control" style={{ paddingLeft: 38, width: '100%' }}
                placeholder="Search job#, vehicle, customer..."
                value={query} onChange={e => setQuery(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-outline">Search</button>
          </form>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Filter size={15} color="#6b7280" />
            <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setQuery(''); }}>
              {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <Wrench />
            <h3>No service jobs found</h3>
            <p>Create your first service job</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Service Type</th>
                  <th>Status</th>
                  <th>Photos</th>
                  <th>Est. Cost</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/services/${job.id}`)}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#c0392b' }}>{job.jobNumber}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{job.vehicleRegistration}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{job.vehicleMake} {job.vehicleModel}</div>
                    </td>
                    <td>
                      <div>{job.customerName}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{job.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>{job.serviceType || '-'}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {job.firstBeforeThumb && (
                          <img src={job.firstBeforeThumb} alt="Before"
                            style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 5, border: '2px solid #fca5a5' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        {job.firstAfterThumb && (
                          <img src={job.firstAfterThumb} alt="After"
                            style={{ width: 34, height: 34, objectFit: 'cover', borderRadius: 5, border: '2px solid #86efac' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        {(job.beforeImageCount > 0 || job.afterImageCount > 0) ? (
                          <span style={{ fontSize: 10, color: '#6b7280', whiteSpace: 'nowrap' }}>
                            {job.beforeImageCount}B&nbsp;/&nbsp;{job.afterImageCount}A
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#d1d5db' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {job.estimatedCost ? `₹${Number(job.estimatedCost).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {job.receivedAt ? new Date(job.receivedAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <NewJobModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
}
