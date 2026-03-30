// src/components/Layout.jsx

import '../styles/common.css'

function Layout({ activePage, setActivePage, currentUser, onLogout, children }) {

  // Each nav item has a 'roles' array
  // Only show if current user's role is in that array
  const navItems = [
    {
      id:    'dashboard',
      label: 'Dashboard',
      icon:  '📊',
      roles: ['Admin', 'Admission Officer', 'Management'],
    },
    {
      id:    'masters',
      label: 'Master Setup',
      icon:  '🏫',
      roles: ['Admin'],                    // Admin only
    },
    {
      id:    'seatmatrix',
      label: 'Seat Matrix',
      icon:  '💺',
      roles: ['Admin'],                    // Admin only
    },
    {
      id:    'applicants',
      label: 'Applicants',
      icon:  '👤',
      roles: ['Admin', 'Admission Officer'],
    },
    {
      id:    'allocations',
      label: 'Allocations',
      icon:  '🎯',
      roles: ['Admin', 'Admission Officer'],
    },
    {
      id:    'admissions',
      label: 'Admissions',
      icon:  '📋',
      roles: ['Admin', 'Admission Officer', 'Management'],
    },
  ]

  // Filter nav items based on current user's role
  const visibleNav = navItems.filter(item =>
    item.roles.includes(currentUser?.role)
  )

  // Role badge color
  const roleBadgeColor = {
    'Admin':             { bg: '#ede9fe', text: '#5b21b6' },
    'Admission Officer': { bg: '#dbeafe', text: '#1e40af' },
    'Management':        { bg: '#dcfce7', text: '#166534' },
  }
  const badgeStyle = roleBadgeColor[currentUser?.role] || roleBadgeColor['Admin']

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{
        width: '230px',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}>

        {/* Logo */}
        <div style={{
          padding: '20px 16px',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{
            color: '#fff', fontWeight: 800, fontSize: 16
          }}>
            🎓 AdmitPro
          </div>
          <div style={{ color: '#475569', fontSize: 11, marginTop: 2 }}>
            Admission Management
          </div>
        </div>

        {/* Nav — only shows allowed pages */}
        <nav style={{ flex: 1, padding: '12px 8px' }}>
          {visibleNav.map(item => {
            const isActive = activePage === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '9px 12px',
                  marginBottom: '2px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '13px',
                  fontWeight: isActive ? 600 : 400,
                  background: isActive
                    ? 'rgba(99,102,241,0.15)'
                    : 'transparent',
                  color: isActive ? '#818cf8' : '#64748b',
                  fontFamily: 'inherit',
                }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #1e293b',
        }}>
          {/* User name */}
          <div style={{
            fontSize: 13, fontWeight: 600,
            color: '#e2e8f0', marginBottom: 4
          }}>
            {currentUser?.fullName}
          </div>

          {/* Role badge */}
          <div style={{
            display: 'inline-block',
            background: badgeStyle.bg,
            color: badgeStyle.text,
            fontSize: 11, fontWeight: 700,
            padding: '2px 8px', borderRadius: 999,
            marginBottom: 12,
          }}>
            {currentUser?.role}
          </div>

          {/* Logout button */}
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              padding: '8px',
              background: 'transparent',
              color: '#475569',
              border: '1px solid #1e293b',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🚪 Sign Out
          </button>
        </div>

      </aside>

      {/* ── MAIN ── */}
      <div style={{
        flex: 1, display: 'flex',
        flexDirection: 'column', overflow: 'hidden'
      }}>

        {/* Top bar */}
        <div style={{
          background: '#fff',
          borderBottom: '1px solid #f1f5f9',
          padding: '14px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h1 style={{
            fontSize: '18px', fontWeight: 700, color: '#0f172a'
          }}>
            {navItems.find(n => n.id === activePage)?.label}
          </h1>
          <span style={{
            background: badgeStyle.bg,
            color: badgeStyle.text,
            fontSize: 12, fontWeight: 600,
            padding: '4px 12px', borderRadius: 999,
          }}>
            {currentUser?.role}
          </span>
        </div>

        {/* Page content */}
        <main style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
          {children}
        </main>

      </div>
    </div>
  )
}

export default Layout