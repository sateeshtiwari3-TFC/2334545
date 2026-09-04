import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ArrowRight, 
  IndianRupee, 
  Calendar, 
  Tag, 
  User, 
  CreditCard, 
  Loader2,
  RefreshCw,
  Copy
} from 'lucide-react';
import { scanReceiptWithGemini } from '../utils/categoryPredictor';
import { Project } from '../types';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtractedExpense: (expense: {
    title: string;
    payee: string;
    amount: number;
    category: string;
    date: string;
    paymentMode: string;
    projectId?: string;
  }) => void;
  projects?: Project[];
}

const SAMPLE_RECEIPTS = [
  {
    label: 'Hard Disk Invoice',
    text: `Amazon.in Order # 402-9182391-8812901
Sold by: Appario Retail Private Ltd
Date: 02 August 2026
Item: SanDisk Extreme 2TB Portable NVMe External SSD USB-C
Quantity: 1
Item Price: INR 14,999.00
Payment Method: HDFC Bank Credit Card (Paid)`
  },
  {
    label: 'Ola / Uber Outstation',
    text: `Uber India Trip Receipt
Trip Date: 03 Aug 2026, 06:30 AM
Pickup: Studio Studio Mumbai
Drop: Udaipur Palace Wedding Resort
Trip Fare: Rs. 4,850.00
Toll & Parking: Rs. 450.00
Total Paid via UPI: Rs. 5,300.00`
  },
  {
    label: 'Freelancer Editor Cut',
    text: `Payment Advice to Vansh Sharma (Cinematic Teaser Editor)
Project: Rohan & Ananya Palace Wedding Film
Date: 01 August 2026
Editor Remuneration: ₹18,000.00
Transaction Ref: UPI/260801/55219904
Status: Successfully Transferred`
  }
];

export default function ReceiptScannerModal({
  isOpen,
  onClose,
  onApplyExtractedExpense,
  projects = []
}: ReceiptScannerModalProps) {
  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [receiptText, setReceiptText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Extracted Result state
  const [extractedData, setExtractedData] = useState<{
    amount: number;
    date: string;
    category: string;
    title: string;
    payee: string;
    paymentMode: string;
    confidence: string;
    notes?: string;
    projectId?: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Please upload a valid image file (PNG, JPG, or WEBP).');
      return;
    }

    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
      setScanError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleScanReceipt = async () => {
    if (inputMode === 'text' && !receiptText.trim()) {
      setScanError('Please paste receipt text or select a sample receipt.');
      return;
    }
    if (inputMode === 'image' && !selectedImage) {
      setScanError('Please choose or drag-and-drop a receipt image.');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    const res = await scanReceiptWithGemini({
      text: inputMode === 'text' ? receiptText : undefined,
      imageBase64: inputMode === 'image' ? selectedImage! : undefined,
      mimeType: imageMimeType
    });

    setIsScanning(false);

    if (res.success && res.data) {
      setExtractedData({
        amount: Number(res.data.amount) || 0,
        date: res.data.date || new Date().toISOString().split('T')[0],
        category: res.data.category || 'Miscellaneous',
        title: res.data.title || 'Studio Expense',
        payee: res.data.payee || 'Vendor / Merchant',
        paymentMode: res.data.paymentMode || 'UPI',
        confidence: res.data.confidence || 'High',
        notes: res.data.notes || ''
      });
    } else {
      setScanError(res.error || 'Could not parse receipt. Please verify the input and try again.');
    }
  };

  const handleApply = () => {
    if (!extractedData) return;
    onApplyExtractedExpense({
      title: extractedData.title,
      payee: extractedData.payee,
      amount: extractedData.amount,
      category: extractedData.category,
      date: extractedData.date,
      paymentMode: extractedData.paymentMode,
      projectId: extractedData.projectId
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b140f] border border-[#1f3629] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp text-slate-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#182b20] flex items-center justify-between bg-[#0e1a13]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white font-display">Gemini AI Receipt Scanner</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                  Multimodal OCR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically extract amount, date, category, and payee from bills, images, or pasted text
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Input Mode Toggle */}
          <div className="flex bg-[#080d0a] p-1 rounded-2xl border border-[#1b2b20]">
            <button
              type="button"
              onClick={() => { setInputMode('text'); setScanError(null); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'text' 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Paste Text / SMS Receipt</span>
            </button>
            <button
              type="button"
              onClick={() => { setInputMode('image'); setScanError(null); }}
              className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'image' 
                  ? 'bg-amber-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Upload Bill / Image</span>
            </button>
          </div>

          {/* Mode 1: Text Paste */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              {/* Quick Sample Receipts */}
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Paste Receipt, SMS, or Invoice Text:</label>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] text-slate-500 font-mono">Samples:</span>
                  {SAMPLE_RECEIPTS.map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setReceiptText(sample.text)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#14231a] hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-[#1f3629] transition-colors cursor-pointer"
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="relative">
                <textarea
                  rows={5}
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  placeholder="Paste invoice summary, bank SMS, GST receipt details, Amazon/Flipkart order confirmation, Uber trip receipt..."
                  className="w-full bg-[#080e0a] border border-[#1f3629] focus:border-amber-500 rounded-2xl p-3.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono resize-none leading-relaxed"
                />
                {receiptText && (
                  <button
                    type="button"
                    onClick={() => setReceiptText('')}
                    className="absolute right-3 top-3 text-[10px] text-slate-500 hover:text-slate-300 bg-[#0e1a13] px-2 py-1 rounded-md border border-white/5"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Mode 2: Image Upload */}
          {inputMode === 'image' && (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Upload Receipt Photo or Screenshot:</label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleImageUpload(e.target.files[0]);
                  }
                }}
              />

              {selectedImage ? (
                <div className="relative rounded-2xl border border-[#1f3629] bg-[#080e0a] p-3 flex items-center space-x-4">
                  <img
                    src={selectedImage}
                    alt="Receipt Preview"
                    className="w-24 h-24 object-cover rounded-xl border border-white/10"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white">Receipt Image Selected</p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Ready for Gemini Vision scan</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-2 text-[11px] font-semibold text-amber-400 hover:underline cursor-pointer"
                    >
                      Change Image
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files?.[0]) {
                      handleImageUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-[#1f3629] hover:border-amber-500/50 bg-[#080e0a]/60 hover:bg-[#080e0a] rounded-2xl p-8 text-center cursor-pointer transition-all group"
                >
                  <Upload className="w-8 h-8 text-amber-500/70 group-hover:text-amber-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-xs font-bold text-slate-200">Click or drag & drop receipt image here</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Supports JPG, PNG, WEBP</p>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {scanError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleScanReceipt}
            disabled={isScanning || (inputMode === 'text' ? !receiptText.trim() : !selectedImage)}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer font-display"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Scanning Receipt with Gemini 3.7 Flash...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Scan & Extract Financial Details</span>
              </>
            )}
          </button>

          {/* Extracted Structured Result Preview */}
          {extractedData && (
            <div className="mt-4 p-4 rounded-2xl bg-[#080e0a] border border-amber-500/30 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-[#182b20] pb-2.5">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Extracted Expense Information</span>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Confidence: {extractedData.confidence || 'High'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Title */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Expense Title / Item</label>
                  <input
                    type="text"
                    value={extractedData.title}
                    onChange={(e) => setExtractedData({ ...extractedData, title: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-1.5 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Payee */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Payee / Merchant</label>
                  <input
                    type="text"
                    value={extractedData.payee}
                    onChange={(e) => setExtractedData({ ...extractedData, payee: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-1.5 text-white text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Amount (₹)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={extractedData.amount}
                      onChange={(e) => setExtractedData({ ...extractedData, amount: Number(e.target.value) || 0 })}
                      className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-1.5 text-amber-400 font-bold text-sm focus:ring-1 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Smart Predicted Category</label>
                  <select
                    value={extractedData.category}
                    onChange={(e) => setExtractedData({ ...extractedData, category: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="Equipment / Hard Disk">Equipment / Hard Disk</option>
                    <option value="Travel & Conveyance">Travel & Conveyance</option>
                    <option value="Editor Payouts">Editor Payouts</option>
                    <option value="Office & Rent">Office & Rent</option>
                    <option value="Software / Tools">Software / Tools</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Date</label>
                  <input
                    type="date"
                    value={extractedData.date}
                    onChange={(e) => setExtractedData({ ...extractedData, date: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">Payment Mode</label>
                  <select
                    value={extractedData.paymentMode}
                    onChange={(e) => setExtractedData({ ...extractedData, paymentMode: e.target.value })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>

              {/* Optional Project Association */}
              {projects.length > 0 && (
                <div>
                  <label className="text-slate-400 text-[10px] uppercase font-mono block mb-1">
                    Link to Project (Optional)
                  </label>
                  <select
                    value={extractedData.projectId || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, projectId: e.target.value || undefined })}
                    className="w-full bg-[#111f17] border border-[#1f3629] rounded-xl px-3 py-1.5 text-white text-xs focus:ring-1 focus:ring-amber-500 outline-none cursor-pointer"
                  >
                    <option value="">-- General Studio Expense (Not linked to specific wedding) --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id} • {p.projectName || p.coupleName} ({p.studioName})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Import Button */}
              <button
                type="button"
                onClick={handleApply}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer"
              >
                <span>Populate & Log Expense Form</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#0e1a13] border-t border-[#182b20] flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">Powered by Google Gemini 3.7 Flash</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-slate-300 hover:text-white bg-[#14231a] hover:bg-[#1a2e23] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
