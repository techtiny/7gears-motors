import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobApi } from '../api';
import StatusBadge from '../components/StatusBadge';
import {
  Users, Car, Wrench, Clock, CheckCircle, AlertCircle,
  Package, TrendingUp, ChevronRight, ArrowUpRight,
  CalendarCheck, Gauge, Activity, Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';

const LOGO = 'https://7gearsmotors.in/wp-content/uploads/elementor/thumbs/WhatsApp-Image-2025-02-05-at-11.21.26_d1a9f6c9-e1739175114231-r1xog0w43cclc9sta3e279sa9ofvd722a8nef3t018.jpg';


function StatCard({ label, value, icon, color, bg, note }) {
  return (
    <div className="stat-card" style={{ '--hover-color': color }}>
      <div className="stat-icon" style={{ background: bg, color }}>
        {icon}
      </div>
      <div className="stat-info" style={{ flex: 1 }}>
        <h3 style={{ color }}>{value}</h3>
        <p>{label}</p>
        {note && <div style={{ fontSize: 10, color: '#9CA3AF', marginTop: 2 }}>{note}</div>}
      </div>
      <ArrowUpRight size={14} style={{ color: '#D1D5DB', flexShrink: 0 }} />
    </div>
  );
}


export default function Dashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    jobApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const activeTotal = (data?.received ?? 0) + (data?.inspecting ?? 0) + (data?.awaitingApproval ?? 0)
    + (data?.inProgress ?? 0) + (data?.qualityCheck ?? 0) + (data?.readyForPickup ?? 0);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── HERO BANNER (saffron gradient, white text) ── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--saffron-darker) 0%, var(--saffron) 50%, var(--gold) 100%)',
        borderRadius: 16, overflow: 'hidden', position: 'relative',
        boxShadow: '0 6px 24px rgba(249,115,22,0.28)',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 80, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          {/* Logo */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img src={LOGO} alt="7Gears"
              style={{ width: 60, height: 60, borderRadius: 13, objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}
              onError={e => e.target.style.display = 'none'} />
            <div style={{ position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: '50%', background: '#4ADE80', border: '2px solid white' }} />
          </div>

          {/* Company info */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: 'white', letterSpacing: '-0.4px' }}>7GEARS MOTORS</h1>
              <span style={{ fontSize: 9.5, background: 'rgba(255,255,255,0.2)', color: 'white', padding: '2px 7px', borderRadius: 20, fontWeight: 700, letterSpacing: '0.5px' }}>
                LIVE
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginBottom: 2 }}>
              Qualified Car Repair &amp; Wash · Chennai
            </p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{today}</p>
          </div>

          {/* Quick KPIs */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            {[
              { label: 'Total Jobs', val: data?.totalJobs ?? 0 },
              { label: 'Active',     val: activeTotal },
              { label: 'Ready',      val: data?.readyForPickup ?? 0 },
            ].map(k => (
              <div key={k.label} style={{
                background: 'rgba(255,255,255,0.18)',
                borderRadius: 10, padding: '10px 14px', textAlign: 'center', minWidth: 64,
                backdropFilter: 'blur(6px)',
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: 'white', lineHeight: 1 }}>{k.val}</div>
                <div style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.7)', marginTop: 3, fontWeight: 600 }}>{k.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN KPI STATS ──────────────────────────────── */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
        <StatCard label="Total Jobs"      value={data?.totalJobs ?? 0}       icon={<Wrench size={21}/>}       color="#F97316" bg="#FFF7ED" note="All time" />
        <StatCard label="Total Customers" value={data?.totalCustomers ?? 0}   icon={<Users size={21}/>}        color="#3B82F6" bg="#EFF6FF" note="Registered" />
        <StatCard label="Total Vehicles"  value={data?.totalVehicles ?? 0}    icon={<Car size={21}/>}          color="#8B5CF6" bg="#F5F3FF" note="In system" />
        <StatCard label="In Progress"     value={data?.inProgress ?? 0}       icon={<Activity size={21}/>}     color="#10B981" bg="#ECFDF5" note="Currently active" />
        <StatCard label="Ready for Pickup" value={data?.readyForPickup ?? 0}  icon={<CheckCircle size={21}/>}  color="#22C55E" bg="#F0FDF4" note="Awaiting collection" />
        <StatCard label="Awaiting Approval" value={data?.awaitingApproval ?? 0} icon={<AlertCircle size={21}/>} color="#F59E0B" bg="#FFFBEB" note="Needs action" />
        <StatCard label="Quality Check"   value={data?.qualityCheck ?? 0}     icon={<Shield size={21}/>}       color="#EC4899" bg="#FDF2F8" note="Final check" />
        <StatCard label="Delivered"       value={data?.delivered ?? 0}        icon={<Package size={21}/>}      color="#6B7280" bg="#F9FAFB" note="Completed" />
      </div>

{/* ── QUICK METRICS ROW ───────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        {[
          {
            label: 'Inspecting Now',
            value: data?.inspecting ?? 0,
            icon: <Gauge size={18} />, color: '#F59E0B',
            sub: 'Vehicles under technical review',
          },
          {
            label: 'Jobs Received',
            value: data?.received ?? 0,
            icon: <CalendarCheck size={18} />, color: '#3B82F6',
            sub: 'Waiting to start inspection',
          },
          {
            label: 'Cancelled',
            value: data?.cancelled ?? 0,
            icon: <AlertCircle size={18} />, color: '#EF4444',
            sub: 'Cancelled service orders',
          },
          {
            label: 'Completion Rate',
            value: data?.totalJobs > 0
              ? `${Math.round(((data?.delivered ?? 0) / data.totalJobs) * 100)}%`
              : '0%',
            icon: <TrendingUp size={18} />, color: '#22C55E',
            sub: 'Delivered vs total jobs',
          },
        ].map(m => (
          <div key={m.label} style={{
            background: 'white', borderRadius: 12, padding: '16px 18px',
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: `${m.color}14`, color: m.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {m.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: m.color, lineHeight: 1, letterSpacing: '-0.5px' }}>{m.value}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginTop: 2 }}>{m.label}</div>
              <div style={{ fontSize: 10.5, color: '#9CA3AF', marginTop: 1 }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── RECENT JOBS TABLE ───────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Table header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 22px', borderBottom: '1px solid var(--border)',
        }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Recent Service Jobs</h2>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 1 }}>Last 10 jobs · click any row to open</p>
          </div>
          <button
            className="btn btn-outline btn-sm"
            onClick={() => navigate('/services')}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            View All <ChevronRight size={13} />
          </button>
        </div>

        <div className="table-wrapper">
          {data?.recentJobs?.length ? (
            <table>
              <thead>
                <tr>
                  <th>Job #</th>
                  <th>Vehicle</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Photos</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {data.recentJobs.map(job => (
                  <tr key={job.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/services/${job.id}`)}>
                    <td>
                      <span style={{
                        fontWeight: 700, color: 'var(--saffron)',
                        fontFamily: 'monospace', fontSize: 13,
                      }}>
                        {job.jobNumber}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{job.vehicleRegistration}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{job.vehicleMake} {job.vehicleModel}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13.5 }}>{job.customerName}</div>
                      <div style={{ fontSize: 11.5, color: '#9CA3AF', marginTop: 1 }}>{job.customerPhone}</div>
                    </td>
                    <td style={{ fontSize: 13, color: '#4B5563' }}>{job.serviceType || <span style={{ color: '#D1D5DB' }}>—</span>}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {job.firstBeforeThumb && (
                          <img src={job.firstBeforeThumb} alt="B"
                            style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 5, border: '1.5px solid #FCA5A5' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        {job.firstAfterThumb && (
                          <img src={job.firstAfterThumb} alt="A"
                            style={{ width: 30, height: 30, objectFit: 'cover', borderRadius: 5, border: '1.5px solid #86EFAC' }}
                            onError={e => { e.target.style.display = 'none'; }} />
                        )}
                        {(job.beforeImageCount > 0 || job.afterImageCount > 0) ? (
                          <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                            {job.beforeImageCount}/{job.afterImageCount}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: '#E5E7EB' }}>—</span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#9CA3AF' }}>
                      {job.receivedAt
                        ? new Date(job.receivedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state">
              <Wrench />
              <h3>No service jobs yet</h3>
              <p>Create your first service job to get started</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
