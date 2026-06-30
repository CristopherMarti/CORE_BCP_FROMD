import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, AlertTriangle, PhoneCall, CalendarClock, ShieldAlert, FileText, CheckCircle } from 'lucide-react';

const formatSoles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

export default function RecuperacionesMoraPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- ESTADOS REALES ---
  const [clientes, setClientes] = useState([]);
  const [datosMaestros, setDatosMaestros] = useState([]); // Copia de seguridad para el buscador
  const [kpis, setKpis] = useState({ preventiva: 0, gestion: 0, judicial: 0 });
  const [loadingDatos, setLoadingDatos] = useState(true);

  const [sel, setSel] = useState(null); // Cliente seleccionado
  const [textoBusqueda, setTextoBusqueda] = useState('');
  
  // Estado para el panel de gestión
  const [gestion, setGestion] = useState({ tipo: 'Llamada', comentario: '', fechaPromesa: '' });
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);

  // --- LLAMADA AL BACKEND ---
  useEffect(() => {
    const fetchMora = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/recuperaciones/mora', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();

        // Adaptamos los datos de Python para que tu diseño visual los entienda perfectamente
        const datosFormateados = data.map(m => {
        // Traducimos los estados del Core a los tramos del Frontend
        let tramoVisual = 'preventiva';
        let diasAtrasoSimulado = 15;

        if (m.estado === 'mora_grave') {
          tramoVisual = 'gestion';
          diasAtrasoSimulado = 45;
        } else if (m.estado === 'mora_critica') {
          tramoVisual = 'judicial';
          diasAtrasoSimulado = 95;
        }

        return {
          id: m.id_prestamo,
          credito: `PRE-${m.id_prestamo}`,
          cliente: `Cliente #${m.cliente_id}`,
          cuota: parseFloat(m.monto || 0) * 0.1, // Cálculo referencial de cuota vencida
          deudaTotal: parseFloat(m.saldo_pendiente || 0), // Jalamos tu columna saldo_pendiente real de Postgres
          diasAtraso: m.plazo_meses || diasAtrasoSimulado, // Mapeo temporal o usar días si los tienes
          gestion: 'Sin acciones hoy',
          tramo: tramoVisual
        };
      });

        setClientes(datosFormateados);
        setDatosMaestros(datosFormateados);

        // Calculamos los KPIs reales para las tarjetas de arriba
        let prev = 0, gest = 0, jud = 0;
        datosFormateados.forEach(item => {
          if (item.tramo === 'preventiva') prev++;
          if (item.tramo === 'gestion') gest++;
          if (item.tramo === 'judicial') jud++;
        });
        setKpis({ preventiva: prev, gestion: gest, judicial: jud });

      } catch (error) {
        console.error("Error al cargar mora:", error);
      } finally {
        setLoadingDatos(false);
      }
    };
    fetchMora();
  }, []);

  // --- BUSCADOR REAL ---
  const handleBuscar = (e) => {
    e.preventDefault();
    if (!textoBusqueda) {
      setClientes(datosMaestros);
    } else {
      const filtrados = datosMaestros.filter(c => 
        c.cliente.toLowerCase().includes(textoBusqueda.toLowerCase()) || 
        c.credito.toLowerCase().includes(textoBusqueda.toLowerCase())
      );
      setClientes(filtrados);
    }
    setSel(null);
  };

  const registrarGestion = (e) => {
    e.preventDefault();
    setLoading(true);
    // Aquí en el futuro harías un POST a Python para guardar el historial
    setTimeout(() => {
      setLoading(false);
      setExito(true);
      setTimeout(() => setExito(false), 3000);
      setGestion({ tipo: 'Llamada', comentario: '', fechaPromesa: '' });
      
      // Actualizamos visualmente la tabla
      const nuevosClientes = clientes.map(c => 
        c.id === sel.id ? { ...c, gestion: 'Gestión registrada hoy' } : c
      );
      setClientes(nuevosClientes);
      setDatosMaestros(nuevosClientes);
      
    }, 1200);
  };

  // --- ESTRUCTURA DEL MENÚ LATERAL ---
  const menuGroups = [
    { title: 'PRINCIPAL', items: [{ name: 'Dashboard', path: '/dashboard', icon: '📊' }] },
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
    { title: 'RECUPERACIONES', items: [{ name: 'Bandeja de mora', path: '/recuperaciones/bandeja', icon: '🚨' }] }
  ];

  // Helper para pintar el color de los días de atraso
  const getColorAtraso = (dias) => {
    if (dias <= 30) return { bg: '#fef9c3', color: '#ca8a04' }; // Amarillo
    if (dias <= 60) return { bg: '#ffedd5', color: '#ea580c' }; // Naranja
    if (dias <= 90) return { bg: '#fee2e2', color: '#dc2626' }; // Rojo
    return { bg: '#7f1d1d', color: '#fca5a5' }; // Rojo muy oscuro (Crítico)
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-app)' }}>
      
      {/* ── BARRA LATERAL (SIDEBAR) ── */}
      <aside style={{ width: '270px', background: 'var(--bcp-azul)', color: '#fff', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800 }}><span style={{ color: 'var(--bcp-naranja)' }}>&gt;</span>BCP</h1>
          <span style={{ fontSize: '0.8rem', color: '#A0B2D9' }}>Core Financiero</span>
        </div>
        <nav style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          {menuGroups.map((group, idx) => (
            <div key={idx} style={{ marginBottom: '24px' }}>
              <div style={{ padding: '0 24px', marginBottom: '8px', fontSize: '0.75rem', color: '#A0B2D9', fontWeight: 700 }}>{group.title}</div>
              {group.items.map((item) => {
                const isActive = location.pathname === item.path || (location.pathname === '/recuperaciones/bandeja' && item.name === 'Bandeja de mora');
                return (
                  <div key={item.name} onClick={() => navigate(item.path)} style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: isActive ? '4px solid var(--bcp-naranja)' : '4px solid transparent', color: isActive ? '#fff' : '#A0B2D9', fontWeight: isActive ? 600 : 400 }}>
                    <span>{item.icon}</span> <span style={{ fontSize: '0.9rem' }}>{item.name}</span>
                  </div>
                )
              })}
            </div>
          ))}
        </nav>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <main style={{ marginLeft: '270px', flex: 1, padding: '40px', maxWidth: '1400px' }}>
        
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Gestión de Mora y Recuperaciones</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Seguimiento de cartera atrasada y registro de acciones de cobranza.</p>
        </div>

        {/* ── TARJETAS RESUMEN DE MORA (KPIs REALES) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '24px' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ca8a04', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tramo 1-30 Días (Preventiva)</div>
            <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '8px' }}>{kpis.preventiva} Cliente(s)</div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ea580c', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Tramo 31-90 Días (Gestión)</div>
            <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '8px' }}>{kpis.gestion} Cliente(s)</div>
          </div>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #dc2626', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>+90 Días (Judicial / Castigo)</div>
            <div style={{ fontSize: '1.6rem', color: '#dc2626', fontWeight: 800, marginTop: '8px' }}>{kpis.judicial} Cliente(s)</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* ── COLUMNA IZQUIERDA: TABLA DE CLIENTES MOROSOS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ background: '#fff', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
              <form onSubmit={handleBuscar} style={{ display: 'flex', gap: '16px' }}>
                <input type="text" value={textoBusqueda} onChange={e => setTextoBusqueda(e.target.value)} placeholder="Buscar por nombre de cliente o código de crédito..." style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
                <button type="submit" style={{ background: 'var(--bcp-azul)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Search size={16} /> Buscar
                </button>
              </form>
            </div>

            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
              {loadingDatos ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Conectando con el Core Bancario...</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CRÉDITO</th>
                      <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>CLIENTE</th>
                      <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'right' }}>CUOTA VENCIDA</th>
                      <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>DÍAS ATRASO</th>
                      <th style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ÚLTIMA GESTIÓN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.length === 0 ? (
                      <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center' }}>No hay créditos en mora (o no hay créditos en estado Desembolsado).</td></tr>
                    ) : (
                      clientes.map((c) => {
                        const colores = getColorAtraso(c.diasAtraso);
                        return (
                          <tr key={c.id} onClick={() => setSel(c)} style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: sel?.id === c.id ? '#eff6ff' : '#fff', transition: 'background 0.2s' }}>
                            <td style={{ padding: '16px', fontWeight: 600, color: 'var(--bcp-azul)' }}>{c.credito}</td>
                            <td style={{ padding: '16px', color: 'var(--text-main)', fontWeight: 500 }}>{c.cliente}</td>
                            <td style={{ padding: '16px', color: '#dc2626', fontWeight: 700, textAlign: 'right' }}>{formatSoles(c.cuota)}</td>
                            <td style={{ padding: '16px', textAlign: 'center' }}>
                              <span style={{ background: colores.bg, color: colores.color, padding: '4px 12px', borderRadius: '20px', fontWeight: 700, fontSize: '0.85rem' }}>
                                {c.diasAtraso} días
                              </span>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{c.gestion}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── COLUMNA DERECHA: PANEL DE GESTIÓN DE COBRANZA ── */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', alignSelf: 'start', position: 'sticky', top: '40px' }}>
            <h3 style={{ fontSize: '1.1rem', color: 'var(--bcp-azul)', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PhoneCall size={18} /> Registrar Gestión
            </h3>

            {!sel ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <ShieldAlert size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
                <p>Selecciona un cliente de la tabla para registrar una acción de cobranza.</p>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '20px', borderLeft: `4px solid ${getColorAtraso(sel.diasAtraso).color}` }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Gestionando a:</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>{sel.cliente}</div>
                  <div style={{ fontSize: '0.85rem', color: '#dc2626', fontWeight: 600 }}>Deuda total: {formatSoles(sel.deudaTotal)}</div>
                </div>

                {exito && (
                  <div style={{ background: '#dcfce7', color: '#166534', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                    <CheckCircle size={18} /> ¡Gestión registrada en el Kardex!
                  </div>
                )}

                <form onSubmit={registrarGestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Tipo de Gestión</label>
                    <select value={gestion.tipo} onChange={e => setGestion({...gestion, tipo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}>
                      <option value="Llamada">Llamada Telefónica</option>
                      <option value="Visita">Visita a Domicilio / Negocio</option>
                      <option value="Carta">Carta Notarial</option>
                      <option value="Promesa">Promesa de Pago</option>
                    </select>
                  </div>

                  {gestion.tipo === 'Promesa' && (
                    <div style={{ animation: 'fadeIn 0.3s' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarClock size={16} /> Fecha de Compromiso
                      </label>
                      <input type="date" required value={gestion.fechaPromesa} onChange={e => setGestion({...gestion, fechaPromesa: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={16} /> Comentarios / Detalles
                    </label>
                    <textarea required value={gestion.comentario} onChange={e => setGestion({...gestion, comentario: e.target.value})} placeholder="Ej. El cliente indica que pagará el día viernes..." rows={4} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                  </div>

                  <button type="submit" disabled={loading} style={{ background: 'var(--bcp-naranja)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}>
                    {loading ? 'Guardando...' : 'Guardar Gestión'}
                  </button>
                </form>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}