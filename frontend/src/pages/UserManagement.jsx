import { useState, useEffect } from 'react';
import { userApi } from '../api';
import { Plus, Edit2, Trash2, X, Check, Shield, User, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const ROLES = ['CEO', 'ADMIN', 'MECHANIC'];
const ROLE_COLORS = {
  CEO:      { bg: '#FFF7ED', color: '#C2410C', border: '#FDBA74' },
  ADMIN:    { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' },
  MECHANIC: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
};

function RoleBadge({ role }) {
  const s = ROLE_COLORS[role] || ROLE_COLORS.MECHANIC;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`, letterSpacing: '0.3px' }}>
      {role}
    </span>
  );
}

function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user;
  const [form, setForm] = useState({
    username:    user?.username    || '',
    displayName: user?.displayName || '',
    role:        user?.role        || 'MECHANIC',
    password:    '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.username.trim()) return toast.error('Username is required');
    setSaving(true);
    try {
      const payload = {
        displayName: form.displayName.trim() || form.username.trim(),
        role:        form.role,
      };
      if (!isEdit) payload.username = form.username.trim();
      if (form.password.trim()) payload.password = form.password.trim();

      if (isEdit) {
        await userApi.update(user.id, payload);
        toast.success('User updated');
      } else {
        await userApi.create(payload);
        toast.success('User created');
      }
      onSave();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save user');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{isEdit ? `Edit: ${user.displayName}` : 'Add New User'}</h3>
          <button className="btn btn-icon btn-outline" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={submit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {!isEdit && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Username *</label>
                <input className="form-control" value={form.username}
                  onChange={e => set('username', e.target.value)}
                  placeholder="e.g. john" autoFocus />
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Display Name</label>
              <input className="form-control" value={form.displayName}
                onChange={e => set('displayName', e.target.value)}
                placeholder="Full name shown in the app" autoFocus={isEdit} />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role</label>
              <select className="form-control" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                CEO / ADMIN — full access &nbsp;·&nbsp; MECHANIC — view & update jobs
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{isEdit ? 'New Password (leave blank to keep current)' : 'Password'}</label>
              <div style={{ position: 'relative' }}>
                <KeyRound size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input className="form-control" style={{ paddingLeft: 36 }}
                  type="password" value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder={isEdit ? 'Leave blank to keep unchanged' : `Default: same as username`} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Check size={15} /> {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | 'add' | user object

  const myUsername = localStorage.getItem('displayName');

  const load = async () => {
    setLoading(true);
    try {
      const r = await userApi.getAll();
      setUsers(r.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (user) => {
    if (user.displayName === myUsername || user.username === localStorage.getItem('username')) {
      return toast.error('You cannot delete your own account');
    }
    if (!window.confirm(`Delete user "${user.displayName}" (@${user.username})?\nThey will no longer be able to log in.`)) return;
    try {
      await userApi.delete(user.id);
      toast.success('User deleted');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>User Management</h1>
          <p>{users.length} user{users.length !== 1 ? 's' : ''} · Manage who can access the system</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th style={{ width: 100, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%',
                          background: `linear-gradient(135deg, ${ROLE_COLORS[user.role]?.color || '#6b7280'} 0%, ${ROLE_COLORS[user.role]?.color || '#6b7280'}99 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, color: 'white', flexShrink: 0,
                        }}>
                          {user.displayName.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{user.displayName}</span>
                      </div>
                    </td>
                    <td style={{ color: '#6b7280', fontFamily: 'monospace', fontSize: 13 }}>@{user.username}</td>
                    <td><RoleBadge role={user.role} /></td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button className="btn btn-icon btn-outline" style={{ width: 30, height: 30 }}
                          title="Edit user" onClick={() => setModal(user)}>
                          <Edit2 size={13} />
                        </button>
                        <button className="btn btn-icon" title="Delete user"
                          style={{ width: 30, height: 30, background: '#fee2e2', color: '#ef4444', border: 'none' }}
                          onClick={() => handleDelete(user)}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <Shield size={15} style={{ color: '#F97316' }} />
          <h3 style={{ fontWeight: 600, fontSize: 14 }}>Role Permissions</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { role: 'CEO',      desc: 'Full access — manage users, all data, reports' },
            { role: 'ADMIN',    desc: 'Manage service jobs, customers, vehicles, appointments' },
            { role: 'MECHANIC', desc: 'View and update service jobs assigned to them' },
          ].map(({ role, desc }) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <RoleBadge role={role} />
              <span style={{ fontSize: 13, color: '#6b7280' }}>{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <UserModal
          user={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
