import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { MonthlyReport, Anexo } from '../types';
import {
    Calendar, TrendingUp, TrendingDown, CheckCircle2, AlertCircle,
    Eye, X, ExternalLink, ShieldCheck, Search
} from 'lucide-react';

const SupervisionDashboard: React.FC = () => {
    const { monthlyReports, anexos, updateMonthlyReport, notify, currentUser } = useApp();

    // A. Selector de Periodo Global
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 0); // Current Month (0-index or 1-index? Usually 1-index in app logic, check Finances.tsx)
    // Finances.tsx: d.getMonth() + 1. So 1-index.
    // Let's use 1-index for consistency with MonthlyReport.
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // Audit Modal State
    const [reviewReport, setReviewReport] = useState<{ report: MonthlyReport, anexoName: string } | null>(null);
    const [viewImage, setViewImage] = useState<string | null>(null); // v4.1 Lightbox State

    // --- LOGIC ---

    // Filter Reports by Period
    const periodReports = useMemo(() => {
        return monthlyReports.filter(r => r.month === selectedMonth && r.year === selectedYear && r.status !== 'PENDIENTE'); // PENDIENTE in DB usually means not sent? Or maybe 'ENVIADO'/'RECIBIDO' are what we care about. 
        // prompt says: "Status: Badge condicional. RECIBIDO: Si existe el reporte. PENDIENTE: Si no existe."
        // So we look for any report that exists for that month/year.
    }, [monthlyReports, selectedMonth, selectedYear]);

    // B. KPIs
    const kpis = useMemo(() => {
        const totalDiezmos = periodReports.reduce((sum, r) => sum + (r.totalDiezmos || 0), 0); // Using totalDiezmos or ingresos_total? Prompt says "Diezmo Global: Suma de ingresos_total". Okay.
        const totalIngresos = periodReports.reduce((sum, r) => sum + (r.ingresos_total || 0), 0);
        const totalEgresos = periodReports.reduce((sum, r) => sum + (r.egresos_total || 0), 0);
        const compliance = periodReports.length;
        const totalAnexos = anexos.length;

        return { totalIngresos, totalEgresos, compliance, totalAnexos };
    }, [periodReports, anexos]);


    // C. Table Data
    const auditTableData = useMemo(() => {
        return anexos.map(anexo => {
            const report = monthlyReports.find(r =>
                r.anexoId === anexo.id &&
                r.month === selectedMonth &&
                r.year === selectedYear &&
                r.status !== 'PENDIENTE' // Assuming PENDIENTE is internal draft if exists, usually we want ENVIADO or RECIBIDO
            );

            // If report exists, status is RECIBIDO (Received by system) or whatever status it has.
            // Prompt says: "🟢 RECIBIDO: Si existe el reporte. 🔴 PENDIENTE: Si no existe."

            return {
                anexo,
                report,
                status: report ? 'RECIBIDO' : 'PENDIENTE',
                leader: anexo.liderNombre || 'Sin Líder'
            };
        });
    }, [anexos, monthlyReports, selectedMonth, selectedYear]);


    // --- HANDLERS ---
    const handleConformidad = () => {
        if (!reviewReport) return;
        // Update status to 'RECIBIDO' (Confirmed)
        updateMonthlyReport(reviewReport.report.id, { status: 'RECIBIDO' });
        notify(`✅ Conformidad dada al reporte de ${reviewReport.anexoName}`);
        setReviewReport(null);
    };

    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* MATCHING HEADER STYLE */}
            <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-2xl shadow-sm"><ShieldCheck className="w-6 h-6 text-indigo-600" /></div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Panel de Supervisión</h2>
                    <p className="text-sm text-slate-500 font-medium">Auditoría Global de Finanzas</p>
                </div>
            </div>

            {/* A. PERIOD SELECTOR */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                <Calendar className="w-5 h-5 text-slate-400" />
                <select
                    value={selectedMonth}
                    onChange={e => setSelectedMonth(Number(e.target.value))}
                    className="p-2 bg-slate-50 border-none rounded-lg font-bold text-slate-700 outline-none"
                >
                    {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' }).toUpperCase()}</option>
                    ))}
                </select>
                <select
                    value={selectedYear}
                    onChange={e => setSelectedYear(Number(e.target.value))}
                    className="p-2 bg-slate-50 border-none rounded-lg font-bold text-slate-700 outline-none"
                >
                    <option value={2024}>2024</option>
                    <option value={2025}>2025</option>
                </select>
            </div>

            {/* B. KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
                    <TrendingUp className="absolute top-4 right-4 text-emerald-400 w-12 h-12 opacity-50" />
                    <p className="text-emerald-100 text-sm font-bold uppercase mb-1">Total Ingresos (Diezmos+)</p>
                    <h3 className="text-3xl font-bold">S/ {kpis.totalIngresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-rose-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
                    <TrendingDown className="absolute top-4 right-4 text-rose-400 w-12 h-12 opacity-50" />
                    <p className="text-rose-100 text-sm font-bold uppercase mb-1">Egresos Operativos</p>
                    <h3 className="text-3xl font-bold">S/ {kpis.totalEgresos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</h3>
                </div>
                <div className="bg-indigo-500 rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden">
                    <CheckCircle2 className="absolute top-4 right-4 text-indigo-400 w-12 h-12 opacity-50" />
                    <p className="text-indigo-100 text-sm font-bold uppercase mb-1">Cumplimiento Reportes</p>
                    <h3 className="text-3xl font-bold">{kpis.compliance} <span className="text-lg font-medium text-indigo-200">/ {kpis.totalAnexos} Anexos</span></h3>
                </div>
            </div>

            {/* C. ANEXOS TABLE */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800 text-lg">Reportes por Sede</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Anexo / Sede</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Encargado</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Estado</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Ingresos Rep.</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {auditTableData.map((item) => (
                                <tr key={item.anexo.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-slate-700">{item.anexo.nombre}</td>
                                    <td className="px-6 py-4 text-sm text-slate-500">{item.leader}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.status === 'RECIBIDO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.report?.status === 'RECIBIDO' ? 'AUDITADO' : item.status}
                                            {/* Logic: if report exists, it's 'RECIBIDO' by system, but if status is already 'RECIBIDO' it means Audited. If 'ENVIADO', means Waiting Review. */}
                                            {item.report?.status === 'ENVIADO' ? 'POR REVISAR' : (item.report ? 'AUDITADO' : 'PENDIENTE')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-slate-700">
                                        {item.report ? `S/ ${item.report.ingresos_total?.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            disabled={!item.report}
                                            onClick={() => item.report && setReviewReport({ report: item.report, anexoName: item.anexo.nombre })}
                                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl disabled:opacity-30 transition-colors"
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

            {/* III. REVIEW MODAL (READ ONLY) */}
            {reviewReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-indigo-50 p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-indigo-900">Revisión de Reporte</h3>
                                <p className="text-sm text-indigo-600 font-medium">{reviewReport.anexoName} • {new Date(0, reviewReport.report.month - 1).toLocaleString('es-ES', { month: 'long' }).toUpperCase()} {reviewReport.report.year}</p>
                            </div>
                            <button onClick={() => setReviewReport(null)} className="p-2 bg-white/50 hover:bg-white rounded-full text-indigo-900"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6">

                            {/* Evidence Image */}
                            <div className="bg-slate-900 rounded-2xl p-1 overflow-hidden relative group">
                                {reviewReport.report.evidenceUrl ? (
                                    <>
                                        <img src={reviewReport.report.evidenceUrl} className="w-full h-48 object-contain bg-black" />
                                        <button
                                            onClick={() => setViewImage(reviewReport.report.evidenceUrl!)}
                                            className="absolute bottom-4 right-4 px-4 py-2 bg-white/90 rounded-full text-xs font-bold flex items-center gap-2 shadow-lg hover:bg-white text-blue-600"
                                        >
                                            <Eye className="w-4 h-4" /> Ver Evidencia
                                        </button>
                                    </>
                                ) : (
                                    <div className="h-48 flex flex-col items-center justify-center text-slate-500">
                                        <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                                        <p className="text-xs">No hay evidencia adjunta</p>
                                    </div>
                                )}
                            </div>

                            {/* Summary Table */}
                            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <h4 className="font-bold text-slate-700 mb-3 text-sm uppercase">Resumen Financiero</h4>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Ingresos Totales (Diezmos/Ofrendas)</span>
                                        <span className="font-bold text-emerald-600">+ S/ {reviewReport.report.ingresos_total?.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Egresos Operativos</span>
                                        <span className="font-bold text-red-500">- S/ {reviewReport.report.egresos_total?.toFixed(2)}</span>
                                    </div>
                                    <div className="border-t border-slate-200 pt-2 flex justify-between mt-2">
                                        <span className="font-bold text-slate-800">Saldo Final</span>
                                        <span className="font-bold text-slate-900">S/ {reviewReport.report.saldo_calculado?.toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Info */}
                            {(reviewReport.report.deliveryMethod || reviewReport.report.receiverName) && (
                                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100 text-sm">
                                    <h4 className="font-bold text-blue-800 mb-2 text-xs uppercase">Cadena de Custodia</h4>
                                    <p className="text-blue-700">
                                        <span className="font-bold">Método:</span> {reviewReport.report.deliveryMethod}<br />
                                        <span className="font-bold">Receptor/Ref:</span> {reviewReport.report.receiverName}
                                    </p>
                                </div>
                            )}

                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
                            <button onClick={() => setReviewReport(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50">Cerrar</button>
                            {/* Optional "Observar" could go here */}
                            {reviewReport.report.status !== 'RECIBIDO' && (
                                <button onClick={handleConformidad} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-5 h-5" /> Dar Conformidad
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* IV. LIGHTBOX (v4.1) */}
            {viewImage && (
                <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewImage(null)}>
                    {/* Botón Cerrar */}
                    <button className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
                        <X size={32} />
                    </button>
                    {/* Imagen */}
                    <img
                        src={viewImage}
                        alt="Evidencia de Auditoría"
                        className="max-h-[90vh] max-w-full rounded-lg shadow-2xl border border-white/20 object-contain"
                        onClick={(e) => e.stopPropagation()} // Evitar cerrar al hacer clic en la imagen
                    />
                </div>
            )}
        </div>
    );
};

export default SupervisionDashboard;
