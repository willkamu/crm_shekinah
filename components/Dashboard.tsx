
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { Users, Home, X, Plus, Edit2, Trash2, ChevronRight, Activity, TrendingUp, MapPin, GraduationCap, Plane, AlertTriangle, CheckCircle, BarChart3, AlertCircle, BookOpen, Calendar, CheckSquare, ShieldCheck, Wallet } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Anexo, TeachingHouse } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
  const { anexos, members, finances, updateAnexo, currentUser, setCurrentUser, teachingHouses, addTeachingHouse, updateTeachingHouse, deleteTeachingHouse, epmiEnrollments, trips, monthlyReports, events, attendance } = useApp();
  const [selectedAnnexForHouses, setSelectedAnnexForHouses] = useState<string | null>(null);
  const [editingAnexo, setEditingAnexo] = useState<Anexo | null>(null);
  const navigate = useNavigate();
  
  // Create House Modal State
  const [isCreateHouseOpen, setIsCreateHouseOpen] = useState(false);
  const [newHouseName, setNewHouseName] = useState('');
  const [newHouseDay, setNewHouseDay] = useState('');
  const [newHouseMaestro, setNewHouseMaestro] = useState('');

  // Editing House State inside Modal
  const [editingHouseId, setEditingHouseId] = useState<string | null>(null);
  const [editHouseName, setEditHouseName] = useState('');

  // --- SECURITY: REDIRECT MEMBERS TO PROFILE (PDF 12.6) ---
  // If role is MIEMBRO, they should NEVER see the Admin Dashboard.
  if (currentUser.role === 'MIEMBRO') {
      return <Navigate to="/profile" replace />;
  }

  // --- SPECIAL VIEW: MAESTRO_CASA (PDF 12.4) ---
  if (currentUser.role === 'MAESTRO_CASA') {
      const myHouse = teachingHouses.find(h => h.maestroNombre === currentUser.name);
      // Fallback if not assigned specifically by name in mock
      const houseToDisplay = myHouse || teachingHouses.find(h => h.anexoId === currentUser.anexoId); 
      
      const myStudents = members.filter(m => m.teachingHouseId === houseToDisplay?.id);
      const activeStudentsCount = myStudents.length;
      const attendanceAvg = '92%'; // Calculated mock

      if (!houseToDisplay) return <div className="p-8 text-center text-slate-400">No tienes una casa de enseñanza asignada. Contacta a tu líder.</div>;

      return (
          <div className="space-y-8 animate-fadeIn max-w-3xl mx-auto">
              {/* Teacher Header */}
              <div className="bg-gradient-to-r from-orange-400 to-amber-500 rounded-[2.5rem] p-8 text-white shadow-glow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
                  <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-2">
                          <div className="bg-white/20 p-2 rounded-xl"><Home className="w-6 h-6"/></div>
                          <h2 className="text-2xl font-bold tracking-tight">{houseToDisplay.nombre}</h2>
                      </div>
                      <p className="text-white/80 font-medium ml-1">Maestro: {currentUser.name}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mt-8">
                          <div className="bg-black/10 p-4 rounded-2xl backdrop-blur-sm">
                              <span className="block text-3xl font-extrabold">{activeStudentsCount}</span>
                              <span className="text-xs uppercase font-bold opacity-80">Alumnos Activos</span>
                          </div>
                          <div className="bg-black/10 p-4 rounded-2xl backdrop-blur-sm">
                              <span className="block text-3xl font-extrabold">{attendanceAvg}</span>
                              <span className="text-xs uppercase font-bold opacity-80">Asistencia Mes</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => navigate('/attendance')} className="bg-white p-6 rounded-3xl shadow-card border border-slate-50 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
                      <div className="bg-sky-100 p-4 rounded-full mb-3 text-sky-600"><CheckSquare className="w-8 h-8"/></div>
                      <span className="font-bold text-slate-700">Tomar Asistencia</span>
                  </button>
                  <Link to="/courses" className="bg-white p-6 rounded-3xl shadow-card border border-slate-50 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
                      <div className="bg-emerald-100 p-4 rounded-full mb-3 text-emerald-600"><BookOpen className="w-8 h-8"/></div>
                      <span className="font-bold text-slate-700">Cursos Básicos</span>
                  </Link>
              </div>

              {/* Students List */}
              <div className="bg-white rounded-[2.5rem] p-6 shadow-card border border-slate-50">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-slate-400" /> Mis Alumnos
                  </h3>
                  <div className="space-y-3">
                      {myStudents.map(student => (
                          <div key={student.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                              <div className="flex items-center gap-3">
                                  <img src={student.photoUrl} className="w-10 h-10 rounded-full bg-white" />
                                  <div>
                                      <p className="font-bold text-slate-700 text-sm">{student.nombres}</p>
                                      <p className="text-[10px] text-slate-400 font-bold uppercase">{student.estatus}</p>
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <span className={`w-3 h-3 rounded-full ${student.attendance_level === 'VERDE' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                              </div>
                          </div>
                      ))}
                      {myStudents.length === 0 && <p className="text-center text-slate-400 text-sm">No hay alumnos asignados.</p>}
                  </div>
              </div>
          </div>
      );
  }

  // --- SPECIAL VIEW: LIDER_ANEXO (PDF 12.3) ---
  if (currentUser.role === 'LIDER_ANEXO' || currentUser.role === 'SECRETARIA_ANEXO') {
      const myAnexo = anexos.find(a => a.id === currentUser.anexoId);
      const myMembers = members.filter(m => m.anexoId === currentUser.anexoId);
      const myHouses = teachingHouses.filter(h => h.anexoId === currentUser.anexoId);
      const myActiveHouses = myHouses.filter(h => h.active).length;
      // Calculate attendance avg logic here
      const attendanceAvg = '82%'; 

      return (
          <div className="space-y-8 animate-fadeIn">
              {/* Leader Header */}
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-glow">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                      <div>
                          <h2 className="text-3xl font-bold tracking-tight mb-1">{myAnexo?.nombre || 'Mi Anexo'}</h2>
                          <p className="text-slate-400 text-sm font-medium">Panel de Liderazgo</p>
                      </div>
                      <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md self-end md:self-auto">
                          <Users className="w-6 h-6 text-white"/>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/20 p-3 rounded-2xl">
                          <div className="text-2xl font-extrabold">{myMembers.length}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Miembros</div>
                      </div>
                      <div className="bg-black/20 p-3 rounded-2xl">
                          <div className="text-2xl font-extrabold">{myHouses.length}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Casas</div>
                      </div>
                      <div className="bg-black/20 p-3 rounded-2xl">
                          <div className="text-2xl font-extrabold">{myActiveHouses}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Activas</div>
                      </div>
                      <div className="bg-emerald-500/20 p-3 rounded-2xl border border-emerald-500/30">
                          <div className="text-2xl font-bold text-emerald-400">{attendanceAvg}</div>
                          <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-wider">Asistencia</div>
                      </div>
                  </div>
              </div>

              {/* 6 KEY ACTIONS (PDF 12.3) - Optimized Layout */}
              <h3 className="text-lg font-bold text-slate-800 px-2">Gestión Operativa</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <Link to="/attendance" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all h-32 group">
                      <div className="bg-sky-50 p-3 rounded-2xl mb-2 text-sky-600 group-hover:bg-sky-100 transition-colors"><CheckSquare className="w-6 h-6"/></div>
                      <span className="font-bold text-slate-700 text-xs uppercase leading-tight">Registrar<br/>Culto</span>
                  </Link>
                  <Link to="/casas" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all h-32 group">
                      <div className="bg-orange-50 p-3 rounded-2xl mb-2 text-orange-600 group-hover:bg-orange-100 transition-colors"><Home className="w-6 h-6"/></div>
                      <span className="font-bold text-slate-700 text-xs uppercase leading-tight">Casas de<br/>Enseñanza</span>
                  </Link>
                  <Link to="/courses" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all h-32 group">
                      <div className="bg-violet-50 p-3 rounded-2xl mb-2 text-violet-600 group-hover:bg-violet-100 transition-colors"><BookOpen className="w-6 h-6"/></div>
                      <span className="font-bold text-slate-700 text-xs uppercase leading-tight">Formación<br/>Básica</span>
                  </Link>
                  <Link to="/ministries" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all h-32 group">
                      <div className="bg-pink-50 p-3 rounded-2xl mb-2 text-pink-600 group-hover:bg-pink-100 transition-colors"><ShieldCheck className="w-6 h-6"/></div>
                      <span className="font-bold text-slate-700 text-xs uppercase leading-tight">Ministerios<br/>Locales</span>
                  </Link>
                  <Link to="/viajes" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all h-32 group">
                      <div className="bg-indigo-50 p-3 rounded-2xl mb-2 text-indigo-600 group-hover:bg-indigo-100 transition-colors"><Plane className="w-6 h-6"/></div>
                      <span className="font-bold text-slate-700 text-xs uppercase leading-tight">Viajes<br/>Propuestos</span>
                  </Link>
                  <Link to="/finances" className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center hover:shadow-md hover:-translate-y-1 transition-all h-32 group">
                      <div className="bg-emerald-50 p-3 rounded-2xl mb-2 text-emerald-600 group-hover:bg-emerald-100 transition-colors"><Wallet className="w-6 h-6"/></div>
                      <span className="font-bold text-slate-700 text-xs uppercase leading-tight">Finanzas<br/>Mensuales</span>
                  </Link>
              </div>

              {/* Members Preview */}
              <div className="bg-white rounded-[2.5rem] p-6 shadow-card border border-slate-50">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-bold text-slate-800">Miembros Recientes</h3>
                      <Link to="/members" className="text-xs font-bold text-brand-blue hover:underline">Ver Directorio</Link>
                  </div>
                  <div className="space-y-3">
                      {myMembers.slice(0, 3).map(m => (
                          <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                              <img src={m.photoUrl} className="w-10 h-10 rounded-full bg-white" />
                              <div className="flex-1">
                                  <p className="font-bold text-slate-700 text-sm">{m.nombres}</p>
                                  <div className="flex gap-2">
                                      <span className="text-[10px] text-slate-400 uppercase font-bold">{m.estatus}</span>
                                  </div>
                              </div>
                              <div className={`w-2.5 h-2.5 rounded-full ${m.attendance_level === 'VERDE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      );
  }

  // --- STANDARD DASHBOARD LOGIC (PASTOR ONLY) ---
  const displayedAnexos = anexos;

  // Stats Logic (Aggregated)
  const totalMembers = members.length;
  const totalFinance = finances.reduce((sum, f) => sum + f.monto, 0);
  const activeEpmiStudents = epmiEnrollments.filter(e => e.status === 'ACTIVO').length;
  
  // Monthly Report Check
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const anexosWithoutReport = anexos.filter(a => 
      !monthlyReports.some(r => r.anexoId === a.id && r.month === currentMonth && r.year === currentYear && r.status !== 'PENDIENTE')
  ).length;

  // REAL TREND DATA FOR CHART (GROWTH ANALYTICS)
  const generateRealTrendData = () => {
      const monthStats: Record<string, { attendance: number, count: number, nuevos: number }> = {};
      const monthsOrder: string[] = [];

      for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleString('es-ES', { month: 'short' });
          monthStats[key] = { attendance: 0, count: 0, nuevos: 0 };
          monthsOrder.push(key);
      }

      // Calculate Attendance
      events.forEach(event => {
          const date = new Date(event.fecha);
          const key = date.toLocaleString('es-ES', { month: 'short' });
          
          if (monthStats[key]) {
              const eventAttendees = Object.keys(attendance).filter(k => k.startsWith(`${event.id}-`) && attendance[k]).length;
              monthStats[key].attendance += eventAttendees;
              monthStats[key].count += 1;
          }
      });

      // Calculate New Members (Growth)
      members.forEach(m => {
          if (m.joinedAt) {
              const date = new Date(m.joinedAt);
              const key = date.toLocaleString('es-ES', { month: 'short' });
              if (monthStats[key]) {
                  monthStats[key].nuevos += 1;
              }
          }
      });

      return monthsOrder.map(month => ({
          name: month,
          asistencia: monthStats[month].count > 0 ? Math.round(monthStats[month].attendance / monthStats[month].count) : 0,
          nuevos: monthStats[month].nuevos
      }));
  };

  const trendData = generateRealTrendData();

  const handleCreateHouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHouseName || !selectedAnnexForHouses) return;
    
    addTeachingHouse({
        id: `H-${Date.now()}`,
        nombre: newHouseName,
        anexoId: selectedAnnexForHouses,
        maestroId: '', 
        maestroNombre: newHouseMaestro || 'Por asignar',
        diaReunion: newHouseDay || 'TBD',
        direccion: '',
        active: true
    });
    setIsCreateHouseOpen(false);
    setNewHouseName('');
    setNewHouseDay('');
    setNewHouseMaestro('');
  };

  const startEditHouse = (house: TeachingHouse) => {
    setEditingHouseId(house.id);
    setEditHouseName(house.nombre);
  };

  const saveEditHouse = (id: string) => {
      if (editHouseName.trim()) {
          updateTeachingHouse(id, { nombre: editHouseName });
      }
      setEditingHouseId(null);
  };

  const handleSaveAnexo = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAnexo) {
        updateAnexo(editingAnexo.id, {
            liderNombre: editingAnexo.liderNombre,
            telefono: editingAnexo.telefono,
            horario: editingAnexo.horario
        });
        setEditingAnexo(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* HEADER & RESET FILTER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
            Panel Pastoral
          </h2>
          <p className="text-slate-500 font-medium mt-1">
            Visión Global del Ministerio
          </p>
        </div>
      </div>

      {/* HERO CARD (Dynamic Data) */}
      <div className="bg-gradient-to-br from-brand-blue to-blue-600 rounded-[2.5rem] p-8 text-white shadow-glow relative overflow-hidden group">
         {/* Decorative Circles */}
         <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none group-hover:bg-white/15 transition-all duration-700"></div>
         <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl translate-y-20 -translate-x-20 pointer-events-none"></div>
         
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* KPI 1 */}
            <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3 text-brand-light">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <Users className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-white/90">Membresía Activa</span>
                </div>
                <div className="flex items-baseline justify-center md:justify-start gap-2">
                    <h3 className="text-5xl font-extrabold tracking-tight">{totalMembers}</h3>
                    <span className="text-sm font-medium text-blue-100">Almas</span>
                </div>
            </div>

             {/* KPI 2 - EPMI */}
            <div className="text-center border-l border-white/20 md:border-none pl-4 md:pl-0">
                <div className="flex items-center justify-center gap-2 mb-3 text-brand-light">
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-wider text-white/90">Estudiantes EPMI</span>
                </div>
                <h3 className="text-5xl font-extrabold tracking-tight">{activeEpmiStudents}</h3>
            </div>

             {/* KPI 3 - FINANCES */}
            <div className="text-center md:text-right border-l border-white/20 md:border-none pl-4 md:pl-0">
                <div className="flex items-center justify-center md:justify-end gap-2 mb-3 text-brand-light">
                    <span className="text-sm font-bold uppercase tracking-wider text-white/90">Ingresos Mes</span>
                    <div className="bg-white/20 p-1.5 rounded-lg">
                        <Activity className="w-5 h-5 text-white" />
                    </div>
                </div>
                 <div className="flex items-baseline justify-center md:justify-end gap-3">
                    <h3 className="text-4xl lg:text-5xl font-extrabold tracking-tight">S/ {totalFinance}</h3>
                </div>
            </div>
         </div>
      </div>

      {/* QUICK STATUS & CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SEMÁFOROS & CHARTS */}
          <div className="bg-white p-6 rounded-[2rem] shadow-card border border-slate-50 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-slate-400" /> Tendencia de Asistencia
              </h3>
              
              <div className="h-48 w-full mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAsistencia" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="asistencia" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorAsistencia)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-4 mt-auto">
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-2xl">
                      <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-glow"></div>
                          <span className="text-xs font-bold text-emerald-800">Salud General Iglesia</span>
                      </div>
                      <span className="text-[10px] font-bold bg-white px-2 py-1 rounded text-emerald-600 uppercase">Estable</span>
                  </div>
                  
                  {anexosWithoutReport > 0 && (
                      <div className="flex items-center justify-between p-3 bg-red-50 rounded-2xl animate-pulse">
                          <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-red-500 rounded-full shadow-glow"></div>
                              <span className="text-xs font-bold text-red-800">Faltan Reportes ({currentMonth})</span>
                          </div>
                          <span className="text-[10px] font-bold bg-white px-2 py-1 rounded text-red-600">{anexosWithoutReport} Anexos</span>
                      </div>
                  )}
              </div>
          </div>

          {/* ACCESOS RÁPIDOS TEOCRÁTICOS */}
          <div className="grid grid-cols-2 gap-4">
              <Link to="/epmi" className="bg-white p-5 rounded-3xl shadow-card border border-slate-50 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
                  <div className="bg-orange-100 p-4 rounded-full mb-3 text-orange-600"><GraduationCap className="w-8 h-8"/></div>
                  <span className="font-bold text-slate-700 text-sm">Candidatos EPMI</span>
                  <span className="text-xs text-slate-400 mt-1">Revisar postulantes</span>
              </Link>
              <Link to="/viajes" className="bg-white p-5 rounded-3xl shadow-card border border-slate-50 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
                  <div className="bg-sky-100 p-4 rounded-full mb-3 text-sky-600"><Plane className="w-8 h-8"/></div>
                  <span className="font-bold text-slate-700 text-sm">Misiones</span>
                  <span className="text-xs text-slate-400 mt-1">Aprobar Viajes</span>
              </Link>
              <Link to="/intercesion" className="bg-white p-5 rounded-3xl shadow-card border border-slate-50 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
                  <div className="bg-red-100 p-4 rounded-full mb-3 text-red-600"><AlertTriangle className="w-8 h-8"/></div>
                  <span className="font-bold text-slate-700 text-sm">Intercesión</span>
                  <span className="text-xs text-slate-400 mt-1">Ranking & Ayunos</span>
              </Link>
              <Link to="/finances" className="bg-white p-5 rounded-3xl shadow-card border border-slate-50 flex flex-col items-center justify-center text-center hover:scale-[1.02] transition-transform">
                  <div className="bg-emerald-100 p-4 rounded-full mb-3 text-emerald-600"><CheckCircle className="w-8 h-8"/></div>
                  <span className="font-bold text-slate-700 text-sm">Finanzas</span>
                  <span className="text-xs text-slate-400 mt-1">Aprobar Reportes</span>
              </Link>
          </div>
      </div>

      {/* ANEXOS & CASAS (Horizontal Scroll) */}
      <div>
         <div className="flex justify-between items-end mb-6">
            <div>
                <h3 className="text-lg font-bold text-slate-800">Sedes & Casas</h3>
                <p className="text-sm text-slate-400 font-medium">Supervisión operativa</p>
            </div>
         </div>
         
         <div className="w-full overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
            <div className="flex gap-5 w-max"> 
                {displayedAnexos.map((anexo) => {
                const memberCount = members.filter(m => m.anexoId === anexo.id).length;
                const houseCount = teachingHouses.filter(h => h.anexoId === anexo.id).length;
                
                return (
                    <div 
                        key={anexo.id} 
                        className={`min-w-[300px] max-w-[320px] bg-white rounded-3xl shadow-card p-6 relative group overflow-hidden transition-all duration-300 border border-slate-100 hover:border-brand-light`}
                    >
                    <div className="flex justify-between items-start mb-6">
                        <div className="bg-brand-soft text-brand-blue w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-inner">
                            {anexo.nombre.substring(0,2).toUpperCase()}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setSelectedAnnexForHouses(anexo.id)}
                                className="p-2.5 text-slate-400 hover:text-brand-blue hover:bg-brand-soft rounded-xl transition-colors btn-hover bg-slate-50"
                            >
                                <Home className="w-5 h-5" />
                            </button>
                            <button 
                                onClick={() => setEditingAnexo(anexo)}
                                className="p-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors btn-hover bg-slate-50"
                            >
                                <Edit2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <h4 className="text-xl font-bold text-slate-800 mb-1 truncate">{anexo.nombre}</h4>
                    <p className="text-sm text-slate-500 flex items-center mb-6 font-medium truncate">
                        <MapPin className="w-4 h-4 mr-1.5 text-slate-300" /> {anexo.ubicacion}
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center text-sm border border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Líder</span>
                            <span className="font-bold text-slate-700 truncate max-w-[80px]">{anexo.liderNombre?.split(' ')[0] || 'N/A'}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Casas</span>
                            <span className="font-bold text-slate-700">{houseCount}</span>
                        </div>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Miembros</span>
                            <span className="font-bold text-brand-blue">{memberCount}</span>
                        </div>
                    </div>
                    </div>
                );
                })}
            </div>
         </div>
      </div>

      {/* EDIT MODAL */}
      {editingAnexo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setEditingAnexo(null)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Sede</h3>
                  <form onSubmit={handleSaveAnexo} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Líder</label>
                          <input 
                            value={editingAnexo.liderNombre}
                            onChange={e => setEditingAnexo({...editingAnexo, liderNombre: e.target.value})}
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" 
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Teléfono</label>
                          <input 
                            value={editingAnexo.telefono}
                            onChange={e => setEditingAnexo({...editingAnexo, telefono: e.target.value})}
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Horario</label>
                          <input 
                            value={editingAnexo.horario}
                            onChange={e => setEditingAnexo({...editingAnexo, horario: e.target.value})}
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                          />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-glow mt-2 hover:bg-brand-dark transition-colors">Guardar Cambios</button>
                  </form>
              </div>
          </div>
      )}

      {/* TEACHING HOUSES MODAL */}
      {selectedAnnexForHouses && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl transform transition-all border border-white/50">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white">
               <div>
                   <h3 className="font-bold text-xl text-slate-900">Casas de Enseñanza</h3>
                   <p className="text-xs font-bold text-brand-blue uppercase tracking-wide mt-1">{anexos.find(a => a.id === selectedAnnexForHouses)?.nombre}</p>
               </div>
               <button onClick={() => setSelectedAnnexForHouses(null)} className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
               </button>
            </div>
            
            <div className="p-6 max-h-[50vh] overflow-y-auto space-y-3 bg-[#f8fafc]">
               {teachingHouses.filter(h => h.anexoId === selectedAnnexForHouses).length === 0 && (
                   <div className="text-center py-12">
                       <div className="bg-white border-2 border-dashed border-slate-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                           <Home className="w-8 h-8 text-slate-300" />
                       </div>
                       <p className="text-slate-400 text-sm font-medium">No hay casas registradas aún.</p>
                   </div>
               )}

               {teachingHouses.filter(h => h.anexoId === selectedAnnexForHouses).map(house => (
                   <div key={house.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex justify-between items-center group hover:border-brand-light transition-all">
                      <div className="flex-1 min-w-0 mr-4">
                          {editingHouseId === house.id ? (
                              <input 
                                value={editHouseName}
                                onChange={e => setEditHouseName(e.target.value)}
                                onBlur={() => saveEditHouse(house.id)}
                                onKeyDown={e => e.key === 'Enter' && saveEditHouse(house.id)}
                                className="w-full font-bold text-slate-800 text-lg bg-slate-50 px-2 py-1 rounded-lg border border-brand-light outline-none"
                                autoFocus
                              />
                          ) : (
                              <h4 className="font-bold text-slate-800 text-lg truncate">{house.nombre}</h4>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs bg-brand-soft text-brand-blue px-2.5 py-0.5 rounded-md font-bold">{house.maestroNombre}</span>
                              <span className="text-xs text-slate-400 font-medium flex items-center"><ChevronRight className="w-3 h-3 mr-1"/> {house.diaReunion}</span>
                          </div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            onClick={() => startEditHouse(house)} 
                            className="p-2 bg-slate-50 text-slate-400 hover:text-brand-blue hover:bg-brand-soft rounded-xl transition-colors"
                         >
                            <Edit2 className="w-4 h-4" />
                         </button>
                         <button 
                            onClick={() => {
                                if(window.confirm("¿Estás seguro de eliminar esta casa?")) deleteTeachingHouse(house.id);
                            }}
                            className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                         >
                            <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
               ))}
            </div>

            <div className="p-6 bg-white border-t border-slate-50">
                <button 
                    onClick={() => setIsCreateHouseOpen(true)}
                    className="w-full flex justify-center items-center py-4 bg-brand-blue hover:bg-brand-dark text-white font-bold rounded-2xl transition-all shadow-glow btn-hover"
                >
                    <Plus className="w-5 h-5 mr-2" /> Agregar Nueva Casa
                </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE HOUSE MODAL */}
      {isCreateHouseOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsCreateHouseOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Nueva Casa de Enseñanza</h3>
                  <form onSubmit={handleCreateHouse} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label>
                          <input 
                            placeholder="Ej. Casa Vida - Hna. Ana"
                            value={newHouseName}
                            onChange={e => setNewHouseName(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" 
                            autoFocus
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Día de Reunión</label>
                          <input 
                            placeholder="Ej. Martes 7:00 PM"
                            value={newHouseDay}
                            onChange={e => setNewHouseDay(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Maestro (Opcional)</label>
                          <input 
                            placeholder="Nombre del maestro"
                            value={newHouseMaestro}
                            onChange={e => setNewHouseMaestro(e.target.value)}
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                          />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-glow mt-2 hover:bg-brand-dark transition-colors">Crear Casa</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
