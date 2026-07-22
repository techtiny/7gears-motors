import { useState, useEffect, useRef } from 'react';
import { materialApi } from '../api';
import { Plus, Edit2, Trash2, Check, X, Send, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { MATERIAL_LIST } from '../data/materialList';

const EMPTY = { description: '', remarks: '', quantity: '', amount: '' };

function DescriptionInput({ value, onChange, placeholder, autoFocus }) {
  const [open, setOpen]       = useState(false);
  const [options, setOptions] = useState([]);
  const wrapRef               = useRef(null);

  const handleChange = (v) => {
    onChange(v);
    const q = v.trim().toUpperCase();
    if (q) {
      const matches = MATERIAL_LIST.filter(m => m.includes(q));
      setOptions(matches.slice(0, 10));
      setOpen(matches.length > 0);
    } else {
      setOptions(MATERIAL_LIST.slice(0, 10));
      setOpen(true);
    }
  };

  const handleFocus = () => {
    if (!value.trim()) {
      setOptions(MATERIAL_LIST.slice(0, 10));
      setOpen(true);
    }
  };

  const select = (item) => {
    onChange(item);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <input
        className="form-control"
        style={{ fontSize: 13, padding: '4px 8px' }}
        value={value}
        onChange={e => handleChange(e.target.value)}
        onFocus={handleFocus}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
      />
      {open && options.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 6,
          zIndex: 200, maxHeight: 200, overflowY: 'auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        }}>
          {options.map(item => (
            <div
              key={item}
              onMouseDown={() => select(item)}
              style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f3f4f6' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
        <DescriptionInput
          value={form.description}
          onChange={v => onChange('description', v)}
          placeholder="Description *"
          autoFocus
        />
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

function MobileItemCard({ item, sNo, onEdit, onDelete }) {
  return (
    <div className="mat-item-card">
      <div className="mat-item-card-top">
        <span className="mat-item-card-desc">{sNo}. {item.description}</span>
        <span className="mat-item-card-amount">
          ₹{Number(item.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      </div>
      {(item.quantity || item.remarks) && (
        <div className="mat-item-card-meta">
          {item.quantity && <span>Qty: {item.quantity}</span>}
          {item.remarks && <span>{item.remarks}</span>}
        </div>
      )}
      <div className="mat-item-card-actions">
        <button className="btn btn-icon btn-outline" onClick={() => onEdit(item)}><Edit2 size={13} /></button>
        <button className="btn btn-icon" style={{ background: '#fee2e2', color: '#ef4444', border: 'none' }} onClick={() => onDelete(item)}><Trash2 size={13} /></button>
      </div>
    </div>
  );
}

function MobileEditRow({ form, onChange, onSave, onCancel, saving }) {
  return (
    <div className="mat-add-row">
      <DescriptionInput value={form.description} onChange={v => onChange('description', v)} placeholder="Description *" autoFocus />
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="form-control" style={{ fontSize: 13 }} type="number" step="0.001" min="0"
          value={form.quantity} onChange={e => onChange('quantity', e.target.value)} placeholder="Qty" />
        <input className="form-control" style={{ fontSize: 13 }} type="number" step="0.01" min="0"
          value={form.amount} onChange={e => onChange('amount', e.target.value)} placeholder="Amount ₹ *" />
      </div>
      <input className="form-control" style={{ fontSize: 13 }}
        value={form.remarks} onChange={e => onChange('remarks', e.target.value)} placeholder="Remarks" />
      <div className="mat-add-row-actions">
        <button className="btn btn-outline btn-sm" onClick={onCancel}><X size={13} /> Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={onSave} disabled={saving}>
          <Check size={13} /> {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}

export default function MaterialConsumed({ jobId }) {
  const [items, setItems]       = useState([]);
  const [editId, setEditId]     = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [adding, setAdding]     = useState(false);
  const [saving, setSaving]     = useState(false);
  const [sending, setSending]   = useState(false);

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

  const handleSendApproval = async () => {
    if (items.length === 0) return toast.error('Add materials first');
    setSending(true);
    try {
      await materialApi.sendApproval(jobId);
      toast.success('📄 PDF sent to customer via WhatsApp!');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send PDF');
    } finally { setSending(false); }
  };

  const handleDownloadPdf = async () => {
    if (items.length === 0) return toast.error('Add materials first');
    try {
      const res = await materialApi.downloadPdf(jobId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `Material_Estimate_Job${jobId}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Failed to download PDF'); }
  };

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
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {items.length > 0 && !adding && !editId && (
            <>
              <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={handleDownloadPdf}>
                <Download size={13} /> PDF
              </button>
              <button
                className="btn btn-success"
                style={{ padding: '6px 12px', fontSize: 12, background: '#25D366' }}
                onClick={handleSendApproval}
                disabled={sending}>
                <Send size={13} /> {sending ? 'Sending…' : 'Send for Approval'}
              </button>
            </>
          )}
          {!adding && !editId && (
            <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={() => { setAdding(true); setForm(EMPTY); }}>
              <Plus size={14} /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* ── Mobile card view (shown on ≤640px) ── */}
      <div className="mat-card-list">
        {items.length === 0 && !adding && !editId && (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px 0', fontSize: 13 }}>
            No materials added yet. Tap "Add Item" to start.
          </p>
        )}
        {items.map((item, i) =>
          editId === item.id
            ? <MobileEditRow key={item.id} form={form} onChange={setF} onSave={handleUpdate} onCancel={cancelEdit} saving={saving} />
            : <MobileItemCard key={item.id} item={item} sNo={i + 1} onEdit={handleEdit} onDelete={handleDelete} />
        )}
        {adding && <MobileEditRow form={form} onChange={setF} onSave={handleAdd} onCancel={cancelEdit} saving={saving} />}
        {items.length > 0 && (
          <div className="mat-total-bar">
            <span>TOTAL</span>
            <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>

      {/* ── Desktop table view (hidden on ≤640px) ── */}
      <div className="mat-table-wrap table-wrapper" style={{ marginBottom: 0 }}>
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
      </div>{/* end mat-table-wrap */}
    </div>
  );
}
