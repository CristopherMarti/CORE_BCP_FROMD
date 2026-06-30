import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Users, FileSignature, CheckSquare, XSquare, AlertCircle } from 'lucide-react';

const formatSoles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

export default function SolicitudComitePage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. ESTADOS REALES ---
  const [solicitud, setSolicitud] = useState(null); // Empezamos en null
  const [loadingData, setLoadingData] = useState(true); // Para la pantalla de carga inicial

  // Estados del Comité
  const [comentario, setComentario] = useState('');
  const [montoAprobado, setMontoAprobado] = useState('');
  const [loading, setLoading] = useState(false);
  const [decisionFinal, setDecisionFinal] = useState(null); // 'APROBADO' o 'RECHAZADO'

  // --- 2. BUSCAR EL PRÉSTAMO EN LA BASE DE DATOS ---
  useEffect(() => {
    const fetchCreditoPendiente = async () => {
      try {
        const response = await fetch('https://core-bcp-backend.onrender.com/api/solicitudes/bandeja', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        // Buscamos el primero que esté "En Comité"
        const pendiente = data.find(p => p.estado === 'En Evaluación');
        
        if (pendiente) {
          setSolicitud(pendiente);
          setMontoAprobado(pendiente.monto); // Sugerimos aprobar el monto total
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setLoadingData(false);
      }
    };
    fetchCreditoPendiente();
  }, []);

  // --- 3. ENVIAR LA DECISIÓN A PYTHON (FASTAPI) ---
  const handleDecision = async (decision) => {
    setLoading(true);
    try {
      const nuevoEstado = decision === 'APROBADO' ? 'Desembolsado' : 'Rechazado';
      
      const response = await fetch(`https://core-bcp-backend.onrender.com/api/solicitudes/${solicitud.id_prestamo}/estado`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ estado: nuevoEstado, observacion: comentario })
      });

      if (response.ok) {
        setDecisionFinal(decision);
        // Si se aprueba, tras 2 segundos simulamos que pasa al área de desembolso
        if (decision === 'APROBADO') {
          setTimeout(() => navigate('/solicitudes'), 2000); // Te devuelve a la bandeja
        } else {
          setTimeout(() => navigate('/solicitudes'), 2000);
        }
      }
    } catch (error) {
      console.error("Error al guardar decisión:", error);
      alert("Hubo un error al comunicar con el servidor.");
    } finally {
      setLoading(false);
    }
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

  // Si está cargando datos de la BD
  if (loadingData) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h3>Cargando expedientes del comité...</h3></div>;
  }

  // Si la bandeja está vacía (No hay nada "En Comité")
  if (!solicitud) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg-app)' }}>
        <CheckSquare size={60} color="#16a34a" style={{ marginBottom: '20px' }} />
        <h2>Bandeja Limpia</h2>
        <p>No hay solicitudes pendientes de evaluación de comité en este momento.</p>
        <button onClick={() => navigate('/solicitudes')} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--bcp-azul)', color: '#fff', borderRadius: '8px', border: 'none', cursor: 'pointer' }}>Volver a la Bandeja</button>
      </div>
    );
  }

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
                const isActive = location.pathname === item.path;
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
      <main style={{ marginLeft: '270px', flex: 1, padding: '40px', maxWidth: '1200px' }}>
        
        <button onClick={() => navigate('/solicitudes/registro')} style={{ background: 'transparent', border: 'none', color: 'var(--bcp-azul)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '20px' }}>
          <ArrowLeft size={18} /> Volver a Registro
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Resolución de Comité</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Evaluación final de Jefatura y Gerencia MYPE.</p>
          </div>
          <div style={{ background: '#e0e7ff', color: '#4f46e5', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
            {solicitud.estado}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
          
          {/* ── COLUMNA IZQUIERDA: RESUMEN FINANCIERO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--bcp-azul)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} /> Resumen Ejecutivo de la Propuesta
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>CLIENTE</div>
                  {/* DATOS REALES: */}
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Cliente #{solicitud.cliente_id}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONTO SOLICITADO ({solicitud.plazo_meses}m)</div>
                  {/* DATOS REALES: */}
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--bcp-naranja)' }}>{formatSoles(solicitud.monto)}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '20px', marginBottom: '20px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Propósito del Crédito</div>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{solicitud.proposito}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Saldo Pendiente</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626' }}>{formatSoles(solicitud.saldo_pendiente || 0)}</div>
                </div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', padding: '16px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700, marginBottom: '12px' }}>✔ Capacidad de Pago Verificada por Asesor</div>
                {/* Estos los dejamos fijos por ahora para mantener el diseño visual */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#14532d', marginBottom: '6px' }}>
                  <span>Ingresos Sustentados:</span> <strong>S/ 5,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#14532d', marginBottom: '6px' }}>
                  <span>Gastos Familiares:</span> <strong>- S/ 2,000.00</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', color: '#166534', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #bbf7d0' }}>
                  <strong>Saldo Disponible Neto:</strong> <strong>S/ 3,000.00</strong>
                </div>
              </div>
            </div>
          </div>

          {/* ── COLUMNA DERECHA: DECISIÓN Y FIRMA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--bcp-azul)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileSignature size={20} /> Veredicto Final
              </h3>

              {decisionFinal ? (
                <div style={{ textAlign: 'center', padding: '20px 0', animation: 'fadeIn 0.5s' }}>
                  {decisionFinal === 'APROBADO' ? (
                    <>
                      <CheckSquare size={60} color="#16a34a" style={{ margin: '0 auto 16px' }} />
                      <h3 style={{ color: '#16a34a', fontSize: '1.5rem', margin: '0 0 8px' }}>¡CRÉDITO APROBADO!</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Monto final otorgado: <strong>{formatSoles(montoAprobado)}</strong></p>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '16px' }}>Volviendo a la bandeja general...</p>
                    </>
                  ) : (
                    <>
                      <XSquare size={60} color="#dc2626" style={{ margin: '0 auto 16px' }} />
                      <h3 style={{ color: '#dc2626', fontSize: '1.5rem', margin: '0 0 8px' }}>CRÉDITO RECHAZADO</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Operación denegada en la base de datos.</p>
                      <p style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '16px' }}>Volviendo a la bandeja general...</p>
                    </>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  <div style={{ background: '#fffbeb', border: '1px solid #fde047', padding: '12px 16px', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#854d0e', fontSize: '0.85rem' }}>
                    <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>Como Gerente/Jefe de Agencia, tu decisión sobre esta solicitud es definitiva y actualiza el Core Financiero al instante.</span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Monto Final a Aprobar (S/)</label>
                    <input type="number" value={montoAprobado} onChange={e => setMontoAprobado(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1.2rem', fontWeight: 700, color: 'var(--bcp-azul)', outline: 'none' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Sustento / Observaciones</label>
                    <textarea value={comentario} onChange={e => setComentario(e.target.value)} placeholder="Ej. Se aprueba según capacidad de pago verificada..." rows={4} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
                  </div>

                  <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                    <button onClick={() => handleDecision('RECHAZADO')} disabled={loading} style={{ flex: 1, background: '#fff', color: '#dc2626', border: '2px solid #dc2626', padding: '14px', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                      <XSquare size={20} /> Rechazar
                    </button>
                    
                    <button onClick={() => handleDecision('APROBADO')} disabled={loading} style={{ flex: 2, background: '#16a34a', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', gap: '8px', opacity: loading ? 0.7 : 1 }}>
                      {loading ? 'Procesando en BD...' : <><CheckSquare size={20} /> Aprobar Operación</>}
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}