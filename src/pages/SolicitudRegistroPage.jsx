import { useState, useEffect } from 'react'; // Agregamos useEffect para la carga local
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, DollarSign, Activity, CheckCircle } from 'lucide-react';

const formatSoles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

export default function SolicitudRegistroPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- NUEVO: Estado para controlar la carga de la base de datos ---
  const [loadingData, setLoadingData] = useState(true);

  // Estados de carga y simulación de la solicitud - Ahora inician vacíos
  const [solicitud, setSolicitud] = useState({
    id_prestamo: null,
    codigo: '',
    cliente: '', 
    monto: 0,
    plazo: 12,
    estado: '',
    cliente_id: null
  });

  // Formularios
  const [ingreso, setIngreso] = useState({ tipo: 'DE', monto: '', empresa: '' });
  const [evaluacion, setEvaluacion] = useState({ ingresoMensual: '', gastoFamiliar: '', fortaleza: '', debilidad: '' });

  // Flujo visual
  const [loadingAccion, setLoadingAccion] = useState(false);
  const [paso, setPaso] = useState(1); // 1 = Ingresos, 2 = Evaluacion, 3 = Listo
  const [capacidadPago, setCapacidadPago] = useState(null);

  // --- NUEVA LÓGICA: Buscar el único préstamo 'En Evaluación' de tu Postgres ---
  useEffect(() => {
    const cargarSolicitudEnEvaluacion = async () => {
      try {
        // Consultamos al endpoint de la bandeja del Core Financiero
        const response = await fetch('http://localhost:8000/api/solicitudes/bandeja', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        // Filtramos exactamente la que está 'En Evaluación' (id_prestamo: 31 en tu imagen)
        const activa = data.find(p => p.estado === 'En Evaluación');
        
        if (activa) {
          setSolicitud({
            id_prestamo: activa.id_prestamo || activa.id,
            codigo: `PRE-${activa.id_prestamo || activa.id}`,
            cliente: activa.cliente || `Cliente #${activa.cliente_id}`, // Jala el nombre real si tu backend hace el JOIN
            monto: parseFloat(activa.monto),
            plazo: parseInt(activa.plazo_meses || activa.plazo),
            estado: activa.estado,
            cliente_id: activa.cliente_id
          });
        } else {
          alert("No se encontraron solicitudes 'En Evaluación' en la base de datos.");
        }
      } catch (error) {
        console.error("Error al conectar con las tablas del Core:", error);
      } finally {
        setLoadingData(false);
      }
    };

    cargarSolicitudEnEvaluacion();
  }, []);

  const handleGuardarIngreso = (e) => {
    e.preventDefault();
    setLoadingAccion(true);
    setTimeout(() => {
      setLoadingAccion(false);
      setEvaluacion({ ...evaluacion, ingresoMensual: ingreso.monto }); // Auto-llenar el siguiente paso
      setPaso(2);
    }, 800);
  };

  const handleGuardarEvaluacion = (e) => {
    e.preventDefault();
    setLoadingAccion(true);
    setTimeout(() => {
      const saldoDisponible = evaluacion.ingresoMensual - evaluacion.gastoFamiliar;
      const cuotaReferencial = (solicitud.monto / solicitud.plazo) * 1.18;
      
      setCapacidadPago({
        saldo: saldoDisponible,
        cuota: cuotaReferencial,
        aprobado: saldoDisponible > cuotaReferencial * 1.5 // Regla de negocio
      });
      setLoadingAccion(false);
      setPaso(3);
    }, 1200);
  };

  // --- LÓGICA CORREGIDA: Cambiar estado en lugar de crear un duplicado con POST ---
  const enviarAComite = async () => {
    setLoadingAccion(true);
    
    try {
      // Usamos el id_prestamo real capturado (31) y disparamos un PUT para avanzar el estado
      const response = await fetch(`http://localhost:8000/api/solicitudes/${solicitud.id_prestamo}/estado`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          estado: 'En Comité', // O el estado intermedio que reciba tu pantalla 3
          observacion: `Evaluación cualitativa guardada con éxito.`
        })
      });

      if (response.ok) {
        navigate('/solicitudes'); 
      } else {
        alert("Error al actualizar la solicitud en la base de datos.");
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setLoadingAccion(false);
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

  // Pantalla de carga para esperar la respuesta de Postgres
  if (loadingData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <h3>Cargando solicitud en evaluación desde el Core...</h3>
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
        
        <button onClick={() => navigate('/solicitudes')} style={{ background: 'transparent', border: 'none', color: 'var(--bcp-azul)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '20px' }}>
          <ArrowLeft size={18} /> Volver a Bandeja
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Registro de Solicitud ({solicitud.codigo})</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Sustento de ingresos y evaluación de capacidad de pago.</p>
          </div>
          <div style={{ background: '#fef9c3', color: '#ca8a04', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
            {solicitud.estado}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* ── COLUMNA IZQUIERDA: DETALLES Y FLUJO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Detalle del Crédito */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--bcp-azul)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={18} /> Detalle de la Solicitud
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Cliente:</strong> <span style={{ fontWeight: 600 }}>{solicitud.cliente}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Monto Solicitado:</strong> <span style={{ fontWeight: 600 }}>{formatSoles(solicitud.monto)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Plazo Sugerido:</strong> <span style={{ fontWeight: 600 }}>{solicitud.plazo} meses</span>
                </div>
              </div>
            </div>

            {/* PASO 1: Ingresos */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', opacity: paso >= 1 ? 1 : 0.5, pointerEvents: paso >= 1 ? 'auto' : 'none' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--bcp-azul)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} /> 1. Sustento de Ingresos
              </h3>
              
              {paso > 1 ? (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>INGRESO DECLARADO</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#16a34a' }}>{formatSoles(ingreso.monto)}</div>
                  </div>
                  <CheckCircle color="#16a34a" />
                </div>
              ) : (
                <form onSubmit={handleGuardarIngreso} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Tipo de Ingreso</label>
                    <select value={ingreso.tipo} onChange={e => setIngreso({...ingreso, tipo: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}>
                      <option value="DE">Dependiente (Boletas)</option>
                      <option value="NE">Negocio Propio</option>
                      <option value="RH">Recibo por Honorarios</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Monto (S/)</label>
                    <input type="number" value={ingreso.monto} onChange={e => setIngreso({...ingreso, monto: e.target.value})} required placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                  <button type="submit" disabled={loadingAccion} style={{ background: 'var(--bcp-naranja)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                    {loadingAccion ? 'Guardando...' : 'Guardar Ingreso'}
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* ── COLUMNA DERECHA: EVALUACIÓN Y COMITÉ ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* PASO 2: Evaluación Financiera */}
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', opacity: paso >= 2 ? 1 : 0.5, pointerEvents: paso >= 2 ? 'auto' : 'none' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--bcp-azul)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={18} /> 2. Evaluación Financiera Cualitativa
              </h3>

              {paso > 2 ? (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>SALDO NETO DISPONIBLE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--bcp-azul)' }}>{formatSoles(evaluacion.ingresoMensual - evaluacion.gastoFamiliar)}</div>
                  </div>
                  <CheckCircle color="#16a34a" />
                </div>
              ) : (
                <form onSubmit={handleGuardarEvaluacion} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Ingreso Verificado</label>
                      <input type="number" value={evaluacion.ingresoMensual} readOnly style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#f1f5f9' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Gastos Familiares</label>
                      <input type="number" value={evaluacion.gastoFamiliar} onChange={e => setEvaluacion({...evaluacion, gastoFamiliar: e.target.value})} required placeholder="0.00" style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px', display: 'block' }}>Fortaleza (Ej. Local propio)</label>
                    <input type="text" value={evaluacion.fortaleza} onChange={e => setEvaluacion({...evaluacion, fortaleza: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }} />
                  </div>
                  <button type="submit" disabled={loadingAccion} style={{ background: 'var(--bcp-naranja)', color: '#fff', border: 'none', padding: '12px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', marginTop: '8px' }}>
                    {loadingAccion ? 'Calculando...' : 'Evaluar Capacidad de Pago'}
                  </button>
                </form>
              )}
            </div>

            {/* PASO 3: Envío a Comité */}
            {paso === 3 && capacidadPago && (
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--bcp-azul)', marginBottom: '16px' }}>3. Decisión y Comité</h3>
                
                <div style={{ padding: '16px', borderRadius: '8px', background: capacidadPago.aprobado ? '#dcfce7' : '#fee2e2', border: `1px solid ${capacidadPago.aprobado ? '#86efac' : '#fca5a5'}`, marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.9rem', color: capacidadPago.aprobado ? '#166534' : '#991b1b', fontWeight: 700, marginBottom: '8px' }}>
                    {capacidadPago.aprobado ? '✔ Capacidad de Pago Óptima' : '⚠ Riesgo de Sobreendeudamiento'}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Cuota referencial: <strong>{formatSoles(capacidadPago.cuota)}</strong></div>
                  <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>Saldo del cliente: <strong>{formatSoles(capacidadPago.saldo)}</strong></div>
                </div>

                <button onClick={enviarAComite} disabled={loadingAccion} style={{ width: '100%', background: 'var(--bcp-azul)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>
                  {loadingAccion ? 'Registrando en Base de Datos...' : 'Enviar Propuesta a Comité →'}
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}