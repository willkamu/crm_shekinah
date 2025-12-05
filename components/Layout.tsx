
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Church,
  Wallet,
  CalendarDays,
  ShieldCheck,
  ChevronDown,
  MapPin,
  Plane,
  Bell,
  GraduationCap,
  X,
  Settings as SettingsIcon,
  LogOut,
  HelpCircle,
  UserCircle,
  Wifi
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, notifications, markNotificationRead, logout } = useApp();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Menú PDF Parte 12.1 + EPMI based on Roles
  const navItems = [
    { label: 'Mi Perfil', icon: UserCircle, path: '/profile', role: ['MIEMBRO'] }, 
    { label: 'Panel', icon: LayoutDashboard, path: '/', role: ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'SECRETARIA_CASA', 'SECRETARIA_ANEXO'] },
    { label: 'Mi Anexo', icon: MapPin, path: '/sedes', role: ['LIDER_ANEXO', 'PASTOR_PRINCIPAL', 'SECRETARIA_ANEXO'] },
    { label: 'Sedes', icon: MapPin, path: '/sedes', role: ['PASTOR_PRINCIPAL', 'MINISTRO'] },
    { label: 'Miembros', icon: Users, path: '/members', role: ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'SECRETARIA_CASA', 'SECRETARIA_ANEXO'] },
    { label: 'Casas', icon: HomeIcon, path: '/casas', role: ['LIDER_ANEXO', 'MAESTRO_CASA', 'PASTOR_PRINCIPAL'] }, 
    { label: 'Ministerios', icon: ShieldCheck, path: '/ministries', role: ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO'] },
    { label: 'Intercesión', icon: HeartHandshake, path: '/intercesion', role: ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO'] }, 
    { label: 'Formación', icon: BookOpen, path: '/courses', role: ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'MIEMBRO'] },
    { label: 'EPMI', icon: GraduationCap, path: '/epmi', role: ['PASTOR_PRINCIPAL', 'MINISTRO'] }, 
    { label: 'Viajes', icon: Plane, path: '/viajes', role: ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO', 'MIEMBRO'] },
    { label: 'Finanzas', icon: Wallet, path: '/finances', role: ['PASTOR_PRINCIPAL', 'LIDER_ANEXO', 'SECRETARIA_ANEXO'] },
    { label: 'Eventos', icon: CalendarDays, path: '/plan' }, 
  ];

  function HomeIcon(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
  function HeartHandshake(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>}

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as UserRole;
    if (role === 'PASTOR_PRINCIPAL') {
      setCurrentUser({ role: 'PASTOR_PRINCIPAL', anexoId: 'ALL', name: 'Pastor Principal' });
    } else if (role === 'LIDER_ANEXO') {
      setCurrentUser({ role: 'LIDER_ANEXO', anexoId: 'ANX-02', name: 'Hno. Roberto' });
    } else if (role === 'MIEMBRO') {
      setCurrentUser({ role: 'MIEMBRO', anexoId: 'ANX-01', name: 'Maria Gonzalez', memberId: 'MEM-002' });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNavItems = navItems.filter(item => {
      if (!item.role) return true;
      return item.role.includes(currentUser.role);
  });

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-100 h-full z-30 shadow-card">
        <div className="flex items-center h-24 px-8">
          <div className="bg-gradient-to-tr from-brand-blue to-brand-light p-2.5 rounded-2xl mr-3 shadow-glow">
             <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 leading-tight tracking-tight">Shekinah v1.0</h1>
            <p className="text-[10px] text-brand-blue font-bold tracking-widest uppercase mt-0.5">ChMS Teocrático</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-6 space-y-2">
          {filteredNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`
                flex items-center px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 group
                ${location.pathname === item.path 
                  ? 'bg-brand-soft text-brand-blue shadow-soft translate-x-1' 
                  : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}
              `}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${location.pathname === item.path ? 'text-brand-blue' : 'text-slate-300 group-hover:text-slate-500'}`} />
              {item.label}
            </Link>
          ))}
        </div>
        
        <div className="p-6 space-y-4">
             <Link to="/support" className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-400 hover:text-brand-blue hover:bg-brand-soft rounded-xl transition-colors">
                 <HelpCircle className="w-4 h-4" /> Ayuda / Soporte
             </Link>

             <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-brand-blue animate-pulse"></div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Rol Actual</p>
                </div>
                <select 
                  className="w-full bg-white border border-slate-200 text-sm font-bold text-slate-700 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-light/50 transition-shadow cursor-pointer hover:border-brand-light"
                  value={currentUser.role}
                  onChange={handleRoleChange}
                >
                  <option value="PASTOR_PRINCIPAL">👑 Pastor Principal</option>
                  <option value="LIDER_ANEXO">👷 Líder Anexo</option>
                  <option value="MIEMBRO">👤 Miembro</option>
                </select>
             </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex items-center justify-between h-20 px-4 lg:px-10 bg-white/80 backdrop-blur-xl sticky top-0 z-20 border-b border-slate-100/50">
          <div className="flex items-center lg:hidden">
             <div className="bg-gradient-to-tr from-brand-blue to-brand-light p-2 rounded-xl mr-3 shadow-sm">
                <Church className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-slate-800 text-lg tracking-tight">Shekinah</span>
          </div>

          <div className="flex-1 flex justify-end items-center gap-4">
             <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full text-xs font-bold text-emerald-600 border border-emerald-100">
                 <Wifi className="w-3 h-3" /> En Línea
             </div>

             <div className="lg:hidden relative group">
                <select 
                  className="appearance-none bg-slate-100 text-xs font-bold text-slate-600 py-2 pl-4 pr-8 rounded-full border-none focus:ring-0 shadow-sm"
                  value={currentUser.role}
                  onChange={handleRoleChange}
                >
                  <option value="PASTOR_PRINCIPAL">Pastor</option>
                  <option value="LIDER_ANEXO">Líder</option>
                  <option value="MIEMBRO">Miembro</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
             </div>

            <div className="relative">
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 relative hover:bg-slate-100 rounded-full transition-colors"
                >
                    <Bell className="w-5 h-5 text-slate-400" />
                    {unreadCount > 0 && (
                        <div className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></div>
                    )}
                </button>

                {showNotifications && (
                    <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slideUp origin-top-right z-50">
                        <div className="p-4 border-b border-slate-50 flex justify-between items-center">
                            <h4 className="font-bold text-slate-700">Notificaciones</h4>
                            <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-slate-400" /></button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.slice(0, 5).map(notif => (
                                <Link 
                                    key={notif.id}
                                    to={notif.linkTo || '#'}
                                    onClick={() => {
                                        markNotificationRead(notif.id);
                                        setShowNotifications(false);
                                    }}
                                    className={`block p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!notif.read ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex gap-3">
                                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.type === 'ALERT' ? 'bg-red-500' : notif.type === 'SUCCESS' ? 'bg-emerald-500' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <p className={`text-sm font-bold ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>{notif.title}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                                            <p className="text-[10px] text-slate-400 mt-2">{notif.date}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                        <Link to="/notifications" onClick={() => setShowNotifications(false)} className="block p-3 text-center text-xs font-bold text-brand-blue hover:bg-slate-50 transition-colors">
                            Ver todas
                        </Link>
                    </div>
                )}
            </div>

            <div className="relative">
                <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 pl-6 border-l border-slate-100 hover:opacity-80 transition-opacity"
                >
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                        <p className="text-xs text-brand-blue font-medium">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                    <div className="relative">
                        <img 
                        className="h-10 w-10 rounded-full ring-4 ring-brand-soft p-0.5 bg-white object-cover" 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} 
                        alt="Profile" 
                        />
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-brand-blue border-2 border-white rounded-full"></div>
                    </div>
                </button>

                {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-slideUp origin-top-right z-50">
                        <div className="p-2 space-y-1">
                            <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl">
                                <SettingsIcon className="w-4 h-4 text-slate-400" /> Configuración
                            </Link>
                            <div className="h-px bg-slate-50 my-1"></div>
                            <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl">
                                <LogOut className="w-4 h-4" /> Cerrar Sesión
                            </button>
                        </div>
                    </div>
                )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#f8fafc] p-4 pb-32 lg:pb-12 page-transition scroll-smooth">
          <div className="max-w-7xl mx-auto">
             {children}
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-white/95 backdrop-blur-2xl border border-white/40 shadow-2xl shadow-slate-200/50 rounded-3xl flex justify-around py-3 px-2 z-50">
          {filteredNavItems.slice(0, 5).map((item) => (
            <Link 
              key={item.path} 
              to={item.path}
              className={`relative flex flex-col items-center justify-center w-full transition-all duration-300 group`}
            >
              <div className={`
                p-2.5 rounded-2xl mb-1 transition-all duration-300
                ${location.pathname === item.path ? 'bg-brand-soft text-brand-blue scale-110 shadow-soft' : 'text-slate-300 group-hover:bg-slate-50 group-hover:text-slate-500'}
              `}>
                 <item.icon className="w-6 h-6" strokeWidth={2.5} />
              </div>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
