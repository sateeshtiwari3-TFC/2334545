export interface LoginScreenConfig {
  // Cover / Splash Screen Settings (Before Login)
  showSplashOnStart: boolean;
  splashBrandName: string;
  splashTagline: string;
  splashBadgeText: string;
  splashSlideText: string;
  splashBackgroundPreset: 'pine_forest' | 'luxury_emerald' | 'midnight_gold' | 'cinematic_darkroom' | 'royal_sapphire' | 'golden_hour' | 'custom';
  splashCustomBgUrl?: string;
  splashAccentTheme: 'gold' | 'emerald' | 'amber' | 'sapphire' | 'rose';
  splashBackgroundMode: 'gradient' | 'wallpaper' | 'dark_minimal';

  // Login Portal Screen Settings
  loginPortalTitle: string;
  loginPortalSubtitle: string;
  loginCustomWelcomeNote: string;
  loginBackgroundPreset: 'pine_forest' | 'luxury_emerald' | 'midnight_gold' | 'cinematic_darkroom' | 'royal_sapphire' | 'golden_hour' | 'custom';
  loginCustomBgUrl?: string;
  showWeatherClockWidget: boolean;
  showDemoLoginButtons: boolean;
  loginCardTransparency: 'frosted_glass' | 'solid_dark' | 'deep_black';
}

export interface BackgroundPresetOption {
  id: 'pine_forest' | 'luxury_emerald' | 'midnight_gold' | 'cinematic_darkroom' | 'royal_sapphire' | 'golden_hour';
  name: string;
  subtitle: string;
  url: string;
  themeColor: string;
  previewThumbnail: string;
}

export const LOGIN_BACKGROUND_PRESETS: BackgroundPresetOption[] = [
  {
    id: 'pine_forest',
    name: 'Misty Pine Forest',
    subtitle: 'Foggy evergreen wilderness with moody lighting',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#3c8f78',
    previewThumbnail: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'luxury_emerald',
    name: 'Royal Emerald Glow',
    subtitle: 'Deep emerald velvet texture with subtle ambient glow',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#10b981',
    previewThumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'midnight_gold',
    name: 'Midnight Gold & Obsidian',
    subtitle: 'Luxury black gold aesthetics with metallic textures',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#d4af37',
    previewThumbnail: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'cinematic_darkroom',
    name: 'Cinematic Studio & Reel',
    subtitle: 'Moody vintage cinema suite with anamorphic depth',
    url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#f59e0b',
    previewThumbnail: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'royal_sapphire',
    name: 'Royal Sapphire Night',
    subtitle: 'Deep midnight blue with celestial starlight aura',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#3b82f6',
    previewThumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80'
  },
  {
    id: 'golden_hour',
    name: 'Golden Hour Silhouette',
    subtitle: 'Warm cinematic sunset glow from wedding shoots',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80',
    themeColor: '#fbbf24',
    previewThumbnail: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80'
  }
];

export const DEFAULT_LOGIN_CONFIG: LoginScreenConfig = {
  showSplashOnStart: true,
  splashBrandName: 'THE FRAME CUT',
  splashTagline: 'LUXURY WEDDING FILM OS',
  splashBadgeText: 'STUDIO OS ERP',
  splashSlideText: 'SLIDE UP TO LOGIN',
  splashBackgroundPreset: 'pine_forest',
  splashCustomBgUrl: '',
  splashAccentTheme: 'gold',
  splashBackgroundMode: 'gradient',

  loginPortalTitle: 'THE FRAME CUT',
  loginPortalSubtitle: 'Video Editing Suite ERP • Master Station',
  loginCustomWelcomeNote: 'Welcome to The Frame Cut Studio OS. Enter your credentials to access the video editing suite.',
  loginBackgroundPreset: 'pine_forest',
  loginCustomBgUrl: '',
  showWeatherClockWidget: true,
  showDemoLoginButtons: true,
  loginCardTransparency: 'frosted_glass'
};

const STORAGE_KEY = 'tfc_login_branding_config';

export function getLoginScreenConfig(): LoginScreenConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_LOGIN_CONFIG, ...parsed };
    }
  } catch (err) {
    console.error('Failed to parse login screen config from localStorage:', err);
  }
  return DEFAULT_LOGIN_CONFIG;
}

export function saveLoginScreenConfig(config: Partial<LoginScreenConfig>): LoginScreenConfig {
  try {
    const current = getLoginScreenConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    // Dispatch custom event so active windows/components react immediately
    window.dispatchEvent(new CustomEvent('tfc_login_config_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to save login screen config:', err);
    return DEFAULT_LOGIN_CONFIG;
  }
}

export function resetLoginScreenConfig(): LoginScreenConfig {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOGIN_CONFIG));
    window.dispatchEvent(new CustomEvent('tfc_login_config_updated', { detail: DEFAULT_LOGIN_CONFIG }));
    return DEFAULT_LOGIN_CONFIG;
  } catch (err) {
    console.error('Failed to reset login config:', err);
    return DEFAULT_LOGIN_CONFIG;
  }
}

export function resolveBackgroundUrl(
  preset: LoginScreenConfig['loginBackgroundPreset'] | LoginScreenConfig['splashBackgroundPreset'],
  customUrl?: string
): string {
  if (preset === 'custom' && customUrl && customUrl.trim().length > 0) {
    return customUrl.trim();
  }
  const found = LOGIN_BACKGROUND_PRESETS.find(p => p.id === preset);
  return found?.url || LOGIN_BACKGROUND_PRESETS[0].url;
}
