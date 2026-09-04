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
  Copy, 
  Crown,
  Sparkles,
  Film,
  ArrowRight
} from 'lucide-react';
import { Studio, Project, PaymentHistory, UserRole } from '../../types';

interface StudioListViewProps {
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

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02
    }
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } 
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.15 }
  }
};

export const StudioListView: React.FC<StudioListViewProps> = ({
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
    <div className="rounded-3xl border border-white/10 bg-charcoal-950/80 backdrop-blur-xl overflow-hidden shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 bg-charcoal-900/90 text-[10px] font-mono uppercase tracking-wider text-gray-400">
              <th className="p-4 pl-6">Studio & Owner</th>
              <th className="p-4">Direct Contact</th>
              <th className="p-4">GST / UPI</th>
              <th className="p-4">Active Pipeline</th>
              <th className="p-4">Total Contract</th>
              <th className="p-4">Paid / Received</th>
              <th className="p-4">Due Balance</th>
              <th className="p-4">Clearance</th>
              <th className="p-4 pr-6 text-right">Actions</th>
            </tr>
          </thead>
          <motion.tbody 
            variants={listContainerVariants}
            initial="hidden"
            animate="visible"
            className="divide-y divide-white/5"
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

                const activeProjects = studioProjects.filter(p => !['delivered', 'closed'].includes(p.status));
                const clearanceRate = totalBilling > 0 ? Math.round((totalPaid / totalBilling) * 100) : 100;

                return (
                  <motion.tr
                    key={studio.id}
                    variants={rowVariants}
                    layout
                    onClick={() => onSelectStudio(studio)}
                    className="hover:bg-charcoal-800/60 transition-colors cursor-pointer group"
                  >
                    {/* Studio Brand & Owner */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-charcoal-900 border border-gold-500/20 p-0.5 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-gold-500/50 transition-all">
                          {studio.logoUrl ? (
                            <img src={studio.logoUrl} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full rounded-lg bg-gradient-to-br from-charcoal-800 to-luxury-green-950 flex items-center justify-center text-gold-400 font-display font-bold text-xs">
                              {studio.name.substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white group-hover:text-gold-300 transition-colors font-display">
                              {studio.name}
                            </span>
                            {studio.tier === 'elite' && (
                              <Crown className="w-3 h-3 text-gold-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                            <span>{studio.ownerName}</span>
                            {studio.city && <span className="text-gray-500">• {studio.city}</span>}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Direct Contact */}
                    <td className="p-4">
                      <div className="text-xs font-mono space-y-0.5">
                        <a
                          href={`tel:${studio.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-gray-300 hover:text-gold-400"
                        >
                          <Phone className="w-3 h-3 text-gold-400" />
                          <span>{studio.phone || '—'}</span>
                        </a>
                        {studio.email && (
                          <span className="text-[10px] text-gray-500 block truncate max-w-[140px]">
                            {studio.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* GST / UPI */}
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="space-y-1 font-mono text-[10px]">
                        {studio.gstNumber ? (
                          <button
                            type="button"
                            onClick={() => onQuickCopy(studio.gstNumber!, 'GSTIN')}
                            className="flex items-center gap-1 text-gray-300 hover:text-gold-300"
                            title="Copy GST"
                          >
                            <span className="text-gold-400 font-bold">GST:</span>
                            <span>{studio.gstNumber}</span>
                          </button>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                        {studio.upiId && (
                          <button
                            type="button"
                            onClick={() => onQuickCopy(studio.upiId!, 'UPI ID')}
                            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300"
                            title="Copy UPI"
                          >
                            <span className="font-bold">UPI:</span>
                            <span className="truncate max-w-[120px]">{studio.upiId}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Active Pipeline */}
                    <td className="p-4">
                      <div className="font-mono text-xs">
                        <span className="text-white font-bold block">
                          {activeProjects.length > 0 ? (
                            <span className="text-amber-400">{activeProjects.length} Active Cuts</span>
                          ) : (
                            <span className="text-gray-500">0 Active</span>
                          )}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {studioProjects.length} Total Weddings
                        </span>
                      </div>
                    </td>

                    {/* Total Billing */}
                    <td className="p-4">
                      <span className="text-xs font-mono font-bold text-gray-200 block">
                        ₹{totalBilling.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Paid */}
                    <td className="p-4">
                      <span className="text-xs font-mono font-bold text-emerald-400 block">
                        ₹{totalPaid.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Due Balance */}
                    <td className="p-4">
                      {outstanding > 0 ? (
                        <span className="text-xs font-mono font-bold text-rose-400 px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 inline-block">
                          ₹{outstanding.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-xs font-mono font-bold text-emerald-400 px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 inline-block">
                          All Clear ✓
                        </span>
                      )}
                    </td>

                    {/* Clearance Bar */}
                    <td className="p-4">
                      <div className="w-24 space-y-1">
                        <div className="flex justify-between text-[10px] font-mono text-gray-400">
                          <span>{clearanceRate}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-charcoal-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${
                              clearanceRate === 100 ? 'bg-emerald-400' : clearanceRate > 50 ? 'bg-gold-400' : 'bg-rose-400'
                            }`}
                            style={{ width: `${Math.min(100, clearanceRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={(e) => onOpenWhatsApp(studio, e)}
                          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-all cursor-pointer"
                          title="WhatsApp Studio"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => onEditStudio(studio, e)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-gold-500/20 text-gray-400 hover:text-gold-400 transition-all cursor-pointer"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {(userRole === 'admin' || userRole === 'editor') && (
                          <button
                            type="button"
                            onClick={(e) => onDeleteStudio(studio.id, e)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete Studio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectStudio(studio)}
                          className="p-1.5 rounded-lg bg-gold-500/10 hover:bg-gold-500/20 text-gold-400 transition-all cursor-pointer"
                          title="Open Ledger Drawer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </motion.tbody>
        </table>
      </div>
    </div>
  );
};
