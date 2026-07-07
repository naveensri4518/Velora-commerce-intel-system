import { useState, useEffect } from 'react'
import { FileText, DollarSign, CreditCard, Smartphone, Banknote, RefreshCcw } from 'lucide-react'
import api from '../../api/axios'

export default function ShiftSummary() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSummary = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/invoices/shift-summary')
      setSummary(res.data)
    } catch (err) {
      setError('Failed to load shift summary.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading && !summary) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading summary...</div>
  }

  if (error) {
    return <div style={{ padding: 40, color: 'red' }}>{error}</div>
  }

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileText size={28} color="var(--color-accent)" /> End of Day Shift Summary
        </h1>
        <button className="btn btn-secondary btn-icon" onClick={fetchSummary} title="Refresh">
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="card" style={{ marginBottom: 24, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 24 }}>
          <div>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Staff Member</p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{summary?.staffName}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Date</p>
            <p style={{ fontSize: 20, fontWeight: 700 }}>{new Date(summary?.date).toLocaleDateString('en-IN', { dateStyle: 'full' })}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 }}>
          <div style={{ background: 'var(--color-bg)', padding: 24, borderRadius: 12 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Total Bills Generated</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-text-primary)' }}>{summary?.totalBills}</p>
          </div>
          <div style={{ background: 'var(--color-accent-light)', padding: 24, borderRadius: 12 }}>
            <p style={{ fontSize: 14, color: 'var(--color-accent)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>Total Revenue</p>
            <p style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-accent)' }}>{fmt(summary?.totalRevenue)}</p>
          </div>
        </div>

        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, borderBottom: '1px solid var(--color-border-light)', paddingBottom: 8 }}>Payment Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
          <div style={{ padding: 16, border: '1px solid var(--color-border-light)', borderRadius: 12, textAlign: 'center' }}>
            <Banknote size={24} color="#16a34a" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>CASH</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{fmt(summary?.cashTotal)}</p>
          </div>
          <div style={{ padding: 16, border: '1px solid var(--color-border-light)', borderRadius: 12, textAlign: 'center' }}>
            <Smartphone size={24} color="#2563eb" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>UPI</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{fmt(summary?.upiTotal)}</p>
          </div>
          <div style={{ padding: 16, border: '1px solid var(--color-border-light)', borderRadius: 12, textAlign: 'center' }}>
            <CreditCard size={24} color="#9333ea" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>CARD</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{fmt(summary?.cardTotal)}</p>
          </div>
          <div style={{ padding: 16, border: '1px solid var(--color-border-light)', borderRadius: 12, textAlign: 'center' }}>
            <DollarSign size={24} color="#475569" style={{ margin: '0 auto 8px' }} />
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>OTHER</p>
            <p style={{ fontSize: 18, fontWeight: 700 }}>{fmt(summary?.otherTotal)}</p>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.print()} style={{ padding: '12px 32px' }}>
          Print Summary Report
        </button>
      </div>
    </div>
  )
}
