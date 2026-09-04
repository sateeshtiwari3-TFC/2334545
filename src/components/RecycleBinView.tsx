import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Film, 
  Building2, 
  Laptop, 
  IndianRupee, 
  Receipt, 
  Calendar, 
  History, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  Database,
  RefreshCw,
  FolderArchive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RecycleBinItem, RecycleBinItemType } from '../types';

interface RecycleBinViewProps {
  recycleBinItems: RecycleBinItem[];
  onRestoreItem: (item: RecycleBinItem) => Promise<void>;
  onPermanentDeleteItem: (itemId: string) => Promise<void>;
  onEmptyRecycleBin: () => Promise<void>;
  onRestoreAllItems: () => Promise<void>;
  onNavigateTab: (tab: string) => void;
}

export default function RecycleBinView({
  recycleBinItems = [],
  onRestoreItem,
  onPermanentDeleteItem,
  onEmptyRecycleBin,
  onRestoreAllItems,
  onNavigateTab
}: RecycleBinViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isRestoringAll, setIsRestoringAll] = useState(false);
  const [isEmptyingAll, setIsEmptyingAll] = useState(false);
  const [confirmEmptyModal, setConfirmEmptyModal] = useState(false);
  const [itemToDeletePermanently, setItemToDeletePermanently] = useState<RecycleBinItem | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Filter items
  const filteredItems = useMemo(() => {
    return recycleBinItems.filter(item => {
      // Type filter
      if (selectedFilter !== 'all') {
        if (selectedFilter === 'projects' && item.itemType !== 'project') return false;
        if (selectedFilter === 'studios' && item.itemType !== 'studio') return false;
        if (selectedFilter === 'editors' && item.itemType !== 'editor') return false;
        if (selectedFilter === 'financials' && item.itemType !== 'payment' && item.itemType !== 'expense') return false;
        if (selectedFilter === 'invoices' && item.itemType !== 'invoice') return false;
        if (selectedFilter === 'other' && item.itemType !== 'calendar_event' && item.itemType !== 'revision') return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const titleMatch = (item.itemTitle || '').toLowerCase().includes(q);
      const subtitleMatch = (item.itemSubtitle || '').toLowerCase().includes(q);
      const idMatch = (item.originalId || '').toLowerCase().includes(q);
      const userMatch = (item.deletedBy || '').toLowerCase().includes(q);
      const typeMatch = (item.itemType || '').toLowerCase().includes(q);

      return titleMatch || subtitleMatch || idMatch || userMatch || typeMatch;
    });
  }, [recycleBinItems, selectedFilter, searchQuery]);

  // Counts by category
  const counts = useMemo(() => {
    return {
      all: recycleBinItems.length,
      projects: recycleBinItems.filter(i => i.itemType === 'project').length,
      studios: recycleBinItems.filter(i => i.itemType === 'studio').length,
      editors: recycleBinItems.filter(i => i.itemType === 'editor').length,
      financials: recycleBinItems.filter(i => i.itemType === 'payment' || i.itemType === 'expense').length,
      invoices: recycleBinItems.filter(i => i.itemType === 'invoice').length,
      other: recycleBinItems.filter(i => i.itemType === 'calendar_event' || i.itemType === 'revision').length,
    };
  }, [recycleBinItems]);

  const getItemTypeConfig = (type: RecycleBinItemType) => {
    switch (type) {
      case 'project':
        return {
          label: 'Wedding Film Project',
          icon: Film,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          iconColor: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
        };
      case 'studio':
        return {
          label: 'Studio Client',
          icon: Building2,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          iconColor: 'text-blue-400 bg-blue-950/60 border-blue-500/30'
        };
      case 'editor':
        return {
          label: 'Editor Profile',
          icon: Laptop,
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          iconColor: 'text-purple-400 bg-purple-950/60 border-purple-500/30'
        };
      case 'payment':
        return {
          label: 'Ledger Payment',
          icon: IndianRupee,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          iconColor: 'text-amber-400 bg-amber-950/60 border-amber-500/30'
        };
      case 'expense':
        return {
          label: 'Studio Expense',
          icon: IndianRupee,
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          iconColor: 'text-rose-400 bg-rose-950/60 border-rose-500/30'
        };
      case 'invoice':
        return {
          label: 'GST Invoice',
          icon: Receipt,
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          iconColor: 'text-teal-400 bg-teal-950/60 border-teal-500/30'
        };
      case 'calendar_event':
        return {
          label: 'Calendar Event',
          icon: Calendar,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          iconColor: 'text-indigo-400 bg-indigo-950/60 border-indigo-500/30'
        };
      case 'revision':
        return {
          label: 'Revision History',
          icon: History,
          badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
          iconColor: 'text-yellow-400 bg-yellow-950/60 border-yellow-500/30'
        };
      default:
        return {
          label: 'Document',
          icon: Database,
          badgeColor: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
          iconColor: 'text-gray-400 bg-gray-900 border-gray-700'
        };
    }
  };

  const formatDeletedDate = (timestamp: any) => {
    if (!timestamp) return 'Recently';
    try {
      let d: Date;
      if (typeof timestamp === 'string') d = new Date(timestamp);
      else if (timestamp.toDate) d = timestamp.toDate();
      else if (timestamp.seconds) d = new Date(timestamp.seconds * 1000);
      else if (timestamp instanceof Date) d = timestamp;
      else return 'Recently';

      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Recently';
    }
  };

  const handleRestore = async (item: RecycleBinItem) => {
    setRestoringId(item.id);
    try {
      await onRestoreItem(item);
      setActionSuccessMsg(`Successfully restored "${item.itemTitle}" to active database!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error restoring item:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const handlePermanentDelete = async (itemId: string) => {
    setDeletingId(itemId);
    try {
      await onPermanentDeleteItem(itemId);
      setItemToDeletePermanently(null);
      setActionSuccessMsg('Item permanently purged from system.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error deleting item permanently:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEmptyBin = async () => {
    setIsEmptyingAll(true);
    try {
      await onEmptyRecycleBin();
      setConfirmEmptyModal(false);
      setActionSuccessMsg('Recycle bin emptied completely.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error('Error emptying recycle bin:', err);
    } finally {
      setIsEmptyingAll(false);
    }
  };

  const handleRestoreAll = async () => {
    if (recycleBinItems.length === 0) return;
    setIsRestoringAll(true);
    try {
      await onRestoreAllItems();
      setActionSuccessMsg(`All ${recycleBinItems.length} items successfully restored!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Error restoring all items:', err);
    } finally {
      setIsRestoringAll(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Toast Banner Alert */}
      <AnimatePresence>
        {actionSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500/60 shadow-2xl flex items-center justify-between gap-3 text-white backdrop-blur-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-bold font-sans">{actionSuccessMsg}</span>
            </div>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-xs text-gray-400 hover:text-white px-2 py-1 font-mono uppercase"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header Card */}
      <div className="relative p-6 md:p-8 rounded-3xl bg-gradient-to-br from-charcoal-900 via-charcoal-950 to-charcoal-900 border border-white/10 shadow-2xl overflow-hidden">
        {/* Ambient background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-gold-500/10 border border-red-500/30 text-red-400 shadow-inner">
                <Trash2 className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-wider font-display uppercase">
                    Recycle Bin & Safe Trash
                  </h1>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-gold-500/20 text-gold-300 border border-gold-500/30">
                    {recycleBinItems.length} Deleted Items
                  </span>
                </div>
                <p className="text-xs text-gray-300 font-sans mt-0.5">
                  100% Protection against accidental deletions. Review, inspect snapshots, and restore any item in 1-click.
                </p>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {recycleBinItems.length > 0 && (
              <>
                <button
                  onClick={handleRestoreAll}
                  disabled={isRestoringAll}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isRestoringAll ? 'animate-spin' : ''}`} />
                  <span>{isRestoringAll ? 'Restoring...' : `Restore All (${recycleBinItems.length})`}</span>
                </button>

                <button
                  onClick={() => setConfirmEmptyModal(true)}
                  disabled={isEmptyingAll}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-300 hover:text-white font-bold text-xs tracking-wider uppercase font-mono shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                  <span>Empty Bin</span>
                </button>
              </>
            )}

            <button
              onClick={() => onNavigateTab('dashboard')}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs font-semibold transition-all flex items-center gap-2"
            >
              <span>Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5 text-gold-400" />
            </button>
          </div>
        </div>

        {/* Safety Guarantee Callout Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-gray-400 font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">Safe Retention: Deleted items remain preserved with full original JSON data.</span>
          </div>
          <span className="text-gray-500 text-[11px]">
            Active Collections Protected: Projects, Studios, Editors, Payments, Expenses, Invoices
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/10 backdrop-blur-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
        {/* Search Field */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search deleted projects, couple name, studio, editor, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-charcoal-950/90 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/50 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-white text-xs"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Items', count: counts.all },
            { id: 'projects', label: 'Projects', count: counts.projects },
            { id: 'studios', label: 'Studios', count: counts.studios },
            { id: 'editors', label: 'Editors', count: counts.editors },
            { id: 'financials', label: 'Ledger & Expenses', count: counts.financials },
            { id: 'invoices', label: 'Invoices', count: counts.invoices },
            { id: 'other', label: 'Calendar & Revisions', count: counts.other },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedFilter === tab.id
                  ? 'bg-gold-500 text-charcoal-950 shadow-md'
                  : 'bg-black/30 text-gray-400 hover:text-white border border-white/5 hover:border-white/10'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                selectedFilter === tab.id ? 'bg-black/20 text-charcoal-950' : 'bg-white/10 text-gray-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content List */}
      {filteredItems.length === 0 ? (
        <div className="p-12 md:p-16 rounded-3xl bg-charcoal-900/40 border border-dashed border-white/10 text-center space-y-4 shadow-inner">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-bold text-white font-display">
              {searchQuery ? 'No matching deleted items found' : 'Recycle Bin is Empty'}
            </h3>
            <p className="text-xs text-gray-400 font-sans">
              {searchQuery 
                ? 'Try adjusting your search query or reset the filter.' 
                : 'No items are in the trash. When you delete a project, studio, editor, or payment, it will be safely kept here for quick recovery.'}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedFilter('all');
                }}
                className="px-4 py-2 rounded-xl bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/40 text-xs font-mono font-bold transition-all cursor-pointer"
              >
                Clear Search Filters
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab('dashboard')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-500 hover:from-gold-400 hover:to-amber-400 text-charcoal-950 font-bold text-xs uppercase tracking-wider font-display shadow-lg transition-all cursor-pointer"
              >
                Return to Dashboard
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredItems.map((item) => {
            const config = getItemTypeConfig(item.itemType);
            const Icon = config.icon;
            const isExpanded = expandedItemId === item.id;
            const isRestoring = restoringId === item.id;
            const isDeleting = deletingId === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 md:p-5 rounded-2xl bg-charcoal-900/90 border border-white/10 hover:border-gold-500/30 shadow-xl transition-all relative overflow-hidden"
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Icon & Item Details */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <div className={`p-3 rounded-2xl border shrink-0 ${config.iconColor}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase tracking-wider ${config.badgeColor}`}>
                          {config.label}
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          ID: <span className="text-gold-400 font-bold">{item.originalId}</span>
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                          Target: {item.targetCollection}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-white font-display truncate">
                        {item.itemTitle}
                      </h3>

                      {item.itemSubtitle && (
                        <p className="text-xs text-gray-300 font-sans line-clamp-1">
                          {item.itemSubtitle}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-gray-400 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-gold-400" />
                          <span>Deleted: {formatDeletedDate(item.deletedAt)}</span>
                        </span>
                        {item.deletedBy && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-gray-400" />
                            <span>By: {item.deletedBy} ({item.deletedByRole || 'admin'})</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-white/5">
                    {/* View Details Accordion Toggle */}
                    <button
                      onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                      className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer"
                      title="Inspect Snapshot"
                    >
                      <Eye className="w-3.5 h-3.5 text-gold-400" />
                      <span>{isExpanded ? 'Hide Data' : 'Inspect'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {/* Quick Restore Button */}
                    <button
                      onClick={() => handleRestore(item)}
                      disabled={isRestoring}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs tracking-wider uppercase font-mono shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                      <span>{isRestoring ? 'Restoring...' : 'Restore'}</span>
                    </button>

                    {/* Permanent Delete Trigger */}
                    <button
                      onClick={() => setItemToDeletePermanently(item)}
                      disabled={isDeleting}
                      className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-400 hover:text-red-200 transition-all cursor-pointer disabled:opacity-50"
                      title="Delete Permanently"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded Snapshot JSON / Properties Inspector */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 pt-4 border-t border-white/10 overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-black/50 border border-white/5 space-y-3">
                        <div className="flex items-center justify-between text-xs font-mono text-gray-400">
                          <span className="font-bold text-gold-400 uppercase tracking-wider">
                            Document Snapshot Payload:
                          </span>
                          <span>Original Target: {item.targetCollection}/{item.originalId}</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs font-mono">
                          {Object.entries(item.data || {}).map(([key, val]) => {
                            if (typeof val === 'object' && val !== null) {
                              return (
                                <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/5 col-span-full">
                                  <span className="text-gray-400 block font-bold">{key}:</span>
                                  <pre className="text-[11px] text-emerald-300 mt-1 whitespace-pre-wrap font-mono">
                                    {JSON.stringify(val, null, 2)}
                                  </pre>
                                </div>
                              );
                            }
                            return (
                              <div key={key} className="p-2 rounded-lg bg-white/5 border border-white/5">
                                <span className="text-gray-400 text-[10px] block font-bold uppercase tracking-wider">
                                  {key}:
                                </span>
                                <span className="text-gray-100 font-semibold truncate block mt-0.5">
                                  {String(val || '—')}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Confirmation Modal: Empty All Recycle Bin */}
      {confirmEmptyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-3xl bg-charcoal-900 border-2 border-red-500/40 shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white font-display">
                  Empty Recycle Bin?
                </h3>
                <p className="text-xs text-gray-400 font-sans">
                  This will permanently delete all {recycleBinItems.length} items from the trash.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-200 font-sans leading-relaxed">
              ⚠️ <strong>Warning</strong>: Once emptied, these records cannot be restored. Make sure you do not need any of these projects, studios, or financial ledgers before proceeding.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setConfirmEmptyModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyBin}
                disabled={isEmptyingAll}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isEmptyingAll ? 'Emptying...' : 'Yes, Empty Everything'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Confirmation Modal: Delete Single Item Permanently */}
      {itemToDeletePermanently && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-6 rounded-3xl bg-charcoal-900 border border-red-500/40 shadow-2xl space-y-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white font-display">
                  Permanently Delete Item?
                </h3>
                <p className="text-xs text-gray-400 font-sans truncate max-w-[280px]">
                  {itemToDeletePermanently.itemTitle}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-300 font-sans leading-relaxed">
              Are you sure you want to permanently remove this document? It will be erased from the Recycle Bin and cannot be recovered.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setItemToDeletePermanently(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-gray-300 text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDelete(itemToDeletePermanently.id)}
                disabled={deletingId === itemToDeletePermanently.id}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {deletingId === itemToDeletePermanently.id ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
