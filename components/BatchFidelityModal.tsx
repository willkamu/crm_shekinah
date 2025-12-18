import React, { useState, useMemo } from 'react';
import { useApp } from '../App.tsx';
import { FidelidadEstado } from '../types';
import { X, Save, Search, Filter, UploadCloud, FileText, CheckCircle, AlertTriangle } from 'lucide-react';

interface BatchFidelityModalProps {
    onClose: () => void;
}

const BatchFidelityModal: React.FC<BatchFidelityModalProps> = ({ onClose }) => {
    const { members, anexos, updateMemberBatchFidelity, currentUser } = useApp();

    // Filters & UX State
    const [filterAnexo, setFilterAnexo] = useState<string>(currentUser.anexoId === 'ALL' ? 'ALL' : currentUser.anexoId);
    const [filterStatus, setFilterStatus] = useState<FidelidadEstado | 'ALL'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'MANUAL' | 'CSV'>('MANUAL');

    // CSV State
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [csvPreview, setCsvPreview] = useState<any[]>([]); // This state is declared but not used in the provided snippet. Keeping it as per original.
    const [csvStats, setCsvStats] = useState({ total: 0, valid: 0, error: 0 });

    // Updates State: Map memberId -> New Status
    const [updates, setUpdates] = useState<Record<string, FidelidadEstado>>({});

    const filteredMembers = useMemo(() => {
        return members.filter(m => {
            if (filterAnexo !== 'ALL' && m.anexoId !== filterAnexo) return false;
            if (filterStatus !== 'ALL' && m.fidelidad_estado !== filterStatus) return false;
            if (searchTerm && !m.nombres.toLowerCase().includes(searchTerm.toLowerCase())) return false;
            return true;
        });
    }, [members, filterAnexo, filterStatus, searchTerm]);

    const handleStatusChange = (memberId: string, newStatus: FidelidadEstado) => {
        setUpdates(prev => ({
            ...prev,
            [memberId]: newStatus
        }));
    };

    const handleSave = () => {
        const payload = Object.entries(updates).map(([memberId, status]) => ({
            memberId,
            status
        }));

        if (payload.length === 0) {
            onClose();
            return;
        }

        updateMemberBatchFidelity(payload);
        onClose();
    };

    const getStatusColor = (status?: FidelidadEstado) => {
        switch (status) {
            case FidelidadEstado.FIDEL: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case FidelidadEstado.INTERMITENTE: return 'text-amber-600 bg-amber-50 border-amber-200';
            case FidelidadEstado.BAJA: return 'text-orange-600 bg-orange-50 border-orange-200';
            case FidelidadEstado.NINGUNA: return 'text-red-600 bg-red-50 border-red-200';
            default: return 'text-slate-400 bg-slate-50 border-slate-200';
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setCsvFile(file);
        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target?.result as string;
            const lines = text.split('\n');
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

            const dniIndex = headers.indexOf('dni');
            const estadoIndex = headers.indexOf('estado_diezmo');

            if (dniIndex === -1 || estadoIndex === -1) {
                alert('El archivo CSV debe tener columnas "dni" y "estado_diezmo"');
                setCsvFile(null);
                return;
            }

            const parsedUpdates: Record<string, FidelidadEstado> = {};
            let valid = 0;
            let error = 0;

            for (let i = 1; i < lines.length; i++) {
                if (!lines[i].trim()) continue;
                const cols = lines[i].split(',').map(c => c.trim());
                const dni = cols[dniIndex];
                const rawStatus = cols[estadoIndex]?.toUpperCase();

                // Match by DNI
                const member = members.find(m => m.dni === dni);

                let mappedStatus: FidelidadEstado | null = null;
                if (rawStatus === 'SI') mappedStatus = FidelidadEstado.FIDEL;
                else if (rawStatus === 'INTERMITENTE') mappedStatus = FidelidadEstado.INTERMITENTE;
                else if (rawStatus === 'NO') mappedStatus = FidelidadEstado.BAJA;
                else if (rawStatus === 'SIN_INFO') mappedStatus = FidelidadEstado.SIN_INFO;

                if (member && mappedStatus) {
                    parsedUpdates[member.id] = mappedStatus;
                    valid++;
                } else {
                    error++;
                }
            }

            setUpdates(parsedUpdates);
            setCsvStats({ total: lines.length - 1, valid, error });
        };
        reader.readAsText(file);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/50">

                {/* Header */}
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800">Carga Masiva de Fidelidad</h2>
                        <p className="text-slate-500 font-medium text-sm">Actualice el estatus de múltiples miembros a la vez</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50 px-8 pt-4 gap-6">
                    <button
                        onClick={() => setActiveTab('MANUAL')}
                        className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'MANUAL' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Selección Manual
                    </button>
                    {(currentUser.role === 'PASTOR_GENERAL' || currentUser.role === 'PASTORA_GENERAL' || currentUser.role === 'SECRETARIA_PASTORAL') && (
                        <button
                            onClick={() => setActiveTab('CSV')}
                            className={`pb-4 px-2 font-bold text-sm transition-all border-b-2 ${activeTab === 'CSV' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Carga Masiva (CSV)
                        </button>
                    )}
                </div>

                {activeTab === 'MANUAL' ? (
                    <>
                        {/* Filters */}
                        <div className="p-6 bg-slate-50/50 flex flex-wrap gap-4 border-b border-slate-100">
                            <div className="flex-1 relative min-w-[200px]">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Buscar miembro..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-200 font-medium text-slate-700"
                                />
                            </div>

                            {currentUser.role === 'PASTOR_PRINCIPAL' || currentUser.role === 'PASTOR_GENERAL' ? (
                                <select
                                    value={filterAnexo}
                                    onChange={e => setFilterAnexo(e.target.value)}
                                    className="px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-200 font-bold text-slate-600"
                                >
                                    <option value="ALL">Todos los Anexos</option>
                                    {anexos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                                </select>
                            ) : null}

                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="px-4 py-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-blue-200 font-bold text-slate-600"
                            >
                                <option value="ALL">Todos los Estados</option>
                                {Object.values(FidelidadEstado).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                    <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <th className="p-4 rounded-l-xl bg-slate-50">Miembro</th>
                                        <th className="p-4 bg-slate-50">Anexo</th>
                                        <th className="p-4 bg-slate-50 text-center">Estado Actual</th>
                                        <th className="p-4 rounded-r-xl bg-slate-50">Nuevo Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredMembers.map(member => {
                                        const currentStatus = member.fidelidad_estado || FidelidadEstado.SIN_INFO;
                                        const newStatus = updates[member.id];
                                        const isModified = newStatus && newStatus !== currentStatus;

                                        return (
                                            <tr key={member.id} className={`group transition-colors ${isModified ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}>
                                                <td className="p-4">
                                                    <p className="font-bold text-slate-700">{member.nombres}</p>
                                                    <p className="text-xs text-slate-400">{member.telefono}</p>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                                                        {anexos.find(a => a.id === member.anexoId)?.nombre || 'Sin Anexo'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-extrabold uppercase border ${getStatusColor(currentStatus)}`}>
                                                        {currentStatus}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={newStatus || currentStatus}
                                                        onChange={e => handleStatusChange(member.id, e.target.value as FidelidadEstado)}
                                                        className={`w-full p-2 rounded-lg font-bold text-sm border-2 outline-none transition-all ${isModified
                                                            ? 'border-blue-400 bg-white text-blue-700 shadow-md ring-2 ring-blue-100'
                                                            : 'border-transparent bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {Object.values(FidelidadEstado).map(s => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    // CSV Upload View
                    <div className="flex-1 p-8 flex flex-col items-center justify-center bg-slate-50/30">
                        {!csvFile ? (
                            <div className="w-full max-w-2xl border-2 border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center text-center bg-white">
                                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                                    <UploadCloud className="w-10 h-10 text-blue-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">Subir Archivo CSV</h3>
                                <p className="text-slate-500 mb-8 max-w-md">
                                    El archivo debe tener las columnas <code>dni</code> y <code>estado_diezmo</code> (SI, NO, INTERMITENTE, SIN_INFO).
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    id="csv-upload"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                                <label
                                    htmlFor="csv-upload"
                                    className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-black cursor-pointer transition-transform hover:scale-105 shadow-xl"
                                >
                                    Seleccionar Archivo
                                </label>
                            </div>
                        ) : (
                            <div className="w-full max-w-2xl bg-white rounded-3xl p-8 shadow-xl border border-slate-100">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="p-4 bg-emerald-50 rounded-2xl">
                                        <FileText className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{csvFile.name}</h3>
                                        <p className="text-slate-400 text-sm">{(csvFile.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                    <button onClick={() => { setCsvFile(null); setUpdates({}); }} className="ml-auto text-red-500 font-bold text-sm hover:underline">
                                        Eliminar
                                    </button>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-8">
                                    <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                        <p className="text-xs font-bold text-slate-400 uppercase">Filas Totales</p>
                                        <p className="text-2xl font-extrabold text-slate-700">{csvStats.total}</p>
                                    </div>
                                    <div className="p-4 bg-emerald-50 rounded-2xl text-center">
                                        <p className="text-xs font-bold text-emerald-500 uppercase">Actualizables</p>
                                        <p className="text-2xl font-extrabold text-emerald-700">{csvStats.valid}</p>
                                    </div>
                                    <div className="p-4 bg-amber-50 rounded-2xl text-center">
                                        <p className="text-xs font-bold text-amber-500 uppercase">No Encontrados/Error</p>
                                        <p className="text-2xl font-extrabold text-amber-700">{csvStats.error}</p>
                                    </div>
                                </div>

                                {csvStats.valid > 0 ? (
                                    <div className="flex items-center gap-3 p-4 bg-blue-50 text-blue-800 rounded-xl mb-6">
                                        <CheckCircle className="w-5 h-5" />
                                        <p className="text-sm font-bold">Listos para procesar {csvStats.valid} registros.</p>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3 p-4 bg-red-50 text-red-800 rounded-xl mb-6">
                                        <AlertTriangle className="w-5 h-5" />
                                        <p className="text-sm font-bold">No hay registros válidos para procesar.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <p className="text-sm font-bold text-slate-500">
                        {Object.keys(updates).length} cambios pendientes
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={Object.keys(updates).length === 0}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:shadow-none translate-y-0 hover:-translate-y-1"
                        >
                            <span className="flex items-center gap-2">
                                <Save className="w-5 h-5" /> Guardar Cambios
                            </span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BatchFidelityModal;
