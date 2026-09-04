import React, { useState } from 'react';
import { 
  Laptop, 
  Plus, 
  MessageCircle, 
  Search, 
  IndianRupee, 
  X,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Editor, Project, PaymentHistory } from '../../types';

interface LedgerEditorsTabProps {
  editors: Editor[];
  projects: Project[];
  payments: PaymentHistory[];
  onOpenRecordModal: (type?: 'studio' | 'editor', defaultProjectId?: string, defaultStudioId?: string, defaultEditorId?: string) => void;
}

export default function LedgerEditorsTab({
  editors,
  projects,
  payments,
  onOpenRecordModal
}: LedgerEditorsTabProps) {
  const [search, setSearch] = useState('');

  const editorStats = editors.map(editor => {
    const edProjects = projects.filter(p => p.assignedEditorId === editor.id || p.secondEditorId === editor.id);
    let totalEarned = 0;
    edProjects.forEach(p => {
      if (p.isSplitProject) {
        if (p.assignedEditorId === editor.id) totalEarned += Number(p.firstEditorShare) || 0;
        if (p.secondEditorId === editor.id) totalEarned += Number(p.secondEditorShare) || 0;
      } else {
        totalEarned += Number(p.editorPayment) || 0;
      }
    });

    const totalPaid = payments
      .filter(pay => pay.entityId === editor.id && pay.entityType === 'editor')
      .reduce((sum, pay) => sum + (Number(pay.amount) || 0), 0);

    const pendingBal = Math.max(0, totalEarned - totalPaid);
    const payoutPct = totalEarned > 0 ? Math.round((totalPaid / totalEarned) * 100) : 100;

    return {
      editor,
      edProjects,
      totalEarned,
      totalPaid,
      pendingBal,
      payoutPct
    };
  });

  const filteredEditors = editorStats.filter(({ editor }) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return editor.name.toLowerCase().includes(q) || ((editor as any).role || '').toLowerCase().includes(q) || (editor.phone || '').includes(q);
  }).sort((a, b) => b.pendingBal - a.pendingBal);

  const totalEditorPayable = editorStats.reduce((sum, e) => sum + e.pendingBal, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-charcoal-900/90 p-5 rounded-3xl border border-blue-500/20 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
            <Laptop className="w-5 h-5 text-blue-400" /> Video Editor Payout Directory
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Track editor fees earned across allocated wedding projects, payout disbursements, and pending balances.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="px-3 py-1.5 rounded-xl bg-charcoal-950 border border-white/10 text-xs font-mono text-gray-300">
            Total Payable: <strong className="text-blue-300">₹{totalEditorPayable.toLocaleString('en-IN')}</strong>
          </div>
          <button
            onClick={() => onOpenRecordModal('editor')}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-charcoal-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-md cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Settle Editor Payout</span>
          </button>
        </div>
      </div>

      {/* Search Input */}
      {editors.length > 3 && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search editor name, role, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-charcoal-950 border border-white/10 rounded-2xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Editor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEditors.map(({ editor, edProjects, totalEarned, totalPaid, pendingBal, payoutPct }) => {
          return (
            <motion.div 
              key={editor.id} 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -3 }}
              className="p-5 rounded-3xl bg-charcoal-900/90 border border-luxury-green-800/30 hover:border-blue-500/40 shadow-xl space-y-4 relative overflow-hidden group transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-lg">
                    {editor.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">{editor.name}</h4>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{(editor as any).role || 'Video Editor'} {editor.phone ? `• ${editor.phone}` : ''}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                  pendingBal > 0 ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {pendingBal > 0 ? `₹${Math.round(pendingBal/1000)}k Payable` : 'Fully Paid'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-charcoal-950/80 border border-white/5 text-center font-mono">
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Films</span>
                  <span className="text-xs font-bold text-white">{edProjects.length}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Total Fee</span>
                  <span className="text-xs font-bold text-blue-300">₹{totalEarned.toLocaleString('en-IN')}</span>
                </div>
                <div>
                  <span className="text-[9px] text-gray-400 uppercase block">Paid Out</span>
                  <span className="text-xs font-bold text-emerald-400">₹{totalPaid.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono text-gray-400">
                  <span>Payout Disbursement</span>
                  <span className="text-blue-400 font-bold">{payoutPct}%</span>
                </div>
                <div className="w-full bg-charcoal-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, payoutPct)}%` }} 
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2 border-t border-white/5">
                <button
                  onClick={() => onOpenRecordModal('editor', undefined, undefined, editor.id)}
                  className="flex-1 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Settle Payout</span>
                </button>

                <button
                  onClick={() => {
                    const phoneClean = (editor.phone || '').replace(/[^0-9]/g, '');
                    const msg = `Namaste ${editor.name} ji,\n\nGreetings from The Frame Cut Studio! 🎬\n\nHere is your editor payout statement:\n- Assigned Projects: ${edProjects.length}\n- Total Agreed Fee: ₹${totalEarned.toLocaleString('en-IN')}\n- Total Payout Received: ₹${totalPaid.toLocaleString('en-IN')}\n- Remaining Balance Payable: ₹${pendingBal.toLocaleString('en-IN')}\n\nThank you for your excellent creative work!\nThe Frame Cut Studio OS`;
                    const targetPhone = phoneClean ? (phoneClean.length === 10 ? '91' + phoneClean : phoneClean) : '';
                    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1 shadow"
                  title="Send WhatsApp Statement"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Statement</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
