// ... keep imports ...
import React, { useState, useEffect } from 'react';
import { useApp } from '../App.tsx';
import { Anexo, SpiritualStatus, Member, TeachingHouse, EventType } from '../types';
import { MapPin, Phone, Clock, User, Edit3, X, Save, ArrowLeft, Users, Calendar, Home, CheckCircle2, ChevronDown, ChevronUp, Search, Filter, Edit2, Trash2, AlertTriangle, Plus, ChevronRight, UserPlus, ArrowRightLeft, UserCheck, UserMinus } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const Sedes: React.FC = () => {
    // ... keep existing state and logic ...
    const { anexos, updateAnexo, addAnexo, deleteAnexo, members, teachingHouses, attendance, toggleAttendance, markAllPresent, updateTeachingHouse, deleteTeachingHouse, addTeachingHouse, currentUser, addMember, updateMember, notify, events, addEvent } = useApp();
    const [editingAnexo, setEditingAnexo] = useState<Anexo | null>(null);
    const [selectedAnexoId, setSelectedAnexoId] = useState<string | null>(null);
    const selectedAnexo = selectedAnexoId ? anexos.find(a => a.id === selectedAnexoId) : null;
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'MIEMBROS' | 'ASISTENCIA' | 'CASAS'>('DASHBOARD');

    const location = useLocation();
    const navigate = useNavigate();
    const isCasasView = location.pathname === '/casas';

    // Filter State for Casas View
    const [filterAnexo, setFilterAnexo] = useState<string>('ALL');

    // Create Anexo State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newAnexoName, setNewAnexoName] = useState('');
    const [newAnexoType, setNewAnexoType] = useState<'LIMA' | 'PROVINCIA' | 'INTERNACIONAL'>('LIMA');
    const [newAnexoUbicacion, setNewAnexoUbicacion] = useState('');

    // Create House State
    const [isCreateHouseOpen, setIsCreateHouseOpen] = useState(false);
    const [newHouseName, setNewHouseName] = useState('');
    const [newHouseDay, setNewHouseDay] = useState('');
    const [newHouseMaestroId, setNewHouseMaestroId] = useState(''); // Store ID
    const [newHouseAnexoId, setNewHouseAnexoId] = useState(''); // For Global Create

    // EDIT HOUSE STATE (FULL)
    const [editingHouse, setEditingHouse] = useState<TeachingHouse | null>(null);

    // UNIFIED ADD MEMBER STATE
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [addMemberMode, setAddMemberMode] = useState<'SEARCH' | 'CREATE'>('SEARCH'); // Default to Search to prevent duplicates
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [newMemberSex, setNewMemberSex] = useState<'M' | 'F'>('M');
    const [newMemberCargo, setNewMemberCargo] = useState('Miembro'); // New
    const [memberSearchTerm, setMemberSearchTerm] = useState('');

    // ASSIGN MEMBER/STUDENT STATE
    const [isAssignStudentOpen, setIsAssignStudentOpen] = useState(false);
    const [targetHouseId, setTargetHouseId] = useState<string | null>(null);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');

    // Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceType, setAttendanceType] = useState('Culto Dominical');

    // Delete Confirmation State
    // Delete Confirmation State
    const [houseToDelete, setHouseToDelete] = useState<string | null>(null);
    const [anexoToDelete, setAnexoToDelete] = useState<string | null>(null);

    // v2.0 SCHEDULE STATE
    const [tempSchedule, setTempSchedule] = useState<{ day: string, time: string, type: string }[]>([]);
    const [tempDay, setTempDay] = useState('Domingo');
    const [tempTime, setTempTime] = useState('');
    const [tempType, setTempType] = useState('Culto');

    // v2.0 RELATIONAL LEADER STATE
    const [newAnexoLiderId, setNewAnexoLiderId] = useState('');

    // v2.0 MEMBER DNI CHECK
    const [newMemberDni, setNewMemberDni] = useState('');
    const [memberDuplicateFound, setMemberDuplicateFound] = useState<Member | null>(null);

    // --- AUTO-SELECT FOR LEADERS (FIX 1) ---
    useEffect(() => {
        if ((currentUser.role === 'LIDER_ANEXO' || currentUser.role === 'SECRETARIA_ANEXO') && !isCasasView) {
            if (currentUser.anexoId !== 'ALL') {
                setSelectedAnexoId(currentUser.anexoId);
            }
        }
    }, [currentUser, isCasasView]);

    // Stats Logic
    const getStats = (anexoId: string) => {
        return {
            members: members.filter(m => m.anexoId === anexoId).length,
            houses: teachingHouses.filter(h => h.anexoId === anexoId).length,
            attendanceAvg: '85%' // Mock calc
        };
    };

    const formatScheduleDisplay = (schedule?: { day: string, time: string, type: string }[]) => {
        if (!schedule || schedule.length === 0) return 'Horario por definir';
        return schedule.map(s => `${s.day.substring(0, 3)} ${s.time}`).join(' | ');
    };

    const handleCreateAnexo = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAnexoName) {
            const liderMember = members.find(m => m.id === newAnexoLiderId);
            addAnexo({
                id: `ANX-${Date.now()}`,
                nombre: newAnexoName,
                tipo: newAnexoType,
                ubicacion: newAnexoUbicacion || 'Por definir',
                liderId: newAnexoLiderId || '',
                liderNombre: liderMember?.nombres || 'Por asignar',
                telefono: liderMember?.telefono || '',
                schedule: tempSchedule // v2.0
            });
            setIsCreateOpen(false);
            setNewAnexoName('');
            setNewAnexoUbicacion('');
            setNewAnexoLiderId('');
            setTempSchedule([]);
        }
    };

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

    const handleCreateHouse = (e: React.FormEvent) => {
        e.preventDefault();
        // Determine Parent ID: Global View (Select) vs Detail View (Implicit)
        const targetAnexoId = isCasasView ? newHouseAnexoId : selectedAnexoId;

        if (newHouseName && targetAnexoId) {
            const maestroMember = members.find(m => m.id === newHouseMaestroId);

            addTeachingHouse({
                id: `H-${Date.now()}`,
                nombre: newHouseName,
                anexoId: targetAnexoId,
                maestroId: newHouseMaestroId || '',
                maestroNombre: maestroMember?.nombres || 'Desconocido',
                schedule: tempSchedule, // v2.0
                direccion: '',
                active: true
            });
            setIsCreateHouseOpen(false);
            // Reset form
            setNewHouseName('');
            setNewHouseDay('');
            setNewHouseMaestroId('');
            setNewHouseAnexoId('');
            setTempSchedule([]); // Reset schedule
            notify("Casa creada exitosamente");
        } else {
            notify("Faltan datos para crear la casa (Nombre y Sede)", "error");
        }
    };

    const handleUpdateHouse = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingHouse) {
            const maestroMember = members.find(m => m.id === editingHouse.maestroId);
            updateTeachingHouse(editingHouse.id, {
                nombre: editingHouse.nombre,
                schedule: editingHouse.schedule, // v2.0
                maestroId: editingHouse.maestroId,
                maestroNombre: maestroMember?.nombres || editingHouse.maestroNombre
            });
            setEditingHouse(null);
            notify("Casa de enseñanza actualizada");
        }
    };

    // --- MEMBER LOGIC ---

    const checkDniAndProceed = () => {
        if (!newMemberDni) return;
        const exists = members.find(m => m.dni === newMemberDni);
        if (exists) {
            setMemberDuplicateFound(exists);
        } else {
            setAddMemberMode('CREATE_FORM'); // Proceed to form
            setMemberDuplicateFound(null);
        }
    };

    const handleCreateMemberLocal = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName || !selectedAnexoId) return;

        const newMember: Member = {
            id: `MEM-${Date.now()}`,
            dni: newMemberDni, // v2.0
            nombres: newMemberName,
            telefono: newMemberPhone,
            sex: newMemberSex,
            anexoId: selectedAnexoId,
            estatus: SpiritualStatus.NEW,
            cargo: newMemberCargo as any,
            attendance_level: 'AMARILLO',
            fidelity_level: 'VERDE',
            service_level: 'ROJO',
            candidate_epmi: false,
            completed_basicos: false,
            coursesCompletedIds: [],
            ministryIds: [],
            photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMemberName}`
        };

        addMember(newMember);
        setIsAddMemberOpen(false);
        setNewMemberName('');
        setNewMemberPhone('');
        setNewMemberSex('M');
        setNewMemberDni('');
        setMemberDuplicateFound(null);
        setAddMemberMode('SEARCH');
    };

    const handleUnlinkMember = (memberId: string) => {
        if (window.confirm('¿Desvincular miembro de esta sede? Pasará a estado "Sin Asignar".')) {
            updateMember(memberId, { anexoId: undefined, teachingHouseId: undefined });
            notify('Miembro desvinculado.');
        }
    };

    const handleTransferMember = (memberId: string) => {
        if (selectedAnexoId) {
            updateMember(memberId, { anexoId: selectedAnexoId, teachingHouseId: undefined }); // Reset house on transfer
            setIsAddMemberOpen(false);
            notify("Miembro trasladado exitosamente");
        }
    };

    const handleAssignStudent = (memberId: string) => {
        if (targetHouseId) {
            updateMember(memberId, { teachingHouseId: targetHouseId });
            setTargetHouseId(null);
            setIsAssignStudentOpen(false);
            setStudentSearchTerm('');
            notify("Alumno asignado a la casa");
        }
    };

    const handleSaveAnexo = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingAnexo) {
            const liderMember = members.find(m => m.id === editingAnexo.liderId);
            updateAnexo(editingAnexo.id, {
                nombre: editingAnexo.nombre,
                ubicacion: editingAnexo.ubicacion,
                liderId: editingAnexo.liderId,
                liderNombre: liderMember?.nombres || editingAnexo.liderNombre,
                telefono: editingAnexo.telefono,
                schedule: editingAnexo.schedule // v2.0
            });
            setEditingAnexo(null);
        }
    };

    const confirmDeleteAnexo = () => {
        if (anexoToDelete) {
            deleteAnexo(anexoToDelete);
            setAnexoToDelete(null);
        }
    };

    const confirmDeleteHouse = () => {
        if (houseToDelete) {
            deleteTeachingHouse(houseToDelete);
            setHouseToDelete(null);
        }
    };

    // ATTENDANCE HELPERS v2.0
    const suggestServiceName = (dateStr: string) => {
        if (!selectedAnexo || !selectedAnexo.schedule) return 'Actividad General';

        const date = new Date(dateStr);
        // Fix local day check
        const dayIndex = date.getDay();
        const days = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
        const dayName = days[dayIndex];

        const match = selectedAnexo.schedule.find(s => s.day === dayName);
        return match ? match.type : 'Actividad Especial';
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAttendanceDate(e.target.value);
        setAttendanceType(suggestServiceName(e.target.value));
    };

    const getAttendanceEventId = () => {
        if (!selectedAnexoId) return null;
        // Try to find existing event or generate a stable ID for this date/type/annex
        const existing = events.find(e => e.fecha === attendanceDate && e.tipo === EventType.SERVICE && e.anexoId === selectedAnexoId);
        if (existing) return existing.id;
        return `TEMP-EVT-${selectedAnexoId}-${attendanceDate}`;
    };

    const handleMarkAll = (memberIds: string[]) => {
        const evtId = getAttendanceEventId();
        if (!evtId) return;
        markAllPresent(evtId, memberIds);
    };

    const handleToggle = (memberId: string) => {
        const evtId = getAttendanceEventId();
        if (!evtId) return;
        toggleAttendance(evtId, memberId);
    };

    // HELPER: Get members available to be teachers in a specific annex
    const getPotentialTeachers = (targetAnexoId: string) => {
        if (!targetAnexoId) return [];
        return members.filter(m => m.anexoId === targetAnexoId);
    };

    // HELPER: Get members available to be students (Same Annex, No House)
    const getPotentialStudents = (targetHouseId: string) => {
        const house = teachingHouses.find(h => h.id === targetHouseId);
        if (!house) return [];
        // Filter: Same Annex AND No House Assigned
        return members.filter(m => m.anexoId === house.anexoId && !m.teachingHouseId);
    };

    // --- RENDER CONTENT BASED ON VIEW ---
    const renderContent = () => {
        // ... keep exact same logic for renderContent ...
        // Note: I will copy paste the original renderContent logic here essentially, but for brevity in this response I assume it's preserved.
        // Ideally in a real diff I just output the whole file content to be safe.

        // --- VIEW: GLOBAL HOUSES DIRECTORY (/casas) ---
        if (isCasasView) {
            const visibleHouses = teachingHouses.filter(h =>
                filterAnexo === 'ALL' || h.anexoId === filterAnexo
            );

            return (
                <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Casas de Enseñanza</h2>
                            <p className="text-lg text-slate-500 font-medium mt-1">Directorio global de células.</p>
                        </div>
                        <button
                            onClick={() => setIsCreateHouseOpen(true)}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nueva Casa</span>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm uppercase tracking-wide">
                            <Filter className="w-4 h-4" /> Filtrar por Sede:
                        </div>
                        <select
                            value={filterAnexo}
                            onChange={e => setFilterAnexo(e.target.value)}
                            className="bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-xl text-sm font-bold text-slate-700 py-2.5 pl-4 pr-10 outline-none transition-all"
                        >
                            <option value="ALL">Todas las Sedes</option>
                            {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>

                    {/* Houses List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visibleHouses.map(house => {
                            const annexName = anexos.find(a => a.id === house.anexoId)?.nombre || 'Sede Desconocida';
                            const houseMembers = members.filter(m => m.teachingHouseId === house.id);

                            return (
                                <div key={house.id} className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                                                <Home className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-lg text-slate-800 leading-tight">{house.nombre}</h4>
                                                <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide flex items-center gap-1 mt-0.5">
                                                    <MapPin className="w-3 h-3" /> {annexName}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setEditingHouse(house)}
                                                className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setHouseToDelete(house.id)}
                                                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500 uppercase">Maestro</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{house.maestroNombre || 'Por Asignar'}</span>
                                        </div>
                                        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-xs font-bold text-slate-500 uppercase">Horario</span>
                                            </div>
                                            <span className="text-sm font-bold text-slate-800">{formatScheduleDisplay(house.schedule)}</span>
                                        </div>

                                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mt-2">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-xs text-indigo-900 font-bold uppercase tracking-wide">Alumnos Inscritos</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-lg font-extrabold text-indigo-700">{houseMembers.length}</span>
                                                    <button
                                                        onClick={() => { setTargetHouseId(house.id); setIsAssignStudentOpen(true); }}
                                                        className="bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white border-2 border-indigo-200 transition-all cursor-pointer"
                                                    >
                                                        Asignar
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="flex -space-x-2 overflow-hidden pl-1 py-1">
                                                {houseMembers.slice(0, 8).map(m => (
                                                    <img key={m.id} src={m.photoUrl} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-white" title={m.nombres} />
                                                ))}
                                                {houseMembers.length > 8 && (
                                                    <div className="w-8 h-8 rounded-full bg-indigo-100 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                        +{houseMembers.length - 8}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // --- VIEW: LIST OF SEDES (MAIN - PASTOR ONLY) ---
        if (!selectedAnexoId) {
            return (
                <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Sedes & Anexos</h2>
                            <p className="text-lg text-slate-500 font-medium mt-1">Gestión de las sedes de la iglesia.</p>
                        </div>
                        {currentUser.role === 'PASTOR_PRINCIPAL' && (
                            <button
                                onClick={() => setIsCreateOpen(true)}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] cursor-pointer"
                            >
                                <Plus className="w-5 h-5" />
                                <span>Nueva Sede</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {anexos.map(anexo => {
                            const stats = getStats(anexo.id);
                            return (
                                <div
                                    key={anexo.id}
                                    className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-300 transition-all group relative cursor-pointer"
                                    onClick={() => setSelectedAnexoId(anexo.id)}
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl font-black text-blue-600 border border-blue-100 group-hover:scale-105 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                            {anexo.nombre.substring(0, 2).toUpperCase()}
                                        </div>
                                        {currentUser.role === 'PASTOR_PRINCIPAL' && (
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setEditingAnexo(anexo); }}
                                                    className="p-2.5 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors border border-slate-100 shadow-sm cursor-pointer"
                                                    title="Editar Sede"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setAnexoToDelete(anexo.id); }}
                                                    className="p-2.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors border border-slate-100 shadow-sm cursor-pointer"
                                                    title="Eliminar Sede"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-4 leading-tight group-hover:text-blue-700 transition-colors">{anexo.nombre}</h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center text-slate-600 gap-3 p-2 bg-slate-50 rounded-lg">
                                                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                                                <span className="truncate font-medium">{anexo.ubicacion || 'Sin dirección registrada'}</span>
                                            </div>
                                            <div className="flex items-center text-slate-600 gap-3 p-2 bg-slate-50 rounded-lg">
                                                <User className="w-4 h-4 text-blue-400 shrink-0" />
                                                <span className="truncate font-medium">{anexo.liderNombre || 'Sin líder asignado'}</span>
                                            </div>
                                            <div className="flex items-center text-slate-600 gap-3 p-2 bg-slate-50 rounded-lg">
                                                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                                                <span className="truncate font-medium">{formatScheduleDisplay(anexo.schedule)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <div className="text-center">
                                            <span className="block text-2xl font-bold text-slate-800">{stats.members}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Miembros</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100"></div>
                                        <div className="text-center">
                                            <span className="block text-2xl font-bold text-slate-800">{stats.houses}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Casas</span>
                                        </div>
                                        <div className="w-px h-8 bg-slate-100"></div>
                                        <div className="text-center">
                                            <span className="block text-2xl font-bold text-emerald-500">{stats.attendanceAvg}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asistencia</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );
        }

        // --- VIEW: DETAIL DASHBOARD ---
        if (!selectedAnexo) return null; // Should not happen

        // Filter Logic for Detail View
        const myHouseId = currentUser.role === 'MAESTRO_CASA'
            ? teachingHouses.find(h => h.maestroNombre === currentUser.name)?.id
            : null;

        let annexMembers = members.filter(m => m.anexoId === selectedAnexoId);
        if (myHouseId) annexMembers = annexMembers.filter(m => m.teachingHouseId === myHouseId);

        const annexHouses = teachingHouses.filter(h => h.anexoId === selectedAnexoId);
        const currentEventId = getAttendanceEventId();

        return (
            <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto p-4 md:p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    {currentUser.role === 'PASTOR_PRINCIPAL' && (
                        <button onClick={() => setSelectedAnexoId(null)} className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    )}
                    <div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">{selectedAnexo.nombre}</h2>
                        <p className="text-sm font-bold text-blue-600 uppercase tracking-wide mt-1">{selectedAnexo.liderNombre}</p>
                    </div>
                </div>

                {/* TABS */}
                <div className="flex border-b border-slate-200/60 overflow-x-auto no-scrollbar gap-8">
                    {[
                        { id: 'DASHBOARD', label: 'Panel General', icon: Filter },
                        { id: 'ASISTENCIA', label: 'Control Asistencia', icon: Calendar },
                        { id: 'MIEMBROS', label: 'Miembros', icon: Users },
                        { id: 'CASAS', label: 'Casas', icon: Home },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 py-4 text-sm font-bold tracking-wide transition-all border-b-[3px] whitespace-nowrap cursor-pointer ${activeTab === tab.id
                                ? 'text-blue-600 border-blue-600'
                                : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB: DASHBOARD */}
                {activeTab === 'DASHBOARD' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-[1.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
                            <h3 className="text-base font-bold mb-6 opacity-80 uppercase tracking-widest">Resumen de la Sede</h3>
                            <div className="grid grid-cols-2 gap-8 relative z-10">
                                <div>
                                    <div className="text-5xl font-black mb-1">{annexMembers.length}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-70">Miembros Activos</div>
                                </div>
                                <div>
                                    <div className="text-5xl font-black mb-1">{annexHouses.length}</div>
                                    <div className="text-xs font-bold uppercase tracking-wider opacity-70">Casas de Enseñanza</div>
                                </div>
                                <div className="col-span-2 pt-6 border-t border-white/10 mt-2">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white/20 p-3 rounded-xl">
                                            <Clock className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg">{formatScheduleDisplay(selectedAnexo.schedule)}</p>
                                            <p className="text-xs opacity-70 font-medium uppercase">Horario Principal</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: ASISTENCIA */}
                {activeTab === 'ASISTENCIA' && (
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200">
                        {/* Logic for Anexo View vs House View (Implicit in role or selection) */}
                        {currentUser.role === 'MAESTRO_CASA' || currentUser.role === 'LIDER_ANEXO' ? (
                            <div className="mb-6">
                                <h3 className="font-bold text-lg text-slate-800 mb-4">Panel de Asistencia Rápida</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Action 1: Start Service (If Anexo Leader) */}
                                    {currentUser.role !== 'MAESTRO_CASA' && (
                                        <button
                                            onClick={() => setAttendanceType(suggestServiceName(attendanceDate))}
                                            className="p-4 bg-blue-50 text-blue-700 rounded-xl border-2 border-blue-100 hover:bg-blue-100 hover:border-blue-300 transition-all text-left group"
                                        >
                                            <span className="block font-bold text-lg mb-1">📅 Iniciar Culto de Hoy</span>
                                            <span className="text-xs font-bold uppercase tracking-wide opacity-70 group-hover:opacity-100">
                                                {suggestServiceName(attendanceDate)}
                                            </span>
                                        </button>
                                    )}

                                    {/* Action 2: My Houses (If has houses) */}
                                    {teachingHouses.filter(h => h.anexoId === selectedAnexoId && (currentUser.role === 'LIDER_ANEXO' || h.maestroNombre === currentUser.name)).map(house => (
                                        <button
                                            key={house.id}
                                            onClick={() => {
                                                // Ideally select this house or filter list
                                                setAttendanceType('Reunión Casa');
                                                notify(`Registrando asistencia para casa: ${house.nombre}`);
                                                // Could filter list below to this house's members
                                            }}
                                            className="p-4 bg-orange-50 text-orange-700 rounded-xl border-2 border-orange-100 hover:bg-orange-100 hover:border-orange-300 transition-all text-left flex items-center gap-3"
                                        >
                                            <Home className="w-5 h-5" />
                                            <div>
                                                <span className="block font-bold">Pasar Lista: {house.nombre}</span>
                                                <span className="text-xs opacity-70">Casa de Enseñanza</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-8">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">Registro de Asistencia</h3>
                                <p className="text-sm text-slate-500 mt-1 font-medium">Gestiona la asistencia de hoy.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                <input
                                    type="date"
                                    value={attendanceDate}
                                    onChange={handleDateChange}
                                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none"
                                />
                                <select
                                    value={attendanceType}
                                    onChange={(e) => setAttendanceType(e.target.value)}
                                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-blue-400 outline-none"
                                >
                                    {(!selectedAnexo.schedule?.length) && <option>Culto General</option>}
                                    {selectedAnexo.schedule?.map((s, i) => (
                                        <option key={i} value={s.type}>{s.type} ({s.day} {s.time})</option>
                                    ))}
                                    <option value="Actividad Especial">⚡ Actividad Especial</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-between items-center mb-6 pl-2">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Asistencia Total: <span className="text-emerald-600 text-lg ml-2">{annexMembers.filter(m => attendance[`${currentEventId}-${m.id}`]).length}</span>
                            </div>
                            <button
                                onClick={() => handleMarkAll(annexMembers.map(m => m.id))}
                                className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white border border-blue-200 transition-all shadow-sm cursor-pointer"
                            >
                                Marcar Todos
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {annexMembers.map(member => {
                                const isPresent = attendance[`${currentEventId}-${member.id}`];
                                return (
                                    <div key={member.id} className="py-4 px-3 flex items-center justify-between group hover:bg-slate-50 rounded-2xl transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <img src={member.photoUrl} className="w-12 h-12 rounded-xl object-cover bg-slate-200" />
                                                {isPresent && <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white"></div>}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-base">{member.nombres}</p>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{member.estatus}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleToggle(member.id)}
                                            className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${isPresent
                                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                                                }`}
                                        >
                                            {isPresent ? 'Presente' : 'Ausente'}
                                        </button>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* TAB: MIEMBROS */}
                {activeTab === 'MIEMBROS' && (
                    <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-slate-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                            <div>
                                <h3 className="font-bold text-xl text-slate-800">Directorio de Miembros</h3>
                                <p className="text-sm text-slate-500 font-medium">Miembros registrados en esta sede.</p>
                            </div>
                            <button
                                onClick={() => {
                                    setAddMemberMode('SEARCH');
                                    setIsAddMemberOpen(true);
                                    setNewMemberName('');
                                    setNewMemberPhone('');
                                    setNewMemberSex('M');
                                }}
                                className="w-full sm:w-auto bg-slate-800 text-white px-5 py-3 rounded-xl hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide cursor-pointer"
                            >
                                <UserPlus className="w-4 h-4" /> Agregar Miembro
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {annexMembers.map(member => (
                                <div key={member.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-3">
                                        <img src={member.photoUrl} className="w-10 h-10 rounded-xl" />
                                        <div>
                                            <h4 className="font-bold text-sm text-slate-900">{member.nombres}</h4>
                                            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded mr-2">{member.estatus}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleUnlinkMember(member.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer" title="Retirar de esta sede (Desvincular)">
                                        <UserMinus className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: CASAS */}
                {activeTab === 'CASAS' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-lg text-slate-800 pl-2">Casas en esta Sede</h3>
                            <button
                                onClick={() => { setIsCreateHouseOpen(true); setNewHouseAnexoId(selectedAnexo.id); }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-200 transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4" /> Agregar Casa
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {annexHouses.map(house => {
                                const memberCount = members.filter(m => m.teachingHouseId === house.id).length;
                                return (
                                    <div key={house.id} className="bg-white p-6 rounded-[1.5rem] shadow-md border border-slate-100 hover:shadow-xl transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="bg-orange-50 text-orange-600 p-3.5 rounded-2xl border border-orange-100">
                                                    <Home className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-lg text-slate-800 leading-tight">{house.nombre}</h4>
                                                    <p className="text-xs text-slate-500 font-bold uppercase mt-1">{house.maestroNombre}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => setEditingHouse(house)}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-transparent hover:border-blue-100 cursor-pointer"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => setHouseToDelete(house.id)}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100 cursor-pointer"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                                            <div className="flex justify-between items-center mb-4">
                                                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alumnos Asignados</h5>
                                                <button
                                                    onClick={() => { setTargetHouseId(house.id); setIsAssignStudentOpen(true); }}
                                                    className="text-[10px] bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm flex items-center gap-1 transition-colors cursor-pointer"
                                                >
                                                    <Plus className="w-3 h-3" /> Asignar
                                                </button>
                                            </div>
                                            <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                                                {members.filter(m => m.teachingHouseId === house.id).slice(0, 8).map(m => (
                                                    <img key={m.id} src={m.photoUrl} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover bg-white" title={m.nombres} />
                                                ))}
                                                {memberCount === 0 && (
                                                    <span className="text-sm text-slate-400 italic py-1 font-medium">Sin alumnos asignados.</span>
                                                )}
                                                {memberCount > 8 && (
                                                    <div className="w-8 h-8 rounded-full bg-slate-200 ring-2 ring-white flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                        +{memberCount - 8}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            {renderContent()}

            {/* CREATE ANEXO MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-slate-800">Nueva Sede</h3>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAnexo} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre de la Sede</label>
                                <input
                                    value={newAnexoName}
                                    onChange={e => setNewAnexoName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:font-normal"
                                    placeholder="Ej. Sede Central"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ubicación</label>
                                <input
                                    value={newAnexoUbicacion}
                                    onChange={e => setNewAnexoUbicacion(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all placeholder:font-normal"
                                    placeholder="Dirección o Ciudad"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Tipo de Sede</label>
                                <select
                                    value={newAnexoType}
                                    onChange={e => setNewAnexoType(e.target.value as 'IGLESIA' | 'ANEXO')}
                                    className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                >
                                    <option value="ANEXO">Anexo (Sede Hija)</option>
                                    <option value="IGLESIA">Iglesia Oficial</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Líder Principal</label>
                                <select
                                    value={newAnexoLiderId}
                                    onChange={e => setNewAnexoLiderId(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                >
                                    <option value="">-- Seleccionar Líder --</option>
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombres}</option>
                                    ))}
                                </select>
                            </div>

                            {/* DYNAMIC SCHEDULE BUILDER */}
                            <div className="bg-slate-100 p-4 rounded-xl">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Horarios de Reunión</label>
                                <div className="flex gap-2 mb-2">
                                    <select value={tempDay} onChange={e => setTempDay(e.target.value)} className="bg-white p-2 rounded-lg text-xs font-bold w-1/3">
                                        {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map(d => <option key={d}>{d}</option>)}
                                    </select>
                                    <input type="time" value={tempTime} onChange={e => setTempTime(e.target.value)} className="bg-white p-2 rounded-lg text-xs w-1/3" />
                                    <input placeholder="Tipo (Culto)" value={tempType} onChange={e => setTempType(e.target.value)} className="bg-white p-2 rounded-lg text-xs w-1/3" />
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
                                                <span>{s.day} {s.time} - {s.type}</span>
                                            </div>
                                            <button type="button" onClick={() => removeScheduleItem(idx)} className="text-red-500"><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer">
                                Crear Sede
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE HOUSE MODAL */}
            {isCreateHouseOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 transform transition-all">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-slate-800">Nueva Casa</h3>
                            <button onClick={() => setIsCreateHouseOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateHouse} className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre de la Casa</label>
                                <input
                                    value={newHouseName}
                                    onChange={e => setNewHouseName(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:font-normal"
                                    placeholder="Ej. Familia Pérez"
                                    autoFocus
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sede Asignada</label>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Sede Asignada</label>
                                    {currentUser.role === 'LIDER_ANEXO' || currentUser.role === 'SECRETARIA_ANEXO' ? (
                                        <input
                                            value={anexos.find(a => a.id === currentUser.anexoId)?.nombre || 'Mi Sede'}
                                            disabled
                                            className="w-full p-4 bg-slate-100 rounded-xl border-2 border-transparent font-bold text-slate-500"
                                        />
                                    ) : (
                                        <select
                                            value={newHouseAnexoId}
                                            onChange={e => setNewHouseAnexoId(e.target.value)}
                                            disabled={!isCasasView}
                                            className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all disabled:opacity-60"
                                        >
                                            <option value="">Seleccionar</option>
                                            {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Horarios</label>
                                <div className="bg-slate-100 p-3 rounded-xl border-none">
                                    <div className="flex gap-1 mb-2">
                                        <select value={tempDay} onChange={e => setTempDay(e.target.value)} className="bg-white p-2 rounded text-xs font-bold flex-1">
                                            {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'].map(d => <option key={d}>{d}</option>)}
                                        </select>
                                        <input type="time" value={tempTime} onChange={e => setTempTime(e.target.value)} className="bg-white p-2 rounded text-xs w-20" />
                                        <button type="button" onClick={addScheduleItem} className="bg-green-500 text-white p-2 rounded"><Plus size={14} /></button>
                                    </div>
                                    {tempSchedule.length > 0 && (
                                        <div className="text-[10px] space-y-1">
                                            {tempSchedule.map((s, idx) => (
                                                <div key={idx} className="flex justify-between bg-white px-2 py-1 rounded">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex flex-col mr-1">
                                                            <button type="button" onClick={() => moveTempScheduleItem(idx, 'UP')} disabled={idx === 0} className="hover:text-blue-600 disabled:opacity-30"><ChevronUp size={10} /></button>
                                                            <button type="button" onClick={() => moveTempScheduleItem(idx, 'DOWN')} disabled={idx === tempSchedule.length - 1} className="hover:text-blue-600 disabled:opacity-30"><ChevronDown size={10} /></button>
                                                        </div>
                                                        <span>{s.day} @ {s.time}</span>
                                                    </div>
                                                    <span onClick={() => removeScheduleItem(idx)} className="text-red-500 cursor-pointer">x</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Maestro (Opcional)</label>
                                <select
                                    value={newHouseMaestroId}
                                    onChange={e => setNewHouseMaestroId(e.target.value)}
                                    className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                >
                                    <option value="">-- Sin Asignar --</option>
                                    {getPotentialTeachers(isCasasView ? newHouseAnexoId : selectedAnexoId!).map(m => (
                                        <option key={m.id} value={m.id}>{m.nombres}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer">
                                Crear Casa
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ADD MEMBER MODAL */}
            {
                isAddMemberOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-extrabold text-slate-800">Agregar Miembro</h3>
                                <button onClick={() => setIsAddMemberOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setAddMemberMode('SEARCH')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${addMemberMode === 'SEARCH' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Buscar Existente
                                </button>
                                <button
                                    onClick={() => setAddMemberMode('CREATE')}
                                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all cursor-pointer ${addMemberMode === 'CREATE' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    Crear Nuevo
                                </button>
                            </div>



                            {
                                addMemberMode === 'CREATE_FORM' ? (
                                    <form onSubmit={handleCreateMemberLocal} className="space-y-4">
                                        <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-sm font-bold flex justify-between">
                                            <span>Creando para DNI: {newMemberDni}</span>
                                            <button type="button" onClick={() => setAddMemberMode('CREATE')} className="underline">Cambiar</button>
                                        </div>
                                        <input
                                            placeholder="Nombre Completo"
                                            className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 transition-all placeholder:font-normal"
                                            value={newMemberName}
                                            onChange={e => setNewMemberName(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <input
                                                placeholder="Teléfono (Opcional)"
                                                className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all placeholder:font-normal"
                                                value={newMemberPhone}
                                                onChange={e => setNewMemberPhone(e.target.value)}
                                            />
                                            <select
                                                className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                                value={newMemberSex}
                                                onChange={e => setNewMemberSex(e.target.value as 'M' | 'F')}
                                            >
                                                <option value="M">Masculino</option>
                                                <option value="F">Femenino</option>
                                            </select>
                                        </div>
                                        <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold shadow-lg hover:bg-slate-900 active:scale-[0.98] transition-all cursor-pointer">Guardar Miembro</button>
                                    </form>
                                ) : addMemberMode === 'CREATE' ? (
                                    <div className="space-y-4">
                                        <h4 className="font-bold text-slate-700">Paso 1: Validación de Identidad</h4>
                                        <input
                                            value={newMemberDni}
                                            onChange={e => setNewMemberDni(e.target.value)}
                                            placeholder="Ingrese DNI / Identificación"
                                            className="w-full p-4 bg-slate-50 rounded-xl text-xl font-bold tracking-widest text-center"
                                        />
                                        {memberDuplicateFound && (
                                            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                                                <p className="text-orange-800 font-bold mb-2">¡Miembro Encontrado!</p>
                                                <p className="text-sm text-orange-700">{memberDuplicateFound.nombres} (Sede: {anexos.find(a => a.id === memberDuplicateFound.anexoId)?.nombre || '?'})</p>
                                                <button onClick={() => handleTransferMember(memberDuplicateFound.id)} className="mt-3 w-full py-2 bg-orange-200 text-orange-800 font-bold rounded-lg hover:bg-orange-300">
                                                    Transferir a esta Sede
                                                </button>
                                            </div>
                                        )}
                                        <button onClick={checkDniAndProceed} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold">Verificar DNI</button>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <input
                                            placeholder="Buscar en base de datos global..."
                                            className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                            value={memberSearchTerm}
                                            onChange={e => setMemberSearchTerm(e.target.value)}
                                            autoFocus
                                        />
                                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                            {members
                                                .filter(m => m.nombres.toLowerCase().includes(memberSearchTerm.toLowerCase()) && m.anexoId !== selectedAnexoId)
                                                .map(m => (
                                                    <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 hover:bg-white border border-transparent hover:border-slate-200 hover:shadow-sm rounded-xl transition-all">
                                                        <div>
                                                            <p className="font-bold text-slate-800 text-sm">{m.nombres}</p>
                                                            <p className="text-xs text-slate-500 font-medium">Sede Actual: {anexos.find(a => a.id === m.anexoId)?.nombre || 'N/A'}</p>
                                                        </div>
                                                        <button
                                                            onClick={() => handleTransferMember(m.id)}
                                                            className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-bold border-2 border-blue-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all cursor-pointer"
                                                        >
                                                            Trasladar
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    </div>
                )
            }

            {/* ASSIGN STUDENT MODAL */}
            {
                isAssignStudentOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 h-[70vh] flex flex-col transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-extrabold text-slate-800">Asignar Alumno</h3>
                                <button onClick={() => setIsAssignStudentOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <input
                                placeholder="Buscar miembro sin casa..."
                                className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all mb-4"
                                value={studentSearchTerm}
                                onChange={e => setStudentSearchTerm(e.target.value)}
                                autoFocus
                            />

                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {getPotentialStudents(targetHouseId!).filter(m => m.nombres.toLowerCase().includes(studentSearchTerm.toLowerCase())).map(m => (
                                    <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
                                        <span className="font-bold text-sm text-slate-800">{m.nombres}</span>
                                        <button
                                            onClick={() => handleAssignStudent(m.id)}
                                            className="bg-white border-2 border-orange-200 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 hover:bg-orange-600 hover:border-orange-600 hover:text-white transition-all cursor-pointer"
                                        >
                                            Asignar
                                        </button>
                                    </div>
                                ))}
                                {getPotentialStudents(targetHouseId!).length === 0 && <p className="text-center text-sm text-slate-400 font-medium pt-8">No hay miembros disponibles en esta sede.</p>}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* EDIT ANEXO MODAL */}
            {
                editingAnexo && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-extrabold text-slate-800">Editar Sede</h3>
                                <button onClick={() => setEditingAnexo(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveAnexo} className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Líder de Sede</label>
                                    <select
                                        value={editingAnexo.liderId}
                                        onChange={e => setEditingAnexo({ ...editingAnexo, liderId: e.target.value })}
                                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                    >
                                        <option value="">-- Asignar Líder --</option>
                                        <option value="">-- Asignar Líder --</option>
                                        {members.filter(m =>
                                            m.cargo === 'Líder' ||
                                            m.cargo === 'Pastor' ||
                                            m.cargo === 'Pastora' ||
                                            m.cargo === 'Ministro' ||
                                            m.id === editingAnexo.liderId // Always include current
                                        ).map(m => (
                                            <option key={m.id} value={m.id}>{m.nombres} ({m.anexoId === editingAnexo.id ? 'Local' : 'Externo'})</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Ubicación</label>
                                    <input
                                        value={editingAnexo.ubicacion}
                                        onChange={e => setEditingAnexo({ ...editingAnexo, ubicacion: e.target.value })}
                                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                    />
                                </div>
                                {/* EDIT SCHEDULE BUILDER (Simplified for now - Just reusing the logic/state if we wanted full edit, but for now just JSON edit or display) 
                                To properly edit schedule, we'd need to load editingAnexo.schedule into tempSchedule on mount. 
                                For this MVP Refactor, I'll add a simple 'Reset Schedule' button or basic adder 
                             */}
                                <div className="bg-slate-100 p-2 rounded">
                                    <p className="text-xs font-bold text-slate-500 mb-2">Horarios Configurados</p>
                                    {editingAnexo.schedule && editingAnexo.schedule.map((s, i) => (
                                        <div key={i} className="text-xs mb-1 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <div className="flex flex-col mr-1">
                                                    <button type="button" onClick={() => {
                                                        const newSched = [...editingAnexo.schedule];
                                                        if (i > 0) {
                                                            [newSched[i], newSched[i - 1]] = [newSched[i - 1], newSched[i]];
                                                            setEditingAnexo({ ...editingAnexo, schedule: newSched });
                                                        }
                                                    }} disabled={i === 0} className="hover:text-blue-600 disabled:opacity-30"><ChevronUp size={10} /></button>
                                                    <button type="button" onClick={() => {
                                                        const newSched = [...editingAnexo.schedule];
                                                        if (i < newSched.length - 1) {
                                                            [newSched[i], newSched[i + 1]] = [newSched[i + 1], newSched[i]];
                                                            setEditingAnexo({ ...editingAnexo, schedule: newSched });
                                                        }
                                                    }} disabled={i === (editingAnexo.schedule?.length || 0) - 1} className="hover:text-blue-600 disabled:opacity-30"><ChevronDown size={10} /></button>
                                                </div>
                                                <span>{s.day} @ {s.time} ({s.type})</span>
                                            </div>
                                            <button type="button" onClick={() => {
                                                const newSched = [...editingAnexo.schedule];
                                                newSched.splice(i, 1);
                                                setEditingAnexo({ ...editingAnexo, schedule: newSched });
                                            }} className="text-red-500 font-bold">x</button>
                                        </div>
                                    ))}
                                    <div className="flex gap-1 mt-2">
                                        <select id="editDay" className="text-xs p-1 rounded"><option>Domingo</option><option>Lunes</option><option>Martes</option><option>Miercoles</option><option>Jueves</option><option>Viernes</option><option>Sabado</option></select>
                                        <input id="editTime" type="time" className="text-xs p-1 rounded" />
                                        <button type="button" onClick={() => {
                                            const day = (document.getElementById('editDay') as HTMLSelectElement).value;
                                            const time = (document.getElementById('editTime') as HTMLInputElement).value;
                                            if (time) setEditingAnexo({ ...editingAnexo, schedule: [...(editingAnexo.schedule || []), { day, time, type: 'Culto' }] });
                                        }} className="bg-blue-500 text-white px-2 rounded">+</button>
                                    </div>
                                </div>
                                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer">Guardar Cambios</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* EDIT HOUSE MODAL */}
            {
                editingHouse && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 transform transition-all">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-extrabold text-slate-800">Editar Casa</h3>
                                <button onClick={() => setEditingHouse(null)} className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateHouse} className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre</label>
                                    <input
                                        value={editingHouse.nombre}
                                        onChange={e => setEditingHouse({ ...editingHouse, nombre: e.target.value })}
                                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-slate-800 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Horarios (Días de Reunión)</label>
                                    <div className="space-y-1 mb-2">
                                        {editingHouse.schedule && editingHouse.schedule.map((s, i) => (
                                            <div key={i} className="text-xs flex justify-between bg-slate-50 p-1 rounded items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex flex-col mr-1">
                                                        <button type="button" onClick={() => {
                                                            const newSched = [...editingHouse.schedule];
                                                            if (i > 0) {
                                                                [newSched[i], newSched[i - 1]] = [newSched[i - 1], newSched[i]];
                                                                setEditingHouse({ ...editingHouse, schedule: newSched });
                                                            }
                                                        }} disabled={i === 0} className="hover:text-blue-600 disabled:opacity-30"><ChevronUp size={10} /></button>
                                                        <button type="button" onClick={() => {
                                                            const newSched = [...editingHouse.schedule];
                                                            if (i < newSched.length - 1) {
                                                                [newSched[i], newSched[i + 1]] = [newSched[i + 1], newSched[i]];
                                                                setEditingHouse({ ...editingHouse, schedule: newSched });
                                                            }
                                                        }} disabled={i === (editingHouse.schedule?.length || 0) - 1} className="hover:text-blue-600 disabled:opacity-30"><ChevronDown size={10} /></button>
                                                    </div>
                                                    <span>{s.day} @ {s.time}</span>
                                                </div>
                                                <button type="button" onClick={() => {
                                                    const newSched = [...editingHouse.schedule];
                                                    newSched.splice(i, 1);
                                                    setEditingHouse({ ...editingHouse, schedule: newSched });
                                                }} className="text-red-500 font-bold">x</button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-1">
                                        <select id="editHDay" className="text-xs p-2 rounded border"><option>Martes</option><option>Miercoles</option><option>Jueves</option><option>Viernes</option><option>Sabado</option></select>
                                        <input id="editHTime" type="time" className="text-xs p-2 rounded border" />
                                        <button type="button" onClick={() => {
                                            const day = (document.getElementById('editHDay') as HTMLSelectElement).value;
                                            const time = (document.getElementById('editHTime') as HTMLInputElement).value;
                                            if (time) setEditingHouse({ ...editingHouse, schedule: [...(editingHouse.schedule || []), { day, time, type: 'Casa' }] });
                                        }} className="bg-blue-500 text-white px-2 rounded">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Maestro</label>
                                    <select
                                        value={editingHouse.maestroId}
                                        onChange={e => setEditingHouse({ ...editingHouse, maestroId: e.target.value })}
                                        className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-medium text-slate-700 transition-all"
                                    >
                                        <option value="">-- Sin Asignar --</option>
                                        {getPotentialTeachers(editingHouse.anexoId).map(m => (
                                            <option key={m.id} value={m.id}>{m.nombres}</option>
                                        ))}
                                    </select>
                                </div>
                                <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-500/20 mt-4 hover:bg-orange-600 transition-colors cursor-pointer">Guardar Cambios</button>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* DELETE ANEXO CONFIRMATION */}
            {
                anexoToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center transform transition-all">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border-4 border-red-100">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">¿Eliminar Sede?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                Esta acción es irreversible y eliminará el anexo y todas sus casas asociadas.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setAnexoToDelete(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">Cancelar</button>
                                <button onClick={confirmDeleteAnexo} className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors cursor-pointer">Sí, Eliminar</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* DELETE HOUSE CONFIRMATION */}
            {
                houseToDelete && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                        <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center transform transition-all">
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border-4 border-red-100">
                                <AlertTriangle className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-extrabold text-slate-800 mb-2">¿Eliminar Casa?</h3>
                            <p className="text-sm text-slate-500 font-medium mb-8 leading-relaxed">
                                La casa de enseñanza se eliminará. Los alumnos asignados quedarán libres.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button onClick={() => setHouseToDelete(null)} className="px-6 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">Cancelar</button>
                                <button onClick={confirmDeleteHouse} className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition-colors cursor-pointer">Sí, Eliminar</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

export default Sedes;
