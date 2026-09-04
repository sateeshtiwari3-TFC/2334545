import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Check, 
  Info,
  Trash2,
  Sparkles,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Film,
  IndianRupee
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Studio, Project, PaymentHistory, UserRole } from '../types';
import { StudiosHeaderKpi } from './studios/StudiosHeaderKpi';
import { StudiosFilterBar } from './studios/StudiosFilterBar';
import { StudioCardGrid } from './studios/StudioCardGrid';
import { StudioListView } from './studios/StudioListView';
import { StudioDetailDrawer } from './studios/StudioDetailDrawer';
import { StudioFormModal } from './studios/StudioFormModal';
import { StudioWhatsAppModal } from './studios/StudioWhatsAppModal';
import { StudioPaymentModal } from './studios/StudioPaymentModal';
import { StudioAnalyticsPanel } from './studios/StudioAnalyticsPanel';

interface StudiosViewProps {
  studios: Studio[];
  projects: Project[];
  payments?: PaymentHistory[];
  userRole?: UserRole;
  onAddStudio: (studio: Omit<Studio, 'createdAt'>) => Promise<void>;
  onUpdateStudio: (id: string, updates: Partial<Studio>) => Promise<void>;
  onDeleteStudio: (id: string) => Promise<void>;
  onLogPayment?: (payment: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
}

const StudiosView: React.FC<StudiosViewProps> = React.memo(function StudiosView({
  studios,
  projects,
  payments = [],
  userRole = 'admin',
  onAddStudio,
  onUpdateStudio,
  onDeleteStudio,
  onLogPayment
}) {
  // Drawer & Modal States
  const [selectedStudio, setSelectedStudio] = useState<Studio | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudio, setEditingStudio] = useState<Studio | null>(null);
  
  // WhatsApp & Payment Modal States
  const [whatsAppStudio, setWhatsAppStudio] = useState<Studio | null>(null);
  const [paymentStudio, setPaymentStudio] = useState<Studio | null>(null);

  // Search, Filter & View Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeViewTab, setActiveViewTab] = useState<'directory' | 'analytics'>('directory');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name_asc');

  // Delete confirmation & Toast states
  const [studioToDeleteId, setStudioToDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const triggerToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 3500);
  };

  const handleQuickCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`${label} Copied`, `${text} copied to clipboard.`);
  };

  // Open Create Studio Modal
  const handleOpenCreateModal = () => {
    setEditingStudio(null);
    setIsFormModalOpen(true);
  };

  // Open Edit Studio Modal
  const handleOpenEditModal = (studio: Studio, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingStudio(studio);
    setIsFormModalOpen(true);
  };

  // Open WhatsApp Modal
  const handleOpenWhatsApp = (studio: Studio, e: React.MouseEvent) => {
    e.stopPropagation();
    setWhatsAppStudio(studio);
  };

  // Delete Request
  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStudioToDeleteId(id);
  };

  // Save (Create / Update) Studio
  const handleSaveStudio = async (studioData: Omit<Studio, 'createdAt'>, isEdit: boolean) => {
    if (isEdit && editingStudio) {
      await onUpdateStudio(editingStudio.id, studioData);
      if (selectedStudio?.id === editingStudio.id) {
        setSelectedStudio({ ...selectedStudio, ...studioData });
      }
    } else {
      await onAddStudio(studioData);
    }
  };

  // Filter & Sort Studio Pipeline
  const filteredAndSortedStudios = useMemo(() => {
    return studios
      .filter(studio => {
        // 1. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = studio.name?.toLowerCase().includes(q);
          const matchOwner = studio.ownerName?.toLowerCase().includes(q);
          const matchPhone = studio.phone?.toLowerCase().includes(q);
          const matchEmail = studio.email?.toLowerCase().includes(q);
          const matchCity = studio.city?.toLowerCase().includes(q);
          const matchAddress = studio.address?.toLowerCase().includes(q);
          const matchGst = studio.gstNumber?.toLowerCase().includes(q);
          const matchUpi = studio.upiId?.toLowerCase().includes(q);
          if (!matchName && !matchOwner && !matchPhone && !matchEmail && !matchCity && !matchAddress && !matchGst && !matchUpi) {
            return false;
          }
        }

        // Calculations for filter pills
        const sProjects = projects.filter(p => p.studioId === studio.id);
        const sBilling = sProjects.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
        const sPays = payments.filter(pay => pay.entityId === studio.id && pay.entityType === 'studio');
        const sPaidFromDocs = sPays.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
        const sAdvances = sProjects.reduce((sum, p) => {
          const hasDoc = payments.some(pay => pay.projectId === p.id && pay.entityType === 'studio');
          return hasDoc ? sum : sum + (Number(p.advancePayment) || 0);
        }, 0);
        const sPaid = sPaidFromDocs + sAdvances;
        const outstanding = Math.max(0, sBilling - sPaid);
        const activeProjectsCount = sProjects.filter(p => !['delivered', 'closed'].includes(p.status)).length;

        // 2. Active Filter Pills
        if (activeFilter === 'active_pipeline') {
          return activeProjectsCount > 0;
        }
        if (activeFilter === 'outstanding') {
          return outstanding > 0;
        }
        if (activeFilter === 'settled') {
          return outstanding === 0;
        }
        if (activeFilter === 'high_volume') {
          return sProjects.length >= 2 || studio.tier === 'elite' || studio.tier === 'premium';
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'projects_desc') {
          const countA = projects.filter(p => p.studioId === a.id).length;
          const countB = projects.filter(p => p.studioId === b.id).length;
          return countB - countA;
        }
        if (sortBy === 'billing_desc') {
          const billA = projects.filter(p => p.studioId === a.id).reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
          const billB = projects.filter(p => p.studioId === b.id).reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
          return billB - billA;
        }
        if (sortBy === 'outstanding_desc') {
          const getOutstanding = (s: Studio) => {
            const sProj = projects.filter(p => p.studioId === s.id);
            const sBill = sProj.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
            const sPays = payments.filter(pay => pay.entityId === s.id && pay.entityType === 'studio');
            const sPaidDocs = sPays.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
            const sAdv = sProj.reduce((sum, p) => {
              const hasDoc = payments.some(pay => pay.projectId === p.id && pay.entityType === 'studio');
              return hasDoc ? sum : sum + (Number(p.advancePayment) || 0);
            }, 0);
            return Math.max(0, sBill - (sPaidDocs + sAdv));
          };
          return getOutstanding(b) - getOutstanding(a);
        }
        if (sortBy === 'recent') {
          return (b.id || '').localeCompare(a.id || '');
        }
        return 0;
      });
  }, [studios, projects, payments, searchQuery, activeFilter, sortBy]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Banner with View Tabs */}
      <div className="p-6 sm:p-7 rounded-3xl bg-charcoal-950/80 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-gold-400 font-bold px-2.5 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/20">
              B2B Client Registry
            </span>
            <span className="text-[11px] font-mono text-gray-400">
              {studios.length} Partner Studios Registered
            </span>
          </div>
          <h2 className="text-2xl font-bold font-display text-white mt-1.5 flex items-center gap-2">
            <span>Studio Partners Hub</span>
            <Sparkles className="w-5 h-5 text-gold-400 fill-gold-400/20" />
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-xl leading-relaxed">
            Manage wedding cinematography studios, aggregated contract pipelines, quarterly analytics, and WhatsApp statements.
          </p>
        </div>

        {/* Action Controls: Tab Switcher & Create Studio */}
        <div className="flex flex-wrap items-center gap-3">
          {/* View Tab Switcher */}
          <div className="flex items-center p-1 bg-black/60 border border-white/10 rounded-2xl shadow-inner">
            <button
              type="button"
              id="tab-studio-directory"
              onClick={() => setActiveViewTab('directory')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeViewTab === 'directory'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Directory ({studios.length})</span>
            </button>

            <button
              type="button"
              id="tab-studio-analytics"
              onClick={() => setActiveViewTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeViewTab === 'analytics'
                  ? 'bg-gradient-to-r from-gold-500 to-amber-500 text-charcoal-950 font-bold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Studio Analytics</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                activeViewTab === 'analytics' 
                  ? 'bg-charcoal-950/40 text-charcoal-950' 
                  : 'bg-gold-500/20 text-gold-300'
              }`}>
                Q2 FY26–27
              </span>
            </button>
          </div>

          {(userRole === 'admin' || userRole === 'editor') && (
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 hover:from-luxury-green-700 hover:to-luxury-green-500 border border-gold-500/30 rounded-2xl text-white font-medium text-xs shadow-xl shadow-luxury-green-950/60 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-gold-300" />
              <span className="font-bold hidden sm:inline">Register Studio</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Body Content: Studio Analytics Panel OR Directory Pipeline */}
      {activeViewTab === 'analytics' ? (
        <StudioAnalyticsPanel
          studios={studios}
          projects={projects}
          payments={payments}
          onSelectStudio={(s) => setSelectedStudio(s)}
          onBackToDirectory={() => setActiveViewTab('directory')}
        />
      ) : (
        <>
          {/* Quick Analytics Teaser Banner in Directory */}
          <div 
            onClick={() => setActiveViewTab('analytics')}
            className="p-4 rounded-2xl bg-gradient-to-r from-charcoal-950 via-[#0a1813] to-charcoal-950 border border-gold-500/30 hover:border-gold-400/80 flex items-center justify-between gap-4 cursor-pointer transition-all shadow-lg group"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="p-2.5 rounded-xl bg-gold-500/10 text-gold-400 border border-gold-500/25 group-hover:scale-110 transition-transform shrink-0">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-white group-hover:text-gold-300 transition-colors">
                    Fiscal Quarter Studio Analytics
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30">
                    Q2 FY 2026–27 (Jul – Sep)
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                  View visual charts for projects contributed per studio and total quarterly revenue generated.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-gold-400 group-hover:translate-x-1 transition-transform shrink-0">
              <span>View Charts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Executive KPI Header Bar */}
          <StudiosHeaderKpi
            studios={studios}
            projects={projects}
            payments={payments}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />

          {/* Filter & Sort Toolbar */}
          <StudiosFilterBar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            viewMode={viewMode}
            setViewMode={setViewMode}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            sortBy={sortBy}
            setSortBy={setSortBy}
            totalCount={studios.length}
            filteredCount={filteredAndSortedStudios.length}
            onOpenCreateModal={handleOpenCreateModal}
            userRole={userRole}
          />

          {/* Studio Cards Grid or Executive Table List */}
          {viewMode === 'grid' ? (
            <StudioCardGrid
              studios={filteredAndSortedStudios}
              projects={projects}
              payments={payments}
              userRole={userRole}
              onSelectStudio={(s) => setSelectedStudio(s)}
              onEditStudio={handleOpenEditModal}
              onDeleteStudio={handleDeleteRequest}
              onOpenWhatsApp={handleOpenWhatsApp}
              onQuickCopy={handleQuickCopy}
            />
          ) : (
            <StudioListView
              studios={filteredAndSortedStudios}
              projects={projects}
              payments={payments}
              userRole={userRole}
              onSelectStudio={(s) => setSelectedStudio(s)}
              onEditStudio={handleOpenEditModal}
              onDeleteStudio={handleDeleteRequest}
              onOpenWhatsApp={handleOpenWhatsApp}
              onQuickCopy={handleQuickCopy}
            />
          )}
        </>
      )}

      {/* 5. Studio Slide-Over Ledger Drawer */}
      <StudioDetailDrawer
        studio={selectedStudio}
        projects={projects}
        payments={payments}
        userRole={userRole}
        onClose={() => setSelectedStudio(null)}
        onEditStudio={handleOpenEditModal}
        onDeleteStudio={handleDeleteRequest}
        onOpenWhatsApp={handleOpenWhatsApp}
        onOpenPaymentModal={(s) => setPaymentStudio(s)}
        onQuickCopy={handleQuickCopy}
      />

      {/* 6. Studio Create & Edit Form Modal */}
      <StudioFormModal
        isOpen={isFormModalOpen}
        editingStudio={editingStudio}
        onClose={() => setIsFormModalOpen(false)}
        onSave={handleSaveStudio}
        onToast={triggerToast}
      />

      {/* 7. Studio WhatsApp Dispatch Modal */}
      {whatsAppStudio && (
        <StudioWhatsAppModal
          studio={whatsAppStudio}
          projects={projects}
          payments={payments}
          onClose={() => setWhatsAppStudio(null)}
          onToast={triggerToast}
        />
      )}

      {/* 8. Direct Studio Payment Record Modal */}
      {paymentStudio && (
        <StudioPaymentModal
          studio={paymentStudio}
          projects={projects}
          onClose={() => setPaymentStudio(null)}
          onLogPayment={onLogPayment}
          onToast={triggerToast}
        />
      )}

      {/* 9. Delete Studio Partner Confirmation Modal */}
      <AnimatePresence>
        {studioToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setStudioToDeleteId(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10 space-y-4"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20 shrink-0">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Delete Studio Partner</h3>
                  <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                    Are you sure you want to delete this studio partner? It will be safely moved to the Recycle Bin and can be restored anytime.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setStudioToDeleteId(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (studioToDeleteId) {
                      await onDeleteStudio(studioToDeleteId);
                      setStudioToDeleteId(null);
                      setSelectedStudio(null);
                      triggerToast("Studio Partner Archived", "Studio partner safely moved to Recycle Bin.");
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. Success Notification Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-charcoal-900/95 border border-gold-500/40 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm"
          >
            <div className="p-2 bg-gold-500/20 rounded-xl text-gold-400 shrink-0">
              <Check className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{toast.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 font-mono">{toast.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

export default StudiosView;
