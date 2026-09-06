import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Wallet, 
  IndianRupee, 
  Calendar, 
  Tag, 
  User, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Plane,
  Camera,
  Users,
  Laptop,
  Building2,
  Coffee,
  HelpCircle,
  TrendingUp,
  Check,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Expense } from '../../types';
import { 
  COMMON_EXPENSE_CATEGORIES,
  suggestCategoriesFromTitle,
  calculateMonthlySpendByCategory,
  normalizeExpenseCategory
} from '../../utils/categoryPredictor';
import { db } from '../../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface ExpenseRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense?: (expense: Omit<Expense, 'id'>) => Promise<void>;
  expenses?: Expense[];
}

export default function ExpenseRecordModal({
  isOpen,
  onClose,
  onAddExpense,
  expenses = []
}: ExpenseRecordModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Operating Cost');
  const [amount, setAmount] = useState<number | ''>('');
  const [payee, setPayee] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  
  // Local fallback if expenses prop is empty
  const [internalExpenses, setInternalExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (expenses && expenses.length > 0) {
      setInternalExpenses(expenses);
      return;
    }

    // Subscribe to firestore expenses if not passed via props
    try {
      const unsub = onSnapshot(collection(db, 'expenses'), (snap) => {
        const loaded: Expense[] = [];
        snap.forEach((doc) => {
          loaded.push({ id: doc.id, ...doc.data() } as Expense);
        });
        setInternalExpenses(loaded);
      }, (err) => {
        console.warn('Expense modal firestore subscription fallback failed:', err);
      });
      return () => unsub();
    } catch (e) {
      console.warn('Could not initialize firestore listener for expenses in modal:', e);
    }
  }, [isOpen, expenses]);

  const handleResetForm = () => {
    setTitle('');
    setCategory('Operating Cost');
    setAmount('');
    setPayee('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMode('UPI');
    setNotes('');
    setFormError('');
    setFormSuccess('');
  };

  const activeExpensesList = (expenses && expenses.length > 0) ? expenses : internalExpenses;

  // Real-time Monthly Spend Counter per Category
  const monthlySummary = useMemo(() => {
    return calculateMonthlySpendByCategory(activeExpensesList, date);
  }, [activeExpensesList, date]);

  // Dynamic Suggestion based on Title and Payee
  const categorySuggestions = useMemo(() => {
    return suggestCategoriesFromTitle(title, payee);
  }, [title, payee]);

  const primarySuggestion = categorySuggestions.primary;

  // Get normalized category for active selection
  const selectedNormalizedCategory = useMemo(() => {
    return normalizeExpenseCategory(category);
  }, [category]);

  const currentCategoryData = monthlySummary.byCategory[selectedNormalizedCategory] || {
    total: 0,
    count: 0,
    percentage: 0
  };

  const getCategoryIcon = (catId: string) => {
    switch (catId) {
      case 'Travel':
        return <Plane className="w-3.5 h-3.5" />;
      case 'Equipment':
        return <Camera className="w-3.5 h-3.5" />;
      case 'Freelance Pay':
        return <Users className="w-3.5 h-3.5" />;
      case 'Software & Licenses':
        return <Laptop className="w-3.5 h-3.5" />;
      case 'Studio Rent & Utilities':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'Food & Refreshments':
        return <Coffee className="w-3.5 h-3.5" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5" />;
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!title.trim()) {
      setFormError('Please enter an expense title / description.');
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setFormError('Please enter a valid expense amount greater than ₹0.');
      return;
    }

    if (!onAddExpense) {
      setFormError('Expense logging is not supported in current mode.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddExpense({
        description: title.trim(),
        title: title.trim(),
        category,
        amount: Number(amount),
        date,
        paidBy: payee.trim() || 'Studio Admin',
        payee: payee.trim() || 'Studio Admin',
        paymentMethod: paymentMode,
        notes: notes.trim() || undefined,
        status: 'PAID'
      } as any);

      setFormSuccess('Operating expense logged successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        setTitle('');
        setAmount('');
        setPayee('');
        setNotes('');
        onClose();
      }, 750);
    } catch (err: any) {
      console.error('Failed to log expense:', err);
      setFormError(err?.message || 'Failed to save expense record.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-xl bg-charcoal-900 border border-rose-500/30 rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shadow-md shadow-rose-900/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Log Studio Expense</h3>
              <p className="text-xs text-gray-400">Record equipment rental, software licenses, travel, or overheads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {formSuccess && (
          <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{formSuccess}</span>
          </div>
        )}
        {formError && (
          <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center space-x-2 animate-fadeIn">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title / Description */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
              Expense Description / Purpose *
            </label>
            <input
              type="text"
              placeholder="E.g. Uber cab to Udaipur shoot, SanDisk 2TB SSD, Freelance editor cut..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500/60 transition-all placeholder:text-gray-600"
            />

            {/* Smart Category Suggestion Badge from Title */}
            <AnimatePresence>
              {primarySuggestion && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mt-2 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="p-1 rounded-lg bg-rose-500/20 text-rose-400 shrink-0">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                    </div>
                    <span className="text-gray-300 text-xs truncate">
                      Suggested Category: <strong className="text-white font-semibold">{primarySuggestion.category}</strong>
                      <span className="text-[10px] text-gray-400 ml-1.5 font-mono hidden sm:inline">
                        (Matched &quot;{primarySuggestion.matchedKeyword}&quot;)
                      </span>
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setCategory(primarySuggestion.category)}
                    className="px-3 py-1 bg-rose-500 hover:bg-rose-400 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-md"
                  >
                    {category === primarySuggestion.category ? (
                      <>
                        <Check className="w-3 h-3 text-white" />
                        <span>Applied</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Apply {primarySuggestion.category}</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Interactive Common Categories Selector with Monthly Spend Counters */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-mono uppercase text-gray-400 tracking-wider flex items-center gap-1.5">
                <Tag className="w-3 h-3 text-rose-400" /> Category &amp; Monthly Spend
              </label>
              <span className="text-[10px] font-mono text-gray-400 flex items-center gap-1">
                <span>Month:</span>
                <span className="text-rose-400 font-bold">{monthlySummary.monthLabel}</span>
              </span>
            </div>

            {/* Quick Category Chips with Real-time Monthly Spend Counter per Category */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {COMMON_EXPENSE_CATEGORIES.map((cat) => {
                const catSpend = monthlySummary.byCategory[cat.id]?.total || 0;
                const isSelected = selectedNormalizedCategory === cat.id;
                const isSuggested = primarySuggestion?.category === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`p-2 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500/80 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/50'
                        : isSuggested
                        ? 'bg-charcoal-950 border-rose-500/50 hover:border-rose-400/80 hover:bg-rose-500/10'
                        : 'bg-charcoal-950/80 border-white/5 hover:border-white/20 hover:bg-charcoal-800/60'
                    }`}
                  >
                    {/* Suggested Indicator Pill */}
                    {isSuggested && !isSelected && (
                      <div className="absolute top-1.5 right-1.5 flex items-center space-x-0.5 text-[9px] font-mono text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded-full border border-rose-500/30">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Match</span>
                      </div>
                    )}

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 text-rose-400">
                        <Check className="w-3 h-3" />
                      </div>
                    )}

                    <div className="flex items-center space-x-1.5 mb-1 text-gray-200 group-hover:text-white">
                      <span className={`${isSelected ? 'text-rose-400' : 'text-gray-400 group-hover:text-rose-400'}`}>
                        {getCategoryIcon(cat.id)}
                      </span>
                      <span className="text-[11px] font-semibold truncate">{cat.shortLabel}</span>
                    </div>

                    {/* Monthly Spend Counter */}
                    <div className="flex items-baseline justify-between pt-1 border-t border-white/5">
                      <span className="text-[9px] text-gray-400 font-mono">This Month:</span>
                      <span className={`text-[10px] font-mono font-bold ${catSpend > 0 ? 'text-rose-300' : 'text-gray-400'}`}>
                        ₹{catSpend.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Standard Dropdown for custom or legacy categories */}
            <div className="pt-1">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full py-2 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-gray-300 focus:outline-none focus:border-rose-500/50"
              >
                <option value="Travel">Travel (Flights, Cabs, Outstation &amp; Fuel)</option>
                <option value="Equipment">Equipment (Cameras, Lenses, SSDs, Hard Disks &amp; Gear)</option>
                <option value="Freelance Pay">Freelance Pay (Freelancer Editors, Colorists &amp; Crew)</option>
                <option value="Software & Licenses">Software &amp; Licenses (Adobe CC, Cloud Storage &amp; Tools)</option>
                <option value="Studio Rent & Utilities">Studio Rent &amp; Utilities (Rent, Electricity &amp; Broadband)</option>
                <option value="Food & Refreshments">Food &amp; Refreshments (Shoot Meals, Tea &amp; Snacks)</option>
                <option value="Operating Cost">Operating Cost / Utilities (Legacy)</option>
                <option value="Miscellaneous">Miscellaneous (Courier, Printing &amp; General)</option>
              </select>
            </div>
          </div>

          {/* Monthly Spend Counter Card for Selected Category */}
          <div className="p-3 bg-charcoal-950 border border-rose-500/20 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold shrink-0">
                {getCategoryIcon(selectedNormalizedCategory)}
              </div>
              <div>
                <div className="text-[10px] font-mono text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span>{monthlySummary.monthLabel} Total Spend in</span>
                  <span className="text-rose-400 font-bold">{selectedNormalizedCategory}</span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1 font-mono">
                  <span>₹{currentCategoryData.total.toLocaleString('en-IN')}</span>
                  <span className="text-[11px] font-normal text-gray-400 ml-1">
                    ({currentCategoryData.count} {currentCategoryData.count === 1 ? 'entry' : 'entries'})
                  </span>
                </div>
              </div>
            </div>

            {/* Projected Spend with New Amount */}
            {amount && Number(amount) > 0 && (
              <div className="sm:border-l border-white/10 sm:pl-3 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                <span className="text-[10px] font-mono text-gray-400 uppercase">Projected Total:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  ₹{(currentCategoryData.total + Number(amount)).toLocaleString('en-IN')}
                  <span className="text-[10px] text-gray-400 ml-1 font-normal font-sans">
                    (+₹{Number(amount).toLocaleString('en-IN')})
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1 flex items-center gap-1">
                <IndianRupee className="w-3 h-3 text-rose-400" /> Amount (INR) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="E.g. 4500"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                required
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs font-bold text-white focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" /> Expense Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500/50"
              />
            </div>
          </div>

          {/* Payee & Payment Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1 flex items-center gap-1">
                <User className="w-3 h-3 text-gray-400" /> Payee / Vendor
              </label>
              <input
                type="text"
                placeholder="E.g. Indigo Airlines, SanDisk Store, Vansh..."
                value={payee}
                onChange={(e) => setPayee(e.target.value)}
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500/50"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500/50"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                <option value="Bank Transfer">Bank Transfer (IMPS / NEFT)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Cash">Cash</option>
                <option value="Studio Cheque">Studio Cheque</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
              Invoice Ref / Additional Notes
            </label>
            <textarea
              rows={2}
              placeholder="E.g. Invoice # 2026-0881, Paid via Studio GPay, for Goa Destination Wedding..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500/50 resize-none"
            />
          </div>

          {/* Monthly Total Outflow Banner */}
          <div className="p-2.5 bg-charcoal-950/60 rounded-2xl border border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-gray-400">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px]">Total Studio Outflow ({monthlySummary.monthLabel}):</span>
            </div>
            <span className="font-mono font-bold text-gray-200">
              ₹{monthlySummary.totalMonthSpend.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="pt-2 flex justify-between items-center border-t border-white/10">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-charcoal-800 text-gray-300 text-xs font-medium rounded-2xl hover:bg-charcoal-700 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetForm}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-charcoal-900 hover:bg-sky-500/20 text-gray-400 hover:text-sky-300 border border-white/10 hover:border-sky-500/30 rounded-2xl text-xs font-mono transition-all cursor-pointer"
                title="Reset form fields"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-bold text-xs rounded-2xl hover:from-rose-500 hover:to-rose-400 transition-all cursor-pointer shadow-lg disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Saving...</span>
              ) : (
                <>
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Save Expense</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

