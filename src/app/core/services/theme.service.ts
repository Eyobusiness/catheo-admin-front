import { Injectable, inject, effect } from '@angular/core';
import { ConfigurationService } from '../../features/Parametes/Configuration/services/configuration.service';
import { PoliceCaracteres } from '../../features/Parametes/Configuration/models/configuration.model';

export interface ThemeColors {
  primary: string;
  secondary: string;
  font: PoliceCaracteres | string;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HslColor {
  h: number;
  s: number;
  l: number;
}

const STORAGE_KEY = 'catheo_apparence_theme';

const DEFAULT_THEME: ThemeColors = {
  primary: '#4F46E5',
  secondary: '#D97706',
  font: 'Inter'
};

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly configService = inject(ConfigurationService);
  private lastSavedTheme: ThemeColors = DEFAULT_THEME;

  constructor() {
    // 1. Apply cached theme immediately to prevent any flicker
    this.initFromStorage();

    // 2. Reactively apply theme whenever apparenceConfig changes from backend
    effect(() => {
      const config = this.configService.apparenceConfig();
      if (config) {
        const theme: ThemeColors = {
          primary: config.couleur_principale || DEFAULT_THEME.primary,
          secondary: config.couleur_secondaire || DEFAULT_THEME.secondary,
          font: config.police_caracteres || DEFAULT_THEME.font
        };
        this.applyTheme(theme.primary, theme.secondary, theme.font, true);
      }
    });
  }

  /**
   * Apply the theme to the DOM root and optionally persist in localStorage.
   */
  public applyTheme(primary: string, secondary: string, font: string, persist = true): void {
    const validPrimary = this.isValidHex(primary) ? primary : DEFAULT_THEME.primary;
    const validSecondary = this.isValidHex(secondary) ? secondary : DEFAULT_THEME.secondary;
    const validFont = font || DEFAULT_THEME.font;

    this.applyPrimaryPalette(validPrimary);
    this.applySecondaryPalette(validSecondary);
    this.applyTypography(validFont);

    if (persist) {
      this.lastSavedTheme = {
        primary: validPrimary,
        secondary: validSecondary,
        font: validFont
      };
      this.saveToStorage(this.lastSavedTheme);
    }
  }

  /**
   * Preview theme live in real-time (without persisting until user saves).
   */
  public previewTheme(primary?: string | null, secondary?: string | null, font?: string | null): void {
    const p = primary && this.isValidHex(primary) ? primary : this.lastSavedTheme.primary;
    const s = secondary && this.isValidHex(secondary) ? secondary : this.lastSavedTheme.secondary;
    const f = font || this.lastSavedTheme.font;

    this.applyPrimaryPalette(p);
    this.applySecondaryPalette(s);
    this.applyTypography(f);
  }

  /**
   * Restore the last saved theme (e.g. if user cancels editing).
   */
  public restoreSavedTheme(): void {
    this.applyTheme(
      this.lastSavedTheme.primary,
      this.lastSavedTheme.secondary,
      this.lastSavedTheme.font,
      false
    );
  }

  /**
   * Return current saved theme parameters.
   */
  public getSavedTheme(): ThemeColors {
    return { ...this.lastSavedTheme };
  }

  private initFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ThemeColors;
        if (parsed && parsed.primary) {
          this.lastSavedTheme = {
            primary: parsed.primary,
            secondary: parsed.secondary || DEFAULT_THEME.secondary,
            font: parsed.font || DEFAULT_THEME.font
          };
          this.applyTheme(this.lastSavedTheme.primary, this.lastSavedTheme.secondary, this.lastSavedTheme.font, false);
          return;
        }
      }
    } catch {
      // Ignore localStorage errors in restricted environments
    }

    this.applyTheme(DEFAULT_THEME.primary, DEFAULT_THEME.secondary, DEFAULT_THEME.font, false);
  }

  private saveToStorage(theme: ThemeColors): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch {
      // Ignore localStorage errors
    }
  }

  private applyPrimaryPalette(hex: string): void {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const root = document.documentElement;

    const p50 = this.hslToHex(hsl.h, Math.min(hsl.s, 85), 96);
    const p100 = this.hslToHex(hsl.h, Math.min(hsl.s, 90), 91);
    const p200 = this.hslToHex(hsl.h, Math.min(hsl.s, 90), 83);
    const p300 = this.hslToHex(hsl.h, Math.min(hsl.s, 90), 72);
    const p400 = this.hslToHex(hsl.h, Math.min(hsl.s, 90), 62);
    const p500 = this.hslToHex(hsl.h, Math.min(hsl.s, 95), 52);
    const p600 = hex; // Exact selected base
    const p700 = this.hslToHex(hsl.h, Math.min(hsl.s, 95), Math.max(15, hsl.l * 0.78));
    const p800 = this.hslToHex(hsl.h, Math.min(hsl.s, 95), Math.max(10, hsl.l * 0.62));
    const p900 = this.hslToHex(hsl.h, Math.min(hsl.s, 95), Math.max(6, hsl.l * 0.46));

    root.style.setProperty('--primary-50', p50);
    root.style.setProperty('--primary-100', p100);
    root.style.setProperty('--primary-200', p200);
    root.style.setProperty('--primary-300', p300);
    root.style.setProperty('--primary-400', p400);
    root.style.setProperty('--primary-500', p500);
    root.style.setProperty('--primary-600', p600);
    root.style.setProperty('--primary-700', p700);
    root.style.setProperty('--primary-800', p800);
    root.style.setProperty('--primary-900', p900);
    root.style.setProperty('--primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    root.style.setProperty('--shadow-glow', `0 0 20px -3px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
  }

  private applySecondaryPalette(hex: string): void {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return;

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const root = document.documentElement;

    const a50 = this.hslToHex(hsl.h, Math.min(hsl.s, 80), 96);
    const a100 = this.hslToHex(hsl.h, Math.min(hsl.s, 85), 91);
    const a200 = this.hslToHex(hsl.h, Math.min(hsl.s, 90), 82);
    const a500 = this.hslToHex(hsl.h, Math.min(hsl.s, 95), 52);
    const a600 = hex; // Exact selected base
    const a700 = this.hslToHex(hsl.h, Math.min(hsl.s, 95), Math.max(15, hsl.l * 0.76));

    root.style.setProperty('--accent-50', a50);
    root.style.setProperty('--accent-100', a100);
    root.style.setProperty('--accent-200', a200);
    root.style.setProperty('--accent-500', a500);
    root.style.setProperty('--accent-600', a600);
    root.style.setProperty('--accent-700', a700);
    root.style.setProperty('--accent-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
  }

  private applyTypography(fontName: string): void {
    const formattedFont = `"${fontName}", "Plus Jakarta Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    document.documentElement.style.setProperty('--font-family-sans', formattedFont);
    document.body.style.fontFamily = formattedFont;
  }

  private isValidHex(hex: string): boolean {
    return /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/.test(hex.trim());
  }

  private hexToRgb(hex: string): RgbColor | null {
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map(c => c + c).join('');
    }
    if (clean.length !== 6) return null;

    const num = parseInt(clean, 16);
    if (isNaN(num)) return null;

    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  private rgbToHsl(r: number, g: number, b: number): HslColor {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100)
    };
  }

  private hslToHex(h: number, s: number, l: number): string {
    h = (h % 360 + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else if (h >= 300 && h < 360) {
      r = c; g = 0; b = x;
    }

    const toHex = (val: number): string => {
      const hex = Math.round((val + m) * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
}
