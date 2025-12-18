
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { HelpCircle, MessageSquare, AlertTriangle, CheckCircle2, Send, FileText } from 'lucide-react';

const Support: React.FC = () => {
    const { currentUser, notify } = useApp();
    const [issueType, setIssueType] = useState('ERROR');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate API Call
        setTimeout(() => {
            setIsSubmitting(false);
            setSuccess(true);
            notify('Reporte enviado al equipo técnico');
        }, 1500);
    };

    if (success) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6 animate-fadeIn">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">¡Reporte Enviado!</h2>
                <p className="text-slate-500 max-w-md mx-auto">
                    Gracias por ayudarnos a mejorar el sistema Shekinah. El equipo técnico revisará tu caso y te contactará si es necesario.
                </p>
                <button
                    onClick={() => { setSuccess(false); setDescription(''); }}
                    className="bg-slate-800 text-white px-8 py-3 rounded-2xl font-bold hover:bg-black transition-colors cursor-pointer"
                >
                    Enviar otro reporte
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-fadeIn">
            <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-2xl shadow-sm">
                    <HelpCircle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Soporte Técnico</h2>
                    <p className="text-sm text-slate-500 font-medium">Reportar problemas o solicitar ayuda</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* FAQ / Info Side */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-50">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-slate-400" /> Antes de reportar
                        </h3>
                        <ul className="space-y-3 text-sm text-slate-500">
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 text-slate-600 font-bold px-2 rounded-md text-xs min-w-[20px] text-center">1</span>
                                Verifica tu conexión a internet.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 text-slate-600 font-bold px-2 rounded-md text-xs min-w-[20px] text-center">2</span>
                                Intenta recargar la página.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="bg-slate-100 text-slate-600 font-bold px-2 rounded-md text-xs min-w-[20px] text-center">3</span>
                                Revisa si tienes los permisos necesarios.
                            </li>
                        </ul>
                    </div>

                    <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
                        <h4 className="font-bold text-blue-800 mb-2">¿Necesitas capacitación?</h4>
                        <p className="text-xs text-blue-600 mb-4">Revisa el manual de usuario y los recursos doctrinales.</p>
                        <a href="#/resources" className="block w-full py-3 bg-white text-blue-600 font-bold text-center rounded-xl hover:shadow-md transition-all text-xs uppercase tracking-wide cursor-pointer">
                            Ir a Recursos
                        </a>
                    </div>
                </div>

                {/* Form Side */}
                <div className="md:col-span-2">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-50">
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Tipo de Incidencia</label>
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { id: 'ERROR', label: 'Error / Bug', icon: AlertTriangle },
                                        { id: 'DUDA', label: 'Consulta', icon: HelpCircle },
                                        { id: 'MEJORA', label: 'Sugerencia', icon: MessageSquare },
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            type="button"
                                            onClick={() => setIssueType(type.id)}
                                            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer ${issueType === type.id
                                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                : 'border-slate-100 bg-white text-slate-400 hover:border-slate-200'
                                                }`}
                                        >
                                            <type.icon className="w-6 h-6 mb-2" />
                                            <span className="text-xs font-bold">{type.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Descripción Detallada</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    required
                                    rows={6}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-blue-200 outline-none text-slate-700 font-medium resize-none"
                                    placeholder="Describe qué estabas haciendo y qué ocurrió..."
                                ></textarea>
                            </div>

                            {/* Auto-Captured Info */}
                            <div className="bg-slate-50 p-4 rounded-xl text-xs text-slate-400 font-mono space-y-1">
                                <p>Usuario: {currentUser.name} ({currentUser.role})</p>
                                <p>Navegador: {navigator.userAgent.substring(0, 50)}...</p>
                                <p>Fecha: {new Date().toLocaleString()}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting || !description}
                                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
                            >
                                {isSubmitting ? 'Enviando...' : <><Send className="w-5 h-5" /> Enviar Reporte</>}
                            </button>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Support;
