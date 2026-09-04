import React, { useState } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  ArrowUpRight, 
  ShieldCheck, 
  Film, 
  Building2, 
  Laptop, 
  IndianRupee, 
  Receipt, 
  Calendar,
  CheckCircle,
  Clock,
  Sparkles
} from 'lucide-react';
import { RecycleBinItem } from '../types';

interface DashboardRecycleBinWidgetProps {
  recycleBinItems: RecycleBinItem[];
  onRestoreItem: (item: RecycleBinItem) => Promise<void>;
  onNavigateTab: (tab: string) => void;
  isOrganic?: boolean;
}

export default function DashboardRecycleBinWidget({
  recycleBinItems = [],
  onRestoreItem,
  onNavigateTab,
  isOrganic = true
}: DashboardRecycleBinWidgetProps) {
  const [restoringId, setRestoringId] = useState<string | null>(null);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <Film className="w-3.5 h-3.5 text-emerald-400" />;
      case 'studio':
        return <Building2 className="w-3.5 h-3.5 text-blue-400" />;
      case 'editor':
        return <Laptop className="w-3.5 h-3.5 text-purple-400" />;
      case 'payment':
      case 'expense':
        return <IndianRupee className="w-3.5 h-3.5 text-amber-400" />;
      case 'invoice':
        return <Receipt className="w-3.5 h-3.5 text-teal-400" />;
      default:
        return <Trash2 className="w-3.5 h-3.5 text-gold-400" />;
    }
  };

  const handleQuickRestore = async (e: React.MouseEvent, item: RecycleBinItem) => {
    e.stopPropagation();
    setRestoringId(item.id);
    try {
      await onRestoreItem(item);
    } catch (err) {
      console.error('Error quick restoring item:', err);
    } finally {
      setRestoringId(null);
    }
  };

  const recentDeletedItems = recycleBinItems.slice(0, 3);

  return (
    <div className={`p-6 rounded-3xl ${
      isOrganic 
        ? 'bg-gradient-to-br from-charcoal-900/90 via-charcoal-950 to-luxury-green-950/80 border border-luxury-green-800/20' 
        : 'glass-panel border border-white/10'
    } shadow-xl relative overflow-hidden transition-all duration-300`}>
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl border ${
            recycleBinItems.length > 0
              ? 'bg-red-500/10 border-red-500/30 text-red-400'
              : 'bg-gold-500/10 border-gold-500/20 text-gold-400'
          }`}>
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white font-display uppercase tracking-wider">
                Recycle Bin / Safe Trash
              </h3>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                recycleBinItems.length > 0 
                  ? 'bg-red-500/20 text-red-300 border-red-500/40' 
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              }`}>
                {recycleBinItems.length > 0 ? `${recycleBinItems.length} in trash` : 'Safe & Clean'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-sans mt-0.5">
              Accidentally deleted items land here first and can be restored in 1-click.
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('recyclebin')}
          className="text-xs font-bold text-gold-400 hover:text-gold-300 flex items-center gap-1.5 transition-all cursor-pointer bg-black/40 hover:bg-black/60 px-3.5 py-2 rounded-xl border border-gold-500/25 shadow-sm"
        >
          <span>Open Bin ({recycleBinItems.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5 text-gold-400" />
        </button>
      </div>

      {/* Body Content */}
      <div className="space-y-2.5 relative z-10">
        {recycleBinItems.length === 0 ? (
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-gray-200 block">
                  Deletion Protection is Active
                </span>
                <span className="text-[11px] text-gray-400 block font-sans">
                  Whenever you delete any project, studio, or ledger entry, it is archived safely.
                </span>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('recyclebin')}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono transition-all cursor-pointer whitespace-nowrap"
            >
              View Bin
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {recentDeletedItems.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-black/40 border border-white/5 hover:border-gold-500/30 flex items-center justify-between gap-3 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-white/5 shrink-0 border border-white/5">
                      {getItemIcon(item.itemType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white truncate font-display">
                          {item.itemTitle}
                        </h4>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-gray-400 uppercase">
                          {item.itemType}
                        </span>
                      </div>
                      {item.itemSubtitle && (
                        <p className="text-[11px] text-gray-400 font-sans truncate mt-0.5">
                          {item.itemSubtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => handleQuickRestore(e, item)}
                      disabled={restoringId === item.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-mono font-bold text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                      title="Restore immediately to database"
                    >
                      <RotateCcw className={`w-3 h-3 ${restoringId === item.id ? 'animate-spin' : ''}`} />
                      <span>{restoringId === item.id ? 'Restoring...' : 'Restore'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {recycleBinItems.length > 3 && (
              <div className="pt-1 text-center">
                <button
                  onClick={() => onNavigateTab('recyclebin')}
                  className="text-xs text-gold-400 hover:text-gold-300 font-mono font-medium hover:underline"
                >
                  + View {recycleBinItems.length - 3} more deleted items in Recycle Bin →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
