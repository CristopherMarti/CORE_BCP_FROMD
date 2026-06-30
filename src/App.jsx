import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// --- IMPORTACIÓN DE TODAS TUS PÁGINAS ---
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SolicitudesBandejaPage from './pages/SolicitudesBandejaPage';
import SolicitudNuevaPage from './pages/SolicitudNuevaPage';
import SolicitudRegistroPage from './pages/SolicitudRegistroPage';
import SolicitudComitePage from './pages/SolicitudComitePage';
import SolicitudDesembolsoPage from './pages/SolicitudDesembolsoPage';
import RecuperacionesMoraPage from './pages/RecuperacionesMoraPage';
import BandejaMoraPage from './pages/BandejaMoraPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta por defecto */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Login y Dashboard */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        
        {/* Flujo de Otorgamiento de Créditos */}
        <Route path="/solicitudes" element={<SolicitudesBandejaPage />} />
        <Route path="/solicitudes/pre" element={<SolicitudNuevaPage />} />
        <Route path="/solicitudes/registro" element={<SolicitudRegistroPage />} />
        <Route path="/solicitudes/comite" element={<SolicitudComitePage />} />
        <Route path="/solicitudes/aprobacion" element={<SolicitudDesembolsoPage />} />
        
        {/* Flujo de Recuperaciones y Mora */}
        <Route path="/recuperaciones/mora" element={<RecuperacionesMoraPage />} />
        <Route path="/recuperaciones/bandeja" element={<BandejaMoraPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;