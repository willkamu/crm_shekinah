
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { Ministry, Member } from '../types';
import { ShieldCheck, Plus, Edit2, Trash2, Users, ChevronRight, UserPlus, XCircle, Search, X, Check, Save, AlertTriangle, Copy, CheckCircle, Lock, Crown } from 'lucide-react';

const Ministries: React.FC = () => {
    const { ministries, addMinistry, updateMinistry, deleteMinistry, members, assignMinistryRole, currentUser, notify } = useApp();

    // Modals State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isGroupOpen, setIsGroupOpen] = useState(false);

    // Leader Assign Modal
    const [isLeaderAssignOpen, setIsLeaderAssignOpen] = useState(false);
    const [targetMinistryId, setTargetMinistryId] = useState<string | null>(null);

    // Confirmation State
    const [ministryToDelete, setMinistryToDelete] = useState<string | null>(null);

    // Form Data
    const [newMinName, setNewMinName] = useState('');
    const [activeMinistryId, setActiveMinistryId] = useState<string | null>(null);

    // Assign Logic
    const [searchMemberTerm, setSearchMemberTerm] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
    const [roleName, setRoleName] = useState('Miembro');

    // Group Logic
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDay, setNewGroupDay] = useState('');

    // Editing Title Logic
    const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
    const [tempTitle, setTempTitle] = useState('');

    // --- SECURITY LOGIC (PDF 8.5 & 11.5) ---
    const isGlobalAdmin = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'MINISTRO'].includes(currentUser.role);

    // Check if current user is the specific leader of a ministry
    const isLeaderOf = (ministry: Ministry) => {
        if (isGlobalAdmin) return true; // Admins are leaders of everything
        return ministry.liderId === currentUser.memberId;
    };

    // --- HANDLERS ---
    const handleAddMinistry = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMinName) {
            addMinistry({
                id: `MIN-${Date.now()}`,
                nombre: newMinName,
                liderId: '', // Initially empty, assigned later
                grupos: [],
                tipo: 'GENERAL'
            });
            setIsCreateOpen(false);
            setNewMinName('');
        }
    };

    const handleAddGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName || !activeMinistryId) return;

        const ministry = ministries.find(m => m.id === activeMinistryId);
        if (ministry) {
            const newGroup = { id: `GRP-${Date.now()}`, nombre: newGroupName, diaReunion: newGroupDay || 'TBD' };
            updateMinistry(activeMinistryId, { grupos: [...ministry.grupos, newGroup] });
            setIsGroupOpen(false);
            setNewGroupName('');
            setNewGroupDay('');
        }
    };

    const handleAssignMember = () => {
        if (selectedMemberId && activeMinistryId && roleName) {
            assignMinistryRole(selectedMemberId, activeMinistryId, roleName);
            setIsAssignOpen(false);
            setSelectedMemberId(null);
            setRoleName('Miembro');
            setSearchMemberTerm('');
        }
    };

    const saveTitleEdit = (id: string) => {
        if (tempTitle.trim()) {
            updateMinistry(id, { nombre: tempTitle });
        }
        setEditingTitleId(null);
    };

    const confirmDelete = () => {
        if (ministryToDelete) {
            deleteMinistry(ministryToDelete);
            setMinistryToDelete(null);
        }
    };

    const handleCopyContacts = (minId: string) => {
        const team = getMinistryMembers(minId);
        const phones = team
            .filter(m => m.telefono)
            .map(m => `${m.nombres}: ${m.telefono}`)
            .join('\n');

        if (phones) {
            navigator.clipboard.writeText(phones);
            notify("Lista de contactos copiada al portapapeles", "success");
        } else {
            notify("No hay teléfonos registrados en este equipo", "error");
        }
    };

    const handleConfirmLeaderAssign = () => {
        if (targetMinistryId && selectedMemberId) {
            updateMinistry(targetMinistryId, { liderId: selectedMemberId });
            setIsLeaderAssignOpen(false);
            setTargetMinistryId(null);
            setSelectedMemberId(null);
            notify("Líder de ministerio actualizado");
        }
    };

    // Get members of a ministry
    const getMinistryMembers = (minId: string) => members.filter(m => m.ministryIds.includes(minId));

    // Search filter for assignment
    const filteredMembers = members.filter(m =>
        m.nombres.toLowerCase().includes(searchMemberTerm.toLowerCase()) &&
        (!activeMinistryId || !m.ministryIds.includes(activeMinistryId))
    );

    const filteredMembersForLeader = members.filter(m =>
        m.nombres.toLowerCase().includes(searchMemberTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">Ministerios</h2>
                    <p className="text-base text-slate-500 font-medium mt-1">Gestión de Equipos de Servicio y Células</p>
                </div>

                {/* Only Global Admin can CREATE new Ministries */}
                {isGlobalAdmin && (
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center gap-2 bg-blue-50 text-blue-700 px-6 py-3 rounded-xl border-2 border-blue-600 font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Ministerio</span>
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ministries.map((min) => {
                    const team = getMinistryMembers(min.id);
                    const isEditing = editingTitleId === min.id;
                    const canManageThis = isLeaderOf(min);
                    const leaderName = members.find(m => m.id === min.liderId)?.nombres || 'Sin Asignar';

                    return (
                        <div key={min.id} className="bg-white rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative group flex flex-col overflow-hidden">

                            {/* Permission Badge */}
                            {!canManageThis && (
                                <div className="absolute top-4 right-4 z-10">
                                    <div className="bg-slate-100 p-1.5 rounded-full opacity-60">
                                        <Lock className="w-4 h-4 text-slate-500" />
                                    </div>
                                </div>
                            )}

                            {/* Card Header */}
                            <div className="p-6 bg-gradient-to-b from-slate-50 to-white border-b border-slate-100 flex justify-between items-start relative overflow-hidden">
                                <div className="flex items-center gap-4 flex-1 z-10">
                                    <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 min-w-0 mr-6">
                                        {isEditing ? (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    value={tempTitle}
                                                    onChange={e => setTempTitle(e.target.value)}
                                                    className="w-full bg-white border-2 border-blue-500 rounded-lg px-2 py-1 text-base font-bold outline-none"
                                                    autoFocus
                                                    onKeyDown={e => e.key === 'Enter' && saveTitleEdit(min.id)}
                                                />
                                                <button onClick={() => saveTitleEdit(min.id)} className="cursor-pointer"><Save className="w-5 h-5 text-blue-600 hover:scale-110 transition-transform" /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <h3 className="font-bold text-slate-800 text-lg leading-tight truncate mb-1" title={min.nombre}>{min.nombre}</h3>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors">
                                                    {team.length} {team.length === 1 ? 'Miembro' : 'Miembros'}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Only Admins can rename or delete the Structure */}
                                {isGlobalAdmin && (
                                    <div className="flex gap-2 absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all z-20 bg-white/90 backdrop-blur-sm p-1 rounded-lg shadow-sm">
                                        {!isEditing && (
                                            <button
                                                onClick={() => { setEditingTitleId(min.id); setTempTitle(min.nombre); }}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setMinistryToDelete(min.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Leader Info */}
                            <div className="px-6 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <span className="font-bold uppercase tracking-wider text-slate-400">Líder:</span>
                                    <span className="font-bold truncate max-w-[140px]">{leaderName}</span>
                                </div>
                                {isGlobalAdmin && (
                                    <button
                                        onClick={() => {
                                            setTargetMinistryId(min.id);
                                            setSearchMemberTerm('');
                                            setSelectedMemberId(null);
                                            setIsLeaderAssignOpen(true);
                                        }}
                                        className="font-bold text-blue-600 hover:text-blue-800 hover:underline decoration-2 underline-offset-2 transition-all cursor-pointer"
                                    >
                                        Cambiar
                                    </button>
                                )}
                            </div>

                            {/* Groups & Roles List */}
                            <div className="flex-1 bg-white p-6 space-y-6">

                                {/* Team Section */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" /> Equipo
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleCopyContacts(min.id)}
                                                className="text-slate-400 hover:text-blue-600 p-1 rounded-md transition-colors cursor-pointer"
                                                title="Copiar teléfonos"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>

                                            {/* Only Assigned Leader or Admin can ADD members */}
                                            {canManageThis && (
                                                <button
                                                    onClick={() => { setActiveMinistryId(min.id); setIsAssignOpen(true); }}
                                                    className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                                    title="Agregar miembro"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                    <span>Agregar</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                        {team.map(m => (
                                            <div key={m.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all group/item">
                                                <div className="flex items-center gap-3">
                                                    <img src={m.photoUrl} className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100" />
                                                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[110px] sm:max-w-[130px]">{m.nombres}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">{m.ministryRoles?.[min.id] || 'Miembro'}</span>
                                                    {canManageThis && (
                                                        <button className="text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity p-0.5 cursor-pointer">
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {team.length === 0 && (
                                            <div className="py-4 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                                <p className="text-xs text-slate-400 italic">Sin miembros asignados</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Groups Section */}
                                <div className="space-y-3 pt-4 border-t border-slate-50">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Users className="w-3.5 h-3.5" /> Grupos
                                        </h4>
                                        {canManageThis && (
                                            <button
                                                onClick={() => { setActiveMinistryId(min.id); setIsGroupOpen(true); }}
                                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                <span>Crear</span>
                                            </button>
                                        )}
                                    </div>

                                    {(min.grupos || []).length > 0 ? (
                                        <div className="space-y-2">
                                            {min.grupos.map(group => (
                                                <div key={group.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 group/gitem hover:border-blue-200 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-200"></div>
                                                        <div>
                                                            <p className="font-bold text-xs text-slate-700">{group.nombre}</p>
                                                            <p className="text-[10px] text-slate-400 font-medium">{group.diaReunion}</p>
                                                        </div>
                                                    </div>
                                                    {canManageThis && (
                                                        <button
                                                            onClick={() => {
                                                                const newGroups = min.grupos.filter(g => g.id !== group.id);
                                                                updateMinistry(min.id, { grupos: newGroups });
                                                            }}
                                                            className="text-slate-300 hover:text-red-500 opacity-0 group-hover/gitem:opacity-100 transition-opacity p-1 cursor-pointer"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-2 text-center">
                                            <p className="text-xs text-slate-300 italic">No hay grupos activos</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* CREATE MINISTRY MODAL */}
            {isCreateOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative border border-white/60">
                        <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">Nuevo Ministerio</h3>
                        <form onSubmit={handleAddMinistry} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600 ml-1">Nombre</label>
                                <input
                                    className="w-full px-5 py-4 bg-slate-50 rounded-xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:bg-white font-bold text-slate-800 transition-all placeholder:text-slate-300"
                                    placeholder="Ej. Ujieres"
                                    value={newMinName}
                                    onChange={e => setNewMinName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all active:scale-[0.98] cursor-pointer">
                                Crear Ministerio
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN LEADER MODAL (NEW) */}
            {isLeaderAssignOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative h-[70vh] flex flex-col border border-white/60">
                        <button onClick={() => setIsLeaderAssignOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Asignar Líder</h3>
                        <p className="text-sm text-slate-500 font-medium mb-6">Seleccione al nuevo responsable del ministerio.</p>

                        <div className="relative mb-4">
                            <input
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                                placeholder="Buscar miembro..."
                                value={searchMemberTerm}
                                onChange={e => setSearchMemberTerm(e.target.value)}
                                autoFocus
                            />
                            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
                            {filteredMembersForLeader.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMemberId(m.id)}
                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedMemberId === m.id ? 'bg-blue-50 border-blue-600' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                >
                                    <img src={m.photoUrl} className="w-12 h-12 rounded-full bg-slate-200 object-cover ring-2 ring-white shadow-sm" />
                                    <div className="flex-1">
                                        <p className={`font-bold text-base ${selectedMemberId === m.id ? 'text-blue-900' : 'text-slate-700'}`}>{m.nombres}</p>
                                        <p className="text-xs text-slate-400 font-medium">{m.cargo}</p>
                                    </div>
                                    {selectedMemberId === m.id && <Check className="w-6 h-6 text-blue-600 ml-auto" />}
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={handleConfirmLeaderAssign}
                            disabled={!selectedMemberId}
                            className="w-full py-4 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all disabled:opacity-50 shadow-xl flex justify-center items-center gap-2 active:scale-[0.98] cursor-pointer"
                        >
                            <Crown className="w-5 h-5 text-yellow-400" /> Confirmar Líder
                        </button>
                    </div>
                </div>
            )}

            {/* CREATE GROUP MODAL */}
            {isGroupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative border border-white/60">
                        <button onClick={() => setIsGroupOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">Nuevo Grupo/Célula</h3>
                        <form onSubmit={handleAddGroup} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Nombre del Grupo</label>
                                <input
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:bg-white font-bold text-slate-700 transition-all"
                                    placeholder="Ej. Célula Norte"
                                    value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Horario</label>
                                <input
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:bg-white font-medium text-slate-700 transition-all"
                                    placeholder="Ej. Vie 7pm"
                                    value={newGroupDay}
                                    onChange={e => setNewGroupDay(e.target.value)}
                                />
                            </div>
                            <button type="submit" className="w-full py-4 mt-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg active:scale-[0.98] cursor-pointer">
                                Agregar Grupo
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ASSIGN MEMBER MODAL */}
            {isAssignOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative h-[80vh] flex flex-col border border-white/60">
                        <button onClick={() => setIsAssignOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-400 transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
                        <h3 className="text-2xl font-extrabold text-slate-800 mb-6 tracking-tight">Asignar Miembro</h3>

                        {/* Search */}
                        <div className="relative mb-6">
                            <input
                                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 rounded-xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                                placeholder="Buscar persona..."
                                value={searchMemberTerm}
                                onChange={e => setSearchMemberTerm(e.target.value)}
                                autoFocus
                            />
                            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-2 mb-6 pr-2 custom-scrollbar">
                            {filteredMembers.map(m => (
                                <div
                                    key={m.id}
                                    onClick={() => setSelectedMemberId(m.id)}
                                    className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border-2 ${selectedMemberId === m.id ? 'bg-blue-50 border-blue-600' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                >
                                    <img src={m.photoUrl} className="w-12 h-12 rounded-full bg-slate-200 object-cover ring-2 ring-white shadow-sm" />
                                    <div>
                                        <p className={`font-bold text-base ${selectedMemberId === m.id ? 'text-blue-900' : 'text-slate-700'}`}>{m.nombres}</p>
                                        <p className="text-xs text-slate-400 font-medium">Anexo: {currentUser.role === 'PASTOR_PRINCIPAL' ? m.anexoId : 'Local'}</p>
                                    </div>
                                    {selectedMemberId === m.id && <Check className="w-6 h-6 text-blue-600 ml-auto" />}
                                </div>
                            ))}
                        </div>

                        {/* Role Input & Action */}
                        <div className="pt-6 border-t border-slate-100 space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 block tracking-wider">Rol Específico</label>
                                <input
                                    className="w-full px-5 py-3.5 bg-slate-50 rounded-xl border-2 border-slate-100 outline-none focus:border-blue-500 focus:bg-white font-medium text-slate-700 transition-all"
                                    value={roleName}
                                    onChange={e => setRoleName(e.target.value)}
                                    placeholder="Ej. Guitarrista, Ujier"
                                />
                            </div>
                            <button
                                onClick={handleAssignMember}
                                disabled={!selectedMemberId}
                                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 active:scale-[0.98] cursor-pointer"
                            >
                                Confirmar Asignación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {ministryToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/60 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 animate-pulse">
                            <AlertTriangle className="w-10 h-10" />
                        </div>
                        <h3 className="text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">¿Eliminar Ministerio?</h3>
                        <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed">
                            Esta acción eliminará el ministerio y sus grupos. Los miembros serán desvinculados de este servicio.
                        </p>
                        <div className="flex gap-4">
                            <button onClick={() => setMinistryToDelete(null)} className="flex-1 py-3.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer">Cancelar</button>
                            <button onClick={confirmDelete} className="flex-1 py-3.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-xl shadow-red-200 transition-all active:scale-[0.98] cursor-pointer">Eliminar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Ministries;
