import React, { useState, useMemo, useEffect } from 'react';
import { 
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
  Download,
  Receipt,
  Sparkles,
  ArrowRightLeft,
  Globe,
  Instagram,
  Linkedin,
  Film,
  HardDrive,
  MessageSquare,
  ExternalLink,
  ChevronDown,
  Check,
  X,
  Layers,
  ShieldCheck,
  Laptop,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Editor, Project, PaymentHistory, Studio } from '../types';
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

// Fallback high-contrast moody portraits matching the VELO editorial aesthetic
const CINEMATIC_EDITORIAL_PORTRAITS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=1200'
];

type ActiveSectionTab = 'overview' | 'deliveries' | 'portfolio' | 'invoices' | 'ledger' | 'contact';

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
  // Determine user's active editor
  const loggedInEditor = useMemo(() => {
    return editors.find(
      e => e.id === currentEditorId || (e.email && currentUserEmail && e.email.toLowerCase() === currentUserEmail.toLowerCase())
    );
  }, [editors, currentEditorId, currentUserEmail]);

  // Selected editor for display
  const [selectedEditorId, setSelectedEditorId] = useState<string>('');

  useEffect(() => {
    if (userRole === 'editor' && loggedInEditor) {
      setSelectedEditorId(loggedInEditor.id);
    } else if (editors.length > 0 && (!selectedEditorId || !editors.some(e => e.id === selectedEditorId))) {
      setSelectedEditorId(editors[0].id);
    }
  }, [editors, userRole, loggedInEditor, selectedEditorId]);

  const activeEditor = useMemo(() => {
    if (userRole === 'editor') {
      return loggedInEditor || editors[0] || null;
    }
    return editors.find(e => e.id === selectedEditorId) || editors[0] || null;
  }, [editors, selectedEditorId, userRole, loggedInEditor]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveSectionTab>('overview');

  // Modals & Drawers state
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [editingEditor, setEditingEditor] = useState<Editor | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfModalEditor, setPdfModalEditor] = useState<Editor | null>(null);
  const [pdfModalDefaultTab, setPdfModalDefaultTab] = useState<'profile' | 'invoice'>('profile');
  const [pdfModalProjectId, setPdfModalProjectId] = useState<string>('all');
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [reassignSourceEditor, setReassignSourceEditor] = useState<Editor | null>(null);
  const [editorToDeleteId, setEditorToDeleteId] = useState<string | null>(null);

  // Payment logging state
  const [isLoggingPayment, setIsLoggingPayment] = useState(false);
  const [paymentProjectId, setPaymentProjectId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer / UPI');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paymentToDeleteId, setPaymentToDeleteId] = useState<string | null>(null);

  // Toast feedback state
  const [toast, setToast] = useState<{ title: string; desc: string } | null>(null);
  const triggerToast = (title: string, desc: string) => {
    setToast({ title, desc });
    setTimeout(() => setToast(null), 3500);
  };

  // Dedicated Photo Change Modal State
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [photoTargetEditor, setPhotoTargetEditor] = useState<Editor | null>(null);
  const [tempPhotoUrl, setTempPhotoUrl] = useState<string>('');
  const [photoInputTab, setPhotoInputTab] = useState<'upload' | 'gallery' | 'url'>('upload');
  const [isSavingPhoto, setIsSavingPhoto] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const openPhotoChangeModal = (editor: Editor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPhotoTargetEditor(editor);
    setTempPhotoUrl(editor.photo || CINEMATIC_EDITORIAL_PORTRAITS[0]);
    setPhotoInputTab('upload');
    setIsPhotoModalOpen(true);
  };

  // Image file processor with canvas optimization for fast loading & Firestore safety
  const handleProcessImageFile = (file: File, onSuccess: (dataUrl: string) => void) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WEBP).');
      return;
    }
    setIsUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        setIsUploadingPhoto(false);
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          onSuccess(compressed);
        } else {
          onSuccess(rawDataUrl);
        }
        setIsUploadingPhoto(false);
      };
      img.onerror = () => {
        onSuccess(rawDataUrl);
        setIsUploadingPhoto(false);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSavePhotoOnly = async () => {
    if (!photoTargetEditor) return;
    if (!tempPhotoUrl.trim()) {
      alert('Please choose or upload a valid portrait image.');
      return;
    }
    setIsSavingPhoto(true);
    try {
      await onUpdateEditor(photoTargetEditor.id, {
        photo: tempPhotoUrl.trim()
      });
      triggerToast('Portrait Updated', `${photoTargetEditor.name}'s editorial image updated successfully.`);
      setIsPhotoModalOpen(false);
    } catch (err: any) {
      alert('Failed to update photo: ' + (err?.message || String(err)));
    } finally {
      setIsSavingPhoto(false);
    }
  };

  // Editor Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPhoto, setFormPhoto] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formRating, setFormRating] = useState(4.8);
  const [formJoinedDate, setFormJoinedDate] = useState('');
  const [formSpecialties, setFormSpecialties] = useState('');

  const openCreateModal = () => {
    setEditingEditor(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPhoto('');
    setFormBio('Lead Cinematic Film Editor & Colorist');
    setFormRating(4.9);
    setFormJoinedDate(new Date().toISOString().split('T')[0]);
    setFormSpecialties('Cinematic 4K, Color Grading, Teasers, Drone Cuts');
    setIsEditorModalOpen(true);
  };

  const openEditModal = (editor: Editor) => {
    setEditingEditor(editor);
    setFormName(editor.name);
    setFormEmail(editor.email || '');
    setFormPhone(editor.phone || '');
    setFormPhoto(editor.photo || '');
    setFormBio(editor.bio || 'Lead Cinematic Film Editor & Colorist');
    setFormRating(editor.rating || 4.8);
    setFormJoinedDate(editor.joinedDate || new Date().toISOString().split('T')[0]);
    setFormSpecialties(editor.specialties ? editor.specialties.join(', ') : 'Cinematic Teasers, Full Films');
    setIsEditorModalOpen(true);
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('Please enter editor name');
      return;
    }

    const specialtiesList = formSpecialties
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      if (editingEditor) {
        await onUpdateEditor(editingEditor.id, {
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          photo: formPhoto.trim(),
          bio: formBio.trim(),
          rating: Number(formRating),
          joinedDate: formJoinedDate,
          specialties: specialtiesList
        });
        triggerToast('Profile Updated', `${formName} specification saved.`);
      } else {
        await onAddEditor({
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          photo: formPhoto.trim() || CINEMATIC_EDITORIAL_PORTRAITS[Math.floor(Math.random() * CINEMATIC_EDITORIAL_PORTRAITS.length)],
          bio: formBio.trim(),
          rating: Number(formRating),
          joinedDate: formJoinedDate || new Date().toISOString().split('T')[0],
          specialties: specialtiesList,
          experienceYears: 4
        });
        triggerToast('Editor Created', `${formName} added to the editorial roster.`);
      }
      setIsEditorModalOpen(false);
    } catch (err: any) {
      alert('Failed to save editor: ' + (err?.message || String(err)));
    }
  };

  const handleDeleteEditorConfirm = async () => {
    if (!editorToDeleteId) return;
    try {
      const editorName = editors.find(e => e.id === editorToDeleteId)?.name || 'Editor';
      await onDeleteEditor(editorToDeleteId);
      setEditorToDeleteId(null);
      triggerToast('Editor Retired', `${editorName} removed from registry.`);
    } catch (err: any) {
      alert('Failed to delete editor: ' + (err?.message || String(err)));
    }
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

  const handleOpenReassignModal = (editor: Editor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setReassignSourceEditor(editor);
    setIsReassignModalOpen(true);
  };

  // Metrics for active editor
  const editorProjects = useMemo(() => {
    if (!activeEditor) return [];
    return projects.filter(
      p => p.assignedEditorId === activeEditor.id || (p.isSplitProject && p.secondEditorId === activeEditor.id)
    );
  }, [projects, activeEditor]);

  const completedProjectsCount = useMemo(() => {
    return editorProjects.filter(p => p.status === 'delivered' || p.status === 'closed').length;
  }, [editorProjects]);

  const activeCutsCount = editorProjects.length - completedProjectsCount;

  const totalEarnings = useMemo(() => {
    if (!activeEditor) return 0;
    return editorProjects.reduce((sum, p) => {
      if (p.isSplitProject) {
        if (p.assignedEditorId === activeEditor.id) return sum + (p.firstEditorShare || 0);
        if (p.secondEditorId === activeEditor.id) return sum + (p.secondEditorShare || 0);
      }
      return sum + (p.editorPayment || 0);
    }, 0);
  }, [editorProjects, activeEditor]);

  const totalPaid = useMemo(() => {
    if (!activeEditor) return 0;
    return payments
      .filter(pay => pay.entityId === activeEditor.id && pay.entityType === 'editor')
      .reduce((sum, pay) => sum + (pay.amount || 0), 0);
  }, [payments, activeEditor]);

  const outstandingBalance = totalEarnings - totalPaid;

  // Handle logging payment
  const handleLogPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditor) return;
    if (paymentAmount <= 0) {
      alert('Please enter a valid amount greater than ₹0.');
      return;
    }

    try {
      const matchedProj = projects.find(p => p.id === paymentProjectId);
      await onLogPayment({
        entityId: activeEditor.id,
        entityType: 'editor',
        projectId: paymentProjectId || 'general_ledger',
        projectCoupleName: matchedProj ? (matchedProj.coupleName || matchedProj.projectName || 'Project Cut') : 'Office Advance / Bonus',
        amount: paymentAmount,
        date: new Date().toISOString().split('T')[0],
        paymentMethod,
        notes: paymentNotes
      });

      setPaymentAmount(0);
      setPaymentNotes('');
      setIsLoggingPayment(false);
      triggerToast('Payment Logged', `₹${paymentAmount.toLocaleString('en-IN')} recorded on ${activeEditor.name}'s ledger.`);
    } catch (err: any) {
      alert('Failed to log payment: ' + (err?.message || String(err)));
    }
  };

  // If user is editor but profile is not linked
  if (userRole === 'editor' && !loggedInEditor) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-black text-white p-6 font-display">
        <div className="max-w-lg w-full bg-zinc-950 border border-zinc-800 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center mx-auto text-amber-400">
            <Laptop className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Editor Registry Profile Needed</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Your login is authenticated, but not yet linked to an active editor registry.
          </p>
          <div className="p-3 bg-zinc-900/80 rounded-xl text-xs font-mono text-zinc-300 border border-zinc-800">
            Current Email: {currentUserEmail}
          </div>
          <p className="text-xs text-amber-400/90 font-mono">
            Please ask an Admin to register an Editor with this email address.
          </p>
        </div>
      </div>
    );
  }

  // If no editors exist at all
  if (editors.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-black text-white p-6 font-display">
        <div className="max-w-md w-full text-center space-y-6">
          <span className="text-xs font-mono tracking-[0.3em] text-zinc-500 uppercase">THE FRAME CUT STUDIO</span>
          <h1 className="text-6xl font-black tracking-tight uppercase text-white">VELO</h1>
          <p className="text-sm text-zinc-400">No editor profiles have been registered in the post-production studio yet.</p>
          {userRole === 'admin' && (
            <button
              onClick={openCreateModal}
              className="px-8 py-3.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all hover:scale-105 active:scale-95 shadow-xl cursor-pointer"
            >
              + Create First Editor
            </button>
          )}
        </div>
      </div>
    );
  }

  // Active portrait image
  const displayPhoto = activeEditor?.photo || CINEMATIC_EDITORIAL_PORTRAITS[0];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans -mt-4 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-20">
      
      {/* ========================================================================= */}
      {/* 1. TOP MINIMALIST EDITORIAL NAVBAR (VELO HEADER)                          */}
      {/* ========================================================================= */}
      <header className="pt-6 pb-4 border-b border-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Brand Identity */}
        <div className="flex items-center space-x-4">
          <div className="flex flex-col">
            <span className="text-2xl lg:text-3xl font-bold tracking-[0.3em] font-display text-white uppercase select-none">
              VELO
            </span>
            <span className="text-[9px] font-mono tracking-[0.25em] text-zinc-500 uppercase -mt-0.5">
              POST-PRODUCTION • THE FRAME CUT
            </span>
          </div>

          {/* Admin Editor Selector Switcher */}
          {userRole === 'admin' && (
            <div className="relative group ml-3 pl-3 border-l border-zinc-800">
              <div className="flex items-center space-x-1.5 text-xs text-zinc-300 bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800 rounded-full px-3 py-1.5 transition-colors cursor-pointer">
                <span className="text-[10px] font-mono text-zinc-500 uppercase mr-1">Editor:</span>
                <span className="font-semibold text-white truncate max-w-[130px]">{activeEditor?.name}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </div>

              {/* Dropdown Menu */}
              <div className="absolute left-3 top-full mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl py-1.5 hidden group-hover:block z-50 backdrop-blur-xl">
                <div className="px-3 py-1.5 text-[10px] font-mono text-zinc-500 uppercase border-b border-zinc-900">
                  Switch Active Editor ({editors.length})
                </div>
                <div className="max-h-56 overflow-y-auto py-1">
                  {editors.map(ed => (
                    <button
                      key={ed.id}
                      type="button"
                      onClick={() => setSelectedEditorId(ed.id)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-zinc-900 transition-colors ${
                        activeEditor?.id === ed.id ? 'text-white font-bold bg-zinc-900/50' : 'text-zinc-400'
                      }`}
                    >
                      <span className="truncate">{ed.name}</span>
                      {activeEditor?.id === ed.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
                <div className="p-1.5 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={openCreateModal}
                    className="w-full text-center py-1.5 text-[11px] font-mono text-zinc-300 hover:text-white hover:bg-zinc-900 rounded-lg flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add New Editor</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Navigation Menu */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          {(['overview', 'deliveries', 'portfolio', 'invoices', 'ledger', 'contact'] as ActiveSectionTab[]).map(tabKey => {
            const labels: Record<ActiveSectionTab, string> = {
              overview: 'Home',
              deliveries: 'Deliveries',
              portfolio: 'Portfolio',
              invoices: 'Invoices',
              ledger: 'Ledger',
              contact: 'Contact'
            };

            const isActive = activeTab === tabKey;

            return (
              <button
                key={tabKey}
                type="button"
                onClick={() => setActiveTab(tabKey)}
                className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all rounded-full cursor-pointer ${
                  isActive
                    ? 'text-white font-bold bg-zinc-900 border border-zinc-700 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-950'
                }`}
              >
                {labels[tabKey]}
              </button>
            );
          })}

          {/* Quick PDF Export Pill */}
          {activeEditor && (
            <button
              type="button"
              onClick={() => handleOpenPdfModal(activeEditor, 'profile')}
              className="ml-2 p-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
              title="Download Editor Profile / Statement PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Admin Edit / Add Actions */}
          {userRole === 'admin' && activeEditor && (
            <button
              type="button"
              onClick={() => openEditModal(activeEditor)}
              className="p-2 rounded-full border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
              title="Edit Profile Specs & Photo"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. THE HERO SECTION (EXACT VELO EDITORIAL SPLIT SCREEN)                   */}
      {/* ========================================================================= */}
      {activeEditor && (
        <section className="relative min-h-[520px] lg:min-h-[580px] grid grid-cols-1 lg:grid-cols-12 items-center overflow-hidden border-b border-zinc-900">
          
          {/* Left Hero Content Column (Typography & Call-to-Actions) */}
          <div className="lg:col-span-7 py-12 lg:py-16 pr-4 z-20 flex flex-col justify-center space-y-6">
            
            {/* Kicker label */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex items-center space-x-3"
            >
              <span className="text-[11px] sm:text-xs font-mono font-bold tracking-[0.3em] text-zinc-400 uppercase">
                HELLO, MY NAME IS
              </span>
              <span className="w-6 h-px bg-zinc-700" />
            </motion.div>

            {/* Massive Bold Headline Name */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black uppercase tracking-tight text-white leading-[0.95] font-display select-none"
            >
              {activeEditor.name}
            </motion.h1>

            {/* Subtitle / Role with Typewriter Cursor */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex items-center text-sm sm:text-base md:text-lg text-zinc-300 font-sans tracking-wide"
            >
              <span>{activeEditor.bio || 'Lead Cinematic Film Editor & Colorist'}</span>
              <span className="inline-block w-0.5 h-5 bg-white ml-1.5 animate-pulse" />
            </motion.div>

            {/* Dual Pill Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3 pt-2"
            >
              {/* White Solid Pill Button */}
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className="px-8 py-3 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] shadow-xl cursor-pointer"
              >
                Portfolio
              </button>

              {/* Dark Outlined Pill Button */}
              <button
                type="button"
                onClick={() => setActiveTab('contact')}
                className="px-8 py-3 rounded-full bg-transparent border border-zinc-600 hover:border-white text-white font-medium text-xs uppercase tracking-wider hover:bg-white/5 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
              >
                Contact me
              </button>

              {/* Change Portrait Action Pill Button */}
              <button
                type="button"
                onClick={(e) => openPhotoChangeModal(activeEditor, e)}
                className="px-5 py-3 rounded-full bg-zinc-950 border border-zinc-800 hover:border-zinc-500 text-zinc-300 hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center space-x-2 hover:scale-[1.03] active:scale-[0.97]"
                title="Change or Upload Editor Portrait Image"
              >
                <Camera className="w-3.5 h-3.5 text-zinc-400" />
                <span>Change Photo</span>
              </button>

              {/* Direct Invoices Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className="px-5 py-3 rounded-full bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-300 hover:text-white font-mono text-xs transition-all cursor-pointer flex items-center space-x-1.5"
                title="View & Generate 1-Click Work Invoices"
              >
                <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                <span>Invoices Hub</span>
              </button>
            </motion.div>

            {/* Social & Workstation Icon Links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center space-x-4 pt-3 text-zinc-400"
            >
              <button
                type="button"
                onClick={() => setActiveTab('portfolio')}
                className="w-8 h-8 rounded-full border border-zinc-800 hover:border-zinc-500 hover:text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                title="Cinematic Showcase"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>

              <a
                href={activeEditor.phone ? `tel:${activeEditor.phone}` : '#'}
                className="w-8 h-8 rounded-full border border-zinc-800 hover:border-zinc-500 hover:text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                title="Direct Phone Line"
              >
                <Phone className="w-3.5 h-3.5" />
              </a>

              <a
                href={activeEditor.email ? `mailto:${activeEditor.email}` : '#'}
                className="w-8 h-8 rounded-full border border-zinc-800 hover:border-zinc-500 hover:text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                title="Email Studio Desk"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setActiveTab('deliveries')}
                className="w-8 h-8 rounded-full border border-zinc-800 hover:border-zinc-500 hover:text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                title="Active Wedding Productions"
              >
                <Film className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('ledger')}
                className="w-8 h-8 rounded-full border border-zinc-800 hover:border-zinc-500 hover:text-white flex items-center justify-center transition-all hover:scale-110 cursor-pointer"
                title="Ledger & Wage Settlements"
              >
                <IndianRupee className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            {/* Performance Indicators & Capacity Bar */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs font-mono">
              <div className="flex items-center space-x-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-300">
                <Star className="w-3 h-3 fill-white text-white" />
                <span>{activeEditor.rating.toFixed(1)} Editor Index</span>
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-300">
                <span className={`w-2 h-2 rounded-full ${activeCutsCount === 0 ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>{activeCutsCount === 0 ? 'Available for New Tasks' : `${activeCutsCount} Active Works`}</span>
              </div>

              <div className="flex items-center space-x-1.5 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-full text-zinc-400">
                <Calendar className="w-3 h-3 text-zinc-500" />
                <span>Joined {activeEditor.joinedDate || '2025'}</span>
              </div>
            </div>
          </div>

          {/* Right Hero Cinematic Portrait Column (Seamless Vignette Fade + Interactive Photo Trigger) */}
          <div 
            onClick={(e) => openPhotoChangeModal(activeEditor, e)}
            className="lg:col-span-5 relative h-[380px] sm:h-[450px] lg:h-[580px] w-full flex items-center justify-center overflow-hidden select-none cursor-pointer group"
            title="Click to Change Editor Portrait"
          >
            
            {/* Portrait Image with Moody Black & White Contrast Filter */}
            <motion.img
              key={activeEditor.id + (activeEditor.photo || '')}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              src={displayPhoto}
              alt={activeEditor.name}
              className="w-full h-full object-cover object-top filter grayscale contrast-125 brightness-90 transition-all duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />

            {/* Seamless Vignette Gradients into Pure Pitch Black */}
            {/* Left Edge Seamless Dark Gradient */}
            <div className="absolute inset-y-0 left-0 w-32 sm:w-48 bg-gradient-to-r from-black via-black/80 to-transparent pointer-events-none z-10" />

            {/* Bottom Edge Seamless Dark Gradient */}
            <div className="absolute inset-x-0 bottom-0 h-32 sm:h-48 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none z-10" />

            {/* Top Edge Soft Fade */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black via-black/40 to-transparent pointer-events-none z-10" />

            {/* Right Edge Soft Radial Shadow */}
            <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-black/60 to-transparent pointer-events-none z-10" />

            {/* Floating "Change Photo" Action Badge (Top Right) */}
            <div className="absolute top-4 right-4 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPhotoChangeModal(activeEditor, e);
                }}
                className="px-3.5 py-1.5 rounded-full bg-black/75 hover:bg-white hover:text-black text-white border border-white/20 hover:border-white text-xs font-mono backdrop-blur-md shadow-2xl transition-all duration-200 flex items-center space-x-1.5 cursor-pointer hover:scale-105"
                title="Change Portrait Image"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Change Photo</span>
              </button>
            </div>

            {/* Hover Indicator Overlay with Camera Icon */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-15 flex flex-col items-center justify-center pointer-events-none">
              <div className="p-3 rounded-full bg-black/80 border border-white/30 text-white mb-2 shadow-xl backdrop-blur-md transform group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6" />
              </div>
              <span className="text-xs font-mono font-bold tracking-widest text-white uppercase bg-black/80 px-3 py-1 rounded-full border border-white/20">
                Click to Change Portrait Photo
              </span>
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE EDITORIAL CONTENT MODULES ACCORDING TO ACTIVE TAB          */}
      {/* ========================================================================= */}
      <main className="mt-12 space-y-12">

        {/* Tab 1: OVERVIEW & HIGHLIGHTS */}
        {activeTab === 'overview' && activeEditor && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-10"
          >
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Assigned Productions</span>
                <span className="text-3xl font-black font-display tracking-tight text-white">{editorProjects.length}</span>
                <span className="text-[11px] font-mono text-zinc-400">{completedProjectsCount} Completed • {activeCutsCount} In Progress</span>
              </div>

              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Total Work Earned</span>
                <span className="text-3xl font-black font-display tracking-tight text-white">₹{totalEarnings.toLocaleString('en-IN')}</span>
                <span className="text-[11px] font-mono text-zinc-400">Total contractual fees</span>
              </div>

              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Disbursed Wages</span>
                <span className="text-3xl font-black font-display tracking-tight text-emerald-400">₹{totalPaid.toLocaleString('en-IN')}</span>
                <span className="text-[11px] font-mono text-zinc-400">Received in bank / UPI</span>
              </div>

              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col justify-between space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">Outstanding Balance</span>
                <span className="text-3xl font-black font-display tracking-tight text-amber-400">
                  ₹{outstandingBalance >= 0 ? outstandingBalance.toLocaleString('en-IN') : 0}
                </span>
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-mono text-zinc-400">Pending settlement</span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('ledger');
                      setIsLoggingPayment(true);
                    }}
                    className="text-[10px] font-mono font-bold text-white underline hover:text-zinc-300 cursor-pointer"
                  >
                    + Log Payment
                  </button>
                </div>
              </div>
            </div>

            {/* Active Deliveries Snapshot */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  ACTIVE WEDDING DELIVERIES
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('deliveries')}
                  className="text-xs font-mono text-zinc-400 hover:text-white uppercase transition-colors"
                >
                  View All ({editorProjects.length}) →
                </button>
              </div>

              {editorProjects.length === 0 ? (
                <div className="py-12 text-center text-zinc-600 font-mono text-xs border border-dashed border-zinc-900 rounded-2xl">
                  No wedding projects assigned to this editor yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {editorProjects.slice(0, 6).map(proj => (
                    <div
                      key={proj.id}
                      className="p-5 bg-zinc-950/80 border border-zinc-900 hover:border-zinc-800 rounded-2xl transition-all space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500">{proj.id}</span>
                          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full ${
                            proj.status === 'delivered' || proj.status === 'closed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white font-display mt-2 tracking-tight">
                          {proj.coupleName || proj.projectName}
                        </h4>
                        <p className="text-xs text-zinc-400 mt-0.5">{proj.studioName || 'Direct Studio'} • {proj.eventType || 'Wedding'}</p>
                      </div>

                      <div className="pt-3 border-t border-zinc-900/80 flex items-center justify-between text-xs font-mono">
                        <span className="text-zinc-500">Contract Share:</span>
                        <span className="text-white font-bold">₹{(proj.isSplitProject ? (proj.firstEditorShare || 0) : proj.editorPayment).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Showcase Film Frames Carousel Preview */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <h3 className="text-xs font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase">
                  PORTFOLIO & 4K CINEMATIC CUTS
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('portfolio')}
                  className="text-xs font-mono text-zinc-400 hover:text-white uppercase transition-colors"
                >
                  Full Showcase →
                </button>
              </div>

              <EditorShowcaseCarousel
                editor={activeEditor}
                projects={projects}
                compact={false}
              />
            </div>
          </motion.div>
        )}

        {/* Tab 2: DELIVERIES & ASSIGNED PRODUCTIONS */}
        {activeTab === 'deliveries' && activeEditor && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-lg font-bold font-display tracking-tight text-white uppercase">
                  {activeEditor.name}’s Deliveries & Works
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  {editorProjects.length} total wedding works • {completedProjectsCount} completed • {activeCutsCount} in active production
                </p>
              </div>

              {userRole !== 'editor' && onUpdateProject && (
                <button
                  type="button"
                  onClick={(e) => handleOpenReassignModal(activeEditor, e)}
                  className="px-4 py-2 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Quick Reassign Project</span>
                </button>
              )}
            </div>

            {editorProjects.length === 0 ? (
              <div className="py-20 text-center text-zinc-500 font-mono text-xs border border-zinc-900 rounded-3xl">
                No assignments recorded for this editor yet.
              </div>
            ) : (
              <div className="space-y-3">
                {editorProjects.map(proj => (
                  <div
                    key={proj.id}
                    className="p-5 bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                        <img
                          src={proj.couplePhoto || 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=300'}
                          alt={proj.coupleName}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono text-zinc-500">{proj.id}</span>
                          <span className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded-full ${
                            proj.status === 'delivered' || proj.status === 'closed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {proj.status}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-white font-display mt-1">{proj.coupleName}</h4>
                        <p className="text-xs text-zinc-400">{proj.studioName} • Delivery: {proj.deliveryDate || 'Flexible'}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end space-x-4 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-900">
                      <div className="text-right">
                        <span className="text-sm font-bold text-white font-mono block">
                          ₹{(proj.isSplitProject ? (proj.firstEditorShare || 0) : proj.editorPayment).toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">Editor Contract Fee</span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleOpenPdfModal(activeEditor, 'invoice', e, proj.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono flex items-center space-x-1.5 transition-all cursor-pointer"
                        title="Generate Separate Single Work Invoice"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Work Invoice</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Tab 3: PORTFOLIO & 4K MASTER SHOWCASE */}
        {activeTab === 'portfolio' && activeEditor && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="border-b border-zinc-900 pb-4">
              <h3 className="text-lg font-bold font-display tracking-tight text-white uppercase">
                {activeEditor.name}’s Master Reel & Showcase
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Curated 4K wedding films, color grading grades, cinematic teasers, and drone highlights.
              </p>
            </div>

            <EditorShowcaseCarousel
              editor={activeEditor}
              projects={projects}
              compact={false}
            />
          </motion.div>
        )}

        {/* Tab 4: INVOICES & STATEMENTS HUB */}
        {activeTab === 'invoices' && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="border-b border-zinc-900 pb-4">
              <h3 className="text-lg font-bold font-display tracking-tight text-white uppercase">
                Editor Work Invoices & Statements Hub
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                1-Click professional PDF generation for single deliveries, consolidated monthly statements, and payment acknowledgments.
              </p>
            </div>

            <EditorInvoicesHub
              editors={editors}
              projects={projects}
              payments={payments}
              studios={studios}
              userRole={userRole}
              currentEditor={activeEditor}
              onOpenPdfModal={handleOpenPdfModal}
              onLogPayment={onLogPayment}
            />
          </motion.div>
        )}

        {/* Tab 5: LEDGER & WAGE SETTLEMENTS */}
        {activeTab === 'ledger' && activeEditor && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <h3 className="text-lg font-bold font-display tracking-tight text-white uppercase">
                  {activeEditor.name}’s Financial Ledger
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                  Real-time synchronization between project contract shares and disbursed payments.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLoggingPayment(!isLoggingPayment)}
                className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shadow-md"
              >
                {isLoggingPayment ? 'Close Log Form' : '+ Record Payment'}
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">Total Work Earned</span>
                <span className="text-4xl font-black font-display text-white tracking-tight block">
                  ₹{totalEarnings.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-mono text-zinc-400 block">{editorProjects.length} contracted assignments</span>
              </div>

              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-500 block">Disbursed Wages</span>
                <span className="text-4xl font-black font-display text-emerald-400 tracking-tight block">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </span>
                <span className="text-xs font-mono text-zinc-400 block">Paid via bank/UPI settlements</span>
              </div>

              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-amber-500 block">Outstanding Balance</span>
                <span className="text-4xl font-black font-display text-amber-400 tracking-tight block">
                  ₹{outstandingBalance >= 0 ? outstandingBalance.toLocaleString('en-IN') : 0}
                </span>
                <span className="text-xs font-mono text-zinc-400 block">Pending final delivery clearance</span>
              </div>
            </div>

            {/* Record Payment Form Modal/Panel */}
            {isLoggingPayment && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl space-y-4"
              >
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <h4 className="text-xs font-mono font-bold tracking-wider text-white uppercase">
                    Record Payment on {activeEditor.name}’s Ledger
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsLoggingPayment(false)}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    ✕ Close
                  </button>
                </div>

                <form onSubmit={handleLogPaymentSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Wedding Project</label>
                      <select
                        value={paymentProjectId}
                        onChange={(e) => setPaymentProjectId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                      >
                        <option value="">General Advance / Studio Bonus</option>
                        {editorProjects.map(proj => (
                          <option key={proj.id} value={proj.id}>{proj.coupleName} (Fee: ₹{proj.editorPayment})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Amount (₹ INR)</label>
                      <input
                        type="number"
                        placeholder="Amount in INR"
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                      >
                        <option value="Bank Transfer / UPI">Bank Transfer / UPI (GPay/PhonePe)</option>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 uppercase mb-1">Settlement Notes</label>
                      <input
                        type="text"
                        placeholder="Transaction ref / milestone note..."
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer"
                    >
                      Confirm Ledger Entry
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Payment Settlement History */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold tracking-[0.2em] text-zinc-400 uppercase">
                SETTLEMENT RECEIPTS HISTORY
              </h4>

              {payments.filter(pay => pay.entityId === activeEditor.id && pay.entityType === 'editor').length === 0 ? (
                <div className="py-12 text-center text-zinc-600 font-mono text-xs border border-zinc-900 rounded-2xl">
                  No payment settlements recorded for this editor yet.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {payments
                    .filter(pay => pay.entityId === activeEditor.id && pay.entityType === 'editor')
                    .map(pay => (
                      <div
                        key={pay.id}
                        className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex items-center justify-between"
                      >
                        <div>
                          <span className="text-[9px] font-mono text-zinc-500">{pay.date} • {pay.paymentMethod}</span>
                          <h5 className="text-xs font-bold text-white mt-0.5">{pay.projectCoupleName}</h5>
                          {pay.notes && <p className="text-[10px] text-zinc-400 mt-0.5">Note: {pay.notes}</p>}
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-bold text-emerald-400 font-mono">
                            + ₹{pay.amount.toLocaleString('en-IN')}
                          </span>
                          {onDeletePayment && (
                            <button
                              type="button"
                              onClick={() => setPaymentToDeleteId(pay.id)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"
                              title="Delete Payment Log"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Tab 6: CONTACT & SPECS */}
        {activeTab === 'contact' && activeEditor && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-8 max-w-4xl"
          >
            <div className="border-b border-zinc-900 pb-4">
              <h3 className="text-lg font-bold font-display tracking-tight text-white uppercase">
                Contact Desk & Production Specifications
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5 font-mono">
                Direct credentials, software suites, and studio communication lines.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">Communication Lines</span>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-xs">
                    <Phone className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-300 font-mono">{activeEditor.phone || 'Phone not registered'}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-300 font-mono">{activeEditor.email || 'Email not registered'}</span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-300 font-mono">Registry Member Since: {activeEditor.joinedDate}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-900 flex items-center space-x-3">
                  <a
                    href={activeEditor.phone ? `https://wa.me/${activeEditor.phone.replace(/[^0-9]/g, '')}` : '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all"
                  >
                    WhatsApp Chat
                  </a>
                  <a
                    href={activeEditor.phone ? `tel:${activeEditor.phone}` : '#'}
                    className="px-5 py-2.5 rounded-full border border-zinc-700 hover:border-white text-white text-xs uppercase tracking-wider transition-all"
                  >
                    Call Editor
                  </a>
                </div>
              </div>

              {/* Editing Suite & Gear Specs */}
              <div className="p-6 bg-zinc-950 border border-zinc-900 rounded-3xl space-y-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500 block">Specialties & Workstation</span>
                
                <div className="flex flex-wrap gap-2">
                  {(activeEditor.specialties && activeEditor.specialties.length > 0 
                    ? activeEditor.specialties 
                    : ['Cinematic 4K Master', 'Color Grading (DaVinci)', 'Highlight Teasers', 'Traditional Cuts', 'Drone Aesthetics']
                  ).map((spec, i) => (
                    <span key={i} className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono text-zinc-300">
                      {spec}
                    </span>
                  ))}
                </div>

                <div className="pt-2 text-xs text-zinc-400 leading-relaxed">
                  Equipped with dedicated high-speed NVMe storage, DaVinci Resolve Studio & Premiere Pro colour-managed pipelines for 10-bit Log footage.
                </div>

                {/* Profile Portrait & Specification Actions */}
                <div className="pt-4 border-t border-zinc-900 flex flex-wrap justify-between items-center gap-3">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={(e) => openPhotoChangeModal(activeEditor, e)}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-full text-xs font-mono text-zinc-200 flex items-center space-x-1.5 transition-colors cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Change Portrait Photo</span>
                    </button>

                    {userRole === 'admin' && (
                      <button
                        type="button"
                        onClick={() => openEditModal(activeEditor)}
                        className="text-xs font-mono text-zinc-400 hover:text-white underline cursor-pointer"
                      >
                        Edit Specifications
                      </button>
                    )}
                  </div>

                  {userRole === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setEditorToDeleteId(activeEditor.id)}
                      className="text-xs font-mono text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Retire Editor Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 4. MODALS & UTILITY ACTIONS (EDIT, PDF, REASSIGN, DELETE)                 */}
      {/* ========================================================================= */}

      {/* CREATE & EDIT EDITOR MODAL */}
      <AnimatePresence>
        {isEditorModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsEditorModalOpen(false)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl z-10 font-sans max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-zinc-900 pb-4">
                <div>
                  <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">VELO REGISTRY</span>
                  <h3 className="text-xl font-bold font-display text-white mt-0.5">
                    {editingEditor ? 'Edit Editor Profile' : 'Register New Editor'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditorModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-lg p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEditor} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Editor Name *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. John Doe / Sachin Verma"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="editor@studio.com"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-mono text-zinc-400 uppercase">Editorial Portrait Photo</label>
                    <span className="text-[10px] font-mono text-zinc-500">Device Upload or Web URL</span>
                  </div>

                  {/* Photo Preview & Quick Device Upload Bar */}
                  <div className="flex items-center gap-3 p-3 bg-zinc-900/80 border border-zinc-800 rounded-2xl mb-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-black border border-zinc-700 flex-shrink-0 relative">
                      <img
                        src={formPhoto || CINEMATIC_EDITORIAL_PORTRAITS[0]}
                        alt="Portrait Preview"
                        className="w-full h-full object-cover object-top filter grayscale contrast-125 brightness-90"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-full text-xs font-mono font-medium transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploadingPhoto ? 'Processing...' : 'Upload File'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleProcessImageFile(f, (url) => setFormPhoto(url));
                            }}
                          />
                        </label>
                        
                        <button
                          type="button"
                          onClick={() => {
                            const next = CINEMATIC_EDITORIAL_PORTRAITS[Math.floor(Math.random() * CINEMATIC_EDITORIAL_PORTRAITS.length)];
                            setFormPhoto(next);
                          }}
                          className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-full text-xs font-mono transition-colors"
                        >
                          Random Preset
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono">Upload from phone/laptop or choose a preset below.</p>
                    </div>
                  </div>

                  {/* Quick Preset Selector Grid */}
                  <div className="mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 block mb-1.5">Choose from Curated Studio Looks:</span>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {CINEMATIC_EDITORIAL_PORTRAITS.map((presetUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFormPhoto(presetUrl)}
                          className={`relative h-12 rounded-lg overflow-hidden border transition-all ${
                            formPhoto === presetUrl ? 'border-white ring-2 ring-white/50 scale-105' : 'border-zinc-800 hover:border-zinc-500 opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={presetUrl} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover filter grayscale contrast-125" referrerPolicy="no-referrer" />
                          {formPhoto === presetUrl && (
                            <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                              <Check className="w-3 h-3 text-white drop-shadow" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Direct URL Input */}
                  <input
                    type="text"
                    value={formPhoto}
                    onChange={(e) => setFormPhoto(e.target.value)}
                    placeholder="Or enter direct image URL (https://...)"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Role / Tagline</label>
                  <input
                    type="text"
                    value={formBio}
                    onChange={(e) => setFormBio(e.target.value)}
                    placeholder="e.g. Lead Colorist & Cinematic Wedding Film Editor"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Performance Index (1-5)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      max="5"
                      value={formRating}
                      onChange={(e) => setFormRating(Number(e.target.value))}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Joined Date</label>
                    <input
                      type="date"
                      value={formJoinedDate}
                      onChange={(e) => setFormJoinedDate(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-zinc-400 uppercase mb-1">Specialties (Comma separated)</label>
                  <input
                    type="text"
                    value={formSpecialties}
                    onChange={(e) => setFormSpecialties(e.target.value)}
                    placeholder="Teasers, Full Film, DaVinci Resolve, Drone"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-white focus:outline-none transition-colors"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsEditorModalOpen(false)}
                    className="px-5 py-2.5 text-xs font-mono text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shadow-lg"
                  >
                    {editingEditor ? 'Save Changes' : 'Register Editor'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {editorToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setEditorToDeleteId(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-950 border border-red-500/30 rounded-3xl p-6 space-y-4 shadow-2xl z-10"
            >
              <h3 className="text-lg font-bold text-white font-display">Retire Editor Profile</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Are you sure you want to retire this editor? Their profile will be removed from active assignments, but existing project records and payments remain in history.
              </p>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setEditorToDeleteId(null)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEditorConfirm}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Confirm Retire
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE PAYMENT RECORD MODAL */}
      <AnimatePresence>
        {paymentToDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md" onClick={() => setPaymentToDeleteId(null)} />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl z-10"
            >
              <h3 className="text-lg font-bold text-white font-display">Delete Settlement Record</h3>
              <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                Are you sure you want to remove this logged payment from the editor’s statement?
              </p>

              <div className="flex justify-end space-x-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => setPaymentToDeleteId(null)}
                  className="px-4 py-2 text-xs font-mono text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (paymentToDeleteId && onDeletePayment) {
                      await onDeletePayment(paymentToDeleteId);
                      setPaymentToDeleteId(null);
                      triggerToast('Record Removed', 'Payment log removed from ledger.');
                    }
                  }}
                  className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
                >
                  Delete Record
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-white text-black px-5 py-3 rounded-full shadow-2xl flex items-center space-x-2 font-mono text-xs"
          >
            <span className="w-2 h-2 rounded-full bg-black" />
            <span className="font-bold">{toast.title}:</span>
            <span className="text-zinc-700">{toast.desc}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. DEDICATED CHANGE PORTRAIT PHOTO MODAL                                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPhotoModalOpen && photoTargetEditor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/85 backdrop-blur-md" 
              onClick={() => !isSavingPhoto && setIsPhotoModalOpen(false)} 
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl z-10 font-sans max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">VELO CINEMATIC STUDIO</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  </div>
                  <h3 className="text-xl font-bold font-display text-white mt-1">
                    Change Editor Portrait
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Update portrait photo for <span className="text-white font-medium">{photoTargetEditor.name}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSavingPhoto}
                  onClick={() => setIsPhotoModalOpen(false)}
                  className="text-zinc-500 hover:text-white text-lg p-1.5 rounded-full hover:bg-zinc-900 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Split Preview & Method Picker */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Visual Live Editorial Preview */}
                <div className="sm:col-span-5 flex flex-col items-center">
                  <div className="relative w-44 h-56 rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl group">
                    <img
                      src={tempPhotoUrl || CINEMATIC_EDITORIAL_PORTRAITS[0]}
                      alt="Live Portrait Preview"
                      className="w-full h-full object-cover object-top filter grayscale contrast-125 brightness-90 transition-all duration-300"
                      referrerPolicy="no-referrer"
                    />
                    {/* Vignette Preview Gradients */}
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
                    <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" />

                    <div className="absolute bottom-2 left-2 right-2 z-10">
                      <span className="text-[10px] font-mono font-bold text-white block truncate uppercase tracking-wider">
                        {photoTargetEditor.name}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400 block">
                        Live Preview Look
                      </span>
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/80 border border-white/20 text-[9px] font-mono text-zinc-300">
                      B&W Filter
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500 mt-2">VELO High-Contrast Output</span>
                </div>

                {/* Mode Selector Tabs & Inputs */}
                <div className="sm:col-span-7 space-y-4">
                  {/* Tab Selector Bar */}
                  <div className="flex p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPhotoInputTab('upload')}
                      className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        photoInputTab === 'upload' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputTab('gallery')}
                      className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        photoInputTab === 'gallery' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Presets</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhotoInputTab('url')}
                      className={`flex-1 py-1.5 text-xs font-mono rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                        photoInputTab === 'url' ? 'bg-white text-black font-bold shadow' : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web URL</span>
                    </button>
                  </div>

                  {/* Tab 1: Direct File Upload */}
                  {photoInputTab === 'upload' && (
                    <div className="space-y-3">
                      <label className="block border-2 border-dashed border-zinc-800 hover:border-zinc-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-zinc-950/50 hover:bg-zinc-900/40">
                        <div className="w-10 h-10 rounded-full bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-400 mb-3 group-hover:text-white">
                          <Camera className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-white block">
                          {isUploadingPhoto ? 'Optimizing Image...' : 'Click to select photo from device'}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 block mt-1">Supports JPG, PNG, WEBP (Auto-optimized)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleProcessImageFile(file, (url) => setTempPhotoUrl(url));
                          }}
                        />
                      </label>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">
                        Tip: Photos are automatically resized and converted to studio-grade monochrome inside the VELO engine.
                      </p>
                    </div>
                  )}

                  {/* Tab 2: Studio Gallery Presets */}
                  {photoInputTab === 'gallery' && (
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                        Select a Cinematic Editorial Preset:
                      </span>
                      <div className="grid grid-cols-4 gap-2">
                        {CINEMATIC_EDITORIAL_PORTRAITS.map((presetUrl, idx) => {
                          const isSelected = tempPhotoUrl === presetUrl;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTempPhotoUrl(presetUrl)}
                              className={`relative h-16 rounded-xl overflow-hidden border transition-all cursor-pointer ${
                                isSelected ? 'border-white ring-2 ring-white/50 scale-105 z-10' : 'border-zinc-800 hover:border-zinc-500 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <img
                                src={presetUrl}
                                alt={`Preset ${idx + 1}`}
                                className="w-full h-full object-cover filter grayscale contrast-125"
                                referrerPolicy="no-referrer"
                              />
                              {isSelected && (
                                <div className="absolute inset-0 bg-white/20 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-white drop-shadow" />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tab 3: Web Image URL */}
                  {photoInputTab === 'url' && (
                    <div className="space-y-2">
                      <label className="block text-[11px] font-mono text-zinc-400 uppercase">Direct Image Link</label>
                      <input
                        type="text"
                        value={tempPhotoUrl}
                        onChange={(e) => setTempPhotoUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs font-mono text-zinc-200 focus:border-white focus:outline-none transition-colors"
                      />
                      <p className="text-[10px] text-zinc-500 font-mono">
                        Paste any public image URL from Unsplash, Google Drive (direct link), Imgur, or cloud storage.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  disabled={isSavingPhoto}
                  onClick={() => setTempPhotoUrl(CINEMATIC_EDITORIAL_PORTRAITS[0])}
                  className="text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Reset to Default Preset
                </button>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isSavingPhoto}
                    onClick={() => setIsPhotoModalOpen(false)}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-zinc-800 hover:border-zinc-600 text-zinc-300 font-mono text-xs hover:bg-white/5 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={isSavingPhoto || !tempPhotoUrl.trim()}
                    onClick={handleSavePhotoOnly}
                    className="flex-1 sm:flex-initial px-7 py-2.5 rounded-full bg-white text-black hover:bg-zinc-200 font-bold text-xs uppercase tracking-wider transition-all hover:scale-105 shadow-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSavingPhoto ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Photo</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1-CLICK PDF EXPORT MODAL */}
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

      {/* QUICK REASSIGN PROJECT MODAL */}
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
            triggerToast(type === 'error' ? 'Reassign Error' : 'Reassigned', message);
          }}
        />
      )}
    </div>
  );
});

export default EditorsView;
