import React, { useState } from 'react';
import { useApp } from '../App';
import { UserRole } from '../types';
import { Church, Lock, User, Shield } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useApp();
  const [activeTab, setActiveTab] = useState<'MEMBER' | 'LEADER'>('LEADER');
  const [selectedRole, setSelectedRole] = useState<string>('LIDER_ANEXO');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'LEADER') {
      // DEV MODE: Login directly with selected role
      console.log(`[LOGIN] Ingresando como: ${selectedRole}`);
      login(selectedRole);
    } else {
      // Member login demo
      login('MIEMBRO');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl shadow-blue-900/10 p-8 relative z-10 border border-white/50">

        {/* Branding - La Shekinah Style */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/30 mb-4">
            <Church className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">La Shekinah</h1>
          <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Plataforma de Gestión Ministerial</p>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-slate-50 rounded-xl mb-8 relative">
          <button
            onClick={() => setActiveTab('MEMBER')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${activeTab === 'MEMBER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Soy Miembro
          </button>
          <button
            onClick={() => setActiveTab('LEADER')}
            className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all duration-300 relative z-10 ${activeTab === 'LEADER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
              }`}
          >
            Soy Líder / Pastor
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">

          {activeTab === 'LEADER' ? (
            <>
              {/* DEV MODE SELECTOR */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1 flex items-center gap-2">
                  <Shield className="w-3 h-3 text-blue-600" />
                  Selecciona Rol de Prueba:
                </label>

                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full pl-4 pr-10 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer transition-all hover:bg-white focus:bg-white"
                  >
                    <optgroup label="👑 Cúpula Pastoral">
                      <option value="PASTOR_PRINCIPAL">Pastor Principal</option>
                      <option value="PASTOR_GENERAL">Pastor General</option>
                      <option value="PASTORA_GENERAL">Pastora General</option>
                      <option value="PASTOR_EJECUTIVO">Pastor Ejecutivo</option>
                      <option value="SECRETARIA_PASTORAL">Secretaria Pastoral</option>
                    </optgroup>

                    <optgroup label="🏛️ Liderazgo Local">
                      <option value="LIDER_ANEXO">Líder de Anexo</option>
                      <option value="MINISTRO">Ministro</option>
                      <option value="TESORERO">Tesorero (Simulado)</option>
                      <option value="SECRETARIA_ANEXO">Secretaria Anexo</option>
                    </optgroup>

                    <optgroup label="🔥 Ministerios">
                      <option value="MAESTRO_CASA">Maestro Casa Enseñanza</option>
                      <option value="SECRETARIA_CASA">Secretaria Casa</option>
                      <option value="LIDER_INTERCESION">Líder Intercesión</option>
                    </optgroup>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-slate-400"></div>
                </div>

                {/* Fake Inputs for Visual Completeness (Disabled) */}
                <div className="relative opacity-50 pointer-events-none">
                  <User className="absolute left-4 top-4 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    value="usuario.demo"
                    readOnly
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-medium text-slate-500 border-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2"
              >
                Acceder como {selectedRole.split('_')[0]}
              </button>
            </>
          ) : (
            /* MEMBER TAB CONTENT - GMAIL STYLE */
            <div className="space-y-8 pt-2">
              <div className="text-center">
                <h3 className="text-slate-900 font-bold mb-2 text-lg">¡Bienvenido!</h3>
                <p className="text-sm text-slate-500 max-w-[240px] mx-auto leading-relaxed">
                  Identifícate con tu cuenta registrada para acceder a tus cursos y células.
                </p>
              </div>

              <button
                onClick={() => login('MIEMBRO')}
                type="button"
                className="w-full py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-base shadow-lg shadow-slate-200/50 hover:bg-slate-50 active:scale-95 transition-all flex justify-center items-center gap-3"
              >
                {/* Google G Logo SVG */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continuar con Google
              </button>
            </div>
          )}

        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            CHMS Shekinah v1.1 • Dev Mode
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
