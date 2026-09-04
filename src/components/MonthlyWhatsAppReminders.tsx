import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';
import { 
  MessageSquare, 
  Calendar, 
  Send, 
  Copy, 
  Check, 
  AlertCircle, 
  Settings, 
  CheckCircle2, 
  DollarSign, 
  Sparkles, 
  Phone, 
  Users, 
  ExternalLink, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  HelpCircle,
  Clock,
  CheckCheck,
  Building2,
  Film,
  FileText,
  Download,
  QrCode,
  Search,
  Filter,
  RefreshCw,
  Smartphone,
  Eye,
  Sliders,
  X,
  IndianRupee,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, Studio, Editor, PaymentHistory } from '../types';

interface MonthlyWhatsAppRemindersProps {
  projects: Project[];
  studios: Studio[];
  editors: Editor[];
  payments?: PaymentHistory[];
}

export type ReminderTone = 'statement' | 'polite' | 'delivery' | 'urgent';

interface ReminderHistoryItem {
  count: number;
  lastSentAt: string;
}

export default function MonthlyWhatsAppReminders({
  projects,
  studios,
  editors,
  payments = []
}: MonthlyWhatsAppRemindersProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'studios' | 'editors'>('studios');
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [autoSchedulerEnabled, setAutoSchedulerEnabled] = useState(true);

  // Selected tone style across reminders
  const [globalTone, setGlobalTone] = useState<ReminderTone>('statement');
  const [cardTones, setCardTones] = useState<Record<string, ReminderTone>>({});

  // Search and Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'high_value' | 'not_sent'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });

  // Preview Chat Modal state
  const [previewModalData, setPreviewModalData] = useState<{
    id: string;
    name: string;
    phone: string;
    amount: number;
    text: string;
    type: 'studio' | 'editor';
    projectItems: { coupleName: string; eventType: string; amount: number }[];
  } | null>(null);

  // UPI QR Code Modal state
  const [upiQrModalData, setUpiQrModalData] = useState<{
    name: string;
    amount: number;
    upiId: string;
    link: string;
  } | null>(null);

  // Studio UPI Configuration
  const [upiIdConfig, setUpiIdConfig] = useState<string>(() => {
    return localStorage.getItem('tfc_upi_id') || 'sateeshtiwari3@okaxis';
  });

  // Reminder History tracking from LocalStorage
  const [reminderHistory, setReminderHistory] = useState<Record<string, ReminderHistoryItem>>(() => {
    try {
      return JSON.parse(localStorage.getItem('tfc_wa_reminder_history') || '{}');
    } catch {
      return {};
    }
  });

  // Custom phone number overrides stored locally
  const [phoneOverrides, setPhoneOverrides] = useState<Record<string, string>>(() => {
    try {
      return JSON.parse(localStorage.getItem('tfc_wa_phone_overrides') || '{}');
    } catch {
      return {};
    }
  });

  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null);
  const [tempPhoneInput, setTempPhoneInput] = useState('');

  // Save history helper
  const markAsSent = (id: string) => {
    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
    setReminderHistory(prev => {
      const current = prev[id] || { count: 0, lastSentAt: '' };
      const updated = {
        ...prev,
        [id]: { count: current.count + 1, lastSentAt: formatted }
      };
      localStorage.setItem('tfc_wa_reminder_history', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSavePhone = (id: string) => {
    const updated = { ...phoneOverrides, [id]: tempPhoneInput.trim() };
    setPhoneOverrides(updated);
    localStorage.setItem('tfc_wa_phone_overrides', JSON.stringify(updated));
    setEditingPhoneId(null);
  };

  // Current Date logic & 5th of month calculation
  const today = new Date();
  const currentDay = today.getDate();
  const monthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();

  // Is today around the 5th? (e.g. 1st to 10th of month)
  const isFifthCycleActive = currentDay >= 1 && currentDay <= 10;

  // Next 5th date string
  const nextFifthDate = useMemo(() => {
    const target = new Date(today.getFullYear(), today.getMonth(), 5);
    if (today.getDate() > 5) {
      target.setMonth(target.getMonth() + 1);
    }
    return target.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }, [today]);

  // Consolidated Studio Balances
  const studioBalances = useMemo(() => {
    return studios.map(studio => {
      const studioProjects = projects.filter(p => p.studioId === studio.id);
      const totalAmount = studioProjects.reduce((sum, p) => sum + (p.projectAmount || 0), 0);
      const paidAmount = studioProjects.reduce((sum, p) => sum + (p.advancePayment || 0), 0);
      const pendingAmount = studioProjects.reduce((sum, p) => sum + (p.remainingBalance || 0), 0);

      return {
        studio,
        projectCount: studioProjects.length,
        totalAmount,
        paidAmount,
        pendingAmount,
        phone: studio.phone || '',
        projects: studioProjects
      };
    }).filter(item => item.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [studios, projects]);

  // Consolidated Editor Wage Balances
  const editorBalances = useMemo(() => {
    return editors.map(editor => {
      const editorProjects = projects.filter(p => p.assignedEditorId === editor.id);
      const totalBudget = editorProjects.reduce((sum, p) => sum + (p.editorPayment || 0), 0);
      
      const paidLedger = payments
        .filter(pay => pay.entityId === editor.id && pay.entityType === 'editor')
        .reduce((sum, pay) => sum + pay.amount, 0);

      const pendingAmount = Math.max(0, totalBudget - paidLedger);

      return {
        editor,
        projectCount: editorProjects.length,
        totalBudget,
        paidAmount: paidLedger,
        pendingAmount,
        phone: editor.phone || '',
        projects: editorProjects
      };
    }).filter(item => item.pendingAmount > 0)
      .sort((a, b) => b.pendingAmount - a.pendingAmount);
  }, [editors, projects, payments]);

  // Filtered lists based on search and filters
  const filteredStudioBalances = useMemo(() => {
    return studioBalances.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.studio.name.toLowerCase().includes(q) || 
        (item.studio.ownerName && item.studio.ownerName.toLowerCase().includes(q)) ||
        item.projects.some(p => p.coupleName.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterMode === 'high_value') return item.pendingAmount >= 20000;
      if (filterMode === 'not_sent') return !reminderHistory[item.studio.id];
      return true;
    });
  }, [studioBalances, searchQuery, filterMode, reminderHistory]);

  const filteredEditorBalances = useMemo(() => {
    return editorBalances.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.editor.name.toLowerCase().includes(q) ||
        item.projects.some(p => p.coupleName.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      if (filterMode === 'high_value') return item.pendingAmount >= 10000;
      if (filterMode === 'not_sent') return !reminderHistory[item.editor.id];
      return true;
    });
  }, [editorBalances, searchQuery, filterMode, reminderHistory]);

  // Smart Tone Generator for Studio
  const generateStudioMessage = (item: typeof studioBalances[0], toneOverride?: ReminderTone) => {
    const tone = toneOverride || cardTones[item.studio.id] || globalTone;
    const studioProjects = projects.filter(p => p.studioId === item.studio.id && (p.remainingBalance || 0) > 0);
    const projectListText = studioProjects
      .map(p => `• *${p.coupleName}* (${p.eventType || 'Wedding'}): ₹${(p.remainingBalance || 0).toLocaleString('en-IN')}`)
      .join('\n');

    const totalStr = item.pendingAmount.toLocaleString('en-IN');
    const ownerGreeting = item.studio.ownerName ? `Dear ${item.studio.ownerName} Ji & Team` : `Dear ${item.studio.name} Team`;
    const cleanStudioCode = item.studio.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'STUD';
    const invoiceRef = `INV-5TH-${year}-${monthName.toUpperCase().slice(0, 3)}-${cleanStudioCode}`;
    const directUpiLink = `upi://pay?pa=${encodeURIComponent(upiIdConfig)}&pn=The%20Frame%20Cut%20Studio&am=${item.pendingAmount}&cu=INR&tn=Invoice_${cleanStudioCode}`;

    if (tone === 'polite') {
      return `✨ *THE FRAME CUT STUDIO — GENTLE BILLING NOTE* 🌸\n\n${ownerGreeting},\n\nHope wedding season is treating you wonderfully! 🎬\n\nThis is a friendly mid-cycle status regarding the accounts for *${item.studio.name}*.\n\n📌 *Pending Balance:* ₹${totalStr}\n📌 *Active Projects:* ${item.projectCount} Deliverables\n\n*Breakdown:*\n${projectListText || 'All Projects'}\n\n💳 *Direct UPI Payment:* \`${upiIdConfig}\`\n🔗 *Quick Pay Link:* ${directUpiLink}\n• Bank: HDFC Bank | A/C: 501002345678 | IFSC: HDFC0001234\n\nWhenever convenient, kindly process the clearance so our team continues editing smoothly. Thank you for your warm partnership! 🙏`;
    }

    if (tone === 'delivery') {
      return `🎬 *WEDDING DELIVERABLES READY — THE FRAME CUT STUDIO* 🚀\n\n${ownerGreeting},\n\nGreat news! Your cinematic wedding edits and 4K masters are actively being rendered and finalized in our post-production suite.\n\nTo release the final cloud download drives & unwatermarked master footage, please clear the remaining milestone dues:\n\n📌 *Net Payable Due:* *₹${totalStr}*\n📌 *Ready Projects:*\n${projectListText || 'Active Deliverables'}\n\n💳 *Instant Settlement UPI:* \`${upiIdConfig}\`\n🔗 *One-Click UPI:* ${directUpiLink}\n• Bank: HDFC Bank | A/C: 501002345678 | IFSC: HDFC0001234\n\nKindly share the payment screenshot so we can immediately share the master drive links. Thank you!`;
    }

    if (tone === 'urgent') {
      return `🚨 *URGENT SETTLEMENT NOTICE — THE FRAME CUT STUDIO* ⚠️\n\n${ownerGreeting},\n\nThis is an urgent follow-up regarding the overdue balance for *${item.studio.name}* under the 5th-monthly cycle.\n\n⚠️ *TOTAL OUTSTANDING DUE: ₹${totalStr}*\n⚠️ *INVOICE REF:* ${invoiceRef}\n\n*Pending Deliverables List:*\n${projectListText || 'Pending Projects'}\n\nTo prevent timeline holds or delivery pauses on upcoming wedding films, please settle this invoice today.\n\n💳 *UPI ID:* \`${upiIdConfig}\`\n🔗 *Instant Pay Link:* ${directUpiLink}\n• Bank: HDFC Bank | A/C: 501002345678 | IFSC: HDFC0001234\n\nPlease confirm with receipt screenshot once completed. Thank you.`;
    }

    // Default: Formal Tax Invoice
    return `*THE FRAME CUT STUDIO — OFFICIAL FINAL TAX INVOICE* 📄\n\n${ownerGreeting},\n\nAttached is your official Final Tax Invoice for the 5th-Monthly Billing cycle (${monthName} ${year}).\n\n📌 *Invoice Ref:* *${invoiceRef}*\n📌 *Net Total Payable:* *₹${totalStr}*\n📌 *Active Projects:* ${item.projectCount}\n\n*Itemized Project Breakdown:*\n${projectListText || 'All projects'}\n\n📎 *ATTACHED DOCUMENT:* Official Final Tax Invoice PDF\n\n💳 *BANK & UPI DETAILS FOR SETTLEMENT:*\n• A/C Holder: The Frame Cut Studio\n• Bank: HDFC Bank | A/C: 501002345678 | IFSC: HDFC0001234\n• UPI ID: \`${upiIdConfig}\`\n🔗 *Click to Pay UPI:* ${directUpiLink}\n\nKindly review the attached invoice and initiate payment. Thank you for your continued trust in The Frame Cut Studio!`;
  };

  // Smart Tone Generator for Editor
  const generateEditorMessage = (item: typeof editorBalances[0]) => {
    const editorProjects = projects.filter(p => p.assignedEditorId === item.editor.id);
    const projectListText = editorProjects
      .map(p => `• *${p.coupleName}* (${p.eventType || 'Wedding'}): ₹${(p.editorPayment || 0).toLocaleString('en-IN')}`)
      .join('\n');

    const totalStr = item.pendingAmount.toLocaleString('en-IN');

    return `*THE FRAME CUT STUDIO — EDITOR PAYOUT STATEMENT* 🎞️\n\nHi ${item.editor.name},\n\nHere is your monthly payout status update for the 5th of ${monthName} billing cycle.\n\n📌 *Outstanding Wage Dues:* *₹${totalStr}*\n📌 *Assigned Deliverables:* ${item.projectCount} project(s)\n\n*Deliverables Breakdown:*\n${projectListText || 'Assigned deliverables'}\n\nOur accounts department is clearing dues. If you have any questions or account changes, please ping us back. Thank you for your dedicated editing craft! 🌟`;
  };

  // Dispatch WhatsApp link open
  const handleOpenWhatsApp = (phone: string, text: string, id: string, useWebApp = false) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const encoded = encodeURIComponent(text);
    
    let link = '';
    if (useWebApp) {
      link = cleanPhone 
        ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}` 
        : `https://web.whatsapp.com/send?text=${encoded}`;
    } else {
      link = cleanPhone 
        ? `https://wa.me/${cleanPhone}?text=${encoded}` 
        : `https://api.whatsapp.com/send?text=${encoded}`;
    }
    
    window.open(link, '_blank');
    markAsSent(id);
  };

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const generateStatementPDF = (
    clientName: string,
    phone: string,
    pendingAmount: number,
    projectItems: { coupleName: string; eventType: string; amount: number }[],
    type: 'studio' | 'editor'
  ) => {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const isStudio = type === 'studio';
    const cleanClientCode = clientName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'STUDIO';
    const invoiceNoStr = `INV-5TH-${new Date().getFullYear()}-${monthName.toUpperCase().slice(0, 3)}-${cleanClientCode}`;

    // Modern Dark Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 42, 'F');
    
    // Brand Name & Subtitle
    doc.setTextColor(245, 158, 11); // Amber-500
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('THE FRAME CUT STUDIO', 14, 16);
    
    doc.setTextColor(226, 232, 240); // Slate-200
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.text('CINEMATIC WEDDING SUITE & POST PRODUCTION MANAGEMENT', 14, 22);
    doc.text('Email: contact@theframecuts.com | Phone: +91 77729 99933', 14, 27);
    doc.text(`Monthly Billing Cycle: 5th ${monthName} Automated Settlement`, 14, 32);

    // Official Badge Pill Right
    doc.setFillColor(245, 158, 11); // Amber
    doc.roundedRect(125, 8, 72, 26, 3, 3, 'F');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.text(isStudio ? 'OFFICIAL FINAL TAX INVOICE' : 'EDITOR PAYOUT STATEMENT', 161, 15, { align: 'center' });

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`Ref #: ${invoiceNoStr}`, 161, 21, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, 161, 26, { align: 'center' });
    doc.text(`Cycle: 5th ${monthName} ${year}`, 161, 30, { align: 'center' });
    
    let y = 48;

    // Client/Billed To Box & Issuer Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, y, 88, 28, 2, 2, 'FD');
    doc.roundedRect(108, y, 88, 28, 2, 2, 'FD');

    // Left - Bill To
    doc.setTextColor(217, 119, 6);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(isStudio ? 'FINAL TAX INVOICE TO:' : 'PAYOUT RECIPIENT:', 18, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, 18, y + 12);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Contact Phone: ${phone || 'N/A'}`, 18, y + 18);
    doc.text(`Billing Status: 5th Monthly Cycle Clearance`, 18, y + 23);

    // Right - Issued By
    doc.setTextColor(4, 120, 87);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ISSUED BY & ACCOUNTS:', 112, y + 6);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('The Frame Cut Studio', 112, y + 12);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Accounts & Billing Department', 112, y + 18);
    doc.text('GST / Tax Compliant Studio Invoice', 112, y + 23);

    y += 34;
    
    // Table Header
    doc.setFillColor(15, 23, 42);
    doc.rect(14, y, 182, 8, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 18, y + 5.5);
    doc.text('Project / Film Couple Name', 28, y + 5.5);
    doc.text('Event Type / Service', 115, y + 5.5);
    doc.text('Net Balance Due (Rs.)', 190, y + 5.5, { align: 'right' });
    
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    
    projectItems.forEach((item, idx) => {
      if (idx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(14, y - 4, 182, 8, 'F');
      }
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`${idx + 1}`, 18, y + 1);
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(item.coupleName.substring(0, 38), 28, y + 1);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(item.eventType.substring(0, 22), 115, y + 1);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(217, 119, 6);
      doc.text(`Rs. ${item.amount.toLocaleString('en-IN')}`, 190, y + 1, { align: 'right' });
      y += 8;
    });

    y += 4;

    // Financial Summary & Bank Details Section
    if (isStudio) {
      // Left Bank Details
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(252, 211, 77);
      doc.roundedRect(14, y, 92, 40, 2, 2, 'FD');

      doc.setTextColor(120, 53, 15);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('BANK & UPI SETTLEMENT DETAILS:', 18, y + 6);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Account Holder: The Frame Cut Studio', 18, y + 12);
      doc.text('Bank Name: HDFC Bank', 18, y + 17);
      doc.text('A/C Number: 501002345678', 18, y + 22);
      doc.text('IFSC Code: HDFC0001234', 18, y + 27);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9);
      doc.text(`UPI ID: ${upiIdConfig}`, 18, y + 33);

      // Right Grand Total Pill
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(110, y, 86, 40, 2, 2, 'F');

      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Itemized Projects Count:', 116, y + 8);
      doc.text(`${projectItems.length} Project(s)`, 190, y + 8, { align: 'right' });

      doc.text('5th-Monthly Billing Cycle:', 116, y + 14);
      doc.text(`${monthName} ${year}`, 190, y + 14, { align: 'right' });

      // Highlighted Total Pill
      doc.setFillColor(245, 158, 11);
      doc.roundedRect(114, y + 20, 78, 14, 2, 2, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('FINAL NET PAYABLE DUE:', 118, y + 26);
      doc.setFontSize(11);
      doc.text(`Rs. ${pendingAmount.toLocaleString('en-IN')}`, 188, y + 31, { align: 'right' });

      y += 48;
    } else {
      // Editor Payout Summary
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(110, y, 86, 28, 2, 2, 'F');

      doc.setTextColor(226, 232, 240);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Total Editor Deliverables:', 116, y + 8);
      doc.text(`${projectItems.length} Project(s)`, 190, y + 8, { align: 'right' });

      doc.setFillColor(16, 185, 129);
      doc.roundedRect(114, y + 12, 78, 12, 2, 2, 'F');

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('NET EDITOR WAGE DUE:', 118, y + 20);
      doc.setFontSize(10.5);
      doc.text(`Rs. ${pendingAmount.toLocaleString('en-IN')}`, 188, y + 20, { align: 'right' });

      y += 36;
    }

    // Footer
    doc.setDrawColor(226, 232, 240);
    doc.line(14, y, 196, y);
    y += 6;

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Note: This document serves as the Official Final Tax Invoice for the 5th-monthly automated billing cycle.', 14, y);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Authorized Signatory — The Frame Cut Studio', 196, y, { align: 'right' });

    return doc;
  };

  const handleSendWhatsAppWithPDF = async (
    id: string,
    phone: string,
    text: string,
    clientName: string,
    pendingAmount: number,
    projectItems: { coupleName: string; eventType: string; amount: number }[],
    type: 'studio' | 'editor'
  ) => {
    setGeneratingPdfId(id);
    try {
      const cleanName = clientName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileName = type === 'studio' 
        ? `Final_Tax_Invoice_${cleanName}_${monthName}.pdf`
        : `Final_Payout_Invoice_${cleanName}_${monthName}.pdf`;

      const doc = generateStatementPDF(clientName, phone, pendingAmount, projectItems, type);
      
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      doc.save(fileName);

      const cleanPhone = phone.replace(/\D/g, '');

      // Try Native Web Share API (Mobile direct share with attachment)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: `Final Tax Invoice - ${clientName}`,
            text: text,
            files: [file]
          });
          markAsSent(id);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') return;
          console.warn('Native share fallback to browser link:', shareErr);
        }
      }

      // Desktop WhatsApp link fallback with notice
      const textWithNotice = text + `\n\n📎 *Official Final Tax Invoice PDF (${fileName}) saved in your downloads folder. Please attach it in this WhatsApp chat.*`;
      const encoded = encodeURIComponent(textWithNotice);
      const link = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
      
      window.open(link, '_blank');
      markAsSent(id);
    } catch (err) {
      console.error('Error generating PDF reminder:', err);
      handleOpenWhatsApp(phone, text, id);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  // Copy message to clipboard
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Toggle selection for batch dispatch
  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const ids = activeTab === 'studios' 
      ? filteredStudioBalances.map(x => x.studio.id) 
      : filteredEditorBalances.map(x => x.editor.id);
    setSelectedIds(ids);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Dispatch Selected Reminders sequentially
  const handleDispatchBatch = async () => {
    const targets = activeTab === 'studios' ? filteredStudioBalances : filteredEditorBalances;
    const selectedItems = targets.filter(item => {
      const id = activeTab === 'studios' ? (item as any).studio.id : (item as any).editor.id;
      return selectedIds.includes(id);
    });

    if (selectedItems.length === 0) return;

    setIsBatchSending(true);
    setBatchProgress({ current: 0, total: selectedItems.length });

    for (let i = 0; i < selectedItems.length; i++) {
      const item = selectedItems[i];
      const id = activeTab === 'studios' ? (item as any).studio.id : (item as any).editor.id;
      const phone = phoneOverrides[id] || item.phone;
      const text = activeTab === 'studios' 
        ? generateStudioMessage(item as any) 
        : generateEditorMessage(item as any);

      setBatchProgress({ current: i + 1, total: selectedItems.length });
      handleOpenWhatsApp(phone, text, id);

      // Wait 1.4s between opens so browsers don't block tabs
      if (i < selectedItems.length - 1) {
        await new Promise(r => setTimeout(r, 1400));
      }
    }

    setIsBatchSending(false);
  };

  const totalStudioPending = studioBalances.reduce((sum, item) => sum + item.pendingAmount, 0);
  const totalEditorPending = editorBalances.reduce((sum, item) => sum + item.pendingAmount, 0);

  // Selected totals for batch bar
  const selectedTotalAmount = useMemo(() => {
    if (activeTab === 'studios') {
      return studioBalances
        .filter(item => selectedIds.includes(item.studio.id))
        .reduce((sum, item) => sum + item.pendingAmount, 0);
    } else {
      return editorBalances
        .filter(item => selectedIds.includes(item.editor.id))
        .reduce((sum, item) => sum + item.pendingAmount, 0);
    }
  }, [activeTab, selectedIds, studioBalances, editorBalances]);

  return (
    <div id="whatsapp-reminders-section" className="glass-panel p-5 sm:p-7 rounded-3xl border border-gold-500/25 space-y-6 shadow-2xl relative overflow-hidden my-6">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-500/15 via-amber-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-gold-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* ================= 1. HEADER & 5TH CYCLE CONTROLS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950/40 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-display text-white tracking-tight">
                  Automated 5th-Monthly WhatsApp Billing Hub
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-gold-500/20 text-gold-300 border border-gold-500/40 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-gold-400" /> Pro Edition
                </span>
              </div>
              <p className="text-xs text-gray-300 font-mono mt-0.5">
                Har mahine ki 5 tarikh ko automatic studio dues & editor payout WhatsApp reminders, direct UPI payment links aur tax invoices bhejein.
              </p>
            </div>
          </div>
        </div>

        {/* 5th Cycle Status Badge & Auto-Alert Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className={`px-3.5 py-2 rounded-2xl border flex items-center gap-2 text-xs font-mono shadow-sm ${
            isFifthCycleActive 
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30 animate-pulse' 
              : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
          }`}>
            <Calendar className="w-4 h-4 text-gold-400 shrink-0" />
            <div>
              <span className="font-bold block uppercase text-[9px] tracking-wider text-gray-400">Monthly Cycle</span>
              <span className="font-bold">
                {isFifthCycleActive ? `5th ${monthName} Active` : `Next: ${nextFifthDate}`}
              </span>
            </div>
          </div>

          <button
            onClick={() => setAutoSchedulerEnabled(!autoSchedulerEnabled)}
            className={`px-3.5 py-2 rounded-2xl border text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              autoSchedulerEnabled 
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                : 'bg-charcoal-900 border-white/10 text-gray-400'
            }`}
            title="Toggle automatic 5th of month notification alerts"
          >
            <Zap className={`w-3.5 h-3.5 ${autoSchedulerEnabled ? 'text-emerald-400 animate-pulse' : 'text-gray-500'}`} />
            <span>Auto Alert: {autoSchedulerEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* ================= 2. SMART TONE / STYLE SELECTOR BAR ================= */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-gold-400 shrink-0" />
          <span className="text-xs font-bold text-gray-200 font-mono">Reminder Tone (आवाज़ / अंदाज़):</span>
        </div>

        {/* 4 Tone Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setGlobalTone('statement')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              globalTone === 'statement'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/30'
                : 'bg-charcoal-900 text-gray-400 border border-white/5 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>📄 Official Tax Invoice</span>
          </button>

          <button
            onClick={() => setGlobalTone('polite')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              globalTone === 'polite'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/40 ring-1 ring-emerald-500/30'
                : 'bg-charcoal-900 text-gray-400 border border-white/5 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>🌸 Gentle & Polite (विनम्र)</span>
          </button>

          <button
            onClick={() => setGlobalTone('delivery')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              globalTone === 'delivery'
                ? 'bg-blue-500/25 text-blue-300 border border-blue-500/50 shadow-md shadow-blue-950/40 ring-1 ring-blue-500/30'
                : 'bg-charcoal-900 text-gray-400 border border-white/5 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>🎬 Deliverables Ready</span>
          </button>

          <button
            onClick={() => setGlobalTone('urgent')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              globalTone === 'urgent'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-md shadow-rose-950/40 ring-1 ring-rose-500/30'
                : 'bg-charcoal-900 text-gray-400 border border-white/5 hover:text-white'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>🚨 Urgent / Final Notice</span>
          </button>
        </div>
      </div>

      {/* ================= 3. TABS, SEARCH & ACTION CONTROLS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Entity Switcher Tabs */}
        <div className="flex items-center gap-2 p-1.5 bg-charcoal-950/80 rounded-2xl border border-white/10 shrink-0">
          <button
            onClick={() => { setActiveTab('studios'); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'studios'
                ? 'bg-gold-500/20 border border-gold-500/40 text-gold-300 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 text-gold-400" />
            <span>Studio Unpaid Dues ({studioBalances.length})</span>
            {totalStudioPending > 0 && (
              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                ₹{totalStudioPending.toLocaleString('en-IN')}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('editors'); setSelectedIds([]); }}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'editors'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4 text-emerald-400" />
            <span>Editor Wage Balances ({editorBalances.length})</span>
            {totalEditorPending > 0 && (
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                ₹{totalEditorPending.toLocaleString('en-IN')}
              </span>
            )}
          </button>
        </div>

        {/* Search bar & Filter Chips */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 justify-end min-w-0">
          <div className="relative min-w-[180px] sm:min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'studios' ? 'studio or film' : 'editor'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-charcoal-900 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:border-gold-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all ${
                filterMode === 'all' 
                  ? 'bg-white/10 border-white/20 text-white' 
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterMode('high_value')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all ${
                filterMode === 'high_value' 
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200'
              }`}
            >
              High Value
            </button>
            <button
              onClick={() => setFilterMode('not_sent')}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold border transition-all ${
                filterMode === 'not_sent' 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                  : 'bg-black/30 border-white/5 text-gray-400 hover:text-gray-200'
              }`}
            >
              Not Sent
            </button>
          </div>

          {/* Quick UPI ID Config Trigger */}
          <button
            onClick={() => {
              const newUpi = window.prompt("Enter Studio Payment UPI ID:", upiIdConfig);
              if (newUpi && newUpi.trim()) {
                setUpiIdConfig(newUpi.trim());
                localStorage.setItem('tfc_upi_id', newUpi.trim());
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-charcoal-900 border border-white/10 text-gray-300 hover:text-gold-300 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Configure Studio Default UPI ID for Instant WhatsApp Payment Links"
          >
            <QrCode className="w-3.5 h-3.5 text-gold-400" />
            <span className="hidden sm:inline">UPI:</span>
            <span className="truncate max-w-[110px]">{upiIdConfig}</span>
          </button>
        </div>
      </div>

      {/* ================= 4. BATCH SELECTION ACTION BAR ================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-charcoal-950/90 rounded-2xl border border-white/10 text-xs font-mono">
        <div className="flex items-center gap-3">
          <button
            onClick={selectedIds.length > 0 ? clearSelection : selectAllFiltered}
            className="flex items-center gap-2 text-gray-300 hover:text-white font-bold cursor-pointer"
          >
            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
              selectedIds.length > 0 ? 'bg-gold-500 border-gold-400 text-charcoal-950' : 'border-white/30 bg-black/40'
            }`}>
              {selectedIds.length > 0 && <Check className="w-3 h-3 stroke-[3]" />}
            </div>
            <span>{selectedIds.length > 0 ? `Selected (${selectedIds.length})` : 'Select All'}</span>
          </button>

          {selectedIds.length > 0 && (
            <span className="text-amber-400 font-bold hidden sm:inline">
              • Total Selected: ₹{selectedTotalAmount.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              disabled={isBatchSending}
              onClick={handleDispatchBatch}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {isBatchSending 
                  ? `Sending (${batchProgress.current}/${batchProgress.total})...` 
                  : `Send Reminders to Selected (${selectedIds.length})`}
              </span>
            </button>
          )}

          <button
            onClick={() => {
              const currentList = activeTab === 'studios' ? filteredStudioBalances : filteredEditorBalances;
              currentList.forEach((item, idx) => {
                const id = activeTab === 'studios' ? (item as any).studio.id : (item as any).editor.id;
                const text = activeTab === 'studios' ? generateStudioMessage(item as any) : generateEditorMessage(item as any);
                setTimeout(() => handleOpenWhatsApp(item.phone, text, id), idx * 1200);
              });
            }}
            className="px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-gold-400" />
            <span>Send All Filtered</span>
          </button>
        </div>
      </div>

      {/* ================= 5. MAIN LIST OF CARDS ================= */}
      <div className="space-y-4">
        {activeTab === 'studios' ? (
          filteredStudioBalances.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredStudioBalances.map((item) => {
                const itemTone = cardTones[item.studio.id] || globalTone;
                const messageText = generateStudioMessage(item, itemTone);
                const history = reminderHistory[item.studio.id];
                const effectivePhone = phoneOverrides[item.studio.id] || item.phone;
                const isSelected = selectedIds.includes(item.studio.id);

                const studioProjectItems = item.projects
                  .filter(p => (p.remainingBalance || 0) > 0)
                  .map(p => ({ coupleName: p.coupleName, eventType: p.eventType || 'Wedding', amount: p.remainingBalance || 0 }));

                const upiPayUrl = `upi://pay?pa=${encodeURIComponent(upiIdConfig)}&pn=The%20Frame%20Cut%20Studio&am=${item.pendingAmount}&cu=INR&tn=Invoice_${item.studio.name.replace(/\s+/g, '_')}`;

                return (
                  <div 
                    key={item.studio.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3.5 group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-charcoal-950 border-gold-500/70 shadow-lg shadow-gold-950/40 ring-1 ring-gold-500/30' 
                        : 'bg-charcoal-950/70 border-white/10 hover:border-emerald-500/40'
                    }`}
                  >
                    {/* Top status & Select Row */}
                    <div>
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          {/* Selection Checkbox */}
                          <button
                            onClick={() => toggleSelect(item.studio.id)}
                            className="mt-1 cursor-pointer shrink-0"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-gold-500 border-gold-400 text-charcoal-950' : 'border-white/30 bg-black/40'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <h4 className="text-base font-bold text-white font-display truncate">
                                {item.studio.name}
                              </h4>
                              {history && (
                                <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Sent #{history.count} ({history.lastSentAt})</span>
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-3 flex-wrap">
                              <span>Owner: <strong className="text-gray-200">{item.studio.ownerName || 'Partner'}</strong></span>
                              
                              {editingPhoneId === item.studio.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Phone with country code"
                                    value={tempPhoneInput}
                                    onChange={(e) => setTempPhoneInput(e.target.value)}
                                    className="px-2 py-0.5 text-xs bg-charcoal-900 border border-emerald-500/50 rounded-lg text-white focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleSavePhone(item.studio.id)}
                                    className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded-md text-[10px]"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  onClick={() => { setEditingPhoneId(item.studio.id); setTempPhoneInput(effectivePhone); }}
                                  className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                                  title="Click to edit WhatsApp phone number"
                                >
                                  <Phone className="w-3 h-3" /> {effectivePhone || 'Add Phone +'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Amount Pill */}
                        <div className="text-right shrink-0">
                          <span className="text-lg sm:text-xl font-extrabold font-mono text-amber-400 block">
                            ₹{item.pendingAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {item.projectCount} Pending Project(s)
                          </span>
                        </div>
                      </div>

                      {/* Tone Preset Switcher for this specific card */}
                      <div className="mt-3 flex items-center justify-between gap-2 pt-2.5 border-t border-white/5 text-[11px] font-mono">
                        <span className="text-gray-400 text-[10px] uppercase tracking-wider">Style:</span>
                        <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar">
                          {(['statement', 'polite', 'delivery', 'urgent'] as ReminderTone[]).map((toneKey) => (
                            <button
                              key={toneKey}
                              onClick={() => setCardTones(prev => ({ ...prev, [item.studio.id]: toneKey }))}
                              className={`px-2 py-0.5 rounded-lg text-[10px] capitalize transition-all cursor-pointer ${
                                itemTone === toneKey 
                                  ? 'bg-gold-500/20 text-gold-300 border border-gold-500/40 font-bold' 
                                  : 'text-gray-500 hover:text-gray-300'
                              }`}
                            >
                              {toneKey}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Message Preview Box */}
                      <div className="mt-2.5 p-3 bg-black/60 rounded-2xl border border-white/5 text-xs font-mono text-gray-300 max-h-24 overflow-y-auto whitespace-pre-line break-words leading-relaxed select-text">
                        {messageText}
                      </div>
                    </div>

                    {/* Action buttons desk */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
                      {/* Left: UPI QR Quick Trigger & Preview */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setUpiQrModalData({
                            name: item.studio.name,
                            amount: item.pendingAmount,
                            upiId: upiIdConfig,
                            link: upiPayUrl
                          })}
                          className="px-2.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gold-400 border border-gold-500/30 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Instant UPI Payment QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>UPI QR</span>
                        </button>

                        <button
                          onClick={() => setPreviewModalData({
                            id: item.studio.id,
                            name: item.studio.name,
                            phone: effectivePhone,
                            amount: item.pendingAmount,
                            text: messageText,
                            type: 'studio',
                            projectItems: studioProjectItems
                          })}
                          className="px-2.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gray-300 hover:text-white border border-white/10 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Preview WhatsApp Chat Bubble"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          <span>Preview</span>
                        </button>
                      </div>

                      {/* Right: Copy, WhatsApp 1-Click, and PDF Dispatch */}
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={() => handleCopyText(messageText, item.studio.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gray-300 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/10"
                          title="Copy formatted WhatsApp text"
                        >
                          {copiedId === item.studio.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === item.studio.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsApp(effectivePhone, messageText, item.studio.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs font-mono flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer"
                          title="Open in WhatsApp directly"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>1-Click Text</span>
                        </button>

                        <button
                          disabled={generatingPdfId === item.studio.id}
                          onClick={() => handleSendWhatsAppWithPDF(
                            item.studio.id,
                            effectivePhone,
                            messageText,
                            item.studio.name,
                            item.pendingAmount,
                            studioProjectItems,
                            'studio'
                          )}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                          title="Generate Official Final Tax Invoice PDF & Open WhatsApp"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{generatingPdfId === item.studio.id ? 'Invoice Readying...' : 'Invoice PDF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-charcoal-950/40 rounded-3xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-white font-display">Sabhi Studios Ka Balance Clear Hai!</h4>
              <p className="text-xs text-gray-400 font-mono">5th of the month cycle - Koi unpaid studio dues pending nahi hain.</p>
            </div>
          )
        ) : (
          filteredEditorBalances.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredEditorBalances.map((item) => {
                const messageText = generateEditorMessage(item);
                const history = reminderHistory[item.editor.id];
                const effectivePhone = phoneOverrides[item.editor.id] || item.phone;
                const isSelected = selectedIds.includes(item.editor.id);

                const editorProjectItems = item.projects.map(p => ({
                  coupleName: p.coupleName,
                  eventType: p.eventType || 'Wedding',
                  amount: p.editorPayment || 0
                }));

                return (
                  <div 
                    key={item.editor.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-3.5 group relative overflow-hidden ${
                      isSelected 
                        ? 'bg-charcoal-950 border-emerald-500/70 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/30' 
                        : 'bg-charcoal-950/70 border-white/10 hover:border-emerald-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 min-w-0">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <button
                            onClick={() => toggleSelect(item.editor.id)}
                            className="mt-1 cursor-pointer shrink-0"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-emerald-500 border-emerald-400 text-charcoal-950' : 'border-white/30 bg-black/40'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap min-w-0">
                              <h4 className="text-base font-bold text-white font-display truncate">
                                {item.editor.name}
                              </h4>
                              {history && (
                                <span className="text-[10px] font-mono text-emerald-300 flex items-center gap-1 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                                  <span>Sent #{history.count} ({history.lastSentAt})</span>
                                </span>
                              )}
                            </div>

                            <div className="text-xs text-gray-400 font-mono mt-1 flex items-center gap-3 flex-wrap">
                              <span>Role: <strong className="text-gray-200">Senior Wedding Editor</strong></span>
                              {editingPhoneId === item.editor.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    placeholder="Phone with country code"
                                    value={tempPhoneInput}
                                    onChange={(e) => setTempPhoneInput(e.target.value)}
                                    className="px-2 py-0.5 text-xs bg-charcoal-900 border border-emerald-500/50 rounded-lg text-white focus:outline-none"
                                  />
                                  <button
                                    onClick={() => handleSavePhone(item.editor.id)}
                                    className="px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded-md text-[10px]"
                                  >
                                    Save
                                  </button>
                                </div>
                              ) : (
                                <span 
                                  onClick={() => { setEditingPhoneId(item.editor.id); setTempPhoneInput(effectivePhone); }}
                                  className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                                  title="Click to edit WhatsApp phone number"
                                >
                                  <Phone className="w-3 h-3" /> {effectivePhone || 'Add Phone +'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-lg sm:text-xl font-extrabold font-mono text-emerald-400 block">
                            ₹{item.pendingAmount.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {item.projectCount} Assigned Project(s)
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 p-3 bg-black/60 rounded-2xl border border-white/5 text-xs font-mono text-gray-300 max-h-24 overflow-y-auto whitespace-pre-line break-words leading-relaxed select-text">
                        {messageText}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5">
                      <button
                        onClick={() => setPreviewModalData({
                          id: item.editor.id,
                          name: item.editor.name,
                          phone: effectivePhone,
                          amount: item.pendingAmount,
                          text: messageText,
                          type: 'editor',
                          projectItems: editorProjectItems
                        })}
                        className="px-2.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gray-300 hover:text-white border border-white/10 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Preview WhatsApp Chat Bubble"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Preview</span>
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={() => handleCopyText(messageText, item.editor.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gray-300 text-xs font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer border border-white/10"
                          title="Copy formatted WhatsApp text"
                        >
                          {copiedId === item.editor.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedId === item.editor.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenWhatsApp(effectivePhone, messageText, item.editor.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-bold text-xs font-mono flex items-center gap-1.5 border border-emerald-500/40 transition-all cursor-pointer"
                          title="Send pre-filled WhatsApp text"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                          <span>1-Click Text</span>
                        </button>

                        <button
                          disabled={generatingPdfId === item.editor.id}
                          onClick={() => handleSendWhatsAppWithPDF(
                            item.editor.id,
                            effectivePhone,
                            messageText,
                            item.editor.name,
                            item.pendingAmount,
                            editorProjectItems,
                            'editor'
                          )}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                          title="Generate Statement PDF & Share via WhatsApp"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{generatingPdfId === item.editor.id ? 'PDF Readying...' : 'Payout PDF'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-charcoal-950/40 rounded-3xl border border-white/5 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
              <h4 className="text-base font-bold text-white font-display">Sabhi Editors Ka Payment Completed Hai!</h4>
              <p className="text-xs text-gray-400 font-mono">5th of the month cycle - No outstanding editor wage balances found.</p>
            </div>
          )
        )}
      </div>

      {/* ================= MODAL 1: LIVE WHATSAPP PHONE CHAT PREVIEW ================= */}
      <AnimatePresence>
        {previewModalData && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setPreviewModalData(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative z-10 w-full max-w-lg bg-[#0b141a] rounded-3xl border border-emerald-500/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* WhatsApp Phone Header Bar */}
              <div className="bg-[#202c33] px-4 py-3 flex items-center justify-between text-white border-b border-[#2a3942]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white shadow">
                    {previewModalData.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-100">{previewModalData.name}</h3>
                    <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> online • The Frame Cut Studio
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-gold-400 bg-black/40 px-2.5 py-1 rounded-xl border border-gold-500/20">
                    ₹{previewModalData.amount.toLocaleString('en-IN')}
                  </span>
                  <button 
                    onClick={() => setPreviewModalData(null)}
                    className="p-1 rounded-xl text-gray-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Canvas with WhatsApp Wallpaper feel */}
              <div className="p-4 overflow-y-auto space-y-3 flex-1 bg-[#0b141a] bg-opacity-95">
                <div className="text-center my-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-[#182229] text-gray-400 border border-white/5">
                    Today • 5th-Monthly Billing Cycle
                  </span>
                </div>

                {/* Outgoing WhatsApp Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[88%] bg-[#005c4b] text-gray-100 rounded-2xl rounded-tr-xs p-3.5 shadow-lg space-y-2 border border-[#00755f]/40 relative">
                    <div className="text-xs font-mono whitespace-pre-line break-words leading-relaxed select-text">
                      {previewModalData.text}
                    </div>

                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-200/70 pt-1">
                      <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="p-4 bg-[#202c33] border-t border-[#2a3942] flex flex-wrap items-center justify-between gap-2.5">
                <button
                  onClick={() => handleCopyText(previewModalData.text, 'modal')}
                  className="px-3 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gray-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors border border-white/10"
                >
                  {copiedId === 'modal' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'modal' ? 'Copied' : 'Copy Message'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleOpenWhatsApp(previewModalData.phone, previewModalData.text, previewModalData.id, true);
                      setPreviewModalData(null);
                    }}
                    className="px-3 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gray-200 text-xs font-mono font-bold flex items-center gap-1.5 border border-white/10"
                    title="Open in WhatsApp Web browser"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
                    <span>WhatsApp Web</span>
                  </button>

                  <button
                    onClick={() => {
                      handleOpenWhatsApp(previewModalData.phone, previewModalData.text, previewModalData.id, false);
                      setPreviewModalData(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1.5 shadow-lg"
                    title="Open in WhatsApp Desktop or Mobile"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL 2: INSTANT UPI QR CODE SCANNER ================= */}
      <AnimatePresence>
        {upiQrModalData && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setUpiQrModalData(null)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              className="relative z-10 w-full max-w-sm bg-charcoal-950 rounded-3xl border border-gold-500/40 p-6 shadow-2xl space-y-4 text-center"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-gold-400" />
                  <h3 className="text-sm font-bold font-display text-white">Instant UPI Settlement QR</h3>
                </div>
                <button 
                  onClick={() => setUpiQrModalData(null)}
                  className="p-1 rounded-xl text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-mono">Invoice Recipient:</span>
                <h4 className="text-base font-bold text-white font-display">{upiQrModalData.name}</h4>
                <div className="text-2xl font-extrabold font-mono text-amber-400">
                  ₹{upiQrModalData.amount.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Scannable Real UPI QR Code */}
              <div className="p-4 bg-white rounded-2xl inline-block shadow-xl border-4 border-amber-400/80 mx-auto">
                <QRCodeSVG
                  value={upiQrModalData.link}
                  size={190}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2.5 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2">
                  <span className="text-gray-400">UPI ID:</span>
                  <span className="font-bold text-gold-300 select-all">{upiQrModalData.upiId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(upiQrModalData.upiId);
                      setCopiedId('qr_upi');
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                    className="p-1 text-gray-300 hover:text-white"
                    title="Copy UPI ID"
                  >
                    {copiedId === 'qr_upi' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-[10px] text-gray-400">
                  Scan using Google Pay, PhonePe, Paytm or BHIM UPI app. Amount & note pre-filled!
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setUpiQrModalData(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-gold-500 to-amber-400 hover:from-gold-400 hover:to-amber-300 text-charcoal-950 font-bold rounded-xl text-xs font-mono shadow-lg cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
