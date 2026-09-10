import { ChangeDetectionStrategy, Component, computed, ElementRef, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SidebarService } from '../../../../../core/services/sidebar.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { SystemNotificationService } from '../../../../../core/services/system-notification.service';
import { SystemNotification } from '../../../../../core/models/system-notification.model';
import { AppButton } from '../../buttons/app-button/app-button.component';
import { DatePipe } from '@angular/common';
import { WorkingAnneeService } from '../../../../../core/services/working-annee.service';
import { CatechumeneService } from '../../../../../features/Catechumenes/liste-catechumene/services/catechumene.service';
import { CatechumeneDto } from '../../../../../features/Catechumenes/liste-catechumene/models/catechumene.model';
import { Subject, of, debounceTime, distinctUntilChanged, switchMap, catchError, finalize } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [AppButton, RouterLink, DatePipe],
  templateUrl: './app-header.component.html',
  styleUrl: './app-header.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown)': 'onDocumentKeyDown($event)'
  }
})
export class AppHeader implements OnInit {
  private readonly elementRef = inject(ElementRef);
  protected readonly sidebarService = inject(SidebarService);
  protected readonly toastService = inject(ToastService);
  protected readonly authService = inject(AuthService);
  protected readonly notificationService = inject(SystemNotificationService);
  protected readonly workingAnneeService = inject(WorkingAnneeService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly router = inject(Router);

  // Recherche dynamique de catéchumènes par année de travail
  public readonly searchQuery = signal<string>('');
  public readonly searchResults = signal<CatechumeneDto[]>([]);
  public readonly isSearching = signal<boolean>(false);
  public readonly showSearchResults = signal<boolean>(false);
  private readonly searchSubject = new Subject<string>();

  // Année pastorale de travail
  public readonly workingAnnee = this.workingAnneeService.workingAnnee;
  public readonly workingAnneeLibelle = this.workingAnneeService.workingAnneeLibelle;
  public readonly isOfficialActive = this.workingAnneeService.isOfficialActive;

  public readonly notificationCount = this.notificationService.unreadCount;
  public readonly recentNotifications = this.notificationService.recentNotifications;
  public readonly allNotifications = this.notificationService.notificationsList;

  public readonly displayNotifications = computed(() => {
    const recents = this.recentNotifications();
    const all = this.allNotifications();
    const mergedMap = new Map<string | number, SystemNotification>();
    recents.forEach(n => mergedMap.set(n.id, n));
    all.forEach(n => {
      if (!mergedMap.has(n.id)) {
        mergedMap.set(n.id, n);
      }
    });
    return Array.from(mergedMap.values()).slice(0, 5);
  });

  public readonly showNotifications = signal<boolean>(false);
  public readonly showUserMenu = signal<boolean>(false);

  // Authenticated user signal
  protected readonly user = this.authService.currentUser;

  protected readonly displayName = computed(() => {
    const u = this.user();
    if (!u) return 'Administrateur';
    if (u.nom && u.prenoms) return `${u.nom} ${u.prenoms}`;
    if (u.name) return u.name;
    if (u.nom) return u.nom;
    return u.email ? u.email.split('@')[0] : 'Administrateur';
  });

  protected readonly userInitials = computed(() => {
    const u = this.user();
    if (u?.nom && u?.prenoms) {
      return `${u.nom.charAt(0)}${u.prenoms.charAt(0)}`.toUpperCase();
    }
    const name = this.displayName();
    if (!name) return 'AD';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  });

  protected readonly userRole = computed(() => {
    const u = this.user();
    if (!u) return '';
    return u.role_nom || u.role || u.profil?.nom || u.profil?.libelle || u.profil_nom || u.paroisse?.nom || u.paroisse_nom || 'Paroisse CIM';
  });

  public ngOnInit(): void {
    // Écoute de la barre de recherche avec debounce et filtre selon l'année pastorale
    this.searchSubject.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      switchMap(term => {
        const q = term.trim();
        if (!q) {
          this.searchResults.set([]);
          this.isSearching.set(false);
          return of([]);
        }
        this.isSearching.set(true);
        const anneeId = this.workingAnneeService.workingAnneeId();
        return this.catechumeneService.searchQuick(q, anneeId).pipe(
          catchError(() => of([])),
          finalize(() => this.isSearching.set(false))
        );
      })
    ).subscribe(results => {
      this.searchResults.set(results);
      this.showSearchResults.set(true);
    });

    // Charger le compteur de notifications et la liste pour le dropdown
    this.notificationService.fetchUnreadCount().subscribe();
    this.notificationService.fetchNotifications().subscribe();

    // Charger l'utilisateur connecté depuis l'API/BD
    if (this.authService.token()) {
      this.authService.getMe().subscribe();
    }
  }

  /**
   * Raccourci clavier global : Ctrl+K ou Cmd+K pour activer la recherche
   */
  protected onDocumentKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      const input = this.elementRef.nativeElement.querySelector('.search-input') as HTMLInputElement;
      input?.focus();
      if (this.searchQuery().trim().length > 0) {
        this.showSearchResults.set(true);
      }
    } else if (event.key === 'Escape') {
      this.showSearchResults.set(false);
    }
  }

  /**
   * Fermeture automatique si clic en dehors des conteneurs de menu
   */
  protected onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target) return;

    const notifContainer = this.elementRef.nativeElement.querySelector('.notifications-menu-container');
    const userMenuContainer = this.elementRef.nativeElement.querySelector('.user-menu-container');
    const searchContainer = this.elementRef.nativeElement.querySelector('.header-search');

    if (this.showNotifications() && notifContainer && !notifContainer.contains(target)) {
      this.showNotifications.set(false);
    }

    if (this.showUserMenu() && userMenuContainer && !userMenuContainer.contains(target)) {
      this.showUserMenu.set(false);
    }

    if (this.showSearchResults() && searchContainer && !searchContainer.contains(target)) {
      this.showSearchResults.set(false);
    }
  }

  protected onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    this.searchQuery.set(val);
    this.searchSubject.next(val);
  }

  protected onSearchFocus(): void {
    if (this.searchQuery().trim().length > 0) {
      this.showSearchResults.set(true);
    }
  }

  protected clearSearch(): void {
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showSearchResults.set(false);
  }

  protected goToCatechumeneDetail(cat: CatechumeneDto, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchResults.set(false);
    this.router.navigate(['/catechumenes'], {
      queryParams: { id: cat.id, matricule: cat.matricule }
    });
  }

  protected toggleNotifications(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const nextState = !this.showNotifications();
    this.showNotifications.set(nextState);
    if (nextState) {
      this.notificationService.fetchUnreadCount().subscribe();
      this.notificationService.fetchNotifications().subscribe();
    }
    if (this.showUserMenu()) this.showUserMenu.set(false);
  }

  protected toggleUserMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    const nextState = !this.showUserMenu();
    this.showUserMenu.set(nextState);
    if (this.showNotifications()) this.showNotifications.set(false);
  }

  protected onNotificationClick(notif: SystemNotification): void {
    this.showNotifications.set(false);
    this.notificationService.handleNotificationClick(notif);
  }

  protected markAllNotificationsAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  protected goToNotificationsPage(): void {
    this.showNotifications.set(false);
    this.router.navigate(['/notifications']);
  }

  protected triggerQuickAction(): void {
    this.notificationService.fetchUnreadCount().subscribe();
    this.authService.getMe().subscribe();
    this.toastService.success('Synchronisation', 'Données pastorales et utilisateur actualisées.');
  }

  protected onLogout(): void {
    this.showUserMenu.set(false);
    this.authService.logout().subscribe();
  }
}
