import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  Calendar
} from 'lucide-react';
import {
  getOffers,
  addOffer,
  updateOffer
} from '../../services/restaurantService';

export default function OffersTab() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('Festive Special');
  const [code, setCode] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('15');
  const [isActive, setIsActive] = useState(true);
  const [validUntil, setValidUntil] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getOffers();
      setOffers(data);
    } catch (err) {
      console.error('Failed to load offers:', err);
      setError(err.message || 'Failed to load offers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingOffer(null);
    setTitle('');
    setDescription('');
    setBadge('Festive Special');
    setCode('FESTIVE15');
    setDiscountPercentage('15');
    setIsActive(true);
    setValidUntil('');
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (offer) => {
    setEditingOffer(offer);
    setTitle(offer.title || '');
    setDescription(offer.description || '');
    setBadge(offer.badge || '');
    setCode(offer.code || '');
    setDiscountPercentage(String(offer.discount_percentage || ''));
    setIsActive(Boolean(offer.is_active));
    setValidUntil(offer.valid_until ? offer.valid_until.substring(0, 10) : '');
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Offer title is required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        badge: badge.trim(),
        code: code.trim().toUpperCase(),
        discount_percentage: Number(discountPercentage) || 0,
        is_active: isActive,
        valid_until: validUntil ? new Date(validUntil).toISOString() : null
      };

      if (editingOffer) {
        await updateOffer(editingOffer.id, payload);
      } else {
        await addOffer(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving offer:', err);
      setFormError(err.message || 'Failed to save offer.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (offer) => {
    try {
      const newStatus = !offer.is_active;
      await updateOffer(offer.id, { is_active: newStatus });
      setOffers((prev) =>
        prev.map((o) => (o.id === offer.id ? { ...o, is_active: newStatus } : o))
      );
    } catch (err) {
      console.error('Failed to toggle offer:', err);
      alert('Failed to update offer status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Promotional Offers Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {offers.length} Offers
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage promotional banners, coupons, and seasonal discounts displayed to visitors.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Offer</span>
        </button>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading offers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className={`bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                offer.is_active ? 'border-stone-800' : 'border-red-900/30 bg-stone-950/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {offer.badge || 'Special Deal'}
                  </span>
                  {offer.code && (
                    <span className="text-xs font-mono font-bold text-brand-400 bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
                      {offer.code}
                    </span>
                  )}
                </div>

                <h3 className="font-semibold text-white text-base mt-2">{offer.title}</h3>
                <p className="text-xs text-stone-400 mt-1 line-clamp-2">
                  {offer.description}
                </p>

                {offer.valid_until && (
                  <div className="mt-2 text-[11px] text-stone-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Valid until {new Date(offer.valid_until).toLocaleDateString('en-IN')}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(offer)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    offer.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {offer.is_active ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Active</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Disabled</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOpenEdit(offer)}
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
                {editingOffer ? 'Edit Offer' : 'Add New Offer'}
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
                  Offer Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 15% OFF On Weekend Orders"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Order over ₹300 and get instant 15% off"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Trending Deal"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. MOMO15"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500 font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Valid Until Date</label>
                <input
                  type="date"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
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
                  <span className="font-semibold text-stone-300">Offer Active & Visible</span>
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
                  {formLoading ? 'Saving...' : editingOffer ? 'Save Changes' : 'Create Offer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
