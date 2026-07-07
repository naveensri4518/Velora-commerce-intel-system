import { useState, useEffect } from 'react'
import { Plus, Edit2, UserX, UserCheck, Key, X, Users, Trash2, CheckSquare } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

function StaffModal({ staff, onClose, onSave }) {
  const [form, setForm] = useState(staff || { username: '', email: '', password: '', fullName: '', phone: '', role: 'ROLE_STAFF', otp: '' })
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0) // 0: Details, 1: OTP
  const [timeLeft, setTimeLeft] = useState(120)
  
  const isEdit = !!staff?.id
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    if (step === 1 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [step, timeLeft])

  const handleSendOtp = async (e) => {
    e?.preventDefault()
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
    if (!passwordRegex.test(form.password)) {
      toast.error('Password must be at least 6 characters, with one uppercase, one lowercase, and one number')
      return
    }
    
    setSaving(true)
    try {
      await api.post('/staff/send-otp', { email: form.email })
      toast.success('OTP sent to ' + form.email)
      setStep(1)
      setTimeLeft(120)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP')
    } finally { setSaving(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEdit && step === 0) return handleSendOtp(e);
    if (!isEdit && step === 1 && !form.otp) {
      toast.error('Please enter the OTP')
      return
    }

    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/staff/${staff.id}`, form)
        toast.success('Staff updated')
      } else {
        await api.post('/staff', form)
        toast.success('Staff created')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally { setSaving(false) }
  }

  const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Staff' : (step === 0 ? 'Add Staff' : 'Verify Email')}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {step === 0 ? (
              <div className="form-grid">
                <div className="form-group full">
                  <label>Full Name *</label>
                  <input value={form.fullName} onChange={e => set('fullName', e.target.value)} required placeholder="John Doe" />
                </div>
                {!isEdit && (
                  <div className="form-group full">
                    <label>Username *</label>
                    <input value={form.username} onChange={e => set('username', e.target.value)} required placeholder="johndoe" />
                  </div>
                )}
                <div className="form-group full">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="john@store.com" />
                </div>
                <div className="form-group full">
                  <label>Phone</label>
                  <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
                {!isEdit && (
                  <div className="form-group full">
                    <label>Password *</label>
                    <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Min 6 characters" />
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ marginBottom: 24, color: 'var(--color-text-secondary)' }}>
                  We've sent a 6-digit OTP to <strong>{form.email}</strong>.<br/>
                  Please ask the staff member for the OTP and enter it below.
                </p>
                <div className="form-group" style={{ maxWidth: 200, margin: '0 auto 16px' }}>
                  <input 
                    type="text" 
                    value={form.otp} 
                    onChange={e => set('otp', e.target.value)} 
                    placeholder="Enter 6-digit OTP" 
                    maxLength={6}
                    required 
                    style={{ textAlign: 'center', fontSize: 20, letterSpacing: 4 }}
                  />
                </div>
                {timeLeft > 0 ? (
                  <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)' }}>
                    OTP expires in {formatTime(timeLeft)}
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: 'var(--color-danger)' }}>
                    OTP has expired. <a href="#" onClick={(e) => { e.preventDefault(); handleSendOtp(); }}>Resend OTP</a>
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            {step === 1 && (
              <button type="button" className="btn btn-ghost" style={{ marginRight: 'auto' }} onClick={() => setStep(0)}>
                Back
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || (step === 1 && form.otp.length < 6)}>
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : (step === 0 ? 'Send OTP' : 'Verify & Create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function StaffManagement() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [resetModal, setResetModal] = useState(null)
  const [newPassword, setNewPassword] = useState('')

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get('/staff')
      setStaff(res.data.content || res.data || [])
    } catch { toast.error('Failed to load staff') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line
  useEffect(() => { fetchStaff() }, [])

  const toggleActive = async (s) => {
    try {
      await api.put(`/staff/${s.id}/deactivate`)
      toast.success(s.active ? 'Staff deactivated' : 'Staff activated')
      fetchStaff()
    } catch { toast.error('Failed to update status') }
  }

  const resetPassword = async () => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/
    if (!passwordRegex.test(newPassword)) {
      toast.error('Password must be at least 6 characters, with one uppercase, one lowercase, and one number')
      return
    }
    try {
      await api.put(`/staff/${resetModal.id}/reset-password`, { newPassword })
      toast.success('Password reset successfully')
      setResetModal(null)
      setNewPassword('')
    } catch { toast.error('Failed to reset password') }
  }

  const approvePasswordReset = async (s) => {
    try {
      await api.put(`/staff/${s.id}/approve-password-reset`)
      toast.success('Password reset approved successfully')
      fetchStaff()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve password reset')
    }
  }

  const deleteStaff = async (s) => {
    if (!window.confirm(`Are you sure you want to delete ${s.fullName}?`)) return;
    try {
      await api.delete(`/staff/${s.id}`)
      toast.success('Staff deleted successfully')
      fetchStaff()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete staff. They might have associated records.')
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Staff Management</div>
          <div className="page-subtitle">{staff.length} team members</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}>{Array(7).fill(0).map((_, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>
                  ))}</tr>
                ))
              ) : staff.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                  <Users size={32} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                  <p>No staff members yet</p>
                </td></tr>
              ) : (
                staff.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%',
                          background: 'var(--color-accent-light)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>
                          {s.fullName?.charAt(0)}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{s.fullName}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{s.username}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.email}
                        {s.hasPendingPasswordReset && (
                          <span className="badge badge-warning" style={{ fontSize: 10, padding: '2px 6px' }} title="User requested password reset">
                            Reset Pending
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{s.phone || '—'}</td>
                    <td>
                      <span className={`badge ${s.role === 'ROLE_ADMIN' ? 'badge-info' : 'badge-neutral'}`}>
                        {s.role === 'ROLE_ADMIN' ? 'Admin' : 'Staff'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${s.active ? 'badge-success' : 'badge-danger'}`}>
                        {s.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit" onClick={() => setModal({ staff: s })}>
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-icon btn-sm"
                          style={{ background: s.active ? 'var(--color-danger-bg)' : 'var(--color-success-bg)',
                            color: s.active ? 'var(--color-danger)' : 'var(--color-success)', border: 'none' }}
                          title={s.active ? 'Deactivate' : 'Activate'}
                          onClick={() => toggleActive(s)}>
                          {s.active ? <UserX size={15} /> : <UserCheck size={15} />}
                        </button>
                        {s.hasPendingPasswordReset && (
                          <button className="btn btn-icon btn-sm"
                            style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', border: 'none' }}
                            title="Approve Password Reset" onClick={() => approvePasswordReset(s)}>
                            <CheckSquare size={15} />
                          </button>
                        )}
                        <button className="btn btn-icon btn-sm"
                          style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)', border: 'none' }}
                          title="Reset Password" onClick={() => setResetModal(s)}>
                          <Key size={15} />
                        </button>
                        <button className="btn btn-icon btn-sm"
                          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'none' }}
                          title="Delete" onClick={() => deleteStaff(s)}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal !== null && (
        <StaffModal staff={modal.staff} onClose={() => setModal(null)} onSave={() => { setModal(null); fetchStaff() }} />
      )}

      {resetModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Reset Password</h3>
              <button className="btn-icon btn-ghost" onClick={() => setResetModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: 16 }}>Set a new password for <strong>{resetModal.fullName}</strong></p>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)" />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setResetModal(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={resetPassword}>Reset Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
