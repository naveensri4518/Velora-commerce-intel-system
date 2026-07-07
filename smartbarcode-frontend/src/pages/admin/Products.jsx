import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, Search, Edit2, Trash2, Package, X, RefreshCw, Barcode as BarcodeIcon, Printer, Download, Upload, Sparkles, Loader } from 'lucide-react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import Barcode from 'react-barcode'

const EMPTY_PRODUCT = {
  barcode: '', name: '', brand: '', description: '',
  purchasePrice: '', sellingPrice: '', taxRate: '18', currentStock: '',
  minStockLevel: 10, unit: 'pcs', expiryDate: '',
  categoryId: '', supplierId: '', imageUrl: ''
}

function StockBadge({ product }) {
  if (product.currentStock === 0)
    return <span className="badge badge-danger">Out of Stock</span>
  if (product.currentStock <= product.minStockLevel)
    return <span className="badge badge-warning">Low Stock</span>
  return <span className="badge badge-success">In Stock</span>
}

function ImportModal({ onClose, onSave }) {
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleDownloadTemplate = () => {
    const template = "Barcode,Name,Brand,Category,Supplier,Unit,Purchase Price,Selling Price,Tax Rate,Current Stock,Min Stock,Expiry Date\n123456789,Sample Product,Sample Brand,Dairy,,pcs,10.00,15.00,5,100,10,2026-12-31\n"
    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'smartbarcode_products_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file first')
      return
    }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`Import complete! Successfully added ${res.data.successCount} products. Skipped ${res.data.skipCount} products.`)
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import CSV')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>Import Products (CSV)</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <Package size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
          <p style={{ marginBottom: 16, color: 'var(--color-text-secondary)', fontSize: 14 }}>
            You can upload a CSV file to add hundreds of products at once.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadTemplate}>
              <Download size={14} /> Download Template
            </button>
            <input 
              type="file" 
              accept=".csv" 
              style={{ display: 'none' }} 
              ref={fileInputRef}
              onChange={e => setFile(e.target.files[0])}
            />
            <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current.click()}>
              Choose File
            </button>
          </div>
          {file && (
            <div style={{ padding: 12, background: 'var(--color-accent-light)', borderRadius: 8, fontSize: 13, fontWeight: 600, color: 'var(--color-accent-dark)' }}>
              Selected File: {file.name}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" disabled={!file || uploading} onClick={handleUpload}>
            <Upload size={16} /> {uploading ? 'Importing...' : 'Upload & Import'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductModal({ product, categories, suppliers, onClose, onSave }) {
  const [form, setForm] = useState(product || EMPTY_PRODUCT)
  const [saving, setSaving] = useState(false)
  const [loadingAi, setLoadingAi] = useState(false)
  const isEdit = !!product?.id

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleAiCategorize = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter a product name first')
      return
    }
    setLoadingAi(true)
    try {
      const res = await api.post('/ai/categorize', { name: form.name })
      const aiData = JSON.parse(res.data.response)
      
      const updates = {}
      if (aiData.categoryId) updates.categoryId = aiData.categoryId
      if (aiData.estimatedPrice) {
        updates.sellingPrice = aiData.estimatedPrice
        updates.purchasePrice = (aiData.estimatedPrice * 0.7).toFixed(2)
      }
      
      setForm(f => ({ ...f, ...updates }))
      toast.success('AI populated Category & Price')
    } catch (err) {
      console.error(err)
      toast.error('Failed to get AI categorization')
    } finally {
      setLoadingAi(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.barcode || !form.name || !form.sellingPrice) {
      toast.error('Barcode, name and selling price are required')
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await api.put(`/products/${product.id}`, form)
        toast.success('Product updated successfully')
      } else {
        await api.post('/products', form)
        toast.success('Product created successfully')
      }
      onSave()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h3>{isEdit ? 'Edit Product' : 'Add New Product'}</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Barcode *</label>
                <input value={form.barcode} onChange={e => set('barcode', e.target.value)}
                  placeholder="e.g. 8901234567890" required disabled={isEdit} />
              </div>
              <div className="form-group">
                <label>Product Name *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="Product name" required style={{ flex: 1 }} />
                  <button type="button" className="btn btn-secondary btn-icon" title="AI Auto-Fill Category & Price" 
                    onClick={handleAiCategorize} disabled={loadingAi || !form.name.trim()} 
                    style={{ background: 'var(--color-accent-light)', color: 'var(--color-accent-dark)', border: 'none', padding: '0 12px' }}>
                    {loadingAi ? <Loader size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>Brand</label>
                <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Brand name" />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <select value={form.supplierId} onChange={e => set('supplierId', e.target.value)}>
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {['pcs', 'kg', 'g', 'L', 'ml', 'box', 'pack', 'bottle', 'can'].map(u =>
                    <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Purchase Price (₹) *</label>
                <input type="number" step="0.01" value={form.purchasePrice}
                  onChange={e => set('purchasePrice', e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label>Selling Price (₹) *</label>
                <input type="number" step="0.01" value={form.sellingPrice}
                  onChange={e => set('sellingPrice', e.target.value)} placeholder="0.00" required />
              </div>
              <div className="form-group">
                <label>Tax Rate (GST %)</label>
                <select value={form.taxRate} onChange={e => set('taxRate', e.target.value)}>
                  {[0, 5, 12, 18, 28].map(t => <option key={t} value={t}>{t}%</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Current Stock</label>
                <input type="number" value={form.currentStock}
                  onChange={e => set('currentStock', e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Minimum Stock Level</label>
                <input type="number" value={form.minStockLevel}
                  onChange={e => set('minStockLevel', e.target.value)} placeholder="10" />
              </div>
              <div className="form-group">
                <label>Expiry Date</label>
                <input type="date" value={form.expiryDate} onChange={e => set('expiryDate', e.target.value)} />
              </div>
              <div className="form-group full">
                <label>Image URL</label>
                <input value={form.imageUrl || ''} onChange={e => set('imageUrl', e.target.value)} 
                  placeholder="e.g. https://example.com/product-image.jpg" />
              </div>
              <div className="form-group full">
                <label>Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)}
                  rows={2} placeholder="Optional product description" />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : (isEdit ? 'Save Changes' : 'Add Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [pagination, setPagination] = useState({ page: 0, totalPages: 1, totalElements: 0 })
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | {} | {product}
  const [importModal, setImportModal] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [barcodeModal, setBarcodeModal] = useState(null)

  const fetchData = useCallback(async (page = 0) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page, size: 15 })
      if (search) params.set('search', search)
      if (selectedCategory) params.set('categoryId', selectedCategory)

      const [prodRes, catRes, supRes] = await Promise.all([
        api.get(`/products?${params}`),
        api.get('/categories'),
        api.get('/suppliers'),
      ])
      setProducts(prodRes.data.content || [])
      setPagination({ page: prodRes.data.number, totalPages: prodRes.data.totalPages, totalElements: prodRes.data.totalElements })
      setCategories(catRes.data || [])
      setSuppliers(supRes.data || [])
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [search, selectedCategory])

  // eslint-disable-next-line
  useEffect(() => { fetchData() }, [fetchData])

  const handleDelete = async (product) => {
    try {
      await api.delete(`/products/${product.id}`)
      toast.success('Product deleted')
      setDeleteConfirm(null)
      fetchData()
    } catch {
      toast.error('Failed to delete product')
    }
  }

  const fmtPrice = (n) => '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div>
          <div className="page-title">Products</div>
          <div className="page-subtitle">{pagination.totalElements} products in catalog</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => setImportModal(true)}>
            <Upload size={16} /> Import CSV
          </button>
          <button className="btn btn-primary" onClick={() => setModal({})}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="search-bar">
        <div className="search-input-wrapper" style={{ maxWidth: 360 }}>
          <Search size={16} />
          <input
            placeholder="Search by name, barcode, brand..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
          style={{ width: 200 }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || selectedCategory) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setSelectedCategory('') }}>
            <X size={14} /> Clear
          </button>
        )}
        <button className="btn btn-secondary btn-sm" style={{ marginLeft: 'auto' }} onClick={() => fetchData()}>
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Barcode</th>
                <th>Category</th>
                <th>Purchase Price</th>
                <th>Selling Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    {Array(9).fill(0).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 48 }}>
                    <Package size={36} style={{ color: 'var(--color-text-tertiary)', marginBottom: 8 }} />
                    <p>No products found</p>
                  </td>
                </tr>
              ) : (
                products.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                      {p.brand && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{p.brand}</div>}
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.barcode}</td>
                    <td>{p.category?.name || '—'}</td>
                    <td>{fmtPrice(p.purchasePrice)}</td>
                    <td style={{ fontWeight: 600 }}>{fmtPrice(p.sellingPrice)}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{p.currentStock}</span>
                      <span style={{ color: 'var(--color-text-tertiary)', fontSize: 11 }}> {p.unit}</span>
                    </td>
                    <td><StockBadge product={p} /></td>
                    <td style={{ fontSize: 12 }}>{p.expiryDate || '—'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-ghost btn-icon btn-sm" title="View Barcode"
                          onClick={() => setBarcodeModal(p)}>
                          <BarcodeIcon size={15} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit"
                          onClick={() => setModal({ product: p })}>
                          <Edit2 size={15} />
                        </button>
                        <button className="btn btn-icon btn-sm"
                          style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: 'none' }}
                          title="Delete" onClick={() => setDeleteConfirm(p)}>
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

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border-light)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>
              Page {pagination.page + 1} of {pagination.totalPages}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm"
                disabled={pagination.page === 0} onClick={() => fetchData(pagination.page - 1)}>Previous</button>
              <button className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages - 1} onClick={() => fetchData(pagination.page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {modal !== null && (
        <ProductModal
          product={modal.product}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); fetchData() }}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>Delete Product</h3>
              <button className="btn-icon btn-ghost" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
                This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete Product</button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal */}
      {barcodeModal && (
        <BarcodeModal product={barcodeModal} onClose={() => setBarcodeModal(null)} />
      )}

      {/* Import Modal */}
      {importModal && (
        <ImportModal
          onClose={() => setImportModal(false)}
          onSave={() => {
            setImportModal(false)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

function BarcodeModal({ product, onClose }) {
  const downloadBarcode = () => {
    const wrapper = document.getElementById("ProductBarcode");
    if (!wrapper) return;
    const svg = wrapper.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      // Add padding
      const padding = 20;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, padding, padding);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${product.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${product.barcode}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-header">
          <h3>Product Barcode</h3>
          <button className="btn-icon btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ background: '#fff', padding: 16, display: 'inline-block', borderRadius: 8, marginBottom: 16 }}>
             {/* Render the barcode as an SVG and give it the ID for downloading */}
             <div id="ProductBarcode">
               <Barcode value={product.barcode} width={2} height={80} displayValue={false} />
             </div>
          </div>
          <h4 style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{product.name}</h4>
          <p style={{ fontFamily: 'monospace', fontSize: 14, color: 'var(--color-text-secondary)' }}>
            {product.barcode}
          </p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} style={{ marginRight: 6 }} /> Print
          </button>
          <button className="btn btn-primary" onClick={downloadBarcode}>
            <Download size={16} style={{ marginRight: 6 }} /> Download PNG
          </button>
        </div>
      </div>
    </div>
  )
}
