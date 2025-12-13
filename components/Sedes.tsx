
// ... keep imports ...
import React, { useState, useEffect } from 'react';
import { useApp } from '../App.tsx';
import { Anexo, SpiritualStatus, Member, TeachingHouse, EventType } from '../types';
import { MapPin, Phone, Clock, User, Edit3, X, Save, ArrowLeft, Users, Calendar, Home, CheckCircle2, ChevronDown, ChevronUp, Search, Filter, Edit2, Trash2, AlertTriangle, Plus, ChevronRight, UserPlus, ArrowRightLeft, UserCheck } from 'lucide-react';
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
  const [houseToDelete, setHouseToDelete] = useState<string | null>(null);
  const [anexoToDelete, setAnexoToDelete] = useState<string | null>(null);

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

  const handleCreateAnexo = (e: React.FormEvent) => {
      e.preventDefault();
      if(newAnexoName) {
          addAnexo({
              id: `ANX-${Date.now()}`,
              nombre: newAnexoName,
              tipo: newAnexoType,
              ubicacion: newAnexoUbicacion || 'Por definir',
              liderId: '',
              liderNombre: 'Por asignar',
              telefono: '',
              horario: 'Por definir'
          });
          setIsCreateOpen(false);
          setNewAnexoName('');
          setNewAnexoUbicacion('');
      }
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
              diaReunion: newHouseDay || 'TBD',
              direccion: '',
              active: true
          });
          setIsCreateHouseOpen(false);
          // Reset form
          setNewHouseName('');
          setNewHouseDay('');
          setNewHouseMaestroId('');
          setNewHouseAnexoId(''); 
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
              diaReunion: editingHouse.diaReunion,
              maestroId: editingHouse.maestroId,
              maestroNombre: maestroMember?.nombres || editingHouse.maestroNombre
          });
          setEditingHouse(null);
          notify("Casa de enseñanza actualizada");
      }
  };

  // --- MEMBER LOGIC ---

  const handleCreateMemberLocal = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMemberName || !selectedAnexoId) return;

      const normalizedName = newMemberName.toLowerCase().trim();
      const isDuplicate = members.some(m => m.nombres.toLowerCase().trim() === normalizedName);
      
      if (isDuplicate) {
          if(!window.confirm(`Ya existe alguien llamado "${newMemberName}" en la base de datos global. ¿Seguro que es una persona nueva y no un duplicado?`)) {
              return;
          }
      }

      const newMember: Member = {
          id: `MEM-${Date.now()}`,
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
        updateAnexo(editingAnexo.id, {
            nombre: editingAnexo.nombre,
            ubicacion: editingAnexo.ubicacion,
            liderNombre: editingAnexo.liderNombre,
            telefono: editingAnexo.telefono,
            horario: editingAnexo.horario
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

  // ATTENDANCE HELPERS
  const suggestServiceName = (dateStr: string) => {
      const date = new Date(dateStr);
      const day = date.getDay();
      switch(day) {
          case 0: return 'Culto Dominical';
          case 1: return 'Lunes de Oración';
          case 2: return 'Martes de Enseñanza';
          case 4: return 'Jueves de Discipulado';
          case 6: return 'Culto de Jóvenes / Sábado';
          default: return 'Actividad Especial';
      }
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
            <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-100 p-3 rounded-2xl shadow-sm">
                            <Home className="w-8 h-8 text-orange-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Casas de Enseñanza</h2>
                            <p className="text-sm text-slate-500 font-medium">Directorio Global</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsCreateHouseOpen(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl flex items-center shadow-glow transition-all btn-hover"
                    >
                        <Plus className="w-5 h-5 mr-1.5" /> <span className="text-sm font-bold">Nueva Casa</span>
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-50 flex items-center gap-4">
                    <Filter className="w-5 h-5 text-slate-400" />
                    <span className="text-xs font-bold text-slate-500 uppercase">Filtrar por Sede:</span>
                    <select 
                        value={filterAnexo} 
                        onChange={e => setFilterAnexo(e.target.value)}
                        className="bg-slate-50 border-none rounded-xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-orange-200 py-2 pl-3 pr-8"
                    >
                        <option value="ALL">Todas las Sedes</option>
                        {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                </div>

                {/* Houses List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleHouses.map(house => {
                        const annexName = anexos.find(a => a.id === house.anexoId)?.nombre || 'Sede Desconocida';
                        const memberCount = members.filter(m => m.teachingHouseId === house.id).length;

                        return (
                            <div key={house.id} className="bg-white p-6 rounded-[2.5rem] shadow-card border border-slate-50 hover:shadow-lg transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800 mb-1">{house.nombre}</h4>
                                        <p className="text-xs text-orange-500 font-bold uppercase tracking-wide flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {annexName}
                                        </p>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => setEditingHouse(house)}
                                            className="p-2 text-slate-300 hover:text-brand-blue hover:bg-brand-soft rounded-xl transition-colors"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => setHouseToDelete(house.id)}
                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                        <span className="text-xs text-slate-500 font-medium">Maestro</span>
                                        <span className="text-xs font-bold text-slate-700">{house.maestroNombre}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                                        <span className="text-xs text-slate-500 font-medium">Horario</span>
                                        <span className="text-xs font-bold text-slate-700">{house.diaReunion}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-2xl border border-orange-100">
                                        <span className="text-xs text-orange-700 font-medium">Alumnos</span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-extrabold text-orange-600">{memberCount}</span>
                                            <button 
                                                onClick={() => { setTargetHouseId(house.id); setIsAssignStudentOpen(true); }}
                                                className="bg-white px-2 py-1 rounded text-[10px] font-bold text-orange-500 hover:text-orange-700 border border-orange-200"
                                            >
                                                + Asignar
                                            </button>
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
            <div className="space-y-6 animate-fadeIn">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Sedes & Anexos</h2>
                        <p className="text-sm text-slate-500 font-medium">Seleccione una sede para gestionar su operación diaria.</p>
                    </div>
                    {currentUser.role === 'PASTOR_PRINCIPAL' && (
                        <button 
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-brand-blue text-white px-5 py-3 rounded-2xl flex items-center shadow-glow hover:bg-brand-dark transition-all btn-hover"
                        >
                            <Plus className="w-5 h-5 mr-1.5" /> <span className="text-sm font-bold">Nueva Sede</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {anexos.map(anexo => {
                        const stats = getStats(anexo.id);
                        return (
                            <div 
                                key={anexo.id} 
                                className="bg-white rounded-[2.5rem] p-6 shadow-card border border-slate-50 hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden flex flex-col"
                            >
                                <div 
                                    className="absolute inset-0 cursor-pointer z-0" 
                                    onClick={() => setSelectedAnexoId(anexo.id)}
                                ></div>

                                <div className="relative z-10 flex justify-between items-start mb-6 pointer-events-none">
                                    <div className="w-16 h-16 bg-brand-soft rounded-2xl flex items-center justify-center text-2xl font-extrabold text-brand-blue shadow-inner group-hover:scale-110 transition-transform">
                                        {anexo.nombre.substring(0, 2).toUpperCase()}
                                    </div>
                                    {currentUser.role === 'PASTOR_PRINCIPAL' && (
                                        <div className="flex gap-1 pointer-events-auto">
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setSelectedAnexoId(anexo.id); 
                                                    setActiveTab('CASAS'); 
                                                }}
                                                className="p-2.5 bg-orange-50 hover:bg-orange-100 text-orange-500 rounded-xl transition-colors z-20"
                                                title="Gestionar Casas"
                                            >
                                                <Home className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setEditingAnexo(anexo); }}
                                                className="p-2.5 bg-slate-50 hover:bg-slate-200 rounded-xl text-slate-400 transition-colors z-20"
                                            >
                                                <Edit3 className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setAnexoToDelete(anexo.id); }}
                                                className="p-2.5 bg-slate-50 hover:bg-red-100 hover:text-red-500 rounded-xl text-slate-400 transition-colors z-20"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="relative z-0 pointer-events-none">
                                    <h3 className="text-xl font-bold text-slate-800 mb-2">{anexo.nombre}</h3>
                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center text-sm text-slate-500">
                                            <MapPin className="w-4 h-4 mr-2 text-slate-300" />
                                            <span className="truncate">{anexo.ubicacion}</span>
                                        </div>
                                        <div className="flex items-center text-sm text-slate-500">
                                            <User className="w-4 h-4 mr-2 text-slate-300" />
                                            <span className="truncate">{anexo.liderNombre}</span>
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
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center gap-4">
                {currentUser.role === 'PASTOR_PRINCIPAL' && (
                    <button onClick={() => setSelectedAnexoId(null)} className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-brand-blue transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                )}
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{selectedAnexo.nombre}</h2>
                    <p className="text-sm text-slate-500 font-medium">{selectedAnexo.liderNombre}</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                {[
                    { id: 'DASHBOARD', label: 'Panel', icon: Filter },
                    { id: 'ASISTENCIA', label: 'Asistencia', icon: Calendar },
                    { id: 'MIEMBROS', label: 'Miembros', icon: Users },
                    { id: 'CASAS', label: 'Casas', icon: Home },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all whitespace-nowrap ${
                            activeTab === tab.id ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-500 border border-slate-200'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: DASHBOARD */}
            {activeTab === 'DASHBOARD' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-brand-blue to-sky-600 rounded-[2.5rem] p-8 text-white shadow-glow">
                        <h3 className="text-lg font-bold mb-6 opacity-90">Resumen Operativo</h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="text-4xl font-extrabold mb-1">{annexMembers.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider opacity-70">Miembros</div>
                            </div>
                            <div>
                                <div className="text-4xl font-extrabold mb-1">{annexHouses.length}</div>
                                <div className="text-xs font-bold uppercase tracking-wider opacity-70">Casas</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB: ASISTENCIA */}
            {activeTab === 'ASISTENCIA' && (
                <div className="bg-white p-6 rounded-[2.5rem] shadow-card border border-slate-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 border-b border-slate-100 pb-6">
                        <div>
                            <h3 className="font-bold text-xl text-slate-800">Registro de Culto</h3>
                            <p className="text-xs text-slate-500 mt-1">Marque la asistencia para el reporte mensual.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                            <input 
                                type="date"
                                value={attendanceDate}
                                onChange={handleDateChange}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-light"
                            />
                            <select 
                                value={attendanceType}
                                onChange={(e) => setAttendanceType(e.target.value)}
                                className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-light"
                            >
                                <option>Culto Dominical</option>
                                <option>Lunes de Oración</option>
                                <option>Martes de Enseñanza</option>
                                <option>Jueves de Discipulado</option>
                                <option>Culto de Jóvenes / Sábado</option>
                                <option>Actividad Especial</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wide">
                            Presentes: <span className="text-emerald-500 text-lg ml-1">{annexMembers.filter(m => attendance[`${currentEventId}-${m.id}`]).length}</span>
                        </div>
                        <button 
                            onClick={() => handleMarkAll(annexMembers.map(m => m.id))}
                            className="text-xs font-bold text-brand-blue bg-brand-soft px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Marcar Todos
                        </button>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {annexMembers.map(member => {
                            const isPresent = attendance[`${currentEventId}-${member.id}`];
                            return (
                                <div key={member.id} className="py-3 flex items-center justify-between group hover:bg-slate-50 px-2 rounded-xl transition-colors">
                                    <div className="flex items-center gap-3">
                                        <img src={member.photoUrl} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                                        <div>
                                            <p className="font-bold text-slate-800 text-sm">{member.nombres}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">{member.estatus}</p>
                                        </div>
                                    </div>
                                    
                                    <div 
                                        onClick={() => handleToggle(member.id)}
                                        className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${isPresent ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    >
                                        <div className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${isPresent ? 'translate-x-5' : 'translate-x-0'}`}></div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* TAB: MIEMBROS */}
            {activeTab === 'MIEMBROS' && (
                <div className="bg-white p-6 rounded-[2.5rem] shadow-card border border-slate-50">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-slate-800">Directorio Local</h3>
                        <button 
                            onClick={() => {
                                setAddMemberMode('SEARCH'); // Default to search first
                                setIsAddMemberOpen(true);
                                setNewMemberName('');
                                setNewMemberPhone('');
                                setNewMemberSex('M');
                            }} 
                            className="bg-slate-800 text-white px-4 py-2.5 rounded-xl hover:bg-black transition-colors shadow-sm flex items-center gap-2 text-sm font-bold"
                        >
                            <UserPlus className="w-4 h-4" /> Agregar Miembro
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {annexMembers.map(member => (
                            <div key={member.id} className="flex items-center gap-4 p-4 rounded-3xl border border-slate-100 hover:shadow-md transition-all bg-white">
                                <img src={member.photoUrl} className="w-12 h-12 rounded-full object-cover border-2 border-slate-50" />
                                <div>
                                    <h4 className="font-bold text-slate-800">{member.nombres}</h4>
                                    <span className="text-xs text-slate-500">{member.estatus}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB: CASAS */}
            {activeTab === 'CASAS' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <button 
                            onClick={() => setIsCreateHouseOpen(true)}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Agregar Casa
                        </button>
                    </div>

                    {annexHouses.map(house => {
                        const memberCount = members.filter(m => m.teachingHouseId === house.id).length;
                        return (
                        <div key={house.id} className="bg-white p-6 rounded-[2.5rem] shadow-card border border-slate-50 hover:shadow-lg transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-orange-50 text-orange-500 p-3 rounded-2xl">
                                        <Home className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-lg text-slate-800">{house.nombre}</h4>
                                        <p className="text-xs text-slate-400 font-bold uppercase">{house.maestroNombre} • {house.diaReunion}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setEditingHouse(house)} 
                                        className="p-2 text-slate-300 hover:text-brand-blue hover:bg-brand-soft rounded-xl transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => setHouseToDelete(house.id)} 
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Members inside house + Assign Button */}
                            <div className="bg-slate-50 rounded-2xl p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos Asignados</h5>
                                    <button 
                                        onClick={() => { setTargetHouseId(house.id); setIsAssignStudentOpen(true); }}
                                        className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded-lg font-bold text-slate-500 hover:text-orange-500 flex items-center gap-1"
                                    >
                                        <Plus className="w-3 h-3"/> Asignar
                                    </button>
                                </div>
                                <div className="flex -space-x-2 overflow-hidden py-1 pl-1">
                                    {members.filter(m => m.teachingHouseId === house.id).map(m => (
                                        <img key={m.id} src={m.photoUrl} className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover" title={m.nombres} />
                                    ))}
                                    {members.filter(m => m.teachingHouseId === house.id).length === 0 && (
                                        <span className="text-xs text-slate-400 italic">Sin alumnos</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )})}
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-fadeIn">
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 border border-white/50 relative">
                      <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                      <h3 className="text-xl font-bold text-slate-800 mb-6">Nueva Sede</h3>
                      <form onSubmit={handleCreateAnexo} className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label>
                              <input 
                                value={newAnexoName}
                                onChange={e => setNewAnexoName(e.target.value)}
                                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" 
                                autoFocus
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ubicación</label>
                              <input 
                                value={newAnexoUbicacion}
                                onChange={e => setNewAnexoUbicacion(e.target.value)}
                                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tipo</label>
                              <select 
                                value={newAnexoType}
                                onChange={e => setNewAnexoType(e.target.value as any)}
                                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700"
                              >
                                  <option value="LIMA">Lima</option>
                                  <option value="PROVINCIA">Provincia</option>
                                  <option value="INTERNACIONAL">Internacional</option>
                              </select>
                          </div>
                          <button type="submit" className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-glow mt-2 hover:bg-brand-dark transition-colors">Crear Sede</button>
                      </form>
                  </div>
              </div>
          )}

          {/* CREATE HOUSE MODAL - ADDED THIS */}
          {isCreateHouseOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
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
                          
                          {/* Sede Selector (Only if Global View) */}
                          {isCasasView && (
                              <div>
                                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Sede / Anexo</label>
                                  <select 
                                    value={newHouseAnexoId}
                                    onChange={e => setNewHouseAnexoId(e.target.value)}
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700"
                                  >
                                      <option value="">-- Seleccionar --</option>
                                      {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                  </select>
                              </div>
                          )}

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
                              <select 
                                value={newHouseMaestroId}
                                onChange={e => setNewHouseMaestroId(e.target.value)}
                                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                              >
                                  <option value="">-- Seleccionar --</option>
                                  {members
                                    .filter(m => {
                                        const targetId = isCasasView ? newHouseAnexoId : selectedAnexoId;
                                        return !targetId || m.anexoId === targetId;
                                    })
                                    .map(m => (
                                      <option key={m.id} value={m.id}>{m.nombres}</option>
                                  ))}
                              </select>
                          </div>
                          <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-glow mt-2 hover:bg-orange-600 transition-colors">Crear Casa</button>
                      </form>
                  </div>
              </div>
          )}

          {/* ADD MEMBER MODAL */}
          {isAddMemberOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                  <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                      <button onClick={() => setIsAddMemberOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">Agregar Miembro</h3>
                      <div className="flex gap-2 mb-4 bg-slate-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setAddMemberMode('SEARCH')} 
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMemberMode === 'SEARCH' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                          >
                              Buscar Existente
                          </button>
                          <button 
                            onClick={() => setAddMemberMode('CREATE')}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${addMemberMode === 'CREATE' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}
                          >
                              Crear Nuevo
                          </button>
                      </div>

                      {addMemberMode === 'CREATE' ? (
                          <form onSubmit={handleCreateMemberLocal} className="space-y-4">
                              <input 
                                placeholder="Nombre Completo" 
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                                value={newMemberName}
                                onChange={e => setNewMemberName(e.target.value)}
                                autoFocus
                              />
                              <div className="grid grid-cols-2 gap-4">
                                  <input 
                                    placeholder="Teléfono" 
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                                    value={newMemberPhone}
                                    onChange={e => setNewMemberPhone(e.target.value)}
                                  />
                                  <select 
                                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                                    value={newMemberSex}
                                    onChange={e => setNewMemberSex(e.target.value as 'M' | 'F')}
                                  >
                                      <option value="M">Masculino</option>
                                      <option value="F">Femenino</option>
                                  </select>
                              </div>
                              <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-colors">Guardar Ficha</button>
                          </form>
                      ) : (
                          <div className="space-y-4">
                              <input 
                                placeholder="Buscar en base de datos global..."
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none"
                                value={memberSearchTerm}
                                onChange={e => setMemberSearchTerm(e.target.value)}
                                autoFocus
                              />
                              <div className="max-h-40 overflow-y-auto space-y-2">
                                  {members
                                    .filter(m => m.nombres.toLowerCase().includes(memberSearchTerm.toLowerCase()) && m.anexoId !== selectedAnexoId)
                                    .map(m => (
                                      <div key={m.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg cursor-pointer border border-transparent hover:border-slate-200">
                                          <div className="text-sm">
                                              <p className="font-bold text-slate-700">{m.nombres}</p>
                                              <p className="text-[10px] text-slate-400">Actual: {anexos.find(a => a.id === m.anexoId)?.nombre}</p>
                                          </div>
                                          <button 
                                            onClick={() => handleTransferMember(m.id)}
                                            className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-600 hover:bg-slate-200"
                                          >
                                              Trasladar
                                          </button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {/* ASSIGN STUDENT MODAL */}
          {isAssignStudentOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                  <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                      <button onClick={() => setIsAssignStudentOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                      <h3 className="text-xl font-bold text-slate-800 mb-4">Asignar Alumno</h3>
                      
                      <input 
                        placeholder="Buscar miembro sin casa..."
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none mb-4"
                        value={studentSearchTerm}
                        onChange={e => setStudentSearchTerm(e.target.value)}
                        autoFocus
                      />

                      <div className="max-h-60 overflow-y-auto space-y-2">
                          {getPotentialStudents(targetHouseId!).filter(m => m.nombres.toLowerCase().includes(studentSearchTerm.toLowerCase())).map(m => (
                              <div key={m.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <span className="font-bold text-sm text-slate-700">{m.nombres}</span>
                                  <button 
                                    onClick={() => handleAssignStudent(m.id)}
                                    className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-500 hover:bg-orange-50"
                                  >
                                      Asignar
                                  </button>
                              </div>
                          ))}
                          {getPotentialStudents(targetHouseId!).length === 0 && <p className="text-center text-xs text-slate-400">No hay miembros disponibles para asignar.</p>}
                      </div>
                  </div>
              </div>
          )}

          {/* EDIT ANEXO MODAL */}
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
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ubicación</label>
                              <input 
                                value={editingAnexo.ubicacion}
                                onChange={e => setEditingAnexo({...editingAnexo, ubicacion: e.target.value})}
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

          {/* EDIT HOUSE MODAL */}
          {editingHouse && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                      <button onClick={() => setEditingHouse(null)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                      <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Casa</h3>
                      <form onSubmit={handleUpdateHouse} className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre</label>
                              <input 
                                value={editingHouse.nombre}
                                onChange={e => setEditingHouse({...editingHouse, nombre: e.target.value})}
                                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" 
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Día de Reunión</label>
                              <input 
                                value={editingHouse.diaReunion}
                                onChange={e => setEditingHouse({...editingHouse, diaReunion: e.target.value})}
                                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                              />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Maestro</label>
                              <select 
                                value={editingHouse.maestroId}
                                onChange={e => setEditingHouse({...editingHouse, maestroId: e.target.value})}
                                className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                              >
                                  {members
                                    .filter(m => m.anexoId === editingHouse.anexoId)
                                    .map(m => (
                                      <option key={m.id} value={m.id}>{m.nombres}</option>
                                  ))}
                              </select>
                          </div>
                          <button type="submit" className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-glow mt-2 hover:bg-orange-600 transition-colors">Guardar Cambios</button>
                      </form>
                  </div>
              </div>
          )}

          {/* DELETE ANEXO CONFIRMATION */}
          {anexoToDelete && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                          <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Sede?</h3>
                      <p className="text-sm text-slate-500 mb-6">
                          Esta acción eliminará el anexo y todas sus casas de enseñanza asociadas.
                      </p>
                      <div className="flex gap-3">
                          <button onClick={() => setAnexoToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                          <button onClick={confirmDeleteAnexo} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Eliminar</button>
                      </div>
                  </div>
              </div>
          )}

          {/* DELETE HOUSE CONFIRMATION */}
          {houseToDelete && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                  <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                          <AlertTriangle className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Casa?</h3>
                      <p className="text-sm text-slate-500 mb-6">
                          Se eliminará la casa de enseñanza. Los alumnos quedarán sin asignación.
                      </p>
                      <div className="flex gap-3">
                          <button onClick={() => setHouseToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                          <button onClick={confirmDeleteHouse} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Eliminar</button>
                      </div>
                  </div>
              </div>
          )}
      </>
  );
};

export default Sedes;
