import { useState, useEffect } from 'react';
import { materialApi } from '../api';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const EMPTY = { description: '', remarks: '', quantity: '', amount: '' };

function ItemRow({ item, sNo, onEdit, onDelete }) {
  return (
    <tr>
      <td style={{ textAlign: 'center', color: '#6b7280', fontSize: 13, width: 40 }}>{sNo}</td>
      <td style={{ fontSize: 14, fontWeight: 500 }}>{item.description}</td>
      <td style={{ fontSize: 13, color: '#6b7280' }}>{item.remarks || '—'}</td>
      <td style={{ textAlign: 'center', fontSize: 13 }}>{item.quantity ?? '—'}</td>
      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 14 }}>
        ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </td>
      <td style={{ textAlign: 'center', width: 70 }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <button className="btn btn-icon btn-outline" style={{ width: 26, height: 26 }} onClick={() => onEdit(item)}>
            <Edit2 size={12} />
          </button>
          <button className="btn btn-icon" style={{ width: 26, height: 26, background: '#fee2e2', color: '#ef4444', border: 'none' }} onClick={() => onDelete(item)}>
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function EditRow({ form, onChange, onSave, onCancel, saving }) {
  return (
    <tr style={{ background: '#f0fdf4' }}>
      <td />
      <td>
        <input className="form-control" style={{ fontSize: 13, padding: '4px 8px' }}
          value={form.description} onChange={e => onChange('description', e.target.value)}
          placeholder="Description *" autoFocus />
      </td>
      <td>
        <input className="form-control" style={{ fontSize: 13, padding: '4px 8px' }}
          value={form.remarks} onChange={e => onChange('remarks', e.target.value)}
          placeholder="Remarks" />
      </td>
      <td>
        <input className="form-control" style={{ fontSize: 13, padding: '4px 8px', textAlign: 'center' }}
          type="number" step="0.001" min="0"
          value={form.quantity} onChange={e => onChange('quantity', e.target.value)}
          placeholder="Qty" />
      </td>
      <td>
        <input className="form-control" style={{ fontSize: 13, padding: '4px 8px', textAlign: 'right' }}
          type="number" step="0.01" min="0"
          value={form.amount} onChange={e => onChange('amount', e.target.value)}
          placeholder="Amount *" />
      </td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <button className="btn btn-icon" style={{ width: 26, height: 26, background: '#22c55e', color: 'white', border: 'none' }}
            onClick={onSave} disabled={saving}>
            <Check size={12} />
          </button>
          <button className="btn btn-icon btn-outline" style={{ width: 26, height: 26 }} onClick={onCancel}>
            <X size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function MaterialConsumed({ jobId }) {
  const [items, setItems]     = useState([]);
  const [editId, setEditId]   = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [adding, setAdding]   = useState(false);
  const [saving, setSaving]   = useState(false);

  const load = () =>
    materialApi.getAll(jobId).then(r => setItems(r.data)).catch(() => {});

  useEffect(() => { load(); }, [jobId]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const total = items.reduce((s, i) => s + Number(i.amount || 0), 0);

  const toPayload = () => ({
    description: form.description.trim(),
    remarks:     form.remarks.trim() || null,
    quantity:    form.quantity !== '' ? Number(form.quantity) : null,
    amount:      Number(form.amount),
  });

  const handleAdd = async () => {
    if (!form.description.trim() || !form.amount) return toast.error('Description and amount are required');
    setSaving(true);
    try {
      await materialApi.create(jobId, toPayload());
      toast.success('Item added');
      setAdding(false);
      setForm(EMPTY);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to add item');
    } finally { setSaving(false); }
  };

  const handleEdit = (item) => {
    setEditId(item.id);
    setAdding(false);
    setForm({
      description: item.description,
      remarks:     item.remarks || '',
      quantity:    item.quantity ?? '',
      amount:      item.amount,
    });
  };

  const handleUpdate = async () => {
    if (!form.description.trim() || !form.amount) return toast.error('Description and amount are required');
    setSaving(true);
    try {
      await materialApi.update(jobId, editId, toPayload());
      toast.success('Item updated');
      setEditId(null);
      setForm(EMPTY);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update item');
    } finally { setSaving(false); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Remove "${item.description}"?`)) return;
    try {
      await materialApi.delete(jobId, item.id);
      toast.success('Item removed');
      load();
    } catch { toast.error('Failed to remove item'); }
  };

  const cancelEdit = () => { setEditId(null); setAdding(false); setForm(EMPTY); };

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>🔩</span>
          <h3 style={{ fontWeight: 600, fontSize: 15 }}>Material Consumed</h3>
          {items.length > 0 && (
            <span style={{ fontSize: 12, color: '#6b7280' }}>· {items.length} item{items.length !== 1 ? 's' : ''}</span>
          )}
        </div>
        {!adding && !editId && (
          <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}
            onClick={() => { setAdding(true); setForm(EMPTY); }}>
            <Plus size={14} /> Add Item
          </button>
        )}
      </div>

      <div className="table-wrapper" style={{ marginBottom: 0 }}>
        <table style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>S.No</th>
              <th>Description</th>
              <th style={{ width: 140 }}>Remarks</th>
              <th style={{ width: 70, textAlign: 'center' }}>Qty</th>
              <th style={{ width: 110, textAlign: 'right' }}>Amount (₹)</th>
              <th style={{ width: 70 }} />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !adding && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: 13 }}>
                  No materials added yet. Click "Add Item" to start.
                </td>
              </tr>
            )}

            {items.map((item, i) =>
              editId === item.id ? (
                <EditRow key={item.id} form={form} onChange={setF}
                  onSave={handleUpdate} onCancel={cancelEdit} saving={saving} />
              ) : (
                <ItemRow key={item.id} item={item} sNo={i + 1}
                  onEdit={handleEdit} onDelete={handleDelete} />
              )
            )}

            {adding && (
              <EditRow form={form} onChange={setF}
                onSave={handleAdd} onCancel={cancelEdit} saving={saving} />
            )}
          </tbody>

          {items.length > 0 && (
            <tfoot>
              <tr style={{ background: '#1a1a2e', color: 'white' }}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, padding: '10px 14px' }}>
                  TOTAL
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, padding: '10px 14px' }}>
                  ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
