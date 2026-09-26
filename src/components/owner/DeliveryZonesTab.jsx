import React, { useState, useEffect, useCallback } from 'react';
import {
  MapPin,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import {
  getDeliveryZones,
  addDeliveryZone,
  updateDeliveryZone
} from '../../services/restaurantService';

export default function DeliveryZonesTab() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDeliveryZones();
      setZones(data);
    } catch (err) {
      console.error('Failed to load delivery zones:', err);
      setError(err.message || 'Failed to load delivery zones.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingZone(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (zone) => {
    setEditingZone(zone);
    setName(zone.name || '');
    setDescription(zone.description || '');
    setIsActive(Boolean(zone.is_active));
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Zone name is required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        is_active: isActive
      };

      if (editingZone) {
        await updateDeliveryZone(editingZone.id, payload);
      } else {
        await addDeliveryZone(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving zone:', err);
      setFormError(err.message || 'Failed to save delivery zone.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (zone) => {
    try {
      const newStatus = !zone.is_active;
      await updateDeliveryZone(zone.id, { is_active: newStatus });
      setZones((prev) =>
        prev.map((z) => (z.id === zone.id ? { ...z, is_active: newStatus } : z))
      );
    } catch (err) {
      console.error('Failed to toggle delivery zone:', err);
      alert('Failed to update delivery zone status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Delivery Zones (Mecheda)
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {zones.length} Zones
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Configure serviceable localities in Mecheda. Customers can only order home delivery if their zone is active.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Delivery Zone</span>
        </button>
      </div>

      {/* Zones Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading delivery zones...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {zones.map((zone) => (
            <div
              key={zone.id}
              className={`bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                zone.is_active ? 'border-stone-800' : 'border-red-900/30 bg-stone-950/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-xl bg-stone-800 text-stone-300 shrink-0">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-base">{zone.name}</h3>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {zone.description || 'Serviceable locality under Mecheda jurisdiction.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(zone)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    zone.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {zone.is_active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Deliveries Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOpenEdit(zone)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all active:scale-95"
                >
                  <Edit className="w-3 h-3 text-stone-400" />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="font-outfit font-extrabold text-lg text-white">
                {editingZone ? 'Edit Delivery Zone' : 'Add Delivery Zone'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Zone / Area Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mecheda Station Road"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Description / Landmarks
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Near Bus Stand, Rail Gate, College Road"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-0"
                  />
                  <span className="font-semibold text-stone-300">Deliveries Enabled For This Zone</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 font-semibold hover:bg-stone-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {formLoading ? 'Saving...' : editingZone ? 'Save Changes' : 'Create Zone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
