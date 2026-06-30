import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, Download, AlertCircle, TrendingUp, Calendar, MessageSquare, Filter, Clock } from 'lucide-react';

const formatSoles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

export default function BandejaMoraPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({ montoRiesgo: 0, promesas: 0 });

  // --- LLAMADA AL BACKEND ---
  useEffect(() => {
    const fetchBandejaMora = async () => {
      try {
        const response = await fetch('https://core-bcp-backend.onrender.com/api/recuperaciones/mora', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();

        let totalRiesgo = 0;
        let promesasHoy = 0;

        // --- DENTRO DE TU EFECTO EN BANDEJA GENERAL DE MORA ---
        const datosFormateados = data.map(m => {
          let tramoVisual = 'preventiva';
          let tarea = 'Recordatorio SMS';

          if (m.estado === 'mora_grave') {
            tramoVisual = 'gestion';
            tarea = 'Visita de Campo';
          } else if (m.estado === 'mora_critica') {
            tramoVisual = 'judicial';
            tarea = 'Notificación de Embargo';
          }

          const deudaReal = parseFloat(m.saldo_pendiente || 0);
          totalRiesgo += deudaReal;

          if (tramoVisual === 'preventiva') promesasHoy++;

          return {
            id: m.id_prestamo,
            cliente: `Cliente #${m.cliente_id}`,
            deudaTotal: deudaReal,
            dias: m.plazo_meses || 15,
            tramo: tramoVisual,
            tareaAsignada: tarea,
            gestor: 'Cristopher M.'
          };
        });

        setAsignaciones(datosFormateados);
        setKpis({ montoRiesgo: totalRiesgo, promesas: promesasHoy });

      } catch (error) {
        console.error("Error al cargar la bandeja general:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBandejaMora();
  }, []);

  // --- MENÚ LATERAL ---
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

  // Helper visual para los tramos (Igual a tu diseño)
  const getTramoBadge = (tramo, dias) => {
    if (tramo === 'preventiva') return <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>Preventiva (1-30d)</span>;
    if (tramo === 'gestion') return <span style={{ background: '#ffedd5', color: '#ea580c', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>Gestión (31-90d)</span>;
    return <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700 }}>Judicial (+90d)</span>;
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
        
        {/* CABECERA Y BOTONES DE ACCIÓN */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Bandeja General de Mora</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Vista consolidada de cartera en riesgo y tareas de cobranza asignadas.</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ background: '#f8fafc', color: 'var(--bcp-azul)', border: '1px solid #cbd5e1', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Mail size={16} /> SMS Masivo Preventivo
            </button>
            <button style={{ background: '#16a34a', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Download size={16} /> Exportar Reporte
            </button>
          </div>
        </div>

        {/* ── TARJETAS (KPIs GERENCIALES) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
          
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', borderBottom: '4px solid #dc2626', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={16} color="#dc2626" /> MONTO EN RIESGO TOTAL
            </div>
            <div style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '12px' }}>{formatSoles(kpis.montoRiesgo)}</div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', borderBottom: '4px solid var(--bcp-naranja)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={16} color="var(--bcp-naranja)" /> ÍNDICE DE MORA GLOBAL
            </div>
            <div style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '12px' }}>
              4.8% <span style={{ fontSize: '1rem', color: '#dc2626', fontWeight: 600 }}>↑ 0.2%</span>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', borderBottom: '4px solid #16a34a', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} color="#16a34a" /> RECUPERADO DEL MES
            </div>
            <div style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '12px' }}>S/ 0.00</div>
          </div>

          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', borderBottom: '4px solid var(--bcp-azul)', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} color="var(--bcp-azul)" /> PROMESAS PARA HOY
            </div>
            <div style={{ fontSize: '1.8rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '12px' }}>{kpis.promesas} Clientes</div>
          </div>

        </div>

        {/* ── TABLA DE ASIGNACIONES GERENCIALES ── */}
        <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
          
          <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>Lista de Asignaciones ({asignaciones.length})</h3>
            <button style={{ background: '#f8fafc', color: 'var(--text-main)', border: '1px solid #cbd5e1', padding: '8px 16px', borderRadius: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <Filter size={16} /> Filtrar por Tramo
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando asignaciones desde el Core Bancario...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>CLIENTE / EMPRESA</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>DEUDA TOTAL</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>DÍAS</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textAlign: 'center' }}>TRAMO</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>TAREA ASIGNADA (HOY)</th>
                  <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>GESTOR</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.length === 0 ? (
                  <tr><td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay asignaciones de mora en este momento. ¡Excelente trabajo!</td></tr>
                ) : (
                  asignaciones.map((a) => (
                    <tr key={a.id} style={{ borderTop: '1px solid #f1f5f9', transition: 'background 0.2s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: 'var(--bcp-azul)' }}>{a.cliente}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 700, color: '#dc2626' }}>{formatSoles(a.deudaTotal)}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 800, textAlign: 'center' }}>{a.dias}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>{getTramoBadge(a.tramo, a.dias)}</td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} color="#94a3b8" /> {a.tareaAsignada}
                      </td>
                      <td style={{ padding: '16px 20px', color: 'var(--text-main)', fontSize: '0.9rem' }}>{a.gestor}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
}