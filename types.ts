
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

// Spiritual Status (Health) - PDF Part 18.3
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

// Ecclesiastical Roles (Ranks/Titles) - Updated based on User Feedback
export type EcclesiasticalRole =
  | 'Pastor Cobertura' // Replaces Pastor Principal
  | 'Pastor'
  | 'Pastora' // Gender variant
  | 'Ministro' // Neutral/Male (No Ministra)
  | 'Ministro Ordenado'
  | 'Anciano'
  | 'Diácono'
  | 'Diaconisa' // Gender variant
  | 'Obrero'
  | 'Obrera' // Gender variant
  | 'Líder'
  | 'Evangelista'
  | 'Predicador'
  | 'Predicadora' // Gender variant
  | 'Maestro'
  | 'Maestra' // Gender variant
  | 'Siervo'
  | 'Sierva' // Gender variant
  | 'Miembro'
  | 'Visitante';

// Indicator Levels (Traffic Lights)
export type IndicatorLevel = 'VERDE' | 'AMARILLO' | 'NARANJA' | 'ROJO';

// Roles (System Access) - PDF Part 5.2
export type UserRole =
  | 'PASTOR_GENERAL' // NEW v1.1
  | 'PASTORA_GENERAL' // NEW v1.1
  | 'PASTOR_PRINCIPAL' // Deprecated in v1.1 but kept for compat
  | 'PASTOR_EJECUTIVO'
  | 'SECRETARIA_PASTORAL' // NEW v1.1
  | 'MINISTRO'
  | 'LIDER_ANEXO'
  | 'LIDER_INTERCESION'
  | 'MAESTRO_CASA'
  | 'SECRETARIA_CASA'
  | 'SECRETARIA_ANEXO'
  | 'MIEMBRO';

// System User (Login Credentials) - PDF Part 8.2
export interface SystemUser {
  id: string;
  email: string;
  password?: string; // In real app this is hashed
  role: UserRole;
  memberId?: string; // Link to Member Profile
  anexoId?: string; // Scope
  name: string; // Display Name
}

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
  schedule: { day: string; time: string; type: string }[];
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
  schedule: { day: string; time: string; type: string }[];
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

// v1.1 Inventory
export interface InventoryItem {
  id: string;
  scope_tipo: 'ANEXO' | 'CASA_ENSENANZA';
  scope_id: string; // anexoId or teachingHouseId
  nombre_bien: string;
  // v2.0 Category Field
  categoria?: 'Audio' | 'Muebles' | 'Instrumentos' | 'Cocina' | 'Otro';
  descripcion: string;
  cantidad: number;
  estado_bien: 'NUEVO' | 'BUENO' | 'REGULAR' | 'DETERIORADO' | 'MALO/DAÑADO'; // Updated status

  evidencia_url?: string;
  responsable_id: string; // Member ID
  fecha_registro: string;
  fecha_actualiza: string;
  activo: boolean;
}

export interface ClassSession {
  id: string;
  number: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
}

// Evaluation System Types
export interface EvaluationItem {
  id: string;
  name: string; // e.g., "Examen Final"
  weight: number; // e.g., 50 (percentage)
}

export interface StudentGrade {
  memberId: string;
  scores: Record<string, number>; // evaluationId -> score (0-20)
  finalGrade: number;
}

// Course Offering (Instance of a Course being taught) - PDF 7.4.2
export interface CourseOffering {
  id: string;
  courseId: string;
  courseName: string; // Denormalized
  anexoId: string; // Or 'CENTRAL'
  maestroId: string;
  maestroName: string;
  horario: string;
  fechaInicio: string;
  diaSemana: number; // 0=Sun, 1=Mon, etc.
  sesionesTotales: number;
  sesionesRealizadas: number;
  sessions: ClassSession[]; // Generated dates
  evaluations: EvaluationItem[]; // Syllabus
  studentGrades: StudentGrade[]; // Grades per student
  active: boolean;
}

// Member Special Status Enums v1.1
export enum FidelidadEstado {
  SIN_INFO = 'SIN_INFO',
  FIDEL = 'FIDEL',
  INTERMITENTE = 'INTERMITENTE',
  BAJA = 'BAJA',
  NINGUNA = 'NINGUNA'
}

export enum GraduacionEstado {
  NINGUNO = 'NINGUNO',
  CANDIDATO = 'CANDIDATO',
  GRADUADO = 'GRADUADO',
  GRADUACION_RETENIDA = 'GRADUACION_RETENIDA'
}

export enum AdmisionEstado {
  NORMAL = 'NORMAL',
  RESTRINGIDO = 'RESTRINGIDO'
}

// Members (Ficha 360 - PDF Part 5.1 & 7.2.2)
export interface Member {
  id: string;
  dni?: string; // v1.1 for Batch Upload
  nombres: string;
  telefono: string;
  email?: string;
  sex: 'M' | 'F'; // Gender for Role Logic
  direccion?: string;
  fechaNacimiento?: string;
  estadoCivil?: 'Soltero(a)' | 'Casado(a)' | 'Viudo(a)' | 'Divorciado(a)';
  profesion?: string;
  fechaBautismo?: string;
  joinedAt?: string; // Fecha de ingreso para analítica

  // Estructura
  anexoId: string;
  teachingHouseId?: string;

  // Estatus Espiritual & Cargo
  estatus: SpiritualStatus;
  cargo: EcclesiasticalRole; // Nuevo campo: Título Ministerial

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

  // v1.1 Fields
  fidelidad_estado?: FidelidadEstado;
  graduacion_estado?: GraduacionEstado;
  graduacion_motivo?: string;
  graduacion_revisar_en?: string; // ISO Date
  admision_estado?: AdmisionEstado;
  admision_motivo?: string;
  admision_fecha?: string; // ISO Date
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
  tipo: 'Diezmo' | 'Ofrenda' | 'Honra Especial' | 'Actividad' | 'Gasto';
  monto: number;
  anexoId: string;
  miembroId?: string;
  teachingHouseId?: string; // v1.1 For grouping offerings by Casa
  detalle?: string;
  eventoVinculadoId?: string;

  // v2.0 Audit & Custody Fields
  countedBy?: string;     // Lider que contó
  witnessBy?: string;     // Testigo
  custodyType?: 'DEPOSITO' | 'CUSTODIA_LIDER' | 'EFECTIVO_CUSTODIA';
  evidenceUrl?: string;   // Foto voucher / hoja entrega
  treasurerName?: string; // Quien recibió en custodia
  invoiceAmount?: number; // Monto exacto en recibo (Egresos)
  status?: 'COMPLETADO' | 'PENDIENTE_APROBACION_ANEXO' | 'APROBADO' | 'RECHAZADO';
}

// v1.1 Diezmo Anexo Management
export interface DiezmoAnexo {
  id: string;
  anexo_id: string;
  fecha: string;
  monto: number;
  estado: 'PENDIENTE_ENTREGA' | 'ENTREGADO_CENTRAL';
  evidencia_url?: string;
  observacion?: string;
  registrado_por: string; // ID
  fecha_registro: string;
  fecha_actualiza: string;
}

export interface ExpenseItem {
  id: string;
  descripcion: string;
  monto: number;
  categoria?: string; // 'Servicios', 'Alquiler', 'Materiales', 'Transporte', 'Otros'
}

// Monthly Reports (PDF Part 7.7.1)
export interface MonthlyReport {
  id: string;
  anexoId: string;
  teachingHouseId?: string; // v1.1 Distinguish between Anexo Central report and Teaching House report
  month: number;
  year: number;
  totalOfrendas: number;
  totalDiezmos: number;
  totalHonras: number;
  totalGeneral: number;

  // v1.1 Fields
  ingresos_total?: number;
  egresos_total?: number;
  detalles_egresos?: ExpenseItem[]; // v1.1 Detailed breakdown
  saldo_calculado?: number;
  nota_tesorero?: string;

  status: 'PENDIENTE' | 'ENVIADO' | 'RECIBIDO';
  evidenceUrl?: string; // Mock URL for PDF/Photo
  fechaEnvio?: string;

  // v3.4 Custody Fields
  deliveryMethod?: 'EFECTIVO' | 'DEPOSITO' | 'TRANSFERENCIA';
  receiverName?: string;
}

// Mission Trips (PDF Part 7.6)
export interface MissionTrip {
  id: string;
  destino: string;
  fechaSalida: string;
  fechaRetorno: string;
  status: 'PLANIFICACION' | 'EN_REVISION' | 'APROBADO' | 'REALIZADO';
  responsableId: string;
  assignedGroupId?: string; // LINK TO INTERCESION GROUP (PDF 7.6.1)
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
  // Auth & Users
  isAuthenticated: boolean;
  currentUser: { role: UserRole; anexoId: string | 'ALL'; name: string; memberId?: string };
  setCurrentUser: (user: { role: UserRole; anexoId: string | 'ALL'; name: string; memberId?: string }) => void;
  systemUsers: SystemUser[]; // List of all system users
  addSystemUser: (user: SystemUser) => void;
  deleteSystemUser: (id: string) => void;
  login: (emailOrRole: string, password?: string) => boolean;
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
  enrollStudentInCourse: (courseId: string, memberId: string) => void;
  unenrollStudentFromCourse: (courseId: string, memberId: string) => void;
  addCourseMaterial: (courseId: string, material: CourseMaterial) => void;
  requestCourseEnrollment: (courseId: string, memberId: string) => void;
  approveCourseEnrollment: (courseId: string, memberId: string, approved: boolean) => void;

  // Course Offerings (Active Classes)
  courseOfferings: CourseOffering[];
  openCourseOffering: (offering: CourseOffering) => void;
  updateCourseOffering: (id: string, data: Partial<CourseOffering>) => void;
  deleteCourseOffering: (id: string) => void;
  updateOfferingSession: (offeringId: string, sessionId: string, newDate: string) => void;
  registerCourseGrade: (offeringId: string, memberId: string, grade: number) => void; // Traceability

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

  // v1.1 Inventory & DiezmoAnexo
  inventoryItems: InventoryItem[];
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (id: string, data: Partial<InventoryItem>) => void;
  deleteInventoryItem: (id: string) => void;

  diezmoAnexos: DiezmoAnexo[];
  addDiezmoAnexo: (item: DiezmoAnexo) => void;
  updateDiezmoAnexo: (id: string, data: Partial<DiezmoAnexo>) => void;

  // v1.1 Batch Operations
  updateMemberBatchFidelity: (updates: { memberId: string, status: FidelidadEstado }[]) => void;
}
