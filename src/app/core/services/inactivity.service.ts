import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';
import { isAnimateurPortalRoute } from '../utils/route-context';

export const ADMIN_LAST_ACTIVITY_KEY = 'catheo_last_activity';
export const ANIMATEUR_LAST_ACTIVITY_KEY = 'catheo_animateur_last_activity';

// 30 minutes en millisecondes : 30 * 60 * 1000 = 1 800 000 ms
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
// Intervalle de verification : toutes les 5 secondes
export const CHECK_INTERVAL_MS = 5 * 1000;
// Seuil minimal pour limiter les ecritures disque/localStorage (2 secondes)
export const THROTTLE_ACTIVITY_MS = 2 * 1000;

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly toastService = inject(ToastService);

  public static readonly EXPIRED_TITLE = 'Session expirée';
  public static readonly EXPIRED_MESSAGE =
    "Votre session a expiré après 30 minutes d'inactivité. Veuillez vous reconnecter.";
  public static readonly ANIMATEUR_EXPIRED_MESSAGE =
    "Votre session animateur a expiré après 30 minutes d'inactivité. Veuillez vous reconnecter.";

  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private isTracking = false;
  private isHandlingTimeout = false;
  private hasNotifiedExpired = false;

  private lastRecordedTimeAdmin = 0;
  private lastRecordedTimeAnimateur = 0;

  private eventListeners: Array<{
    target: EventTarget;
    type: string;
    listener: EventListenerOrEventListenerObject;
  }> = [];

  /**
   * Determine le contexte actif (Espace Animateur vs Espace Administrateur/General).
   */
  public getCurrentContext(): 'animateur' | 'admin' {
    const path =
      (typeof window !== 'undefined' ? window.location.pathname : '') ||
      this.router.url ||
      '';

    if (isAnimateurPortalRoute(path)) {
      return 'animateur';
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      const hasAdminToken = !!(
        localStorage.getItem('catheo_auth_token') || localStorage.getItem('token')
      );
      const hasAnimToken = !!localStorage.getItem('catheo_animateur_token');
      if (hasAnimToken && !hasAdminToken) {
        return 'animateur';
      }
    }

    return 'admin';
  }

  /**
   * Verifie si un contexte dispose d'un token d'authentification en local.
   */
  public hasActiveSession(context: 'animateur' | 'admin'): boolean {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    try {
      if (context === 'animateur') {
        return !!localStorage.getItem('catheo_animateur_token');
      } else {
        return !!(
          localStorage.getItem('catheo_auth_token') || localStorage.getItem('token')
        );
      }
    } catch {
      return false;
    }
  }

  /**
   * Recupere le timestamp de la derniere activite enregistree pour un contexte donne.
   */
  public getLastActivity(context?: 'animateur' | 'admin'): number {
    const ctx = context || this.getCurrentContext();

    if (ctx === 'animateur') {
      if (this.lastRecordedTimeAnimateur > 0) {
        return this.lastRecordedTimeAnimateur;
      }
    } else {
      if (this.lastRecordedTimeAdmin > 0) {
        return this.lastRecordedTimeAdmin;
      }
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = ctx === 'animateur' ? ANIMATEUR_LAST_ACTIVITY_KEY : ADMIN_LAST_ACTIVITY_KEY;
        const stored = localStorage.getItem(key);
        if (stored) {
          const val = parseInt(stored, 10);
          if (!isNaN(val)) {
            if (ctx === 'animateur') {
              this.lastRecordedTimeAnimateur = val;
            } else {
              this.lastRecordedTimeAdmin = val;
            }
            return val;
          }
        }
      }
    } catch {}

    return 0;
  }

  /**
   * Verifie si la session enregistree est deja expiree (plus de 30 minutes d'inactivite).
   */
  public isExpired(context?: 'animateur' | 'admin'): boolean {
    if (this.isHandlingTimeout) {
      return true;
    }
    const last = this.getLastActivity(context);
    if (!last) {
      return false;
    }
    return Date.now() - last >= INACTIVITY_TIMEOUT_MS;
  }

  /**
   * Enregistre un signal d'activite utilisateur (clic, frappe, toucher mobile, scroll).
   * Contient la protection anti-ecrasement PWA / Mobile si le delai de 30 minutes est deja depasse.
   */
  public recordActivity(force = false, context?: 'animateur' | 'admin'): void {
    const ctx = context || this.getCurrentContext();
    const now = Date.now();
    const last = this.getLastActivity(ctx);

    // PROTECTION PWA & MOBILE :
    // Si l'utilisateur reprend l'application ou l'ecran du smartphone apres >= 30 minutes,
    // ce premier evenement d'interaction (touch/click) ne doit JAMAIS reinitialiser le chrono !
    if (last > 0 && now - last >= INACTIVITY_TIMEOUT_MS) {
      this.handleTimeout(undefined, ctx);
      return;
    }

    const lastRecorded = ctx === 'animateur' ? this.lastRecordedTimeAnimateur : this.lastRecordedTimeAdmin;
    if (!force && now - lastRecorded < THROTTLE_ACTIVITY_MS) {
      return;
    }

    if (ctx === 'animateur') {
      this.lastRecordedTimeAnimateur = now;
    } else {
      this.lastRecordedTimeAdmin = now;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const key = ctx === 'animateur' ? ANIMATEUR_LAST_ACTIVITY_KEY : ADMIN_LAST_ACTIVITY_KEY;
        localStorage.setItem(key, now.toString());
      }
    } catch {}
  }

  /**
   * Demarre la surveillance de l'inactivite de l'utilisateur sur Desktop et PWA Mobile.
   */
  public startTracking(): void {
    this.isHandlingTimeout = false;
    this.hasNotifiedExpired = false;
    if (typeof window === 'undefined') {
      return;
    }

    if (this.isTracking) {
      this.recordActivity(true);
      return;
    }

    this.isTracking = true;
    this.recordActivity(true);

    this.ngZone.runOutsideAngular(() => {
      // 1. Evenements d'interaction tactile et materielle (Desktop & PWA Mobile)
      const interactionEvents = [
        'mousemove',
        'mousedown',
        'keydown',
        'touchstart',
        'touchmove',
        'pointerdown',
        'scroll',
        'click'
      ];
      const activityHandler = () => this.recordActivity();

      interactionEvents.forEach(eventName => {
        window.addEventListener(eventName, activityHandler, { passive: true });
        this.eventListeners.push({ target: window, type: eventName, listener: activityHandler });
      });

      // 2. Synchronisation en temps reel entre onglets et fenetres PWA
      const storageHandler = (e: StorageEvent) => {
        if (e.key === ADMIN_LAST_ACTIVITY_KEY && e.newValue) {
          this.lastRecordedTimeAdmin = parseInt(e.newValue, 10) || Date.now();
        } else if (e.key === ANIMATEUR_LAST_ACTIVITY_KEY && e.newValue) {
          this.lastRecordedTimeAnimateur = parseInt(e.newValue, 10) || Date.now();
        }
      };
      window.addEventListener('storage', storageHandler);
      this.eventListeners.push({ target: window, type: 'storage', listener: storageHandler as EventListener });

      // 3. Cycle de vie PWA Mobile : reveil, retour au premier plan, ecran rallume
      const resumeHandler = () => {
        this.checkInactivity();
      };

      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', resumeHandler);
        this.eventListeners.push({ target: document, type: 'visibilitychange', listener: resumeHandler });
      }

      window.addEventListener('focus', resumeHandler);
      this.eventListeners.push({ target: window, type: 'focus', listener: resumeHandler });

      window.addEventListener('pageshow', resumeHandler);
      this.eventListeners.push({ target: window, type: 'pageshow', listener: resumeHandler });

      // 4. Boucle periodique de verification toutes les 5 secondes
      this.checkTimer = setInterval(() => {
        this.checkInactivity();
      }, CHECK_INTERVAL_MS);
    });
  }

  /**
   * Arrete la surveillance et nettoie les ecouteurs.
   */
  public stopTracking(): void {
    this.isTracking = false;

    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }

    this.eventListeners.forEach(({ target, type, listener }) => {
      target.removeEventListener(type, listener);
    });
    this.eventListeners = [];
  }

  /**
   * Efface le timestamp d'activite enregistre pour un contexte donne.
   */
  public clearActivity(context?: 'animateur' | 'admin'): void {
    const ctx = context || this.getCurrentContext();
    if (ctx === 'animateur') {
      this.lastRecordedTimeAnimateur = 0;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(ANIMATEUR_LAST_ACTIVITY_KEY);
        }
      } catch {}
    } else {
      this.lastRecordedTimeAdmin = 0;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(ADMIN_LAST_ACTIVITY_KEY);
        }
      } catch {}
    }
  }

  /**
   * Verifie si le delai maximal d'inactivite de 30 minutes a ete depasse.
   */
  private checkInactivity(): void {
    if (!this.isTracking) {
      return;
    }

    // 1. Verification dans le contexte actif
    const currentCtx = this.getCurrentContext();
    if (this.hasActiveSession(currentCtx) && this.isExpired(currentCtx)) {
      this.ngZone.run(() => {
        this.handleTimeout(undefined, currentCtx);
      });
      return;
    }

    // 2. Verification croisee pour l'autre session si active
    const otherCtx: 'animateur' | 'admin' = currentCtx === 'animateur' ? 'admin' : 'animateur';
    if (this.hasActiveSession(otherCtx) && this.isExpired(otherCtx)) {
      this.ngZone.run(() => {
        this.handleTimeout(undefined, otherCtx);
      });
    }
  }

  /**
   * Marque une deconnexion volontaire pour neutraliser toute notification intempestive.
   */
  public markManualLogout(context?: 'animateur' | 'admin'): void {
    this.hasNotifiedExpired = true;
    const ctx = context || this.getCurrentContext();
    this.clearActivity(ctx);

    if (!this.hasActiveSession('animateur') && !this.hasActiveSession('admin')) {
      this.stopTracking();
    }
  }

  /**
   * Emet une notification d'expiration de session adaptee au role de l'utilisateur.
   */
  public notifySessionExpired(context?: 'animateur' | 'admin'): void {
    if (this.hasNotifiedExpired) {
      return;
    }
    this.hasNotifiedExpired = true;

    const ctx = context || this.getCurrentContext();
    const message =
      ctx === 'animateur'
        ? InactivityService.ANIMATEUR_EXPIRED_MESSAGE
        : InactivityService.EXPIRED_MESSAGE;

    this.toastService.warning(
      InactivityService.EXPIRED_TITLE,
      message,
      6000
    );
  }

  /**
   * Deconnecte l'utilisateur / animateur apres 30 minutes d'inactivite et redirige
   * vers la page de connexion appropriee avec notification.
   */
  public handleTimeout(onSessionExpiredCallback?: () => void, targetContext?: 'animateur' | 'admin'): void {
    if (this.isHandlingTimeout) {
      return;
    }
    this.isHandlingTimeout = true;

    const ctx = targetContext || this.getCurrentContext();

    if (onSessionExpiredCallback) {
      onSessionExpiredCallback();
    } else {
      if (ctx === 'animateur') {
        try {
          localStorage.removeItem('catheo_animateur_token');
          localStorage.removeItem('catheo_animateur_profile');
          localStorage.removeItem('catheo_animateur_annee');
          localStorage.removeItem('catheo_animateur_menus');
          localStorage.removeItem('catheo_animateur_classe');
        } catch {}
      } else {
        try {
          localStorage.removeItem('catheo_auth_token');
          localStorage.removeItem('token');
          localStorage.removeItem('catheo_auth_user');
          localStorage.removeItem('user');
          localStorage.removeItem('catheo_auth_menus');
          localStorage.removeItem('menus');
        } catch {}
      }
    }

    this.clearActivity(ctx);

    // Arreter le tracking uniquement s'il n'y a plus aucune session active nulle part
    if (!this.hasActiveSession('animateur') && !this.hasActiveSession('admin')) {
      this.stopTracking();
    }

    this.notifySessionExpired(ctx);

    const redirectUrl = ctx === 'animateur' ? '/animateur/login' : '/auth/login';

    this.router.navigate([redirectUrl], {
      queryParams: { reason: 'inactivity' }
    }).finally(() => {
      setTimeout(() => {
        this.isHandlingTimeout = false;
      }, 2000);
    });
  }
}
