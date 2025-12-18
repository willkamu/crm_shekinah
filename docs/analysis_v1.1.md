# Análisis de Brechas: Versión 1.0 vs Versión 1.1

Este documento detalla las diferencias encontradas entre la implementación actual (v1.0) y la especificación técnica v1.1.

## 1. Roles y Permisos (RBAC)
**Estado Actual (`types.ts`):**
- Roles existentes: `PASTOR_PRINCIPAL`, `PASTOR_EJECUTIVO`, `MINISTRO`, `LIDER_ANEXO`, `LIDER_INTERCESION`, `MAESTRO_CASA`, `SECRETARIA_CASA`, `SECRETARIA_ANEXO`, `MIEMBRO`.
- Lógica de permisos implementada parcialmente en frontend.

**Requerimientos v1.1:**
- **Nuevos Roles:**
    - `PASTOR_GENERAL` (Posible renombre de `PASTOR_PRINCIPAL`).
    - `PASTORA_GENERAL` (Mismos permisos que Pastor General).
    - `SECRETARIA_PASTORAL` (Rol administrativo de alto nivel, ve finanzas globales e inventarios, pero no notas pastorales sensibles).
- **Acciones Específicas:**
    - `manage_central_tithes` (Secretaria Pastoral).
    - `import_tithe_status_batch` (Carga masiva fidelidad).
    - `view_restricted_members` (Ver restringidos sin motivo detallado).

**Acción Requerida:**
- Actualizar `UserRole` en `types.ts`.
- Actualizar lógica de `currentUser` en `App.tsx` para soportar nuevos roles.

---

## 2. Módulo de Miembros (Datos Pastorales)
**Estado Actual:**
- Campos básicos (`attendance_level`, `fidelity_level` como semáforo).
- Faltan estados pastorales complejos.

**Requerimientos v1.1:**
- **Fidelidad:** Campo `fidelidad_estado` (ENUM: FIDEL, INTERMITENTE, BAJA, NINGUNA, SIN_INFO). *Diferente al semáforo calculado actual.*
- **Graduación EPMI:**
    - `graduacion_estado` (CANDIDATO, GRADUADO, GRADUACION_RETENIDA).
    - `graduacion_motivo` (Texto, solo visible Pastor).
    - `graduacion_revisar_en` (Fecha).
- **Admisión / Disciplina:**
    - `admision_estado` (NORMAL, RESTRINGIDO).
    - `admision_motivo`.
    - `admision_fecha`.

**Acción Requerida:**
- Modificar interfaz `Member` en `types.ts`.
- Actualizar `Members.tsx` para mostrar/ocultar estos campos según rol.
- Crear componente/vista para "Carga Masiva de Fidelidad".

---

## 3. Finanzas (Diezmos de Anexo)
**Estado Actual:**
- `FinanceTransaction` genérico.
- `MonthlyReport` básico.

**Requerimientos v1.1:**
- **Nueva Entidad `DiezmoAnexo`:**
    - Registro de recepción física de dinero en anexos.
    - Estados: `PENDIENTE_ENTREGA` -> `ENTREGADO_CENTRAL`.
    - Evidencia (foto).
- **Reporte Mensual Extendido:**
    - `ingresos_total`, `egresos_total`, `saldo_calculado`.
    - `nota_tesorero`.

**Acción Requerida:**
- Crear interfaz `DiezmoAnexo` en `types.ts`.
- Actualizar `MonthlyReport` o crear `AnexoFinancialReport`.
- Modificar `Finances.tsx` para incluír la pestaña de "Diezmos Recibidos" y "Reunión Mensual".

---

## 4. Nuevo Módulo: Inventario
**Estado Actual:**
- No existe.

**Requerimientos v1.1:**
- **Entidad `InventoryItem`:**
    - `scope_tipo` (ANEXO, CASA).
    - `scope_id`.
    - `nombre`, `cantidad`, `estado` (NUEVO, BUENO, REGULAR, DETERIORADO).
    - `responsable_id`.
- **Funcionalidad:**
    - CRUD de bienes por Anexo/Casa.
    - Transferencia de responsabilidad.

**Acción Requerida:**
- Definir tipos en `types.ts`.
- Crear componente `Inventory.tsx`.
- Añadir ruta en `App.tsx`.

---

## 5. Otros Ajustes
- **Panel Pastoral 360:** Dashboard unificado que integre KPIs de todos los módulos anteriores.
- **Auditoría:** Expandir `auditLogs` para cubrir cambios en estos nuevos campos sensibles.

## Plan de Implementación Sugerido
1.  **Tipos:** Actualizar `types.ts` con todas las nuevas interfaces.
2.  **Contexto:** Actualizar `App.tsx` con los nuevos estados (`inventory`, `anexoTithes`, etc.) y sus funciones CRUD.
3.  **Componentes Nuevos:**
    - `Inventory.tsx`
    - `PastoralDashboard.tsx` (Panel 360)
4.  **Actualización de Componentes:**
    - `Members.tsx` (Campos pastorales).
    - `Finances.tsx` (Módulo de diezmos y reportes).
