import React from 'react';
import { 
  Search, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  Plus, 
  Building2, 
  Sparkles,
  Layers,
  Filter
} from 'lucide-react';

interface StudiosFilterBarProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  sortBy: string;
  setSortBy: (sort: string) => void;
  totalCount: number;
  filteredCount: number;
  onOpenCreateModal: () => void;
  userRole?: string;
}

export const StudiosFilterBar: React.FC<StudiosFilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  viewMode,
  setViewMode,
  activeFilter,
  setActiveFilter,
  sortBy,
  setSortBy,
  totalCount,
  filteredCount,
  onOpenCreateModal,
  userRole = 'admin'
}) => {
  return (
    <div className="space-y-3">
      {/* Primary Toolbar Row */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-charcoal-950/70 p-3 rounded-2xl border border-white/5 backdrop-blur-xl">
        
        {/* Left Side: Search Bar */}
        <div className="relative flex-1 max-w-lg">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            id="studios-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search studios, owner name, phone, city, GST, UPI..."
            className="w-full pl-10 pr-10 py-2.5 bg-charcoal-900/90 border border-white/10 focus:border-gold-400/80 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white p-1"
            >
              ✕
            </button>
          ) : (
            <kbd className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-500 bg-charcoal-800/80 px-1.5 py-0.5 rounded border border-white/10 pointer-events-none">
              /
            </kbd>
          )}
        </div>

        {/* Right Side: Sort, View Switcher & Add Button */}
        <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 bg-charcoal-900/90 border border-white/10 px-2.5 py-1.5 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-gold-400 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-xs font-mono text-gray-300 focus:outline-none cursor-pointer"
            >
              <option value="name_asc" className="bg-charcoal-900">Name (A-Z)</option>
              <option value="projects_desc" className="bg-charcoal-900">Most Projects</option>
              <option value="billing_desc" className="bg-charcoal-900">Highest Billing</option>
              <option value="outstanding_desc" className="bg-charcoal-900">Highest Due Balance</option>
              <option value="recent" className="bg-charcoal-900">Recently Added</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-charcoal-900/90 border border-white/10 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-gold-500/20 text-gold-300 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Cinematic Card Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-gold-500/20 text-gold-300 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Executive Ledger Table"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Add Studio Action Button */}
          {(userRole === 'admin' || userRole === 'editor') && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 hover:from-luxury-green-700 hover:to-luxury-green-500 border border-gold-500/30 rounded-xl text-white font-medium text-xs shadow-md shadow-luxury-green-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-gold-300" />
              <span>Add Studio Partner</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-xs">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-gold-400" /> Filter:
          </span>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold'
                : 'bg-charcoal-900/60 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            All Studios ({totalCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('active_pipeline')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeFilter === 'active_pipeline'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'bg-charcoal-900/60 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            🎬 Active Pipeline
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('outstanding')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeFilter === 'outstanding'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold'
                : 'bg-charcoal-900/60 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            ⚠️ Balance Due
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('settled')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeFilter === 'settled'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                : 'bg-charcoal-900/60 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            ✓ Fully Settled
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('high_volume')}
            className={`px-3 py-1 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeFilter === 'high_volume'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                : 'bg-charcoal-900/60 text-gray-400 hover:text-white border border-white/5'
            }`}
          >
            👑 Top Partners
          </button>
        </div>

        <span className="text-[11px] font-mono text-gray-400 shrink-0">
          Showing <span className="text-gold-400 font-bold">{filteredCount}</span> of {totalCount} studios
        </span>
      </div>
    </div>
  );
};
