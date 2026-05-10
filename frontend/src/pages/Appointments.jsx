import { useState, useEffect } from 'react';
import { CalendarDays, Plus, Clock, Car, User, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { customerApi, vehicleApi } from '../api';

const STATUS_COLORS = {
  SCHEDULED:  { bg: '#dbeafe', color: '#1e40af' },
  CONFIRMED:  { bg: '#d1fae5', color: '#065f46' },
  ARRIVED:    { bg: '#fef3c7', color: '#92400e' },
  COMPLETED:  { bg: '#d1d5db', color: '#374151' },
  CANCELLED:  { bg: '#fee2e2', color: '#991b1b' },
  NO_SHOW:    { bg: '#fce7f3', color: '#9d174d' },
};

const SERVICE_TYPES = ['Periodic Service','AC Repair','Tire Care','Battery','Denting & Painting','Car Spa','Detailing','Oil Change','Brake Service','Other'];
const TIME_SLOTS = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','14:00','14:30','15:00','15:30','16:00','16:30','17:00'];

function BookModal({ onClose, onSave }) {
  const [form, setForm] = useState({ customerId: '', vehicleId: '', date: '', time: '09:00', serviceType: '', notes: '' });
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles]   = useState([]);
  const [saving, setSaving]       = useState(false);

  useEffect(() => { customerApi.getAll().then(r => setCustomers(r.data)).catch(() => {}); }, []);
  useEffect(() => {
    if (form.customerId) vehicleApi.getByCustomer(form.customerId).then(r => setVehicles(r.data)).catch(() => {});
    else setVehicles([]);
  }, [form.customerId]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.customerId || !form.date || !form.time) return toast.error('Customer, date and time are required');
    setSaving(true);
    try {
      await api.post('/appointments', { ...form, customerId: Number(form.customerId), vehicleId: form.vehicleId ? Number(form.vehicleId) : null });
      toast.success('Appointment booked! WhatsApp confirmation sent.');
      onSave();
    } catch (e) { toast.error(e?.response?.data?.message || 'Failed to book'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header"><h3>Book Appointment</h3><button type="button" className="btn btn-icon btn-outline" onClick={onClose}>✕</button></div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Customer *</label>
            <select className="form-control" value={form.customerId} onChange={e => set('customerId', e.target.value)}>
              <option value="">Select customer...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Vehicle</label>
            <select className="form-control" value={form.vehicleId} onChange={e => set('vehicleId', e.target.value)} disabled={!form.customerId}>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.registrationNumber} — {v.make} {v.model}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input className="form-control" type="date" value={form.date} min={new Date().toISOString().split('T')[0]} onChange={e => set('date', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Time Slot *</label>
              <select className="form-control" value={form.time} onChange={e => set('time', e.target.value)}>
                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Service Type</label>
            <select className="form-control" value={form.serviceType} onChange={e => set('serviceType', e.target.value)}>
              <option value="">Select...</option>
              {SERVICE_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-control" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any specific requests..." style={{ minHeight: 60 }} />
          </div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, fontSize: 12, color: '#15803d' }}>
            📱 A WhatsApp confirmation will be sent to the customer automatically.
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-success" onClick={submit} disabled={saving}>{saving ? 'Booking...' : 'Book Appointment'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(false);
  const [dateFilter, setDateFilter]     = useState(new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/appointments', { params: dateFilter ? { date: dateFilter } : {} });
      setAppointments(r.data);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [dateFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed to update'); }
  };

  const todayCount  = appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'CONFIRMED' || a.status === 'ARRIVED').length;
  const arrivedCount = appointments.filter(a => a.status === 'ARRIVED').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Appointments</h1>
          <p>{todayCount} upcoming · {arrivedCount} arrived today</p>
        </div>
        <button className="btn btn-success" onClick={() => setModal(true)}><Plus size={16} /> Book Appointment</button>
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={16} color="#6b7280" />
            <input type="date" className="form-control" style={{ width: 'auto' }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}>Today</button>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDateFilter('')}>All</button>
        </div>

        {loading ? <div className="loading-center"><div className="spinner" /></div>
          : appointments.length === 0 ? (
            <div className="empty-state">
              <CalendarDays style={{ margin: '0 auto 12px', display: 'block' }} />
              <h3>No appointments</h3>
              <p>No appointments {dateFilter ? 'for this date' : 'found'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {appointments.map(a => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS.SCHEDULED;
                return (
                  <div key={a.id} style={{ border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ background: '#1a1a2e', color: 'white', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 64 }}>
                      <div style={{ fontSize: 18, fontWeight: 700 }}>{a.appointmentTime?.slice(0, 5)}</div>
                      <div style={{ fontSize: 10, opacity: 0.7 }}>{a.appointmentDate}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700 }}>{a.customer?.name}</span>
                        <span style={{ background: sc.bg, color: sc.color, padding: '1px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>{a.status}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                        <span>📞 {a.customer?.phone}</span>
                        {a.vehicle && <span>🚗 {a.vehicle.registrationNumber}</span>}
                        {a.serviceType && <span>🔧 {a.serviceType}</span>}
                      </div>
                      {a.notes && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{a.notes}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {a.status === 'SCHEDULED' && <button type="button" className="btn btn-sm btn-outline" onClick={() => updateStatus(a.id, 'CONFIRMED')}>Confirm</button>}
                      {a.status === 'CONFIRMED' && <button type="button" className="btn btn-sm btn-success" onClick={() => updateStatus(a.id, 'ARRIVED')}>Arrived</button>}
                      {a.status === 'ARRIVED'   && <button type="button" className="btn btn-sm btn-primary" onClick={() => updateStatus(a.id, 'COMPLETED')}>Complete</button>}
                      {(a.status === 'SCHEDULED' || a.status === 'CONFIRMED') &&
                        <button type="button" className="btn btn-sm" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }} onClick={() => updateStatus(a.id, 'CANCELLED')}>Cancel</button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {modal && <BookModal onClose={() => setModal(false)} onSave={() => { setModal(false); load(); }} />}
    </div>
  );
}
