
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../App.tsx';
import { User, Lock, Bell, LogOut, Activity, X, Save, Camera, Search, RefreshCw, AlertTriangle, Play, Download, Upload, Database, UserPlus, Trash2, ShieldAlert, UserCheck } from 'lucide-react';
import { SystemUser, UserRole, Member, SpiritualStatus } from '../types';

const Settings: React.FC = () => {
    const { currentUser, setCurrentUser, auditLogs, notify, runNightlyProcess, resetSystem, systemUsers, addSystemUser, deleteSystemUser, members, addMember, anexos } = useApp();
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);
    const [auditFilter, setAuditFilter] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Storage usage
    const [storageUsage, setStorageUsage] = useState(0);

    // New User Form State
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>('LIDER_ANEXO');
    const [newUserAnexoId, setNewUserAnexoId] = useState('');

    // Linking Logic
    const [createProfileMode, setCreateProfileMode] = useState(false);
    const [newUserMemberId, setNewUserMemberId] = useState(''); // If selecting existing
    const [newProfileName, setNewProfileName] = useState(''); // If creating new

    useEffect(() => {
        const calculateStorage = () => {
            let total = 0;
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    total += (localStorage[key].length * 2);
                }
            }
            // Approx in KB
            setStorageUsage(Math.round(total / 1024));
        };
        calculateStorage();
    }, []);

    const filteredLogs = auditLogs.filter(log =>
        log.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
        log.target.toLowerCase().includes(auditFilter.toLowerCase())
    );

    const handleBackupDownload = () => {
        const data = {
            anexos: localStorage.getItem('shekinah_anexos'),
            members: localStorage.getItem('shekinah_members'),
            finances: localStorage.getItem('shekinah_finances'),
            events: localStorage.getItem('shekinah_events'),
            attendance: localStorage.getItem('shekinah_attendance'),
            courses: localStorage.getItem('shekinah_courses'),
            epmi: localStorage.getItem('shekinah_epmi'),
            trips: localStorage.getItem('shekinah_trips'),
            history: localStorage.getItem('shekinah_history'),
            reports: localStorage.getItem('shekinah_reports'),
            users: localStorage.getItem('shekinah_users'),
            timestamp: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shekinah_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        notify("Copia de seguridad descargada exitosamente");
    };

    const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.members && data.anexos) {
                    if (window.confirm("¿Estás seguro? Esto reemplazará todos los datos actuales con la copia de seguridad.")) {
                        localStorage.setItem('shekinah_anexos', data.anexos || '[]');
                        localStorage.setItem('shekinah_members', data.members || '[]');
                        localStorage.setItem('shekinah_finances', data.finances || '[]');
                        localStorage.setItem('shekinah_events', data.events || '[]');
                        localStorage.setItem('shekinah_attendance', data.attendance || '{}');
                        localStorage.setItem('shekinah_courses', data.courses || '[]');
                        localStorage.setItem('shekinah_epmi', data.epmi || '[]');
                        localStorage.setItem('shekinah_trips', data.trips || '[]');
                        localStorage.setItem('shekinah_history', data.history || '[]');
                        localStorage.setItem('shekinah_reports', data.reports || '[]');
                        localStorage.setItem('shekinah_users', data.users || '[]');

                        notify("Sistema restaurado. Recargando...", "success");
                        setTimeout(() => window.location.reload(), 1500);
                    }
                } else {
                    notify("El archivo no es una copia de seguridad válida", "error");
                }
            } catch (err) {
                notify("Error al leer el archivo de respaldo", "error");
            }
        };
        reader.readAsText(file);
    };

    const handleCreateUser = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic Validation
        if (!newUserEmail || !newUserPassword) {
            notify("Correo y contraseña son obligatorios", "error");
            return;
        }

        let finalMemberId = newUserMemberId;
        let finalMemberName = '';

        // LOGIC: Create new member profile if mode is selected
        if (createProfileMode) {
            if (!newProfileName) {
                notify("Debe ingresar el nombre del nuevo miembro", "error");
                return;
            }

            const newMemberId = `MEM-${Date.now()}`;
            const newMember: Member = {
                id: newMemberId,
                nombres: newProfileName,
                telefono: '',
                sex: 'M',
                anexoId: newUserAnexoId || 'ANX-01', // Default to Central if global
                estatus: SpiritualStatus.STABLE, // Leaders usually start Stable
                cargo: 'Líder',
                attendance_level: 'VERDE',
                fidelity_level: 'VERDE',
                service_level: 'VERDE',
                candidate_epmi: false,
                completed_basicos: true, // Assume leaders have basics
                coursesCompletedIds: [],
                ministryIds: [],
                photoUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newProfileName}`
            };

            addMember(newMember);
            finalMemberId = newMemberId;
            finalMemberName = newProfileName;
        } else {
            // Linking existing
            if (!newUserMemberId) {
                notify("Debe seleccionar un miembro existente para vincular", "error");
                return;
            }
            const existingMember = members.find(m => m.id === newUserMemberId);
            finalMemberName = existingMember ? existingMember.nombres : 'Usuario Sistema';
        }

        const newUser: SystemUser = {
            id: `USR-${Date.now()}`,
            email: newUserEmail,
            password: newUserPassword,
            role: newUserRole,
            memberId: finalMemberId,
            anexoId: newUserAnexoId || 'ALL',
            name: finalMemberName
        };

        addSystemUser(newUser);
        setShowUserModal(false);

        // Reset Form
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserMemberId('');
        setNewProfileName('');
        setCreateProfileMode(false);

        notify(createProfileMode ? "Usuario y Perfil de Miembro creados" : "Usuario creado y vinculado");
    };

    return (
        <div className="space-y-8 animate-fadeIn max-w-2xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-2xl shadow-sm">
                    <User className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Configuración</h2>
                    <p className="text-sm text-slate-500 font-medium">Preferencias de cuenta y sistema</p>
                </div>
            </div>

            <div className="bg-white rounded-[2rem] shadow-xl border border-slate-50 overflow-hidden">
                {/* Profile Section */}
                <div className="p-8 border-b border-slate-100 flex items-center gap-6">
                    <div className="relative group cursor-pointer" onClick={() => setShowProfileModal(true)}>
                        <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`}
                            className="w-20 h-20 rounded-full bg-slate-100 group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Camera className="w-6 h-6 text-slate-600" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">{currentUser.name}</h3>
                        <p className="text-sm text-blue-600 font-bold uppercase tracking-wide">{currentUser.role.replace('_', ' ')}</p>
                        <button onClick={() => setShowProfileModal(true)} className="text-xs text-slate-400 mt-2 hover:text-slate-600 underline">Editar perfil</button>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                                <Lock className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Seguridad</h4>
                                <p className="text-xs text-slate-400">Contraseña y autenticación</p>
                            </div>
                        </div>
                        <button onClick={() => setShowPasswordModal(true)} className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 cursor-pointer">Cambiar</button>
                    </div>

                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-white transition-colors">
                                <Bell className="w-5 h-5 text-slate-600" />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700">Notificaciones</h4>
                                <p className="text-xs text-slate-400">Alertas pastorales y avisos</p>
                            </div>
                        </div>
                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-blue-600" />
                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
                        </div>
                    </div>
                </div>

                {/* USER MANAGEMENT (PDF 8.2 - Pastor Only) */}
                {currentUser.role === 'PASTOR_PRINCIPAL' ? (
                    <div className="border-t border-slate-100 p-8 bg-indigo-50/30">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-indigo-500" /> Usuarios del Sistema
                                </h4>
                                <p className="text-[10px] text-slate-500 mt-1">Gestión de accesos para líderes y staff.</p>
                            </div>
                            <button
                                onClick={() => setShowUserModal(true)}
                                className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-black shadow-sm cursor-pointer"
                            >
                                + Nuevo Usuario
                            </button>
                        </div>

                        <div className="space-y-3">
                            {systemUsers.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 text-xs">{user.name}</p>
                                            <p className="text-[10px] text-slate-400">{user.email} • <span className="text-indigo-500 font-bold">{user.role.replace('_', ' ')}</span></p>
                                        </div>
                                    </div>
                                    {user.role !== 'PASTOR_PRINCIPAL' && (
                                        <button
                                            onClick={() => deleteSystemUser(user.id)}
                                            className="text-slate-300 hover:text-red-500 transition-colors p-2 cursor-pointer"
                                            title="Eliminar Acceso"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {systemUsers.length === 0 && <p className="text-center text-xs text-slate-400 italic">No hay usuarios adicionales.</p>}
                        </div>
                    </div>
                ) : (
                    <div className="border-t border-slate-100 p-6 bg-slate-50 text-center">
                        <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> Gestión de usuarios restringida al Pastor Principal.
                        </p>
                    </div>
                )}

                {/* BACKUP & RESTORE (DATA SAFETY) */}
                <div className="border-t border-slate-100 p-8 bg-sky-50/30">
                    <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Save className="w-4 h-4 text-slate-400" /> Copia de Seguridad (Datos)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            onClick={handleBackupDownload}
                            className="flex flex-col items-center justify-center p-6 bg-white border border-sky-100 rounded-2xl hover:shadow-md transition-all group cursor-pointer"
                        >
                            <Download className="w-8 h-8 text-sky-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-bold text-slate-700 uppercase">Descargar Copia</span>
                            <span className="text-[10px] text-slate-400 mt-1">Guardar en mi PC</span>
                        </button>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex flex-col items-center justify-center p-6 bg-white border border-sky-100 rounded-2xl hover:shadow-md transition-all group cursor-pointer"
                        >
                            <Upload className="w-8 h-8 text-slate-400 mb-3 group-hover:text-sky-500 transition-colors" />
                            <span className="text-xs font-bold text-slate-700 uppercase">Restaurar Copia</span>
                            <span className="text-[10px] text-slate-400 mt-1">Desde archivo .json</span>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept=".json"
                                onChange={handleRestoreBackup}
                            />
                        </button>
                    </div>
                </div>

                {/* SYSTEM MAINTENANCE (SIMULATION) */}
                {currentUser.role === 'PASTOR_PRINCIPAL' && (
                    <div className="border-t border-slate-100 p-8 bg-slate-50/30">
                        <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <RefreshCw className="w-4 h-4 text-slate-400" /> Mantenimiento del Sistema
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 bg-white border border-slate-200 rounded-2xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase">Proceso Nocturno</span>
                                    <Activity className="w-4 h-4 text-emerald-500" />
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Ejecuta el Cron Job que revisa asistencias bajas, reportes faltantes y genera alertas automáticas.</p>
                                <button
                                    onClick={runNightlyProcess}
                                    className="w-full py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs hover:bg-emerald-100 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <Play className="w-3 h-3" /> Ejecutar Ahora
                                </button>
                            </div>
                            <div className="p-4 bg-white border border-red-100 rounded-2xl">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-red-400 uppercase">Restaurar Datos</span>
                                    <AlertTriangle className="w-4 h-4 text-red-400" />
                                </div>
                                <p className="text-xs text-slate-400 mb-4">Borra la memoria local y restaura los datos de ejemplo originales.</p>
                                <button
                                    onClick={() => {
                                        if (window.confirm("¿Estás seguro de reiniciar toda la base de datos?")) resetSystem();
                                    }}
                                    className="w-full py-2 bg-red-50 text-red-500 font-bold rounded-xl text-xs hover:bg-red-100 flex items-center justify-center gap-2 cursor-pointer"
                                >
                                    <RefreshCw className="w-3 h-3" /> Resetear
                                </button>
                            </div>
                        </div>

                        {/* Storage Stats */}
                        <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-4">
                            <div className="bg-slate-100 p-2 rounded-xl">
                                <Database className="w-5 h-5 text-slate-500" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold text-slate-600">Almacenamiento Local (PWA)</span>
                                    <span className="text-xs font-bold text-slate-400">{storageUsage} KB utilizados</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${Math.min(100, (storageUsage / 5000) * 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AUDIT LOG SECTION (PASTOR ONLY) */}
                {currentUser.role === 'PASTOR_PRINCIPAL' && (
                    <div className="border-t border-slate-100 p-8 bg-slate-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-slate-400" /> Auditoría del Sistema
                            </h4>
                            <div className="relative">
                                <input
                                    className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-600"
                                    placeholder="Filtrar acción..."
                                    value={auditFilter}
                                    onChange={e => setAuditFilter(e.target.value)}
                                />
                                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2" />
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto">
                            {filteredLogs.length === 0 ? (
                                <p className="p-4 text-xs text-center text-slate-400">Sin registros coincidentes.</p>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {filteredLogs.map(log => (
                                        <div key={log.id} className="p-3 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-start">
                                                <span className="text-xs font-extrabold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase">{log.action}</span>
                                                <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                                            </div>
                                            <div className="mt-2">
                                                <p className="text-xs font-bold text-slate-600">{log.target}</p>
                                                <p className="text-[10px] text-slate-500">{log.details}</p>
                                            </div>
                                            <p className="text-[10px] text-slate-400 mt-1 italic text-right">Por: {log.actorName}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="p-8 bg-slate-50 border-t border-slate-100">
                    <button onClick={() => {
                        window.location.href = '#/login';
                        window.location.reload();
                    }} className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors flex justify-center items-center gap-2 cursor-pointer">
                        <LogOut className="w-5 h-5" /> Cerrar Sesión
                    </button>
                    <p className="text-center text-[10px] text-slate-400 mt-4 font-bold tracking-widest uppercase">Shekinah ChMS v1.0</p>
                </div>
            </div>

            {/* CREATE USER MODAL */}
            {showUserModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-8 relative">
                        <button onClick={() => setShowUserModal(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 cursor-pointer"><X className="w-5 h-5 text-slate-400" /></button>
                        <h3 className="text-xl font-bold text-slate-800 mb-6">Nuevo Usuario del Sistema</h3>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Correo Electrónico</label>
                                <input
                                    type="email"
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 font-bold"
                                    value={newUserEmail}
                                    onChange={e => setNewUserEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Contraseña Temporal</label>
                                <input
                                    type="text"
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200"
                                    value={newUserPassword}
                                    onChange={e => setNewUserPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Rol</label>
                                    <select
                                        className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                        value={newUserRole}
                                        onChange={e => setNewUserRole(e.target.value as UserRole)}
                                    >
                                        <option value="PASTOR_GENERAL">Pastor General</option>
                                        <option value="PASTORA_GENERAL">Pastora General</option>
                                        <option value="PASTOR_PRINCIPAL">Pastor Principal (Legacy)</option>
                                        <option value="PASTOR_EJECUTIVO">Pastor Ejecutivo</option>
                                        <option value="SECRETARIA_PASTORAL">Secretaria Pastoral</option>
                                        <option value="MINISTRO">Ministro</option>
                                        <option value="LIDER_ANEXO">Líder de Anexo</option>
                                        <option value="LIDER_INTERCESION">Líder de Intercesión</option>
                                        <option value="MAESTRO_CASA">Maestro</option>
                                        <option value="SECRETARIA_CASA">Secretaria Casa</option>
                                        <option value="SECRETARIA_ANEXO">Secretaria Anexo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Alcance (Anexo)</label>
                                    <select
                                        className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 text-sm"
                                        value={newUserAnexoId}
                                        onChange={e => setNewUserAnexoId(e.target.value)}
                                    >
                                        <option value="">-- Global --</option>
                                        {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* --- PROFILE LINKING SECTION --- */}
                            <div className="border-t border-slate-100 pt-4 mt-2">
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1 flex items-center justify-between mb-2">
                                    <span>Vincular Miembro</span>
                                    <button
                                        type="button"
                                        onClick={() => setCreateProfileMode(!createProfileMode)}
                                        className="text-blue-600 hover:underline cursor-pointer"
                                    >
                                        {createProfileMode ? 'Buscar Existente' : 'Crear Nuevo Perfil'}
                                    </button>
                                </label>

                                {createProfileMode ? (
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                                        <label className="text-[10px] font-bold text-blue-700 uppercase mb-1 block">Nombre del Nuevo Miembro</label>
                                        <input
                                            className="w-full p-2 bg-white rounded-lg border border-blue-200 outline-none focus:ring-2 focus:ring-blue-200 text-sm font-bold"
                                            placeholder="Ej. Pastor Invitado"
                                            value={newProfileName}
                                            onChange={e => setNewProfileName(e.target.value)}
                                        />
                                        <p className="text-[10px] text-blue-500 mt-1 flex items-center gap-1"><UserCheck className="w-3 h-3" /> Se creará una ficha de miembro automática.</p>
                                    </div>
                                ) : (
                                    <select
                                        className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 text-sm font-bold"
                                        value={newUserMemberId}
                                        onChange={e => setNewUserMemberId(e.target.value)}
                                    >
                                        <option value="">-- Seleccionar Persona --</option>
                                        {members.map(m => <option key={m.id} value={m.id}>{m.nombres}</option>)}
                                    </select>
                                )}
                            </div>

                            <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black shadow-lg mt-2 cursor-pointer">Crear Acceso</button>
                        </form>
                    </div>
                </div>
            )}

            {/* PASSWORD CHANGE MODAL */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 relative">
                        <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Cambiar Contraseña</h3>
                        <div className="space-y-4">
                            <input type="password" placeholder="Contraseña actual" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200" />
                            <input type="password" placeholder="Nueva contraseña" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200" />
                            <input type="password" placeholder="Confirmar contraseña" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200" />
                            <button
                                onClick={() => {
                                    notify("Contraseña actualizada correctamente");
                                    setShowPasswordModal(false);
                                }}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
                            >
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PROFILE EDIT MODAL */}
            {showProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 relative">
                        <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-slate-100 cursor-pointer"><X className="w-4 h-4 text-slate-400" /></button>
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Editar Perfil</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre Mostrado</label>
                                <input
                                    defaultValue={currentUser.name}
                                    onChange={(e) => setCurrentUser({ ...currentUser, name: e.target.value })}
                                    className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 font-bold text-slate-700"
                                />
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.name}`} className="w-12 h-12 rounded-full bg-white" />
                                <p className="text-xs text-slate-400">El avatar se genera automáticamente basado en tu nombre.</p>
                            </div>
                            <button
                                onClick={() => {
                                    notify("Perfil actualizado");
                                    setShowProfileModal(false);
                                }}
                                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 cursor-pointer"
                            >
                                <Save className="w-4 h-4" /> Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
