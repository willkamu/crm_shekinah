
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../App.tsx';
import { FinanceTransaction, MonthlyReport } from '../types';
import useMembresiaActiva from '../firebase/useMembresiaActiva.js';
import { DollarSign, Wallet, Gift, Calendar, ArrowDownLeft, TrendingUp, UserCheck, FileText, Upload, CheckCircle2, AlertCircle, X, Eye, Printer, BarChart3, Download, UploadCloud, Loader2, Church, Shield, AlertTriangle, PlusCircle, MinusCircle, Lock, CheckSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Finances: React.FC = () => {
    const membresiaActiva = useMembresiaActiva();
    const { finances, addTransaction, currentUser, members, monthlyReports, addMonthlyReport, updateMonthlyReport, notify, anexos } = useApp();
    const [activeTab, setActiveTab] = useState<'TRANSACCIONES' | 'REPORTES' | 'ANALISIS' | 'CONCILIACION'>('TRANSACCIONES');

    // --- TRANSACTION FORM STATE ---
    const [transactionMode, setTransactionMode] = useState<'INGRESO' | 'GASTO'>('INGRESO');

    // Common
    const [amount, setAmount] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [description, setDescription] = useState(''); // Detail

    // Income Specific
    const [incomeType, setIncomeType] = useState<'Ofrenda' | 'Honra Especial'>('Ofrenda');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [linkedEvent, setLinkedEvent] = useState('');
    const [countedBy, setCountedBy] = useState('');
    const [witnessBy, setWitnessBy] = useState('');
    const [custodyType, setCustodyType] = useState<'DEPOSITO' | 'CUSTODIA_LIDER'>('DEPOSITO');
    const [treasurerName, setTreasurerName] = useState('');

    // Expense Specific
    const [invoiceAmount, setInvoiceAmount] = useState('');

    // --- REPORT FORM STATE ---
    const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
    const [reportYear, setReportYear] = useState(new Date().getFullYear()); // L-3: Contexto 2025 (Actual)
    const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
    const [isConfirmReportOpen, setIsConfirmReportOpen] = useState(false); // U-10 Modal

    // --- UX STATE ---
    const [viewEvidenceUrl, setViewEvidenceUrl] = useState<string | null>(null);
    const [reportToPrint, setReportToPrint] = useState<MonthlyReport | null>(null);

    // --- CHART DATA ---
    const chartData = useMemo(() => {
        const data: Record<string, { name: string, diezmos: number, ofrendas: number, gastos: number }> = {};
        const monthsOrder: string[] = [];

        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            const shortName = d.toLocaleString('es-ES', { month: 'short' });
            data[key] = { name: shortName, diezmos: 0, ofrendas: 0, gastos: 0 };
            monthsOrder.push(key);
        }

        finances.forEach(tx => {
            const d = new Date(tx.fecha);
            const key = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });

            if (data[key]) {
                if (tx.tipo === 'Diezmo') data[key].diezmos += tx.monto;
                else if (tx.tipo === 'Gasto') data[key].gastos += tx.monto;
                else data[key].ofrendas += tx.monto;
            }
        });

        return monthsOrder.map(key => data[key]);
    }, [finances]);

    // --- HANDLERS ---

    // File Upload
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            setTimeout(() => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setEvidenceFile(reader.result as string);
                    setIsUploading(false);
                };
                reader.readAsDataURL(file);
            }, 1000);
        }
    };

    const handleSubmitTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) {
            notify("Ingrese un monto válido", "error");
            return;
        }

        const newTx: FinanceTransaction = {
            id: `TX-${Date.now()}`,
            fecha: new Date().toISOString().split('T')[0],
            anexoId: currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId,
            monto: parseFloat(amount),
            evidenceUrl: evidenceFile || undefined,
            // Logic L-1 handled implicitly by creating correct type
            // Logic U-8 Approval handled below
            tipo: transactionMode === 'GASTO' ? 'Gasto' : incomeType,
        };

        if (transactionMode === 'INGRESO') {
            if (!countedBy || !witnessBy) {
                notify("Debe indicar quién contó y el testigo", "error");
                return;
            }
            if (!evidenceFile) {
                notify("Debe adjuntar evidencia de custodia (Voucher o Hoja de Entrega)", "error");
                return;
            }
            if (custodyType === 'CUSTODIA_LIDER' && !treasurerName) {
                notify("Debe indicar el nombre del Tesorero que recibió", "error");
                return;
            }

            newTx.miembroId = selectedMemberId || undefined;
            newTx.detalle = description; // Optional for income
            newTx.eventoVinculadoId = incomeType === 'Honra Especial' ? linkedEvent : undefined;
            newTx.countedBy = countedBy;
            newTx.witnessBy = witnessBy;
            newTx.custodyType = custodyType;
            newTx.treasurerName = custodyType === 'CUSTODIA_LIDER' ? treasurerName : undefined;
            newTx.status = 'COMPLETADO';
        } else {
            // GASTO
            if (!description) { // L-4 Mandatory Detail
                notify("El detalle del gasto es obligatorio", "error");
                return;
            }
            if (!invoiceAmount) { // U-6
                notify("Ingrese el monto exacto del recibo/factura", "error");
                return;
            }

            newTx.detalle = description;
            newTx.invoiceAmount = parseFloat(invoiceAmount);
            // U-8: Egresos son pendientes si no soy el Pastor Principal (asumiendo que Pastor autoriza directo, 
            // o si es Líder de Anexo el que registra necesita aprobación de Pastor?)
            // Requirement says: "El Líder de Anexo debe... aprobarlos". If Anexo leader registers it, maybe it's auto approved for Anexo level?
            // Let's assume Anexo Leader registers it, effectively approving it for the report.
            // But if a "Secre" registers it, Leader needs to approve.
            // Simplified: Default to APPROVAL NEEDED if registered by non-leader roles?
            // Requirement U-8 Text: "Egresos registrados por una Sede... entran... PENDIENTE... Líder Anexo aprueba".
            // Since we usually log in as Leader in this app demo:
            newTx.status = currentUser.role === 'LIDER_ANEXO' || currentUser.role === 'PASTOR_PRINCIPAL' ? 'APROBADO' : 'PENDIENTE_APROBACION_ANEXO';
        }

        addTransaction(newTx);

        // Reset Form
        setAmount('');
        setEvidenceFile(null);
        setDescription('');
        setCountedBy('');
        setWitnessBy('');
        setTreasurerName('');
        setInvoiceAmount('');
        notify("Transacción registrada correctamente");
    };

    // --- REPORT LOGIC ---

    const handlePreSubmitReport = () => {
        // L-2 Block Re-send
        const currentAnnexId = currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId;
        const existing = monthlyReports.find(r => r.month === reportMonth && r.year === reportYear && r.anexoId === currentAnnexId && r.status === 'ENVIADO');

        if (existing) {
            notify("Este reporte ya fue enviado y está pendiente de revisión.", "error");
            return;
        }
        setIsConfirmReportOpen(true);
    };

    const handleConfirmCloseMonth = () => {
        setIsConfirmReportOpen(false);
        setIsEvidenceModalOpen(true); // Proceed to evidence upload
        setEvidenceFile(null);
    };

    const handleFinalizeReport = () => {
        if (!evidenceFile) {
            notify("Debe adjuntar la evidencia del cierre", "error");
            return;
        }

        const currentAnnexId = currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId;
        const monthTransactions = finances.filter(f => {
            const d = new Date(f.fecha);
            // Ensure we use the Transaction Date correctly (UTC/Local issue check)
            // Splitting 'YYYY-MM-DD' helps avoid timezone shifts
            const [y, m] = f.fecha.split('-').map(Number);
            return m === reportMonth && y === reportYear && f.anexoId === currentAnnexId;
        });

        // L-1 Correct Logic: Income SUM, Expenses SUBTRACT
        const totalIngresos = monthTransactions.filter(t => t.tipo !== 'Gasto').reduce((s, t) => s + t.monto, 0);
        const totalEgresos = monthTransactions.filter(t => t.tipo === 'Gasto').reduce((s, t) => s + t.monto, 0);

        // Detailed breakdown for report (L-4 support)
        const detallesEgresos = monthTransactions
            .filter(t => t.tipo === 'Gasto')
            .map(t => ({ id: t.id, descripcion: t.detalle || 'Sin detalle', monto: t.monto }));

        const newReport: MonthlyReport = {
            id: `REP-${Date.now()}`,
            anexoId: currentAnnexId,
            month: reportMonth,
            year: reportYear,
            // Mapping for legacy fields
            totalOfrendas: monthTransactions.filter(t => t.tipo === 'Ofrenda').reduce((s, t) => s + t.monto, 0),
            totalDiezmos: monthTransactions.filter(t => t.tipo === 'Diezmo').reduce((s, t) => s + t.monto, 0) || 0,
            totalHonras: monthTransactions.filter(t => t.tipo === 'Honra Especial').reduce((s, t) => s + t.monto, 0),
            totalGeneral: totalIngresos - totalEgresos, // Net Balance implied? Or Total Income? Standard is Net.

            // v2.0 Fields
            ingresos_total: totalIngresos,
            egresos_total: totalEgresos,
            detalles_egresos: detallesEgresos,
            saldo_calculado: totalIngresos - totalEgresos,

            status: 'ENVIADO',
            fechaEnvio: new Date().toISOString().split('T')[0],
            evidenceUrl: evidenceFile
        };

        addMonthlyReport(newReport);
        setIsEvidenceModalOpen(false);
        // U-11 Success Message
        notify(`✅ Reporte de ${reportMonth}/${reportYear} enviado con éxito al Pastorado.`);
    };

    const handlePrintReport = (report: MonthlyReport) => {
        setReportToPrint(report);
        setTimeout(() => window.print(), 100);
    };

    // --- UX HELPERS ---
    const visibleMembers = members.filter(m => currentUser.anexoId === 'ALL' || m.anexoId === currentUser.anexoId);
    const visibleReports = monthlyReports.filter(r => currentUser.anexoId === 'ALL' || r.anexoId === currentUser.anexoId).sort((a, b) => b.month - a.month);

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* HEADER */}
            <div className="flex items-center gap-4 no-print">
                <div className="bg-emerald-100 p-3 rounded-2xl shadow-sm">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Finanzas 2.0</h2>
                    <p className="text-sm text-slate-500 font-medium">Control Integral de Tesorería</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar no-print">
                <button onClick={() => setActiveTab('TRANSACCIONES')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'TRANSACCIONES' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    Registro Diario
                </button>
                <button onClick={() => setActiveTab('REPORTES')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'REPORTES' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                    Cierre Mensual
                </button>
                {currentUser.role === 'PASTOR_PRINCIPAL' && (
                    <>
                        <button onClick={() => setActiveTab('CONCILIACION')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'CONCILIACION' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            Conciliación
                        </button>
                        <button onClick={() => setActiveTab('ANALISIS')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'ANALISIS' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                            Análisis
                        </button>
                    </>
                )}
            </div>

            {/* --- TAB: TRANSACCIONES --- */}
            {activeTab === 'TRANSACCIONES' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">

                    {/* FORM CARD */}
                    <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-card border border-slate-50 h-fit">

                        {/* MODE SWITCHER */}
                        <div className="flex bg-slate-50 p-1 rounded-2xl mb-6">
                            <button
                                onClick={() => setTransactionMode('INGRESO')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${transactionMode === 'INGRESO' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <PlusCircle className="w-5 h-5" /> Ingreso
                            </button>
                            <button
                                onClick={() => setTransactionMode('GASTO')}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${transactionMode === 'GASTO' ? 'bg-white text-red-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <MinusCircle className="w-5 h-5" /> Gasto
                            </button>
                        </div>

                        {/* U-1: BIG BUTTON TITLE EFFECT */}
                        <h3 className="text-lg font-bold text-slate-800 mb-6 text-center">
                            {transactionMode === 'INGRESO' ? '➕ Registrar Culto/Día de Hoy' : '➖ Registrar Egreso/Gasto'}
                        </h3>

                        <form onSubmit={handleSubmitTransaction} className="space-y-6">

                            {/* LOCATION (U-2 LOCKED) */}
                            <div className="relative opacity-75">
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Ubicación (Fija)</label>
                                <div className="w-full p-4 bg-slate-100 rounded-2xl border border-slate-200 font-bold text-slate-600 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-slate-400" />
                                    {anexos.find(a => a.id === (currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId))?.nombre}
                                </div>
                            </div>

                            {/* --- INGRESO FIELDS --- */}
                            {transactionMode === 'INGRESO' && (
                                <>
                                    {/* U-3: TYPE SELECTION (NO DIEZMO) */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Tipo de Fondo</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button type="button" onClick={() => setIncomeType('Ofrenda')} className={`p-4 rounded-xl border-2 font-bold transition-all cursor-pointer ${incomeType === 'Ofrenda' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-100 text-slate-400'}`}>
                                                Ofrenda General
                                            </button>
                                            <button type="button" onClick={() => setIncomeType('Honra Especial')} className={`p-4 rounded-xl border-2 font-bold transition-all cursor-pointer ${incomeType === 'Honra Especial' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-100 text-slate-400'}`}>
                                                Honra Especial
                                            </button>
                                        </div>
                                    </div>

                                    {/* AMOUNT */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <span className="text-emerald-300 font-bold text-2xl">S/</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-emerald-400 focus:bg-white focus:outline-none text-4xl font-bold text-slate-800 placeholder-slate-200 transition-all shadow-inner"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    {/* U-4: DOUBLE COUNT CONTROLS */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Contado Por:</label>
                                            <input value={countedBy} onChange={e => setCountedBy(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-sm" placeholder="Nombre Líder" required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Testigo:</label>
                                            <input value={witnessBy} onChange={e => setWitnessBy(e.target.value)} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-sm" placeholder="Nombre Testigo" required />
                                        </div>
                                    </div>

                                    {/* U-9: CUSTODY & EVIDENCE */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-3 block flex items-center gap-2"><Shield className="w-4 h-4" /> Custodia de Fondos (Obligatorio)</label>

                                        {/* U-9a Selector */}
                                        <div className="flex gap-2 mb-4">
                                            <button type="button" onClick={() => setCustodyType('DEPOSITO')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${custodyType === 'DEPOSITO' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                Depósito Bancario
                                            </button>
                                            <button type="button" onClick={() => setCustodyType('CUSTODIA_LIDER')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${custodyType === 'CUSTODIA_LIDER' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-slate-400 border-slate-200'}`}>
                                                Efectivo / Custodia
                                            </button>
                                        </div>

                                        {/* U-9c Name */}
                                        {custodyType === 'CUSTODIA_LIDER' && (
                                            <div className="mb-4 animate-fadeIn">
                                                <input value={treasurerName} onChange={e => setTreasurerName(e.target.value)} className="w-full p-3 bg-white border border-amber-200 rounded-xl font-medium text-sm" placeholder="Nombre del Tesorero que Recibe" />
                                            </div>
                                        )}

                                        {/* U-7/U-9b Upload */}
                                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 bg-white rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors">
                                            {evidenceFile ? (
                                                <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                                                    <CheckCircle2 className="w-5 h-5" /> {custodyType === 'DEPOSITO' ? 'Voucher Cargado' : 'Hoja Firmada Cargada'}
                                                </div>
                                            ) : (
                                                <>
                                                    {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-slate-400" /> : <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />}
                                                    <span className="text-xs font-bold text-slate-500 uppercase text-center">{custodyType === 'DEPOSITO' ? 'Subir Foto Voucher' : 'Subir Hoja Firmada'}</span>
                                                </>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    </div>

                                    {/* EXTRA: Linked Person (Optional) */}
                                    <div className="pt-2">
                                        <select value={selectedMemberId} onChange={e => setSelectedMemberId(e.target.value)} className="w-full text-xs bg-transparent border-b border-slate-200 py-2 text-slate-400 focus:outline-none">
                                            <option value="">(Opcional) Vincular a un Miembro...</option>
                                            {visibleMembers.map(m => <option key={m.id} value={m.id}>{m.nombres}</option>)}
                                        </select>
                                    </div>
                                </>
                            )}

                            {/* --- GASTO FIELDS --- */}
                            {transactionMode === 'GASTO' && (
                                <>
                                    {/* AMOUNT */}
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                            <span className="text-red-300 font-bold text-2xl">S/</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            className="w-full pl-14 pr-5 py-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-red-400 focus:bg-white focus:outline-none text-4xl font-bold text-slate-800 placeholder-slate-200 transition-all shadow-inner"
                                            placeholder="0.00"
                                            required
                                        />
                                    </div>

                                    {/* U-6: INVOICE MATCH */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Monto en Recibo (Validación)</label>
                                        <input
                                            type="number"
                                            value={invoiceAmount}
                                            onChange={e => setInvoiceAmount(e.target.value)}
                                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700"
                                            placeholder="Debe coincidir con la foto"
                                        />
                                    </div>

                                    {/* U-5: DETAIL (TEXTAREA) */}
                                    <div>
                                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Detalle del Gasto</label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium text-slate-700 h-24 resize-none focus:ring-2 focus:ring-red-200 outline-none"
                                            placeholder="Descripción detallada del egreso..."
                                            required
                                        />
                                    </div>

                                    {/* U-7: UPLOAD */}
                                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-red-200 bg-red-50/50 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-red-50 transition-colors">
                                        {evidenceFile ? (
                                            <div className="flex items-center gap-2 text-red-600 font-bold text-xs">
                                                <FileText className="w-5 h-5" /> Recibo Adjuntado
                                            </div>
                                        ) : (
                                            <>
                                                <UploadCloud className="w-8 h-8 text-red-300 mb-2" />
                                                <span className="text-xs font-bold text-red-400 uppercase">Subir Foto Recibo</span>
                                            </>
                                        )}
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                </>
                            )}

                            {/* SUBMIT BUTTON */}
                            <button type="submit" className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all btn-hover flex justify-center items-center gap-2 text-lg text-white cursor-pointer ${transactionMode === 'INGRESO' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-800 hover:bg-black'}`}>
                                {transactionMode === 'INGRESO' ? <Gift className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                                {transactionMode === 'INGRESO' ? 'Registrar Ingreso' : 'Registrar Gasto'}
                            </button>
                        </form>
                    </div>

                    {/* LATEST TRANSACTIONS LIST */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-bold text-slate-800 px-2">Movimientos Recientes</h3>
                        <div className="bg-white rounded-[2rem] shadow-card border border-slate-50 overflow-hidden min-h-[400px]">
                            {finances.filter(f => currentUser.anexoId === 'ALL' || f.anexoId === currentUser.anexoId).length === 0 ? (
                                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                                    <TrendingUp className="w-8 h-8 opacity-20 mb-2" />
                                    <p>Sin movimientos hoy.</p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-50">
                                    {finances.filter(f => currentUser.anexoId === 'ALL' || f.anexoId === currentUser.anexoId).slice(0, 10).map(tx => (
                                        <li key={tx.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-xl ${tx.tipo === 'Gasto' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                                    {tx.tipo === 'Gasto' ? <MinusCircle className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-800">{tx.tipo}</p>
                                                    <p className="text-[10px] text-slate-400">{tx.fecha} • {tx.countedBy ? `Ref: ${tx.countedBy}` : '...'}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-sm ${tx.tipo === 'Gasto' ? 'text-red-600' : 'text-emerald-600'}`}>
                                                    {tx.tipo === 'Gasto' ? '-' : '+'} S/ {tx.monto.toFixed(2)}
                                                </p>
                                                {tx.status === 'PENDIENTE_APROBACION_ANEXO' && (
                                                    <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">Pendiente</span>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: REPORTES --- */}
            {activeTab === 'REPORTES' && (
                <div className="space-y-8 no-print">

                    {/* GENERATOR */}
                    {currentUser.role !== 'PASTOR_PRINCIPAL' && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <h3 className="text-xl font-bold mb-2">Cierre Mensual</h3>
                                    <p className="text-slate-400 text-sm">Genere y envíe el reporte consolidado al Pastorado.</p>
                                </div>
                                <div className="flex gap-4">
                                    <select value={reportMonth} onChange={e => setReportMonth(parseInt(e.target.value))} className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                                        {[...Array(12)].map((_, i) => <option key={i} value={i + 1} className="text-slate-900">Mes {i + 1}</option>)}
                                    </select>
                                    <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-3 font-bold text-sm flex items-center">
                                        {reportYear}
                                    </div>
                                </div>
                                <button
                                    onClick={handlePreSubmitReport}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-3 rounded-xl font-bold shadow-glow flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                                // U-2 Logic: Disabled if already SENT (Handled in PreSubmit but styling here matches active)
                                >
                                    <Upload className="w-5 h-5" /> Presentar Reporte
                                </button>
                            </div>
                        </div>
                    )}

                    {/* LIST */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {visibleReports.map(r => (
                            <div key={r.id} className="bg-white p-6 rounded-[2rem] shadow-card border border-slate-50 hover:shadow-lg transition-all group relative">
                                <button onClick={() => handlePrintReport(r)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors hidden group-hover:block cursor-pointer"><Printer className="w-5 h-5" /></button>

                                <h4 className="font-bold text-slate-800 text-lg mb-1">Reporte {r.month}/{r.year}</h4>
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${r.status === 'RECIBIDO' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>{r.status}</span>

                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between text-slate-500"><span>Ingresos</span> <span className="text-emerald-600 font-bold">S/ {r.ingresos_total?.toFixed(2) || r.totalGeneral.toFixed(2)}</span></div>
                                    <div className="flex justify-between text-slate-500"><span>Egresos</span> <span className="text-red-500 font-bold">- S/ {r.egresos_total?.toFixed(2) || '0.00'}</span></div>
                                    <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-800"><span>Saldo</span> <span>S/ {r.saldo_calculado?.toFixed(2) || r.totalGeneral.toFixed(2)}</span></div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                    <button onClick={() => setViewEvidenceUrl(r.evidenceUrl!)} className="flex-1 py-2 bg-slate-50 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-100 cursor-pointer">Ver Evidencia</button>
                                    {currentUser.role === 'PASTOR_PRINCIPAL' && r.status === 'ENVIADO' && (
                                        <button onClick={() => updateMonthlyReport(r.id, { status: 'RECIBIDO' })} className="flex-1 py-2 bg-emerald-500 text-white font-bold rounded-lg text-xs hover:bg-emerald-600 cursor-pointer">Aprobar</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- TAB: CONCILIACION (PASTORAL U-12) --- */}
            {activeTab === 'CONCILIACION' && currentUser.role === 'PASTOR_PRINCIPAL' && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-card border border-slate-50 no-print">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Shield className="w-6 h-6 text-indigo-600" /> Conciliación Pastoral</h3>

                    <div className="space-y-6">
                        {/* 1. Cash Manifests */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2">Entregas de Efectivo en Custodia</h4>
                            <div className="space-y-3">
                                {finances.filter(t => t.custodyType === 'CUSTODIA_LIDER').map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold">C</div>
                                            <div>
                                                <p className="font-bold text-slate-800">S/ {t.monto.toFixed(2)}</p>
                                                <p className="text-xs text-slate-500">{t.fecha} • {anexos.find(a => a.id === t.anexoId)?.nombre}</p>
                                                <p className="text-[10px] text-amber-700 font-bold">Recibió: {t.treasurerName}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setViewEvidenceUrl(t.evidenceUrl!)} className="px-4 py-2 bg-white border border-amber-200 text-amber-700 font-bold rounded-lg text-xs hover:bg-amber-100 cursor-pointer">
                                            Ver Hoja Firmada
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 2. Bank Deposits (Simplified Audit) */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase mb-4 border-b border-slate-100 pb-2 pt-4">Depósitos Bancarios</h4>
                            <div className="space-y-3">
                                {finances.filter(t => t.custodyType === 'DEPOSITO').map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-bold"><UploadCloud className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-bold text-slate-800">S/ {t.monto.toFixed(2)}</p>
                                                <p className="text-xs text-slate-500">{t.fecha} • {anexos.find(a => a.id === t.anexoId)?.nombre}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => setViewEvidenceUrl(t.evidenceUrl!)} className="px-4 py-2 bg-white border border-blue-200 text-blue-700 font-bold rounded-lg text-xs hover:bg-blue-100 cursor-pointer">
                                            Ver Voucher
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: ANALISIS --- */}
            {activeTab === 'ANALISIS' && (
                <div className="bg-white p-8 rounded-[2.5rem] shadow-card border border-slate-50 no-print">
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
                                <Bar dataKey="diezmos" name="Diezmos" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="ofrendas" name="Ofrendas" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                <Bar dataKey="gastos" name="Gastos" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}

            {/* U-10: CONFIRM REPORT MODAL */}
            {isConfirmReportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn no-print">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative text-center">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                            <Lock className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Cierre</h3>
                        <p className="text-sm text-slate-500 mb-6 px-4">
                            🔒 Confirmar Cierre de Reporte de {reportMonth}/{reportYear}. Una vez enviado, no podrá modificarse. ¿Desea continuar?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsConfirmReportOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">Cancelar</button>
                            <button onClick={handleConfirmCloseMonth} className="flex-1 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-black shadow-lg cursor-pointer">Continuar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* EVIDENCE UPLOAD MODAL (FOR REPORT OR TRANSACTION - Reused logic simplified) */}
            {/* Note: Logic here is tailored for Monthly Report close as per legacy flow, Income Evidence is inline in form */}
            {isEvidenceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn no-print">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative text-center">
                        <button onClick={() => setIsEvidenceModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"><X className="w-5 h-5" /></button>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Evidencia de Cierre</h3>

                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 rounded-2xl p-8 mb-6 cursor-pointer hover:bg-slate-50 transition-all">
                            {evidenceFile ? <img src={evidenceFile} className="h-32 mx-auto object-contain" /> : <UploadCloud className="w-10 h-10 text-slate-300 mx-auto" />}
                            <p className="text-xs font-bold text-slate-400 mt-2 uppercase">{evidenceFile ? 'Cambiar Foto' : 'Subir Foto Cierre'}</p>
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />

                        <button onClick={handleFinalizeReport} className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-glow cursor-pointer">
                            ✅ Finalizar y Enviar
                        </button>
                    </div>
                </div>
            )}

            {/* VIEW EVIDENCE LIGHTBOX */}
            {viewEvidenceUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn no-print" onClick={() => setViewEvidenceUrl(null)}>
                    <img src={viewEvidenceUrl} className="max-h-[85vh] max-w-full rounded-lg shadow-2xl border-4 border-white/10" />
                    <button onClick={() => setViewEvidenceUrl(null)} className="absolute top-4 right-4 text-white hover:text-red-400 cursor-pointer"><X className="w-8 h-8" /></button>
                </div>
            )}

            {/* HIDDEN PRINT */}
            <div className="hidden print-only-visible p-8 max-w-3xl mx-auto border-4 border-slate-800">
                {/* Simplified Print Template */}
                <div className="text-center font-serif text-slate-900">
                    <h1 className="text-2xl font-bold uppercase mb-2">Reporte Financiero {reportToPrint?.month}/{reportToPrint?.year}</h1>
                    <p className="mb-8">{anexos.find(a => a.id === reportToPrint?.anexoId)?.nombre}</p>

                    <table className="w-full border-collapse border border-slate-800 mb-8">
                        <tbody>
                            <tr><td className="p-2 border">Total Ingresos</td><td className="p-2 border text-right">{reportToPrint?.ingresos_total?.toFixed(2)}</td></tr>
                            <tr><td className="p-2 border">Total Egresos</td><td className="p-2 border text-right">{reportToPrint?.egresos_total?.toFixed(2)}</td></tr>
                            <tr className="font-bold"><td className="p-2 border">SALDO FINAL</td><td className="p-2 border text-right">{reportToPrint?.saldo_calculado?.toFixed(2)}</td></tr>
                        </tbody>
                    </table>

                    {reportToPrint?.detalles_egresos && (
                        <div className="text-left mt-8">
                            <h4 className="font-bold border-b border-black mb-2">Detalle de Gastos</h4>
                            <ul>
                                {reportToPrint.detalles_egresos.map((e, idx) => (
                                    <li key={idx} className="flex justify-between text-sm py-1 border-b border-slate-200">
                                        <span>{e.descripcion}</span>
                                        <span>{e.monto.toFixed(2)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Finances;
