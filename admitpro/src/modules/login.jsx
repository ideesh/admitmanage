// src/modules/Login.jsx

import { useState } from 'react'
import { supabase } from '../supabase'

function Login({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleLogin() {
    setError('')

    // Basic validation
    if (!email.trim())    return setError('Email is required')
    if (!password.trim()) return setError('Password is required')

    setLoading(true)

    // Step 1: Sign in with Supabase Auth

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

console.log("auth user id:", authData?.user?.id); // <-- what does this print?
    /*
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email,
        password,

        
      }) 
      console.log("error:", authError?.message);*/
      

    if (authError) {
      setLoading(false)
      return setError('Invalid email or password')
  
    }

    // Step 2: Fetch this user's role from user_profiles
    const { data: profile, error: profileError } =
      await supabase
        .from('user_profiles')
        .select()
        .eq('id', authData.user.id)
        .single()  // returns one record not array

    if (profileError || !profile) {
      setLoading(false)
      return setError('User profile not found. Contact admin.')
    }

    // Step 3: Pass user info up to App.jsx
    onLogin({
      id:       authData.user.id,
      email:    profile.email,
      role:     profile.role,
      fullName: profile.full_name,
    })

    setLoading(false)
  }

  // Allow Enter key to submit
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
    }}>

      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 400,
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <h1 style={{
            fontSize: 22, fontWeight: 800,
            color: '#0f172a', margin: 0
          }}>
            AdmitPro
          </h1>
          <p style={{
            fontSize: 13, color: '#94a3b8',
            marginTop: 4
          }}>
            Admission Management System
          </p>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: '#fee2e2', color: '#991b1b',
            padding: '10px 14px', borderRadius: 8,
            fontSize: 13, marginBottom: 16,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{
            display: 'block', fontSize: 11,
            fontWeight: 700, color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 5,
          }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="your@email.com"
            style={{
              width: '100%', padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: 8, fontSize: 14,
              outline: 'none', background: '#f8fafc',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: 'block', fontSize: 11,
            fontWeight: 700, color: '#475569',
            textTransform: 'uppercase',
            letterSpacing: '0.05em', marginBottom: 5,
          }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            style={{
              width: '100%', padding: '10px 14px',
              border: '1.5px solid #e2e8f0',
              borderRadius: 8, fontSize: 14,
              outline: 'none', background: '#f8fafc',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: loading ? '#a5b4fc' : '#6366f1',
            color: '#fff', border: 'none',
            borderRadius: 8, fontSize: 14,
            fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>

        {/* Test credentials hint */}
        <div style={{
          marginTop: 24,
          padding: '14px',
          background: '#f8fafc',
          borderRadius: 8,
          fontSize: 11,
          color: '#64748b',
          lineHeight: 1.8,
        }}>
          <strong style={{ color: '#475569' }}>
            Test Credentials:
          </strong>
          <br />
          Admin: admin@admitpro.com / Admin@123
          <br />
          Officer: officer@admitpro.com / Officer@123
          <br />
          Management: management@admitpro.com / Mgmt@123
        </div>

      </div>
    </div>
  )
}

export default Login