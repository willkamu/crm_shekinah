
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { Member, IntercesionLog, IntercesionGroup } from '../types';
import { Flame, Star, Calendar, Users, ChevronRight, AlertCircle, Trophy, UserPlus, Check, X, Search, Trash2, Download, PieChart, Plus, Edit2, Plane } from 'lucide-react';

const Intercesion: React.FC = () => {
  const { intercesionGroups, members, intercesionLogs, logIntercesionAttendance, assignIntercesionGroup, addIntercesionGroup, updateIntercesionGroup, deleteIntercesionGroup, currentUser, notify } = useApp();
  const [activeTab, setActiveTab] = useState<'GRUPOS' | 'MIERCOLES' | 'AYUNO' | 'RANKING'>('GRUPOS');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(intercesionGroups[0]?.id || '');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);

  // Modal State for Members
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [groupToAssignId, setGroupToAssignId] = useState<string | null>(null);
  const [searchMemberTerm, setSearchMemberTerm] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Modal State for Groups (CRUD)
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isEditGroupMode, setIsEditGroupMode] = useState(false);
  const [editingGroup, setEditingGroup] = useState<IntercesionGroup | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupLeaderId, setGroupLeaderId] = useState('');

  // Helpers
  const getGroupMembers = (groupId: string) => members.filter(m => m.intercesionGroupId === groupId);
  
  // Calculate Ranking (Stars) based on log count
  const getStars = (memberId: string) => {
      const logCount = intercesionLogs.filter(l => l.memberId === memberId).length;
      if (logCount > 10) return 5;
      if (logCount > 7) return 4;
      if (logCount > 4) return 3;
      if (logCount > 1) return 2;
      return 1;
  };

  // --- MEMBER HANDLERS ---
  const handleAddMember = () => {
      if (selectedMemberId && groupToAssignId) {
          assignIntercesionGroup(selectedMemberId, groupToAssignId);
          setIsAssignOpen(false);
          setSelectedMemberId(null);
          setSearchMemberTerm('');
      }
  };

  const handleRemoveMember = (memberId: string) => {
      if (window.confirm("¿Retirar a este miembro del grupo de intercesión?")) {
          assignIntercesionGroup(memberId, null);
      }
  };

  const handleExportRanking = () => {
      const intercesors = members.filter(m => m.intercesionGroupId);
      if (intercesors.length === 0) {
          notify("No hay datos para exportar", "error");
          return;
      }

      const headers = ['Nombre', 'Grupo', 'Estrellas', 'Estado', 'Apto Viaje'];
      const rows = intercesors.map(m => {
          const stars = getStars(m.id);
          const group = intercesionGroups.find(g => g.id === m.intercesionGroupId)?.nombre || 'Sin Grupo';
          const status = stars >= 4 ? 'Fiel' : stars >= 2 ? 'Regular' : 'Riesgo';
          const apto = stars >= 3 ? 'SI' : 'NO';
          return [m.nombres, group, stars, status, apto];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
          + headers.join(",") + "\n" 
          + rows.map(e => e.join(",")).join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `ranking_intercesion_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      notify("Ranking exportado a CSV", "success");
  };

  // --- GROUP HANDLERS ---
  const handleOpenCreateGroup = () => {
      setIsEditGroupMode(false);
      setEditingGroup(null);
      setGroupName('');
      setGroupLeaderId('');
      setIsGroupModalOpen(true);
  };

  const handleOpenEditGroup = (group: IntercesionGroup) => {
      setIsEditGroupMode(true);
      setEditingGroup(group);
      setGroupName(group.nombre);
      setGroupLeaderId(group.liderId);
      setIsGroupModalOpen(true);
  };

  const handleSaveGroup = (e: React.FormEvent) => {
      e.preventDefault();
      if (!groupName) return;

      if (isEditGroupMode && editingGroup) {
          updateIntercesionGroup(editingGroup.id, {
              nombre: groupName,
              liderId: groupLeaderId
          });
          notify("Grupo actualizado correctamente");
      } else {
          addIntercesionGroup({
              id: `GRP-${Date.now()}`,
              nombre: groupName,
              liderId: groupLeaderId
          });
          notify("Nuevo grupo creado");
      }
      setIsGroupModalOpen(false);
  };

  const handleDeleteGroup = (groupId: string) => {
      if (window.confirm("¿Eliminar este grupo? Los miembros quedarán sin asignación.")) {
          deleteIntercesionGroup(groupId);
          // Also cleanup members
          members.filter(m => m.intercesionGroupId === groupId).forEach(m => {
              assignIntercesionGroup(m.id, null);
          });
      }
  };

  const filteredMembers = members.filter(m => 
      m.nombres.toLowerCase().includes(searchMemberTerm.toLowerCase()) &&
      !m.intercesionGroupId 
  );

  // Statistics Helper
  const getAttendanceStats = (groupId: string, date: string, typePrefix: string) => {
      const groupMembers = getGroupMembers(groupId);
      if (groupMembers.length === 0) return { present: 0, total: 0, percent: 0 };
      
      let presentCount = 0;
      groupMembers.forEach(m => {
          const isPresent = intercesionLogs.some(l => 
              l.memberId === m.id && 
              l.fecha === date && 
              l.tipo.startsWith(typePrefix)
          );
          if (isPresent) presentCount++;
      });

      return {
          present: presentCount,
          total: groupMembers.length,
          percent: Math.round((presentCount / groupMembers.length) * 100)
      };
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-red-100 p-3 rounded-2xl shadow-sm">
             <Flame className="w-8 h-8 text-red-600" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Intercesión</h2>
            <p className="text-sm text-slate-500 font-medium">Motor Espiritual de la Iglesia</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          {[
              {id: 'GRUPOS', label: 'Mis Grupos', icon: Users},
              {id: 'MIERCOLES', label: 'Miércoles', icon: Calendar},
              {id: 'AYUNO', label: 'Ayuno Mensual', icon: Flame},
              {id: 'RANKING', label: 'Ranking', icon: Star},
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-red-500 text-red-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      {/* TAB: GRUPOS */}
      {activeTab === 'GRUPOS' && (
          <div className="space-y-6">
              <div className="flex justify-end">
                  <button 
                    onClick={handleOpenCreateGroup}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-glow hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                      <Plus className="w-4 h-4" /> Nuevo Grupo
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {intercesionGroups.map(group => {
                      const groupMembers = getGroupMembers(group.id);
                      const leader = members.find(m => m.id === group.liderId);
                      
                      return (
                          <div key={group.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-card hover:shadow-lg transition-all overflow-hidden flex flex-col h-full relative">
                              {/* ACTIONS ALWAYS VISIBLE */}
                              <div className="absolute top-4 right-4 flex gap-1 z-10">
                                  <button 
                                    onClick={() => handleOpenEditGroup(group)} 
                                    className="p-2 bg-slate-50 rounded-full text-slate-500 hover:text-brand-blue hover:bg-white shadow-sm border border-slate-100 transition-all"
                                    title="Editar Grupo"
                                  >
                                      <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteGroup(group.id)} 
                                    className="p-2 bg-slate-50 rounded-full text-slate-500 hover:text-red-500 hover:bg-white shadow-sm border border-slate-100 transition-all"
                                    title="Eliminar Grupo"
                                  >
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                              </div>

                              <div className="p-6 pb-4 bg-slate-50/30">
                                  <div className="flex justify-between items-start mb-4">
                                      <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                                          <Users className="w-6 h-6" />
                                      </div>
                                      <span className="text-2xl font-bold text-slate-800 pr-16">{groupMembers.length}</span>
                                  </div>
                                  <h3 className="text-lg font-bold text-slate-800 truncate pr-4">{group.nombre}</h3>
                                  
                                  <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                      <img src={leader?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${group.id}`} className="w-6 h-6 rounded-full bg-slate-100"/>
                                      <div>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase">Líder de Grupo</p>
                                          <p className="text-xs font-bold text-slate-700">{leader?.nombres || 'Sin asignar'}</p>
                                      </div>
                                  </div>
                              </div>
                              
                              <div className="flex-1 bg-white p-4">
                                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar mb-4">
                                      {groupMembers.map(m => (
                                          <div key={m.id} className="flex items-center justify-between group/member p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                                              <div className="flex items-center gap-2">
                                                  <img src={m.photoUrl} className="w-7 h-7 rounded-full border border-white bg-slate-200" title={m.nombres} />
                                                  <span className="text-xs font-bold text-slate-600 truncate max-w-[120px]">{m.nombres}</span>
                                              </div>
                                              <button 
                                                onClick={() => handleRemoveMember(m.id)}
                                                className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                title="Quitar del grupo"
                                              >
                                                  <X className="w-3 h-3" />
                                              </button>
                                          </div>
                                      ))}
                                      {groupMembers.length === 0 && <p className="text-xs text-slate-300 italic text-center py-2">Grupo vacío</p>}
                                  </div>

                                  <button 
                                    onClick={() => { setGroupToAssignId(group.id); setIsAssignOpen(true); }}
                                    className="w-full py-2 bg-red-50 text-red-600 text-xs font-bold rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                                  >
                                      <UserPlus className="w-3.5 h-3.5" /> Agregar Intercesor
                                  </button>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

      {/* TAB: MIERCOLES & AYUNO */}
      {(activeTab === 'MIERCOLES' || activeTab === 'AYUNO') && (
          <div className="bg-white p-6 rounded-[2.5rem] shadow-card border border-slate-50">
              <div className="flex flex-col md:flex-row gap-6 mb-8 border-b border-slate-100 pb-8">
                  <div className="flex-1">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Seleccionar Grupo</label>
                      <select 
                        value={selectedGroupId}
                        onChange={e => setSelectedGroupId(e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-200"
                      >
                          {intercesionGroups.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
                      </select>
                  </div>
                  <div className="flex-1">
                      <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Fecha</label>
                      <input 
                        type="date" 
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-200"
                      />
                  </div>
              </div>

              {/* LIVE STATS PANEL */}
              {(() => {
                  const typePrefix = activeTab === 'MIERCOLES' ? 'MIERCOLES' : 'AYUNO';
                  const stats = getAttendanceStats(selectedGroupId, attendanceDate, typePrefix);
                  
                  return (
                      <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex justify-between items-center border border-slate-100">
                          <div className="flex items-center gap-3">
                              <div className="bg-white p-2 rounded-full shadow-sm">
                                  <PieChart className="w-5 h-5 text-slate-500" />
                              </div>
                              <div>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Asistencia Hoy</p>
                                  <p className="text-lg font-bold text-slate-700">{stats.present} / {stats.total} <span className="text-sm text-slate-400 font-normal">miembros</span></p>
                              </div>
                          </div>
                          <div className="flex items-center gap-2">
                              <div className="text-right">
                                  <p className={`text-2xl font-extrabold ${stats.percent >= 80 ? 'text-emerald-500' : stats.percent >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{stats.percent}%</p>
                              </div>
                          </div>
                      </div>
                  );
              })()}

              <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      {activeTab === 'AYUNO' && <Flame className="w-4 h-4 text-orange-500" />}
                      Listado de Intercesores
                  </h4>
                  
                  {activeTab === 'AYUNO' && (
                      <div className="bg-orange-50 p-4 rounded-xl mb-4 text-orange-800 text-sm flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Seleccione los días cumplidos del ayuno mensual (3 Días).
                      </div>
                  )}

                  {getGroupMembers(selectedGroupId).map(member => (
                      <div key={member.id} className="flex flex-col sm:flex-row justify-between items-center p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-transparent hover:border-slate-100">
                          <div className="flex items-center gap-4 w-full sm:w-auto mb-3 sm:mb-0">
                              <img src={member.photoUrl} className="w-10 h-10 rounded-full bg-slate-100 object-cover" />
                              <div>
                                  <p className="font-bold text-slate-800">{member.nombres}</p>
                                  <div className="flex text-amber-400 text-xs">
                                      {[...Array(getStars(member.id))].map((_,i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                  </div>
                              </div>
                          </div>
                          
                          {activeTab === 'MIERCOLES' ? (
                              <label className="flex items-center cursor-pointer gap-3">
                                  <span className="text-xs font-bold text-slate-400 uppercase">Presente</span>
                                  <div className="relative">
                                      <input 
                                        type="checkbox" 
                                        className="peer sr-only"
                                        checked={intercesionLogs.some(l => l.memberId === member.id && l.fecha === attendanceDate && l.tipo === 'MIERCOLES')}
                                        onChange={(e) => logIntercesionAttendance(attendanceDate, 'MIERCOLES', member.id, e.target.checked)}
                                      />
                                      <div className="w-10 h-6 bg-slate-200 rounded-full peer-checked:bg-emerald-500 transition-colors"></div>
                                      <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
                                  </div>
                              </label>
                          ) : (
                              <div className="flex gap-4">
                                  {['Día 1', 'Día 2', 'Día 3'].map((dayLabel, idx) => {
                                      const type = idx === 0 ? 'AYUNO_DIA_1' : idx === 1 ? 'AYUNO_DIA_2' : 'AYUNO_DIA_3';
                                      const isChecked = intercesionLogs.some(l => l.memberId === member.id && l.fecha === attendanceDate && l.tipo === type);
                                      return (
                                          <label key={type} className="flex flex-col items-center cursor-pointer gap-1 group/check">
                                              <span className="text-[10px] font-bold text-slate-400 uppercase group-hover/check:text-orange-500 transition-colors">{dayLabel}</span>
                                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-transparent hover:border-orange-300'}`}>
                                                  <Check className="w-5 h-5" />
                                                  <input 
                                                    type="checkbox" 
                                                    className="hidden"
                                                    checked={isChecked}
                                                    onChange={(e) => logIntercesionAttendance(attendanceDate, type as any, member.id, e.target.checked)}
                                                  />
                                              </div>
                                          </label>
                                      );
                                  })}
                              </div>
                          )}
                      </div>
                  ))}
                  {getGroupMembers(selectedGroupId).length === 0 && (
                      <p className="text-center text-slate-400 py-10 font-medium">No hay intercesores en este grupo.</p>
                  )}
              </div>
          </div>
      )}

      {/* TAB: RANKING */}
      {activeTab === 'RANKING' && (
          <div className="space-y-4">
              <div className="flex justify-end mb-4">
                  <button 
                    onClick={handleExportRanking}
                    className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors"
                  >
                      <Download className="w-4 h-4" /> Exportar CSV
                  </button>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-card">
                  <table className="w-full">
                      <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider text-left">
                          <tr>
                              <th className="p-5">Intercesor</th>
                              <th className="p-5">Grupo</th>
                              <th className="p-5 text-center">Nivel (Estrellas)</th>
                              <th className="p-5 text-center">Apto Viaje</th>
                              <th className="p-5 text-right">Estado</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {members.filter(m => m.intercesionGroupId).map(member => {
                              const stars = getStars(member.id);
                              const groupName = intercesionGroups.find(g => g.id === member.intercesionGroupId)?.nombre;
                              const isEligible = stars >= 3;

                              return (
                                  <tr key={member.id} className="hover:bg-slate-50/50">
                                      <td className="p-5">
                                          <div className="flex items-center gap-3">
                                              <img src={member.photoUrl} className="w-10 h-10 rounded-full" />
                                              <span className="font-bold text-slate-700">{member.nombres}</span>
                                          </div>
                                      </td>
                                      <td className="p-5 text-sm text-slate-500">{groupName}</td>
                                      <td className="p-5">
                                          <div className="flex justify-center text-amber-400 gap-1">
                                              {[...Array(5)].map((_,i) => (
                                                  <Star key={i} className={`w-4 h-4 ${i < stars ? 'fill-current' : 'text-slate-200'}`} />
                                              ))}
                                          </div>
                                      </td>
                                      <td className="p-5 text-center">
                                          {isEligible ? (
                                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-sky-100 text-sky-600 rounded text-xs font-bold">
                                                  <Plane className="w-3 h-3" /> SI
                                              </span>
                                          ) : (
                                              <span className="text-slate-300 text-xs font-bold">-</span>
                                          )}
                                      </td>
                                      <td className="p-5 text-right">
                                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${stars >= 4 ? 'bg-emerald-100 text-emerald-600' : stars >= 2 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                                              {stars >= 4 ? 'Fiel' : stars >= 2 ? 'Regular' : 'Riesgo'}
                                          </span>
                                      </td>
                                  </tr>
                              )
                          })}
                      </tbody>
                  </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                  {members.filter(m => m.intercesionGroupId).map(member => {
                      const stars = getStars(member.id);
                      const groupName = intercesionGroups.find(g => g.id === member.intercesionGroupId)?.nombre;
                      return (
                          <div key={member.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                  <div className="relative">
                                      <img src={member.photoUrl} className="w-12 h-12 rounded-full object-cover" />
                                      {stars >= 4 && (
                                          <div className="absolute -bottom-1 -right-1 bg-yellow-400 p-1 rounded-full border-2 border-white">
                                              <Trophy className="w-3 h-3 text-white" />
                                          </div>
                                      )}
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-800">{member.nombres}</h4>
                                      <p className="text-xs text-slate-400">{groupName}</p>
                                  </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                  <div className="flex text-amber-400 gap-0.5">
                                      {[...Array(5)].map((_,i) => (
                                          <Star key={i} className={`w-3 h-3 ${i < stars ? 'fill-current' : 'text-slate-200'}`} />
                                      ))}
                                  </div>
                                  <span className={`text-[10px] font-bold uppercase ${stars >= 4 ? 'text-emerald-500' : stars >= 2 ? 'text-amber-500' : 'text-red-500'}`}>
                                      {stars >= 4 ? 'Fiel' : stars >= 2 ? 'Regular' : 'Riesgo'}
                                  </span>
                              </div>
                          </div>
                      )
                  })}
              </div>
          </div>
      )}

      {/* ASSIGN MEMBER MODAL */}
      {isAssignOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative h-[80vh] flex flex-col border border-white/50">
                  <button onClick={() => setIsAssignOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Agregar Intercesor</h3>
                  
                  {/* Search */}
                  <div className="relative mb-4">
                      <input 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-red-200 font-medium"
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
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedMemberId === m.id ? 'bg-red-50 border-red-400' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                          >
                              <img src={m.photoUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                              <div>
                                  <p className="font-bold text-slate-800 text-sm">{m.nombres}</p>
                                  <p className="text-xs text-slate-400">{m.estatus}</p>
                              </div>
                              {selectedMemberId === m.id && <Check className="w-5 h-5 text-red-500 ml-auto" />}
                          </div>
                      ))}
                      {filteredMembers.length === 0 && <p className="text-center text-xs text-slate-400 mt-4">No se encontraron miembros disponibles.</p>}
                  </div>

                  {/* Action */}
                  <div className="pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleAddMember}
                        disabled={!selectedMemberId}
                        className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-glow flex justify-center items-center gap-2"
                      >
                          <UserPlus className="w-4 h-4" /> Asignar al Grupo
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE/EDIT GROUP MODAL */}
      {isGroupModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsGroupModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">{isEditGroupMode ? 'Editar Grupo' : 'Nuevo Grupo'}</h3>
                  <form onSubmit={handleSaveGroup} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Nombre</label>
                          <input 
                            placeholder="Ej. Grupo 6 - Victoria"
                            value={groupName}
                            onChange={e => setGroupName(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-200" 
                            autoFocus
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Líder Asignado</label>
                          <select 
                            value={groupLeaderId}
                            onChange={e => setGroupLeaderId(e.target.value)}
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-red-200"
                          >
                              <option value="">-- Seleccionar --</option>
                              {members.map(m => (
                                  <option key={m.id} value={m.id}>{m.nombres}</option>
                              ))}
                          </select>
                      </div>
                      <button type="submit" className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold shadow-glow mt-2 hover:bg-red-700 transition-colors">
                          {isEditGroupMode ? 'Guardar Cambios' : 'Crear Grupo'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Intercesion;
