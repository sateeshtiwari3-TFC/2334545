import React, { useState, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  Trash2, 
  Search, 
  IndianRupee, 
  Calendar, 
  Tag, 
  Filter, 
  X,
  TrendingUp,
  Plane,
  Camera,
  Users,
  Laptop,
  Building2,
  Coffee,
  HelpCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import { Expense } from '../../types';
import { 
  COMMON_EXPENSE_CATEGORIES, 
  calculateMonthlySpendByCategory, 
  normalizeExpenseCategory 
} from '../../utils/categoryPredictor';

interface LedgerExpensesTabProps {
  expenses: Expense[];
  onOpenExpenseModal: () => void;
  onDeleteExpense?: (id: string) => void;
}

export default function LedgerExpensesTab({
  expenses,
  onOpenExpenseModal,
  onDeleteExpense
}: LedgerExpensesTabProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Real-time Monthly Spend Counters per Category
  const monthlySummary = useMemo(() => {
    return calculateMonthlySpendByCategory(expenses, new Date());
  }, [expenses]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach(e => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [expenses]);

  const totalExpenseAmount = useMemo(() => {
    return expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [expenses]);

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

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (selectedCategory !== 'all') {
        const normalized = normalizeExpenseCategory(e.category);
        if (e.category !== selectedCategory && normalized !== selectedCategory) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (e.description || (e as any).title || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        const payee = ((e as any).payee || '').toLowerCase();
        const notes = ((e as any).notes || '').toLowerCase();
        return title.includes(q) || cat.includes(q) || payee.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [expenses, selectedCategory, search]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-900/90 p-5 rounded-3xl border border-rose-500/20 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Wallet className="w-5 h-5 text-rose-400" /> Studio Operating Expenses
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Log and track studio overheads, hardware rentals, software licenses, travel, and administrative costs.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono text-gray-300">
            Total Logged: <strong className="text-rose-400">₹{totalExpenseAmount.toLocaleString('en-IN')}</strong>
          </div>
          <button
            onClick={onOpenExpenseModal}
            className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Log New Expense</span>
          </button>
        </div>
      </div>

      {/* Monthly Spend Counter per Category Widget */}
      <div className="bg-charcoal-900/80 p-4 rounded-3xl border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Monthly Spend Counters ({monthlySummary.monthLabel})
            </h4>
          </div>
          <span className="text-xs font-mono text-gray-300">
            Monthly Outflow: <strong className="text-rose-400">₹{monthlySummary.totalMonthSpend.toLocaleString('en-IN')}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
          {COMMON_EXPENSE_CATEGORIES.map(cat => {
            const data = monthlySummary.byCategory[cat.id] || { total: 0, count: 0, percentage: 0 };
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(prev => prev === cat.id ? 'all' : cat.id)}
                className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-rose-500/20 border-rose-500 shadow-md ring-1 ring-rose-500/50'
                    : 'bg-charcoal-950/70 border-white/5 hover:border-rose-500/30 hover:bg-charcoal-800/50'
                }`}
              >
                <div className="flex items-center space-x-1.5 mb-1">
                  <span className={isSelected ? 'text-rose-400' : 'text-gray-400'}>
                    {getCategoryIcon(cat.id)}
                  </span>
                  <span className="text-[11px] font-semibold text-gray-200 truncate">{cat.shortLabel}</span>
                </div>
                <div>
                  <div className="text-xs font-bold font-mono text-white">
                    ₹{data.total.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono flex items-center justify-between mt-0.5">
                    <span>{data.count} {data.count === 1 ? 'item' : 'items'}</span>
                    {monthlySummary.totalMonthSpend > 0 && (
                      <span className="text-rose-400/80">{data.percentage}%</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-charcoal-900/80 rounded-2xl border border-white/5">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search expense description, payee, vendor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-charcoal-950 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono uppercase text-gray-400">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-charcoal-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-rose-500/40"
          >
            <option value="all">All Categories ({expenses.length})</option>
            {COMMON_EXPENSE_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
            {categories
              .filter(c => !COMMON_EXPENSE_CATEGORIES.some(k => k.id === c))
              .map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      {filteredExpenses.length > 0 ? (
        <div className="bg-charcoal-900/90 rounded-3xl border border-luxury-green-800/20 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase font-mono text-[10px] bg-charcoal-950/60">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Expense Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Payee / Vendor</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {filteredExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4 font-mono text-gray-400">{exp.date}</td>
                    <td className="py-3 px-4 font-bold text-white">
                      {exp.description || (exp as any).title || 'Expense'}
                      {(exp as any).notes && (
                        <span className="block text-[10px] text-gray-500 font-normal italic mt-0.5">{(exp as any).notes}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20 text-[10px] font-mono">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{(exp as any).payee || '-'}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-400 font-mono text-sm">
                      - ₹{(exp.amount || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {onDeleteExpense && (
                        <button
                          onClick={() => onDeleteExpense(exp.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Delete Expense Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-charcoal-950/40 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center p-6">
          <Wallet className="w-8 h-8 text-rose-400/60 mb-2" />
          <h4 className="text-sm font-bold text-white">No Operating Expenses Found</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            {search || selectedCategory !== 'all' 
              ? 'No expenses matched your filter criteria.' 
              : 'Click "+ Log New Expense" to record utility bills, equipment rentals, travel, or software subscriptions.'}
          </p>
        </div>
      )}
    </div>
  );
}
