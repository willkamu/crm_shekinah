import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { MOCK_EVENTS } from '../services/mockData';
import { Calendar, CheckCircle } from 'lucide-react';

const AttendancePage: React.FC = () => {
  const { members, attendance, toggleAttendance, markAllPresent, currentUser, anexos } = useApp();
  const [selectedEventId, setSelectedEventId] = useState<string>(MOCK_EVENTS[0].id);

  // 1. Determine Location Type Logic (Central vs Annex)
  // Logic: If current user is in Central (ANX-01), show specific days. Else show others.
  const currentAnexo = anexos.find(a => a.id === currentUser.anexoId);
  const isCentral = currentAnexo?.id === 'ANX-01' || currentUser.anexoId === 'ALL';
  
  const relevantDays = isCentral 
    ? "Domingo (Culto), Miércoles (Enseñanza)" 
    : "Lunes, Martes, Jueves, Sábado";

  // 2. Filter Members by relevant scope
  const visibleMembers = members.filter(m => 
    currentUser.anexoId === 'ALL' || m.anexoId === currentUser.anexoId
  );

  const presentCount = visibleMembers.filter(m => attendance[`${selectedEventId}-${m.id}`]).length;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Toma de Asistencia</h2>
                <p className="text-slate-500 text-sm mt-1">
                    Días habilitados para esta sede: <span className="font-bold text-sky-600">{relevantDays}</span>
                </p>
            </div>
            
            <div className="flex flex-col items-end">
                <p className="text-sm text-slate-500">Total Presentes</p>
                <p className="text-3xl font-bold text-sky-600">{presentCount} <span className="text-lg text-slate-300">/ {visibleMembers.length}</span></p>
            </div>
        </div>

        <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
                <select 
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 appearance-none font-medium text-slate-700"
                >
                    {MOCK_EVENTS.map(e => (
                        <option key={e.id} value={e.id}>{e.fecha} - {e.nombre}</option>
                    ))}
                </select>
                <Calendar className="absolute left-3 top-3.5 w-5 h-5 text-slate-400" />
            </div>
            <button 
                onClick={() => markAllPresent(selectedEventId, visibleMembers.map(m => m.id))}
                className="whitespace-nowrap px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
                Marcar Todos
            </button>
        </div>

        <div className="divide-y divide-slate-100">
            {visibleMembers.map(member => {
                const isPresent = attendance[`${selectedEventId}-${member.id}`];
                return (
                    <div key={member.id} className="py-3 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <img src={member.photoUrl} className="w-10 h-10 rounded-full bg-slate-100" />
                            <div>
                                <p className="font-bold text-slate-800">{member.nombres}</p>
                                <p className="text-xs text-slate-400">ID: {member.id}</p>
                            </div>
                        </div>
                        
                        {/* Custom IOS Toggle Switch */}
                        <div 
                            onClick={() => toggleAttendance(selectedEventId, member.id)}
                            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${isPresent ? 'bg-green-500' : 'bg-slate-300'}`}
                        >
                            <div className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-transform duration-300 ${isPresent ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
