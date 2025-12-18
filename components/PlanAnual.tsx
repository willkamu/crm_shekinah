
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { EventType } from '../types';
import { CalendarDays, Plus, Clock, CheckCircle2, Ticket, X, Calendar, MapPin, MessageCircle, AlertTriangle, List, ChevronLeft, ChevronRight } from 'lucide-react';

const PlanAnual: React.FC = () => {
    const { events, addEvent, currentUser, updateEvent, notify, sendWhatsApp, eventRegistrations, toggleEventRegistration } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
    const [currentDate, setCurrentDate] = useState(new Date());

    // Confirmation Modal
    const [eventToApprove, setEventToApprove] = useState<string | null>(null);

    // Form State
    const [eventName, setEventName] = useState('');
    const [eventDate, setEventDate] = useState('');
    const [eventType, setEventType] = useState<EventType>(EventType.ACTIVITY);

    const handleRequestActivity = (e: React.FormEvent) => {
        e.preventDefault();
        if (!eventName || !eventDate) return;

        addEvent({
            id: `EVT-${Date.now()}`,
            nombre: eventName,
            fecha: eventDate,
            tipo: eventType,
            planAnualFlag: true,
            anexoId: currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId,
            estado: currentUser.role === 'PASTOR_PRINCIPAL' ? 'APROBADO' : 'PENDIENTE'
        });

        setIsModalOpen(false);
        setEventName('');
        setEventDate('');
        notify(currentUser.role === 'PASTOR_PRINCIPAL' ? 'Evento agregado al calendario' : 'Solicitud enviada a revisión');
    };

    const handleRegister = (eventId: string) => {
        const memberId = currentUser.memberId || 'MEM-001';
        toggleEventRegistration(eventId, memberId);
    };

    const confirmApprove = () => {
        if (eventToApprove) {
            updateEvent(eventToApprove, { estado: 'APROBADO' });
            setEventToApprove(null);
            notify("Actividad aprobada oficialmente");
        }
    };

    const isUserRegistered = (eventId: string) => {
        const memberId = currentUser.memberId || 'MEM-001';
        return (eventRegistrations[eventId] || []).includes(memberId);
    };

    // --- CALENDAR LOGIC ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

        const days = [];
        // Empty slots for previous month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Days of current month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    };

    const changeMonth = (delta: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + delta, 1));
    };

    const getEventsForDate = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return events.filter(e => e.fecha === dateStr);
    };

    const calendarDays = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Plan Anual</h2>
                    <p className="text-sm text-slate-500">Calendario de eventos y solicitudes.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button
                        onClick={() => setViewMode('LIST')}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${viewMode === 'LIST' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setViewMode('CALENDAR')}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${viewMode === 'CALENDAR' ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <Calendar className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-slate-900 text-white px-4 py-2 rounded-xl flex items-center shadow-lg hover:bg-black transition-all text-xs font-bold cursor-pointer"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Actividad
                    </button>
                </div>
            </div>

            {viewMode === 'LIST' ? (
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-card">
                    {events.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No hay eventos programados.</p>
                        </div>
                    ) : (
                        events.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()).map((evt, idx) => (
                            <div key={evt.id} className={`p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:bg-slate-50 transition-colors ${idx !== events.length - 1 ? 'border-b border-slate-100' : ''}`}>
                                {/* Date Badge */}
                                <div className="flex row sm:flex-col items-center gap-3 sm:gap-0 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-xl w-full sm:w-auto">
                                    <div className="flex flex-col items-center bg-white sm:bg-slate-100 p-3 rounded-2xl min-w-[70px] border border-slate-100 sm:border-transparent shadow-sm sm:shadow-none">
                                        <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">{new Date(evt.fecha).toLocaleString('es-ES', { month: 'short' }).replace('.', '')}</span>
                                        <span className="text-2xl font-extrabold text-slate-800 leading-none mt-0.5">{new Date(evt.fecha).getDate() + 1}</span>
                                    </div>
                                    <span className="sm:hidden font-bold text-slate-700 truncate">{evt.nombre}</span>
                                </div>

                                <div className="flex-1 min-w-0 hidden sm:block">
                                    <h4 className="font-bold text-lg text-slate-800 truncate">{evt.nombre}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-flex items-center text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wide">
                                            {evt.tipo}
                                        </span>
                                        {evt.anexoId !== 'ANX-01' && (
                                            <span className="inline-flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded flex gap-1">
                                                <MapPin className="w-3 h-3" /> Anexo
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0 justify-end">
                                    {evt.estado === 'PENDIENTE' ? (
                                        <div className="flex items-center gap-2">
                                            <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center shadow-sm">
                                                <Clock className="w-3 h-3 mr-1.5" /> En Revisión
                                            </span>
                                            {currentUser.role === 'PASTOR_PRINCIPAL' && (
                                                <button onClick={() => setEventToApprove(evt.id)} className="px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-glow transition-transform hover:scale-105 cursor-pointer">
                                                    Aprobar
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 w-full sm:w-auto">
                                            <div className="hidden sm:flex text-emerald-600 items-center text-xs font-bold mr-2 bg-emerald-50 px-3 py-1 rounded-full">
                                                <CheckCircle2 className="w-3 h-3 mr-1.5" /> Oficial
                                            </div>

                                            {currentUser.role === 'PASTOR_PRINCIPAL' && (
                                                <button
                                                    onClick={() => sendWhatsApp('', `Recordatorio: ${evt.nombre} el día ${evt.fecha}. Bendiciones!`)}
                                                    className="p-2.5 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-colors cursor-pointer"
                                                    title="Enviar Recordatorio por WhatsApp"
                                                >
                                                    <MessageCircle className="w-4 h-4" />
                                                </button>
                                            )}

                                            {(evt.tipo === EventType.VIGILIA || evt.tipo === EventType.VIAJE || evt.tipo === EventType.AYUNO) && (
                                                <button
                                                    onClick={() => handleRegister(evt.id)}
                                                    className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${isUserRegistered(evt.id)
                                                        ? 'bg-emerald-500 text-white shadow-emerald-200 shadow-lg'
                                                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                        }`}
                                                >
                                                    {isUserRegistered(evt.id) ? (
                                                        <><CheckCircle2 className="w-4 h-4" /> Inscrito (Cancelar)</>
                                                    ) : (
                                                        <><Ticket className="w-4 h-4" /> Inscribirme</>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-card p-6">
                    {/* Calendar Header */}
                    <div className="flex justify-between items-center mb-6">
                        <button onClick={() => changeMonth(-1)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 cursor-pointer"><ChevronLeft className="w-5 h-5 text-slate-600" /></button>
                        <h3 className="text-xl font-bold text-slate-800 capitalize">{monthName}</h3>
                        <button onClick={() => changeMonth(1)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 cursor-pointer"><ChevronRight className="w-5 h-5 text-slate-600" /></button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-2">
                        {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(day => (
                            <div key={day} className="text-center text-xs font-bold text-slate-400 uppercase py-2">{day}</div>
                        ))}

                        {calendarDays.map((date, i) => {
                            if (!date) return <div key={i} className="h-24 bg-slate-50/50 rounded-xl"></div>;

                            const dayEvents = getEventsForDate(date);
                            const isToday = new Date().toDateString() === date.toDateString();

                            return (
                                <div key={i} className={`h-28 border border-slate-100 rounded-xl p-2 flex flex-col gap-1 transition-colors hover:border-blue-200 ${isToday ? 'bg-blue-50/30 ring-2 ring-blue-100' : 'bg-white'}`}>
                                    <span className={`text-xs font-bold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>{date.getDate()}</span>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1">
                                        {dayEvents.map(ev => (
                                            <div key={ev.id} className={`text-[10px] px-1.5 py-1 rounded font-bold truncate cursor-pointer hover:opacity-80 ${ev.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`} title={ev.nombre}>
                                                {ev.nombre}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* REQUEST MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative border border-white/50">
                        <button
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-slate-800">Solicitar Actividad</h3>
                            <p className="text-sm text-slate-500">Agrega un evento al calendario de la iglesia.</p>
                        </div>

                        <form onSubmit={handleRequestActivity} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Nombre del Evento</label>
                                <input
                                    value={eventName}
                                    onChange={e => setEventName(e.target.value)}
                                    placeholder="Ej. Vigilia de Jóvenes"
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Fecha</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={eventDate}
                                            onChange={e => setEventDate(e.target.value)}
                                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-200"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Tipo</label>
                                    <select
                                        value={eventType}
                                        onChange={e => setEventType(e.target.value as EventType)}
                                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-200 appearance-none"
                                    >
                                        {Object.values(EventType).map(t => (
                                            <option key={t} value={t}>{t}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-2">
                                <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-transform active:scale-95 flex justify-center gap-2 cursor-pointer">
                                    {currentUser.role === 'PASTOR_PRINCIPAL' ? 'Crear Evento Oficial' : 'Enviar Solicitud'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRM APPROVE MODAL */}
            {eventToApprove && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl p-8 relative border border-white/50 text-center">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">¿Oficializar Evento?</h3>
                        <p className="text-sm text-slate-500 mb-6">
                            El evento se agregará al Plan Anual y será visible para toda la congregación.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setEventToApprove(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Cancelar</button>
                            <button onClick={confirmApprove} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg cursor-pointer">Aprobar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanAnual;
