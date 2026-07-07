import { useState, useEffect } from 'react'
import { Undo2, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import api from '../../api/axios'

export default function Returns() {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoice, setInvoice] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [refunding, setRefunding] = useState(false)
  const [success, setSuccess] = useState('')
  const [recentInvoices, setRecentInvoices] = useState([])

  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    fetchRecent()
  }, [])

  const fetchRecent = async () => {
    try {
      const res = await api.get('/invoices?size=5')
      setRecentInvoices(res.data.content || [])
    } catch (err) {
      console.error("Failed to fetch recent invoices", err)
    }
  }

  const fetchInvoiceDetails = async (num) => {
    setLoading(true)
    setError('')
    setSuccess('')
    setInvoice(null)

    try {
      const res = await api.get(`/invoices?search=${num.trim()}`)
      if (res.data.content && res.data.content.length > 0) {
        // Fetch full invoice details by ID to get items
        const invDetails = await api.get(`/invoices/${res.data.content[0].id}`)
        setInvoice(invDetails.data)
        setInvoiceNumber(num)
      } else {
        setError('Invoice not found.')
      }
    } catch (err) {
      setError('Error fetching invoice.')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e?.preventDefault()
    if (!invoiceNumber.trim()) return
    fetchInvoiceDetails(invoiceNumber)
  }

  const handleRefund = async () => {
    setShowConfirm(false)
    setRefunding(true)
    setError('')
    
    try {
      await api.post(`/invoices/${invoice.id}/refund`)
      setSuccess(`Successfully refunded ${invoice.invoiceNumber}. Stock has been updated.`)
      setInvoice(prev => ({ ...prev, status: 'REFUNDED' }))
    } catch (err) {
      setError(err.response?.data?.message || 'Error processing refund.')
    } finally {
      setRefunding(false)
    }
  }

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div style={{ padding: '32px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Undo2 size={28} color="var(--color-accent)" /> Returns & Refunds
      </h1>

      <div className="card" style={{ marginBottom: 32 }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
          <input
            type="text"
            placeholder="Enter Invoice Number (e.g. INV-2026-000001)"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            style={{ flex: 1, fontSize: 16, padding: '16px', borderRadius: 12 }}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 32px', fontSize: 16 }} disabled={loading}>
            {loading ? 'Searching...' : 'Find Bill'}
          </button>
        </form>
      </div>

      {error && (
        <div style={{ padding: '24px', background: '#fee2e2', color: '#991b1b', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, fontWeight: 600, marginBottom: 32 }}>
          <AlertCircle size={24} /> {error}
        </div>
      )}

      {success && (
        <div style={{ padding: '24px', background: '#dcfce7', color: '#166534', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, fontSize: 16, fontWeight: 600, marginBottom: 32 }}>
          <CheckCircle size={24} /> {success}
        </div>
      )}

      {!invoice && !loading && recentInvoices.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={20} color="var(--color-text-secondary)" /> Recent Bills
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {recentInvoices.map((inv) => (
              <div 
                key={inv.id} 
                onClick={() => fetchInvoiceDetails(inv.invoiceNumber)}
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '16px', background: 'var(--color-bg)', borderRadius: 12, 
                  cursor: 'pointer', transition: 'transform 0.1s, box-shadow 0.1s' 
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-accent)' }}>{inv.invoiceNumber}</h3>
                  <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                    {new Date(inv.createdAt).toLocaleString()}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(inv.total)}</div>
                  <div style={{ 
                    fontSize: 12, fontWeight: 600, marginTop: 4,
                    color: inv.status === 'REFUNDED' ? '#991b1b' : '#166534'
                  }}>
                    {inv.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {invoice && (
        <div className="card" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800 }}>Invoice {invoice.invoiceNumber}</h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 14 }}>
                {new Date(invoice.createdAt).toLocaleString()}
              </p>
            </div>
            <div style={{ 
              padding: '6px 12px', borderRadius: 20, fontSize: 13, fontWeight: 700,
              background: invoice.status === 'REFUNDED' ? '#fee2e2' : '#dcfce7',
              color: invoice.status === 'REFUNDED' ? '#991b1b' : '#166534'
            }}>
              {invoice.status}
            </div>
          </div>

          <table className="table" style={{ marginBottom: 24 }}>
            <thead>
              <tr>
                <th>Product</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{item.productName}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{item.productBarcode}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{fmt(item.unitPrice)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600 }}>{fmt(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', background: 'var(--color-bg)', borderRadius: 12 }}>
            <div>
              <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Total Amount</p>
              <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--color-accent)' }}>{fmt(invoice.total)}</p>
            </div>
            
            {invoice.status === 'COMPLETED' && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '16px 32px', fontSize: 16, background: 'var(--color-danger)' }}
                onClick={() => setShowConfirm(true)}
                disabled={refunding}
              >
                {refunding ? 'Processing...' : 'Process Full Refund'}
              </button>
            )}
          </div>
          
          {showConfirm && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
              <div style={{ background: 'white', padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <AlertCircle size={28} color="var(--color-danger)" />
                  <h3 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>Confirm Refund</h3>
                </div>
                <p style={{ fontSize: '15px', color: 'var(--color-text-secondary)', lineHeight: '1.5', marginBottom: '24px' }}>
                  Are you sure you want to process a full refund for invoice <strong>{invoice.invoiceNumber}</strong>? This action will add the stock back to the inventory.
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button 
                    className="btn" 
                    onClick={() => setShowConfirm(false)}
                    style={{ background: 'var(--color-border)', color: 'var(--color-text)', padding: '10px 24px' }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleRefund}
                    style={{ background: 'var(--color-danger)', padding: '10px 24px' }}
                  >
                    Yes, Refund
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
