import React, { useState, useEffect, useCallback } from 'react';
import {
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  IndianRupee,
  ShieldCheck,
  RefreshCw,
  Loader2,
  FileText,
  User,
  Phone
} from 'lucide-react';
import {
  getPaymentVerificationQueue,
  verifyOrderPayment,
  rejectOrderPayment
} from '../../services/restaurantService';

export default function PaymentsTab({ onVerificationChanged }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [verifyItem, setVerifyItem] = useState(null);
  const [verifyNote, setVerifyNote] = useState('');

  const [rejectItem, setRejectItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPaymentVerificationQueue();
      setQueue(data);
    } catch (err) {
      console.error('Failed to load payment verification queue:', err);
      setError(err.message || 'Failed to load verification queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // Handle Verify Submit
  const handleConfirmVerify = async () => {
    if (!verifyItem) return;
    setActionLoading(true);
    try {
      await verifyOrderPayment({
        paymentId: verifyItem.id,
        orderId: verifyItem.order_id,
        note: verifyNote || 'PhonePe transaction reference verified in merchant account.'
      });
      setVerifyItem(null);
      setVerifyNote('');
      loadQueue();
      if (onVerificationChanged) onVerificationChanged();
    } catch (err) {
      console.error('Error verifying payment:', err);
      alert(err.message || 'Failed to verify payment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Submit
  const handleConfirmReject = async () => {
    if (!rejectItem) return;
    if (!rejectReason || rejectReason.trim() === '') {
      alert('Please provide a rejection reason for customer clarity.');
      return;
    }

    setActionLoading(true);
    try {
      await rejectOrderPayment({
        paymentId: rejectItem.id,
        orderId: rejectItem.order_id,
        reason: rejectReason.trim()
      });
      setRejectItem(null);
      setRejectReason('');
      loadQueue();
      if (onVerificationChanged) onVerificationChanged();
    } catch (err) {
      console.error('Error rejecting payment:', err);
      alert(err.message || 'Failed to reject payment.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/70 p-4 rounded-2xl border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-outfit font-extrabold text-white text-xl sm:text-2xl tracking-tight">
              PhonePe Payment Verification
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
              {queue.length} Pending
            </span>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Manually verify advance payments submitted via PhonePe QR before accepting home delivery orders.
          </p>
        </div>

        <button
          onClick={loadQueue}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Safety Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 block font-semibold mb-0.5">
            Verification Protocol (Security Rule)
          </strong>
          <span>
            Please check your actual PhonePe Business app or bank SMS for the customer’s UTR/Transaction Reference before clicking Verify. All verifications and rejections are logged into database audit tables.
          </span>
        </div>
      </div>

      {/* Verification Queue Cards */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-2">
          <Loader2 className="w-7 h-7 text-brand-500 animate-spin" />
          <span className="text-xs text-stone-400">Loading pending verification queue...</span>
        </div>
      ) : queue.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-2xl border border-stone-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-300">All payments are verified!</p>
          <p className="text-xs text-stone-500 mt-1">There are no pending PhonePe advance verification requests at this moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {queue.map((item) => {
            const order = item.orders;
            return (
              <div
                key={item.id}
                className="bg-stone-900 rounded-2xl border border-rose-500/30 p-5 space-y-4 shadow-lg shadow-rose-950/20 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between border-b border-stone-800 pb-3">
                    <div>
                      <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                        Payment Verification Required
                      </span>
                      <div className="text-base font-outfit font-black text-white mt-0.5">
                        Order #{order?.order_number || 'N/A'}
                      </div>
                      <div className="text-[11px] text-stone-400 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 text-stone-500" />
                        <span>Submitted {new Date(item.submitted_at || Date.now()).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 block">Advance Claimed</span>
                      <span className="text-lg font-outfit font-black text-emerald-400">
                        ₹{item.amount}
                      </span>
                    </div>
                  </div>

                  {/* Customer and UTR */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-stone-200">
                        <User className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-semibold">{order?.customer_name}</span>
                      </div>
                      <a
                        href={`tel:${order?.customer_phone}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{order?.customer_phone}</span>
                      </a>
                    </div>

                    {/* UTR Highlight Card */}
                    <div className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-1">
                      <div className="text-[11px] text-stone-400 font-medium">Customer UTR / Ref Number:</div>
                      <div className="text-sm font-mono font-bold text-amber-300 select-all tracking-wider break-all">
                        {item.customer_reference || 'NO REFERENCE PROVIDED'}
                      </div>
                    </div>

                    {/* Order Financial Breakdown */}
                    <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                      <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-stone-400 block">Total Order</span>
                        <strong className="text-xs text-white">₹{order?.grand_total}</strong>
                      </div>
                      <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-teal-400 block">Advance (30%)</span>
                        <strong className="text-xs text-teal-300">₹{order?.advance_amount}</strong>
                      </div>
                      <div className="bg-stone-950/60 p-2 rounded-xl border border-stone-800">
                        <span className="text-[10px] text-amber-400 block">COD Due (70%)</span>
                        <strong className="text-xs text-amber-300">₹{order?.cod_amount}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Verification Action Buttons */}
                <div className="pt-3 border-t border-stone-800 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRejectItem(item);
                      setRejectReason('');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-800 hover:bg-rose-950/60 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all active:scale-95"
                  >
                    Reject Payment
                  </button>

                  <button
                    onClick={() => {
                      setVerifyItem(item);
                      setVerifyNote('');
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify Payment</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VERIFY CONFIRMATION MODAL */}
      {verifyItem && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h3 className="font-outfit font-extrabold text-lg text-white">
                Verify Payment Confirmation
              </h3>
            </div>

            <p className="text-xs text-stone-300">
              Confirm that you have checked your PhonePe app/account and received ₹{verifyItem.amount} with reference <strong className="text-amber-300 font-mono">{verifyItem.customer_reference}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                Audit Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Verified in PhonePe Business app"
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white text-xs rounded-xl border border-stone-700 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setVerifyItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmVerify}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                {actionLoading ? 'Verifying...' : 'Confirm & Mark Verified'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECT CONFIRMATION MODAL */}
      {rejectItem && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-stone-900 border border-stone-800 w-full max-w-md rounded-3xl p-6 text-white space-y-4">
            <div className="flex items-center gap-2.5 text-rose-400">
              <XCircle className="w-6 h-6" />
              <h3 className="font-outfit font-extrabold text-lg text-white">
                Reject Payment Confirmation
              </h3>
            </div>

            <p className="text-xs text-stone-300">
              Rejecting will mark the payment as REJECTED and alert the customer on their live tracking screen.
            </p>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1">
                Rejection Reason (Required)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. UTR reference not found in PhonePe statement, payment amount mismatch, etc."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-2.5 bg-stone-950 text-white text-xs rounded-xl border border-stone-700 focus:outline-hidden focus:border-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold hover:bg-stone-700"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
