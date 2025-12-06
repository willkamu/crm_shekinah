
import React, { useState } from 'react';
import { useApp } from '../App.tsx';
import { Member, EpmiEnrollment, Course } from '../types';
import { GraduationCap, Award, BookOpen, AlertCircle, CheckCircle2, UserCheck, ChevronRight, Star, X, Save, AlertTriangle, TrendingUp, MoreVertical, Printer, Search, Plus, UserX, Edit2, List, FileText, Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const Epmi: React.FC = () => {
  const { members, courses, epmiEnrollments, enrollEpmiStudent, updateEpmiStudent, currentUser, updateMember, notify } = useApp();
  const [activeTab, setActiveTab] = useState<'CANDIDATOS' | 'AULA' | 'SERVICIO' | 'GRADUADOS'>('CANDIDATOS');

  // Grading Modal State
  const [isGradingOpen, setIsGradingOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<EpmiEnrollment | null>(null);
  const [gradeCourseId, setGradeCourseId] = useState('');
  const [gradeValue, setGradeValue] = useState('');

  // Confirmation Modals State
  const [promoteStudent, setPromoteStudent] = useState<EpmiEnrollment | null>(null);
  const [graduateStudent, setGraduateStudent] = useState<EpmiEnrollment | null>(null);
  
  // Certificate Modal
  const [certificateStudent, setCertificateStudent] = useState<EpmiEnrollment | null>(null);

  // Manual Candidate Search Modal
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Service Year Assignment Modal
  const [isServiceAssignOpen, setIsServiceAssignOpen] = useState(false);
  const [serviceLocation, setServiceLocation] = useState('');
  const [serviceSupervisorId, setServiceSupervisorId] = useState('');

  // Edit Student Modal
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false);
  const [editObservations, setEditObservations] = useState('');

  // --- LOGIC: SUGERIR CANDIDATO (PDF 9.5) ---
  const potentialCandidates = members.filter(m => {
      const hasBasics = m.completed_basicos;
      const isEnrolled = epmiEnrollments.some(e => e.memberId === m.id && e.status === 'ACTIVO');
      const isCandidate = m.candidate_epmi;
      const goodAttendance = m.attendance_level === 'VERDE' || m.attendance_level === 'AMARILLO';
      return !isEnrolled && (isCandidate || (hasBasics && goodAttendance));
  });

  // --- LOGIC: AULA VIRTUAL ---
  const activeStudents = epmiEnrollments.filter(e => e.status === 'ACTIVO');
  const ciclo1Students = activeStudents.filter(e => e.cycle === 'CICLO_I');
  const ciclo2Students = activeStudents.filter(e => e.cycle === 'CICLO_II');
  const serviceStudents = activeStudents.filter(e => e.cycle === 'SERVICIO');
  const graduatedStudents = epmiEnrollments.filter(e => e.cycle === 'GRADUADO');

  const handleOpenGrading = (student: EpmiEnrollment) => {
      setSelectedStudent(student);
      setGradeCourseId('');
      setGradeValue('');
      setIsGradingOpen(true);
  };

  const handleSubmitGrade = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedStudent && gradeCourseId && gradeValue) {
          const val = parseInt(gradeValue);
          if (val < 0 || val > 20) {
              notify("La nota debe ser entre 0 y 20", 'error');
              return;
          }
          
          updateEpmiStudent(selectedStudent.id, { 
              grades: { ...selectedStudent.grades, [gradeCourseId]: val } 
          });
          setIsGradingOpen(false);
          notify("Nota registrada correctamente");
      }
  };

  const handlePromoteClick = (student: EpmiEnrollment) => {
      if (student.cycle === 'CICLO_II') {
          setSelectedStudent(student);
          setServiceLocation('');
          setServiceSupervisorId('');
          setIsServiceAssignOpen(true);
      } else {
          setPromoteStudent(student);
      }
  };

  const handleConfirmPromote = () => {
      if (promoteStudent) {
          const newCycle = promoteStudent.cycle === 'CICLO_I' ? 'CICLO_II' : 'SERVICIO';
          updateEpmiStudent(promoteStudent.id, { cycle: newCycle });
          setPromoteStudent(null);
          notify(`Estudiante promovido a ${newCycle.replace('_', ' ')}`);
      }
  };

  const handleConfirmServiceAssignment = () => {
      if (selectedStudent && serviceLocation && serviceSupervisorId) {
          updateEpmiStudent(selectedStudent.id, { 
              cycle: 'SERVICIO',
              serviceLocation,
              serviceSupervisorId
          });
          setIsServiceAssignOpen(false);
          setSelectedStudent(null);
          notify("Estudiante promovido a Año de Servicio");
      } else {
          notify("Debe completar ubicación y supervisor", "error");
      }
  };

  const handleGraduate = () => {
      if (graduateStudent) {
          updateEpmiStudent(graduateStudent.id, { cycle: 'GRADUADO', status: 'BAJA' });
          setGraduateStudent(null);
          notify("¡Felicidades! Miembro graduado oficialmente.");
      }
  };

  const handleManualPostulation = (memberId: string) => {
      updateMember(memberId, { candidate_epmi: true });
      setIsManualSearchOpen(false);
      notify("Miembro agregado a lista de candidatos");
  };

  const handleDiscardCandidate = (memberId: string) => {
      if(confirm("¿Descartar candidato de la lista de sugerencias?")) {
          updateMember(memberId, { candidate_epmi: false });
          notify("Candidato descartado");
      }
  };

  const handleEditStudent = (student: EpmiEnrollment) => {
      setSelectedStudent(student);
      setEditObservations(student.observations || '');
      setIsEditStudentOpen(true);
  };

  const handleSaveStudentEdit = () => {
      if (selectedStudent) {
          updateEpmiStudent(selectedStudent.id, { observations: editObservations });
          setIsEditStudentOpen(false);
          setSelectedStudent(null);
          notify("Datos del estudiante actualizados");
      }
  };

  const getAvailableCoursesForGrading = () => {
      if (!selectedStudent) return [];
      const type = selectedStudent.cycle === 'CICLO_I' ? 'EPMI_I' : 'EPMI_II';
      return courses.filter(c => c.type === type);
  };

  const renderStudentList = (students: EpmiEnrollment[], cycleType: 'EPMI_I' | 'EPMI_II') => {
      const cycleCourses = courses.filter(c => c.type === cycleType).sort((a,b) => a.orden - b.orden);

      return (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden mb-8">
            {/* Header Malla Curricular */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-brand-blue"/> Malla Curricular ({cycleCourses.length} Cursos)
                    </h4>
                    <Link to="/courses" className="text-xs font-bold text-brand-blue hover:text-brand-dark flex items-center gap-1">
                        <Settings className="w-3 h-3" /> Configurar Cursos
                    </Link>
                </div>
                
                {cycleCourses.length > 0 ? (
                    <div className="flex flex-wrap gap-3">
                        {cycleCourses.map(c => (
                            <div key={c.id} className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 shadow-sm flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                                {c.nombre}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-amber-800 text-xs">
                            <AlertCircle className="w-4 h-4" />
                            <span>No hay cursos configurados para este ciclo.</span>
                        </div>
                        <Link to="/courses" className="bg-white text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-200 hover:bg-amber-100">
                            Agregar Cursos
                        </Link>
                    </div>
                )}
            </div>

            {/* Desktop Table (Gradebook View) - ALWAYS SHOW HEADERS */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-white text-slate-500 text-xs font-bold uppercase tracking-wider text-left border-b border-slate-100">
                        <tr>
                            <th className="p-4 whitespace-nowrap sticky left-0 bg-white z-10 border-r border-slate-50">Estudiante</th>
                            <th className="p-4 whitespace-nowrap text-center bg-slate-50/30">Asist. %</th>
                            {/* Dynamic Course Headers */}
                            {cycleCourses.map(c => (
                                <th key={c.id} className="p-4 text-center min-w-[120px] bg-slate-50/30 border-l border-slate-100" title={c.nombre}>
                                    {c.nombre.substring(0, 15)}{c.nombre.length > 15 ? '...' : ''}
                                </th>
                            ))}
                            <th className="p-4 text-right sticky right-0 bg-white z-10 border-l border-slate-50">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {students.length === 0 && (
                            <tr>
                                <td colSpan={3 + cycleCourses.length} className="p-12 text-center text-slate-400 text-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <Users className="w-8 h-8 opacity-20" />
                                        <span>No hay estudiantes inscritos en este ciclo.</span>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {students.map(student => {
                            const member = members.find(m => m.id === student.memberId);
                            return (
                                <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-4 sticky left-0 bg-white z-10 border-r border-slate-50 group-hover:bg-slate-50/50">
                                        <div className="flex items-center gap-3">
                                            <img src={member?.photoUrl} className="w-10 h-10 rounded-full bg-slate-100" />
                                            <div>
                                                <span className="font-bold text-slate-700 block whitespace-nowrap">{member?.nombres}</span>
                                                <span className="text-[10px] text-slate-400">{student.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${student.attendance < 70 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {student.attendance}%
                                        </span>
                                    </td>
                                    
                                    {/* Grade Cells */}
                                    {cycleCourses.map(c => {
                                        const grade = student.grades[c.id];
                                        return (
                                            <td key={c.id} className="p-4 text-center border-l border-slate-50">
                                                {grade !== undefined ? (
                                                    <span className={`text-sm font-bold ${grade < 11 ? 'text-red-500' : 'text-slate-700'}`}>
                                                        {grade < 10 ? `0${grade}` : grade}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-200 text-lg">•</span>
                                                )}
                                            </td>
                                        );
                                    })}

                                    <td className="p-4 text-right flex justify-end gap-2 sticky right-0 bg-white z-10 border-l border-slate-50 group-hover:bg-slate-50/50">
                                        <button onClick={() => handleEditStudent(student)} className="p-2 text-slate-300 hover:text-brand-blue rounded-lg hover:bg-slate-100" title="Editar">
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                        <button 
                                        onClick={() => handleOpenGrading(student)}
                                        className="px-3 py-1.5 bg-slate-100 text-brand-blue font-bold text-xs rounded-lg hover:bg-brand-soft"
                                        >
                                            Calificar
                                        </button>
                                        <button 
                                        onClick={() => handlePromoteClick(student)}
                                        className="px-3 py-1.5 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg hover:bg-emerald-100"
                                        >
                                            Promover
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
                {students.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        <p>No hay estudiantes inscritos.</p>
                    </div>
                )}
                {students.map(student => {
                    const member = members.find(m => m.id === student.memberId);
                    return (
                        <div key={student.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-4">
                                <img src={member?.photoUrl} className="w-12 h-12 rounded-full bg-slate-100" />
                                <div>
                                    <h4 className="font-bold text-slate-800">{member?.nombres}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${student.attendance < 70 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            Asistencia: {student.attendance}%
                                        </span>
                                    </div>
                                </div>
                                <button onClick={() => handleEditStudent(student)} className="ml-auto p-2 bg-slate-50 rounded-full text-slate-400">
                                    <Edit2 className="w-4 h-4"/>
                                </button>
                            </div>
                            
                            <div className="mb-4 bg-slate-50 p-3 rounded-2xl">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                                    <BookOpen className="w-3 h-3"/> Notas Registradas
                                </p>
                                <div className="space-y-2">
                                    {cycleCourses.map(c => (
                                        <div key={c.id} className="flex justify-between items-center text-xs border-b border-slate-200 pb-1 last:border-0 last:pb-0">
                                            <span className="text-slate-600 truncate max-w-[200px]">{c.nombre}</span>
                                            <span className={`font-bold ${student.grades[c.id] ? (student.grades[c.id] < 11 ? 'text-red-500' : 'text-slate-800') : 'text-slate-300'}`}>
                                                {student.grades[c.id] || '-'}
                                            </span>
                                        </div>
                                    ))}
                                    {cycleCourses.length === 0 && <p className="text-xs text-slate-400 italic">No hay cursos registrados en este ciclo.</p>}
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <button 
                                    onClick={() => handleOpenGrading(student)}
                                    className="flex-1 py-3 bg-brand-soft text-brand-blue font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors"
                                >
                                    Calificar
                                </button>
                                <button 
                                    onClick={() => handlePromoteClick(student)}
                                    className="flex-1 py-3 bg-emerald-50 text-emerald-600 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-colors"
                                >
                                    {cycleType === 'EPMI_II' ? 'A Servicio' : 'Promover'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
          </div>
      );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-gradient-to-br from-yellow-400 to-amber-600 p-3 rounded-2xl shadow-glow text-white">
             <GraduationCap className="w-8 h-8" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Escuela EPMI</h2>
            <p className="text-sm text-slate-500 font-medium">Preparación Ministerial Internacional</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('CANDIDATOS')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'CANDIDATOS' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Candidatos
          </button>
          <button 
            onClick={() => setActiveTab('AULA')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'AULA' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Aula Virtual
          </button>
          <button 
            onClick={() => setActiveTab('SERVICIO')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'SERVICIO' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Año de Servicio
          </button>
          <button 
            onClick={() => setActiveTab('GRADUADOS')}
            className={`px-6 py-4 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${activeTab === 'GRADUADOS' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
              Graduados
          </button>
      </div>

      {/* TAB: CANDIDATOS */}
      {activeTab === 'CANDIDATOS' && (
          <div className="space-y-6">
              <div className="flex justify-between items-center bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="text-sm text-amber-800 font-medium flex items-center gap-2">
                      <AlertCircle className="w-5 h-5"/> El sistema sugiere candidatos, pero el Pastor decide.
                  </p>
                  <button 
                    onClick={() => { setSearchTerm(''); setIsManualSearchOpen(true); }}
                    className="bg-white text-amber-600 px-4 py-2 rounded-xl text-xs font-bold border border-amber-200 hover:bg-amber-100 flex items-center gap-2"
                  >
                      <Plus className="w-4 h-4"/> Postular Manualmente
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {potentialCandidates.length === 0 ? (
                      <div className="col-span-2 text-center py-12 text-slate-400 bg-white rounded-3xl border border-slate-100">
                          <p>No hay candidatos pendientes.</p>
                      </div>
                  ) : (
                      potentialCandidates.map(candidate => (
                          <div key={candidate.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-card flex flex-col justify-between hover:shadow-lg transition-all relative group">
                              <button 
                                onClick={() => handleDiscardCandidate(candidate.id)}
                                className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                title="Descartar"
                              >
                                  <UserX className="w-5 h-5" />
                              </button>

                              <div className="flex items-start gap-4 mb-4">
                                  <img src={candidate.photoUrl} className="w-16 h-16 rounded-full bg-slate-100 object-cover" />
                                  <div>
                                      <h4 className="font-bold text-lg text-slate-800">{candidate.nombres}</h4>
                                      <div className="flex flex-wrap gap-2 mt-2">
                                          {candidate.completed_basicos && <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full">7 Básicos OK</span>}
                                          <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Asistencia OK</span>
                                      </div>
                                  </div>
                              </div>
                              
                              {/* Suggested Flag Logic */}
                              {!candidate.candidate_epmi ? (
                                  <div className="bg-slate-50 p-3 rounded-xl mb-4 text-xs text-slate-500 flex items-center">
                                      <TrendingUp className="w-4 h-4 mr-2" />
                                      Sugerencia automática por rendimiento.
                                  </div>
                              ) : (
                                  <div className="bg-amber-50 p-3 rounded-xl mb-4 text-xs text-amber-700 flex items-center">
                                      <CheckCircle2 className="w-4 h-4 mr-2" />
                                      Candidato Oficial. Listo para inscribir.
                                  </div>
                              )}

                              <div className="flex gap-2 mt-auto">
                                  {!candidate.candidate_epmi ? (
                                      <button 
                                        onClick={() => {
                                            updateMember(candidate.id, { candidate_epmi: true });
                                            notify("Marcado como candidato oficial");
                                        }}
                                        className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                      >
                                          Aprobar Candidatura
                                      </button>
                                  ) : (
                                      <button 
                                        onClick={() => enrollEpmiStudent(candidate.id)}
                                        className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-glow flex justify-center items-center gap-2"
                                      >
                                          <Award className="w-4 h-4" /> Inscribir Ciclo I
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      )}

      {/* TAB: AULA VIRTUAL */}
      {activeTab === 'AULA' && (
          <div className="space-y-8">
              {/* CICLO I */}
              <div>
                  <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm">I</div>
                      Ciclo I: Fundamentos
                  </h3>
                  {renderStudentList(ciclo1Students, 'EPMI_I')}
              </div>

              {/* CICLO II */}
              <div>
                  <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm">II</div>
                      Ciclo II: Liderazgo
                  </h3>
                  {renderStudentList(ciclo2Students, 'EPMI_II')}
              </div>
          </div>
      )}

      {/* TAB: AÑO DE SERVICIO */}
      {activeTab === 'SERVICIO' && (
          <div className="space-y-6">
              <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 text-amber-800 text-sm">
                  <h4 className="font-bold flex items-center gap-2 mb-2"><Star className="w-5 h-5"/> Requisito de Graduación</h4>
                  <p>Para graduarse oficialmente, el estudiante debe completar 1 año de servicio práctico en un ministerio o anexo asignado, bajo supervisión pastoral.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceStudents.map(student => {
                      const member = members.find(m => m.id === student.memberId);
                      const supervisor = members.find(m => m.id === student.serviceSupervisorId);
                      return (
                          <div key={student.id} className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 relative group">
                              <button onClick={() => handleEditStudent(student)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-brand-blue"><Edit2 className="w-4 h-4"/></button>
                              
                              <div className="flex items-center gap-4 mb-4">
                                  <img src={member?.photoUrl} className="w-12 h-12 rounded-full" />
                                  <div>
                                      <h4 className="font-bold text-slate-800">{member?.nombres}</h4>
                                      <p className="text-xs text-slate-400">Inicio: {student.startDate}</p>
                                  </div>
                              </div>
                              
                              <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-xl">
                                  <div className="flex justify-between text-sm">
                                      <span className="text-slate-500">Ubicación</span>
                                      <span className="font-bold text-slate-700">{student.serviceLocation || 'No asignado'}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                      <span className="text-slate-500">Supervisor</span>
                                      <span className="font-bold text-slate-700">{supervisor?.nombres || 'No asignado'}</span>
                                  </div>
                              </div>

                              {currentUser.role === 'PASTOR_PRINCIPAL' && (
                                  <button 
                                    onClick={() => setGraduateStudent(student)}
                                    className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-black transition-colors flex items-center justify-center gap-2"
                                  >
                                      <Award className="w-4 h-4" /> Graduar
                                  </button>
                              )}
                          </div>
                      )
                  })}
                  {serviceStudents.length === 0 && (
                      <div className="col-span-2 text-center py-12 text-slate-400">No hay estudiantes en año de servicio.</div>
                  )}
              </div>
          </div>
      )}

      {/* TAB: GRADUADOS */}
      {activeTab === 'GRADUADOS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {graduatedStudents.map(student => {
                  const member = members.find(m => m.id === student.memberId);
                  return (
                      <div key={student.id} className="bg-white p-6 rounded-3xl shadow-card border border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                              <img src={member?.photoUrl} className="w-16 h-16 rounded-full border-4 border-amber-100" />
                              <div>
                                  <h4 className="font-bold text-slate-800">{member?.nombres}</h4>
                                  <p className="text-xs text-amber-600 font-bold uppercase tracking-wider">Obrero Aprobado</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => setCertificateStudent(student)}
                            className="bg-slate-50 p-3 rounded-2xl hover:bg-slate-100 text-slate-600 transition-colors border border-slate-200"
                            title="Ver Diploma"
                          >
                              <Award className="w-6 h-6" />
                          </button>
                      </div>
                  )
              })}
              {graduatedStudents.length === 0 && (
                  <div className="col-span-2 text-center py-12 text-slate-400">No hay graduados registrados aún.</div>
              )}
          </div>
      )}

      {/* MANUAL SEARCH MODAL */}
      {isManualSearchOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 h-[60vh] flex flex-col">
                  <button onClick={() => setIsManualSearchOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-4">Postular Miembro</h3>
                  
                  <div className="relative mb-4">
                      <input 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-amber-200 font-medium"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        autoFocus
                      />
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {members.filter(m => 
                          m.nombres.toLowerCase().includes(searchTerm.toLowerCase()) && 
                          !m.candidate_epmi && 
                          !epmiEnrollments.some(e => e.memberId === m.id && e.status === 'ACTIVO')
                      ).map(m => (
                          <div key={m.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-amber-50 cursor-pointer" onClick={() => handleManualPostulation(m.id)}>
                              <div className="flex items-center gap-3">
                                  <img src={m.photoUrl} className="w-8 h-8 rounded-full" />
                                  <span className="font-bold text-sm text-slate-700">{m.nombres}</span>
                              </div>
                              <Plus className="w-4 h-4 text-amber-500" />
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* SERVICE ASSIGN MODAL */}
      {isServiceAssignOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsServiceAssignOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Asignación Práctica</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Lugar de Servicio</label>
                          <input 
                            placeholder="Ej. Anexo Central - Ministerio de Niños"
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-200 font-bold text-slate-700"
                            value={serviceLocation}
                            onChange={e => setServiceLocation(e.target.value)}
                          />
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Supervisor (Mentor)</label>
                          <select 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-200 font-medium text-slate-700"
                            value={serviceSupervisorId}
                            onChange={e => setServiceSupervisorId(e.target.value)}
                          >
                              <option value="">-- Seleccionar --</option>
                              {members.filter(m => ['PASTOR_PRINCIPAL', 'MINISTRO', 'LIDER_ANEXO'].includes('PASTOR_PRINCIPAL') || true).map(m => (
                                  <option key={m.id} value={m.id}>{m.nombres}</option>
                              ))}
                          </select>
                      </div>
                      
                      <button 
                        onClick={handleConfirmServiceAssignment}
                        disabled={!serviceLocation || !serviceSupervisorId}
                        className="w-full py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-colors shadow-lg mt-4 disabled:opacity-50"
                      >
                          Confirmar Año de Servicio
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* EDIT STUDENT MODAL */}
      {isEditStudentOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsEditStudentOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Estudiante</h3>
                  
                  <div className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Observaciones</label>
                          <textarea 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light text-slate-700 h-24 resize-none"
                            value={editObservations}
                            onChange={e => setEditObservations(e.target.value)}
                            placeholder="Notas sobre el desempeño..."
                          />
                      </div>
                      
                      <button 
                        onClick={handleSaveStudentEdit}
                        className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg mt-4"
                      >
                          Guardar Cambios
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* GRADING MODAL */}
      {isGradingOpen && selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsGradingOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Registrar Calificación</h3>
                  
                  <div className="bg-slate-50 p-4 rounded-2xl mb-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {members.find(m => m.id === selectedStudent.memberId)?.nombres.charAt(0)}
                      </div>
                      <div>
                          <p className="font-bold text-slate-700">{members.find(m => m.id === selectedStudent.memberId)?.nombres}</p>
                          <p className="text-xs text-slate-400 font-bold">{selectedStudent.cycle.replace('_', ' ')}</p>
                      </div>
                  </div>

                  <form onSubmit={handleSubmitGrade} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Curso / Materia</label>
                          <select 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 font-medium text-slate-700"
                            value={gradeCourseId}
                            onChange={e => setGradeCourseId(e.target.value)}
                            required
                          >
                              <option value="">-- Seleccionar --</option>
                              {getAvailableCoursesForGrading().map(c => (
                                  <option key={c.id} value={c.id}>{c.nombre}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Nota (0 - 20)</label>
                          <input 
                            type="number"
                            min="0"
                            max="20"
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-200 font-bold text-slate-700 text-center text-lg"
                            value={gradeValue}
                            onChange={e => setGradeValue(e.target.value)}
                            placeholder="00"
                            required
                          />
                      </div>
                      <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-colors shadow-lg flex justify-center items-center gap-2 mt-2">
                          <Save className="w-4 h-4" /> Guardar Nota
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* CONFIRM PROMOTION MODAL */}
      {promoteStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                      <TrendingUp className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¿Promover de Ciclo?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      El estudiante {members.find(m => m.id === promoteStudent.memberId)?.nombres} pasará al siguiente nivel académico.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setPromoteStudent(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                      <button onClick={handleConfirmPromote} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRM GRADUATION MODAL */}
      {graduateStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500">
                      <Award className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¡Graduación Oficial!</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Esta acción finalizará el proceso EPMI del estudiante y lo registrará como Graduado. Es irreversible.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setGraduateStudent(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                      <button onClick={handleGraduate} className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg">Graduar</button>
                  </div>
              </div>
          </div>
      )}

      {/* CERTIFICATE MODAL */}
      {certificateStudent && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 animate-fadeIn overflow-auto print-only-visible">
              <div className="bg-[#fffdf5] w-full max-w-4xl aspect-[1.414/1] shadow-2xl relative border-[16px] border-double border-[#b49b57] p-12 flex flex-col items-center justify-between text-center print:shadow-none print:w-full print:h-full print:absolute print:inset-0 print:m-0 print:border-[10px]">
                  
                  <button onClick={() => setCertificateStudent(null)} className="absolute top-4 right-4 p-2 bg-black/10 rounded-full hover:bg-black/20 text-slate-800 no-print"><X className="w-6 h-6"/></button>
                  <button onClick={() => window.print()} className="absolute top-4 right-16 p-2 bg-black/10 rounded-full hover:bg-black/20 text-slate-800 no-print"><Printer className="w-6 h-6"/></button>

                  {/* Decor corners */}
                  <div className="absolute top-4 left-4 w-16 h-16 border-t-4 border-l-4 border-[#b49b57]"></div>
                  <div className="absolute top-4 right-4 w-16 h-16 border-t-4 border-r-4 border-[#b49b57]"></div>
                  <div className="absolute bottom-4 left-4 w-16 h-16 border-b-4 border-l-4 border-[#b49b57]"></div>
                  <div className="absolute bottom-4 right-4 w-16 h-16 border-b-4 border-r-4 border-[#b49b57]"></div>

                  <div className="mt-8">
                      <h1 className="text-5xl font-serif font-bold text-[#b49b57] mb-2 tracking-widest uppercase">Certificado</h1>
                      <p className="text-xl font-serif italic text-slate-500">De Graduación Ministerial</p>
                  </div>

                  <div className="my-8">
                      <p className="text-lg text-slate-600 mb-4 font-serif">Se otorga el presente reconocimiento a:</p>
                      <h2 className="text-4xl md:text-6xl font-bold text-slate-800 font-serif border-b-2 border-slate-300 pb-2 px-12 inline-block">
                          {members.find(m => m.id === certificateStudent.memberId)?.nombres}
                      </h2>
                      <p className="text-lg text-slate-600 mt-6 max-w-2xl mx-auto font-serif leading-relaxed">
                          Por haber culminado satisfactoriamente los estudios teológicos y el año de servicio en la Escuela de Preparación Ministerial Internacional (EPMI), demostrando carácter, doctrina y fidelidad.
                      </p>
                  </div>

                  <div className="w-full grid grid-cols-2 gap-32 px-12 mb-8">
                      <div className="border-t border-slate-400 pt-2">
                          <p className="font-bold text-slate-800 font-serif">Pastor Principal</p>
                          <p className="text-xs text-slate-500 uppercase">Firma Autorizada</p>
                      </div>
                      <div className="border-t border-slate-400 pt-2">
                          <p className="font-bold text-slate-800 font-serif">Coordinador EPMI</p>
                          <p className="text-xs text-slate-500 uppercase">Firma Autorizada</p>
                      </div>
                  </div>

                  <div className="mb-4">
                      <p className="text-sm text-[#b49b57] font-bold uppercase tracking-widest">Iglesia Visión Misionera Mundial La Shekinah</p>
                      <p className="text-xs text-slate-400">{new Date().toLocaleDateString()}</p>
                  </div>
              </div>
          </div>
      )}

      {/* Helper Icon Component needed for modal */}
      <div className="hidden">
          <TrendingUp />
      </div>
    </div>
  );
};

export default Epmi;
