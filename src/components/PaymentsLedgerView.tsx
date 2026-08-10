import React, { useState, useMemo } from 'react';
import { 
  IndianRupee, 
  Plus, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  Download, 
  Printer, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  X, 
  Building2, 
  Laptop, 
  FileText, 
  DollarSign, 
  Wallet,
  Sparkles,
  CreditCard,
  User,
  Clock,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PaymentHistory, Project, Studio, Editor, Expense } from '../types';

interface PaymentsLedgerViewProps {
  payments: PaymentHistory[];
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  expenses?: Expense[];
  userRole?: string;
  onLogPayment: (payment: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
  onUpdatePayment: (id: string, updates: Partial<PaymentHistory>) => Promise<void>;
  onDeletePayment: (id: string) => Promise<void>;
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
}

export default function PaymentsLedgerView({
  payments = [],
  projects = [],
  studios = [],
  editors = [],
  expenses = [],
  userRole = 'admin',
  onLogPayment,
  onUpdatePayment,
  onDeletePayment,
  onUpdateProject
}: PaymentsLedgerViewProps) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'received' | 'paid'>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [selectedStudioFilter, setSelectedStudioFilter] = useState<string>('all');
  
  // Modal states
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentHistory | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<PaymentHistory | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);

  // Form states for modal
  const [paymentType, setPaymentType] = useState<'studio' | 'editor'>('studio');
  const [selectedStudioId, setSelectedStudioId] = useState('');
  const [selectedEditorId, setSelectedEditorId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [notes, setNotes] = useState('');
  const [receivedFrom, setReceivedFrom] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Open modal for recording new payment
  const handleOpenRecordModal = (type: 'studio' | 'editor' = 'studio') => {
    setEditingPayment(null);
    setPaymentType(type);
    setSelectedStudioId(studios[0]?.id || '');
    setSelectedEditorId(editors[0]?.id || '');
    setSelectedProjectId('');
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('UPI');
    setNotes('');
    setReceivedFrom('');
    setFormError('');
    setFormSuccess('');
    setIsRecordModalOpen(true);
  };

  // Open modal for editing existing payment
  const handleOpenEditModal = (pay: PaymentHistory) => {
    setEditingPayment(pay);
    setPaymentType(pay.entityType);
    if (pay.entityType === 'studio') {
      setSelectedStudioId(pay.entityId);
    } else {
      setSelectedEditorId(pay.entityId);
    }
    setSelectedProjectId(pay.projectId || '');
    setAmount(pay.amount);
    setDate(pay.date || new Date().toISOString().split('T')[0]);
    setPaymentMethod(pay.paymentMethod || 'UPI');
    setNotes(pay.notes || '');
    setReceivedFrom(pay.receivedFrom || '');
    setFormError('');
    setFormSuccess('');
    setIsRecordModalOpen(true);
  };

  // Handle Submit (Create or Update)
  const handleSubmitPayment = async (e: React.FormEvent) => {
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
        setIsRecordModalOpen(false);
        setIsSubmitting(false);
        setEditingPayment(null);
      }, 1000);

    } catch (err: any) {
      console.error('Failed to save payment:', err);
      setFormError(err?.message || 'Failed to record payment transaction.');
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deletingPaymentId) return;
    try {
      const targetPay = payments.find(p => p.id === deletingPaymentId);
      await onDeletePayment(deletingPaymentId);

      if (targetPay && targetPay.projectId && targetPay.projectId !== 'general_ledger' && targetPay.entityType === 'studio' && onUpdateProject) {
        const remainingPayments = payments.filter(p => p.id !== deletingPaymentId && p.projectId === targetPay.projectId && p.entityType === 'studio');
        const proj = projects.find(p => p.id === targetPay.projectId);
        if (proj) {
          const newAdvance = remainingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
          const newRemaining = Math.max(0, (proj.projectAmount || 0) - newAdvance);
          await onUpdateProject(proj.id, {
            advancePayment: newAdvance,
            remainingBalance: newRemaining
          });
        }
      }

      setDeletingPaymentId(null);
    } catch (err: any) {
      alert('Failed to delete payment: ' + (err?.message || String(err)));
    }
  };

  // Financial Metrics
  const metrics = useMemo(() => {
    let totalReceived = 0;
    let totalPaidOut = 0;

    payments.forEach(p => {
      const amt = Number(p.amount) || 0;
      if (p.entityType === 'studio') {
        totalReceived += amt;
      } else {
        totalPaidOut += amt;
      }
    });

    // Add manual office expenses to total paid out
    expenses.forEach(e => {
      totalPaidOut += Number(e.amount) || 0;
    });

    const netBalance = totalReceived - totalPaidOut;

    return {
      totalReceived,
      totalPaidOut,
      netBalance,
      count: payments.length
    };
  }, [payments, expenses]);

  // Filtered Payments List
  const filteredPayments = useMemo(() => {
    return payments.filter(pay => {
      // Type filter
      if (filterType === 'received' && pay.entityType !== 'studio') return false;
      if (filterType === 'paid' && pay.entityType !== 'editor') return false;

      // Method filter
      if (filterMethod !== 'all' && pay.paymentMethod !== filterMethod) return false;

      // Studio filter
      if (selectedStudioFilter !== 'all' && pay.entityId !== selectedStudioFilter) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studioObj = studios.find(s => s.id === pay.entityId);
        const editorObj = editors.find(e => e.id === pay.entityId);

        const matchCouple = pay.projectCoupleName?.toLowerCase().includes(q);
        const matchNotes = pay.notes?.toLowerCase().includes(q);
        const matchPayer = pay.receivedFrom?.toLowerCase().includes(q);
        const matchStudio = studioObj?.name.toLowerCase().includes(q);
        const matchEditor = editorObj?.name.toLowerCase().includes(q);
        const matchMethod = pay.paymentMethod?.toLowerCase().includes(q);
        const matchAmount = pay.amount?.toString().includes(q);

        if (!matchCouple && !matchNotes && !matchPayer && !matchStudio && !matchEditor && !matchMethod && !matchAmount) {
          return false;
        }
      }

      return true;
    });
  }, [payments, filterType, filterMethod, selectedStudioFilter, searchQuery, studios, editors]);

  // Export CSV function
  const handleExportCSV = () => {
    const headers = ['ID', 'Type', 'Entity Name', 'Project', 'Amount (INR)', 'Date', 'Payment Method', 'Payer/Ref', 'Notes'];
    const rows = filteredPayments.map(p => {
      const isReceived = p.entityType === 'studio';
      const entity = isReceived 
        ? (studios.find(s => s.id === p.entityId)?.name || 'Studio Partner')
        : (editors.find(e => e.id === p.entityId)?.name || 'Video Editor');

      return [
        p.id,
        isReceived ? 'Received (Studio)' : 'Paid Out (Editor)',
        `"${entity}"`,
        `"${p.projectCoupleName || 'Wedding Film'}"`,
        p.amount,
        p.date,
        p.paymentMethod || 'UPI',
        `"${p.receivedFrom || '-'}"`,
        `"${(p.notes || '').replace(/"/g, '""')}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `framecut_payment_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-charcoal-900 via-charcoal-900/90 to-luxury-green-950 p-6 rounded-3xl border border-luxury-green-800/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gold-500/20 to-gold-600/10 border border-gold-500/30 flex items-center justify-center text-gold-400 shadow-inner">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">
                Payment History & Ledger System
                <span className="text-[10px] font-mono bg-gold-500/10 text-gold-400 border border-gold-500/20 px-2 py-0.5 rounded-full font-normal">
                  Live Firestore Sync
                </span>
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Complete record of all incoming studio collections, advance receipts, and editor payout disbursements.
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-200 border border-white/10 font-medium text-xs flex items-center space-x-2 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-gray-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenRecordModal('studio')}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs flex items-center space-x-2 shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer gold-glow"
          >
            <Plus className="w-4 h-4 text-charcoal-950" />
            <span>+ Record New Payment</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Received */}
        <div className="p-5 rounded-3xl bg-charcoal-900/80 border border-emerald-500/20 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-emerald-400 font-semibold tracking-wider flex items-center gap-1.5">
              <ArrowDownLeft className="w-4 h-4" /> Studio Collections
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-sans text-white tracking-tight">
              ₹{metrics.totalReceived.toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              Total incoming receipts stored
            </p>
          </div>
        </div>

        {/* Card 2: Total Paid Out */}
        <div className="p-5 rounded-3xl bg-charcoal-900/80 border border-amber-500/20 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-amber-400 font-semibold tracking-wider flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4" /> Editor Payouts & Expenses
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-sans text-white tracking-tight">
              ₹{metrics.totalPaidOut.toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              Total outgoing payments made
            </p>
          </div>
        </div>

        {/* Card 3: Net Cash Balance */}
        <div className="p-5 rounded-3xl bg-charcoal-900/80 border border-gold-500/30 shadow-lg relative overflow-hidden group gold-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-gold-400 font-semibold tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Net Studio Balance
            </span>
            <div className="w-8 h-8 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold font-sans tracking-tight ${metrics.netBalance >= 0 ? 'text-gold-300' : 'text-red-400'}`}>
              ₹{metrics.netBalance.toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              Current net operating cashflow
            </p>
          </div>
        </div>

        {/* Card 4: Total Logged Entries */}
        <div className="p-5 rounded-3xl bg-charcoal-900/80 border border-white/10 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono uppercase text-gray-300 font-semibold tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Stored Ledger Logs
            </span>
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold font-sans text-white tracking-tight">
              {metrics.count} <span className="text-xs font-normal text-gray-400 font-mono">Records</span>
            </span>
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              Persisted in Firestore database
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="p-5 rounded-3xl glass-panel border border-luxury-green-800/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search couple name, studio, editor, notes, or method..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-charcoal-950/80 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Type Filter Pills */}
          <div className="flex items-center p-1 bg-charcoal-950 rounded-2xl border border-white/10 self-start md:self-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                filterType === 'all'
                  ? 'bg-gradient-to-r from-gold-600 to-gold-500 text-charcoal-950 font-bold shadow'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              All Payments ({payments.length})
            </button>
            <button
              onClick={() => setFilterType('received')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1 ${
                filterType === 'received'
                  ? 'bg-emerald-500 text-charcoal-950 font-bold shadow'
                  : 'text-gray-400 hover:text-emerald-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Received</span>
            </button>
            <button
              onClick={() => setFilterType('paid')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1 ${
                filterType === 'paid'
                  ? 'bg-amber-500 text-charcoal-950 font-bold shadow'
                  : 'text-gray-400 hover:text-amber-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Paid Out</span>
            </button>
          </div>
        </div>

        {/* Secondary Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-white/5 text-xs text-gray-400">
          <span className="font-mono text-[10px] uppercase text-gold-400/80 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Quick Filters:
          </span>

          {/* Payment Method Select */}
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="bg-charcoal-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/40"
          >
            <option value="all">All Payment Methods</option>
            <option value="UPI">UPI / GPay / PhonePe</option>
            <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
            <option value="Cash">Cash Handover</option>
            <option value="Cheque">Cheque</option>
          </select>

          {/* Studio Filter Select */}
          <select
            value={selectedStudioFilter}
            onChange={(e) => setSelectedStudioFilter(e.target.value)}
            className="bg-charcoal-950 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-gold-500/40"
          >
            <option value="all">All Studio Partners</option>
            {studios.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Active count badge */}
          <span className="ml-auto text-[11px] font-mono text-gray-400">
            Showing <strong className="text-gold-400">{filteredPayments.length}</strong> of {payments.length} stored records
          </span>
        </div>
      </div>

      {/* Main Payment History Table */}
      <div className="p-6 rounded-3xl glass-panel border border-luxury-green-800/10 shadow-2xl">
        {filteredPayments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                  <th className="pb-3 pl-2">Type & Date</th>
                  <th className="pb-3">Project / Couple Name</th>
                  <th className="pb-3">Party (Studio / Editor)</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Payer / Reference Notes</th>
                  <th className="pb-3 text-right">Amount (₹)</th>
                  <th className="pb-3 text-right pr-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredPayments.map((pay) => {
                  const isReceived = pay.entityType === 'studio';
                  const studioObj = studios.find(s => s.id === pay.entityId);
                  const editorObj = editors.find(e => e.id === pay.entityId);
                  const partyName = isReceived ? (studioObj?.name || 'Studio Partner') : (editorObj?.name || 'Video Editor');

                  return (
                    <tr key={pay.id} className="hover:bg-white/[0.02] transition-colors group">
                      {/* Type & Date */}
                      <td className="py-4 pl-2">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-md font-mono text-[9px] uppercase tracking-wider font-bold ${
                            isReceived 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                          }`}>
                            {isReceived ? '← Received' : '→ Paid Out'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            {pay.date || 'Recent'}
                          </span>
                        </div>
                      </td>

                      {/* Project / Couple */}
                      <td className="py-4 font-bold text-white max-w-xs">
                        <div className="text-sm font-semibold">{pay.projectCoupleName || 'Wedding Film'}</div>
                        <span className="text-[9px] text-gray-500 font-mono block mt-0.5">ID: {pay.id}</span>
                      </td>

                      {/* Party */}
                      <td className="py-4">
                        <div className="flex items-center space-x-2">
                          <div className={`w-7 h-7 rounded-lg border flex items-center justify-center text-xs ${
                            isReceived ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          }`}>
                            {isReceived ? <Building2 className="w-3.5 h-3.5" /> : <Laptop className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-medium text-gray-200">{partyName}</div>
                            {isReceived && pay.receivedFrom && (
                              <div className="text-[10px] text-gray-400">Payer: <strong className="text-gray-300 font-normal">{pay.receivedFrom}</strong></div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Method */}
                      <td className="py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-charcoal-950 border border-white/10 font-mono text-[11px] text-gold-300/90 font-medium">
                          {pay.paymentMethod || 'UPI'}
                        </span>
                      </td>

                      {/* Notes */}
                      <td className="py-4 max-w-xs">
                        <p className="text-gray-400 text-xs italic truncate" title={pay.notes || 'No notes'}>
                          {pay.notes || '-'}
                        </p>
                      </td>

                      {/* Amount */}
                      <td className="py-4 text-right">
                        <span className={`text-base font-bold font-sans tracking-tight ${
                          isReceived ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {isReceived ? '+' : '-'} ₹{(pay.amount || 0).toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 text-right pr-2">
                        <div className="flex items-center justify-end space-x-1">
                          {/* View Receipt */}
                          <button
                            onClick={() => setViewingReceipt(pay)}
                            title="View Official Payment Receipt"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-gold-500/20 text-gray-400 hover:text-gold-300 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(pay)}
                            title="Edit Record"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-gray-400 hover:text-blue-300 transition-colors cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingPaymentId(pay.id)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-charcoal-950/40 rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400 mb-4">
              <IndianRupee className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-display">No Payment Records Found</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              {searchQuery || filterType !== 'all' || filterMethod !== 'all'
                ? 'No transactions matched your search filters. Try clearing search or resetting filters.'
                : 'Your payment ledger is empty. Click "+ Record New Payment" below to log your first studio collection or editor payout.'}
            </p>
            <div className="mt-6 flex gap-3">
              {(searchQuery || filterType !== 'all' || filterMethod !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterMethod('all');
                    setSelectedStudioFilter('all');
                  }}
                  className="px-4 py-2 bg-charcoal-800 text-gray-300 text-xs rounded-xl font-medium border border-white/10 hover:bg-charcoal-700 cursor-pointer"
                >
                  Clear Filters
                </button>
              )}
              <button
                onClick={() => handleOpenRecordModal('studio')}
                className="px-5 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs rounded-xl flex items-center space-x-2 shadow-lg cursor-pointer gold-glow"
              >
                <Plus className="w-4 h-4 text-charcoal-950" />
                <span>+ Record New Payment</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: RECORD / EDIT PAYMENT MODAL */}
      <AnimatePresence>
        {isRecordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
                    <IndianRupee className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white font-display">
                      {editingPayment ? 'Edit Stored Payment Record' : 'Record & Store New Payment'}
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      Saved directly into your studio Firestore cloud ledger.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsRecordModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Success/Error notifications */}
              {formSuccess && (
                <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}
              {formError && (
                <div className="mt-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 font-medium">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPayment} className="mt-4 space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1.5">
                    Transaction Category
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-charcoal-950 rounded-2xl border border-white/10">
                    <button
                      type="button"
                      onClick={() => setPaymentType('studio')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        paymentType === 'studio'
                          ? 'bg-emerald-500 text-charcoal-950 shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Received from Studio</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentType('editor')}
                      className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        paymentType === 'editor'
                          ? 'bg-amber-500 text-charcoal-950 shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Paid Out to Editor</span>
                    </button>
                  </div>
                </div>

                {/* Entity Selector (Studio or Editor) */}
                {paymentType === 'studio' ? (
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                      Select Studio Partner *
                    </label>
                    <select
                      value={selectedStudioId}
                      onChange={(e) => setSelectedStudioId(e.target.value)}
                      className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/50"
                      required
                    >
                      {studios.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.ownerName || 'Studio Owner'})</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                      Select Video Editor *
                    </label>
                    <select
                      value={selectedEditorId}
                      onChange={(e) => setSelectedEditorId(e.target.value)}
                      className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/50"
                      required
                    >
                      {editors.map(ed => (
                        <option key={ed.id} value={ed.id}>{ed.name} ({ed.phone || ed.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Optional Project selector */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                    Associated Project / Film (Optional)
                  </label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/50"
                  >
                    <option value="">-- General Ledger (No Specific Project) --</option>
                    {projects
                      .filter(p => paymentType === 'studio' ? (p.studioId === selectedStudioId || !selectedStudioId) : true)
                      .map(p => (
                        <option key={p.id} value={p.id}>{p.coupleName} ({p.eventType || 'Wedding'})</option>
                      ))}
                  </select>
                </div>

                {/* Amount & Date Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                      Payment Amount (₹) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-400 font-bold text-sm">₹</span>
                      <input
                        type="number"
                        placeholder="e.g. 25000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full pl-8 pr-3 py-2.5 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white font-bold focus:outline-none focus:border-gold-500/50"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                      Transaction Date *
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full py-2.5 px-3 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-gold-500/50"
                      required
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                    Payment Method / Mode *
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-charcoal-950 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-gold-500/50 font-medium"
                  >
                    <option value="UPI">UPI / GPay / PhonePe / Paytm</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                {/* Received From (Payer) for Studio Receipts */}
                {paymentType === 'studio' && (
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-gray-400 tracking-wider mb-1">
                      Received From / Payer Name
                    </label>
                    <input
                      type="text"
                      placeholder="E.g. Satish Tiwari, Amit Verma..."
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
                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsRecordModalOpen(false)}
                    className="px-4 py-2.5 bg-charcoal-800 text-gray-300 text-xs font-medium rounded-2xl hover:bg-charcoal-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-gold-600 to-gold-500 text-charcoal-950 font-bold text-xs rounded-2xl hover:from-gold-500 hover:to-gold-400 transition-all cursor-pointer shadow-lg disabled:opacity-50 gold-glow"
                  >
                    {isSubmitting ? 'Saving to Firestore...' : editingPayment ? 'Update Record' : 'Save Payment Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: VIEW OFFICIAL RECEIPT VOUCHER */}
      <AnimatePresence>
        {viewingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white text-slate-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden font-sans"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div>
                  <h4 className="text-sm font-black tracking-wider uppercase text-slate-900">THE FRAME CUT STUDIO</h4>
                  <p className="text-[10px] text-slate-500 font-mono">OFFICIAL DIGITAL PAYMENT RECEIPT</p>
                </div>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Body */}
              <div className="my-5 space-y-4 text-xs">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Receipt Voucher No</span>
                    <span className="font-mono font-bold text-slate-800">{viewingReceipt.id}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-mono text-slate-400 block uppercase">Date</span>
                    <span className="font-mono font-bold text-slate-800">{viewingReceipt.date}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Category</span>
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      viewingReceipt.entityType === 'studio' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {viewingReceipt.entityType === 'studio' ? 'Studio Collection' : 'Editor Payout'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Payment Mode</span>
                    <span className="font-bold text-slate-800">{viewingReceipt.paymentMethod || 'UPI'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Project / Couple</span>
                  <span className="font-bold text-slate-900 text-sm">{viewingReceipt.projectCoupleName || 'General Ledger'}</span>
                </div>

                {viewingReceipt.receivedFrom && (
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block">Received From / Payer</span>
                    <span className="font-semibold text-slate-800">{viewingReceipt.receivedFrom}</span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block">Notes / Reference</span>
                  <p className="text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic">
                    {viewingReceipt.notes || 'No notes attached.'}
                  </p>
                </div>

                <div className="p-4 bg-slate-900 text-white rounded-2xl flex justify-between items-center shadow-lg">
                  <span className="text-xs font-bold font-mono text-amber-400 uppercase">Total Amount</span>
                  <span className="text-2xl font-black font-sans text-amber-300">
                    ₹{(viewingReceipt.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Receipt Footer */}
              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Verified System Ledger Document</span>
                <button
                  onClick={() => window.print()}
                  className="text-slate-700 hover:text-slate-900 underline font-bold cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingPaymentId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-charcoal-900 border border-red-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Payment Record?</h3>
                <p className="text-xs text-gray-400 mt-1">
                  This transaction will be permanently removed from your Firestore database ledger. This action cannot be undone.
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setDeletingPaymentId(null)}
                  className="flex-1 py-2.5 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 text-xs font-medium rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
