
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { MissionTrip, TripParticipant } from '../types';
import { Plane, Calendar, MapPin, UserPlus, Check, X, Shield, Music, Mic2, Users, Search, AlertCircle, Lock, CheckSquare, ListChecks, Flame, Star, Crown } from 'lucide-react';

const Viajes: React.FC = () => {
  const { trips, members, addTrip, updateTrip, currentUser, notify, markTripAttendance, intercesionLogs, intercesionGroups } = useApp();
  const [isCreating, setIsCreating] = useState(false);

  // New Trip Form State
  const [newTripDestino, setNewTripDestino] = useState('');
  const [newTripFecha, setNewTripFecha] = useState('');
  const [newTripGroupId, setNewTripGroupId] = useState(''); 

  // Propose Modal State
  const [isProposeOpen, setIsProposeOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [searchMember, setSearchMember] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<TripParticipant['role']>('APOYO');
  
  // Lock Confirmation State
  const [tripToLock, setTripToLock] = useState<string | null>(null);

  // Execution Modal
  const [executionTrip, setExecutionTrip] = useState<MissionTrip | null>(null);

  // --- ROLES & PERMISSIONS LOGIC ---
  const isPastor = currentUser.role === 'PASTOR_PRINCIPAL' || currentUser.role === 'PASTOR_EJECUTIVO';
  const isMinistro = currentUser.role === 'MINISTRO'; 
  const isIntercessionLeader = currentUser.role === 'LIDER_INTERCESION';
  const isMember = currentUser.role === 'MIEMBRO';
  const isAnnexLeader = currentUser.role === 'LIDER_ANEXO';

  // Determine the group managed by the current intercession leader
  const myIntercessionGroup = isIntercessionLeader 
      ? intercesionGroups.find(g => g.liderId === currentUser.memberId)
      : null;

  // Helper to check stars
  const getStars = (memberId: string) => {
      const logCount = intercesionLogs.filter(l => l.memberId === memberId).length;
      if (logCount > 10) return 5;
      if (logCount > 7) return 4;
      if (logCount > 4) return 3;
      if (logCount > 1) return 2;
      return 1;
  };

  const handleCreateTrip = () => {
      if (!newTripDestino || !newTripFecha || !newTripGroupId) return;
      
      const newTrip: MissionTrip = {
          id: `TRIP-${Date.now()}`,
          destino: newTripDestino,
          fechaSalida: newTripFecha,
          fechaRetorno: newTripFecha, 
          status: 'PLANIFICACION',
          responsableId: currentUser.name,
          assignedGroupId: newTripGroupId, 
          participants: []
      };
      
      addTrip(newTrip);
      setIsCreating(false);
      setNewTripDestino('');
      setNewTripFecha('');
      setNewTripGroupId('');
  };

  const handleOpenPropose = (tripId: string) => {
      setActiveTripId(tripId);
      setSearchMember('');
      setSelectedMemberId(null);
      
      // Default Role based on who is proposing
      if (isIntercessionLeader) setSelectedRole('INTERCESOR');
      else setSelectedRole('APOYO');

      setIsProposeOpen(true);
  };

  const handleMemberSelect = (member: any) => {
      setSelectedMemberId(member.id);
      if (member.intercesionGroupId) {
          setSelectedRole('INTERCESOR');
      } else if (member.ministryRoles && Object.values(member.ministryRoles).some((r: any) => String(r).toLowerCase().includes('músico'))) {
          setSelectedRole('MUSICO');
      }
  };

  const handleConfirmProposal = () => {
      if (!activeTripId || !selectedMemberId) return;

      const trip = trips.find(t => t.id === activeTripId);
      if (trip) {
          if (trip.participants.some(p => p.memberId === selectedMemberId)) {
              notify("El miembro ya está en la lista.", "error");
              return;
          }

          // Pastor adds directly as APPROVED (Special Guest logic), others PROPOSE
          const newParticipant: TripParticipant = {
              memberId: selectedMemberId,
              role: selectedRole,
              status: isPastor ? 'APROBADO' : 'PROPUESTO'
          };
          
          updateTrip(activeTripId, { participants: [...trip.participants, newParticipant] });
          setIsProposeOpen(false);
          notify(isPastor ? "Invitado agregado oficialmente" : "Propuesta enviada al Ministro/Pastor");
      }
  };

  const handleApproveParticipant = (tripId: string, memberId: string, approve: boolean) => {
      // Logic Update: Minister OR Pastor can approve
      if (!isPastor && !isMinistro) return;
      
      const trip = trips.find(t => t.id === tripId);
      if (!trip) return;

      const updatedParticipants = trip.participants.map(p => 
          p.memberId === memberId 
          ? { ...p, status: approve ? 'APROBADO' : 'RECHAZADO' } as TripParticipant
          : p
      );

      updateTrip(tripId, { participants: updatedParticipants });
      notify(approve ? "Participante Aprobado" : "Participante Rechazado");
  };

  const confirmLockTrip = () => {
      if (tripToLock) {
          updateTrip(tripToLock, { status: 'APROBADO' });
          setTripToLock(null);
          notify("Lista oficial cerrada y aprobada");
      }
  };

  // --- FILTER LOGIC (MANUAL RULES) ---
  const visibleTrips = trips.filter(t => {
      if (isMember) {
          return t.participants.some(p => p.memberId === currentUser.memberId);
      }
      return true; 
  });

  const getFilteredMembersForProposal = () => {
      const currentTrip = trips.find(t => t.id === activeTripId);
      let candidateList = members;

      // Filter: Intercession Leader only proposes members from THEIR group
      if (isIntercessionLeader && myIntercessionGroup) {
           candidateList = candidateList.filter(m => m.intercesionGroupId === myIntercessionGroup.id);
      } else if (isIntercessionLeader && !myIntercessionGroup) {
           candidateList = [];
      }

      return candidateList.filter(m => 
          m.nombres.toLowerCase().includes(searchMember.toLowerCase()) &&
          !currentTrip?.participants.some(p => p.memberId === m.id)
      );
  };

  const canPropose = (trip: MissionTrip) => {
      if (isAnnexLeader) return false; // Annex Leader CANNOT propose
      if (isPastor || isMinistro) return true;
      if (isIntercessionLeader) {
          // Logic Updated: Any intercession leader can propose members to any trip, 
          // they are just limited to proposing *their own* members (handled in getFilteredMembersForProposal)
          return !!myIntercessionGroup;
      }
      return false;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="bg-sky-100 p-3 rounded-2xl shadow-sm">
                <Plane className="w-8 h-8 text-sky-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Viajes Misioneros</h2>
                <p className="text-sm text-slate-500 font-medium">Extensión del Reino</p>
            </div>
        </div>
        
        {(isPastor || isMinistro) && (
            <button 
                onClick={() => setIsCreating(true)}
                className="bg-sky-600 text-white px-5 py-3 rounded-2xl flex items-center shadow-glow hover:bg-sky-700 transition-all btn-hover"
            >
                <Calendar className="w-5 h-5 md:mr-1.5" /> <span className="hidden md:inline font-bold text-sm">Programar Viaje</span>
            </button>
        )}
      </div>

      {/* New Trip Form */}
      {isCreating && (
          <div className="bg-white p-6 rounded-[2rem] shadow-card border border-sky-100 animate-slideUp">
              <h3 className="font-bold text-lg mb-4">Nuevo Viaje Misionero</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input 
                    placeholder="Destino (Ciudad/Anexo)" 
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-sky-200"
                    value={newTripDestino}
                    onChange={e => setNewTripDestino(e.target.value)}
                  />
                  <input 
                    type="date"
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-sky-200"
                    value={newTripFecha}
                    onChange={e => setNewTripFecha(e.target.value)}
                  />
                  <div className="col-span-1 md:col-span-2">
                       <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Grupo Asignado (Cobertura)</label>
                       <select
                           className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-sky-200 font-bold text-slate-700"
                           value={newTripGroupId}
                           onChange={e => setNewTripGroupId(e.target.value)}
                       >
                           <option value="">-- Seleccionar Grupo de Intercesión --</option>
                           {intercesionGroups.map(g => (
                               <option key={g.id} value={g.id}>{g.nombre}</option>
                           ))}
                       </select>
                  </div>
              </div>
              <div className="flex justify-end gap-2">
                  <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                  <button onClick={handleCreateTrip} disabled={!newTripGroupId} className="px-6 py-2 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors disabled:opacity-50">Crear Viaje</button>
              </div>
          </div>
      )}

      {/* Trip List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleTrips.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-[2rem]">
                  <Plane className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p>{isMember ? 'No estás inscrito en ningún viaje próximo.' : 'No hay viajes programados.'}</p>
              </div>
          )}

          {visibleTrips.map(trip => {
              const pending = trip.participants.filter(p => p.status === 'PROPUESTO');
              const approved = trip.participants.filter(p => p.status === 'APROBADO');
              const rejected = trip.participants.filter(p => p.status === 'RECHAZADO');

              // Logic to decide if current user can see pending requests for THIS trip
              // Intercession Leaders should see pending requests so they can track their proposals
              const canSeePending = isPastor || isMinistro || isIntercessionLeader;

              return (
              <div key={trip.id} className="bg-white rounded-[2.5rem] p-6 shadow-card border border-slate-50 flex flex-col h-full relative overflow-hidden group">
                  {/* Status Badge */}
                  <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-2xl text-[10px] font-extrabold uppercase tracking-wider ${
                      trip.status === 'APROBADO' ? 'bg-emerald-500 text-white' : 
                      trip.status === 'PLANIFICACION' ? 'bg-amber-400 text-white' : 
                      'bg-sky-500 text-white'
                  }`}>
                      {trip.status.replace('_', ' ')}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-600">
                          <MapPin className="w-6 h-6" />
                      </div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-800">{trip.destino}</h3>
                          <p className="text-sm text-slate-400 font-medium flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> {trip.fechaSalida}
                          </p>
                      </div>
                  </div>
                  
                  {/* Assigned Group Badge */}
                  <div className="mb-4">
                       <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded flex items-center w-fit gap-1">
                           <Flame className="w-3 h-3"/> A cargo: {intercesionGroups.find(g => g.id === trip.assignedGroupId)?.nombre || 'Sin Asignar'}
                       </span>
                  </div>

                  {/* Participants List - SPLIT */}
                  <div className="flex-1 bg-slate-50 rounded-2xl p-4 mb-4 overflow-y-auto max-h-80 custom-scrollbar space-y-4">
                      
                      {/* PENDING SECTION */}
                      {canSeePending && pending.length > 0 && (
                          <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3"/> Solicitudes Pendientes ({pending.length})
                              </h4>
                              <div className="space-y-2">
                                  {pending.map((p, idx) => {
                                      const member = members.find(m => m.id === p.memberId);
                                      return (
                                          <div key={`pend-${idx}`} className="bg-white p-2 rounded-lg flex justify-between items-center shadow-sm">
                                              <div className="flex items-center gap-2">
                                                  <img src={member?.photoUrl} className="w-6 h-6 rounded-full bg-slate-200" />
                                                  <div>
                                                      <p className="text-xs font-bold text-slate-700">{member?.nombres}</p>
                                                      <span className="text-[9px] text-slate-400">{p.role}</span>
                                                  </div>
                                              </div>
                                              <div className="flex gap-1">
                                                  {(isPastor || isMinistro) ? (
                                                      <>
                                                          <button onClick={() => handleApproveParticipant(trip.id, p.memberId, true)} className="p-1 bg-emerald-100 text-emerald-600 rounded hover:bg-emerald-200"><Check className="w-3 h-3"/></button>
                                                          <button onClick={() => handleApproveParticipant(trip.id, p.memberId, false)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200"><X className="w-3 h-3"/></button>
                                                      </>
                                                  ) : (
                                                       <span className="text-[9px] font-bold text-amber-600 bg-white px-2 py-1 rounded border border-amber-100">
                                                           EN REVISIÓN
                                                       </span>
                                                  )}
                                              </div>
                                          </div>
                                      )
                                  })}
                              </div>
                          </div>
                      )}

                      {/* CONFIRMED LIST */}
                      <div>
                          <div className="flex justify-between items-center mb-2">
                              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Equipo Confirmado</h4>
                              <span className="text-xs font-bold bg-white px-2 py-1 rounded-md text-slate-500">{approved.length}</span>
                          </div>
                          <div className="space-y-2">
                              {approved.length === 0 && <p className="text-center text-xs text-slate-300 py-2 italic">Sin confirmados.</p>}
                              {approved.map((p, idx) => {
                                  const member = members.find(m => m.id === p.memberId);
                                  return (
                                      <div key={`app-${idx}`} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm border-l-4 border-emerald-400">
                                          <div className="flex items-center gap-3">
                                              <img src={member?.photoUrl} className="w-8 h-8 rounded-full bg-slate-200" />
                                              <div>
                                                  <p className="text-sm font-bold text-slate-700">{member?.nombres}</p>
                                                  <span className="text-[10px] text-slate-400 font-bold uppercase">{p.role}</span>
                                              </div>
                                          </div>
                                          {p.attended && (
                                              <span className="text-[9px] text-sky-500 font-bold flex items-center gap-0.5"><CheckSquare className="w-3 h-3" /> ASISTIÓ</span>
                                          )}
                                      </div>
                                  )
                              })}
                          </div>
                      </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex gap-2">
                      {/* PROPOSE: Leaders of Intercession (Any group leader) or Pastor */}
                      {(trip.status === 'PLANIFICACION' || trip.status === 'EN_REVISION') && canPropose(trip) && !isMember && (
                          <button 
                            onClick={() => handleOpenPropose(trip.id)}
                            className={`flex-1 py-3 border-2 font-bold rounded-xl transition-colors flex justify-center items-center gap-2 text-xs uppercase tracking-wide ${
                                isPastor 
                                ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100' 
                                : 'bg-white border-slate-100 text-slate-600 hover:border-sky-200 hover:text-sky-600'
                            }`}
                          >
                              {isPastor ? <Crown className="w-4 h-4"/> : <UserPlus className="w-4 h-4"/>}
                              {isPastor ? 'Agregar Invitado' : 'Proponer (Mi Grupo)'}
                          </button>
                      )}
                      
                      {/* APPROVE: Only Pastor closes the list */}
                      {isPastor && trip.status === 'PLANIFICACION' && (
                          <button 
                            onClick={() => setTripToLock(trip.id)}
                            className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-black transition-colors flex justify-center items-center gap-2 text-xs uppercase tracking-wide"
                          >
                              <Shield className="w-4 h-4" /> Aprobar Lista
                          </button>
                      )}

                      {/* EXECUTION: Leaders involved + Pastor */}
                      {trip.status === 'APROBADO' && !isMember && (
                          <button 
                            onClick={() => setExecutionTrip(trip)}
                            className="flex-1 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors flex justify-center items-center gap-2 text-xs uppercase tracking-wide shadow-glow"
                          >
                              <ListChecks className="w-4 h-4" /> Hoja de Ruta
                          </button>
                      )}
                  </div>
              </div>
          )})}
      </div>

      {/* PROPOSE MEMBER MODAL */}
      {isProposeOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative h-[80vh] flex flex-col border border-white/50">
                  <button onClick={() => setIsProposeOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">
                      {isPastor ? 'Invitación Pastoral' : 'Proponer Participante'}
                  </h3>
                  
                  {isIntercessionLeader && (
                       <div className="bg-red-50 p-3 rounded-xl mb-4 border border-red-100">
                           <p className="text-xs text-red-800 flex items-center gap-2 font-bold">
                               <Flame className="w-4 h-4"/>
                               Líder de {myIntercessionGroup?.nombre || 'Intercesión'}
                           </p>
                           <p className="text-[10px] text-red-600 mt-1">Solo puedes proponer miembros de tu grupo.</p>
                       </div>
                  )}
                  
                  {/* Search */}
                  <div className="relative mb-4">
                      <input 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-sky-200 font-medium"
                        placeholder={isPastor ? "Buscar en toda la iglesia..." : "Buscar en mi lista..."}
                        value={searchMember}
                        onChange={e => setSearchMember(e.target.value)}
                        autoFocus
                      />
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  </div>

                  {/* List */}
                  <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2 custom-scrollbar">
                      {getFilteredMembersForProposal().map(m => (
                          <div 
                            key={m.id} 
                            onClick={() => handleMemberSelect(m)}
                            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors border ${selectedMemberId === m.id ? 'bg-sky-50 border-sky-400' : 'bg-white border-slate-100 hover:border-slate-300'}`}
                          >
                              <img src={m.photoUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                              <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                      <p className="font-bold text-slate-800 text-sm">{m.nombres}</p>
                                      {m.intercesionGroupId && (
                                          <div className="flex text-amber-400 text-[10px]">
                                              {[...Array(getStars(m.id))].map((_,i) => <Star key={i} className="w-2.5 h-2.5 fill-current" />)}
                                          </div>
                                      )}
                                  </div>
                                  <p className="text-xs text-slate-400">{m.estatus}</p>
                              </div>
                              {selectedMemberId === m.id && <Check className="w-5 h-5 text-sky-500 ml-auto" />}
                          </div>
                      ))}
                      {getFilteredMembersForProposal().length === 0 && <p className="text-center text-xs text-slate-400 mt-4">No se encontraron candidatos disponibles.</p>}
                  </div>

                  {/* Role Input & Action */}
                  <div className="pt-4 border-t border-slate-100">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Rol Sugerido</label>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                          {['INTERCESOR', 'MUSICO', 'EVANGELISTA', 'APOYO'].map((role) => (
                              <button
                                key={role}
                                onClick={() => setSelectedRole(role as TripParticipant['role'])}
                                className={`py-2 px-3 rounded-lg text-[10px] font-bold border transition-colors uppercase ${
                                    selectedRole === role 
                                    ? 'bg-sky-50 text-sky-600 border-sky-500' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                }`}
                              >
                                  {role}
                              </button>
                          ))}
                      </div>
                      <button 
                        onClick={handleConfirmProposal}
                        disabled={!selectedMemberId}
                        className="w-full py-3 bg-sky-600 text-white rounded-2xl font-bold hover:bg-sky-700 transition-colors disabled:opacity-50 shadow-glow"
                      >
                          {isPastor ? 'Agregar Oficialmente' : 'Enviar Propuesta'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM LOCK MODAL */}
      {tripToLock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-500">
                      <Lock className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¿Cerrar Lista Oficial?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Al aprobar la lista, el viaje pasará a estado OFICIAL y no se podrán agregar más participantes fácilmente.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setTripToLock(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                      <button onClick={confirmLockTrip} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-black shadow-lg">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* EXECUTION MODAL (ATTENDANCE) */}
      {executionTrip && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative h-[80vh] flex flex-col border border-white/50">
                  <button onClick={() => setExecutionTrip(null)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-800">Hoja de Ruta</h3>
                      <p className="text-sm text-slate-500">{executionTrip.destino} • {executionTrip.fechaSalida}</p>
                  </div>

                  <div className="bg-sky-50 p-4 rounded-xl mb-4 text-sky-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Marque la asistencia real de quienes subieron al transporte.
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {executionTrip.participants.filter(p => p.status === 'APROBADO').map(p => {
                          const member = members.find(m => m.id === p.memberId);
                          return (
                              <div key={p.memberId} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                  <div className="flex items-center gap-3">
                                      <img src={member?.photoUrl} className="w-8 h-8 rounded-full" />
                                      <div>
                                          <p className="font-bold text-slate-700 text-sm">{member?.nombres}</p>
                                          <p className="text-[10px] text-slate-400 font-bold uppercase">{p.role}</p>
                                      </div>
                                  </div>
                                  <button 
                                    onClick={() => markTripAttendance(executionTrip.id, p.memberId, !p.attended)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${p.attended ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-300'}`}
                                  >
                                      <Check className="w-5 h-5" />
                                  </button>
                              </div>
                          )
                      })}
                  </div>

                  <button onClick={() => setExecutionTrip(null)} className="mt-4 w-full py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-black transition-colors">
                      Finalizar Control
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Viajes;
