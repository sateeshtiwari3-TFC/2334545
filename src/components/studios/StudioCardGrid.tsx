import React from 'react';
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
  ChevronRight, 
  CheckCircle2, 
  AlertCircle, 
  QrCode, 
  Copy, 
  ExternalLink,
  Crown,
  Sparkles,
  Film
} from 'lucide-react';
import { Studio, Project, PaymentHistory, UserRole } from '../../types';
import Logo from '../Logo';

interface StudioCardGridProps {
  studios: Studio[];
  projects: Project[];
  payments: PaymentHistory[];
  userRole?: UserRole;
  onSelectStudio: (studio: Studio) => void;
  onEditStudio: (studio: Studio, e: React.MouseEvent) => void;
  onDeleteStudio: (id: string, e: React.MouseEvent) => void;
  onOpenWhatsApp: (studio: Studio, e: React.MouseEvent) => void;
  onQuickCopy: (text: string, label: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 15, scale: 0.98 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

export const StudioCardGrid: React.FC<StudioCardGridProps> = ({
  studios,
  projects,
  payments,
  userRole = 'admin',
  onSelectStudio,
  onEditStudio,
  onDeleteStudio,
  onOpenWhatsApp,
  onQuickCopy
}) => {
  if (studios.length === 0) {
    return (
      <div className="py-16 text-center rounded-3xl bg-charcoal-900/40 border border-dashed border-white/10 backdrop-blur-xl">
        <Building2 className="w-12 h-12 text-gold-500/40 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white font-display">No Studio Partners Found</h3>
        <p className="text-xs text-gray-400 font-mono mt-1">Try adjusting your search query or filter criteria.</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants} 
      initial="hidden" 
      animate="visible" 
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
    >
      <AnimatePresence mode="popLayout">
        {studios.map((studio) => {
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

          // Active vs completed counts
          const activeProjects = studioProjects.filter(p => !['delivered', 'closed'].includes(p.status));
          const completedCount = studioProjects.filter(p => ['delivered', 'closed'].includes(p.status)).length;
          const clearanceRate = totalBilling > 0 ? Math.round((totalPaid / totalBilling) * 100) : 100;

          // Tier badge
          const tier = studio.tier || (studioProjects.length > 5 ? 'elite' : studioProjects.length > 2 ? 'premium' : 'standard');

          return (
            <motion.div
              key={studio.id}
              variants={cardVariants}
              layout
              onClick={() => onSelectStudio(studio)}
              className="p-5 rounded-3xl bg-charcoal-950/80 hover:bg-charcoal-900/90 border border-white/10 hover:border-gold-500/40 transition-all duration-300 flex flex-col justify-between relative group cursor-pointer shadow-lg shadow-black/40 backdrop-blur-xl hover:shadow-gold-500/5"
            >
              {/* Background ambient gold gradient glow */}
              <div className="absolute top-0 right-0 w-36 h-36 bg-gold-500/5 group-hover:bg-gold-500/10 rounded-full blur-3xl pointer-events-none transition-all" />

              <div>
                {/* Header: Logo, Title, Owner, Tier & Quick actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3.5">
                    {/* Studio Logo / Monogram */}
                    <div className="w-13 h-13 rounded-2xl bg-charcoal-900 border border-gold-500/20 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-inner group-hover:border-gold-500/50 transition-all">
                      {studio.logoUrl ? (
                        <img 
                          src={studio.logoUrl} 
                          alt={studio.name} 
                          className="w-full h-full object-cover rounded-[14px]" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-charcoal-800 to-luxury-green-950 flex items-center justify-center text-gold-400 font-display font-bold text-lg">
                          {studio.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Title & Owner */}
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-bold font-display text-white group-hover:text-gold-300 transition-colors leading-tight">
                          {studio.name}
                        </h3>
                        {tier === 'elite' && (
                          <span className="p-0.5 text-gold-400" title="Elite Partner">
                            <Crown className="w-3.5 h-3.5 fill-gold-400/20" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-gold-400 shrink-0" />
                        <span>{studio.ownerName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Edit / Delete quick buttons */}
                  <div className="flex items-center space-x-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={(e) => onOpenWhatsApp(studio, e)}
                      className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 transition-all cursor-pointer"
                      title="WhatsApp Studio Owner"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => onEditStudio(studio, e)}
                      className="p-2 rounded-xl bg-white/5 hover:bg-gold-500/20 text-gray-400 hover:text-gold-400 transition-all cursor-pointer"
                      title="Edit Studio Profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    {(userRole === 'admin' || userRole === 'editor') && (
                      <button
                        type="button"
                        onClick={(e) => onDeleteStudio(studio.id, e)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Studio Partner"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Contact & Location Details */}
                <div className="mt-3.5 space-y-1.5 text-xs text-gray-300 font-mono">
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={`tel:${studio.phone}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 hover:text-gold-300 transition-colors truncate"
                      title="Call Studio"
                    >
                      <Phone className="w-3.5 h-3.5 text-gold-400 shrink-0" />
                      <span>{studio.phone || 'No phone'}</span>
                    </a>

                    {studio.email && (
                      <a
                        href={`mailto:${studio.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors truncate max-w-[150px]"
                        title={studio.email}
                      >
                        <Mail className="w-3 h-3 text-gray-500 shrink-0" />
                        <span className="truncate">{studio.email}</span>
                      </a>
                    )}
                  </div>

                  {studio.address && (
                    <div className="flex items-center gap-1.5 text-gray-400 text-[11px] truncate">
                      <MapPin className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                      <span className="truncate">{studio.city ? `${studio.city} • ` : ''}{studio.address}</span>
                    </div>
                  )}

                  {/* GSTIN / UPI Badges */}
                  {(studio.gstNumber || studio.upiId) && (
                    <div className="flex items-center gap-2 pt-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
                      {studio.gstNumber && (
                        <button
                          type="button"
                          onClick={() => onQuickCopy(studio.gstNumber!, 'GSTIN')}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-charcoal-900 border border-white/10 text-[10px] text-gray-300 hover:border-gold-500/40 hover:text-gold-300 transition-all cursor-pointer"
                          title="Click to copy GST Number"
                        >
                          <span className="text-gold-400 font-bold">GST:</span>
                          <span>{studio.gstNumber}</span>
                          <Copy className="w-2.5 h-2.5 text-gray-500 ml-0.5" />
                        </button>
                      )}
                      {studio.upiId && (
                        <button
                          type="button"
                          onClick={() => onQuickCopy(studio.upiId!, 'UPI ID')}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-charcoal-900 border border-white/10 text-[10px] text-gray-300 hover:border-emerald-500/40 hover:text-emerald-300 transition-all cursor-pointer"
                          title="Click to copy UPI ID"
                        >
                          <span className="text-emerald-400 font-bold">UPI:</span>
                          <span className="truncate max-w-[120px]">{studio.upiId}</span>
                          <Copy className="w-2.5 h-2.5 text-gray-500 ml-0.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Pipeline Stats Banner */}
                <div className="mt-3.5 p-2.5 rounded-2xl bg-charcoal-900/70 border border-white/5 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-gray-300">
                      {activeProjects.length > 0 ? (
                        <span className="text-amber-400 font-bold">{activeProjects.length} Active Cuts</span>
                      ) : (
                        <span className="text-gray-400">No active cuts</span>
                      )}
                    </span>
                  </div>
                  <span className="text-gray-400 text-[11px]">
                    {studioProjects.length} Total Engagements
                  </span>
                </div>
              </div>

              {/* Bottom Financial Ledger Section */}
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5">
                <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Total Billing</span>
                    <span className="text-white font-bold text-xs">
                      ₹{totalBilling >= 100000 ? `${(totalBilling / 100000).toFixed(2)}L` : totalBilling.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-center">
                    <span className="text-gray-500 block text-[9px] uppercase">Received</span>
                    <span className="text-emerald-400 font-bold text-xs">
                      ₹{totalPaid >= 100000 ? `${(totalPaid / 100000).toFixed(2)}L` : totalPaid.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 block text-[9px] uppercase">Due Balance</span>
                    <span className={`font-bold text-xs ${outstanding > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {outstanding > 0 ? `₹${outstanding.toLocaleString('en-IN')}` : 'Settled ✓'}
                    </span>
                  </div>
                </div>

                {/* Visual Clearance Progress Bar */}
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-charcoal-900 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        clearanceRate === 100 
                          ? 'bg-emerald-400' 
                          : clearanceRate > 50 
                          ? 'bg-gradient-to-r from-gold-500 to-emerald-400' 
                          : 'bg-gradient-to-r from-rose-500 to-amber-400'
                      }`}
                      style={{ width: `${Math.min(100, clearanceRate)}%` }}
                    />
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-1 flex items-center justify-between text-xs text-gold-400 group-hover:text-gold-300 font-semibold font-mono">
                  <span>Open Studio Ledger</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </motion.div>
  );
};
