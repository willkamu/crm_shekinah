# Changelog v1.1 Implementation

**Date**: 2024-12-16
**Status**: Completed

## 1. Role-Based Access Control (RBAC) Updates
- **New Roles Integrated**:
    - `PASTOR_GENERAL` & `PASTORA_GENERAL`: Full access similar to Principal.
    - `PASTOR_EJECUTIVO`: Operational access, can approve reports.
    - `SECRETARIA_PASTORAL`: Administrative view.
- **Permission Matrix**:
    - **Finances**: 
        - `SECRETARIA_PASTORAL` can View Global Finances ("Análisis"), Confirm Annex Tithes, and Approve Monthly Reports (Administrative check).
    - **Members**:
        - `SECRETARIA_PASTORAL` can see "Fidelidad" and "Admisión" status (Administrative).
        - `SECRETARIA_PASTORAL` is **BLOCKED** from seeing "Notas Pastorales" and "Motivos de Disciplina" (Sensitive).
        - "Historial" tab content is filtered.
    - **Inventory**: All administrative roles can Manage.
    - **EPMI**: Permission to Graduate/Promote extended to new Pastoral roles.

## 2. New Modules & Features
- **Finances**:
    - **Diezmo Anexo**: New tab for Anexos to register tithes sent to Central.
    - **Monthly Reports**: Updated to v1.1 spec (Ingresos vs Egresos = Saldo).
- **Inventory**:
    - Complete CRUD module for managing Church Assets.
    - Scoped by Anexo or Teaching House.
- **Members**:
    - **Batch Fidelity Update**: New Modal to update fidelity status for multiple members at once.
    - **New Fields**: `fidelidad_estado`, `graduacion_estado`, `admision_estado`.

## 3. Dashboard Enhancements
- **Pastoral 360**:
    - Alerts for "Diezmos por Aprobar".
    - Alerts for "Reportes Faltantes".
    - Shortcut to "Inventario".

## 4. Next Steps for User
- Verify the "Secretaria Pastoral" experience in the demo.
- Test the "Batch Upload" feature with real data volume.
