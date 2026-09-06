import React, { useRef, useState, useMemo, useEffect } from 'react';
import { 
  Printer, 
  Download, 
  X, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  FileText, 
  Building2, 
  Mail, 
  Phone, 
  Star, 
  Layers, 
  CheckCheck, 
  Receipt,
  User,
  Film,
  Camera,
  Award,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Percent,
  Plus,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Editor, Project, PaymentHistory, Studio } from '../types';
import { captureElementToCanvas } from '../utils/pdfExport';
import Logo from './Logo';

interface CustomWorkItem {
  id: string;
  description: string;
  projectOrCouple: string;
  scope: string;
  amount: number;
}

interface EditorPdfExportModalProps {
  editor: Editor | null;
  projects: Project[];
  payments: PaymentHistory[];
  studios?: Studio[];
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'profile' | 'invoice';
  initialProjectId?: string;
}

// Convert number to Indian Rupee Words
function numberToWords(num: number): string {
  if (isNaN(num) || num === 0) return 'Zero Rupees Only';
  const a = [
    '', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ',
    'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + 'Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else if (n > 0) {
      str += a[n];
    }
    return str;
  }

  let crore = Math.floor(num / 10000000);
  num %= 10000000;
  let lakh = Math.floor(num / 100000);
  num %= 100000;
  let thousand = Math.floor(num / 1000);
  num %= 1000;
  let remainder = num;

  let res = '';
  if (crore > 0) res += inWords(crore) + 'Crore ';
  if (lakh > 0) res += inWords(lakh) + 'Lakh ';
  if (thousand > 0) res += inWords(thousand) + 'Thousand ';
  if (remainder > 0) res += inWords(remainder);

  return (res.trim() + ' Rupees Only');
}

export const EditorPdfExportModal: React.FC<EditorPdfExportModalProps> = ({
  editor,
  projects,
  payments,
  studios = [],
  isOpen,
  onClose,
  defaultTab = 'profile',
  initialProjectId = 'all'
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'invoice'>(defaultTab);
  const [isExporting, setIsExporting] = useState(false);
  const [invoiceTheme, setInvoiceTheme] = useState<'dark_minimal' | 'classic_light'>('classic_light');
  
  // Custom Invoice Configurations
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-EDT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customBonus, setCustomBonus] = useState<number>(0);
  const [customDeduction, setCustomDeduction] = useState<number>(0);
  const [invoiceNotes, setInvoiceNotes] = useState('Payment settlement for wedding post-production video editing services.');
  
  // Work Scope Mode: 'all' | 'single' | 'custom'
  const [workScopeMode, setWorkScopeMode] = useState<'single' | 'all' | 'custom'>(initialProjectId !== 'all' ? 'single' : 'all');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId);

  // Custom Work Line Items
  const [customItems, setCustomItems] = useState<CustomWorkItem[]>([
    {
      id: 'item-1',
      description: 'Cinematic Wedding Teaser & Highlight Cut (4K)',
      projectOrCouple: 'Aarav & Meera Wedding',
      scope: 'Post-Production Video Edit',
      amount: 12000
    },
    {
      id: 'item-2',
      description: 'Instagram Reels & Vertical Teasers (Set of 3)',
      projectOrCouple: 'Aarav & Meera Wedding',
      scope: 'Social Cut 9:16',
      amount: 3500
    }
  ]);
  const [newCustomDesc, setNewCustomDesc] = useState('');
  const [newCustomCouple, setNewCustomCouple] = useState('');
  const [newCustomScope, setNewCustomScope] = useState('Post-Production Edit');
  const [newCustomAmount, setNewCustomAmount] = useState<number>(5000);
  const [showAddCustomRow, setShowAddCustomRow] = useState(false);

  // Update initialProjectId when modal opens with a new initial project
  useEffect(() => {
    if (initialProjectId && initialProjectId !== 'all') {
      setSelectedProjectId(initialProjectId);
      setWorkScopeMode('single');
    }
  }, [initialProjectId]);

  // Filter editor projects
  const editorProjects = useMemo(() => {
    if (!editor) return [];
    return projects.filter(p => p.assignedEditorId === editor.id || (p.isSplitProject && p.secondEditorId === editor.id));
  }, [editor, projects]);

  // Filter editor payments
  const editorPayments = useMemo(() => {
    if (!editor) return [];
    return payments.filter(pay => pay.entityId === editor.id && pay.entityType === 'editor');
  }, [editor, payments]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalProjects = editorProjects.length;
    const completedProjects = editorProjects.filter(p => p.status === 'delivered' || p.status === 'closed');
    const inProgressProjects = editorProjects.filter(p => p.status !== 'delivered' && p.status !== 'closed');
    
    let totalEarned = 0;
    editorProjects.forEach(p => {
      if (p.isSplitProject) {
        if (p.assignedEditorId === editor?.id) {
          totalEarned += (p.firstEditorShare || 0);
        } else if (p.secondEditorId === editor?.id) {
          totalEarned += (p.secondEditorShare || 0);
        }
      } else {
        totalEarned += (p.editorPayment || 0);
      }
    });

    const totalPaid = editorPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const balanceDue = totalEarned - totalPaid;

    // Categorized event counts
    const weddingCount = editorProjects.filter(p => (p.eventType || '').toLowerCase().includes('wedding')).length;
    const preWeddingCount = editorProjects.filter(p => (p.eventType || '').toLowerCase().includes('pre')).length;
    const otherEventsCount = totalProjects - (weddingCount + preWeddingCount);

    return {
      totalProjects,
      completedCount: completedProjects.length,
      inProgressCount: inProgressProjects.length,
      totalEarned,
      totalPaid,
      balanceDue,
      weddingCount,
      preWeddingCount,
      otherEventsCount,
      completionRate: totalProjects > 0 ? Math.round((completedProjects.length / totalProjects) * 100) : 100
    };
  }, [editorProjects, editorPayments, editor]);

  // Invoice Items calculation
  const invoiceProjects = useMemo(() => {
    if (workScopeMode === 'single') {
      if (selectedProjectId === 'all' && editorProjects.length > 0) {
        return [editorProjects[0]];
      }
      return editorProjects.filter(p => p.id === selectedProjectId);
    }
    if (workScopeMode === 'custom') {
      return [];
    }
    return editorProjects;
  }, [editorProjects, selectedProjectId, workScopeMode]);

  const invoiceSubtotal = useMemo(() => {
    if (workScopeMode === 'custom') {
      return customItems.reduce((sum, item) => sum + (item.amount || 0), 0);
    }
    return invoiceProjects.reduce((sum, p) => {
      if (p.isSplitProject) {
        if (p.assignedEditorId === editor?.id) {
          return sum + (p.firstEditorShare || 0);
        } else if (p.secondEditorId === editor?.id) {
          return sum + (p.secondEditorShare || 0);
        }
      }
      return sum + (p.editorPayment || 0);
    }, 0);
  }, [invoiceProjects, editor, workScopeMode, customItems]);

  const invoicePaidAmount = useMemo(() => {
    if (workScopeMode === 'custom') {
      return 0;
    }
    if (workScopeMode === 'single') {
      const activeProjId = selectedProjectId === 'all' && editorProjects.length > 0 ? editorProjects[0].id : selectedProjectId;
      return editorPayments
        .filter(p => p.projectId === activeProjId)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    }
    return stats.totalPaid;
  }, [workScopeMode, selectedProjectId, editorProjects, stats.totalPaid, editorPayments]);

  const finalInvoicePayable = Math.max(0, invoiceSubtotal + customBonus - customDeduction - invoicePaidAmount);

  // PDF Downloader
  const handleDownloadPdf = async () => {
    if (!printRef.current || !editor) return;
    setIsExporting(true);
    try {
      const canvas = await captureElementToCanvas(printRef.current, {
        scale: 2,
        backgroundColor: activeTab === 'profile' || invoiceTheme === 'classic_light' ? '#ffffff' : '#0e1117'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight > pdfHeight) {
        let heightLeft = imgHeight;
        let position = 0;
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
          heightLeft -= pdfHeight;
        }
      } else {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      const fileName = activeTab === 'profile' 
        ? `${editor.name.replace(/\s+/g, '_')}_Profile_Summary.pdf`
        : `${editor.name.replace(/\s+/g, '_')}_Invoice_${invoiceNumber}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error('PDF Generation failed:', error);
      alert('Failed to generate PDF. Please try the Print option.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  if (!isOpen || !editor) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      {/* Container Dialog */}
      <div className="relative w-full max-w-5xl bg-charcoal-900 border border-luxury-green-800/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:w-full print:max-w-none">
        
        {/* Top Control Bar (Hidden when printing) */}
        <div className="p-4 sm:p-5 bg-charcoal-950/90 border-b border-luxury-green-800/20 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gold-500/10 rounded-xl text-gold-400 border border-gold-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-display text-white flex items-center gap-2">
                <span>{editor.name}</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-charcoal-800 text-gold-400 border border-gold-500/20">
                  {activeTab === 'profile' ? 'Profile Summary' : 'Editor Invoice'}
                </span>
              </h2>
              <p className="text-[11px] text-gray-400">Generate clean, professional printable PDF documents.</p>
            </div>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center space-x-2">
            <div className="bg-charcoal-900 p-1 rounded-xl border border-luxury-green-800/30 flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'profile'
                    ? 'bg-gold-500 text-charcoal-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile CV / Summary</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('invoice')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'invoice'
                    ? 'bg-gold-500 text-charcoal-950 shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Editor Invoice / Payout</span>
              </button>
            </div>

            {/* Print & Download Action Buttons */}
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-4 py-2 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 hover:from-luxury-green-700 hover:to-luxury-green-500 border border-gold-500/30 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-gold-300" />
              <span>{isExporting ? 'Generating PDF...' : 'Download PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleNativePrint}
              className="p-2 bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white border border-gray-700 rounded-xl transition-colors cursor-pointer"
              title="Print Document"
            >
              <Printer className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-charcoal-800 text-gray-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Invoice Customization Toolbar (Only visible when invoice tab active) */}
        {activeTab === 'invoice' && (
          <div className="px-5 py-3 bg-charcoal-950/70 border-b border-luxury-green-800/20 space-y-2.5 text-xs font-mono print:hidden">
            {/* Top Toolbar: Scope Mode Switcher & Project Selection */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-gold-400 font-bold text-[11px] flex items-center gap-1">
                  <Film className="w-3.5 h-3.5" />
                  <span>Invoice Scope:</span>
                </span>

                <div className="bg-charcoal-900 p-0.5 rounded-lg border border-luxury-green-800/40 flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkScopeMode('single');
                      if (selectedProjectId === 'all' && editorProjects.length > 0) {
                        setSelectedProjectId(editorProjects[0].id);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer font-bold ${
                      workScopeMode === 'single'
                        ? 'bg-gold-500 text-charcoal-950 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🎯 Single Work / Project
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setWorkScopeMode('all');
                      setSelectedProjectId('all');
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer font-bold ${
                      workScopeMode === 'all'
                        ? 'bg-gold-500 text-charcoal-950 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    📂 All Assigned ({editorProjects.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setWorkScopeMode('custom')}
                    className={`px-2.5 py-1 rounded-md text-[11px] transition-all cursor-pointer font-bold ${
                      workScopeMode === 'custom'
                        ? 'bg-gold-500 text-charcoal-950 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    ✍️ Custom Line Items ({customItems.length})
                  </button>
                </div>

                {/* Single Work Picker */}
                {workScopeMode === 'single' && (
                  <div className="flex items-center space-x-1.5 ml-2">
                    <span className="text-gray-400 text-[11px]">Select Work:</span>
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      className="bg-charcoal-900 border border-gold-500/40 rounded-lg px-2.5 py-1 text-white text-xs outline-none focus:ring-1 focus:ring-gold-400"
                    >
                      {editorProjects.length > 0 ? (
                        editorProjects.map(p => {
                          const actualShare = p.isSplitProject 
                            ? (p.assignedEditorId === editor.id ? p.firstEditorShare : p.secondEditorShare)
                            : p.editorPayment;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.coupleName} • ₹{(actualShare || 0).toLocaleString('en-IN')} ({p.eventType})
                            </option>
                          );
                        })
                      ) : (
                        <option value="">No projects found</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              {/* Theme Switcher */}
              <div className="flex items-center space-x-2">
                <span className="text-gray-400">Theme:</span>
                <button
                  type="button"
                  onClick={() => setInvoiceTheme(invoiceTheme === 'classic_light' ? 'dark_minimal' : 'classic_light')}
                  className="px-2.5 py-1 bg-charcoal-900 hover:bg-charcoal-800 border border-luxury-green-800/30 rounded-lg text-[11px] text-gold-400 transition-colors cursor-pointer"
                >
                  {invoiceTheme === 'classic_light' ? 'Switch to Dark' : 'Switch to Clean Light'}
                </button>
              </div>
            </div>

            {/* Sub Toolbar: Financial adjustments & Invoice details */}
            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-luxury-green-800/10">
              <div className="flex items-center space-x-1.5">
                <span className="text-gray-400 text-[11px]">Invoice #:</span>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="bg-charcoal-900 border border-luxury-green-800/30 rounded-lg px-2 py-1 text-white w-36 text-xs"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-gray-400 text-[11px]">Date:</span>
                <input
                  type="date"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="bg-charcoal-900 border border-luxury-green-800/30 rounded-lg px-2 py-1 text-white text-xs cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-gray-400 text-[11px]">Due Date:</span>
                <input
                  type="date"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  className="bg-charcoal-900 border border-luxury-green-800/30 rounded-lg px-2 py-1 text-white text-xs cursor-pointer"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-gray-400 text-[11px]">Bonus (+):</span>
                <input
                  type="number"
                  value={customBonus || ''}
                  onChange={(e) => setCustomBonus(Number(e.target.value) || 0)}
                  placeholder="₹ 0"
                  className="bg-charcoal-900 border border-luxury-green-800/30 rounded-lg px-2 py-1 text-emerald-400 w-20 text-xs font-bold"
                />
              </div>

              <div className="flex items-center space-x-1.5">
                <span className="text-gray-400 text-[11px]">Deduction (-):</span>
                <input
                  type="number"
                  value={customDeduction || ''}
                  onChange={(e) => setCustomDeduction(Number(e.target.value) || 0)}
                  placeholder="₹ 0"
                  className="bg-charcoal-900 border border-luxury-green-800/30 rounded-lg px-2 py-1 text-red-400 w-20 text-xs font-bold"
                />
              </div>
            </div>

            {/* Custom Work Item Builder Form (When in Custom Mode) */}
            {workScopeMode === 'custom' && (
              <div className="p-3 bg-charcoal-900/90 rounded-xl border border-gold-500/20 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gold-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Custom Work Items Builder (Add / Edit individual tasks for this Invoice)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomRow(!showAddCustomRow)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-gold-500 text-charcoal-950 text-[10px] font-bold rounded-lg cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{showAddCustomRow ? 'Close Input' : 'Add New Task'}</span>
                  </button>
                </div>

                {showAddCustomRow && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                    <input
                      type="text"
                      placeholder="Task description (e.g. 4K Teaser Edit)"
                      value={newCustomDesc}
                      onChange={(e) => setNewCustomDesc(e.target.value)}
                      className="bg-charcoal-950 border border-luxury-green-800/30 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Couple / Event (e.g. Aarav & Meera)"
                      value={newCustomCouple}
                      onChange={(e) => setNewCustomCouple(e.target.value)}
                      className="bg-charcoal-950 border border-luxury-green-800/30 rounded px-2 py-1 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="Scope (e.g. Master Cut, Reels 9:16)"
                      value={newCustomScope}
                      onChange={(e) => setNewCustomScope(e.target.value)}
                      className="bg-charcoal-950 border border-luxury-green-800/30 rounded px-2 py-1 text-xs text-white"
                    />
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        placeholder="Amount ₹"
                        value={newCustomAmount || ''}
                        onChange={(e) => setNewCustomAmount(Number(e.target.value) || 0)}
                        className="bg-charcoal-950 border border-luxury-green-800/30 rounded px-2 py-1 text-xs text-emerald-400 font-bold w-24"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!newCustomDesc) return;
                          setCustomItems([
                            ...customItems,
                            {
                              id: `item-${Date.now()}`,
                              description: newCustomDesc,
                              projectOrCouple: newCustomCouple || 'Wedding Edit',
                              scope: newCustomScope || 'Video Post-Production',
                              amount: newCustomAmount || 0
                            }
                          ]);
                          setNewCustomDesc('');
                          setNewCustomCouple('');
                          setNewCustomAmount(5000);
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* List of active custom items in builder */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customItems.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center space-x-1.5 px-2 py-1 bg-charcoal-950 rounded-lg border border-luxury-green-800/30 text-[10px] text-gray-300"
                    >
                      <span className="font-semibold text-white truncate max-w-[150px]">{item.description}</span>
                      <span className="text-emerald-400 font-mono font-bold">₹{item.amount.toLocaleString('en-IN')}</span>
                      <button
                        type="button"
                        onClick={() => setCustomItems(customItems.filter(ci => ci.id !== item.id))}
                        className="text-red-400 hover:text-red-300 ml-1 cursor-pointer"
                        title="Remove task"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scrollable Printable Document Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-charcoal-950 flex justify-center print:p-0 print:bg-white print:overflow-visible">
          
          {/* ========================================================================= */}
          {/* TAB 1: EDITOR PROFILE SUMMARY (A4 Printable Document) */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div
              ref={printRef}
              className="w-full max-w-[800px] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl print:shadow-none print:rounded-none print:p-8 font-sans"
              style={{ minHeight: '1050px' }}
            >
              {/* Profile Header */}
              <div className="flex justify-between items-start pb-8 border-b-2 border-slate-200">
                <div className="flex items-center space-x-5">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md border-2 border-slate-200 shrink-0">
                    <img
                      src={editor.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200'}
                      alt={editor.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-2xl font-bold text-slate-900 font-serif tracking-tight">{editor.name}</h1>
                      <span className="px-2.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        {editor.rating.toFixed(1)} Index
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium mt-1">
                      Lead Post-Production Video Editor & Colorist
                    </p>
                    <div className="flex flex-wrap items-center gap-4 mt-2.5 text-xs text-slate-500 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {editor.email}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {editor.phone}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Partner Since {editor.joinedDate}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Studio Brand watermark/logo */}
                <div className="text-right">
                  <div className="inline-block p-2 bg-slate-900 rounded-xl text-white">
                    <div className="font-bold tracking-widest text-xs font-mono uppercase text-amber-400">THE FRAME CUT</div>
                    <div className="text-[8px] text-slate-400 tracking-wider">STUDIO REGISTRY</div>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-2">Verified Partner CV</p>
                </div>
              </div>

              {/* Key Statistics Grid */}
              <div className="grid grid-cols-4 gap-4 my-8">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Total Deliveries</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">{stats.totalProjects}</span>
                  <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">{stats.completedCount} Completed</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Success Rate</span>
                  <span className="text-2xl font-bold text-emerald-600 mt-1 block font-mono">{stats.completionRate}%</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">On-Time Deliveries</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Production Earned</span>
                  <span className="text-2xl font-bold text-slate-900 mt-1 block font-mono">₹{stats.totalEarned.toLocaleString('en-IN')}</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Disbursed: ₹{stats.totalPaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Active Backlog</span>
                  <span className="text-2xl font-bold text-amber-600 mt-1 block font-mono">{stats.inProgressCount}</span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">Ongoing Projects</span>
                </div>
              </div>

              {/* Completed Production Track Record */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    Verified Project Track Record ({editorProjects.length})
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">Top Projects Delivered</span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-x-auto custom-scrollbar">
                  <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] text-slate-600 uppercase">
                        <th className="p-3">Project / Couple</th>
                        <th className="p-3">Studio Partner</th>
                        <th className="p-3">Event Type</th>
                        <th className="p-3">Delivery Date</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Fee (INR)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editorProjects.length > 0 ? (
                        editorProjects.slice(0, 8).map((proj) => {
                          const actualShare = proj.isSplitProject 
                            ? (proj.assignedEditorId === editor.id ? proj.firstEditorShare : proj.secondEditorShare)
                            : proj.editorPayment;

                          return (
                            <tr key={proj.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-semibold text-slate-900">
                                {proj.coupleName}
                                <span className="block text-[9px] font-mono text-slate-400 font-normal">{proj.id}</span>
                              </td>
                              <td className="p-3 text-slate-600">{proj.studioName}</td>
                              <td className="p-3 text-slate-600">{proj.eventType}</td>
                              <td className="p-3 text-slate-600 font-mono text-[11px]">{proj.deliveryDate || '—'}</td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  proj.status === 'delivered' || proj.status === 'closed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {proj.status}
                                </span>
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-slate-900">
                                ₹{(actualShare || 0).toLocaleString('en-IN')}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-slate-400 text-xs font-mono">
                            No projects currently on record for this editor profile.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment & Settlement Summary */}
              <div className="grid grid-cols-2 gap-6 p-5 bg-slate-50 rounded-xl border border-slate-200 mb-8">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 font-mono mb-2">
                    Payment Ledger Summary
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-600 font-mono">
                    <div className="flex justify-between">
                      <span>Total Production Value:</span>
                      <span className="font-bold text-slate-900">₹{stats.totalEarned.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Amount Disbursed:</span>
                      <span className="font-bold text-emerald-600">- ₹{stats.totalPaid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-1.5 border-t border-slate-200 text-slate-900 font-bold">
                      <span>Current Outstanding Balance:</span>
                      <span className="text-amber-700">₹{Math.max(0, stats.balanceDue).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="border-l border-slate-200 pl-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-800 font-mono mb-1">
                      Verification Sign-Off
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      This official partner document certifies current production status and historical deliveries.
                    </p>
                  </div>
                  <div className="pt-4 flex justify-between items-end">
                    <div>
                      <div className="w-28 border-b border-slate-400 mb-1" />
                      <span className="text-[9px] font-mono text-slate-400">Editor Signature</span>
                    </div>
                    <div>
                      <div className="w-28 border-b border-slate-400 mb-1" />
                      <span className="text-[9px] font-mono text-slate-400">Authorized Signatory</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Document Footer */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>The Frame Cut Studio • Post-Production Registry</span>
                <span>Generated on {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: EDITOR INVOICE & PAYOUT STATEMENT */}
          {/* ========================================================================= */}
          {activeTab === 'invoice' && (
            <div
              ref={printRef}
              className={`w-full max-w-[800px] p-8 sm:p-12 shadow-2xl rounded-2xl print:shadow-none print:rounded-none print:p-8 font-sans ${
                invoiceTheme === 'dark_minimal'
                  ? 'bg-charcoal-900 text-white border border-luxury-green-800/30'
                  : 'bg-white text-slate-900 border border-slate-200'
              }`}
              style={{ minHeight: '1050px' }}
            >
              {/* Invoice Header */}
              <div className="flex justify-between items-start pb-8 border-b border-slate-200 dark:border-luxury-green-800/20">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xl font-bold font-serif tracking-tight text-amber-500 uppercase">
                      EDITOR INVOICE
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      finalInvoicePayable === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {finalInvoicePayable === 0 ? 'PAID IN FULL' : 'PAYOUT PENDING'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 font-mono">
                    Invoice #: <strong className="text-slate-900 dark:text-white">{invoiceNumber}</strong>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-gray-400 font-mono">
                    Issue Date: {invoiceDate} • Due Date: {invoiceDueDate}
                  </p>
                </div>

                <div className="text-right">
                  <div className="font-bold tracking-wider text-sm text-slate-900 dark:text-white font-serif">
                    THE FRAME CUT STUDIO
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400">Wedding Film Post-Production Hub</p>
                  <p className="text-[10px] text-slate-400 dark:text-gray-500 font-mono">support@theframecut.com</p>
                </div>
              </div>

              {/* Billed To & Editor Profile */}
              <div className="grid grid-cols-2 gap-8 my-8 pb-6 border-b border-slate-200 dark:border-luxury-green-800/20">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-gray-500 block mb-1">
                    Service Provider (Editor)
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{editor.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-gray-300 mt-0.5">{editor.email}</p>
                  <p className="text-xs text-slate-600 dark:text-gray-300">{editor.phone}</p>
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 font-mono mt-1">
                    Editor Registry ID: {editor.id}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-gray-500 block mb-1">
                    Payable By
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">The Frame Cut Studio</h3>
                  <p className="text-xs text-slate-600 dark:text-gray-300 mt-0.5">Central Finance & Settlement Desk</p>
                  <p className="text-xs text-slate-600 dark:text-gray-300">GST Registered Operations</p>
                </div>
              </div>

              {/* Invoice Breakdown Table */}
              <div className="mb-8 overflow-x-auto custom-scrollbar">
                <table className="w-full min-w-[620px] text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b font-mono text-[10px] uppercase ${
                      invoiceTheme === 'dark_minimal'
                        ? 'bg-charcoal-950 border-luxury-green-800/20 text-gray-400'
                        : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <th className="p-3">#</th>
                      <th className="p-3">{workScopeMode === 'custom' ? 'Task / Description' : 'Project / Couple'}</th>
                      <th className="p-3">Service Scope</th>
                      <th className="p-3">{workScopeMode === 'custom' ? 'Couple / Tag' : 'Studio Partner'}</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-luxury-green-800/10">
                    {workScopeMode === 'custom' ? (
                      customItems.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-charcoal-800/40">
                          <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-semibold text-slate-900 dark:text-white">
                            {item.description}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-gray-300">
                            {item.scope}
                          </td>
                          <td className="p-3 text-slate-600 dark:text-gray-300">{item.projectOrCouple}</td>
                          <td className="p-3">
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 uppercase">
                              COMPLETED
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                            ₹{(item.amount || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))
                    ) : (
                      invoiceProjects.map((proj, idx) => {
                        const actualShare = proj.isSplitProject 
                          ? (proj.assignedEditorId === editor.id ? proj.firstEditorShare : proj.secondEditorShare)
                          : proj.editorPayment;

                        return (
                          <tr key={proj.id} className="hover:bg-slate-50/50 dark:hover:bg-charcoal-800/40">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-3 font-semibold text-slate-900 dark:text-white">
                              {proj.coupleName}
                              <span className="block text-[9px] font-mono text-slate-400 font-normal">{proj.id}</span>
                            </td>
                            <td className="p-3 text-slate-600 dark:text-gray-300">
                              {proj.eventType} Post-Production
                            </td>
                            <td className="p-3 text-slate-600 dark:text-gray-300">{proj.studioName}</td>
                            <td className="p-3">
                              <span className="inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-slate-100 dark:bg-charcoal-800 text-slate-700 dark:text-gray-300 uppercase">
                                {proj.status}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                              ₹{(actualShare || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Total Calculation Summary */}
              <div className="flex justify-end mb-8">
                <div className="w-72 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-gray-300">
                    <span>Gross Editing Fees:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{invoiceSubtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {customBonus > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Performance Bonus:</span>
                      <span className="font-bold">+ ₹{customBonus.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {customDeduction > 0 && (
                    <div className="flex justify-between text-red-600 dark:text-red-400">
                      <span>Adjustments / Deductions:</span>
                      <span className="font-bold">- ₹{customDeduction.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 dark:text-gray-300">
                    <span>Already Disbursed / Paid:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">- ₹{invoicePaidAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className={`flex justify-between pt-2 border-t text-sm font-bold ${
                    invoiceTheme === 'dark_minimal' ? 'border-luxury-green-800/30 text-gold-400' : 'border-slate-300 text-slate-900'
                  }`}>
                    <span>Net Payable Balance:</span>
                    <span className="text-base font-mono">₹{finalInvoicePayable.toLocaleString('en-IN')}</span>
                  </div>
                  
                  <div className="text-[10px] text-slate-400 dark:text-gray-500 italic text-right pt-1">
                    {numberToWords(finalInvoicePayable)}
                  </div>
                </div>
              </div>

              {/* Payment & Banking Instructions */}
              <div className={`p-4 rounded-xl border mb-8 ${
                invoiceTheme === 'dark_minimal'
                  ? 'bg-charcoal-950/60 border-luxury-green-800/20 text-gray-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                <h4 className="text-[11px] font-bold uppercase tracking-wider font-mono mb-1.5 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-amber-500" />
                  Disbursement & Settlement Terms
                </h4>
                <p className="text-[11px] leading-relaxed">
                  Payments are credited directly to the registered bank account or verified UPI ID of {editor.name}. 
                  Any dispute regarding wedding cut deliverables or revisions must be raised within 7 working days of statement generation.
                </p>
              </div>

              {/* Sign-off Footers */}
              <div className="pt-8 border-t border-slate-200 dark:border-luxury-green-800/20 flex justify-between items-end">
                <div>
                  <div className="w-36 border-b border-slate-400 dark:border-gray-600 mb-1" />
                  <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">Editor Acknowledgement</span>
                </div>

                <div className="text-right">
                  <div className="w-36 border-b border-slate-400 dark:border-gray-600 mb-1 ml-auto" />
                  <span className="text-[10px] font-mono text-slate-500 dark:text-gray-400">Authorized Accounts Desk</span>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default EditorPdfExportModal;
