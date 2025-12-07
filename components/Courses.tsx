
import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../App.tsx';
import { Course, CourseMaterial, CourseOffering, ClassSession } from '../types';
import { BookOpen, FileText, Play, CheckCircle, Clock, Video, Upload, Plus, X, Trash2, Edit2, UserPlus, AlertTriangle, Check, Calendar, Users, ChevronRight, Shield, Lock, Table, FileSpreadsheet, ArrowLeft, Search, Eye } from 'lucide-react';

const Courses: React.FC = () => {
  const { courses, addCourse, updateCourse, deleteCourse, enrollStudentInCourse, unenrollStudentFromCourse, addCourseMaterial, requestCourseEnrollment, approveCourseEnrollment, currentUser, notify, members, courseOfferings, openCourseOffering, updateCourseOffering, deleteCourseOffering, updateOfferingSession, attendance, toggleAttendance } = useApp();
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'CATALOG' | 'OFFERINGS'>('CATALOG');

  // Create Course Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseType, setNewCourseType] = useState<Course['type']>('BASICO');
  const [newCourseLevel, setNewCourseLevel] = useState('1');
  const [newCourseCategory, setNewCourseCategory] = useState('');
  
  // Manage Course Modals
  const [isMaterialsOpen, setIsMaterialsOpen] = useState(false);
  // Removed isAttendanceOpen as it is handled in Offerings
  const [isEnrollOpen, setIsEnrollOpen] = useState(false);
  const [enrollSearchTerm, setEnrollSearchTerm] = useState(''); 
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<string | null>(null);
  
  // Open Offering Modal
  const [isOfferingOpen, setIsOfferingOpen] = useState(false);
  const [offeringMaestro, setOfferingMaestro] = useState('');
  const [offeringHorario, setOfferingHorario] = useState('');
  const [offeringStart, setOfferingStart] = useState('');
  const [offeringSessions, setOfferingSessions] = useState(8);
  
  // Session Management State
  const [activeOffering, setActiveOffering] = useState<CourseOffering | null>(null);
  const [offeringTab, setOfferingTab] = useState<'SESSIONS' | 'KARDEX'>('SESSIONS');
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null); // For taking attendance

  // New Material
  const [newMaterialTitle, setNewMaterialTitle] = useState('');
  const [newMaterialUrl, setNewMaterialUrl] = useState('');
  const [newMaterialType, setNewMaterialType] = useState<'PDF' | 'LINK'>('PDF');

  // Editing
  const [editCourseName, setEditCourseName] = useState('');
  const [editCourseType, setEditCourseType] = useState<Course['type']>('BASICO');
  const [editCourseCategory, setEditCourseCategory] = useState('');

  // Permissions Logic (PDF 11.7 & 8.7)
  const isMember = currentUser.role === 'MIEMBRO';
  const isLeader = currentUser.role === 'LIDER_ANEXO' || currentUser.role === 'MAESTRO_CASA';
  const isAdmin = currentUser.role === 'PASTOR_PRINCIPAL' || currentUser.role === 'MINISTRO';

  // Derive dynamic categories from existing courses + standard ones
  const categories = useMemo(() => {
      const standard = [
          { id: 'TODOS', label: 'Todo el Catálogo' },
          { id: 'BASICO', label: 'Discipulado Básico' },
          { id: 'EPMI_I', label: 'EPMI Ciclo I' },
          { id: 'EPMI_II', label: 'EPMI Ciclo II' },
      ];
      
      // Extract unique "Schools" categories
      const schoolCats = Array.from(new Set(courses.filter(c => c.type === 'ESCUELA' && c.categoria).map(c => c.categoria as string)));
      
      const schools = schoolCats.map((cat: string) => ({
          id: cat,
          label: cat.toUpperCase()
      }));

      return [...standard, ...schools];
  }, [courses]);

  // Filtered Courses
  const visibleCourses = courses.filter(c => {
      if (activeCategory === 'TODOS') return true;
      if (activeCategory === 'BASICO') return c.type === 'BASICO';
      if (activeCategory === 'EPMI_I') return c.type === 'EPMI_I';
      if (activeCategory === 'EPMI_II') return c.type === 'EPMI_II';
      // Custom Schools
      return c.categoria === activeCategory;
  });

  // Handlers
  const handleCreateCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourseName) return;

    addCourse({
        id: `CRS-${Date.now()}`,
        nombre: newCourseName,
        type: newCourseType,
        categoria: newCourseType === 'ESCUELA' ? newCourseCategory : undefined,
        orden: parseInt(newCourseLevel),
        materials: [],
        enrolledStudentIds: [],
        requests: []
    });
    setIsCreateOpen(false);
    setNewCourseName('');
    setNewCourseLevel('1');
    setNewCourseCategory('');
  };

  const handleUpdateCourse = (e: React.FormEvent) => {
      e.preventDefault();
      if(activeCourse) {
          updateCourse(activeCourse.id, {
              nombre: editCourseName,
              type: editCourseType,
              categoria: editCourseType === 'ESCUELA' ? editCourseCategory : undefined
          });
          setIsEditOpen(false);
          setActiveCourse(null);
      }
  };

  const handleDeleteCourse = () => {
      if (courseToDelete) {
          deleteCourse(courseToDelete);
          setCourseToDelete(null);
      }
  };

  const handleAddMaterial = (e: React.FormEvent) => {
      e.preventDefault();
      if(activeCourse && newMaterialTitle && newMaterialUrl) {
          addCourseMaterial(activeCourse.id, {
              id: `MAT-${Date.now()}`,
              title: newMaterialTitle,
              type: newMaterialType,
              url: newMaterialUrl,
              dateAdded: new Date().toISOString().split('T')[0]
          });
          setNewMaterialTitle('');
          setNewMaterialUrl('');
      }
  };

  const handleEnrollToggle = (memberId: string) => {
      if (!activeCourse) return;
      const isEnrolled = activeCourse.enrolledStudentIds?.includes(memberId);
      if (isEnrolled) {
          unenrollStudentFromCourse(activeCourse.id, memberId);
      } else {
          enrollStudentInCourse(activeCourse.id, memberId);
      }
  };

  // Request Logic (Member Side)
  const handleRequest = (courseId: string) => {
      const memberId = currentUser.memberId || 'MEM-001'; // Should come from real login
      requestCourseEnrollment(courseId, memberId);
  };

  // Approve Logic (Leader Side)
  const handleApprove = (memberId: string, approve: boolean) => {
      if (!activeCourse) return;
      approveCourseEnrollment(activeCourse.id, memberId, approve);
  };

  // Offering Logic
  const handleOpenOffering = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeCourse || !offeringMaestro || !offeringStart) return;

      const maestroName = members.find(m => m.id === offeringMaestro)?.nombres || 'Desconocido';
      const diaSemana = new Date(offeringStart).getDay(); // 0-6

      openCourseOffering({
          id: `OFF-${Date.now()}`,
          courseId: activeCourse.id,
          courseName: activeCourse.nombre,
          anexoId: currentUser.anexoId === 'ALL' ? 'ANX-01' : currentUser.anexoId,
          maestroId: offeringMaestro,
          maestroName: maestroName,
          horario: offeringHorario,
          fechaInicio: offeringStart,
          diaSemana,
          sesionesTotales: offeringSessions,
          sesionesRealizadas: 0,
          sessions: [],
          evaluations: [],
          studentGrades: [],
          active: true
      });
      
      setIsOfferingOpen(false);
      setOfferingMaestro('');
      setOfferingHorario('');
      setOfferingStart('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header with View Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
            <div className="bg-orange-100 p-3 rounded-2xl shadow-sm">
                <BookOpen className="w-8 h-8 text-orange-600" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Malla Curricular</h2>
                <p className="text-sm text-slate-500 font-medium">Gestión de Cursos y Formación</p>
            </div>
        </div>
        
        {/* CREATE BUTTON (Restricted to Admin) */}
        {isAdmin && viewMode === 'CATALOG' && (
            <button 
                onClick={() => setIsCreateOpen(true)} 
                className="bg-brand-blue text-white px-5 py-3 rounded-2xl flex items-center shadow-glow hover:bg-brand-dark transition-all btn-hover"
            >
                <Plus className="w-5 h-5 mr-1.5" /> <span className="text-sm font-bold">Crear Nuevo Curso</span>
            </button>
        )}
      </div>

      {/* VIEW SWITCHER */}
      <div className="flex justify-center bg-slate-100 p-1 rounded-2xl max-w-md mx-auto mb-6">
          <button 
            onClick={() => setViewMode('CATALOG')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'CATALOG' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400 hover:text-slate-600'}`}
          >
              <BookOpen className="w-4 h-4" /> Catálogo Académico
          </button>
          <button 
            onClick={() => setViewMode('OFFERINGS')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${viewMode === 'OFFERINGS' ? 'bg-white shadow-sm text-orange-500' : 'text-slate-400 hover:text-slate-600'}`}
          >
              <Calendar className="w-4 h-4" /> Clases Abiertas
          </button>
      </div>

      {/* === VIEW: CATALOG === */}
      {viewMode === 'CATALOG' && (
      <>
          {/* Categories (Pills) - Mobile First */}
          <div className="sticky top-20 z-10 bg-[#f8fafc]/95 backdrop-blur-sm py-2 -mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto whitespace-nowrap flex gap-2 no-scrollbar border-b border-slate-200 mb-4">
              {categories.map(cat => (
                  <button 
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide transition-all border ${
                        activeCategory === cat.id 
                        ? 'bg-brand-blue text-white border-brand-blue shadow-md transform scale-105' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-brand-blue hover:text-brand-blue'
                    }`}
                  >
                      {cat.label}
                  </button>
              ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
            {visibleCourses.map((course) => {
                const memberId = currentUser.memberId || '';
                const isRequested = course.requests?.includes(memberId);
                const isCompleted = currentUser.memberId && members.find(m => m.id === currentUser.memberId)?.coursesCompletedIds.includes(course.id);
                
                // Security Logic for Actions
                const isBasic = course.type === 'BASICO';
                const canEnrollDirectly = isAdmin || (isLeader && isBasic); 
                
                return (
                    <div key={course.id} className="bg-white rounded-[2.5rem] p-6 shadow-card border border-slate-50 flex flex-col h-full group hover:shadow-lg transition-all relative">
                        
                        {/* Top Actions (Admin Only) */}
                        {isAdmin && (
                            <div className="absolute top-4 right-4 flex gap-1 transition-opacity">
                                <button 
                                    onClick={() => { setActiveCourse(course); setEditCourseName(course.nombre); setEditCourseType(course.type); setEditCourseCategory(course.categoria || ''); setIsEditOpen(true); }}
                                    className="p-2 text-slate-300 hover:text-brand-blue bg-slate-50 rounded-full hover:bg-white shadow-sm"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => setCourseToDelete(course.id)} 
                                    className="p-2 text-slate-300 hover:text-red-500 bg-slate-50 rounded-full hover:bg-white shadow-sm"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Requests Badge (Leader/Admin) */}
                        {!isMember && (course.requests?.length || 0) > 0 && (
                            <button 
                                onClick={() => { setActiveCourse(course); setIsApproveOpen(true); }}
                                className="absolute top-4 left-4 bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 hover:bg-amber-200 transition-colors animate-pulse"
                            >
                                <UserPlus className="w-3 h-3" /> {course.requests?.length} Solicitudes
                            </button>
                        )}

                        <div className="mb-6 mt-2">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase mb-3 ${
                                course.type === 'BASICO' ? 'bg-orange-100 text-orange-600' : 
                                course.type === 'EPMI_I' || course.type === 'EPMI_II' ? 'bg-indigo-100 text-indigo-600' : 
                                'bg-teal-100 text-teal-600'
                            }`}>
                                {course.type.replace('_', ' ')} {course.nivel && `• Nivel ${course.nivel}`}
                            </span>
                            <h3 className="text-xl font-bold text-slate-800 leading-tight mb-1">{course.nombre}</h3>
                            <p className="text-sm text-slate-400">{course.descripcion || 'Sin descripción'}</p>
                        </div>

                        <div className="flex items-center gap-2 mb-6 text-xs font-medium text-slate-400">
                            <Users className="w-4 h-4" /> {course.enrolledStudentIds?.length || 0} Alumnos Matriculados
                        </div>

                        <div className="mt-auto space-y-3">
                            
                            {/* PROGRAMMING BUTTON (ADMIN/LEADER) - Only Basic for Leader */}
                            {!isMember && (isAdmin || isBasic) && (
                                <button 
                                    onClick={() => { setActiveCourse(course); setIsOfferingOpen(true); }}
                                    className="w-full py-2 bg-sky-50 text-sky-600 text-xs font-bold rounded-xl hover:bg-sky-100 border border-sky-200 flex items-center justify-center gap-2 mb-2"
                                >
                                    <Calendar className="w-3 h-3" /> Programar Clase (Ofertar)
                                </button>
                            )}

                            {/* MATERIALS - Pastor/Admin ALWAYS sees. Leader sees only BASIC. */}
                            {(!isMember && (isAdmin || isBasic)) && (
                                <button 
                                    onClick={() => { setActiveCourse(course); setIsMaterialsOpen(true); }}
                                    className="w-full py-3 border border-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-50 flex justify-center items-center gap-2 text-xs"
                                >
                                    <FileText className="w-4 h-4" /> Gestionar Materiales
                                </button>
                            )}
                            
                            {/* MEMBER MATERIALS (Only if Enrolled) */}
                            {isMember && course.enrolledStudentIds?.includes(memberId) && (
                                 <button 
                                    onClick={() => { setActiveCourse(course); setIsMaterialsOpen(true); }}
                                    className="w-full py-3 border border-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-50 flex justify-center items-center gap-2 text-xs"
                                >
                                    <FileText className="w-4 h-4" /> Ver Materiales
                                </button>
                            )}

                            {/* ENROLLMENT ACTION */}
                            <button 
                                onClick={() => {
                                    if (isMember) {
                                        if(!isCompleted && !isRequested && !course.enrolledStudentIds?.includes(memberId)) {
                                            if (course.type !== 'BASICO') {
                                                notify("Este curso requiere aprobación pastoral. Contacta a tu líder.", "error");
                                                return;
                                            }
                                            handleRequest(course.id);
                                        }
                                    } else {
                                        if (canEnrollDirectly) {
                                            setActiveCourse(course); setIsEnrollOpen(true);
                                        } else {
                                            notify("Debes proponer candidatos al Pastor.", "info");
                                        }
                                    }
                                }}
                                disabled={isMember && (isRequested || isCompleted || course.enrolledStudentIds?.includes(memberId) || (course.type !== 'BASICO'))}
                                className={`w-full py-3 rounded-xl font-bold text-xs flex justify-center items-center gap-2 transition-all ${
                                    isMember 
                                    ? (isCompleted ? 'bg-emerald-100 text-emerald-600 cursor-default' : isRequested ? 'bg-amber-100 text-amber-600 cursor-default' : course.type !== 'BASICO' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-brand-soft text-brand-blue hover:bg-blue-100')
                                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                {isMember ? (
                                    isCompleted ? <><Check className="w-3 h-3"/> Curso Aprobado</> 
                                    : isRequested ? <><Clock className="w-3 h-3"/> Solicitud Pendiente</>
                                    : course.enrolledStudentIds?.includes(memberId) ? <><Play className="w-3 h-3"/> En Curso</>
                                    : course.type !== 'BASICO' ? <><Lock className="w-3 h-3"/> Requiere Aprobación</>
                                    : <><Plus className="w-3 h-3"/> Solicitar Vacante</>
                                ) : (
                                    canEnrollDirectly ? <><UserPlus className="w-3 h-3"/> Matricular Miembros</> : <><UserPlus className="w-3 h-3"/> Proponer Candidato</>
                                )}
                            </button>
                        </div>
                    </div>
                );
            })}
          </div>
      </>
      )}

      {/* === VIEW: COURSE OFFERINGS (ACTIVE CLASSES) === */}
      {viewMode === 'OFFERINGS' && (
          <div className="space-y-6 pb-20">
              {courseOfferings.length === 0 && (
                  <div className="p-12 text-center text-slate-400 bg-white rounded-[2.5rem] border border-slate-50">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <h3 className="text-lg font-bold text-slate-600">No hay clases programadas.</h3>
                      <p className="text-sm">Ve al Catálogo y usa "Programar Clase" para abrir una.</p>
                      <button onClick={() => setViewMode('CATALOG')} className="mt-4 text-brand-blue text-xs font-bold underline">Ir al Catálogo</button>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {courseOfferings.map(offering => {
                      const courseInfo = courses.find(c => c.id === offering.courseId);
                      const isAssignedTeacher = offering.maestroId === currentUser.memberId;
                      const isMyAnnex = isLeader && currentUser.anexoId === offering.anexoId;
                      const isBasic = courseInfo?.type === 'BASICO';
                      
                      const canManage = isAdmin || isAssignedTeacher || (isMyAnnex && isBasic);
                      
                      if (!canManage && !isAdmin && !isMember) return null; // Members can see to check their class

                      return (
                          <div key={offering.id} className="bg-white p-6 rounded-[2.5rem] shadow-card border border-slate-50 hover:shadow-lg transition-all">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <div className="flex items-center gap-2 mb-1">
                                          <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded">EN CURSO</span>
                                          <span className="text-[10px] text-slate-300">ID: {offering.id}</span>
                                          {isAdmin && (
                                              <button onClick={() => deleteCourseOffering(offering.id)} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                                          )}
                                      </div>
                                      <h3 className="text-xl font-bold text-slate-800">{offering.courseName}</h3>
                                  </div>
                              </div>

                              <div className="bg-slate-50 rounded-xl p-4 space-y-2 mb-6">
                                  <div className="flex items-center gap-3">
                                      <div className="bg-white p-1.5 rounded-lg text-slate-400"><Users className="w-4 h-4"/></div>
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Maestro</p>
                                          <p className="text-sm font-bold text-slate-700">{offering.maestroName}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <div className="bg-white p-1.5 rounded-lg text-slate-400"><Clock className="w-4 h-4"/></div>
                                      <div>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase">Horario</p>
                                          <p className="text-sm font-bold text-slate-700">{offering.horario}</p>
                                      </div>
                                  </div>
                              </div>

                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-slate-500">Avance Académico</span>
                                  <span className="text-xs font-bold text-brand-blue">{offering.sesionesRealizadas} / {offering.sesionesTotales} Sesiones</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-6">
                                  <div className="bg-brand-blue h-full" style={{width: `${(offering.sesionesRealizadas/offering.sesionesTotales)*100}%`}}></div>
                              </div>

                              {/* TEACHER/ADMIN ACTION */}
                              {canManage ? (
                                  <button 
                                    onClick={() => { setActiveOffering(offering); setOfferingTab('SESSIONS'); }}
                                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-2xl hover:bg-black transition-colors shadow-lg flex justify-center items-center gap-2 text-sm"
                                  >
                                      Gestionar Sesiones <ChevronRight className="w-4 h-4"/>
                                  </button>
                              ) : (
                                  <p className="text-center text-xs text-slate-400 italic bg-slate-50 py-2 rounded-lg">Ver progreso en "Mi Perfil"</p>
                              )}
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      {/* SESSION MANAGEMENT MODAL (Full Screen Overlay) */}
      {activeOffering && (
          <div className="fixed inset-0 z-[60] bg-white overflow-y-auto animate-slideUp">
              <div className="max-w-5xl mx-auto p-6">
                  <button onClick={() => setActiveOffering(null)} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-slate-600">
                      <ArrowLeft className="w-5 h-5" /> Volver a Clases
                  </button>
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b border-slate-100 pb-6 gap-4">
                      <div>
                          <h2 className="text-3xl font-bold text-slate-800 mb-2">{activeOffering.courseName}</h2>
                          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                              <span className="flex items-center gap-1"><Users className="w-4 h-4"/> Prof. {activeOffering.maestroName}</span>
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {activeOffering.horario}</span>
                          </div>
                      </div>
                      
                      {/* Internal Tabs for Offering */}
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                          <button 
                            onClick={() => setOfferingTab('SESSIONS')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${offeringTab === 'SESSIONS' ? 'bg-white shadow-sm text-brand-blue' : 'text-slate-400'}`}
                          >
                              <Calendar className="w-4 h-4" /> Sesiones
                          </button>
                          <button 
                            onClick={() => setOfferingTab('KARDEX')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${offeringTab === 'KARDEX' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}
                          >
                              <FileSpreadsheet className="w-4 h-4" /> Kárdex Reporte
                          </button>
                      </div>
                  </div>

                  {offeringTab === 'SESSIONS' && (
                    <>
                      <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <Calendar className="w-5 h-5 text-orange-500"/> Calendario de Clases
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {activeOffering.sessions.map(session => {
                              const today = new Date().toISOString().split('T')[0];
                              const isFuture = new Date(session.date) > new Date(today);
                              const isCompleted = session.completed;

                              return (
                                  <div key={session.id} className={`p-4 rounded-2xl border-2 transition-all ${session.completed ? 'border-emerald-100 bg-emerald-50/30' : isFuture ? 'border-slate-100 bg-slate-50/50 opacity-70' : 'border-slate-100 bg-white'}`}>
                                      <div className="flex justify-between items-start mb-3">
                                          <span className="text-xs font-bold text-slate-400 uppercase">Sesión {session.number}</span>
                                          {session.completed && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                      </div>
                                      <div className="mb-4">
                                          <input 
                                            type="date"
                                            value={session.date}
                                            onChange={(e) => !isMember && updateOfferingSession(activeOffering.id, session.id, e.target.value)}
                                            className="w-full bg-transparent font-bold text-slate-700 outline-none text-sm"
                                            disabled={isMember}
                                          />
                                      </div>
                                      {!isMember && (
                                          <button 
                                            onClick={() => !isFuture && setActiveSession(session)}
                                            disabled={isFuture}
                                            className={`w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-1 ${
                                                isFuture 
                                                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                                                : 'bg-slate-800 text-white hover:bg-black'
                                            }`}
                                          >
                                              {isFuture ? 'Programado' : isCompleted ? 'Editar Asistencia' : <><Play className="w-3 h-3" /> Iniciar Clase</>}
                                          </button>
                                      )}
                                  </div>
                              );
                          })}
                      </div>
                    </>
                  )}

                  {offeringTab === 'KARDEX' && (
                      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                          <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                  <thead className="bg-slate-50 text-left text-slate-500 font-bold uppercase text-xs">
                                      <tr>
                                          <th className="p-4 border-b border-r border-slate-200 sticky left-0 bg-slate-50 min-w-[200px]">Alumno</th>
                                          <th className="p-4 border-b border-r border-slate-200 text-center">% Asist.</th>
                                          {activeOffering.sessions.map(s => (
                                              <th key={s.id} className="p-4 border-b border-slate-200 text-center min-w-[60px]">S{s.number}</th>
                                          ))}
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100">
                                      {/* Find course definition to get enrolled students */}
                                      {(() => {
                                          const baseCourse = courses.find(c => c.id === activeOffering.courseId);
                                          const enrolledIds = baseCourse?.enrolledStudentIds || [];
                                          const enrolledMembers = members.filter(m => enrolledIds.includes(m.id));

                                          if (enrolledMembers.length === 0) {
                                              return <tr><td colSpan={activeOffering.sessions.length + 2} className="p-8 text-center text-slate-400">No hay alumnos inscritos.</td></tr>
                                          }

                                          return enrolledMembers.map(m => {
                                              const sessionsHeld = activeOffering.sessions.filter(s => s.completed).length || 1; 
                                              const attendedCount = activeOffering.sessions.filter(s => s.completed && attendance[`${s.id}-${m.id}`]).length;
                                              const percent = Math.round((attendedCount / sessionsHeld) * 100);

                                              return (
                                                  <tr key={m.id} className="hover:bg-slate-50">
                                                      <td className="p-3 border-r border-slate-100 font-medium text-slate-700 sticky left-0 bg-white">
                                                          <div className="flex items-center gap-2">
                                                              <img src={m.photoUrl} className="w-6 h-6 rounded-full bg-slate-100" />
                                                              {m.nombres}
                                                          </div>
                                                      </td>
                                                      <td className="p-3 border-r border-slate-100 text-center">
                                                          <span className={`px-2 py-1 rounded text-xs font-bold ${percent >= 70 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{percent}%</span>
                                                      </td>
                                                      {activeOffering.sessions.map(s => {
                                                          const present = attendance[`${s.id}-${m.id}`];
                                                          return (
                                                              <td key={s.id} className="p-3 text-center">
                                                                  {s.completed ? (
                                                                      present 
                                                                      ? <Check className="w-4 h-4 text-emerald-500 mx-auto" /> 
                                                                      : <X className="w-4 h-4 text-red-400 mx-auto" />
                                                                  ) : (
                                                                      <span className="text-slate-200 text-xs">•</span>
                                                                  )}
                                                              </td>
                                                          )
                                                      })}
                                                  </tr>
                                              )
                                          });
                                      })()}
                                  </tbody>
                              </table>
                          </div>
                      </div>
                  )}

              </div>
          </div>
      )}

      {/* SESSION ATTENDANCE MODAL */}
      {activeSession && activeOffering && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 relative h-[80vh] flex flex-col">
                  <button onClick={() => setActiveSession(null)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  
                  <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-800">{activeOffering.courseName}</h3>
                      <p className="text-sm text-slate-500">Registro de Asistencia - Sesión {activeSession.number}</p>
                      
                      <div className="mt-3 bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-400 uppercase">Fecha de Sesión</span>
                          <input 
                            type="date" 
                            value={activeSession.date}
                            readOnly
                            className="bg-transparent font-bold text-slate-700 text-sm text-right outline-none"
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {(() => {
                          const baseCourse = courses.find(c => c.id === activeOffering.courseId);
                          const enrolledIds = baseCourse?.enrolledStudentIds || [];
                          const enrolledMembers = members.filter(m => enrolledIds.includes(m.id));

                          if (enrolledMembers.length === 0) {
                              return <p className="text-center text-slate-400 text-sm py-4">No hay alumnos matriculados en este curso.</p>
                          }

                          return enrolledMembers.map(m => {
                              const isPresent = attendance[`${activeSession.id}-${m.id}`];
                              return (
                                  <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isPresent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100'}`}>
                                      <div className="flex items-center gap-3">
                                          <img src={m.photoUrl} className="w-10 h-10 rounded-full bg-slate-100" />
                                          <div>
                                              <p className="font-bold text-slate-700 text-sm">{m.nombres}</p>
                                              <p className="text-[10px] text-slate-400 uppercase">{m.estatus}</p>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => toggleAttendance(activeSession.id, m.id)}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isPresent ? 'bg-emerald-500 text-white shadow-glow' : 'bg-slate-200 text-slate-400'}`}
                                      >
                                          <Check className="w-5 h-5" />
                                      </button>
                                  </div>
                              );
                          });
                      })()}
                  </div>

                  <button 
                    onClick={() => {
                        // Mark session as completed in offering
                        const updatedSessions = activeOffering.sessions.map(s => 
                            s.id === activeSession.id ? { ...s, completed: true } : s
                        );
                        // Update real progress count
                        const completedCount = updatedSessions.filter(s => s.completed).length;
                        
                        updateCourseOffering(activeOffering.id, { 
                            sessions: updatedSessions,
                            sesionesRealizadas: completedCount
                        });
                        
                        setActiveSession(null);
                        notify("Asistencia guardada y sesión completada");
                    }}
                    className="mt-4 w-full py-4 bg-brand-navy text-white font-bold rounded-2xl hover:bg-black transition-colors shadow-lg"
                  >
                      Confirmar y Cerrar Sesión
                  </button>
              </div>
          </div>
      )}

      {/* OPEN OFFERING MODAL */}
      {isOfferingOpen && activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsOfferingOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-400"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Programar Clase</h3>
                  <p className="text-sm text-slate-500 mb-6">Apertura de una instancia real del curso.</p>
                  
                  <form onSubmit={handleOpenOffering} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Maestro Asignado</label>
                          <select 
                            className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700"
                            value={offeringMaestro}
                            onChange={e => setOfferingMaestro(e.target.value)}
                            required
                          >
                              <option value="">-- Seleccionar --</option>
                              {members.map(m => <option key={m.id} value={m.id}>{m.nombres}</option>)}
                          </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Fecha Inicio</label>
                              <input type="date" className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light" value={offeringStart} onChange={e => setOfferingStart(e.target.value)} required />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1">Nº Sesiones</label>
                              <input type="number" className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light" value={offeringSessions} onChange={e => setOfferingSessions(parseInt(e.target.value))} min={1} max={20} />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1">Horario</label>
                          <input type="time" className="w-full mt-1 p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-brand-light font-medium text-slate-700" value={offeringHorario} onChange={e => setOfferingHorario(e.target.value)} required />
                      </div>

                      <button type="submit" className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold hover:bg-orange-600 shadow-glow mt-2">Confirmar Apertura</button>
                  </form>
              </div>
          </div>
      )}

      {/* ENROLL STUDENT MODAL - FIX: SEARCH BOX */}
      {isEnrollOpen && activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 h-[80vh] flex flex-col">
                  <button onClick={() => setIsEnrollOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Matricular Alumnos</h3>
                  <p className="text-sm text-slate-500 mb-4">{activeCourse.nombre}</p>

                  {/* SEARCH BAR ADDED */}
                  <div className="relative mb-4">
                      <input 
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-brand-light font-medium text-sm"
                        placeholder="Buscar miembro..."
                        value={enrollSearchTerm}
                        onChange={e => setEnrollSearchTerm(e.target.value)}
                        autoFocus
                      />
                      <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {members.filter(m => 
                          (currentUser.anexoId === 'ALL' || m.anexoId === currentUser.anexoId) &&
                          m.nombres.toLowerCase().includes(enrollSearchTerm.toLowerCase())
                      ).map(m => {
                          const isEnrolled = activeCourse.enrolledStudentIds?.includes(m.id);
                          return (
                              <div key={m.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                                  <div className="flex items-center gap-3">
                                      <img src={m.photoUrl} className="w-8 h-8 rounded-full bg-slate-200" />
                                      <span className="font-bold text-sm text-slate-700">{m.nombres}</span>
                                  </div>
                                  <button 
                                    onClick={() => handleEnrollToggle(m.id)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isEnrolled ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
                                  >
                                      {isEnrolled ? 'Retirar' : 'Inscribir'}
                                  </button>
                              </div>
                          )
                      })}
                  </div>
              </div>
          </div>
      )}

      {/* MATERIALS MODAL */}
      {isMaterialsOpen && activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsMaterialsOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Materiales del Curso</h3>
                  
                  {/* List Materials */}
                  <div className="space-y-3 mb-6 max-h-40 overflow-y-auto custom-scrollbar">
                      {(activeCourse.materials || []).map(mat => (
                          <div key={mat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="bg-white p-1.5 rounded-lg text-slate-400">
                                      {mat.type === 'VIDEO' ? <Video className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
                                  </div>
                                  <a href={mat.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-slate-700 hover:text-brand-blue truncate block max-w-[200px]">{mat.title}</a>
                              </div>
                              <a href={mat.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-400 hover:text-brand-blue">Abrir</a>
                          </div>
                      ))}
                      {(activeCourse.materials || []).length === 0 && <p className="text-center text-xs text-slate-400 italic">No hay materiales subidos.</p>}
                  </div>

                  {/* Add Material Form */}
                  <div className="border-t border-slate-100 pt-4">
                      <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Subir Nuevo Material</h4>
                      <div className="space-y-3">
                          <input 
                            placeholder="Título del recurso"
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 outline-none text-sm font-medium"
                            value={newMaterialTitle}
                            onChange={e => setNewMaterialTitle(e.target.value)}
                          />
                          
                          {/* File Input Simulator */}
                          <div className="relative">
                               <input 
                                  type="file"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                      if(e.target.files?.[0]) {
                                          setNewMaterialUrl(URL.createObjectURL(e.target.files[0])); // Mock URL
                                          setNewMaterialTitle(e.target.files[0].name);
                                      }
                                  }}
                               />
                               <div className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-center gap-2 text-sm text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer">
                                   <Upload className="w-4 h-4" /> {newMaterialUrl ? 'Archivo Seleccionado' : 'Elegir Archivo'}
                               </div>
                          </div>

                          <div className="flex gap-2">
                              <select 
                                className="bg-slate-50 rounded-xl border border-slate-200 p-3 text-sm outline-none"
                                value={newMaterialType}
                                onChange={e => setNewMaterialType(e.target.value as any)}
                              >
                                  <option value="PDF">Documento PDF</option>
                                  <option value="VIDEO">Video</option>
                                  <option value="LINK">Enlace Externo</option>
                              </select>
                              <button 
                                onClick={handleAddMaterial}
                                disabled={!newMaterialTitle || !newMaterialUrl}
                                className="flex-1 bg-slate-800 text-white font-bold rounded-xl text-sm hover:bg-black disabled:opacity-50"
                              >
                                  Agregar
                              </button>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* CREATE COURSE MODAL (Already exists in previous block, ensure it is rendered) */}
      {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsCreateOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Nuevo Curso</h3>
                  <form onSubmit={handleCreateCourse} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Tipo de Formación</label>
                          <select 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-brand-light"
                            value={newCourseType}
                            onChange={e => setNewCourseType(e.target.value as Course['type'])}
                          >
                              <option value="BASICO">Discipulado Básico (7 Pasos)</option>
                              <option value="EPMI_I">EPMI Ciclo I (Fundamentos)</option>
                              <option value="EPMI_II">EPMI Ciclo II (Liderazgo)</option>
                              <option value="ESCUELA">Otras Escuelas (Especialización)</option>
                          </select>
                      </div>

                      {newCourseType === 'ESCUELA' && (
                          <div className="animate-fadeIn">
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Nombre de la Escuela</label>
                              <input 
                                placeholder="Ej. Escuela de Música"
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-light"
                                value={newCourseCategory}
                                onChange={e => setNewCourseCategory(e.target.value)}
                                list="school-suggestions"
                              />
                              <datalist id="school-suggestions">
                                  <option value="Escuela de Intercesión" />
                                  <option value="Escuela de Diáconos" />
                              </datalist>
                          </div>
                      )}

                      <div>
                          <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Nombre del Curso</label>
                          <input 
                            className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-light"
                            value={newCourseName}
                            onChange={e => setNewCourseName(e.target.value)}
                            placeholder="Ej. Sanidad Interior"
                          />
                      </div>

                      <div className="flex gap-4">
                          <div className="flex-1">
                              <label className="text-xs font-bold text-slate-400 uppercase ml-1 block mb-2">Nivel/Orden</label>
                              <input 
                                type="number"
                                className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-brand-light text-center"
                                value={newCourseLevel}
                                onChange={e => setNewCourseLevel(e.target.value)}
                                min="1"
                              />
                          </div>
                      </div>

                      <button type="submit" className="w-full py-3 bg-brand-navy text-white rounded-2xl font-bold hover:bg-black transition-colors shadow-lg mt-2">
                          Agregar al Catálogo
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* EDIT COURSE MODAL */}
      {isEditOpen && activeCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50">
                  <button onClick={() => setIsEditOpen(false)} className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"><X className="w-5 h-5"/></button>
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Editar Curso</h3>
                  <form onSubmit={handleUpdateCourse} className="space-y-4">
                      <input 
                        className="w-full p-3 bg-slate-50 rounded-xl border border-slate-200 font-bold text-slate-700 outline-none"
                        value={editCourseName}
                        onChange={e => setEditCourseName(e.target.value)}
                      />
                      <button type="submit" className="w-full py-3 bg-brand-blue text-white rounded-2xl font-bold">Guardar Cambios</button>
                  </form>
              </div>
          </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {courseToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 relative border border-white/50 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                      <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">¿Eliminar Curso?</h3>
                  <p className="text-sm text-slate-500 mb-6">
                      Se borrará el historial de este curso del catálogo.
                  </p>
                  <div className="flex gap-3">
                      <button onClick={() => setCourseToDelete(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200">Cancelar</button>
                      <button onClick={handleDeleteCourse} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg">Eliminar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Courses;
