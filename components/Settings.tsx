
import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../App.tsx';
import { User, Lock, Bell, LogOut, Activity, X, Save, Camera, Search, RefreshCw, AlertTriangle, Play, Download, Upload, Database } from 'lucide-react';

const Settings: React.FC = () => {
  const { currentUser, setCurrentUser, auditLogs, notify, runNightlyProcess, resetSystem } = useApp();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [auditFilter, setAuditFilter] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Storage usage
  const [storageUsage, setStorageUsage] = useState(0);

  useEffect(() => {
      const calculateStorage = () => {
          let total = 0;
          for(let key in localStorage) {
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

      <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-50 overflow-hidden">
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
                  <p className="text-sm text-brand-blue font-bold uppercase tracking-wide">{currentUser.role.replace('_', ' ')}</p>
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
                  <button onClick={() => setShowPasswordModal(true)} className="text-xs font-bold bg-slate-100 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200">Cambiar</button>
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
                      <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 checked:border-brand-blue"/>
                      <label htmlFor="toggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-slate-300 cursor-pointer"></label>
                  </div>
              </div>
          </div>

          {/* BACKUP & RESTORE (DATA SAFETY) */}
          <div className="border-t border-slate-100 p-8 bg-sky-50/30">
              <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Save className="w-4 h-4 text-slate-400" /> Copia de Seguridad (Datos)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button 
                    onClick={handleBackupDownload}
                    className="flex flex-col items-center justify-center p-6 bg-white border border-sky-100 rounded-2xl hover:shadow-md transition-all group"
                  >
                      <Download className="w-8 h-8 text-sky-500 mb-3 group-hover:scale-110 transition-transform" />
                      <span className="text-xs font-bold text-slate-700 uppercase">Descargar Copia</span>
                      <span className="text-[10px] text-slate-400 mt-1">Guardar en mi PC</span>
                  </button>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-6 bg-white border border-sky-100 rounded-2xl hover:shadow-md transition-all group"
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
                            className="w-full py-2 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs hover:bg-emerald-100 flex items-center justify-center gap-2"
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
                                if(window.confirm("¿Estás seguro de reiniciar toda la base de datos?")) resetSystem();
                            }}
                            className="w-full py-2 bg-red-50 text-red-500 font-bold rounded-xl text-xs hover:bg-red-100 flex items-center justify-center gap-2"
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
                              <div className="bg-brand-blue h-full transition-all duration-1000" style={{ width: `${Math.min(100, (storageUsage / 5000) * 100)}%` }}></div>
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
                            className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-brand-blue"
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
              <button className="w-full py-4 text-red-500 font-bold hover:bg-red-50 rounded-xl transition-colors flex justify-center items-center gap-2">
                  <LogOut className="w-5 h-5" /> Cerrar Sesión
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-4 font-bold tracking-widest uppercase">Shekinah ChMS v1.0</p>
          </div>
      </div>

      {/* PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl p-6 relative">
                  <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400"/></button>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Cambiar Contraseña</h3>
                  <div className="space-y-4">
                      <input type="password" placeholder="Contraseña actual" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light" />
                      <input type="password" placeholder="Nueva contraseña" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light" />
                      <input type="password" placeholder="Confirmar contraseña" className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light" />
                      <button 
                        onClick={() => {
                            notify("Contraseña actualizada correctamente");
                            setShowPasswordModal(false);
                        }}
                        className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-dark transition-colors"
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
                  <button onClick={() => setShowProfileModal(false)} className="absolute top-4 right-4 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X className="w-4 h-4 text-slate-400"/></button>
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Editar Perfil</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nombre Mostrado</label>
                          <input 
                            defaultValue={currentUser.name} 
                            onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700" 
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
                        className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-brand-dark transition-colors flex justify-center items-center gap-2"
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
