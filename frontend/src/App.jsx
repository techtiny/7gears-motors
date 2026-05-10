import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Menu, LayoutDashboard, Wrench, Users, Search, CalendarDays } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard    from './pages/Dashboard';
import Customers    from './pages/Customers';
import Vehicles     from './pages/Vehicles';
import Services     from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import TrackJob     from './pages/TrackJob';
import Campaigns    from './pages/Campaigns';
import Appointments from './pages/Appointments';
import Feedback     from './pages/Feedback';

const PAGE_TITLES = {
  '/':             'Dashboard',
  '/customers':    'Customers',
  '/vehicles':     'Vehicles',
  '/services':     'Service Jobs',
  '/appointments': 'Appointments',
  '/campaigns':    'Campaigns',
  '/feedback':     'Feedback',
  '/track':        'Track Vehicle',
};

const BOTTOM_NAV = [
  { to: '/',            icon: <LayoutDashboard size={22} />, label: 'Home',     end: true },
  { to: '/services',    icon: <Wrench size={22} />,          label: 'Jobs'              },
  { to: '/appointments',icon: <CalendarDays size={22} />,    label: 'Book'              },
  { to: '/customers',   icon: <Users size={22} />,           label: 'Customers'         },
  { to: '/track',       icon: <Search size={22} />,          label: 'Track'             },
];

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Service Detail';

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        {/* ── Topbar ── */}
        <div className="topbar" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="hamburger" onClick={() => setSidebarOpen(s => !s)} aria-label="Menu">
              <Menu size={21} color="#374151" />
            </button>
            <span className="topbar-title">{title}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>7GEARS MOTORS</div>
              <div style={{ fontSize: 10.5, color: '#9CA3AF' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--saffron) 0%, var(--gold) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0,
              boxShadow: 'var(--saffron-glow)',
            }}>7G</div>
          </div>
          <div className="topbar-accent" />
        </div>

        {/* ── Page content ── */}
        <Routes>
          <Route path="/"             element={<Dashboard />} />
          <Route path="/customers"    element={<Customers />} />
          <Route path="/vehicles"     element={<Vehicles />} />
          <Route path="/services"     element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetail />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/campaigns"    element={<Campaigns />} />
          <Route path="/feedback"     element={<Feedback />} />
          <Route path="/track"        element={<TrackJob />} />
        </Routes>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-nav-items">
          {BOTTOM_NAV.map(n => (
            <NavLink
              key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}
            >
              {n.icon}
              <span>{n.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: { fontSize: 13.5, borderRadius: 10, maxWidth: '90vw' },
        }}
      />
      <Layout />
    </BrowserRouter>
  );
}
