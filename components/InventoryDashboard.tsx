import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { InventoryItem } from '../types';
import {
    Package, AlertTriangle, Activity, Eye, X, Calendar,
    Box, CheckCircle2, Clock, Search
} from 'lucide-react';

const InventoryDashboard: React.FC = () => {
    const { inventoryItems, anexos, members } = useApp();
    const [selectedAnnexId, setSelectedAnnexId] = useState<string | null>(null);

    // --- KPIs ---
    const kpis = useMemo(() => {
        const activeItems = inventoryItems.filter(i => i.activo);
        const totalItems = activeItems.reduce((acc, item) => acc + item.cantidad, 0);
        const damagedItems = activeItems.filter(i =>
            i.estado_bien === 'DETERIORADO' || i.estado_bien === 'MALO/DAÑADO'
        ).reduce((acc, item) => acc + item.cantidad, 0);

        return { totalItems, damagedItems };
    }, [inventoryItems]);

    // --- TABLE DATA ---
    const annexStatus = useMemo(() => {
        return anexos.map(anexo => {
            const annexItems = inventoryItems.filter(i => i.scope_id === anexo.id && i.activo);
            const totalCount = annexItems.reduce((acc, i) => acc + i.cantidad, 0);

            // Find latest update
            let lastUpdateObj: Date | null = null;
            if (annexItems.length > 0) {
                // Sort by update date
                const sorted = [...annexItems].sort((a, b) => new Date(b.fecha_actualiza).getTime() - new Date(a.fecha_actualiza).getTime());
                lastUpdateObj = new Date(sorted[0].fecha_actualiza);
            }

            // Status Check (30 days)
            let status: 'ACTUALIZADO' | 'DESACTUALIZADO' | 'SIN_DATA' = 'SIN_DATA';
            if (lastUpdateObj) {
                const diffDays = (new Date().getTime() - lastUpdateObj.getTime()) / (1000 * 3600 * 24);
                status = diffDays < 30 ? 'ACTUALIZADO' : 'DESACTUALIZADO';
            }

            return {
                anexo,
                totalCount,
                lastUpdate: lastUpdateObj,
                status,
                items: annexItems
            };
        });
    }, [anexos, inventoryItems]);

    const selectedAnnexData = useMemo(() => {
        if (!selectedAnnexId) return null;
        return annexStatus.find(a => a.anexo.id === selectedAnnexId);
    }, [selectedAnnexId, annexStatus]);

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl shadow-sm"><Package className="w-6 h-6 text-blue-600" /></div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Inventario Global</h2>
                    <p className="text-sm text-slate-500 font-medium">Salud del Equipamiento por Sede</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-blue-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
                    <Box className="absolute top-4 right-4 text-blue-400 w-12 h-12 opacity-50" />
                    <p className="text-blue-100 text-sm font-bold uppercase mb-1">Total Activos (Equipos)</p>
                    <h3 className="text-4xl font-bold">{kpis.totalItems}</h3>
                </div>
                <div className={`rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden ${kpis.damagedItems > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <AlertTriangle className={`absolute top-4 right-4 w-12 h-12 opacity-50 ${kpis.damagedItems > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
                    <p className={`text-sm font-bold uppercase mb-1 ${kpis.damagedItems > 0 ? 'text-red-100' : 'text-emerald-100'}`}>Items Dañados / En Riesgo</p>
                    <h3 className="text-4xl font-bold">{kpis.damagedItems}</h3>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="font-bold text-slate-800 text-lg">Estado por Sede</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Sede</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Total Ítems</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Última Actualización</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Estado Salud</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {annexStatus.map((row) => (
                                <tr key={row.anexo.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{row.anexo.nombre}</td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.totalCount}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {row.lastUpdate ? row.lastUpdate.toLocaleDateString('es-ES') : '-'}
                                        {row.lastUpdate && <span className="block text-xs text-slate-400">{row.lastUpdate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {row.status === 'ACTUALIZADO' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold"><CheckCircle2 size={12} /> Actualizado</span>}
                                        {row.status === 'DESACTUALIZADO' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold"><Clock size={12} /> Desactualizado</span>}
                                        {row.status === 'SIN_DATA' && <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">Sin Datos</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => setSelectedAnnexId(row.anexo.id)}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                                        >
                                            <Eye className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* DETAIL MODAL */}
            {selectedAnnexId && selectedAnnexData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2.5rem]">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{selectedAnnexData.anexo.nombre}</h3>
                                <p className="text-sm text-slate-500">Listado detallado de bienes</p>
                            </div>
                            <button onClick={() => setSelectedAnnexId(null)} className="p-2 bg-white rounded-full hover:bg-slate-200 text-slate-500"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead>
                                    <tr>
                                        <th className="text-left text-xs font-bold text-slate-400 uppercase py-2">Bien</th>
                                        <th className="text-left text-xs font-bold text-slate-400 uppercase py-2">Categoría</th>
                                        <th className="text-right text-xs font-bold text-slate-400 uppercase py-2">Cant.</th>
                                        <th className="text-center text-xs font-bold text-slate-400 uppercase py-2">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {selectedAnnexData.items.map(item => (
                                        <tr key={item.id}>
                                            <td className="py-3 pr-2">
                                                <div className="font-bold text-slate-700 text-sm">{item.nombre_bien}</div>
                                                <div className="text-xs text-slate-400">{item.descripcion}</div>
                                            </td>
                                            <td className="py-3 text-xs text-slate-500">{item.categoria || '-'}</td>
                                            <td className="py-3 text-right font-bold text-slate-700">{item.cantidad}</td>
                                            <td className="py-3 text-center">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${item.estado_bien.includes('MALO') || item.estado_bien === 'DETERIORADO'
                                                        ? 'bg-red-100 text-red-600'
                                                        : 'bg-emerald-100 text-emerald-600'
                                                    }`}>
                                                    {item.estado_bien}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {selectedAnnexData.items.length === 0 && (
                                        <tr><td colSpan={4} className="text-center py-8 text-slate-400 italic">No hay registros.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryDashboard;
