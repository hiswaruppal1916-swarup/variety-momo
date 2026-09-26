import React, { useState, useEffect, useCallback } from 'react';
import {
  QrCode,
  Plus,
  Edit,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  X,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import {
  getTables,
  addTable,
  updateTable
} from '../../services/restaurantService';

export default function TablesTab() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [tableNumber, setTableNumber] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getTables();
      setTables(data);
    } catch (err) {
      console.error('Failed to load tables:', err);
      setError(err.message || 'Failed to load tables.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const generateRandomToken = () => {
    return 'tbl_' + Math.random().toString(36).substring(2, 10);
  };

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableNumber('');
    setQrToken(generateRandomToken());
    setIsActive(true);
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setTableNumber(String(table.table_number || ''));
    setQrToken(table.qr_token || '');
    setIsActive(Boolean(table.is_active));
    setFormError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const num = Number(tableNumber);
    if (!tableNumber || isNaN(num) || num <= 0) {
      setFormError('Please enter a valid positive table number.');
      return;
    }

    if (!qrToken.trim()) {
      setFormError('QR token is required.');
      return;
    }

    setFormLoading(true);
    try {
      const payload = {
        table_number: num,
        qr_token: qrToken.trim(),
        is_active: isActive
      };

      if (editingTable) {
        await updateTable(editingTable.id, payload);
      } else {
        await addTable(payload);
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Error saving table:', err);
      setFormError(err.message || 'Failed to save table.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (table) => {
    try {
      const newStatus = !table.is_active;
      await updateTable(table.id, { is_active: newStatus });
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, is_active: newStatus } : t))
      );
    } catch (err) {
      console.error('Failed to toggle table:', err);
      alert('Failed to update table status.');
    }
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/?table_token=${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              Restaurant Table Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {tables.length} Tables
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Manage dine-in tables, QR access tokens, and direct table-ordering links.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-md transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Table</span>
        </button>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading restaurant tables...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tables.map((table) => (
            <div
              key={table.id}
              className={`bg-stone-900 rounded-2xl border p-4 flex flex-col justify-between transition-all ${
                table.is_active ? 'border-stone-800' : 'border-red-900/30 bg-stone-950/60 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-black text-white text-lg">
                        Table #{table.table_number}
                      </h3>
                      <span className="text-[11px] font-mono text-stone-400">
                        token: {table.qr_token}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-stone-800/60">
                  <button
                    onClick={() => handleCopyLink(table.qr_token)}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-stone-950 border border-stone-800 text-[11px] font-medium text-stone-300 hover:text-white transition-colors"
                  >
                    {copiedToken === table.qr_token ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Dine-In Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-stone-400" />
                        <span>Copy Table Order Link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-stone-800/80 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(table)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    table.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                  }`}
                >
                  {table.is_active ? (
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
                  onClick={() => handleOpenEdit(table)}
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
                {editingTable ? 'Edit Table' : 'Add Table'}
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
                  Table Number <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="e.g. 5"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">
                  QR Token <span className="text-red-400">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={qrToken}
                    onChange={(e) => setQrToken(e.target.value)}
                    className="w-full p-2.5 bg-stone-950 text-white rounded-xl border border-stone-700 focus:outline-hidden focus:border-brand-500 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setQrToken(generateRandomToken())}
                    className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl whitespace-nowrap"
                  >
                    Generate
                  </button>
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
                  <span className="font-semibold text-stone-300">Table Active for Seating</span>
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
                  {formLoading ? 'Saving...' : editingTable ? 'Save Changes' : 'Create Table'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
