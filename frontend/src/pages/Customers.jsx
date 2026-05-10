import { useState, useEffect } from 'react';
import { customerApi } from '../api';
import { Search, Plus, Edit2, Trash2, Users, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

function CustomerModal({ customer, onClose, onSave }) {
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    email: customer?.email || '',
    address: customer?.address || '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return toast.error('Name and phone are required');
    setSaving(true);
    try {
      if (customer?.id) await customerApi.update(customer.id, form);
      else await customerApi.create(form);
      toast.success(customer?.id ? 'Customer updated!' : 'Customer added!');
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{customer?.id ? 'Edit Customer' : 'Add Customer'}</h3>
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
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (customer?.id ? 'Update' : 'Add Customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [modal, setModal] = useState(null);

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
        <button className="btn btn-primary" onClick={() => setModal({})}>
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
                  <th>Since</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id}>
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
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
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

      {modal !== null && (
        <CustomerModal
          customer={modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
