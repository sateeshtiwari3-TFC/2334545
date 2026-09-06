import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Film,
  Building2,
  Laptop,
  LayoutDashboard,
  Receipt,
  HardDrive,
  Calendar,
  Sparkles,
  History,
  BarChart3,
  Bell,
  Trash2,
  Settings,
  Plus,
  IndianRupee,
  ChevronRight,
  Command,
  ArrowRight,
  Clock,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Flame,
  CornerDownLeft,
  SlidersHorizontal,
  User,
  Phone,
  MapPin,
  FolderOpen
} from 'lucide-react';
import { Project, Studio, Editor, UserProfile } from '../types';

export type SearchCategory = 'all' | 'projects' | 'studios' | 'editors' | 'navigation';

interface SearchResultItem {
  id: string;
  type: 'project' | 'studio' | 'editor' | 'navigation';
  title: string;
  subtitle: string;
  extraInfo?: string;
  badgeText?: string;
  badgeColor?: string;
  dateText?: string;
  amountText?: string;
  data: any;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  currentUser: UserProfile | null;
  onNavigateToTab: (tabId: string, subAction?: string) => void;
  onNavigateToProject: (project: Project) => void;
  onNavigateToStudio: (studio: Studio) => void;
  onNavigateToEditor: (editor: Editor) => void;
}

const APP_NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Dashboard & Live ERP', icon: LayoutDashboard, category: 'Navigation', desc: 'Live project KPIs, revenue metrics & pipeline' },
  { id: 'projects', label: 'Projects Directory', icon: Film, category: 'Navigation', desc: 'All active and archived wedding assignments' },
  { id: 'registry', label: 'New Project Registry', icon: Plus, category: 'Quick Action', desc: 'Register a new wedding assignment & assign sequences' },
  { id: 'payments', label: 'Payment Center', icon: IndianRupee, category: 'Navigation', desc: 'Client receipts, outstanding dues & editor payouts' },
  { id: 'invoice', label: 'Invoicing & GST Billing', icon: Receipt, category: 'Navigation', desc: 'Generate GST-compliant tax invoices & quotes' },
  { id: 'studios', label: 'Studios Directory', icon: Building2, category: 'Navigation', desc: 'Partner studios, client accounts & billing ledgers' },
  { id: 'editors', label: 'Editors Portal', icon: Laptop, category: 'Navigation', desc: 'Video editors, capacity tracker & pay records' },
  { id: 'datamanager', label: 'Data Manager & Hard Drives', icon: HardDrive, category: 'Navigation', desc: 'Physical storage disks, storage codes & cloud links' },
  { id: 'calendar', label: 'Studio Calendar', icon: Calendar, category: 'Navigation', desc: 'Event timelines, shoot schedules & delivery dates' },
  { id: 'gemini', label: 'Gemini AI Studio Assistant', icon: Sparkles, category: 'Navigation', desc: 'AI film descriptions, summaries & wedding scripts' },
  { id: 'gemini:soundtrack', label: 'AI Wedding Soundtrack Suggester', icon: Sparkles, category: 'AI Creative', desc: 'Curate trending background songs & audio by wedding style' },
  { id: 'gemini:captions', label: 'AI Reels & YouTube Caption Generator', icon: Sparkles, category: 'AI Creative', desc: '1-Click viral hooks, captions, hashtags & descriptions' },
  { id: 'audit', label: 'Audit & Revision Log', icon: History, category: 'Navigation', desc: 'Historical change log, editor reassignments & edits' },
  { id: 'reports', label: 'Reports & Audits', icon: BarChart3, category: 'Navigation', desc: 'Financial summaries, expenses & profitability insights' },
  { id: 'notifications', label: 'Notifications Center', icon: Bell, category: 'Navigation', desc: 'Deadline warnings & automated system reminders' },
  { id: 'recyclebin', label: 'Recycle Bin', icon: Trash2, category: 'Navigation', desc: 'Safe deletion recovery & restoration vault' },
  { id: 'settings', label: 'Studio Settings', icon: Settings, category: 'Navigation', desc: 'Studio profile, theme preferences & system setup' }
];

export default function GlobalSearchModal({
  isOpen,
  onClose,
  projects,
  studios,
  editors,
  currentUser,
  onNavigateToTab,
  onNavigateToProject,
  onNavigateToStudio,
  onNavigateToEditor
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SearchCategory>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Focus input automatically on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Studio and Editor name lookup maps for rapid cross-referencing
  const studioNameMap = useMemo(() => {
    const map = new Map<string, string>();
    studios.forEach(s => map.set(s.id, s.name));
    return map;
  }, [studios]);

  const editorNameMap = useMemo(() => {
    const map = new Map<string, string>();
    editors.forEach(e => map.set(e.id, e.name));
    return map;
  }, [editors]);

  // Compute matched results
  const filteredResults = useMemo(() => {
    const q = query.toLowerCase().trim();

    const results: {
      projects: SearchResultItem[];
      studios: SearchResultItem[];
      editors: SearchResultItem[];
      navigation: SearchResultItem[];
    } = {
      projects: [],
      studios: [],
      editors: [],
      navigation: []
    };

    // 1. Filter Navigation items
    if (selectedCategory === 'all' || selectedCategory === 'navigation') {
      const navMatches = APP_NAVIGATION_ITEMS.filter(item => {
        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          item.desc.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        );
      }).map(item => ({
        id: `nav-${item.id}`,
        type: 'navigation' as const,
        title: item.label,
        subtitle: item.desc,
        badgeText: item.category,
        badgeColor: item.category === 'Quick Action' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-gold-500/10 text-gold-400 border-gold-500/20',
        data: item
      }));

      // If query is empty, limit navigation to top items unless in navigation tab
      results.navigation = !q && selectedCategory === 'all' ? navMatches.slice(0, 5) : navMatches;
    }

    // 2. Filter Projects
    if (selectedCategory === 'all' || selectedCategory === 'projects') {
      const matchedProjects = projects.filter(p => {
        if (!q) return true;
        const studioName = p.studioId ? (studioNameMap.get(p.studioId) || '') : '';
        const editorName = p.assignedEditorId ? (editorNameMap.get(p.assignedEditorId) || '') : '';
        const tags = Array.isArray(p.tags) ? p.tags.join(' ') : '';
        const rawText = [
          p.projectName,
          p.coupleName,
          p.brideName,
          p.groomName,
          p.id,
          p.eventType,
          p.status,
          p.priority,
          p.hardDiskName,
          p.location,
          p.venue,
          p.notes,
          studioName,
          editorName,
          tags
        ].filter(Boolean).join(' ').toLowerCase();

        return rawText.includes(q);
      }).map(p => {
        const studioName = p.studioId ? studioNameMap.get(p.studioId) : 'Independent / Direct';
        const editorName = p.assignedEditorId ? editorNameMap.get(p.assignedEditorId) : 'Unassigned';
        const title = p.projectName || p.coupleName || `Project #${p.id.slice(-6)}`;
        
        let badgeColor = 'bg-sky-500/20 text-sky-300 border-sky-500/30';
        if (p.status === 'editing') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        if (p.status === 'revision') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
        if (p.status === 'delivered') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (p.status === 'closed') badgeColor = 'bg-slate-700/50 text-slate-300 border-slate-600';

        const amount = Number(p.projectAmount) || 0;
        const amountText = amount > 0 ? `₹${amount.toLocaleString('en-IN')}` : undefined;

        return {
          id: `proj-${p.id}`,
          type: 'project' as const,
          title,
          subtitle: `${studioName} • Editor: ${editorName}`,
          extraInfo: p.hardDiskName ? `Drive: ${p.hardDiskName}` : undefined,
          badgeText: (p.status || 'data_received').replace('_', ' ').toUpperCase(),
          badgeColor,
          dateText: p.deliveryDate ? `Due: ${p.deliveryDate}` : p.shootDate ? `Shot: ${p.shootDate}` : undefined,
          amountText,
          data: p
        };
      });

      results.projects = !q && selectedCategory === 'all' ? matchedProjects.slice(0, 4) : matchedProjects;
    }

    // 3. Filter Studios
    if (selectedCategory === 'all' || selectedCategory === 'studios') {
      const matchedStudios = studios.filter(s => {
        if (!q) return true;
        const rawText = [
          s.name,
          s.ownerName,
          s.phone,
          s.email,
          s.address,
          s.gstNumber,
          s.notes
        ].filter(Boolean).join(' ').toLowerCase();

        return rawText.includes(q);
      }).map(s => {
        const associatedProjects = projects.filter(p => p.studioId === s.id).length;
        return {
          id: `studio-${s.id}`,
          type: 'studio' as const,
          title: s.name,
          subtitle: s.ownerName ? `Owner: ${s.ownerName}` : 'Partner Studio',
          extraInfo: s.phone || s.email,
          badgeText: `${associatedProjects} ${associatedProjects === 1 ? 'Project' : 'Projects'}`,
          badgeColor: 'bg-luxury-green-800/40 text-gold-400 border-gold-500/30',
          data: s
        };
      });

      results.studios = !q && selectedCategory === 'all' ? matchedStudios.slice(0, 3) : matchedStudios;
    }

    // 4. Filter Editors
    if (selectedCategory === 'all' || selectedCategory === 'editors') {
      const matchedEditors = editors.filter(e => {
        if (!q) return true;
        const rawText = [
          e.name,
          e.phone,
          e.email,
          e.notes
        ].filter(Boolean).join(' ').toLowerCase();

        return rawText.includes(q);
      }).map(e => {
        const activeTasks = projects.filter(p => p.assignedEditorId === e.id && p.status !== 'delivered' && p.status !== 'closed').length;
        return {
          id: `editor-${e.id}`,
          type: 'editor' as const,
          title: e.name,
          subtitle: e.email || e.phone || 'Video Editor',
          extraInfo: `${activeTasks} assigned in pipeline`,
          badgeText: `★ ${e.rating || 5.0}`,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          data: e
        };
      });

      results.editors = !q && selectedCategory === 'all' ? matchedEditors.slice(0, 3) : matchedEditors;
    }

    return results;
  }, [query, selectedCategory, projects, studios, editors, studioNameMap, editorNameMap]);

  // Flattened active results array for linear keyboard selection
  const flatResults = useMemo(() => {
    const list: SearchResultItem[] = [];
    if (selectedCategory === 'all' || selectedCategory === 'projects') {
      list.push(...filteredResults.projects);
    }
    if (selectedCategory === 'all' || selectedCategory === 'studios') {
      list.push(...filteredResults.studios);
    }
    if (selectedCategory === 'all' || selectedCategory === 'editors') {
      list.push(...filteredResults.editors);
    }
    if (selectedCategory === 'all' || selectedCategory === 'navigation') {
      list.push(...filteredResults.navigation);
    }
    return list;
  }, [filteredResults, selectedCategory]);

  // Ensure selectedIndex stays in bounds
  useEffect(() => {
    if (selectedIndex >= flatResults.length) {
      setSelectedIndex(Math.max(0, flatResults.length - 1));
    }
  }, [flatResults.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    const activeEl = document.getElementById(`search-item-${selectedIndex}`);
    if (activeEl && resultsContainerRef.current) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Execute selection
  const handleSelectItem = (item: SearchResultItem) => {
    onClose();
    if (item.type === 'project') {
      onNavigateToProject(item.data as Project);
    } else if (item.type === 'studio') {
      onNavigateToStudio(item.data as Studio);
    } else if (item.type === 'editor') {
      onNavigateToEditor(item.data as Editor);
    } else if (item.type === 'navigation') {
      if (item.data.id === 'gemini:soundtrack') {
        onNavigateToTab('gemini', 'soundtrack');
      } else if (item.data.id === 'gemini:captions') {
        onNavigateToTab('gemini', 'captions');
      } else {
        onNavigateToTab(item.data.id);
      }
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1 < flatResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 >= 0 ? prev - 1 : flatResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatResults[selectedIndex]) {
        handleSelectItem(flatResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Cycle category filter
      const categories: SearchCategory[] = ['all', 'projects', 'studios', 'editors', 'navigation'];
      const nextIdx = (categories.indexOf(selectedCategory) + (e.shiftKey ? -1 : 1) + categories.length) % categories.length;
      setSelectedCategory(categories[nextIdx]);
      setSelectedIndex(0);
    }
  };

  const totalResultsCount = 
    filteredResults.projects.length + 
    filteredResults.studios.length + 
    filteredResults.editors.length + 
    filteredResults.navigation.length;

  if (!isOpen) return null;

  return (
    <div
      id="global-search-modal-backdrop"
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 px-3 bg-black/80 backdrop-blur-md transition-opacity"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="w-full max-w-3xl bg-charcoal-900 border border-gold-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] relative text-gray-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Header Bar */}
        <div className="p-4 border-b border-white/10 bg-charcoal-950 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gold-500/20 text-gold-400 shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            id="global-search-input"
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search projects, couple, studios, editors, drives, views... (⌘K)"
            className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm md:text-base font-sans font-medium focus:outline-none"
            autoComplete="off"
            spellCheck={false}
          />

          {query && (
            <button
              type="button"
              id="btn-clear-global-search"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1.5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Clear input"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-charcoal-900 border border-white/10 rounded-lg text-[10px] font-mono text-gray-400 select-none">
            <span>ESC</span>
          </div>
        </div>

        {/* Category Filters Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-charcoal-950/60 border-b border-white/5 overflow-x-auto text-xs font-mono select-none">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest mr-1 hidden sm:inline">Filter:</span>
          
          <button
            type="button"
            id="filter-category-all"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedIndex(0);
            }}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'all'
                ? 'bg-gold-500 text-charcoal-950 font-bold shadow-sm'
                : 'bg-charcoal-900 text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <span>All</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'all' ? 'bg-black/20 text-charcoal-950' : 'bg-black/40 text-gray-400'}`}>
              {totalResultsCount}
            </span>
          </button>

          <button
            type="button"
            id="filter-category-projects"
            onClick={() => {
              setSelectedCategory('projects');
              setSelectedIndex(0);
            }}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'projects'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : 'bg-charcoal-900 text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <Film className="w-3 h-3" />
            <span>Projects</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'projects' ? 'bg-black/20 text-white' : 'bg-black/40 text-gray-400'}`}>
              {filteredResults.projects.length}
            </span>
          </button>

          <button
            type="button"
            id="filter-category-studios"
            onClick={() => {
              setSelectedCategory('studios');
              setSelectedIndex(0);
            }}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'studios'
                ? 'bg-luxury-green-800 text-gold-300 font-bold shadow-sm'
                : 'bg-charcoal-900 text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <Building2 className="w-3 h-3" />
            <span>Studios</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'studios' ? 'bg-black/20 text-gold-300' : 'bg-black/40 text-gray-400'}`}>
              {filteredResults.studios.length}
            </span>
          </button>

          <button
            type="button"
            id="filter-category-editors"
            onClick={() => {
              setSelectedCategory('editors');
              setSelectedIndex(0);
            }}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'editors'
                ? 'bg-purple-600 text-white font-bold shadow-sm'
                : 'bg-charcoal-900 text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <Laptop className="w-3 h-3" />
            <span>Editors</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'editors' ? 'bg-black/20 text-white' : 'bg-black/40 text-gray-400'}`}>
              {filteredResults.editors.length}
            </span>
          </button>

          <button
            type="button"
            id="filter-category-navigation"
            onClick={() => {
              setSelectedCategory('navigation');
              setSelectedIndex(0);
            }}
            className={`px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === 'navigation'
                ? 'bg-amber-500 text-charcoal-950 font-bold shadow-sm'
                : 'bg-charcoal-900 text-gray-400 hover:text-white hover:bg-charcoal-800'
            }`}
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Views & Actions</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === 'navigation' ? 'bg-black/20 text-charcoal-950' : 'bg-black/40 text-gray-400'}`}>
              {filteredResults.navigation.length}
            </span>
          </button>
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[55vh] divide-y divide-white/5"
        >
          {flatResults.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="p-4 rounded-2xl bg-charcoal-950 border border-white/10 text-gray-500">
                <Search className="w-8 h-8 opacity-40" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-300">No matching results found for "{query}"</p>
                <p className="text-xs text-gray-500 mt-1">Try searching by couple name, studio, editor, or hard drive code</p>
              </div>
              <div className="pt-2 flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToTab('registry');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-gold-500/20 text-gold-400 border border-gold-500/30 hover:bg-gold-500/30 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register New Project</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('all');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-charcoal-950 text-gray-400 border border-white/10 hover:text-white text-xs font-mono transition-all cursor-pointer"
                >
                  Clear Search
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Projects Section */}
              {filteredResults.projects.length > 0 && (
                <div className="pt-2 first:pt-0">
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-1.5 text-sky-400">
                      <Film className="w-3.5 h-3.5" />
                      Wedding Projects ({filteredResults.projects.length})
                    </span>
                    <span className="text-gray-500">Press ↵ to open</span>
                  </div>

                  <div className="space-y-1">
                    {filteredResults.projects.map(item => {
                      const flatIndex = flatResults.findIndex(f => f.id === item.id);
                      const isSelected = flatIndex === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          id={`search-item-${flatIndex}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                            isSelected
                              ? 'bg-sky-950/40 border-sky-500/50 text-white shadow-md'
                              : 'bg-charcoal-950/60 hover:bg-charcoal-950 border-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              isSelected ? 'bg-sky-500 text-charcoal-950' : 'bg-charcoal-900 border border-white/10 text-sky-400'
                            }`}>
                              <Film className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-white truncate">{item.title}</span>
                                {item.badgeText && (
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border uppercase tracking-wider ${item.badgeColor}`}>
                                    {item.badgeText}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5 truncate font-mono">
                                <span>{item.subtitle}</span>
                                {item.extraInfo && <span>• {item.extraInfo}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-right font-mono">
                            <div>
                              {item.amountText && (
                                <div className="text-xs font-bold text-gold-400">{item.amountText}</div>
                              )}
                              {item.dateText && (
                                <div className="text-[10px] text-gray-400">{item.dateText}</div>
                              )}
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-sky-400 translate-x-0.5' : 'text-gray-600'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Studios Section */}
              {filteredResults.studios.length > 0 && (
                <div className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-1.5 text-gold-400">
                      <Building2 className="w-3.5 h-3.5" />
                      Partner Studios ({filteredResults.studios.length})
                    </span>
                  </div>

                  <div className="space-y-1">
                    {filteredResults.studios.map(item => {
                      const flatIndex = flatResults.findIndex(f => f.id === item.id);
                      const isSelected = flatIndex === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          id={`search-item-${flatIndex}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                            isSelected
                              ? 'bg-luxury-green-950/50 border-gold-500/50 text-white shadow-md'
                              : 'bg-charcoal-950/60 hover:bg-charcoal-950 border-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              isSelected ? 'bg-gold-500 text-charcoal-950' : 'bg-charcoal-900 border border-white/10 text-gold-400'
                            }`}>
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white truncate">{item.title}</span>
                                {item.badgeText && (
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${item.badgeColor}`}>
                                    {item.badgeText}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 truncate font-mono">
                                {item.subtitle} {item.extraInfo ? `• ${item.extraInfo}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-gold-400 translate-x-0.5' : 'text-gray-600'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Editors Section */}
              {filteredResults.editors.length > 0 && (
                <div className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-1.5 text-purple-400">
                      <Laptop className="w-3.5 h-3.5" />
                      Video Editors ({filteredResults.editors.length})
                    </span>
                  </div>

                  <div className="space-y-1">
                    {filteredResults.editors.map(item => {
                      const flatIndex = flatResults.findIndex(f => f.id === item.id);
                      const isSelected = flatIndex === selectedIndex;

                      return (
                        <div
                          key={item.id}
                          id={`search-item-${flatIndex}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-500/50 text-white shadow-md'
                              : 'bg-charcoal-950/60 hover:bg-charcoal-950 border-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              isSelected ? 'bg-purple-500 text-white' : 'bg-charcoal-900 border border-white/10 text-purple-400'
                            }`}>
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white truncate">{item.title}</span>
                                {item.badgeText && (
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${item.badgeColor}`}>
                                    {item.badgeText}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 truncate font-mono">
                                {item.subtitle} {item.extraInfo ? `• ${item.extraInfo}` : ''}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-purple-400 translate-x-0.5' : 'text-gray-600'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation & Quick Actions Section */}
              {filteredResults.navigation.length > 0 && (
                <div className="pt-3 first:pt-0">
                  <div className="flex items-center justify-between px-2 pb-1.5 text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold">
                    <span className="flex items-center gap-1.5 text-amber-400">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      App Views & Quick Actions ({filteredResults.navigation.length})
                    </span>
                  </div>

                  <div className="space-y-1">
                    {filteredResults.navigation.map(item => {
                      const flatIndex = flatResults.findIndex(f => f.id === item.id);
                      const isSelected = flatIndex === selectedIndex;
                      const IconComponent = item.data.icon || LayoutDashboard;

                      return (
                        <div
                          key={item.id}
                          id={`search-item-${flatIndex}`}
                          onClick={() => handleSelectItem(item)}
                          onMouseEnter={() => setSelectedIndex(flatIndex)}
                          className={`p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-3 border ${
                            isSelected
                              ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-md'
                              : 'bg-charcoal-950/60 hover:bg-charcoal-950 border-white/5 text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              isSelected ? 'bg-amber-500 text-charcoal-950' : 'bg-charcoal-900 border border-white/10 text-amber-400'
                            }`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white truncate">{item.title}</span>
                                {item.badgeText && (
                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${item.badgeColor}`}>
                                    {item.badgeText}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 truncate font-mono">
                                {item.subtitle}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-amber-400 translate-x-0.5' : 'text-gray-600'}`} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Keyboard Shortcuts Footer */}
        <div className="px-4 py-3 bg-charcoal-950 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-gray-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-charcoal-900 border border-white/10 text-gray-300">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-charcoal-900 border border-white/10 text-gray-300">↓</kbd>
              <span className="hidden sm:inline">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-charcoal-900 border border-white/10 text-gray-300">↵</kbd>
              <span className="hidden sm:inline">Select & Jump</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-charcoal-900 border border-white/10 text-gray-300">Tab</kbd>
              <span className="hidden sm:inline">Category</span>
            </span>
          </div>

          <div className="flex items-center gap-1 text-gold-400 font-semibold">
            <Command className="w-3.5 h-3.5" />
            <span>K for Omni-Search</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
