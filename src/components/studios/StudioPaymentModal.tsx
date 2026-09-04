import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  IndianRupee, 
  Check, 
  X, 
  Calendar, 
  CreditCard, 
  FileText, 
  Building2,
  Sparkles
} from 'lucide-react';
import { Studio, Project, PaymentHistory } from '../../types';

interface StudioPaymentModalProps {
  studio: Studio;
  projects: Project[];
  onClose: () => void;
  onLogPayment?: (payment: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
  onToast: (title: string, desc: string) => void;
}

export const StudioPaymentModal: React.FC<StudioPaymentModalProps> = ({
  studio,
  projects,
  onClose,
  onLogPayment,
  onToast
}) => {
  const studioProjects = projects.filter(p => p.studioId === studio.id);

  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState(studioProjects[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'bank_transfer' | 'cash' | 'cheque' | 'razorpay'>('upi');
  const [referenceNo, setReferenceNo] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      alert("Please enter a valid payment amount.");
      return;
    }

    if (!onLogPayment) {
      alert("Payment logging handler is not configured.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedProj = studioProjects.find(p => p.id === projectId);

      await onLogPayment({
        projectId: projectId || undefined,
        projectName: selectedProj?.coupleName || 'Studio Account Deposit',
        editorId: undefined,
        editorName: undefined,
        studioId: studio.id,
        studioName: studio.name,
        entityId: studio.id,
        entityName: studio.name,
        entityType: 'studio',
        amount: Number(amount),
        type: 'advance',
        paymentMethod: paymentMode as any,
        referenceNumber: referenceNo || undefined,
        transactionId: referenceNo || undefined,
        date: paymentDate,
        notes: notes ? notes : `Payment received from ${studio.name}`
      });

      onToast("Payment Recorded", `₹${Number(amount).toLocaleString('en-IN')} logged from ${studio.name}.`);
      onClose();
    } catch (err: any) {
      console.error("Error logging payment:", err);
      alert("Failed to log payment: " + (err?.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-md bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl z-10"
      >
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Record Payment Received
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                From {studio.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-[10px] font-mono text-gold-400 uppercase tracking-wider mb-1">
              Received Amount (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-mono">₹</span>
              <input
                type="number"
                required
                min="1"
                placeholder="e.g. 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-sm font-bold text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Project Link */}
          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              Apply to Wedding Project
            </label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none font-mono"
            >
              <option value="">General Account Credit (No Specific Project)</option>
              {studioProjects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.coupleName} ({p.eventType} • ₹{p.projectAmount.toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none font-mono"
              >
                <option value="upi">UPI / GPay / PhonePe</option>
                <option value="bank_transfer">Bank Transfer (NEFT/IMPS)</option>
                <option value="cash">Cash in Hand</option>
                <option value="cheque">Cheque</option>
                <option value="razorpay">Razorpay / Online</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Reference No */}
          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              UTR / UPI Reference Number
            </label>
            <input
              type="text"
              placeholder="e.g. UPI/408272819201"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none font-mono placeholder-gray-600"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              Notes / Remarks
            </label>
            <input
              type="text"
              placeholder="e.g. 50% advance for Teaser + Highlight cut"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 rounded-xl text-xs text-gray-200 focus:outline-none font-mono placeholder-gray-600"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Recording...' : 'Record Studio Payment'}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
