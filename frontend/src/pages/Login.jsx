import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL ?? '/api';

const ROLE_LABEL = { CEO: 'CEO', ADMIN: 'Administrator', MECHANIC: 'Mechanic' };
const ROLE_COLOR = { CEO: '#F97316', ADMIN: '#3B82F6', MECHANIC: '#10B981' };

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/auth/login`, { username: username.trim(), password });
      const { token, role, displayName } = res.data;
      localStorage.setItem('token',       token);
      localStorage.setItem('role',        role);
      localStorage.setItem('displayName', displayName);
      localStorage.setItem('username',    username.trim());
      toast.success(`Welcome, ${displayName}!`);
      navigate('/');
    } catch {
      toast.error('Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a0a00 0%, #7C2D12 40%, #C2410C 100%)',
      padding: 20,
    }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)',
        pointerEvents: 'none' }} />

      <div style={{
        background: 'white', borderRadius: 24, padding: '44px 40px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
        position: 'relative', zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="7GEARS MOTORS"
            style={{ width: 90, height: 90, objectFit: 'contain', borderRadius: 16,
              marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(249,115,22,0.3))' }}
            onError={e => e.target.style.display = 'none'} />
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#111827', letterSpacing: '-0.5px' }}>
            7GEARS MOTORS
          </h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4 }}>Service Tracker — Sign In</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Username
            </label>
            <input
              className="form-control"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              style={{ fontSize: 15 }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <input
              className="form-control"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              style={{ fontSize: 15 }}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username.trim() || !password.trim()}
            style={{
              marginTop: 8, padding: '13px 0', borderRadius: 12, border: 'none',
              background: loading ? '#FED7AA' : 'linear-gradient(135deg, #C2410C 0%, #F97316 100%)',
              color: 'white', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Role hints */}
        <div style={{ marginTop: 28, borderTop: '1px solid #F3F4F6', paddingTop: 20 }}>
          <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginBottom: 12, fontWeight: 600, letterSpacing: '0.5px' }}>
            ACCESS LEVELS
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {Object.entries(ROLE_LABEL).map(([role, label]) => (
              <div key={role} style={{
                fontSize: 11, fontWeight: 700, color: ROLE_COLOR[role],
                background: `${ROLE_COLOR[role]}15`, borderRadius: 20,
                padding: '4px 10px', border: `1px solid ${ROLE_COLOR[role]}30`,
              }}>
                {label}
              </div>
            ))}
          </div>
        </div>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#D1D5DB', marginTop: 20 }}>
          v2.0 · © 2025 7GEARS MOTORS
        </p>
      </div>
    </div>
  );
}
