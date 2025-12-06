
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../App.tsx';
import { BookOpen, Plus, FileText, CheckSquare, GraduationCap, X, Globe, MapPin, Download, CheckCircle2, Search, Edit2, Trash2, Save, AlertTriangle, UserPlus, UploadCloud, Link as LinkIcon, Loader2, Users, Filter, Clock } from 'lucide-react';
import { Course, CourseMaterial } from '../types';

const Courses: React.FC = () => {
  const { courses, addCourse, updateCourse, deleteCourse, notify, members, currentUser, teachingHouses, attendance, toggleAttendance, enrollStudentInCourse, unenrollStudentFromCourse, addCourseMaterial, requestCourseEnrollment, approveCourseEnrollment } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // TABS FOR CATALOG ORGANIZATION
  const [activeTab, setActiveTab] = useState<string>('TODOS');

  // Create Form
  const [courseName, setCourseName] = useState('');
  const [courseCategory, setCourseCategory] = useState<'BASICO' | 'EPMI_I' | 'EPMI_II' | 'ESCUELA'>('BASICO');
  const [customCategory, setCustomCategory] = useState('');
  const [courseType, setCourseType] = useState<'CENTRAL' | 'LOCAL'>('CENTRAL');
  const [courseLevel, setCourseLevel] = useState(1);

  // Edit Form
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  // UX Modals
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [showMaterials, setShowMaterials] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [showRequests, setShowRequests] = useState(false); // New Modal for Approvals
  
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);

  // Enrollment Logic
  const [studentSearch, setStudentSearch] = useState('');

  // Materials Upload Logic
  const [isUploading, setIsUploading] = useState(false);
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DYNAMIC TABS CALCULATION ---
  const dynamicTabs = useMemo(() => {
      const tabs: { id: string; label: string }[] = [
          { id: 'TODOS', label: 'Todos' },
          { id: 'BASICO', label: 'Discipulado Básico' },
          { id: 'EPMI_I', label: 'EPMI Ciclo I' },
          { id: 'EPMI_II', label: 'EPMI Ciclo II' },
      ];
      
      // Extract unique School Categories (PDF 5.9)
      const existingCategories = Array.from(new Set(
          courses
            .filter(c => c.type === 'ESCUELA' && c.categoria)
            .map(c => c.categoria as string)
      )) as string[];

      existingCategories.forEach(cat => {
          tabs.push({ id: cat, label: cat });
      });

      return tabs;
  }, [courses]);

  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName) return;
    
    // EPMI courses are always CENTRAL
    const finalType = (courseCategory === 'EPMI_I' || courseCategory === 'EPMI_II') ? 'CENTRAL' : courseType;
    const finalCategory = courseCategory === 'ESCUELA' ? customCategory : undefined;

    if (courseCategory === 'ESCUELA' && !customCategory) {
        notify("Debe especificar el nombre de la Escuela (Ej. Escuela de Diáconos)", "error");
        return;
    }

    addCourse({
        id: `CRS-${Date.now()}`,
        nombre: courseName,
        descripcion: `Curso de ${finalCategory || courseCategory.replace('_', ' ')}`,
        nivel: courseLevel,
        tipo: finalType,
        type: courseCategory,
        categoria: finalCategory,
        orden: 99,
        materials: [],
        enrolledStudentIds: [],
        requests: []
    });

    setIsModalOpen(false);
    setCourseName('');
    setCustomCategory('');
    notify('Curso agregado al catálogo correctamente');
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingCourse) {
          updateCourse(editingCourse.id, {
              nombre: editingCourse.nombre,
              tipo: editingCourse.tipo,
              nivel: editingCourse.nivel,
              type: editingCourse.type,
              categoria: editingCourse.categoria
          });
          setIsEditModalOpen(false);
          setEditingCourse(null);
          notify('Curso actualizado correctamente');
      }
  };

  const confirmDeleteCourse = () => {
      if (courseToDelete) {
          deleteCourse(courseToDelete);
          setCourseToDelete(null);
      }
  };

  const getActiveCourse = () => courses.find(c => c.id === activeCourseId);

  // LOGIC: Get students based on role context
  const getPotentialStudents = () => {
      let filtered = members;

      // 1. Filter by Scope
      if (currentUser.role === 'MAESTRO_CASA') {
          const myHouse = teachingHouses.find(h => h.maestroNombre === currentUser.name); 
          if (myHouse) {
              filtered = filtered.filter(m => m.teachingHouseId === myHouse.id);
          }
      } else if (currentUser.role === 'LIDER_ANEXO') {
          filtered = filtered.filter(m => m.anexoId === currentUser.anexoId);
      } else if (currentUser.role === 'PASTOR_PRINCIPAL' && currentUser.anexoId !== 'ALL') {
          filtered = filtered.filter(m => m.anexoId === currentUser.anexoId);
      }

      // 2. Filter active members only
      return filtered.filter(m => m.estatus !== 'No Activo');
  };

  const potentialStudents = getPotentialStudents();
  
  // Enrolled students for the active course
  const enrolledStudents = activeCourseId 
      ? potentialStudents.filter(m => getActiveCourse()?.enrolledStudentIds?.includes(m.id))
      : [];

  const handleEnrollToggle = (memberId: string) => {
      if (!activeCourseId) return;
      const course = getActiveCourse();
      if (course?.enrolledStudentIds?.includes(memberId)) {
          unenrollStudentFromCourse(activeCourseId, memberId);
      } else {
          enrollStudentInCourse(activeCourseId, memberId);
      }
  };

  const handleRequest = (courseId: string) => {
      if (currentUser.memberId) {
          requestCourseEnrollment(courseId, currentUser.memberId);
      } else {
          notify("Error: No tienes un perfil de miembro asociado.", "error");
      }
  };

  const handleApproveRequest = (memberId: string, approve: boolean) => {
      if (activeCourseId) {
          approveCourseEnrollment(activeCourseId, memberId, approve);
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && activeCourseId) {
          const file = e.target.files[0];
          setIsUploading(true);
          
          setTimeout(() => {
              const newMaterial: CourseMaterial = {
                  id: `MAT-${Date.now()}`,
                  title: newMaterialTitle || file.name,
                  type: 'PDF',
                  url: '#', // In real app this is the cloud URL
                  dateAdded: new Date().toLocaleDateString()
              };
              addCourseMaterial(activeCourseId, newMaterial);
              setIsUploading(false);
              setNewMaterialTitle('');
          }, 1500);
      }
  };

  // Fake Event ID for Course Session Persistence
  const getSessionId = () => `CRS-${activeCourseId}-${attendanceDate}`;

  // Filter Courses for Display
  const displayedCourses = courses.filter(c => {
      if (activeTab === 'TODOS') return true;
      if (activeTab === 'BASICO' || activeTab === 'EPMI_I' || activeTab === 'EPMI_II') {
          return c.type === activeTab;
      }
      // Check custom categories
      return c.type === 'ESCUELA' && c.categoria === activeTab;
  });

  // Get list of unique existing schools for the dropdown
  const existingSchools = Array.from(new Set(courses.filter(c => c.type === 'ESCUELA' && c.categoria).map(c => c.categoria as string))) as string[];

  return (
    <div className="space-y-8 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
           <div className="bg-orange-100 p-3 rounded-2xl shadow-sm">
               <GraduationCap className="w-6 h-6 text-orange-500" />
           </div>
           <div>
               <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Malla Curricular</h2>
               <p className="text-sm text-slate-500 font-medium">Gestión de Cursos y Formación</p>
           </div>
        </div>
        {currentUser.role !== 'MIEMBRO' && (
            <button 
                onClick={() => setIsModalOpen(true)} 
                className="bg-brand-blue text-white px-5 py-3 rounded-2xl flex items-center shadow-glow hover:bg-brand-dark transition-all btn-hover"
            >
                <Plus className="w-5 h-5 md:mr-1.5" /> <span className="hidden md:inline font-bold text-sm">Crear Nuevo Curso</span>
            </button>
        )}
      </div>

      {/* CATEGORY TABS (PILLS DESIGN FOR BETTER MOBILE SCROLL) */}
      <div className="sticky top-0 z-30 bg-[#f8fafc] pt-4 pb-2 -mx-4 px-4 md:mx-0 md:px-0 transition-all">
          <div className="flex overflow-x-auto gap-3 pb-2 no-scrollbar touch-pan-x w-full">
              {dynamicTabs.map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide rounded-full transition-all whitespace-nowrap flex-shrink-0 border
                        ${activeTab === tab.id 
                            ? 'bg-brand-blue text-white border-brand-blue shadow-md transform scale-105' 
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }
                    `}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
        {displayedCourses.map((course) => {
            const isEnrolled = currentUser.memberId && course.enrolledStudentIds?.includes(currentUser.memberId);
            const isRequested = currentUser.memberId && course.requests?.includes(currentUser.memberId);
            const requestCount = course.requests?.length || 0;

            return (
              <div key={course.id} className="bg-white rounded-[2rem] shadow-card border border-slate-50 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group flex flex-col relative">
                <div className={`h-2 w-full ${course.type.startsWith('EPMI') ? 'bg-indigo-500' : course.type === 'ESCUELA' ? 'bg-teal-500' : 'bg-orange-400'}`}></div>
                
                {/* REQUEST BADGE FOR LEADERS */}
                {currentUser.role !== 'MIEMBRO' && requestCount > 0 && (
                    <button 
                        onClick={() => { setActiveCourseId(course.id); setShowRequests(true); }}
                        className="absolute top-4 right-14 flex items-center gap-1 bg-amber-500 text-white px-2 py-1 rounded-full text-[10px] font-bold shadow-md hover:bg-amber-600 transition-colors z-20"
                    >
                        <Clock className="w-3 h-3" /> {requestCount}
                    </button>
                )}

                {/* Edit/Delete Actions - ALWAYS VISIBLE ON MOBILE */}
                {currentUser.role === 'PASTOR_PRINCIPAL' && (
                    <div className="absolute top-4 right-4 flex gap-1 z-10">
                        <button 
                            onClick={() => { setEditingCourse(course); setIsEditModalOpen(true); }}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-brand-blue shadow-sm border border-slate-100 transition-colors"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => setCourseToDelete(course.id)}
                            className="p-2 bg-white/90 backdrop-blur-sm rounded-full text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 transition-colors"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}

                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        course.type.startsWith('EPMI') ? 'bg-indigo-50 text-indigo-600' : course.type === 'ESCUELA' ? 'bg-teal-50 text-teal-600' : 'bg-orange-50 text-orange-500'
                    }`}>
                      {course.categoria || course.type.replace('_', ' ')}
                    </span>
                    {course.nivel && <span className="text-xs font-bold text-slate-300">NIVEL {course.nivel}</span>}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-blue transition-colors pr-8">{course.nombre}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 font-medium leading-relaxed">{course.descripcion || 'Sin descripción'}</p>
                  
                  <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 font-medium">
                      <UserPlus className="w-3 h-3" /> {course.enrolledStudentIds?.length || 0} Alumnos Inscritos
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50/50 border-t border-slate-50 grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => { setActiveCourseId(course.id); setShowMaterials(true); }}
                        className="flex items-center justify-center py-3 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:border-brand-blue hover:text-brand-blue transition-colors shadow-sm"
                    >
                        <FileText className="w-4 h-4 mr-2" /> Materiales
                    </button>
                    {currentUser.role !== 'MIEMBRO' ? (
                        <button 
                            onClick={() => { setActiveCourseId(course.id); setShowAttendance(true); }}
                            className="flex items-center justify-center py-3 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-xl hover:border-brand-blue hover:text-brand-blue transition-colors shadow-sm"
                        >
                            <CheckSquare className="w-4 h-4 mr-2" /> Asistencia
                        </button>
                    ) : (
                        <button className="flex items-center justify-center py-3 text-xs font-bold text-slate-400 bg-slate-100 rounded-xl cursor-not-allowed">
                            <CheckSquare className="w-4 h-4 mr-2" /> Ver Progreso
                        </button>
                    )}
                </div>
                
                {/* Enrollment Button for Leaders */}
                {currentUser.role !== 'MIEMBRO' && (
                    <button 
                        onClick={() => { setActiveCourseId(course.id); setShowEnrollment(true); }}
                        className="w-full py-2 bg-slate-50 text-slate-400 text-[10px] font-bold uppercase hover:bg-slate-100 hover:text-slate-600 transition-colors border-t border-slate-100"
                    >
                        + MATRICULAR MIEMBROS
                    </button>
                )}

                {/* Request Button for Members */}
                {currentUser.role === 'MIEMBRO' && (
                    <div className="border-t border-slate-100">
                        {isEnrolled ? (
                            <div className="w-full py-2 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase text-center flex items-center justify-center gap-1">
                                <CheckCircle2 className="w-3 h-3"/> Matriculado
                            </div>
                        ) : isRequested ? (
                            <div className="w-full py-2 bg-amber-50 text-amber-600 text-[10px] font-bold uppercase text-center flex items-center justify-center gap-1">
                                <Clock className="w-3 h-3"/> Solicitud Pendiente
                            </div>
                        ) : (
                            <button 
                                onClick={() => handleRequest(course.id)}
                                className="w-full py-2 bg-brand-soft text-brand-blue text-[10px] font-bold uppercase hover:bg-brand-light transition-colors"
                            >
                                Solicitar Vacante
                            </button>
                        )}
                    </div>
                )}
              </div>
            )
        })}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Nuevo Curso</h3>
                  <form onSubmit={handleCreateCourse} className="space-y-5">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Tipo de Formación</label>
                          <select 
                            value={courseCategory}
                            onChange={e => setCourseCategory(e.target.value as any)}
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-bold text-slate-700"
                          >
                              <option value="BASICO">Discipulado Básico (7 Pasos)</option>
                              <option value="EPMI_I">EPMI Ciclo I</option>
                              <option value="EPMI_II">EPMI Ciclo II</option>
                              <option value="ESCUELA">Otras Escuelas (Especializadas)</option>
                          </select>
                      </div>

                      {courseCategory === 'ESCUELA' && (
                          <div className="animate-fadeIn p-4 bg-teal-50 rounded-2xl border border-teal-100">
                              <label className="text-xs font-bold text-teal-700 uppercase ml-1 mb-1 block">Nombre de la Escuela</label>
                              <div className="space-y-2">
                                  <input 
                                    list="schools" 
                                    value={customCategory} 
                                    onChange={e => setCustomCategory(e.target.value)}
                                    placeholder="Ej. Escuela de Diáconos"
                                    className="w-full p-2 bg-white rounded-xl border border-teal-200 outline-none focus:ring-2 focus:ring-teal-400 font-medium text-slate-700"
                                  />
                                  <datalist id="schools">
                                      {existingSchools.map(s => <option key={s} value={s} />)}
                                  </datalist>
                                  <p className="text-[10px] text-teal-600">Puede seleccionar una existente o crear una nueva.</p>
                              </div>
                          </div>
                      )}

                      <input 
                        value={courseName}
                        onChange={e => setCourseName(e.target.value)}
                        placeholder="Nombre del Curso"
                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none"
                        autoFocus
                      />
                      
                      {courseCategory === 'BASICO' && (
                          <div className="grid grid-cols-2 gap-4">
                              <div className="flex gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
                                  <button type="button" onClick={() => setCourseType('CENTRAL')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${courseType === 'CENTRAL' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400'}`}>Central</button>
                                  <button type="button" onClick={() => setCourseType('LOCAL')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${courseType === 'LOCAL' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400'}`}>Local</button>
                              </div>
                              <input type="number" min="1" max="10" placeholder="Orden" value={courseLevel} onChange={e => setCourseLevel(parseInt(e.target.value))} className="w-full p-3.5 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none text-center" />
                          </div>
                      )}
                      
                      <button type="submit" className="w-full py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-black transition-colors">Agregar al Catálogo</button>
                  </form>
              </div>
          </div>
      )}

      {/* EDIT COURSE MODAL */}
      {isEditModalOpen && editingCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => { setIsEditModalOpen(false); setEditingCourse(null); }} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Curso</h3>
                  <form onSubmit={handleUpdateCourse} className="space-y-5">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-1 block">Nombre</label>
                          <input 
                            value={editingCourse.nombre}
                            onChange={e => setEditingCourse({...editingCourse, nombre: e.target.value})}
                            className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 font-bold text-slate-700 outline-none"
                            autoFocus
                          />
                      </div>
                      <button type="submit" className="w-full py-4 bg-brand-blue text-white rounded-2xl font-bold shadow-lg">Guardar Cambios</button>
                  </form>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {courseToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Curso?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Esta acción eliminará el curso del catálogo. Se perderán los registros de asistencia asociados.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setCourseToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                      <button onClick={confirmDeleteCourse} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg">Eliminar</button>
                  </div>
              </div>
          </div>
      )}

      {/* APPROVE REQUESTS MODAL */}
      {showRequests && getActiveCourse() && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative h-[60vh] flex flex-col border border-white/50">
                  <button onClick={() => setShowRequests(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Solicitudes Pendientes</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium">Aprobar inscripción para: <span className="text-brand-blue">{getActiveCourse()?.nombre}</span></p>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {(getActiveCourse()?.requests || []).length === 0 ? (
                          <div className="text-center py-10 text-slate-400">
                              <p>No hay solicitudes pendientes.</p>
                          </div>
                      ) : (
                          (getActiveCourse()?.requests || []).map(reqId => {
                              const m = members.find(mem => mem.id === reqId);
                              if (!m) return null;
                              return (
                                  <div key={m.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                      <div className="flex items-center gap-3">
                                          <img src={m.photoUrl} className="w-10 h-10 rounded-full bg-slate-200" />
                                          <div>
                                              <p className="font-bold text-sm text-slate-700">{m.nombres}</p>
                                              <p className="text-[10px] text-slate-400">{m.estatus}</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-1">
                                          <button onClick={() => handleApproveRequest(m.id, true)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200">
                                              <CheckSquare className="w-4 h-4" />
                                          </button>
                                          <button onClick={() => handleApproveRequest(m.id, false)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200">
                                              <X className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </div>
                              );
                          })
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* MATERIALS MODAL */}
      {showMaterials && getActiveCourse() && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setShowMaterials(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{getActiveCourse()?.nombre}</h3>
                  <p className="text-sm text-slate-500 mb-6 font-medium">Recursos Educativos</p>
                  
                  <div className="space-y-3 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                      {(getActiveCourse()?.materials || []).length === 0 && <p className="text-xs text-slate-300 text-center py-4">No hay materiales subidos.</p>}
                      
                      {(getActiveCourse()?.materials || []).map(mat => (
                          <div key={mat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer group">
                              <div className="flex items-center gap-3">
                                  <div className="bg-red-100 p-2 rounded-lg text-red-500"><FileText className="w-4 h-4" /></div>
                                  <div>
                                      <p className="font-bold text-slate-700 text-xs">{mat.title}</p>
                                      <p className="text-[10px] text-slate-400">{mat.dateAdded}</p>
                                  </div>
                              </div>
                              <Download className="w-4 h-4 text-slate-300 group-hover:text-slate-500" />
                          </div>
                      ))}
                  </div>

                  {currentUser.role !== 'MIEMBRO' && (
                      <div className="pt-4 border-t border-slate-100">
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Subir Nuevo Recurso</label>
                          <div className="flex gap-2 mb-3">
                              <input 
                                className="flex-1 bg-slate-50 p-2 rounded-xl text-xs font-medium border border-slate-200 outline-none"
                                placeholder="Título del archivo..."
                                value={newMaterialTitle}
                                onChange={e => setNewMaterialTitle(e.target.value)}
                              />
                          </div>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full py-3 bg-brand-soft text-brand-blue font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors border border-brand-blue/20 flex justify-center items-center gap-2"
                          >
                              {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
                              {isUploading ? 'Subiendo...' : 'Seleccionar Archivo (PDF)'}
                          </button>
                          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} />
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* ENROLLMENT MODAL */}
      {showEnrollment && getActiveCourse() && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative h-[80vh] flex flex-col border border-white/50">
                  <button onClick={() => setShowEnrollment(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Matricular Alumnos</h3>
                  <div className="bg-orange-50 p-3 rounded-xl mb-4 text-xs text-orange-800 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Mostrando miembros de: <strong>{currentUser.role === 'PASTOR_PRINCIPAL' && currentUser.anexoId === 'ALL' ? 'Toda la Iglesia' : 'Mi Anexo'}</strong>
                  </div>
                  
                  <div className="relative mb-4">
                      <input 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-orange-200 font-medium text-sm"
                        placeholder="Buscar en la membresía..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {potentialStudents
                        .filter(m => m.nombres.toLowerCase().includes(studentSearch.toLowerCase()))
                        .map(m => {
                          const isEnrolled = getActiveCourse()?.enrolledStudentIds?.includes(m.id);
                          return (
                              <div 
                                key={m.id} 
                                onClick={() => handleEnrollToggle(m.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    isEnrolled ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100 hover:bg-slate-50'
                                }`}
                              >
                                  <div className="flex items-center gap-3">
                                      <img src={m.photoUrl} className="w-8 h-8 rounded-full bg-slate-200" />
                                      <div>
                                          <p className="font-bold text-sm text-slate-700">{m.nombres}</p>
                                          <p className="text-[10px] text-slate-400">{m.estatus}</p>
                                      </div>
                                  </div>
                                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${isEnrolled ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300'}`}>
                                      {isEnrolled && <CheckCircle2 className="w-3.5 h-3.5" />}
                                  </div>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* ATTENDANCE MODAL */}
      {showAttendance && getActiveCourse() && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 h-[70vh] flex flex-col">
                  <button onClick={() => setShowAttendance(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  
                  <div className="mb-4">
                      <h3 className="text-xl font-bold text-slate-800">{getActiveCourse()?.nombre}</h3>
                      <p className="text-sm text-slate-500 font-medium">Registro de Asistencia</p>
                  </div>

                  <div className="mb-4">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-1">Fecha de Sesión</label>
                      <input 
                        type="date"
                        value={attendanceDate}
                        onChange={e => setAttendanceDate(e.target.value)}
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-100 font-bold text-slate-700 outline-none"
                      />
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {enrolledStudents.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                              <p>No hay alumnos inscritos.</p>
                              <button onClick={() => {setShowAttendance(false); setShowEnrollment(true);}} className="text-orange-500 font-bold text-xs mt-2 underline">Inscribir ahora</button>
                          </div>
                      ) : (
                          enrolledStudents.map(member => {
                              const isPresent = attendance[`${getSessionId()}-${member.id}`];
                              return (
                                <div 
                                    key={member.id} 
                                    onClick={() => toggleAttendance(getSessionId(), member.id)}
                                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isPresent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <img src={member.photoUrl} className="w-8 h-8 rounded-full bg-slate-200 object-cover" />
                                        <div>
                                            <p className={`font-bold text-sm ${isPresent ? 'text-emerald-800' : 'text-slate-700'}`}>{member.nombres}</p>
                                            <p className="text-[10px] text-slate-400">{member.estatus}</p>
                                        </div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isPresent ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 text-transparent'}`}>
                                        <CheckCircle2 className="w-4 h-4" />
                                    </div>
                                </div>
                              );
                          })
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Courses;