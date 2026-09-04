import React, { useState } from 'react';
import { X, MessageSquare, Send, Copy, Check, Building2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { Project, Studio } from '../../types';

interface WhatsAppShareModalProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  studios: Studio[];
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  project,
  isOpen,
  onClose,
  studios
}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<'status' | 'review' | 'payment' | 'custom'>('status');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (project) {
      const studio = studios.find(s => s.id === project.studioId || s.name === project.studioName);
      setPhoneNumber(studio?.phone || '');

      const amount = Number(project.projectAmount) || 0;
      const advance = Number(project.advancePayment) || 0;
      const balance = Math.max(0, amount - advance);

      if (selectedTemplate === 'status') {
        setCustomMessage(
          `*Cinematic Film Production Update*\n\n` +
          `Project: *${project.projectName || project.coupleName}*\n` +
          `ID: \`${project.id}\`\n` +
          `Studio: *${project.studioName || 'Studio Partner'}*\n` +
          `Current Stage: *${project.status.toUpperCase().replace('_', ' ')}*\n` +
          `Delivery Deadline: *${project.deliveryDate || 'Scheduled'}*\n\n` +
          `Your project is actively being refined in our post-production suite. Let us know if you need any adjustments!`
        );
      } else if (selectedTemplate === 'review') {
        setCustomMessage(
          `*First Cut Ready for Review! 🎬*\n\n` +
          `Hello! The initial edit for *${project.projectName || project.coupleName}* (\`${project.id}\`) is now rendered and ready for your review.\n\n` +
          `Please share your timecoded feedback or approval.\n` +
          `${project.cloudDriveLink ? `Review Link: ${project.cloudDriveLink}\n\n` : ''}` +
          `Thank you!`
        );
      } else if (selectedTemplate === 'payment') {
        setCustomMessage(
          `*Invoice & Payment Ledger Summary*\n\n` +
          `Project: *${project.projectName || project.coupleName}* (\`${project.id}\`)\n` +
          `Studio: *${project.studioName || 'Studio Partner'}*\n\n` +
          `Total Contract: ₹${amount.toLocaleString('en-IN')}\n` +
          `Advance Paid: ₹${advance.toLocaleString('en-IN')}\n` +
          `*Balance Due: ₹${balance.toLocaleString('en-IN')}*\n\n` +
          `Kindly process the pending balance. Thank you!`
        );
      }
    }
  }, [project, selectedTemplate, studios]);

  if (!isOpen || !project) return null;

  const handleSendWhatsApp = () => {
    const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(customMessage);
    const url = cleanedPhone ? `https://wa.me/${cleanedPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="inline-block w-full max-w-lg overflow-hidden rounded-3xl bg-charcoal-950 border border-emerald-500/30 p-6 relative z-10 shadow-2xl space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold font-display text-white">WhatsApp Studio Dispatch</h3>
                <p className="text-[10px] text-gray-400 font-mono">{project.id} • {project.coupleName}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-charcoal-900 text-gray-400 hover:text-white flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Template Selector */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-gray-500">Select Message Template:</span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'status', label: '📊 Status' },
                { id: 'review', label: '🎬 Review Cut' },
                { id: 'payment', label: '💰 Balance Due' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedTemplate(t.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                    selectedTemplate === t.id
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-md'
                      : 'bg-charcoal-900 text-gray-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Phone Number Input */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-gray-400">Recipient Phone (with country code):</span>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full bg-charcoal-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500/40"
            />
          </div>

          {/* Message Preview & Editor */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase text-gray-400">Message Body:</span>
            <textarea
              rows={6}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full bg-charcoal-900 border border-white/10 rounded-2xl p-3 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 leading-relaxed custom-scrollbar"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleCopyText}
              className="px-3.5 py-2 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 text-gray-300 hover:text-white border border-white/10 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold font-mono text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Launch WhatsApp</span>
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
};
