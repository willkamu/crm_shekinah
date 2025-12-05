
import React, { useState } from 'react';
import { Book, Shield, AlertCircle, Heart, Star, BookOpen, Search, User } from 'lucide-react';

const Resources: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'GLOSARIO' | 'NIVELES' | 'HONOR' | 'MANUALES'>('GLOSARIO');
  const [searchTerm, setSearchTerm] = useState('');

  const glossaryItems = [
      { term: 'Anexo', def: 'Obra o punto de predicación perteneciente a la iglesia central. Tiene líder y tesorero propio.' },
      { term: 'Casa de Enseñanza', def: 'Grupo pequeño para discipulado y formación básica. Dirigido por un Maestro.' },
      { term: 'Intercesor', def: 'Miembro asignado a un grupo (1-5) que cumple con ayunos y vigilias. Es un rango medible.' },
      { term: 'Honra', def: 'Ofrenda especial de gratitud al pastor o misiones. Se mide por constancia, no monto.' },
      { term: 'EPMI', def: 'Escuela de Preparación Ministerial Internacional. Requiere aprobación pastoral para ingresar.' },
      { term: 'Cobertura', def: 'Relación espiritual bajo autoridad pastoral. Protección espiritual.' },
      { term: 'Vigilia', def: 'Reunión nocturna de intercesión y guerra espiritual.' },
      { term: 'Ayuno', def: 'Abstención de alimentos para buscar a Dios. Disciplina espiritual clave.' },
      { term: 'Disciplina', def: 'Proceso de corrección amorosa y restauración bajo supervisión pastoral.' },
  ];

  const filteredGlossary = glossaryItems.filter(item => 
      item.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.def.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="bg-teal-100 p-3 rounded-2xl shadow-sm">
             <Book className="w-6 h-6 text-teal-600" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Recursos Doctrinales</h2>
            <p className="text-sm text-slate-500 font-medium">Manual operativo y definiciones pastorales</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          {[
              { id: 'GLOSARIO', label: 'Glosario' },
              { id: 'NIVELES', label: 'Niveles Espirituales' },
              { id: 'HONOR', label: 'Código de Honor' },
              { id: 'MANUALES', label: 'Guía de Usuario' },
          ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-teal-500 text-teal-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                  {tab.label}
              </button>
          ))}
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] shadow-card border border-slate-50 min-h-[50vh]">
          
          {activeTab === 'GLOSARIO' && (
              <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Definiciones Ministeriales (PDF Parte 18.1)</h3>
                      <div className="relative">
                          <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar término..." 
                            className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 w-48 transition-all"
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {filteredGlossary.map((item, i) => (
                          <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-teal-200 transition-colors">
                              <h4 className="font-bold text-teal-700 text-sm uppercase mb-2">{item.term}</h4>
                              <p className="text-sm text-slate-600 leading-relaxed">{item.def}</p>
                          </div>
                      ))}
                      {filteredGlossary.length === 0 && (
                          <p className="col-span-2 text-center text-slate-400 py-10">No se encontraron términos coincidentes.</p>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'NIVELES' && (
              <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Niveles Espirituales (Uso Interno)</h3>
                  <div className="space-y-4">
                      <div className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div className="bg-white p-2 rounded-full h-fit"><Star className="w-5 h-5 text-emerald-500" /></div>
                          <div>
                              <h4 className="font-bold text-emerald-800">Estable / Activo</h4>
                              <p className="text-sm text-emerald-700 mt-1">Miembro constante en asistencia y servicio. Puede ser propuesto para liderazgo.</p>
                          </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="bg-white p-2 rounded-full h-fit"><BookOpen className="w-5 h-5 text-blue-500" /></div>
                          <div>
                              <h4 className="font-bold text-blue-800">En Formación</h4>
                              <p className="text-sm text-blue-700 mt-1">Está cursando los 7 Básicos. Prioridad: completar estudios.</p>
                          </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <div className="bg-white p-2 rounded-full h-fit"><AlertCircle className="w-5 h-5 text-amber-500" /></div>
                          <div>
                              <h4 className="font-bold text-amber-800">En Observación</h4>
                              <p className="text-sm text-amber-700 mt-1">Detectada debilidad o inconsistencia. Requiere seguimiento pastoral cercano.</p>
                          </div>
                      </div>
                      <div className="flex gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
                          <div className="bg-white p-2 rounded-full h-fit"><Shield className="w-5 h-5 text-red-500" /></div>
                          <div>
                              <h4 className="font-bold text-red-800">En Disciplina / Restauración</h4>
                              <p className="text-sm text-red-700 mt-1">Remoción temporal de privilegios. No puede ministrar ni viajar.</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'HONOR' && (
              <div className="space-y-6">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">Código de Honor (PDF 18.8)</h3>
                  <ul className="space-y-4">
                      {[
                          "La autoridad viene de Dios. El Pastor Principal es la cabeza espiritual.",
                          "Los datos espirituales son confidenciales. Nunca se usan para chismes.",
                          "El sistema nunca sustituye la guía del Espíritu Santo.",
                          "Todo dato que se registra debe ser verdadero (Integridad).",
                          "El sistema promueve orden y transparencia."
                      ].map((rule, i) => (
                          <li key={i} className="flex items-start gap-3 text-slate-600">
                              <Heart className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                              <span className="font-medium">{rule}</span>
                          </li>
                      ))}
                  </ul>
              </div>
          )}

          {activeTab === 'MANUALES' && (
              <div className="space-y-8 animate-fadeIn">
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <User className="w-5 h-5 text-teal-600"/> Tareas del Líder de Anexo
                      </h3>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 text-sm text-slate-600">
                          <p><strong className="text-slate-800">1. Registrar Asistencia (Semanal):</strong> Ingresar al panel "Mi Anexo" el mismo día del culto. Marcar presentes y ausentes para mantener el semáforo actualizado.</p>
                          <p><strong className="text-slate-800">2. Supervisar Casas:</strong> Revisar semanalmente que los maestros hayan registrado sus clases. Si una casa tiene baja asistencia, visitar al maestro.</p>
                          <p><strong className="text-slate-800">3. Finanzas (Mensual):</strong> Antes del día 5, verificar que el Tesorero haya subido la foto del voucher en la sección "Finanzas".</p>
                      </div>
                  </div>

                  <div>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-teal-600"/> Tareas del Maestro de Casa
                      </h3>
                      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-4 text-sm text-slate-600">
                          <p><strong className="text-slate-800">1. Tomar Lista:</strong> En cada reunión, usar el botón "Tomar Asistencia" en su panel.</p>
                          <p><strong className="text-slate-800">2. Registrar Progreso:</strong> Cuando un alumno termina un curso básico, marcarlo como completado para que pueda avanzar a EPMI.</p>
                          <p><strong className="text-slate-800">3. Reportar Problemas:</strong> Si un alumno falta 3 veces seguidas, avisar al Líder de Anexo.</p>
                      </div>
                  </div>
              </div>
          )}

      </div>
    </div>
  );
};

export default Resources;
