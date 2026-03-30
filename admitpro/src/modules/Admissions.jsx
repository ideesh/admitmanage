// src/modules/Admissions.jsx

import { useState } from 'react'
import '../styles/admissions.css'

function Admissions({ admissionData }) {
  const { allocations, applicants, programs } = admissionData

  const [search,      setSearch]      = useState('')
  const [quotaFilter, setQuotaFilter] = useState('All')

  // ── GET CONFIRMED ONLY ───────────────────────────
  // This module only shows confirmed admissions
  const confirmed = allocations.filter(a => a.status === 'Confirmed')

  // ── BUILD FULL RECORDS ───────────────────────────
  // Join allocation + applicant + program into one object
  const fullRecords = confirmed.map(alloc => {
    const applicant = applicants.find(a => a.id === alloc.applicantId)
    const program   = programs.find(p => p.id === alloc.programId)
    return {
      ...alloc,          // all allocation fields
      applicant,         // full applicant object
      program,           // full program object
    }
  })

  // ── SEARCH FILTER ────────────────────────────────
  const afterSearch = fullRecords.filter(r => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.applicant?.name?.toLowerCase().includes(q)     ||
      r.admissionNumber?.toLowerCase().includes(q)     ||
      r.applicant?.mobile?.includes(q)                 ||
      r.program?.name?.toLowerCase().includes(q)
    )
  })

  // ── QUOTA FILTER ─────────────────────────────────
  const afterFilter = afterSearch.filter(r => {
    if (quotaFilter === 'All') return true
    return r.quota === quotaFilter
  })

  // ── STATS ────────────────────────────────────────
  // Count per quota for the stat cards
  const stats = {
    total:      confirmed.length,
    kcet:       confirmed.filter(a => a.quota === 'KCET').length,
    comedk:     confirmed.filter(a => a.quota === 'COMEDK').length,
    management: confirmed.filter(a => a.quota === 'Management').length,
  }

  // ── EXPORT TO CSV ────────────────────────────────
  function handleExport() {
    // Build CSV header row
    const headers = [
      'Admission No', 'Name', 'Mobile', 'Category',
      'Program', 'Course Type', 'Quota',
      'Doc Status', 'Confirmed On'
    ].join(',')

    // Build one CSV row per record
    const rows = afterFilter.map(r => [
      r.admissionNumber,
      r.applicant?.name        || '',
      r.applicant?.mobile      || '',
      r.applicant?.category    || '',
      r.program?.name          || '',
      r.program?.courseType    || '',
      r.quota,
      r.applicant?.docStatus   || '',
      r.confirmedAt            || r.allocatedAt || '',
    ].join(','))

    // Combine header + rows
    const csv     = [headers, ...rows].join('\n')
    const blob    = new Blob([csv], { type: 'text/csv' })
    const url     = URL.createObjectURL(blob)

    // Trigger download
    const link    = document.createElement('a')
    link.href     = url
    link.download = 'admissions.csv'
    link.click()

    // Clean up
    URL.revokeObjectURL(url)
  }

  // ── RENDER ───────────────────────────────────────
  return (
    <div>

      {/* ── STAT CARDS ── */}
      <div className="admissions-stats">
        <StatCard
          label="Total Confirmed"
          value={stats.total}
          color="#6366f1"
        />
        <StatCard
          label="KCET"
          value={stats.kcet}
          color="#8b5cf6"
        />
        <StatCard
          label="COMEDK"
          value={stats.comedk}
          color="#0ea5e9"
        />
        <StatCard
          label="Management"
          value={stats.management}
          color="#10b981"
        />
      </div>

      {/* ── TOP BAR ── */}
      <div className="admissions-topbar">

        {/* Search */}
        <input
          className="admissions-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, admission no, mobile..."
        />

        {/* Quota filter tabs */}
        <div className="filter-tabs">
          {['All', 'KCET', 'COMEDK', 'Management'].map(q => (
            <button
              key={q}
              className={`filter-tab ${
                quotaFilter === q
                  ? 'filter-tab-active'
                  : 'filter-tab-inactive'
              }`}
              onClick={() => setQuotaFilter(q)}
            >
              {q}
            </button>
          ))}
        </div>

        {/* Export button */}
        <button className="btn-export" onClick={handleExport}>
          ⬇ Export CSV
        </button>

      </div>

      {/* ── TABLE ── */}
      <div className="admissions-table-panel">

        <div className="table-header">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            Confirmed Admissions
          </h3>
          <span className="count-pill">
            {afterFilter.length} records
          </span>
        </div>

        {/* Empty state */}
        {afterFilter.length === 0 && (
          <div className="empty-state">
            {confirmed.length === 0
              ? 'No confirmed admissions yet. Confirm allocations in the Allocations page.'
              : 'No records match your search or filter.'
            }
          </div>
        )}

        {/* Table */}
        {afterFilter.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                {[
                  'Admission No.',
                  'Student',
                  'Category',
                  'Program',
                  'Quota',
                  'Documents',
                  'Fee',
                  'Confirmed On',
                ].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {afterFilter.map(r => (
                <tr key={r.id}>

                  {/* Admission number */}
                  <td>
                    <span className="admission-number-cell">
                      {r.admissionNumber}
                    </span>
                  </td>

                  {/* Student name + mobile */}
                  <td>
                    <div className="admission-name">
                      {r.applicant?.name || '—'}
                    </div>
                    <div className="admission-sub">
                      {r.applicant?.mobile}
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="badge badge-gray">
                      {r.applicant?.category || '—'}
                    </span>
                  </td>

                  {/* Program + course type */}
                  <td>
                    <div className="program-name">
                      {r.program?.name || '—'}
                    </div>
                    <div className="program-type">
                      {r.program?.courseType} · {r.program?.code}
                    </div>
                  </td>

                  {/* Quota */}
                  <td>
                    <span className={`badge ${quotaBadgeClass(r.quota)}`}>
                      {r.quota}
                    </span>
                  </td>

                  {/* Doc status */}
                  <td>
                    <span className={`badge ${docStatusClass(r.applicant?.docStatus)}`}>
                      {r.applicant?.docStatus || 'Pending'}
                    </span>
                  </td>

                  {/* Fee — always Paid here */}
                  <td>
                    <span className="badge badge-green">
                      Paid
                    </span>
                  </td>

                  {/* Confirmed date */}
                  <td className="date-cell">
                    {r.confirmedAt || r.allocatedAt || '—'}
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        )}

      </div>
    </div>
  )
}

export default Admissions


// ── STAT CARD ─────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
    </div>
  )
}

// ── QUOTA BADGE CLASS ─────────────────────────────
function quotaBadgeClass(quota) {
  if (quota === 'KCET')       return 'badge-purple'
  if (quota === 'COMEDK')     return 'badge-blue'
  if (quota === 'Management') return 'badge-green'
  return 'badge-gray'
}

// ── DOC STATUS BADGE CLASS ────────────────────────
function docStatusClass(status) {
  if (status === 'Verified')  return 'badge-green'
  if (status === 'Submitted') return 'badge-yellow'
  return 'badge-red'
}