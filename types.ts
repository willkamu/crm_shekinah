
// Enum for Event Types based on PDF
export enum EventType {
  SERVICE = 'Culto',
  CLASS = 'Clase/Curso',
  ACTIVITY = 'Actividad Ministerio',
  PLAN_ANUAL = 'Plan Anual',
  VIAJE = 'Viaje Misionero',
  AYUNO = 'Ayuno',
  VIGILIA = 'Vigilia',
  CASA = 'Reunión Casa'
}

// Spiritual Status (PDF Part 18.3)
export enum SpiritualStatus {
  NEW = 'Nuevo',
  IN_FORMATION = 'En Formación',
  STABLE = 'Estable',
  ACTIVE_MINISTRY = 'Activo en Ministerio',
  OBSERVATION = 'En Observación',
  RESTORATION = 'En Restauración',
  DISCIPLINE = 'En Disciplina',
  INACTIVE = 'No Activo'
}

// Indicator Levels (Traffic Lights)
export type IndicatorLevel = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';

// Roles (PDF Part 5.2)
export type UserRole = 
  | 'PASTOR_PRINCIPAL' 
  | 'MINISTRO' 
  | 'LIDER_ANEXO' 
  | 'MAESTRO_CASA' 
  | 'SECRETARIA_CASA' 
  | 'SECRETARIA_ANEXO'
  | 'MIEMBRO';

// Notifications (PDF Part 8.12)
export interface Notification {
  id: string;
  type: 'ALERT' | 'INFO' | 'SUCCESS';
  title: string;
  message: string;
  date: string;
  read: boolean;
  linkTo?: string; // Route to navigate
}

// Audit Log (PDF Part 14.7)
export interface AuditRecord {
  id: string;
  timestamp: string;
  actorName: string;
  action: string;
  target: string; // e.g., "Member: Juan Perez"
  details: string;
}

// Anexos
export interface Anexo {
  id: string;
  nombre: string;
  tipo: 'LIMA' | 'PROVINCIA' | 'INTERNACIONAL';
  ubicacion: string;
  liderId: string; // FK Member
  liderNombre: string; // Denormalized for UI
  telefono: string;
  horario: string;
}

// Casas de Enseñanza
export interface TeachingHouse {
  id: string;
  nombre: string;
  anexoId: string;
  maestroId: string;
  maestroNombre: string;
  secretariaId?: string;
  direccion: string;
  diaReunion: string;
  active: boolean;
}

// Course Material Interface
export interface CourseMaterial {
  id: string;
  title: string;
  type: 'PDF' | 'LINK' | 'VIDEO';
  url: string;
  dateAdded: string;
}

// Courses (PDF Part 18.1 - Glosario)
export interface Course {
  id: string;
  nombre: string;
  type: 'BASICO' | 'EPMI_I' | 'EPMI_II' | 'ESCUELA';
  categoria?: string; // PDF 5.9: Para agrupar "Escuela de Diáconos", "Intercesión", etc.
  orden: number;
  // UI Specific properties
  descripcion?: string;
  nivel?: number;
  tipo?: 'CENTRAL' | 'LOCAL'; 
  materials?: CourseMaterial[];
  enrolledStudentIds?: string[];
  requests?: string[]; // Pending enrollment requests (Member IDs)
}

// Members (Ficha 360 - PDF Part 5.1 & 7.2.2)
export interface Member {
  id: string;
  nombres: string;
  telefono: string;
  direccion?: string;
  fechaNacimiento?: string;
  estadoCivil?: 'Soltero(a)' | 'Casado(a)' | 'Viudo(a)' | 'Divorciado(a)';
  profesion?: string;
  fechaBautismo?: string;
  joinedAt?: string; // Fecha de ingreso para analítica
  
  // Estructura
  anexoId: string;
  teachingHouseId?: string;
  
  // Estatus Espiritual
  estatus: SpiritualStatus;
  
  // Semáforos Automáticos (Calculados)
  attendance_level: IndicatorLevel;
  fidelity_level: IndicatorLevel;
  service_level: IndicatorLevel;
  
  // Flags
  candidate_epmi: boolean;
  completed_basicos: boolean;
  
  // Data
  coursesCompletedIds: string[];
  ministryIds: string[]; // Simple ID ref
  ministryRoles?: Record<string, string>; // MinistryID -> Role Name (e.g. "Guitarrista")
  photoUrl?: string;
  habilidades?: string[]; // PDF 5.1
  
  // Intercesión (Specific Logic)
  intercesionGroupId?: string; // Grupo 1-5
}

// EPMI Specific Types (PDF Part 7.4.6 & 18.6)
export interface EpmiEnrollment {
  id: string;
  memberId: string;
  cycle: 'CICLO_I' | 'CICLO_II' | 'SERVICIO' | 'GRADUADO';
  status: 'ACTIVO' | 'OBSERVACION' | 'BAJA';
  startDate: string;
  grades: Record<string, number>; // courseId -> grade (0-20)
  attendance: number; // Percentage 0-100
  // Service Year Details
  serviceSupervisorId?: string;
  serviceLocation?: string;
  observations?: string;
}

// Events
export interface Event {
  id: string;
  fecha: string;
  tipo: EventType;
  nombre: string;
  planAnualFlag: boolean;
  anexoId: string; // 'CENTRAL' if null in DB
  estado?: 'PENDIENTE' | 'APROBADO';
}

// Ministries & Intercesión
export interface Ministry {
  id: string;
  nombre: string;
  tipo: 'GENERAL' | 'INTERCESION';
  liderId: string;
  grupos: MinistryGroup[];
}

export interface MinistryGroup {
  id: string;
  nombre: string;
  diaReunion: string;
}

export interface IntercesionGroup {
  id: string;
  nombre: string; // Grupo 1, Grupo 2...
  liderId: string;
}

// New Interface for Intercesion Tracking
export interface IntercesionLog {
  id: string;
  fecha: string;
  tipo: 'MIERCOLES' | 'AYUNO_DIA_1' | 'AYUNO_DIA_2' | 'AYUNO_DIA_3';
  memberId: string;
  present: boolean;
}

// Finances
export interface FinanceTransaction {
  id: string;
  fecha: string;
  tipo: 'Diezmo' | 'Ofrenda' | 'Honra Especial' | 'Actividad';
  monto: number;
  anexoId: string;
  miembroId?: string; 
  detalle?: string;
  eventoVinculadoId?: string;
}

// Monthly Reports (PDF Part 7.7.1)
export interface MonthlyReport {
  id: string;
  anexoId: string;
  month: number;
  year: number;
  totalOfrendas: number;
  totalDiezmos: number;
  totalHonras: number;
  totalGeneral: number;
  status: 'PENDIENTE' | 'ENVIADO' | 'RECIBIDO';
  evidenceUrl?: string; // Mock URL for PDF/Photo
  fechaEnvio?: string;
}

// Mission Trips (PDF Part 7.6)
export interface MissionTrip {
  id: string;
  destino: string;
  fechaSalida: string;
  fechaRetorno: string;
  status: 'PLANIFICACION' | 'EN_REVISION' | 'APROBADO' | 'REALIZADO';
  responsableId: string;
  participants: TripParticipant[];
}

export interface TripParticipant {
  memberId: string;
  role: 'INTERCESOR' | 'MUSICO' | 'EVANGELISTA' | 'OBRERO' | 'APOYO';
  status: 'PROPUESTO' | 'APROBADO' | 'RECHAZADO';
  attended?: boolean; // New field for execution phase
}

// History Record
export interface HistoryRecord {
  id: string;
  fecha: string;
  tipo: 'NOTA' | 'VIAJE' | 'EVENTO' | 'CAMBIO_ESTATUS';
  titulo: string;
  detalle: string;
  autorId?: string;
}

// Global Context
export interface GlobalState {
  // Auth
  isAuthenticated: boolean;
  currentUser: { role: UserRole; anexoId: string | 'ALL'; name: string; memberId?: string }; // Added memberId link
  setCurrentUser: (user: { role: UserRole; anexoId: string | 'ALL'; name: string; memberId?: string }) => void;
  login: (role: UserRole) => void;
  logout: () => void;
  
  notifications: Notification[];
  markNotificationRead: (id: string) => void;

  anexos: Anexo[];
  addAnexo: (anexo: Anexo) => void;
  updateAnexo: (id: string, data: Partial<Anexo>) => void;
  deleteAnexo: (id: string) => void;
  
  teachingHouses: TeachingHouse[];
  addTeachingHouse: (house: TeachingHouse) => void;
  updateTeachingHouse: (id: string, data: Partial<TeachingHouse>) => void;
  deleteTeachingHouse: (id: string) => void;
  
  members: Member[];
  addMember: (member: Member) => void;
  updateMember: (id: string, data: Partial<Member>) => void;
  deleteMember: (id: string) => void;
  updateMemberPhoto: (id: string, url: string) => void;
  assignMinistryRole: (memberId: string, ministryId: string, role: string) => void;
  
  events: Event[];
  addEvent: (event: Event) => void;
  updateEvent: (id: string, data: Partial<Event>) => void; 
  
  attendance: Record<string, boolean>;
  toggleAttendance: (eventId: string, memberId: string) => void;
  markAllPresent: (eventId: string, memberIds: string[]) => void;
  
  eventRegistrations: Record<string, string[]>; // eventId -> [memberIds]
  toggleEventRegistration: (eventId: string, memberId: string) => void;

  ministries: Ministry[];
  addMinistry: (min: Ministry) => void;
  updateMinistry: (id: string, data: Partial<Ministry>) => void;
  deleteMinistry: (id: string) => void;
  
  // Intercesion
  intercesionGroups: IntercesionGroup[];
  intercesionLogs: IntercesionLog[];
  logIntercesionAttendance: (date: string, type: IntercesionLog['tipo'], memberId: string, present: boolean) => void;
  assignIntercesionGroup: (memberId: string, groupId: string | null) => void;
  // CRUD Intercesion Groups
  addIntercesionGroup: (group: IntercesionGroup) => void;
  updateIntercesionGroup: (id: string, data: Partial<IntercesionGroup>) => void;
  deleteIntercesionGroup: (id: string) => void;
  
  finances: FinanceTransaction[];
  addTransaction: (t: FinanceTransaction) => void;
  
  monthlyReports: MonthlyReport[];
  addMonthlyReport: (report: MonthlyReport) => void;
  updateMonthlyReport: (id: string, data: Partial<MonthlyReport>) => void;

  courses: Course[];
  addCourse: (c: Course) => void;
  updateCourse: (id: string, data: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  enrollStudentInCourse: (courseId: string, memberId: string) => void; // New
  unenrollStudentFromCourse: (courseId: string, memberId: string) => void; // New
  addCourseMaterial: (courseId: string, material: CourseMaterial) => void; // New
  requestCourseEnrollment: (courseId: string, memberId: string) => void; // New
  approveCourseEnrollment: (courseId: string, memberId: string, approved: boolean) => void; // New

  // EPMI Logic
  epmiEnrollments: EpmiEnrollment[];
  enrollEpmiStudent: (memberId: string) => void;
  updateEpmiStudent: (id: string, data: Partial<EpmiEnrollment>) => void;
  
  // Trips
  trips: MissionTrip[];
  addTrip: (trip: MissionTrip) => void;
  updateTrip: (id: string, data: Partial<MissionTrip>) => void;
  markTripAttendance: (tripId: string, memberId: string, attended: boolean) => void;
  
  // General History
  history: HistoryRecord[];
  addHistoryNote: (memberId: string, note: string) => void;

  // Audit
  auditLogs: AuditRecord[];

  // System Automation
  runNightlyProcess: () => void;
  resetSystem: () => void;

  notify: (msg: string, type?: 'success' | 'error') => void;
  sendWhatsApp: (phone: string, message: string) => void;
}