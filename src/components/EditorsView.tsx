import React, { useState, useMemo } from 'react';
import { 
  Laptop, 
  User, 
  Phone, 
  Mail, 
  Star, 
  Calendar, 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  IndianRupee, 
  CheckCircle, 
  TrendingUp, 
  PlusCircle,
  Clock,
  Upload,
  Image as ImageIcon,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  UserCheck,
  Zap,
  Activity,
  AlertTriangle,
  Layers,
  Filter,
  Download,
  Receipt,
  FileText,
  Printer,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ParallaxCard from './ParallaxCard';
import { Editor, Project, PaymentHistory, Studio } from '../types';
import EditorPerformanceInsights from './EditorPerformanceInsights';
import EditorLoadIndicator, { calculateEditorLoad } from './EditorLoadIndicator';
import EditorPdfExportModal from './EditorPdfExportModal';
import EditorShowcaseCarousel from './EditorShowcaseCarousel';
import EditorInvoicesHub from './EditorInvoicesHub';
import QuickReassignModal from './QuickReassignModal';

interface EditorsViewProps {
  editors: Editor[];
  projects: Project[];
  payments: PaymentHistory[];
  studios?: Studio[];
  userRole?: string;
  currentEditorId?: string;
  currentUserEmail?: string;
  onAddEditor: (editor: Omit<Editor, 'id'>) => Promise<void>;
  onUpdateEditor: (id: string, updates: Partial<Editor>) => Promise<void>;
  onDeleteEditor: (id: string) => Promise<void>;
  onLogPayment: (payment: Omit<PaymentHistory, 'id' | 'createdAt'>) => Promise<void>;
  onDeletePayment?: (id: string) => Promise<void>;
  onUpdateProject?: (id: string, updates: Partial<Project>) => Promise<void>;
}

const EditorsView = React.memo(function EditorsView({
  editors,
  projects,
  payments,
  studios = [],
  userRole = 'admin',
  currentEditorId,
  currentUserEmail,
  onAddEditor,
  onUpdateEditor,
  onDeleteEditor,
  onLogPayment,
  onDeletePayment,
  onUpdateProject
}: EditorsViewProps) {
  const [selectedEditor, setSelectedEditor] = useState<Editor | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEditor, setEditingEditor] = useState<Editor | null>(null);

  // PDF Export Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalEditor, setPdfModalEditor] = useState<Editor | null>(null);
  const [pdfModalDefaultTab, setPdfModalDefaultTab] = useState<'profile' | 'invoice'>('profile');
  const [pdfModalProjectId, setPdfModalProjectId] = useState<string>('all');

  // Quick Reassign Modal State
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignSourceEditor, setReassignSourceEditor] = useState<Editor | null>(null);

  const handleOpenReassignModal = (editor: Editor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReassignSourceEditor(editor);
    setIsReassignModalOpen(true);
  };

  const handleOpenPdfModal = (
    editorToExport: Editor, 
    defaultTab: 'profile' | 'invoice' = 'profile', 
    e?: React.MouseEvent,
    projectId: string = 'all'
  ) => {
    if (e) e.stopPropagation();
    setPdfModalEditor(editorToExport);
    setPdfModalDefaultTab(defaultTab);
    setPdfModalProjectId(projectId);
    setIsPdfModalOpen(true);
  };

  // Sub-tab Navigation (Roster Directory vs Work Invoices Hub)
  const [adminSubTab, setAdminSubTab] = useState<'roster' | 'invoices'>('roster');
  const [editorSubTab, setEditorSubTab] = useState<'deliveries' | 'invoices'>('deliveries');

  // Editor Load & Bandwidth Filtering / Sorting State
  const [loadFilter, setLoadFilter] = useState<'all' | 'available' | 'optimal' | 'busy' | 'overloaded'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'default' | 'available_first' | 'most_loaded' | 'rating' | 'name'>('available_first');

  // Helper to determine workload status based on active cuts count
  const getWorkloadStatus = (activeCount: number) => {
    if (activeCount === 0) {
      return {
        label: 'Available',
        bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
        dot: 'bg-emerald-400'
      };
    } else if (activeCount <= 2) {
      return {
        label: 'Optimal Load',
        bg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
        dot: 'bg-sky-400'
      };
    } else if (activeCount <= 4) {
      return {
        label: 'Heavy Load',
        bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
        dot: 'bg-amber-400'
      };
    } else {
      return {
        label: 'At Capacity',
        bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
        dot: 'bg-rose-400'
      };
    }
  };

  // Custom toast and confirmation states
  const [editorToDeleteId, setEditorToDeleteId] = useState<string | null>(null);
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);
  const [settlementToDeleteId, setSettlementToDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);

  const triggerToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 4000);
  };
  
  // Payment logger states
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentProjectId, setPaymentProjectId] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [rating, setRating] = useState(5.0);
  const [joinedDate, setJoinedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState('');
  const [isUploading, setIsUploading] = useState(false);

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200'
];

  const compressImage = (dataUrl: string, maxWidth = 300, maxHeight = 300): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please select a valid image file.");
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === 'string') {
          try {
            const compressed = await compressImage(reader.result, 300, 300);
            setPhoto(compressed);
          } catch (err) {
            setPhoto(reader.result);
          }
        }
        setIsUploading(false);
      };
      reader.onerror = () => {
        alert("Failed to read image file.");
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCreateModal = () => {
    setEditingEditor(null);
    setName('');
    setEmail('');
    setPhone('');
    setRating(5.0);
    setJoinedDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setPhoto('');
    setIsModalOpen(true);
  };

  const openEditModal = (editor: Editor, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEditor(editor);
    setName(editor.name);
    setEmail(editor.email);
    setPhone(editor.phone);
    setRating(editor.rating);
    setJoinedDate(editor.joinedDate);
    setNotes(editor.notes || '');
    setPhoto(editor.photo || '');
    setIsModalOpen(true);
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalPhoto = photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200';
      if (editingEditor) {
        await onUpdateEditor(editingEditor.id, {
          name,
          email,
          phone,
          rating,
          joinedDate,
          notes,
          photo: finalPhoto
        });
        if (selectedEditor?.id === editingEditor.id) {
          setSelectedEditor({
            ...selectedEditor,
            name,
            email,
            phone,
            rating,
            joinedDate,
            notes,
            photo: finalPhoto
          });
        }
      } else {
        await onAddEditor({
          name,
          email,
          phone,
          rating,
          joinedDate,
          notes,
          photo: finalPhoto
        });
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Error saving editor:", error);
      alert("Failed to save Editor Partner: " + (error?.message || error || "Unknown error"));
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorToDeleteId(id);
  };

  const handleLogPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditor) {
      alert("Please select a video editor first.");
      return;
    }
    if (paymentAmount <= 0) {
      alert("Please enter a valid payment amount greater than ₹0.");
      return;
    }

    try {
      const matchedProj = projects.find(p => p.id === paymentProjectId);

      await onLogPayment({
        entityId: selectedEditor.id,
        entityType: 'editor',
        projectId: paymentProjectId || 'general_ledger',
        projectCoupleName: matchedProj ? matchedProj.coupleName : 'Office Advance / Bonus',
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod,
        notes: paymentNotes
      });

      setPaymentAmount(0);
      setPaymentNotes('');
      setIsLoggingPayment(false);
    } catch (err: any) {
      console.error("Error recording payment in EditorsView:", err);
      alert("Failed to record payment: " + (err?.message || String(err)));
    }
  };

  const myEditor = editors.find(
    e => e.id === currentEditorId || (e.email && currentUserEmail && e.email.toLowerCase() === currentUserEmail.toLowerCase())
  );

  if (userRole === 'editor') {
    if (!myEditor) {
      return (
        <div className="p-8 rounded-3xl glass-panel text-center max-w-xl mx-auto space-y-4 my-12">
          <Laptop className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white font-display">Editor Profile Not Found</h2>
          <p className="text-sm text-gray-400">
            Your login is authorized as an Editor, but it has not been linked to an active registry profile yet.
          </p>
          <div className="p-4 rounded-2xl bg-charcoal-950/50 border border-luxury-green-800/20 text-xs text-gray-300 font-mono">
            Active Login: {currentUserEmail}
          </div>
          <p className="text-xs text-gold-400">
            Please ask an Admin (Satish / Vansh) to register an Editor profile matching your email address.
          </p>
        </div>
      );
    }

    const editorProjects = projects.filter(p => p.assignedEditorId === myEditor.id || (p.isSplitProject && p.secondEditorId === myEditor.id));
    const completedCuts = editorProjects.filter(p => p.status === 'delivered' || p.status === 'closed').length;
    
    const totalEarningsVal = editorProjects.reduce((sum, p) => {
      if (p.isSplitProject) {
        if (p.assignedEditorId === myEditor.id) {
          return sum + (p.firstEditorShare || 0);
        } else if (p.secondEditorId === myEditor.id) {
          return sum + (p.secondEditorShare || 0);
        }
      }
      return sum + (p.editorPayment || 0);
    }, 0);
    const totalPaidVal = payments
      .filter(pay => pay.entityId === myEditor.id && pay.entityType === 'editor')
      .reduce((sum, pay) => sum + (pay.amount || 0), 0);

    const pendingBalance = totalEarningsVal - totalPaidVal;

    return (
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative z-10 hover:z-50 shrink-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md transition-all duration-300 ease-out hover:scale-[3.5] hover:shadow-2xl cursor-pointer origin-left">
                <img
                  src={myEditor.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                  alt={myEditor.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold font-display text-white">Welcome, {myEditor.name}!</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                <p className="flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                  <span className="font-bold text-gold-400 font-mono">{myEditor.rating.toFixed(1)} Performance Index</span>
                </p>
                <span className="text-gray-500">•</span>
                <span className="font-mono">Joined on {myEditor.joinedDate}</span>
                <span className="text-gray-500">•</span>
                <EditorLoadIndicator
                  editor={myEditor}
                  projects={projects}
                  variant="pill"
                />
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenPdfModal(myEditor, 'profile')}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 border border-gold-500/30 rounded-2xl text-gold-300 font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm shrink-0"
              title="Download Profile Summary PDF"
            >
              <Download className="w-3.5 h-3.5 text-gold-400" />
              <span>Download Profile</span>
            </button>

            <button
              onClick={() => handleOpenPdfModal(myEditor, 'invoice')}
              className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 border border-emerald-500/30 rounded-2xl text-emerald-300 font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm shrink-0"
              title="Download Editor Invoice & Statement PDF"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-400" />
              <span>Editor Invoice</span>
            </button>

            <button
              onClick={() => {
                setSelectedEditor(myEditor);
                setPaymentProjectId('');
                setIsLoggingPayment(!isLoggingPayment);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 rounded-2xl text-white font-medium text-xs hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer gold-glow shrink-0"
            >
              <PlusCircle className="w-4 h-4 text-gold-300" />
              <span>{isLoggingPayment ? 'Close Log Option' : 'Self-Log Payment'}</span>
            </button>
          </div>
        </div>

        {/* Sub-tab Navigation for Editor */}
        <div className="flex items-center space-x-2 border-b border-luxury-green-800/20 pb-3 font-mono text-xs">
          <button
            type="button"
            onClick={() => setEditorSubTab('deliveries')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center space-x-2 ${
              editorSubTab === 'deliveries'
                ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 text-white border border-gold-500/30 shadow-md'
                : 'text-gray-400 hover:text-white bg-charcoal-900/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-gold-400" />
            <span>My Deliveries & Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorSubTab('invoices')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center space-x-2 ${
              editorSubTab === 'invoices'
                ? 'bg-gradient-to-r from-gold-600 to-amber-600 text-charcoal-950 shadow-md'
                : 'text-gray-400 hover:text-white bg-charcoal-900/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>🧾 Work Invoices & Statements Hub</span>
          </button>
        </div>

        {editorSubTab === 'invoices' ? (
          <EditorInvoicesHub
            editors={editors}
            projects={projects}
            payments={payments}
            studios={studios}
            userRole={userRole}
            currentEditor={myEditor}
            onOpenPdfModal={handleOpenPdfModal}
            onLogPayment={onLogPayment}
          />
        ) : (
          <>
            {/* Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl glass-panel bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-luxury-green-800/10 flex flex-col justify-between">
                <span className="text-xs font-mono text-gray-500 uppercase tracking-wider block">Total Work Earned</span>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-white tracking-tight">₹{totalEarningsVal.toLocaleString('en-IN')}</span>
                  <p className="text-[11px] text-gray-400 mt-2 font-mono">{editorProjects.length} Assigned Weddings ({completedCuts} Completed)</p>
                </div>
              </div>
              <div className="p-6 rounded-3xl glass-panel bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-emerald-500/10 flex flex-col justify-between">
                <span className="text-xs font-mono text-emerald-500 uppercase tracking-wider block">Total Payment Received</span>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-emerald-400 tracking-tight">₹{totalPaidVal.toLocaleString('en-IN')}</span>
                  <p className="text-[11px] text-gray-400 mt-2 font-mono">Disbursed across wedding ledger records</p>
                </div>
              </div>
              <div className="p-6 rounded-3xl glass-panel bg-gradient-to-br from-charcoal-900 to-charcoal-950 border border-red-500/10 flex flex-col justify-between">
                <span className="text-xs font-mono text-red-500 uppercase tracking-wider block">Outstanding Due</span>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-red-400 tracking-tight">₹{pendingBalance >= 0 ? pendingBalance.toLocaleString('en-IN') : 0}</span>
                  <p className="text-[11px] text-gray-400 mt-2 font-mono">{editorProjects.length - completedCuts} Active Productions</p>
                </div>
              </div>
            </div>

            {/* Self-Log Form Panel */}
            {isLoggingPayment && selectedEditor && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-3xl glass-panel border border-gold-500/20 bg-charcoal-950/60 space-y-4"
              >
                <div className="flex justify-between items-center border-b border-luxury-green-800/10 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500 font-mono">Self-Log Received Payment</h3>
                  <button 
                    onClick={() => setIsLoggingPayment(false)}
                    className="text-xs text-gray-500 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={handleLogPaymentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Select Wedding Project</label>
                      <select
                        value={paymentProjectId}
                        onChange={(e) => setPaymentProjectId(e.target.value)}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white"
                        required
                      >
                        <option value="">Choose Wedding Project</option>
                        {editorProjects.map(proj => (
                          <option key={proj.id} value={proj.id}>{proj.coupleName} (Contract: ₹{proj.editorPayment})</option>
                        ))}
                        <option value="misc_bonus">Miscellaneous / Advance / Bonus</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Amount Received (INR)</label>
                      <input
                        type="number"
                        placeholder="INR"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-gray-300"
                      >
                        <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                        <option value="UPI / GPay">UPI / Google Pay</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1 uppercase">Receipt Notes / Transaction ID</label>
                      <input
                        type="text"
                        placeholder="e.g. UPI Ref, GPay Screenshot name, etc."
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsLoggingPayment(false)}
                      className="px-4 py-2 text-xs text-gray-400 hover:text-white cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gold-500 text-charcoal-950 font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Save Payment Record
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Bottom Content: Assigned weddings and payment history list side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Assigned Weddings */}
              <div className="p-6 rounded-3xl glass-panel space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500 font-mono">My Wedding Deliveries</h3>
                  <span className="text-[10px] font-mono text-gray-400">{editorProjects.length} Works Assigned</span>
                </div>
                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {editorProjects.length > 0 ? (
                    editorProjects.map((proj) => (
                      <div 
                        key={proj.id} 
                        className="p-4 rounded-2xl bg-charcoal-950/60 border border-luxury-green-800/10 flex justify-between items-center"
                      >
                        <div>
                          <span className="text-[9px] font-mono text-gold-400">{proj.id}</span>
                          <h4 className="text-xs font-bold text-white mt-1">{proj.coupleName}</h4>
                          <p className="text-[10px] text-gray-400 mt-0.5">{proj.studioName} • {proj.eventType}</p>
                        </div>

                        <div className="text-right flex flex-col items-end space-y-1">
                          <span className="text-xs font-bold text-white block">₹{proj.editorPayment.toLocaleString('en-IN')}</span>
                          <div className="flex items-center space-x-1.5">
                            <span className={`inline-block text-[8px] font-mono px-2 py-0.5 rounded uppercase ${
                              proj.status === 'delivered' || proj.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {proj.status}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleOpenPdfModal(myEditor, 'invoice', e, proj.id)}
                              className="px-2 py-0.5 bg-gold-500/15 hover:bg-gold-500/30 text-gold-400 border border-gold-500/30 rounded text-[9px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                              title="Generate Separate Single Work Invoice for this Project"
                            >
                              <Receipt className="w-2.5 h-2.5" />
                              <span>Work Invoice</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-gray-500 font-mono">No wedding projects assigned to your registry.</div>
                  )}
                </div>
              </div>

              {/* Payment History Log */}
              <div className="p-6 rounded-3xl glass-panel space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gold-500 font-mono">Ledger Receipts</h3>
                <div className="space-y-3.5 max-h-[450px] overflow-y-auto pr-1">
                  {payments.filter(pay => pay.entityId === myEditor.id && pay.entityType === 'editor').length > 0 ? (
                    payments.filter(pay => pay.entityId === myEditor.id && pay.entityType === 'editor').map((pay) => (
                      <div 
                        key={pay.id} 
                        className="p-4 bg-charcoal-950/30 rounded-2xl border border-luxury-green-800/5 flex justify-between items-center"
                      >
                        <div>
                          <span className="text-[9px] font-mono text-gray-500">{pay.date} • {pay.paymentMethod}</span>
                          <p className="text-xs text-gray-300 font-semibold mt-0.5 truncate">{pay.projectCoupleName}</p>
                          {pay.notes && <p className="text-[10px] text-gray-500 italic mt-0.5">Notes: {pay.notes}</p>}
                        </div>
                        <div className="flex items-center space-x-2 shrink-0">
                          <span className="text-xs font-mono font-bold text-emerald-400">
                            + ₹{pay.amount.toLocaleString('en-IN')}
                          </span>
                          {onDeletePayment && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentToDeleteId(pay.id);
                              }}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg ml-2 cursor-pointer"
                              title="Delete Payment Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12 text-xs text-gray-500 font-mono">No payment history logged yet.</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Top Header Panel */}
      <div className="p-6 rounded-3xl glass-panel flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Post-Production Editors</h2>
          <p className="text-xs text-gray-400 mt-1">Manage core editor registries, rating indices, task load balances, and ledger settlements.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (editors.length > 0) {
                handleOpenPdfModal(editors[0], 'invoice');
              }
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-charcoal-900 hover:bg-charcoal-800 border border-gold-500/30 rounded-2xl text-gold-300 font-medium text-xs hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-sm shrink-0"
            title="Open Editor Invoice & Statement Generator"
          >
            <Receipt className="w-3.5 h-3.5 text-gold-400" />
            <span>Generate Invoices</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center space-x-2 px-4.5 py-2.5 bg-gradient-to-r from-luxury-green-800 to-luxury-green-600 border border-gold-500/30 rounded-2xl text-white font-medium text-xs hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer gold-glow shrink-0"
          >
            <Plus className="w-4 h-4 text-gold-300" />
            <span>Add Editor Account</span>
          </button>
        </div>
      </div>

      {/* Admin Sub-Tabs Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-luxury-green-800/20 pb-3 font-mono text-xs">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setAdminSubTab('roster')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center space-x-2 ${
              adminSubTab === 'roster'
                ? 'bg-gradient-to-r from-luxury-green-800 to-luxury-green-700 text-white border border-gold-500/30 shadow-md'
                : 'text-gray-400 hover:text-white bg-charcoal-900/60'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5 text-gold-400" />
            <span>👥 Editors Directory & Bandwidth ({editors.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setAdminSubTab('invoices')}
            className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold flex items-center space-x-2 ${
              adminSubTab === 'invoices'
                ? 'bg-gradient-to-r from-gold-600 to-amber-600 text-charcoal-950 shadow-md'
                : 'text-gray-400 hover:text-white bg-charcoal-900/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>🧾 Editor Work Invoices & Payouts Hub</span>
          </button>
        </div>

        {adminSubTab === 'invoices' && (
          <span className="text-[11px] text-gold-400 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>1-Click PDF Invoices for Single Works, Custom Bills & Statements</span>
          </span>
        )}
      </div>

      {adminSubTab === 'invoices' ? (
        <EditorInvoicesHub
          editors={editors}
          projects={projects}
          payments={payments}
          studios={studios}
          userRole={userRole}
          onOpenPdfModal={handleOpenPdfModal}
          onLogPayment={onLogPayment}
        />
      ) : (
        <>
          {/* Performance Insights Card: Work Assigned vs Paid Wages */}
          <EditorPerformanceInsights
            editors={editors}
            projects={projects}
            payments={payments}
            onSelectEditor={(editor) => {
              setSelectedEditor(editor);
              setIsDrawerOpen(true);
            }}
            onQuickSettlePayment={(editor) => {
              setSelectedEditor(editor);
              setIsDrawerOpen(true);
              setIsLoggingPayment(true);
            }}
          />

      {/* ================= TEAM BANDWIDTH & EDITOR LOAD OVERVIEW BAR ================= */}
      {(() => {
        let availableCount = 0;
        let optimalCount = 0;
        let busyCount = 0;
        let overloadedCount = 0;
        let totalActiveCuts = 0;

        editors.forEach((editor) => {
          const metrics = calculateEditorLoad(editor, projects);
          totalActiveCuts += metrics.activeCount;
          if (metrics.status === 'available') availableCount++;
          else if (metrics.status === 'optimal') optimalCount++;
          else if (metrics.status === 'busy') busyCount++;
          else if (metrics.status === 'overloaded') overloadedCount++;
        });

        return (
          <div className="p-5 rounded-3xl glass-panel border border-luxury-green-800/20 bg-charcoal-950/70 space-y-4 shadow-xl">
            {/* Header and Capacity summary */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold font-display text-white">Team Bandwidth & Editor Load</h3>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      {availableCount} Available for New Tasks
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Real-time production capacity: <strong className="text-gray-200">{totalActiveCuts} active wedding cuts</strong> distributed across {editors.length} registered editors
                  </p>
                </div>
              </div>

              {/* Quick Status Metric Pills */}
              <div className="flex flex-wrap items-center gap-2">
                <div 
                  onClick={() => setLoadFilter(loadFilter === 'available' ? 'all' : 'available')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    loadFilter === 'available'
                      ? 'bg-emerald-500/25 border-emerald-500/50 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/15'
                  }`}
                  title="Filter to editors with 0 active cuts"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold">{availableCount} Available</span>
                </div>

                <div 
                  onClick={() => setLoadFilter(loadFilter === 'optimal' ? 'all' : 'optimal')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    loadFilter === 'optimal'
                      ? 'bg-sky-500/25 border-sky-500/50 text-sky-300 ring-2 ring-sky-500/30'
                      : 'bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-sky-500/15'
                  }`}
                  title="Filter to editors with 1-2 active cuts"
                >
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  <span>{optimalCount} Optimal</span>
                </div>

                <div 
                  onClick={() => setLoadFilter(loadFilter === 'busy' ? 'all' : 'busy')}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                    loadFilter === 'busy'
                      ? 'bg-amber-500/25 border-amber-500/50 text-amber-300 ring-2 ring-amber-500/30'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/15'
                  }`}
                  title="Filter to editors with 3-4 active cuts"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>{busyCount} Heavy</span>
                </div>

                {overloadedCount > 0 && (
                  <div 
                    onClick={() => setLoadFilter(loadFilter === 'overloaded' ? 'all' : 'overloaded')}
                    className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all cursor-pointer ${
                      loadFilter === 'overloaded'
                        ? 'bg-rose-500/25 border-rose-500/50 text-rose-300 ring-2 ring-rose-500/30'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/15'
                    }`}
                    title="Filter to overloaded editors (5+ active cuts)"
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                    <span>{overloadedCount} At Capacity</span>
                  </div>
                )}
              </div>
            </div>

            {/* Filter and Search Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-luxury-green-800/10">
              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search editor by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 focus:border-gold-500/60 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none placeholder:text-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-[10px]"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Load Filter Chips & Sort Selector */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap gap-y-2">
                <div className="flex items-center space-x-1 text-xs">
                  <span className="text-[11px] font-mono text-gray-400 mr-1 flex items-center">
                    <Filter className="w-3 h-3 mr-1 text-gray-500" />
                    Load:
                  </span>
                  {(['all', 'available', 'optimal', 'busy'] as const).map((filterKey) => (
                    <button
                      key={filterKey}
                      onClick={() => setLoadFilter(filterKey)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono capitalize transition-all cursor-pointer ${
                        loadFilter === filterKey
                          ? 'bg-gold-500/20 text-gold-300 font-bold border border-gold-500/40 shadow-sm'
                          : 'text-gray-400 hover:text-gray-200 hover:bg-charcoal-900'
                      }`}
                    >
                      {filterKey}
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  <span className="text-[11px] font-mono text-gray-400 mr-1 flex items-center">
                    <ArrowUpDown className="w-3 h-3 mr-1 text-gray-500" />
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-charcoal-900 border border-luxury-green-800/30 text-white rounded-xl px-2.5 py-1 text-xs font-mono outline-none cursor-pointer focus:border-gold-500"
                  >
                    <option value="available_first">Available First (Least Busy)</option>
                    <option value="most_loaded">Most Loaded First</option>
                    <option value="rating">Top Rated Index</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Editor Profiles Directory Header */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-bold font-display text-white">Editor Directory & Accounts</h3>
          <span className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-charcoal-800 text-gray-300 border border-gray-700">
            {editors.length} Registered Partners
          </span>
          {loadFilter !== 'all' && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-500/30 font-bold">
              Filtered: {loadFilter}
            </span>
          )}
        </div>
      </div>

      {/* Editor Grid display */}
      {(() => {
        // Filter and sort editors
        const displayedEditors = editors.filter((editor) => {
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const matchesName = editor.name.toLowerCase().includes(q);
            const matchesEmail = editor.email?.toLowerCase().includes(q);
            const matchesPhone = editor.phone?.includes(q);
            if (!matchesName && !matchesEmail && !matchesPhone) return false;
          }

          if (loadFilter !== 'all') {
            const metrics = calculateEditorLoad(editor, projects);
            if (metrics.status !== loadFilter) return false;
          }

          return true;
        }).sort((a, b) => {
          const metricsA = calculateEditorLoad(a, projects);
          const metricsB = calculateEditorLoad(b, projects);

          if (sortBy === 'available_first') {
            if (metricsA.activeCount !== metricsB.activeCount) {
              return metricsA.activeCount - metricsB.activeCount;
            }
            return b.rating - a.rating;
          }
          if (sortBy === 'most_loaded') {
            if (metricsA.activeCount !== metricsB.activeCount) {
              return metricsB.activeCount - metricsA.activeCount;
            }
            return b.rating - a.rating;
          }
          if (sortBy === 'rating') {
            return b.rating - a.rating;
          }
          if (sortBy === 'name') {
            return a.name.localeCompare(b.name);
          }
          return 0;
        });

        if (displayedEditors.length === 0) {
          return (
            <div className="p-12 text-center rounded-3xl glass-panel border border-luxury-green-800/20 space-y-3">
              <UserCheck className="w-10 h-10 text-gray-500 mx-auto" />
              <h4 className="text-base font-bold text-white font-display">No Editors Match Selected Filters</h4>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                No editor accounts found matching "{searchQuery || loadFilter}". Reset your filters to view all registry partners.
              </p>
              <button
                type="button"
                onClick={() => { setLoadFilter('all'); setSearchQuery(''); }}
                className="px-4 py-2 bg-charcoal-800 hover:bg-charcoal-700 text-gold-400 text-xs font-mono rounded-xl border border-luxury-green-800/30 transition-colors cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          );
        }

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {displayedEditors.map((editor) => {
              const editorProjects = projects.filter(p => p.assignedEditorId === editor.id || (p.isSplitProject && p.secondEditorId === editor.id));
              const completedCuts = editorProjects.filter(p => p.status === 'delivered' || p.status === 'closed').length;
              const totalEarningsVal = editorProjects.reduce((sum, p) => {
                if (p.isSplitProject) {
                  if (p.assignedEditorId === editor.id) {
                    return sum + (p.firstEditorShare || 0);
                  } else if (p.secondEditorId === editor.id) {
                    return sum + (p.secondEditorShare || 0);
                  }
                }
                return sum + (p.editorPayment || 0);
              }, 0);
              
              const editorPaymentsTotal = payments
                .filter(pay => pay.entityId === editor.id && pay.entityType === 'editor')
                .reduce((sum, pay) => sum + (pay.amount || 0), 0);
                
              const pendingBalance = totalEarningsVal - editorPaymentsTotal;

              const activeCount = editorProjects.length - completedCuts;
              const loadMetrics = calculateEditorLoad(editor, projects);

              return (
                <motion.div
                  key={editor.id}
                  layout
                  onClick={() => { setSelectedEditor(editor); setIsDrawerOpen(true); }}
                  className="p-6 rounded-3xl glass-panel relative hover:z-20 flex flex-col justify-between min-h-[350px] cursor-pointer group glass-panel-hover"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-3.5">
                        <div className="relative z-30 hover:z-50 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md transition-all duration-300 ease-out hover:scale-[3.5] hover:shadow-2xl cursor-pointer origin-top-left">
                            <img
                              src={editor.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                              alt={editor.name}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white font-display group-hover:text-gold-400 transition-colors leading-tight">
                            {editor.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <div className="flex items-center space-x-1 text-gold-400">
                              <Star className="w-3 h-3 fill-gold-400" />
                              <span className="text-[10px] font-mono font-bold">{editor.rating.toFixed(1)}</span>
                            </div>
                            <span className="text-gray-600 text-[10px]">•</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold border ${loadMetrics.badgeBg} ${loadMetrics.badgeBorder} ${loadMetrics.textColor}`}>
                              <span className={`w-1 h-1 rounded-full ${loadMetrics.dotColor} mr-1 ${loadMetrics.activeCount > 0 ? 'animate-pulse' : ''}`} />
                              {loadMetrics.status === 'available' ? 'Available' : loadMetrics.status === 'optimal' ? 'Optimal' : loadMetrics.status === 'busy' ? 'Busy' : 'At Capacity'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleOpenPdfModal(editor, 'profile', e)}
                          className="p-2 hover:bg-gold-500/10 text-gray-400 hover:text-gold-400 rounded-lg transition-colors cursor-pointer"
                          title="Download Profile Summary PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleOpenPdfModal(editor, 'invoice', e)}
                          className="p-2 hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          title="Generate Editor Invoice & Payout Statement"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => openEditModal(editor, e)}
                          className="p-2 hover:bg-luxury-green-800/20 text-gray-400 hover:text-gold-500 rounded-lg transition-colors cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(editor.id, e)}
                          className="p-2 hover:bg-red-500/10 text-gray-400 hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete Editor"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-3.5 text-[11px] text-gray-400">
                      <p className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span className="truncate">{editor.email}</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                        <span>{editor.phone}</span>
                      </p>
                    </div>

                    {/* 🎬 Top 3 Best Wedding Shots Compact Carousel */}
                    <div className="mt-3.5">
                      <EditorShowcaseCarousel 
                        editor={editor} 
                        projects={projects}
                        compact={true}
                      />
                    </div>
                  </div>

                  {/* ⚡ Comprehensive Editor Load Indicator & Quick Reassign Action */}
                  <div className="mt-4 pt-3.5 border-t border-luxury-green-800/15 space-y-3">
                    <div className="space-y-2">
                      <EditorLoadIndicator
                        editor={editor}
                        projects={projects}
                        variant="card"
                        showBar={true}
                      />

                      {/* Quick Reassign Action Button */}
                      {userRole !== 'editor' && onUpdateProject && (
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={(e) => handleOpenReassignModal(editor, e)}
                            className="px-2.5 py-1 rounded-lg bg-luxury-green-900/40 hover:bg-luxury-green-800/60 border border-luxury-green-600/30 hover:border-gold-500/50 text-gold-300 hover:text-gold-200 text-[10px] font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
                            title="Quick Reassign / Transfer Project from this editor"
                          >
                            <ArrowRightLeft className="w-3 h-3 text-gold-400" />
                            <span>Quick Reassign</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Pending Payout Footer */}
                    <div className="flex justify-between items-center pt-2 border-t border-white/5 text-[11px] font-mono">
                      <span className="text-gray-500 text-[10px] uppercase">Pending Payout:</span>
                      <span className="text-yellow-400 font-bold">
                        ₹{pendingBalance >= 0 ? pendingBalance.toLocaleString('en-IN') : 0}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        );
      })()}
      </>
      )}

      {/* Editor Detail Slideout Drawer */}
      <AnimatePresence>
        {isDrawerOpen && selectedEditor && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)} />

            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                id="editor-detail-drawer"
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 180 }}
                className="w-screen max-w-2xl bg-charcoal-900 border-l border-luxury-green-800/30 shadow-2xl flex flex-col justify-between"
              >
                {/* Drawer Header details */}
                <div className="p-6 border-b border-luxury-green-800/20 bg-charcoal-950/50 shrink-0 flex justify-between items-start">
                  <div className="flex items-center space-x-4">
                    <div className="relative z-30 hover:z-50 shrink-0">
                      <div 
                        onClick={(e) => openEditModal(selectedEditor, e)}
                        className="w-14 h-14 rounded-2xl overflow-hidden cursor-pointer group shadow-lg transition-all duration-300 ease-out hover:scale-[3.5] hover:shadow-2xl origin-top-left"
                        title="Click to Change Photo / Edit Profile"
                      >
                        <img
                          src={selectedEditor.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150'}
                          alt={selectedEditor.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200 text-gold-400">
                          <Edit className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h2 className="text-xl font-bold font-display text-white">{selectedEditor.name}</h2>
                        <button
                          onClick={(e) => openEditModal(selectedEditor, e)}
                          className="p-1 hover:bg-gold-500/10 text-gray-400 hover:text-gold-400 rounded-lg transition-colors text-xs flex items-center space-x-1"
                          title="Edit Profile & Photo"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-gray-400">
                        <p className="flex items-center space-x-1">
                          <Star className="w-3.5 h-3.5 fill-gold-500 text-gold-500" />
                          <span className="font-bold text-gold-400 font-mono">{selectedEditor.rating.toFixed(1)} Editor Index</span>
                        </p>
                        <span className="text-gray-500">•</span>
                        <EditorLoadIndicator
                          editor={selectedEditor}
                          projects={projects}
                          variant="pill"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-2 hover:bg-charcoal-800 rounded-xl text-gray-400 cursor-pointer"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Body elements */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Detailed Editor Load & Bandwidth Breakdown */}
                  <div className="space-y-3">
                    <EditorLoadIndicator
                      editor={selectedEditor}
                      projects={projects}
                      variant="detailed"
                    />

                    {/* Quick Reassign Shortcut Button in Drawer */}
                    {userRole !== 'editor' && onUpdateProject && (
                      <div className="flex justify-end">
                        <button
                          onClick={(e) => handleOpenReassignModal(selectedEditor, e)}
                          className="px-3.5 py-1.5 rounded-xl bg-luxury-green-900/50 hover:bg-luxury-green-800/80 border border-luxury-green-600/40 hover:border-gold-500/60 text-gold-300 hover:text-gold-200 text-xs font-mono font-bold flex items-center space-x-2 transition-all shadow-md active:scale-95 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5 text-gold-400" />
                          <span>Quick Reassign / Transfer Project</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 🎬 Editor Top Wedding Portfolio Showcase in Drawer */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono flex items-center space-x-1.5">
                        <span>Portfolio Highlights</span>
                      </h3>
                      <span className="text-[10px] font-mono text-gray-400">Top 3 Showcase Cuts</span>
                    </div>
                    <EditorShowcaseCarousel
                      editor={selectedEditor}
                      projects={projects}
                      compact={false}
                    />
                  </div>

                  {/* Financial Payout calculations */}
                  {(() => {
                    const editorProjects = projects.filter(p => p.assignedEditorId === selectedEditor.id || (p.isSplitProject && p.secondEditorId === selectedEditor.id));
                    const totalEarningsVal = editorProjects.reduce((sum, p) => {
                      if (p.isSplitProject) {
                        if (p.assignedEditorId === selectedEditor.id) {
                          return sum + (p.firstEditorShare || 0);
                        } else if (p.secondEditorId === selectedEditor.id) {
                          return sum + (p.secondEditorShare || 0);
                        }
                      }
                      return sum + (p.editorPayment || 0);
                    }, 0);
                    
                    const totalPaidVal = payments
                      .filter(pay => pay.entityId === selectedEditor.id && pay.entityType === 'editor')
                      .reduce((sum, pay) => sum + (pay.amount || 0), 0);

                    const pendingBalance = totalEarningsVal - totalPaidVal;

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Editor ledger payouts</h3>
                          <button
                            onClick={() => setIsLoggingPayment(!isLoggingPayment)}
                            className="text-[10px] font-mono text-gold-400 hover:underline flex items-center space-x-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5 mr-1" />
                            <span>Settle Payment</span>
                          </button>
                        </div>

                        {/* Settle Payment Panel */}
                        {isLoggingPayment && (
                          <form onSubmit={handleLogPaymentSubmit} className="p-4 bg-charcoal-950 rounded-2xl border border-gold-500/20 space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Select Project</label>
                                <select
                                  value={paymentProjectId}
                                  onChange={(e) => setPaymentProjectId(e.target.value)}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-white"
                                  required
                                >
                                  <option value="">Choose Wedding Project</option>
                                  {editorProjects.map(proj => {
                                    const actualShare = proj.isSplitProject 
                                      ? (proj.assignedEditorId === selectedEditor.id ? proj.firstEditorShare : proj.secondEditorShare)
                                      : proj.editorPayment;
                                    return (
                                      <option key={proj.id} value={proj.id}>
                                        {proj.coupleName} (Share: ₹{(actualShare || 0).toLocaleString('en-IN')})
                                      </option>
                                    );
                                  })}
                                  <option value="misc_bonus">Miscellaneous / Advance / Bonus</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Settlement Amount (INR)</label>
                                <input
                                  type="number"
                                  placeholder="INR"
                                  value={paymentAmount}
                                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-white"
                                  required
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Payment Method</label>
                                <select
                                  value={paymentMethod}
                                  onChange={(e) => setPaymentMethod(e.target.value)}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-gray-300"
                                >
                                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                                  <option value="UPI / GPay">UPI / Google Pay</option>
                                  <option value="Cash">Cash</option>
                                  <option value="Cheque">Cheque</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-mono text-gray-400 mb-1">Receipt Notes</label>
                                <input
                                  type="text"
                                  placeholder="Txn ID, reference, etc."
                                  value={paymentNotes}
                                  onChange={(e) => setPaymentNotes(e.target.value)}
                                  className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-lg p-2 text-xs text-white"
                                />
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setIsLoggingPayment(false)}
                                className="px-3 py-1 text-[10px] text-gray-400 hover:text-gray-200"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                className="px-3.5 py-1.5 bg-gold-500 text-charcoal-950 font-bold text-[10px] rounded-lg"
                              >
                                Confirm Settlement
                              </button>
                            </div>
                          </form>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <div className="p-4 bg-charcoal-850/40 rounded-2xl border border-luxury-green-800/10 text-center">
                            <span className="text-[9px] font-mono text-gray-500 block">TOTAL WORK EARNED</span>
                            <span className="text-base font-bold text-white mt-1 block">₹{totalEarningsVal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-4 bg-emerald-950/20 rounded-2xl border border-emerald-500/10 text-center">
                            <span className="text-[9px] font-mono text-emerald-500 block">DISBURSED PAID</span>
                            <span className="text-base font-bold text-emerald-400 mt-1 block">₹{totalPaidVal.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="p-4 bg-red-950/20 rounded-2xl border border-red-500/10 text-center">
                            <span className="text-[9px] font-mono text-red-500 block">OUTSTANDING DUE</span>
                            <span className="text-base font-bold text-red-400 mt-1 block">₹{pendingBalance >= 0 ? pendingBalance.toLocaleString('en-IN') : 0}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Assigned weddings history */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Assigned Wedding cuts</h3>
                    <div className="space-y-2">
                      {projects.filter(p => p.assignedEditorId === selectedEditor.id || (p.isSplitProject && p.secondEditorId === selectedEditor.id)).length > 0 ? (
                        projects.filter(p => p.assignedEditorId === selectedEditor.id || (p.isSplitProject && p.secondEditorId === selectedEditor.id)).map((proj) => {
                          const actualShare = proj.isSplitProject 
                            ? (proj.assignedEditorId === selectedEditor.id ? proj.firstEditorShare : proj.secondEditorShare)
                            : proj.editorPayment;
                          return (
                            <div 
                              key={proj.id} 
                              className="p-3.5 rounded-2xl bg-charcoal-950/60 border border-luxury-green-800/10 flex justify-between items-center"
                            >
                              <div>
                                <span className="text-[9px] font-mono text-gold-400">{proj.id}</span>
                                <h4 className="text-xs font-bold text-white mt-1">{proj.coupleName}</h4>
                                <p className="text-[10px] text-gray-400 mt-0.5">{proj.studioName} • {proj.eventType}</p>
                                {proj.isSplitProject && (
                                  <span className="inline-block text-[8px] font-mono px-1.5 py-0.5 rounded bg-gold-500/10 text-gold-400 border border-gold-500/15 uppercase mt-1">
                                    Split Project (Lead: {proj.assignedEditorName})
                                  </span>
                                )}
                              </div>

                              <div className="text-right flex flex-col items-end space-y-1">
                                <span className="text-xs font-bold text-white block">₹{(actualShare || 0).toLocaleString('en-IN')}</span>
                                <div className="flex items-center space-x-1.5">
                                  <span className={`inline-block text-[8px] font-mono px-2 py-0.5 rounded uppercase ${
                                    proj.status === 'delivered' || proj.status === 'closed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                                  }`}>
                                    {proj.status}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenPdfModal(selectedEditor, 'invoice', e, proj.id)}
                                    className="px-2 py-0.5 bg-gold-500/15 hover:bg-gold-500/30 text-gold-400 border border-gold-500/30 rounded text-[9px] font-mono font-bold flex items-center space-x-1 transition-all cursor-pointer"
                                    title="Generate Separate Single Work Invoice for this Project"
                                  >
                                    <Receipt className="w-2.5 h-2.5" />
                                    <span>Work Invoice</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-6 text-[10px] text-gray-500 font-mono">No projects assigned currently.</div>
                      )}
                    </div>
                  </div>

                  {/* Payment settlement history log */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-500 font-mono">Payment ledger log</h3>
                    <div className="space-y-2">
                      {payments.filter(pay => pay.entityId === selectedEditor.id && pay.entityType === 'editor').length > 0 ? (
                        payments.filter(pay => pay.entityId === selectedEditor.id && pay.entityType === 'editor').map((pay) => (
                          <div 
                            key={pay.id} 
                            className="p-3 bg-charcoal-950/30 rounded-xl border border-luxury-green-800/5 flex justify-between items-center"
                          >
                            <div>
                              <span className="text-[9px] font-mono text-gray-500">{pay.date} • {pay.paymentMethod}</span>
                              <p className="text-xs text-gray-300 font-semibold mt-0.5 truncate">{pay.projectCoupleName}</p>
                              {pay.notes && <p className="text-[10px] text-gray-500 italic mt-0.5">Notes: {pay.notes}</p>}
                            </div>
                            <div className="flex items-center space-x-2 shrink-0">
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                + ₹{pay.amount.toLocaleString('en-IN')}
                              </span>
                              {onDeletePayment && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentToDeleteId(pay.id);
                                  }}
                                  className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg ml-2"
                                  title="Delete Settlement Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-[10px] text-gray-500 font-mono">No settlements recorded.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 border-t border-luxury-green-800/20 bg-charcoal-950/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => handleOpenPdfModal(selectedEditor, 'profile', e)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-charcoal-900 hover:bg-charcoal-800 text-gold-400 text-xs font-bold rounded-xl border border-gold-500/30 transition-all cursor-pointer"
                      title="Download Profile Summary PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Profile PDF</span>
                    </button>

                    <button
                      onClick={(e) => handleOpenPdfModal(selectedEditor, 'invoice', e)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-charcoal-900 hover:bg-charcoal-800 text-emerald-400 text-xs font-bold rounded-xl border border-emerald-500/30 transition-all cursor-pointer"
                      title="Generate Editor Invoice & Payout Statement"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Invoice / Payout</span>
                    </button>

                    <button
                      onClick={(e) => openEditModal(selectedEditor, e)}
                      className="flex items-center space-x-2 px-3 py-2 bg-luxury-green-800 text-gold-400 text-xs font-bold rounded-xl border border-gold-500/20 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Spec</span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDelete(selectedEditor.id, e)}
                    className="flex items-center space-x-1.5 px-3 py-2 hover:bg-red-500/10 text-red-400 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retire</span>
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE & EDIT Editor modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
              <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />

              <motion.div
                id="editor-form-modal"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform rounded-3xl glass-panel relative z-10"
              >
                <h3 className="text-lg font-bold text-white font-display mb-5">
                  {editingEditor ? `Edit Profile: ${editingEditor.name}` : 'Register New Editor'}
                </h3>

                <form onSubmit={handleSaveEditor} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Editor Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Phone Number</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Joined Date</label>
                      <input
                        type="date"
                        required
                        value={joinedDate}
                        onChange={(e) => setJoinedDate(e.target.value)}
                        onClick={(e) => { try { e.currentTarget.showPicker(); } catch (err) {} }}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Performance Index (1-5)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        required
                        value={rating}
                        onChange={(e) => setRating(Number(e.target.value))}
                        className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Editor Profile Photo Section */}
                  <div className="p-4 bg-charcoal-950/40 border border-luxury-green-800/10 rounded-2xl space-y-3">
                    <label className="block text-[10px] font-mono text-gold-400 uppercase tracking-wider font-semibold">
                      Editor Profile Photo
                    </label>

                    {/* Quick Preset Avatars */}
                    <div>
                      <span className="text-[9px] font-mono text-gray-400 block mb-1.5">Choose Preset Avatar or Upload:</span>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {PRESET_AVATARS.map((url, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPhoto(url)}
                            className={`w-9 h-9 rounded-xl overflow-hidden transition-all duration-300 relative hover:z-50 hover:scale-[2.5] hover:shadow-2xl origin-center ${
                              photo === url ? 'ring-2 ring-gold-400/40 opacity-100' : 'opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 pt-1 border-t border-luxury-green-800/10">
                      {/* Avatar circular preview */}
                      <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden bg-charcoal-900 flex items-center justify-center group shadow-md transition-all duration-300 hover:scale-[3] hover:z-50 hover:shadow-2xl origin-center">
                        {photo ? (
                          <>
                            <img 
                              src={photo} 
                              alt="Editor Preview" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setPhoto('')}
                              className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-red-400 font-mono font-bold transition-opacity duration-200"
                            >
                              Remove
                            </button>
                          </>
                        ) : (
                          <div className="text-gray-600 flex flex-col items-center">
                            <ImageIcon className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>

                      {/* Select methods */}
                      <div className="flex-1 space-y-2">
                        {/* File Upload Selector */}
                        <div className="relative">
                          <label className="flex items-center justify-center space-x-2 px-3 py-2 bg-[#211715] hover:bg-[#120c0b] border border-gold-500/20 hover:border-gold-500/40 text-gray-300 hover:text-white rounded-xl text-xs transition-all cursor-pointer font-semibold shadow-sm">
                            <Upload className="w-3.5 h-3.5 text-gold-400" />
                            <span>{isUploading ? "Compressing & Uploading..." : "Upload Local Photo"}</span>
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleFileChange} 
                              className="hidden" 
                            />
                          </label>
                        </div>

                        {/* Optional text URL input */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Or paste image URL (https://...)"
                            value={photo}
                            onChange={(e) => setPhoto(e.target.value)}
                            className="w-full bg-charcoal-900/60 border border-luxury-green-800/15 rounded-xl px-3 py-1.5 text-[10px] text-gray-300 focus:outline-none placeholder:text-gray-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">Internal Notes & Remarks</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-charcoal-900 border border-luxury-green-800/30 rounded-xl px-3 py-2 text-xs text-white h-20 resize-none"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-luxury-green-800/10">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs text-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-gold-500 text-charcoal-950 font-bold text-xs rounded-xl"
                    >
                      {editingEditor ? 'Save profile' : 'Confirm Registration'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Editor Confirmation Modal */}
      <AnimatePresence>
        {editorToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setEditorToDeleteId(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Retire Editor</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to retire this editor? Current production loads will need to be reallocated. This operation cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditorToDeleteId(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (editorToDeleteId) {
                      await onDeleteEditor(editorToDeleteId);
                      setEditorToDeleteId(null);
                      setSelectedEditor(null);
                      setIsDrawerOpen(false);
                      triggerToast("Editor Retired", "Editor profile and load records unlinked.");
                    }
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-bold text-xs rounded-xl shadow-[0_4px_15px_rgba(239,68,68,0.25)] transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.99]"
                >
                  Confirm Retire
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Payment Log Confirmation Modal */}
      <AnimatePresence>
        {paymentToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={() => setPaymentToDeleteId(null)} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-md p-6 overflow-hidden text-left bg-charcoal-900 border border-red-500/30 rounded-3xl shadow-[0_20px_50px_rgba(239,68,68,0.2)] z-10"
            >
              <div className="flex items-start space-x-3.5">
                <div className="p-3 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-display">Delete Payment Log</h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Are you sure you want to permanently delete this payment ledger record? This will erase the log from editor payout statements.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setPaymentToDeleteId(null)}
                  className="px-4 py-2.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (paymentToDeleteId && onDeletePayment) {
                      await onDeletePayment(paymentToDeleteId);
                      const deletedId = paymentToDeleteId;
                      setPaymentToDeleteId(null);
                      triggerToast("Payment Deleted", `Payment log ${deletedId} deleted successfully.`);
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

      {/* Success Notification Alert Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-luxury-green-950/90 border border-gold-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-md max-w-sm gold-glow animate-none"
          >
            <div className="p-2 bg-gold-500/25 rounded-xl text-gold-400">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">{toast.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{toast.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor PDF Export Modal (Profile Summary & Invoice) */}
      <EditorPdfExportModal
        editor={pdfModalEditor}
        projects={projects}
        payments={payments}
        studios={studios}
        isOpen={isPdfModalOpen}
        onClose={() => {
          setIsPdfModalOpen(false);
          setPdfModalEditor(null);
        }}
        defaultTab={pdfModalDefaultTab}
        initialProjectId={pdfModalProjectId}
      />

      {/* Quick Reassign Project Modal */}
      {reassignSourceEditor && onUpdateProject && (
        <QuickReassignModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setIsReassignModalOpen(false);
            setReassignSourceEditor(null);
          }}
          sourceEditor={reassignSourceEditor}
          editors={editors}
          projects={projects}
          studios={studios}
          onUpdateProject={onUpdateProject}
          onNotify={(message, type) => {
            setToast({
              title: type === 'error' ? 'Reassign Failed' : 'Project Reassigned',
              desc: message
            });
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}
    </div>
  );
});

export default EditorsView;
