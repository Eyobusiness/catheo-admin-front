import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ToastService } from './toast.service';
import {
  AlertsSummaryResponse,
  SystemNotification,
  UnreadCountResponse
} from '../models/system-notification.model';

@Injectable({
  providedIn: 'root'
})
export class SystemNotificationService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly baseUrl = `${environment.apiUrl}/system-notifications`;

  // Reactive State Signals
  public readonly unreadCount = signal<number>(0);
  public readonly recentNotifications = signal<SystemNotification[]>([]);
  public readonly alertsSummary = signal<AlertsSummaryResponse | null>(null);
  public readonly notificationsList = signal<SystemNotification[]>([]);
  public readonly isLoading = signal<boolean>(false);

  // Derived state
  public readonly totalAlertes = computed(() => this.alertsSummary()?.total_alertes ?? 0);
  public readonly alertsList = computed(() => this.alertsSummary()?.alerts_list ?? []);

  /**
   * Récupère le nombre de notifications non lues et les dernières notifications
   * GET /api/v1/system-notifications/unread-count
   */
  public fetchUnreadCount(): Observable<UnreadCountResponse | null> {
    return this.http.get<any>(`${this.baseUrl}/unread-count`).pipe(
      map(res => {
        // Support response structures: direct or { data: ... }
        const data = res?.data ?? res;
        return {
          unread_count: Number(data?.unread_count ?? data?.count ?? 0),
          recent_notifications: (data?.recent_notifications || data?.notifications || []) as SystemNotification[]
        } as UnreadCountResponse;
      }),
      tap(result => {
        if (result) {
          this.unreadCount.set(result.unread_count);
          if (result.recent_notifications && result.recent_notifications.length > 0) {
            this.recentNotifications.set(result.recent_notifications);
          }
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('Impossible de charger le compteur de notifications', error);
        return of(null);
      })
    );
  }

  /**
   * Récupère la synthèse des alertes système (préinscriptions en attente, appels non faits, etc.)
   * GET /api/v1/system-notifications/alerts-summary
   */
  public fetchAlertsSummary(): Observable<AlertsSummaryResponse | null> {
    this.isLoading.set(true);
    return this.http.get<any>(`${this.baseUrl}/alerts-summary`).pipe(
      map(res => {
        const data = res?.data ?? res;
        return {
          total_alertes: Number(data?.total_alertes ?? data?.alerts_list?.length ?? 0),
          preinscriptions_en_attente: data?.preinscriptions_en_attente ?? 0,
          appels_non_faits: data?.appels_non_faits ?? 0,
          alerts_list: (data?.alerts_list || []) as SystemNotification[]
        } as AlertsSummaryResponse;
      }),
      tap(summary => {
        if (summary) {
          this.alertsSummary.set(summary);
        }
      }),
      catchError((error: HttpErrorResponse) => {
        console.warn('Impossible de charger la synthèse des alertes', error);
        return of(null);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  /**
   * Récupère la liste complète des notifications avec filtres
   * GET /api/v1/system-notifications
   */
  public fetchNotifications(filters?: { type?: string; is_read?: boolean; search?: string }): Observable<SystemNotification[]> {
    this.isLoading.set(true);
    let params = new HttpParams();

    if (filters?.type && filters.type !== 'all') {
      params = params.set('type', filters.type);
    }
    if (filters?.is_read !== undefined) {
      params = params.set('is_read', filters.is_read.toString());
    }
    if (filters?.search && filters.search.trim()) {
      params = params.set('search', filters.search.trim());
    }

    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => {
        const list = Array.isArray(res) ? res : (res?.data?.data || res?.data || res?.notifications || []);
        return (list as any[]).map(item => this.normalizeNotification(item));
      }),
      tap(items => {
        this.notificationsList.set(items);
      }),
      catchError((error: HttpErrorResponse) => {
        this.toastService.error(
          'Erreur Notifications',
          error.error?.message || 'Impossible de récupérer la liste des notifications.'
        );
        return of([]);
      }),
      finalize(() => {
        this.isLoading.set(false);
      })
    );
  }

  /**
   * Marque une notification comme lue
   * PATCH /api/v1/system-notifications/:id/read
   */
  public markAsRead(id: string | number): Observable<boolean> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/read`, {}).pipe(
      map(() => true),
      tap(() => {
        // Met à jour l'état local réactif
        this.notificationsList.update(list =>
          list.map(notif => notif.id === id ? { ...notif, is_read: true, read_at: new Date().toISOString() } : notif)
        );
        this.recentNotifications.update(list =>
          list.map(notif => notif.id === id ? { ...notif, is_read: true, read_at: new Date().toISOString() } : notif)
        );
        this.unreadCount.update(count => Math.max(0, count - 1));
      }),
      catchError(() => {
        // Fallback optimiste si l'API retourne un code non supporté
        this.notificationsList.update(list =>
          list.map(notif => notif.id === id ? { ...notif, is_read: true } : notif)
        );
        this.unreadCount.update(count => Math.max(0, count - 1));
        return of(true);
      })
    );
  }

  /**
   * Marque toutes les notifications comme lues
   * POST /api/v1/system-notifications/mark-all-read
   */
  public markAllAsRead(): Observable<boolean> {
    return this.http.post<any>(`${this.baseUrl}/mark-all-read`, {}).pipe(
      map(() => true),
      tap(() => {
        this.notificationsList.update(list =>
          list.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
        );
        this.recentNotifications.update(list =>
          list.map(notif => ({ ...notif, is_read: true, read_at: new Date().toISOString() }))
        );
        this.unreadCount.set(0);
        this.toastService.info('Notifications', 'Toutes les notifications ont été marquées comme lues.');
      }),
      catchError(() => {
        // Fallback local
        this.notificationsList.update(list =>
          list.map(notif => ({ ...notif, is_read: true }))
        );
        this.recentNotifications.update(list =>
          list.map(notif => ({ ...notif, is_read: true }))
        );
        this.unreadCount.set(0);
        this.toastService.info('Notifications', 'Toutes les notifications ont été marquées comme lues.');
        return of(true);
      })
    );
  }

  /**
   * Ouvre la notification : marque comme lue et redirige vers la route correspondant à la provenance
   */
  public handleNotificationClick(notif: SystemNotification): void {
    if (!notif.is_read) {
      this.markAsRead(notif.id).subscribe();
    }

    const targetRoute = this.resolveNotificationRoute(notif);
    this.router.navigateByUrl(targetRoute);
  }

  /**
   * Résout intelligemment la route de redirection en fonction de la provenance,
   * des métadonnées, du type ou du contenu du message.
   */
  public resolveNotificationRoute(notif?: Partial<SystemNotification> | null): string {
    if (!notif) return '/dashboard';

    // 1. Si une URL explicite existe déjà, la normaliser
    if (notif.route_url && notif.route_url.trim()) {
      return this.normalizeRoute(notif.route_url);
    }

    // 2. Vérifier les métadonnées (source, module, model, etc.)
    const meta = notif.meta_data || {};
    const module = (meta['module'] || meta['source'] || meta['type'] || meta['model'] || '').toString().toLowerCase();

    if (module.includes('preinscription')) return '/preinscriptions';
    if (module.includes('inscription')) return '/inscriptions-annuelles';
    if (module.includes('versement') || module.includes('encaissement') || module.includes('paiement') || module.includes('finance')) return '/versements';
    if (module.includes('caisse')) return '/caisse';
    if (module.includes('presence') || module.includes('seance')) return '/seances';
    if (module.includes('evaluation') || module.includes('note')) return '/evaluations';
    if (module.includes('bulletin')) return '/bulletins';
    if (module.includes('bapteme')) return '/sacrements/bapteme';
    if (module.includes('communion')) return '/sacrements/premiere-communion';
    if (module.includes('confirmation')) return '/sacrements/confirmation';
    if (module.includes('sacrement')) return '/sacrements';
    if (module.includes('campagne')) return '/campagnes-preinscriptions';
    if (module.includes('catechumene')) return '/catechumenes';

    // 3. Détecter par mots-clés dans le titre et le message
    const fullText = `${notif.titre || ''} ${notif.message || ''}`.toLowerCase();

    // A. Préinscriptions
    if (fullText.includes('préinscription') || fullText.includes('preinscription') || fullText.includes('pré-inscription')) {
      return '/preinscriptions';
    }

    // B. Inscriptions Annuelles / Réinscriptions
    if (fullText.includes('inscription') || fullText.includes('réinscription') || fullText.includes('reinscription')) {
      return '/inscriptions-annuelles';
    }

    // C. Finances / Encaissements / Versements / Caisse
    if (fullText.includes('versement') || fullText.includes('encaissement') || fullText.includes('paiement') || fullText.includes('solde') || fullText.includes('trésorerie') || fullText.includes('recu') || fullText.includes('reçu')) {
      return '/versements';
    }
    if (fullText.includes('caisse') || fullText.includes('dépense') || fullText.includes('recette') || fullText.includes('operation')) {
      return '/caisse';
    }

    // D. Séances / Présences / Absences / Appels
    if (fullText.includes('séance') || fullText.includes('seance') || fullText.includes('présence') || fullText.includes('presence') || fullText.includes('appel') || fullText.includes('absence')) {
      return '/seances';
    }

    // E. Évaluations / Notes / Bilans / Bulletins
    if (fullText.includes('bulletin')) {
      return '/bulletins';
    }
    if (fullText.includes('note') || fullText.includes('évaluation') || fullText.includes('evaluation') || fullText.includes('bilan')) {
      return '/evaluations';
    }

    // F. Sacrements
    if (fullText.includes('baptême') || fullText.includes('bapteme')) {
      return '/sacrements/bapteme';
    }
    if (fullText.includes('communion')) {
      return '/sacrements/premiere-communion';
    }
    if (fullText.includes('confirmation')) {
      return '/sacrements/confirmation';
    }
    if (fullText.includes('sacrement')) {
      return '/sacrements';
    }

    // G. Campagnes
    if (fullText.includes('campagne')) {
      return '/campagnes-preinscriptions';
    }

    // H. Catéchumènes
    if (fullText.includes('catéchumène') || fullText.includes('catechumene')) {
      return '/catechumenes';
    }

    return '/dashboard';
  }

  /**
   * Retourne le libellé du bouton d'action selon la destination résolue
   */
  public getActionLabel(notif: SystemNotification): string {
    const route = this.resolveNotificationRoute(notif);
    if (route.includes('preinscriptions')) return 'Consulter les préinscriptions';
    if (route.includes('inscriptions')) return 'Consulter les inscriptions';
    if (route.includes('versements') || route.includes('caisse')) return 'Consulter les encaissements';
    if (route.includes('seances')) return 'Consulter les séances';
    if (route.includes('evaluations') || route.includes('notes')) return 'Consulter les évaluations';
    if (route.includes('bulletins')) return 'Consulter les bulletins';
    if (route.includes('sacrements')) return 'Consulter les sacrements';
    if (route.includes('campagnes')) return 'Consulter les campagnes';
    if (route.includes('catechumenes')) return 'Consulter les catéchumènes';
    return 'Consulter';
  }

  /**
   * Normalise les URL envoyées par le backend vers les routes Angular de l'application
   */
  public normalizeRoute(url?: string): string {
    if (!url) return '/dashboard';
    let target = url.trim();

    // Map any backend dashboard subroutes if needed
    if (target === '/dashboard/preinscriptions' || target.startsWith('/preinscriptions')) {
      return '/preinscriptions';
    }
    if (target === '/dashboard/presences' || target === '/dashboard/seances' || target.startsWith('/seances')) {
      return '/seances';
    }
    if (target.startsWith('/dashboard/inscriptions') || target.startsWith('/inscriptions')) {
      return '/inscriptions-annuelles';
    }
    if (target.startsWith('/dashboard/versements') || target.startsWith('/versements') || target.startsWith('/encaissements')) {
      return '/versements';
    }
    if (target.startsWith('/dashboard/finances') || target.startsWith('/finances') || target.startsWith('/operations-financieres')) {
      return '/operations-financieres';
    }
    if (target.startsWith('/dashboard/caisse') || target.startsWith('/caisse')) {
      return '/caisse';
    }

    return target;
  }

  private normalizeNotification(item: any): SystemNotification {
    return {
      id: item.id || `notif_${Math.random().toString(36).substring(2, 9)}`,
      type: item.type || 'info',
      titre: item.titre || item.title || 'Notification',
      message: item.message || item.description || '',
      route_url: item.route_url || item.url || item.link,
      couleur: item.couleur || item.color || this.mapTypeToColor(item.type),
      is_read: item.is_read === true || item.is_read === 1 || item.read_at !== null && item.read_at !== undefined,
      read_at: item.read_at,
      created_at: item.created_at || item.date || new Date().toISOString(),
      meta_data: item.meta_data || item.metadata || {}
    };
  }

  private mapTypeToColor(type?: string): string {
    switch (type) {
      case 'alerte':
      case 'danger':
        return 'danger';
      case 'rappel':
      case 'warning':
        return 'warning';
      case 'activite':
      case 'success':
        return 'success';
      default:
        return 'info';
    }
  }
}
