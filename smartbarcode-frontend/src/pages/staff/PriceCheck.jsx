import { useState, useEffect, useRef } from 'react'
import { Search, Package, ChevronLeft, ChevronRight, Filter } from 'lucide-react'
import api from '../../api/axios'

export default function PriceCheck() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)

  const inputRef = useRef(null)

  useEffect(() => {
    fetchCategories()
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [page, search, categoryFilter])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories')
      setCategories(res.data)
    } catch (err) {
      console.error("Failed to load categories", err)
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = {
        page,
        size: 12,
        search: search.trim() || undefined,
        categoryId: categoryFilter || undefined
      }
      const res = await api.get('/products', { params })
      setProducts(res.data.content)
      setTotalPages(res.data.totalPages)
    } catch (err) {
      console.error("Failed to load products", err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(0)
  }

  const fmt = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })

  return (
    <div style={{ padding: '32px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <Search size={28} color="var(--color-accent)" /> Price Check & Stock Lookup
        </h1>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, maxWidth: 600, margin: '0 auto' }}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Scan barcode or type here..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ flex: 1, fontSize: 16, padding: '16px', borderRadius: 12, border: '1px solid var(--color-border)' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 32px', fontSize: 16 }} disabled={loading}>
            Search
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={20} color="var(--color-accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800 }}>All Products</h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Showing all available products</p>
          </div>
        </div>

        <select 
          value={categoryFilter}
          onChange={e => { setCategoryFilter(e.target.value); setPage(0); }}
          style={{ padding: '10px 16px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, minWidth: 200 }}
        >
          <option value="">All Categories</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading && products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-tertiary)' }}>
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-tertiary)', background: 'white', borderRadius: 16 }}>
          <Search size={48} style={{ opacity: 0.2, marginBottom: 16, margin: '0 auto' }} />
          <p>No products found.</p>
        </div>
      ) : (
        <>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', 
            gap: 20, 
            marginBottom: 32 
          }}>
            {products.map(p => (
              <div key={p.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', transition: 'transform 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {/* Image Placeholder */}
                <div style={{ 
                  height: 140, 
                  background: 'var(--color-bg)', 
                  borderRadius: 12, 
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden'
                }}>
                  {p.imageUrl ? (
                    <img 
                      src={p.imageUrl} 
                      alt={p.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&color=fff&size=140&font-size=0.33`;
                      }}
                    />
                  ) : (
                    // Using ui-avatars as a clean placeholder for missing images
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&color=fff&size=140&font-size=0.33`} 
                      alt={p.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>{p.name}</h3>
                  <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontFamily: 'monospace', marginBottom: 12 }}>{p.barcode}</p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-accent)' }}>
                    {fmt(p.sellingPrice)}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: p.currentStock > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {p.currentStock > 0 ? 'In Stock' : 'Out of Stock'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {p.currentStock} {p.unit}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
              <button 
                className="btn btn-secondary btn-icon" 
                disabled={page === 0} 
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              
              {Array.from({ length: totalPages }).map((_, i) => {
                // Show a window of pages
                if (i === 0 || i === totalPages - 1 || Math.abs(page - i) <= 1) {
                  return (
                    <button 
                      key={i} 
                      className={`btn ${page === i ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ width: 36, height: 36, padding: 0, justifyContent: 'center' }}
                      onClick={() => setPage(i)}
                    >
                      {i + 1}
                    </button>
                  )
                }
                if (Math.abs(page - i) === 2) {
                  return <span key={i} style={{ color: 'var(--color-text-tertiary)' }}>...</span>
                }
                return null
              })}

              <button 
                className="btn btn-secondary btn-icon" 
                disabled={page >= totalPages - 1} 
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
