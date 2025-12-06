
import React, { useState, createContext, useContext, useEffect, useCallback } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Members from './components/Members';
import AttendancePage from './components/Attendance';
import Courses from './components/Courses';
import Ministries from './components/Ministries';
import Finances from './components/Finances';
import PlanAnual from './components/PlanAnual';
import Sedes from './components/Sedes';
import Epmi from './components/Epmi';
import Intercesion from './components/Intercesion'; 
import Viajes from './components/Viajes'; 
import Settings from './components/Settings';
import Login from './components/Login';
import Support from './components/Support';
import Resources from './components/Resources';
import Profile from './components/Profile';
import NotificationsPage from './components/NotificationsPage';

import { GlobalState, UserRole, Member, Anexo, Event, Ministry, FinanceTransaction, Course, TeachingHouse, IntercesionGroup, EpmiEnrollment, IntercesionLog, MissionTrip, HistoryRecord, Notification, MonthlyReport, AuditRecord, IndicatorLevel, CourseMaterial } from './types';
import { MOCK_ANEXOS, MOCK_MEMBERS, MOCK_EVENTS, MOCK_MINISTRIES, MOCK_COURSES, MOCK_TEACHING_HOUSES, MOCK_FINANCES, MOCK_INTERCESION_GROUPS, MOCK_EPMI_ENROLLMENTS, MOCK_INTERCESION_LOGS, MOCK_TRIPS, MOCK_HISTORY, MOCK_NOTIFICATIONS, MOCK_MONTHLY_REPORTS } from './services/mockData';

export const AppContext = createContext<GlobalState | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// PERSISTENCE HELPER
const loadState = <T,>(key: string, fallback: T): T => {
  try {
    const stored = localStorage.getItem(`shekinah_${key}`);
    return stored ? JSON.parse(stored) : fallback;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  // --- STATE MANAGEMENT WITH PERSISTENCE ---
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Session is transient
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; anexoId: string | 'ALL'; name: string; memberId?: string }>({
    role: 'PASTOR_PRINCIPAL',
    anexoId: 'ALL',
    name: 'Pastor Principal'
  });

  const [anexos, setAnexos] = useState<Anexo[]>(() => loadState('anexos', MOCK_ANEXOS));
  const [teachingHouses, setTeachingHouses] = useState<TeachingHouse[]>(() => loadState('houses', MOCK_TEACHING_HOUSES));
  const [members, setMembers] = useState<Member[]>(() => loadState('members', MOCK_MEMBERS));
  const [events, setEvents] = useState<Event[]>(() => loadState('events', MOCK_EVENTS));
  const [attendance, setAttendance] = useState<Record<string, boolean>>(() => loadState('attendance', {}));
  const [eventRegistrations, setEventRegistrations] = useState<Record<string, string[]>>(() => loadState('registrations', {}));
  const [ministries, setMinistries] = useState<Ministry[]>(() => loadState('ministries', MOCK_MINISTRIES));
  const [intercesionGroups, setIntercesionGroups] = useState<IntercesionGroup[]>(() => loadState('int_groups', MOCK_INTERCESION_GROUPS));
  const [intercesionLogs, setIntercesionLogs] = useState<IntercesionLog[]>(() => loadState('int_logs', MOCK_INTERCESION_LOGS));
  const [finances, setFinances] = useState<FinanceTransaction[]>(() => loadState('finances', MOCK_FINANCES));
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>(() => loadState('reports', MOCK_MONTHLY_REPORTS));
  const [courses, setCourses] = useState<Course[]>(() => {
      const storedCourses = loadState('courses', MOCK_COURSES);
      // Ensure requests array exists for old data
      return storedCourses.map((c: Course) => ({...c, requests: c.requests || []}));
  });
  const [epmiEnrollments, setEpmiEnrollments] = useState<EpmiEnrollment[]>(() => loadState('epmi', MOCK_EPMI_ENROLLMENTS));
  const [trips, setTrips] = useState<MissionTrip[]>(() => loadState('trips', MOCK_TRIPS));
  const [history, setHistory] = useState<HistoryRecord[]>(() => loadState('history', MOCK_HISTORY));
  const [notifications, setNotifications] = useState<Notification[]>(() => loadState('notifications', MOCK_NOTIFICATIONS));
  const [auditLogs, setAuditLogs] = useState<AuditRecord[]>(() => loadState('audit', []));

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | null } | null>(null);

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => localStorage.setItem('shekinah_anexos', JSON.stringify(anexos)), [anexos]);
  useEffect(() => localStorage.setItem('shekinah_houses', JSON.stringify(teachingHouses)), [teachingHouses]);
  useEffect(() => localStorage.setItem('shekinah_members', JSON.stringify(members)), [members]);
  useEffect(() => localStorage.setItem('shekinah_events', JSON.stringify(events)), [events]);
  useEffect(() => localStorage.setItem('shekinah_attendance', JSON.stringify(attendance)), [attendance]);
  useEffect(() => localStorage.setItem('shekinah_registrations', JSON.stringify(eventRegistrations)), [eventRegistrations]);
  useEffect(() => localStorage.setItem('shekinah_ministries', JSON.stringify(ministries)), [ministries]);
  useEffect(() => localStorage.setItem('shekinah_int_groups', JSON.stringify(intercesionGroups)), [intercesionGroups]);
  useEffect(() => localStorage.setItem('shekinah_int_logs', JSON.stringify(intercesionLogs)), [intercesionLogs]);
  useEffect(() => localStorage.setItem('shekinah_finances', JSON.stringify(finances)), [finances]);
  useEffect(() => localStorage.setItem('shekinah_reports', JSON.stringify(monthlyReports)), [monthlyReports]);
  useEffect(() => localStorage.setItem('shekinah_courses', JSON.stringify(courses)), [courses]);
  useEffect(() => localStorage.setItem('shekinah_epmi', JSON.stringify(epmiEnrollments)), [epmiEnrollments]);
  useEffect(() => localStorage.setItem('shekinah_trips', JSON.stringify(trips)), [trips]);
  useEffect(() => localStorage.setItem('shekinah_history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('shekinah_notifications', JSON.stringify(notifications)), [notifications]);
  useEffect(() => localStorage.setItem('shekinah_audit', JSON.stringify(auditLogs)), [auditLogs]);

  // --- INTELLIGENT AUTOMATION (PDF 11.12) - OPTIMIZED ALGORITHM ---
  const recalculateSpiritualIndicators = useCallback((memberId: string) => {
      setMembers(prevMembers => prevMembers.map(member => {
          if (member.id !== memberId) return member;

          const now = new Date();
          const sixtyDaysAgo = new Date();
          sixtyDaysAgo.setDate(now.getDate() - 60);

          // 1. Attendance Level (Real Temporal Logic: Last 8 events within active range)
          const sortedEvents = [...events].sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
          
          const recentEvents = sortedEvents.filter(e => 
              (e.tipo === 'Culto' || e.tipo === 'Clase/Curso') && 
              (e.anexoId === member.anexoId || e.anexoId === 'ALL')
          ).slice(0, 8);
          
          let attendedCount = 0;
          if (recentEvents.length > 0) {
             attendedCount = recentEvents.filter(e => attendance[`${e.id}-${memberId}`]).length;
          }
          
          const attendancePct = recentEvents.length > 0 ? (attendedCount / recentEvents.length) * 100 : 100;
          
          let newAttendanceLevel: IndicatorLevel = 'VERDE';
          if (attendancePct < 25) newAttendanceLevel = 'ROJO';
          else if (attendancePct < 50) newAttendanceLevel = 'NARANJA';
          else if (attendancePct < 75) newAttendanceLevel = 'AMARILLO';

          // 2. Fidelity Level (Real Temporal Logic: Transaction in last 60 days)
          const recentTransactions = finances.filter(f => {
              const txDate = new Date(f.fecha);
              return f.miembroId === memberId && txDate >= sixtyDaysAgo;
          });
          
          let newFidelityLevel: IndicatorLevel = 'ROJO';
          if (recentTransactions.length >= 2) newFidelityLevel = 'VERDE';
          else if (recentTransactions.length === 1) newFidelityLevel = 'AMARILLO';
          
          // 3. Service Level (Includes Intercession Fasting & Trips)
          const inMinistry = member.ministryIds.length > 0;
          const onTrip = trips.some(t => t.participants.some(p => p.memberId === memberId && p.status === 'APROBADO' && p.attended));
          const inEpmi = epmiEnrollments.some(e => e.memberId === memberId && e.status === 'ACTIVO');
          
          // CHECK INTERCESSION LOGS (Fasting/Wednesdays)
          const intercessionCount = intercesionLogs.filter(l => {
              const logDate = new Date(l.fecha);
              return l.memberId === memberId && logDate >= sixtyDaysAgo;
          }).length;
          
          const isFaithfulFaster = intercessionCount >= 4; // Approx 2 fasts/wednesdays per month min
          
          let newServiceLevel: IndicatorLevel = 'ROJO';
          if (inEpmi || onTrip || isFaithfulFaster) newServiceLevel = 'VERDE'; // Highly active in disciplines
          else if (inMinistry) newServiceLevel = 'AMARILLO'; // Active but maybe not fasting
          else if (intercessionCount > 0) newServiceLevel = 'AMARILLO'; // Trying
          else newServiceLevel = 'NARANJA';

          // Only update if changed
          if (member.attendance_level === newAttendanceLevel && 
              member.fidelity_level === newFidelityLevel &&
              member.service_level === newServiceLevel) {
              return member;
          }

          return {
              ...member,
              attendance_level: newAttendanceLevel,
              fidelity_level: newFidelityLevel,
              service_level: newServiceLevel
          };
      }));
  }, [events, attendance, finances, trips, epmiEnrollments, intercesionLogs]);

  // --- CRON JOB SIMULATION (PDF 9.12) ---
  const runNightlyProcess = () => {
      let alertsGenerated = 0;
      const currentMonth = new Date().getMonth() + 1;
      
      // 1. Check Missing Reports
      anexos.forEach(anexo => {
          const hasReport = monthlyReports.some(r => r.anexoId === anexo.id && r.month === currentMonth && r.status !== 'PENDIENTE');
          if (!hasReport) {
              const notif: Notification = {
                  id: `SYS-REP-${Date.now()}-${anexo.id}`,
                  type: 'ALERT',
                  title: 'Reporte Faltante',
                  message: `El anexo ${anexo.nombre} no ha enviado el cierre financiero de este mes.`,
                  date: 'Ahora',
                  read: false,
                  linkTo: '/finances'
              };
              setNotifications(prev => [notif, ...prev]);
              alertsGenerated++;
          }
      });

      // 2. Check Risk Members
      members.forEach(member => {
          recalculateSpiritualIndicators(member.id);
          if (member.estatus === 'Estable' && member.attendance_level === 'ROJO') {
              const notif: Notification = {
                  id: `SYS-RISK-${Date.now()}-${member.id}`,
                  type: 'ALERT',
                  title: 'Riesgo Espiritual',
                  message: `${member.nombres} ha bajado su asistencia críticamente.`,
                  date: 'Ahora',
                  read: false,
                  linkTo: '/members'
              };
              setNotifications(prev => [notif, ...prev]);
              alertsGenerated++;
          }
      });

      notify(`Proceso completado. ${alertsGenerated} alertas generadas.`);
      logAudit('SYSTEM_CRON', 'Sistema Automático', 'Ejecución de revisión nocturna');
  };

  const resetSystem = () => {
      if(window.confirm("ADVERTENCIA: ¿Estás seguro de borrar TODOS los datos y volver al estado inicial?")) {
        localStorage.clear();
        
        setMembers(MOCK_MEMBERS);
        setAnexos(MOCK_ANEXOS);
        setFinances(MOCK_FINANCES);
        setEvents(MOCK_EVENTS);
        setNotifications(MOCK_NOTIFICATIONS);
        setAuditLogs([]);
        setTeachingHouses(MOCK_TEACHING_HOUSES);
        setMinistries(MOCK_MINISTRIES);
        setIntercesionGroups(MOCK_INTERCESION_GROUPS);
        setIntercesionLogs(MOCK_INTERCESION_LOGS);
        setCourses(MOCK_COURSES);
        setEpmiEnrollments(MOCK_EPMI_ENROLLMENTS);
        setTrips(MOCK_TRIPS);
        setHistory(MOCK_HISTORY);
        setAttendance({});
        setEventRegistrations({});
        setMonthlyReports(MOCK_MONTHLY_REPORTS);

        notify('Sistema restaurado a valores de fábrica', 'success');
        setTimeout(() => window.location.reload(), 1000);
      }
  };

  const logAudit = (action: string, target: string, details: string) => {
      const newLog: AuditRecord = {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          actorName: currentUser.name,
          action,
          target,
          details
      };
      setAuditLogs(prev => [newLog, ...prev]);
  };

  const login = (role: UserRole) => {
      let user = { role: role, anexoId: 'ALL', name: 'Pastor Principal', memberId: undefined };
      
      if (role === 'LIDER_ANEXO') {
          user = { role: 'LIDER_ANEXO', anexoId: 'ANX-02', name: 'Hno. Roberto', memberId: 'MEM-003' };
      } else if (role === 'MAESTRO_CASA') {
          user = { role: 'MAESTRO_CASA', anexoId: 'ANX-01', name: 'Hna. Rosa', memberId: 'MEM-006' }; 
      } else if (role === 'MIEMBRO') {
          user = { role: 'MIEMBRO', anexoId: 'ANX-01', name: 'Maria Gonzalez', memberId: 'MEM-002' };
      }

      setCurrentUser(user as any);
      setIsAuthenticated(true);
      logAudit('LOGIN', user.name, `Inicio de sesión con rol ${role}`);
  };

  const logout = () => {
      setIsAuthenticated(false);
      logAudit('LOGOUT', currentUser.name, 'Cierre de sesión');
  };

  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const sendWhatsApp = (phone: string, message: string) => {
      if (!phone) {
          notify('El usuario no tiene teléfono registrado', 'error');
          return;
      }
      const cleanPhone = phone.replace(/\D/g, '');
      const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
  };

  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const addAnexo = (anexo: Anexo) => {
    setAnexos(prev => [...prev, anexo]);
    logAudit('CREATE_ANEXO', anexo.nombre, `Nuevo anexo creado`);
    notify('Sede/Anexo creado exitosamente');
  };

  const updateAnexo = (id: string, data: Partial<Anexo>) => {
    setAnexos(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
    logAudit('UPDATE_ANEXO', `Anexo ID: ${id}`, `Campos actualizados: ${Object.keys(data).join(', ')}`);
    notify('Anexo actualizado');
  };

  const deleteAnexo = (id: string) => {
    setAnexos(prev => prev.filter(a => a.id !== id));
    logAudit('DELETE_ANEXO', `Anexo ID: ${id}`, 'Eliminación de sede');
    notify('Sede eliminada', 'error');
  }

  const addTeachingHouse = (house: TeachingHouse) => {
    setTeachingHouses(prev => [...prev, house]);
    logAudit('CREATE_HOUSE', house.nombre, `Anexo: ${house.anexoId}`);
    notify('Casa de Enseñanza creada');
  };

  const updateTeachingHouse = (id: string, data: Partial<TeachingHouse>) => {
    setTeachingHouses(prev => prev.map(h => h.id === id ? { ...h, ...data } : h));
    logAudit('UPDATE_HOUSE', `Casa ID: ${id}`, `Datos modificados`);
    notify('Casa actualizada');
  };

  const deleteTeachingHouse = (id: string) => {
    setTeachingHouses(prev => prev.filter(h => h.id !== id));
    logAudit('DELETE_HOUSE', `Casa ID: ${id}`, 'Eliminación permanente');
    notify('Casa de Enseñanza eliminada', 'error');
  };

  const addMember = (member: Member) => {
    const memberWithDate = {
        ...member,
        joinedAt: new Date().toISOString()
    };
    setMembers(prev => [...prev, memberWithDate]);
    logAudit('CREATE_MEMBER', member.nombres, `Anexo: ${member.anexoId}`);
    notify('Miembro agregado correctamente');
  };

  const updateMember = (id: string, data: Partial<Member>) => {
    setMembers(prev => prev.map(m => {
        if (m.id === id) {
            if (data.coursesCompletedIds) {
                const basics = courses.filter(c => c.type === 'BASICO');
                const doneCount = data.coursesCompletedIds.filter(id => basics.find(b => b.id === id)).length;
                data.completed_basicos = doneCount === 7;
            }
            return { ...m, ...data };
        }
        return m;
    }));
    logAudit('UPDATE_MEMBER', `ID: ${id}`, `Campos: ${Object.keys(data).join(', ')}`);
    notify('Datos del miembro actualizados');
  };

  const updateMemberPhoto = (id: string, url: string) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, photoUrl: url } : m));
    notify('Foto actualizada');
  };

  const deleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    logAudit('DELETE_MEMBER', `ID: ${id}`, 'Borrado del sistema');
    notify('Miembro eliminado', 'error');
  };

  const assignMinistryRole = (memberId: string, ministryId: string, role: string) => {
      setMembers(prev => prev.map(m => {
          if (m.id !== memberId) return m;
          const currentRoles = m.ministryRoles || {};
          const currentIds = m.ministryIds || [];
          
          return {
              ...m,
              ministryIds: currentIds.includes(ministryId) ? currentIds : [...currentIds, ministryId],
              ministryRoles: { ...currentRoles, [ministryId]: role }
          };
      }));
      logAudit('ASSIGN_ROLE', `Member: ${memberId}`, `Role: ${role} in Min: ${ministryId}`);
      recalculateSpiritualIndicators(memberId);
      notify('Rol ministerial asignado');
  };

  const assignIntercesionGroup = (memberId: string, groupId: string | null) => {
      setMembers(prev => prev.map(m => 
          m.id === memberId ? { ...m, intercesionGroupId: groupId || undefined } : m
      ));
      logAudit('ASSIGN_INTERCESION', `Member: ${memberId}`, `Group: ${groupId || 'REMOVED'}`);
      notify(groupId ? 'Miembro agregado al grupo' : 'Miembro removido del grupo');
  };

  const addIntercesionGroup = (group: IntercesionGroup) => {
      setIntercesionGroups(prev => [...prev, group]);
      notify('Grupo de intercesión creado');
  };

  const updateIntercesionGroup = (id: string, data: Partial<IntercesionGroup>) => {
      setIntercesionGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
      notify('Grupo de intercesión actualizado');
  };

  const deleteIntercesionGroup = (id: string) => {
      setIntercesionGroups(prev => prev.filter(g => g.id !== id));
      notify('Grupo eliminado', 'error');
  };

  const addEvent = (event: Event) => {
    setEvents(prev => [...prev, event]);
    logAudit('CREATE_EVENT', event.nombre, `Fecha: ${event.fecha}`);
    notify('Actividad solicitada/creada');
  };

  const updateEvent = (id: string, data: Partial<Event>) => {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    notify('Evento actualizado');
  };

  const toggleAttendance = (eventId: string, memberId: string) => {
    const key = `${eventId}-${memberId}`;
    setAttendance(prev => ({ ...prev, [key]: !prev[key] }));
    setTimeout(() => recalculateSpiritualIndicators(memberId), 100);
  };

  const markAllPresent = (eventId: string, memberIds: string[]) => {
    const updates: Record<string, boolean> = {};
    memberIds.forEach(id => {
      updates[`${eventId}-${id}`] = true;
    });
    setAttendance(prev => ({ ...prev, ...updates }));
    memberIds.forEach(id => setTimeout(() => recalculateSpiritualIndicators(id), 100));
    logAudit('BATCH_ATTENDANCE', `Event: ${eventId}`, `Marked ${memberIds.length} present`);
    notify('Todos marcados como presentes');
  };

  const toggleEventRegistration = (eventId: string, memberId: string) => {
      setEventRegistrations(prev => {
          const current = prev[eventId] || [];
          const isRegistered = current.includes(memberId);
          const newRegistrations = isRegistered 
              ? current.filter(id => id !== memberId)
              : [...current, memberId];
          
          return { ...prev, [eventId]: newRegistrations };
      });
      notify('Estado de inscripción actualizado');
  };

  const addMinistry = (min: Ministry) => {
    setMinistries(prev => [...prev, min]);
    notify('Ministerio creado');
  };

  const updateMinistry = (id: string, data: Partial<Ministry>) => {
    setMinistries(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    notify('Ministerio actualizado');
  };

  const deleteMinistry = (id: string) => {
    setMinistries(prev => prev.filter(m => m.id !== id));
    notify('Ministerio eliminado', 'error');
  };

  const logIntercesionAttendance = (date: string, type: IntercesionLog['tipo'], memberId: string, present: boolean) => {
      if (present) {
          const newLog: IntercesionLog = {
              id: `LOG-${Date.now()}-${Math.random()}`,
              fecha: date,
              tipo: type,
              memberId,
              present: true
          };
          setIntercesionLogs(prev => [...prev, newLog]);
      } else {
          setIntercesionLogs(prev => prev.filter(log => !(log.fecha === date && log.tipo === type && log.memberId === memberId)));
      }
      recalculateSpiritualIndicators(memberId);
  };

  const addTransaction = (t: FinanceTransaction) => {
    setFinances(prev => [t, ...prev]);
    if (t.miembroId) {
        setTimeout(() => recalculateSpiritualIndicators(t.miembroId!), 100);
    }
    logAudit('FINANCE_ENTRY', `Monto: ${t.monto}`, `Tipo: ${t.tipo}`);
    notify('Transacción registrada');
  };

  const addMonthlyReport = (report: MonthlyReport) => {
      setMonthlyReports(prev => [...prev, report]);
      logAudit('MONTHLY_REPORT', `Anexo: ${report.anexoId}`, `Mes: ${report.month}`);
      notify('Reporte mensual registrado y enviado');
  };

  const updateMonthlyReport = (id: string, data: Partial<MonthlyReport>) => {
      setMonthlyReports(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
      logAudit('UPDATE_REPORT', `ID: ${id}`, `Status: ${data.status}`);
      notify('Estado del reporte actualizado');
  };

  const addCourse = (c: Course) => {
    setCourses(prev => [...prev, { ...c, requests: [] }]);
    notify('Curso creado');
  };

  const updateCourse = (id: string, data: Partial<Course>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    logAudit('UPDATE_COURSE', `ID: ${id}`, 'Datos del curso modificados');
    notify('Curso actualizado');
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    logAudit('DELETE_COURSE', `ID: ${id}`, 'Curso eliminado del catálogo');
    notify('Curso eliminado', 'error');
  };

  const enrollStudentInCourse = (courseId: string, memberId: string) => {
      setCourses(prev => prev.map(c => {
          if(c.id !== courseId) return c;
          const current = c.enrolledStudentIds || [];
          if(current.includes(memberId)) return c;
          return { ...c, enrolledStudentIds: [...current, memberId] };
      }));
      notify("Alumno inscrito al curso");
  };

  const unenrollStudentFromCourse = (courseId: string, memberId: string) => {
      setCourses(prev => prev.map(c => {
          if(c.id !== courseId) return c;
          return { ...c, enrolledStudentIds: (c.enrolledStudentIds || []).filter(id => id !== memberId) };
      }));
      notify("Alumno retirado del curso");
  };

  const addCourseMaterial = (courseId: string, material: CourseMaterial) => {
      setCourses(prev => prev.map(c => {
          if(c.id !== courseId) return c;
          return { ...c, materials: [...(c.materials || []), material] };
      }));
      notify("Material subido exitosamente");
  };

  const requestCourseEnrollment = (courseId: string, memberId: string) => {
      setCourses(prev => prev.map(c => {
          if (c.id !== courseId) return c;
          const currentRequests = c.requests || [];
          if (currentRequests.includes(memberId) || (c.enrolledStudentIds || []).includes(memberId)) return c;
          return { ...c, requests: [...currentRequests, memberId] };
      }));
      notify("Solicitud de vacante enviada");
  };

  const approveCourseEnrollment = (courseId: string, memberId: string, approved: boolean) => {
      setCourses(prev => prev.map(c => {
          if (c.id !== courseId) return c;
          
          const newRequests = (c.requests || []).filter(id => id !== memberId);
          let newEnrolled = c.enrolledStudentIds || [];
          
          if (approved) {
              newEnrolled = [...newEnrolled, memberId];
          }

          return { ...c, requests: newRequests, enrolledStudentIds: newEnrolled };
      }));
      notify(approved ? "Alumno aprobado e inscrito" : "Solicitud rechazada");
  };

  const enrollEpmiStudent = (memberId: string) => {
    if (currentUser.role !== 'PASTOR_PRINCIPAL') {
        notify('Solo el Pastor Principal puede autorizar ingreso a EPMI', 'error');
        return;
    }
    if (epmiEnrollments.some(e => e.memberId === memberId && e.status === 'ACTIVO')) {
        notify('El miembro ya está activo en EPMI', 'error');
        return;
    }
    const newEnrollment: EpmiEnrollment = {
        id: `EPMI-ENR-${Date.now()}`,
        memberId,
        cycle: 'CICLO_I',
        status: 'ACTIVO',
        startDate: new Date().toISOString().split('T')[0],
        grades: {},
        attendance: 100
    };
    setEpmiEnrollments(prev => [...prev, newEnrollment]);
    logAudit('EPMI_ENROLL', `Member: ${memberId}`, 'Inscrito en Ciclo I');
    notify('Estudiante inscrito oficialmente en Ciclo I');
  };

  const updateEpmiStudent = (id: string, data: Partial<EpmiEnrollment>) => {
    setEpmiEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    logAudit('EPMI_UPDATE', `ID: ${id}`, 'Progreso actualizado');
    notify('Progreso EPMI actualizado');
  };

  const addTrip = (trip: MissionTrip) => {
      setTrips(prev => [...prev, trip]);
      logAudit('CREATE_TRIP', trip.destino, `Salida: ${trip.fechaSalida}`);
      notify('Viaje creado exitosamente');
  };

  const updateTrip = (id: string, data: Partial<MissionTrip>) => {
      setTrips(prev => prev.map(t => t.id === id ? { ...t, ...data } : t));
      logAudit('UPDATE_TRIP', `ID: ${id}`, 'Estado actualizado');
      notify('Viaje actualizado');
  };

  const markTripAttendance = (tripId: string, memberId: string, attended: boolean) => {
      setTrips(prev => prev.map(t => {
          if (t.id === tripId) {
              return {
                  ...t,
                  participants: t.participants.map(p => 
                      p.memberId === memberId ? { ...p, attended } : p
                  )
              };
          }
          return t;
      }));
      setTimeout(() => recalculateSpiritualIndicators(memberId), 100);
      notify('Asistencia de viaje registrada');
  };

  const addHistoryNote = (memberId: string, note: string) => {
      const newNote: HistoryRecord = {
          id: `H-${Date.now()}`,
          fecha: new Date().toISOString().split('T')[0],
          tipo: 'NOTA',
          titulo: 'Nota Pastoral',
          detalle: note,
          autorId: 'MEM-001'
      };
      setHistory(prev => [...prev, newNote]); 
      logAudit('PASTORAL_NOTE', `Member: ${memberId}`, 'Nota confidencial agregada');
  };

  const value: GlobalState = {
    isAuthenticated, login, logout,
    currentUser, setCurrentUser,
    notifications, markNotificationRead,
    anexos, addAnexo, updateAnexo, deleteAnexo,
    teachingHouses, addTeachingHouse, updateTeachingHouse, deleteTeachingHouse,
    members, addMember, updateMember, deleteMember, updateMemberPhoto, assignMinistryRole,
    events, addEvent, updateEvent,
    attendance, toggleAttendance, markAllPresent,
    eventRegistrations, toggleEventRegistration,
    ministries, addMinistry, updateMinistry, deleteMinistry, 
    intercesionGroups, intercesionLogs, logIntercesionAttendance, assignIntercesionGroup, addIntercesionGroup, updateIntercesionGroup, deleteIntercesionGroup,
    finances, addTransaction,
    monthlyReports, addMonthlyReport, updateMonthlyReport,
    courses, addCourse, updateCourse, deleteCourse,
    enrollStudentInCourse, unenrollStudentFromCourse, addCourseMaterial, requestCourseEnrollment, approveCourseEnrollment,
    epmiEnrollments, enrollEpmiStudent, updateEpmiStudent,
    trips, addTrip, updateTrip, markTripAttendance,
    history, addHistoryNote,
    auditLogs,
    runNightlyProcess, resetSystem,
    notify,
    sendWhatsApp
  };

  return (
    <AppContext.Provider value={value}>
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />
          <Route path="/*" element={
            isAuthenticated ? (
              <Layout>
                {toast && (
                  <div className={`fixed bottom-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-lg text-white font-medium z-50 animate-bounce ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-600'}`}>
                    {toast.msg}
                  </div>
                )}
                <Routes>
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/sedes" element={<Sedes />} />
                  <Route path="/casas" element={<Sedes />} />
                  <Route path="/members" element={<Members />} />
                  <Route path="/attendance" element={<AttendancePage />} />
                  <Route path="/ministries" element={<Ministries />} />
                  <Route path="/intercesion" element={<Intercesion />} />
                  <Route path="/finances" element={<Finances />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/epmi" element={<Epmi />} />
                  <Route path="/viajes" element={<Viajes />} />
                  <Route path="/plan" element={<PlanAnual />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/resources" element={<Resources />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="*" element={<Navigate to={currentUser.role === 'MIEMBRO' ? "/profile" : "/"} replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } />
        </Routes>
      </Router>
    </AppContext.Provider>
  );
};

export default App;