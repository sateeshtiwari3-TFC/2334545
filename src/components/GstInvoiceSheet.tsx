import React, { useMemo } from 'react';
import Logo from './Logo';
import { 
  CreditCard, 
  ShieldCheck, 
  IndianRupee, 
  Wallet, 
  Building, 
  Banknote, 
  Smartphone, 
  FileText, 
  CheckCircle2,
  QrCode
} from 'lucide-react';
import { StudioAdvancePaymentItem } from '../types';

export interface GstInvoiceSheetProps {
  invoiceNo: string;
  issuedDate: string;
  dueDate: string;
  invoiceStatus: 'pending' | 'paid' | 'overdue' | 'cancelled';
  supplier: {
    name: string;
    pan: string;
    address: string;
    phone: string;
    email: string;
    state: string;
  };
  buyer: {
    name: string;
    ownerName?: string;
    pan?: string;
    address?: string;
    phone?: string;
    email?: string;
    state?: string;
  };
  placeOfSupply: string;
  reverseCharge: boolean;
  items: Array<{
    id: string;
    description: string;
    subDescription?: string;
    sacCode: string;
    unitRate: number;
    quantity: number;
    amount: number;
  }>;
  taxableAmount: number;
  gstEnabled: boolean;
  gstRate: number;
  gstTaxType: 'intra' | 'inter';
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
  grossTotal: number;
  previousBalance: number;
  advanceTotal: number;
  advancePayments?: StudioAdvancePaymentItem[];
  discount: number;
  totalPayable: number;
  amountInWords: string;
  bankDetails: {
    accountHolder: string;
    bankName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
  };
  qrCodeUrl?: string;
  qrCodeSize?: 'normal' | 'prominent';
  qrCodeLabel?: string;
  signatureImageUrl?: string;
  signatureSignatoryName?: string;
  showSignature?: boolean;
  termsBadgeText: string;
  theme?: 'dark_minimal' | 'classic_light';
  templateLayout?: 'minimal' | 'professional';
  showWatermark?: boolean;
  showTaxMatrix?: boolean;
  id?: string;
  className?: string;
}

export default function GstInvoiceSheet({
  invoiceNo,
  issuedDate,
  dueDate,
  invoiceStatus,
  supplier,
  buyer,
  placeOfSupply,
  reverseCharge,
  items,
  taxableAmount,
  gstEnabled,
  gstRate,
  gstTaxType,
  cgstAmount,
  sgstAmount,
  igstAmount,
  totalGstAmount,
  previousBalance,
  advanceTotal,
  advancePayments = [],
  discount,
  totalPayable,
  amountInWords,
  bankDetails,
  qrCodeUrl,
  qrCodeSize = 'prominent',
  qrCodeLabel,
  signatureImageUrl,
  signatureSignatoryName,
  showSignature = true,
  termsBadgeText,
  theme = 'dark_minimal',
  templateLayout = 'professional',
  showWatermark = true,
  showTaxMatrix = true,
  id,
  className
}: GstInvoiceSheetProps) {
  const isDark = theme === 'dark_minimal';
  const isMinimal = templateLayout === 'minimal';

  // Compute Mode Breakdown from advancePayments
  const modeBreakdown = useMemo(() => {
    const list = advancePayments.filter(a => a.adjusted !== false && a.amount > 0);
    if (list.length === 0) {
      if (advanceTotal > 0) {
        return { 'UPI / Online': { count: 1, total: advanceTotal } };
      }
      return {};
    }
    const breakdown: Record<string, { count: number; total: number }> = {};
    list.forEach(item => {
      const mode = item.paymentMode?.trim() || 'UPI';
      if (!breakdown[mode]) {
        breakdown[mode] = { count: 0, total: 0 };
      }
      breakdown[mode].count += 1;
      breakdown[mode].total += item.amount;
    });
    return breakdown;
  }, [advancePayments, advanceTotal]);

  const activeAdvanceList = useMemo(() => {
    const list = advancePayments.filter(a => a.adjusted !== false && a.amount > 0);
    if (list.length === 0 && advanceTotal > 0) {
      return [{
        id: 'adv-fallback',
        date: issuedDate,
        paidBy: buyer.ownerName || buyer.name || 'Studio Client',
        paymentMode: 'UPI / Direct Settlement',
        amount: advanceTotal,
        adjusted: true,
        referenceNo: 'Advance Payment Adjusted'
      }];
    }
    return list;
  }, [advancePayments, advanceTotal, buyer, issuedDate]);

  const getModeBadgeClass = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm')) {
      return isDark ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' : 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (m.includes('bank') || m.includes('neft') || m.includes('imps') || m.includes('rtgs') || m.includes('net banking')) {
      return isDark ? 'bg-sky-500/15 text-sky-300 border-sky-500/30' : 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (m.includes('cash')) {
      return isDark ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (m.includes('cheque')) {
      return isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200';
  };

  const getModeIcon = (mode: string) => {
    const m = mode.toLowerCase();
    if (m.includes('upi') || m.includes('gpay') || m.includes('phonepe') || m.includes('paytm')) {
      return <Smartphone className="w-3 h-3 text-indigo-400" />;
    }
    if (m.includes('bank') || m.includes('neft') || m.includes('imps') || m.includes('rtgs') || m.includes('net banking')) {
      return <Building className="w-3 h-3 text-sky-400" />;
    }
    if (m.includes('cash')) {
      return <Banknote className="w-3 h-3 text-emerald-400" />;
    }
    if (m.includes('cheque')) {
      return <FileText className="w-3 h-3 text-amber-400" />;
    }
    return <CreditCard className="w-3 h-3 text-purple-400" />;
  };

  return (
    <div
      id={id || 'gst-invoice-sheet-root'}
      data-invoice-sheet="true"
      className={`w-full invoice-sheet-root print-sheet rounded-2xl sm:rounded-3xl p-6 sm:p-10 shadow-2xl relative font-sans transition-all overflow-hidden ${
        isDark
          ? 'bg-[#131417] text-white border border-white/10'
          : 'bg-white text-slate-900 border border-slate-200'
      } ${className || ''}`}
      style={{
        backgroundColor: isDark ? '#131417' : '#ffffff',
        color: isDark ? '#ffffff' : '#0f172a'
      }}
    >
      {/* Background Watermark */}
      {showWatermark && (
        <div
          className="invoice-watermark absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0"
          style={{ opacity: isDark ? 0.04 : 0.03 }}
        >
          <Logo size={360} showText={true} variant="gold" title="THE FRAME CUT" />
        </div>
      )}

      <div className="relative z-10 space-y-6">
        {/* ================= 1. TOP HEADER & INVOICE META ================= */}
        {isMinimal ? (
          /* Minimalist Sleek Top Header */
          <div data-print-section="header" className="print-header-section print-avoid-break flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-white/10">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {gstEnabled ? 'GST Tax Invoice' : 'Standard Invoice'} • Minimal Layout
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
                INVOICE
              </h1>
              <p className="text-xs font-semibold text-amber-400 mt-1">
                {supplier.name} <span className="opacity-60 text-slate-400">• {supplier.phone}</span>
              </p>
              <p className="text-[10px] opacity-70 font-mono mt-0.5">
                PAN: {supplier.pan} | {supplier.state} | {supplier.email}
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-xs space-y-1">
              <div className="flex items-center sm:justify-end gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wider text-amber-300">
                  {invoiceNo}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                    invoiceStatus === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : invoiceStatus === 'overdue'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {(invoiceStatus || 'PENDING').toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Date: <strong>{issuedDate}</strong> • Due: <strong className="text-amber-400">{dueDate || 'On Receipt'}</strong>
              </p>
              <p className="text-[10px] opacity-70">
                Place of Supply: {placeOfSupply}
              </p>
            </div>
          </div>
        ) : (
          /* Corporate Professional Top Header */
          <div data-print-section="header" className="print-header-section print-avoid-break flex flex-col sm:flex-row justify-between items-start gap-4 border-b pb-5 border-white/10">
            {/* Supplier Info Box */}
            <div
              className={`border rounded-2xl px-5 py-3 space-y-1 max-w-md shrink-0 ${
                isDark
                  ? 'border-white/80 bg-white/[0.03]'
                  : 'border-slate-800 bg-slate-50 text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {gstEnabled ? 'TAX INVOICE / GST BILL' : 'ORIGINAL INVOICE'}
                </span>
                <span className="text-[9px] font-mono text-slate-400 uppercase">Professional</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-none pt-1">
                Invoice
              </h1>
              <p className="text-xs sm:text-[13px] font-bold tracking-wide text-amber-400">
                {supplier.name}
              </p>
              <p className="text-[11px] opacity-80 leading-relaxed">
                {supplier.address}
              </p>
              <div className="text-[10px] font-mono opacity-90 pt-0.5 space-y-0.5">
                <p>
                  <span className="text-amber-400 font-semibold">PAN:</span> {supplier.pan}
                </p>
                <p>
                  <span className="opacity-70">State:</span> {supplier.state} • <span className="opacity-70">Ph:</span> {supplier.phone}
                </p>
              </div>
            </div>

            {/* Right: Invoice #, Dates, Status Badge */}
            <div className="text-left sm:text-right font-mono text-xs space-y-1.5 shrink-0 self-stretch sm:self-auto">
              <div className="flex items-center sm:justify-end gap-2">
                <span className="font-bold text-sm sm:text-base tracking-wider uppercase">
                  {invoiceNo}
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    invoiceStatus === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : invoiceStatus === 'overdue'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      : invoiceStatus === 'cancelled'
                      ? 'bg-gray-800 text-gray-400 border-gray-700'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {(invoiceStatus || 'PENDING').toUpperCase()}
                </span>
              </div>

              <div className="text-[11px] flex flex-wrap items-center sm:justify-end gap-2 pt-0.5">
                <span>
                  Issued: <strong className="font-semibold">{issuedDate}</strong>
                </span>
                <span className="opacity-40">•</span>
                <span>
                  Due: <strong className="text-amber-400 font-semibold">{dueDate || 'On Receipt'}</strong>
                </span>
              </div>

              <div className="text-[10px] opacity-80 pt-0.5 space-y-0.5">
                <p>
                  <span className="opacity-70">Place of Supply:</span> <strong className="font-sans">{placeOfSupply}</strong>
                </p>
                <p>
                  <span className="opacity-70">Reverse Charge (RCM):</span> <strong>{reverseCharge ? 'Yes' : 'No'}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= 2. BILLED TO (BUYER DETAILS) ================= */}
        {isMinimal ? (
          <div data-print-section="buyer" className="print-buyer-box print-avoid-break flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 py-3 px-4 rounded-xl border border-white/10 bg-white/[0.02]">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-0.5">
                Billed Client:
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {buyer.name || 'Valued Studio Partner'}
                {buyer.ownerName && <span className="text-xs font-normal opacity-70 ml-2">({buyer.ownerName})</span>}
              </h2>
              {buyer.address && (
                <p className="text-[10px] opacity-70 mt-0.5">
                  {buyer.address}
                </p>
              )}
            </div>
            <div className="text-left sm:text-right font-mono text-[10px] space-y-0.5 opacity-80">
              {buyer.pan && <p><span className="text-amber-400 font-semibold">PAN:</span> {buyer.pan}</p>}
              {buyer.phone && <p>Ph: {buyer.phone} {buyer.state ? `• ${buyer.state}` : ''}</p>}
            </div>
          </div>
        ) : (
          <div data-print-section="buyer" className={`print-buyer-box print-avoid-break p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> BILLED TO / RECIPIENT DETAILS
              </span>
              {buyer.state && (
                <span className="text-[10px] font-mono opacity-70">
                  State: {buyer.state}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  {buyer.name || 'Valued Studio Partner'}
                </h2>
                {buyer.ownerName && (
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Attn: <strong className="font-semibold">{buyer.ownerName}</strong>
                  </p>
                )}
                {buyer.address && (
                  <p className="text-[11px] opacity-70 mt-0.5 leading-relaxed">
                    {buyer.address}
                  </p>
                )}
              </div>

              <div className="font-mono text-[11px] space-y-1 sm:text-right">
                {buyer.pan && (
                  <p className="opacity-80">
                    <span className="text-amber-400 font-semibold">PAN:</span> {buyer.pan}
                  </p>
                )}
                {buyer.phone && (
                  <p className="opacity-80">
                    Ph: {buyer.phone} {buyer.email ? `• ${buyer.email}` : ''}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= 3. ITEMIZED SERVICES TABLE ================= */}
        <div data-print-section="items" className="space-y-2 print-avoid-break">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="text-amber-500">🎞️</span> 1. PROJECT SERVICES & DELIVERABLES
            </h3>
            <span className="text-[11px] font-mono opacity-70">
              {items.length} {items.length === 1 ? 'Item' : 'Items'} Selected
            </span>
          </div>

          <div className="rounded-2xl border border-slate-800/80 overflow-hidden shadow-sm">
            <div
              className={`print-table-header px-4 sm:px-5 py-3 grid grid-cols-[1fr_70px_110px_110px] sm:grid-cols-[1fr_80px_120px_120px] items-center font-extrabold text-[11px] uppercase tracking-wider ${
                isDark
                  ? 'bg-[#0b1320] text-slate-200 border-b border-slate-800'
                  : 'bg-[#0b1320] text-white border-b border-slate-800'
              }`}
            >
              <span className="text-left">PROJECT / EVENT NAME</span>
              <span className="text-center font-mono">QTY</span>
              <span className="text-right">UNIT RATE</span>
              <span className="text-right">TOTAL (₹)</span>
            </div>

            <div className={`divide-y ${isDark ? 'divide-slate-800 bg-slate-900/40' : 'divide-slate-200 bg-white'}`}>
              {items.length === 0 ? (
                <div className="py-6 text-center text-xs opacity-50 italic">
                  No projects selected for this invoice
                </div>
              ) : (
                items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="print-table-row print-item-row print-avoid-break grid grid-cols-[1fr_70px_110px_110px] sm:grid-cols-[1fr_80px_120px_120px] items-center py-3 px-4 sm:px-5 text-xs hover:bg-slate-500/[0.03] transition-colors"
                  >
                    <div className="text-left pr-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-semibold text-xs leading-snug">
                          {item.description}
                        </p>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
                          SAC {item.sacCode || '998314'}
                        </span>
                      </div>
                      {item.subDescription && (
                        <p className="text-[10px] opacity-60 mt-0.5 font-normal">
                          {item.subDescription}
                        </p>
                      )}
                    </div>
                    <span className="text-center font-mono font-semibold">
                      {item.quantity}
                    </span>
                    <span className="text-right font-mono tabular-nums opacity-90">
                      ₹{item.unitRate.toLocaleString('en-IN')}
                    </span>
                    <span className="text-right font-mono font-bold text-amber-500 tabular-nums">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ================= 2. ADVANCE PAYMENTS & ADJUSTMENTS ================= */}
        <div data-print-section="advances" className="space-y-2 pt-2 print-avoid-break">
          {/* Header Title & Verified Receipts badge */}
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-mono flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <IndianRupee className="w-4 h-4 text-emerald-500" /> 2. ADVANCE PAYMENTS & ADJUSTMENTS
            </h3>
            <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border ${
              activeAdvanceList.length > 0
                ? 'bg-[#dcfce7] text-[#15803d] border-[#86efac]'
                : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
            }`}>
              {activeAdvanceList.length > 0 ? `Verified Receipts (${activeAdvanceList.length})` : 'Zero Advance / Due in Full'}
            </span>
          </div>

          {/* Advance Table Container */}
          <div className="rounded-2xl border border-[#062c22]/20 dark:border-emerald-500/20 overflow-hidden shadow-sm">
            {/* Dark Green Table Header */}
            <div className="print-table-header grid grid-cols-[100px_1fr_160px_120px] sm:grid-cols-[120px_1fr_180px_140px] px-4 sm:px-5 py-3 bg-[#062c22] text-white font-bold text-xs uppercase tracking-wider">
              <span>DATE</span>
              <span>PAID BY / RECEIVED FROM</span>
              <span className="text-center">PAYMENT MODE</span>
              <span className="text-right">ADVANCE (₹)</span>
            </div>

            {/* Transactions List Rows */}
            <div className={`divide-y ${isDark ? 'divide-slate-800 bg-[#0f172a]' : 'divide-slate-100 bg-white'}`}>
              {activeAdvanceList.length === 0 ? (
                <div className="py-4 px-5 text-center text-xs opacity-60 italic text-slate-400">
                  No advance payment received for this bill • Full payment due on project delivery
                </div>
              ) : (
                activeAdvanceList.map((adv, idx) => {
                  const m = (adv.paymentMode || 'UPI').toLowerCase();
                  const isCash = m.includes('cash');
                  const isCheque = m.includes('cheque');

                  // Format date nicely: e.g., "13 Jul 2026"
                  let displayDate = adv.date || issuedDate;
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
                      className={`print-table-row print-avoid-break grid grid-cols-[100px_1fr_160px_120px] sm:grid-cols-[120px_1fr_180px_140px] items-center py-3.5 px-4 sm:px-5 text-xs transition-colors ${
                        isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-emerald-50/30'
                      }`}
                    >
                      {/* DATE (Kis Date ko mila) */}
                      <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {displayDate}
                      </span>

                      {/* PAID BY (Kisne diya) */}
                      <div className="pr-2">
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug">
                          {adv.paidBy || buyer.ownerName || buyer.name || 'Client'}
                        </p>
                        {adv.notes && (
                          <p className="text-[10px] opacity-60 font-normal truncate max-w-[220px]">
                            {adv.notes}
                          </p>
                        )}
                        {adv.referenceNo && (
                          <p className="text-[10px] text-slate-400 font-mono">
                            Ref / UTR: {adv.referenceNo}
                          </p>
                        )}
                      </div>

                      {/* MODE OF PAYMENT */}
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
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e0f2fe] border border-[#7dd3fc] text-[#0369a1] font-bold text-xs shadow-xs">
                            <span>💳</span> {adv.paymentMode || 'UPI / Online'}
                          </span>
                        )}
                      </div>

                      {/* ADVANCE AMOUNT (Kitna advance mila) */}
                      <span className="text-right font-mono font-bold text-sm sm:text-base text-[#059669] dark:text-emerald-400 tabular-nums">
                        -₹{adv.amount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Summary Bar */}
            {activeAdvanceList.length > 0 && (
              <div className="print-advance-summary print-avoid-break px-4 sm:px-5 py-3 bg-[#062c22] text-white flex flex-wrap items-center justify-between gap-3 font-mono border-t border-[#062c22]">
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
                          <span>💵</span> Cash: <span className="font-mono">₹{data.total.toLocaleString('en-IN')}</span>
                        </div>
                      );
                    }
                    return (
                      <div 
                        key={mode}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c4a6e] border border-[#0284c7] text-[#bae6fd] font-bold text-xs"
                      >
                        <span>💳</span> {mode}: <span className="font-mono">₹{data.total.toLocaleString('en-IN')}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Right Total Adjusted */}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <span className="text-emerald-200 font-medium">Total Advance Adjusted:</span>
                  <span className="font-black text-sm sm:text-base text-[#facc15] font-mono tracking-wide">
                    -₹{advanceTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= 4. GST BREAKDOWN & FINANCIAL SUMMARY ================= */}
        <div data-print-section="totals" className="print-calc-box print-avoid-break grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
          {/* Left: GST Tax Matrix Breakdown & Amount in Words */}
          <div className="lg:col-span-7 space-y-3">
            {gstEnabled ? (
              showTaxMatrix ? (
                <div className={`p-4 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center border-b border-white/10 pb-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      GST TAX BREAKDOWN MATRIX ({gstTaxType === 'intra' ? 'CGST + SGST' : 'IGST'})
                    </span>
                    <span className="text-[10px] font-mono opacity-80">
                      SAC: 998314 @ {gstRate}%
                    </span>
                  </div>

                  <div className="grid grid-cols-4 text-center text-[10px] font-mono py-1 border-b border-white/5 opacity-70">
                    <span>TAXABLE VAL</span>
                    {gstTaxType === 'intra' ? (
                      <>
                        <span>CGST ({(gstRate / 2)}%)</span>
                        <span>SGST ({(gstRate / 2)}%)</span>
                      </>
                    ) : (
                      <span className="col-span-2">IGST ({gstRate}%)</span>
                    )}
                    <span>TOTAL TAX</span>
                  </div>

                  <div className="grid grid-cols-4 text-center text-xs font-mono font-semibold py-2">
                    <span>₹{taxableAmount.toLocaleString('en-IN')}</span>
                    {gstTaxType === 'intra' ? (
                      <>
                        <span className="text-amber-300">₹{cgstAmount.toLocaleString('en-IN')}</span>
                        <span className="text-amber-300">₹{sgstAmount.toLocaleString('en-IN')}</span>
                      </>
                    ) : (
                      <span className="col-span-2 text-amber-300">₹{igstAmount.toLocaleString('en-IN')}</span>
                    )}
                    <span className="text-emerald-400 font-bold">₹{totalGstAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ) : null
            ) : (
              <div className={`p-3.5 rounded-2xl border text-xs opacity-75 ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <p className="font-semibold text-amber-400 text-[11px]">BILL OF SUPPLY / NON-GST INVOICE</p>
                <p className="text-[10px] opacity-70 mt-0.5">Composition / Exempted Media Post-Production Services.</p>
              </div>
            )}

            {/* Amount In Words */}
            <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-white/[0.02] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                AMOUNT IN WORDS:
              </span>
              <p className="text-xs font-bold text-amber-400 italic">
                {amountInWords}
              </p>
            </div>
          </div>

          {/* Right: Unified Calculation Block (Sub Total + GST + Adjustments + Final Balance) */}
          <div className="lg:col-span-5">
            <div className={`rounded-2xl p-4 sm:p-5 space-y-2.5 border ${isDark ? 'bg-white/[0.04] border-white/15' : 'bg-slate-100 border-slate-300'}`}>
              <div className="flex justify-between items-center text-xs opacity-85">
                <span>Taxable Sub Total:</span>
                <span className="font-mono font-semibold tabular-nums">
                  ₹{taxableAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {gstEnabled && (
                <>
                  {gstTaxType === 'intra' ? (
                    <>
                      <div className="flex justify-between items-center text-xs opacity-80">
                        <span>CGST ({gstRate / 2}%):</span>
                        <span className="font-mono text-amber-300 tabular-nums">
                          + ₹{cgstAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs opacity-80">
                        <span>SGST ({gstRate / 2}%):</span>
                        <span className="font-mono text-amber-300 tabular-nums">
                          + ₹{sgstAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center text-xs opacity-80">
                      <span>IGST ({gstRate}%):</span>
                      <span className="font-mono text-amber-300 tabular-nums">
                        + ₹{igstAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-white/10">
                    <span>Total with GST:</span>
                    <span className="font-mono text-emerald-400 tabular-nums">
                      ₹{(taxableAmount + totalGstAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </>
              )}

              {previousBalance > 0 && (
                <div className="flex justify-between items-center text-xs text-amber-400">
                  <span>Previous Balance:</span>
                  <span className="font-mono tabular-nums">
                    + ₹{previousBalance.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {advanceTotal > 0 && (
                <div className="flex justify-between items-center text-xs text-emerald-400 font-medium">
                  <span>Advance Received:</span>
                  <span className="font-mono tabular-nums">
                    - ₹{advanceTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              {discount > 0 && (
                <div className="flex justify-between items-center text-xs text-rose-400">
                  <span>Special Discount:</span>
                  <span className="font-mono tabular-nums">
                    - ₹{discount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="border-t border-white/20 pt-2" />

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-extrabold text-xs uppercase tracking-wider block">
                    {advanceTotal > 0 ? 'BALANCE DUE' : 'NET TOTAL'}
                  </span>
                  <span className="text-[10px] font-mono opacity-60">
                    {totalPayable === 0 ? 'PAID IN FULL' : 'PAYABLE NOW'}
                  </span>
                </div>
                <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono tabular-nums">
                  ₹{totalPayable.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 5. PAYMENT METHOD & PROMINENT QR CODE ================= */}
        <div data-print-section="banking" className={`print-qr-box print-avoid-break p-4 sm:p-5 rounded-2xl border ${isDark ? 'bg-white/[0.03] border-white/15' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex flex-wrap justify-between items-center border-b border-white/10 pb-2.5 mb-3 gap-2">
            <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-1.5 text-amber-400 font-mono">
              <CreditCard className="w-4 h-4 text-amber-400" /> BANK REMITTANCE & INSTANT CLIENT PAYMENT
            </span>
            <div className="flex items-center gap-2">
              {advanceTotal > 0 && (
                <span className="text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Advance Adjusted: ₹{advanceTotal.toLocaleString('en-IN')}
                </span>
              )}
              {qrCodeUrl && (
                <span className="text-[10px] text-amber-300 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-amber-400" /> Instant QR Scan
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            {/* Left: Bank & Direct Account Details */}
            <div className="space-y-3 text-xs w-full flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 font-mono p-3 rounded-xl bg-black/20 border border-white/5">
                  <p className="text-[11px]">
                    <span className="opacity-60 block text-[10px] uppercase tracking-wider">UPI Virtual Payment Address</span> 
                    <strong className="text-amber-400 font-bold text-xs tracking-wide">{bankDetails.upiId}</strong>
                  </p>
                  <p className="text-[11px] pt-1">
                    <span className="opacity-60 block text-[10px] uppercase tracking-wider">Account Holder Name</span> 
                    <strong className="font-sans text-white text-xs">{bankDetails.accountHolder}</strong>
                  </p>
                </div>
                <div className="space-y-1.5 font-mono p-3 rounded-xl bg-black/20 border border-white/5">
                  <p className="text-[11px]">
                    <span className="opacity-60 block text-[10px] uppercase tracking-wider">Beneficiary Bank</span> 
                    <strong className="text-white text-xs">{bankDetails.bankName}</strong>
                  </p>
                  <p className="text-[11px] pt-1">
                    <span className="opacity-60 block text-[10px] uppercase tracking-wider">Account No & IFSC Code</span> 
                    <strong className="text-white text-xs">{bankDetails.accountNumber}</strong> • <strong className="text-amber-300">{bankDetails.ifscCode}</strong>
                  </p>
                </div>
              </div>

              {/* Supported UPI ecosystem indicators */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono opacity-70 pt-0.5">
                <span className="text-[9px] uppercase font-bold text-slate-400">Supported:</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">GPay</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">PhonePe</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">Paytm</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">BHIM</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">Cred</span>
                <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300 font-semibold">NetBanking</span>
              </div>
            </div>

            {/* Right: Prominently Positioned QR Code Scan Card */}
            {qrCodeUrl && (
              <div className="shrink-0 flex flex-col items-center p-3 sm:p-3.5 bg-white text-slate-900 rounded-2xl shadow-xl border-2 border-amber-400/50 relative overflow-hidden group print:shadow-none print:border-slate-300">
                <div className="w-full flex items-center justify-between gap-2 pb-1.5 border-b border-slate-200">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-800 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    SCAN & PAY INSTANT
                  </span>
                  <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full border border-emerald-300">
                    VERIFIED UPI
                  </span>
                </div>

                <div className="my-1.5 p-1.5 bg-white rounded-xl shadow-inner border border-slate-200 flex items-center justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="Scan UPI / Banking QR Code" 
                    className={`${qrCodeSize === 'prominent' ? 'w-28 h-28 sm:w-32 sm:h-32' : 'w-22 h-22 sm:w-24 sm:h-24'} object-contain block`}
                    style={{ imageRendering: '-webkit-optimize-contrast' }}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="w-full text-center pt-1 border-t border-slate-100 space-y-0.5">
                  <span className="text-[11px] font-black text-slate-950 font-mono block leading-tight">
                    {qrCodeLabel || (totalPayable > 0 ? `Pay: ₹${totalPayable.toLocaleString('en-IN')}` : 'Scan with Any UPI App')}
                  </span>
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight block">
                    GPay • PhonePe • Paytm • BHIM • Cred
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================= 6. TERMS & CONDITIONS & SIGNATURE ================= */}
        <div data-print-section="terms" className="print-terms-box print-avoid-break flex flex-col sm:flex-row justify-between items-end gap-4 pt-2 text-[11px] border-t border-white/10">
          <div className="space-y-1 max-w-md">
            <span className="font-bold uppercase tracking-wider text-[10px] opacity-70">
              TERMS & CONDITIONS:
            </span>
            <p className="text-[10px] opacity-80 leading-relaxed">
              {termsBadgeText || 'All deliverables released via Google Drive upon full settlement.'}
            </p>
          </div>

          <div className="text-right shrink-0 space-y-1 flex flex-col items-end min-w-[150px]">
            <p className="text-[10px] font-semibold text-amber-400">For {supplier.name}</p>
            
            {/* Signature Area (Digital Drawn / Uploaded or Space) */}
            <div className="h-12 w-36 flex items-center justify-end my-0.5 relative">
              {showSignature && signatureImageUrl ? (
                <div className="relative group/sig">
                  <img 
                    src={signatureImageUrl} 
                    alt="Digital Authorized Signature" 
                    className="max-h-12 max-w-36 object-contain block filter drop-shadow-xs"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                  />
                  {signatureSignatoryName && (
                    <span className="sr-only">{signatureSignatoryName}</span>
                  )}
                </div>
              ) : (
                <div className="h-7" />
              )}
            </div>

            <div className="w-full border-t border-white/20 pt-1 text-right">
              {signatureSignatoryName && showSignature && signatureImageUrl && (
                <p className="text-[9px] font-mono font-medium opacity-80 leading-none mb-0.5">
                  {signatureSignatoryName}
                </p>
              )}
              <p className="text-[10px] font-bold uppercase tracking-wider">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
