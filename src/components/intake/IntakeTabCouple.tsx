import React from 'react';
import { User, Phone, Mail, MapPin, Building2, Music, Sparkles } from 'lucide-react';
import { Studio } from '../../types';

interface IntakeTabCoupleProps {
  groomName: string;
  setGroomName: (val: string) => void;
  brideName: string;
  setBrideName: (val: string) => void;
  projectName: string;
  setProjectName: (val: string) => void;
  eventType: string;
  setEventType: (val: string) => void;
  studioId: string;
  setStudioId: (val: string) => void;
  studios: Studio[];
  userRole: string;
  clientPhone: string;
  setClientPhone: (val: string) => void;
  clientEmail: string;
  setClientEmail: (val: string) => void;
  venue: string;
  setVenue: (val: string) => void;
  musicVibe: string;
  setMusicVibe: (val: string) => void;
  onClearError: () => void;
}

export default function IntakeTabCouple({
  groomName,
  setGroomName,
  brideName,
  setBrideName,
  projectName,
  setProjectName,
  eventType,
  setEventType,
  studioId,
  setStudioId,
  studios,
  userRole,
  clientPhone,
  setClientPhone,
  clientEmail,
  setClientEmail,
  venue,
  setVenue,
  musicVibe,
  setMusicVibe,
  onClearError
}: IntakeTabCoupleProps) {

  // Helper to auto-generate project title if empty
  const handleAutoTitle = (gName: string, bName: string) => {
    if ((gName || bName) && (!projectName || projectName.includes('& Wedding Film') || projectName.includes('&'))) {
      const generated = `${gName.trim() || 'Groom'} & ${bName.trim() || 'Bride'} Wedding Film`;
      setProjectName(generated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-gold-500/10 border border-gold-500/20 rounded-2xl flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
            💍
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display uppercase tracking-wider">Step 1: Couple, Client & Event Details</h4>
            <p className="text-xs text-gray-400 font-mono">Record the bride & groom info, contact points, ceremony category, and wedding destination.</p>
          </div>
        </div>
      </div>

      {/* Couple Names Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Groom Name <span className="text-gold-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="e.g. Rohan Sharma" 
              value={groomName} 
              onChange={(e) => { 
                setGroomName(e.target.value); 
                onClearError();
                handleAutoTitle(e.target.value, brideName);
              }} 
              className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Bride Name <span className="text-gold-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="e.g. Riya Patel" 
              value={brideName} 
              onChange={(e) => { 
                setBrideName(e.target.value); 
                onClearError();
                handleAutoTitle(groomName, e.target.value);
              }} 
              className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all" 
            />
          </div>
        </div>
      </div>

      {/* Project Title */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-xs font-semibold text-gray-400 font-mono uppercase tracking-wider">
            Wedding Project Title <span className="text-gold-400">*</span>
          </label>
          {(groomName || brideName) && (
            <button
              type="button"
              onClick={() => handleAutoTitle(groomName, brideName)}
              className="text-[10px] font-mono text-gold-400 hover:text-gold-300 flex items-center space-x-1 hover:underline cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              <span>Auto-Fill Title</span>
            </button>
          )}
        </div>
        <input 
          type="text" 
          placeholder="e.g. Rohan & Riya Royal Destination Wedding Film" 
          value={projectName} 
          onChange={(e) => { setProjectName(e.target.value); onClearError(); }} 
          className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all font-medium" 
        />
      </div>

      {/* Ceremony Type & Studio Partner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Ceremony / Event Category
          </label>
          <select 
            value={eventType} 
            onChange={(e) => setEventType(e.target.value)} 
            className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl px-4 py-3 text-sm text-gray-200 focus:bg-charcoal-900 focus:outline-none cursor-pointer transition-all font-mono"
          >
            <option value="Wedding Film" className="bg-charcoal-950">Wedding Film (Full Feature)</option>
            <option value="Pre-Wedding Film" className="bg-charcoal-950">Pre-Wedding Story</option>
            <option value="Engagement Teaser" className="bg-charcoal-950">Engagement Teaser</option>
            <option value="Sangeet Cut" className="bg-charcoal-950">Sangeet & Dance Cut</option>
            <option value="Cinematic Highlight" className="bg-charcoal-950">Cinematic Highlight (3-5 Min)</option>
            <option value="Traditional Full Film" className="bg-charcoal-950">Traditional Full Ceremony Film</option>
            <option value="Social Reels Package" className="bg-charcoal-950">Social Reels & Shorts Package</option>
            <option value="Anniversary Special" className="bg-charcoal-950">Anniversary Celebration</option>
            <option value="Commercial Event" className="bg-charcoal-950">Commercial / Fashion Film</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Partner Studio / Agency
          </label>
          {userRole === 'studio' ? (
            <div className="w-full bg-charcoal-900/40 border border-white/5 rounded-xl px-4 py-3 text-sm text-gray-400 font-medium">
              🏢 {studios.find(s => s.id === studioId)?.name || 'Direct Client'}
            </div>
          ) : (
            <div className="relative">
              <Building2 className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500 pointer-events-none" />
              <select 
                value={studioId} 
                onChange={(e) => setStudioId(e.target.value)} 
                className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl pl-11 pr-4 py-3 text-sm text-gray-200 focus:bg-charcoal-900 focus:outline-none cursor-pointer transition-all font-mono"
              >
                <option value="" className="bg-charcoal-950">Direct Client (In-House)</option>
                {studios.map(s => (
                  <option key={s.id} value={s.id} className="bg-charcoal-950">
                    🏢 {s.name} {s.ownerName ? `(${s.ownerName})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Destination Venue & City */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Wedding Destination / Venue Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-gold-400" />
            <input 
              type="text" 
              placeholder="e.g. Udaipur (The Oberoi Udaivilas) or Goa Beachfront" 
              value={venue} 
              onChange={(e) => setVenue(e.target.value)} 
              className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Client WhatsApp / Phone
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-emerald-400" />
            <input 
              type="tel" 
              placeholder="+91 98765 43210" 
              value={clientPhone} 
              onChange={(e) => setClientPhone(e.target.value)} 
              className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all font-mono" 
            />
          </div>
        </div>
      </div>

      {/* Client Email & Reference Music Vibe */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Client Email Address (Optional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
            <input 
              type="email" 
              placeholder="client@weddingemail.com" 
              value={clientEmail} 
              onChange={(e) => setClientEmail(e.target.value)} 
              className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all font-mono" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-2 font-mono uppercase tracking-wider">
            Reference Music / Vibe Preference
          </label>
          <div className="relative">
            <Music className="absolute left-3.5 top-3.5 w-4 h-4 text-sky-400" />
            <input 
              type="text" 
              placeholder="e.g. Romantic Acoustic Sufi / Bollywood Energetic" 
              value={musicVibe} 
              onChange={(e) => setMusicVibe(e.target.value)} 
              className="w-full bg-charcoal-900/80 border border-white/10 hover:border-gold-500/30 focus:border-gold-500/60 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:bg-charcoal-900 focus:outline-none transition-all" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
