
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import useMembresiaActiva from '../firebase/useMembresiaActiva.js';
import { Users, Home, X, Plus, Edit2, Trash2, ChevronRight, Activity, TrendingUp, MapPin, GraduationCap, Plane, AlertTriangle, CheckCircle, BarChart3, AlertCircle, BookOpen, Calendar, CheckSquare, ShieldCheck, Wallet, Package, ChevronUp, ChevronDown } from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { Anexo, TeachingHouse } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard: React.FC = () => {
    const { anexos, members, finances, updateAnexo, currentUser, setCurrentUser, teachingHouses, addTeachingHouse, updateTeachingHouse, deleteTeachingHouse, epmiEnrollments, trips, monthlyReports, events, attendance, diezmoAnexos } = useApp();
    const [selectedAnnexForHouses, setSelectedAnnexForHouses] = useState<string | null>(null);
    const [editingAnexo, setEditingAnexo] = useState<Anexo | null>(null);
    const navigate = useNavigate();

    // Create House Modal State
    const [isCreateHouseOpen, setIsCreateHouseOpen] = useState(false);
    const [newHouseName, setNewHouseName] = useState('');

    // v2.0 Dashboard House Creation Update
    const [newHouseMaestroId, setNewHouseMaestroId] = useState('');
    const [tempSchedule, setTempSchedule] = useState<{ day: string, time: string, type: string }[]>([]);
    const [tempDay, setTempDay] = useState('Domingo');
    const [tempTime, setTempTime] = useState('');
    const [tempType, setTempType] = useState('Culto');

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

        if (!houseToDisplay) return <div className="p-8 text-center text-slate-400 font-medium">No tienes una casa de enseñanza asignada. Contacta a tu líder.</div>;

        return (
            <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto p-4 md:p-6">
                {/* Teacher Header */}
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md"><Home className="w-6 h-6" /></div>
                            <h2 className="text-3xl font-bold tracking-tight">{houseToDisplay.nombre}</h2>
                        </div>
                        <p className="text-white/90 font-medium ml-1 text-lg">Maestro: {currentUser.name}</p>

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10">
                                <span className="block text-4xl font-extrabold">{activeStudentsCount}</span>
                                <span className="text-xs uppercase font-bold opacity-80 tracking-wider">Alumnos Activos</span>
                            </div>
                            <div className="bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10">
                                <span className="block text-4xl font-extrabold">{attendanceAvg}</span>
                                <span className="text-xs uppercase font-bold opacity-80 tracking-wider">Asistencia Mes</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-6">
                    <button onClick={() => navigate('/attendance')} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:scale-[1.02] hover:shadow-lg transition-all group cursor-pointer">
                        <div className="bg-sky-50 p-4 rounded-full mb-3 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors"><CheckSquare className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-lg">Tomar Asistencia</span>
                    </button>
                    <Link to="/courses" className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:scale-[1.02] hover:shadow-lg transition-all group cursor-pointer">
                        <div className="bg-emerald-50 p-4 rounded-full mb-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><BookOpen className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-lg">Cursos Básicos</span>
                    </Link>
                </div>

                {/* Students List */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                    <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Users className="w-6 h-6 text-slate-400" /> Mis Alumnos
                    </h3>
                    <div className="space-y-3">
                        {myStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={student.photoUrl} className="w-12 h-12 rounded-full bg-white object-cover ring-2 ring-white" />
                                    <div>
                                        <p className="font-bold text-slate-800 text-base">{student.nombres}</p>
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">{student.estatus}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className={`w-3.5 h-3.5 rounded-full ${student.attendance_level === 'VERDE' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-red-500 shadow-sm shadow-red-200'}`}></span>
                                </div>
                            </div>
                        ))}
                        {myStudents.length === 0 && <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-2xl"><p className="text-slate-400 font-medium">No hay alumnos asignados.</p></div>}
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
            <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto p-4 md:p-6">
                {/* Leader Header */}
                <div className="bg-gradient-to-br from-slate-800 to-black rounded-[2rem] p-8 text-white shadow-2xl overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 relative z-10">
                        <div>
                            <h2 className="text-4xl font-extrabold tracking-tight mb-2">{myAnexo?.nombre || 'Mi Anexo'}</h2>
                            <p className="text-slate-400 text-lg font-medium">Panel de Liderazgo</p>
                        </div>
                        <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md self-end md:self-auto border border-white/5">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <div className="text-3xl font-extrabold">{myMembers.length}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Miembros</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <div className="text-3xl font-extrabold">{myHouses.length}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Casas</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                            <div className="text-3xl font-extrabold">{myActiveHouses}</div>
                            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">Activas</div>
                        </div>
                        <div className="bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
                            <div className="text-3xl font-bold text-emerald-400">{attendanceAvg}</div>
                            <div className="text-[10px] text-emerald-200 uppercase font-bold tracking-widest mt-1">Asistencia</div>
                        </div>
                    </div>
                </div>

                {/* 6 KEY ACTIONS (PDF 12.3) - Optimized Layout */}
                <div>
                    <h3 className="text-xl font-bold text-slate-900 px-2 mb-4">Gestión Operativa</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <Link to="/attendance" className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all h-36 group">
                            <div className="bg-sky-50 p-3.5 rounded-2xl mb-3 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors"><CheckSquare className="w-7 h-7" /></div>
                            <span className="font-bold text-slate-700 text-xs uppercase leading-tight tracking-wide">Registrar<br />Culto</span>
                        </Link>
                        <Link to="/casas" className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all h-36 group">
                            <div className="bg-orange-50 p-3.5 rounded-2xl mb-3 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><Home className="w-7 h-7" /></div>
                            <span className="font-bold text-slate-700 text-xs uppercase leading-tight tracking-wide">Casas de<br />Enseñanza</span>
                        </Link>
                        <Link to="/courses" className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all h-36 group">
                            <div className="bg-violet-50 p-3.5 rounded-2xl mb-3 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors"><BookOpen className="w-7 h-7" /></div>
                            <span className="font-bold text-slate-700 text-xs uppercase leading-tight tracking-wide">Formación<br />Básica</span>
                        </Link>
                        <Link to="/ministries" className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all h-36 group">
                            <div className="bg-pink-50 p-3.5 rounded-2xl mb-3 text-pink-600 group-hover:bg-pink-600 group-hover:text-white transition-colors"><ShieldCheck className="w-7 h-7" /></div>
                            <span className="font-bold text-slate-700 text-xs uppercase leading-tight tracking-wide">Ministerios<br />Locales</span>
                        </Link>
                        <Link to="/viajes" className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all h-36 group">
                            <div className="bg-indigo-50 p-3.5 rounded-2xl mb-3 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Plane className="w-7 h-7" /></div>
                            <span className="font-bold text-slate-700 text-xs uppercase leading-tight tracking-wide">Viajes<br />Propuestos</span>
                        </Link>
                        <Link to="/finances" className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:shadow-lg hover:border-blue-200 hover:-translate-y-1 transition-all h-36 group">
                            <div className="bg-emerald-50 p-3.5 rounded-2xl mb-3 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Wallet className="w-7 h-7" /></div>
                            <span className="font-bold text-slate-700 text-xs uppercase leading-tight tracking-wide">Finanzas<br />Mensuales</span>
                        </Link>
                    </div>
                </div>

                {/* Members Preview */}
                <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Miembros Recientes</h3>
                        <Link to="/members" className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline decoration-2 underline-offset-4">Ver Directorio Completo</Link>
                    </div>
                    <div className="space-y-3">
                        {myMembers.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-colors">
                                <img src={m.photoUrl} className="w-12 h-12 rounded-full bg-white object-cover ring-2 ring-white" />
                                <div className="flex-1">
                                    <p className="font-bold text-slate-800 text-base">{m.nombres}</p>
                                    <div className="flex gap-2">
                                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">{m.estatus}</span>
                                    </div>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${m.attendance_level === 'VERDE' ? 'bg-emerald-500 shadow-sm shadow-emerald-200' : 'bg-amber-500 shadow-sm shadow-amber-200'}`}></div>
                            </div>
                        ))}
                        {myMembers.length === 0 && <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-xl"><p className="text-slate-400">Sin miembros registrados</p></div>}
                    </div>
                </div>
            </div>
        );
    }

    // --- STANDARD DASHBOARD LOGIC (PASTOR ONLY) ---
    const displayedAnexos = anexos;

    // Stats Logic (Aggregated)
    const totalMembers = useMembresiaActiva();
    const totalFinance = finances.reduce((sum, f) => sum + f.monto, 0);
    const activeEpmiStudents = epmiEnrollments.filter(e => e.status === 'ACTIVO').length;

    // Monthly Report Check
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const anexosWithoutReport = anexos.filter(a =>
        !monthlyReports.some(r => r.anexoId === a.id && r.month === currentMonth && r.year === currentYear && r.status !== 'PENDIENTE')
    ).length;

    const pendingDiezmos = diezmoAnexos.filter(d => d.estado === 'ENVIADO').length;

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

        const maestroMember = members.find(m => m.id === newHouseMaestroId);

        addTeachingHouse({
            id: `H-${Date.now()}`,
            nombre: newHouseName,
            anexoId: selectedAnnexForHouses,
            maestroId: newHouseMaestroId || '',
            maestroNombre: maestroMember?.nombres || 'Por asignar',
            schedule: tempSchedule, // v2.0
            direccion: '',
            active: true
        });
        setIsCreateHouseOpen(false);
        setNewHouseName('');
        setNewHouseMaestroId('');
        setTempSchedule([]);
    };

    // Helper functions for Schedule (Copied from Sedes.tsx)
    const addScheduleItem = () => {
        if (tempTime) {
            setTempSchedule([...tempSchedule, { day: tempDay, time: tempTime, type: tempType }]);
            setTempTime('');
        }
    };

    const removeScheduleItem = (idx: number) => {
        setTempSchedule(tempSchedule.filter((_, i) => i !== idx));
    };

    const moveTempScheduleItem = (index: number, direction: 'UP' | 'DOWN') => {
        const newSchedule = [...tempSchedule];
        if (direction === 'UP' && index > 0) {
            [newSchedule[index], newSchedule[index - 1]] = [newSchedule[index - 1], newSchedule[index]];
        } else if (direction === 'DOWN' && index < newSchedule.length - 1) {
            [newSchedule[index], newSchedule[index + 1]] = [newSchedule[index + 1], newSchedule[index]];
        }
        setTempSchedule(newSchedule);
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
        <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto p-4 md:p-6">

            {/* HEADER & RESET FILTER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        Panel Pastoral
                    </h2>
                    <p className="text-slate-500 font-medium mt-1 text-lg">
                        Visión Global del Ministerio
                    </p>
                </div>
            </div>

            {/* HERO CARD (Dynamic Data) */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden group">
                {/* Decorative Circles */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none group-hover:bg-white/15 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl translate-y-20 -translate-x-20 pointer-events-none"></div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                    {/* KPI 1 */}
                    <div className="text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-4 text-blue-100">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Users className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest">Membresía Activa</span>
                        </div>
                        <div className="flex items-baseline justify-center md:justify-start gap-2">
                            <h3 className="text-6xl font-black tracking-tight">{totalMembers}</h3>
                            <span className="text-lg font-bold text-blue-200">Almas</span>
                        </div>
                    </div>

                    {/* KPI 2 - EPMI */}
                    <div className="text-center border-l border-white/10 md:border-none pl-6 md:pl-0">
                        <div className="flex items-center justify-center gap-3 mb-4 text-blue-100">
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-sm font-bold uppercase tracking-widest">Estudiantes EPMI</span>
                        </div>
                        <h3 className="text-6xl font-black tracking-tight">{activeEpmiStudents}</h3>
                    </div>

                    {/* KPI 3 - FINANCES */}
                    <div className="text-center md:text-right border-l border-white/10 md:border-none pl-6 md:pl-0">
                        <div className="flex items-center justify-center md:justify-end gap-3 mb-4 text-blue-100">
                            <span className="text-sm font-bold uppercase tracking-widest">Ingresos Mes</span>
                            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="flex items-baseline justify-center md:justify-end gap-3">
                            <h3 className="text-5xl lg:text-6xl font-black tracking-tight">S/ {totalFinance}</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* QUICK STATUS & CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* SEMÁFOROS & CHARTS */}
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col hover:border-blue-200 transition-colors">
                    <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-slate-400" /> Tendencia de Asistencia
                    </h3>

                    <div className="h-60 w-full mb-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorAsistencia" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} dy={10} />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '16px',
                                        border: 'none',
                                        background: '#fff',
                                        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                        padding: '12px 16px',
                                        fontWeight: 'bold',
                                        color: '#1e293b'
                                    }}
                                />
                                <Area type="monotone" dataKey="asistencia" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorAsistencia)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="space-y-4 mt-auto">
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-glow"></div>
                                <span className="text-sm font-bold text-emerald-800">Salud General Iglesia</span>
                            </div>
                            <span className="text-xs font-bold bg-white px-3 py-1.5 rounded-lg text-emerald-600 uppercase tracking-wide border border-emerald-100">Estable</span>
                        </div>

                        {anexosWithoutReport > 0 && (
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl border border-red-100 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-glow"></div>
                                    <span className="text-sm font-bold text-red-800">Faltan Reportes ({currentMonth})</span>
                                </div>
                                <span className="text-xs font-bold bg-white px-3 py-1.5 rounded-lg text-red-600 border border-red-100">{anexosWithoutReport} Anexos</span>
                            </div>
                        )}

                        {pendingDiezmos > 0 && (
                            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100 animate-pulse">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-glow"></div>
                                    <span className="text-sm font-bold text-amber-800">Diezmos Por Aprobar</span>
                                </div>
                                <span className="text-xs font-bold bg-white px-3 py-1.5 rounded-lg text-amber-600 border border-amber-100">{pendingDiezmos}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ACCESOS RÁPIDOS TEOCRÁTICOS */}
                <div className="grid grid-cols-2 gap-5">
                    <Link to="/epmi" className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:scale-[1.02] hover:shadow-lg hover:border-blue-200 transition-all group cursor-pointer">
                        <div className="bg-orange-50 p-4 rounded-3xl mb-4 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors"><GraduationCap className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-base">Candidatos EPMI</span>
                        <span className="text-xs text-slate-400 mt-1 font-medium">Revisar postulantes</span>
                    </Link>
                    <Link to="/viajes" className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:scale-[1.02] hover:shadow-lg hover:border-blue-200 transition-all group cursor-pointer">
                        <div className="bg-sky-50 p-4 rounded-3xl mb-4 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors"><Plane className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-base">Misiones</span>
                        <span className="text-xs text-slate-400 mt-1 font-medium">Aprobar Viajes</span>
                    </Link>
                    <Link to="/intercesion" className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:scale-[1.02] hover:shadow-lg hover:border-blue-200 transition-all group cursor-pointer">
                        <div className="bg-red-50 p-4 rounded-3xl mb-4 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors"><AlertTriangle className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-base">Intercesión</span>
                        <span className="text-xs text-slate-400 mt-1 font-medium">Ranking & Ayunos</span>
                    </Link>
                    <Link to="/finances" className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:scale-[1.02] hover:shadow-lg hover:border-blue-200 transition-all group cursor-pointer">
                        <div className="bg-emerald-50 p-4 rounded-3xl mb-4 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><CheckCircle className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-base">Finanzas</span>
                        <span className="text-xs text-slate-400 mt-1 font-medium">Aprobar Reportes</span>
                    </Link>
                    <Link to="/inventory" className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center hover:scale-[1.02] hover:shadow-lg hover:border-blue-200 transition-all group cursor-pointer">
                        <div className="bg-indigo-50 p-4 rounded-3xl mb-4 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Package className="w-8 h-8" /></div>
                        <span className="font-bold text-slate-800 text-base">Inventario</span>
                        <span className="text-xs text-slate-400 mt-1 font-medium">Gestionar Bienes</span>
                    </Link>
                </div>
            </div>

            {/* ANEXOS & CASAS (Horizontal Scroll) */}
            <div>
                <div className="flex justify-between items-end mb-6 px-2">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Sedes & Casas</h3>
                        <p className="text-sm text-slate-400 font-medium mt-0.5">Supervisión operativa</p>
                    </div>
                </div>

                <div className="w-full overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 no-scrollbar">
                    <div className="flex gap-6 w-max">
                        {displayedAnexos.map((anexo) => {
                            const memberCount = members.filter(m => m.anexoId === anexo.id).length;
                            const houseCount = teachingHouses.filter(h => h.anexoId === anexo.id).length;

                            return (
                                <div
                                    key={anexo.id}
                                    className={`min-w-[340px] max-w-[360px] bg-white rounded-[2rem] shadow-sm p-7 relative group overflow-hidden transition-all duration-300 border border-slate-200 hover:border-blue-300 hover:shadow-xl`}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="bg-blue-50 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                            {anexo.nombre.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedAnnexForHouses(anexo.id)}
                                                className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors bg-slate-50 border border-slate-100 hover:border-blue-100 cursor-pointer"
                                                title="Ver Casas"
                                            >
                                                <Home className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedAnnexForHouses(anexo.id);
                                                    setIsCreateHouseOpen(true);
                                                }}
                                                className="p-3 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors bg-slate-50 border border-slate-100 hover:border-green-100 cursor-pointer"
                                                title="Nueva Casa Rápida"
                                            >
                                                <div className="flex relative">
                                                    <Home className="w-5 h-5" />
                                                    <Plus className="w-3 h-3 absolute -top-1 -right-1 bg-green-500 text-white rounded-full" />
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => setEditingAnexo(anexo)}
                                                className="p-3 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors bg-slate-50 border border-slate-100 cursor-pointer"
                                            >
                                                <Edit2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-2xl font-bold text-slate-800 mb-2 truncate">{anexo.nombre}</h4>
                                    <p className="text-sm text-slate-500 flex items-center mb-8 font-medium truncate">
                                        <MapPin className="w-4 h-4 mr-1.5 text-slate-400" /> {anexo.ubicacion}
                                    </p>

                                    <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center text-sm border border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Líder</span>
                                            <span className="font-bold text-slate-700 truncate max-w-[90px] text-base">{anexo.liderNombre?.split(' ')[0] || 'N/A'}</span>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Casas</span>
                                            <span className="font-bold text-slate-700 text-base">{houseCount}</span>
                                        </div>
                                        <div className="h-8 w-px bg-slate-200"></div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Miembros</span>
                                            <span className="font-bold text-blue-600 text-base">{memberCount}</span>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/20">
                        <button onClick={() => setEditingAnexo(null)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Editar Sede</h3>
                        <form onSubmit={handleSaveAnexo} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide">Líder</label>
                                <input
                                    value={editingAnexo.liderNombre}
                                    onChange={e => setEditingAnexo({ ...editingAnexo, liderNombre: e.target.value })}
                                    className="w-full mt-1 px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white font-bold text-slate-800 transition-all placeholder:text-slate-400"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide">Teléfono</label>
                                <input
                                    value={editingAnexo.telefono}
                                    onChange={e => setEditingAnexo({ ...editingAnexo, telefono: e.target.value })}
                                    className="w-full mt-1 px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white font-medium text-slate-800 transition-all"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide">Horario</label>
                                <input
                                    value={editingAnexo.horario}
                                    onChange={e => setEditingAnexo({ ...editingAnexo, horario: e.target.value })}
                                    className="w-full mt-1 px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white font-medium text-slate-800 transition-all"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 mt-2 hover:bg-blue-700 transition-all active:scale-[0.98] cursor-pointer">Guardar Cambios</button>
                        </form>
                    </div>
                </div>
            )}

            {/* TEACHING HOUSES MODAL */}
            {selectedAnnexForHouses && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl transform transition-all border border-white/20">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="font-extrabold text-2xl text-slate-900 tracking-tight">Casas de Enseñanza</h3>
                                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mt-1">{anexos.find(a => a.id === selectedAnnexForHouses)?.nombre}</p>
                            </div>
                            <button onClick={() => setSelectedAnnexForHouses(null)} className="p-2.5 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-4 bg-slate-50/50 custom-scrollbar">
                            {teachingHouses.filter(h => h.anexoId === selectedAnnexForHouses).length === 0 && (
                                <div className="text-center py-16">
                                    <div className="bg-white border-2 border-dashed border-slate-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Home className="w-10 h-10 text-slate-300" />
                                    </div>
                                    <p className="text-slate-500 text-base font-medium">No hay casas registradas aún.</p>
                                    <p className="text-slate-400 text-sm mt-1">Crea una para comenzar.</p>
                                </div>
                            )}

                            {teachingHouses.filter(h => h.anexoId === selectedAnnexForHouses).map(house => (
                                <div key={house.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex justify-between items-center group hover:border-blue-300 hover:shadow-md transition-all">
                                    <div className="flex-1 min-w-0 mr-6">
                                        {editingHouseId === house.id ? (
                                            <input
                                                value={editHouseName}
                                                onChange={e => setEditHouseName(e.target.value)}
                                                onBlur={() => saveEditHouse(house.id)}
                                                onKeyDown={e => e.key === 'Enter' && saveEditHouse(house.id)}
                                                className="w-full font-bold text-slate-800 text-xl bg-slate-50 px-3 py-1.5 rounded-lg border-2 border-blue-500 outline-none"
                                                autoFocus
                                            />
                                        ) : (
                                            <h4 className="font-bold text-slate-800 text-lg truncate mb-1">{house.nombre}</h4>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-bold border border-blue-100">{house.maestroNombre}</span>
                                            <span className="text-xs text-slate-400 font-medium flex items-center"><ChevronRight className="w-3 h-3 mr-1" /> {house.diaReunion}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => startEditHouse(house)}
                                            className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors ring-1 ring-slate-100 hover:ring-blue-100"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (window.confirm("¿Estás seguro de eliminar esta casa?")) deleteTeachingHouse(house.id);
                                            }}
                                            className="p-2 bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors ring-1 ring-slate-100 hover:ring-red-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white border-t border-slate-100">
                            <button
                                onClick={() => setIsCreateHouseOpen(true)}
                                className="w-full flex justify-center items-center py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98]"
                            >
                                <Plus className="w-5 h-5 mr-2" /> Agregar Nueva Casa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CREATE HOUSE MODAL */}
            {isCreateHouseOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative border border-white/20 transform transition-all">
                        <button onClick={() => setIsCreateHouseOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"><X className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Nueva Casa</h3>
                        <form onSubmit={handleCreateHouse} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide">Nombre</label>
                                <input
                                    placeholder="Ej. Casa Vida - Hna. Ana"
                                    value={newHouseName}
                                    onChange={e => setNewHouseName(e.target.value)}
                                    className="w-full mt-1 px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white font-bold text-slate-800 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* DYNAMIC SCHEDULE BUILDER */}
                            <div className="bg-slate-100 p-4 rounded-xl">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Horarios</label>
                                <div className="flex gap-2 mb-2">
                                    <select value={tempDay} onChange={e => setTempDay(e.target.value)} className="bg-white p-2 rounded-lg text-xs font-bold w-1/3">
                                        {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                    <input type="time" value={tempTime} onChange={e => setTempTime(e.target.value)} className="bg-white p-2 rounded-lg text-xs w-1/3" />
                                    <button type="button" onClick={addScheduleItem} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={16} /></button>
                                </div>
                                <div className="space-y-1">
                                    {tempSchedule.map((s, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-2 rounded text-xs font-medium">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col mr-1">
                                                    <button type="button" onClick={() => moveTempScheduleItem(idx, 'UP')} disabled={idx === 0} className="hover:text-blue-600 disabled:opacity-30"><ChevronUp size={10} /></button>
                                                    <button type="button" onClick={() => moveTempScheduleItem(idx, 'DOWN')} disabled={idx === tempSchedule.length - 1} className="hover:text-blue-600 disabled:opacity-30"><ChevronDown size={10} /></button>
                                                </div>
                                                <span>{s.day} @ {s.time}</span>
                                            </div>
                                            <button type="button" onClick={() => removeScheduleItem(idx)} className="text-red-500"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide">Maestro (Opcional)</label>
                                <select
                                    value={newHouseMaestroId}
                                    onChange={e => setNewHouseMaestroId(e.target.value)}
                                    className="w-full mt-1 px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent outline-none focus:border-blue-500 focus:bg-white font-medium text-slate-800 transition-all"
                                >
                                    <option value="">-- Sin Asignar --</option>
                                    {members.filter(m => m.anexoId === selectedAnnexForHouses).map(m => (
                                        <option key={m.id} value={m.id}>{m.nombres}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 mt-2 hover:bg-blue-700 transition-all active:scale-[0.98]">Crear Casa</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
