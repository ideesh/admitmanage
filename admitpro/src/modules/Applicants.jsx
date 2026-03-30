// src/modules/Applicants.jsx

import { useState } from 'react'
import { uid, today } from '../utils'
import { supabase } from '../supabase'
import '../styles/common.css'
import '../styles/applicants.css'

function Applicants({ applicantData }) {
  const { applicants, setApplicants, programs } = applicantData

  const [showForm, setShowForm] = useState(false)
  const [search,   setSearch]   = useState('')

  const emptyForm = {
    name: '', dob: '', gender: '', mobile: '',
    email: '', address: '', category: 'GM',
    programId: '', quota: 'KCET', entryType: 'Regular',
    admissionMode: 'Government', allotmentNo: '',
    qualExam: '', qualMarks: '', qualPercent: '',
  }

  const [form,  setForm]  = useState(emptyForm)
  const [error, setError] = useState('')

  // ── SAVE ─────────────────────────────────────────
async function handleSave() {
  setError('')

  // Validations — same as before
  if (!form.name.trim()) {
    return setError('Full name is required')
  }
  if (!form.mobile.trim()) {
    return setError('Mobile number is required')
  }
  if (!form.programId) {
    return setError('Please select a program')
  }
  if (!/^\d{10}$/.test(form.mobile)) {
    return setError('Mobile must be exactly 10 digits')
  }

  // Build record — camelCase for local state
  const newApplicant = {
    id:            uid(),
    appNo:         'APP/' + uid(),
    createdAt:     today(),
    docStatus:     'Pending',
    ...form,
  }

  // Save to Supabase — snake_case for database
  const { error } = await supabase
    .from('applicants')
    .insert({
      id:             newApplicant.id,
      app_no:         newApplicant.appNo,
      name:           newApplicant.name,
      dob:            newApplicant.dob,
      gender:         newApplicant.gender,
      mobile:         newApplicant.mobile,
      email:          newApplicant.email,
      address:        newApplicant.address,
      category:       newApplicant.category,
      program_id:     newApplicant.programId,
      quota:          newApplicant.quota,
      entry_type:     newApplicant.entryType,
      admission_mode: newApplicant.admissionMode,
      allotment_no:   newApplicant.allotmentNo,
      qual_exam:      newApplicant.qualExam,
      qual_marks:     newApplicant.qualMarks,
      qual_percent:   newApplicant.qualPercent,
      doc_status:     newApplicant.docStatus,
      created_at:     newApplicant.createdAt,
    })

  if (error) {
    return setError('Failed to save: ' + error.message)
  }

  // Update local state
  setApplicants([...applicants, newApplicant])
  setShowForm(false)
  setForm(emptyForm)
}

  // ── DELETE ───────────────────────────────────────
 async function handleDelete(id) {
  const { error } = await supabase
    .from('applicants')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Failed to delete: ' + error.message)
    return
  }

  setApplicants(applicants.filter(a => a.id !== id))
}

  // ── UPDATE DOC STATUS ────────────────────────────
 async function updateDocStatus(id, newStatus) {
  // Update in Supabase first
  const { error } = await supabase
    .from('applicants')
    .update({ doc_status: newStatus })   // ← snake_case
    .eq('id', id)

  if (error) {
    alert('Failed to update: ' + error.message)
    return
  }

  // Then update local state
  setApplicants(applicants.map(a =>
    a.id === id ? { ...a, docStatus: newStatus } : a
  ))
}

  // ── SEARCH FILTER ────────────────────────────────
  const filtered = applicants.filter(a => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      a.name?.toLowerCase().includes(q) ||
      a.mobile?.includes(q)             ||
      a.appNo?.toLowerCase().includes(q)
    )
  })

  // ── RENDER ───────────────────────────────────────
  return (
    <div>

      {/* TOP BAR */}
      <div className="applicants-topbar">
        <input
          className="applicants-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, mobile, app number..."
        />
        <button
          className="btn-primary"
          onClick={() => { setShowForm(true); setForm(emptyForm); setError('') }}
        >
          + New Applicant
        </button>
      </div>

      {/* FORM PANEL */}
      {showForm && (
        <div className="applicant-form-panel">

          <div className="applicant-form-header">
            <h3 className="applicant-form-title">New Applicant</h3>
            <button
              className="applicant-form-close"
              onClick={() => { setShowForm(false); setError('') }}
            >
              ✕
            </button>
          </div>

          {error && <div className="alert-error">⚠️ {error}</div>}

          <div className="applicant-form-grid">

            <Field label="Full Name" required>
              <input className="input" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rahul Sharma" />
            </Field>

            <Field label="Date of Birth">
              <input className="input" type="date" value={form.dob}
                onChange={e => setForm({ ...form, dob: e.target.value })} />
            </Field>

            <Field label="Gender">
              <select className="select" value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value })}>
                <option value="">Select gender</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Mobile" required>
              <input className="input" value={form.mobile}
                onChange={e => setForm({ ...form, mobile: e.target.value })}
                placeholder="10 digit mobile number" />
            </Field>

            <Field label="Email">
              <input className="input" type="email" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com" />
            </Field>

            <Field label="Category">
              <select className="select" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {['GM','SC','ST','OBC','EWS','PWD'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>

            <Field label="Program" required>
              <select className="select" value={form.programId}
                onChange={e => setForm({ ...form, programId: e.target.value })}>
                <option value="">Select program</option>
                {programs.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Quota">
              <select className="select" value={form.quota}
                onChange={e => setForm({ ...form, quota: e.target.value })}>
                <option>KCET</option>
                <option>COMEDK</option>
                <option>Management</option>
              </select>
            </Field>

            <Field label="Entry Type">
              <select className="select" value={form.entryType}
                onChange={e => setForm({ ...form, entryType: e.target.value })}>
                <option>Regular</option>
                <option>Lateral</option>
              </select>
            </Field>

            <Field label="Admission Mode">
              <select className="select" value={form.admissionMode}
                onChange={e => setForm({ ...form, admissionMode: e.target.value })}>
                <option>Government</option>
                <option>Management</option>
              </select>
            </Field>

            <Field label="Allotment Number" hint="Required for KCET / COMEDK quota">
              <input className="input" value={form.allotmentNo}
                onChange={e => setForm({ ...form, allotmentNo: e.target.value })}
                placeholder="e.g. KCET-2025-12345" />
            </Field>

            <Field label="Qualifying Exam">
              <input className="input" value={form.qualExam}
                onChange={e => setForm({ ...form, qualExam: e.target.value })}
                placeholder="e.g. PUC / 10+2" />
            </Field>

            <Field label="Marks Obtained">
              <input className="input" type="number" value={form.qualMarks}
                onChange={e => setForm({ ...form, qualMarks: e.target.value })}
                placeholder="e.g. 540" />
            </Field>

            <Field label="Percentage">
              <input className="input" type="number" value={form.qualPercent}
                onChange={e => setForm({ ...form, qualPercent: e.target.value })}
                placeholder="e.g. 90.5" />
            </Field>

            {/* Address — full width */}
            <div className="applicant-form-full">
              <Field label="Address">
                <input className="input" value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="City / full address" />
              </Field>
            </div>

          </div>

          {/* Form actions */}
          <div className="applicant-form-actions">
            <button className="btn-primary" onClick={handleSave}>
              Save Applicant
            </button>
            <button className="btn-secondary"
              onClick={() => { setShowForm(false); setError('') }}>
              Cancel
            </button>
          </div>

        </div>
      )}

      {/* TABLE */}
      <div className="card">

        <div className="table-header">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>
            Applicants
          </h3>
          <span className="count-pill">{filtered.length} records</span>
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">
            {search
              ? 'No applicants match your search.'
              : 'No applicants yet. Click + New Applicant.'}
          </div>
        )}

        {filtered.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                {['App No.','Name','Program','Quota',
                  'Category','Qual %','Documents','Action'
                ].map(h => <th key={h}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const prog = programs.find(p => p.id === a.programId)
                return (
                  <tr key={a.id}>
                    <td>
                      <span className="app-number">{a.appNo}</span>
                    </td>
                    <td>
                      <div className="applicant-name">{a.name}</div>
                      <div className="applicant-mobile">{a.mobile}</div>
                    </td>
                    <td>{prog?.name || '—'}</td>
                    <td>
                      <span className={`badge ${quotaBadgeClass(a.quota)}`}>
                        {a.quota}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-gray">{a.category}</span>
                    </td>
                    <td>{a.qualPercent ? `${a.qualPercent}%` : '—'}</td>
                    <td>
                      <select
                        className={`doc-status-select ${docStatusClass(a.docStatus)}`}
                        value={a.docStatus}
                        onChange={e => updateDocStatus(a.id, e.target.value)}
                      >
                        <option>Pending</option>
                        <option>Submitted</option>
                        <option>Verified</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="btn-danger"
                        onClick={() => handleDelete(a.id)}
                      >
                        Delete
                      </button>
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

export default Applicants



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

// ── DOC STATUS CLASS ──────────────────────────────
function docStatusClass(status) {
  if (status === 'Verified')  return 'doc-verified'
  if (status === 'Submitted') return 'doc-submitted'
  return 'doc-pending'
}
