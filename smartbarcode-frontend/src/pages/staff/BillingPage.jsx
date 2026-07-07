import { useState, useEffect, useRef } from 'react'
import {
  ScanBarcode, Camera, Plus, Minus, Trash2, ShoppingCart,
  User, Tag, CreditCard, CheckCircle, X, Loader, Sparkles
} from 'lucide-react'
import { useCart } from '../../context/CartContext'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

// Camera Scanner using html5-qrcode (better for laptop webcams)
function CameraScanner({ onDetect, onClose }) {
  const [error, setError] = useState(null)

  useEffect(() => {
    let scanner
    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        scanner = new Html5Qrcode('camera-reader')
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 300, height: 150 }, // Rectangular box for barcodes
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true
            }
          },
          (decodedText) => {
            if (scanner.isScanning) {
              scanner.stop().then(() => onDetect(decodedText)).catch(() => onDetect(decodedText))
            }
          },
          () => {} // Ignore frame errors
        )
      } catch (err) {
        console.error("Camera error:", err)
        setError('Camera access denied or not found. Please check permissions.')
      }
    }
    
    // Give the DOM a moment to render the div before starting
    const timeout = setTimeout(startCamera, 100)

    return () => {
      clearTimeout(timeout)
      try {
        if (scanner && scanner.isScanning) scanner.stop()
      } catch (e) {
        // ignore
      }
    }
  }, [onDetect])

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Camera size={20} /> Camera Scanner
          </h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          {error ? (
            <div style={{ padding: 32, color: 'var(--color-danger)' }}>{error}</div>
          ) : (
            <>
              <div id="camera-reader" style={{ width: '100%', borderRadius: 12, overflow: 'hidden' }}></div>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 12 }}>
                Point camera at barcode. Ensure it fills the highlighted box.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function BillingPage() {
  const {
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    discount, setDiscount, taxRate,
    paymentMethod, setPaymentMethod,
    customer, setCustomer,
    subtotal, discountAmount, taxAmount, total,
    heldBills, holdCart, resumeCart
  } = useCart()

  const [barcodeInput, setBarcodeInput] = useState('')
  const [scanning, setScanning] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [lastInvoice, setLastInvoice] = useState(null)
  
  // Autocomplete state
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const barcodeRef = useRef(null)

  const [aiRecommendations, setAiRecommendations] = useState([])
  const [loadingAi, setLoadingAi] = useState(false)

  // Fetch AI Recommendations when cart changes
  useEffect(() => {
    if (cart.length === 0) {
      setAiRecommendations([])
      return
    }
    const fetchRecommendations = async () => {
      setLoadingAi(true)
      try {
        const itemNames = cart.map(item => item.name)
        const res = await api.post('/ai/recommendations', { items: itemNames })
        if (res.data.recommendations) {
          const recs = res.data.recommendations.split(',').map(s => s.trim()).filter(Boolean)
          setAiRecommendations(recs)
        }
      } catch (err) {
        console.error('Failed to get AI recommendations', err)
      } finally {
        setLoadingAi(false)
      }
    }
    
    // Debounce AI call by 1 second to avoid spamming the API while scanning
    const timeoutId = setTimeout(fetchRecommendations, 1000)
    return () => clearTimeout(timeoutId)
  }, [cart])

  const navigate = useNavigate()

  // Focus barcode input only when page loads — NOT on every click
  // This allows customer name, discount, etc. inputs to work normally
  useEffect(() => {
    if (barcodeRef.current) barcodeRef.current.focus()
  }, [])

  // Fetch suggestions with debounce
  useEffect(() => {
    if (!barcodeInput.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true)
      try {
        const res = await api.get('/products', {
          params: { search: barcodeInput.trim(), size: 5 }
        })
        setSuggestions(res.data.content || [])
        setShowSuggestions(true)
        setSelectedIndex(-1)
      } catch (err) {
        console.error("Error fetching suggestions", err)
      } finally {
        setLoadingSuggestions(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [barcodeInput])

  // Handle USB scanner and keyboard navigation
  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (showSuggestions && suggestions.length > 0) {
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev))
      }
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (showSuggestions && selectedIndex >= 0 && selectedIndex < suggestions.length) {
        const selected = suggestions[selectedIndex]
        addToCart(selected)
        setBarcodeInput('')
        setShowSuggestions(false)
        setSelectedIndex(-1)
        toast.success(`Added: ${selected.name}`, { duration: 1500, position: 'bottom-right' })
      } else {
        scanBarcode()
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const scanBarcode = async (code) => {
    const barcode = (code || barcodeInput).trim()
    if (!barcode) return

    // If there are search suggestions visible and the user hits Add or Enter, add the first matching product
    if (!code && showSuggestions && suggestions.length > 0) {
      const selected = suggestions[selectedIndex >= 0 ? selectedIndex : 0]
      addToCart(selected)
      setBarcodeInput('')
      setShowSuggestions(false)
      setSelectedIndex(-1)
      toast.success(`Added: ${selected.name}`, { duration: 1500, position: 'bottom-right' })
      if (barcodeRef.current) barcodeRef.current.focus()
      return
    }

    setScanning(true)
    try {
      const res = await api.get(`/products/barcode/${encodeURIComponent(barcode)}`)
      addToCart(res.data)
      setBarcodeInput('')
      setShowSuggestions(false)
      toast.success(`Added: ${res.data.name}`, { duration: 1500, position: 'bottom-right' })
    } catch (err) {
      toast.error(err.response?.data?.message || `Product not found: ${barcode}`)
      setBarcodeInput('')
      setShowSuggestions(false)
    } finally {
      setScanning(false)
      if (barcodeRef.current) barcodeRef.current.focus()
    }
  }

  const handleCameraDetect = (barcode) => {
    setShowCamera(false)
    scanBarcode(barcode)
  }

  const generateBill = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return }
    setGenerating(true)
    try {
      const payload = {
        customerName: customer.name?.trim() || null,
        customerPhone: customer.phone?.trim() || null,
        items: cart.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        discountType: discount.type,
        discountValue: Number(discount.value) || 0,
        taxRate: Number(taxRate),
        paymentMethod: paymentMethod,
      }
      const res = await api.post('/invoices/generate', payload)
      setLastInvoice(res.data)
      clearCart()
      toast.success(`Invoice ${res.data.invoiceNumber} generated!`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate invoice')
    } finally {
      setGenerating(false)
    }
  }

  const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  // Success screen after bill generation
  if (lastInvoice) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--color-bg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24
      }}>
        <div className="card animate-fade-in" style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: 48 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--color-success-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px'
          }}>
            <CheckCircle size={36} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Invoice Generated!</h2>
          <p style={{ fontSize: 15, color: 'var(--color-accent)', fontFamily: 'monospace', fontWeight: 700, marginBottom: 4 }}>
            {lastInvoice.invoiceNumber}
          </p>
          {lastInvoice.customerName && (
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              Customer: {lastInvoice.customerName}
              {lastInvoice.customerPhone && ` · ${lastInvoice.customerPhone}`}
            </p>
          )}
          <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>
            ₹{fmt(lastInvoice.total)}
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 28 }}>
            Payment: {lastInvoice.paymentMethod}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setLastInvoice(null)}>
              New Bill
            </button>
            <button className="btn btn-primary" onClick={() => navigate(`/invoice/${lastInvoice.id}`)}>
              View & Print Invoice
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--color-bg)' }}>

      {/* ── LEFT PANEL: Scanner + Cart ── */}
      <div style={{
        flex: '0 0 440px', background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border-light)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2 }}>SmartBarcode POS</h2>
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Scan or enter barcode to add products</p>
        </div>

        {/* Barcode Scanner */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
          <label style={{
            fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8
          }}>
            Barcode Scanner
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <ScanBarcode size={16} style={{
                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                color: scanning ? 'var(--color-accent)' : 'var(--color-text-tertiary)'
              }} />
              <input
                ref={barcodeRef}
                id="barcode-scanner-input"
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcodeKeyDown}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => { if (barcodeInput.trim() && suggestions.length > 0) setShowSuggestions(true) }}
                placeholder="Scan or type product name/barcode..."
                style={{ paddingLeft: 38, background: scanning ? 'var(--color-accent-light)' : undefined }}
                autoComplete="off"
              />
              
              {/* Autocomplete Dropdown */}
              {showSuggestions && (barcodeInput.trim().length > 0) && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                  background: 'var(--color-surface)', borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-light)',
                  zIndex: 50, maxHeight: 300, overflowY: 'auto'
                }}>
                  {loadingSuggestions ? (
                    <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                      <Loader size={14} className="animate-spin" style={{ display: 'inline-block', marginRight: 8, verticalAlign: 'middle' }} /> Searching...
                    </div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((prod, idx) => (
                      <div 
                        key={prod.id}
                        onMouseDown={(e) => {
                          e.preventDefault(); // Prevent blur
                          addToCart(prod);
                          setBarcodeInput('');
                          setShowSuggestions(false);
                          toast.success(`Added: ${prod.name}`, { duration: 1500, position: 'bottom-right' });
                          if (barcodeRef.current) barcodeRef.current.focus();
                        }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        style={{
                          padding: '10px 16px',
                          borderBottom: '1px solid var(--color-border-light)',
                          cursor: 'pointer',
                          background: selectedIndex === idx ? 'var(--color-accent-light)' : 'transparent',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: selectedIndex === idx ? 'var(--color-accent-dark)' : 'var(--color-text-primary)' }}>{prod.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{prod.barcode}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-accent)' }}>₹{fmt(prod.sellingPrice)}</div>
                          <div style={{ fontSize: 11, color: prod.currentStock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            Stock: {prod.currentStock}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-tertiary)', textAlign: 'center' }}>
                      No products found.
                    </div>
                  )}
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => scanBarcode()} disabled={scanning || !barcodeInput.trim()}>
              {scanning ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Add'}
            </button>
            <button className="btn btn-secondary btn-icon" title="Camera Scanner" onClick={() => setShowCamera(true)}>
              <Camera size={16} />
            </button>
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
            USB scanner auto-adds on Enter · Camera scanner available
          </p>
        </div>

        {/* Customer Info */}
        <div style={{
          padding: '16px 24px', borderBottom: '1px solid var(--color-border-light)',
          background: 'var(--color-surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingCart size={18} /> Order Summary
            <span style={{ fontSize: 11, background: 'var(--color-accent)', color: 'white', padding: '2px 8px', borderRadius: 12 }}>
              {cart.length} items
            </span>
          </h2>
          
          {heldBills.length > 0 && (
            <div style={{ position: 'relative' }} className="held-bills-dropdown">
              <select 
                style={{ 
                  fontSize: 13, 
                  fontWeight: 700,
                  padding: '6px 24px 6px 12px', 
                  borderRadius: 20, 
                  border: '1px solid #f59e0b', 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  cursor: 'pointer'
                }}
                onChange={(e) => {
                  if (e.target.value) {
                    resumeCart(Number(e.target.value));
                    e.target.value = "";
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Resume Holds ({heldBills.length})</option>
                {heldBills.map(b => (
                  <option key={b.id} value={b.id}>{b.time} - {b.totalItems} items</option>
                ))}
              </select>
            </div>
          )}
        </div>
          <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--color-border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <User size={13} color="var(--color-text-secondary)" />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Customer (Optional)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              id="customer-name"
              placeholder="Customer name"
              value={customer.name}
              onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))}
              style={{ fontSize: 13, flex: 1 }}
            />
            <input
              id="customer-phone"
              placeholder="Phone"
              value={customer.phone}
              onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))}
              style={{ fontSize: 13, width: 130 }}
            />
          </div>
        </div>

        {/* AI Upsell Recommendations */}
        {(aiRecommendations.length > 0 || loadingAi) && (
          <div style={{ padding: '12px 24px', background: 'linear-gradient(to right, #fdf4ff, #fae8ff)', borderBottom: '1px solid #f5d0fe' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#a21caf' }}>
              <Sparkles size={14} />
              <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Smart Upsell</span>
              {loadingAi && <Loader size={12} className="animate-spin" style={{ marginLeft: 'auto' }} />}
            </div>
            {!loadingAi && aiRecommendations.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {aiRecommendations.map((rec, i) => (
                  <div key={i} style={{ 
                    fontSize: 12, fontWeight: 600, color: '#86198f', background: '#f5d0fe', 
                    padding: '4px 10px', borderRadius: 12, cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#e879f9'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f5d0fe'}
                  onClick={() => { setBarcodeInput(rec); barcodeRef.current?.focus() }}
                  >
                    + {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--color-text-tertiary)' }}>
              <ShoppingCart size={44} style={{ marginBottom: 12, opacity: 0.35 }} />
              <p style={{ fontSize: 15, fontWeight: 500 }}>Cart is empty</p>
              <p style={{ fontSize: 13, marginTop: 4 }}>Scan a barcode to add products</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 0', borderBottom: '1px solid var(--color-border-light)'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'monospace' }}>{item.barcode}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-accent)', fontWeight: 700, marginTop: 2 }}>
                    ₹{fmt(item.unitPrice * item.quantity)}
                  </div>
                </div>
                {/* Quantity controls */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--color-bg)', borderRadius: 8, padding: '4px 8px',
                  border: '1px solid var(--color-border-light)'
                }}>
                  <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-text-secondary)', display: 'flex' }}>
                    <Minus size={14} />
                  </button>
                  <span style={{ width: 24, textAlign: 'center', fontWeight: 700, fontSize: 14 }}>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 2, color: 'var(--color-accent)', display: 'flex' }}>
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={() => removeFromCart(item.productId)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--color-text-tertiary)', padding: 4, display: 'flex' }}>
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL: Order Summary ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '20px 32px', background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShoppingCart size={20} />
            <span style={{ fontWeight: 700, fontSize: 17 }}>Order Summary</span>
            <span style={{
              background: 'var(--color-accent)', color: 'white',
              borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700
            }}>
              {cart.reduce((s, i) => s + i.quantity, 0)} items
            </span>
          </div>
          {cart.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={clearCart} style={{ color: 'var(--color-danger)' }}>
              Clear All
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 32px' }}>

          {/* Items Summary */}
          <div className="card" style={{ marginBottom: 16, padding: 0 }}>
            <div style={{ padding: '0 16px' }}>
              {cart.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '20px 0', fontSize: 13 }}>
                  No items in cart
                </p>
              ) : cart.map(item => (
                <div key={item.productId} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '10px 0', borderBottom: '1px solid var(--color-border-light)', fontSize: 13
                }}>
                  <span style={{ fontWeight: 500 }}>
                    {item.name}
                    <span style={{ color: 'var(--color-text-tertiary)', fontWeight: 400 }}> ×{item.quantity}</span>
                  </span>
                  <span style={{ fontWeight: 600 }}>₹{fmt(item.unitPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Discount */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <Tag size={15} />
              <h4 style={{ fontSize: 14, fontWeight: 700 }}>Discount</h4>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                id="discount-type"
                value={discount.type}
                onChange={e => setDiscount(d => ({ ...d, type: e.target.value }))}
                style={{ width: 150, fontSize: 13 }}
              >
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
              <input
                id="discount-value"
                type="number"
                min="0"
                step="0.01"
                value={discount.value}
                onChange={e => setDiscount(d => ({ ...d, value: Number(e.target.value) }))}
                placeholder="0"
                style={{ fontSize: 13, flex: 1 }}
              />
            </div>
            {discountAmount > 0 && (
              <p style={{ fontSize: 12, color: 'var(--color-success)', marginTop: 8, fontWeight: 600 }}>
                ✓ Discount of ₹{fmt(discountAmount)} will be applied
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <CreditCard size={15} />
              <h4 style={{ fontSize: 14, fontWeight: 700 }}>Payment Method</h4>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { key: 'CASH', label: '💵 Cash' },
                { key: 'CARD', label: '💳 Card' },
                { key: 'UPI', label: '📱 UPI' },
                { key: 'OTHER', label: '🏷️ Other' },
              ].map(pm => (
                <button
                  key={pm.key}
                  id={`payment-${pm.key.toLowerCase()}`}
                  className={`btn ${paymentMethod === pm.key ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                  style={{ justifyContent: 'center' }}
                  onClick={() => setPaymentMethod(pm.key)}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Totals Breakdown */}
          <div className="card">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                <span>₹{fmt(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-success)' }}>
                    Discount {discount.type === 'PERCENTAGE' ? `(${discount.value}%)` : '(Flat)'}
                  </span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>−₹{fmt(discountAmount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total GST</span>
                <span>₹{fmt(taxAmount)}</span>
              </div>
              <div style={{ height: 1, background: 'var(--color-border-light)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>Total</span>
                <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--color-accent)' }}>₹{fmt(total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Bill Button */}
        <div style={{
          padding: '16px 32px', background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border-light)', display: 'flex', gap: 12
        }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 0.3, justifyContent: 'center', fontSize: 14, fontWeight: 600 }}
            onClick={holdCart}
            disabled={cart.length === 0 || generating}
          >
            Hold Bill
          </button>
          <button
            id="generate-bill-btn"
            className="btn btn-primary"
            style={{ flex: 1, justifyContent: 'center', padding: '15px', fontSize: 16, fontWeight: 700 }}
            onClick={generateBill}
            disabled={cart.length === 0 || generating}
          >
            {generating ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Generating Invoice...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ScanBarcode size={18} /> Generate Bill · ₹{fmt(total)}
              </span>
            )}
          </button>
        </div>
      </div>

      {showCamera && (
        <CameraScanner onDetect={handleCameraDetect} onClose={() => setShowCamera(false)} />
      )}
    </div>
  )
}
