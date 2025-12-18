
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
  Wifi,
  Package // v1.1
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { UserRole } from '../types';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, setCurrentUser, notifications, markNotificationRead, logout } = useApp();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Menú ESTRICTO según Manual (Parte 12.1 y 12.3)
  const navItems = [
    // 1. MIEMBROS (Solo ven esto y Recursos/Eventos)
    { label: 'Mi Perfil', icon: UserCircle, path: '/profile', role: ['MIEMBRO', 'PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL'] },

    // 2. LÍDERES / PASTORES (Panel Operativo)
    { label: 'Panel', icon: LayoutDashboard, path: '/', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'SECRETARIA_CASA', 'SECRETARIA_ANEXO'] },

    // 3. GESTIÓN DE ESTRUCTURA (Solo Pastor)
    { label: 'Sedes', icon: MapPin, path: '/sedes', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO'] },

    // 4. DIRECTORIO (Líderes ven su gente, Pastor ve todo)
    { label: 'Miembros', icon: Users, path: '/members', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'SECRETARIA_CASA', 'SECRETARIA_ANEXO'] },

    // 5. CASAS (Gestión Global para Pastor)
    { label: 'Casas', icon: HomeIcon, path: '/casas', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO'] },

    // 6. MINISTERIOS (Líderes ven locales, Pastor globales)
    { label: 'Ministerios', icon: ShieldCheck, path: '/ministries', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_ANEXO'] },

    // 7. INTERCESIÓN (Solo Pastor y Líderes de Intercesión - NO Líder de Anexo)
    { label: 'Intercesión', icon: HeartHandshake, path: '/intercesion', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_INTERCESION'] },

    // 8. FORMACIÓN (Todos ven catálogo, acciones dependen del rol)
    { label: 'Formación', icon: BookOpen, path: '/courses', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'MIEMBRO'] },

    // 9. EPMI (Gestión de Escuela - Solo Pastor/Ministro)
    { label: 'EPMI', icon: GraduationCap, path: '/epmi', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO'] },

    // 10. VIAJES (Todos ven, Líderes proponen)
    { label: 'Viajes', icon: Plane, path: '/viajes', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_ANEXO', 'MIEMBRO', 'LIDER_INTERCESION'] },

    // 11. FINANZAS (Solo Pastor y Tesoreros)
    { label: 'Finanzas', icon: Wallet, path: '/finances', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'LIDER_ANEXO', 'SECRETARIA_ANEXO'] },

    // v1.1 INVENTARIO
    { label: 'Inventario', icon: Package, path: '/inventory', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'LIDER_ANEXO', 'MAESTRO_CASA', 'SECRETARIA_ANEXO', 'SECRETARIA_CASA'] },

    // 12. EVENTOS (Todos)
    { label: 'Eventos', icon: CalendarDays, path: '/plan', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'MIEMBRO', 'SECRETARIA_CASA', 'SECRETARIA_ANEXO', 'LIDER_INTERCESION'] },

    // 13. RECURSOS (Todos)
    { label: 'Recursos', icon: BookOpen, path: '/resources', role: ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'LIDER_ANEXO', 'MAESTRO_CASA', 'MIEMBRO', 'LIDER_INTERCESION'] },
  ];

  function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    );
  }

  function HeartHandshake(props: React.SVGProps<SVGSVGElement>) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    );
  }

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as UserRole;
    if (role === 'PASTOR_PRINCIPAL') {
      setCurrentUser({ role: 'PASTOR_PRINCIPAL', anexoId: 'ALL', name: 'Pastor Cobertura' });
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
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200 h-full z-30 shadow-xl">
        <div className="flex items-center h-24 px-8 border-b border-slate-50">
          <div className="bg-blue-600 p-2.5 rounded-xl mr-3 shadow-lg shadow-blue-200">
            <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 leading-tight tracking-tight">Shekinah v1.0</h1>
            <p className="text-[10px] text-blue-600 font-bold tracking-widest uppercase mt-0.5">ChMS Teocrático</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          {filteredNavItems.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              className={`
                flex items-center px-4 py-3.5 text-sm font-bold rounded-xl transition-all duration-200 group cursor-pointer
                ${location.pathname === item.path
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                  : 'text-slate-500 hover:bg-blue-600 hover:text-white hover:shadow-md'}
              `}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-colors ${location.pathname === item.path ? 'text-blue-600' : 'text-slate-400 group-hover:text-white'}`} />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="p-6 space-y-4 border-t border-slate-50 bg-slate-50/50">
          <Link to="/support" className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold text-slate-500 hover:text-white hover:bg-blue-600 rounded-xl transition-all duration-200 border border-transparent hover:shadow-lg">
            <HelpCircle className="w-4 h-4" /> Ayuda / Soporte
          </Link>

          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 rounded-l-xl"></div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse ring-2 ring-blue-100"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Sesión Activa</p>
            </div>
            <div className="w-full bg-slate-50 border border-slate-100 text-sm font-bold text-slate-800 rounded-lg p-2.5 text-center truncate">
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="flex items-center justify-between h-20 px-4 lg:px-8 bg-white/90 backdrop-blur-xl sticky top-0 z-20 border-b border-slate-200 shadow-sm">
          <div className="flex items-center lg:hidden">
            <div className="bg-blue-600 p-2 rounded-xl mr-3 shadow-lg shadow-blue-200">
              <Church className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-xl tracking-tight">Shekinah</span>
          </div>

          <div className="flex-1 flex justify-end items-center gap-3 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full text-xs font-bold text-emerald-600 border border-emerald-100 shadow-sm">
              <Wifi className="w-3.5 h-3.5" /> <span>En Línea</span>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 relative hover:bg-slate-100 rounded-xl transition-all active:scale-95 group cursor-pointer"
              >
                <Bell className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-slideUp origin-top-right z-50 ring-1 ring-slate-200">
                  <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <h4 className="font-bold text-slate-800">Notificaciones</h4>
                    <button onClick={() => setShowNotifications(false)} className="p-1 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {notifications.length > 0 ? notifications.slice(0, 5).map(notif => (
                      <Link
                        key={notif.id}
                        to={notif.linkTo || '#'}
                        onClick={() => {
                          markNotificationRead(notif.id);
                          setShowNotifications(false);
                        }}
                        className={`block p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-50/40' : ''}`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${notif.type === 'ALERT' ? 'bg-red-500 shadow-sm shadow-red-200' : notif.type === 'SUCCESS' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-blue-500 shadow-sm shadow-blue-200'}`}></div>
                          <div>
                            <p className={`text-sm font-bold ${!notif.read ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">{notif.message}</p>
                            <p className="text-[10px] text-slate-400 mt-2 font-medium">{notif.date}</p>
                          </div>
                        </div>
                      </Link>
                    )) : (
                      <div className="p-8 text-center text-slate-400 text-sm">No tienes notificaciones</div>
                    )}
                  </div>
                  <Link to="/notifications" onClick={() => setShowNotifications(false)} className="block p-3 text-center text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors border-t border-slate-50 cursor-pointer">
                    Ver todas las actividades
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-3 pl-6 border-l border-slate-200 hover:opacity-80 transition-opacity cursor-pointer"
              >
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-xs text-blue-600 font-bold tracking-wide">{currentUser.role.replace('_', ' ')}</p>
                </div>
                <div className="relative group">
                  <img
                    className="h-10 w-10 rounded-full ring-4 ring-slate-50 group-hover:ring-blue-100 transition-all p-0.5 bg-white object-cover"
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                    alt="Profile"
                  />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-slideUp origin-top-right z-50 ring-1 ring-slate-200">
                  <div className="p-2 space-y-1">
                    <div className="px-3 py-2 md:hidden border-b border-slate-50 mb-1">
                      <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                      <p className="text-xs text-blue-600">{currentUser.role.replace('_', ' ')}</p>
                    </div>
                    <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors">
                      <UserCircle className="w-4 h-4" /> Mi Perfil
                    </Link>
                    <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-xl transition-colors">
                      <SettingsIcon className="w-4 h-4" /> Configuración
                    </Link>
                    <div className="h-px bg-slate-100 my-1 mx-2"></div>
                    <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <LogOut className="w-4 h-4" /> Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50 p-4 pb-28 lg:pb-8 page-transition scroll-smooth">
          <div className="max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* MOBILE NAVIGATION BAR FIXED (Edge-to-Edge Scroll) */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex overflow-x-auto no-scrollbar z-50 justify-start items-center h-[80px] px-2 pb-safe">
          {filteredNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`relative flex flex-col items-center justify-center min-w-[75px] h-full flex-shrink-0 transition-all duration-300 group px-1`}
            >
              <div className={`
                p-2 rounded-xl mb-1 transition-all duration-300
                ${location.pathname === item.path ? 'bg-blue-50 text-blue-600 -translate-y-1 shadow-sm' : 'text-slate-400 group-hover:text-blue-500'}
              `}>
                <item.icon className="w-6 h-6" strokeWidth={location.pathname === item.path ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] font-bold leading-none truncate w-full text-center transition-colors ${location.pathname === item.path ? 'text-blue-600' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Layout;
