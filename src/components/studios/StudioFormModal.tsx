import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Upload, 
  Image as ImageIcon, 
  X, 
  Check, 
  IndianRupee, 
  Crown, 
  Sparkles,
  QrCode
} from 'lucide-react';
import { Studio } from '../../types';
import { compressImage } from '../../utils';
import Logo from '../Logo';

interface StudioFormModalProps {
  isOpen: boolean;
  editingStudio: Studio | null;
  onClose: () => void;
  onSave: (studioData: Omit<Studio, 'createdAt'>, isEdit: boolean) => Promise<void>;
  onToast: (title: string, desc: string) => void;
}

export const StudioFormModal: React.FC<StudioFormModalProps> = ({
  isOpen,
  editingStudio,
  onClose,
  onSave,
  onToast
}) => {
  const [name, setName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [tier, setTier] = useState<'standard' | 'premium' | 'elite'>('standard');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (editingStudio) {
      setName(editingStudio.name || '');
      setOwnerName(editingStudio.ownerName || '');
      setPhone(editingStudio.phone || '');
      setEmail(editingStudio.email || '');
      setAddress(editingStudio.address || '');
      setCity(editingStudio.city || '');
      setGstNumber(editingStudio.gstNumber || '');
      setNotes(editingStudio.notes || '');
      setLogoUrl(editingStudio.logoUrl || '');
      setUpiId(editingStudio.upiId || '');
      setPaymentLink(editingStudio.paymentLink || '');
      setTier(editingStudio.tier || 'standard');
    } else {
      setName('');
      setOwnerName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCity('');
      setGstNumber('');
      setNotes('');
      setLogoUrl('');
      setUpiId('');
      setPaymentLink('');
      setTier('standard');
    }
  }, [editingStudio, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !ownerName.trim()) {
      alert("Studio Name and Owner Name are required.");
      return;
    }

    setIsSaving(true);
    try {
      let finalLogoUrl = logoUrl;
      if (finalLogoUrl && finalLogoUrl.startsWith('data:image/')) {
        finalLogoUrl = await compressImage(finalLogoUrl, 400, 400, 0.7);
      }

      const studioId = editingStudio ? editingStudio.id : `studio-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

      await onSave({
        id: studioId,
        name: name.trim(),
        ownerName: ownerName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim() || undefined,
        gstNumber: gstNumber.trim().toUpperCase() || undefined,
        notes: notes.trim() || undefined,
        logoUrl: finalLogoUrl || undefined,
        upiId: upiId.trim() || undefined,
        paymentLink: paymentLink.trim() || undefined,
        tier
      }, !!editingStudio);

      onToast(
        editingStudio ? "Studio Profile Updated" : "Studio Partner Registered",
        `${name} profile saved successfully.`
      );
      onClose();
    } catch (err: any) {
      console.error("Error saving studio:", err);
      alert("Failed to save Studio: " + (err?.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />

        <motion.div
          id="studio-form-modal"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="inline-block w-full max-w-4xl p-6 sm:p-8 my-8 overflow-hidden text-left align-middle transition-all transform rounded-3xl bg-charcoal-900 border border-gold-500/30 shadow-2xl relative z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center text-gold-400">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {editingStudio ? `Edit Profile: ${editingStudio.name}` : 'Register New Studio Partner'}
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Wedding Studio Agency & B2B Pipeline Partner
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-charcoal-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Form Input Columns (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Name & Owner */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gold-400 uppercase tracking-wider mb-1">
                      Studio / Agency Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Wedding By KK"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gold-400 uppercase tracking-wider mb-1">
                      Owner / Lead Contact *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Krishna Kumar"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs font-semibold text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone, Email & City */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="studio@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      City / Hub
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mumbai, Jaipur"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Office Address */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                    Office / Studio Address
                  </label>
                  <input
                    type="text"
                    placeholder="Full studio office address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>

                {/* GST & UPI ID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-gold-400 uppercase tracking-wider mb-1">
                      GSTIN Number (Optional)
                    </label>
                    <input
                      type="text"
                      maxLength={15}
                      placeholder="27ABCDE1234F1Z5"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                      className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white font-mono focus:outline-none uppercase placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-emerald-400 uppercase tracking-wider mb-1">
                      Studio UPI ID (For Settlement)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. studio@okhdfcbank"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white font-mono focus:outline-none placeholder-gray-600"
                    />
                  </div>
                </div>

                {/* Payment Link & Tier */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Online Payment Link (Razorpay / Web)
                    </label>
                    <input
                      type="text"
                      placeholder="https://razorpay.me/@studio"
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white font-mono focus:outline-none placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                      Partnership Tier
                    </label>
                    <select
                      value={tier}
                      onChange={(e) => setTier(e.target.value as any)}
                      className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 rounded-xl text-xs text-white focus:outline-none font-mono"
                    >
                      <option value="standard">Standard Partner</option>
                      <option value="premium">Premium Partner</option>
                      <option value="elite">Elite VIP Partner</option>
                    </select>
                  </div>
                </div>

                {/* Logo Upload / URL */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1.5">
                    Studio Brand Logo
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-charcoal-950/80 border border-white/10 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl bg-charcoal-900 border border-gold-500/20 flex items-center justify-center overflow-hidden shrink-0">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <Logo size={28} variant="gold" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <label className="cursor-pointer px-3 py-1 bg-luxury-green-800 hover:bg-luxury-green-700 text-gold-300 border border-gold-500/30 rounded-lg text-[10px] font-mono font-bold tracking-wider transition-all">
                          UPLOAD LOGO
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = async () => {
                                  if (typeof reader.result === 'string') {
                                    const compressed = await compressImage(reader.result, 400, 400, 0.7);
                                    setLogoUrl(compressed);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                        {logoUrl && (
                          <button
                            type="button"
                            onClick={() => setLogoUrl('')}
                            className="px-2.5 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[10px] font-mono"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or paste external image URL..."
                        value={logoUrl.startsWith('data:') ? '' : logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        className="w-full px-2.5 py-1 bg-charcoal-900 border border-white/5 rounded-lg text-[10px] text-gray-300 font-mono focus:outline-none placeholder-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider mb-1">
                    Internal Partnership Notes & Deliverables Specs
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Requires 4K RAW XML export, color grade in Rec.709, priority weekend turnaround."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-charcoal-950/80 border border-white/10 focus:border-gold-400 rounded-xl text-xs text-white focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Live Interactive Preview Card (5 Cols) */}
              <div className="lg:col-span-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-gold-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-gold-400" />
                    Real-time Card Preview
                  </span>

                  {/* Preview Card */}
                  <div className="p-5 rounded-3xl bg-charcoal-950 border border-gold-500/30 relative overflow-hidden shadow-xl space-y-3">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-gold-500/10 rounded-full blur-2xl pointer-events-none" />

                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-charcoal-900 border border-gold-500/20 p-0.5 flex items-center justify-center overflow-hidden shrink-0">
                          {logoUrl ? (
                            <img src={logoUrl} alt="" className="w-full h-full object-cover rounded-[13px]" />
                          ) : (
                            <div className="w-full h-full rounded-[13px] bg-gradient-to-br from-charcoal-800 to-luxury-green-950 flex items-center justify-center text-gold-400 font-bold font-display text-base">
                              {(name || 'ST').substring(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white font-display">
                              {name || 'Studio Partner Name'}
                            </h4>
                            {tier === 'elite' && <Crown className="w-3.5 h-3.5 text-gold-400" />}
                          </div>
                          <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3 text-gold-400" />
                            <span>{ownerName || 'Owner Name'}</span>
                          </p>
                        </div>
                      </div>

                      <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-400 border border-gold-500/20 uppercase font-bold">
                        {tier}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px] text-gray-300 pt-2 border-t border-white/5">
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3 h-3 text-gold-400" />
                        <span>{phone || '+91 00000 00000'}</span>
                      </p>
                      {email && (
                        <p className="flex items-center gap-1.5 text-gray-400">
                          <Mail className="w-3 h-3 text-gray-500" />
                          <span className="truncate">{email}</span>
                        </p>
                      )}
                      {(city || address) && (
                        <p className="flex items-center gap-1.5 text-gray-400 truncate">
                          <MapPin className="w-3 h-3 text-gray-500 shrink-0" />
                          <span className="truncate">{city ? `${city} • ` : ''}{address || 'Address'}</span>
                        </p>
                      )}
                    </div>

                    {(gstNumber || upiId) && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[10px]">
                        {gstNumber && (
                          <span className="px-2 py-0.5 rounded bg-charcoal-900 border border-white/10 text-gray-300">
                            <span className="text-gold-400 font-bold">GST:</span> {gstNumber}
                          </span>
                        )}
                        {upiId && (
                          <span className="px-2 py-0.5 rounded bg-charcoal-900 border border-white/10 text-emerald-400">
                            <span className="font-bold">UPI:</span> {upiId}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="p-3 bg-charcoal-900/60 rounded-2xl border border-white/5 grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div>
                        <span className="text-gray-500 block">ENGAGEMENTS</span>
                        <span className="text-white font-bold text-xs">Live Pipeline</span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-500 block">SETTLEMENT</span>
                        <span className="text-emerald-400 font-bold text-xs">Integrated</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Footer Action Buttons */}
                <div className="flex items-center justify-end space-x-3 pt-6 border-t border-white/10 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-6 py-2.5 bg-gold-500 hover:bg-gold-400 text-charcoal-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isSaving ? 'Saving Profile...' : editingStudio ? 'Save Profile' : 'Register Studio'}</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};
