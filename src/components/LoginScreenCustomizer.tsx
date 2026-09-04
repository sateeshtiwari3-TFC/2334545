import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Sparkles, 
  Upload, 
  Image as ImageIcon, 
  Check, 
  RefreshCw, 
  Eye, 
  Sliders, 
  Palette, 
  Lock, 
  Layers, 
  CloudSun, 
  Users, 
  ArrowUpRight, 
  Save, 
  RotateCcw,
  Maximize2,
  Minimize2,
  FileText,
  ShieldCheck,
  ChevronUp,
  Sparkle,
  Type
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LoginScreenConfig, 
  LOGIN_BACKGROUND_PRESETS, 
  DEFAULT_LOGIN_CONFIG, 
  getLoginScreenConfig, 
  saveLoginScreenConfig, 
  resetLoginScreenConfig, 
  resolveBackgroundUrl,
  BackgroundPresetOption 
} from '../utils/loginScreenConfig';
import { compressImage } from '../utils';
import Logo from './Logo';
import FullScreenSplashView from './FullScreenSplashView';

interface LoginScreenCustomizerProps {
  onNotify?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function LoginScreenCustomizer({ onNotify }: LoginScreenCustomizerProps) {
  const [config, setConfig] = useState<LoginScreenConfig>(getLoginScreenConfig);
  const [activeSubTab, setActiveSubTab] = useState<'splash' | 'login' | 'presets'>('splash');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fullScreenPreview, setFullScreenPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'splash' | 'login'>('splash');

  // Listen to external updates
  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e.detail) {
        setConfig(e.detail);
      }
    };
    window.addEventListener('tfc_login_config_updated', handleUpdate);
    return () => window.removeEventListener('tfc_login_config_updated', handleUpdate);
  }, []);

  const handleTextChange = (field: keyof LoginScreenConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'splash' | 'login') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSaving(true);
    try {
      const compressed = await compressImage(file, 1920, 1080, 0.85);
      if (!compressed) {
        throw new Error('Could not process image data');
      }

      if (target === 'splash') {
        const updated = saveLoginScreenConfig({
          splashBackgroundPreset: 'custom',
          splashCustomBgUrl: compressed
        });
        setConfig(updated);
      } else {
        const updated = saveLoginScreenConfig({
          loginBackgroundPreset: 'custom',
          loginCustomBgUrl: compressed
        });
        setConfig(updated);
      }
      onNotify?.('Custom background wallpaper uploaded and saved successfully!', 'success');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to compress/upload image:', err);
      onNotify?.(`Failed to process image: ${err?.message || 'Please try another image'}`, 'error');
    } finally {
      setIsSaving(false);
      e.target.value = '';
    }
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    try {
      saveLoginScreenConfig(config);
      setSaveSuccess(true);
      onNotify?.('Login and Welcome Screen branding saved successfully! Changes are now active.', 'success');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      onNotify?.('Error saving settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all Welcome & Login screen branding back to default factory settings?')) {
      const reset = resetLoginScreenConfig();
      setConfig(reset);
      onNotify?.('Welcome and Login screen settings restored to defaults.', 'info');
    }
  };

  const handleApplyPreset = (preset: BackgroundPresetOption) => {
    setConfig(prev => ({
      ...prev,
      splashBackgroundPreset: preset.id,
      splashCustomBgUrl: '',
      loginBackgroundPreset: preset.id,
      loginCustomBgUrl: ''
    }));
    onNotify?.(`Applied "${preset.name}" preset theme across welcome & login screens!`, 'success');
  };

  const currentSplashBg = resolveBackgroundUrl(config.splashBackgroundPreset, config.splashCustomBgUrl);
  const currentLoginBg = resolveBackgroundUrl(config.loginBackgroundPreset, config.loginCustomBgUrl);

  return (
    <div className="p-6 md:p-8 rounded-3xl bg-charcoal-900 border border-luxury-green-800/20 space-y-6 shadow-xl relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-luxury-green-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-luxury-green-800/20 relative z-10">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-gold-500/20 via-gold-600/10 to-transparent border border-gold-500/30 text-gold-400 shadow-lg">
            <Monitor className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono text-gold-400 uppercase tracking-widest font-bold">
                Pre-Login Experience & Branding
              </span>
              <span className="px-2 py-0.5 rounded-full bg-gold-500/10 text-gold-300 border border-gold-500/20 text-[9px] font-mono">
                Real-Time Sync
              </span>
            </div>
            <h3 className="text-xl font-bold font-display text-white mt-0.5">
              Welcome & Login Screen Customizer
            </h3>
            <p className="text-xs text-gray-400 font-light mt-0.5">
              Login se pehle aane wali Welcome/Splash Screen aur Login Portal ka look, text, logo aur wallpaper yahan se jab chahein badlein.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setFullScreenPreview(true)}
            className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-gray-200 hover:text-gold-300 transition-all flex items-center space-x-1.5 cursor-pointer"
            title="Test full screen welcome animation"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full-Screen Test</span>
          </button>

          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl bg-black/40 hover:bg-red-500/20 border border-white/10 hover:border-red-500/30 text-xs font-mono text-gray-400 hover:text-red-300 transition-all flex items-center space-x-1 cursor-pointer"
            title="Reset to original settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-charcoal-950 font-bold text-xs font-mono transition-all flex items-center space-x-1.5 shadow-lg shadow-gold-950/40 cursor-pointer hover:scale-105 active:scale-95"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 relative z-10">
        <button
          type="button"
          onClick={() => { setActiveSubTab('splash'); setPreviewMode('splash'); }}
          className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border flex items-center space-x-2 ${
            activeSubTab === 'splash'
              ? 'bg-gold-500 text-charcoal-950 font-bold border-gold-400 shadow-md'
              : 'bg-charcoal-950/60 text-gray-400 border-white/5 hover:text-white hover:border-white/15'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. Welcome / Cover Splash Screen</span>
        </button>

        <button
          type="button"
          onClick={() => { setActiveSubTab('login'); setPreviewMode('login'); }}
          className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border flex items-center space-x-2 ${
            activeSubTab === 'login'
              ? 'bg-gold-500 text-charcoal-950 font-bold border-gold-400 shadow-md'
              : 'bg-charcoal-950/60 text-gray-400 border-white/5 hover:text-white hover:border-white/15'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>2. Main Login Credentials Screen</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('presets')}
          className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer border flex items-center space-x-2 ${
            activeSubTab === 'presets'
              ? 'bg-gold-500 text-charcoal-950 font-bold border-gold-400 shadow-md'
              : 'bg-charcoal-950/60 text-gray-400 border-white/5 hover:text-white hover:border-white/15'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>3. Visual Presets & Atmosphere</span>
        </button>
      </div>

      {/* Main Interactive Grid: Left Controls + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* ================= LEFT CONTROLS (7 Cols) ================= */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* TAB 1: COVER SPLASH SCREEN */}
          {activeSubTab === 'splash' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Enable / Disable Splash Toggle */}
              <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-white/10 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">
                    Show Welcome Cover Screen on App Launch
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Displays cinematic luxury logo with swipe/slide-up unlock gesture before showing login credentials.
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
                  <input
                    type="checkbox"
                    checked={config.showSplashOnStart}
                    onChange={(e) => handleTextChange('showSplashOnStart', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-charcoal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gold-500"></div>
                </label>
              </div>

              {/* Text Fields */}
              <div className="space-y-3.5 p-4.5 rounded-2xl bg-charcoal-950/50 border border-white/5">
                <span className="text-[11px] font-mono text-gold-400 font-bold uppercase tracking-wider block">
                  Embossed Branding & Typography
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                      Main Studio Brand Name
                    </label>
                    <input
                      type="text"
                      value={config.splashBrandName}
                      onChange={(e) => handleTextChange('splashBrandName', e.target.value)}
                      placeholder="E.g. THE FRAME CUT"
                      className="w-full px-3.5 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50 font-display uppercase tracking-widest"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                      Studio Tagline / Subtitle
                    </label>
                    <input
                      type="text"
                      value={config.splashTagline}
                      onChange={(e) => handleTextChange('splashTagline', e.target.value)}
                      placeholder="E.g. LUXURY WEDDING FILM OS"
                      className="w-full px-3.5 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                      Top Header Badge Text
                    </label>
                    <input
                      type="text"
                      value={config.splashBadgeText}
                      onChange={(e) => handleTextChange('splashBadgeText', e.target.value)}
                      placeholder="E.g. STUDIO OS ERP"
                      className="w-full px-3.5 py-2 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                      Bottom Slide/Unlock Prompt Text
                    </label>
                    <input
                      type="text"
                      value={config.splashSlideText}
                      onChange={(e) => handleTextChange('splashSlideText', e.target.value)}
                      placeholder="E.g. SLIDE UP TO LOGIN"
                      className="w-full px-3.5 py-2 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Splash Wallpaper Selection */}
              <div className="space-y-3 p-4.5 rounded-2xl bg-charcoal-950/50 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gold-400 font-bold uppercase tracking-wider">
                    Welcome Cover Wallpaper
                  </span>
                  <span className="text-[10px] font-mono text-gray-400">
                    Select preset or upload custom image
                  </span>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LOGIN_BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          splashBackgroundPreset: preset.id,
                          splashCustomBgUrl: ''
                        }));
                      }}
                      className={`relative rounded-xl overflow-hidden p-2 text-left border transition-all cursor-pointer group ${
                        config.splashBackgroundPreset === preset.id
                          ? 'border-gold-500 bg-gold-500/10 ring-1 ring-gold-500/40'
                          : 'border-white/5 bg-charcoal-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className="h-16 w-full rounded-lg overflow-hidden relative mb-1.5">
                        <img src={preset.previewThumbnail} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {config.splashBackgroundPreset === preset.id && (
                          <div className="absolute top-1 right-1 bg-gold-500 text-charcoal-950 rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate">{preset.name}</span>
                      <span className="text-[9px] text-gray-400 truncate block">{preset.subtitle}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Upload or URL */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-white/5">
                  <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-luxury-green-800/20 hover:bg-luxury-green-800/40 border border-luxury-green-500/30 text-gold-300 text-xs font-mono font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Custom Wallpaper</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'splash')}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 w-full relative">
                    <input
                      type="url"
                      placeholder="Or paste external image URL: https://..."
                      value={config.splashCustomBgUrl?.startsWith('data:') ? '' : config.splashCustomBgUrl || ''}
                      onChange={(e) => {
                        setConfig(prev => ({
                          ...prev,
                          splashBackgroundPreset: 'custom',
                          splashCustomBgUrl: e.target.value
                        }));
                      }}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
                    />
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: MAIN LOGIN PORTAL */}
          {activeSubTab === 'login' && (
            <div className="space-y-5 animate-fadeIn">
              
              {/* Text Fields */}
              <div className="space-y-3.5 p-4.5 rounded-2xl bg-charcoal-950/50 border border-white/5">
                <span className="text-[11px] font-mono text-gold-400 font-bold uppercase tracking-wider block">
                  Login Card Titles & Greeting Note
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                      Header Title
                    </label>
                    <input
                      type="text"
                      value={config.loginPortalTitle}
                      onChange={(e) => handleTextChange('loginPortalTitle', e.target.value)}
                      placeholder="E.g. THE FRAME CUT"
                      className="w-full px-3.5 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50 font-display tracking-wider uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                      Header Subtitle
                    </label>
                    <input
                      type="text"
                      value={config.loginPortalSubtitle}
                      onChange={(e) => handleTextChange('loginPortalSubtitle', e.target.value)}
                      placeholder="E.g. Video Editing Suite ERP • Master Station"
                      className="w-full px-3.5 py-2.5 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 uppercase mb-1">
                    Custom Welcome / Announcement Banner (Hindi / English)
                  </label>
                  <textarea
                    rows={2}
                    value={config.loginCustomWelcomeNote}
                    onChange={(e) => handleTextChange('loginCustomWelcomeNote', e.target.value)}
                    placeholder="E.g. Welcome to The Frame Cut Studio OS. Enter your credentials to access the video editing suite."
                    className="w-full px-3.5 py-2 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-gold-500/50 resize-none font-light"
                  />
                </div>
              </div>

              {/* Login Wallpaper */}
              <div className="space-y-3 p-4.5 rounded-2xl bg-charcoal-950/50 border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-gold-400 font-bold uppercase tracking-wider">
                    Login Background Wallpaper
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => ({
                        ...prev,
                        loginBackgroundPreset: prev.splashBackgroundPreset,
                        loginCustomBgUrl: prev.splashCustomBgUrl
                      }));
                      onNotify?.('Synced login background to match welcome splash wallpaper!', 'success');
                    }}
                    className="text-[10px] font-mono text-gold-300 hover:underline cursor-pointer"
                  >
                    Match Splash Wallpaper
                  </button>
                </div>

                {/* Preset Chips */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {LOGIN_BACKGROUND_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setConfig(prev => ({
                          ...prev,
                          loginBackgroundPreset: preset.id,
                          loginCustomBgUrl: ''
                        }));
                      }}
                      className={`relative rounded-xl overflow-hidden p-2 text-left border transition-all cursor-pointer group ${
                        config.loginBackgroundPreset === preset.id
                          ? 'border-gold-500 bg-gold-500/10 ring-1 ring-gold-500/40'
                          : 'border-white/5 bg-charcoal-900/60 hover:border-white/20'
                      }`}
                    >
                      <div className="h-16 w-full rounded-lg overflow-hidden relative mb-1.5">
                        <img src={preset.previewThumbnail} alt={preset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        {config.loginBackgroundPreset === preset.id && (
                          <div className="absolute top-1 right-1 bg-gold-500 text-charcoal-950 rounded-full p-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white block truncate">{preset.name}</span>
                      <span className="text-[9px] text-gray-400 truncate block">{preset.subtitle}</span>
                    </button>
                  ))}
                </div>

                {/* Custom Upload or URL */}
                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 border-t border-white/5">
                  <label className="w-full sm:w-auto px-4 py-2 rounded-xl bg-luxury-green-800/20 hover:bg-luxury-green-800/40 border border-luxury-green-500/30 text-gold-300 text-xs font-mono font-bold flex items-center justify-center space-x-2 cursor-pointer transition-all">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Login Wallpaper</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'login')}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-1 w-full relative">
                    <input
                      type="url"
                      placeholder="Or paste external image URL: https://..."
                      value={config.loginCustomBgUrl?.startsWith('data:') ? '' : config.loginCustomBgUrl || ''}
                      onChange={(e) => {
                        setConfig(prev => ({
                          ...prev,
                          loginBackgroundPreset: 'custom',
                          loginCustomBgUrl: e.target.value
                        }));
                      }}
                      className="w-full px-3 py-2 bg-charcoal-900 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-gold-500/40"
                    />
                  </div>
                </div>
              </div>

              {/* Login Elements Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Weather & Clock Widget */}
                <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <CloudSun className="w-3.5 h-3.5 text-gold-400" />
                      <span>Live Weather & Clock</span>
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      Shows real-time Indian studio clock & weather
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={config.showWeatherClockWidget}
                      onChange={(e) => handleTextChange('showWeatherClockWidget', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-charcoal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>

                {/* Demo Role Buttons */}
                <div className="p-4 rounded-2xl bg-charcoal-950/70 border border-white/10 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-luxury-green-400" />
                      <span>Quick Demo Role Buttons</span>
                    </span>
                    <span className="text-[10px] text-gray-400 block">
                      One-click Admin / Editor / Studio pills
                    </span>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                    <input
                      type="checkbox"
                      checked={config.showDemoLoginButtons}
                      onChange={(e) => handleTextChange('showDemoLoginButtons', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-charcoal-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold-500"></div>
                  </label>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: VISUAL PRESETS & ATMOSPHERE */}
          {activeSubTab === 'presets' && (
            <div className="space-y-4 animate-fadeIn">
              <span className="text-xs text-gray-300 block">
                Click any 1-Click Studio Atmosphere Preset below to automatically apply tailored wallpapers, gradients, and typography across both the Welcome Cover and Login screens:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {LOGIN_BACKGROUND_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-4 rounded-2xl bg-charcoal-950/80 border border-white/10 hover:border-gold-500/40 transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-center space-x-3">
                      <img src={preset.previewThumbnail} alt={preset.name} className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-md" />
                      <div>
                        <h4 className="text-sm font-bold text-white font-display">{preset.name}</h4>
                        <p className="text-[11px] text-gray-400 leading-snug">{preset.subtitle}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="w-full py-2 bg-gold-500/10 hover:bg-gold-500 hover:text-charcoal-950 border border-gold-500/30 text-gold-300 font-mono text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      <Sparkle className="w-3.5 h-3.5" />
                      <span>Apply This Atmosphere</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ================= RIGHT LIVE PREVIEW (5 Cols) ================= */}
        <div className="lg:col-span-5 space-y-3">
          
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-mono text-gold-400 font-bold uppercase tracking-wider flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Real-Time Mini Preview</span>
            </span>

            {/* Toggle Preview View */}
            <div className="flex items-center bg-black/50 p-1 rounded-xl border border-white/10 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setPreviewMode('splash')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'splash' ? 'bg-gold-500 text-charcoal-950 font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Cover Splash
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('login')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  previewMode === 'login' ? 'bg-gold-500 text-charcoal-950 font-bold' : 'text-gray-400 hover:text-white'
                }`}
              >
                Login Portal
              </button>
            </div>
          </div>

          {/* Mini Device Viewport */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-gold-500/30 shadow-2xl aspect-[9/14] sm:aspect-[3/4] bg-black flex flex-col justify-between p-4 select-none group">
            
            {/* Background Image of Selected Mode */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-all duration-700 pointer-events-none"
              style={{
                backgroundImage: `url('${previewMode === 'splash' ? currentSplashBg : currentLoginBg}')`
              }}
            />

            {/* Dark Overlays */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/85 pointer-events-none" />

            {/* PREVIEW: SPLASH MODE */}
            {previewMode === 'splash' && (
              <div className="relative z-10 h-full flex flex-col justify-between text-center py-2 animate-fadeIn">
                
                {/* Top Mini Header */}
                <div className="flex items-center justify-between text-[8px] font-mono text-gold-300/80 px-1">
                  <span className="bg-black/60 px-2 py-0.5 rounded-full border border-gold-500/20">
                    {config.splashBadgeText || 'STUDIO OS'}
                  </span>
                  <span className="flex items-center space-x-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>LOCKED</span>
                  </span>
                </div>

                {/* Center Logo & Title */}
                <div className="my-auto space-y-2">
                  <div className="inline-block p-3 rounded-full bg-gradient-to-b from-black/80 to-black/90 border border-gold-500/40 shadow-lg">
                    <Logo size={42} variant="gold" />
                  </div>
                  <h2 className="text-base font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-gold-300 to-amber-500 tracking-[0.2em] uppercase drop-shadow">
                    {config.splashBrandName || 'THE FRAME CUT'}
                  </h2>
                  <p className="text-[8px] font-mono tracking-[0.25em] uppercase text-gold-400/90">
                    {config.splashTagline || 'LUXURY WEDDING FILM OS'}
                  </p>
                </div>

                {/* Bottom Slide Cue */}
                <div className="space-y-1">
                  <div className="w-6 h-6 rounded-full bg-black/60 border border-gold-500/40 text-gold-400 mx-auto flex items-center justify-center animate-bounce">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8px] font-mono font-bold tracking-widest text-gold-300 uppercase block">
                    {config.splashSlideText || 'SLIDE UP TO LOGIN'}
                  </span>
                </div>

              </div>
            )}

            {/* PREVIEW: LOGIN MODE */}
            {previewMode === 'login' && (
              <div className="relative z-10 h-full flex flex-col justify-between text-center py-2 animate-fadeIn space-y-2">
                
                {/* Top Logo */}
                <div className="space-y-1">
                  <div className="inline-block p-2 rounded-full bg-black/60 border border-white/15">
                    <Logo size={28} variant="gold" />
                  </div>
                  <h3 className="text-xs font-black font-display text-white tracking-widest uppercase">
                    {config.loginPortalTitle || 'THE FRAME CUT'}
                  </h3>
                  <p className="text-[7px] font-mono text-gray-400">
                    {config.loginPortalSubtitle}
                  </p>
                </div>

                {/* Mini Card */}
                <div className="p-3 rounded-xl bg-black/75 border border-white/10 backdrop-blur-md space-y-2 text-left">
                  {config.loginCustomWelcomeNote && (
                    <p className="text-[7px] text-gold-300/90 font-light border-b border-white/5 pb-1">
                      {config.loginCustomWelcomeNote}
                    </p>
                  )}

                  <div className="space-y-1 text-[7px] font-mono">
                    <div className="h-5 bg-white/5 rounded-md border border-white/10 px-2 flex items-center text-gray-400">
                      satish@framecut.com
                    </div>
                    <div className="h-5 bg-white/5 rounded-md border border-white/10 px-2 flex items-center text-gray-400">
                      ••••••••
                    </div>
                  </div>

                  <div className="h-5 bg-gold-500 rounded-md flex items-center justify-center text-[7px] font-mono font-bold text-charcoal-950">
                    LOGIN TO SUITE
                  </div>
                </div>

                {/* Weather Pill if enabled */}
                {config.showWeatherClockWidget && (
                  <div className="p-1 rounded-lg bg-black/60 border border-white/10 text-[7px] font-mono text-gray-300 flex items-center justify-between px-2">
                    <span>⛅ New Delhi • 28°C</span>
                    <span className="text-gold-400 font-bold">12:30 PM</span>
                  </div>
                )}

              </div>
            )}

          </div>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={() => setFullScreenPreview(true)}
              className="text-xs font-mono text-gold-400 hover:text-gold-200 underline cursor-pointer inline-flex items-center space-x-1"
            >
              <Maximize2 className="w-3.5 h-3.5 mr-1" />
              <span>Launch Full-Screen Interactive Test</span>
            </button>
          </div>

        </div>

      </div>

      {/* Full-Screen Splash Preview Modal overlay */}
      <AnimatePresence>
        {fullScreenPreview && (
          <div className="fixed inset-0 z-50">
            <FullScreenSplashView onSlideComplete={() => setFullScreenPreview(false)} />
            <button
              type="button"
              onClick={() => setFullScreenPreview(false)}
              className="fixed top-4 right-4 z-[60] px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white text-xs font-mono border border-white/20 shadow-xl cursor-pointer"
            >
              ✕ Exit Preview
            </button>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
