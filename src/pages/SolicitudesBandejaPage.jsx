import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Search, RefreshCw, Plus, History, FileText, 
  ClipboardList, ClipboardCheck, BadgeCheck, LogOut 
} from 'lucide-react';

const formatSoles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

// --- DATOS SIMULADOS (MOCKS) ---
const mockSolicitudes = [
  { codsolicitud: 'SOL-000123', codcliente: 'CLI-991', nomcliente: 'Constructora del Centro SAC', motivo: 'Capital de Trabajo', tipo: 'MYPE', fecha: '2026-06-15', monto: 50000, plazo: 12, estado: 'En Evaluación', idEstado: 1 },
  { codsolicitud: 'SOL-000124', codcliente: 'CLI-882', nomcliente: 'Importaciones Vega EIRL', motivo: 'Compra Maquinaria', tipo: 'MYPE', fecha: '2026-06-16', monto: 120000, plazo: 24, estado: 'Aprobado', idEstado: 3 },
  { codsolicitud: 'SOL-000125', codcliente: 'CLI-773', nomcliente: 'Bodega El Buen Vecino', motivo: 'Mercadería', tipo: 'MYPE', fecha: '2026-06-18', monto: 15000, plazo: 6, estado: 'En Comité', idEstado: 2 },
  { codsolicitud: 'SOL-000126', codcliente: 'CLI-664', nomcliente: 'Transportes Rápidos SRL', motivo: 'Vehículos', tipo: 'MYPE', fecha: '2026-06-19', monto: 85000, plazo: 36, estado: 'Rechazado', idEstado: 5 },
];

// Mini-componente para pintar el estado con colores
const BadgeEstado = ({ estado }) => {
  let bg = '#f3f4f6', color = '#4b5563';
  if (estado === 'Aprobado') { bg = '#dcfce7'; color = '#16a34a'; }
  if (estado === 'En Evaluación') { bg = '#fef9c3'; color = '#ca8a04'; }
  if (estado === 'En Comité') { bg = '#e0e7ff'; color = '#4f46e5'; }
  if (estado === 'Rechazado') { bg = '#fee2e2'; color = '#dc2626'; }
  if (estado === 'Desembolsado') { bg = '#cffafe'; color = '#0891b2'; }
  
  return (
    <span style={{ background: bg, color: color, padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
      {estado}
    </span>
  );
};

export default function SolicitudesBandejaPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // 1. ESTADOS ÚNICOS Y LIMPIOS (Eliminamos los duplicados)
  const [items, setItems] = useState([]); 
  const [datosMaestros, setDatosMaestros] = useState([]); // Guardamos una copia intacta de la BD para poder filtrar
  const [sel, setSel] = useState(null); 
  const [textoBusqueda, setTextoBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // 2. FUNCIÓN PARA LLAMAR A LA BASE DE DATOS
  const cargarDatos = async () => {
    try {
      const response = await fetch('https://core-bcp-backend.onrender.com/api/solicitudes/bandeja', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}` // Pase VIP
        }
      });
      const datosReales = await response.json();
      
      // Actualizamos las tablas con los datos de PostgreSQL
      setItems(datosReales); 
      setDatosMaestros(datosReales); 
    } catch (error) {
      console.error("Error al conectar con el servidor:", error);
    }
  };

  // 3. EL PATRÓN useEffect (Se ejecuta 1 sola vez al abrir la pantalla)
  useEffect(() => {
    cargarDatos();
  }, []);

  // 4. ACTUALIZAMOS EL BUSCADOR PARA USAR DATOS REALES (Ya no usamos mockSolicitudes)
  const handleBuscar = (e) => {
    e.preventDefault();
    let filtrados = datosMaestros; // Filtramos desde la copia de la BD

    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(s => s.estado === filtroEstado);
    }
    if (textoBusqueda) {
      filtrados = filtrados.filter(s => 
        (s.nomcliente && s.nomcliente.toLowerCase().includes(textoBusqueda.toLowerCase())) || 
        (s.codsolicitud && s.codsolicitud.includes(textoBusqueda))
      );
    }
    setItems(filtrados);
    setSel(null);
  };

  // 5. ACTUALIZAMOS EL RECARGAR (Vuelve a pedir los datos frescos a la BD)
  const recargar = () => {
    cargarDatos(); // Petición real al backend
    setTextoBusqueda('');
    setFiltroEstado('TODOS');
    setSel(null);
  };
  // --- ESTRUCTURA DEL MENÚ LATERAL ---
  const menuGroups = [
    {
      title: 'PRINCIPAL',
      items: [{ name: 'Dashboard', path: '/dashboard', icon: '📊' }]
    },
    {
      title: 'OTORGAMIENTO DE CRÉDITOS',
      items: [
        { name: 'Bandeja de solicitudes', path: '/solicitudes', icon: '📥' },
        { name: '1. Pre-solicitud', path: '/solicitudes/pre', icon: '⏱️' },
        { name: '2. Registro de solicitud', path: '/solicitudes/registro', icon: '📄' },
        { name: '3. Propuesta y comité', path: '/solicitudes/comite', icon: '👥' },
        { name: '4. Aprobación y desembolso', path: '/solicitudes/aprobacion', icon: '✅' },
        { name: '5. Mora y recuperación', path: '/recuperaciones/mora', icon: '⚠️' },
      ]
    },
    {
      title: 'RECUPERACIONES',
      items: [{ name: 'Bandeja de mora', path: '/recuperaciones/bandeja', icon: '🚨' }]
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      
      {/* ── BARRA LATERAL (SIDEBAR) ── */}
      <aside style={{ width: '270px', background: 'var(--bcp-azul)', color: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.1)', position: 'fixed', height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}><span style={{ color: 'var(--bcp-naranja)' }}>&gt;</span>BCP</h1>
          <span style={{ fontSize: '0.8rem', color: '#A0B2D9', letterSpacing: '1px', textTransform: 'uppercase' }}>Core Financiero</span>
        </div>
        <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          {menuGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: '24px' }}>
              <div style={{ padding: '0 24px', marginBottom: '8px', fontSize: '0.75rem', color: '#A0B2D9', fontWeight: 700, letterSpacing: '1px' }}>{group.title}</div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <div key={item.name} onClick={() => navigate(item.path)} style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: isActive ? '4px solid var(--bcp-naranja)' : '4px solid transparent', transition: 'all 0.2s', color: isActive ? '#fff' : '#A0B2D9', fontWeight: isActive ? 600 : 400 }} onMouseEnter={e => { if(!isActive) e.currentTarget.style.color = '#fff' }} onMouseLeave={e => { if(!isActive) e.currentTarget.style.color = '#A0B2D9' }}>
                    <span style={{ fontSize: '1.2rem' }}>{item.icon}</span>
                    <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <main style={{ marginLeft: '270px', flex: 1, padding: '40px', maxWidth: '1400px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Cabecera */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Bandeja de Flujo de Trabajo</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Consulta, registra y gestiona las solicitudes de crédito hasta el desembolso.</p>
        </div>

        {/* ── PANELES SUPERIORES (Usuario y Filtros) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '20px', marginBottom: '24px' }}>
          
          {/* Panel Usuario */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--bcp-azul)', borderBottom: '1px solid #eee', paddingBottom: '10px', margin: '0 0 16px' }}>Datos del Colaborador</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: 'var(--text-muted)' }}>Usuario:</strong> <span>Cristopher Mendez</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: 'var(--text-muted)' }}>Cargo:</strong> <span>Asesor MYPE</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong style={{ color: 'var(--text-muted)' }}>Agencia:</strong> <span>034 - Huancayo Centro</span></div>
            </div>
          </div>

          {/* Panel Filtros */}
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--bcp-azul)', borderBottom: '1px solid #eee', paddingBottom: '10px', margin: '0 0 16px' }}>Búsqueda y Filtros</h3>
            <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Estado</label>
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}>
                  <option value="TODOS">TODOS</option>
                  <option value="En Evaluación">En Evaluación</option>
                  <option value="En Comité">En Comité</option>
                  <option value="Aprobado">Aprobado</option>
                  <option value="Rechazado">Rechazado</option>
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>Código o Cliente</label>
                <input type="text" value={textoBusqueda} onChange={e => setTextoBusqueda(e.target.value)} placeholder="Ej. SOL-000123 o Constructora..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
              </div>
              <button type="submit" style={{ background: 'var(--bcp-azul)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <Search size={16} /> Buscar
              </button>
              <button type="button" onClick={recargar} style={{ background: '#f3f4f6', color: 'var(--text-main)', border: 'none', padding: '10px', borderRadius: '8px', cursor: 'pointer' }}>
                <RefreshCw size={16} />
              </button>
            </form>
          </div>
        </div>

        {/* ── BARRA DE SOLICITUD SELECCIONADA ── */}
        <div style={{ background: '#fff', padding: '16px 20px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 8px' }}>Solicitud Seleccionada</h3>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--bcp-azul)' }}>
              {sel ? `${sel.codsolicitud} - ${sel.nomcliente}` : 'Ninguna seleccionada'}
            </div>
          </div>
          <button style={{ background: 'var(--bcp-naranja)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
            <Plus size={18} /> Nueva Solicitud
          </button>
        </div>

        {/* ── TABLA DE RESULTADOS ── */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <tr>
                <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CÓDIGO</th>
                <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CLIENTE</th>
                <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>MOTIVO</th>
                <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>FECHA</th>
                <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>MONTO</th>
                <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>PLAZO</th>
                <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron solicitudes.</td></tr>
              ) : (
                items.map((s) => (
                  // Usamos id_prestamo como llave única
                  <tr key={s.id_prestamo} onClick={() => setSel(s)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: sel?.id_prestamo === s.id_prestamo ? '#eff6ff' : '#fff', transition: 'background 0.2s' }}>
                    
                    {/* Código: Mostramos el id_prestamo */}
                    <td style={{ padding: '16px', fontWeight: 600, color: 'var(--bcp-azul)' }}>PRE-{s.id_prestamo}</td>
                    
                    {/* Cliente: Por ahora mostramos el ID, en el futuro se cruzaría con la tabla clientes */}
                    <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>Cliente #{s.cliente_id}</td>
                    
                    {/* Motivo: Tu BD lo llama 'proposito' */}
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>{s.proposito}</td>
                    
                    {/* Fecha: Como tu BD no tiene fecha de solicitud, ponemos un guión o un texto por defecto */}
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>---</td>
                    
                    {/* Monto: Coincide perfectamente */}
                    <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 600, textAlign: 'right' }}>{formatSoles(s.monto)}</td>
                    
                    {/* Plazo: Tu BD lo llama 'plazo_meses' */}
                    <td style={{ padding: '16px', color: 'var(--text-muted)', textAlign: 'center' }}>{s.plazo_meses}m</td>
                    
                    {/* Estado: Coincide perfectamente */}
                    <td style={{ padding: '16px' }}><BadgeEstado estado={s.estado} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── BARRA DE HERRAMIENTAS INFERIOR ── */}
        <div style={{ background: '#1e293b', padding: '16px 24px', borderRadius: '12px', marginTop: '20px', display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button disabled={!sel} style={{ background: 'transparent', color: sel ? '#fff' : '#64748b', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: sel ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem' }}><History size={18}/> Historial</button>
          <button disabled={!sel} style={{ background: 'transparent', color: sel ? '#fff' : '#64748b', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: sel ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem' }}><FileText size={18}/> Informe RCC</button>
          <button disabled={!sel} style={{ background: 'transparent', color: sel ? '#fff' : '#64748b', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: sel ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem' }}><ClipboardList size={18}/> Registro</button>
          <button disabled={!sel} style={{ background: 'transparent', color: sel ? '#fff' : '#64748b', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: sel ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem' }}><ClipboardCheck size={18}/> Evaluar</button>
          <button disabled={!sel} style={{ background: 'transparent', color: sel ? '#fff' : '#64748b', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: sel ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '0.9rem' }}><BadgeCheck size={18}/> Aprobar</button>
        </div>

      </main>
    </div>
  );
}