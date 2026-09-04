import React from 'react';
import { IndianRupee, Lock, Calendar, CreditCard, PieChart, TrendingUp, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types';

interface IntakeTabFinanceProps {
  projectAmount: number;
  setProjectAmount: (val: number) => void;
  editorPayment: number;
  setEditorPayment: (val: number) => void;
  otherExpenses: number;
  setOtherExpenses: (val: number) => void;
  advancePayment: number;
  setAdvancePayment: (val: number) => void;
  paymentMode: string;
  setPaymentMode: (val: string) => void;
  paymentDueDate: string;
  setPaymentDueDate: (val: string) => void;
  userRole: UserRole;
  calculatedRemainingBalance: number;
  estimatedProfitMargin: number;
}

export default function IntakeTabFinance({
  projectAmount,
  setProjectAmount,
  editorPayment,
  setEditorPayment,
  otherExpenses,
  setOtherExpenses,
  advancePayment,
  setAdvancePayment,
  paymentMode,
  setPaymentMode,
  paymentDueDate,
  setPaymentDueDate,
  userRole,
  calculatedRemainingBalance,
  estimatedProfitMargin
}: IntakeTabFinanceProps) {

  // Auto preset for advance percentage
  const setAdvancePercent = (pct: number) => {
    if (projectAmount > 0) {
      setAdvancePayment(Math.round((projectAmount * pct) / 100));
    }
  };

  const advancePercentage = projectAmount > 0 ? Math.round((advancePayment / projectAmount) * 100) : 0;
  const totalCost = editorPayment + otherExpenses;
  const marginPercentage = projectAmount > 0 ? Math.round((estimatedProfitMargin / projectAmount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
            💰
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">Step 3: Financial Ledger & Billing</h4>
            <p className="text-xs text-gray-400 font-mono">Input project contract pricing, editor compensation, expenses, and advance payment breakdown.</p>
          </div>
        </div>
      </div>

      {userRole === 'studio' ? (
        <div className="p-8 bg-charcoal-900/60 border border-white/5 rounded-3xl text-sm font-mono text-gray-400 flex flex-col items-center justify-center space-y-3 text-center">
          <div className="w-12 h-12 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white font-display">Financials Restricted</h4>
          <p className="max-w-md text-xs text-gray-400">
            Financial ledger, client contract billing, and editor compensation metrics are encrypted and locked for non-administrative studio accounts.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main 4 Figures */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-charcoal-900/80 rounded-2xl border border-white/10 space-y-2">
              <label className="block text-[11px] font-mono font-bold text-gold-400 uppercase tracking-wider">
                Total Contract ₹ <span className="text-gold-300">*</span>
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="0"
                  value={projectAmount || ''} 
                  onChange={(e) => setProjectAmount(Number(e.target.value))} 
                  className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-base text-white font-bold focus:outline-none focus:border-gold-500/60 font-mono" 
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500 block">Gross project billing</span>
            </div>

            <div className="p-4 bg-charcoal-900/80 rounded-2xl border border-white/10 space-y-2">
              <label className="block text-[11px] font-mono font-bold text-sky-400 uppercase tracking-wider">
                Editor Comp ₹
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="0"
                  value={editorPayment || ''} 
                  onChange={(e) => setEditorPayment(Number(e.target.value))} 
                  className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-base text-white font-bold focus:outline-none focus:border-sky-500/60 font-mono" 
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500 block">Total editor wages</span>
            </div>

            <div className="p-4 bg-charcoal-900/80 rounded-2xl border border-white/10 space-y-2">
              <label className="block text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                Other Expenses ₹
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="0"
                  value={otherExpenses || ''} 
                  onChange={(e) => setOtherExpenses(Number(e.target.value))} 
                  className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-base text-white font-bold focus:outline-none focus:border-amber-500/60 font-mono" 
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500 block">Travel, LUTs, assets, disk</span>
            </div>

            <div className="p-4 bg-charcoal-900/80 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Advance Paid ₹
                </label>
                {projectAmount > 0 && (
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">{advancePercentage}%</span>
                )}
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  placeholder="0"
                  value={advancePayment || ''} 
                  onChange={(e) => setAdvancePayment(Number(e.target.value))} 
                  className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-base text-white font-bold focus:outline-none focus:border-emerald-500/60 font-mono" 
                />
              </div>
              
              {/* Advance Quick Preset Buttons */}
              {projectAmount > 0 && (
                <div className="flex gap-1 pt-1">
                  {[25, 40, 50, 100].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setAdvancePercent(pct)}
                      className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-charcoal-950 text-gray-400 hover:text-white border border-white/5 hover:border-emerald-500/40"
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Payment Method & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-charcoal-900/60 rounded-2xl border border-white/5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                Advance Payment Method
              </label>
              <div className="relative">
                <CreditCard className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                <select 
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value)} 
                  className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-gold-500/50 cursor-pointer font-mono"
                >
                  <option value="UPI">⚡ UPI / GPay / PhonePe / Paytm</option>
                  <option value="Bank Transfer">🏦 Bank Transfer (NEFT/IMPS/RTGS)</option>
                  <option value="Cash">💵 Cash In Hand</option>
                  <option value="Cheque">📜 Bank Cheque</option>
                  <option value="Credit Card">💳 Credit / Debit Card</option>
                  <option value="Pending">⏳ Payment Pending (Not yet received)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
                Remaining Balance Due Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
                <input 
                  type="date" 
                  value={paymentDueDate} 
                  onChange={(e) => setPaymentDueDate(e.target.value)} 
                  className="w-full bg-charcoal-950 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-gold-500/50 cursor-pointer font-mono"
                />
              </div>
            </div>
          </div>

          {/* Real-time Ledger Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-gradient-to-br from-charcoal-900/90 to-charcoal-950 rounded-2xl border border-gold-500/20 font-mono shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold-500/5 rounded-bl-full pointer-events-none" />
            
            <div className="space-y-1">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Collection Balance Due</span>
              </span>
              <strong className="text-xl md:text-2xl font-bold text-gold-400 block pt-1">
                ₹{calculatedRemainingBalance.toLocaleString('en-IN')}
              </strong>
              <span className="text-[10px] text-gray-500">
                {advancePayment > 0 ? `₹${advancePayment.toLocaleString('en-IN')} advance received` : 'Zero advance received'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span>Total Production Cost</span>
              </span>
              <strong className="text-xl md:text-2xl font-bold text-gray-200 block pt-1">
                ₹{totalCost.toLocaleString('en-IN')}
              </strong>
              <span className="text-[10px] text-gray-500">
                ₹{editorPayment.toLocaleString('en-IN')} editor + ₹{otherExpenses.toLocaleString('en-IN')} other
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${estimatedProfitMargin >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                <span>Estimated Net Profit</span>
              </span>
              <strong className={`text-xl md:text-2xl font-bold block pt-1 ${estimatedProfitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ₹{estimatedProfitMargin.toLocaleString('en-IN')}
              </strong>
              <span className="text-[10px] text-gray-500">
                {marginPercentage}% of total billing
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
