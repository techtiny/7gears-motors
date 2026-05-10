import { useState, useEffect } from 'react';
import { vehicleApi, customerApi } from '../api';
import { Search, Plus, Edit2, Trash2, Car } from 'lucide-react';
import toast from 'react-hot-toast';

const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'];
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

function VehicleModal({ vehicle, onClose, onSave }) {
  const [form, setForm] = useState({
    registrationNumber: vehicle?.registrationNumber || '',
    make: vehicle?.make || '',
    model: vehicle?.model || '',
    year: vehicle?.year || '',
    color: vehicle?.color || '',
    fuelType: vehicle?.fuelType || '',
    customerId: vehicle?.customerId || '',
  });
  const [customers, setCustomers] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    customerApi.getAll().then(r => setCustomers(r.data)).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.registrationNumber || !form.make || !form.model || !form.customerId)
      return toast.error('Registration, make, model and customer are required');
    setSaving(true);
    try {
      const payload = { ...form, customerId: Number(form.customerId), year: form.year ? Number(form.year) : null };
      if (vehicle?.id) await vehicleApi.update(vehicle.id, payload);
      else await vehicleApi.create(payload);
      toast.success(vehicle?.id ? 'Vehicle updated!' : 'Vehicle added!');
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{vehicle?.id ? 'Edit Vehicle' : 'Add Vehicle'}</h3>
          <button className="btn btn-icon btn-outline" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Customer *</label>
              <select className="form-control" value={form.customerId} onChange={e => set('customerId', e.target.value)}>
                <option value="">Select customer...</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Registration Number *</label>
              <input className="form-control" value={form.registrationNumber}
                onChange={e => set('registrationNumber', e.target.value.toUpperCase())}
                placeholder="TN 01 AB 1234" style={{ textTransform: 'uppercase' }} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Make *</label>
                <input className="form-control" value={form.make} onChange={e => set('make', e.target.value)} placeholder="Maruti, Honda..." />
              </div>
              <div className="form-group">
                <label className="form-label">Model *</label>
                <input className="form-control" value={form.model} onChange={e => set('model', e.target.value)} placeholder="Swift, City..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year</label>
                <select className="form-control" value={form.year} onChange={e => set('year', e.target.value)}>
                  <option value="">Select year</option>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Color</label>
                <input className="form-control" value={form.color} onChange={e => set('color', e.target.value)} placeholder="White, Silver..." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Fuel Type</label>
              <select className="form-control" value={form.fuelType} onChange={e => set('fuelType', e.target.value)}>
                <option value="">Select fuel type</option>
                {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (vehicle?.id ? 'Update' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const r = await vehicleApi.getAll(query ? { q: query } : {});
      setVehicles(r.data);
    } catch { toast.error('Failed to load vehicles'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, reg) => {
    if (!window.confirm(`Delete vehicle "${reg}"?`)) return;
    try {
      await vehicleApi.delete(id);
      toast.success('Vehicle deleted');
      load();
    } catch { toast.error('Failed to delete vehicle'); }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Vehicles</h1>
          <p>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''} registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Add Vehicle
        </button>
      </div>

      <div className="card">
        <form onSubmit={e => { e.preventDefault(); load(); }} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1 }}>
            <Search className="search-icon" />
            <input className="form-control" style={{ paddingLeft: 38, width: '100%' }}
              placeholder="Search by reg no, make, model..."
              value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-outline">Search</button>
          {query && <button type="button" className="btn btn-outline" onClick={() => { setQuery(''); setTimeout(load, 50); }}>Clear</button>}
        </form>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : vehicles.length === 0 ? (
          <div className="empty-state">
            <Car />
            <h3>No vehicles found</h3>
            <p>Add your first vehicle to start tracking</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Vehicle</th>
                  <th>Owner</th>
                  <th>Color / Fuel</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map(v => (
                  <tr key={v.id}>
                    <td>
                      <span style={{ fontWeight: 700, color: '#1a1a2e', fontFamily: 'monospace', fontSize: 15, background: '#f3f4f6', padding: '3px 8px', borderRadius: 6 }}>
                        {v.registrationNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 34, height: 34, background: '#dbeafe', color: '#1e40af', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Car size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{v.make} {v.model}</div>
                          {v.year && <div style={{ fontSize: 12, color: '#6b7280' }}>{v.year}</div>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{v.customerName || '-'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{v.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: 13 }}>
                      {v.color && <div>{v.color}</div>}
                      {v.fuelType && <div style={{ color: '#6b7280' }}>{v.fuelType}</div>}
                    </td>
                    <td style={{ fontSize: 13, color: '#6b7280' }}>
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-icon btn-outline" title="Edit" onClick={() => setModal(v)}><Edit2 size={14} /></button>
                        <button className="btn btn-icon" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }} title="Delete" onClick={() => handleDelete(v.id, v.registrationNumber)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal !== null && (
        <VehicleModal
          vehicle={modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
