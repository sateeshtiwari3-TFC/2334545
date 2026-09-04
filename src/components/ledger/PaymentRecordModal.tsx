import React, { useState, useEffect } from 'react';
import { 
  X, 
  IndianRupee, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Building2, 
  Laptop, 
  FolderKanban, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { motion } from 'motion/react';
import { PaymentHistory, Project, Studio, Editor } from '../../types';

interface PaymentRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPayment: PaymentHistory | null;
  initialType?: 'studio' | 'editor';
  initialProjectId?: string;
  initialStudioId?: string;
  initialEditorId?: string;
  studios: Studio[];
  editors: Editor[];
  projects: Project[];
  payments: PaymentHistory[];
  onLogPayment: (payment: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
  onUpdatePayment: (id: string, updates: Partial<PaymentHistory>) => Promise<void>;
  onUpdateProject?: (projectId: string, updates: Partial<Project>) => Promise<void>;
}

export default function PaymentRecordModal({
  isOpen,
  onClose,
  editingPayment,
  initialType = 'studio',
  initialProjectId = '',
  initialStudioId = '',
  initialEditorId = '',
  studios,
  editors,
  projects,
  payments,
  onLogPayment,
  onUpdatePayment,
  onUpdateProject
}: PaymentRecordModalProps) {
  const [paymentType, setPaymentType] = useState<'studio' | 'editor'>(initialType);
  const [selectedStudioId, setSelectedStudioId] = useState(initialStudioId || studios[0]?.id || '');
  const [selectedEditorId, setSelectedEditorId] = useState(initialEditorId || editors[0]?.id || '');
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Initialize or reset form on open or editingPayment change
  useEffect(() => {
    if (editingPayment) {
      setPaymentType(editingPayment.entityType);
      if (editingPayment.entityType === 'studio') {
        setSelectedStudioId(editingPayment.entityId);
      } else {
        setSelectedEditorId(editingPayment.entityId);
      }
      setSelectedProjectId(editingPayment.projectId || '');
      setAmount(editingPayment.amount);
      setDate(editingPayment.date || new Date().toISOString().split('T')[0]);
      setPaymentMethod(editingPayment.paymentMethod || 'UPI');
      setNotes(editingPayment.notes || '');
      setReceivedFrom(editingPayment.receivedFrom || '');
    } else {
      setPaymentType(initialType);
      const targetProj = projects.find(p => p.id === initialProjectId);
      const defaultStudio = initialStudioId || (targetProj ? (targetProj.studioId || studios.find(s => s.name.toLowerCase() === targetProj.studioName?.toLowerCase())?.id || studios[0]?.id || '') : (studios[0]?.id || ''));
      setSelectedStudioId(defaultStudio);
      setSelectedEditorId(initialEditorId || editors[0]?.id || '');
      setSelectedProjectId(initialProjectId);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setNotes('');
      setReceivedFrom('');
    }
    setFormError('');
    setFormSuccess('');
  }, [editingPayment, initialType, initialProjectId, initialStudioId, initialEditorId, isOpen, studios, editors, projects]);

  if (!isOpen) return null;

  // Selected project details for helpful hints
  const selectedProjObj = projects.find(p => p.id === selectedProjectId);
  let remainingDueHint = 0;
  if (selectedProjObj) {
    const pPayments = payments.filter(p => p.projectId === selectedProjObj.id && p.entityType === 'studio');
    const loggedAdv = pPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const totalAdv = pPayments.length > 0 ? loggedAdv : (Number(selectedProjObj.advancePayment) || 0);
    remainingDueHint = Math.max(0, (Number(selectedProjObj.projectAmount) || 0) - totalAdv);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!amount || Number(amount) <= 0) {
      setFormError('Please enter a valid amount greater than ₹0.');
      return;
    }

    if (paymentType === 'studio' && !selectedStudioId) {
      setFormError('Please select a studio partner.');
      return;
    }

    if (paymentType === 'editor' && !selectedEditorId) {
      setFormError('Please select an editor.');
      return;
    }

    setIsSubmitting(true);

    try {
      const studioObj = studios.find(s => s.id === selectedStudioId);
      const editorObj = editors.find(e => e.id === selectedEditorId);
      const projObj = projects.find(p => p.id === selectedProjectId);

      const projectCoupleName = projObj 
        ? projObj.coupleName 
        : (paymentType === 'studio' 
            ? `Studio Payment (${studioObj?.name || 'Studio'})`
            : `Editor Payout (${editorObj?.name || 'Editor'})`);

      if (editingPayment) {
        // Update existing
        await onUpdatePayment(editingPayment.id, {
          entityId: paymentType === 'studio' ? selectedStudioId : selectedEditorId,
          entityType: paymentType,
          projectId: selectedProjectId || 'general_ledger',
          projectCoupleName,
          amount: Number(amount),
          date,
          paymentMethod,
          notes,
          receivedFrom: paymentType === 'studio' ? (receivedFrom.trim() || studioObj?.ownerName || studioObj?.name || '') : undefined
        });

        // Sync project advance payment & remaining balance if associated with a studio project
        if (paymentType === 'studio' && selectedProjectId && selectedProjectId !== 'general_ledger' && projObj && onUpdateProject) {
          const updatedPayments = payments.map(p => p.id === editingPayment.id ? { ...p, amount: Number(amount), projectId: selectedProjectId, entityType: paymentType } : p);
          const totalAdv = updatedPayments.filter(p => p.projectId === selectedProjectId && p.entityType === 'studio').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          await onUpdateProject(projObj.id, {
            advancePayment: totalAdv,
            remainingBalance: Math.max(0, (projObj.projectAmount || 0) - totalAdv)
          });
        }

        setFormSuccess('Payment record updated successfully!');
      } else {
        // Create new
        await onLogPayment({
          entityId: paymentType === 'studio' ? selectedStudioId : selectedEditorId,
          entityType: paymentType,
          projectId: selectedProjectId || 'general_ledger',
          projectCoupleName,
          amount: Number(amount),
          date,
          paymentMethod,
          notes: notes || (paymentType === 'studio' ? `Received payment from ${studioObj?.name}` : `Payout to editor ${editorObj?.name}`),
          receivedFrom: paymentType === 'studio' ? (receivedFrom.trim() || studioObj?.ownerName || studioObj?.name) : undefined
        });

        // Sync project advance payment & remaining balance
        if (paymentType === 'studio' && selectedProjectId && selectedProjectId !== 'general_ledger' && projObj && onUpdateProject) {
          const currentAdv = payments.filter(p => p.projectId === selectedProjectId && p.entityType === 'studio').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const totalAdv = currentAdv + Number(amount);
          await onUpdateProject(projObj.id, {
            advancePayment: totalAdv,
            remainingBalance: Math.max(0, (projObj.projectAmount || 0) - totalAdv)
          });
        }

        setFormSuccess('New payment recorded & stored successfully!');
      }

      setTimeout(() => {
        onClose();
        setIsSubmitting(false);
      }, 750);

    } catch (err: any) {
      console.error('Failed to save payment:', err);
      setFormError(err?.message || 'Failed to record payment transaction.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                {editingPayment ? 'Edit Payment Record' : 'Record New Transaction'}
              </h3>
              <p className="text-xs text-gray-400">
                Log studio advance/final settlement or editor payout voucher
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success/Error Banners */}
        {formSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}
        {formError && (
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Type Switcher */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1.5">
              Transaction Category
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType('studio')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                  paymentType === 'studio'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                    : 'bg-charcoal-950 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                <span>Received (Studio Partner)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('editor')}
                className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer border ${
                  paymentType === 'editor'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                    : 'bg-charcoal-950 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
                <span>Paid Out (Video Editor)</span>
              </button>
            </div>
          </div>

          {/* Party Selection (Studio or Editor) */}
          {paymentType === 'studio' ? (
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Select Studio Partner *
              </label>
              <select
                value={selectedStudioId}
                onChange={(e) => setSelectedStudioId(e.target.value)}
                required
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
              >
                {studios.map(s => (
                  <option key={s.id} value={s.id}>{s.name} {s.ownerName ? `(${s.ownerName})` : ''}</option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1 flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-blue-400" /> Select Video Editor *
              </label>
              <select
                value={selectedEditorId}
                onChange={(e) => setSelectedEditorId(e.target.value)}
                required
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
              >
                {editors.map(ed => (
                  <option key={ed.id} value={ed.id}>{ed.name} {((ed as any).role) ? `(${(ed as any).role})` : ''}</option>
                ))}
              </select>
            </div>
          )}

          {/* Project Association (Optional / Recommended) */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <FolderKanban className="w-3.5 h-3.5 text-gold-400" /> Associate with Wedding Project
              </label>
              {selectedProjObj && remainingDueHint > 0 && (
                <span className="text-[10px] font-mono text-amber-300">
                  Remaining Due: ₹{remainingDueHint.toLocaleString('en-IN')}
                </span>
              )}
            </div>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                const pId = e.target.value;
                setSelectedProjectId(pId);
                const p = projects.find(proj => proj.id === pId);
                if (p && paymentType === 'studio') {
                  const sId = p.studioId || studios.find(s => s.name.toLowerCase() === p.studioName?.toLowerCase())?.id;
                  if (sId) setSelectedStudioId(sId);
                }
              }}
              className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
            >
              <option value="">None / General Ledger (Not linked to specific project)</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.coupleName || p.projectName} ({p.studioName || 'Studio'} • Total: ₹{(p.projectAmount || 0).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          {/* Amount & Quick Fill */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-[10px] font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-gold-400" /> Amount (INR) *
              </label>
              {remainingDueHint > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remainingDueHint)}
                  className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Fill Full Balance (₹{remainingDueHint.toLocaleString('en-IN')})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="E.g. 25000"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full pl-8 pr-3 py-2.5 bg-charcoal-950 border border-white/10 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-gold-500/50"
              />
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" /> Transaction Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS)</option>
                <option value="Cash">Cash Handover</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Received From (Payer / Studio Rep) - Only for studio payments */}
          {paymentType === 'studio' && (
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                Received From / Payer Name
              </label>
              <input
                type="text"
                placeholder="E.g. Satish Tiwari, Amit Verma, Studio Director..."
                value={receivedFrom}
                onChange={(e) => setReceivedFrom(e.target.value)}
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
              Transaction Notes / Ref ID
            </label>
            <textarea
              rows={2}
              placeholder="E.g. GPay Ref # 938102, Advance for teaser export..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
            />
          </div>

          {/* Submit Buttons */}
          <div className="pt-2 flex justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-charcoal-800 text-gray-300 text-xs font-medium rounded-2xl hover:bg-charcoal-700 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 text-charcoal-950 font-bold text-xs rounded-2xl hover:from-gold-500 hover:to-gold-400 transition-all cursor-pointer shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Saving to Firestore...' : editingPayment ? 'Update Record' : 'Save Payment Record'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
