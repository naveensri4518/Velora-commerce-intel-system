import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts'
import {
  Package, TrendingUp, Warehouse, AlertTriangle,
  XCircle, DollarSign, BarChart3, FileText, Users,
  RefreshCw, ArrowUpRight
} from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, color, bg, gradient, trend }) {
  const isGradient = !!gradient;
  return (
    <div className={`stat-card animate-fade-in ${isGradient ? 'gradient-card' : ''}`} style={isGradient ? { background: gradient } : {}}>
      <div className="stat-icon" style={isGradient ? { background: 'rgba(255,255,255,0.2)' } : { background: bg }}>
        <Icon size={24} color={isGradient ? 'white' : color} />
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {trend && (
        <div style={{ fontSize: 11, color: isGradient ? 'rgba(255,255,255,0.9)' : 'var(--color-success)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
          <ArrowUpRight size={12} /> {trend}
        </div>
      )}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{
        background: 'white', border: '1px solid var(--color-border-light)',
        borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow-md)',
        fontSize: 13
      }}>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: {p.name === 'Revenue' ? '₹' + Number(p.value).toLocaleString() : p.value}
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [dailySales, setDailySales] = useState([])
  const [monthlySales, setMonthlySales] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, dailyRes, monthlyRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/sales/daily?days=14'),
        api.get('/dashboard/sales/monthly?months=6'),
      ])
      setStats(statsRes.data)

      // Format daily sales
      const daily = (dailyRes.data || []).map(row => ({
        date: new Date(row[0]).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        Revenue: Number(row[1] || 0),
        Orders: Number(row[2] || 0),
      }))
      setDailySales(daily)

      // Format monthly
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const monthly = (monthlyRes.data || []).map(row => ({
        month: months[Number(row[0]) - 1],
        Revenue: Number(row[2] || 0),
        Orders: Number(row[3] || 0),
      }))
      setMonthlySales(monthly)
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error('Failed to load dashboard data: ' + (err.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const fmt = (n) => n !== undefined && n !== null ? Number(n).toLocaleString('en-IN') : '—'
  const fmtCurrency = (n) => n !== undefined && n !== null ? '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '₹0'

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div>
            <div className="page-title">Dashboard</div>
            <div className="page-subtitle">Loading your store overview...</div>
          </div>
        </div>
        <div className="stats-grid">
          {Array(9).fill(0).map((_, i) => (
            <div key={i} className="stat-card">
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 16 }} />
              <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: '80%', height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Real-time overview of your store performance</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={fetchData}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard icon={DollarSign} label="Today's Revenue" value={fmtCurrency(stats?.todayRevenue)}
          color="var(--color-success)" bg="var(--color-success-bg)" />
        <StatCard icon={BarChart3} label="Monthly Revenue" value={fmtCurrency(stats?.monthlyRevenue)}
          color="var(--color-accent)" bg="var(--color-accent-light)" />
        <StatCard icon={TrendingUp} label="Inventory Value" value={fmtCurrency(stats?.totalInventoryValue)}
          color="var(--color-warning)" bg="var(--color-warning-bg)" />
          
        <StatCard icon={Package} label="Total Products" value={fmt(stats?.totalProducts)}
          color="var(--color-accent)" bg="var(--color-accent-light)" />
        <StatCard icon={Warehouse} label="Total Stock" value={fmt(stats?.totalStock)}
          color="var(--color-success)" bg="var(--color-success-bg)" />
        <StatCard icon={AlertTriangle} label="Low Stock" value={fmt(stats?.lowStockProducts)}
          color="var(--color-warning)" bg="var(--color-warning-bg)" />
        <StatCard icon={XCircle} label="Out of Stock" value={fmt(stats?.outOfStockProducts)}
          color="var(--color-danger)" bg="var(--color-danger-bg)" />
        <StatCard icon={FileText} label="Total Invoices" value={fmt(stats?.totalInvoices)}
          color="#8b5cf6" bg="#f5f3ff" />
        <StatCard icon={Users} label="Active Staff" value={fmt(stats?.activeStaff)}
          color="#ec4899" bg="#fdf2f8" />
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

        {/* Daily Sales */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700 }}>Daily Revenue</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Last 14 days</p>
            </div>
            <span className="badge badge-success">Live</span>
          </div>
          {dailySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={dailySales}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6e6e73' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6e6e73' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="var(--color-accent)" strokeWidth={3}
                  fill="url(#revenueGrad)" name="Revenue" activeDot={{ r: 6, fill: "var(--color-accent)", stroke: "white", strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-tertiary)', flexDirection: 'column', gap: 8 }}>
              <BarChart3 size={32} />
              <p>No sales data yet</p>
            </div>
          )}
        </div>

        {/* Monthly Revenue */}
        <div className="card">
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700 }}>Monthly Revenue</h3>
            <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Last 6 months</p>
          </div>
          {monthlySales.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlySales} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f5" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6e6e73' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6e6e73' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Revenue" fill="url(#revenueGrad)" radius={[8, 8, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-tertiary)', flexDirection: 'column', gap: 8 }}>
              <BarChart3 size={32} />
              <p>No monthly data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Alert Cards */}
      {(stats?.lowStockProducts > 0 || stats?.outOfStockProducts > 0) && (
        <div className="card" style={{ borderLeft: '4px solid var(--color-warning)', background: 'var(--color-warning-bg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={20} color="var(--color-warning)" />
            <div>
              <strong style={{ fontSize: 14 }}>Inventory Alert</strong>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                {stats.lowStockProducts} products are running low on stock.
                {stats.outOfStockProducts > 0 && ` ${stats.outOfStockProducts} products are out of stock.`}
                {' '}Visit Products to restock.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
