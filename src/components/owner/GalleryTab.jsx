import React, { useState, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Upload,
  Loader2,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';
import {
  getGallery,
  addGalleryItem,
  deleteGalleryItem,
  uploadStorageAsset
} from '../../services/restaurantService';

export default function GalleryTab() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState('1');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete Confirm Modal
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getGallery();
      setGalleryItems(data);
    } catch (err) {
      console.error('Failed to load gallery items:', err);
      setError(err.message || 'Failed to load gallery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenAdd = () => {
    setTitle('');
    setDescription('');
    setDisplayOrder(String(galleryItems.length + 1));
    setImageFile(null);
    setImagePreview('');
    setFormError('');
    setModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!imageFile) {
      setFormError('Please select a photo to upload to gallery.');
      return;
    }

    setFormLoading(true);
    try {
      // Upload image to gallery-images bucket
      const uploadedUrl = await uploadStorageAsset('gallery-images', imageFile);

      await addGalleryItem({
        title: title.trim() || 'Kitchen Specialty',
        description: description.trim() || 'Prepared fresh at Variety Momo kitchen',
        image_url: uploadedUrl,
        display_order: Number(displayOrder) || 1,
        is_active: true
      });

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error uploading gallery image:', err);
      setFormError(err.message || 'Failed to upload gallery image.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setDeleteLoading(true);
    try {
      await deleteGalleryItem(deleteItem.id);
      setDeleteItem(null);
      loadData();
    } catch (err) {
      console.error('Error deleting gallery item:', err);
      alert('Failed to delete gallery photo.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Kitchen & Food Gallery
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              {galleryItems.length} Photos
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage high-definition culinary photos displayed in the public kitchen gallery.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Upload New Photo</span>
        </button>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading gallery photos...</span>
        </div>
      ) : galleryItems.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800">
          <ImageIcon className="w-10 h-10 text-stone-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">No gallery photos uploaded yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {galleryItems.map((item) => (
            <div
              key={item.id}
              className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden flex flex-col justify-between group"
            >
              <div className="relative aspect-4/3 bg-stone-950 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <span className="text-[11px] font-mono text-stone-500 bg-stone-950 px-2 py-0.5 rounded-md border border-stone-800">
                    #{item.display_order}
                  </span>
                </div>
                {item.description && (
                  <p className="text-xs text-stone-400 line-clamp-2">
                    {item.description}
                  </p>
                )}

                <div className="pt-2 border-t border-stone-800/80 flex items-center justify-end">
                  <button
                    onClick={() => setDeleteItem(item)}
                    className="p-1.5 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-stone-400 hover:text-rose-300 transition-colors"
                    title="Delete photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h2 className="font-outfit font-extrabold text-lg text-white">
                Upload Kitchen Gallery Photo
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
                  Select Photo <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-36 rounded-xl object-cover border border-stone-700 bg-stone-950"
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    required
                    onChange={handleFileChange}
                    className="block w-full text-stone-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-800 file:text-stone-200 hover:file:bg-stone-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Photo Title</label>
                <input
                  type="text"
                  placeholder="e.g. Steaming Hot Momos in Bamboo Basket"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Freshly hand-folded momos steaming in the live kitchen."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

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
                  {formLoading ? 'Uploading...' : 'Upload Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteItem && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-sm rounded-3xl p-6 text-white space-y-4">
            <h3 className="font-outfit font-extrabold text-base text-white">
              Delete Gallery Photo?
            </h3>
            <p className="text-xs text-stone-400">
              Are you sure you want to remove "{deleteItem.title}" from the public gallery?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700"
              >
                Cancel
              </button>
              <button
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                {deleteLoading ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
