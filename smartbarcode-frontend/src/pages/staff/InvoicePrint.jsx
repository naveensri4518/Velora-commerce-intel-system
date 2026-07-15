import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Printer, ArrowLeft, ScanBarcode } from 'lucide-react'
import api from '../../api/axios'
import { useSettings } from '../../context/SettingsContext'
import toast from 'react-hot-toast'

export default function InvoicePrint() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { settings } = useSettings()
  const currency = settings?.currency_symbol || '₹'
  const [invoice, setInvoice] = useState(null)
  const [localSettings, setLocalSettings] = useState(settings || {})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const invRes = await api.get(`/invoices/${id}`)
        setInvoice(invRes.data)
      } catch {
        toast.error('Failed to load invoice')
        setLoading(false)
        return
      }

      try {
        const settRes = await api.get('/settings')
        const map = {}
        ;(settRes.data || []).forEach(s => { map[s.settingKey] = s.settingValue })
        setLocalSettings(map)
      } catch {
        // use context defaults silently
      }

      setLoading(false)
    }
    fetchData()
  }, [id])

  const fmt = (n) => currency + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })
  const fmtDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <div className="loading-spinner" style={{ width: 36, height: 36 }} />
    </div>
  }

  if (!invoice) {
    return <div style={{ textAlign: 'center', padding: 48 }}>Invoice not found</div>
  }

  return (
    <div>
      {/* Action Bar - hidden on print */}
      <div className="no-print" style={{
        background: 'white', borderBottom: '1px solid var(--color-border-light)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 12
      }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} /> Back
        </button>
        <h1 style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Invoice — {invoice.invoiceNumber}</h1>
        <button className="btn btn-primary" onClick={() => window.print()}>
          <Printer size={15} /> Print / Save PDF
        </button>
      </div>

      {/* Invoice A4 */}
      <div style={{
        maxWidth: 720, margin: '24px auto', background: 'white', color: '#1d1d1f',
        boxShadow: 'var(--shadow-lg)', borderRadius: 12,
        padding: '40px 48px', fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, background: '#0071e3', borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ScanBarcode size={20} color="white" />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1d1d1f' }}>
                {localSettings.store_name || 'Velora Retail'}
              </h2>
            </div>
            <p style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.6 }}>
              {localSettings.store_address || ''}<br />
              {localSettings.store_phone || ''} {localSettings.store_email ? `· ${localSettings.store_email}` : ''}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0071e3', letterSpacing: '-0.03em' }}>INVOICE</h1>
            <p style={{ fontSize: 14, fontWeight: 700, fontFamily: 'monospace', color: '#1d1d1f', marginTop: 4 }}>
              {invoice.invoiceNumber}
            </p>
            <p style={{ fontSize: 12, color: '#6e6e73', marginTop: 4 }}>{fmtDate(invoice.createdAt)}</p>
          </div>
        </div>

        {/* Customer + Staff */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32,
          padding: '16px 20px', background: '#f5f5f7', borderRadius: 10 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Billed To
            </p>
            <p style={{ fontWeight: 700, fontSize: 15 }}>{invoice.customerName || 'Walk-in Customer'}</p>
            {invoice.customerPhone && <p style={{ fontSize: 13, color: '#6e6e73' }}>{invoice.customerPhone}</p>}
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#aeaeb2', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
              Served By
            </p>
            <p style={{ fontWeight: 700, fontSize: 15 }}>{invoice.createdBy?.fullName}</p>
            <p style={{ fontSize: 13, color: '#6e6e73' }}>Payment: {invoice.paymentMethod}</p>
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #1d1d1f' }}>
              <th style={{ textAlign: 'left', padding: '8px 0', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6e6e73' }}>Product</th>
              <th style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6e6e73' }}>Qty</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6e6e73' }}>Unit Price</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6e6e73' }}>GST</th>
              <th style={{ textAlign: 'right', padding: '8px 0', fontSize: 11, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6e6e73' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #e8e8ed' }}>
                <td style={{ padding: '12px 0', color: '#1d1d1f' }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{item.productName}</div>
                  <div style={{ fontSize: 11, color: '#aeaeb2', fontFamily: 'monospace' }}>{item.productBarcode}</div>
                </td>
                <td style={{ textAlign: 'center', padding: '12px 0', fontWeight: 700, color: '#1d1d1f' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right', padding: '12px 0', fontSize: 13, color: '#1d1d1f' }}>{fmt(item.unitPrice)}</td>
                <td style={{ textAlign: 'right', padding: '12px 0', fontSize: 13, color: '#1d1d1f' }}>{item.taxRate || 0}%</td>
                <td style={{ textAlign: 'right', padding: '12px 0', fontWeight: 700, color: '#1d1d1f' }}>{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ width: 280 }}>
            {[
              ['Subtotal', fmt(invoice.subtotal)],
              invoice.discountAmount > 0 ? [`Discount (${invoice.discountType})`, `−${fmt(invoice.discountAmount)}`] : null,
              [`Total GST`, fmt(invoice.taxAmount)],
            ].filter(Boolean).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between',
                padding: '6px 0', fontSize: 13, borderBottom: '1px solid #e8e8ed' }}>
                <span style={{ color: '#6e6e73' }}>{label}</span>
                <span>{value}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0',
              borderTop: '2px solid #1d1d1f', marginTop: 4 }}>
              <span style={{ fontSize: 17, fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: '#0071e3' }}>{fmt(invoice.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, padding: '16px 20px', background: '#f5f5f7', borderRadius: 10, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1d1d1f' }}>
            {localSettings.invoice_footer || 'Thank you for shopping with us! Visit again.'}
          </p>
          <p style={{ fontSize: 11, color: '#aeaeb2', marginTop: 6 }}>
            Invoice generated by Velora · {localSettings.store_name || 'Enterprise Retail Platform'}
          </p>
        </div>
      </div>
    </div>
  )
}
