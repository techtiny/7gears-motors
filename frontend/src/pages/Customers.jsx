import { useState, useEffect } from 'react';
import { customerApi, vehicleApi } from '../api';
import { Search, Plus, Edit2, Trash2, Users, Phone, Mail, MapPin, Car, ChevronRight, ChevronLeft, CalendarDays, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import MakeModelSelect from '../components/MakeModelSelect';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

// Local (not UTC) yyyy-MM-dd, so the date picker matches the IST calendar day
const toDateInput = (d) => {
  const x = d ? new Date(d) : new Date();
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
const formatAddedDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const formatAddedTime = (d) =>
  d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const timeSince = (d) => {
  if (!d) return '';
  const start = new Date(d); start.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const days = Math.round((today - start) / 86400000);
  if (days <= 0) return 'Added today';
  if (days === 1) return 'Added yesterday';
  if (days < 30) return `${days} days ago`;
  const months = (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth() - (today.getDate() < start.getDate() ? 1 : 0);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12), rem = months % 12;
  return `${years} year${years !== 1 ? 's' : ''}${rem ? ` ${rem} month${rem !== 1 ? 's' : ''}` : ''} ago`;
};

function CustomerDetailsModal({ customer, onClose, onEdit }) {
  const [vehicles, setVehicles] = useState(null);

  useEffect(() => {
    vehicleApi.getByCustomer(customer.id)
      .then(r => setVehicles(r.data))
      .catch(() => setVehicles([]));
  }, [customer.id]);

  const row = { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, padding: '6px 0' };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#1a1a2e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
              {customer.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3>{customer.name}</h3>
              <div style={{ fontSize: 12, color: '#6b7280' }}>ID #{customer.id}</div>
            </div>
          </div>
          <button className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--saffron-pale)', border: '1px solid var(--saffron-muted)', borderRadius: 12, padding: '14px 16px', marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--saffron-darker)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
              Customer Added On
            </div>
            {customer.createdAt ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700 }}>
                  <CalendarDays size={18} color="var(--saffron-dark)" />
                  {new Date(customer.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                  <Clock size={13} /> {formatAddedTime(customer.createdAt)} · {timeSince(customer.createdAt)}
                </div>
              </>
            ) : <div style={{ color: '#6b7280' }}>Not recorded</div>}
          </div>

          <div style={row}><Phone size={15} color="#6b7280" style={{ marginTop: 2 }} />{customer.phone}</div>
          <div style={row}><Mail size={15} color="#6b7280" style={{ marginTop: 2 }} />{customer.email || <span style={{ color: '#9ca3af' }}>No email</span>}</div>
          <div style={row}><MapPin size={15} color="#6b7280" style={{ marginTop: 2 }} />{customer.address || <span style={{ color: '#9ca3af' }}>No address</span>}</div>

          <div style={{ fontWeight: 600, fontSize: 14, margin: '16px 0 8px' }}>Vehicles</div>
          {vehicles === null ? (
            <div style={{ fontSize: 13, color: '#6b7280' }}>Loading…</div>
          ) : vehicles.length === 0 ? (
            <div style={{ fontSize: 13, color: '#9ca3af' }}>No vehicles added</div>
          ) : vehicles.map(v => (
            <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 6 }}>
              <Car size={16} color="#6b7280" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{v.registrationNumber}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{[v.make, v.model, v.year].filter(Boolean).join(' · ')}</div>
              </div>
              {v.createdAt && <div style={{ fontSize: 12, color: '#6b7280' }}>Added {formatAddedDate(v.createdAt)}</div>}
            </div>
          ))}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>Close</button>
          <button type="button" className="btn btn-primary" onClick={onEdit}><Edit2 size={14} /> Edit Customer</button>
        </div>
      </div>
    </div>
  );
}

function AddedDateField({ value, onChange }) {
  return (
    <div className="form-group">
      <label className="form-label">Customer Added On</label>
      <input className="form-control" type="date" value={value} max={toDateInput()}
        onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function EditCustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    createdAt: customer.createdAt ? toDateInput(customer.createdAt) : '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      await customerApi.update(customer.id, form);
      toast.success('Customer updated!');
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>Edit Customer</h3>
          <button className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-control" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Eg: Rajesh Kumar" />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number *</label>
              <input className="form-control" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-control" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <textarea className="form-control" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address..." />
            </div>
            <AddedDateField value={form.createdAt} onChange={v => set('createdAt', v)} />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddCustomerVehicleModal({ onClose, onSave }) {
  const [step, setStep] = useState(1);
  const [cust, setCust] = useState({ name: '', phone: '', email: '', address: '', createdAt: toDateInput() });
  const [veh, setVeh] = useState({ registrationNumber: '', make: '', model: '', year: '', color: '', fuelType: '' });
  const [saving, setSaving] = useState(false);

  const setC = (k, v) => setCust(f => ({ ...f, [k]: v }));
  const setV = (k, v) => setVeh(f => ({ ...f, [k]: v }));

  const goNext = (e) => {
    e.preventDefault();
    if (!cust.name.trim() || !cust.phone.trim()) return toast.error('Name and phone are required');
    setStep(2);
  };

  const saveCustomerOnly = async () => {
    if (!cust.name.trim() || !cust.phone.trim()) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      await customerApi.create(cust);
      toast.success('Customer added!');
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const saveBoth = async (e) => {
    e.preventDefault();
    if (!veh.registrationNumber || !veh.make || !veh.model)
      return toast.error('Registration, make and model are required');
    setSaving(true);
    try {
      const custRes = await customerApi.create(cust);
      const newCustomerId = custRes.data.id;
      await vehicleApi.create({
        ...veh,
        customerId: newCustomerId,
        year: veh.year ? Number(veh.year) : null,
      });
      toast.success('Customer & vehicle added!');
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal-header">
          <div>
            <h3>Add Customer + Vehicle</h3>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <span style={{
                padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: step === 1 ? '#1a1a2e' : '#e5e7eb',
                color: step === 1 ? 'white' : '#6b7280',
              }}>
                <Users size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                1. Customer
              </span>
              <span style={{ color: '#9ca3af', fontSize: 12, alignSelf: 'center' }}>→</span>
              <span style={{
                padding: '2px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: step === 2 ? '#1a1a2e' : '#e5e7eb',
                color: step === 2 ? 'white' : '#6b7280',
              }}>
                <Car size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                2. Vehicle
              </span>
            </div>
          </div>
          <button className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>

        {step === 1 && (
          <form onSubmit={goNext}>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-control" value={cust.name} onChange={e => setC('name', e.target.value)} placeholder="Eg: Rajesh Kumar" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="form-control" value={cust.phone} onChange={e => setC('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-control" type="email" value={cust.email} onChange={e => setC('email', e.target.value)} placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-control" value={cust.address} onChange={e => setC('address', e.target.value)} placeholder="Full address..." rows={2} />
              </div>
              <AddedDateField value={cust.createdAt} onChange={v => setC('createdAt', v)} />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={saveCustomerOnly} disabled={saving}>
                {saving ? 'Saving...' : 'Save Customer Only'}
              </button>
              <button type="submit" className="btn btn-primary">
                Next: Add Vehicle <ChevronRight size={15} style={{ marginLeft: 4 }} />
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={saveBoth}>
            <div className="modal-body">
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={14} />
                <span>Customer: <strong>{cust.name}</strong> — {cust.phone}</span>
              </div>
              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input className="form-control" value={veh.registrationNumber}
                  onChange={e => setV('registrationNumber', e.target.value.toUpperCase())}
                  placeholder="TN 01 AB 1234" style={{ textTransform: 'uppercase' }} autoFocus />
              </div>
              <MakeModelSelect
                make={veh.make}
                model={veh.model}
                onMakeChange={v => setV('make', v)}
                onModelChange={v => setV('model', v)}
              />
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select className="form-control" value={veh.year} onChange={e => setV('year', e.target.value)}>
                    <option value="">Select year</option>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <input className="form-control" value={veh.color} onChange={e => setV('color', e.target.value)} placeholder="White, Silver..." />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fuel Type</label>
                <select className="form-control" value={veh.fuelType} onChange={e => setV('fuelType', e.target.value)}>
                  <option value="">Select fuel type</option>
                  {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline" onClick={() => setStep(1)}>
                <ChevronLeft size={15} style={{ marginRight: 4 }} /> Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Customer & Vehicle'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);
  const [viewing, setViewing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await customerApi.getAll(query || undefined);
      setCustomers(r.data);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete customer "${name}"? This will also delete their vehicles.`)) return;
    try {
      await customerApi.delete(id);
      toast.success('Customer deleted');
      load();
    } catch { toast.error('Failed to delete customer'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Customers</h1>
          <p>{customers.length} customer{customers.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Customer
        </button>
      </div>

      <div className="card">
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search className="search-icon" />
            <input className="form-control" style={{ paddingLeft: 38, width: '100%' }}
              placeholder="Search by name, phone, email..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-outline">Search</button>
          {query && <button type="button" className="btn btn-outline" onClick={() => { setQuery(''); load(); }}>Clear</button>}
        </form>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : customers.length === 0 ? (
          <div className="empty-state">
            <Users />
            <h3>No customers found</h3>
            <p>Add your first customer to get started</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Vehicles</th>
                  <th>Added On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} onClick={() => setViewing(c)} style={{ cursor: 'pointer' }} title="Click to view details">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a1a2e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {c.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{c.name}</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>ID #{c.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                        <Phone size={12} color="#6b7280" />{c.phone}
                      </div>
                      {c.email && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                        <Mail size={12} />{c.email}
                      </div>}
                    </td>
                    <td style={{ fontSize: 13, color: '#6b7280', maxWidth: 200 }}>
                      {c.address ? <span style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}><MapPin size={12} style={{ marginTop: 2, flexShrink: 0 }} />{c.address}</span> : '-'}
                    </td>
                    <td>
                      <span style={{ background: '#dbeafe', color: '#1e40af', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                        {c.vehicleCount} vehicle{c.vehicleCount !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>
                      {formatAddedDate(c.createdAt)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button className="btn btn-icon btn-outline" title="Edit" onClick={() => setModal(c)}><Edit2 size={14} /></button>
                        <button className="btn btn-icon" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }} title="Delete" onClick={() => handleDelete(c.id, c.name)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewing && (
        <CustomerDetailsModal
          customer={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setModal(viewing); setViewing(null); }}
        />
      )}

      {modal === 'add' && (
        <AddCustomerVehicleModal
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}

      {modal !== null && modal !== 'add' && (
        <EditCustomerModal
          customer={modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
