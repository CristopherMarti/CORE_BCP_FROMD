import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CalendarDays, DollarSign, CheckCircle, Download, CreditCard } from 'lucide-react';

const formatSoles = (n) => 'S/ ' + Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function SolicitudDesembolsoPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- 1. ESTADO REAL DE LA SOLICITUD ---
  const [solicitud, setSolicitud] = useState({
    id_prestamo: null,
    codigo: '',
    cliente: '',
    montoAprobado: 0,
    plazo: 12,
    tea: 43.92, // Aplicamos por defecto la tasa del tarifario MYPE del PDF
    estado: '',
    cuentaDestino: '191-XXXXXXXX-X-XX'
  });

  const [loadingData, setLoadingData] = useState(true);
  const [loading, setLoading] = useState(false);
  const [cronograma, setCronograma] = useState(null);
  const [desembolsado, setDesembolsado] = useState(false);

  // --- 2. CONSULTAR EL ÚNICO CRÉDITO EVALUADO / PENDIENTE ---
  useEffect(() => {
    const cargarCreditoPendiente = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/solicitudes/bandeja', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        
        // Buscamos la solicitud que avanzó en el flujo (ej. ID: 31 o que esté Pendiente Desembolso)
        // Adaptable según el estado exacto que guardaste en el paso 2
        const pendiente = data.find(p => p.estado.includes('Pendiente') || p.estado === 'En Comité' || p.id_prestamo === 31);
        
        if (pendiente) {
          setSolicitud({
            id_prestamo: pendiente.id_prestamo || pendiente.id,
            codigo: `PRE-${pendiente.id_prestamo || pendiente.id}`,
            cliente: pendiente.cliente || `Cliente #${pendiente.cliente_id}`,
            montoAprobado: parseFloat(pendiente.monto),
            plazo: parseInt(pendiente.plazo_meses || pendiente.plazo),
            tea: 43.92, // Tasa oficial Micro Micro sin desgravamen especificada en el PDF
            estado: pendiente.estado,
            cuentaDestino: `191-000000${pendiente.cliente_id}-0-16` // Cuenta dinámica simulada
          });
        }
      } catch (error) {
        console.error("Error al acoplar datos de desembolso:", error);
      } finally {
        setLoadingData(false);
      }
    };
    cargarCreditoPendiente();
  }, []);

  // --- 3. LLAMADA DINÁMICA A PYTHON PARA CALCULAR CRONOGRAMA ---
  const generarCronograma = async () => {
    setLoading(true);
    try {
      // Invocamos al motor matemático de tu Core (FastAPI) en el puerto 8000/8001
      const response = await fetch(`http://localhost:8000/api/solicitudes/calcular-cronograma`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          monto: parseFloat(solicitud.montoAprobado),
          plazo: parseInt(solicitud.plazo),
          tea: parseFloat(solicitud.tea)
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setCronograma(data.cronograma); // Asigna el array calculado matemáticamente en Python
      } else {
        alert("Error en el motor matemático del Core.");
      }
    } catch (error) {
      console.error("Error de red al calcular cuotas:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- 4. EJECUTAR DESEMBOLSO EN LA BASE DE DATOS (MÉTODO PUT) ---
  const ejecutarDesembolso = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/api/solicitudes/${solicitud.id_prestamo}/estado`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          estado: 'Desembolsado',
          observacion: 'Fondos transferidos con éxito. Crédito en fase de pago.'
        })
      });

      if (response.ok) {
        setDesembolsado(true);
      } else {
        alert("Error al procesar la transferencia en el Core.");
      }
    } catch (error) {
      console.error("Error al impactar base de datos:", error);
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

  if (loadingData) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><h3>Cargando parámetros y cuentas financieras...</h3></div>;
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
        
        <button onClick={() => navigate('/solicitudes/comite')} style={{ background: 'transparent', border: 'none', color: 'var(--bcp-azul)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, marginBottom: '20px' }}>
          <ArrowLeft size={18} /> Volver a Comité
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Desembolso de Crédito</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Generación de cronograma y transferencia de fondos.</p>
          </div>
          <div style={{ background: desembolsado ? '#dcfce7' : '#e0e7ff', color: desembolsado ? '#16a34a' : '#4f46e5', padding: '8px 16px', borderRadius: '20px', fontWeight: 700, fontSize: '0.9rem' }}>
            {desembolsado ? 'Desembolsado Exitosamente' : solicitud.estado}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '24px' }}>
          
          {/* ── COLUMNA IZQUIERDA: RESUMEN Y ACCIONES ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--bcp-azul)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} /> Condiciones Finales
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Cliente:</strong> <span style={{ fontWeight: 600 }}>{solicitud.cliente}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Monto:</strong> <span style={{ fontWeight: 800, color: 'var(--bcp-naranja)' }}>{formatSoles(solicitud.montoAprobado)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>Plazo:</strong> <span style={{ fontWeight: 600 }}>{solicitud.plazo} meses</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--text-muted)' }}>TEA Applied:</strong> <span style={{ fontWeight: 600, color: '#dc2626' }}>{solicitud.tea}% (MYPE)</span>
                </div>
              </div>

              {!cronograma && !desembolsado && (
                <button onClick={generarCronograma} disabled={loading} style={{ width: '100%', marginTop: '20px', background: 'var(--bg-app)', border: '1px solid var(--bcp-azul)', color: 'var(--bcp-azul)', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {loading ? 'Calculando en Python...' : <><CalendarDays size={18} /> Generar Cronograma</>}
                </button>
              )}
            </div>

            {/* Panel de Desembolso */}
            {cronograma && !desembolsado && (
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', animation: 'fadeIn 0.5s' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 16px' }}>Destino de Fondos</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>El dinero será transferido a la cuenta de ahorros vinculada al cliente.</p>
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--bcp-azul)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <CreditCard size={18} /> {solicitud.cuentaDestino}
                </div>
                
                <button onClick={ejecutarDesembolso} disabled={loading} style={{ width: '100%', background: 'var(--bcp-naranja)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                  {loading ? 'Impactando Base de Datos...' : 'Realizar Desembolso'}
                </button>
              </div>
            )}
          </div>

          {/* ── COLUMNA DERECHA: CRONOGRAMA REAL DESDE EL BACKEND ── */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--bcp-azul)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={18} /> Cronograma de Pagos
              </h3>
            </div>

            {desembolsado ? (
              <div style={{ textAlign: 'center', padding: '40px 0', animation: 'fadeIn 0.5s' }}>
                <CheckCircle size={80} color="#16a34a" style={{ margin: '0 auto 20px' }} />
                <h3 style={{ color: '#16a34a', fontSize: '1.8rem', margin: '0 0 10px' }}>¡Desembolso Exitoso!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '400px', margin: '0 auto 24px' }}>
                  Se han transferido {formatSoles(solicitud.montoAprobado)} a la cuenta {solicitud.cuentaDestino}. El estado en PostgreSQL ha pasado a "Desembolsado".
                </p>
                <button onClick={() => navigate('/dashboard')} style={{ background: 'var(--bcp-azul)', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                  Ir al Dashboard Principal
                </button>
              </div>
            ) : !cronograma ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
                Haz clic en "Generar Cronograma" para llamar a tu API de Python y estructurar las cuotas.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', animation: 'fadeIn 0.5s' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.85rem' }}>
                  <thead style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: 'var(--text-muted)' }}>
                    <tr>
                      <th style={{ padding: '12px', textAlign: 'center' }}>N°</th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>FECHA PAGO</th>
                      <th style={{ padding: '12px' }}>CAPITAL</th>
                      <th style={{ padding: '12px' }}>INTERÉS</th>
                      <th style={{ padding: '12px' }}>CUOTA TOTAL</th>
                      <th style={{ padding: '12px' }}>SALDO DEUDOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cronograma.map((c) => (
                      <tr key={c.nro} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 600 }}>{c.nro}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>{c.fecha}</td>
                        <td style={{ padding: '12px' }}>{formatSoles(c.capital)}</td>
                        <td style={{ padding: '12px' }}>{formatSoles(c.interes)}</td>
                        <td style={{ padding: '12px', fontWeight: 700, color: 'var(--bcp-azul)' }}>{formatSoles(c.cuota)}</td>
                        <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{formatSoles(c.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}