
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../App.tsx';
import { FinanceTransaction, MonthlyReport } from '../types';
import useMembresiaActiva from '../firebase/useMembresiaActiva.js';
import { DollarSign, Wallet, Gift, Calendar, ArrowDownLeft, TrendingUp, UserCheck, FileText, Upload, CheckCircle2, AlertCircle, X, Eye, Printer, BarChart3, Download, UploadCloud, Loader2, Church } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const Finances: React.FC = () => {
  const membresiaActiva = useMembresiaActiva(); // <--- AÑADE ESTA LÍNEA
  const { finances, addTransaction, currentUser, members, monthlyReports, addMonthlyReport, updateMonthlyReport, notify, anexos } = useApp();
  const [activeTab, setActiveTab] = useState<'TRANSACCIONES' | 'REPORTES' | 'ANALISIS'>('TRANSACCIONES');
  
  // Transaction Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<FinanceTransaction['tipo']>('Ofrenda');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [detail, setDetail] = useState('');
  const [linkedEvent, setLinkedEvent] = useState('');

  // Report Form State
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [isEvidenceModalOpen, setIsEvidenceModalOpen] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UX State
  const [viewEvidenceUrl, setViewEvidenceUrl] = useState<string | null>(null);
  const [reportToPrint, setReportToPrint] = useState<MonthlyReport | null>(null);

  // --- CHART DATA GENERATION (REAL DATA) ---
  const chartData = useMemo(() => {
      const data: Record<string, { name: string, diezmos: number, ofrendas: number }> = {};
      const monthsOrder: string[] = [];

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const key = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
          const shortName = d.toLocaleString('es-ES', { month: 'short' });
          data[key] = { name: shortName, diezmos: 0, ofrendas: 0 };
          monthsOrder.push(key);
      }

      // Aggregate Finances
      finances.forEach(tx => {
          const d = new Date(tx.fecha);
          // Adjust timezone issue by using UTC components if needed, or simple string splitting
          // Using simple date object for demo
          const key = d.toLocaleString('es-ES', { month: 'short', year: 'numeric' });
          
          if (data[key]) {
              if (tx.tipo === 'Diezmo') {
                  data[key].diezmos += tx.monto;
              } else {
                  data[key].ofrendas += tx.monto;
              }
          }
      });

      return monthsOrder.map(key => data[key]);
  }, [finances]);

  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    addTransaction({
        id: `TX-${Date.now()}`,
        fecha: new Date().toISOString().split('T')[0],
        tipo: type,
        monto: parseFloat(amount),
        anexoId: currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId,
        miembroId: selectedMemberId || undefined,
        detalle: detail,
        eventoVinculadoId: type === 'Honra Especial' ? linkedEvent : undefined
    });

    setAmount('');
    setDetail('');
    setLinkedEvent('');
    setSelectedMemberId('');
  };

  const handlePrepareReport = () => {
      setIsEvidenceModalOpen(true);
      setEvidenceFile(null);
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          setIsUploading(true);
          // Simulate Upload
          setTimeout(() => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  setEvidenceFile(reader.result as string);
                  setIsUploading(false);
              };
              reader.readAsDataURL(file);
          }, 1500);
      }
  };

  const handleConfirmCloseMonth = () => {
      if (!evidenceFile) {
          notify("Debe adjuntar la evidencia (foto del voucher) para cerrar el mes", 'error');
          return;
      }

      const currentAnnexId = currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId;
      
      const monthTransactions = finances.filter(f => {
          const d = new Date(f.fecha);
          return d.getMonth() + 1 === reportMonth && d.getFullYear() === reportYear && f.anexoId === currentAnnexId;
      });

      const totalOfrendas = monthTransactions.filter(t => t.tipo === 'Ofrenda' || t.tipo === 'Actividad').reduce((s,t) => s + t.monto, 0);
      const totalDiezmos = monthTransactions.filter(t => t.tipo === 'Diezmo').reduce((s,t) => s + t.monto, 0);
      const totalHonras = monthTransactions.filter(t => t.tipo === 'Honra Especial').reduce((s,t) => s + t.monto, 0);
      
      const newReport = {
          id: `REP-${Date.now()}`,
          anexoId: currentAnnexId,
          month: reportMonth,
          year: reportYear,
          totalOfrendas,
          totalDiezmos,
          totalHonras,
          totalGeneral: totalOfrendas + totalDiezmos + totalHonras,
          status: 'ENVIADO' as const,
          fechaEnvio: new Date().toISOString().split('T')[0],
          evidenceUrl: evidenceFile
      };

      addMonthlyReport(newReport);
      setIsEvidenceModalOpen(false);
  };

  const handlePrintReport = (report: MonthlyReport) => {
      setReportToPrint(report);
      setTimeout(() => window.print(), 100);
  };

  const handleExportExcel = () => {
      notify("Generando archivo Excel...", "success");
      setTimeout(() => notify("Descarga iniciada: Reporte_Financiero_2024.xlsx"), 1500);
  };

  // Filter finances based on view
  const visibleFinances = finances.filter(f => 
    currentUser.anexoId === 'ALL' || f.anexoId === currentUser.anexoId
  );

  // Filter members for dropdown
  const visibleMembers = members.filter(m => 
    currentUser.anexoId === 'ALL' || m.anexoId === currentUser.anexoId
  );

  // Visible Reports
  const visibleReports = monthlyReports.filter(r => 
    currentUser.anexoId === 'ALL' || r.anexoId === currentUser.anexoId
  ).sort((a,b) => b.month - a.month);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex items-center gap-4 no-print">
        <div className="bg-emerald-100 p-3 rounded-2xl shadow-sm">
             <Wallet className="w-6 h-6 text-emerald-600" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tesorería</h2>
            <p className="text-sm text-slate-500 font-medium">Control de Fidelidad y Reportes</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar no-print">
          <button 
            onClick={() => setActiveTab('TRANSACCIONES')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'TRANSACCIONES' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Registro Diario
          </button>
          <button 
            onClick={() => setActiveTab('REPORTES')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'REPORTES' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Cierre Mensual
          </button>
          {currentUser.role === 'PASTOR_PRINCIPAL' && (
              <button 
                onClick={() => setActiveTab('ANALISIS')}
                className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ANALISIS' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                  Análisis
              </button>
          )}
      </div>

      {activeTab === 'TRANSACCIONES' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 no-print">
            {/* Entry Form Card */}
            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-card border border-slate-50 h-fit">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></div>
                    Nuevo Ingreso
                </h3>
                
                <form onSubmit={handleSubmitTransaction} className="space-y-6">
                    {/* Type Selector (Pills) */}
                    <div className="grid grid-cols-3 gap-3">
                        {['Diezmo', 'Ofrenda', 'Honra Especial'].map(t => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setType(t as any)}
                                className={`py-3.5 rounded-2xl text-xs md:text-sm font-bold transition-all btn-hover ${
                                    type === t 
                                    ? 'bg-emerald-500 text-white shadow-glow ring-2 ring-emerald-500 ring-emerald-offset-2' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                                }`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>

                    {/* MEMBER SELECTION */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Miembro (Trazabilidad)
                        </label>
                        <select 
                            value={selectedMemberId}
                            onChange={e => setSelectedMemberId(e.target.value)}
                            className="w-full p-3 rounded-xl border-none bg-white font-bold text-slate-700 focus:ring-2 focus:ring-emerald-300 outline-none shadow-sm"
                        >
                            <option value="">-- Anónimo / Visitante --</option>
                            {visibleMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.nombres}</option>
                            ))}
                        </select>
                    </div>

                    {/* Amount Input */}
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

                    {/* Conditional Event Select */}
                    {type === 'Honra Especial' && (
                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 animate-fadeIn">
                            <label className="block text-xs font-bold text-amber-700 uppercase mb-2">Evento Vinculado</label>
                            <select 
                                value={linkedEvent}
                                onChange={e => setLinkedEvent(e.target.value)}
                                className="w-full p-3 rounded-xl border-none bg-white font-medium text-slate-700 focus:ring-2 focus:ring-amber-300 outline-none shadow-sm"
                            >
                                <option value="">-- Seleccionar Motivo --</option>
                                <option value="CUMPLE_PASTOR">Cumpleaños Pastor</option>
                                <option value="ANIVERSARIO">Aniversario Iglesia</option>
                                <option value="INVITADO">Predicador Invitado</option>
                            </select>
                        </div>
                    )}

                    {/* Detail Input */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2 pl-2">Detalle (Opcional)</label>
                        <input 
                            type="text" 
                            value={detail}
                            onChange={e => setDetail(e.target.value)}
                            className="w-full p-4 bg-white rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 outline-none text-sm font-medium transition-all shadow-sm"
                            placeholder="Ej. Familia Rodriguez"
                        />
                    </div>

                    <button type="submit" className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 shadow-glow transition-all btn-hover flex justify-center items-center gap-2 text-lg">
                        <Gift className="w-5 h-5" /> Registrar Ingreso
                    </button>
                </form>
            </div>

            {/* Recent List */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Últimos Movimientos</h3>
                <div className="bg-white rounded-[2rem] shadow-card border border-slate-50 overflow-hidden min-h-[400px]">
                    {visibleFinances.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full">
                            <div className="bg-slate-50 p-5 rounded-full mb-3">
                                <TrendingUp className="w-6 h-6 text-slate-300" />
                            </div>
                            <span className="font-medium">No hay registros recientes</span>
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-50">
                            {visibleFinances.map(tx => {
                                const memberName = members.find(m => m.id === tx.miembroId)?.nombres || 'Anónimo';
                                return (
                                    <li key={tx.id} className="p-5 flex justify-between items-center hover:bg-slate-50 transition-colors cursor-default group">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3.5 rounded-2xl transition-colors ${
                                                tx.tipo === 'Diezmo' 
                                                ? 'bg-blue-50 text-brand-blue group-hover:bg-blue-100' 
                                                : tx.tipo === 'Honra Especial' 
                                                ? 'bg-amber-50 text-amber-500 group-hover:bg-amber-100' 
                                                : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'
                                            }`}>
                                                <ArrowDownLeft className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{tx.tipo}</p>
                                                <p className="text-xs text-slate-500 font-medium">{memberName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-0.5">{tx.fecha}</p>
                                            </div>
                                        </div>
                                        <span className="font-extrabold text-slate-700 text-lg tracking-tight">S/ {tx.monto.toFixed(2)}</span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </div>
            </div>
          </div>
      )}

      {activeTab === 'REPORTES' && (
          <div className="space-y-8 no-print">
              {/* Report Generator (Treasurer View) */}
              {currentUser.role !== 'PASTOR_PRINCIPAL' && (
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden">
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div>
                              <h3 className="text-xl font-bold mb-2">Cierre Mensual</h3>
                              <p className="text-slate-400 text-sm mb-4">Seleccione el mes para generar el reporte y enviar evidencia.</p>
                              
                              <div className="flex gap-4">
                                  <select 
                                    value={reportMonth} 
                                    onChange={e => setReportMonth(parseInt(e.target.value))}
                                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  >
                                      {[...Array(12)].map((_, i) => <option key={i} value={i+1} className="text-slate-800">Mes {i+1}</option>)}
                                  </select>
                                  <select 
                                    value={reportYear} 
                                    onChange={e => setReportYear(parseInt(e.target.value))}
                                    className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                  >
                                      <option value={2023} className="text-slate-800">2023</option>
                                      <option value={2024} className="text-slate-800">2024</option>
                                  </select>
                              </div>
                          </div>
                          
                          <button 
                            onClick={handlePrepareReport}
                            className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-bold shadow-glow flex items-center gap-3 transition-transform hover:scale-105"
                          >
                              <Upload className="w-5 h-5" /> Enviar Reporte
                          </button>
                      </div>
                  </div>
              )}

              {/* Reports List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleReports.map(report => (
                      <div key={report.id} className="bg-white p-6 rounded-[2.5rem] shadow-card border border-slate-50 flex flex-col relative group hover:shadow-lg transition-all">
                          <button onClick={() => handlePrintReport(report)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 transition-colors hidden group-hover:block" title="Imprimir Reporte">
                              <Printer className="w-5 h-5" />
                          </button>

                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h4 className="font-bold text-slate-800 text-lg">Reporte {report.month}/{report.year}</h4>
                                  <p className="text-xs text-slate-400 font-bold uppercase">{anexos.find(a => a.id === report.anexoId)?.nombre || report.anexoId}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                  report.status === 'RECIBIDO' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                              }`}>
                                  {report.status}
                              </span>
                          </div>

                          <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl">
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Ofrendas</span>
                                  <span className="font-bold text-slate-700">S/ {report.totalOfrendas}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                  <span className="text-slate-500">Diezmos</span>
                                  <span className="font-bold text-slate-700">S/ {report.totalDiezmos}</span>
                              </div>
                              <div className="pt-2 border-t border-slate-200 flex justify-between text-base">
                                  <span className="font-bold text-slate-800">Total</span>
                                  <span className="font-extrabold text-emerald-600">S/ {report.totalGeneral}</span>
                              </div>
                          </div>

                          <div className="mt-auto flex gap-2">
                              {report.evidenceUrl && (
                                <button 
                                    onClick={() => setViewEvidenceUrl(report.evidenceUrl!)}
                                    className="flex-1 py-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 flex justify-center items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> Ver Evidencia
                                </button>
                              )}
                              {currentUser.role === 'PASTOR_PRINCIPAL' && report.status !== 'RECIBIDO' && (
                                  <button 
                                    onClick={() => updateMonthlyReport(report.id, { status: 'RECIBIDO' })}
                                    className="flex-1 py-3 bg-emerald-500 text-white font-bold rounded-xl text-xs hover:bg-emerald-600 flex justify-center items-center gap-2"
                                  >
                                      <CheckCircle2 className="w-4 h-4" /> Aprobar
                                  </button>
                              )}
                          </div>
                      </div>
                  ))}
                  {visibleReports.length === 0 && (
                      <div className="col-span-3 text-center py-12 text-slate-400 flex flex-col items-center">
                          <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                          <p>No hay reportes mensuales registrados.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* HIDDEN PRINT TEMPLATE (FORMAL REPORT) */}
      <div className="hidden print-only-visible p-8 max-w-3xl mx-auto border-4 border-slate-800">
          {reportToPrint && (
              <div className="text-center font-serif text-slate-900">
                  <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-8">
                      <div className="flex items-center gap-3">
                          <Church className="w-8 h-8" />
                          <div className="text-left">
                              <h1 className="text-xl font-bold uppercase">Iglesia La Shekinah</h1>
                              <p className="text-xs text-slate-500">Visión Misionera Mundial</p>
                          </div>
                      </div>
                      <div className="text-right">
                          <h2 className="text-lg font-bold">REPORTE FINANCIERO</h2>
                          <p className="text-sm">Mes: {reportToPrint.month} / {reportToPrint.year}</p>
                      </div>
                  </div>

                  <div className="mb-8 text-left">
                      <p className="font-bold">Anexo: <span className="font-normal">{anexos.find(a => a.id === reportToPrint.anexoId)?.nombre}</span></p>
                      <p className="font-bold">Fecha de Emisión: <span className="font-normal">{new Date().toLocaleDateString()}</span></p>
                  </div>

                  <table className="w-full border-collapse border border-slate-300 mb-12">
                      <thead className="bg-slate-100">
                          <tr>
                              <th className="border border-slate-300 p-3 text-left">Concepto</th>
                              <th className="border border-slate-300 p-3 text-right">Monto (S/)</th>
                          </tr>
                      </thead>
                      <tbody>
                          <tr>
                              <td className="border border-slate-300 p-3">Ofrendas Generales</td>
                              <td className="border border-slate-300 p-3 text-right">{reportToPrint.totalOfrendas.toFixed(2)}</td>
                          </tr>
                          <tr>
                              <td className="border border-slate-300 p-3">Diezmos</td>
                              <td className="border border-slate-300 p-3 text-right">{reportToPrint.totalDiezmos.toFixed(2)}</td>
                          </tr>
                          <tr>
                              <td className="border border-slate-300 p-3">Honras Especiales</td>
                              <td className="border border-slate-300 p-3 text-right">{reportToPrint.totalHonras.toFixed(2)}</td>
                          </tr>
                          <tr className="font-bold bg-slate-50">
                              <td className="border border-slate-300 p-3 text-right">TOTAL GENERAL</td>
                              <td className="border border-slate-300 p-3 text-right">{reportToPrint.totalGeneral.toFixed(2)}</td>
                          </tr>
                      </tbody>
                  </table>

                  <div className="grid grid-cols-2 gap-20 mt-32">
                      <div className="border-t border-slate-800 pt-2">
                          <p className="font-bold">Tesorero de Anexo</p>
                          <p className="text-xs">Firma y Sello</p>
                      </div>
                      <div className="border-t border-slate-800 pt-2">
                          <p className="font-bold">Pastor Principal</p>
                          <p className="text-xs">Visto Bueno</p>
                      </div>
                  </div>
              </div>
          )}
      </div>

      {/* UPLOAD EVIDENCE MODAL */}
      {isEvidenceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn no-print">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <button onClick={() => setIsEvidenceModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Adjuntar Evidencia</h3>
                  <p className="text-sm text-slate-500 mb-6">Suba la foto del voucher o cuaderno de registro.</p>
                  
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 mb-6 cursor-pointer hover:bg-slate-50 hover:border-emerald-400 transition-all group"
                  >
                      {evidenceFile ? (
                          <div className="relative">
                              <img src={evidenceFile} className="h-32 w-full object-contain rounded-lg shadow-sm" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                  <span className="text-white font-bold text-xs bg-black/50 px-2 py-1 rounded">Cambiar</span>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center gap-3 text-slate-400">
                              {isUploading ? (
                                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                              ) : (
                                  <UploadCloud className="w-8 h-8 group-hover:text-emerald-500 transition-colors" />
                              )}
                              <span className="text-xs font-bold uppercase">{isUploading ? 'Subiendo...' : 'Toca para subir'}</span>
                          </div>
                      )}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileSelect}
                      />
                  </div>

                  <button 
                    onClick={handleConfirmCloseMonth}
                    disabled={!evidenceFile || isUploading}
                    className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-glow transition-all"
                  >
                      Confirmar Envío
                  </button>
              </div>
          </div>
      )}

      {/* CHART ANALYSIS TAB (PASTOR) */}
      {activeTab === 'ANALISIS' && (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-card border border-slate-50 relative no-print">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                      <BarChart3 className="w-6 h-6 text-emerald-500" /> Comportamiento de Ingresos
                  </h3>
                  <button 
                    onClick={handleExportExcel}
                    className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-100 transition-colors"
                  >
                      <Download className="w-4 h-4" /> Exportar Excel
                  </button>
              </div>
              
              <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)'}} 
                          />
                          <Legend wrapperStyle={{paddingTop: '20px'}} iconType="circle" />
                          <Bar dataKey="diezmos" name="Diezmos" fill="#0ea5e9" radius={[4, 4, 0, 0]} barSize={20} />
                          <Bar dataKey="ofrendas" name="Ofrendas" fill="#34d399" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">Análisis en tiempo real de los últimos 6 meses</p>
          </div>
      )}

      {/* EVIDENCE VIEWER MODAL */}
      {viewEvidenceUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn no-print" onClick={() => setViewEvidenceUrl(null)}>
              <div className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => setViewEvidenceUrl(null)}
                    className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
                  >
                      <X className="w-8 h-8" />
                  </button>
                  <img src={viewEvidenceUrl} alt="Evidencia" className="w-full rounded-xl shadow-2xl border-4 border-white/20 max-h-[80vh] object-contain bg-black" />
              </div>
          </div>
      )}
    </div>
  );
};

export default Finances;
