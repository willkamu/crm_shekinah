
import React, { useState } from 'react';
import { useApp } from '../App';
import { Church, Lock, User, Flame } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useApp();

  const [activeTab, setActiveTab] = useState<'MEMBER' | 'LEADER'>('MEMBER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLeaderLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // 🔐 Login lógico (mock) para líderes
    if (!email || !password) {
      alert('Ingrese usuario y contraseña');
      return;
    }

    // Por ahora todo líder entra como LIDER_ANEXO
    login('LIDER_ANEXO');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">

      {/* Decoración */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-sky-500/10 rounded-full blur-3xl" />

      <div className="w-full max-w-[400px] bg-white rounded-[2rem] shadow-2xl overflow-hidden relative z-10 border border-slate-100">

        {/* Header */}
        <div className="p-8 text-center bg-white">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-blue-200 ring-4 ring-blue-50">
            <Church className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">La Shekinah</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Plataforma de Gestión Ministerial</p>
        </div>

        {/* Tabs */}
        <div className="px-8 mb-6">
          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
            <button
              onClick={() => setActiveTab('MEMBER')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'MEMBER'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              Soy Miembro
            </button>

            <button
              onClick={() => setActiveTab('LEADER')}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'LEADER'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              Soy Líder / Pastor
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="px-8 pb-10">

          {/* MIEMBRO */}
          {activeTab === 'MEMBER' && (
            <div className="space-y-6">
              <button
                onClick={() => login('MIEMBRO')}
                className="w-full py-4 bg-white border-2 border-slate-100 hover:border-blue-200 hover:bg-slate-50 rounded-xl font-bold flex items-center justify-center gap-3 transition-all group shadow-sm text-slate-700 cursor-pointer"
              >
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  className="w-5 h-5 group-hover:scale-110 transition-transform"
                />
                Continuar con Google
              </button>

              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-center">
                <p className="text-xs text-blue-800 font-medium">
                  Accederás a tu perfil de miembro, cursos y células.
                </p>
              </div>

              <p className="text-[10px] text-center text-slate-400 font-medium">
                Al ingresar aceptas las políticas de privacidad de la iglesia.
              </p>
            </div>
          )}

          {/* LÍDER */}
          {activeTab === 'LEADER' && (
            <form onSubmit={handleLeaderLogin} className="space-y-5">

              <div className="relative">
                <input
                  type="text"
                  placeholder="Usuario o correo"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl text-sm font-bold border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
                <User className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
              </div>

              <div className="relative">
                <input
                  type="password"
                  placeholder="Contraseña"
                  className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-xl text-sm font-bold border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-400 text-slate-800"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Lock className="w-5 h-5 absolute left-4 top-4 text-slate-400" />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all active:scale-[0.98] cursor-pointer"
              >
                Acceder al Panel
              </button>

              {/* DEMOS */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-[10px] font-bold text-center">
                <button type="button" onClick={() => login('PASTOR_PRINCIPAL')} className="bg-slate-50 hover:bg-slate-100 rounded-lg p-2 border border-slate-200 text-slate-600 transition-colors cursor-pointer">
                  Demo Pastor
                </button>
                <button type="button" onClick={() => login('LIDER_ANEXO')} className="bg-slate-50 hover:bg-slate-100 rounded-lg p-2 border border-slate-200 text-slate-600 transition-colors cursor-pointer">
                  Demo Líder
                </button>
                <button
                  type="button"
                  onClick={() => login('LIDER_INTERCESION')}
                  className="bg-red-50 hover:bg-red-100 rounded-lg p-2 border border-red-100 text-red-600 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Flame className="w-3 h-3" />
                  Inter.
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50/50 p-4 text-center border-t border-slate-100">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            CHMS Shekinah v1.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
