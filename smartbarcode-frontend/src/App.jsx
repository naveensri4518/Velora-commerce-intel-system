import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import ProtectedRoute from './router/ProtectedRoute'
import AdminRoute from './router/AdminRoute'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import Dashboard from './pages/admin/Dashboard'
import Products from './pages/admin/Products'
import Inventory from './pages/admin/Inventory'
import StaffManagement from './pages/admin/StaffManagement'
import InvoiceHistory from './pages/admin/InvoiceHistory'
import Reports from './pages/admin/Reports'
import Settings from './pages/admin/Settings'
import AuditLogs from './pages/admin/AuditLogs'
import BillingPage from './pages/staff/BillingPage'
import InvoicePrint from './pages/staff/InvoicePrint'
import PriceCheck from './pages/staff/PriceCheck'
import Returns from './pages/staff/Returns'
import ShiftSummary from './pages/staff/ShiftSummary'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="products" element={<AdminRoute><Products /></AdminRoute>} />
            <Route path="inventory" element={<AdminRoute><Inventory /></AdminRoute>} />
            <Route path="staff" element={<AdminRoute><StaffManagement /></AdminRoute>} />
            <Route path="invoices" element={<AdminRoute><InvoiceHistory /></AdminRoute>} />
            <Route path="reports" element={<AdminRoute><Reports /></AdminRoute>} />
            <Route path="settings" element={<AdminRoute><Settings /></AdminRoute>} />
            <Route path="audit-logs" element={<AdminRoute><AuditLogs /></AdminRoute>} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="price-check" element={<PriceCheck />} />
            <Route path="returns" element={<Returns />} />
            <Route path="shift-summary" element={<ShiftSummary />} />
            <Route path="invoice/:id" element={<InvoicePrint />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  )
}
