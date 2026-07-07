import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { ScanBarcode, Eye, EyeOff, LogIn, CheckCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    if (!forgotEmail) {
      toast.error('Please enter your email')
      return
    }
    setForgotLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail })
      toast.success(res.data.message)
      setForgotStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error requesting OTP')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!forgotOtp || !newPassword) {
      toast.error('Please enter OTP and new password')
      return
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must be at least 6 characters, with one uppercase, lowercase, and number')
      return
    }
    setForgotLoading(true)
    try {
      const res = await api.post('/auth/reset-password', { email: forgotEmail, otp: forgotOtp, newPassword: newPassword })
      toast.success(res.data.message)
      setShowForgotModal(false)
      setForgotStep(1)
      setForgotEmail('')
      setForgotOtp('')
      setNewPassword('')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error resetting password')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Please enter username and password')
      return
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
    if (!passwordRegex.test(form.password)) {
      toast.error('Password must be at least 6 characters, with one uppercase, one lowercase, and one number')
      return
    }

    setLoading(true)
    try {
      await login(form.username, form.password)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      fontFamily: 'var(--font-family)',
      background: 'var(--color-bg)'
    }}>
      {/* CSS Overrides */}
      <style>{`
        @keyframes floatEffect {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        @keyframes kenBurns {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.1) translate(-2%, -2%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        
        /* Split Screen Responsive Layout */
        .login-container {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }
        .login-left {
          flex: 1;
          background-color: #0f172a;
          display: none;
          position: relative;
          overflow: hidden;
          padding: 60px;
          flex-direction: column;
          justify-content: space-between;
          color: white;
        }

        /* Animated Background Image */
        .login-left-bg {
          position: absolute;
          inset: -10%; /* Overflow slightly for zooming */
          background-image: url('/login-bg.png');
          background-size: cover;
          background-position: center;
          animation: kenBurns 30s ease-in-out infinite;
          z-index: 1;
        }
        /* Gradient Overlay for text readability */
        .login-left-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 58, 138, 0.75) 100%);
          z-index: 2;
        }

        /* Content inside the left panel */
        .login-left-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }

        /* Ensure text in left panel stays white and overrides global css */
        .login-left h1, .login-left h2, .login-left p, .login-left span {
          color: white !important;
        }
        .login-left p {
          opacity: 0.9;
        }

        .login-right {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          background: var(--color-surface);
          position: relative;
        }
        
        /* Premium Input Styles */
        .premium-input {
          width: 100%;
          padding: 14px 16px;
          font-size: 15px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          color: #0f172a;
          transition: all 0.2s ease;
          outline: none;
        }
        .premium-input:focus {
          background-color: #ffffff;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }
        .premium-input::placeholder {
          color: #94a3b8;
        }
        
        @media (min-width: 992px) {
          .login-left {
            display: flex;
          }
        }
      `}</style>

      <div className="login-container">
        {/* Left Side: Branding & Features */}
        <div className="login-left">
          
          <div className="login-left-bg"></div>
          <div className="login-left-overlay"></div>

          <div className="login-left-content">
            {/* Top Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 48, height: 48,
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '1px solid rgba(255, 255, 255, 0.3)',
              }}>
                <ScanBarcode size={24} color="white" strokeWidth={2.5} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.04em' }}>SmartBarcode</h1>
            </div>

            {/* Main Content */}
            <div style={{ maxWidth: 500, marginTop: '-10vh' }}>
              <h2 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.03em' }}>
                The Intelligent Retail POS Platform.
              </h2>
              <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 48 }}>
                Streamline your billing, manage inventory effortlessly, and unlock deep insights with our enterprise-grade management suite.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  'Lightning-fast Barcode Billing',
                  'Real-time Inventory Tracking',
                  'Advanced Role-based Security',
                  'Deep Business Analytics'
                ].map((feature, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.2)', padding: 6, borderRadius: '50%', display: 'flex', backdropFilter: 'blur(5px)' }}>
                      <CheckCircle2 size={20} color="white" />
                    </div>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Note */}
            <div>
              <p style={{ fontSize: 14, opacity: 0.7 }}>
                © {new Date().getFullYear()} SmartBarcode Systems Inc.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Premium Login Form */}
        <div className="login-right">
          <div style={{ 
            width: '100%', 
            maxWidth: 440, 
            animation: 'fadeIn 0.6s ease',
            padding: '40px',
            backgroundColor: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.1)',
          }}>
            
            {/* Mobile Header */}
            <div style={{ display: 'block', textAlign: 'center', marginBottom: 32, '@media (minWidth: 992px)': { display: 'none' } }} className="mobile-header">
              <div style={{
                width: 56, height: 56,
                background: 'linear-gradient(135deg, #3b82f6 0%, #4f46e5 100%)',
                borderRadius: 16,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 16px rgba(59, 130, 246, 0.3)'
              }}>
                <ScanBarcode size={28} color="white" strokeWidth={2.5} />
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12, color: '#0f172a' }}>
                Welcome back
              </h2>
              <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>
                Please enter your details to sign in
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label htmlFor="username" style={{ display: 'block', color: '#475569', fontSize: 13, fontWeight: 700, marginBottom: 8, letterSpacing: '0.02em' }}>
                  USERNAME
                </label>
                <input
                  id="username"
                  type="text"
                  className="premium-input"
                  placeholder="admin"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  autoComplete="username"
                  autoFocus
                />
              </div>

              <div className="form-group" style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label htmlFor="password" style={{ color: '#475569', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>
                    PASSWORD
                  </label>
                  {form.username !== 'admin' && (
                    <a href="#" onClick={(e) => { e.preventDefault(); setShowForgotModal(true); }} style={{ fontSize: 13, color: '#3b82f6', fontWeight: 600, textDecoration: 'none' }}>
                      Forgot password?
                    </a>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPass ? 'text' : 'password'}
                    className="premium-input"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 12, top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#94a3b8', display: 'flex',
                      padding: 4
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#475569'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                <input type="checkbox" id="remember" style={{ width: 16, height: 16, borderRadius: 4, cursor: 'pointer', accentColor: '#3b82f6' }} />
                <label htmlFor="remember" style={{ fontSize: 14, color: '#64748b', cursor: 'pointer', fontWeight: 500, margin: 0 }}>
                  Remember me for 30 days
                </label>
              </div>

              <button
                type="submit"
                style={{ 
                  width: '100%', 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center', 
                  padding: '14px', 
                  fontSize: 16,
                  background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  boxShadow: '0 8px 20px -6px rgba(79, 70, 229, 0.5)',
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: loading ? 0.7 : 1
                }}
                disabled={loading}
                onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(79, 70, 229, 0.6)'; } }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px -6px rgba(79, 70, 229, 0.5)'; }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="loading-spinner" style={{ width: 18, height: 18, borderTopColor: 'white', borderRightColor: 'white' }} />
                    Signing in...
                  </span>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Sign In to Platform
                  </span>
                )}
              </button>
            </form>

            {/* Forgot Password Modal */}
            {showForgotModal && (
              <div style={{
                position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
              }}>
                <div style={{
                  background: 'white', padding: 32, borderRadius: 20, width: '90%', maxWidth: 400,
                  boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                }}>
                  <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#0f172a' }}>Reset Password</h3>
                  <p style={{ color: '#64748b', fontSize: 14, marginBottom: 24 }}>
                    {forgotStep === 1 ? "Enter your registered email to receive an OTP." : "Enter the OTP sent to your email and your new password."}
                  </p>
                  
                  {forgotStep === 1 ? (
                    <form onSubmit={handleRequestOtp}>
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>EMAIL</label>
                        <input
                          type="email" className="premium-input" placeholder="Enter registered email"
                          value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} autoFocus
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button type="button" onClick={() => setShowForgotModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" disabled={forgotLoading} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, cursor: forgotLoading ? 'not-allowed' : 'pointer' }}>
                          {forgotLoading ? 'Sending...' : 'Send OTP'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword}>
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>OTP</label>
                        <input
                          type="text" className="premium-input" placeholder="Enter 6-digit OTP"
                          value={forgotOtp} onChange={e => setForgotOtp(e.target.value)} autoFocus
                        />
                      </div>
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>NEW PASSWORD</label>
                        <input
                          type="password" className="premium-input" placeholder="••••••••"
                          value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button type="button" onClick={() => setForgotStep(1)} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#f1f5f9', color: '#475569', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Back</button>
                        <button type="submit" disabled={forgotLoading} style={{ flex: 1, padding: 12, borderRadius: 10, background: '#3b82f6', color: 'white', border: 'none', fontWeight: 600, cursor: forgotLoading ? 'not-allowed' : 'pointer' }}>
                          {forgotLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
