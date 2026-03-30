// src/modules/SeatMatrix.jsx

import { useState } from 'react'
import { uid } from '../utils'
import '../styles/common.css'
import { supabase } from '../supabase'

function SeatMatrix({ seatMatrixData }) {

  // Pull out what we need from props
  const {
    seatMatrices,
    setSeatMatrices,
    programs        // to populate the dropdown
  } = seatMatrixData

  // ── FORM STATE ───────────────────────────────────
  // All fields in one object
  const [form, setForm] = useState({
    programId:        '',
    total:            '',
    quota_KCET:       '',
    quota_COMEDK:     '',
    quota_Management: '',
    supernumerary:    '',
  })

  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')

  // ── LIVE CALCULATIONS ────────────────────────────
  // These run on every keystroke automatically
  // parseInt converts "30" string to 30 number
  // || 0 means "use 0 if empty or NaN"

  const kcet   = parseInt(form.quota_KCET)       || 0
  const comedk = parseInt(form.quota_COMEDK)     || 0
  const mgmt   = parseInt(form.quota_Management) || 0
  const total  = parseInt(form.total)            || 0

  // Sum of all quotas
  const quotaSum = kcet + comedk + mgmt

  // The key rule: quota sum must equal total
  const isMatching = total > 0 && quotaSum === total

  // ── SAVE ─────────────────────────────────────────
 async function handleSave() {
  setError('')
  setSuccess('')

  // Validations — same as before
  if (!form.programId) {
    return setError('Please select a program')
  }
  if (!form.total || total <= 0) {
    return setError('Total intake must be greater than 0')
  }
  if (!isMatching) {
    return setError(
      `Quota sum (${quotaSum}) must equal total intake (${total}). ` +
      `Adjust by ${Math.abs(total - quotaSum)} seats.`
    )
  }

  const exists = seatMatrices.find(m => m.programId === form.programId)
  if (exists) {
    return setError('Matrix already exists for this program. Delete it first.')
  }

  // Build the record — camelCase for local state
  const newMatrix = {
    id:               uid(),
    programId:        form.programId,
    total:            total,
    quota_KCET:       kcet,
    quota_COMEDK:     comedk,
    quota_Management: mgmt,
    supernumerary:    parseInt(form.supernumerary) || 0,
  }

  // Save to Supabase — snake_case for database
  const { error } = await supabase
    .from('seat_matrices')
    .insert({
      id:               newMatrix.id,
      program_id:       newMatrix.programId,
      total:            newMatrix.total,
      quota_kcet:       newMatrix.quota_KCET,
      quota_comedk:     newMatrix.quota_COMEDK,
      quota_management: newMatrix.quota_Management,
      supernumerary:    newMatrix.supernumerary,
    })

  if (error) {
    return setError('Failed to save: ' + error.message)
  }

  // Update local state so UI refreshes immediately
  setSeatMatrices([...seatMatrices, newMatrix])
  setSuccess('Seat matrix saved successfully!')

  // Reset form
  setForm({
    programId: '', total: '',
    quota_KCET: '', quota_COMEDK: '',
    quota_Management: '', supernumerary: ''
  })
}

  // ── DELETE ───────────────────────────────────────
  async function handleDelete(id) {
  const { error } = await supabase
    .from('seat_matrices')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Failed to delete: ' + error.message)
    return
  }

  // Remove from local state
  setSeatMatrices(seatMatrices.filter(m => m.id !== id))
  setSuccess('')
  setError('')
}

  // ── RENDER ───────────────────────────────────────
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20 }}>

      {/* ════ LEFT: FORM ════ */}
      <div style={{
        background: '#fff', borderRadius: 12,
        padding: 20, border: '1px solid #f1f5f9',
        height: 'fit-content'
      }}>

        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: '#0f172a' }}>
          Configure Seat Matrix
        </h3>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 16 }}>
          Quota total must equal total intake
        </p>

        {/* Error box */}
        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b',
            padding: '10px 12px', borderRadius: 8,
            fontSize: 12, marginBottom: 14, lineHeight: 1.6
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Success box */}
        {success && (
          <div style={{
            background: '#dcfce7', color: '#166534',
            padding: '10px 12px', borderRadius: 8,
            fontSize: 12, marginBottom: 14
          }}>
            ✅ {success}
          </div>
        )}

        {/* Program dropdown */}
        <Field label="Program" required>
          <select
            value={form.programId}
            onChange={e => setForm({ ...form, programId: e.target.value })}
            style={selectStyle}
          >
            <option value="">Select a program</option>
            {programs.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>

          {/* Warning if no programs exist yet */}
          {programs.length === 0 && (
            <p style={{ fontSize: 11, color: '#f59e0b', marginTop: 4 }}>
              ⚠️ No programs yet. Go to Master Setup → Programs first.
            </p>
          )}
        </Field>

        {/* Total intake */}
        <Field label="Total Intake" required>
          <input
            type="number"
            value={form.total}
            onChange={e => setForm({ ...form, total: e.target.value })}
            placeholder="e.g. 60"
            min="1"
            style={inputStyle}
          />
        </Field>

        {/* Quota box */}
        <div style={{
          background: '#f8fafc', borderRadius: 8,
          padding: 14, marginBottom: 14
        }}>
          <p style={{
            fontSize: 11, fontWeight: 700,
            color: '#64748b', textTransform: 'uppercase',
            marginBottom: 12
          }}>
            Quota Breakdown
          </p>

          <Field label="KCET Seats">
            <input
              type="number"
              value={form.quota_KCET}
              onChange={e => setForm({ ...form, quota_KCET: e.target.value })}
              placeholder="0"
              min="0"
              style={inputStyle}
            />
          </Field>

          <Field label="COMEDK Seats">
            <input
              type="number"
              value={form.quota_COMEDK}
              onChange={e => setForm({ ...form, quota_COMEDK: e.target.value })}
              placeholder="0"
              min="0"
              style={inputStyle}
            />
          </Field>

          <Field label="Management Seats">
            <input
              type="number"
              value={form.quota_Management}
              onChange={e => setForm({ ...form, quota_Management: e.target.value })}
              placeholder="0"
              min="0"
              style={inputStyle}
            />
          </Field>

          {/* ── LIVE TOTAL INDICATOR ── */}
          {/* This updates as user types — no button needed */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0 0',
            borderTop: '1px dashed #e2e8f0',
            marginTop: 8
          }}>
            <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>
              Quota Total:
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* The number — green if matches, red if not */}
              <span style={{
                fontSize: 18,
                fontWeight: 800,
                color: isMatching
                  ? '#10b981'           // green = matches
                  : quotaSum > 0
                    ? '#ef4444'         // red = doesn't match
                    : '#94a3b8'         // grey = nothing typed yet
              }}>
                {quotaSum}
              </span>

              {/* Match / mismatch label */}
              {form.total && quotaSum > 0 && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: isMatching ? '#10b981' : '#ef4444'
                }}>
                  {isMatching ? '✓ Matches' : `Need ${total}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Supernumerary — optional */}
        <Field
          label="Supernumerary Seats"
          hint="Optional. These seats are counted separately."
        >
          <input
            type="number"
            value={form.supernumerary}
            onChange={e => setForm({ ...form, supernumerary: e.target.value })}
            placeholder="0"
            min="0"
            style={inputStyle}
          />
        </Field>

        {/* Save button */}
        <button
          onClick={handleSave}
          style={{
            width: '100%',
            padding: '10px',
            background: '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            marginTop: 4,
          }}
        >
          Save Seat Matrix
        </button>

      </div>

      {/* ════ RIGHT: SAVED MATRICES ════ */}
      <div style={{
        background: '#fff', borderRadius: 12,
        border: '1px solid #f1f5f9', overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            Configured Matrices
          </h3>
          <span style={{
            background: '#f1f5f9', color: '#64748b',
            fontSize: 12, fontWeight: 600,
            padding: '2px 10px', borderRadius: 999
          }}>
            {seatMatrices.length} programs
          </span>
        </div>

        {/* Empty state */}
        {seatMatrices.length === 0 && (
          <div style={{
            padding: 40, textAlign: 'center',
            color: '#94a3b8', fontSize: 13
          }}>
            No matrices configured yet.
            <br />
            <span style={{ fontSize: 12 }}>
              Add programs in Master Setup first.
            </span>
          </div>
        )}

        {/* Matrix cards */}
        {seatMatrices.map(matrix => {
          // Find the program name for display
          const prog = programs.find(p => p.id === matrix.programId)

          return (
            <MatrixCard
              key={matrix.id}
              matrix={matrix}
              programName={prog?.name || 'Unknown Program'}
              programCode={prog?.code || ''}
              onDelete={() => handleDelete(matrix.id)}
            />
          )
        })}

      </div>
    </div>
  )
}

export default SeatMatrix


// ── MATRIX CARD ──────────────────────────────────
// Displays one saved matrix with quota breakdown
function MatrixCard({ matrix, programName, programCode, onDelete }) {

  const quotas = [
    { label: 'KCET',       seats: matrix.quota_KCET,       color: '#6366f1' },
    { label: 'COMEDK',     seats: matrix.quota_COMEDK,     color: '#0ea5e9' },
    { label: 'Management', seats: matrix.quota_Management, color: '#10b981' },
  ]

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f8fafc' }}>

      {/* Top row: program name + delete button */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'flex-start', marginBottom: 12
      }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
            {programName}
            <span style={{ color: '#94a3b8', fontSize: 12, marginLeft: 6 }}>
              ({programCode})
            </span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>
            Total Intake:&nbsp;
            <strong style={{ color: '#0f172a' }}>{matrix.total} seats</strong>
            {matrix.supernumerary > 0 && (
              <span style={{ marginLeft: 8, color: '#f59e0b' }}>
                + {matrix.supernumerary} supernumerary
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onDelete}
          style={{
            padding: '4px 10px',
            background: '#fee2e2', color: '#991b1b',
            border: 'none', borderRadius: 6,
            fontSize: 12, cursor: 'pointer', fontWeight: 600
          }}
        >
          Delete
        </button>
      </div>

      {/* 3-column quota grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 10
      }}>
        {quotas.map(q => (
          <div key={q.label} style={{
            background: '#f8fafc', borderRadius: 8,
            padding: '10px 12px',
            borderLeft: `3px solid ${q.color}`  // color bar on left
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700,
              color: '#64748b', marginBottom: 4
            }}>
              {q.label}
            </div>
            <div style={{
              fontSize: 22, fontWeight: 800, color: '#0f172a'
            }}>
              {q.seats}
            </div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {/* Show percentage of total */}
              {matrix.total > 0
                ? Math.round((q.seats / matrix.total) * 100)
                : 0}% of intake
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}

// ── FIELD WRAPPER ─────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block', fontSize: 11, fontWeight: 700,
        color: '#475569', textTransform: 'uppercase',
        letterSpacing: '0.05em', marginBottom: 5,
      }}>
        {label}
        {required && (
          <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>
        )}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ── SHARED STYLES ─────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 13,
  outline: 'none',
  background: '#f8fafc',
  boxSizing: 'border-box',
}

const selectStyle = {
  ...inputStyle,
  cursor: 'pointer',
}