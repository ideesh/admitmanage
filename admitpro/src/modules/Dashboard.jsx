// src/modules/Dashboard.jsx

import '../styles/dashboard.css'

function Dashboard({ dashboardData }) {

  // If no data passed yet — show empty state
  // This handles the case before App.jsx wires it up
  if (!dashboardData) {
    return (
      <div className="dash-empty">
        Dashboard data not available yet.
      </div>
    )
  }

  const {
    programs,
    seatMatrices,
    applicants,
    allocations,
    getSeatsAvailable,
  } = dashboardData

  // ── STAT CALCULATIONS ────────────────────────────

  // Total seats across all programs
  const totalIntake = seatMatrices.reduce(
    (sum, m) => sum + m.total, 0
  )

  // All active allocations (not cancelled)
  const activeAllocations = allocations.filter(
    a => a.status !== 'Cancelled'
  )

  // Confirmed admissions only
  const confirmed = allocations.filter(
    a => a.status === 'Confirmed'
  )

  // Fee pending = allocated but not yet confirmed
  const feePending = allocations.filter(
    a => a.status === 'Allocated' &&
         a.feeStatus === 'Pending'
  )

  // Docs pending applicants
  const docsPending = applicants.filter(
    a => a.docStatus === 'Pending'
  )

  // ── PROGRAM PROGRESS DATA ────────────────────────
  // For each program calculate admitted vs total
  const programProgress = programs.map(prog => {
    const matrix = seatMatrices.find(
      m => m.programId === prog.id
    )
    const admitted = activeAllocations.filter(
      a => a.programId === prog.id
    ).length
    const total = matrix?.total || 0

    return {
      name:     prog.name,
      code:     prog.code,
      admitted,
      total,
      remaining: total - admitted,
      percent:   total > 0
        ? Math.round((admitted / total) * 100)
        : 0,
    }
  }).filter(p => p.total > 0)  // only show programs with matrix

  // ── QUOTA BREAKDOWN DATA ─────────────────────────
  const quotas = ['KCET', 'COMEDK', 'Management']

  const quotaData = quotas.map(quota => {
    // Total seats across ALL programs for this quota
    const totalSeats = seatMatrices.reduce(
      (sum, m) => sum + (m[`quota_${quota}`] || 0), 0
    )

    // Total filled across ALL programs for this quota
    const filled = activeAllocations.filter(
      a => a.quota === quota
    ).length

    const percent = totalSeats > 0
      ? Math.round((filled / totalSeats) * 100)
      : 0

    return { quota, totalSeats, filled, percent }
  }).filter(q => q.totalSeats > 0)  // only show configured quotas

  // ── RENDER ───────────────────────────────────────
  return (
    <div>

      {/* ── STAT CARDS ── */}
      <div className="dashboard-stats">

        <StatCard
          icon="🪑"
          label="Total Intake"
          value={totalIntake}
          sub="Configured seats"
          iconBg="#ede9fe"
        />
        <StatCard
          icon="✅"
          label="Allocated"
          value={activeAllocations.length}
          sub="Active allocations"
          iconBg="#dbeafe"
        />
        <StatCard
          icon="🎓"
          label="Confirmed"
          value={confirmed.length}
          sub="Fee paid"
          iconBg="#dcfce7"
        />
        <StatCard
          icon="💰"
          label="Fee Pending"
          value={feePending.length}
          sub="Awaiting payment"
          iconBg="#fef3c7"
        />
        <StatCard
          icon="📄"
          label="Docs Pending"
          value={docsPending.length}
          sub="Need verification"
          iconBg="#fee2e2"
        />

      </div>

      {/* ── MAIN GRID ── */}
      <div className="dashboard-grid">

        {/* ── PANEL 1: Program-wise Progress ── */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">
              Program-wise Seat Status
            </span>
            <span className="count-pill">
              {programProgress.length} programs
            </span>
          </div>
          <div className="dash-panel-body">
            {programProgress.length === 0 && (
              <div className="dash-empty">
                No programs configured yet.
              </div>
            )}
            {programProgress.map(p => (
              <ProgramProgressRow key={p.code} program={p} />
            ))}
          </div>
        </div>

        {/* ── PANEL 2: Quota-wise Breakdown ── */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">
              Quota-wise Breakdown
            </span>
          </div>
          <div className="dash-panel-body">
            {quotaData.length === 0 && (
              <div className="dash-empty">
                No seat matrix configured yet.
              </div>
            )}
            {quotaData.map(q => (
              <QuotaRow key={q.quota} data={q} />
            ))}
          </div>
        </div>

        {/* ── PANEL 3: Fee Pending List ── */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">
              Fee Pending
            </span>
            <span className="count-pill">
              {feePending.length}
            </span>
          </div>
          <div className="dash-panel-body">
            {feePending.length === 0 && (
              <div className="all-clear">
                🎉 All fees collected
              </div>
            )}
            {feePending.slice(0, 6).map(alloc => {
              const app  = applicants.find(
                a => a.id === alloc.applicantId
              )
              const prog = programs.find(
                p => p.id === alloc.programId
              )
              return (
                <div className="pending-row" key={alloc.id}>
                  <div>
                    <div className="pending-name">
                      {app?.name || '—'}
                    </div>
                    <div className="pending-sub">
                      {prog?.name} · {alloc.quota}
                    </div>
                  </div>
                  <span className="badge badge-yellow">
                    Fee Pending
                  </span>
                </div>
              )
            })}
            {feePending.length > 6 && (
              <p style={{
                fontSize: 12, color: '#94a3b8',
                textAlign: 'center', marginTop: 12
              }}>
                +{feePending.length - 6} more
              </p>
            )}
          </div>
        </div>

        {/* ── PANEL 4: Docs Pending List ── */}
        <div className="dash-panel">
          <div className="dash-panel-header">
            <span className="dash-panel-title">
              Documents Pending
            </span>
            <span className="count-pill">
              {docsPending.length}
            </span>
          </div>
          <div className="dash-panel-body">
            {docsPending.length === 0 && (
              <div className="all-clear">
                🎉 All documents verified
              </div>
            )}
            {docsPending.slice(0, 6).map(app => (
              <div className="pending-row" key={app.id}>
                <div>
                  <div className="pending-name">{app.name}</div>
                  <div className="pending-sub">
                    {app.quota} · {app.category}
                  </div>
                </div>
                <span className="badge badge-red">
                  Docs Pending
                </span>
              </div>
            ))}
            {docsPending.length > 6 && (
              <p style={{
                fontSize: 12, color: '#94a3b8',
                textAlign: 'center', marginTop: 12
              }}>
                +{docsPending.length - 6} more
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Dashboard


// ── STAT CARD ─────────────────────────────────────
function StatCard({ icon, label, value, sub, iconBg }) {
  return (
    <div className="dash-stat-card">
      <div
        className="dash-stat-icon"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <div>
        <div className="dash-stat-value">{value}</div>
        <div className="dash-stat-label">{label}</div>
        {sub && <div className="dash-stat-sub">{sub}</div>}
      </div>
    </div>
  )
}

// ── PROGRAM PROGRESS ROW ──────────────────────────
function ProgramProgressRow({ program }) {
  // Color changes based on how full the program is
  const fillColor =
    program.percent >= 90 ? '#ef4444' :   // red — almost full
    program.percent >= 70 ? '#f59e0b' :   // yellow — filling up
    '#6366f1'                             // purple — normal

  return (
    <div className="progress-row">
      <div className="progress-label-row">
        <span className="progress-name">
          {program.name}
          <span style={{
            fontSize: 11, color: '#94a3b8', marginLeft: 6
          }}>
            ({program.code})
          </span>
        </span>
        <span className="progress-remaining">
          {program.remaining} remaining
        </span>
      </div>

      {/* Progress bar track */}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width:      `${program.percent}%`,
            background: fillColor,
          }}
        />
      </div>

      <div className="progress-numbers">
        {program.admitted} / {program.total} seats filled
        ({program.percent}%)
      </div>
    </div>
  )
}

// ── QUOTA ROW ─────────────────────────────────────
function QuotaRow({ data }) {
  const colors = {
    KCET:       '#6366f1',
    COMEDK:     '#0ea5e9',
    Management: '#10b981',
  }
  const color = colors[data.quota] || '#6366f1'

  const fillColor =
    data.percent >= 90 ? '#ef4444' :
    data.percent >= 70 ? '#f59e0b' :
    color

  return (
    <div className="quota-row">
      <div className="quota-label-row">
        <span className="quota-name">{data.quota}</span>
        <span className="quota-count">
          {data.filled} / {data.totalSeats} filled
        </span>
      </div>

      {/* Progress bar */}
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width:      `${data.percent}%`,
            background: fillColor,
          }}
        />
      </div>

      <div className="progress-numbers">
        {data.totalSeats - data.filled} seats remaining
        ({data.percent}%)
      </div>
    </div>
  )
}
