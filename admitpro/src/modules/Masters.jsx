// src/modules/Masters.jsx

import { useState } from 'react'
import { uid } from '../utils'
import { supabase } from '../supabase'
import '../styles/common.css'


// Masters receives masterData from App.jsx
function Masters({ masterData }) {
  const {
    institutions, setInstitutions,
    campuses,     setCampuses,
    departments,  setDepartments,
    programs,     setPrograms,
    academicYears,setAcademicYears,
  } = masterData

  // Which tab is active — default is institution
  const [activeTab, setActiveTab] = useState('institution')

  // tabs config — id must match what we use in renderForm/renderTable
  const tabs = [
    { id: 'institution',  label: 'Institutions' },
    { id: 'campus',       label: 'Campuses' },
    { id: 'department',   label: 'Departments' },
    { id: 'program',      label: 'Programs' },
    { id: 'academicYear', label: 'Academic Years' },
  ]

  return (
    <div>
      {/* ── TAB BUTTONS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              background: activeTab === tab.id ? '#6366f1' : '#f1f5f9',
              color:      activeTab === tab.id ? '#fff'    : '#64748b',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── TWO COLUMN LAYOUT: Form left, Table right ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 20 }}>

        {/* LEFT: Form */}
        <div style={{
          background: '#ffff',
          borderRadius: '12px',
          padding: '20px',
          border: '1px solid #f1f5f9',
          height: 'fit-content',  // don't stretch to full height
        }}>
          {activeTab === 'institution'  && <InstitutionForm  institutions={institutions}   setInstitutions={setInstitutions} />}
          {activeTab === 'campus'       && <CampusForm        campuses={campuses}           setCampuses={setCampuses}         institutions={institutions} />}
          {activeTab === 'department'   && <DepartmentForm    departments={departments}     setDepartments={setDepartments}   campuses={campuses} />}
          {activeTab === 'program'      && <ProgramForm       programs={programs}           setPrograms={setPrograms}         departments={departments} />}
          {activeTab === 'academicYear' && <AcademicYearForm  academicYears={academicYears} setAcademicYears={setAcademicYears} />}
        </div>

        {/* RIGHT: Table */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          border: '1px solid #f1f5f9',
          overflow: 'hidden',
        }}>


    {activeTab === 'institution' && (<RecordTable items={institutions} cols={['name', 'code', 'location']} labels={['Name', 'Code', 'Location']} onDelete={handleDeleteInstitution} />)}
    {activeTab === 'campus' && (<RecordTable items={campuses.map(c => ({ ...c, instName: institutions.find(i => i.id === c.institutionId)?.name }))} cols={['name', 'instName']} labels={['Campus', 'Institution']} onDelete={handleDeleteCampus} />)}
    {activeTab === 'department' && (<RecordTable items={departments.map(d => ({ ...d, campusName: campuses.find(c => c.id === d.campusId)?.name }))} cols={['name', 'campusName']} labels={['Department', 'Campus']} onDelete={handleDeleteDepartment} />)}
    {activeTab === 'program' && (<RecordTable items={programs.map(p => ({ ...p, deptName: departments.find(d => d.id === p.departmentId)?.name }))} cols={['name', 'code', 'courseType', 'entryType', 'deptName']} labels={['Program', 'Code', 'Type', 'Entry', 'Department']} onDelete={handleDeleteProgram} />)}
    {activeTab === 'academicYear' && (<RecordTable items={academicYears} cols={['year', 'status']} labels={['Year', 'Status']} onDelete={handleDeleteYear} />)}
        </div>

      </div>
    </div>
  )
}

export default Masters


function InstitutionForm({ institutions, setInstitutions }) {
  // form state — all fields in one object
  const [form, setForm] = useState({ name: '', code: '', location: '' })
  const [error, setError] = useState('')

  // Inside InstitutionForm
async function handleSave() {
  if (!form.name.trim()) return setError('Institution name is required')
  if (!form.code.trim()) return setError('Code is required')

  const newRecord = { id: uid(), ...form }

  // Save to Supabase
  const { error } = await supabase
    .from('institutions')
    .insert(newRecord)

  if (error) return setError('Failed to save: ' + error.message)

  // Update local state so UI updates immediately
  setInstitutions([...institutions, newRecord])
  setForm({ name: '', code: '', location: '' })
  setError('')
}


  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>
        Add Institution
      </h3>

      {error && <ErrorMsg msg={error} />}

      <Field label="Institution Name" required>
        <Input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. ABC College of Engineering"
        />
      </Field>

      <Field label="Short Code" required>
        <Input
          value={form.code}
          onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="e.g. ABCE"
        />
      </Field>

      <Field label="Location">
        <Input
          value={form.location}
          onChange={e => setForm({ ...form, location: e.target.value })}
          placeholder="e.g. Bangalore"
        />
      </Field>

      <SaveButton onClick={handleSave} />
    </div>
  )
}

async function handleDeleteInstitution(id) {
  const { error } = await supabase
    .from('institutions')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Failed to delete: ' + error.message)
    return
  }

  setInstitutions(institutions.filter(i => i.id !== id))
}

//campus form
function CampusForm({ campuses, setCampuses, institutions }) {
  const [form, setForm] = useState({ name: '', institutionId: '', city: '' })
  const [error, setError] = useState('')

// Inside CampusForm handleSave
async function handleSave() {
  if (!form.name.trim())   return setError('Campus name is required')
  if (!form.institutionId) return setError('Select an institution')

  const newRecord = { id: uid(), ...form }

  const { error } = await supabase
    .from('campuses')
    .insert({
      id:             newRecord.id,
      name:           newRecord.name,
      institution_id: newRecord.institutionId,  // ← snake_case
      city:           newRecord.city,
    })

  if (error) return setError('Failed to save: ' + error.message)

  setCampuses([...campuses, newRecord])
  setForm({ name: '', institutionId: '', city: '' })
  setError('')
}

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add Campus</h3>
      {error && <ErrorMsg msg={error} />}

      <Field label="Institution" required>
        {/* Dropdown populated from institutions array */}
        <Select
          value={form.institutionId}
          onChange={e => setForm({ ...form, institutionId: e.target.value })}
        >
          <option value="">Select institution</option>
          {institutions.map(i => (
            <option key={i.id} value={i.id}>{i.name}</option>
          ))}
        </Select>
      </Field>

      <Field label="Campus Name" required>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Campus" />
      </Field>

      <Field label="City">
        <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
      </Field>

      <SaveButton onClick={handleSave} />
    </div>
  )
}

async function handleDeleteCampus(id) {
  const { error } = await supabase
    .from('campuses')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Failed to delete: ' + error.message)
    return
  }

  setCampuses(campuses.filter(c => c.id !== id))
}

//departmet
function DepartmentForm({ departments, setDepartments, campuses }) {
  const [form, setForm] = useState({ name: '', campusId: '', hod: '' })
  const [error, setError] = useState('')

  // Inside DepartmentForm handleSave
async function handleSave() {
  if (!form.name.trim()) return setError('Department name is required')
  if (!form.campusId)    return setError('Select a campus')

  const newRecord = { id: uid(), ...form }

  const { error } = await supabase
    .from('departments')
    .insert({
      id:        newRecord.id,
      name:      newRecord.name,
      campus_id: newRecord.campusId,   // ← snake_case
      hod:       newRecord.hod,
    })

  if (error) return setError('Failed to save: ' + error.message)

  setDepartments([...departments, newRecord])
  setForm({ name: '', campusId: '', hod: '' })
  setError('')
}

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add Department</h3>
      {error && <ErrorMsg msg={error} />}

      <Field label="Campus" required>
        <Select value={form.campusId} onChange={e => setForm({ ...form, campusId: e.target.value })}>
          <option value="">Select campus</option>
          {campuses.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </Field>

      <Field label="Department Name" required>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Engineering" />
      </Field>

      <Field label="HOD Name">
        <Input value={form.hod} onChange={e => setForm({ ...form, hod: e.target.value })} placeholder="e.g. Dr. Sharma" />
      </Field>

      <SaveButton onClick={handleSave} />
    </div>
  )
}

async function handleDeleteDepartment(id) {
  const { error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Failed to delete: ' + error.message)
    return
  }

  setDepartments(departments.filter(d => d.id !== id))
}


//program
function ProgramForm({ programs, setPrograms, departments }) {
  const [form, setForm] = useState({
    name: '', code: '', courseType: 'UG',
    entryType: 'Regular', departmentId: ''
  })
  const [error, setError] = useState('')

  // Inside ProgramForm handleSave
async function handleSave() {
  if (!form.name.trim())  return setError('Program name is required')
  if (!form.code.trim())  return setError('Branch code is required')
  if (!form.departmentId) return setError('Select a department')

  const newRecord = { id: uid(), ...form }

  const { error } = await supabase
    .from('programs')
    .insert({
      id:            newRecord.id,
      name:          newRecord.name,
      code:          newRecord.code,
      course_type:   newRecord.courseType,    // ← snake_case
      entry_type:    newRecord.entryType,     // ← snake_case
      department_id: newRecord.departmentId,  // ← snake_case
    })

  if (error) return setError('Failed to save: ' + error.message)

  setPrograms([...programs, newRecord])
  setForm({
    name: '', code: '',
    courseType: 'UG', entryType: 'Regular',
    departmentId: ''
  })
  setError('')
}

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add Program</h3>
      {error && <ErrorMsg msg={error} />}

      <Field label="Department" required>
        <Select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
          <option value="">Select department</option>
          {departments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </Field>

      <Field label="Program Name" required>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. B.E. Computer Science" />
      </Field>

      <Field label="Branch Code" required>
        <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. CSE" />
      </Field>

      <Field label="Course Type" required>
        <Select value={form.courseType} onChange={e => setForm({ ...form, courseType: e.target.value })}>
          <option value="UG">UG</option>
          <option value="PG">PG</option>
        </Select>
      </Field>

      <Field label="Entry Type" required>
        <Select value={form.entryType} onChange={e => setForm({ ...form, entryType: e.target.value })}>
          <option value="Regular">Regular</option>
          <option value="Lateral">Lateral</option>
        </Select>
      </Field>

      <SaveButton onClick={handleSave} />
    </div>
  )
}

async function handleDeleteProgram(id) {
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Failed to delete: ' + error.message)
    return
  }

  setPrograms(programs.filter(p => p.id !== id))
}



// acdamec
function AcademicYearForm({ academicYears, setAcademicYears }) {
  const [form, setForm] = useState({ year: '', status: 'Active' })
  const [error, setError] = useState('')

 // Inside AcademicYearForm handleSave
async function handleSave() {
  if (!form.year.trim()) return setError('Year is required')

  const newRecord = { id: uid(), ...form }

  const { error } = await supabase
    .from('academic_years')
    .insert(newRecord)

  if (error) return setError('Failed to save: ' + error.message)

  setAcademicYears([...academicYears, newRecord])
  setForm({ year: '', status: 'Active' })
  setError('')
}

  return (
    <div>
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Add Academic Year</h3>
      {error && <ErrorMsg msg={error} />}

      <Field label="Academic Year" required>
        <Input value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} placeholder="e.g. 2025-26" />
      </Field>

      <Field label="Status">
        <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option>Active</option>
          <option>Inactive</option>
        </Select>
      </Field>

      <SaveButton onClick={handleSave} />
    </div>
  )
}


async function handleDeleteYear(id) {
  const { error } = await supabase
    .from('academic_years')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Failed to delete: ' + error.message)
    return
  }

  setAcademicYears(academicYears.filter(y => y.id !== id))
}


// ── REUSABLE UI PIECES ──────────────────────────────

// Label + input wrapper
function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        display: 'block',
        fontSize: 11,
        fontWeight: 700,
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: 5,
      }}>
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  )
}

// Styled text input
function Input({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1.5px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '13px',
        outline: 'none',
        background: '#f8fafc',
        boxSizing: 'border-box',
      }}
    />
  )
}

// Styled select dropdown
function Select({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '100%',
        padding: '9px 12px',
        border: '1.5px solid #e2e8f0',
        borderRadius: '8px',
        fontSize: '13px',
        outline: 'none',
        background: '#f8fafc',
        cursor: 'pointer',
        boxSizing: 'border-box',
      }}
    >
      {children}
    </select>
  )
}

// Save button
function SaveButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px',
        background: '#6366f1',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: 700,
        cursor: 'pointer',
        marginTop: 4,
      }}
    >
      Save
    </button>
  )
}

// Red error message
function ErrorMsg({ msg }) {
  return (
    <div style={{
      background: '#fee2e2',
      color: '#991b1b',
      fontSize: 12,
      padding: '8px 12px',
      borderRadius: 6,
      marginBottom: 12,
    }}>
      ⚠️ {msg}
    </div>
  )
}

// Table to display records
function RecordTable({ items, cols, labels, onDelete }) {
  if (items.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
        No records yet. Add one using the form.
      </div>
    )
  }

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          {labels.map(l => (
            <th key={l} style={{
              padding: '10px 14px',
              textAlign: 'left',
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#64748b',
              background: '#f8fafc',
              borderBottom: '2px solid #f1f5f9',
            }}>
              {l}
            </th>
          ))}
          <th style={{ padding: '10px 14px', background: '#f8fafc', borderBottom: '2px solid #f1f5f9' }}></th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            {cols.map(col => (
              <td key={col} style={{
                padding: '10px 14px',
                fontSize: 13,
                color: '#334155',
                borderBottom: '1px solid #f8fafc',
              }}>
                {item[col] || '—'}
              </td>
            ))}
            <td style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc' }}>
              <button
                onClick={() => onDelete(item.id)}
                style={{
                  padding: '4px 10px',
                  background: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}