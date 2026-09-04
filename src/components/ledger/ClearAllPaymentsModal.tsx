import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ClearAllPaymentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isClearing: boolean;
  paymentsCount: number;
}

export default function ClearAllPaymentsModal({
  isOpen,
  onClose,
  onConfirm,
  isClearing,
  paymentsCount
}: ClearAllPaymentsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md bg-charcoal-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">Clear All Payment Records?</h3>
            <p className="text-xs text-rose-400 font-mono">Warning: Highly Destructive Action</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          You are about to permanently delete all <strong className="text-white">{paymentsCount}</strong> transaction history records from your Firestore database ledger.
        </p>

        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-300 space-y-1">
          <strong>Note:</strong> We recommend exporting your payment records to a CSV file first before wiping history.
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={isClearing}
            className="px-4 py-2.5 bg-charcoal-800 text-gray-300 text-xs font-medium rounded-2xl hover:bg-charcoal-700 cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isClearing}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-2xl shadow-lg cursor-pointer transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isClearing ? 'Clearing Records...' : 'Yes, Delete All Records'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
