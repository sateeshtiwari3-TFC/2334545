import React, { useRef, useState, useMemo } from 'react';
import { 
  Printer, 
  Download, 
  Copy, 
  Check, 
  X, 
  IndianRupee, 
  Building2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  Sparkles,
  QrCode,
  FileCheck,
  ShieldCheck,
  Film,
  Moon,
  Sun,
  Plus,
  Trash2,
  Edit3,
  Send,
  Mail,
  Wallet,
  CreditCard,
  Building,
  Smartphone,
  Banknote
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Project, Studio, Editor } from '../types';
import { captureElementToCanvas } from '../utils/pdfExport';

interface QuickPrintInvoiceModalProps {
  project: Project | null;
  studio?: Studio;
  editor?: Editor;
  isOpen: boolean;
  onClose: () => void;
}

interface InvoiceItem {
  id: string;
  qty: number;
  description: string;
  price: number;
}

interface AdvancePaymentRecord {
  id: string;
  paidBy: string;
  amount: number;
  paymentMode: string;
  date: string;
  referenceNo?: string;
  notes?: string;
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

export const QuickPrintInvoiceModal: React.FC<QuickPrintInvoiceModalProps> = ({
  project,
  studio,
  editor,
  isOpen,
  onClose
}) => {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Template Theme: 'dark_minimal' (matches uploaded reference) vs 'classic_light'
  const [templateTheme, setTemplateTheme] = useState<'dark_minimal' | 'classic_light'>('dark_minimal');
  
  // Custom configurable options
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [termsBadgeText, setTermsBadgeText] = useState<string>('Free purchases without receipts');
  const [showEditItems, setShowEditItems] = useState(false);

  // New Advance item inputs for quick add inside drawer
  const [newAdvPaidBy, setNewAdvPaidBy] = useState('');
  const [newAdvAmount, setNewAdvAmount] = useState<number | ''>('');
  const [newAdvMode, setNewAdvMode] = useState<string>('UPI');
  const [newAdvDate, setNewAdvDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newAdvRef, setNewAdvRef] = useState<string>('');

  if (!isOpen || !project) return null;

  const totalAmount = project.projectAmount || 0;
  const initialAdvancePaid = project.advancePayment || 0;

  // Derive initial deliverable rows based on project
  const initialItems: InvoiceItem[] = useMemo(() => {
    const functions = (project.eventType || 'Wedding Film')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (functions.length > 1) {
      const share = Math.round(totalAmount / functions.length);
      return functions.map((fn, idx) => ({
        id: `item-${idx}`,
        qty: 1,
        description: `${fn} Post-Production & Color Grading`,
        price: idx === functions.length - 1 ? (totalAmount - share * (functions.length - 1)) : share
      }));
    }

    return [
      {
        id: 'item-1',
        qty: 1,
        description: `${project.eventType || 'Wedding Film'} Cinematic Story Edit & Color Grade`,
        price: Math.round(totalAmount * 0.6) || totalAmount
      },
      {
        id: 'item-2',
        qty: 1,
        description: 'Multi-Cam Synchronization & 4K Audio Mastering',
        price: Math.round(totalAmount * 0.25)
      },
      {
        id: 'item-3',
        qty: 1,
        description: 'Teaser / Instagram Reels Social Media Pack',
        price: Math.max(0, totalAmount - (Math.round(totalAmount * 0.6) + Math.round(totalAmount * 0.25)))
      }
    ].filter(item => item.price > 0);
  }, [project, totalAmount]);

  const [items, setItems] = useState<InvoiceItem[]>(initialItems);

  // Advance Payments records list
  const [advances, setAdvances] = useState<AdvancePaymentRecord[]>(() => {
    if (initialAdvancePaid > 0) {
      return [{
        id: 'adv-init',
        paidBy: project.coupleName || project.studioName || 'Client',
        amount: initialAdvancePaid,
        paymentMode: 'UPI',
        date: project.receivedDate || new Date().toISOString().split('T')[0],
        referenceNo: 'Initial Booking Advance'
      }];
    }
    return [];
  });

  const subTotal = items.reduce((acc, it) => acc + (it.qty * it.price), 0);
  const taxAmount = taxPercent > 0 ? Math.round((subTotal * taxPercent) / 100) : 0;
  const grandTotal = subTotal + taxAmount;

  const advancePaid = advances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const balanceDue = Math.max(0, grandTotal - advancePaid);
  const isPaidInFull = balanceDue <= 0 && grandTotal > 0;
  const isPartiallyPaid = advancePaid > 0 && balanceDue > 0;

  // Advance Payment Mode Breakdown
  const modeBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; total: number }> = {};
    advances.forEach(a => {
      const amt = Number(a.amount) || 0;
      if (amt > 0) {
        const mode = a.paymentMode || 'UPI';
        if (!breakdown[mode]) {
          breakdown[mode] = { count: 0, total: 0 };
        }
        breakdown[mode].count += 1;
        breakdown[mode].total += amt;
      }
    });
    return breakdown;
  }, [advances]);

  const getModeIcon = (mode: string) => {
    const m = (mode || '').toLowerCase();
    if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm')) {
      return <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />;
    }
    if (m.includes('bank') || m.includes('neft') || m.includes('imps') || m.includes('rtgs')) {
      return <Building className="w-3 h-3 text-sky-400 shrink-0" />;
    }
    if (m.includes('cash')) {
      return <Banknote className="w-3 h-3 text-amber-400 shrink-0" />;
    }
    if (m.includes('card')) {
      return <CreditCard className="w-3 h-3 text-purple-400 shrink-0" />;
    }
    return <Wallet className="w-3 h-3 text-teal-400 shrink-0" />;
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', { 
        weekday: 'long', 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  const invoiceNo = `INV-${project.id.toUpperCase()}`;
  const currentDateFormatted = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const currentTimeFormatted = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const quickQrCodeUrl = useMemo(() => {
    try {
      const custom = localStorage.getItem('tfc_invoice_custom_qr');
      if (custom) return custom;
    } catch {
      // ignore
    }
    const cleanUpi = 'theframecutstudio@okhdfcbank';
    const cleanPayee = encodeURIComponent('The Frame Cut Studio');
    const cleanNote = encodeURIComponent(`Invoice-${project.coupleName || project.projectName || 'Studio'}`);
    const amtParam = balanceDue > 0 ? `&am=${balanceDue}` : '';
    const upiUri = `upi://pay?pa=${cleanUpi}&pn=${cleanPayee}${amtParam}&tn=${cleanNote}&cu=INR`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(upiUri)}`;
  }, [balanceDue, project.coupleName, project.projectName]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!invoiceRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await captureElementToCanvas(invoiceRef.current, {
        scale: 2,
        backgroundColor: templateTheme === 'dark_minimal' ? '#131417' : '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const cleanName = (project.coupleName || project.projectName || 'Project').replace(/[^a-zA-Z0-9]/g, '_');
      pdf.save(`Invoice_${templateTheme}_${cleanName}_${project.id}.pdf`);
    } catch (err) {
      console.error('Failed to export Invoice PDF:', err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const buildClientSummaryText = () => {
    const deliverablesList = items.map(m => `• ${m.qty}x ${m.description} - ₹${(m.qty * m.price).toLocaleString('en-IN')}`).join('\n');

    let advBreakdownText = '';
    if (advances.length > 0) {
      advBreakdownText = `\n📥 *ADVANCE PAYMENTS RECEIVED (₹${advancePaid.toLocaleString('en-IN')}):*\n` +
        advances.map((a, i) => `  ${i + 1}. ₹${Number(a.amount).toLocaleString('en-IN')} via *${a.paymentMode}* (Received from: _${a.paidBy}_ on ${a.date}${a.referenceNo ? ' | Ref: ' + a.referenceNo : ''})`).join('\n') + '\n';
      
      if (Object.keys(modeBreakdown).length > 0) {
        advBreakdownText += `  *Mode Breakdown:* ` + (Object.entries(modeBreakdown) as [string, { count: number; total: number }][]).map(([m, d]) => `${m}: ₹${d.total.toLocaleString('en-IN')}`).join(' | ') + '\n';
      }
    }

    return `✨ *THE FRAME CUT STUDIO - FINAL INVOICE & SETTLEMENT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 *Invoice No:* ${invoiceNo}
📅 *Date:* ${currentDateFormatted} ${currentTimeFormatted}

👤 *Client:* ${project.coupleName || 'Valued Client'}
🏢 *Studio:* ${project.studioName || 'Direct Client'}
🎬 *Event / Project:* ${project.eventType}

💰 *PRICE & SERVICES BREAKDOWN:*
${deliverablesList}

• Sub Total: ₹${subTotal.toLocaleString('en-IN')}
${taxPercent > 0 ? `• Tax (${taxPercent}%): +₹${taxAmount.toLocaleString('en-IN')}\n` : ''}• Grand Total: ₹${grandTotal.toLocaleString('en-IN')}
${advBreakdownText}
• *FINAL BALANCE PAYABLE: ₹${balanceDue.toLocaleString('en-IN')}*

🏦 *PAYMENT METHOD & REMITTANCE:*
• UPI ID: theframecutstudio@okhdfcbank
• Bank: HDFC Bank Ltd.
• A/C No: 50200088912450
• IFSC Code: HDFC0001234
• Account Name: The Frame Cut Studio

*Terms:* ${termsBadgeText}
Thank you for choosing The Frame Cut Studio! 🙏`;
  };

  const handleCopyTextSummary = () => {
    const text = buildClientSummaryText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsAppSend = () => {
    const text = buildClientSummaryText();
    let phone = (studio?.phone || '').replace(/\D/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }
    const encoded = encodeURIComponent(text);
    const link = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(link, '_blank');
  };

  const handleEmailSend = () => {
    const clientName = project.coupleName || project.studioName || 'Valued Client';
    const subject = `Invoice ${invoiceNo} - ${clientName} | The Frame Cut Studio`;
    const body = buildClientSummaryText();
    const email = studio?.email || '';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: `item-${Date.now()}`,
      qty: 1,
      description: 'Additional Cinematic Service',
      price: 5000
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(it => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(prev => prev.map(it => it.id === id ? { ...it, [field]: value } : it));
  };

  const handleAddAdvanceRecord = () => {
    if (!newAdvAmount || Number(newAdvAmount) <= 0) return;
    const newRecord: AdvancePaymentRecord = {
      id: `adv-${Date.now()}`,
      paidBy: newAdvPaidBy || project.coupleName || project.studioName || 'Client',
      amount: Number(newAdvAmount),
      paymentMode: newAdvMode || 'UPI',
      date: newAdvDate || new Date().toISOString().split('T')[0],
      referenceNo: newAdvRef || undefined
    };
    setAdvances(prev => [...prev, newRecord]);
    setNewAdvAmount('');
    setNewAdvRef('');
  };

  const handleRemoveAdvanceRecord = (id: string) => {
    setAdvances(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      {/* Modal Card Container */}
      <div className="relative w-full max-w-4xl bg-charcoal-900 border border-gold-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full">
        
        {/* Top Control Toolbar (Hidden during print) */}
        <div className="p-4 sm:p-5 bg-charcoal-950 border-b border-gold-500/20 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gold-500/10 text-gold-400 rounded-xl border border-gold-500/20">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-mono tracking-widest text-gold-400 uppercase font-bold bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
                  Minimalist Invoice Designer
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold">
                  Live Preview
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white font-display mt-0.5">
                Invoice Template & Summary
              </h3>
            </div>
          </div>

          {/* Theme Selector Toggle */}
          <div className="flex items-center bg-charcoal-900 p-1 rounded-xl border border-white/10">
            <button
              type="button"
              id="btn-theme-dark-minimal"
              onClick={() => setTemplateTheme('dark_minimal')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                templateTheme === 'dark_minimal'
                  ? 'bg-gold-500 text-charcoal-950 shadow-md font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Matte Obsidian (Dark)</span>
            </button>
            <button
              type="button"
              id="btn-theme-classic-light"
              onClick={() => setTemplateTheme('classic_light')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                templateTheme === 'classic_light'
                  ? 'bg-white text-slate-900 shadow-md font-extrabold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Classic Light</span>
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              type="button"
              onClick={handleWhatsAppSend}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5 shadow-md shadow-emerald-950/50"
              title="Send final invoice directly to client on WhatsApp"
            >
              <Send className="w-4 h-4" />
              <span>Send WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleEmailSend}
              className="px-3 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-sky-500/30 text-sky-300 font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5"
              title="Send final invoice via Email"
            >
              <Mail className="w-4 h-4" />
              <span>Email</span>
            </button>

            <button
              type="button"
              onClick={() => setShowEditItems(!showEditItems)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer border ${
                showEditItems 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                  : 'bg-charcoal-900 text-gray-300 border-white/10 hover:bg-charcoal-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{showEditItems ? 'Close Settings' : 'Edit Items & Advances'}</span>
            </button>

            <button
              type="button"
              id="btn-quick-print-now"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-gold-500 text-charcoal-950 font-bold text-xs hover:bg-gold-400 transition-all cursor-pointer flex items-center space-x-1.5 shadow-md gold-glow"
              title="Open browser print dialog"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="px-3.5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-gold-500/30 text-gold-300 font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Saving...' : 'PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTextSummary}
              className="px-3 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-gray-300 font-bold text-xs transition-all cursor-pointer flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-charcoal-900 hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Edit Items & Advances Drawer / Bar */}
        {showEditItems && (
          <div className="p-4 bg-charcoal-950 border-b border-white/10 space-y-4 shrink-0 print:hidden animate-fadeIn">
            {/* 1. Deliverables / Services */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gold-400 uppercase tracking-wider font-mono">
                  1. Services & Deliverable Line Items
                </span>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 bg-gold-500/20 hover:bg-gold-500/30 text-gold-300 border border-gold-500/30 text-xs rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Service</span>
                </button>
              </div>

              <div className="space-y-2 max-h-36 overflow-y-auto custom-scrollbar">
                {items.map((it) => (
                  <div key={it.id} className="flex items-center gap-2 text-xs">
                    <input
                      type="number"
                      min="1"
                      value={it.qty}
                      onChange={(e) => handleUpdateItem(it.id, 'qty', Number(e.target.value) || 1)}
                      className="w-14 bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1 text-white text-center"
                      placeholder="Qty"
                    />
                    <input
                      type="text"
                      value={it.description}
                      onChange={(e) => handleUpdateItem(it.id, 'description', e.target.value)}
                      className="flex-1 bg-charcoal-900 border border-white/10 rounded-lg px-3 py-1 text-white"
                      placeholder="Description"
                    />
                    <div className="flex items-center bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1 w-28">
                      <span className="text-gray-500 mr-1">₹</span>
                      <input
                        type="number"
                        value={it.price}
                        onChange={(e) => handleUpdateItem(it.id, 'price', Number(e.target.value) || 0)}
                        className="w-full bg-transparent text-white outline-none text-right font-mono"
                        placeholder="Price"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="p-1 text-gray-500 hover:text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Advance Payments Received & Modes */}
            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">
                    2. Advance Payments Received (Total: ₹{advancePaid.toLocaleString('en-IN')})
                  </span>
                </div>
              </div>

              {/* Form to quickly add an advance payment */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs mb-2">
                <input
                  type="text"
                  placeholder="Payer Name (e.g. Satish / Client)"
                  value={newAdvPaidBy}
                  onChange={(e) => setNewAdvPaidBy(e.target.value)}
                  className="bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1.5 text-white"
                />
                <input
                  type="number"
                  placeholder="Amount (₹)"
                  value={newAdvAmount}
                  onChange={(e) => setNewAdvAmount(Number(e.target.value) || '')}
                  className="bg-charcoal-900 border border-emerald-500/40 rounded-lg px-2 py-1.5 text-emerald-400 font-bold font-mono"
                />
                <select
                  value={newAdvMode}
                  onChange={(e) => setNewAdvMode(e.target.value)}
                  className="bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1.5 text-white"
                >
                  <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Card">Card</option>
                </select>
                <input
                  type="text"
                  placeholder="Txn Ref / UTR / Note"
                  value={newAdvRef}
                  onChange={(e) => setNewAdvRef(e.target.value)}
                  className="bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1.5 text-white"
                />
                <button
                  type="button"
                  onClick={handleAddAdvanceRecord}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Log Advance
                </button>
              </div>

              {/* Existing advances list */}
              {advances.length > 0 && (
                <div className="space-y-1.5 max-h-28 overflow-y-auto custom-scrollbar">
                  {advances.map((adv) => (
                    <div key={adv.id} className="flex items-center justify-between p-1.5 px-2 bg-charcoal-900/80 rounded-lg border border-white/5 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white">{adv.paidBy}</span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-mono text-[10px] border border-emerald-500/20">
                          {getModeIcon(adv.paymentMode)} {adv.paymentMode}
                        </span>
                        <span className="text-gray-400 text-[10px] font-mono">{adv.date}</span>
                        {adv.referenceNo && <span className="text-gray-500 text-[10px] font-mono">• {adv.referenceNo}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-emerald-400">₹{Number(adv.amount).toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAdvanceRecord(adv.id)}
                          className="text-gray-500 hover:text-red-400 p-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Settings */}
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/5 text-xs text-gray-300">
              <div className="flex items-center space-x-2">
                <span>Tax %:</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                  className="w-16 bg-charcoal-900 border border-white/10 rounded-lg px-2 py-1 text-white text-center font-mono"
                />
              </div>
              <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
                <span>Terms Pill Badge:</span>
                <input
                  type="text"
                  value={termsBadgeText}
                  onChange={(e) => setTermsBadgeText(e.target.value)}
                  className="flex-1 bg-charcoal-900 border border-white/10 rounded-lg px-3 py-1 text-white text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Printable Preview Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-charcoal-950/80 custom-scrollbar print:overflow-visible print:p-0 print:bg-white">
          
          {/* ======================================================== */}
          {/* TEMPLATE 1: MATTE OBSIDIAN DARK MINIMAL (MATCHES IMAGE) */}
          {/* ======================================================== */}
          {templateTheme === 'dark_minimal' ? (
            <div 
              ref={invoiceRef}
              id="invoice-dark-minimal-sheet"
              className="w-full max-w-2xl mx-auto rounded-3xl p-8 sm:p-12 shadow-2xl font-sans print:shadow-none print:border-none print:p-8 print:w-full print:max-w-none text-white relative overflow-hidden"
              style={{ 
                backgroundColor: '#131417',
                color: '#ffffff',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
              }}
            >
              {/* Subtle Ambient Vignette Background Texture */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-25"
                style={{
                  background: 'radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 70%), radial-gradient(circle at bottom left, rgba(255,255,255,0.03), transparent 70%)'
                }}
              />

              <div className="relative z-10 space-y-8">
                
                {/* 1. TOP HEADER - CURVED OUTLINE PILL BADGE */}
                <div className="flex justify-between items-start">
                  <div className="border border-white/80 rounded-2xl px-6 py-3 bg-white/[0.03]">
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-sans leading-none">
                      Invoice
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-300 font-sans tracking-wide mt-1 font-medium">
                      The Frame Cut Studio
                    </p>
                  </div>

                  <div className="text-right pt-1 font-mono text-xs text-gray-400">
                    <span className="text-white font-bold text-xs sm:text-sm tracking-wider uppercase block">
                      {invoiceNo}
                    </span>
                    <span className="text-gray-400 text-[10px] uppercase tracking-wider block mt-0.5">
                      Verified Studio Record
                    </span>
                  </div>
                </div>

                {/* 2. TO & DATE METADATA (EXACT MATCH TO PHOTO) */}
                <div className="space-y-4 pt-2">
                  <div>
                    <span className="text-xs text-gray-400 font-medium block mb-1">
                      To
                    </span>
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                      {project.coupleName ? `Mr. & Mrs. ${project.coupleName}` : (project.studioName || 'Valued Client')}
                    </h2>
                    {project.studioName && (
                      <p className="text-xs text-gray-400 font-medium mt-0.5">
                        {project.studioName}
                      </p>
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-gray-400 font-medium block mb-1">
                      Date
                    </span>
                    <p className="text-sm font-semibold text-white">
                      {currentDateFormatted}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {currentTimeFormatted}
                    </p>
                  </div>
                </div>

                {/* 3. CAPSULE / PILL TABLE HEADER (WHITE SOLID PILL WITH DARK TEXT & MATHEMATICAL GRID ALIGNMENT) */}
                <div className="space-y-1">
                  <div className="bg-white text-slate-950 rounded-full px-6 py-2.5 grid grid-cols-[1fr_120px_80px_130px] items-center font-extrabold text-xs uppercase tracking-wider shadow-sm">
                    <span className="text-left">SERVICE DESCRIPTION</span>
                    <span className="text-right">UNIT RATE</span>
                    <span className="text-center">QUANTITY</span>
                    <span className="text-right">TOTAL</span>
                  </div>

                  {/* ITEM ROWS */}
                  <div className="divide-y divide-white/10 pt-1">
                    {items.map((item, idx) => (
                      <div 
                        key={item.id || idx}
                        className="grid grid-cols-[1fr_120px_80px_130px] items-center py-3.5 px-6 text-xs sm:text-sm hover:bg-white/[0.02] transition-colors"
                      >
                        <span className="text-left text-white font-medium break-words pr-3">
                          {item.description}
                        </span>
                        <span className="text-right font-mono text-gray-300 font-medium tabular-nums">
                          ₹ {item.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-center font-mono text-gray-300 font-semibold">
                          {item.qty}
                        </span>
                        <span className="text-right font-mono font-bold text-white tabular-nums">
                          ₹ {(item.qty * item.price).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. ADVANCE PAYMENTS RECEIVED & MODE BREAKDOWN (EXACT MATCH TO SCREENSHOT) */}
                {advances.length > 0 && (
                  <div className="space-y-2 pt-1">
                    {/* Header Title & Verified Receipts badge */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 text-emerald-400">
                        <span>₹</span> 2. ADVANCE PAYMENTS RECEIVED & MODE BREAKDOWN
                      </h3>
                      <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#86efac] text-[11px] font-semibold tracking-wide">
                        Verified Receipts
                      </span>
                    </div>

                    {/* Table Container */}
                    <div className="rounded-2xl border border-emerald-500/20 bg-[#0f172a] overflow-hidden shadow-sm">
                      {/* Dark Green Table Header */}
                      <div className="grid grid-cols-[100px_1fr_180px_110px] sm:grid-cols-[120px_1fr_210px_130px] px-4 sm:px-5 py-3 bg-[#062c22] text-white font-bold text-xs uppercase tracking-wider">
                        <span>DATE</span>
                        <span>RECEIVED FROM</span>
                        <span className="text-center">PAYMENT MODE</span>
                        <span className="text-right">ADVANCE AMOUNT</span>
                      </div>

                      {/* Advances List Rows */}
                      <div className="divide-y divide-white/5 bg-[#0f172a]">
                        {advances.map((adv, idx) => {
                          const m = (adv.paymentMode || 'UPI').toLowerCase();
                          const isCash = m.includes('cash');
                          const isCheque = m.includes('cheque');

                          // Format date: e.g. "13 Jul 2026"
                          let displayDate = adv.date;
                          try {
                            if (displayDate && displayDate.includes('-')) {
                              const d = new Date(displayDate);
                              if (!isNaN(d.getTime())) {
                                displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                              }
                            }
                          } catch {}

                          return (
                            <div 
                              key={adv.id || idx}
                              className="grid grid-cols-[100px_1fr_180px_110px] sm:grid-cols-[120px_1fr_210px_130px] items-center py-3 px-4 sm:px-5 text-xs hover:bg-white/[0.02] transition-colors"
                            >
                              {/* DATE */}
                              <span className="font-mono text-xs text-gray-300">
                                {displayDate}
                              </span>

                              {/* RECEIVED FROM */}
                              <div className="pr-2">
                                <p className="font-bold text-xs sm:text-sm text-white leading-snug">
                                  {adv.paidBy || 'Client'}
                                </p>
                                {adv.referenceNo && (
                                  <p className="text-[10px] text-gray-400 font-mono">
                                    Ref: {adv.referenceNo}
                                  </p>
                                )}
                              </div>

                              {/* PAYMENT MODE PILL */}
                              <div className="flex justify-center">
                                {isCash ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] border border-[#86efac] text-[#15803d] font-bold text-xs shadow-xs">
                                    <span>💵</span> CASH
                                  </span>
                                ) : isCheque ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[#b45309] font-bold text-xs shadow-xs">
                                    <span>📄</span> CHEQUE
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#e0f2fe] border border-[#7dd3fc] text-[#0369a1] font-bold text-xs shadow-xs">
                                    <span>💳</span> ONLINE ({adv.paymentMode || 'Online (UPI)'})
                                  </span>
                                )}
                              </div>

                              {/* ADVANCE AMOUNT */}
                              <span className="text-right font-mono font-bold text-sm sm:text-base text-emerald-400 tabular-nums">
                                ₹{Number(adv.amount).toLocaleString('en-IN')}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Bottom Summary Bar */}
                      <div className="px-4 sm:px-5 py-3 bg-[#062c22] text-white flex flex-wrap items-center justify-between gap-3 font-mono border-t border-[#062c22]">
                        {/* Left mode badges */}
                        <div className="flex flex-wrap items-center gap-2">
                          {(Object.entries(modeBreakdown) as [string, { count: number; total: number }][]).map(([mode, data]) => {
                            const m = mode.toLowerCase();
                            const isCash = m.includes('cash');
                            if (isCash) {
                              return (
                                <div 
                                  key={mode}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#064e3b] border border-[#059669] text-[#a7f3d0] font-bold text-xs"
                                >
                                  <span>💵</span> Cash Received: <span className="font-mono">₹{data.total.toLocaleString('en-IN')}</span>
                                </div>
                              );
                            }
                            return (
                              <div 
                                key={mode}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c4a6e] border border-[#0284c7] text-[#bae6fd] font-bold text-xs"
                              >
                                <span>💳</span> Online Received: <span className="font-mono">₹{data.total.toLocaleString('en-IN')}</span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Right Total Adjusted */}
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                          <span className="text-emerald-200 font-medium">Total Advance Adjusted:</span>
                          <span className="font-black text-sm sm:text-base text-[#facc15] font-mono tracking-wide">
                            -₹{advancePaid.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. FINANCIAL SUMMARY & PAYMENT METHOD (EXACT LAYOUT FROM PHOTO) */}
                <div className="pt-2 space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 text-xs sm:text-sm">
                    {/* Left: Payment Method & Prominent QR Code */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex-1">
                      <div className="space-y-1 flex-1">
                        <span className="font-bold text-amber-400 block uppercase tracking-wider text-xs font-mono flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" /> Payment & Remittance
                        </span>
                        <p className="text-[11px] text-gray-200 font-mono leading-relaxed">
                          UPI: <strong className="text-amber-300">theframecutstudio@okhdfcbank</strong>
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono leading-relaxed">
                          HDFC Bank • A/C: 50200088912450 • IFSC: HDFC0001234
                        </p>
                        <p className="text-[10px] text-gray-400 font-sans leading-relaxed">
                          Beneficiary: The Frame Cut Studio
                        </p>
                      </div>

                      {/* Prominent QR Code Scan Card */}
                      <div className="shrink-0 flex flex-col items-center p-2 bg-white rounded-xl shadow-lg border border-amber-400/50">
                        <img 
                          src={quickQrCodeUrl} 
                          alt="Instant UPI QR Code" 
                          className="w-18 h-18 sm:w-20 sm:h-20 object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[8px] font-black text-slate-900 mt-1 uppercase tracking-tight font-mono">
                          {balanceDue > 0 ? `Pay ₹${balanceDue.toLocaleString('en-IN')}` : 'Scan with Any App'}
                        </span>
                      </div>
                    </div>

                    {/* Right: Sub Total & Tax */}
                    <div className="w-full sm:w-64 space-y-2">
                      <div className="flex justify-between items-center text-gray-300 text-xs sm:text-sm">
                        <span>Sub Total</span>
                        <span className="font-mono text-white font-semibold tabular-nums">
                          ₹ {subTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {taxPercent > 0 && (
                        <div className="flex justify-between items-center text-gray-300 text-xs sm:text-sm">
                          <span>Tax {taxPercent}%</span>
                          <span className="font-mono text-white tabular-nums">
                            ₹ {taxAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                      {advancePaid > 0 && (
                        <div className="flex justify-between items-center text-emerald-400 text-xs sm:text-sm">
                          <span>Total Advance Received</span>
                          <span className="font-mono font-semibold tabular-nums">
                            - ₹ {advancePaid.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider Line */}
                  <div className="border-t border-white/20 pt-3" />

                  {/* Terms & Condition Row & Grand Total */}
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="font-bold text-white uppercase tracking-wider text-xs">
                      Terms & Condition
                    </span>
                    <div className="flex items-center space-x-6 sm:space-x-8">
                      <span className="font-bold text-white text-xs sm:text-sm uppercase tracking-wider">
                        {advancePaid > 0 ? 'Balance Due' : 'Grand Total'}
                      </span>
                      <span className="text-base sm:text-xl font-black text-white font-mono tabular-nums">
                        ₹ {(advancePaid > 0 ? balanceDue : grandTotal).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* 5. TERMS PILL BADGE (EXACT REPLICA FROM REFERENCE PHOTO) */}
                  <div className="pt-1">
                    <div className="inline-block border border-white/60 rounded-full px-5 py-2 text-[11px] sm:text-xs text-white tracking-wide font-medium bg-white/[0.03]">
                      {termsBadgeText}
                    </div>
                  </div>

                  {/* 6. STUDIO FOOTER ADDRESS (BOTTOM LEFT) */}
                  <div className="pt-6 border-t border-white/10 text-[11px] text-gray-400 space-y-0.5">
                    <p className="font-bold text-white text-xs">
                      The Frame Cut Studio & Post-Production Suite
                    </p>
                    <p>104, Elite Media Arts Zone, Bengaluru / Raipur</p>
                    <p className="font-mono text-gray-300">+91 98765 43210 • billing@theframecutstudio.com</p>
                  </div>

                </div>

              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* TEMPLATE 2: CLASSIC STUDIO WHITE                         */
            /* ======================================================== */
            <div 
              ref={invoiceRef}
              id="invoice-classic-light-sheet"
              className="w-full max-w-2xl mx-auto bg-white text-slate-900 rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200 font-sans print:shadow-none print:border-none print:p-0 print:w-full print:max-w-none"
              style={{ color: '#0f172a' }}
            >
              {/* HEADER */}
              <div className="border-b-2 border-slate-900 pb-6 mb-6 flex justify-between items-start flex-wrap gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black text-xl font-serif">
                      F
                    </div>
                    <div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-serif leading-none uppercase">
                        THE FRAME CUT STUDIO
                      </h1>
                      <p className="text-[10px] font-mono text-amber-700 font-bold tracking-wider uppercase mt-0.5">
                        Cinematic Wedding Film Editing & Color Suite
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 font-sans pt-1">
                    104, Elite Visuals Complex, Media Arts Zone, Bengaluru - 560001
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    Email: billing@theframecutstudio.com • Tel: +91 98765 43210
                  </p>
                </div>

                <div className="text-right space-y-1 sm:border-l-2 sm:border-slate-200 sm:pl-5">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-amber-400 font-mono font-bold text-xs rounded-lg uppercase tracking-wider">
                    TAX INVOICE
                  </span>
                  <p className="text-sm font-black font-mono text-slate-900 pt-1">{invoiceNo}</p>
                  <p className="text-[11px] text-slate-500 font-mono">Date: {currentDateFormatted}</p>
                </div>
              </div>

              {/* BILLED TO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold block">
                    Billed To / Client
                  </span>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {project.coupleName}
                  </h3>
                  <p className="text-xs text-slate-600">Studio: {project.studioName || 'Direct Client'}</p>
                  <p className="text-xs text-slate-600">Event: {project.eventType}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 font-bold block">
                      Remittance & UPI Details
                    </span>
                    <p className="text-xs font-mono text-slate-800 font-bold">UPI: theframecutstudio@okhdfcbank</p>
                    <p className="text-[11px] font-mono text-slate-600">Bank: HDFC Bank Ltd.</p>
                    <p className="text-[11px] font-mono text-slate-600">A/C: 50200088912450 | IFSC: HDFC0001234</p>
                  </div>

                  <div className="shrink-0 flex flex-col items-center p-1.5 bg-white rounded-lg border border-slate-300 shadow-xs">
                    <img 
                      src={quickQrCodeUrl} 
                      alt="UPI QR Code" 
                      className="w-16 h-16 object-contain"
                      referrerPolicy="no-referrer"
                    />
                    <span className="text-[7px] font-extrabold text-slate-900 mt-0.5 font-mono uppercase">
                      SCAN TO PAY
                    </span>
                  </div>
                </div>
              </div>

              {/* 1. PROJECT SERVICES & DELIVERABLES */}
              <div className="mb-6 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider font-mono text-slate-800 flex items-center gap-1.5">
                    <span>🎞️</span> 1. PROJECT SERVICES & DELIVERABLES
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {items.length} {items.length === 1 ? 'Item' : 'Items'} Selected
                  </span>
                </div>

                <div className="border border-slate-900 rounded-xl overflow-x-auto custom-scrollbar shadow-xs">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead className="bg-[#0b1320] text-white font-mono text-[10px] uppercase">
                      <tr>
                        <th className="py-3 px-4">PROJECT / EVENT NAME</th>
                        <th className="py-3 px-4 text-center">QTY</th>
                        <th className="py-3 px-4 text-right">UNIT RATE</th>
                        <th className="py-3 px-4 text-right">TOTAL (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-semibold text-slate-900">{item.description}</td>
                          <td className="py-3 px-4 font-mono font-bold text-center text-slate-600">{item.qty}</td>
                          <td className="py-3 px-4 text-right font-mono text-slate-700">₹{item.price.toLocaleString('en-IN')}</td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">₹{(item.qty * item.price).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 2. ADVANCE PAYMENTS RECEIVED & MODE BREAKDOWN (EXACT MATCH TO SCREENSHOT) */}
              {advances.length > 0 && (
                <div className="mb-6 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider font-mono text-[#065f46] flex items-center gap-1.5">
                      <span>₹</span> 2. ADVANCE PAYMENTS RECEIVED & MODE BREAKDOWN
                    </span>
                    <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#dcfce7] text-[#15803d] border border-[#86efac] text-[11px] font-semibold tracking-wide">
                      Verified Receipts
                    </span>
                  </div>

                  {/* Table Container */}
                  <div className="rounded-xl border border-[#062c22]/30 overflow-x-auto custom-scrollbar shadow-xs">
                    <div className="min-w-[540px]">
                    {/* Dark Green Table Header */}
                    <div className="grid grid-cols-[100px_1fr_180px_110px] sm:grid-cols-[120px_1fr_210px_130px] px-4 sm:px-5 py-3 bg-[#062c22] text-white font-bold text-xs uppercase tracking-wider">
                      <span>DATE</span>
                      <span>RECEIVED FROM</span>
                      <span className="text-center">PAYMENT MODE</span>
                      <span className="text-right">ADVANCE AMOUNT</span>
                    </div>

                    {/* Advances List Rows */}
                    <div className="divide-y divide-slate-100 bg-white">
                      {advances.map((adv, idx) => {
                        const m = (adv.paymentMode || 'UPI').toLowerCase();
                        const isCash = m.includes('cash');
                        const isCheque = m.includes('cheque');

                        let displayDate = adv.date;
                        try {
                          if (displayDate && displayDate.includes('-')) {
                            const d = new Date(displayDate);
                            if (!isNaN(d.getTime())) {
                              displayDate = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                            }
                          }
                        } catch {}

                        return (
                          <div 
                            key={adv.id || idx}
                            className="grid grid-cols-[100px_1fr_180px_110px] sm:grid-cols-[120px_1fr_210px_130px] items-center py-3 px-4 sm:px-5 text-xs hover:bg-emerald-50/30 transition-colors"
                          >
                            <span className="font-mono text-xs font-medium text-slate-700">
                              {displayDate}
                            </span>
                            <div className="pr-2">
                              <p className="font-bold text-xs sm:text-sm text-slate-900 leading-snug">
                                {adv.paidBy || 'Client'}
                              </p>
                              {adv.referenceNo && (
                                <p className="text-[10px] text-slate-500 font-mono">
                                  Ref: {adv.referenceNo}
                                </p>
                              )}
                            </div>
                            <div className="flex justify-center">
                              {isCash ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dcfce7] border border-[#86efac] text-[#15803d] font-bold text-xs shadow-xs">
                                  <span>💵</span> CASH
                                </span>
                              ) : isCheque ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fef3c7] border border-[#fde68a] text-[#b45309] font-bold text-xs shadow-xs">
                                  <span>📄</span> CHEQUE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#e0f2fe] border border-[#7dd3fc] text-[#0369a1] font-bold text-xs shadow-xs">
                                  <span>💳</span> ONLINE ({adv.paymentMode || 'Online (UPI)'})
                                </span>
                              )}
                            </div>
                            <span className="text-right font-mono font-bold text-sm sm:text-base text-[#059669] tabular-nums">
                              ₹{Number(adv.amount).toLocaleString('en-IN')}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Summary Bar */}
                    <div className="px-4 sm:px-5 py-3 bg-[#062c22] text-white flex flex-wrap items-center justify-between gap-3 font-mono border-t border-[#062c22]">
                      <div className="flex flex-wrap items-center gap-2">
                        {(Object.entries(modeBreakdown) as [string, { count: number; total: number }][]).map(([mode, data]) => {
                          const m = mode.toLowerCase();
                          const isCash = m.includes('cash');
                          if (isCash) {
                            return (
                              <div 
                                key={mode}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#064e3b] border border-[#059669] text-[#a7f3d0] font-bold text-xs"
                              >
                                <span>💵</span> Cash Received: <span className="font-mono">₹{data.total.toLocaleString('en-IN')}</span>
                              </div>
                            );
                          }
                          return (
                            <div 
                              key={mode}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c4a6e] border border-[#0284c7] text-[#bae6fd] font-bold text-xs"
                            >
                              <span>💳</span> Online Received: <span className="font-mono">₹{data.total.toLocaleString('en-IN')}</span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <span className="text-emerald-200 font-medium">Total Advance Adjusted:</span>
                        <span className="font-black text-sm sm:text-base text-[#facc15] font-mono tracking-wide">
                          -₹{advancePaid.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TOTALS */}
              <div className="flex justify-end mb-6">
                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Sub Total:</span>
                    <span className="font-bold text-slate-900">₹{subTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {taxPercent > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Tax ({taxPercent}%):</span>
                      <span className="font-bold text-slate-900">₹{taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  {advancePaid > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Advance Received:</span>
                      <span className="font-bold">-₹{advancePaid.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="border-t-2 border-slate-900 pt-2 flex justify-between text-sm font-bold text-slate-900">
                    <span>Balance Due:</span>
                    <span className="text-amber-700 font-black">₹{balanceDue.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="border-t border-slate-200 pt-4 flex justify-between items-center text-[10px] font-mono text-slate-500">
                <span>{termsBadgeText}</span>
                <span className="font-bold uppercase text-slate-800">The Frame Cut Studio</span>
              </div>

            </div>
          )}

        </div>

        {/* Modal Bottom Footer (Hidden during print) */}
        <div className="p-3.5 bg-charcoal-950 border-t border-white/5 flex flex-wrap items-center justify-between text-xs font-mono text-gray-400 print:hidden gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>⚡ Ready for Instant A4 Printing, PDF Export & WhatsApp Sharing</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white font-bold cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuickPrintInvoiceModal;
