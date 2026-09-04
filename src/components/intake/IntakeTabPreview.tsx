import React from 'react';
import { Upload, Calendar, Clock, Film, CheckCircle2, User, Building2, MapPin, IndianRupee, HardDrive, Bookmark, Sparkles, Heart } from 'lucide-react';
import { Studio, Editor, ProjectStatus, ProjectPriority, UserRole } from '../../types';

interface IntakeTabPreviewProps {
  couplePhoto: string;
  setCouplePhoto: (val: string) => void;
  defaultCovers: { name: string; url: string }[];
  projectName: string;
  groomName: string;
  brideName: string;
  eventType: string;
  studioId: string;
  studios: Studio[];
  assignedEditorId: string;
  editors: Editor[];
  isSplitProject: boolean;
  secondEditorId: string;
  firstEditorShare: number;
  secondEditorShare: number;
  shootDate: string;
  deliveryDate: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  selectedFunctions: string[];
  customMilestones: { id: string; label: string; completed: boolean }[];
  projectAmount: number;
  editorPayment: number;
  advancePayment: number;
  calculatedRemainingBalance: number;
  estimatedProfitMargin: number;
  hardDiskName: string;
  dataSize: string;
  location: string;
  venue: string;
  clientPhone: string;
  userRole: UserRole;
  workflowStages: { id: ProjectStatus; label: string; color: string; bg: string }[];
  compressImage: (base64Str: string) => Promise<string>;
  onResetForm: () => void;
  onOpenSaveModal: () => void;
  isSubmitting: boolean;
}

export default function IntakeTabPreview({
  couplePhoto,
  setCouplePhoto,
  defaultCovers,
  projectName,
  groomName,
  brideName,
  eventType,
  studioId,
  studios,
  assignedEditorId,
  editors,
  isSplitProject,
  secondEditorId,
  firstEditorShare,
  secondEditorShare,
  shootDate,
  deliveryDate,
  status,
  priority,
  selectedFunctions,
  customMilestones,
  projectAmount,
  editorPayment,
  advancePayment,
  calculatedRemainingBalance,
  estimatedProfitMargin,
  hardDiskName,
  dataSize,
  location,
  venue,
  clientPhone,
  userRole,
  workflowStages,
  compressImage,
  onResetForm,
  onOpenSaveModal,
  isSubmitting
}: IntakeTabPreviewProps) {

  const studioName = studios.find(s => s.id === studioId)?.name || 'Direct Client';
  const leadEditorName = editors.find(e => e.id === assignedEditorId)?.name || 'Unassigned';
  const secondEditorName = isSplitProject ? (editors.find(e => e.id === secondEditorId)?.name || 'Unassigned') : null;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
            🎴
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">Step 6: Poster Cover & Final Summary Review</h4>
            <p className="text-xs text-gray-400 font-mono">Upload high-res poster artwork, review full project specifications, and confirm registration.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT: Cover Image Selector & Live Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Photo Presets & Upload */}
          <div className="p-5 bg-charcoal-900/60 rounded-2xl border border-white/10 space-y-4">
            <h5 className="text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">
              Project Cover Poster
            </h5>

            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 shrink-0 rounded-2xl bg-charcoal-950 border border-white/10 overflow-hidden relative group">
                {couplePhoto ? (
                  <>
                    <img src={couplePhoto} alt="Upload thumb" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <button
                      type="button"
                      onClick={() => setCouplePhoto('')}
                      className="absolute inset-0 bg-charcoal-950/90 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs text-red-400 font-bold font-mono cursor-pointer"
                    >
                      Delete
                    </button>
                  </>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-2 hover:bg-charcoal-800 transition-colors">
                    <Upload className="w-5 h-5 text-gray-500" />
                    <span className="text-[9px] text-gray-400 text-center font-mono mt-1 font-bold">UPLOAD</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = async () => {
                            const originalBase64 = reader.result as string;
                            const compressed = await compressImage(originalBase64);
                            setCouplePhoto(compressed);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <span className="text-[11px] text-gray-400 font-mono block">Choose a Royal Cover preset:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {defaultCovers.map((preset) => (
                    <button 
                      key={preset.name} 
                      type="button" 
                      onClick={() => setCouplePhoto(preset.url)} 
                      className={`relative h-9 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-gold-500/40 transition-all ${
                        couplePhoto === preset.url ? 'ring-2 ring-gold-500' : 'border border-white/10 opacity-70 hover:opacity-100'
                      }`}
                      title={preset.name}
                    >
                      <img src={preset.url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-gray-400 uppercase font-bold mb-1">Direct Image URL</label>
              <input 
                type="text" 
                placeholder="https://..." 
                value={couplePhoto} 
                onChange={(e) => setCouplePhoto(e.target.value)} 
                className="w-full bg-charcoal-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono placeholder-gray-600" 
              />
            </div>
          </div>

          {/* Interactive Live Cine-Card Preview */}
          <div className="p-3 bg-charcoal-950 rounded-3xl border border-gold-500/30 shadow-2xl space-y-3 group overflow-hidden">
            <div className="h-44 rounded-2xl overflow-hidden relative">
              <img 
                src={couplePhoto || defaultCovers[0].url} 
                alt="Live Preview" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950 via-charcoal-950/30 to-transparent" />
              
              {/* ID Badge */}
              <div className="absolute top-3 left-3 flex space-x-1.5">
                <span className="text-[9px] font-mono px-2 py-0.5 bg-charcoal-950/90 text-gold-300 rounded border border-gold-500/20 font-bold">
                  PRJ-AUTO
                </span>
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold flex items-center ${
                  priority === 'urgent' ? 'bg-red-500/90 text-white' :
                  priority === 'high' ? 'bg-amber-500 text-charcoal-950' :
                  priority === 'medium' ? 'bg-sky-500/90 text-white' : 'bg-gray-600 text-white'
                }`}>
                  {priority}
                </span>
              </div>

              <div className="absolute bottom-3 left-3">
                <span className="text-[9px] font-mono px-2 py-0.5 bg-charcoal-950/90 text-gold-200 rounded uppercase font-bold border border-gold-500/20">
                  {workflowStages.find(s => s.id === status)?.label || 'Data Received'}
                </span>
              </div>
            </div>

            <div className="p-3 space-y-3 font-mono">
              <div>
                <h4 className="text-sm font-bold text-white truncate font-display">
                  {projectName.trim() || 'Wedding Project Title'}
                </h4>
                <p className="text-xs text-gold-400 font-bold tracking-wide uppercase mt-0.5">
                  {(groomName || brideName) ? `💍 ${groomName || 'Groom'} & ${brideName || 'Bride'}` : 'Groom & Bride Names'}
                </p>
                {venue && (
                  <p className="text-[11px] text-gray-400 flex items-center space-x-1 mt-1 truncate">
                    <MapPin className="w-3 h-3 text-gold-400 shrink-0" />
                    <span>{venue}</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-400 pt-1 border-t border-white/5">
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Partner Studio</span>
                  <strong className="text-gray-200 truncate block">{studioName}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Lead Editor</span>
                  <strong className="text-gold-300 truncate block">{leadEditorName}</strong>
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] text-gray-400 pt-2 border-t border-white/5">
                <span className="flex items-center space-x-1 text-gray-300">
                  <Calendar className="w-3.5 h-3.5 text-gray-500" />
                  <span>{deliveryDate || 'YYYY-MM-DD'}</span>
                </span>
                <span className="text-gold-400 font-bold">{selectedFunctions.length} Deliverables</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Complete Specifications Summary Review (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 bg-charcoal-900/80 rounded-3xl border border-white/10 space-y-6 font-mono">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h4 className="text-base font-bold text-white font-display">Project Specifications Matrix</h4>
                <p className="text-xs text-gray-400 font-mono mt-0.5">Review all entered parameters before final registration.</p>
              </div>
              <span className="px-3 py-1 bg-gold-500/15 text-gold-300 rounded-full text-xs font-bold border border-gold-500/30">
                {eventType}
              </span>
            </div>

            {/* Matrix Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-charcoal-950/80 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Couple & Contacts</span>
                <p className="text-white font-bold text-sm truncate">{groomName || '—'} & {brideName || '—'}</p>
                {clientPhone && <p className="text-emerald-400 text-[11px]">📞 {clientPhone}</p>}
                {venue && <p className="text-gray-400 text-[11px] truncate">📍 {venue}</p>}
              </div>

              <div className="p-3.5 bg-charcoal-950/80 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Production Schedule</span>
                <p className="text-gray-200">Shoot: <strong className="text-white">{shootDate || '—'}</strong></p>
                <p className="text-gold-300">Due: <strong className="text-white">{deliveryDate || '—'}</strong></p>
                <p className="text-amber-400 uppercase text-[10px]">Priority: {priority}</p>
              </div>

              <div className="p-3.5 bg-charcoal-950/80 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Crew Allocation</span>
                <p className="text-gray-200">Lead: <strong className="text-gold-300">{leadEditorName}</strong></p>
                {isSplitProject && (
                  <p className="text-gray-400 text-[11px]">
                    Split 2nd: <strong className="text-sky-300">{secondEditorName}</strong> (₹{secondEditorShare.toLocaleString('en-IN')})
                  </p>
                )}
                <p className="text-gray-400 text-[11px]">Studio: {studioName}</p>
              </div>

              <div className="p-3.5 bg-charcoal-950/80 rounded-xl border border-white/5 space-y-1">
                <span className="text-[10px] text-gray-500 uppercase font-bold block">Storage & Media</span>
                <p className="text-gray-200">HDD: <strong className="text-white">{hardDiskName || 'Unlabeled'}</strong></p>
                {location && <p className="text-sky-400 text-[11px]">Rack/Shelf: {location}</p>}
                {dataSize && <p className="text-gray-400 text-[11px]">Footage: {dataSize}</p>}
              </div>
            </div>

            {/* Financial Ledger Review if admin */}
            {userRole !== 'studio' && (
              <div className="p-4 bg-charcoal-950 rounded-2xl border border-gold-500/20 space-y-3">
                <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider block">Financial Summary</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="text-[10px] text-gray-500 block">Total Contract</span>
                    <strong className="text-sm text-white font-bold">₹{projectAmount.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Advance Recv</span>
                    <strong className="text-sm text-emerald-400 font-bold">₹{advancePayment.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Balance Due</span>
                    <strong className="text-sm text-amber-400 font-bold">₹{calculatedRemainingBalance.toLocaleString('en-IN')}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 block">Net Margin</span>
                    <strong className={`text-sm font-bold ${estimatedProfitMargin >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      ₹{estimatedProfitMargin.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Deliverables Tags */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider block">
                Deliverables Package ({selectedFunctions.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedFunctions.length === 0 ? (
                  <span className="text-xs text-gray-500 italic">No specific deliverables selected (default event type will be used).</span>
                ) : (
                  selectedFunctions.map((fn, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-charcoal-950 border border-gold-500/30 text-gold-200 text-xs font-mono">
                      ✓ {fn}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Milestones count */}
            <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/5">
              <span>Initialized Tracking Milestones:</span>
              <strong className="text-white">{customMilestones.length} Steps Roadmap</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onResetForm}
                className="w-full sm:w-auto px-4 py-3 bg-charcoal-900 hover:bg-charcoal-800 border border-white/10 text-gray-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer"
              >
                Reset All Fields
              </button>
              <button
                type="button"
                onClick={onOpenSaveModal}
                className="w-full sm:w-auto px-4 py-3 bg-charcoal-900 hover:bg-charcoal-800 border border-gold-500/30 text-gold-300 hover:text-white rounded-xl text-xs font-mono font-bold transition-all cursor-pointer flex items-center justify-center space-x-1.5"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Save as Blueprint</span>
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-gold-600 via-gold-500 to-gold-600 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs md:text-sm rounded-xl shadow-xl gold-glow hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center space-x-2.5 uppercase tracking-wider"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                  <span>Registering Project...</span>
                </>
              ) : (
                <>
                  <Heart className="w-4.5 h-4.5 text-charcoal-950 fill-charcoal-950" />
                  <span>Register Wedding Project</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
