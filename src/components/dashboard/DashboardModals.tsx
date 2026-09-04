import React from 'react';
import { 
  X, 
  IndianRupee, 
  CheckCircle, 
  Building2, 
  User, 
  Film, 
  Calendar, 
  AlertCircle, 
  Sparkles,
  ExternalLink,
  MessageSquare,
  Clock
} from 'lucide-react';
import { Project, Studio, Editor, PaymentHistory } from '../../types';

interface DashboardModalsProps {
  // Payment Modal props
  isPaymentModalOpen: boolean;
  onClosePaymentModal: () => void;
  paymentType: 'studio' | 'editor';
  setPaymentType: (type: 'studio' | 'editor') => void;
  selectedStudioIdToPay: string;
  setSelectedStudioIdToPay: (id: string) => void;
  selectedEditorIdToPay: string;
  setSelectedEditorIdToPay: (id: string) => void;
  selectedProjectIdToPay: string;
  setSelectedProjectIdToPay: (id: string) => void;
  paymentAmount: number;
  setPaymentAmount: (amount: number) => void;
  paymentDate: string;
  setPaymentDate: (date: string) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  paymentNotes: string;
  setPaymentNotes: (notes: string) => void;
  isSubmittingPayment: boolean;
  paymentSuccess: string;
  paymentError: string;
  onSubmitPayment: (e: React.FormEvent) => Promise<void>;
  studios: Studio[];
  editors: Editor[];
  projects: Project[];
  payments: PaymentHistory[];

  // Inspector Modal props
  selectedInspectItem: { type: 'project' | 'studio' | 'editor'; data: any } | null;
  onCloseInspectModal: () => void;
  onNavigateTab?: (tab: string, subAction?: string) => void;
}

export default function DashboardModals({
  isPaymentModalOpen,
  onClosePaymentModal,
  paymentType,
  setPaymentType,
  selectedStudioIdToPay,
  setSelectedStudioIdToPay,
  selectedEditorIdToPay,
  setSelectedEditorIdToPay,
  selectedProjectIdToPay,
  setSelectedProjectIdToPay,
  paymentAmount,
  setPaymentAmount,
  paymentDate,
  setPaymentDate,
  paymentMethod,
  setPaymentMethod,
  paymentNotes,
  setPaymentNotes,
  isSubmittingPayment,
  paymentSuccess,
  paymentError,
  onSubmitPayment,
  studios,
  editors,
  projects,
  payments,
  selectedInspectItem,
  onCloseInspectModal,
  onNavigateTab
}: DashboardModalsProps) {
  return (
    <>
      {/* 1. Payment Modal */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-b from-charcoal-900 to-charcoal-950 border border-gold-500/30 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={onClosePaymentModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-gold-500/10 border border-gold-500/20 text-gold-400">
                <IndianRupee className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-display">Record Financial Transaction</h3>
                <p className="text-xs text-gray-400">Log incoming studio payments or editor wage disbursements.</p>
              </div>
            </div>

            {paymentSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{paymentSuccess}</span>
              </div>
            )}

            {paymentError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <form onSubmit={onSubmitPayment} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setPaymentType('studio')}
                  className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    paymentType === 'studio'
                      ? 'bg-gold-500 text-charcoal-950 shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Studio Receipt (Inflow)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentType('editor')}
                  className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                    paymentType === 'editor'
                      ? 'bg-sky-500 text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Editor Wage (Outflow)
                </button>
              </div>

              {/* Entity Selector */}
              {paymentType === 'studio' ? (
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">Select Studio Partner</label>
                  <select
                    value={selectedStudioIdToPay}
                    onChange={(e) => setSelectedStudioIdToPay(e.target.value)}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 focus:outline-none"
                    required
                  >
                    <option value="">Choose Studio...</option>
                    {studios.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.ownerName || 'Partner'})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">Select Video Editor</label>
                  <select
                    value={selectedEditorIdToPay}
                    onChange={(e) => setSelectedEditorIdToPay(e.target.value)}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                    required
                  >
                    <option value="">Choose Editor...</option>
                    {editors.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({(e as any).specialty || 'Cinematic'})</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">Amount (₹ INR)</label>
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    placeholder="e.g. 25000"
                    min="1"
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-300 mb-1">Transaction Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">Payment Channel</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 focus:outline-none"
                >
                  <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                  <option value="Bank NEFT / IMPS Transfer">Bank NEFT / IMPS Transfer</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-mono text-gray-300 mb-1">Transaction Remarks</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Advance for Wedding Teaser"
                  className="w-full bg-charcoal-800 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:border-gold-500 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs shadow-lg uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingPayment ? 'Saving Record...' : 'Confirm & Log Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Inspector Modal */}
      {selectedInspectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gradient-to-b from-charcoal-900 to-charcoal-950 border border-luxury-green-700/50 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              onClick={onCloseInspectModal}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-2 rounded-full hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Film className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-gold-400">Project Inspector</span>
                <h3 className="text-xl font-bold text-white font-display">
                  {selectedInspectItem.data.coupleName || selectedInspectItem.data.name || 'Wedding Film Details'}
                </h3>
              </div>
            </div>

            <div className="space-y-3 font-mono text-xs text-gray-300">
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
                <span className="text-gray-400">Studio:</span>
                <span className="font-bold text-white">{selectedInspectItem.data.studioName || 'Direct'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
                <span className="text-gray-400">Assigned Editor:</span>
                <span className="font-bold text-gold-300">{selectedInspectItem.data.assignedEditorName || 'Unassigned'}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
                <span className="text-gray-400">Status:</span>
                <span className="font-bold text-emerald-400 capitalize">{selectedInspectItem.data.status?.replace('_', ' ')}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
                <span className="text-gray-400">Contract Amount:</span>
                <span className="font-bold text-white">₹{(selectedInspectItem.data.projectAmount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
                <span className="text-gray-400">Advance Paid:</span>
                <span className="font-bold text-emerald-400">₹{(selectedInspectItem.data.advancePayment || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between">
                <span className="text-gray-400">Delivery Deadline:</span>
                <span className="font-bold text-amber-300">{selectedInspectItem.data.deliveryDate || 'Not set'}</span>
              </div>
            </div>

            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => {
                  onCloseInspectModal();
                  if (onNavigateTab) onNavigateTab('projects');
                }}
                className="flex-1 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Go to Projects View
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
