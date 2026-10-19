import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Branch } from '../types';
import { Building2, Plus, Edit2, MapPin, UserCheck, Phone, CheckCircle2, Users, FileText } from 'lucide-react';

export const BranchesView: React.FC = () => {
  const {
    branches,
    workers,
    production,
    addBranch,
    updateBranch,
    activeBranchId,
    setActiveBranchId,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    manager: '',
    phone: '',
    active: true,
  });

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setFormData({
      name: '',
      location: '',
      manager: '',
      phone: '',
      active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      manager: branch.manager,
      phone: branch.phone,
      active: branch.active,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBranch) {
      updateBranch(editingBranch.id, formData);
    } else {
      addBranch(formData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-800" />
            <h1 className="text-xl font-bold text-slate-900">Gestión de Faenas y Fundos</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Administre las faenas, fundos, predios y packings agrícolas donde prestan servicios sus cuadrillas.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Faena</span>
        </button>
      </div>

      {/* Quick Filter Info */}
      <div className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 p-3 rounded-lg text-xs">
        <span className="text-slate-700">
          Faena actualmente seleccionada para el sistema:{' '}
          <strong className="text-emerald-900 font-bold">
            {activeBranchId === 'ALL'
              ? 'Consolidado Global (Todas las Faenas)'
              : branches.find(b => b.id === activeBranchId)?.name || activeBranchId}
          </strong>
        </span>
        {activeBranchId !== 'ALL' && (
          <button
            onClick={() => setActiveBranchId('ALL')}
            className="text-xs text-emerald-800 font-semibold hover:underline"
          >
            Ver Consolidado Global (Todas las Faenas)
          </button>
        )}
      </div>

      {/* Branches Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {branches.map(branch => {
          const branchWorkers = workers.filter(w => w.branchId === branch.id);
          const activeCount = branchWorkers.filter(w => w.status === 'ACTIVO').length;
          const branchProductionCount = production.filter(p => p.branchId === branch.id).length;
          const isCurrentActive = activeBranchId === branch.id;

          return (
            <div
              key={branch.id}
              className={`bg-white rounded-xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                isCurrentActive
                  ? 'border-emerald-700 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 font-medium">
                      {branch.id}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">{branch.name}</h2>
                  </div>
                  {isCurrentActive && (
                    <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      Activa
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-2 text-xs text-slate-600">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{branch.location || 'Sin ubicación registrada'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>
                      Encargado: <strong className="text-slate-800">{branch.manager}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>{branch.phone || 'Sin teléfono'}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Users className="w-3 h-3" />
                      <span>Dotación Activa</span>
                    </div>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {activeCount}{' '}
                      <span className="text-[10px] font-normal text-slate-500">
                        / {branchWorkers.length}
                      </span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-lg">
                    <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <FileText className="w-3 h-3" />
                      <span>Registros Prod.</span>
                    </div>
                    <p className="text-base font-bold text-slate-900 font-mono mt-0.5">
                      {branchProductionCount}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveBranchId(branch.id)}
                  disabled={isCurrentActive}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    isCurrentActive
                      ? 'bg-slate-100 text-slate-400 cursor-default'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {isCurrentActive ? 'Seleccionada' : 'Filtrar por esta'}
                </button>

                <button
                  onClick={() => handleOpenEdit(branch)}
                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Editar datos de faena"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Branch */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBranch ? 'Editar Faena / Predio' : 'Nueva Faena / Predio'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nombre de la Faena / Predio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Faena Fundo Los Lingues (San Fernando)"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Ubicación / Dirección / Comuna *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Ruta 5 Sur Km 182, Curicó, Maule"
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nombre del Encargado / Administrador de Faena *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Juan Carlos Pérez"
                  value={formData.manager}
                  onChange={e => setFormData({ ...formData, manager: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Teléfono de Contacto del Encargado
                </label>
                <input
                  type="text"
                  placeholder="ej. +56 9 1234 5678"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-700 text-slate-900 text-xs"
                />
              </div>

              <div className="pt-4 flex justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-medium shadow-xs"
                >
                  {editingBranch ? 'Guardar Cambios' : 'Crear Faena'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
