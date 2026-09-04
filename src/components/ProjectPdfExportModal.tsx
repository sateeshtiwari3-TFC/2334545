import React, { useState, useRef } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  HardDrive, 
  IndianRupee, 
  Film, 
  Building2, 
  Tag as TagIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Layers, 
  Eye, 
  SlidersHorizontal,
  FileSpreadsheet,
  CheckSquare,
  StickyNote
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { Project, Studio, Editor, Revision, UserRole } from '../types';
import { captureElementToCanvas } from '../utils/pdfExport';
import { PREDEFINED_PROJECT_TAGS } from '../projectTags';

interface ProjectPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  filteredProjects: Project[];
  studios: Studio[];
  editors: Editor[];
  revisions?: Revision[];
  userRole: UserRole;
  initialScope?: 'filtered' | 'all' | 'single';
  initialProject?: Project | null;
  activeFilterSummary?: {
    status?: string;
    studio?: string;
    tag?: string;
    search?: string;
  };
}

export const ProjectPdfExportModal: React.FC<ProjectPdfExportModalProps> = ({
  isOpen,
  onClose,
  projects,
  filteredProjects,
  studios,
  editors,
  revisions = [],
  userRole,
  initialScope = 'filtered',
  initialProject = null,
  activeFilterSummary
}) => {
  const [scope, setScope] = useState<'filtered' | 'all' | 'single'>(initialScope);
  const [selectedSingleProjectId, setSelectedSingleProjectId] = useState<string>(
    initialProject?.id || filteredProjects[0]?.id || projects[0]?.id || ''
  );
  const [layoutMode, setLayoutMode] = useState<'table' | 'cards' | 'executive'>('table');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Customization toggles
  const [showFinancials, setShowFinancials] = useState(userRole === 'admin');
  const [showEditors, setShowEditors] = useState(true);
  const [showStorage, setShowStorage] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showMilestones, setShowMilestones] = useState(true);

  const documentRef = useRef<HTMLDivElement>(null);

  // Sync initial props if changed
  React.useEffect(() => {
    if (initialProject) {
      setScope('single');
      setSelectedSingleProjectId(initialProject.id);
    } else {
      setScope(initialScope);
    }
  }, [initialProject, initialScope, isOpen]);

  if (!isOpen) return null;

  // Determine active project list based on scope
  const targetProjects = scope === 'all'
    ? projects
    : scope === 'filtered'
    ? filteredProjects
    : projects.filter(p => p.id === selectedSingleProjectId);

  // Totals calculations
  const totalValue = targetProjects.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
  const totalAdvance = targetProjects.reduce((sum, p) => sum + (Number(p.advancePayment) || 0), 0);
  const totalBalanceDue = targetProjects.reduce(
    (sum, p) => sum + Number(p.remainingBalance ?? (Number(p.projectAmount || 0) - Number(p.advancePayment || 0))),
    0
  );
  const totalEditorFees = targetProjects.reduce((sum, p) => sum + (Number(p.editorPayment) || 0), 0);
  const deliveredCount = targetProjects.filter(p => ['delivered', 'closed'].includes(p.status)).length;
  const editingCount = targetProjects.filter(p => p.status === 'editing').length;
  const delayedCount = targetProjects.filter(p => {
    if (['delivered', 'closed'].includes(p.status) || !p.deliveryDate) return false;
    const diff = Math.ceil((new Date(p.deliveryDate).getTime() - Date.now()) / (1000 * 3600 * 24));
    return diff < 0;
  }).length;

  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  const currentTimeFormatted = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const lines: string[] = [
      `THE FRAME CUT STUDIO • PROJECT SUMMARY REPORT`,
      `Generated: ${currentDateFormatted} ${currentTimeFormatted}`,
      `Total Projects: ${targetProjects.length} | Completed: ${deliveredCount} | In Editing: ${editingCount} | Delayed: ${delayedCount}`,
      `Financials: Total Rs. ${totalValue.toLocaleString('en-IN')} | Advance: Rs. ${totalAdvance.toLocaleString('en-IN')} | Outstanding Due: Rs. ${totalBalanceDue.toLocaleString('en-IN')}`,
      `--------------------------------------------------`,
      ...targetProjects.map(p => {
        const bal = Number(p.remainingBalance ?? (Number(p.projectAmount || 0) - Number(p.advancePayment || 0)));
        return `[${p.id}] ${p.projectName || p.coupleName} | Studio: ${p.studioName} | Status: ${p.status.toUpperCase()} | Deadline: ${p.deliveryDate || 'TBD'} | Balance Due: Rs. ${bal.toLocaleString('en-IN')}`;
      })
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = async () => {
    if (!documentRef.current) return;
    setIsExporting(true);

    try {
      const bgColor = theme === 'dark' ? '#131417' : '#ffffff';
      const canvas = await captureElementToCanvas(documentRef.current, {
        scale: 2.2,
        backgroundColor: bgColor
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const isLandscape = layoutMode === 'table';
      
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      const pageWidth = isLandscape ? 297 : 210;
      const pageHeight = isLandscape ? 210 : 297;

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fileName = `TheFrameCutStudio_Projects_${scope}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Failed to generate PDF. You can also use the Print button to save as PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-charcoal-900 border border-gold-500/40 rounded-3xl w-full max-w-6xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden my-auto"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-luxury-green-800/20 bg-charcoal-950/70 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-luxury-green-800 to-luxury-green-900 text-gold-400 border border-gold-500/30 shadow-md">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black font-display text-white">
                  Export Projects to PDF
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-500/15 text-gold-400 border border-gold-500/30 font-bold uppercase">
                  Styled Document
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Generate executive summaries, client deliverables ledgers, and cinematic project dossiers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MODAL BODY (2 Columns: Controls on Left/Top, Live Preview on Right/Bottom) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* CONFIGURATION PANEL (4 Cols on LG) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-charcoal-950/90 border-r border-luxury-green-800/15 overflow-y-auto custom-scrollbar space-y-5">
            
            {/* 1. Scope Selector */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-gold-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>1. Export Scope</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setScope('filtered')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    scope === 'filtered'
                      ? 'bg-luxury-green-800/80 border-gold-400 text-gold-300 font-bold shadow-md'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="block text-xs font-bold">Filtered View</span>
                  <span className="text-[10px] font-mono opacity-80">{filteredProjects.length} items</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('all')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    scope === 'all'
                      ? 'bg-luxury-green-800/80 border-gold-400 text-gold-300 font-bold shadow-md'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="block text-xs font-bold">All Records</span>
                  <span className="text-[10px] font-mono opacity-80">{projects.length} total</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScope('single')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    scope === 'single'
                      ? 'bg-luxury-green-800/80 border-gold-400 text-gold-300 font-bold shadow-md'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="block text-xs font-bold">Single Project</span>
                  <span className="text-[10px] font-mono opacity-80">1 Brief</span>
                </button>
              </div>

              {scope === 'single' && (
                <div className="mt-2">
                  <label className="text-[10px] font-mono text-gray-400 block mb-1">Select Target Project:</label>
                  <select
                    value={selectedSingleProjectId}
                    onChange={(e) => setSelectedSingleProjectId(e.target.value)}
                    className="w-full bg-charcoal-900 border border-gold-500/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer font-sans"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.id} • {p.projectName || p.coupleName} ({p.studioName})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Document Layout Style */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-gold-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>2. Document Layout</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLayoutMode('table')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    layoutMode === 'table'
                      ? 'bg-luxury-green-800/80 border-gold-400 text-gold-300 font-bold shadow-md'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="block text-xs font-bold">Executive Table</span>
                  <span className="text-[9px] font-mono opacity-80">Landscape Ledger</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('cards')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    layoutMode === 'cards'
                      ? 'bg-luxury-green-800/80 border-gold-400 text-gold-300 font-bold shadow-md'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="block text-xs font-bold">Dossier Cards</span>
                  <span className="text-[9px] font-mono opacity-80">Visual Catalog</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('executive')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    layoutMode === 'executive'
                      ? 'bg-luxury-green-800/80 border-gold-400 text-gold-300 font-bold shadow-md'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="block text-xs font-bold">Compact Sheet</span>
                  <span className="text-[9px] font-mono opacity-80">KPI Overview</span>
                </button>
              </div>
            </div>

            {/* 3. Theme Preset */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-gold-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Color Theme</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-charcoal-950 border-gold-400 text-gold-300 font-bold ring-1 ring-gold-400/40'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-charcoal-950 border border-gold-500" />
                  <span className="text-xs">Cinematic Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`p-2.5 rounded-xl border flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white border-amber-500 text-gray-900 font-bold ring-1 ring-amber-500/40'
                      : 'bg-charcoal-900 border-white/5 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white border border-gray-400" />
                  <span className="text-xs">Print Clean Light</span>
                </button>
              </div>
            </div>

            {/* 4. Section Inclusions */}
            <div className="space-y-2.5 pt-2 border-t border-white/10">
              <label className="text-xs font-mono text-gold-400 font-bold uppercase tracking-wider block">
                4. Data Columns & Details
              </label>
              <div className="space-y-2 text-xs">
                {userRole === 'admin' && (
                  <label className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900 border border-white/5 cursor-pointer hover:bg-charcoal-850">
                    <span className="text-gray-300 flex items-center gap-1.5">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Financial Balances & Totals</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={showFinancials}
                      onChange={(e) => setShowFinancials(e.target.checked)}
                      className="rounded border-white/20 text-gold-500 focus:ring-0 bg-charcoal-950 cursor-pointer"
                    />
                  </label>
                )}

                <label className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900 border border-white/5 cursor-pointer hover:bg-charcoal-850">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Lead & Split Editor Details</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showEditors}
                    onChange={(e) => setShowEditors(e.target.checked)}
                    className="rounded border-white/20 text-gold-500 focus:ring-0 bg-charcoal-950 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900 border border-white/5 cursor-pointer hover:bg-charcoal-850">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                    <span>Disk Storage & Backup Info</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showStorage}
                    onChange={(e) => setShowStorage(e.target.checked)}
                    className="rounded border-white/20 text-gold-500 focus:ring-0 bg-charcoal-950 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900 border border-white/5 cursor-pointer hover:bg-charcoal-850">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
                    <span>Milestones & Revision Counts</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showMilestones}
                    onChange={(e) => setShowMilestones(e.target.checked)}
                    className="rounded border-white/20 text-gold-500 focus:ring-0 bg-charcoal-950 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-charcoal-900 border border-white/5 cursor-pointer hover:bg-charcoal-850">
                  <span className="text-gray-300 flex items-center gap-1.5">
                    <StickyNote className="w-3.5 h-3.5 text-amber-300" />
                    <span>Project Notes & Instructions</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={showNotes}
                    onChange={(e) => setShowNotes(e.target.checked)}
                    className="rounded border-white/20 text-gold-500 focus:ring-0 bg-charcoal-950 cursor-pointer"
                  />
                </label>
              </div>
            </div>

            {/* Target Summary Stats Card */}
            <div className="p-3 bg-charcoal-900/90 rounded-2xl border border-white/10 space-y-2 text-xs">
              <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">
                Export Target Metrics ({targetProjects.length} Projects)
              </span>
              <div className="grid grid-cols-2 gap-2 text-center font-mono">
                <div className="p-2 bg-charcoal-950 rounded-xl border border-white/5">
                  <span className="text-[9px] text-gray-400 block">Completed</span>
                  <span className="text-emerald-400 font-bold">{deliveredCount}</span>
                </div>
                <div className="p-2 bg-charcoal-950 rounded-xl border border-white/5">
                  <span className="text-[9px] text-gray-400 block">In Editing</span>
                  <span className="text-amber-400 font-bold">{editingCount}</span>
                </div>
                {userRole === 'admin' && showFinancials && (
                  <>
                    <div className="p-2 bg-charcoal-950 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 block">Total Contract</span>
                      <span className="text-gold-300 font-bold text-[11px]">₹{totalValue.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="p-2 bg-charcoal-950 rounded-xl border border-white/5">
                      <span className="text-[9px] text-gray-400 block">Pending Dues</span>
                      <span className="text-rose-400 font-bold text-[11px]">₹{totalBalanceDue.toLocaleString('en-IN')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* LIVE PREVIEW & RENDER CONTAINER (8 Cols on LG) */}
          <div className="lg:col-span-8 bg-charcoal-950/60 p-3 sm:p-5 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 text-xs font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-gold-400" />
                <span>Live Document Preview ({theme.toUpperCase()} MODE)</span>
              </span>
              <span>{targetProjects.length} Project(s) in document</span>
            </div>

            {/* SCROLLABLE DOCUMENT PREVIEW WINDOW */}
            <div className="flex-1 overflow-y-auto custom-scrollbar my-3 p-2 bg-charcoal-900/50 rounded-2xl border border-white/5 flex justify-center items-start">
              
              {/* THE ACTUAL RENDERED DOCUMENT TARGET */}
              <div
                ref={documentRef}
                id="pdf-project-document-root"
                style={{
                  width: layoutMode === 'table' ? '1000px' : '820px',
                  backgroundColor: theme === 'dark' ? '#131417' : '#ffffff',
                  color: theme === 'dark' ? '#f1f5f9' : '#0f172a',
                  fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
                }}
                className={`p-8 shadow-2xl rounded-xl transition-all select-text ${
                  theme === 'dark' ? 'border border-gold-500/20' : 'border border-gray-300 text-gray-900'
                }`}
              >
                {/* 1. DOCUMENT HEADER */}
                <div className={`border-b pb-5 mb-5 flex justify-between items-start ${
                  theme === 'dark' ? 'border-amber-500/30' : 'border-gray-300'
                }`}>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono uppercase tracking-widest font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                        Official Production Document
                      </span>
                      <span className={`text-[10px] font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Ref: THE-FRAME-CUT-{new Date().getFullYear()}
                      </span>
                    </div>

                    <h1 className={`text-2xl font-black tracking-tight mt-2 font-display uppercase ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      The Frame Cut Studio
                    </h1>
                    <p className={`text-xs mt-0.5 font-sans ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Luxury Wedding Cinema & Post-Production Suite • Client Specifications & Registry
                    </p>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-mono uppercase tracking-wider block ${
                      theme === 'dark' ? 'text-amber-400' : 'text-amber-700'
                    }`}>
                      Date Generated:
                    </span>
                    <span className={`text-sm font-bold font-mono ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {currentDateFormatted}
                    </span>
                    <span className={`block text-[10px] font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      {currentTimeFormatted}
                    </span>
                    <span className={`inline-block mt-1 text-[9px] font-mono font-bold px-2 py-0.5 rounded ${
                      theme === 'dark' ? 'bg-charcoal-800 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                      Scope: {scope.toUpperCase()} ({targetProjects.length} records)
                    </span>
                  </div>
                </div>

                {/* 2. EXECUTIVE METRICS STRIP */}
                <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl mb-6 ${
                  theme === 'dark' ? 'bg-charcoal-900/80 border border-white/10' : 'bg-gray-50 border border-gray-200'
                }`}>
                  <div>
                    <span className={`text-[9px] font-mono uppercase block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Total Projects
                    </span>
                    <span className={`text-xl font-bold font-display ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {targetProjects.length}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-mono font-semibold block">
                      {deliveredCount} Completed
                    </span>
                  </div>

                  <div>
                    <span className={`text-[9px] font-mono uppercase block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                      Active In Pipeline
                    </span>
                    <span className={`text-xl font-bold font-display text-amber-500`}>
                      {editingCount}
                    </span>
                    <span className={`text-[10px] font-mono font-semibold block ${delayedCount > 0 ? 'text-rose-500' : 'text-gray-500'}`}>
                      {delayedCount} Delayed / Urgent
                    </span>
                  </div>

                  {userRole === 'admin' && showFinancials && (
                    <>
                      <div>
                        <span className={`text-[9px] font-mono uppercase block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Contract Value
                        </span>
                        <span className={`text-xl font-bold font-display ${theme === 'dark' ? 'text-amber-400' : 'text-amber-700'}`}>
                          ₹{totalValue.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-emerald-600 font-mono font-semibold block">
                          ₹{totalAdvance.toLocaleString('en-IN')} Adv. Paid
                        </span>
                      </div>

                      <div>
                        <span className={`text-[9px] font-mono uppercase block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Outstanding Balance
                        </span>
                        <span className="text-xl font-bold font-display text-rose-500">
                          ₹{totalBalanceDue.toLocaleString('en-IN')}
                        </span>
                        <span className={`text-[10px] font-mono block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Across {targetProjects.filter(p => Number(p.remainingBalance ?? (Number(p.projectAmount || 0) - Number(p.advancePayment || 0))) > 0).length} Projects
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* 3. DOCUMENT BODY ACCORDING TO LAYOUT MODE */}

                {/* --- MODE A: EXECUTIVE TABLE LEDGER --- */}
                {layoutMode === 'table' && (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className={`border-b text-[9px] uppercase font-mono tracking-wider ${
                            theme === 'dark'
                              ? 'bg-charcoal-900/90 text-amber-400 border-amber-500/30'
                              : 'bg-amber-50 text-amber-900 border-amber-300'
                          }`}>
                            <th className="p-2.5 font-bold"># ID</th>
                            <th className="p-2.5 font-bold">Couple & Project</th>
                            <th className="p-2.5 font-bold">Studio Partner</th>
                            <th className="p-2.5 font-bold">Deliverables</th>
                            <th className="p-2.5 font-bold">Shoot / Deadline</th>
                            {showEditors && <th className="p-2.5 font-bold">Lead Editor</th>}
                            <th className="p-2.5 font-bold">Status</th>
                            {showStorage && <th className="p-2.5 font-bold">Storage / HDD</th>}
                            {userRole === 'admin' && showFinancials && <th className="p-2.5 font-bold text-right">Balance Due</th>}
                          </tr>
                        </thead>
                        <tbody className={`divide-y font-sans ${theme === 'dark' ? 'divide-white/10' : 'divide-gray-200'}`}>
                          {targetProjects.map((proj, idx) => {
                            const balance = Number(proj.remainingBalance ?? (Number(proj.projectAmount || 0) - Number(proj.advancePayment || 0)));
                            const isDelayed = proj.deliveryDate && !['delivered', 'closed'].includes(proj.status) && (new Date(proj.deliveryDate).getTime() < Date.now());

                            return (
                              <tr key={proj.id} className={idx % 2 === 0 ? (theme === 'dark' ? 'bg-charcoal-950/40' : 'bg-gray-50/70') : ''}>
                                <td className="p-2.5 font-mono font-bold text-[10px] text-amber-500 whitespace-nowrap">
                                  {proj.id}
                                </td>
                                <td className="p-2.5">
                                  <span className="font-bold block leading-tight">
                                    {proj.projectName || proj.coupleName}
                                  </span>
                                  {proj.projectName && (
                                    <span className={`text-[9px] block font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {proj.coupleName}
                                    </span>
                                  )}
                                </td>
                                <td className={`p-2.5 font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {proj.studioName || 'Direct Client'}
                                </td>
                                <td className="p-2.5">
                                  <span className={`text-[10px] line-clamp-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {proj.eventType}
                                  </span>
                                </td>
                                <td className="p-2.5 font-mono text-[10px] whitespace-nowrap">
                                  <div>Shot: {proj.shootDate || 'N/A'}</div>
                                  <div className={isDelayed ? 'text-rose-500 font-bold' : (theme === 'dark' ? 'text-gray-300' : 'text-gray-700')}>
                                    Due: {proj.deliveryDate || 'N/A'} {isDelayed && '⚠️ Overdue'}
                                  </div>
                                </td>
                                {showEditors && (
                                  <td className="p-2.5 text-[10px]">
                                    <span className="font-semibold block">{proj.assignedEditorName || 'Unassigned'}</span>
                                    {proj.isSplitProject && (
                                      <span className="text-[9px] text-amber-500 font-mono block">+ Split: {proj.secondEditorName}</span>
                                    )}
                                  </td>
                                )}
                                <td className="p-2.5 whitespace-nowrap">
                                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                    ['delivered', 'closed'].includes(proj.status)
                                      ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                                      : proj.status === 'editing'
                                      ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                                      : 'bg-blue-500/20 text-blue-600 border border-blue-500/30'
                                  }`}>
                                    {proj.status.replace('_', ' ')}
                                  </span>
                                </td>
                                {showStorage && (
                                  <td className={`p-2.5 text-[10px] font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <div>{proj.hardDiskName || 'Cloud Drive'}</div>
                                    <div className="text-[9px] text-amber-500">{proj.dataSize || '-'}</div>
                                  </td>
                                )}
                                {userRole === 'admin' && showFinancials && (
                                  <td className="p-2.5 text-right font-mono whitespace-nowrap">
                                    <div className="font-bold text-[11px] text-gray-900 dark:text-white">
                                      ₹{(Number(proj.projectAmount) || 0).toLocaleString('en-IN')}
                                    </div>
                                    <div className={balance > 0 ? 'text-rose-500 font-bold text-[10px]' : 'text-emerald-500 text-[10px]'}>
                                      {balance > 0 ? `Due: ₹${balance.toLocaleString('en-IN')}` : 'Cleared'}
                                    </div>
                                  </td>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Table Totals Row */}
                    <div className={`p-3 rounded-xl flex justify-between items-center text-xs font-mono font-bold ${
                      theme === 'dark' ? 'bg-charcoal-900 border border-white/10 text-white' : 'bg-gray-100 border border-gray-300 text-gray-900'
                    }`}>
                      <span>GRAND TOTALS ({targetProjects.length} Projects)</span>
                      {userRole === 'admin' && showFinancials && (
                        <div className="flex items-center space-x-4">
                          <span>Total Contract: ₹{totalValue.toLocaleString('en-IN')}</span>
                          <span className="text-rose-500">Total Due: ₹{totalBalanceDue.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* --- MODE B: PROJECT DOSSIER CARDS --- */}
                {layoutMode === 'cards' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {targetProjects.map((proj) => {
                        const balance = Number(proj.remainingBalance ?? (Number(proj.projectAmount || 0) - Number(proj.advancePayment || 0)));
                        const projRevs = revisions.filter(r => r.projectId === proj.id);

                        return (
                          <div
                            key={proj.id}
                            className={`p-4 rounded-xl border space-y-3 ${
                              theme === 'dark' ? 'bg-charcoal-900/90 border-white/10' : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 border-b pb-2.5 border-white/10">
                              <div>
                                <span className="text-[9px] font-mono font-bold text-amber-500 uppercase block">
                                  {proj.id} • {proj.studioName}
                                </span>
                                <h3 className="text-sm font-bold leading-snug">
                                  {proj.projectName || proj.coupleName}
                                </h3>
                                <p className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {proj.eventType}
                                </p>
                              </div>

                              <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase shrink-0 ${
                                ['delivered', 'closed'].includes(proj.status)
                                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                              }`}>
                                {proj.status}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                              <div>
                                <span className={`text-[8px] block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Shoot Date</span>
                                <span className="font-semibold">{proj.shootDate || 'TBD'}</span>
                              </div>
                              <div>
                                <span className={`text-[8px] block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Delivery Deadline</span>
                                <span className="font-semibold">{proj.deliveryDate || 'TBD'}</span>
                              </div>
                              {showEditors && (
                                <div className="col-span-2">
                                  <span className={`text-[8px] block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Assigned Editor</span>
                                  <span className="font-semibold">
                                    {proj.assignedEditorName || 'Unassigned'} {proj.isSplitProject ? `(Split: ${proj.secondEditorName})` : ''}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Storage references */}
                            {showStorage && (
                              <div className={`p-2 rounded-lg text-[9px] font-mono flex items-center justify-between ${
                                theme === 'dark' ? 'bg-charcoal-950 border border-white/5 text-gray-300' : 'bg-white border border-gray-200 text-gray-700'
                              }`}>
                                <span>HDD: {proj.hardDiskName || 'Cloud'} ({proj.dataSize || 'N/A'})</span>
                                <span className={proj.backupStatus === 'backed_up' ? 'text-emerald-500' : 'text-amber-500'}>
                                  {proj.backupStatus === 'backed_up' ? '✓ Backed Up' : '⏳ Pending Backup'}
                                </span>
                              </div>
                            )}

                            {/* Revisions & Milestones */}
                            {showMilestones && (
                              <div className="flex items-center justify-between text-[9px] font-mono pt-1">
                                <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                  Revisions: {projRevs.length} logged
                                </span>
                                {proj.customMilestones && proj.customMilestones.length > 0 && (
                                  <span className="text-amber-500 font-bold">
                                    🏁 {proj.customMilestones.filter(m => m.completed).length}/{proj.customMilestones.length} Milestones
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Notes */}
                            {showNotes && proj.notes && (
                              <p className={`text-[9px] p-2 rounded-lg italic line-clamp-2 ${
                                theme === 'dark' ? 'bg-charcoal-950 text-gray-300' : 'bg-gray-100 text-gray-700'
                              }`}>
                                "{proj.notes}"
                              </p>
                            )}

                            {/* Financial strip */}
                            {userRole === 'admin' && showFinancials && (
                              <div className={`border-t pt-2 flex justify-between items-center text-[10px] font-mono font-bold ${
                                theme === 'dark' ? 'border-white/10' : 'border-gray-200'
                              }`}>
                                <span>Value: ₹{(Number(proj.projectAmount) || 0).toLocaleString('en-IN')}</span>
                                <span className={balance > 0 ? 'text-rose-500' : 'text-emerald-500'}>
                                  {balance > 0 ? `Due: ₹${balance.toLocaleString('en-IN')}` : 'Cleared'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- MODE C: EXECUTIVE COMPACT SPEC SHEET --- */}
                {layoutMode === 'executive' && (
                  <div className="space-y-4 text-xs font-sans">
                    <div className={`p-4 rounded-xl border space-y-3 ${
                      theme === 'dark' ? 'bg-charcoal-900 border-white/10' : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h3 className="font-bold font-display uppercase tracking-wider text-amber-500 text-xs">
                        Registry Overview & Pipeline Status
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="space-y-1">
                          <span className={`text-[9px] uppercase font-mono block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Report Period</span>
                          <span className="font-bold">Active Operations</span>
                        </div>
                        <div className="space-y-1">
                          <span className={`text-[9px] uppercase font-mono block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Target Volume</span>
                          <span className="font-bold">{targetProjects.length} Productions</span>
                        </div>
                        <div className="space-y-1">
                          <span className={`text-[9px] uppercase font-mono block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Completed Delivery</span>
                          <span className="font-bold text-emerald-600">{deliveredCount} Productions ({Math.round((deliveredCount / (targetProjects.length || 1)) * 100)}%)</span>
                        </div>
                        <div className="space-y-1">
                          <span className={`text-[9px] uppercase font-mono block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Delayed / Action Due</span>
                          <span className={`font-bold ${delayedCount > 0 ? 'text-rose-600' : 'text-gray-600'}`}>{delayedCount} Productions</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed List */}
                    <div className="space-y-2">
                      {targetProjects.map(proj => {
                        const balance = Number(proj.remainingBalance ?? (Number(proj.projectAmount || 0) - Number(proj.advancePayment || 0)));
                        return (
                          <div
                            key={proj.id}
                            className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                              theme === 'dark' ? 'bg-charcoal-950/60 border-white/10' : 'bg-white border-gray-200'
                            }`}
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-amber-500 font-bold text-[10px]">{proj.id}</span>
                                <span className="font-bold">{proj.projectName || proj.coupleName}</span>
                                <span className={`text-[10px] ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>• {proj.studioName}</span>
                              </div>
                              <div className={`text-[10px] font-mono ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Deliverables: {proj.eventType} | Editor: {proj.assignedEditorName || 'Unassigned'} | Due: {proj.deliveryDate || 'N/A'}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 text-right shrink-0 font-mono">
                              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                                ['delivered', 'closed'].includes(proj.status) ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'
                              }`}>
                                {proj.status}
                              </span>
                              {userRole === 'admin' && showFinancials && (
                                <div className="text-right">
                                  <span className="font-bold block">₹{(Number(proj.projectAmount) || 0).toLocaleString('en-IN')}</span>
                                  {balance > 0 && <span className="text-[10px] text-rose-500 font-semibold block">Due: ₹{balance.toLocaleString('en-IN')}</span>}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4. DOCUMENT FOOTER */}
                <div className={`mt-8 pt-4 border-t flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono ${
                  theme === 'dark' ? 'border-white/10 text-gray-400' : 'border-gray-300 text-gray-600'
                }`}>
                  <div>
                    <span>THE FRAME CUT STUDIO • CONFIDENTIAL PRODUCTION SUMMARY</span>
                  </div>
                  <div className="mt-1 sm:mt-0">
                    <span>Generated on {currentDateFormatted} • Page 1 of 1</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTION BUTTONS FOOTER */}
            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="px-3.5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-xs text-gray-300 hover:text-white font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Summary' : 'Copy Text'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-xs text-gray-300 hover:text-white font-mono flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" />
                  <span>Print Document</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Close
                </button>

                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleDownloadPDF}
                  className="px-5 py-2 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 hover:from-luxury-green-700 hover:to-luxury-green-500 border border-gold-500/40 text-gold-300 hover:text-white font-bold text-xs rounded-xl shadow-lg flex items-center space-x-2 cursor-pointer gold-glow transition-all disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-gold-300" />
                  <span>{isExporting ? 'Generating PDF...' : 'Download PDF Document'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ProjectPdfExportModal;
