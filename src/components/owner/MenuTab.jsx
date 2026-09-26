import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Search,
  Upload,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  X,
  IndianRupee,
  Flame,
  ArrowUpDown
} from 'lucide-react';
import {
  getAllMenuItemsForOwner,
  getCategories,
  addMenuItem,
  updateMenuItem,
  toggleMenuItemAvailability,
  uploadStorageAsset
} from '../../services/restaurantService';

export default function MenuTab() {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State (Add or Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [isVeg, setIsVeg] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);
  const [isPopular, setIsPopular] = useState(false);
  const [displayOrder, setDisplayOrder] = useState('1');
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [items, cats] = await Promise.all([
        getAllMenuItemsForOwner(),
        getCategories()
      ]);
      setMenuItems(items);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load menu data:', err);
      setError(err.message || 'Failed to load menu items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingItem(null);
    setName('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setPrice('');
    setIsVeg(true);
    setIsAvailable(true);
    setIsPopular(false);
    setDisplayOrder(String(menuItems.length + 1));
    setImageUrl('');
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setName(item.name || '');
    setCategoryId(item.category_id || '');
    setDescription(item.description || '');
    setPrice(String(item.price || ''));
    setIsVeg(Boolean(item.is_vegetarian ?? item.is_veg));
    setIsAvailable(Boolean(item.is_available));
    setIsPopular(Boolean(item.is_popular));
    setDisplayOrder(String(item.display_order || '1'));
    setImageUrl(item.image_url || '');
    setImageFile(null);
    setImagePreview(item.image_url || '');
    setFormError('');
    setModalOpen(true);
  };

  // Handle Image File Selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('Food name is required.');
      return;
    }
    if (!categoryId) {
      setFormError('Please select a category.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setFormError('Price must be a valid positive number.');
      return;
    }

    setFormLoading(true);
    try {
      let finalImageUrl = imageUrl;

      // If user uploaded a new image file, upload to menu-images bucket
      if (imageFile) {
        finalImageUrl = await uploadStorageAsset('menu-images', imageFile);
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const payload = {
        category_id: categoryId,
        name: name.trim(),
        slug,
        description: description.trim(),
        price: numPrice,
        is_vegetarian: isVeg,
        is_available: isAvailable,
        is_popular: isPopular,
        display_order: Number(displayOrder) || 1,
        image_url: finalImageUrl || '/variety-momo-logo.jpg'
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
      } else {
        await addMenuItem(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving food item:', err);
      setFormError(err.message || 'Failed to save food item.');
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle availability inline
  const handleToggleAvailability = async (item) => {
    try {
      const newStatus = !item.is_available;
      await toggleMenuItemAvailability(item.id, newStatus);
      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: newStatus } : i))
      );
    } catch (err) {
      console.error('Failed to toggle availability:', err);
      alert('Failed to update food availability.');
    }
  };

  // Filtered Items
  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCategory === 'ALL' || item.category_id === selectedCategory;
    const matchSearch =
      searchQuery.trim() === '' ||
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Menu Items Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {menuItems.length} Dishes
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Add new momos & dishes, adjust prices, upload photos, and toggle kitchen availability.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Food</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900/50 p-3 rounded-2xl border border-stone-800 flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search food by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-stone-950 text-white placeholder-stone-500 text-xs rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-stone-950 text-white text-xs rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
        >
          <option value="ALL">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Dishes Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading menu database...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800">
          <Utensils className="w-10 h-10 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No dishes match your filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                item.is_available
                  ? 'border-stone-800'
                  : 'border-red-900/40 bg-stone-950/60 opacity-80'
              }`}
            >
              <div>
                <div className="flex gap-3">
                  <img
                    src={item.image_url || '/variety-momo-logo.jpg'}
                    alt={item.name}
                    className="w-16 h-16 rounded-xl object-cover border border-stone-800 shrink-0 bg-stone-950"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={(item.is_vegetarian ?? item.is_veg) ? 'badge-veg scale-75' : 'badge-non-veg scale-75'} />
                      <h3 className="font-semibold text-white text-sm truncate">{item.name}</h3>
                    </div>
                    <p className="text-[11px] text-stone-400 line-clamp-2 mt-0.5">
                      {item.description || 'Delicious freshly made Variety Momo specialty.'}
                    </p>
                    <div className="text-brand-400 font-outfit font-black text-sm mt-1">
                      ₹{item.price}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Controls: Availability Switch & Edit */}
              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    item.is_available
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {item.is_available ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Available</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Unavailable</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleOpenEdit(item)}
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

      {/* ADD / EDIT FOOD MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-lg rounded-3xl p-5 sm:p-6 text-white max-h-[90vh] overflow-y-auto custom-scrollbar my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="font-outfit font-extrabold text-lg text-white">
                {editingItem ? 'Edit Food Item' : 'Add New Food Item'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 mt-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-red-950/80 border border-red-500/40 text-red-200 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Food Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steamed Chicken Momo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Category <span className="text-red-400">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Juicy tender minced chicken momos with spicy red dip"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              {/* Price & Display Order */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Price (₹) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    placeholder="120"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Veg / Non-Veg */}
              <div>
                <label className="block text-stone-400 font-semibold mb-1">Dietary Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isVeg"
                      checked={isVeg}
                      onChange={() => setIsVeg(true)}
                      className="text-brand-600 focus:ring-0"
                    />
                    <span className="badge-veg scale-75" />
                    <span>Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="isVeg"
                      checked={!isVeg}
                      onChange={() => setIsVeg(false)}
                      className="text-brand-600 focus:ring-0"
                    />
                    <span className="badge-non-veg scale-75" />
                    <span>Non-Vegetarian</span>
                  </label>
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  Food Photo (Upload to Storage)
                </label>
                <div className="flex items-center gap-3">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover border border-stone-700 bg-stone-950 shrink-0"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-stone-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700"
                  />
                </div>
              </div>

              {/* Availability & Popular Toggles */}
              <div className="pt-2 border-t border-stone-800 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-0"
                  />
                  <span className="font-semibold text-stone-300">Available For Ordering</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-0"
                  />
                  <span className="font-semibold text-stone-300">Featured / Popular</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="pt-4 border-t border-stone-800 flex items-center justify-end gap-2">
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
                  {formLoading ? 'Saving Dish...' : editingItem ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
