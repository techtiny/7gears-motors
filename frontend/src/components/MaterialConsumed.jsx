import { useState, useEffect, useRef } from 'react';
import { materialApi } from '../api';
import { Plus, Edit2, Trash2, Check, X, Send, Download, Copy, History, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { MATERIAL_LIST } from '../data/materialList';

const MATERIAL_TERMS = [
  'Tax is extra on the final billing amount.',
  'The details and the estimate provided above are based on our first inspection and do not constitute a guarantee that no further works / parts will be required.',
  'The total bill of work will be as per the details available on completion of the work.',
  'Terms and conditions as applicable.',
];

const EMPTY = { description: '', remarks: '', quantity: '', amount: '', labour: '' };

const inr = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const lineTotal = (item) => Number(item.amount || 0) + Number(item.labour || 0);

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
        style={{ fontSize: 14, padding: '8px 10px', width: '100%' }}
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
          zIndex: 200, maxHeight: 280, overflowY: 'auto', marginTop: 4,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}>
          {options.map(item => (
            <div
              key={item}
              onMouseDown={() => select(item)}
              style={{ padding: '10px 12px', cursor: 'pointer', fontSize: 14, borderBottom: '1px solid #f3f4f6' }}
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

const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

function ApprovalStatus({ approval, currentTotal, jobId, onChanged }) {
  const [resending, setResending] = useState(false);
  if (!approval) return null;
  const expired = approval.expired;
  const st = expired ? 'EXPIRED' : approval.status;
  const styles = {
    PENDING:    { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⏳', text: 'Awaiting customer approval' },
    APPROVED:   { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: '✅', text: 'Approved by customer' },
    REJECTED:   { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '❌', text: 'Rejected by customer' },
    SUPERSEDED: { bg: '#f3f4f6', border: '#d1d5db', color: '#374151', icon: 'ℹ️', text: 'Replaced by a newer estimate' },
    EXPIRED:    { bg: '#f3f4f6', border: '#d1d5db', color: '#374151', icon: '⏰', text: 'Approval link expired — send again' },
  }[st];
  const changed = Math.abs(Number(approval.grandTotal || 0) - currentTotal) > 0.005;

  const resendLink = async () => {
    setResending(true);
    try {
      await materialApi.resendApprovalLink(jobId);
      toast.success('📄 Estimate PDF + Approve/Reject poll sent to customer on WhatsApp');
      onChanged?.();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to send poll');
    } finally { setResending(false); }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(approval.link); toast.success('Approval link copied'); }
    catch { toast.error('Could not copy link'); }
  };

  return (
    <div style={{ background: styles.bg, border: `1px solid ${styles.border}`, color: styles.color, borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>
          {styles.icon} {styles.text} · ₹{inr(approval.grandTotal)}
        </div>
        {st === 'PENDING' && approval.link && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn" disabled={resending}
              style={{ padding: '4px 10px', fontSize: 12, background: '#25D366', color: 'white', border: 'none' }}
              onClick={resendLink}>
              <Send size={12} /> {resending ? 'Sending…' : 'Resend PDF + Approve/Reject poll'}
            </button>
            <button type="button" className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={copyLink}>
              <Copy size={12} /> Copy link
            </button>
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, marginTop: 4, opacity: 0.9 }}>
        Sent {fmtDT(approval.sentAt)}{approval.sentBy ? ` by ${approval.sentBy}` : ''}
        {approval.respondedAt && <> · Customer responded {fmtDT(approval.respondedAt)}</>}
      </div>
      {approval.customerComment && (
        <div style={{ fontSize: 13, marginTop: 6 }}>Customer comment: “{approval.customerComment}”</div>
      )}
      {changed && (st === 'APPROVED' || st === 'PENDING') && (
        <div style={{ fontSize: 12, marginTop: 6, fontWeight: 600, color: '#b45309' }}>
          ⚠ Items have changed since this was sent (current total ₹{inr(currentTotal)}). Send for approval again.
        </div>
      )}
    </div>
  );
}


const HISTORY_STATUS = {
  PENDING:    { label: 'Awaiting response', bg: '#fef3c7', color: '#92400e' },
  APPROVED:   { label: 'Approved',          bg: '#dcfce7', color: '#166534' },
  REJECTED:   { label: 'Rejected',          bg: '#fee2e2', color: '#991b1b' },
  SUPERSEDED: { label: 'Replaced',          bg: '#f3f4f6', color: '#4b5563' },
  EXPIRED:    { label: 'Expired',           bg: '#f3f4f6', color: '#4b5563' },
};

/** Every estimate sent to the customer for this job, with its outcome. */
function ApprovalHistory({ history }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(null);
  if (!history || history.length === 0) return null;
  const counts = history.reduce((c, h) => { const k = h.expired ? 'EXPIRED' : h.status; c[k] = (c[k] || 0) + 1; return c; }, {});
  const cell = { padding: '8px 10px', fontSize: 13, borderBottom: '1px solid #f1f5f9', verticalAlign: 'top' };
  const head = { ...cell, fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', background: '#f9fafb', whiteSpace: 'nowrap' };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 10, marginBottom: 14, overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        <History size={15} color="#6b7280" />
        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>Approval history</span>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {history.length} estimate{history.length === 1 ? '' : 's'} sent
          {Object.entries(counts).map(([k, n]) => ` · ${n} ${(HISTORY_STATUS[k]?.label || k).toLowerCase()}`).join('')}
        </span>
      </button>
      {open && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr>
              <th style={head}>#</th>
              <th style={head}>Sent</th>
              <th style={head}>Sent by</th>
              <th style={{ ...head, textAlign: 'right' }}>Total</th>
              <th style={head}>Result</th>
              <th style={head}>Responded / closed</th>
              <th style={head}>Reminders</th>
              <th style={head}>Customer comment</th>
            </tr></thead>
            <tbody>
              {history.map((h, i) => {
                const st = h.expired ? 'EXPIRED' : h.status;
                const s = HISTORY_STATUS[st] || HISTORY_STATUS.PENDING;
                const isOpen = expanded === h.id;
                return [
                  <tr key={h.id} onClick={() => setExpanded(isOpen ? null : h.id)} style={{ cursor: 'pointer', background: isOpen ? '#f8fafc' : undefined }}
                    title="Click to see the items in this estimate">
                    <td style={{ ...cell, color: '#6b7280' }}>{history.length - i}</td>
                    <td style={{ ...cell, whiteSpace: 'nowrap' }}>{fmtDT(h.sentAt)}</td>
                    <td style={cell}>{h.sentBy || '—'}</td>
                    <td style={{ ...cell, textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>₹{inr(h.grandTotal)}</td>
                    <td style={cell}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 100, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>{s.label}</span>
                    </td>
                    <td style={{ ...cell, whiteSpace: 'nowrap', color: '#374151' }}>
                      {h.respondedAt ? fmtDT(h.respondedAt) : h.supersededAt ? `${fmtDT(h.supersededAt)} (replaced)` : '—'}
                    </td>
                    <td style={{ ...cell, color: '#374151' }}>
                      {h.resendCount ? `${h.resendCount}× · last ${fmtDT(h.lastResentAt)}` : '—'}
                    </td>
                    <td style={{ ...cell, color: '#374151', maxWidth: 240 }}>{h.customerComment || '—'}</td>
                  </tr>,
                  isOpen && (
                    <tr key={`${h.id}-items`}>
                      <td colSpan={8} style={{ padding: '6px 14px 12px 40px', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                          <thead><tr style={{ color: '#6b7280', textAlign: 'left' }}>
                            <th style={{ padding: 4 }}>Item</th><th style={{ padding: 4 }}>Remarks</th><th style={{ padding: 4, textAlign: 'center' }}>Qty</th>
                            <th style={{ padding: 4, textAlign: 'right' }}>Part</th><th style={{ padding: 4, textAlign: 'right' }}>Labour</th><th style={{ padding: 4, textAlign: 'right' }}>Total</th>
                          </tr></thead>
                          <tbody>
                            {(h.items || []).map((it, k) => (
                              <tr key={k}>
                                <td style={{ padding: 4 }}>{it.description}</td>
                                <td style={{ padding: 4, color: '#6b7280' }}>{it.remarks || '—'}</td>
                                <td style={{ padding: 4, textAlign: 'center' }}>{it.quantity ?? '—'}</td>
                                <td style={{ padding: 4, textAlign: 'right' }}>₹{inr(it.amount)}</td>
                                <td style={{ padding: 4, textAlign: 'right' }}>{Number(it.labour) ? `₹${inr(it.labour)}` : '—'}</td>
                                <td style={{ padding: 4, textAlign: 'right', fontWeight: 600 }}>₹{inr(it.total)}</td>
                              </tr>
                            ))}
                            <tr style={{ fontWeight: 700 }}>
                              <td colSpan={3} style={{ padding: 4 }}>Parts ₹{inr(h.partsTotal)} · Labour ₹{inr(h.labourTotal)}</td>
                              <td colSpan={3} style={{ padding: 4, textAlign: 'right' }}>Grand total ₹{inr(h.grandTotal)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  ),
                ];
              })}
            </tbody>
          </table>
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
      <td style={{ textAlign: 'right', fontSize: 14 }}>₹{inr(item.amount)}</td>
      <td style={{ textAlign: 'right', fontSize: 14, color: item.labour ? undefined : '#9ca3af' }}>
        {item.labour ? `₹${inr(item.labour)}` : '—'}
      </td>
      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 14 }}>₹{inr(lineTotal(item))}</td>
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
        <input className="form-control" style={{ fontSize: 14, padding: '8px 10px', width: '100%' }}
          value={form.remarks} onChange={e => onChange('remarks', e.target.value)}
          placeholder="Remarks" />
      </td>
      <td>
        <input className="form-control" style={{ fontSize: 14, padding: '8px 10px', textAlign: 'center', width: '100%' }}
          type="number" step="0.001" min="0"
          value={form.quantity} onChange={e => onChange('quantity', e.target.value)}
          placeholder="Qty" />
      </td>
      <td>
        <input className="form-control" style={{ fontSize: 14, padding: '8px 10px', textAlign: 'right', width: '100%' }}
          type="number" step="0.01" min="0"
          value={form.amount} onChange={e => onChange('amount', e.target.value)}
          placeholder="Part ₹ *" />
      </td>
      <td>
        <input className="form-control" style={{ fontSize: 14, padding: '8px 10px', textAlign: 'right', width: '100%' }}
          type="number" step="0.01" min="0"
          value={form.labour} onChange={e => onChange('labour', e.target.value)}
          placeholder="Labour ₹" />
      </td>
      <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 14 }}>₹{inr(lineTotal(form))}</td>
      <td style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <button className="btn btn-icon" style={{ width: 32, height: 32, background: '#22c55e', color: 'white', border: 'none' }}
            onClick={onSave} disabled={saving}>
            <Check size={14} />
          </button>
          <button className="btn btn-icon btn-outline" style={{ width: 32, height: 32 }} onClick={onCancel}>
            <X size={14} />
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
        <span className="mat-item-card-amount">₹{inr(lineTotal(item))}</span>
      </div>
      <div className="mat-item-card-meta">
        <span>Part: ₹{inr(item.amount)}</span>
        {item.labour ? <span>Labour: ₹{inr(item.labour)}</span> : null}
        {item.quantity && <span>Qty: {item.quantity}</span>}
        {item.remarks && <span>{item.remarks}</span>}
      </div>
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
          value={form.amount} onChange={e => onChange('amount', e.target.value)} placeholder="Part ₹ *" />
        <input className="form-control" style={{ fontSize: 13 }} type="number" step="0.01" min="0"
          value={form.labour} onChange={e => onChange('labour', e.target.value)} placeholder="Labour ₹" />
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
  const [approval, setApproval] = useState(null);
  const [history, setHistory]   = useState([]);

  const load = () =>
    materialApi.getAll(jobId).then(r => setItems(r.data)).catch(() => {});

  const loadApproval = () => {
    materialApi.getApproval(jobId).then(r => setApproval(r.status === 204 ? null : r.data)).catch(() => {});
    materialApi.getApprovalHistory(jobId).then(r => setHistory(r.data || [])).catch(() => {});
  };

  useEffect(() => { load(); loadApproval(); }, [jobId]);

  // While waiting on the customer, refresh every 15s so their response shows up without reloading
  useEffect(() => {
    if (approval?.status !== 'PENDING' || approval?.expired) return;
    const t = setInterval(loadApproval, 15000);
    return () => clearInterval(t);
  }, [approval?.status, approval?.expired, jobId]);

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const partsTotal  = items.reduce((s, i) => s + Number(i.amount || 0), 0);
  const labourTotal = items.reduce((s, i) => s + Number(i.labour || 0), 0);
  const total       = partsTotal + labourTotal;

  const toPayload = () => ({
    description: form.description.trim(),
    remarks:     form.remarks.trim() || null,
    quantity:    form.quantity !== '' ? Number(form.quantity) : null,
    amount:      Number(form.amount),
    labour:      form.labour !== '' ? Number(form.labour) : null,
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
      labour:      item.labour ?? '',
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
      toast.success('📄 Estimate + Approve/Reject poll sent to customer on WhatsApp!');
      loadApproval();
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

      <ApprovalStatus approval={approval} currentTotal={total} jobId={jobId} onChanged={loadApproval} />
      <ApprovalHistory history={history} />

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
          <>
            <div className="mat-item-card-meta" style={{ justifyContent: 'space-between', padding: '4px 2px' }}>
              <span>Parts: ₹{inr(partsTotal)}</span><span>Labour: ₹{inr(labourTotal)}</span>
            </div>
            <div className="mat-total-bar">
              <span>TOTAL</span>
              <span>₹{inr(total)}</span>
            </div>
          </>
        )}
      </div>

      {/* ── Desktop table view (hidden on ≤640px) ── */}
      <div className="mat-table-wrap table-wrapper"
        // While a row is being added/edited, let the description dropdown spill out of the table
        style={{ marginBottom: 0, overflow: (adding || editId) ? 'visible' : undefined }}>
        <table style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ width: 40, textAlign: 'center' }}>S.No</th>
              <th>Description</th>
              <th style={{ width: 200 }}>Remarks</th>
              <th style={{ width: 100, textAlign: 'center' }}>Qty</th>
              <th style={{ width: 130, textAlign: 'right' }}>Part (₹)</th>
              <th style={{ width: 130, textAlign: 'right' }}>Labour (₹)</th>
              <th style={{ width: 130, textAlign: 'right' }}>Total (₹)</th>
              <th style={{ width: 90 }} />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !adding && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0', fontSize: 13 }}>
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
              <tr style={{ background: '#f9fafb' }}>
                <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600, fontSize: 13, padding: '10px 14px', color: '#6b7280' }}>
                  SUBTOTAL
                </td>
                <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 14, padding: '10px 14px' }}>₹{inr(partsTotal)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, fontSize: 14, padding: '10px 14px' }}>₹{inr(labourTotal)}</td>
                <td colSpan={2} />
              </tr>
              <tr style={{ background: '#1a1a2e', color: 'white' }}>
                <td colSpan={6} style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, padding: '10px 14px' }}>
                  GRAND TOTAL
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, padding: '10px 14px' }}>₹{inr(total)}</td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>
      </div>{/* end mat-table-wrap */}

      {/* Terms — same text as printed on the estimate PDF */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: '#f9fafb', border: '1px solid var(--border)', borderRadius: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', letterSpacing: 0.4, marginBottom: 6 }}>
          NOTE / TERMS &amp; CONDITIONS
        </div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
          {MATERIAL_TERMS.map(t => <li key={t}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}
