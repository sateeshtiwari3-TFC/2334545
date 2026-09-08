import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Film, 
  Building2, 
  Users, 
  IndianRupee, 
  HardDrive, 
  BarChart3, 
  Calendar, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Menu,
  Shield,
  Laptop,
  Sparkles,
  Heart,
  MoreHorizontal,
  X,
  Plus,
  Receipt,
  TrendingUp,
  PieChart,
  History,
  Trash2,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import Logo from './Logo';
import ThemeToggle, { AppTheme } from './ThemeToggle';
import { getTabTheme } from '../utils/navigationTheme';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onLogout: () => void;
  theme?: AppTheme;
  onThemeChange?: (theme: AppTheme) => void;
  recycleBinCount?: number;
}

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, theme = 'luxury-green', onThemeChange, recycleBinCount = 0 }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const role = currentUser?.role || 'admin';

  // Define ALL possible navigation items
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', mobileLabel: 'Dashboard', icon: LayoutDashboard, roles: ['admin'] },
    { id: 'projects', label: 'Projects', mobileLabel: 'Projects', icon: Film, roles: ['admin', 'editor', 'studio'] },
    { id: 'payments', label: 'Financials', mobileLabel: 'Financials', icon: IndianRupee, roles: ['admin', 'studio', 'editor'] },
    { id: 'registry', label: 'New Project', mobileLabel: '+ Project', icon: Plus, roles: ['admin', 'editor', 'studio'] },
    { id: 'invoice', label: 'Invoice', mobileLabel: 'Invoice', icon: Receipt, roles: ['admin', 'studio', 'editor'] },
    { id: 'studios', label: 'Studios', mobileLabel: 'Studios', icon: Building2, roles: ['admin'] },
    { id: 'editors', label: 'Editors', mobileLabel: 'Editors', icon: Laptop, roles: ['admin', 'editor'] },
    { id: 'datamanager', label: 'Data Manager', mobileLabel: 'Storage', icon: HardDrive, roles: ['admin'] },
    { id: 'calendar', label: 'Calendar', mobileLabel: 'Calendar', icon: Calendar, roles: ['admin', 'editor'] },
    { id: 'gemini', label: 'Gemini AI', mobileLabel: 'AI Studio', icon: Sparkles, roles: ['admin', 'editor', 'studio'] },
    { id: 'automation', label: 'Automations', mobileLabel: 'Auto', icon: Zap, roles: ['admin', 'editor'] },
    { id: 'audit', label: 'Audit Log', mobileLabel: 'Audit', icon: History, roles: ['admin', 'editor', 'studio'] },
    { id: 'reports', label: 'Reports', mobileLabel: 'Reports', icon: BarChart3, roles: ['admin'] },
    { id: 'notifications', label: 'Notifications', mobileLabel: 'Alerts', icon: Bell, roles: ['admin', 'editor', 'studio'] },
    { id: 'recyclebin', label: 'Recycle Bin', mobileLabel: 'Trash', icon: Trash2, roles: ['admin'] },
    { id: 'settings', label: 'Settings', mobileLabel: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  // Filter based on user permissions
  const navItems = allNavItems.filter(item => item.roles.includes(role));

  // Determine primary tabs for mobile bottom bar based on user role
  // Studio Managers / Admins get direct quick-toggle between Dashboard, Projects, and Financials
  const getMobilePrimaryTabIds = () => {
    switch (role) {
      case 'editor':
        return ['projects', 'payments', 'gemini', 'calendar'];
      case 'studio':
        return ['projects', 'payments', 'invoice', 'gemini'];
      default: // admin / studio manager
        return ['dashboard', 'projects', 'payments', 'registry'];
    }
  };

  const primaryTabIds = getMobilePrimaryTabIds();
  const primaryMobileTabs = navItems.filter(item => primaryTabIds.includes(item.id));

  const sidebarVariants = {
    collapsed: { width: 84 },
    expanded: { width: 260 }
  };

  // Close drawer when tab changes on mobile
  const handleMobileTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Header (Sticky) */}
      <div className="md:hidden flex items-center justify-between px-5 py-3.5 bg-charcoal-900/95 backdrop-blur-md border-b border-luxury-green-800/20 sticky top-0 z-40">
        <div className="flex items-center space-x-2.5">
          <Logo size={28} />
          <div className="flex flex-col">
            <span className="text-gold-500 font-bold text-xs tracking-wider font-display leading-none">FRAME CUT</span>
            <span className="text-gray-400 text-[7px] font-mono tracking-widest mt-0.5">STUDIO OS</span>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Theme Switcher Button */}
          {onThemeChange && (
            <ThemeToggle theme={theme} onThemeChange={onThemeChange} compact />
          )}

          {/* Quick Info/Notifications shortcut if notifications available */}
          <button 
            onClick={() => setActiveTab('notifications')}
            className={`p-1.5 rounded-xl transition-all relative ${
              activeTab === 'notifications' ? 'bg-gold-500/10 text-gold-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gold-400 rounded-full animate-ping" />
          </button>

          {/* Minimal Avatar */}
          <div className="relative shrink-0 w-7 h-7 rounded-lg overflow-hidden border border-gold-500/20">
            <img
              src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
              alt={currentUser?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Tab Bar Navigation - Ergonomic Studio Control */}
      <div 
        id="mobile-studio-bottom-nav"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-charcoal-950/95 backdrop-blur-2xl border-t border-luxury-green-800/30 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-8px_32px_rgba(0,0,0,0.6)] flex items-center justify-around"
      >
        {primaryMobileTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const tabTheme = getTabTheme(item.id);
          const displayLabel = item.mobileLabel || item.label;
          
          return (
            <button
              key={item.id}
              id={`mobile-nav-btn-${item.id}`}
              onClick={() => handleMobileTabClick(item.id)}
              className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 relative group cursor-pointer active:scale-95 touch-manipulation"
            >
              {/* Active Tab Glow Pill */}
              {isActive && (
                <motion.div
                  layoutId="mobileNavActivePill"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="absolute inset-0 bg-white/[0.06] rounded-xl border border-white/10 shadow-inner"
                />
              )}

              <div className={`p-1.5 rounded-xl transition-all duration-200 relative z-10 ${
                isActive 
                  ? `${tabTheme.bgMobileActive} scale-110 shadow-md ${tabTheme.indicatorShadow}` 
                  : 'text-gray-400 group-hover:text-gray-200'
              }`}>
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? tabTheme.iconActive : ''}`} />
              </div>
              
              <span className={`text-[10px] font-sans tracking-wide mt-1 font-semibold transition-all relative z-10 whitespace-nowrap ${
                isActive ? `${tabTheme.textActive} font-bold drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]` : 'text-gray-500'
              }`}>
                {displayLabel}
              </span>
              
              {/* Active Light Indicator Bar */}
              {isActive && (
                <span className={`absolute bottom-0 w-5 h-0.75 ${tabTheme.indicatorBar} rounded-full ${tabTheme.indicatorShadow} z-10`} />
              )}
            </button>
          );
        })}

        {/* More Options Drawer Trigger */}
        <button
          id="mobile-nav-btn-more"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all duration-200 relative group cursor-pointer active:scale-95 touch-manipulation"
        >
          {isMobileOpen && (
            <motion.div
              layoutId="mobileNavActivePill"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="absolute inset-0 bg-gold-500/10 rounded-xl border border-gold-500/30"
            />
          )}

          <div className={`p-1.5 rounded-xl transition-all duration-200 relative z-10 ${
            isMobileOpen 
              ? 'bg-gold-500/20 text-gold-300 scale-110 shadow-md shadow-gold-950/50' 
              : 'text-gray-400 group-hover:text-gray-200'
          }`}>
            {isMobileOpen ? <X className="w-5 h-5" /> : <MoreHorizontal className="w-5 h-5" />}
          </div>
          <span className={`text-[10px] font-sans tracking-wide mt-1 font-semibold relative z-10 whitespace-nowrap ${
            isMobileOpen ? 'text-gold-400 font-bold' : 'text-gray-500'
          }`}>
            More
          </span>
        </button>
      </div>

      {/* Mobile Slide-Up Drawer Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-40 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-charcoal-900 border-t border-luxury-green-800/40 rounded-t-[2rem] shadow-2xl overflow-hidden md:hidden max-h-[85vh] flex flex-col"
            >
              {/* Drag Handle Accent */}
              <div className="w-12 h-1 bg-stone-700 rounded-full mx-auto my-3 shrink-0" />

              {/* Title Header */}
              <div className="px-6 pb-4 border-b border-luxury-green-800/15 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-2">
                  <Logo size={24} />
                  <span className="text-xs font-bold font-mono tracking-wider text-gray-400 uppercase">Navigation Menu</span>
                </div>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid List of ALL options for this role */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold tracking-widest text-gold-500/60 uppercase mb-3.5 font-sans">All Features</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      const itemTheme = getTabTheme(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleMobileTabClick(item.id)}
                          className={`flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all border text-center relative ${
                            isActive
                              ? `${itemTheme.bgActive} ${itemTheme.borderActive} ${itemTheme.textActive} shadow-md`
                              : `bg-charcoal-950/40 border-luxury-green-900/10 text-gray-400 hover:text-white ${itemTheme.borderHover}`
                          }`}
                        >
                          <div className="relative">
                            <Icon className={`w-5 h-5 mb-2 ${isActive ? itemTheme.iconActive : 'text-gray-400'}`} />
                            {item.id === 'recyclebin' && recycleBinCount > 0 && (
                              <span className="absolute -top-1 -right-2 bg-red-500 text-white font-mono font-black text-[8px] px-1 py-0.2 rounded-full border border-charcoal-950">
                                {recycleBinCount}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-sans font-medium tracking-wide break-words leading-tight">
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Profile Details & Logout inside Drawer */}
                <div className="pt-4 border-t border-luxury-green-800/15">
                  <div className="flex items-center justify-between p-3.5 rounded-2xl bg-charcoal-950/50 border border-luxury-green-900/10">
                    <div className="flex items-center space-x-3.5 overflow-hidden">
                      <div className="relative shrink-0">
                        <img
                          src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                          alt={currentUser?.name || 'User'}
                          className="w-11 h-11 rounded-xl object-cover border border-gold-500/20"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-gold-500 text-charcoal-950 rounded-full p-0.5 border border-charcoal-950">
                          <Shield className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      
                      <div className="flex flex-col whitespace-nowrap overflow-hidden text-left">
                        <span className="text-sm font-semibold text-gray-100 leading-tight">
                          {currentUser?.name || 'Guest User'}
                        </span>
                        <span className="text-[10px] font-mono text-gold-500 tracking-wider capitalize mt-0.5">
                          {role} ({currentUser?.email})
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setIsMobileOpen(false);
                        onLogout();
                      }}
                      className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-red-400 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold font-sans transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Safe spacer for home indicator on premium newer phones */}
              <div className="h-6 bg-charcoal-900 shrink-0" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Desktop Sidebar (Hidden on Mobile) */}
      <motion.aside
        id="app-sidebar"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        initial={false}
        className="fixed top-6 left-4 bottom-6 z-50 h-[calc(100vh-48px)] rounded-3xl glass-panel hidden md:flex flex-col justify-between py-6"
        variants={sidebarVariants}
        animate={isExpanded ? 'expanded' : 'collapsed'}
      >
        {/* Top Header Logo */}
        <div>
          <div className="px-5 mb-8 flex items-center justify-between">
            <div className="flex items-center space-x-3 overflow-hidden">
              <Logo size={40} className="shrink-0" />
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex flex-col whitespace-nowrap"
                  >
                    <span className="text-gold-500 font-bold tracking-wider text-sm font-display leading-none">FRAME CUT</span>
                    <span className="text-gray-400 text-[10px] font-mono tracking-widest mt-1">STUDIO OS</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Collapse indicator chevron (desktop only) */}
            <div className="hidden md:block">
              <ChevronRight className={`w-4 h-4 text-gold-500/40 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              const itemTheme = getTabTheme(item.id);
              
              return (
                <motion.button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  whileTap={{ scale: 0.96 }}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-colors duration-200 group relative ${
                    isActive 
                      ? `${itemTheme.textActive}` 
                      : `text-gray-400 hover:text-white hover:bg-white/5`
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className={`absolute inset-0 rounded-2xl ${itemTheme.pillGradient} ${itemTheme.pillBorder}`}
                      transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    />
                  )}

                  <div className="relative shrink-0">
                    <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 z-10 ${isActive ? itemTheme.iconActive : 'text-gray-400'}`} />
                    {item.id === 'recyclebin' && recycleBinCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-mono font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-charcoal-950 shadow-sm z-20">
                        {recycleBinCount > 9 ? '9+' : recycleBinCount}
                      </span>
                    )}
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="flex items-center justify-between flex-1 whitespace-nowrap overflow-hidden z-10"
                      >
                        <span className="text-sm font-medium tracking-wide">
                          {item.label}
                        </span>
                        {item.id === 'recyclebin' && recycleBinCount > 0 && (
                          <span className="ml-2 px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-mono font-bold">
                            {recycleBinCount}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Desktop tooltips when collapsed */}
                  {!isExpanded && (
                    <div className={`absolute left-20 bg-charcoal-950 ${itemTheme.text} text-xs px-3 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 border ${itemTheme.borderActive} pointer-events-none whitespace-nowrap z-50 shadow-lg`}>
                      {item.label}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Details */}
        <div className="px-3 border-t border-luxury-green-800/20 pt-4 mt-auto">
          <div className="flex items-center justify-between p-2 rounded-2xl bg-charcoal-900/60 border border-luxury-green-800/10">
            <div className="flex items-center space-x-3 overflow-hidden">
              <div className="relative shrink-0">
                <img
                  src={currentUser?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'}
                  alt={currentUser?.name || 'User'}
                  className="w-10 h-10 rounded-xl object-cover border border-gold-500/20"
                />
                <div className="absolute -bottom-1 -right-1 bg-gold-500 text-charcoal-950 rounded-full p-0.5 border border-charcoal-950">
                  <Shield className="w-2.5 h-2.5" />
                </div>
              </div>
              
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex flex-col whitespace-nowrap overflow-hidden"
                  >
                    <span className="text-sm font-semibold text-gray-200 leading-tight">
                      {currentUser?.name || 'Guest User'}
                    </span>
                    <span className="text-[10px] font-mono text-gold-500 tracking-wider capitalize">
                      {role}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isExpanded && (
              <button
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
