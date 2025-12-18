
import React, { useState, useRef } from 'react';
import { useApp } from '../App.tsx';
import { Member, SpiritualStatus, IndicatorLevel, Course, EcclesiasticalRole, FidelidadEstado, GraduacionEstado, AdmisionEstado } from '../types';
import { Search, Plus, X, Phone, MapPin, Calendar, BookOpen, Shield, Heart, Edit3, Camera, User, Award, CheckCircle2, AlertTriangle, AlertCircle, Check, Plane, StickyNote, Sparkles, Loader2, Save, MessageCircle, Trash2, RefreshCw, Printer, UploadCloud, Image as ImageIcon, Wrench, Briefcase, ListChecks } from 'lucide-react';
import { generatePastoralInsight } from '../services/geminiService';
import { Navigate } from 'react-router-dom';
import BatchFidelityModal from './BatchFidelityModal';

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
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

    // Status Change State
    const [newStatus, setNewStatus] = useState<SpiritualStatus>(SpiritualStatus.STABLE);
    const [statusReason, setStatusReason] = useState('');

    // Delete State
    const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

    // Form States
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberPhone, setNewMemberPhone] = useState('');
    const [newMemberSex, setNewMemberSex] = useState<'M' | 'F'>('M'); // Default Male
    const [newMemberAnexo, setNewMemberAnexo] = useState('');
    const [newMemberDni, setNewMemberDni] = useState(''); // v2.0
    const [memberDuplicateFound, setMemberDuplicateFound] = useState<Member | null>(null); // v2.0
    const [createStep, setCreateStep] = useState<'DNI' | 'FORM'>('DNI'); // v2.0

    // Photo Upload State
    const [newPhotoUrl, setNewPhotoUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Note State
    const [newNoteContent, setNewNoteContent] = useState('');

    // --- SECURITY: STRICT REDIRECT FOR MEMBERS (PDF 9.11 & 14.3) ---
    // A member should NEVER see the directory list.
    if (currentUser.role === 'MIEMBRO') {
        return <Navigate to="/profile" replace />;
    }

    // --- LOGIC: Visibility based on Role (PDF Part 8.1.4) ---
    // --- LOGIC: Visibility based on Role (PDF Part 8.1.4) ---
    const canEdit = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'MINISTRO', 'LIDER_ANEXO'].includes(currentUser.role);
    const canSeeSensitive = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'MINISTRO'].includes(currentUser.role); // Fidelidad & Spiritual State (DENY Secretaria)
    const canSeePastoralSecrets = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'MINISTRO'].includes(currentUser.role); // Notes, Reasons, Full Restricted Info
    const isPastor = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO'].includes(currentUser.role);
    const canViewRestrictedStatus = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL'].includes(currentUser.role); // Secretaria sees status ONLY

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
        switch (level) {
            case 'VERDE': return 'bg-emerald-500 ring-emerald-200';
            case 'AMARILLO': return 'bg-amber-400 ring-amber-200';
            case 'NARANJA': return 'bg-orange-500 ring-orange-200';
            case 'ROJO': return 'bg-red-500 ring-red-200';
            default: return 'bg-slate-300 ring-slate-200';
        }
    };

    const getFidelidadColor = (status?: FidelidadEstado) => {
        switch (status) {
            case FidelidadEstado.FIDEL: return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case FidelidadEstado.INTERMITENTE: return 'bg-amber-50 text-amber-700 border-amber-200';
            case FidelidadEstado.BAJA: return 'bg-orange-50 text-orange-700 border-orange-200';
            case FidelidadEstado.NINGUNA: return 'bg-red-50 text-red-700 border-red-200';
            default: return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getStatusBadge = (status: SpiritualStatus) => {
        let colors = 'bg-slate-50 text-slate-600 border-slate-200';
        if (status === SpiritualStatus.STABLE) colors = 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (status === SpiritualStatus.NEW) colors = 'bg-sky-50 text-sky-700 border-sky-100';
        if (status === SpiritualStatus.DISCIPLINE) colors = 'bg-red-50 text-red-700 border-red-100';
        if (status === SpiritualStatus.RESTORATION) colors = 'bg-orange-50 text-orange-700 border-orange-100';
        if (status === SpiritualStatus.OBSERVATION) colors = 'bg-amber-50 text-amber-700 border-amber-100';

        return (
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${colors}`}>
                {status}
            </span>
        );
    };

    const getRolesByGender = (sex: 'M' | 'F'): EcclesiasticalRole[] => {
        if (sex === 'F') {
            // Specific Female Variants (No Ministra - Use Ministro as neutral)
            return ['Pastora', 'Ministro', 'Diaconisa', 'Obrera', 'Líder', 'Evangelista', 'Predicadora', 'Maestra', 'Sierva', 'Miembro', 'Visitante'];
        }
        // Male / Default
        return ['Pastor Cobertura', 'Ministro', 'Ministro Ordenado', 'Anciano', 'Diácono', 'Obrero', 'Líder', 'Evangelista', 'Predicador', 'Maestro', 'Siervo', 'Miembro', 'Visitante'];
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

        return history.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    };

    // --- HANDLERS ---
    // v2.0 Check DNI
    const checkDniAndProceed = () => {
        if (!newMemberDni) return;
        const exists = members.find(m => m.dni === newMemberDni);
        if (exists) {
            setMemberDuplicateFound(exists);
        } else {
            setCreateStep('FORM');
            setMemberDuplicateFound(null);
        }
    };

    const handleTransferMember = (memberId: string) => {
        const targetAnexoId = currentUser.anexoId === 'ALL' ? (newMemberAnexo || anexos[0].id) : currentUser.anexoId;
        updateMember(memberId, { anexoId: targetAnexoId, teachingHouseId: undefined });
        setIsCreateOpen(false);
        setNewMemberDni('');
        setCreateStep('DNI');
        setMemberDuplicateFound(null);
        notify("Miembro transferido exitosamente.");
    };

    const handleCreateMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemberName) return;

        const anexoId = currentUser.anexoId === 'ALL' ? (newMemberAnexo || anexos[0].id) : currentUser.anexoId;

        const newMember: Member = {
            id: `MEM-${Date.now()}`,
            dni: newMemberDni, // v2.0
            nombres: newMemberName,
            telefono: newMemberPhone,
            sex: newMemberSex,
            anexoId: anexoId,
            estatus: SpiritualStatus.NEW,
            cargo: 'Miembro', // Default role
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
        setNewMemberSex('M');
        setNewMemberDni('');
        setCreateStep('DNI');
    };

    const handleSaveData = () => {
        if (selectedMember) {
            updateMember(selectedMember.id, editFormData);
            setSelectedMember({ ...selectedMember, ...editFormData } as Member);
            setIsEditingData(false);
        }
    };

    const handleAddSkill = () => {
        if (newSkill.trim() && editFormData) {
            const currentSkills = editFormData.habilidades || [];
            // Avoid duplicates in UI
            if (!currentSkills.includes(newSkill.trim())) {
                setEditFormData({ ...editFormData, habilidades: [...currentSkills, newSkill.trim()] });
            }
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skill: string) => {
        if (editFormData) {
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
        <div className="space-y-8 animate-fadeIn max-w-[1600px] mx-auto p-4 md:p-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Directorio de Miembros</h2>
                    <p className="text-lg text-slate-500 font-medium mt-1">Gestión de la membresía general.</p>
                </div>
                <div className="flex gap-3">
                    {isPastor && (
                        <button
                            onClick={() => setIsBatchModalOpen(true)}
                            className="bg-white text-blue-600 border border-blue-200 px-5 py-3 rounded-2xl font-bold shadow-sm hover:bg-blue-50 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <ListChecks className="w-5 h-5" />
                            <span className="hidden sm:inline">Carga Masiva</span>
                        </button>
                    )}
                    {canEdit && (
                        <button
                            onClick={() => { setIsCreateOpen(true); setCreateStep('DNI'); setNewMemberDni(''); }}
                            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98] cursor-pointer"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Nuevo Miembro</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar por nombre..."
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border-2 border-slate-100 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all text-base font-medium shadow-sm"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Chips */}
            <div className="flex overflow-x-auto gap-3 py-1 no-scrollbar pb-2">
                <button onClick={() => setFilterStatus('ALL')} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${filterStatus === 'ALL' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>Todos</button>
                {[SpiritualStatus.NEW, SpiritualStatus.STABLE, SpiritualStatus.DISCIPLINE, SpiritualStatus.OBSERVATION].map(s => (
                    <button key={s} onClick={() => setFilterStatus(s)} className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border cursor-pointer ${filterStatus === s ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>{s}</button>
                ))}
            </div>


            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                {visibleMembers.map(member => (
                    <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-200 flex items-center gap-5 cursor-pointer hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 transition-all group"
                    >
                        <div className="relative">
                            <img src={member.photoUrl} alt="" className="w-16 h-16 rounded-2xl bg-slate-100 object-cover ring-2 ring-slate-50" />
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-2 ring-white ${getTrafficLightColor(member.attendance_level)}`}></div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 truncate text-lg leading-tight mb-0.5 group-hover:text-blue-700 transition-colors">{member.nombres}</h4>
                            <p className="text-xs text-blue-600 font-bold uppercase mb-2 tracking-wide">{member.cargo || 'Miembro'} • {anexos.find(a => a.id === member.anexoId)?.nombre.substring(0, 15)}</p>
                            {getStatusBadge(member.estatus)}
                        </div>

                        {/* Traffic Lights Mini */}
                        <div className="flex flex-col gap-2 self-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                            {canSeeSensitive && (
                                <div className={`w-2.5 h-2.5 rounded-full ring-1 ${getTrafficLightColor(member.fidelity_level)}`} title="Fidelidad"></div>
                            )}
                            <div className={`w-2.5 h-2.5 rounded-full ring-1 ${getTrafficLightColor(member.service_level)}`} title="Servicio"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* FICHA 360 MODAL */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center print-only-visible animate-fadeIn">
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm no-print transition-all" onClick={closeProfile}></div>
                    <div className="bg-slate-50 w-full sm:max-w-4xl sm:rounded-[2.5rem] h-[95vh] sm:h-[90vh] flex flex-col shadow-2xl overflow-hidden relative print:h-auto print:shadow-none print:m-0 print:rounded-none ring-1 ring-white/20">

                        <button onClick={closeProfile} className="absolute top-6 right-6 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2.5 rounded-full text-white z-20 transition-colors no-print cursor-pointer">
                            <X className="w-5 h-5" />
                        </button>

                        <button onClick={handlePrint} className="absolute top-6 right-20 bg-black/20 hover:bg-black/40 backdrop-blur-md p-2.5 rounded-full text-white z-20 transition-colors no-print cursor-pointer" title="Imprimir Ficha">
                            <Printer className="w-5 h-5" />
                        </button>

                        {/* Header Profile */}
                        <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8 pt-12 text-white shrink-0 relative print:bg-slate-800 overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-20 translate-x-20 pointer-events-none"></div>

                            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                                <div className="relative group shrink-0">
                                    <img src={selectedMember.photoUrl} className="w-28 h-28 rounded-[2rem] shadow-xl border-4 border-white/10 object-cover" />
                                    {canEdit && (
                                        <button
                                            onClick={() => {
                                                setNewPhotoUrl(selectedMember.photoUrl || '');
                                                setIsPhotoOpen(true);
                                            }}
                                            className="absolute -bottom-3 -right-3 bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-900/50 hover:scale-110 transition-transform no-print border border-white/20 cursor-pointer"
                                        >
                                            <Camera className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                                <div className="text-center sm:text-left flex-1 min-w-0">
                                    <h3 className="text-3xl font-extrabold tracking-tight mb-1 truncate">{selectedMember.nombres}</h3>
                                    <div className="text-sm font-bold text-blue-300 uppercase tracking-widest mb-3">{selectedMember.cargo || 'Miembro'}</div>
                                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 opacity-90 mb-4">
                                        {selectedMember.candidate_epmi && <span className="text-xs font-bold bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-lg flex items-center gap-1.5 border border-yellow-500/30"><Award className="w-3 h-3" /> Candidato EPMI</span>}
                                    </div>
                                    <div className="flex gap-3 justify-center sm:justify-start items-center">
                                        <button
                                            onClick={() => {
                                                if (isPastor) {
                                                    setNewStatus(selectedMember.estatus);
                                                    setIsStatusModalOpen(true);
                                                }
                                            }}
                                            className={`${isPastor ? 'cursor-pointer hover:scale-105' : 'cursor-default'} transition-transform no-print`}
                                        >
                                            {getStatusBadge(selectedMember.estatus)}
                                        </button>

                                        {selectedMember.telefono && (
                                            <button
                                                onClick={() => sendWhatsApp(selectedMember.telefono, `Hola ${selectedMember.nombres.split(' ')[0]}, bendiciones. Te saludamos de la iglesia.`)}
                                                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors no-print shadow-lg shadow-emerald-500/20 cursor-pointer"
                                            >
                                                <MessageCircle className="w-3 h-3" /> WhatsApp
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8">
                                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                    <div className={`w-4 h-4 rounded-full mb-2 ring-4 ring-white/10 ${getTrafficLightColor(selectedMember.attendance_level)}`}></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Asistencia</span>
                                </div>

                                {canSeeSensitive ? (
                                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                        <div className={`w-4 h-4 rounded-full mb-2 ring-4 ring-white/10 ${getTrafficLightColor(selectedMember.fidelity_level)}`}></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Fidelidad</span>
                                    </div>
                                ) : (
                                    <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5 opacity-50 cursor-not-allowed">
                                        <div className="w-4 h-4 rounded-full mb-2 bg-slate-600"></div>
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Privado</span>
                                    </div>
                                )}

                                <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                    <div className={`w-4 h-4 rounded-full mb-2 ring-4 ring-white/10 ${getTrafficLightColor(selectedMember.service_level)}`}></div>
                                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Servicio</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex border-b border-slate-200 bg-white shrink-0 px-6 sm:px-8 overflow-x-auto no-scrollbar gap-8 no-print sticky top-0 z-10">
                            {['DATOS', 'FORMACION', 'MINISTERIOS', 'HISTORIAL'].filter(tab => tab !== 'HISTORIAL' || canSeePastoralSecrets).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab as any)}
                                    className={`py-4 text-sm font-bold tracking-widest transition-all border-b-[3px] ${activeTab === tab
                                        ? 'text-blue-600 border-blue-600'
                                        : 'text-slate-400 border-transparent hover:text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 pb-32 print:p-0 bg-slate-50 relative">

                            {/* Simplified view for print */}
                            <div className="hidden print:block space-y-4 text-slate-800 p-6">
                                <h2 className="text-xl font-bold border-b pb-2 mb-4">Ficha Pastoral - {selectedMember.nombres}</h2>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div><strong className="block text-slate-500 text-xs">Cargo:</strong> {selectedMember.cargo}</div>
                                    <div><strong className="block text-slate-500 text-xs">Teléfono:</strong> {selectedMember.telefono}</div>
                                    <div><strong className="block text-slate-500 text-xs">Dirección:</strong> {selectedMember.direccion}</div>
                                    <div><strong className="block text-slate-500 text-xs">Anexo:</strong> {anexos.find(a => a.id === selectedMember.anexoId)?.nombre}</div>
                                    <div><strong className="block text-slate-500 text-xs">Casa de Paz:</strong> {teachingHouses.find(h => h.id === selectedMember.teachingHouseId)?.nombre || 'Ninguna'}</div>
                                    <div><strong className="block text-slate-500 text-xs">Estado Civil:</strong> {selectedMember.estadoCivil || 'N/A'}</div>
                                    <div><strong className="block text-slate-500 text-xs">Profesión:</strong> {selectedMember.profesion || 'N/A'}</div>
                                </div>
                                <div className="border-t pt-4 mt-4">
                                    <h4 className="font-bold mb-2">Formación & Servicio</h4>
                                    <p><strong className="text-slate-500 text-xs">Cursos Completados:</strong> {selectedMember.coursesCompletedIds.length}</p>
                                    <p><strong className="text-slate-500 text-xs">Ministerios:</strong> {selectedMember.ministryIds.length > 0 ? selectedMember.ministryIds.join(', ') : 'Ninguno'}</p>
                                </div>
                            </div>

                            <div className="print:hidden">
                                {activeTab === 'DATOS' && (
                                    <div className="space-y-6">
                                        {/* AI Section (Restricted to Pastoral Roles) */}
                                        {canSeeSensitive && canSeePastoralSecrets && (
                                            <div className="bg-gradient-to-r from-violet-50 via-white to-violet-50 p-6 rounded-2xl border border-violet-100 shadow-sm relative overflow-hidden">
                                                <div className="flex justify-between items-center mb-4 relative z-10">
                                                    <h4 className="text-sm font-bold text-violet-800 flex items-center gap-2">
                                                        <div className="bg-violet-100 p-1.5 rounded-lg"><Sparkles className="w-4 h-4 text-violet-600" /></div>
                                                        Asistente Pastoral (IA)
                                                    </h4>
                                                    {!aiInsight && (
                                                        <button
                                                            onClick={handleGenerateAi}
                                                            disabled={aiLoading}
                                                            className="bg-white hover:bg-violet-50 text-violet-700 text-xs font-bold px-4 py-2 rounded-xl transition-all border border-violet-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                                                        >
                                                            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                            Generar Análisis
                                                        </button>
                                                    )}
                                                </div>

                                                {aiLoading && <div className="text-center py-6 text-violet-500 text-sm animate-pulse font-medium">Analizando historial y patrones...</div>}

                                                {aiInsight && (
                                                    <div className="bg-white/80 p-5 rounded-xl text-slate-700 text-sm leading-relaxed border border-violet-100 shadow-sm relative z-10">
                                                        {aiInsight.split('\n').map((line, i) => (
                                                            <p key={i} className="mb-2 last:mb-0">{line}</p>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-5">
                                            <div className="flex justify-between items-center">
                                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <User className="w-4 h-4" /> Datos Personales
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
                                                                teachingHouseId: selectedMember.teachingHouseId,
                                                                cargo: selectedMember.cargo,
                                                                sex: selectedMember.sex || 'M',
                                                                // v1.1 Fields
                                                                fidelidad_estado: selectedMember.fidelidad_estado,
                                                                graduacion_estado: selectedMember.graduacion_estado,
                                                                admision_estado: selectedMember.admision_estado,
                                                                admision_motivo: selectedMember.admision_motivo,
                                                                graduacion_motivo: selectedMember.graduacion_motivo
                                                            });
                                                            setIsEditingData(true);
                                                        }}
                                                        className="text-xs font-bold px-4 py-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                            </div>

                                            <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
                                                <div className="grid grid-cols-2 gap-6">
                                                    <div>
                                                        <label className="text-xs font-bold text-blue-900 uppercase tracking-wide opacity-70 mb-1 block">Anexo</label>
                                                        {isEditingData && isPastor ? (
                                                            <select
                                                                className="w-full bg-white mt-1 p-2.5 rounded-xl border-2 border-blue-200 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-blue-100"
                                                                value={editFormData.anexoId || selectedMember.anexoId}
                                                                onChange={e => setEditFormData({
                                                                    ...editFormData,
                                                                    anexoId: e.target.value,
                                                                    teachingHouseId: ''
                                                                })}
                                                            >
                                                                {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                                            </select>
                                                        ) : (
                                                            <p className="font-bold text-slate-800 text-base">{anexos.find(a => a.id === selectedMember.anexoId)?.nombre}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-orange-900 uppercase tracking-wide opacity-70 mb-1 block">Casa de Paz</label>
                                                        {isEditingData && (canEdit || isPastor) ? (
                                                            <select
                                                                className="w-full bg-white mt-1 p-2.5 rounded-xl border-2 border-orange-200 text-sm font-bold text-slate-800 outline-none focus:ring-4 focus:ring-orange-100"
                                                                value={editFormData.teachingHouseId || ''}
                                                                onChange={e => setEditFormData({ ...editFormData, teachingHouseId: e.target.value })}
                                                            >
                                                                <option value="">-- Sin Asignar --</option>
                                                                {teachingHouses
                                                                    .filter(h => h.anexoId === (editFormData.anexoId || selectedMember.anexoId))
                                                                    .map(h => (
                                                                        <option key={h.id} value={h.id}>{h.nombre}</option>
                                                                    ))
                                                                }
                                                            </select>
                                                        ) : (
                                                            <p className="font-bold text-slate-800 text-base">
                                                                {teachingHouses.find(h => h.id === selectedMember.teachingHouseId)?.nombre || 'Sin Asignar'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {[
                                                    { label: 'Cargo Ministerial', value: selectedMember.cargo, key: 'cargo' },
                                                    { label: 'Teléfono', value: selectedMember.telefono, key: 'telefono' },
                                                    { label: 'Dirección', value: selectedMember.direccion, key: 'direccion' },
                                                    { label: 'Estado Civil', value: selectedMember.estadoCivil, key: 'estadoCivil' },
                                                    { label: 'Fecha Nacimiento', value: selectedMember.fechaNacimiento, key: 'fechaNacimiento' },
                                                    { label: 'Profesión', value: selectedMember.profesion, key: 'profesion' },
                                                ].map(item => (
                                                    <div key={item.key} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                                        <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1 block">{item.label}</label>
                                                        <p className="font-bold text-slate-800 text-sm">{item.value || 'No especificado'}</p>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* v1.1 Clasificación Pastoral */}
                                            {(canSeeSensitive || isPastor) && (
                                                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-5">
                                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <Shield className="w-4 h-4" /> Clasificación Pastoral
                                                    </h4>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                        {/* Fidelidad */}
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide opacity-70 mb-1 block">Estado de Fidelidad</label>
                                                            {isEditingData ? (
                                                                <select
                                                                    value={editFormData.fidelidad_estado || FidelidadEstado.SIN_INFO}
                                                                    onChange={e => setEditFormData({ ...editFormData, fidelidad_estado: e.target.value as FidelidadEstado })}
                                                                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800"
                                                                >
                                                                    {Object.values(FidelidadEstado).map(s => <option key={s} value={s}>{s}</option>)}
                                                                </select>
                                                            ) : (
                                                                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${getFidelidadColor(selectedMember.fidelidad_estado)}`}>
                                                                    {selectedMember.fidelidad_estado || 'SIN INFO'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Admisión (Viewable by Secretaria but limited) */}
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide opacity-70 mb-1 block">Admisión</label>
                                                            {isEditingData && canEdit ? ( // Only Pastors/Ministros edit this
                                                                <div className="space-y-2">
                                                                    <select
                                                                        value={editFormData.admision_estado || AdmisionEstado.NORMAL}
                                                                        onChange={e => setEditFormData({ ...editFormData, admision_estado: e.target.value as AdmisionEstado })}
                                                                        className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800"
                                                                    >
                                                                        {Object.values(AdmisionEstado).map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                    {editFormData.admision_estado === AdmisionEstado.RESTRINGIDO && (
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Motivo de restricción..."
                                                                            value={editFormData.admision_motivo || ''}
                                                                            onChange={e => setEditFormData({ ...editFormData, admision_motivo: e.target.value })}
                                                                            className="w-full p-2 rounded-lg border border-red-200 text-sm bg-red-50 text-red-800 placeholder-red-300"
                                                                        />
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div>
                                                                    {canViewRestrictedStatus ? (
                                                                        <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${selectedMember.admision_estado === AdmisionEstado.RESTRINGIDO ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                            {selectedMember.admision_estado || 'NORMAL'}
                                                                        </span>
                                                                    ) : (
                                                                        <span className="text-slate-400 text-sm">Confidencial</span>
                                                                    )}
                                                                    {selectedMember.admision_estado === AdmisionEstado.RESTRINGIDO && selectedMember.admision_motivo && canSeePastoralSecrets && (
                                                                        <p className="text-xs text-red-500 mt-1 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                                                                            Motivo: {selectedMember.admision_motivo}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Graduación */}
                                                        <div>
                                                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wide opacity-70 mb-1 block">Estado de Graduación</label>
                                                            {isEditingData ? (
                                                                <div className="space-y-2">
                                                                    <select
                                                                        value={editFormData.graduacion_estado || GraduacionEstado.NINGUNO}
                                                                        onChange={e => setEditFormData({ ...editFormData, graduacion_estado: e.target.value as GraduacionEstado })}
                                                                        className="w-full p-2.5 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-800"
                                                                    >
                                                                        {Object.values(GraduacionEstado).map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                </div>
                                                            ) : (
                                                                <span className={`px-3 py-1.5 rounded-lg text-sm font-bold border ${selectedMember.graduacion_estado === GraduacionEstado.GRADUADO ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                                                                    {selectedMember.graduacion_estado || 'NINGUNO'}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 space-y-4">
                                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Wrench className="w-4 h-4" /> Habilidades y Talentos
                                            </h4>

                                            {isEditingData ? (
                                                <div className="space-y-4">
                                                    <div className="flex gap-2">
                                                        <input
                                                            className="flex-1 bg-slate-50 p-3 rounded-xl text-sm border-2 border-slate-200 outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium"
                                                            placeholder="Ej. Guitarra, Diseño Gráfico..."
                                                            value={newSkill}
                                                            onChange={e => setNewSkill(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && handleAddSkill()}
                                                        />
                                                        <button onClick={handleAddSkill} className="bg-slate-900 text-white px-5 rounded-xl text-sm font-bold hover:bg-black transition-colors">Agregar</button>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {(editFormData.habilidades || []).map(skill => (
                                                            <span key={skill} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 border border-blue-100 animate-fadeIn">
                                                                {skill}
                                                                <button onClick={() => handleRemoveSkill(skill)} className="hover:text-red-500 p-0.5 rounded-md hover:bg-blue-100 transition-colors"><X className="w-3.5 h-3.5" /></button>
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {(selectedMember.habilidades && selectedMember.habilidades.length > 0) ? (
                                                        selectedMember.habilidades.map(skill => (
                                                            <span key={skill} className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-200">
                                                                {skill}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <p className="text-sm text-slate-400 italic font-medium px-2">No hay habilidades registradas.</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {canSeeSensitive && !isEditingData && (
                                            <div className="pt-6 border-t border-slate-200/50">
                                                <button
                                                    onClick={() => setMemberToDelete(selectedMember.id)}
                                                    className="w-full py-4 bg-white text-red-500 font-bold rounded-2xl hover:bg-red-50 border-2 border-red-50 hover:border-red-100 transition-all flex justify-center items-center gap-2 shadow-sm"
                                                >
                                                    <Trash2 className="w-4 h-4" /> Eliminar Ficha de Miembro
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'FORMACION' && (
                                    <div className="space-y-6">
                                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-center mb-6">
                                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">7 Cursos Básicos</h4>
                                                <span className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 border border-slate-200">
                                                    {selectedMember.coursesCompletedIds.filter(id => courses.find(c => c.id === id)?.type === 'BASICO').length} / 7 Completados
                                                </span>
                                            </div>
                                            <div className="space-y-3">
                                                {courses.filter(c => c.type === 'BASICO').sort((a, b) => a.orden - b.orden).map(course => {
                                                    const isCompleted = selectedMember.coursesCompletedIds.includes(course.id);
                                                    return (
                                                        <div
                                                            key={course.id}
                                                            onClick={() => {
                                                                if (!canEdit) return;
                                                                const newIds = isCompleted
                                                                    ? selectedMember.coursesCompletedIds.filter(id => id !== course.id)
                                                                    : [...selectedMember.coursesCompletedIds, course.id];

                                                                const basics = courses.filter(c => c.type === 'BASICO');
                                                                const doneCount = newIds.filter(id => basics.find(b => b.id === id)).length;

                                                                updateMember(selectedMember.id, {
                                                                    coursesCompletedIds: newIds,
                                                                    completed_basicos: doneCount === 7
                                                                });
                                                                setSelectedMember({ ...selectedMember, coursesCompletedIds: newIds, completed_basicos: doneCount === 7 } as any);
                                                            }}
                                                            className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all group ${canEdit ? 'cursor-pointer' : 'cursor-default'
                                                                } ${isCompleted
                                                                    ? 'bg-emerald-50 border-emerald-100'
                                                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${isCompleted ? 'bg-white border-emerald-200 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                                                    {course.orden}
                                                                </div>
                                                                <span className={`text-sm font-bold ${isCompleted ? 'text-emerald-900' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                                                    {course.nombre}
                                                                </span>
                                                            </div>
                                                            {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                                                            {!isCompleted && canEdit && <div className="w-5 h-5 rounded-full border-2 border-slate-200 group-hover:border-slate-300"></div>}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-slate-900 to-black p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -translate-y-10 translate-x-10 pointer-events-none"></div>
                                            <div className="relative z-10">
                                                <h4 className="text-xl font-bold mb-2 flex items-center gap-3"><Award className="w-6 h-6 text-yellow-400" /> Estatus EPMI</h4>
                                                <p className="text-slate-400 text-sm mb-6 font-medium">Escuela de Preparación Ministerial Internacional</p>

                                                {epmiStatus ? (
                                                    <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-bold text-yellow-300 text-lg">{epmiStatus.cycle.replace('_', ' ')}</span>
                                                            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-lg text-white">{epmiStatus.status}</span>
                                                        </div>
                                                    </div>
                                                ) : selectedMember.completed_basicos ? (
                                                    selectedMember.candidate_epmi ? (
                                                        <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
                                                            <p className="font-bold text-emerald-400 text-lg">Candidato Aprobado</p>
                                                            <p className="text-sm mt-1 text-slate-300 font-medium">Listo para inscripción en Ciclo I.</p>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                                            <p className="font-bold text-yellow-300 text-lg">Pre-Requisitos Completos</p>
                                                            <p className="text-sm mt-1 text-slate-400 font-medium">El sistema lo sugerirá al Pastor Automáticamente.</p>
                                                        </div>
                                                    )
                                                ) : (
                                                    <div className="bg-white/5 p-5 rounded-2xl border border-white/5 opacity-50">
                                                        <p className="font-bold text-sm flex items-center gap-2 text-slate-300">No Elegible Aún</p>
                                                        <p className="text-xs mt-1 text-slate-500">Debe completar los 7 cursos básicos.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'MINISTERIOS' && (
                                    <div className="text-center py-20 bg-white rounded-[2rem] border border-slate-200 shadow-sm">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Shield className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-800 mb-2">Participación Ministerial</h4>
                                        <p className="text-slate-400 font-medium max-w-xs mx-auto mb-8">Gestión detallada disponible en la sección principal de "Ministerios".</p>

                                        <div className="flex flex-wrap gap-3 justify-center px-6">
                                            {selectedMember.ministryIds.length > 0 ? (
                                                selectedMember.ministryIds.map(minId => (
                                                    <span key={minId} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-sm font-bold border border-blue-100 flex items-center gap-2">
                                                        <Briefcase className="w-4 h-4 opacity-50" />
                                                        {minId} ({selectedMember.ministryRoles?.[minId] || 'Miembro'})
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 font-medium text-sm bg-slate-50 px-4 py-2 rounded-xl">Sin ministerios activos</span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'HISTORIAL' && (
                                    <div className="space-y-6">
                                        {canSeeSensitive && (
                                            <button
                                                onClick={() => setIsNoteOpen(true)}
                                                className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-500 font-bold rounded-2xl hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center justify-center gap-2"
                                            >
                                                <Plus className="w-5 h-5" /> Agregar Nota Pastoral
                                            </button>
                                        )}

                                        <div className="space-y-4">
                                            {getMemberHistory(selectedMember.id).map((item, idx) => (
                                                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex gap-5 items-start">
                                                    <div className={`p-3.5 rounded-2xl h-fit shrink-0 ${item.tipo === 'VIAJE' ? 'bg-sky-50 text-sky-600' :
                                                        item.tipo === 'NOTA' ? 'bg-amber-50 text-amber-600' :
                                                            item.tipo === 'CAMBIO_ESTATUS' ? 'bg-violet-50 text-violet-600' :
                                                                'bg-slate-50 text-slate-600'
                                                        }`}>
                                                        {item.tipo === 'VIAJE' ? <Plane className="w-5 h-5" /> :
                                                            item.tipo === 'CAMBIO_ESTATUS' ? <RefreshCw className="w-5 h-5" /> :
                                                                <StickyNote className="w-5 h-5" />}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{item.fecha}</span>
                                                        <h4 className="font-bold text-slate-800 text-base mt-0.5">{item.titulo}</h4>
                                                        <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">{item.detalle}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {getMemberHistory(selectedMember.id).length === 0 && (
                                            <div className="text-center py-12">
                                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <StickyNote className="w-6 h-6 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-medium">Sin historial registrado.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        {isEditingData && (
                            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 flex gap-4 no-print z-30 shadow-2xl">
                                <button
                                    onClick={() => setIsEditingData(false)}
                                    className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSaveData}
                                    className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
                                >
                                    <Save className="w-5 h-5" /> Guardar Cambios
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 transform transition-all border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-slate-900">Nuevo Miembro</h3>
                            <button onClick={() => setIsCreateOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {createStep === 'DNI' ? (
                            <div className="space-y-5">
                                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                    <h4 className="font-bold text-blue-900 text-sm mb-1">Paso 1: Validación de Identidad</h4>
                                    <p className="text-xs text-blue-700">Ingrese el DNI o Identificación para verificar si el miembro ya existe.</p>
                                </div>
                                <input
                                    value={newMemberDni}
                                    onChange={e => setNewMemberDni(e.target.value)}
                                    placeholder="DNI / Identificación"
                                    className="w-full p-4 bg-slate-50 rounded-xl text-xl font-bold tracking-widest text-center border-2 border-transparent focus:border-blue-500 focus:bg-white transition-all outline-none"
                                />
                                {memberDuplicateFound && (
                                    <div className="bg-orange-50 p-5 rounded-xl border border-orange-200 animate-fadeIn">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                                            <p className="text-orange-900 font-bold">¡Miembro Encontrado!</p>
                                        </div>
                                        <p className="text-sm text-orange-800 font-medium mb-1">{memberDuplicateFound.nombres}</p>
                                        <p className="text-xs text-orange-700 mb-4">Sede Actual: {anexos.find(a => a.id === memberDuplicateFound.anexoId)?.nombre || 'Sin Sede'}</p>
                                        <button onClick={() => handleTransferMember(memberDuplicateFound.id)} className="w-full py-3 bg-orange-200 text-orange-900 font-bold rounded-xl hover:bg-orange-300 transition-colors shadow-sm">
                                            🔄 Transferir a esta Sede
                                        </button>
                                    </div>
                                )}
                                <button onClick={checkDniAndProceed} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg active:scale-[0.98]">
                                    Verificar DNI
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateMember} className="space-y-5 animate-fadeIn">
                                <div className="bg-emerald-50 p-3 rounded-lg text-emerald-700 text-sm font-bold text-center border border-emerald-100 flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> DNI Validado: {newMemberDni}
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide mb-1 block">Nombre Completo</label>
                                    <input
                                        value={newMemberName}
                                        onChange={e => setNewMemberName(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold text-slate-800 outline-none transition-all placeholder:font-normal"
                                        placeholder="Nombres y Apellidos"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide mb-1 block">Teléfono (WhatsApp)</label>
                                    <input
                                        value={newMemberPhone}
                                        onChange={e => setNewMemberPhone(e.target.value)}
                                        className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white font-medium text-slate-800 outline-none transition-all placeholder:font-normal"
                                        placeholder="+51 999..."
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide mb-1 block">Género</label>
                                        <select
                                            value={newMemberSex}
                                            onChange={e => setNewMemberSex(e.target.value as 'M' | 'F')}
                                            className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white font-medium text-slate-700 outline-none transition-all"
                                        >
                                            <option value="M">Masculino</option>
                                            <option value="F">Femenino</option>
                                        </select>
                                    </div>
                                    {currentUser.role === 'PASTOR_PRINCIPAL' && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide mb-1 block">Sede Asignada</label>
                                            <select
                                                value={newMemberAnexo}
                                                onChange={e => setNewMemberAnexo(e.target.value)}
                                                className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white font-medium text-slate-700 outline-none transition-all"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                            </select>
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:bg-blue-700 active:scale-[0.98] transition-all cursor-pointer">
                                    Registrar Miembro
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {isNoteOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Nota Pastoral</h3>
                            <button onClick={() => setIsNoteOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
                        </div>
                        <textarea
                            className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white text-slate-700 h-40 resize-none font-medium outline-none transition-all"
                            placeholder="Escriba la observación confidencial para el historial del miembro..."
                            value={newNoteContent}
                            onChange={e => setNewNoteContent(e.target.value)}
                        />
                        <button onClick={handleAddNote} className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold mt-4 hover:bg-black transition-colors shadow-lg active:scale-[0.98]">Guardar Nota</button>
                    </div>
                </div>
            )}

            {isStatusModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Cambio de Estatus</h3>
                            <button onClick={() => setIsStatusModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide mb-1 block">Nuevo Estatus Espiritual</label>
                                <select
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold text-slate-800 outline-none transition-all"
                                    value={newStatus}
                                    onChange={e => setNewStatus(e.target.value as SpiritualStatus)}
                                >
                                    {Object.values(SpiritualStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase ml-1 tracking-wide mb-1 block">Justificación Pastoral (Requerido)</label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white h-24 resize-none font-medium outline-none transition-all"
                                    placeholder="Describa brevemente la razón del cambio..."
                                    value={statusReason}
                                    onChange={e => setStatusReason(e.target.value)}
                                />
                            </div>

                            <div className="bg-amber-50 p-4 rounded-xl flex items-start gap-3 border border-amber-100">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs font-medium text-amber-800 leading-relaxed">
                                    Este cambio quedará registrado de forma inmutable en el historial del miembro y la auditoría del sistema.
                                </p>
                            </div>

                            <button
                                onClick={handleStatusChange}
                                disabled={!statusReason}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold mt-2 hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-[0.98]"
                            >
                                Confirmar Cambio
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isPhotoOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative border border-white/20">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Actualizar Foto</h3>
                            <button onClick={() => setIsPhotoOpen(false)} className="p-2 rounded-full hover:bg-slate-100 text-slate-500"><X className="w-5 h-5" /></button>
                        </div>

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-2xl p-8 mb-6 text-center cursor-pointer hover:bg-blue-50 hover:border-blue-400 transition-colors group"
                        >
                            {newPhotoUrl ? (
                                <div className="relative inline-block">
                                    <img src={newPhotoUrl} className="w-32 h-32 rounded-full mx-auto object-cover ring-4 ring-white shadow-md group-hover:opacity-50 transition-opacity" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-slate-400 group-hover:text-blue-500 transition-colors">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 group-hover:bg-white group-hover:border-blue-200">
                                        {isUploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : <UploadCloud className="w-8 h-8" />}
                                    </div>
                                    <span className="text-sm font-bold">{isUploading ? 'Procesando...' : 'Subir foto'}</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        </div>

                        <div className="flex items-center gap-2 my-4">
                            <div className="h-px bg-slate-200 flex-1"></div>
                            <span className="text-xs font-bold text-slate-400 uppercase">O pegar URL</span>
                            <div className="h-px bg-slate-200 flex-1"></div>
                        </div>

                        <input
                            className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-transparent focus:border-blue-500 focus:bg-white text-sm font-medium mb-4 outline-none transition-all"
                            placeholder="https://..."
                            value={newPhotoUrl}
                            onChange={e => setNewPhotoUrl(e.target.value)}
                        />
                        <button
                            onClick={handleUpdatePhoto}
                            disabled={!newPhotoUrl}
                            className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg active:scale-[0.98]"
                        >
                            Guardar Foto
                        </button>
                    </div>
                </div>
            )}

            {memberToDelete && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 text-center border border-white/20">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border border-red-100 shadow-inner">
                            <AlertTriangle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">¿Eliminar Ficha?</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium">
                            Se borrará todo el historial y registros. Esta acción es irreversible.
                        </p>
                        <div className="flex gap-4 justify-center">
                            <button onClick={() => setMemberToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors border border-slate-200">Cancelar</button>
                            <button onClick={confirmDeleteMember} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-xl shadow-red-500/20 transition-colors">Sí, Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

            {isBatchModalOpen && <BatchFidelityModal onClose={() => setIsBatchModalOpen(false)} />}
        </div>
    );
};

export default Members;
