import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete Record',
  description = 'Are you sure you want to permanently delete this record? This action cannot be undone.'
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-sm bg-charcoal-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-4"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">{title}</h3>
            <p className="text-xs text-gray-400">Irreversible operation</p>
          </div>
        </div>

        <p className="text-xs text-gray-300 leading-relaxed">
          {description}
        </p>

        <div className="flex justify-end gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-charcoal-800 text-gray-300 text-xs font-medium rounded-xl hover:bg-charcoal-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center space-x-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Confirm Delete</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
