import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';

// --- DATOS ESTÁTICOS (Para los gráficos que aún no conectamos) ---
const dataCuentas = [
  { name: 'Cuentas Corrientes', value: 150000 },
  { name: 'Cuentas de Ahorro', value: 100000 }
];
const dataMora = [
  { mes: 'Ene', ratio: 2.1 },
  { mes: 'Feb', ratio: 2.4 },
  { mes: 'Mar', ratio: 2.2 },
  { mes: 'Abr', ratio: 2.8 },
  { mes: 'May', ratio: 3.1 },
  { mes: 'Jun', ratio: 2.5 }
];
const COLORES_BCP = ['#ff6900', '#002a8d'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true); // Faltaba esta variable
  const [kpis, setKpis] = useState({
    cartera_activa: 0,
    total_monto: 0,
    total_clientes: 0,
    grafico_proposito: []
  });

  // --- LLAMADA AL BACKEND ---
  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const response = await fetch('https://core-bcp-backend.onrender.com/api/dashboard/kpis', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();
        setKpis(data);
      } catch (error) {
        console.error("Error al cargar KPIs:", error);
      } finally {
        setLoading(false); // Apagamos el mensaje de carga al terminar
      }
    };
    cargarDashboard();
  }, []);

  const formatSoles = (n) => 'S/ ' + Number(n).toLocaleString('es-PE', { minimumFractionDigits: 2 });

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
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--bcp-naranja)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>U</div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Cristopher Mendez</div>
              <div style={{ fontSize: '0.7rem', color: '#A0B2D9' }}>Asesor MYPE</div>
            </div>
          </div>
          <button onClick={() => navigate('/login')} style={{ width: '100%', background: 'transparent', border: '1px solid #A0B2D9', color: '#fff', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* ── ÁREA PRINCIPAL ── */}
      <main style={{ marginLeft: '270px', flex: 1, padding: '40px', maxWidth: '1400px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
          <div>
            <h2 style={{ color: 'var(--text-main)', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 8px' }}>Dashboard Gerencial MYPE</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 0 }}>Resumen general de la agencia · Período actual: Junio 2026</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Cargando indicadores desde la base de datos...</div>
        ) : (
          <>
            {/* ── TARJETAS (KPIs REALES) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderBottom: '4px solid var(--bcp-naranja)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cartera Activa</div>
                <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '8px' }}>{formatSoles(kpis.cartera_activa)}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderBottom: '4px solid var(--bcp-azul)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Colocaciones</div>
                <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '8px' }}>{formatSoles(kpis.total_monto)}</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderBottom: '4px solid #0ea5e9', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Empresas MYPE</div>
                <div style={{ fontSize: '1.6rem', color: 'var(--text-main)', fontWeight: 800, marginTop: '8px' }}>{kpis.total_clientes} clientes</div>
              </div>
              <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', borderBottom: '4px solid #dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Mora Vencida</div>
                <div style={{ fontSize: '1.6rem', color: '#dc2626', fontWeight: 800, marginTop: '8px' }}>S/ 0.00</div>
              </div>
            </div>

            {/* ── GRÁFICOS ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px', marginBottom: '20px' }}>
              
              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 20px' }}>Composición de Captaciones</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={dataCuentas} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {dataCuentas.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORES_BCP[index % COLORES_BCP.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatSoles(value)} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 20px' }}>Colocaciones por Propósito (Datos BD)</h3>
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={kpis.grafico_proposito} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} tickFormatter={(val) => `S/ ${val/1000}k`} />
                      <Tooltip formatter={(value) => formatSoles(value)} cursor={{fill: '#f4f6f9'}} />
                      <Bar dataKey="value" fill="var(--bcp-naranja)" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: '0 0 20px' }}>Evolución Índice de Morosidad (%)</h3>
              <div style={{ height: '250px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dataMora} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#666'}} />
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Line type="monotone" dataKey="ratio" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#dc2626', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </>
        )}
      </main>
    </div>
  );
}