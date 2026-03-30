// src/modules/Allocations.jsx

import { useState } from 'react'
import { uid, today } from '../utils'
import { supabase } from '../supabase'
import '../styles/allocations.css'
import '../styles/common.css'

function Allocations({ allocationData }) {
  const {
    allocations,    setAllocations,
    applicants,
    programs,
    seatMatrices,
    getSeatsAvailable,
    generateAdmissionNumber,
  } = allocationData

  // ── FORM STATE ───────────────────────────────────
  const [form, setForm] = useState({
    applicantId: '',
    programId:   '',
    quota:       '',
    feeStatus:   'Pending',
  })

  const [availability, setAvailability] = useState(null)
  // null    = not checked yet
  // number  = seats available (0 means full)

  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  // ── APPLICANTS NOT YET ALLOCATED ─────────────────
  // Only show applicants who don't have an active allocation
  const unallocated = applicants.filter(a => {
    const hasActive = allocations.find(al =>
      al.applicantId === a.id &&
      al.status !== 'Cancelled'
    )
    return !hasActive  // only include if no active allocation
  })

  // ── SELECTED APPLICANT DETAILS ───────────────────
  const selectedApplicant = applicants.find(a => a.id === form.applicantId)

  // ── STEP 1: CHECK AVAILABILITY ───────────────────
  function handleCheck() {
    setError('')
    setSuccess('')
    setAvailability(null)

    // Validation
    if (!form.applicantId) return setError('Please select an applicant')
    if (!form.programId)   return setError('Please select a program')
    if (!form.quota)       return setError('Please select a quota')

    // Ask App.jsx helper how many seats are left
    const seats = getSeatsAvailable(form.programId, form.quota)
    setAvailability(seats)

    if (seats <= 0) {
      setError(`No seats available in ${form.quota} quota for this program.`)
    }
  }

  // ── STEP 2: ALLOCATE SEAT ────────────────────────
 async function handleAllocate() {
  setError('')
  setSuccess('')

  // Must check first
  if (availability === null) {
    return setError('Please check availability first')
  }
  if (availability <= 0) {
    return setError(`Cannot allocate. ${form.quota} quota is full.`)
  }

  // Check live again — safety net
  const seatsNow = getSeatsAvailable(form.programId, form.quota)
  if (seatsNow <= 0) {
    return setError('Quota just became full. Please re-check.')
  }

  // Generate admission number only if fee already paid
  const admNo = form.feeStatus === 'Paid'
    ? generateAdmissionNumber(form.programId, form.quota)
    : null

  // Build record — camelCase for local state
  const newAllocation = {
    id:              uid(),
    applicantId:     form.applicantId,
    programId:       form.programId,
    quota:           form.quota,
    feeStatus:       form.feeStatus,
    status:          form.feeStatus === 'Paid' ? 'Confirmed' : 'Allocated',
    admissionNumber: admNo,
    allocatedAt:     today(),
  }

  // Save to Supabase — snake_case
  const { error } = await supabase
    .from('allocations')
    .insert({
      id:               newAllocation.id,
      applicant_id:     newAllocation.applicantId,
      program_id:       newAllocation.programId,
      quota:            newAllocation.quota,
      fee_status:       newAllocation.feeStatus,
      status:           newAllocation.status,
      admission_number: newAllocation.admissionNumber,
      allocated_at:     newAllocation.allocatedAt,
    })

  if (error) {
    return setError('Failed to save: ' + error.message)
  }

  // Update local state
  setAllocations([...allocations, newAllocation])

  setSuccess(
    form.feeStatus === 'Paid'
      ? `Seat confirmed! Admission No: ${admNo}`
      : 'Seat allocated. Mark fee as Paid to confirm.'
  )

  // Reset form
  setForm({
    applicantId: '', programId: '',
    quota: '', feeStatus: 'Pending'
  })
  setAvailability(null)
}

  // ── MARK FEE PAID + CONFIRM ──────────────────────
 async function handleConfirm(id) {
  const alloc = allocations.find(a => a.id === id)
  if (!alloc) return

  // Generate admission number now
  const admNo = generateAdmissionNumber(alloc.programId, alloc.quota)
  const confirmedDate = today()

  // Update in Supabase
  const { error } = await supabase
    .from('allocations')
    .update({
      fee_status:       'Paid',
      status:           'Confirmed',
      admission_number: admNo,
      confirmed_at:     confirmedDate,
    })
    .eq('id', id)

  if (error) {
    alert('Failed to confirm: ' + error.message)
    return
  }

  // Update local state
  setAllocations(allocations.map(a =>
    a.id === id
      ? {
          ...a,
          feeStatus:       'Paid',
          status:          'Confirmed',
          admissionNumber: admNo,
          confirmedAt:     confirmedDate,
        }
      : a
  ))
}

  // ── CANCEL ALLOCATION ────────────────────────────
  async function handleCancel(id) {
  const { error } = await supabase
    .from('allocations')
    .update({ status: 'Cancelled' })
    .eq('id', id)

  if (error) {
    alert('Failed to cancel: ' + error.message)
    return
  }

  // Update local state
  setAllocations(allocations.map(a =>
    a.id === id ? { ...a, status: 'Cancelled' } : a
  ))
}
  // ── RENDER ───────────────────────────────────────
  return (
    <div className="allocations-layout">

      {/* ════ LEFT: ALLOCATION FORM ════ */}
      <div className="allocation-form-panel">

        <h3 className="allocation-form-title">Allocate Seat</h3>
        <p className="allocation-form-subtitle">
          Check availability before allocating
        </p>

        {/* Messages */}
        {error   && <div className="alert-error">⚠️ {error}</div>}
        {success && <div className="alert-success">✅ {success}</div>}

        {/* Applicant dropdown */}
        <Field label="Select Applicant" required>
          <select
            className="select"
            value={form.applicantId}
            onChange={e => {
              const app = applicants.find(a => a.id === e.target.value)
              setForm({
                ...form,
                applicantId: e.target.value,
                // Auto-fill program and quota from applicant record
                programId:   app?.programId || '',
                quota:       app?.quota     || '',
              })
              // Reset availability when applicant changes
              setAvailability(null)
              setError('')
            }}
          >
            <option value="">Select applicant</option>
            {unallocated.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} — {a.appNo}
              </option>
            ))}
          </select>
          {unallocated.length === 0 && (
            <p className="field-hint">
              No unallocated applicants. Add applicants first.
            </p>
          )}
        </Field>

        {/* Show selected applicant details */}
        {selectedApplicant && (
          <div className="applicant-info-card">
            <div className="applicant-info-name">
              {selectedApplicant.name}
            </div>
            <div className="applicant-info-detail">
              {selectedApplicant.quota} ·
              {selectedApplicant.admissionMode} ·
              Category: {selectedApplicant.category}
              {selectedApplicant.allotmentNo &&
                ` · Allotment: ${selectedApplicant.allotmentNo}`
              }
            </div>
          </div>
        )}

        {/* Program dropdown */}
        <Field label="Program" required>
          <select
            className="select"
            value={form.programId}
            onChange={e => {
              setForm({ ...form, programId: e.target.value })
              setAvailability(null)
            }}
          >
            <option value="">Select program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </Field>

        {/* Quota dropdown */}
        <Field label="Quota" required>
          <select
            className="select"
            value={form.quota}
            onChange={e => {
              setForm({ ...form, quota: e.target.value })
              setAvailability(null)
            }}
          >
            <option value="">Select quota</option>
            <option>KCET</option>
            <option>COMEDK</option>
            <option>Management</option>
          </select>
        </Field>

        {/* Fee status */}
        <Field label="Fee Status">
          <select
            className="select"
            value={form.feeStatus}
            onChange={e => setForm({ ...form, feeStatus: e.target.value })}
          >
            <option>Pending</option>
            <option>Paid</option>
          </select>
        </Field>

        {/* Availability result box */}
        {availability !== null && availability > 0 && (
          <div className="availability-box">
            <div className="availability-title">
              ✓ Seats Available
            </div>
            <div className="availability-grid">
              <div className="availability-item">
                <span>Quota: </span>
                {form.quota}
              </div>
              <div className="availability-item">
                <span>Available: </span>
                <strong style={{ color: '#10b981', fontSize: 14 }}>
                  {availability}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* No seats box */}
        {availability === 0 && (
          <div className="no-seats-box">
            🚫 {form.quota} quota is full for this program.
            No seats can be allocated.
          </div>
        )}

        {/* Check + Allocate buttons */}
        <div className="allocation-btn-row">
          <button className="btn-check" onClick={handleCheck}>
            Check Seats
          </button>
          <button
            className="btn-allocate"
            onClick={handleAllocate}
            disabled={!availability || availability <= 0}
          >
            Allocate
          </button>
        </div>

      </div>

      {/* ════ RIGHT: ALLOCATIONS TABLE ════ */}
      <div className="allocations-table-panel">

        <div className="table-header">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            All Allocations
          </h3>
          <span className="count-pill">
            {allocations.filter(a => a.status !== 'Cancelled').length} active
          </span>
        </div>

        {allocations.length === 0 && (
          <div className="empty-state">
            No allocations yet.
          </div>
        )}

        {allocations.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                {['Applicant','Program','Quota',
                  'Fee','Status','Admission No.','Actions'
                ].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {allocations.map(alloc => {
                const app  = applicants.find(a => a.id === alloc.applicantId)
                const prog = programs.find(p => p.id === alloc.programId)

                return (
                  <tr
                    key={alloc.id}
                    className={alloc.status === 'Cancelled' ? 'row-cancelled' : ''}
                  >
                    {/* Applicant */}
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>
                        {app?.name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>
                        {app?.mobile}
                      </div>
                    </td>

                    {/* Program */}
                    <td>{prog?.name || '—'}</td>

                    {/* Quota */}
                    <td>
                      <span className={`badge ${quotaBadgeClass(alloc.quota)}`}>
                        {alloc.quota}
                      </span>
                    </td>

                    {/* Fee status */}
                    <td>
                      <span className={`badge ${
                        alloc.feeStatus === 'Paid'
                          ? 'badge-green'
                          : 'badge-yellow'
                      }`}>
                        {alloc.feeStatus}
                      </span>
                    </td>

                    {/* Allocation status */}
                    <td>
                      <span className={`badge ${statusClass(alloc.status)}`}>
                        {alloc.status}
                      </span>
                    </td>

                    {/* Admission number */}
                    <td>
                      {alloc.admissionNumber
                        ? <span className="admission-number">
                            {alloc.admissionNumber}
                          </span>
                        : <span style={{ color: '#94a3b8', fontSize: 12 }}>
                            Pending
                          </span>
                      }
                    </td>

                    {/* Actions */}
                    <td>
                      {/* Show confirm button only if allocated + fee pending */}
                      {alloc.status === 'Allocated' && (
                        <button
                          className="btn-confirm"
                          onClick={() => handleConfirm(alloc.id)}
                        >
                          Mark Paid & Confirm
                        </button>
                      )}

                      {/* Show cancel only if not already cancelled */}
                      {alloc.status !== 'Cancelled' &&
                       alloc.status !== 'Confirmed' && (
                        <button
                          className="btn-cancel-alloc"
                          onClick={() => handleCancel(alloc.id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>

                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

      </div>
    </div>
  )
}

export default Allocations

// ── FIELD WRAPPER ─────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div className="field-wrapper">
      <label className="field-label">
        {label}
        {required && <span className="field-required">*</span>}
      </label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
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

// ── STATUS BADGE CLASS ────────────────────────────
function statusClass(status) {
  if (status === 'Confirmed')  return 'status-confirmed'
  if (status === 'Allocated')  return 'status-allocated'
  if (status === 'Cancelled')  return 'status-cancelled'
  return 'badge-gray'
}