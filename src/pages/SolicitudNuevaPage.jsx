import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, ShieldCheck, User, Calculator } from 'lucide-react';

const formatSoles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

export default function SolicitudNuevaPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados del Formulario
  const [form, setForm] = useState({ codcliente: '', monto: '', plazo: '', motivo: 'Capital de Trabajo' });
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Simular envío y evaluación del motor de reglas
  const handleEvaluar = (e) => {
    e.preventDefault();
    setLoading(true);
    setResultado(null);

    // Simulamos que el backend demora 1.5s en evaluar el riesgo
    setTimeout(() => {
      setResultado({
        codsolicitud: 'SOL-000127',
        estado: 'En Evaluación',
        scoring: { score: 785, decision: 'APROBADO', tea: 18.5, cuota: (form.monto / form.plazo) * 1.18 },
        elegibilidad: { resultado: 'APTO', calificacion: '100% Normal', motivos: [] },
        rds: { cuotaIngreso: 25, endeudamientoGlobal: 40 },
        ruta: ['Asesor MYPE', 'Jefe de Agencia']
      });
      setLoading(false);
    }, 1500);
  };

  // --- ESTRUCTURA DEL MENÚ LATERAL (Para mantener navegación) ---
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

        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Nueva solicitud de crédito (Pre-scoring)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Originación de crédito MYPE: evaluación de elegibilidad y ruta de aprobación.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* ── FORMULARIO DE INGRESO ── */}
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--bcp-azul)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} /> Datos de la Propuesta
            </h3>
            
            <form onSubmit={handleEvaluar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Código del Cliente</label>
                <input type="text" value={form.codcliente} onChange={e => setForm({...form, codcliente: e.target.value.toUpperCase()})} placeholder="Ej. CLI-000123" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Destino / Motivo</label>
                <select value={form.motivo} onChange={e => setForm({...form, motivo: e.target.value})} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }}>
                  <option value="Capital de Trabajo">Capital de Trabajo</option>
                  <option value="Activo Fijo">Activo Fijo</option>
                  <option value="Consumo">Consumo</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Monto (S/)</label>
                  <input type="number" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})} placeholder="0.00" min="1000" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '6px' }}>Plazo (Meses)</label>
                  <input type="number" value={form.plazo} onChange={e => setForm({...form, plazo: e.target.value})} placeholder="12" min="1" required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none' }} />
                </div>
              </div>

              <button type="submit" disabled={loading} style={{ marginTop: '10px', background: 'var(--bcp-naranja)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <Calculator size={20} />
                {loading ? 'Consultando Motor de Reglas...' : 'Evaluar Solicitud'}
              </button>
            </form>
          </div>

          {/* ── PANEL DE RESULTADOS (MOTOR DE RIESGO) ── */}
          <div style={{ background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <h3 style={{ fontSize: '1.2rem', color: 'var(--bcp-azul)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={20} /> Resultado de la Evaluación
            </h3>

            {loading && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}>⏳</div>
                <p style={{ marginTop: '10px' }}>Analizando bases centrales de riesgo...</p>
              </div>
            )}

            {!loading && !resultado && (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                Completa el formulario a la izquierda para evaluar la viabilidad del crédito.
              </div>
            )}

            {!loading && resultado && (
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                {/* Alerta de Éxito */}
                <div style={{ background: '#dcfce7', border: '1px solid #86efac', padding: '14px', borderRadius: '8px', color: '#166534', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <CheckCircle size={20} />
                  <div>Solicitud <strong>{resultado.codsolicitud}</strong> creada. Estado: <strong>{resultado.estado}</strong></div>
                </div>

                {/* Score y Decisión */}
                <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
                  <div style={{ flex: 1, background: '#f8fafc', padding: '16px', borderRadius: '8px', borderLeft: '4px solid #16a34a' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Score Crediticio</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>{resultado.scoring.score} <span style={{ fontSize: '0.9rem', color: '#16a34a', background: '#dcfce7', padding: '2px 8px', borderRadius: '10px', verticalAlign: 'middle' }}>{resultado.scoring.decision}</span></div>
                  </div>
                  <div style={{ flex: 1, background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '4px' }}>TEA Sugerida: <strong style={{ color: 'var(--text-main)' }}>{resultado.scoring.tea}%</strong></div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Cuota Estimada: <strong style={{ color: 'var(--text-main)' }}>{formatSoles(resultado.scoring.cuota)}</strong></div>
                  </div>
                </div>

                {/* Elegibilidad */}
                <div style={{ marginBottom: '24px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--bcp-azul)', marginBottom: '8px' }}>Elegibilidad SBS</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#16a34a' }}></div>
                    <strong>{resultado.elegibilidad.resultado}</strong> — Calificación {resultado.elegibilidad.calificacion}
                  </div>
                </div>

                {/* Ruta de Aprobación */}
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--bcp-azul)', marginBottom: '12px' }}>Ruta de Aprobación</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {resultado.ruta.map((paso, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: idx === 0 ? 'var(--bcp-naranja)' : '#e2e8f0', color: idx === 0 ? '#fff' : '#64748b', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>
                          {idx + 1}. {paso}
                        </div>
                        {idx < resultado.ruta.length - 1 && <div style={{ color: '#cbd5e1' }}>→</div>}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}