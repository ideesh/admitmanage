// src/App.jsx

import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import Layout      from './components/Layout'
import Login       from './modules/Login'
import Dashboard   from './modules/Dashboard'
import Masters     from './modules/Masters'
import SeatMatrix  from './modules/SeatMatrix'
import Applicants  from './modules/Applicants'
import Allocations from './modules/Allocations'
import Admissions  from './modules/Admissions'

function App() {
  const [activePage,   setActivePage]   = useState('dashboard')
  const [currentUser,  setCurrentUser]  = useState(null)
  const [authLoading,  setAuthLoading]  = useState(true)

  // ── DATA STATE ───────────────────────────────────
  const [institutions,  setInstitutions]  = useState([])
  const [campuses,      setCampuses]      = useState([])
  const [departments,   setDepartments]   = useState([])
  const [programs,      setPrograms]      = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [seatMatrices,  setSeatMatrices]  = useState([])
  const [applicants,    setApplicants]    = useState([])
  const [allocations,   setAllocations]   = useState([])
  const [dataLoading,   setDataLoading]   = useState(false)

  // ── CHECK IF ALREADY LOGGED IN ───────────────────
  // When app starts check if user has an active session
  // So they don't have to login again after refresh
  useEffect(() => {
    checkSession()

    // Listen for auth changes (login/logout)
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setCurrentUser(null)
        }
      }
    )

    // Cleanup listener on unmount
    return () => listener.subscription.unsubscribe()
  }, [])

  async function checkSession() {
    setAuthLoading(true)

    // Check if there is an active Supabase session
    const { data: { session } } = await supabase.auth.getSession()

    if (session) {
      // Fetch their profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select()
        .eq('id', session.user.id)
        .single()

      if (profile) {
        const user = {
          id:       session.user.id,
          email:    profile.email,
          role:     profile.role,
          fullName: profile.full_name,
        }
        setCurrentUser(user)
        await loadAllData()
      }
    }

    setAuthLoading(false)
  }

  // ── CALLED AFTER LOGIN ───────────────────────────
  async function handleLogin(user) {
    setCurrentUser(user)

    // Set default page based on role
    if (user.role === 'Management') {
      setActivePage('dashboard')
    } else if (user.role === 'Admission Officer') {
      setActivePage('applicants')
    } else {
      setActivePage('dashboard')
    }

    await loadAllData()
  }

  // ── LOGOUT ───────────────────────────────────────
  async function handleLogout() {
    await supabase.auth.signOut()
    setCurrentUser(null)

    // Clear all data from state
    setInstitutions([])
    setCampuses([])
    setDepartments([])
    setPrograms([])
    setAcademicYears([])
    setSeatMatrices([])
    setApplicants([])
    setAllocations([])
  }

  // ── LOAD ALL DATA ────────────────────────────────
  async function loadAllData() {
    setDataLoading(true)

    const [
      inst, camp, dept, prog,
      years, matrices, apps, allocs
    ] = await Promise.all([
      supabase.from('institutions').select(),
      supabase.from('campuses').select(),
      supabase.from('departments').select(),
      supabase.from('programs').select(),
      supabase.from('academic_years').select(),
      supabase.from('seat_matrices').select(),
      supabase.from('applicants').select(),
      supabase.from('allocations').select(),
    ])

    if (inst.data)     setInstitutions(inst.data)
    if (camp.data)     setCampuses(camp.data.map(c => ({
      ...c, institutionId: c.institution_id
    })))
    if (dept.data)     setDepartments(dept.data.map(d => ({
      ...d, campusId: d.campus_id
    })))
    if (prog.data)     setPrograms(prog.data.map(p => ({
      ...p,
      departmentId: p.department_id,
      courseType:   p.course_type,
      entryType:    p.entry_type,
    })))
    if (years.data)    setAcademicYears(years.data)
    if (matrices.data) setSeatMatrices(matrices.data.map(m => ({
      ...m,
      programId:        m.program_id,
      quota_KCET:       m.quota_kcet,
      quota_COMEDK:     m.quota_comedk,
      quota_Management: m.quota_management,
    })))
    if (apps.data)     setApplicants(apps.data.map(a => ({
      ...a,
      appNo:         a.app_no,
      programId:     a.program_id,
      entryType:     a.entry_type,
      admissionMode: a.admission_mode,
      allotmentNo:   a.allotment_no,
      qualExam:      a.qual_exam,
      qualMarks:     a.qual_marks,
      qualPercent:   a.qual_percent,
      docStatus:     a.doc_status,
      createdAt:     a.created_at,
    })))
    if (allocs.data)   setAllocations(allocs.data.map(a => ({
      ...a,
      applicantId:     a.applicant_id,
      programId:       a.program_id,
      feeStatus:       a.fee_status,
      admissionNumber: a.admission_number,
      allocatedAt:     a.allocated_at,
      confirmedAt:     a.confirmed_at,
    })))

    setDataLoading(false)
  }

  // ── ROUTE GUARD ──────────────────────────────────
  // Blocks access to pages the user's role can't see
  function canAccess(page) {
    const access = {
      dashboard:   ['Admin', 'Admission Officer', 'Management'],
      masters:     ['Admin'],
      seatmatrix:  ['Admin'],
      applicants:  ['Admin', 'Admission Officer'],
      allocations: ['Admin', 'Admission Officer'],
      admissions:  ['Admin', 'Admission Officer', 'Management'],
    }
    return access[page]?.includes(currentUser?.role)
  }

  // ── HELPERS ──────────────────────────────────────
  function getSeatsAvailable(programId, quota) {
    const matrix = seatMatrices.find(m => m.programId === programId)
    if (!matrix) return 0
    const totalSeats = matrix[`quota_${quota}`] || 0
    const taken = allocations.filter(a =>
      a.programId === programId &&
      a.quota     === quota     &&
      a.status    !== 'Cancelled'
    ).length
    return totalSeats - taken
  }

  function generateAdmissionNumber(programId, quota) {
    const program = programs.find(p => p.id === programId)
    if (!program) return null
    const count = allocations.filter(a =>
      a.programId === programId &&
      a.quota     === quota     &&
      a.admissionNumber !== null
    ).length + 1
    const year = new Date().getFullYear()
    const seq  = String(count).padStart(4, '0')
    return `INST/${year}/${program.courseType}/${program.code}/${quota}/${seq}`
  }

  // ── PROP BUNDLES ─────────────────────────────────
  const masterData = {
    institutions, setInstitutions,
    campuses,     setCampuses,
    departments,  setDepartments,
    programs,     setPrograms,
    academicYears,setAcademicYears,
  }

  const seatMatrixData = {
    seatMatrices, setSeatMatrices, programs,
  }

  const applicantData = {
    applicants, setApplicants, programs,
  }

  const allocationData = {
    allocations,  setAllocations,
    applicants,   programs,
    seatMatrices, getSeatsAvailable,
    generateAdmissionNumber,
  }

  // ── RENDER PAGE ──────────────────────────────────
  function renderPage() {
    // Block access if role not allowed
    if (!canAccess(activePage)) {
      return (
        <div style={{
          padding: 40, textAlign: 'center',
          color: '#94a3b8', fontSize: 14,
        }}>
          🚫 You don't have permission to view this page.
        </div>
      )
    }

    if (dataLoading) {
      return (
        <div style={{
          padding: 40, textAlign: 'center',
          color: '#94a3b8', fontSize: 14,
        }}>
          Loading...
        </div>
      )
    }

    if (activePage === 'dashboard')   return (
      <Dashboard dashboardData={{
        programs, seatMatrices,
        applicants, allocations,
        getSeatsAvailable,
      }} />
    )
    if (activePage === 'masters')     return (
      <Masters masterData={masterData} />
    )
    if (activePage === 'seatmatrix')  return (
      <SeatMatrix seatMatrixData={seatMatrixData} />
    )
    if (activePage === 'applicants')  return (
      <Applicants applicantData={applicantData} />
    )
    if (activePage === 'allocations') return (
      <Allocations allocationData={allocationData} />
    )
    if (activePage === 'admissions')  return (
      <Admissions admissionData={{
        allocations, applicants, programs,
      }} />
    )
  }

  // ── AUTH LOADING ─────────────────────────────────
  if (authLoading) {
    return (
      <div style={{
        height: '100vh', display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#f8fafc', gap: 12,
      }}>
        <div style={{ fontSize: 32 }}>🎓</div>
        <div style={{ fontSize: 14, color: '#94a3b8' }}>
          Loading...
        </div>
      </div>
    )
  }

  // ── NOT LOGGED IN → SHOW LOGIN PAGE ──────────────
  if (!currentUser) {
    return <Login onLogin={handleLogin} />
  }

  // ── LOGGED IN → SHOW APP ─────────────────────────
  return (
    <Layout
      activePage={activePage}
      setActivePage={setActivePage}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      {renderPage()}
    </Layout>
  )
}

export default App
