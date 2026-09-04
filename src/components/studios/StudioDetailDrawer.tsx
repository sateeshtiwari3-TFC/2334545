import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Edit, 
  Trash2, 
  MessageSquare, 
  X, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Film, 
  Plus, 
  Copy, 
  ExternalLink,
  Crown,
  Share2,
  FileText,
  CreditCard,
  Check,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Studio, Project, PaymentHistory, UserRole } from '../../types';

interface StudioDetailDrawerProps {
  studio: Studio | null;
  projects: Project[];
  payments: PaymentHistory[];
  userRole?: UserRole;
  onClose: () => void;
  onEditStudio: (studio: Studio, e: React.MouseEvent) => void;
  onDeleteStudio: (id: string, e: React.MouseEvent) => void;
  onOpenWhatsApp: (studio: Studio, e: React.MouseEvent) => void;
  onOpenPaymentModal: (studio: Studio) => void;
  onQuickCopy: (text: string, label: string) => void;
}

export const StudioDetailDrawer: React.FC<StudioDetailDrawerProps> = ({
  studio,
  projects,
  payments,
  userRole = 'admin',
  onClose,
  onEditStudio,
  onDeleteStudio,
  onOpenWhatsApp,
  onOpenPaymentModal,
  onQuickCopy
}) => {
  if (!studio) return null;

  const [activeTab, setActiveTab] = useState<'pipeline' | 'ledger' | 'tax_info' | 'share'>('pipeline');

  // Filter calculations for this studio
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
  const completedProjects = studioProjects.filter(p => ['delivered', 'closed'].includes(p.status));
  const clearanceRate = totalBilling > 0 ? Math.round((totalPaid / totalBilling) * 100) : 100;

  const tier = studio.tier || (studioProjects.length > 5 ? 'elite' : studioProjects.length > 2 ? 'premium' : 'standard');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/75 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <motion.div
          id="studio-detail-drawer"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className="w-screen max-w-2xl bg-charcoal-950 border-l border-gold-500/20 shadow-2xl flex flex-col justify-between overflow-hidden"
        >
          {/* Top Header Banner */}
          <div className="p-6 border-b border-white/10 bg-charcoal-900/90 shrink-0 relative overflow-hidden">
            {/* Ambient Background Gold Glow */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-gold-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center space-x-4">
                {/* Monogram / Logo */}
                <div className="w-14 h-14 rounded-2xl bg-charcoal-950 border border-gold-500/30 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                  {studio.logoUrl ? (
                    <img 
                      src={studio.logoUrl} 
                      alt={studio.name} 
                      className="w-full h-full object-cover rounded-[14px]" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-charcoal-800 to-luxury-green-950 flex items-center justify-center text-gold-400 font-display font-bold text-xl">
                      {studio.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono px-2 py-0.5 bg-gold-500/15 text-gold-300 border border-gold-500/30 rounded-full font-bold uppercase tracking-wider">
                      {tier} Partner
                    </span>
                    {studio.city && (
                      <span className="text-[10px] font-mono text-gray-400">
                        {studio.city}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold font-display text-white mt-1">
                    {studio.name}
                  </h2>
                  <p className="text-xs text-gray-400 font-mono flex items-center gap-1.5 mt-0.5">
                    <User className="w-3 h-3 text-gold-400" />
                    <span>{studio.ownerName}</span>
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center space-x-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => onOpenWhatsApp(studio, e)}
                  className="p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20 transition-all cursor-pointer"
                  title="WhatsApp Studio"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => onEditStudio(studio, e)}
                  className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-gold-500/20 text-gray-300 hover:text-gold-300 border border-white/10 transition-all cursor-pointer"
                  title="Edit Studio"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Contact Bar */}
            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href={`tel:${studio.phone}`}
                  className="flex items-center gap-1 text-gold-400 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{studio.phone || 'No phone'}</span>
                </a>

                {studio.email && (
                  <a
                    href={`mailto:${studio.email}`}
                    className="flex items-center gap-1 text-gray-300 hover:underline"
                  >
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{studio.email}</span>
                  </a>
                )}
              </div>

              {/* Fast Payment Button */}
              <button
                type="button"
                onClick={() => onOpenPaymentModal(studio)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Payment</span>
              </button>
            </div>
          </div>

          {/* Financial KPIs Banner */}
          <div className="p-6 bg-charcoal-900/40 border-b border-white/5 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Total Billing */}
              <div className="p-3.5 bg-charcoal-900/80 rounded-2xl border border-white/5">
                <span className="text-[9px] font-mono text-gray-400 uppercase block">Total Billing</span>
                <span className="text-sm sm:text-base font-bold font-mono text-white block mt-0.5">
                  ₹{totalBilling.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-500 font-mono mt-0.5 block">
                  {studioProjects.length} Projects
                </span>
              </div>

              {/* Received */}
              <div className="p-3.5 bg-emerald-950/30 rounded-2xl border border-emerald-500/20">
                <span className="text-[9px] font-mono text-emerald-400 uppercase block">Received Advances</span>
                <span className="text-sm sm:text-base font-bold font-mono text-emerald-400 block mt-0.5">
                  ₹{totalPaid.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-emerald-500 font-mono mt-0.5 block">
                  {clearanceRate}% Cleared
                </span>
              </div>

              {/* Due Balance */}
              <div className="p-3.5 bg-rose-950/30 rounded-2xl border border-rose-500/20">
                <span className="text-[9px] font-mono text-rose-400 uppercase block">Due Balance</span>
                <span className={`text-sm sm:text-base font-bold font-mono block mt-0.5 ${outstanding > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  ₹{outstanding.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-mono mt-0.5 block text-gray-400">
                  {outstanding > 0 ? 'Action Required' : 'All Clear ✓'}
                </span>
              </div>

              {/* Active Pipeline */}
              <div className="p-3.5 bg-amber-950/30 rounded-2xl border border-amber-500/20">
                <span className="text-[9px] font-mono text-amber-400 uppercase block">Active In Production</span>
                <span className="text-sm sm:text-base font-bold font-mono text-amber-300 block mt-0.5">
                  {activeProjects.length} Cuts
                </span>
                <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                  {completedProjects.length} Delivered
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="px-6 border-b border-white/10 bg-charcoal-900/60 flex items-center gap-2 overflow-x-auto shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`py-3 px-3 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'pipeline'
                  ? 'border-gold-400 text-gold-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Wedding Pipeline ({studioProjects.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ledger')}
              className={`py-3 px-3 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'border-gold-400 text-gold-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payment Ledger ({sPayments.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('share')}
              className={`py-3 px-3 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'share'
                  ? 'border-gold-400 text-gold-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Dispatch</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tax_info')}
              className={`py-3 px-3 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'tax_info'
                  ? 'border-gold-400 text-gold-300'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Tax & Profile</span>
            </button>
          </div>

          {/* Drawer Body Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB 1: Wedding Pipeline */}
            {activeTab === 'pipeline' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono">
                    All Wedding Projects ({studioProjects.length})
                  </h3>
                  <span className="text-[11px] font-mono text-gray-400">
                    {activeProjects.length} Active • {completedProjects.length} Delivered
                  </span>
                </div>

                {studioProjects.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-charcoal-900/50 border border-dashed border-white/10 font-mono text-xs text-gray-400">
                    No wedding projects logged for this studio yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {studioProjects.map((proj) => {
                      const isDelivered = ['delivered', 'closed'].includes(proj.status);
                      const balance = Math.max(0, (proj.projectAmount || 0) - (proj.advancePayment || 0));

                      return (
                        <div
                          key={proj.id}
                          className="p-4 rounded-2xl bg-charcoal-900/70 border border-white/10 hover:border-gold-500/30 transition-all space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-gold-400 font-bold">
                                  {proj.id}
                                </span>
                                <span className="text-[10px] font-mono text-gray-400">
                                  Delivery: {proj.deliveryDate || 'TBD'}
                                </span>
                              </div>
                              <h4 className="text-sm font-bold text-white font-display mt-0.5">
                                {proj.coupleName}
                              </h4>
                              <p className="text-[11px] text-gray-400 font-mono">
                                {proj.eventType} {proj.assignedEditorName ? `• Editor: ${proj.assignedEditorName}` : ''}
                              </p>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold font-mono text-white block">
                                ₹{proj.projectAmount.toLocaleString('en-IN')}
                              </span>
                              <span className={`inline-block text-[9px] font-mono px-2 py-0.5 rounded-full uppercase mt-1 ${
                                isDelivered 
                                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' 
                                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                              }`}>
                                {proj.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-gray-400">
                            <div>
                              <span>Advance Paid: </span>
                              <span className="text-emerald-400 font-bold">₹{(proj.advancePayment || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                              <span>Balance: </span>
                              <span className={`font-bold ${balance > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                ₹{balance.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Payment Ledger */}
            {activeTab === 'ledger' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono">
                      Payments Received Ledger
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                      Direct payment transactions recorded for {studio.name}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenPaymentModal(studio)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs shadow transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Payment</span>
                  </button>
                </div>

                {sPayments.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-charcoal-900/50 border border-dashed border-white/10 font-mono text-xs text-gray-400 space-y-2">
                    <CreditCard className="w-8 h-8 text-gray-600 mx-auto" />
                    <p>No direct payment transactions logged yet.</p>
                    <button
                      type="button"
                      onClick={() => onOpenPaymentModal(studio)}
                      className="text-gold-400 text-xs font-bold underline"
                    >
                      Record First Studio Payment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {sPayments.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-3.5 rounded-2xl bg-charcoal-900/70 border border-white/10 flex items-center justify-between gap-3 font-mono text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-400">
                              +₹{Number(pay.amount).toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-gray-400 uppercase px-1.5 py-0.5 rounded bg-charcoal-800 border border-white/5">
                              {pay.paymentMethod || 'UPI'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-300 mt-1">
                            {pay.projectName || 'Studio Deposit'}
                          </p>
                          {pay.referenceNumber && (
                            <p className="text-[10px] text-gray-500">
                              Ref: {pay.referenceNumber}
                            </p>
                          )}
                        </div>

                        <div className="text-right text-[11px] text-gray-400">
                          <span>{pay.date || '—'}</span>
                          {pay.notes && (
                            <p className="text-[10px] text-gray-500 max-w-[150px] truncate mt-0.5">
                              {pay.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: WhatsApp Share & Dispatch */}
            {activeTab === 'share' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono">
                  Instant WhatsApp Communication
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Send pre-formatted professional billing statements or payment reminders directly to {studio.ownerName}'s WhatsApp.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={(e) => onOpenWhatsApp(studio, e)}
                    className="p-4 rounded-2xl bg-charcoal-900/80 border border-gold-500/20 hover:border-gold-500/50 text-left transition-all cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="w-5 h-5 text-gold-400" />
                      <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-gold-400 transition-colors" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-gold-300 font-mono">
                      Account Statement
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      Complete financial overview with total billing, advances & pending balance.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => onOpenWhatsApp(studio, e)}
                    className="p-4 rounded-2xl bg-charcoal-900/80 border border-rose-500/20 hover:border-rose-500/50 text-left transition-all cursor-pointer group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-5 h-5 text-rose-400" />
                      <ArrowUpRight className="w-4 h-4 text-gray-500 group-hover:text-rose-400 transition-colors" />
                    </div>
                    <div className="text-xs font-bold text-white group-hover:text-rose-300 font-mono">
                      Payment Reminder
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      Friendly payment balance clearance reminder with UPI ID.
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: Tax & Profile Details */}
            {activeTab === 'tax_info' && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gold-400 font-mono">
                  Taxation, Address & Banking Profile
                </h3>

                <div className="p-4 rounded-2xl bg-charcoal-900/80 border border-white/10 space-y-3 font-mono text-xs">
                  {/* GSTIN */}
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">GSTIN / Tax ID:</span>
                    {studio.gstNumber ? (
                      <button
                        type="button"
                        onClick={() => onQuickCopy(studio.gstNumber!, 'GST Number')}
                        className="text-gold-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>{studio.gstNumber}</span>
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    ) : (
                      <span className="text-gray-500">Not Registered / Unspecified</span>
                    )}
                  </div>

                  {/* UPI ID */}
                  <div className="flex items-center justify-between py-1 border-b border-white/5">
                    <span className="text-gray-400">Studio UPI ID:</span>
                    {studio.upiId ? (
                      <button
                        type="button"
                        onClick={() => onQuickCopy(studio.upiId!, 'UPI ID')}
                        className="text-emerald-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>{studio.upiId}</span>
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                    ) : (
                      <span className="text-gray-500">Not Specified</span>
                    )}
                  </div>

                  {/* Payment Link */}
                  {studio.paymentLink && (
                    <div className="flex items-center justify-between py-1 border-b border-white/5">
                      <span className="text-gray-400">Payment Gateway Link:</span>
                      <a
                        href={studio.paymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gold-400 font-bold flex items-center gap-1 hover:underline"
                      >
                        <span>Open Gateway</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}

                  {/* Office Address */}
                  <div className="py-1 border-b border-white/5">
                    <span className="text-gray-400 block mb-1">Registered Address:</span>
                    <span className="text-white font-normal leading-relaxed block">
                      {studio.address || 'No physical address provided.'}
                    </span>
                  </div>

                  {/* Internal Notes */}
                  {studio.notes && (
                    <div className="py-1">
                      <span className="text-gray-400 block mb-1">Partnership Terms / Notes:</span>
                      <p className="text-gray-300 font-normal leading-relaxed bg-charcoal-950 p-3 rounded-xl border border-white/5 whitespace-pre-wrap">
                        {studio.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-6 border-t border-white/10 bg-charcoal-900/90 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={(e) => onEditStudio(studio, e)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-charcoal-800 hover:bg-gold-500/20 text-gray-300 hover:text-gold-300 text-xs font-bold border border-white/10 transition-all cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Studio Partner</span>
            </button>

            {(userRole === 'admin' || userRole === 'editor') && (
              <button
                type="button"
                onClick={(e) => onDeleteStudio(studio.id, e)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Partner</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
