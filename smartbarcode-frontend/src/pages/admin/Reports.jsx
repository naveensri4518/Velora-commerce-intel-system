import { useState, useEffect } from 'react'
import { BarChart3, Download, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import * as XLSX from 'xlsx'
import api from '../../api/axios'
import toast from 'react-hot-toast'

export default function Reports() {
  const [data, setData] = useState([])
  const [period, setPeriod] = useState('daily')
  const [loading, setLoading] = useState(false)
  const [lowStock, setLowStock] = useState([])

  const fetchReport = async () => {
    setLoading(true)
    try {
      let res, formatted
      if (period === 'daily') {
        res = await api.get('/dashboard/sales/daily?days=30')
        formatted = (res.data || []).map(row => ({
          label: new Date(row[0]).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          Revenue: Number(row[1] || 0),
          Orders: Number(row[2] || 0),
        }))
      } else {
        res = await api.get('/dashboard/sales/monthly?months=12')
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        formatted = (res.data || []).map(row => ({
          label: months[Number(row[0]) - 1] + ' ' + row[1],
          Revenue: Number(row[2] || 0),
          Orders: Number(row[3] || 0),
        }))
      }
      setData(formatted)

      const lowRes = await api.get('/products/low-stock')
      setLowStock(lowRes.data || [])
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }

  // eslint-disable-next-line
  useEffect(() => { fetchReport() }, [period])

  const exportExcel = () => {
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data.map(d => ({
      'Period': d.label,
      'Revenue (₹)': d.Revenue,
      'Orders': d.Orders,
    })))
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Report')
    if (lowStock.length > 0) {
      const wsLow = XLSX.utils.json_to_sheet(lowStock.map(p => ({
        'Product': p.name,
        'Barcode': p.barcode,
        'Current Stock': p.currentStock,
        'Min Stock': p.minStockLevel,
        'Selling Price': p.sellingPrice,
      })))
      XLSX.utils.book_append_sheet(wb, wsLow, 'Low Stock')
    }
    XLSX.writeFile(wb, `SmartBarcode_Report_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Report exported to Excel')
  }

  const totalRevenue = data.reduce((s, d) => s + d.Revenue, 0)
  const totalOrders = data.reduce((s, d) => s + d.Orders, 0)
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Reports & Analytics</div>
          <div className="page-subtitle">Sales performance and inventory reports</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Download size={15} /> Print PDF
          </button>
          <button className="btn btn-primary" onClick={exportExcel}>
            <Download size={15} /> Export Excel
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['daily', 'monthly'].map(p => (
          <button key={p} className={`btn ${period === p ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setPeriod(p)}>
            {p === 'daily' ? 'Daily (30 days)' : 'Monthly (12 months)'}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-accent-light)' }}>
            <TrendingUp size={20} color="var(--color-accent)" />
          </div>
          <div className="stat-value">₹{totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-success-bg)' }}>
            <BarChart3 size={20} color="var(--color-success)" />
          </div>
          <div className="stat-value">{totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fff8eb' }}>
            <TrendingUp size={20} color="var(--color-warning)" />
          </div>
          <div className="stat-value">₹{avgOrderValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
          <div className="stat-label">Avg Order Value</div>
        </div>
      </div>

      {/* Chart */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 20 }}>Sales Revenue Trend</h3>
        {loading ? (
          <div className="skeleton" style={{ height: 280, borderRadius: 10 }} />
        ) : data.length === 0 ? (
          <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-text-tertiary)', flexDirection: 'column', gap: 8 }}>
            <BarChart3 size={36} />
            <p>No sales data available</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barSize={period === 'daily' ? 14 : 36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#6e6e73' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6e6e73' }} />
              <Tooltip formatter={(val, name) => [name === 'Revenue' ? '₹' + val.toLocaleString('en-IN') : val, name]} />
              <Bar dataKey="Revenue" fill="#0071e3" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Low Stock Report */}
      {lowStock.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>Low Stock Report</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Barcode</th>
                  <th>Current Stock</th>
                  <th>Min Level</th>
                  <th>Deficit</th>
                  <th>Selling Price</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.barcode}</td>
                    <td><span style={{ fontWeight: 700, color: 'var(--color-danger)' }}>{p.currentStock}</span></td>
                    <td>{p.minStockLevel}</td>
                    <td style={{ color: 'var(--color-warning)', fontWeight: 600 }}>
                      {p.minStockLevel - p.currentStock} needed
                    </td>
                    <td>₹{Number(p.sellingPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
