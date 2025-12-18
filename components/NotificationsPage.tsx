
import React from 'react';
import { useApp } from '../App.tsx';
import { Bell, Check, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const NotificationsPage: React.FC = () => {
    const { notifications, markNotificationRead, notify } = useApp();

    const handleMarkAllRead = () => {
        notifications.forEach(n => markNotificationRead(n.id));
        notify("Todas las notificaciones marcadas como leídas");
    };

    return (
        <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link to="/" className="p-3 bg-white rounded-xl shadow-sm border border-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Centro de Mensajes</h2>
                    <p className="text-sm text-slate-500 font-medium">Avisos del sistema y pastorales</p>
                </div>
                <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                >
                    Marcar todo leído
                </button>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 overflow-hidden min-h-[60vh]">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-20 text-slate-400">
                        <div className="bg-slate-50 p-6 rounded-full mb-4">
                            <Bell className="w-10 h-10 opacity-20" />
                        </div>
                        <p className="font-medium">No tienes notificaciones pendientes.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {notifications.map(notif => (
                            <Link
                                key={notif.id}
                                to={notif.linkTo || '#'}
                                onClick={() => markNotificationRead(notif.id)}
                                className={`flex gap-4 p-6 hover:bg-slate-50 transition-colors cursor-pointer group ${!notif.read ? 'bg-blue-50/30' : ''}`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.type === 'ALERT' ? 'bg-red-100 text-red-500' :
                                    notif.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-500' :
                                        'bg-blue-100 text-blue-500'
                                    }`}>
                                    <Bell className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className={`text-base font-bold ${!notif.read ? 'text-slate-800' : 'text-slate-600'}`}>
                                            {notif.title}
                                            {!notif.read && <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>}
                                        </h4>
                                        <span className="text-xs text-slate-400 font-medium">{notif.date}</span>
                                    </div>
                                    <p className="text-sm text-slate-500 leading-relaxed">{notif.message}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
