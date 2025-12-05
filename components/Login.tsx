
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { Church, Lock, ArrowRight, User, Shield, GraduationCap, Mail } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useApp();
  const [activeTab, setActiveTab] = useState<'MEMBER' | 'LEADER'>('MEMBER');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-3xl pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none z-0"></div>

      <div className="w-full max-w-[400px] bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp relative z-10 border border-white/50">
        
        <div className="p-8 pb-6 text-center">
            <div className="w-16 h-16 bg-brand-blue rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow text-white">
                <Church className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">La Shekinah</h1>
            <p className="text-sm text-slate-400 font-medium mt-1">Plataforma de Gestión Ministerial</p>
        </div>

        {/* Custom Tabs */}
        <div className="px-8 mb-6">
            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                    onClick={() => setActiveTab('MEMBER')}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'MEMBER' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Soy Miembro
                </button>
                <button 
                    onClick={() => setActiveTab('LEADER')}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === 'LEADER' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Soy Líder/Pastor
                </button>
            </div>
        </div>

        <div className="px-8 pb-10">
            {activeTab === 'MEMBER' && (
                <div className="space-y-4 animate-fadeIn">
                    <button 
                        onClick={() => login('MIEMBRO')} 
                        className="w-full py-4 bg-white border-2 border-slate-100 hover:border-brand-blue/30 text-slate-600 font-bold rounded-2xl transition-all flex items-center justify-center gap-3 group"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Continuar con Google
                    </button>
                    <p className="text-[10px] text-center text-slate-400 px-4 leading-relaxed">
                        Al ingresar, aceptas el código de honor y la política de privacidad de datos de la iglesia.
                    </p>
                </div>
            )}

            {activeTab === 'LEADER' && (
                <div className="space-y-4 animate-fadeIn">
                    <div className="relative">
                        <input 
                            type="email" 
                            placeholder="Usuario / Correo" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100 text-slate-700 font-bold text-sm outline-none transition-shadow"
                        />
                        <User className="w-5 h-5 text-slate-300 absolute left-4 top-4" />
                    </div>
                    <div className="relative">
                        <input 
                            type="password" 
                            placeholder="Contraseña" 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-indigo-100 text-slate-700 font-bold text-sm outline-none transition-shadow"
                        />
                        <Lock className="w-5 h-5 text-slate-300 absolute left-4 top-4" />
                    </div>
                    
                    <button 
                        onClick={() => login('PASTOR_PRINCIPAL')}
                        className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                        Acceder al Panel
                    </button>

                    <div className="pt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <button onClick={() => login('LIDER_ANEXO')} className="hover:text-indigo-500 transition-colors">Demo Líder</button>
                        <button onClick={() => login('MAESTRO_CASA')} className="hover:text-indigo-500 transition-colors">Demo Maestro</button>
                    </div>
                </div>
            )}
        </div>
        
        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-300 uppercase">ChMS Shekinah v1.0 Secure</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
