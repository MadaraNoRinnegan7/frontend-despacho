import { useState, useEffect } from 'react'
import './App.css'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8081'

const estadoColor = {
  PENDIENTE: '#f59e0b',
  EN_CAMINO: '#00d4ff',
  ENTREGADO: '#10b981',
  CANCELADO: '#ef4444',
}

function App() {
  const [despachos, setDespachos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ cliente: '', direccion: '', producto: '', estado: 'PENDIENTE' })
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('TODOS')

  const fetchDespachos = async () => {
    try {
      setLoading(true)
      const res = await fetch(`${BACKEND_URL}/despachos`)
      if (!res.ok) throw new Error('Error al conectar con el backend')
      const data = await res.json()
      setDespachos(data)
      setError(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDespachos() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch(`${BACKEND_URL}/despachos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Error al crear despacho')
      await fetchDespachos()
      setModalOpen(false)
      setForm({ cliente: '', direccion: '', producto: '', estado: 'PENDIENTE' })
    } catch (e) {
      alert(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEstado = async (id, nuevoEstado) => {
    try {
      await fetch(`${BACKEND_URL}/despachos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: nuevoEstado }),
      })
      await fetchDespachos()
    } catch (e) {
      alert('Error al actualizar estado')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('¿Eliminar este despacho?')) return
    try {
      await fetch(`${BACKEND_URL}/despachos/${id}`, { method: 'DELETE' })
      await fetchDespachos()
    } catch (e) {
      alert('Error al eliminar')
    }
  }

  const filtered = filter === 'TODOS' ? despachos : despachos.filter(d => d.estado === filter)
  const counts = ['PENDIENTE', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'].reduce((acc, k) => {
    acc[k] = despachos.filter(d => d.estado === k).length
    return acc
  }, {})

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">▲</span>
            <div>
              <div className="logo-title">INNOVATECH</div>
              <div className="logo-sub">Sistema de Despachos · Chile</div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            + Nuevo Despacho
          </button>
        </div>
      </header>

      <main className="main">
        <div className="stats-row">
          {Object.entries(counts).map(([estado, n]) => (
            <div key={estado} className="stat-card" style={{ borderColor: estadoColor[estado] }}>
              <div className="stat-num" style={{ color: estadoColor[estado] }}>{n}</div>
              <div className="stat-label">{estado.replace('_', ' ')}</div>
            </div>
          ))}
        </div>

        <div className="filters">
          {['TODOS', 'PENDIENTE', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'].map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
              style={filter === f && f !== 'TODOS' ? { borderColor: estadoColor[f], color: estadoColor[f] } : {}}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>

        {error && (
          <div className="error-banner">
            ⚠ No se pudo conectar con el backend: <code>{BACKEND_URL}/despachos</code>
            <button onClick={fetchDespachos}>Reintentar</button>
          </div>
        )}

        {loading ? (
          <div className="loading">
            <div className="spinner" />
            <span>Cargando despachos...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">📦</div>
            <div>No hay despachos {filter !== 'TODOS' ? `con estado ${filter}` : 'registrados'}</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>#ID</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Dirección</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id}>
                    <td className="mono">#{d.id}</td>
                    <td>{d.cliente}</td>
                    <td>{d.producto}</td>
                    <td className="dir">{d.direccion}</td>
                    <td>
                      <span className="badge" style={{ background: estadoColor[d.estado] + '22', color: estadoColor[d.estado], borderColor: estadoColor[d.estado] }}>
                        {d.estado.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="actions">
                      <select
                        value={d.estado}
                        onChange={e => handleEstado(d.id, e.target.value)}
                        className="select-estado"
                      >
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="EN_CAMINO">En Camino</option>
                        <option value="ENTREGADO">Entregado</option>
                        <option value="CANCELADO">Cancelado</option>
                      </select>
                      <button className="btn-del" onClick={() => handleDelete(d.id)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="overlay" onClick={() => setModalOpen(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Despacho</h2>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <label>Cliente
                <input required value={form.cliente} onChange={e => setForm({...form, cliente: e.target.value})} placeholder="Nombre del cliente" />
              </label>
              <label>Producto
                <input required value={form.producto} onChange={e => setForm({...form, producto: e.target.value})} placeholder="Descripción del producto" />
              </label>
              <label>Dirección de entrega
                <input required value={form.direccion} onChange={e => setForm({...form, direccion: e.target.value})} placeholder="Ej: Av. Providencia 1234, Santiago" />
              </label>
              <label>Estado inicial
                <select value={form.estado} onChange={e => setForm({...form, estado: e.target.value})}>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="EN_CAMINO">En Camino</option>
                </select>
              </label>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? 'Creando...' : 'Crear Despacho'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
