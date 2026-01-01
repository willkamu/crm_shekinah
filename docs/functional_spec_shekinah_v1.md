# ESPECIFICACIÓN FUNCIONAL FINAL
## Sistema ChMS – Iglesia Visión Misionera Mundial “La Shekinah”
**Versión:** 1.0  
**Fecha:** Enero 2026

---

## ÍNDICE GENERAL

0. [Información General del Sistema](#0-información-general-del-sistema)
1. [Actores y Roles del Sistema](#1-actores-y-roles-del-sistema)
2. [Modelo Conceptual de Datos](#2-modelo-conceptual-de-datos-alto-nivel)
3. [Módulo Miembros – Ficha 360°](#3-módulo-miembros--ficha-360)
4. [Módulo Anexos y Casas de Enseñanza](#4-módulo-anexos-y-casas-de-enseñanza)
5. [Módulo Ministerios y Grupos de Intercesión](#5-módulo-ministerios-y-grupos-de-intercesión)
6. [Módulo Discipulado Básico (7 Cursos)](#6-módulo-discipulado-básico-7-cursos)
7. [Módulo EPMI – Escuela de Preparación Ministerial](#7-módulo-epmi--escuela-de-preparación-ministerial)
8. [Módulo Escuelas Centrales y Cursos Adicionales](#8-módulo-escuelas-centrales-y-cursos-adicionales)
9. [Módulo Eventos y Plan Anual](#9-módulo-eventos-y-plan-anual)
10. [Módulo Viajes Misioneros](#10-módulo-viajes-misioneros)
11. [Módulo Reunión de Líderes y Tesorería Mensual](#11-módulo-reunión-de-líderes-y-tesorería-mensual)
12. [Módulo Finanzas Pastoral](#12-módulo-finanzas-pastoral-vista-del-pastor-principal)
13. [Módulo Inscripción y Gestión de Eventos Especiales](#13-módulo-inscripción-y-gestión-de-eventos-especiales)
14. [Notificaciones y WhatsApp](#14-notificaciones-y-whatsapp)
15. [Seguridad, Permisos y Trazabilidad](#15-seguridad-permisos-y-trazabilidad)
16. [Requerimientos No Funcionales](#16-requerimientos-no-funcionales)

---

## 0. INFORMACIÓN GENERAL DEL SISTEMA

### 0.1. Nombre del sistema
**ChMS SHEKINAH** (Sistema de Gestión de Iglesia para la Iglesia Visión Misionera Mundial “La Shekinah”).

### 0.2. Contexto
La Iglesia Visión Misionera Mundial “La Shekinah” opera bajo un modelo teocrático con una estructura jerárquica definida:
*   **Pastor Cobertura / Principal:** Autoridad máxima.
*   **Alcance:** Nacional (Lima y Provincias) e Internacional (Chile, España, Suiza).
*   **Estructura:** Anexos, Casas de Enseñanza, Grupos de Intercesión (5 grupos + Gambeta).
*   **Formación:** Escuela EPMI (Ciclo I y II), Cursos Básicos, Escuelas Centrales.
*   **Actividades:** Plan Anual rígido con fiestas principales (Pentecostés, Tabernáculos) y viajes misioneros frecuentes.

### 0.3. Objetivo General
Centralizar la gestión pastoral, administrativa y formativa en una plataforma única, **Mobile-First y PWA**, que permita al Pastor Principal supervisar el estado espiritual y administrativo de la obra en tiempo real, facilitando la toma de decisiones y el orden teocrático.

### 0.4. Alcance Funcional
*   **Incluye:** Gestión 360° de miembros, administración total de anexos, control de ministerios e intercesión, gestión académica completa (EPMI/Cursos), administración del Plan Anual y Viajes Misioneros, y una visión pastoral de las finanzas (no contable fiscal).
*   **Integración:** WhatsApp como canal principal de comunicación.

### 0.5. Principios de Diseño
1.  **Teocrático:** Respeta la autoridad delegada.
2.  **Pastoral:** Métricas enfocadas en la salud espiritual (asistencia, servicio, fidelidad), no solo números fríos.
3.  **No-Tech First:** Interfaz extremadamente simple, botones grandes, flujos lineales para usuarios con baja alfabetización digital.

---

## 1. ACTORES Y ROLES DEL SISTEMA

### 1.1. Pastor Cobertura / Pastor Principal
*   **Permisos:** Acceso Total (Superadmin Pastoral).
*   **Funciones:** Aprobación final de Plan Anual y Viajes, supervisión global, acceso a datos sensibles (disciplina, finanzas detalladas), definición de candidatos EPMI.

### 1.2. Ministro Ordenado / Equipo de Trabajo (3 Ministros)
*   **Permisos:** Supervisión Regional / Temática.
*   **Funciones:** Monitoreo de anexos asignados, recomendación de líderes, validación doctrinal.

### 1.3. Ministros / Evangelistas / Siervos / Obreros
*   **Permisos:** Gestión de sus áreas específicas.
*   **Funciones:** Liderar grupos de intercesión, dirigir evangelismo, ejecutar tareas operativas.

### 1.4. Líderes de Anexo
*   **Permisos:** Admin Local (su anexo).
*   **Funciones:** Gestión de miembros, registro de asistencia y ofrendas (ingresos/gastos), supervisión de casas de enseñanza locales.

### 1.5. Líderes de Ministerios (Intercesión, Alabanza, etc.)
*   **Permisos:** Gestión de su ministerio.
*   **Funciones:** Control de asistencia a ensayos/reuniones, gestión de turnos.

### 1.6. Secretarios / Tesoreros
*   **Permisos:** Operativo (Registro).
*   **Funciones:** Toma de asistencia, carga de reportes de tesorería, actualización de datos básicos.

### 1.7. Miembros
*   **Permisos:** Vista Personal.
*   **Funciones:** Ver su ficha, consultar cursos, inscribirse a eventos, ver historial personal.

---

## 2. MODELO CONCEPTUAL DE DATOS (Alto Nivel)

El sistema se basa en relaciones claras y jerárquicas:
*   **Miembro:** Entidad central. Tiene un Anexo, puede tener una Casa de Enseñanza, múltiples Ministerios, y un Historial de Formación.
*   **Anexo:** Agrupa Miembros y Casas de Enseñanza. Genera Reportes Financieros y de Asistencia.
*   **Evento:** Puede ser Culto (Recurrente), Clase (Académico), Viaje (Misionero) o Especial (Plan Anual).
*   **Asistencia:** Vincula Miembro + Evento. Es múltiple (puede asistir a Culto Y a Clase el mismo día).
*   **Transacción Financiera (Pastoral):** Vincula Miembro (Diezmo/Ofrenda) o Anexo (Reporte Mensual) con un concepto y fecha.

---

## 3. MÓDULO MIEMBROS – FICHA 360°

### 3.1. Alta y Registro
*   Campos obligatorios: Nombres, Apellidos, DNI, Sexo, Fecha Nacimiento, Teléfono, Anexo, Dirección, Estado Civil.
*   Campos de conversión: Fecha de conversión, Fecha de bautismo, ¿Bautizado en Espíritu Santo?

### 3.2. Estructura de la Ficha 360°
La ficha es el "Hoja de Vida Espiritual" del miembro.

#### 3.3. Pestaña "Datos"
*   Información personal, foto, familia (cónyuge/hijos).
*   **Estatus Eclesiástico:** Aspirante, Miembro, Obrero, Diácono, Siervo, Evangelista, Ministro.
*   **Cobertura:** Quién es su líder directo.

#### 3.4. Pestaña "Formación"
*   **Cursos Básicos (7):** Checklist visual (No iniciado / En curso / Completado).
*   **EPMI:** Estado del Ciclo I y II.
*   **Escuelas Centrales:** Historial de cursos adicionales (Intercesión, Diáconos, etc.).

#### 3.5. Pestaña "Historial"
*   Línea de tiempo inmutable.
*   Registros: Notas pastorales, cambios de estatus (disciplina/restauración), hitos ministeriales (nombramientos).

#### 3.6. Pestaña "Asistencia"
*   Gráfico de fidelidad (últimos 6 meses).
*   Desglose: Asistencia a Anexo vs. Asistencia a Central vs. Asistencia a Formación.

#### 3.7. Pestaña "Finanzas y Participación" (Nueva)
*   **Visión Pastoral:**
    *   Diezmos: Frecuencia (Regular/Irregular) y Último aporte (Fecha).
    *   Ofrendas y Honras: Participación en honras especiales (Pastor/Pastora).
*   **Participación:** Historial de eventos asistidos (Vigilias, Ayunos, Viajes).

#### 3.8. Pestaña "Habilidades y Ministerio"
*   **Espirituales:** Canta, Instrumento (cuál), Predica, Intercede.
*   **Profesionales:** Oficio/Profesión (Ingeniero, Albañil, Médico, etc.).
*   **Servicio:** Cocina, Limpieza, Chofer, Logística.

#### 3.9. Reglas de Negocio
*   **Candidato EPMI Automático:** Se activa si: 7 Cursos Básicos completados + Asistencia > 80% + Fidelidad Financiera Regular + Sin Disciplina.

---

## 4. MÓDULO ANEXOS Y CASAS DE ENSEÑANZA

### 4.1. Estructura de Anexo
*   **Tipos:** Lima, Provincia, Lima Provincia, Internacional.
*   **Equipo Liderazgo (Fijo):** Líder, Esposa, Coordinador, Secretario, Tesorero.

### 4.2. Casas de Enseñanza
*   Unidades menores dentro de un anexo para discipulado/formación.
*   **Datos:** Maestro responsable, día de reunión, curso que se está impartiendo.

### 4.3. Reportes por Anexo (Para Pastor Principal)
*   **Semáforo de Salud:** Basado en Asistencia + Finanzas + Crecimiento.
*   **Consolidado Mensual:** Total ofrendas, total asistentes, total nuevos.

---

## 5. MÓDULO MINISTERIOS Y GRUPOS DE INTERCESIÓN

### 5.1. Definición
*   Ministerios transversales: Intercesión, Alabanza, Evangelismo, Jóvenes, EBNA, Agentes Pastorales (Penales), Hospitales.

### 5.2. Grupos de Intercesión (Estructura Clave)
*   **5 Grupos + Gambeta.**
*   Cada grupo tiene un Ministro Líder y Secretario.
*   **Deberes:** Ayuno mensual de 3 días + Servicio de miércoles (ayuno y ministración).

### 5.3. Asistencia de Intercesión
*   **Miércoles:** Lista semanal obligatoria.
*   **Ayuno Fin de Mes:** Lista de 3 días consecutivos.
*   **Impacto:** Es el criterio principal para asignar grupos a Viajes Misioneros.

---

## 6. MÓDULO DISCIPULADO BÁSICO (7 CURSOS)

### 6.1. Los 7 Cursos Obligatorios
1. Creciendo en gracia & Visión Misionera
2. Sana Doctrina
3. La verdadera Alabanza
4. Intercesión
5. Evangelismo
6. Conservación de Resultados
7. Apologética Bíblica

---

## 7. MÓDULO EPMI – Escuela de Preparación Ministerial

### 7.1. Estructura Académica
*   **Ciclo I (6 Cursos):** Gobierno e Identidad, Identidad del Siervo, Ética, Holimétrica, Pneumatología, Fundamentos Salvación.
*   **Ciclo II (6 Cursos):** Panorama AT, La Unción, Liderazgo, Misiones, Apologética II, Panorama NT.
*   **Año de Servicio:** Periodo práctico post-estudios.

### 7.2. Módulo de Vida de Iglesia (Asistencia y Fidelidad)
Este módulo es transversal y alimenta el "Semáforo Espiritual" del miembro.
*   **Regla de Oro (Sedes vs. Anexos):** La asistencia NO es genérica. Debe respetar el calendario litúrgico de cada lugar.
    *   **Sede Central:** Miércoles (Ayuno/Enseñanza) y Domingo (Culto Principal).
    *   **Anexos:** Lunes (Oración), Martes/Jueves (Enseñanza), Sábados (Jóvenes).
    *   **Validación:** El sistema bloqueará la toma de asistencia de un "Culto de Jóvenes" en un día martes si el anexo no lo tiene configurado así.
*   **Casas de Enseñanza:** Cada casa tiene su propio día de reunión (ej. Viernes 7pm). El líder solo puede marcar asistencia en ese día/hora (+/- rango de tolerancia).
*   **KPI "Vida de Iglesia":** Se calcula mensualmente: `(Asistencias Reales / Cultos Programados en su Sede) * 100`.
    *   Verde: > 80%
    *   Amarillo: 50-79%
    *   Rojo: < 50% (Alerta Pastoral Automática).
*   **Estados de Asistencia:**
    1.  **Presente:** (Verde) Suma al % de Vida de Iglesia.
    2.  **Falta:** (Rojo) Resta al %.
    3.  **Permiso:** (Amarillo/Azul) Falta justificada. No suma ni resta (neutro), pero queda registrada la razón.
*   **Bitácora de Asistencia:** Cada registro de miembro en un evento debe tener un campo de texto para **Observaciones/Comentarios** (ej. "Llegó tarde por trabajo", "Enfermo", "Sin Biblia").

### 7.3. Gestión
*   Registro de notas y asistencia por curso.
*   **Estados:** Aspirante -> Estudiante -> Egresado -> En Servicio -> Graduado/Ministro.

---

## 8. MÓDULO ESCUELAS CENTRALES Y CURSOS ADICIONALES
*   Escuelas de especialización: Intercesión, Diáconos, Ujieres, Misiones.
*   Cursos de Anexo: Cultura Celestial, Sanidad del Alma, Autoridad Delegada, Navidad, Bautismo.

---

## 9. MÓDULO EVENTOS Y PLAN ANUAL 2025

### 9.1. El Plan Anual
*   Documento vivo gestionado por el Pastor Principal.
*   **Ciclo:** Solicitud de Líderes (Ene) -> Revisión -> Aprobación -> Ejecución/Ajustes.

### 9.2. Eventos Críticos
*   **Fiestas Principales:** Pentecostés y Tabernáculos (Sede: Lima o Ancash, definida por Pastor).
*   **Ayunos y Vigilias:** Calendario fijo.

---

## 10. MÓDULO VIAJES MISIONEROS

### 10.1. Estructura del Viaje
*   **Asignación:** Se asigna un "Grupo de Intercesión Base" (1-5).
*   **Refuerzos:** Se añaden equipos de Alabanza, Evangelismo y Obreros.
*   **Invitados:** El Pastor Principal puede agregar invitados especiales manualmente.

### 10.2. Flujo
*   Programación (Plan Anual) -> Confirmación de Grupo Base -> Aprobación de Lista Final (Pastor) -> Ejecución -> Reporte.

---

## 11. MÓDULO REUNIÓN DE LÍDERES Y TESORERÍA

### 11.1. Reunión Mensual
*   Evento administrativo obligatorio.
*   **Procesos:**
    1. Toma de asistencia de líderes (Indicador de fidelidad).
    2. Recepción de sobres de tesorería por anexo.
    3. Informe pastoral.

### 11.2. Reporte de Tesorería Anexo
*   Digitalización del reporte de ingresos (ofrendas/diezmos) y gastos (servicios/movilidad).
*   **Entrega:** Registro de monto físico entregado a Tesorería Central.

---

## 12. MÓDULO FINANZAS PASTORAL (Vista Pastor Principal)
*   **No Contable:** Enfocado en la salud financiera de la obra y fidelidad.
*   **Consolidados:** Por Anexo, Por Mes, Por Tipo de Ingreso (Diezmo vs Ofrenda vs Misiones).
*   **Reporte de Honras:** Monitoreo específico de honras al Pastor y Pastora.

---

## 13. MÓDULO EVENTOS ESPECIALES CON EXPEDIENTE
**Objetivo:** Gestión de eventos sensibles (Matrimonios, Bautismos, Conferencias) que requieren validación documental estricta.
*   **Concepto:** Evento con Expediente Obligatorio.
*   **Componentes:**
    1.  **Checklist Obligatorio:** Lista de requisitos (Acta Civil, Formato Interno, Firma Líder).
    2.  **Repositorio de Adjuntos:** Carga de documentos (PDF/IMG).
    3.  **Estado del Expediente:** PENDIENTE / OBSERVADO / APROBADO / CERRADO.
*   **Regla de Oro:** Un evento de este tipo NO puede ejecutarse si el expediente no está **APROBADO** por el Pastor.

---

## 14. MÓDULO DISCIPLINA Y PROTECCIÓN PASTORAL
**Objetivo:** Memoria institucional y protección ante riesgos.
*   **Estados de Miembro:** Normal, Observado, Restringido, Graduación Retenida.
*   **Funcionalidad:**
    *   **Bloqueo por DNI:** Impide re-registro de personas disciplinadas.
    *   **Alertas Públicas:** Líderes ven "⚠️ Consultar con Supervisor" (sin detalles).
    *   **Detalle Privado:** Solo Pastor Principal ve la causa real y notas sensibles.
*   **Integración:** Bloquea automáticamente inscripción a viajes, EPMI y ascenso de cargos.

---

## 15. HISTORIAL DE CARGOS MINISTERIALES
**Objetivo:** Registro sobrio y factual de la trayectoria de autoridad.
*   **Datos:** Cargo (Obrero, Diácono, Ministro), Fecha Inicio, Fecha Fin, Estado (Activo/Cesado/Degradado).
*   **Visibilidad:** Historial limpio, sin juicios personales ni detalles emocionales. Solo hechos trazables.

---

## 16. REPOSITORIO DE REGLAMENTOS
**Objetivo:** Biblioteca digital de normas vigentes.
*   **Contenido:** PDFs de Reglamentos de Matrimonio, Bautismo, Funciones de Líder, etc.
*   **Uso:** Solo consulta. El sistema NO valida reglas internas (vestimenta, etc.), solo muestra el documento oficial vigente.

---

## 17. NOTIFICACIONES Y WHATSAPP
*   Integración nativa para avisos urgentes y recordatorios.

---

## 18. SEGURIDAD Y PERMISOS
*   **RBAC Estricto:** Jerarquía eclesiástica.
*   **Audit Log:** Trazabilidad total de cambios sensibles.

---

## 19. REQUERIMIENTOS NO FUNCIONALES
*   **Offline-First & PWA:** Operatividad sin internet.

---
**Fin del Documento de Especificación.**
