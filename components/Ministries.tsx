
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { Ministry, Member } from '../types';
import { ShieldCheck, Plus, Edit2, Trash2, Users, ChevronRight, UserPlus, XCircle, Search, X, Check, Save, AlertTriangle, Copy, CheckCircle, Lock } from 'lucide-react';

const Ministries: React.FC = () => {
  const { ministries, addMinistry, updateMinistry, deleteMinistry, members, assignMinistryRole, currentUser, notify } = useApp();
  
  // Modals State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isGroupOpen, setIsGroupOpen] = useState(false);
  
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
  const isGlobalAdmin = currentUser.role === 'PASTOR_PRINCIPAL' || currentUser.role === 'MINISTRO';

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

  const handleAssignLeader = (minId: string, memberId: string) => {
      updateMinistry(minId, { liderId: memberId });
      notify("Líder de ministerio actualizado");
  };

  // Get members of a ministry
  const getMinistryMembers = (minId: string) => members.filter(m => m.ministryIds.includes(minId));

  // Search filter for assignment
  const filteredMembers = members.filter(m => 
      m.nombres.toLowerCase().includes(searchMemberTerm.toLowerCase()) &&
      (!activeMinistryId || !m.ministryIds.includes(activeMinistryId))
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Ministerios</h2>
          <p className="text-sm text-slate-500 font-medium">Equipos de servicio y Células</p>
        </div>
        
        {/* Only Global Admin can CREATE new Ministries */}
        {isGlobalAdmin && (
            <button 
                onClick={() => setIsCreateOpen(true)} 
                className="bg-brand-blue text-white w-12 h-12 rounded-2xl flex items-center justify-center shadow-glow hover:bg-brand-dark transition-all btn-hover"
            >
                <Plus className="w-6 h-6" />
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {ministries.map((min) => {
            const team = getMinistryMembers(min.id);
            const isEditing = editingTitleId === min.id;
            const canManageThis = isLeaderOf(min);
            const leaderName = members.find(m => m.id === min.liderId)?.nombres || 'Sin Asignar';

            return (
                <div key={min.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-card overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 relative group">
                    
                    {/* Permission Badge */}
                    {!canManageThis && (
                        <div className="absolute top-4 right-4 z-10 opacity-50">
                            <Lock className="w-4 h-4 text-slate-400" />
                        </div>
                    )}

                    {/* Card Header */}
                    <div className="p-6 bg-gradient-to-br from-[#f8fafc] to-white border-b border-slate-50 flex justify-between items-start">
                        <div className="flex items-center gap-4 flex-1">
                            <div className="p-3 bg-brand-soft text-brand-blue rounded-2xl shadow-sm">
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0 mr-2">
                                {isEditing ? (
                                    <div className="flex items-center gap-2">
                                        <input 
                                            value={tempTitle}
                                            onChange={e => setTempTitle(e.target.value)}
                                            className="w-full bg-white border border-brand-blue rounded px-2 py-1 text-sm font-bold outline-none"
                                            autoFocus
                                            onKeyDown={e => e.key === 'Enter' && saveTitleEdit(min.id)}
                                        />
                                        <button onClick={() => saveTitleEdit(min.id)}><Save className="w-4 h-4 text-brand-blue"/></button>
                                    </div>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-slate-800 text-lg leading-tight truncate">{min.nombre}</h3>
                                        <span className="text-xs text-brand-dark font-bold uppercase tracking-wider">{team.length} Miembros</span>
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Only Admins can rename or delete the Structure */}
                        {isGlobalAdmin && (
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!isEditing && (
                                    <button 
                                        onClick={() => { setEditingTitleId(min.id); setTempTitle(min.nombre); }} 
                                        className="p-2 text-slate-300 hover:text-brand-blue hover:bg-brand-soft rounded-xl transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4"/>
                                    </button>
                                )}
                                <button 
                                    onClick={() => setMinistryToDelete(min.id)} 
                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Leader Info */}
                    <div className="px-6 py-2 bg-slate-50/50 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Líder:</span>
                            <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{leaderName}</span>
                        </div>
                        {isGlobalAdmin && (
                            <button 
                                onClick={() => { 
                                    const newLeader = prompt("Ingrese ID del nuevo líder (simulado - usar selector en v2)"); 
                                    if(newLeader) handleAssignLeader(min.id, newLeader); // Simplified for now, should use modal
                                }}
                                className="text-[10px] text-brand-blue hover:underline"
                            >
                                Cambiar
                            </button>
                        )}
                    </div>

                    {/* Groups & Roles List */}
                    <div className="p-6 flex-1 bg-white space-y-6">
                        
                        {/* Team Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo / Roles</h4>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => handleCopyContacts(min.id)}
                                        className="text-slate-400 hover:text-brand-blue hover:bg-brand-soft p-1.5 rounded-lg transition-colors"
                                        title="Copiar teléfonos"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Only Assigned Leader or Admin can ADD members */}
                                    {canManageThis && (
                                        <button 
                                            onClick={() => { setActiveMinistryId(min.id); setIsAssignOpen(true); }}
                                            className="text-brand-blue hover:bg-brand-soft p-1.5 rounded-lg transition-colors"
                                            title="Agregar miembro"
                                        >
                                            <UserPlus className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                {team.map(m => (
                                    <div key={m.id} className="flex items-center justify-between text-sm group">
                                        <div className="flex items-center gap-2">
                                            <img src={m.photoUrl} className="w-6 h-6 rounded-full" />
                                            <span className="font-bold text-slate-700 truncate max-w-[100px]">{m.nombres}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">{m.ministryRoles?.[min.id] || 'Miembro'}</span>
                                            {canManageThis && (
                                                <button className="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {team.length === 0 && <p className="text-xs text-slate-300 italic">Sin miembros asignados</p>}
                            </div>
                        </div>

                        {/* Groups Section */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Células / Grupos</h4>
                                {canManageThis && (
                                    <button 
                                        onClick={() => { setActiveMinistryId(min.id); setIsGroupOpen(true); }}
                                        className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-bold hover:bg-slate-200 transition-colors"
                                    >
                                        + Crear
                                    </button>
                                )}
                            </div>
                            
                            {(min.grupos || []).length > 0 ? (
                                <div className="space-y-2">
                                    {min.grupos.map(group => (
                                        <div key={group.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50/50 border border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-brand-blue"></div>
                                                <div>
                                                    <p className="font-bold text-xs text-slate-700">{group.nombre}</p>
                                                    <p className="text-[10px] text-slate-400">{group.diaReunion}</p>
                                                </div>
                                            </div>
                                            {canManageThis && (
                                                <button 
                                                    onClick={() => {
                                                        const newGroups = min.grupos.filter(g => g.id !== group.id);
                                                        updateMinistry(min.id, { grupos: newGroups });
                                                    }}
                                                    className="text-slate-300 hover:text-red-400"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-300 italic">No hay grupos activos</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* CREATE MINISTRY MODAL */}
      {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Nuevo Ministerio</h3>
                  <form onSubmit={handleAddMinistry} className="space-y-4">
                      <input 
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" 
                        placeholder="Nombre (ej. Ujieres)"
                        value={newMinName}
                        onChange={e => setNewMinName(e.target.value)}
                        autoFocus
                      />
                      <button type="submit" className="w-full py-3 bg-brand-blue text-white rounded-2xl font-bold hover:bg-brand-dark transition-colors shadow-glow">Crear</button>
                  </form>
              </div>
          </div>
      )}

      {/* CREATE GROUP MODAL */}
      {isGroupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsGroupOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Nuevo Grupo/Célula</h3>
                  <form onSubmit={handleAddGroup} className="space-y-4">
                      <input 
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" 
                        placeholder="Nombre (ej. Célula Norte)"
                        value={newGroupName}
                        onChange={e => setNewGroupName(e.target.value)}
                        autoFocus
                      />
                      <input 
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" 
                        placeholder="Horario (ej. Vie 7pm)"
                        value={newGroupDay}
                        onChange={e => setNewGroupDay(e.target.value)}
                      />
                      <button type="submit" className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-black transition-colors">Agregar Grupo</button>
                  </form>
              </div>
          </div>
      )}

      {/* ASSIGN MEMBER MODAL */}
      {isAssignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative h-[80vh] flex flex-col border border-white/50">
                  <button onClick={() => setIsAssignOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Asignar Miembro</h3>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                      <input 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-light font-medium"
                        placeholder="Buscar persona..."
                        value={searchMemberTerm}
                        onChange={e => setSearchMemberTerm(e.target.value)}
                        autoFocus
                      />
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                      {filteredMembers.map(m => (
                          <div 
                            key={m.id} 
                            onClick={() => setSelectedMemberId(m.id)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedMemberId === m.id ? 'bg-brand-soft border-brand-blue' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                          >
                              <img src={m.photoUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                              <div>
                                  <p className="font-bold text-slate-800 text-sm">{m.nombres}</p>
                                  <p className="text-xs text-slate-400">Anexo: {currentUser.role === 'PASTOR_PRINCIPAL' ? m.anexoId : 'Local'}</p>
                              </div>
                              {selectedMemberId === m.id && <Check className="w-5 h-5 text-brand-blue ml-auto" />}
                          </div>
                      ))}
                  </div>

                  {/* Role Input & Action */}
                  <div className="pt-4 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Rol Específico</label>
                      <input 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700 mb-4"
                        value={roleName}
                        onChange={e => setRoleName(e.target.value)}
                        placeholder="Ej. Guitarrista, Ujier"
                      />
                      <button 
                        onClick={handleAssignMember}
                        disabled={!selectedMemberId}
                        className="w-full py-3 bg-brand-blue text-white rounded-2xl font-bold hover:bg-brand-dark transition-colors disabled:opacity-50 shadow-glow"
                      >
                          Confirmar Asignación
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {ministryToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Ministerio?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Esta acción eliminará el ministerio y sus grupos. Los miembros serán desvinculados de este servicio.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setMinistryToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                      <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-200 transition-colors">Eliminar</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Ministries;
