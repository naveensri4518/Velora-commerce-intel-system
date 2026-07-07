import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard, Package, Warehouse, Users, FileText,
  BarChart3, Settings, ClipboardList, ScanBarcode, LogOut, ShieldCheck,
  Search, Undo2, CalendarDays
} from 'lucide-react'

const adminNav = [
  { label: 'Overview', items: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/billing', icon: ScanBarcode, label: 'POS Billing' },
  ]},
  { label: 'Inventory', items: [
    { to: '/products', icon: Package, label: 'Products' },
    { to: '/inventory', icon: Warehouse, label: 'Inventory' },
  ]},
  { label: 'Sales', items: [
    { to: '/invoices', icon: FileText, label: 'Invoice History' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
  ]},
  { label: 'Management', items: [
    { to: '/staff', icon: Users, label: 'Staff' },
    { to: '/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]},
]

const staffNav = [
  { label: 'POS Terminal', items: [
    { to: '/billing', icon: ScanBarcode, label: 'Billing' },
    { to: '/price-check', icon: Search, label: 'Price Check' },
    { to: '/returns', icon: Undo2, label: 'Returns' },
  ]},
  { label: 'Management', items: [
    { to: '/shift-summary', icon: CalendarDays, label: 'Shift Summary' },
  ]}
]

export default function Sidebar() {
  const { user, logout, isAdmin } = useAuth()
  const navGroups = isAdmin() ? adminNav : staffNav

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <ScanBarcode size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em', color: 'var(--color-text-primary)' }}>
            SmartBarcode
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
            {isAdmin() ? 'Admin Portal' : 'Staff Portal'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navGroups.map(group => (
          <div key={group.label}>
            <div className="nav-section-label">{group.label}</div>
            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <item.icon size={17} />
                {item.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 12px',
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 8
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--color-accent-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--color-accent)'
          }}>
            {user?.fullName?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', truncate: true }}>
              {user?.fullName}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
              {user?.role === 'ROLE_ADMIN' ? 'Administrator' : 'Staff'}
            </div>
          </div>
        </div>
        <button className="nav-item" onClick={logout} style={{ width: '100%', color: 'var(--color-danger)' }}>
          <LogOut size={17} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
