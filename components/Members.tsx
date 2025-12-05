
import React, { useState, useRef } from 'react';
import { useApp } from '../App.tsx';
import { Member, SpiritualStatus, IndicatorLevel, Course } from '../types';
import { Search, Plus, X, Phone, MapPin, Calendar, BookOpen, Shield, Heart, Edit3, Camera, User, Award, CheckCircle2, AlertTriangle, AlertCircle, Check, Plane, StickyNote, Sparkles, Loader2, Save, MessageCircle, Trash2, RefreshCw, Printer, UploadCloud, Image as ImageIcon, Wrench } from 'lucide-react';
import { generatePastoralInsight } from '../services/geminiService';

const Members: React.FC = () => {
  const { members, anexos, updateMember, addMember, currentUser, courses, teachingHouses, updateMemberPhoto, epmiEnrollments, trips, history, addHistoryNote, sendWhatsApp, deleteMember, notify } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [activeTab, setActiveTab] = useState<'DATOS' | 'FORMACION' | 'MINISTERIOS' | 'HISTORIAL'>('DATOS');
  const [filterStatus, setFilterStatus] = useState<SpiritualStatus | 'ALL'>('ALL');
  
  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Edit Mode State (Inline)
  const [isEditingData, setIsEditingData] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Member>>({});
  const [newSkill, setNewSkill] = useState('');

  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  
  // Status Change State
  const [newStatus, setNewStatus] = useState<SpiritualStatus>(SpiritualStatus.STABLE);
  const [statusReason, setStatusReason] = useState('');
  
  // Delete State
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);
  
  // Form States
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberAnexo, setNewMemberAnexo] = useState('');
  
  // Photo Upload State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Note State
  const [newNoteContent, setNewNoteContent] = useState('');

  // --- LOGIC: Visibility based on Role (PDF Part 8.1.4) ---
  const canEdit = ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO'].includes(currentUser.role);
  const canSeeSensitive = ['PASTOR_PRINCIPAL', 'MINISTRO'].includes(currentUser.role); // Financial & Pastoral Notes
  const isPastor = currentUser.role === 'PASTOR_PRINCIPAL';

  const visibleMembers = members.filter(m => {
    // Search
    const matchSearch = m.nombres.toLowerCase().includes(searchTerm.toLowerCase());
    // Filter by Annex (Scope)
    let matchAnnex = true;
    if (currentUser.role === 'LIDER_ANEXO') {
       matchAnnex = m.anexoId === currentUser.anexoId;
    } else if (currentUser.role === 'MAESTRO_CASA') {
       matchAnnex = m.anexoId === currentUser.anexoId;
    }
    const matchStatus = filterStatus === 'ALL' || m.estatus === filterStatus;
    return matchSearch && matchAnnex && matchStatus;
  });

  // --- HELPERS: UI Configs ---
  const getTrafficLightColor = (level: IndicatorLevel) => {
      switch(level) {
          case 'VERDE': return 'bg-emerald-500 shadow-emerald-200';
          case 'AMARILLO': return 'bg-amber-400 shadow-amber-200';
          case 'NARANJA': return 'bg-orange-500 shadow-orange-200';
          case 'ROJO': return 'bg-red-500 shadow-red-200';
          default: return 'bg-slate-300';
      }
  };

  const getStatusBadge = (status: SpiritualStatus) => {
      let colors = 'bg-slate-100 text-slate-600 border-slate-200';
      if (status === SpiritualStatus.STABLE) colors = 'bg-emerald-50 text-emerald-600 border-emerald-200';
      if (status === SpiritualStatus.NEW) colors = 'bg-blue-50 text-blue-600 border-blue-200';
      if (status === SpiritualStatus.DISCIPLINE) colors = 'bg-red-50 text-red-600 border-red-200';
      if (status === SpiritualStatus.RESTORATION) colors = 'bg-orange-50 text-orange-600 border-orange-200';
      if (status === SpiritualStatus.OBSERVATION) colors = 'bg-amber-50 text-amber-600 border-amber-200';
      
      return (
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${colors}`}>
              {status}
          </span>
      );
  };

  // Find EPMI status for selected member
  const epmiStatus = selectedMember ? epmiEnrollments.find(e => e.memberId === selectedMember.id && e.status === 'ACTIVO') : null;

  // --- HISTORY AGGREGATION ---
  const getMemberHistory = (memberId: string) => {
      const memberTrips = trips
        .filter(t => t.participants.some(p => p.memberId === memberId && p.status === 'APROBADO'))
        .map(t => ({
            id: t.id,
            fecha: t.fechaSalida,
            tipo: 'VIAJE',
            titulo: 'Viaje Misionero',
            detalle: `Destino: ${t.destino}`
        }));
      
      return history.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  };

  // --- HANDLERS ---
  const handleCreateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName) return;
    
    // PDF 20.4: Prevent Duplicates
    const normalizedName = newMemberName.toLowerCase().trim();
    const isDuplicate = members.some(m => m.nombres.toLowerCase().trim() === normalizedName);
    
    if (isDuplicate) {
        notify('Ya existe un miembro con este nombre.', 'error');
        return;
    }

    const anexoId = currentUser.anexoId === 'ALL' ? (newMemberAnexo || anexos[0].id) : currentUser.anexoId;
    
    const newMember: Member = {
        id: `MEM-${Date.now()}`,
        nombres: newMemberName,
        telefono: newMemberPhone,
        anexoId: anexoId,
        estatus: SpiritualStatus.NEW,
        attendance_level: 'AMARILLO', 
        fidelity_level: 'VERDE', // Default optimistic
        service_level: 'ROJO',
        candidate_epmi: false,
        completed_basicos: false,
        coursesCompletedIds: [],
        ministryIds: [],
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newMemberName}`,
        habilidades: []
    };
    addMember(newMember);
    setIsCreateOpen(false);
    setNewMemberName('');
    setNewMemberPhone('');
  };

  const handleSaveData = () => {
      if (selectedMember) {
          updateMember(selectedMember.id, editFormData);
          setSelectedMember({ ...selectedMember, ...editFormData } as Member);
          setIsEditingData(false);
      }
  };

  const handleAddSkill = () => {
      if(newSkill.trim() && editFormData) {
          const currentSkills = editFormData.habilidades || [];
          // Avoid duplicates in UI
          if (!currentSkills.includes(newSkill.trim())) {
              setEditFormData({ ...editFormData, habilidades: [...currentSkills, newSkill.trim()] });
          }
          setNewSkill('');
      }
  };

  const handleRemoveSkill = (skill: string) => {
      if(editFormData) {
          const currentSkills = editFormData.habilidades || [];
          setEditFormData({ ...editFormData, habilidades: currentSkills.filter(s => s !== skill) });
      }
  };

  const handleAddNote = () => {
      if (selectedMember && newNoteContent) {
          addHistoryNote(selectedMember.id, newNoteContent);
          setNewNoteContent('');
          setIsNoteOpen(false);
          notify("Nota pastoral agregada");
      }
  };

  const handleStatusChange = () => {
      if (selectedMember && statusReason) {
          updateMember(selectedMember.id, { estatus: newStatus });
          addHistoryNote(selectedMember.id, `Cambio de Estatus a: ${newStatus}. Razón: ${statusReason}`);
          setSelectedMember({ ...selectedMember, estatus: newStatus });
          setIsStatusModalOpen(false);
          setStatusReason('');
          notify("Estatus espiritual actualizado");
      }
  };

  // File Upload Logic
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsUploading(true);
          
          // Simulate network delay then convert to Base64
          setTimeout(() => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  setNewPhotoUrl(reader.result as string);
                  setIsUploading(false);
              };
              reader.readAsDataURL(file);
          }, 1000);
      }
  };

  const handleUpdatePhoto = () => {
      if (selectedMember && newPhotoUrl) {
          updateMemberPhoto(selectedMember.id, newPhotoUrl);
          setSelectedMember({ ...selectedMember, photoUrl: newPhotoUrl });
          setNewPhotoUrl('');
          setIsPhotoOpen(false);
      }
  };

  const confirmDeleteMember = () => {
      if (memberToDelete) {
          deleteMember(memberToDelete);
          setMemberToDelete(null);
          closeProfile();
      }
  };

  const handleGenerateAi = async () => {
      if (!selectedMember) return;
      setAiLoading(true);
      const hist = getMemberHistory(selectedMember.id);
      const compatibleHistory = hist.map(h => ({
          id: h.id,
          fecha: h.fecha,
          tipo: h.tipo as any,
          titulo: h.titulo,
          detalle: h.detalle
      }));

      const insight = await generatePastoralInsight(selectedMember, compatibleHistory);
      setAiInsight(insight);
      setAiLoading(false);
  };

  const closeProfile = () => {
      setSelectedMember(null);
      setAiInsight(null);
      setIsEditingData(false);
  }

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Directorio</h2>
           <p className="text-sm text-slate-500 font-medium">Ficha 360° de Membresía</p>
        </div>
        {canEdit && (
            <button 
                onClick={() => setIsCreateOpen(true)} 
                className="bg-brand-blue text-white px-5 py-3 rounded-2xl flex items-center shadow-glow hover:bg-brand-dark transition-all btn-hover"
            >
                <Plus className="w-5 h-5 mr-1.5" /> <span className="text-sm font-bold">Nuevo</span>
            </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex overflow-x-auto gap-2 py-2 no-scrollbar">
          <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>Todos</button>
          {[SpiritualStatus.NEW, SpiritualStatus.IN_FORMATION, SpiritualStatus.STABLE, SpiritualStatus.DISCIPLINE].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${filterStatus === s ? 'bg-brand-blue text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>{s}</button>
          ))}
      </div>

      {/* Search */}
      <div className="relative group">
        <input
            type="text"
            placeholder="Buscar por nombre..."
            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-slate-100 focus:ring-2 focus:ring-brand-light focus:outline-none shadow-card transition-all text-sm font-medium"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
        />
        <Search className="w-5 h-5 text-slate-300 absolute left-4 top-4 group-focus-within:text-brand-blue" />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-20">
        {visibleMembers.map(member => (
            <div 
                key={member.id} 
                onClick={() => setSelectedMember(member)}
                className="bg-white p-5 rounded-[2rem] shadow-card border border-slate-50 flex items-center gap-4 cursor-pointer hover:shadow-lg transition-all group"
            >
                <img src={member.photoUrl} alt="" className="w-16 h-16 rounded-2xl bg-slate-50 object-cover shadow-sm" />
                <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-800 truncate text-lg">{member.nombres}</h4>
                    <p className="text-xs text-slate-400 font-medium truncate mb-2">{anexos.find(a => a.id === member.anexoId)?.nombre}</p>
                    {getStatusBadge(member.estatus)}
                </div>
                {/* Traffic Lights Mini */}
                <div className="flex flex-col gap-1.5">
                    <div className={`w-3 h-3 rounded-full ${getTrafficLightColor(member.attendance_level)}`} title="Asistencia"></div>
                    {/* Security Rule: Hide Fidelity Light for non-sensitive roles */}
                    {canSeeSensitive && (
                        <div className={`w-3 h-3 rounded-full ${getTrafficLightColor(member.fidelity_level)}`} title="Fidelidad"></div>
                    )}
                    <div className={`w-3 h-3 rounded-full ${getTrafficLightColor(member.service_level)}`} title="Servicio"></div>
                </div>
            </div>
        ))}
      </div>

      {/* FICHA 360 MODAL */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center pointer-events-none print-only-visible">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-opacity no-print" onClick={closeProfile}></div>
            <div className="bg-white w-full sm:max-w-2xl sm:rounded-[2.5rem] h-[95vh] sm:h-[90vh] flex flex-col pointer-events-auto shadow-2xl overflow-hidden transform transition-transform animate-slideUp border border-white/50 relative print-only-visible">
                
                <button onClick={closeProfile} className="absolute top-6 right-6 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-slate-800 z-20 transition-colors no-print">
                    <X className="w-6 h-6" />
                </button>

                <button onClick={handlePrint} className="absolute top-6 right-20 bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-slate-800 z-20 transition-colors no-print" title="Imprimir Ficha">
                    <Printer className="w-6 h-6" />
                </button>

                {/* Header Profile */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8 pt-12 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none no-print"></div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                        <div className="relative group">
                            <img src={selectedMember.photoUrl} className="w-24 h-24 rounded-3xl shadow-glow border-4 border-white/10 object-cover" />
                            {canEdit && (
                                <button 
                                    onClick={() => {
                                        setNewPhotoUrl(selectedMember.photoUrl || '');
                                        setIsPhotoOpen(true);
                                    }}
                                    className="absolute -bottom-2 -right-2 bg-brand-blue p-2 rounded-xl text-white shadow-lg hover:scale-110 transition-transform no-print"
                                >
                                    <Camera className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="text-3xl font-extrabold tracking-tight mb-1">{selectedMember.nombres}</h3>
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-3 opacity-80">
                                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded">ID: {selectedMember.id}</span>
                                {selectedMember.candidate_epmi && <span className="text-xs font-bold bg-accent-gold/20 text-accent-gold px-2 py-1 rounded flex items-center gap-1"><Award className="w-3 h-3"/> Candidato EPMI</span>}
                            </div>
                            <div className="flex gap-2 justify-center sm:justify-start items-center">
                                <button 
                                    onClick={() => {
                                        if (isPastor) {
                                            setNewStatus(selectedMember.estatus);
                                            setIsStatusModalOpen(true);
                                        }
                                    }}
                                    className={`${isPastor ? 'cursor-pointer hover:scale-105' : 'cursor-default'} transition-transform`}
                                >
                                    {getStatusBadge(selectedMember.estatus)}
                                </button>
                                
                                {selectedMember.telefono && (
                                    <button 
                                        onClick={() => sendWhatsApp(selectedMember.telefono, `Hola ${selectedMember.nombres.split(' ')[0]}, bendiciones. Te saludamos de la iglesia.`)}
                                        className="bg-emerald-500 hover:bg-emerald-400 text-white px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors no-print"
                                    >
                                        <MessageCircle className="w-3 h-3" /> WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-8">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex flex-col items-center border border-white/5">
                            <div className={`w-3 h-3 rounded-full mb-2 shadow-glow ${getTrafficLightColor(selectedMember.attendance_level)}`}></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Asistencia</span>
                        </div>
                        
                        {/* Security Rule: Hide Fidelity block completely if not authorized */}
                        {canSeeSensitive ? (
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex flex-col items-center border border-white/5">
                                <div className={`w-3 h-3 rounded-full mb-2 shadow-glow ${getTrafficLightColor(selectedMember.fidelity_level)}`}></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Fidelidad</span>
                            </div>
                        ) : (
                            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 flex flex-col items-center border border-white/5 opacity-50">
                                <div className="w-3 h-3 rounded-full mb-2 bg-slate-400"></div>
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-50">Privado</span>
                            </div>
                        )}

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 flex flex-col items-center border border-white/5">
                            <div className={`w-3 h-3 rounded-full mb-2 shadow-glow ${getTrafficLightColor(selectedMember.service_level)}`}></div>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Servicio</span>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-slate-100 bg-white shrink-0 px-6 overflow-x-auto no-scrollbar gap-6 no-print">
                    {['DATOS', 'FORMACION', 'MINISTERIOS', 'HISTORIAL'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`py-4 text-xs font-extrabold tracking-widest uppercase transition-all border-b-2 ${
                                activeTab === tab 
                                ? 'text-brand-blue border-brand-blue' 
                                : 'text-slate-400 border-transparent hover:text-slate-600'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-[#f8fafc] pb-24">
                    
                    {/* Simplified view for print */}
                    <div className="hidden print:block space-y-6 text-slate-800">
                        <h2 className="text-xl font-bold border-b pb-2 mb-4">Reporte Pastoral</h2>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><span className="font-bold">Teléfono:</span> {selectedMember.telefono}</div>
                            <div><span className="font-bold">Dirección:</span> {selectedMember.direccion}</div>
                            <div><span className="font-bold">Anexo:</span> {anexos.find(a => a.id === selectedMember.anexoId)?.nombre}</div>
                            <div><span className="font-bold">Casa:</span> {teachingHouses.find(h => h.id === selectedMember.teachingHouseId)?.nombre || 'Ninguna'}</div>
                            <div><span className="font-bold">Estado Civil:</span> {selectedMember.estadoCivil || 'N/A'}</div>
                            <div><span className="font-bold">Profesión:</span> {selectedMember.profesion || 'N/A'}</div>
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="font-bold mb-2">Formación & Servicio</h4>
                            <p>{selectedMember.coursesCompletedIds.length} Cursos Básicos Completados</p>
                            <p>Ministerios: {selectedMember.ministryIds.length > 0 ? selectedMember.ministryIds.join(', ') : 'Ninguno'}</p>
                        </div>
                        <div className="border-t pt-4">
                            <h4 className="font-bold mb-2">Habilidades</h4>
                            <p>{selectedMember.habilidades?.join(', ') || 'Ninguna registrada'}</p>
                        </div>
                    </div>

                    <div className="print:hidden">
                    {activeTab === 'DATOS' && (
                        <div className="space-y-6">
                            {/* AI Section */}
                            {canSeeSensitive && (
                                <div className="bg-gradient-to-r from-violet-50 to-fuchsia-50 p-6 rounded-3xl border border-violet-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-200/30 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-bold text-violet-800 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-violet-500" /> Asistente Pastoral (IA)
                                            </h4>
                                            {!aiInsight && (
                                                <button 
                                                    onClick={handleGenerateAi}
                                                    disabled={aiLoading}
                                                    className="bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-glow disabled:opacity-50 flex items-center gap-2"
                                                >
                                                    {aiLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                                    Generar Análisis
                                                </button>
                                            )}
                                        </div>
                                        
                                        {aiLoading && (
                                            <div className="text-center py-4 text-violet-400 text-xs animate-pulse">
                                                Analizando historial pastoral y patrones...
                                            </div>
                                        )}

                                        {aiInsight && (
                                            <div className="mt-3 bg-white/60 backdrop-blur-sm p-4 rounded-2xl text-slate-700 text-sm leading-relaxed border border-violet-100/50">
                                                <div className="prose prose-sm prose-violet">
                                                    {aiInsight.split('\n').map((line, i) => (
                                                        <p key={i} className="mb-2">{line}</p>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                        <User className="w-4 h-4" /> Información Personal
                                    </h4>
                                    {canEdit && !isEditingData && (
                                        <button 
                                            onClick={() => {
                                                setEditFormData({
                                                    telefono: selectedMember.telefono,
                                                    direccion: selectedMember.direccion,
                                                    estadoCivil: selectedMember.estadoCivil,
                                                    fechaNacimiento: selectedMember.fechaNacimiento,
                                                    profesion: selectedMember.profesion,
                                                    habilidades: selectedMember.habilidades || [], 
                                                    anexoId: isPastor ? selectedMember.anexoId : undefined,
                                                    teachingHouseId: selectedMember.teachingHouseId
                                                });
                                                setIsEditingData(true);
                                            }}
                                            className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-brand-blue transition-colors"
                                        >
                                            Editar
                                        </button>
                                    )}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Teléfono</label>
                                        {isEditingData ? (
                                            <input className="w-full bg-white p-2 rounded-lg text-sm font-bold text-slate-700 border border-slate-200" value={editFormData.telefono || ''} onChange={e => setEditFormData({...editFormData, telefono: e.target.value})} />
                                        ) : (
                                            <div className="flex justify-between items-center">
                                                <p className="font-bold text-slate-700">{selectedMember.telefono || '---'}</p>
                                                {selectedMember.telefono && (
                                                    <a href={`https://wa.me/${selectedMember.telefono.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600"><Phone className="w-3 h-3"/></a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Dirección</label>
                                        {isEditingData ? (
                                            <input className="w-full bg-white p-2 rounded-lg text-sm font-bold text-slate-700 border border-slate-200" value={editFormData.direccion || ''} onChange={e => setEditFormData({...editFormData, direccion: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-slate-700">{selectedMember.direccion || '---'}</p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Estado Civil</label>
                                        {isEditingData ? (
                                            <select className="w-full bg-white p-2 rounded-lg text-sm font-bold text-slate-700 border border-slate-200" value={editFormData.estadoCivil || ''} onChange={e => setEditFormData({...editFormData, estadoCivil: e.target.value as any})}>
                                                <option value="Soltero(a)">Soltero(a)</option>
                                                <option value="Casado(a)">Casado(a)</option>
                                                <option value="Viudo(a)">Viudo(a)</option>
                                                <option value="Divorciado(a)">Divorciado(a)</option>
                                            </select>
                                        ) : (
                                            <p className="font-bold text-slate-700">{selectedMember.estadoCivil || '---'}</p>
                                        )}
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-2xl">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase">Fecha Nac.</label>
                                        {isEditingData ? (
                                            <input type="date" className="w-full bg-white p-2 rounded-lg text-sm font-bold text-slate-700 border border-slate-200" value={editFormData.fechaNacimiento || ''} onChange={e => setEditFormData({...editFormData, fechaNacimiento: e.target.value})} />
                                        ) : (
                                            <p className="font-bold text-slate-700">{selectedMember.fechaNacimiento || '---'}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* LOCATION SECTION (MOVED UP FOR BETTER UX) */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Ubicación Eclesiástica
                                </h4>
                                <div className="flex items-center justify-between p-4 bg-brand-soft/30 rounded-2xl border border-brand-light/30">
                                    <div className="w-full">
                                        <span className="text-[10px] font-bold text-brand-blue uppercase">Anexo</span>
                                        {isEditingData && isPastor ? (
                                            <select 
                                                className="w-full bg-white mt-1 p-2 rounded border border-brand-blue/30 text-sm font-bold text-slate-700 outline-none"
                                                value={editFormData.anexoId || selectedMember.anexoId}
                                                onChange={e => setEditFormData({
                                                    ...editFormData, 
                                                    anexoId: e.target.value,
                                                    teachingHouseId: '' // Clear house when annex changes
                                                })}
                                            >
                                                {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                            </select>
                                        ) : (
                                            <p className="font-bold text-slate-800">{anexos.find(a => a.id === selectedMember.anexoId)?.nombre}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                                    <div className="w-full">
                                        <span className="text-[10px] font-bold text-orange-500 uppercase">Casa de Enseñanza</span>
                                        {isEditingData && (canEdit || isPastor) ? (
                                            <select
                                                className="w-full bg-white mt-1 p-2 rounded border border-orange-200 text-sm font-bold text-slate-700 outline-none"
                                                value={editFormData.teachingHouseId || ''}
                                                onChange={e => setEditFormData({...editFormData, teachingHouseId: e.target.value})}
                                            >
                                                <option value="">Sin Asignar</option>
                                                {teachingHouses
                                                    .filter(h => h.anexoId === (editFormData.anexoId || selectedMember.anexoId))
                                                    .map(h => (
                                                        <option key={h.id} value={h.id}>{h.nombre}</option>
                                                    ))
                                                }
                                            </select>
                                        ) : (
                                            <p className="font-bold text-slate-800">
                                                {teachingHouses.find(h => h.id === selectedMember.teachingHouseId)?.nombre || 'Sin Asignar'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SKILLS SECTION */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Wrench className="w-4 h-4" /> Habilidades y Talentos
                                </h4>
                                
                                {isEditingData ? (
                                    <div className="space-y-3">
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 bg-slate-50 p-2 rounded-lg text-sm border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light"
                                                placeholder="Ej. Guitarra, Carpintería..."
                                                value={newSkill}
                                                onChange={e => setNewSkill(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                            />
                                            <button onClick={handleAddSkill} className="bg-slate-800 text-white px-3 rounded-lg text-xs font-bold hover:bg-black">Agregar</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(editFormData.habilidades || []).map(skill => (
                                                <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-blue-100 animate-fadeIn">
                                                    {skill}
                                                    <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500 rounded-full p-0.5"><X className="w-3 h-3"/></button>
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-[10px] text-slate-400 italic">Presiona Enter para agregar</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedMember.habilidades && selectedMember.habilidades.length > 0) ? (
                                            selectedMember.habilidades.map(skill => (
                                                <span key={skill} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold border border-slate-200">
                                                    {skill}
                                                </span>
                                            ))
                                        ) : (
                                            <p className="text-xs text-slate-400 italic">No hay habilidades registradas.</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* DELETE MEMBER SECTION */}
                            {canSeeSensitive && !isEditingData && (
                                <div className="pt-4 border-t border-slate-100">
                                    <button 
                                        onClick={() => setMemberToDelete(selectedMember.id)}
                                        className="w-full py-3 bg-red-50 text-red-500 font-bold rounded-2xl hover:bg-red-100 transition-colors flex justify-center items-center gap-2"
                                    >
                                        <Trash2 className="w-4 h-4" /> Eliminar Ficha
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* OTHER TABS (unchanged) */}
                    {activeTab === 'FORMACION' && (
                        <div className="space-y-6">
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">7 Cursos Básicos</h4>
                                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">
                                        {selectedMember.coursesCompletedIds.filter(id => courses.find(c => c.id === id)?.type === 'BASICO').length} / 7
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {courses.filter(c => c.type === 'BASICO').sort((a,b) => a.orden - b.orden).map(course => {
                                        const isCompleted = selectedMember.coursesCompletedIds.includes(course.id);
                                        return (
                                            <div 
                                                key={course.id}
                                                onClick={() => {
                                                    if(!canEdit) return;
                                                    const newIds = isCompleted 
                                                        ? selectedMember.coursesCompletedIds.filter(id => id !== course.id)
                                                        : [...selectedMember.coursesCompletedIds, course.id];
                                                    
                                                    const basics = courses.filter(c => c.type === 'BASICO');
                                                    const doneCount = newIds.filter(id => basics.find(b => b.id === id)).length;
                                                    
                                                    updateMember(selectedMember.id, { 
                                                        coursesCompletedIds: newIds,
                                                        completed_basicos: doneCount === 7 
                                                    });
                                                    setSelectedMember({...selectedMember, coursesCompletedIds: newIds, completed_basicos: doneCount === 7} as any);
                                                }}
                                                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                                    isCompleted 
                                                    ? 'bg-emerald-50 border-emerald-100' 
                                                    : 'bg-white border-slate-100 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                                        isCompleted ? 'bg-emerald-50 text-white' : 'bg-slate-200 text-slate-500'
                                                    }`}>
                                                        {course.orden}
                                                    </div>
                                                    <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-800' : 'text-slate-500'}`}>
                                                        {course.nombre}
                                                    </span>
                                                </div>
                                                {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h4 className="text-lg font-bold mb-1 flex items-center gap-2"><Award className="w-5 h-5 text-amber-400" /> Estatus EPMI</h4>
                                    <p className="text-slate-400 text-xs mb-4">Escuela de Preparación Ministerial Internacional</p>
                                    
                                    {epmiStatus ? (
                                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-amber-400">{epmiStatus.cycle.replace('_', ' ')}</span>
                                                <span className="text-xs font-bold bg-white/20 px-2 py-1 rounded">{epmiStatus.status}</span>
                                            </div>
                                            <div className="mt-3 flex gap-2 text-xs text-slate-300">
                                                <p>Asistencia: {epmiStatus.attendance}%</p>
                                            </div>
                                        </div>
                                    ) : selectedMember.completed_basicos ? (
                                        selectedMember.candidate_epmi ? (
                                            <div className="bg-emerald-500/20 backdrop-blur-md p-4 rounded-xl border border-emerald-500/30">
                                                <p className="font-bold text-sm text-emerald-400">✅ Candidato Aprobado</p>
                                                <p className="text-xs mt-1 text-slate-300">Listo para inscripción oficial en Ciclo I.</p>
                                            </div>
                                        ) : (
                                            <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/10">
                                                <p className="font-bold text-sm text-amber-200">🟡 Pre-Requisitos Completos</p>
                                                <p className="text-xs mt-1 text-slate-400">El sistema sugerirá su candidatura al Pastor.</p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="bg-white/5 backdrop-blur-md p-4 rounded-xl border border-white/5 opacity-50">
                                            <p className="font-bold text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4"/> No Elegible Aún</p>
                                            <p className="text-xs mt-1">Debe completar los 7 cursos básicos.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'MINISTERIOS' && (
                        <div className="text-center py-10 text-slate-400">
                            <Shield className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Gestión detallada en la sección Ministerios</p>
                            <div className="mt-4 flex flex-wrap gap-2 justify-center">
                                {selectedMember.ministryIds.map(minId => (
                                    <span key={minId} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                                        {minId} ({selectedMember.ministryRoles?.[minId] || 'Miembro'})
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'HISTORIAL' && (
                        <div className="space-y-4">
                            {canSeeSensitive && (
                                <button 
                                    onClick={() => setIsNoteOpen(true)}
                                    className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Agregar Nota Pastoral
                                </button>
                            )}

                            {getMemberHistory(selectedMember.id).map((item, idx) => (
                                <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 flex gap-4">
                                    <div className={`p-2.5 rounded-xl h-fit ${
                                        item.tipo === 'VIAJE' ? 'bg-sky-100 text-sky-600' :
                                        item.tipo === 'NOTA' ? 'bg-amber-100 text-amber-600' :
                                        item.tipo === 'CAMBIO_ESTATUS' ? 'bg-purple-100 text-purple-600' :
                                        'bg-slate-100 text-slate-500'
                                    }`}>
                                        {item.tipo === 'VIAJE' ? <Plane className="w-5 h-5" /> : 
                                         item.tipo === 'CAMBIO_ESTATUS' ? <RefreshCw className="w-5 h-5" /> :
                                         <StickyNote className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.fecha}</span>
                                        <h4 className="font-bold text-slate-800">{item.titulo}</h4>
                                        <p className="text-sm text-slate-500 mt-1">{item.detalle}</p>
                                    </div>
                                </div>
                            ))}
                            {getMemberHistory(selectedMember.id).length === 0 && (
                                <p className="text-center text-slate-400 py-4 text-sm">Sin historial registrado</p>
                            )}
                        </div>
                    )}
                    </div>

                </div>

                {/* STICKY FOOTER FOR EDIT MODE */}
                {isEditingData && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30 flex gap-4 justify-end rounded-b-[2.5rem]">
                        <button 
                            onClick={() => setIsEditingData(false)}
                            className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleSaveData}
                            className="flex-1 py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-dark transition-colors shadow-glow flex justify-center items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> Guardar Cambios
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* CREATE MEMBER MODAL */}
      {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Nuevo Miembro</h3>
                  <form onSubmit={handleCreateMember} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre Completo</label>
                          <input className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} placeholder="Ej. Juan Pérez" autoFocus />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Teléfono</label>
                          <input className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" value={newMemberPhone} onChange={e => setNewMemberPhone(e.target.value)} placeholder="+51 999..." />
                      </div>
                      {currentUser.role === 'PASTOR_PRINCIPAL' && (
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Asignar Anexo</label>
                              <select className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" value={newMemberAnexo} onChange={e => setNewMemberAnexo(e.target.value)}>
                                  <option value="">-- Seleccionar --</option>
                                  {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                              </select>
                          </div>
                      )}
                      <button type="submit" className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-glow mt-2 hover:bg-brand-dark transition-colors">Crear Ficha</button>
                  </form>
              </div>
          </div>
      )}

      {/* OTHER MODALS (Note, Status, Photo, Delete) - Same as previous */}
      {/* NOTE MODAL */}
      {isNoteOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsNoteOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Nota Pastoral</h3>
                  <textarea 
                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light text-slate-700 h-32 resize-none"
                    placeholder="Escriba la observación confidencial..."
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                  />
                  <button onClick={handleAddNote} className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold mt-4 hover:bg-black transition-colors">Guardar Nota</button>
              </div>
          </div>
      )}

      {/* STATUS CHANGE MODAL */}
      {isStatusModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsStatusModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Cambio de Estatus Espiritual</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Nuevo Estatus</label>
                          <select 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700"
                            value={newStatus}
                            onChange={e => setNewStatus(e.target.value as SpiritualStatus)}
                          >
                              {Object.values(SpiritualStatus).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Justificación Pastoral (Requerido)</label>
                          <textarea 
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light text-slate-700 h-24 resize-none"
                            placeholder="Describa la razón del cambio..."
                            value={statusReason}
                            onChange={e => setStatusReason(e.target.value)}
                          />
                      </div>

                      <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                          <p className="text-xs text-amber-700 leading-relaxed">
                              Este cambio quedará registrado en el historial inmutable del miembro y en la auditoría del sistema.
                          </p>
                      </div>

                      <button 
                        onClick={handleStatusChange} 
                        disabled={!statusReason}
                        className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold mt-2 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Confirmar Cambio
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* PHOTO MODAL */}
      {isPhotoOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsPhotoOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Actualizar Foto</h3>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 mb-4 text-center cursor-pointer hover:bg-slate-50 hover:border-brand-blue transition-colors group"
                  >
                      {newPhotoUrl ? (
                          <div className="relative">
                              <img src={newPhotoUrl} className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white shadow-lg" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Camera className="w-8 h-8 text-white" />
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                  {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-brand-blue"/> : <UploadCloud className="w-6 h-6" />}
                              </div>
                              <span className="text-xs font-bold uppercase">{isUploading ? 'Procesando...' : 'Toca para subir foto'}</span>
                          </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                      <div className="h-px bg-slate-200 flex-1"></div>
                      <span className="text-[10px] font-bold text-slate-400">O PEGA UNA URL</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                  </div>

                  <input 
                    className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light text-slate-700 mb-4 text-sm"
                    placeholder="https://..."
                    value={newPhotoUrl}
                    onChange={e => setNewPhotoUrl(e.target.value)}
                  />
                  <button 
                    onClick={handleUpdatePhoto} 
                    disabled={!newPhotoUrl}
                    className="w-full py-3 bg-brand-blue text-white rounded-2xl font-bold hover:bg-brand-dark transition-colors disabled:opacity-50"
                  >
                      Guardar Foto
                  </button>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {memberToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Ficha?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Se borrará todo el historial, notas y registros de este miembro. Esta acción es irreversible.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setMemberToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                      <button onClick={confirmDeleteMember} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Members;
