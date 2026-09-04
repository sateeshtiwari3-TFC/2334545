import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Copy, 
  Check, 
  X, 
  FileText, 
  CreditCard, 
  Film,
  Sparkles,
  QrCode,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Studio, Project, PaymentHistory } from '../../types';

interface StudioWhatsAppModalProps {
  studio: Studio | null;
  projects: Project[];
  payments: PaymentHistory[];
  onClose: () => void;
  onToast: (title: string, desc: string) => void;
}

export const StudioWhatsAppModal: React.FC<StudioWhatsAppModalProps> = ({
  studio,
  projects,
  payments,
  onClose,
  onToast
}) => {
  if (!studio) return null;

  const studioProjects = projects.filter(p => p.studioId === studio.id);
  const totalBilling = studioProjects.reduce((sum, p) => sum + (Number(p.projectAmount) || 0), 0);
  
  const sPayments = payments.filter(pay => pay.entityId === studio.id && pay.entityType === 'studio');
  const totalPaidFromDocs = sPayments.reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);
  const advancesNotLogged = studioProjects.reduce((sum, p) => {
    const hasDoc = payments.some(pay => pay.projectId === p.id && pay.entityType === 'studio');
    return hasDoc ? sum : sum + (Number(p.advancePayment) || 0);
  }, 0);
  const totalPaid = totalPaidFromDocs + advancesNotLogged;
  const outstanding = Math.max(0, totalBilling - totalPaid);

  const activeProjects = studioProjects.filter(p => !['delivered', 'closed'].includes(p.status));

  // Template modes
  const [templateType, setTemplateType] = useState<'statement' | 'reminder' | 'pipeline'>('statement');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [customizedMessage, setCustomizedMessage] = useState<string | null>(null);

  const upiId = studio.upiId || localStorage.getItem('tfc_upi_id') || 'sateeshtiwari3@okaxis';
  const cleanStudioCode = studio.name.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 8);
  const upiPayLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=The%20Frame%20Cut%20Studio&am=${outstanding}&cu=INR&tn=Bill_${cleanStudioCode}`;

  // Generate WhatsApp Message based on selected template
  const getMessageContent = () => {
    if (customizedMessage !== null) return customizedMessage;

    const ownerGreeting = studio.ownerName ? `Namaste ${studio.ownerName} Ji` : `Namaste Team ${studio.name}`;

    if (templateType === 'statement') {
      return `✨ *THE FRAME CUT STUDIO — STATEMENT OF ACCOUNT* ✨\n----------------------------------------\n🏢 *Studio:* ${studio.name}\n👤 *Attn:* ${studio.ownerName || 'Studio Partner'}\n📅 *Date:* ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}\n\n📊 *FINANCIAL SUMMARY:*\n• Total Projects Executed: ${studioProjects.length}\n• Total Contract Value: ₹${totalBilling.toLocaleString('en-IN')}\n• Total Received Advances: ₹${totalPaid.toLocaleString('en-IN')}\n• *Outstanding Due Balance: ₹${outstanding.toLocaleString('en-IN')}*\n\n${outstanding > 0 ? `💳 *PAYMENT DETAILS:*\n• UPI ID: \`${upiId}\`\n• Quick Pay Link: ${upiPayLink}\n• Bank Transfer (HDFC Bank) available upon request.` : '🎉 *Status: Your account is fully settled and up-to-date!*'}\n\nThank you for choosing *The Frame Cut Studio* for your wedding post-production!\n----------------------------------------\n_Wedding Cinematography & Video Editing Suite_`;
    }

    if (templateType === 'reminder') {
      return `🔔 *PAYMENT REMINDER — THE FRAME CUT STUDIO*\n----------------------------------------\n${ownerGreeting},\n\nThis is a gentle reminder regarding the outstanding balance for wedding post-production projects for *${studio.name}*.\n\n💳 *PENDING CLEARANCE:*\n• Outstanding Amount: *₹${outstanding.toLocaleString('en-IN')}*\n• Total Project Billing: ₹${totalBilling.toLocaleString('en-IN')}\n• Total Paid to Date: ₹${totalPaid.toLocaleString('en-IN')}\n\n🙏 *Kindly clear the pending balance to:*\n• UPI ID: \`${upiId}\`\n• Instant Pay Link: ${upiPayLink}\n\nIf the payment has already been initiated, please share the transaction screenshot.\n\nWarm regards,\n*The Frame Cut Studio*`;
    }

    // Pipeline Update
    const projectListText = activeProjects.length > 0 
      ? activeProjects.map((p, idx) => `  ${idx + 1}. *${p.coupleName}* (${p.eventType}) - Status: _${p.status.toUpperCase()}_ (Delivery: ${p.deliveryDate || 'Scheduled'})`).join('\n')
      : '  No active projects currently in editing.';

    return `🎬 *WEDDING PRODUCTION STATUS UPDATE*\n----------------------------------------\n${ownerGreeting},\n\nHere is the current post-production status of your projects at *The Frame Cut Studio*:\n\n📋 *ACTIVE PROJECTS IN PIPELINE (${activeProjects.length}):*\n${projectListText}\n\nTotal Completed Projects: ${studioProjects.length - activeProjects.length} / ${studioProjects.length}\n\nOur editing team is working dedicatedly on your cuts. Let us know if you have any priority sequence!\n\nWarm regards,\n*The Frame Cut Studio*`;
  };

  const message = getMessageContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    onToast("Message Copied", "WhatsApp message template copied to clipboard.");
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSendWhatsApp = (useWebApp = false) => {
    const cleanPhone = studio.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const encoded = encodeURIComponent(message);
    
    const url = useWebApp
      ? (phoneWithCountry ? `https://web.whatsapp.com/send?phone=${phoneWithCountry}&text=${encoded}` : `https://web.whatsapp.com/send?text=${encoded}`)
      : (phoneWithCountry ? `https://wa.me/${phoneWithCountry}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`);
      
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-xl bg-charcoal-900 border border-gold-500/30 rounded-3xl p-6 shadow-2xl z-10 space-y-4 max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                WhatsApp Dispatch: {studio.name}
              </h3>
              <p className="text-xs text-gray-400 font-mono">
                {studio.ownerName || 'Partner'} • {studio.phone || 'No phone'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-charcoal-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Template Selector Pills */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => { setTemplateType('statement'); setCustomizedMessage(null); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              templateType === 'statement'
                ? 'bg-gold-500/15 border-gold-500/40 text-gold-300 ring-1 ring-gold-500/30 shadow-md'
                : 'bg-charcoal-950/60 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 mb-1 text-gold-400" />
            <div className="text-xs font-bold font-mono">Account Statement</div>
            <div className="text-[10px] text-gray-500">Full ledger balance</div>
          </button>

          <button
            type="button"
            onClick={() => { setTemplateType('reminder'); setCustomizedMessage(null); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              templateType === 'reminder'
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 ring-1 ring-rose-500/30 shadow-md'
                : 'bg-charcoal-950/60 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 mb-1 text-rose-400" />
            <div className="text-xs font-bold font-mono">Due Reminder</div>
            <div className="text-[10px] text-gray-500">Outstanding payment</div>
          </button>

          <button
            type="button"
            onClick={() => { setTemplateType('pipeline'); setCustomizedMessage(null); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              templateType === 'pipeline'
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 ring-1 ring-amber-500/30 shadow-md'
                : 'bg-charcoal-950/60 border-white/5 text-gray-400 hover:text-white'
            }`}
          >
            <Film className="w-4 h-4 mb-1 text-amber-400" />
            <div className="text-xs font-bold font-mono">Pipeline Update</div>
            <div className="text-[10px] text-gray-500">Live project status</div>
          </button>
        </div>

        {/* UPI QR Code Quick Accordion */}
        {outstanding > 0 && (
          <div className="p-3 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-mono text-gray-300">
                Due: <strong className="text-amber-400 font-bold">₹{outstanding.toLocaleString('en-IN')}</strong> ({upiId})
              </span>
            </div>
            <button
              onClick={() => setShowQr(!showQr)}
              className="text-xs font-mono text-gold-400 hover:underline cursor-pointer"
            >
              {showQr ? 'Hide QR Code' : 'View UPI QR'}
            </button>
          </div>
        )}

        {showQr && outstanding > 0 && (
          <div className="p-4 bg-charcoal-950 rounded-2xl border border-gold-500/40 text-center space-y-2">
            <div className="p-3 bg-white rounded-xl inline-block shadow-lg mx-auto">
              <QRCodeSVG value={upiPayLink} size={150} level="H" />
            </div>
            <p className="text-[10px] font-mono text-gray-400">
              Scan with PhonePe, GPay, Paytm or BHIM to settle ₹{outstanding.toLocaleString('en-IN')}.
            </p>
          </div>
        )}

        {/* Message Preview or Editor */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center justify-between">
            <span>Message Content:</span>
            <button
              onClick={() => {
                if (!isEditing) setCustomizedMessage(message);
                setIsEditing(!isEditing);
              }}
              className="text-gold-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>{isEditing ? 'Done Editing' : 'Customize on the fly'}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              rows={6}
              value={customizedMessage ?? message}
              onChange={(e) => setCustomizedMessage(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-charcoal-950 border border-gold-500/50 font-mono text-xs text-white focus:outline-none focus:ring-1 focus:ring-gold-400"
            />
          ) : (
            <div className="p-4 rounded-2xl bg-charcoal-950/90 border border-white/10 font-mono text-xs text-gray-200 whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed select-all">
              {message}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white text-xs font-mono transition-all cursor-pointer border border-white/10"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSendWhatsApp(true)}
              className="px-3 py-2 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
              title="Open in WhatsApp Web browser tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-gold-400" />
              <span>WhatsApp Web</span>
            </button>

            <button
              type="button"
              onClick={() => handleSendWhatsApp(false)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
