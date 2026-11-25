import { useEffect, useState } from 'react';
import { termsApi } from '../api';
import { Send, FileText, PenLine, ChevronDown, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const fmtDT = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : '';

const STATUS = {
  NONE:       { bg: '#fef2f2', border: '#fca5a5', color: '#991b1b', icon: '⛔', text: 'Not sent yet — customer must accept the Terms & Conditions before work begins' },
  PENDING:    { bg: '#fffbeb', border: '#fcd34d', color: '#92400e', icon: '⏳', text: 'Waiting for the customer to accept on WhatsApp — work cannot begin yet' },
  ACCEPTED:   { bg: '#dcfce7', border: '#86efac', color: '#166534', icon: '✅', text: 'Accepted by customer — work may begin' },
  DECLINED:   { bg: '#fee2e2', border: '#fca5a5', color: '#991b1b', icon: '❌', text: 'Customer did NOT accept — do not begin work' },
  SUPERSEDED: { bg: '#f3f4f6', border: '#d1d5db', color: '#374151', icon: 'ℹ️', text: 'Replaced by a newer request' },
};
const LABEL = { PENDING: 'Awaiting', ACCEPTED: 'Accepted', DECLINED: 'Not accepted', SUPERSEDED: 'Replaced' };

/** Terms & Conditions acceptance — required before the job can move to In Progress. */
export default function TermsApproval({ jobId, jobStatus, onChanged }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const load = () => termsApi.get(jobId).then(r => setData(r.data)).catch(() => {});
  useEffect(() => { load(); }, [jobId]);

  // While waiting on the customer, refresh every 15s so their WhatsApp answer shows up
  const latest = data?.latest;
  const accepted = !!data?.accepted;
  useEffect(() => {
    if (accepted || latest?.status !== 'PENDING') return;
    const t = setInterval(() => { load(); onChanged?.(); }, 15000);
    return () => clearInterval(t);
  }, [accepted, latest?.status, jobId]);

  if (!data) return null;
  const preWork = ['RECEIVED', 'INSPECTING', 'AWAITING_APPROVAL'].includes(jobStatus);
  // Jobs already past the start of work before this rule existed: nothing to block, keep the card quiet.
  if (!accepted && !latest && !preWork) return null;

  const st = accepted ? 'ACCEPTED' : (latest?.status || 'NONE');
  const s = STATUS[st] || STATUS.NONE;
  const acceptedRow = (data.history || []).find(h => h.status === 'ACCEPTED');

  const run = async (key, fn, ok) => {
    setBusy(key);
    try { await fn(); toast.success(ok); load(); onChanged?.(); }
    catch (e) { toast.error(e?.response?.data?.message || 'Something went wrong'); }
    finally { setBusy(''); }
  };
  const send = () => run('send', () => termsApi.send(jobId), '📜 Terms & Conditions + Accept poll sent to customer on WhatsApp');
  const resend = () => run('resend', () => termsApi.resend(jobId), '🔁 Terms & Conditions re-sent to customer');
  const inPerson = () => {
    const note = window.prompt('Customer signed the printed Terms & Conditions at the counter?\n\nOptional note (e.g. who witnessed it):', '');
    if (note === null) return;
    run('person', () => termsApi.acceptInPerson(jobId, note), '✍️ Recorded: terms signed in person');
  };
  const viewPdf = async () => {
    try {
      const r = await termsApi.pdf(jobId);
      window.open(URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' })), '_blank');
    } catch { toast.error('Could not open the PDF'); }
  };
  const btn = { padding: '5px 11px', fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 5 };

  return (
    <div className="card" style={{ marginBottom: 20, padding: '14px 18px', background: s.bg, border: `1.5px solid ${s.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Terms &amp; Conditions</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: s.color, marginTop: 2 }}>{s.icon} {s.text}</div>
          <div style={{ fontSize: 12, color: s.color, opacity: 0.9, marginTop: 3 }}>
            {accepted && acceptedRow && <>Accepted {acceptedRow.acceptedVia ? `(${acceptedRow.acceptedVia}) ` : ''}on {fmtDT(acceptedRow.respondedAt)}{acceptedRow.note ? ` · ${acceptedRow.note}` : ''}</>}
            {!accepted && latest && <>Sent {fmtDT(latest.sentAt)}{latest.sentBy ? ` by ${latest.sentBy}` : ''}{latest.resendCount ? ` · ${latest.resendCount} reminder${latest.resendCount > 1 ? 's' : ''}` : ''}{latest.respondedAt ? ` · answered ${fmtDT(latest.respondedAt)}` : ''}</>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-outline" style={btn} onClick={viewPdf}><FileText size={13} /> View PDF</button>
          {!accepted && (st === 'NONE' || st === 'DECLINED' || st === 'SUPERSEDED') && (
            <button type="button" className="btn" disabled={!!busy} style={{ ...btn, background: '#25D366', color: '#fff', border: 'none' }} onClick={send}>
              <Send size={13} /> {busy === 'send' ? 'Sending…' : st === 'DECLINED' ? 'Send again for acceptance' : 'Send T&C for acceptance on WhatsApp'}
            </button>
          )}
          {!accepted && st === 'PENDING' && (
            <button type="button" className="btn" disabled={!!busy} style={{ ...btn, background: '#25D366', color: '#fff', border: 'none' }} onClick={resend}>
              <Send size={13} /> {busy === 'resend' ? 'Sending…' : 'Resend T&C + Accept poll'}
            </button>
          )}
          {!accepted && (
            <button type="button" className="btn btn-outline" disabled={!!busy} style={btn} onClick={inPerson}
              title="Use when the customer signs the printed terms at the counter">
              <PenLine size={13} /> {busy === 'person' ? 'Saving…' : 'Signed in person'}
            </button>
          )}
        </div>
      </div>

      {(data.history || []).length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button type="button" onClick={() => setShowHistory(v => !v)}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 600, color: '#374151', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {showHistory ? <ChevronDown size={14} /> : <ChevronRight size={14} />} History ({data.history.length})
          </button>
          {showHistory && (
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 6, fontSize: 12, background: '#fff', borderRadius: 8 }}>
              <thead><tr style={{ color: '#6b7280', textAlign: 'left' }}>
                <th style={{ padding: 6 }}>Sent</th><th style={{ padding: 6 }}>By</th><th style={{ padding: 6 }}>Result</th>
                <th style={{ padding: 6 }}>Answered</th><th style={{ padding: 6 }}>How</th><th style={{ padding: 6 }}>Reminders</th>
              </tr></thead>
              <tbody>
                {data.history.map(h => (
                  <tr key={h.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 6, whiteSpace: 'nowrap' }}>{fmtDT(h.sentAt)}</td>
                    <td style={{ padding: 6 }}>{h.sentBy || '—'}</td>
                    <td style={{ padding: 6, fontWeight: 700 }}>{LABEL[h.status] || h.status}</td>
                    <td style={{ padding: 6, whiteSpace: 'nowrap' }}>{h.respondedAt ? fmtDT(h.respondedAt) : '—'}</td>
                    <td style={{ padding: 6 }}>{h.acceptedVia || '—'}{h.note ? ` · ${h.note}` : ''}</td>
                    <td style={{ padding: 6 }}>{h.resendCount || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
