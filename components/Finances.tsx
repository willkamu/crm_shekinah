
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../App.tsx';
import { FinanceTransaction, MonthlyReport } from '../types';
import SupervisionDashboard from './SupervisionDashboard'; // v4.0
import useMembresiaActiva from '../firebase/useMembresiaActiva.js';
import { Wallet, Gift, ArrowDownLeft, TrendingUp, UserCheck, FileText, Upload, CheckCircle2, AlertCircle, X, Printer, BarChart3, Download, UploadCloud, Loader2, Shield, PlusCircle, MinusCircle, Lock, Edit2, Trash2, Save, Heart, ChevronRight, Calendar, User, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Finances: React.FC = () => {
    // const membresiaActiva = useMembresiaActiva(); // Not currently used directly but good to have
    const { finances, addTransaction, currentUser, members, monthlyReports, addMonthlyReport, updateMonthlyReport, notify, anexos } = useApp();

    // v4.0 ROLE BIFURCATION
    const isSupervisor = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'PASTORA_GENERAL', 'PASTOR_EJECUTIVO', 'SECRETARIA_PASTORAL', 'MINISTRO', 'ADMIN', 'SECRETARIA'].includes(currentUser.role);
    if (isSupervisor) {
        return <SupervisionDashboard />;
    }

    const [activeTab, setActiveTab] = useState<'TRANSACCIONES' | 'REPORTES' | 'ANALISIS' | 'CONCILIACION'>('TRANSACCIONES');

    // --- WIZARD MODAL STATE (v3.0) ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
    const [wizardType, setWizardType] = useState<'INGRESO' | 'GASTO'>('INGRESO');

    // --- BATCH METADATA STATE (v3.0) ---
    const [batchDate, setBatchDate] = useState(new Date().toISOString().split('T')[0]);
    const [batchWitness, setBatchWitness] = useState(''); // Only for Income
    // countedBy is "batchAuditor" essentially
    const [countedBy, setCountedBy] = useState('');

    // --- TEMPORARY LISTS ---
    const [pendingIncomes, setPendingIncomes] = useState<FinanceTransaction[]>([]);
    const [pendingExpenses, setPendingExpenses] = useState<FinanceTransaction[]>([]);

    // --- ITEM FORM STATE ---
    const [editingId, setEditingId] = useState<string | null>(null);
    const [amount, setAmount] = useState('');
    const [evidenceFile, setEvidenceFile] = useState<string | null>(null); // Per item evidence for Expense, Batch evidence for Income
    const [isUploading, setIsUploading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null); // L-4 Local Error State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const itemFormRef = useRef<HTMLDivElement>(null);

    // Income Item Specific
    const [incomeType, setIncomeType] = useState<'Ofrenda' | 'Honra Especial'>('Ofrenda');
    const [selectedMemberId, setSelectedMemberId] = useState(''); // Optional linking
    const [purpose, setPurpose] = useState(''); // Special Honor Purpose

    // Expense Item Specific
    const [description, setDescription] = useState('');
    const [invoiceAmount, setInvoiceAmount] = useState('');

    // --- REPORT FORM STATE ---
    // --- REPORT FORM STATE (B-2: Default to Previous Month) ---
    const [reportMonth, setReportMonth] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.getMonth() + 1;
    });
    const [reportYear, setReportYear] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        return d.getFullYear();
    });
    const [isConfirmReportOpen, setIsConfirmReportOpen] = useState(false);

    // --- UX STATE ---
    const [viewEvidenceUrl, setViewEvidenceUrl] = useState<string | null>(null);
    const [reportToPrint, setReportToPrint] = useState<MonthlyReport | null>(null);

    const [expandedMonths, setExpandedMonths] = useState<string[]>([new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()]);

    // --- CUSTODY CHAIN STATE (L-1 v3.4) ---
    const [deliveryMethod, setDeliveryMethod] = useState<'EFECTIVO' | 'DEPOSITO' | 'TRANSFERENCIA'>('EFECTIVO');
    const [receiverName, setReceiverName] = useState(''); // Who received the money or Op Number

    // --- AUTOLOAD USER DATA ---
    useEffect(() => {
        const currentMonthKey = new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase();
        setExpandedMonths(prev => prev.includes(currentMonthKey) ? prev : [...prev, currentMonthKey]);
    }, []);
    useEffect(() => {
        if (currentUser.name && !countedBy) {
            setCountedBy(currentUser.name);
        }
    }, [currentUser]);

    // --- CHART DATA (L-5) ---
    const chartData = useMemo(() => {
        const data: Record<string, { name: string, diezmos: number, ofrendas: number, honras: number, gastos: number }> = {};
        const monthsOrder: string[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            data[key] = { name: d.toLocaleString('es-ES', { month: 'short' }), diezmos: 0, ofrendas: 0, honras: 0, gastos: 0 };
            monthsOrder.push(key);
        }
        finances.forEach(tx => {
            const d = new Date(tx.fecha);
            const key = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
            if (data[key]) {
                if (tx.tipo === 'Diezmo') data[key].diezmos += tx.monto;
                else if (tx.tipo === 'Gasto') data[key].gastos += tx.monto;
                else if (tx.tipo === 'Honra Especial') data[key].honras += tx.monto;
                else data[key].ofrendas += tx.monto;
            }
        });
        return monthsOrder.map(key => data[key]);
    }, [finances]);

    // --- HELPER: GET CURRENT ANEXO NAME ---
    const currentAnexoName = useMemo(() => {
        if (currentUser.anexoId === 'ALL') return 'Sede Central (Admin)';
        const anx = anexos.find(a => a.id === currentUser.anexoId);
        return anx ? anx.nombre : currentUser.anexoId;
    }, [currentUser, anexos]);

    // --- HISTORICAL TRANSACTIONS (U-2/U-3 Grouping) ---
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, FinanceTransaction[]> = {};
        // Filter by Anexo if needed, but show ALL history
        const relevantTx = finances.filter(f => currentUser.anexoId === 'ALL' || f.anexoId === currentUser.anexoId);

        relevantTx.forEach(tx => {
            const d = new Date(tx.fecha);
            // Fix timezone issue by using split if needed, but date object is fine for Month/Year usually
            // D-1 Universal Date Format
            const key = d.toLocaleDateString('es-ES', { timeZone: 'UTC', month: 'long', year: 'numeric' }).toUpperCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(tx);
        });
        return groups;
    }, [finances, currentUser.anexoId]);

    const sortedMonthKeys = useMemo(() => {
        return Object.keys(groupedTransactions).sort((a, b) => {
            // Simple sort might fail for months, need date parsing
            // "DICIEMBRE 2025"
            const dateA = new Date(`1 ${a}`); // Hacky, but works for "Month Year" often if locale match
            // Better: Find a tx from that group and use its date
            const txA = groupedTransactions[a][0];
            const txB = groupedTransactions[b][0];
            return new Date(txB.fecha).getTime() - new Date(txA.fecha).getTime();
        });
    }, [groupedTransactions]);

    const toggleMonth = (key: string) => {
        setExpandedMonths(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
    };

    // Keep visibleTransactions for the "Current Month Balance" Card ONLY
    const visibleTransactions = useMemo(() => {
        return finances.filter(f => {
            const [y, m] = f.fecha.split('-').map(Number);
            return m === reportMonth && y === reportYear && (currentUser.anexoId === 'ALL' || f.anexoId === currentUser.anexoId);
        });
    }, [finances, reportMonth, reportYear, currentUser.anexoId]);

    // --- CALCULATE BALANCE (R-2) ---
    const currentMonthBalance = useMemo(() => {
        const ingresos = visibleTransactions.filter(t => t.tipo !== 'Gasto').reduce((s, t) => s + t.monto, 0);
        const egresos = visibleTransactions.filter(t => t.tipo === 'Gasto').reduce((s, t) => s + t.monto, 0);
        return ingresos - egresos;
    }, [visibleTransactions]);


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
            }, 800);
        }
    };

    // --- WIZARD FLOW HANDLERS ---

    const openWizard = (type: 'INGRESO' | 'GASTO') => {
        setWizardType(type);
        setWizardStep(1);
        setIsWizardOpen(true);
        // Reset Item Form
        setAmount('');
        setDescription('');
        setInvoiceAmount('');
        setEvidenceFile(null);
    };

    const handleNextStep1 = () => {
        setFormError(null);
        if (!batchDate) { setFormError("La fecha es obligatoria"); return; }

        const today = new Date().toISOString().split('T')[0];
        if (batchDate > today) { setFormError("No es posible registrar fechas futuras."); return; }

        if (wizardType === 'INGRESO' && !batchWitness) { setFormError("El testigo es obligatorio para ingresos."); return; }
        setWizardStep(2);
    };

    // Unified Add/Update Item to LIST (Step 2)
    // Unified Add/Update Item to LIST (Step 2)
    const handleAddItemToBatch = (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null); // Clear previous errors

        if (!amount || parseFloat(amount) <= 0) { setFormError("Monto inválido. Debe ser mayor a 0."); return; }

        if (wizardType === 'INGRESO') {
            // L-2: Logic for Income
            if (incomeType === 'Honra Especial' && !purpose) {
                setFormError("El propósito/destinatario es obligatorio para Honra Especial.");
                return;
            }

            const newTx: FinanceTransaction = {
                id: editingId || `TEMP-INC-${Date.now()}`,
                fecha: batchDate,
                anexoId: currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId,
                monto: parseFloat(amount),
                tipo: incomeType,
                miembroId: selectedMemberId || undefined,
                detalle: incomeType === 'Honra Especial' ? purpose : undefined,
                countedBy: countedBy,
                witnessBy: batchWitness,
                custodyType: evidenceFile ? 'DEPOSITO' : 'EFECTIVO_CUSTODIA',
                status: 'COMPLETADO',
                evidenceUrl: evidenceFile || ''
            };

            if (editingId) {
                setPendingIncomes(prev => prev.map(item => item.id === editingId ? newTx : item));
                setEditingId(null);
            } else {
                setPendingIncomes(prev => [...prev, newTx]);
            }
        } else {
            // EXPENSE LOGIC (L-1 Conditional Evidence)
            if (!description) { setFormError("El detalle del gasto es obligatorio."); return; }

            // Check Evidence vs Detail Length
            const isEvidenceProvided = !!evidenceFile;
            if (!isEvidenceProvided) {
                if (description.length < 30) {
                    setFormError("⚠️ Si no adjunta foto, el detalle debe ser minucioso (mínimo 30 caracteres).");
                    return;
                }
            }

            const newTx: FinanceTransaction = {
                id: editingId || `TEMP-EXP-${Date.now()}`,
                fecha: batchDate,
                anexoId: currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId,
                monto: parseFloat(amount),
                evidenceUrl: evidenceFile || '',
                tipo: 'Gasto',
                detalle: description,
                invoiceAmount: parseFloat(invoiceAmount) || parseFloat(amount),
                status: 'PENDIENTE_APROBACION_ANEXO'
            };

            if (editingId) {
                setPendingExpenses(prev => prev.map(item => item.id === editingId ? newTx : item));
                setEditingId(null);
            } else {
                setPendingExpenses(prev => [...prev, newTx]);
            }
        }

        // Reset Item Form & Error
        setAmount('');
        setDescription('');
        setPurpose('');
        setInvoiceAmount('');
        setEvidenceFile(null);
        setFormError(null);
    };
    const handleEditItem = (item: FinanceTransaction) => {
        setEditingId(item.id);
        setAmount(item.monto.toString());
        if (wizardType === 'INGRESO') {
            setIncomeType(item.tipo as any);
            setPurpose(item.detalle || '');
        } else {
            setDescription(item.detalle || '');
            setInvoiceAmount(item.invoiceAmount?.toString() || '');
            setEvidenceFile(item.evidenceUrl || null);
        }
        itemFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleDeleteItem = (id: string) => {
        if (wizardType === 'INGRESO') setPendingIncomes(prev => prev.filter(i => i.id !== id));
        else setPendingExpenses(prev => prev.filter(i => i.id !== id));
    };

    const handleFinalizeBatch = () => {
        setFormError(null);
        // Step 3 Logic
        // L-1: Removed strict batch evidence check for Income.
        // if (wizardType === 'INGRESO' && !evidenceFile) { setFormError("Debe subir Hoja de Entrega"); return; } 

        const list = wizardType === 'INGRESO' ? pendingIncomes : pendingExpenses;
        if (list.length === 0) { setFormError("No hay items para enviar."); return; }

        list.forEach(tx => {
            const finalTx: FinanceTransaction = {
                ...tx,
                id: `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                // Use input evidence if provided for Batch (Income) overwrites item evidence? 
                // Actually if Step 3 evidence is provided for Income, it might be the "Sheet". 
                // But we now allow item evidence too. 
                // Let's say: If Step 3 evidence exists, use it. If not, keep item evidence.
                evidenceUrl: (wizardType === 'INGRESO' && evidenceFile) ? evidenceFile : tx.evidenceUrl
            };
            addTransaction(finalTx);
        });

        if (wizardType === 'INGRESO') setPendingIncomes([]);
        else setPendingExpenses([]);

        setIsWizardOpen(false);
        notify(`✅ Batch de ${wizardType} registrado exitosamente.`);
    };


    // --- REPORT LOGIC (Unchanged) ---
    const handlePreSubmitReport = () => {
        const currentAnnexId = currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId;
        const existing = monthlyReports.find(r => r.month === reportMonth && r.year === reportYear && r.anexoId === currentAnnexId && r.status === 'ENVIADO');
        if (existing) { notify("Reporte ya enviado.", "error"); return; }
        setIsConfirmReportOpen(true);
    };

    const handleFinalizeReport = () => {
        if (!evidenceFile) { notify("Evidencia del cierre requerida", "error"); return; }
        // L-2 Validate Custody Fields
        if (!receiverName) { notify("Debe indicar quién recibe el dinero o N° Operación.", "error"); return; }

        const currentAnnexId = currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId;


        // Debug B-3: Ensure finances loaded
        if (!finances || finances.length === 0) { console.warn("Finances empty during report gen"); }

        const monthTransactions = finances.filter(f => {
            const [y, m] = f.fecha.split('-').map(Number);
            return m === reportMonth && y === reportYear && f.anexoId === currentAnnexId;
        });

        const totalIngresos = monthTransactions.filter(t => t.tipo !== 'Gasto').reduce((s, t) => s + (t.monto || 0), 0);
        const totalEgresos = monthTransactions.filter(t => t.tipo === 'Gasto').reduce((s, t) => s + (t.monto || 0), 0);
        const detallesEgresos = monthTransactions.filter(t => t.tipo === 'Gasto').map(t => ({ id: t.id, descripcion: t.detalle || 'Sin detalle', monto: t.monto }));

        const newReport: MonthlyReport = {
            id: `REP-${Date.now()}`,
            anexoId: currentAnnexId,
            month: reportMonth,
            year: reportYear,
            totalOfrendas: monthTransactions.filter(t => t.tipo === 'Ofrenda').reduce((s, t) => s + (t.monto || 0), 0),
            totalDiezmos: monthTransactions.filter(t => t.tipo === 'Diezmo').reduce((s, t) => s + (t.monto || 0), 0) || 0,
            totalHonras: monthTransactions.filter(t => t.tipo === 'Honra Especial').reduce((s, t) => s + (t.monto || 0), 0),
            totalGeneral: (totalIngresos || 0) - (totalEgresos || 0),
            ingresos_total: totalIngresos || 0,
            egresos_total: totalEgresos || 0,
            detalles_egresos: detallesEgresos,
            saldo_calculado: (totalIngresos || 0) - (totalEgresos || 0),
            status: 'ENVIADO',
            fechaEnvio: new Date().toISOString().split('T')[0],
            evidenceUrl: evidenceFile,
            // L-1 New Fields
            deliveryMethod: deliveryMethod,
            receiverName: receiverName
        };

        // DEBUG B-1 & B-2
        console.log("Finalizing Report Payload:", newReport);

        if (isNaN(newReport.ingresos_total) || isNaN(newReport.egresos_total) || isNaN(newReport.saldo_calculado)) {
            // This shouldn't match now due to || 0 safety, but good to keep
            notify("Error CRÍTICO: Valores NaN.", "error");
            return;
        }

        addMonthlyReport(newReport);
        setIsConfirmReportOpen(false);
        notify(`✅ Reporte Enviado Correctamente.`);
    };

    // Helper for Report Logic UI (re-use existing states)
    // Actually, let's keep the Report stuff simple and robust as it was working.

    // --- UX HELPERS ---
    const visibleMembers = members.filter(m => currentUser.anexoId === 'ALL' || m.anexoId === currentUser.anexoId);
    const visibleReports = monthlyReports.filter(r => currentUser.anexoId === 'ALL' || r.anexoId === currentUser.anexoId).sort((a, b) => b.month - a.month);


    return (
        <div className="space-y-8 animate-fadeIn pb-20">
            {/* HEADER */}
            <div className="flex items-center gap-4 no-print">
                <div className="bg-emerald-100 p-3 rounded-2xl shadow-sm"><Wallet className="w-6 h-6 text-emerald-600" /></div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Finanzas 3.0</h2>
                    <p className="text-sm text-slate-500 font-medium">Tesorería Eclesiástica Auditada (Wizard)</p>
                </div>
            </div>

            {/* TABS */}
            <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar no-print">
                <button onClick={() => setActiveTab('TRANSACCIONES')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'TRANSACCIONES' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Registro Diario</button>
                <button onClick={() => setActiveTab('REPORTES')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'REPORTES' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Cierre Mensual</button>
                {currentUser.role === 'PASTOR_PRINCIPAL' && <button onClick={() => setActiveTab('ANALISIS')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'ANALISIS' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Análisis</button>}
            </div>

            {/* --- TAB: TRANSACCIONES (DASHBOARD v3.0) --- */}
            {activeTab === 'TRANSACCIONES' && (
                <div className="max-w-4xl mx-auto space-y-8 no-print">

                    {/* R-2: BALANCE CARD - Always Visible */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-8 text-white shadow-card flex flex-col md:flex-row justify-between items-center gap-6">
                        <div>
                            <p className="text-slate-400 font-medium mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> Balance Mes {reportMonth}/{reportYear}</p>
                            <h2 className={`text-4xl font-bold ${currentMonthBalance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>S/ {currentMonthBalance.toFixed(2)}</h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Ingresos</p>
                                <p className="text-emerald-400 font-bold text-lg">+{visibleTransactions.filter(t => t.tipo !== 'Gasto').reduce((s, t) => s + t.monto, 0).toFixed(2)}</p>
                            </div>
                            <div className="px-6 py-3 bg-white/5 rounded-2xl border border-white/10 text-center">
                                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Egresos</p>
                                <p className="text-red-400 font-bold text-lg">-{visibleTransactions.filter(t => t.tipo === 'Gasto').reduce((s, t) => s + t.monto, 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* V3.0 WIZARD TRIGGERS (Replaces Forms) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div onClick={() => openWizard('INGRESO')} className="group cursor-pointer bg-white p-8 rounded-[2.5rem] shadow-card border border-green-50 hover:border-emerald-500 transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <PlusCircle className="w-8 h-8 text-emerald-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Registrar Ingresos</h3>
                                <p className="text-sm text-slate-500 mt-2">Ofrendas, Diezmos y Honras de Cultos.</p>
                            </div>
                        </div>

                        <div onClick={() => openWizard('GASTO')} className="group cursor-pointer bg-white p-8 rounded-[2.5rem] shadow-card border border-red-50 hover:border-red-500 transition-all flex flex-col items-center text-center gap-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                <MinusCircle className="w-8 h-8 text-red-600" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">Registrar Egresos</h3>
                                <p className="text-sm text-slate-500 mt-2">Gastos operativos y pagos de servicios.</p>
                            </div>
                        </div>
                    </div>

                    {/* R-1: HISTORICAL TRANSACTIONS (ACCORDIONS) */}
                    <div className="mt-12 border-t border-slate-200 pt-8">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-700">
                            <TrendingUp className="w-6 h-6 text-slate-400" /> Historial de Transacciones
                        </h3>

                        <div className="space-y-4">
                            {sortedMonthKeys.map(key => {
                                const group = groupedTransactions[key];
                                const totalIng = group.filter(t => t.tipo !== 'Gasto').reduce((sum, t) => sum + (t.monto || 0), 0);
                                const totalEgr = group.filter(t => t.tipo === 'Gasto').reduce((sum, t) => sum + (t.monto || 0), 0);
                                const isExpanded = expandedMonths.includes(key);

                                return (
                                    <div key={key} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                        <div onClick={() => toggleMonth(key)} className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${isExpanded ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                                                    <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                                                </div>
                                                <span className="font-bold text-slate-700 uppercase tracking-wide">{key}</span>
                                            </div>
                                            <div className="flex gap-4 text-xs font-bold">
                                                <span className="text-emerald-600">+{totalIng.toFixed(2)}</span>
                                                <span className="text-red-500">-{totalEgr.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="border-t border-slate-100 animate-fadeIn">
                                                <table className="min-w-full divide-y divide-slate-100">
                                                    <thead className="bg-slate-50/50">
                                                        <tr>
                                                            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-400">Día</th>
                                                            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-400">Tipo</th>
                                                            <th className="px-4 py-2 text-left text-[10px] font-bold uppercase text-slate-400">Detalle</th>
                                                            <th className="px-4 py-2 text-right text-[10px] font-bold uppercase text-slate-400">Monto</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-50">
                                                        {group.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(tx => (
                                                            <tr key={tx.id} className="hover:bg-slate-50">
                                                                <td className="px-4 py-2 text-xs font-medium text-slate-500">
                                                                    {/* D-1 Universal Date */}
                                                                    {new Date(tx.fecha).toLocaleDateString('es-ES', { timeZone: 'UTC', day: '2-digit' })}
                                                                </td>
                                                                <td className="px-4 py-2 text-xs font-bold text-slate-700">{tx.tipo}</td>
                                                                <td className="px-4 py-2 text-xs text-slate-500 truncate max-w-[200px]">{tx.detalle || '-'}</td>
                                                                <td className={`px-4 py-2 text-right text-xs font-bold ${tx.tipo === 'Gasto' ? 'text-red-500' : 'text-emerald-500'}`}>
                                                                    {tx.tipo === 'Gasto' ? '-' : '+'} {tx.monto.toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            {sortedMonthKeys.length === 0 && <p className="text-center text-slate-400 italic">No hay historial disponible.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* --- REPORTES & ANALISIS Tabs (Keeping content roughly same, simplified for brevity in this rewrite) --- */}
            {activeTab === 'REPORTES' && (
                <div className="space-y-8 max-w-4xl mx-auto no-print">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center">
                        <div><h3 className="font-bold">Cierre Mensual</h3></div>
                        <div className="flex gap-2 text-black">
                            {/* S-1 Explicit Dark Mode Fix */}
                            <select value={reportMonth} onChange={e => setReportMonth(parseInt(e.target.value))} className="rounded-lg p-2 font-bold text-sm bg-white text-slate-900 border-none outline-none">
                                {[...Array(12)].map((_, i) => {
                                    const m = i + 1;
                                    const currentM = new Date().getMonth() + 1;
                                    const isFuture = m > currentM;
                                    return <option key={m} value={m} disabled={isFuture}>{new Date(0, i).toLocaleString('es-ES', { month: 'long' })} {isFuture ? '(Futuro)' : ''}</option>
                                })}
                            </select>
                            <button onClick={handlePreSubmitReport} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-bold">Enviar</button>
                        </div>
                    </div>
                    {visibleReports.map(r => (
                        <div key={r.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex justify-between">
                            <div><h4 className="font-bold">Reporte {r.month}/{r.year}</h4><p className="text-xs text-slate-400 uppercase">{r.status}</p></div>
                            <button onClick={() => setViewEvidenceUrl(r.evidenceUrl!)} className="text-blue-500 font-bold text-sm">Ver Evidencia</button>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'ANALISIS' && (
                <div className="max-w-4xl mx-auto bg-white p-8 rounded-[2.5rem] shadow-card h-96">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}><XAxis dataKey="name" /><Tooltip /><Bar dataKey="ofrendas" fill="#10b981" /></BarChart>
                    </ResponsiveContainer>
                </div>
            )}


            {/* ========================================= */}
            {/* ========= WIZARD MODAL (v3.0) ========= */}
            {/* ========================================= */}
            {isWizardOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
                    <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className={`p-6 border-b flex justify-between items-center ${wizardType === 'INGRESO' ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'} rounded-t-[2.5rem]`}>
                            <h3 className={`text-xl font-bold flex items-center gap-2 ${wizardType === 'INGRESO' ? 'text-emerald-800' : 'text-red-800'}`}>
                                {wizardType === 'INGRESO' ? <PlusCircle /> : <MinusCircle />}
                                {wizardType === 'INGRESO' ? 'Registro de Ingresos' : 'Registro de Gastos'}
                            </h3>
                            <button onClick={() => setIsWizardOpen(false)} className="p-2 bg-white/50 rounded-full hover:bg-white text-slate-500"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Progress Bar */}
                        <div className="flex p-2 bg-slate-50 gap-1">
                            <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 1 ? (wizardType === 'INGRESO' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 2 ? (wizardType === 'INGRESO' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-200'}`} />
                            <div className={`h-1.5 flex-1 rounded-full ${wizardStep >= 3 ? (wizardType === 'INGRESO' ? 'bg-emerald-500' : 'bg-red-500') : 'bg-slate-200'}`} />
                        </div>

                        {/* Modal Body - Scrollable */}
                        <div className="p-6 md:p-8 overflow-y-auto flex-1 custom-scrollbar">

                            {/* --- STEP 1: METADATA --- */}
                            {wizardStep === 1 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="text-center mb-6">
                                        <h4 className="text-2xl font-bold text-slate-800">Detalles Generales</h4>
                                        <p className="text-slate-500">Complete la información del {wizardType === 'INGRESO' ? 'Culto' : 'Lote de Gastos'}</p>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Ubicación</label>
                                            <div className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 flex items-center gap-2"><Lock className="w-4 h-4" /> {currentAnexoName}</div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Fecha {wizardType === 'INGRESO' ? 'del Culto' : 'de Registro'} <span className="text-red-500">*</span></label>
                                            <input type="date" value={batchDate} max={new Date().toISOString().split('T')[0]} onChange={e => setBatchDate(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-800" required />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Responsable (Auditor)</label>
                                            <input value={countedBy} readOnly className="w-full p-3 bg-slate-200 border-none rounded-xl font-bold text-slate-500" />
                                        </div>
                                        {wizardType === 'INGRESO' && (
                                            <div>
                                                <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Testigo Principal <span className="text-red-500">*</span></label>
                                                <select value={batchWitness} onChange={e => setBatchWitness(e.target.value)} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700">
                                                    <option value="">-- Seleccionar --</option>
                                                    {visibleMembers.map(m => <option key={m.id} value={`${m.nombres} ${m.apellidos}`}>{m.nombres} {m.apellidos}</option>)}
                                                </select>
                                            </div>
                                        )}
                                    </div>

                                    <button onClick={handleNextStep1} className={`w-full py-4 rounded-2xl font-bold text-white shadow-xl flex items-center justify-center gap-2 ${wizardType === 'INGRESO' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-500 hover:bg-red-600'}`}>
                                        Siguiente Paso <ChevronRight className="w-5 h-5" />
                                    </button>
                                    {/* A-2 (Local Error) */}
                                    {formError && <div className="p-3 bg-red-50 rounded-xl text-center text-red-600 font-bold text-xs animate-shake border border-red-100">{formError}</div>}
                                </div>
                            )}

                            {/* --- STEP 2: CRUD ITEMS --- */}
                            {wizardStep === 2 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <h4 className="text-lg font-bold text-slate-800 text-center flex items-center justify-center gap-2">
                                        {wizardType === 'INGRESO' ? <Gift className="w-5 h-5 text-emerald-500" /> : <ArrowDownLeft className="w-5 h-5 text-red-500" />}
                                        Registro de Ítems
                                    </h4>

                                    {/* COMPACT FORM */}
                                    <div ref={itemFormRef} className={`p-4 rounded-2xl border-2 ${editingId ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-slate-50'}`}>
                                        <form onSubmit={handleAddItemToBatch} className="space-y-3">
                                            <div className="flex gap-2 items-center">
                                                <div className="w-1/3">
                                                    <label className="text-[10px] uppercase font-bold text-slate-400 pl-1">Monto</label>
                                                    <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-lg" autoFocus required />
                                                </div>

                                                {/* CONDITIONAL COMPACT FIELDS */}
                                                {/* CONDITIONAL COMPACT FIELDS */}
                                                {/* U-1 Enable Evidence for Income + Type */}
                                                {wizardType === 'INGRESO' ? (
                                                    <>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 pl-1">Tipo</label>
                                                            <select value={incomeType} onChange={e => setIncomeType(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-sm h-[46px]">
                                                                <option value="Ofrenda">Ofrenda</option>
                                                                <option value="Honra Especial">Honra</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex-1">
                                                            <label className="text-[10px] uppercase font-bold text-slate-400 pl-1">Voucher (Op)</label>
                                                            <div onClick={() => fileInputRef.current?.click()} className={`w-full h-[46px] border border-dashed rounded-xl flex items-center justify-center cursor-pointer ${evidenceFile ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-300 text-slate-400'}`}>
                                                                {evidenceFile ? <CheckCircle2 className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
                                                            </div>
                                                            {evidenceFile && <button type="button" onClick={(e) => { e.stopPropagation(); setEvidenceFile(null); }} className="text-[9px] text-red-500 font-bold underline text-center block -mt-1 relative z-10">Quit</button>}
                                                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="flex-1">
                                                        <label className="text-[10px] uppercase font-bold text-slate-400 pl-1">Evidencia (Op)</label>
                                                        <div onClick={() => fileInputRef.current?.click()} className={`w-full h-[46px] border border-dashed rounded-xl flex items-center justify-center cursor-pointer ${evidenceFile ? 'bg-emerald-100 border-emerald-300 text-emerald-700' : 'bg-white border-slate-300 text-slate-400'}`}>
                                                            {evidenceFile ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <UploadCloud className="w-4 h-4 mr-1" />}
                                                            <span className="text-[10px] font-bold">{evidenceFile ? 'Ok' : 'Foto'}</span>
                                                        </div>
                                                        {evidenceFile && (
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); setEvidenceFile(null); }} className="text-[10px] text-red-500 font-bold underline text-center w-full block">Quitar</button>
                                                        )}
                                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                                    </div>
                                                )}

                                                {/* ADD BUTTON (U-2/U-3) */}
                                                <div className="w-1/4 pt-5">
                                                    <button type="submit" className={`w-full h-[46px] rounded-xl font-bold text-white shadow-lg flex items-center justify-center ${editingId ? 'bg-amber-500' : (wizardType === 'INGRESO' ? 'bg-emerald-500' : 'bg-slate-800')}`}>
                                                        {editingId ? <Save className="w-5 h-5" /> : <PlusCircle className="w-5 h-5" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Details Rows (Conditional) */}
                                            {wizardType === 'INGRESO' && incomeType === 'Honra Especial' && (
                                                <input placeholder="Propósito (Obligatorio)" value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full p-2 bg-white border border-amber-200 rounded-xl text-sm" required />
                                            )}
                                            {wizardType === 'GASTO' && (
                                                <input placeholder="Detalle (Obligatorio si no hay foto)" value={description} onChange={e => setDescription(e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-xl text-xs" />
                                            )}

                                            {editingId && <button type="button" onClick={() => { setEditingId(null); setAmount(''); setDescription(''); setFormError(null); }} className="w-full py-1 text-xs text-slate-500 font-bold bg-slate-100 rounded-lg">Cancelar Edición</button>}
                                        </form>
                                        {/* U-1 Visual Warning for Missing Evidence (Income) */}
                                        {wizardType === 'INGRESO' && !evidenceFile && !editingId && (
                                            <div className="mt-2 text-center">
                                                <p className="text-[10px] font-bold text-amber-500">⚠️ Se registrará como efectivo en custodia (Sin voucher digital).</p>
                                            </div>
                                        )}
                                        {/* L-4 Local Error Message */}
                                        {formError && (
                                            <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 animate-pulse">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                                <p className="text-xs font-bold text-red-600">{formError}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* VISUAL CRUD TABLE */}
                                    {/* VISUAL CRUD TABLE (U-1 SCROLL FIX) */}
                                    <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner flex flex-col">
                                        <div className="overflow-y-auto max-h-[30vh] custom-scrollbar">
                                            <table className="min-w-full divide-y divide-slate-100">
                                                <thead className="bg-slate-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-4 py-2 text-left text-[10px] uppercase font-bold text-slate-500">Monto</th>
                                                        <th className="px-4 py-2 text-left text-[10px] uppercase font-bold text-slate-500">Detalle</th>
                                                        <th className="px-4 py-2 text-right text-[10px] uppercase font-bold text-slate-500">Acción</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {(wizardType === 'INGRESO' ? pendingIncomes : pendingExpenses).map(item => (
                                                        <tr key={item.id} className="hover:bg-slate-50">
                                                            <td className="px-4 py-2 font-bold text-sm">S/ {item.monto}</td>
                                                            <td className="px-4 py-2 text-xs text-slate-500 truncate max-w-[120px]">
                                                                {wizardType === 'INGRESO' ? item.tipo + (item.tipo === 'Honra Especial' ? ` (${item.detalle})` : '') : item.detalle}
                                                            </td>
                                                            <td className="px-4 py-2 text-right flex justify-end gap-2">
                                                                <button onClick={() => handleEditItem(item)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Edit2 className="w-4 h-4" /></button>
                                                                <button onClick={() => handleDeleteItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(wizardType === 'INGRESO' ? pendingIncomes : pendingExpenses).length === 0 && (
                                                        <tr><td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-400 italic">Lista vacía.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button onClick={() => setWizardStep(1)} className="px-6 py-4 bg-slate-100 rounded-2xl font-bold text-slate-500">Atrás</button>
                                        <button onClick={() => setWizardStep(3)} disabled={(wizardType === 'INGRESO' ? pendingIncomes : pendingExpenses).length === 0} className={`flex-1 py-4 rounded-2xl font-bold text-white shadow-xl ${wizardType === 'INGRESO' ? 'bg-emerald-500' : 'bg-red-500'} disabled:bg-slate-300`}>
                                            Siguiente: Cierre
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* --- STEP 3: EVIDENCE & FINALIZE --- */}
                            {wizardStep === 3 && (
                                <div className="space-y-6 animate-fadeIn text-center">
                                    <div className="bg-slate-50 p-6 rounded-[2.5rem]">
                                        <h4 className="text-lg font-bold text-slate-800 mb-2">Comprobante de Cierre</h4>
                                        <p className="text-sm text-slate-500 mb-6 px-4">
                                            {wizardType === 'INGRESO'
                                                ? "Debe subir la Hoja de Conteo firmada por el Líder y Testigo."
                                                : "Verifique que todos los gastos tengan justificación. Puede subir un resumen aquí."}
                                        </p>

                                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 bg-white rounded-3xl p-8 cursor-pointer hover:border-emerald-400 transition-all relative">
                                            {evidenceFile ? (
                                                <div className="flex flex-col items-center">
                                                    <img src={evidenceFile} className="h-32 object-contain mb-2 rounded-lg" />
                                                    <span className="text-emerald-600 font-bold text-xs bg-emerald-100 px-3 py-1 rounded-full">Evidencia Cargada</span>
                                                    <button onClick={(e) => { e.stopPropagation(); setEvidenceFile(null); }} className="absolute top-4 right-4 p-2 bg-red-100 text-red-500 rounded-full hover:bg-red-200"><X className="w-4 h-4" /></button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center text-slate-400">
                                                    <UploadCloud className="w-12 h-12 mb-2" />
                                                    <span className="font-bold text-sm">Tap para subir foto{wizardType === 'GASTO' ? 's' : ''}</span>
                                                </div>
                                            )}
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileSelect} />
                                    </div>

                                    <div className="flex gap-3 mt-4">
                                        <button onClick={() => setWizardStep(2)} className="px-6 py-4 bg-slate-100 rounded-2xl font-bold text-slate-500">Atrás</button>
                                        <div className="flex-1 flex flex-col gap-2">
                                            <button onClick={handleFinalizeBatch} className="py-4 bg-slate-900 text-white rounded-2xl font-bold shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-2">
                                                <CheckCircle2 className="w-5 h-5" /> Finalizar y Enviar
                                            </button>
                                            {formError && <span className="text-xs text-red-500 font-bold text-center">{formError}</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {/* View Evidence Modal */}
            {viewEvidenceUrl && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-md p-4" onClick={() => setViewEvidenceUrl(null)}>
                    <img src={viewEvidenceUrl} className="max-h-[90vh] max-w-full rounded-xl" />
                    <button className="absolute top-4 right-4 text-white p-2"><X className="w-8 h-8" /></button>
                </div>
            )}

            {/* Confirm Report Modal */}
            {isConfirmReportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn no-print">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative text-center">
                        <Lock className="w-16 h-16 bg-amber-100 rounded-full p-4 mx-auto mb-4 text-amber-500" />
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Confirmar Cierre</h3>
                        <p className="text-sm text-slate-500 mb-6 px-4">Esta acción enviará el reporte del mes {reportMonth}/{reportYear}. ¿Desea continuar?</p>
                        {/* L-1 Custody Chain Fields */}
                        <div className="text-left space-y-3 mb-4 bg-slate-50 p-4 rounded-xl">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Método de Entrega</label>
                                <select value={deliveryMethod} onChange={e => setDeliveryMethod(e.target.value as any)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700">
                                    <option value="EFECTIVO">Efectivo (Mano a Mano)</option>
                                    <option value="DEPOSITO">Depósito Bancario</option>
                                    <option value="TRANSFERENCIA">Transferencia / Yape</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                    {deliveryMethod === 'EFECTIVO' ? '¿A quién entregó? (Nombre)' : 'N° Operación / Referencia'}
                                </label>
                                <input value={receiverName} onChange={e => setReceiverName(e.target.value)} placeholder={deliveryMethod === 'EFECTIVO' ? "Ej. Hna. María" : "Ej. 12345678"} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700" />
                            </div>
                        </div>

                        {/* L-3 UX Rename */}
                        <div onClick={() => fileInputRef.current?.click()} className="border border-dashed p-4 rounded-xl mb-4 cursor-pointer hover:bg-slate-50 transition-colors">
                            {evidenceFile ? (
                                <div className="flex items-center justify-center gap-2 text-emerald-600">
                                    <CheckCircle2 className="w-5 h-5" /> <span className="font-bold text-xs">Evidencia Lista</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-1 text-slate-400">
                                    <Upload className="w-6 h-6" />
                                    <span className="text-xs font-bold">Evidencia (Cargo Firmado o Voucher)</span>
                                </div>
                            )}
                        </div>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                        <div className="flex gap-3">
                            <button onClick={() => setIsConfirmReportOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl">Cancelar</button>
                            <button onClick={handleFinalizeReport} className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl">Enviar</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Finances;
