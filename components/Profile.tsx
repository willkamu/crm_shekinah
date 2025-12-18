
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { SpiritualStatus, UserRole, Member } from '../types';
import { User, BookOpen, MapPin, Calendar, Heart, Shield, CheckCircle2, Award, Home, KeyRound, Building } from 'lucide-react';

const Profile: React.FC = () => {
    const { currentUser, members, anexos, teachingHouses, courses, ministries, trips } = useApp();
    const [activeTab, setActiveTab] = useState<'RESUMEN' | 'CURSOS' | 'VIAJES'>('RESUMEN');

    // Find the actual member data linked to the current logged-in user
    // CORRECTION: Provide a robust fallback object to prevent crashes if no memberId is linked.
    const myData = members.find(m => m.id === currentUser.memberId) || {
        id: `USR-${Date.now()}`,
        nombres: currentUser.name,
        telefono: 'N/A',
        sex: 'M',
        estatus: SpiritualStatus.STABLE,
        cargo: 'Miembro',
        attendance_level: 'VERDE',
        fidelity_level: 'VERDE',
        service_level: 'VERDE',
        candidate_epmi: false,
        completed_basicos: false,
        coursesCompletedIds: [],
        ministryIds: [],
        anexoId: currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId,
        photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`
    } as Member;

    const myAnnex = anexos.find(a => a.id === myData.anexoId);
    const myHouse = teachingHouses.find(h => h.id === myData.teachingHouseId);

    const basicsCompleted = myData.coursesCompletedIds.filter(id => courses.find(c => c.id === id)?.type === 'BASICO').length;
    const basicsTotal = 7;
    const basicsProgress = (basicsCompleted / basicsTotal) * 100;

    const myTrips = trips.filter(t => t.participants.some(p => p.memberId === myData.id && p.status === 'APROBADO'));

    const formatRole = (role: UserRole) => {
        return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getAnexoName = (anexoId: string | 'ALL') => {
        if (anexoId === 'ALL') return 'Acceso Global';
        const anexo = anexos.find(a => a.id === anexoId);
        return anexo?.nombre || 'Anexo Desconocido';
    };

    return (
        <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">

            {/* Profile Header Card */}
            <div className="bg-white rounded-[2rem] shadow-card overflow-hidden border border-slate-50 relative">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-slate-900 relative">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-10 translate-x-10"></div>
                </div>
                <div className="px-8 pb-8 text-center -mt-12">
                    <div className="relative inline-block">
                        <img
                            src={myData.photoUrl}
                            alt="Profile"
                            className="w-24 h-24 rounded-3xl border-4 border-white shadow-lg object-cover bg-white"
                        />
                        <div className="absolute bottom-0 right-0 bg-emerald-500 text-white p-1 rounded-full border-2 border-white">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 mt-4">{myData.nombres}</h2>
                    <div className="flex items-center justify-center gap-2 mt-2 text-sm font-medium text-slate-500">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {myAnnex?.nombre}</span>
                        <span>•</span>
                        <span className="text-blue-600">{myData.estatus}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-50">
                {[
                    { id: 'RESUMEN', label: 'Mi Resumen' },
                    { id: 'CURSOS', label: 'Mis Cursos' },
                    { id: 'VIAJES', label: 'Mis Viajes' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === tab.id ? 'bg-blue-50 text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENT */}
            <div className="bg-white p-6 rounded-[2rem] shadow-card border border-slate-50 min-h-[400px]">

                {/* --- TAB: RESUMEN --- */}
                {activeTab === 'RESUMEN' && (
                    <div className="space-y-6">
                        {/* Access Info Card */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Información de Acceso</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-indigo-100 p-2 rounded-lg text-indigo-500"><KeyRound className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Rol Asignado</p>
                                        <p className="font-bold text-slate-700 text-sm">{formatRole(currentUser.role)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="bg-sky-100 p-2 rounded-lg text-sky-500"><Building className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">Anexo</p>
                                        <p className="font-bold text-slate-700 text-sm">{getAnexoName(currentUser.anexoId)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Progress Card */}
                        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                            <div className="flex justify-between items-end mb-2">
                                <div>
                                    <h4 className="font-bold text-slate-700 text-sm">Discipulado Básico</h4>
                                    <p className="text-xs text-slate-400">Camino al crecimiento</p>
                                </div>
                                <span className="text-2xl font-extrabold text-blue-600">{basicsCompleted}/{basicsTotal}</span>
                            </div>
                            <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${basicsProgress}%` }}></div>
                            </div>
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                                <div className="bg-orange-50 text-orange-500 p-3 rounded-xl mb-3"><Home className="w-6 h-6" /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Mi Casa</span>
                                <span className="font-bold text-slate-700 mt-1">{myHouse?.nombre || 'Sin asignar'}</span>
                            </div>
                            <div className="p-4 rounded-2xl border border-slate-100 flex flex-col items-center text-center">
                                <div className="bg-emerald-50 text-emerald-500 p-3 rounded-xl mb-3"><Calendar className="w-6 h-6" /></div>
                                <span className="text-xs font-bold text-slate-400 uppercase">Asistencia</span>
                                <span className="font-bold text-slate-700 mt-1">{myData.attendance_level === 'VERDE' ? 'Excelente' : 'Regular'}</span>
                            </div>
                        </div>

                        {/* Ministries */}
                        <div>
                            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2"><Shield className="w-4 h-4 text-slate-400" /> Mis Ministerios</h4>
                            {myData.ministryIds.length > 0 ? (
                                <div className="space-y-2">
                                    {myData.ministryIds.map(minId => {
                                        const min = ministries.find(m => m.id === minId);
                                        return (
                                            <div key={minId} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-50">
                                                <span className="font-bold text-indigo-900 text-sm">{min?.nombre}</span>
                                                <span className="text-xs bg-white px-2 py-1 rounded text-indigo-500 font-bold shadow-sm">{myData.ministryRoles?.[minId] || 'Miembro'}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            ) : (
                                <p className="text-xs text-slate-400 italic">No participas en ministerios aún.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* --- TAB: CURSOS --- */}
                {activeTab === 'CURSOS' && (
                    <div className="space-y-4">
                        {courses.filter(c => c.type === 'BASICO').sort((a, b) => a.orden - b.orden).map(course => {
                            const isCompleted = myData.coursesCompletedIds.includes(course.id);
                            return (
                                <div key={course.id} className={`flex items-center p-4 rounded-2xl border ${isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100'}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 ${isCompleted ? 'bg-emerald-200 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : course.orden}
                                    </div>
                                    <div>
                                        <h4 className={`font-bold text-sm ${isCompleted ? 'text-emerald-900' : 'text-slate-600'}`}>{course.nombre}</h4>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">{isCompleted ? 'Completado' : 'Pendiente'}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* --- TAB: VIAJES --- */}
                {activeTab === 'VIAJES' && (
                    <div className="space-y-4">
                        {myTrips.length > 0 ? myTrips.map(trip => (
                            <div key={trip.id} className="bg-blue-50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/20 rounded-full blur-2xl"></div>
                                <h4 className="font-bold text-slate-800">{trip.destino}</h4>
                                <p className="text-xs text-blue-600 font-medium mb-3">{trip.fechaSalida}</p>
                                <span className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-blue-500 shadow-sm uppercase">
                                    <Award className="w-3 h-3" /> Misionero
                                </span>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <MapPin className="w-8 h-8 text-slate-300" />
                                </div>
                                <p className="text-sm text-slate-400 font-medium">Aún no has participado en viajes misioneros.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Profile;
