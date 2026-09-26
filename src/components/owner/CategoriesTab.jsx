import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import {
  getCategories,
  addCategory,
  updateCategory
} from '../../services/restaurantService';

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Flame');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setName('');
    setSlug('');
    setIcon('Flame');
    setDisplayOrder(String(categories.length + 1));
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setName(cat.name || '');
    setSlug(cat.slug || '');
    setIcon(cat.icon || 'Flame');
    setDisplayOrder(String(cat.display_order || '1'));
    setIsActive(Boolean(cat.is_active));
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    const finalSlug = slug.trim() || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    setFormLoading(true);
    try {
      const payload = {
        name: name.trim(),
        slug: finalSlug,
        icon: icon.trim(),
        display_order: Number(displayOrder) || 1,
        is_active: isActive
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
      } else {
        await addCategory(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving category:', err);
      setFormError(err.message || 'Failed to save category.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (cat) => {
    try {
      const newStatus = !cat.is_active;
      await updateCategory(cat.id, { is_active: newStatus });
      setCategories((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, is_active: newStatus } : c))
      );
    } catch (err) {
      console.error('Failed to toggle category:', err);
      alert('Failed to update category status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Menu Categories
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {categories.length} Categories
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Organize dishes into customer menu tabs (e.g. Steamed, Fried, Pan-Fried, Special Momos).
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading categories...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className={`bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                cat.is_active ? 'border-stone-800' : 'border-red-900/30 bg-stone-950/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white text-base">{cat.name}</h3>
                    <span className="text-xs font-mono text-stone-400">slug: {cat.slug}</span>
                  </div>
                  <span className="text-xs font-mono text-stone-500 bg-stone-950 px-2 py-1 rounded-lg border border-stone-800">
                    Order #{cat.display_order}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    cat.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {cat.is_active ? (
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
                  onClick={() => handleOpenEdit(cat)}
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
                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  Category Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steamed Momos"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!editingCategory) {
                      setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }
                  }}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Slug</label>
                <input
                  type="text"
                  placeholder="e.g. steamed-momos"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Icon Name</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={(e) => setIcon(e.target.value)}
                    className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-0"
                  />
                  <span className="font-semibold text-stone-300">Category Active on Customer Menu</span>
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
                  {formLoading ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
