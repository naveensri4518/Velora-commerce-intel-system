import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

const Section = ({ title, children }) => (
  <div className="card" style={{ marginBottom: 24 }}>
    <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{title}</h3>
    <div className="form-grid">{children}</div>
  </div>
)

const Field = ({ label, id, ...rest }) => (
  <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <input id={id} {...rest} />
  </div>
)

export default function Settings() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/settings').then(res => {
      const map = {}
      ;(res.data || []).forEach(s => { map[s.settingKey] = s.settingValue })
      setSettings(map)
    }).catch(() => toast.error('Failed to load settings'))
    .finally(() => setLoading(false))
  }, [])

  const set = (key, val) => setSettings(s => ({ ...s, [key]: val }))

  const save = async () => {
    setSaving(true)
    try {
      await api.put('/settings/bulk', settings)
      toast.success('Settings saved successfully')
    } catch { toast.error('Failed to save settings') }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ padding: 48, textAlign: 'center' }}><div className="loading-spinner" /></div>

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-subtitle">Store configuration and preferences</div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          <Save size={15} /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <Section title="Store Information">
        <Field label="Store Name" id="store_name" value={settings.store_name || ''}
          onChange={e => set('store_name', e.target.value)} placeholder="My Retail Store" />
        <Field label="Store Phone" id="store_phone" value={settings.store_phone || ''}
          onChange={e => set('store_phone', e.target.value)} placeholder="+91 98765 43210" />
        <Field label="Store Email" id="store_email" value={settings.store_email || ''}
          onChange={e => set('store_email', e.target.value)} placeholder="contact@store.com" />
        <div className="form-group full">
          <label>Store Address</label>
          <textarea value={settings.store_address || ''} rows={2}
            onChange={e => set('store_address', e.target.value)}
            placeholder="Full store address" />
        </div>
      </Section>

      <Section title="Tax & Billing">
        <Field label="GST Rate (%)" id="gst_rate" type="number" value={settings.gst_rate || '18'}
          onChange={e => set('gst_rate', e.target.value)} placeholder="18" />
        <Field label="Currency Symbol" id="currency_symbol" value={settings.currency_symbol || '₹'}
          onChange={e => set('currency_symbol', e.target.value)} placeholder="₹" />
        <Field label="Invoice Prefix" id="invoice_prefix" value={settings.invoice_prefix || 'INV'}
          onChange={e => set('invoice_prefix', e.target.value)} placeholder="INV" />
        <div className="form-group full">
          <label>Invoice Footer Message</label>
          <textarea value={settings.invoice_footer || ''} rows={2}
            onChange={e => set('invoice_footer', e.target.value)}
            placeholder="Thank you for shopping with us!" />
        </div>
      </Section>

      <Section title="System Preferences">
        <div className="form-group">
          <label>Timezone</label>
          <select value={settings.timezone || 'Asia/Kolkata'}
            onChange={e => set('timezone', e.target.value)}>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
          </select>
        </div>
        <div className="form-group">
          <label>Low Stock Alert</label>
          <select value={settings.low_stock_alert || 'true'}
            onChange={e => set('low_stock_alert', e.target.value)}>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </Section>
    </div>
  )
}
