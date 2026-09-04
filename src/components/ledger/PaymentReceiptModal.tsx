import React from 'react';
import { 
  X, 
  Printer, 
  MessageCircle, 
  IndianRupee, 
  CheckCircle2, 
  Building2, 
  Laptop, 
  Calendar, 
  FileText, 
  ShieldCheck 
} from 'lucide-react';
import { motion } from 'motion/react';
import { PaymentHistory, Project, Studio, Editor } from '../../types';

interface PaymentReceiptModalProps {
  receipt: PaymentHistory | null;
  onClose: () => void;
  studios: Studio[];
  editors: Editor[];
  projects: Project[];
}

export default function PaymentReceiptModal({
  receipt,
  onClose,
  studios,
  editors,
  projects
}: PaymentReceiptModalProps) {
  if (!receipt) return null;

  const isReceived = receipt.entityType === 'studio';
  const studioObj = studios.find(s => s.id === receipt.entityId);
  const editorObj = editors.find(e => e.id === receipt.entityId);
  const projObj = projects.find(p => p.id === receipt.projectId);

  const partyName = isReceived ? (studioObj?.name || 'Partner Studio') : (editorObj?.name || 'Video Editor');
  const partyPhone = isReceived ? studioObj?.phone : editorObj?.phone;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const phoneClean = (partyPhone || '').replace(/[^0-9]/g, '');
    const msg = `*OFFICIAL PAYMENT VOUCHER* 🎬\n*The Frame Cut Studio*\n\n` +
      `Receipt No: *#REC-${receipt.id.slice(-6).toUpperCase()}*\n` +
      `Date: *${receipt.date}*\n` +
      `Type: *${isReceived ? 'Receipt (Studio Collection)' : 'Disbursement (Editor Payout)'}*\n` +
      `Party: *${partyName}*\n` +
      `Project: *${receipt.projectCoupleName || projObj?.coupleName || 'Wedding Film'}*\n` +
      `Amount: *₹${(receipt.amount || 0).toLocaleString('en-IN')}*\n` +
      `Method: *${receipt.paymentMethod || 'UPI'}*\n` +
      (receipt.receivedFrom ? `Payer/Rep: *${receipt.receivedFrom}*\n` : '') +
      (receipt.notes ? `Ref/Notes: *${receipt.notes}*\n` : '') +
      `\nStatus: *SUCCESSFULLY RECORDED & VERIFIED IN LEDGER* ✅`;

    const targetPhone = phoneClean ? (phoneClean.length === 10 ? '91' + phoneClean : phoneClean) : '';
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-charcoal-900 border border-gold-500/40 rounded-3xl p-6 shadow-2xl space-y-6 relative overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 relative z-10">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
            <h3 className="text-sm font-mono uppercase text-gold-400 tracking-wider font-bold">
              Official Payment Voucher
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Receipt Voucher Body (Printable Area) */}
        <div className="p-6 rounded-2xl bg-charcoal-950/90 border border-gold-500/20 space-y-5 relative z-10 shadow-inner">
          {/* Header Brand */}
          <div className="flex justify-between items-start border-b border-white/10 pb-4">
            <div>
              <h2 className="text-lg font-black font-display text-white tracking-wider">THE FRAME CUT</h2>
              <p className="text-[10px] font-mono text-gold-400 uppercase tracking-widest">
                Post-Production Studio OS
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-mono text-gray-500 block uppercase">Voucher ID</span>
              <span className="text-xs font-mono font-bold text-gray-300">
                #REC-{receipt.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Amount Callout */}
          <div className="text-center py-4 bg-gradient-to-b from-charcoal-900 to-charcoal-950 rounded-2xl border border-gold-500/30 space-y-1">
            <span className="text-[10px] font-mono uppercase text-gray-400 font-semibold tracking-wider">
              {isReceived ? 'Total Amount Received' : 'Total Payout Disbursed'}
            </span>
            <div className="text-3xl font-black font-sans text-gold-300 tracking-tight flex items-center justify-center gap-1">
              <span className="text-2xl text-gold-400 font-normal">₹</span>
              {(receipt.amount || 0).toLocaleString('en-IN')}
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Status: Successfully Verified & Synchronized</span>
            </div>
          </div>

          {/* Itemized Details Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] font-mono uppercase text-gray-500 block">Date of Transaction</span>
              <span className="font-semibold text-white font-mono">{receipt.date || 'Recent'}</span>
            </div>

            <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] font-mono uppercase text-gray-500 block">Payment Mode</span>
              <span className="font-semibold text-gold-300 font-mono">{receipt.paymentMethod || 'UPI'}</span>
            </div>

            <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] font-mono uppercase text-gray-500 block">
                {isReceived ? 'Studio Client' : 'Video Editor'}
              </span>
              <span className="font-semibold text-white truncate block">{partyName}</span>
            </div>

            <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5 space-y-1">
              <span className="text-[9px] font-mono uppercase text-gray-500 block">Associated Project</span>
              <span className="font-semibold text-white truncate block">
                {receipt.projectCoupleName || projObj?.coupleName || 'General Ledger'}
              </span>
            </div>
          </div>

          {/* Payer or Reference Notes */}
          {(receipt.receivedFrom || receipt.notes) && (
            <div className="p-3 bg-charcoal-900/60 rounded-xl border border-white/5 text-xs space-y-1">
              {receipt.receivedFrom && (
                <div className="flex justify-between font-mono text-[11px]">
                  <span className="text-gray-500">Payer / Remitter:</span>
                  <span className="font-medium text-gray-200">{receipt.receivedFrom}</span>
                </div>
              )}
              {receipt.notes && (
                <div className="pt-1 text-[11px] text-gray-400 italic">
                  Note: {receipt.notes}
                </div>
              )}
            </div>
          )}

          {/* Security stamp footer */}
          <div className="pt-2 text-center text-[9px] font-mono text-gray-500">
            System generated digital voucher • Verified by Frame Cut Studio Ledger
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 relative z-10">
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Send on WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 text-xs font-medium rounded-2xl flex items-center space-x-1.5 cursor-pointer border border-white/10"
            >
              <Printer className="w-4 h-4 text-gold-400" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-charcoal-800 text-gray-300 text-xs font-medium rounded-2xl hover:bg-charcoal-700 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
