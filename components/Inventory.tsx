import React, { useState, useMemo } from 'react';
import { useApp } from '../App';
import { InventoryItem, UserRole } from '../types';
import {
    Package,
    MapPin,
    Search,
    Plus,
    Filter,
    Edit2,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Box,
    Home,
    Calendar,
    ArrowRight,
    Save,
    UploadCloud,
    X,
    CheckCircle2
} from 'lucide-react';
import InventoryDashboard from './InventoryDashboard'; // v2.0

const Inventory: React.FC = () => {
    const {
        inventoryItems,
        addInventoryItem,
        updateInventoryItem,
        deleteInventoryItem,
        anexos,
        teachingHouses,
        members,
        currentUser,
        notify
    } = useApp();

    // v2.0 ROLE CHECK
    const isSupervisor = ['PASTOR_PRINCIPAL', 'PASTOR_GENERAL', 'ADMIN', 'SECRETARIA', 'PASTOR_EJECUTIVO'].includes(currentUser.role);
    if (isSupervisor) {
        return <InventoryDashboard />;
    }

    const [searchTerm, setSearchTerm] = useState('');
    const [filterScope, setFilterScope] = useState<'ALL' | 'ANEXO' | 'CASA'>('ALL');

    // --- WIZARD STATE v2.0 ---
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [wizardStep, setWizardStep] = useState(1);
    const [pendingItems, setPendingItems] = useState<InventoryItem[]>([]);

    // Batch Context (Step 1)
    const [batchContext, setBatchContext] = useState({
        fecha: new Date().toISOString().split('T')[0],
        scope_tipo: 'ANEXO',
        scope_id: currentUser.anexoId !== 'ALL' ? currentUser.anexoId : '',
        responsable_id: currentUser.memberId || ''
    });

    // Item Form (Step 2)
    const [itemForm, setItemForm] = useState({
        nombre_bien: '',
        categoria: 'Muebles',
        cantidad: 1,
        estado_bien: 'NUEVO',
        descripcion: ''
    });

    const [editPendingId, setEditPendingId] = useState<string | null>(null); // v2.2 Smart Editing State

    // v2.5 AUTO-CATEGORIZATION
    const handleNameChange = (name: string) => {
        let category = itemForm.categoria;
        const n = name.toLowerCase();

        if (n.includes('silla') || n.includes('mesa') || n.includes('banco') || n.includes('pulpito') || n.includes('mueble')) category = 'Muebles';
        else if (n.includes('micro') || n.includes('cable') || n.includes('parlante') || n.includes('consola') || n.includes('tv') || n.includes('proyector')) category = 'Audio';
        else if (n.includes('olla') || n.includes('plato') || n.includes('cocina') || n.includes('gas') || n.includes('vaso')) category = 'Cocina';
        else if (n.includes('guitarra') || n.includes('bajo') || n.includes('teclado') || n.includes('bateria')) category = 'Instrumentos';

        setItemForm({ ...itemForm, nombre_bien: name, categoria: category });
    };

    // Evidence (Step 3)
    const [batchEvidence, setBatchEvidence] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Legacy Editing (Single Item from List)
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null); // Still allow editing existing items?
    // Prompt says "Reemplazar el modal actual por un Wizard...". 
    // Usually editing is single item. Let's keep editing as a simplified single-modal or just reuse logic.
    // For simplicity, I'll restrict "New" to Wizard, and "Edit" to a small inline modal or just disable edit for now?
    // "Reemplazar el registro individual (1 a 1) por un Wizard... para la carga masiva".
    // I'll keep single edit support via a separate Edit Modal (legacy-ish) to avoid regression.
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Partial<InventoryItem>>({});

    // Filter Items based on Search, Scope, and User Permissions
    const filteredItems = useMemo(() => {
        let items = inventoryItems;

        // 1. Permission Check
        if (currentUser.role === 'LIDER_ANEXO') {
            // Show items for their Anexo OR Teaching Houses linked to their Anexo
            const housesInAnexo = teachingHouses.filter(t => t.anexoId === currentUser.anexoId).map(t => t.id);
            items = items.filter(i =>
                (i.scope_tipo === 'ANEXO' && i.scope_id === currentUser.anexoId) ||
                (i.scope_tipo === 'CASA_ENSENANZA' && housesInAnexo.includes(i.scope_id))
            );
        } else if (currentUser.role === 'MAESTRO_CASA') {
            const myHouse = teachingHouses.find(h => h.maestroId === currentUser.memberId);
            if (myHouse) {
                items = items.filter(i => i.scope_tipo === 'CASA_ENSENANZA' && i.scope_id === myHouse.id);
            } else {
                items = []; // Should not happen if data is consistent
            }
        }
        // Pastors see all (default)

        // 2. Search
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            items = items.filter(i =>
                i.nombre_bien.toLowerCase().includes(lower) ||
                i.descripcion.toLowerCase().includes(lower)
            );
        }

        // 3. Type Filter
        if (filterScope !== 'ALL') {
            items = items.filter(i => i.scope_tipo === (filterScope === 'ANEXO' ? 'ANEXO' : 'CASA_ENSENANZA'));
        }

        return items;
    }, [inventoryItems, currentUser, currentUser.anexoId, teachingHouses, searchTerm, filterScope]);

    const handleOpenWizard = () => {
        setWizardStep(1);
        setPendingItems([]);
        setBatchContext({
            fecha: new Date().toISOString().split('T')[0],
            scope_tipo: 'ANEXO',
            scope_id: currentUser.anexoId !== 'ALL' ? currentUser.anexoId : '',
            responsable_id: currentUser.memberId || ''
        });
        setIsWizardOpen(true);
    };

    const handleEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        setEditFormData(item);
        setIsEditModalOpen(true);
    };

    // --- WIZARD HANDLERS ---
    const handleAddItemToBatch = () => {
        if (!itemForm.nombre_bien) return;

        // v2.2 SMART MERGE LOGIC
        // Check if item exists with same Name AND Status
        const duplicateIndex = pendingItems.findIndex(i =>
            i.nombre_bien.toLowerCase().trim() === itemForm.nombre_bien.toLowerCase().trim() &&
            i.estado_bien === itemForm.estado_bien
        );

        if (duplicateIndex !== -1 && !editPendingId) {
            // SCENARIO A: Merge Quantities
            const items = [...pendingItems];
            items[duplicateIndex].cantidad += itemForm.cantidad;
            setPendingItems(items);
            notify("🔄 Se actualizó la cantidad del ítem existente.");
        } else if (editPendingId) {
            // SCENARIO C: Update Existing Item (Manual Edit)
            setPendingItems(pendingItems.map(i => i.id === editPendingId ? {
                ...i,
                nombre_bien: itemForm.nombre_bien,
                categoria: itemForm.categoria as any,
                cantidad: itemForm.cantidad,
                estado_bien: itemForm.estado_bien as any,
                descripcion: itemForm.descripcion
            } : i));
            setEditPendingId(null);
            notify("✅ Ítem actualizado.");
        } else {
            // SCENARIO B: New Item
            const newItem: InventoryItem = {
                id: `TEMP-${Date.now()}`,
                nombre_bien: itemForm.nombre_bien,
                categoria: itemForm.categoria as any,
                cantidad: itemForm.cantidad,
                estado_bien: itemForm.estado_bien as any,
                descripcion: itemForm.descripcion,
                // Context fields
                scope_tipo: batchContext.scope_tipo as any,
                scope_id: batchContext.scope_id,
                responsable_id: batchContext.responsable_id,
                fecha_registro: batchContext.fecha,
                fecha_actualiza: batchContext.fecha,
                activo: true
            };
            setPendingItems([...pendingItems, newItem]);
            notify("✅ Ítem agregado a la lista.");
        }

        // Reset form - v2.5 STICKY CATEGORY (Keep category, reset others)
        setItemForm({ ...itemForm, nombre_bien: '', cantidad: 1, descripcion: '', categoria: itemForm.categoria }); // Keep category!
    };

    const handleEditPendingItem = (item: InventoryItem) => {
        setEditPendingId(item.id);
        setItemForm({
            ...itemForm,
            nombre_bien: item.nombre_bien,
            categoria: item.categoria || 'Muebles',
            cantidad: item.cantidad,
            estado_bien: item.estado_bien,
            descripcion: item.descripcion || ''
        });
    };

    const handleRemoveFromBatch = (id: string) => {
        setPendingItems(pendingItems.filter(i => i.id !== id));
    };

    const handleFinalizeBatch = () => {
        if (pendingItems.length === 0) return;

        pendingItems.forEach(item => {
            const finalItem = {
                ...item,
                id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                evidencia_url: batchEvidence || undefined
            };
            addInventoryItem(finalItem);
        });

        setIsWizardOpen(false);
        notify(`✅ Se registraron ${pendingItems.length} bienes exitosamente.`);
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);
            const reader = new FileReader();
            reader.onloadend = () => {
                setBatchEvidence(reader.result as string);
                setIsUploading(false);
            };
            reader.readAsDataURL(file);
        }
    };

    // v2.3 HOTFIX: Date Validation
    const handleNextStep = () => {
        if (wizardStep === 1) {
            // VALIDACIÓN DE FECHA FUTURA
            const selectedDate = new Date(batchContext.fecha);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalizar hoy a medianoche

            // Ajuste de zona horaria simple
            const selectedDateLocal = new Date(selectedDate.getTime() + selectedDate.getTimezoneOffset() * 60000);

            if (selectedDateLocal > today) {
                notify('No puedes registrar inventarios con fecha futura.', 'error');
                return; // Bloquea el avance
            }
        }
        setWizardStep(wizardStep + 1);
    };

    // Legacy Save for Edit Modal
    const handleUpdateItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem && editFormData.nombre_bien) {
            updateInventoryItem(editingItem.id, {
                ...editFormData,
                fecha_actualiza: new Date().toISOString()
            });
            setIsEditModalOpen(false);
            notify("Bien actualizado correctamente.");
        }
    };

    const handleDelete = (id: string) => {
        if (window.confirm('¿Estás seguro de eliminar este bien?')) {
            deleteInventoryItem(id);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NUEVO': return 'bg-green-100 text-green-800 border-green-200';
            case 'BUENO': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'REGULAR': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'DETERIORADO': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getScopeName = (type: string, id: string) => {
        if (type === 'ANEXO') return anexos.find(a => a.id === id)?.nombre || 'Anexo Desconocido';
        return teachingHouses.find(h => h.id === id)?.nombre || 'Casa Desconocida';
    };

    const getResponsibleName = (id: string) => {
        return members.find(m => m.id === id)?.nombres || 'Sin Asignar';
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Inventario de Bienes</h1>
                    <p className="text-gray-500 mt-1">Gestión de activos patrimoniales y recursos de la iglesia.</p>
                </div>
                <button
                    onClick={handleOpenWizard}
                    className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all active:scale-95 cursor-pointer"
                >
                    <Plus className="w-5 h-5" />
                    <span>Carga Masiva (Wizard)</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                                <Box className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-600">Total Items</h3>
                        </div>
                        <p className="text-4xl font-bold text-gray-900">{filteredItems.length}</p>
                        <p className="text-sm text-gray-500 mt-1">Registrados en sistema</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-100 rounded-lg text-green-600">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-600">En Buen Estado</h3>
                        </div>
                        <p className="text-4xl font-bold text-gray-900">
                            {filteredItems.filter(i => i.estado_bien === 'NUEVO' || i.estado_bien === 'BUENO').length}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Operativos al 100%</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-gray-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-100 rounded-lg text-red-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="font-semibold text-gray-600">Requieren Atención</h3>
                        </div>
                        <p className="text-4xl font-bold text-gray-900">
                            {filteredItems.filter(i => i.estado_bien === 'DETERIORADO' || i.estado_bien === 'REGULAR').length}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">Deteriorados o Regulares</p>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-100">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    <button
                        onClick={() => setFilterScope('ALL')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${filterScope === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setFilterScope('ANEXO')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${filterScope === 'ANEXO' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Sedes/Anexos
                    </button>
                    <button
                        onClick={() => setFilterScope('CASA')}
                        className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${filterScope === 'CASA' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        Casas de Enseñanza
                    </button>
                </div>
            </div>

            {/* Inventory List */}
            <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
                {filteredItems.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No se encontraron bienes registrados.</p>
                        <p className="text-sm">Intenta ajustar los filtros o registra un nuevo bien.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 font-semibold text-gray-600">Bien / Descripción</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Ubicación</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Estado</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-center">Cant.</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600">Responsable</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredItems.map(item => (
                                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                                    <Package className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{item.nombre_bien}</p>
                                                    <p className="text-sm text-gray-500 line-clamp-1">{item.descripcion}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {item.scope_tipo === 'ANEXO' ? <MapPin className="w-4 h-4 text-gray-400" /> : <Home className="w-4 h-4 text-gray-400" />}
                                                <span className="text-gray-700">{getScopeName(item.scope_tipo, item.scope_id)}</span>
                                            </div>
                                            <span className="text-xs text-gray-400 ml-6 uppercase">{item.scope_tipo === 'ANEXO' ? 'Sede' : 'Casa'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.estado_bien)}`}>
                                                {item.estado_bien}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-mono font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md">{item.cantidad}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-700">{getResponsibleName(item.responsable_id)}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEditItem(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                                    title="Editar"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* WIZARD MODAL */}
            {isWizardOpen && (
                <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center rounded-t-[2.5rem]">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Carga Masiva de Inventario</h2>
                                <p className="text-xs text-slate-500 font-medium">Paso {wizardStep} de 3</p>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500"><X className="w-5 h-5" /></button>
                        </div>

                        {/* Progress */}
                        <div className="h-1 bg-slate-100 flex">
                            <div className={`h-full bg-blue-500 transition-all ${wizardStep === 1 ? 'w-1/3' : wizardStep === 2 ? 'w-2/3' : 'w-full'}`} />
                        </div>

                        {/* BODY */}
                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {/* STEP 1: CONTEXT */}
                            {wizardStep === 1 && (
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Fecha de Inventario</label>
                                            <input
                                                type="date"
                                                required
                                                max={new Date().toISOString().split('T')[0]} // v2.3 Visual Lock
                                                value={batchContext.fecha}
                                                onChange={e => setBatchContext({ ...batchContext, fecha: e.target.value })}
                                                className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Responsable Principal</label>
                                            <select value={batchContext.responsable_id} onChange={e => setBatchContext({ ...batchContext, responsable_id: e.target.value })} className="w-full p-3 bg-slate-50 rounded-xl border-none font-bold text-slate-700">
                                                <option value="">Seleccionar...</option>
                                                {members.map(m => <option key={m.id} value={m.id}>{m.nombres} {m.apellidos}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Ubicación</label>
                                            <div className="flex gap-2">
                                                {/* Simplified Scope for Leaders - locked to their annex usually */}
                                                <div className="p-3 bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-100 flex-1 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4" />
                                                    {getScopeName(batchContext.scope_tipo, batchContext.scope_id) || 'Tu Sede'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: ITEMS */}
                            {wizardStep === 2 && (
                                <div className="space-y-6 animate-fadeIn">
                                    {/* Form */}
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                                            <div className="col-span-2">
                                                <input placeholder="Nombre del Bien" value={itemForm.nombre_bien} onChange={e => handleNameChange(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold" autoFocus />
                                            </div>
                                            <div>
                                                <select value={itemForm.categoria} onChange={e => setItemForm({ ...itemForm, categoria: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 text-sm">
                                                    <option value="Muebles">Muebles</option>
                                                    <option value="Audio">Audio</option>
                                                    <option value="Instrumentos">Instrumentos</option>
                                                    <option value="Cocina">Cocina</option>
                                                    <option value="Otro">Otro</option>
                                                </select>
                                            </div>
                                            <div>
                                                <input type="number" min="1" value={itemForm.cantidad} onChange={e => setItemForm({ ...itemForm, cantidad: parseInt(e.target.value) })} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold text-center" />
                                            </div>
                                            <div className="col-span-2">
                                                <select value={itemForm.estado_bien} onChange={e => setItemForm({ ...itemForm, estado_bien: e.target.value })} className="w-full p-2 rounded-lg border border-slate-200 text-sm font-bold">
                                                    <option value="NUEVO">NUEVO</option>
                                                    <option value="BUENO">BUENO</option>
                                                    <option value="REGULAR">REGULAR</option>
                                                    <option value="DETERIORADO">DETERIORADO</option>
                                                    <option value="MALO/DAÑADO">MALO/DAÑADO</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2">
                                                <button onClick={handleAddItemToBatch} className={`w-full h-full text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2 ${editPendingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-black'}`}>
                                                    {editPendingId ? <Edit2 size={16} /> : <Plus size={16} />}
                                                    {editPendingId ? 'Actualizar Ítem' : 'Agregar a Lista'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* List */}
                                    {/* List - v2.5 GROUPED RENDERING */}
                                    <div className="border border-slate-100 rounded-xl overflow-hidden max-h-[40vh] overflow-y-auto bg-white p-2 space-y-3">
                                        {pendingItems.length === 0 && <p className="text-center py-8 text-xs text-slate-400">Lista vacía. Agrega ítems arriba.</p>}

                                        {Array.from(new Set(pendingItems.map(i => i.categoria))).map(cat => (
                                            <div key={cat} className="border border-slate-100 rounded-xl overflow-hidden">
                                                <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 uppercase flex justify-between">
                                                    <span>{cat}</span>
                                                    <span className="bg-white px-2 rounded-full text-slate-400 border">{pendingItems.filter(i => i.categoria === cat).reduce((acc, curr) => acc + curr.cantidad, 0)} items</span>
                                                </div>
                                                <table className="w-full text-left">
                                                    <tbody className="divide-y divide-slate-50 text-sm">
                                                        {pendingItems.filter(i => i.categoria === cat).map(item => (
                                                            <tr key={item.id} className="hover:bg-slate-50">
                                                                <td className="px-3 py-2 font-bold text-slate-700">{item.nombre_bien}</td>
                                                                <td className="px-3 py-2 text-center w-16 bg-slate-50/50 font-mono text-slate-500">{item.cantidad}</td>
                                                                <td className="px-3 py-2 text-xs text-slate-400 w-24">{item.estado_bien}</td>
                                                                <td className="px-3 py-2 text-right w-20">
                                                                    <div className="flex justify-end gap-1">
                                                                        <button onClick={() => handleEditPendingItem(item)} className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 size={12} /></button>
                                                                        <button onClick={() => handleRemoveFromBatch(item.id)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: FINALIZE */}
                            {wizardStep === 3 && (
                                <div className="text-center space-y-6 animate-fadeIn">
                                    <h4 className="font-bold text-slate-800">Evidencia del Inventario</h4>
                                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-3xl p-8 cursor-pointer hover:bg-slate-50 transition-colors">
                                        {batchEvidence ? (
                                            <div className="relative">
                                                <img src={batchEvidence} className="h-40 mx-auto rounded-lg object-contain bg-slate-100" />
                                                <span className="text-emerald-600 font-bold text-sm block mt-2">Foto Cargada Correctamente</span>
                                            </div>
                                        ) : (
                                            <div className="text-slate-400">
                                                <UploadCloud className="w-12 h-12 mx-auto mb-2" />
                                                <p className="text-sm font-bold">Subir Foto Panorámica (Opcional)</p>
                                            </div>
                                        )}
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-xl text-left">
                                        <h5 className="font-bold text-blue-800 text-sm mb-2">Resumen</h5>
                                        <p className="text-sm text-blue-700 flex justify-between"><span>Total Ítems:</span> <span className="font-bold">{pendingItems.length}</span></p>
                                        <p className="text-sm text-blue-700 flex justify-between"><span>Responsable:</span> <span className="font-bold">{getResponsibleName(batchContext.responsable_id)}</span></p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 flex gap-3">
                            {wizardStep > 1 && <button onClick={() => setWizardStep(wizardStep - 1)} className="px-6 py-3 bg-slate-100 rounded-xl font-bold text-slate-500">Atrás</button>}
                            {wizardStep < 3 && <button onClick={handleNextStep} disabled={wizardStep === 2 && pendingItems.length === 0} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50">Siguiente Paso</button>}
                            {wizardStep === 3 && <button onClick={handleFinalizeBatch} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-600 flex items-center justify-center gap-2"><Save size={18} /> Guardar Inventario</button>}
                        </div>
                    </div>
                </div>
            )}

            {/* EDIT MODAL (Legacy) */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
                        <h3 className="text-xl font-bold mb-4">Editar Bien</h3>
                        <form onSubmit={handleUpdateItem} className="space-y-4">
                            <input value={editFormData.nombre_bien} onChange={e => setEditFormData({ ...editFormData, nombre_bien: e.target.value })} className="w-full p-2 border rounded-lg" placeholder="Nombre" />
                            <input type="number" value={editFormData.cantidad} onChange={e => setEditFormData({ ...editFormData, cantidad: parseInt(e.target.value) })} className="w-full p-2 border rounded-lg" placeholder="Cantidad" />
                            <select value={editFormData.estado_bien} onChange={e => setEditFormData({ ...editFormData, estado_bien: e.target.value as any })} className="w-full p-2 border rounded-lg">
                                <option value="NUEVO">NUEVO</option>
                                <option value="BUENO">BUENO</option>
                                <option value="REGULAR">REGULAR</option>
                                <option value="DETERIORADO">DETERIORADO</option>
                                <option value="MALO/DAÑADO">MALO/DAÑADO</option>
                            </select>
                            <div className="flex justify-end gap-2 mt-4">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-slate-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Actualizar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
