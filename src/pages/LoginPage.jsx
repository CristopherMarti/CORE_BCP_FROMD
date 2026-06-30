import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [matricula, setMatricula] = useState('S123456'); // Dejamos tu usuario por defecto para probar rápido
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Tocamos la puerta del Backend (FastAPI en el puerto 8000)
      const response = await fetch('https://core-bcp-backend.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matricula, password })
      });

      const data = await response.json();

      // 2. Si el guardia (Python) dice que no, mostramos el error
      if (!response.ok) {
        throw new Error(data.detail || 'Error al iniciar sesión');
      }

      // 3. Si todo está bien, guardamos el Token VIP y los datos
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      // 4. ¡Abrimos las puertas al Core Bancario!
      navigate('/dashboard');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f4f6f9' }}>
      
      {/* Lado Izquierdo: Formulario */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <h1 style={{ fontSize: '2rem', margin: '0 0 10px', fontWeight: 800, color: 'var(--bcp-azul)' }}>
              <span style={{ color: 'var(--bcp-naranja)' }}>&gt;</span>BCP
            </h1>
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>Core Financiero</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>Ingresa tus credenciales de colaborador</p>
          </div>

          {error && (
            <div style={{ background: '#fee2e2', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Matrícula</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}>
                <User size={18} color="#64748b" />
                <input type="text" value={matricula} onChange={(e) => setMatricula(e.target.value)} required style={{ width: '100%', padding: '12px 10px', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Contraseña</label>
              <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0 12px' }}>
                <Lock size={18} color="#64748b" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 10px', border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem' }} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ background: 'var(--bcp-naranja)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>
              {loading ? 'Verificando seguridad...' : 'Ingresar al Sistema'}
            </button>
          </form>

        </div>
      </div>

      {/* Lado Derecho: Imagen Institucional */}
      <div style={{ flex: 1.2, background: 'var(--bcp-azul)', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ zIndex: 1, maxWidth: '500px' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '20px', lineHeight: 1.2 }}>Gestión MYPE<br/>ágil y segura.</h2>
          <p style={{ fontSize: '1.1rem', color: '#A0B2D9', lineHeight: 1.6 }}>Plataforma integral para el otorgamiento de créditos, análisis de riesgos y recuperación de cartera. Uso exclusivo para colaboradores BCP.</p>
        </div>
        {/* Adorno visual */}
        <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '600px', height: '600px', background: 'rgba(255,105,0,0.1)', borderRadius: '50%', zIndex: 0 }}></div>
      </div>

    </div>
  );
}