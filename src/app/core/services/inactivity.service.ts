import { Injectable, NgZone, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from './toast.service';

const LAST_ACTIVITY_KEY = 'catheo_last_activity';
// 10 minutes en millisecondes : 10 * 60 * 1000 = 600 000 ms
export const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000;
// Intervalle de verification : toutes les 5 secondes
const CHECK_INTERVAL_MS = 5 * 1000;
// Seuil minimal pour limiter les ecritures disque/localStorage (2 secondes)
const THROTTLE_ACTIVITY_MS = 2 * 1000;

@Injectable({
  providedIn: 'root'
})
export class InactivityService {
  private readonly router = inject(Router);
  private readonly ngZone = inject(NgZone);
  private readonly toastService = inject(ToastService);

  private checkTimer: any = null;
  private isTracking = false;
  private lastRecordedTime = 0;
  private eventListeners: Array<{ target: EventTarget; type: string; listener: EventListenerOrEventListenerObject }> = [];

  /**
   * Verifie si la session enregistree est deja expiree (plus de 10 minutes d'inactivite).
   */
  public isExpired(): boolean {
    const last = this.getLastActivity();
    if (!last) {
      return false;
    }
    return Date.now() - last >= INACTIVITY_TIMEOUT_MS;
  }

  /**
   * Demarre la surveillance de l'inactivite de l'utilisateur.
   */
  public startTracking(): void {
    if (this.isTracking || typeof window === 'undefined') {
      return;
    }

    this.isTracking = true;
    this.recordActivity(true);

    this.ngZone.runOutsideAngular(() => {
      const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
      const activityHandler = () => this.recordActivity();

      events.forEach(eventName => {
        window.addEventListener(eventName, activityHandler, { passive: true });
        this.eventListeners.push({ target: window, type: eventName, listener: activityHandler });
      });

      // Synchronisation entre onglets du meme navigateur
      const storageHandler = (e: StorageEvent) => {
        if (e.key === LAST_ACTIVITY_KEY && e.newValue) {
          this.lastRecordedTime = parseInt(e.newValue, 10) || Date.now();
        }
      };
      window.addEventListener('storage', storageHandler);
      this.eventListeners.push({ target: window, type: 'storage', listener: storageHandler as EventListener });

      // Boucle periodique de verification du temps d'inactivite
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

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
    } catch {}
  }

  /**
   * Enregistre un signal d'activite utilisateur (clic, frappe, deplacement).
   */
  public recordActivity(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastRecordedTime < THROTTLE_ACTIVITY_MS) {
      return;
    }

    this.lastRecordedTime = now;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    } catch {}
  }

  /**
   * Recupere le timestamp de la derniere activite enregistree.
   */
  public getLastActivity(): number {
    if (this.lastRecordedTime > 0) {
      return this.lastRecordedTime;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (stored) {
          const val = parseInt(stored, 10);
          if (!isNaN(val)) {
            this.lastRecordedTime = val;
            return val;
          }
        }
      }
    } catch {}

    return 0;
  }

  /**
   * Verifie si le delai maximal d'inactivite de 10 minutes a ete depasse.
   */
  private checkInactivity(): void {
    if (!this.isTracking) {
      return;
    }

    const last = this.getLastActivity();
    if (!last) {
      return;
    }

    const elapsed = Date.now() - last;
    if (elapsed >= INACTIVITY_TIMEOUT_MS) {
      this.ngZone.run(() => {
        this.handleTimeout();
      });
    }
  }

  /**
   * Deconnecte l'utilisateur et le redirige avec notification d'expiration.
   */
  public handleTimeout(onSessionExpiredCallback?: () => void): void {
    this.stopTracking();

    if (onSessionExpiredCallback) {
      onSessionExpiredCallback();
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

    this.toastService.warning(
      'Session expiree',
      "Vous avez ete deconnecte apres 10 minutes d'inactivite pour des raisons de securite.",
      7000
    );

    this.router.navigate(['/auth/login'], {
      queryParams: { reason: 'inactivity' }
    });
  }
}
