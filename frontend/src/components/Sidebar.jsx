import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Car, Wrench, Search, Phone, Megaphone, CalendarDays, Star, MapPin } from 'lucide-react';

const LOGO = '/logo.png';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { to: '/', icon: <LayoutDashboard size={17} />, label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Workshop',
    items: [
      { to: '/services',    icon: <Wrench size={17} />,      label: 'Service Jobs' },
      { to: '/appointments',icon: <CalendarDays size={17} />, label: 'Appointments' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { to: '/customers', icon: <Users size={17} />, label: 'Customers' },
      { to: '/vehicles',  icon: <Car size={17} />,   label: 'Vehicles' },
      { to: '/feedback',  icon: <Star size={17} />,  label: 'Feedback' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { to: '/campaigns', icon: <Megaphone size={17} />, label: 'Campaigns', badge: 'NEW' },
    ],
  },
  {
    label: 'Tools',
    items: [
      { to: '/track', icon: <Search size={17} />, label: 'Track Vehicle' },
    ],
  },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>

        {/* Logo */}
        <div className="sidebar-logo">
          <img src={LOGO} alt="7Gears" style={{ borderRadius: 10, objectFit: 'contain', background: '#C0392B' }} onError={e => { e.target.style.display = 'none'; }} />
          <div className="sidebar-logo-text">
            <h2>7GEARS MOTORS</h2>
            <span>Service Tracker</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="sidebar-section">{section.label}</div>
              {section.items.map(n => (
                <NavLink
                  key={n.to} to={n.to} end={n.end}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                >
                  {n.icon}
                  <span style={{ flex: 1 }}>{n.label}</span>
                  {n.badge && (
                    <span style={{
                      fontSize: 9, background: 'var(--saffron)', color: 'white',
                      padding: '2px 6px', borderRadius: 5, fontWeight: 700, letterSpacing: '0.5px',
                    }}>
                      {n.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
            <Phone size={11} style={{ color: 'var(--saffron)', flexShrink: 0 }} />
            <span>+91 78260 47847</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <MapPin size={11} style={{ color: 'var(--saffron)', flexShrink: 0 }} />
            <span>Chennai, Tamil Nadu</span>
          </div>
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--border-warm)', fontSize: 10, color: '#C4B5A0' }}>
            v2.0 · © 2025 7GEARS MOTORS
          </div>
        </div>
      </aside>
    </>
  );
}
