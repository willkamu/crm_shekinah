
import { Anexo, Member, SpiritualStatus, Event, EventType, Course, Ministry, TeachingHouse, FinanceTransaction, IntercesionGroup, EpmiEnrollment, IntercesionLog, MissionTrip, HistoryRecord, Notification, MonthlyReport } from '../types';

export const MOCK_ANEXOS: Anexo[] = [
  { id: 'ANX-01', nombre: 'Sede Central', tipo: 'LIMA', ubicacion: 'Av. Principal 100', liderId: 'MEM-001', liderNombre: 'Pastor Principal', telefono: '999-999-999', horario: 'Dom 10am, Mie 7pm' },
  { id: 'ANX-02', nombre: 'Piedra Liza', tipo: 'LIMA', ubicacion: 'Zona Norte', liderId: 'MEM-003', liderNombre: 'Hno. Roberto', telefono: '888-888-888', horario: 'Sab 7pm' },
  { id: 'ANX-03', nombre: 'Huancayo', tipo: 'PROVINCIA', ubicacion: 'Sierra Central', liderId: 'MEM-004', liderNombre: 'Hna. Maria', telefono: '777-777-777', horario: 'Dom 4pm' },
  { id: 'ANX-04', nombre: 'Chile', tipo: 'INTERNACIONAL', ubicacion: 'Santiago', liderId: 'MEM-005', liderNombre: 'Pastor Carlos', telefono: '666-666-666', horario: 'Dom 11am' },
];

export const MOCK_TEACHING_HOUSES: TeachingHouse[] = [
  { id: 'H-01', nombre: 'Casa Vida', anexoId: 'ANX-01', maestroId: 'MEM-006', maestroNombre: 'Hna. Rosa', direccion: 'Calle 1, Urb. Luz', diaReunion: 'Jue 7pm', active: true },
  { id: 'H-02', nombre: 'Casa Esperanza', anexoId: 'ANX-01', maestroId: 'MEM-007', maestroNombre: 'Fam. Ruiz', direccion: 'Calle 5, Urb. Paz', diaReunion: 'Mar 8pm', active: true },
  { id: 'H-03', nombre: 'Casa Norte', anexoId: 'ANX-02', maestroId: 'MEM-008', maestroNombre: 'Fam. Gomez', direccion: 'Av. Norte 123', diaReunion: 'Vie 7pm', active: true },
];

export const MOCK_MINISTRIES: Ministry[] = [
  { id: 'MIN-01', nombre: 'Alabanza', tipo: 'GENERAL', liderId: 'MEM-002', grupos: [] },
  { id: 'MIN-02', nombre: 'Evangelismo', tipo: 'GENERAL', liderId: 'MEM-009', grupos: [] },
  { id: 'MIN-03', nombre: 'Ujieres', tipo: 'GENERAL', liderId: 'MEM-010', grupos: [] },
  { id: 'MIN-04', nombre: 'Intercesión', tipo: 'INTERCESION', liderId: 'MEM-011', grupos: [] }, // Parent Ministry
];

// PDF Part 8.6: 5 Grupos de Intercesión
export const MOCK_INTERCESION_GROUPS: IntercesionGroup[] = [
  { id: 'GRP-1', nombre: 'Grupo 1 - Valientes', liderId: 'MEM-012' },
  { id: 'GRP-2', nombre: 'Grupo 2 - Guerreros', liderId: 'MEM-013' },
  { id: 'GRP-3', nombre: 'Grupo 3 - Atalaya', liderId: 'MEM-014' },
  { id: 'GRP-4', nombre: 'Grupo 4 - Brecha', liderId: 'MEM-015' },
  { id: 'GRP-5', nombre: 'Grupo 5 - Muros', liderId: 'MEM-016' },
];

export const MOCK_INTERCESION_LOGS: IntercesionLog[] = []; 

// PDF Part 18.1.5: Cursos Básicos Específicos
export const MOCK_COURSES: Course[] = [
  { id: 'CRS-01', nombre: '1. Creciendo en Gracia', type: 'BASICO', orden: 1, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'CRS-02', nombre: '2. Sana Doctrina', type: 'BASICO', orden: 2, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'CRS-03', nombre: '3. Verdadera Alabanza', type: 'BASICO', orden: 3, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'CRS-04', nombre: '4. Evangelismo', type: 'BASICO', orden: 4, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'CRS-05', nombre: '5. Conservación de Resultados', type: 'BASICO', orden: 5, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'CRS-06', nombre: '6. Apologética', type: 'BASICO', orden: 6, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'CRS-07', nombre: '7. Mayordomía', type: 'BASICO', orden: 7, materials: [], enrolledStudentIds: [], requests: [] }, 
  
  // EPMI Specific
  { id: 'EPMI-101', nombre: 'Doctrina Básica', type: 'EPMI_I', orden: 1, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'EPMI-102', nombre: 'Vida Espiritual', type: 'EPMI_I', orden: 2, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'EPMI-103', nombre: 'Carácter Cristiano', type: 'EPMI_I', orden: 3, materials: [], enrolledStudentIds: [], requests: [] },
  
  { id: 'EPMI-201', nombre: 'Homilética', type: 'EPMI_II', orden: 1, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'EPMI-202', nombre: 'Liderazgo', type: 'EPMI_II', orden: 2, materials: [], enrolledStudentIds: [], requests: [] },

  // PDF 5.9 Escuelas
  { id: 'ESC-01', nombre: 'Guerra Espiritual Avanzada', type: 'ESCUELA', categoria: 'Escuela de Intercesión', orden: 1, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'ESC-02', nombre: 'Servicio y Protocolo', type: 'ESCUELA', categoria: 'Escuela de Diáconos', orden: 1, materials: [], enrolledStudentIds: [], requests: [] },
  { id: 'ESC-03', nombre: 'Teoría Musical', type: 'ESCUELA', categoria: 'Escuela de Música', orden: 1, materials: [], enrolledStudentIds: [], requests: [] },
];

export const MOCK_MEMBERS: Member[] = [
  {
    id: 'MEM-001',
    nombres: 'Pastor Principal',
    telefono: '+51 999 999 999',
    sex: 'F', // Just for demo variety, can change
    direccion: 'Residencia Pastoral',
    estatus: SpiritualStatus.STABLE,
    cargo: 'Pastor Cobertura',
    attendance_level: 'VERDE',
    fidelity_level: 'VERDE',
    service_level: 'VERDE',
    candidate_epmi: false, 
    completed_basicos: true,
    coursesCompletedIds: ['CRS-01', 'CRS-02', 'CRS-03', 'CRS-04', 'CRS-05', 'CRS-06', 'CRS-07', 'CRS-E1', 'CRS-E2'],
    ministryIds: [],
    anexoId: 'ANX-01',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pastor',
    habilidades: ['Predicación', 'Consejería', 'Liderazgo']
  },
  {
    id: 'MEM-002',
    nombres: 'Maria Gonzalez', 
    telefono: '+51 988 888 888',
    sex: 'F',
    estatus: SpiritualStatus.ACTIVE_MINISTRY,
    cargo: 'Ministro', // CHANGED FROM MINISTRA (NEUTRAL)
    attendance_level: 'VERDE',
    fidelity_level: 'VERDE',
    service_level: 'VERDE',
    candidate_epmi: true, 
    completed_basicos: true,
    coursesCompletedIds: ['CRS-01', 'CRS-02', 'CRS-03', 'CRS-04', 'CRS-05', 'CRS-06', 'CRS-07'],
    ministryIds: ['MIN-01'],
    ministryRoles: { 'MIN-01': 'Directora de Alabanza' },
    anexoId: 'ANX-01',
    teachingHouseId: 'H-01',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
    habilidades: ['Canto', 'Piano', 'Diseño Gráfico']
  },
  {
    id: 'MEM-003',
    nombres: 'Hno. Roberto', 
    telefono: '999-111-222',
    sex: 'M',
    estatus: SpiritualStatus.STABLE,
    cargo: 'Líder',
    attendance_level: 'VERDE',
    fidelity_level: 'AMARILLO',
    service_level: 'VERDE',
    candidate_epmi: false,
    completed_basicos: true,
    coursesCompletedIds: ['CRS-01', 'CRS-02', 'CRS-03'],
    ministryIds: [],
    anexoId: 'ANX-02',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto',
    habilidades: ['Logística', 'Conducción']
  },
  {
    id: 'MEM-INT-1',
    nombres: 'Intercesor Fiel',
    telefono: '999-000-111',
    sex: 'M',
    estatus: SpiritualStatus.ACTIVE_MINISTRY,
    cargo: 'Diácono',
    attendance_level: 'VERDE',
    fidelity_level: 'VERDE',
    service_level: 'VERDE',
    candidate_epmi: false,
    completed_basicos: true,
    coursesCompletedIds: ['CRS-01', 'CRS-02'],
    ministryIds: ['MIN-04'],
    intercesionGroupId: 'GRP-1', 
    anexoId: 'ANX-01',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Prayer'
  },
  {
    id: 'MEM-NEW',
    nombres: 'Nuevo Creyente',
    telefono: '000-000-000',
    sex: 'M',
    estatus: SpiritualStatus.NEW,
    cargo: 'Miembro',
    attendance_level: 'AMARILLO', 
    fidelity_level: 'ROJO', 
    service_level: 'ROJO', 
    candidate_epmi: false,
    completed_basicos: false,
    coursesCompletedIds: ['CRS-01'],
    ministryIds: [],
    anexoId: 'ANX-01',
    teachingHouseId: 'H-01',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=New'
  },
  {
    id: 'MEM-EPMI-1',
    nombres: 'Estudiante EPMI I',
    telefono: '123-456-789',
    sex: 'F',
    estatus: SpiritualStatus.STABLE,
    cargo: 'Obrera',
    attendance_level: 'VERDE',
    fidelity_level: 'VERDE',
    service_level: 'AMARILLO',
    candidate_epmi: false,
    completed_basicos: true,
    coursesCompletedIds: ['CRS-01', 'CRS-02', 'CRS-03', 'CRS-04', 'CRS-05', 'CRS-06', 'CRS-07'],
    ministryIds: [],
    anexoId: 'ANX-01',
    photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Student1'
  }
];

export const MOCK_EPMI_ENROLLMENTS: EpmiEnrollment[] = [
  {
    id: 'ENR-01',
    memberId: 'MEM-EPMI-1',
    cycle: 'CICLO_I',
    status: 'ACTIVO',
    startDate: '2023-01-15',
    grades: { 'EPMI-101': 18, 'EPMI-102': 16 },
    attendance: 95
  }
];

export const MOCK_EVENTS: Event[] = [
  { id: 'EVT-001', nombre: 'Culto Dominical', tipo: EventType.SERVICE, fecha: '2023-11-05', anexoId: 'ANX-01', planAnualFlag: true, estado: 'APROBADO' },
  { id: 'EVT-002', nombre: 'Vigilia Unida', tipo: EventType.VIGILIA, fecha: '2023-12-01', anexoId: 'ANX-01', planAnualFlag: true, estado: 'APROBADO' },
];

export const MOCK_FINANCES: FinanceTransaction[] = [
  { id: 'TX-01', fecha: '2023-11-01', tipo: 'Diezmo', monto: 100, anexoId: 'ANX-01', miembroId: 'MEM-002', detalle: 'Mes Noviembre' },
];

export const MOCK_MONTHLY_REPORTS: MonthlyReport[] = [
  {
    id: 'REP-01',
    anexoId: 'ANX-02', // Piedra Liza
    month: 10,
    year: 2023,
    totalOfrendas: 1200,
    totalDiezmos: 2500,
    totalHonras: 300,
    totalGeneral: 4000,
    status: 'RECIBIDO',
    fechaEnvio: '2023-11-01'
  }
];

export const MOCK_TRIPS: MissionTrip[] = [
  {
    id: 'TRIP-01',
    destino: 'Uchus - Ancash',
    fechaSalida: '2024-03-15',
    fechaRetorno: '2024-03-17',
    status: 'EN_REVISION',
    responsableId: 'MEM-002',
    participants: [
      { memberId: 'MEM-INT-1', role: 'INTERCESOR', status: 'PROPUESTO' }
    ]
  }
];

export const MOCK_HISTORY: HistoryRecord[] = [
  { id: 'HIST-1', fecha: '2023-10-01', tipo: 'NOTA', titulo: 'Consejería Inicial', detalle: 'Se reunió con el Pastor. Compromiso de asistencia.', autorId: 'MEM-001' }
];

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'NOT-1', type: 'ALERT', title: 'Viaje Pendiente', message: 'Uchus - Ancash requiere aprobación final de lista.', date: 'Hace 2h', read: false, linkTo: '/viajes' },
  { id: 'NOT-2', type: 'INFO', title: 'Reporte Financiero', message: 'El anexo Piedra Liza subió su reporte mensual.', date: 'Hace 5h', read: false, linkTo: '/finances' },
  { id: 'NOT-3', type: 'SUCCESS', title: 'Nuevo Candidato', message: 'Maria Gonzalez cumple requisitos para EPMI.', date: 'Ayer', read: true, linkTo: '/epmi' }
];
