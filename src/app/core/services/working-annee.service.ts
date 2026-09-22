import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { AnneeCatechese } from '../models/annee-catechese.model';
import { AnneeCatecheseService } from './annee-catechese.service';
import { ToastService } from './toast.service';

const STORAGE_KEY = 'catheo_working_annee_id';

@Injectable({
  providedIn: 'root'
})
export class WorkingAnneeService {
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  // Signaux réactifs
  public readonly workingAnnee = signal<AnneeCatechese | null>(null);
  public readonly isModalOpen = signal<boolean>(false);

  // Accès aux années pastorales chargées
  public readonly availableAnnees = this.anneeService.annees;
  public readonly activeAnnee = this.anneeService.activeAnnee;
  public readonly isLoading = this.anneeService.isLoading;

  // Dérivations calculées
  public readonly workingAnneeId = computed(() => this.workingAnnee()?.id || '');
  public readonly workingAnneeLibelle = computed(() => {
    const current = this.workingAnnee() || this.activeAnnee();
    return current ? current.libelle : 'Année en cours';
  });

  public readonly isOfficialActive = computed(() => {
    const current = this.workingAnnee() || this.activeAnnee();
    return !!current && (current.est_active === true || current.statut === 'active');
  });

  constructor() {
    this.init();
  }

  /**
   * Initialisation : charge la liste des années et sélectionne soit l'année sauvegardée,
   * soit l'année actuellement active en base par défaut.
   */
  public init(): void {
    this.anneeService.getAll().subscribe({
      next: (list) => {
        this.resolveWorkingAnnee(list);
      }
    });
  }

  public resolveWorkingAnnee(list?: AnneeCatechese[]): void {
    const candidates = (list && Array.isArray(list) && list.length > 0)
      ? list
      : this.anneeService.annees();

    if (!candidates || candidates.length === 0) return;

    const savedId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    let selected: AnneeCatechese | undefined;

    if (savedId) {
      selected = candidates.find(a => String(a.id) === String(savedId));
    }

    // Si non trouvé ou pas de sauvegarde, repli sur l'année active officielle ou la plus récente
    if (!selected) {
      selected = candidates.find(a => a.est_active || a.statut === 'active') || candidates[0];
      if (selected && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, String(selected.id));
      }
    }

    if (selected) {
      this.workingAnnee.set(selected);
    }
  }

  /**
   * Sélectionne une nouvelle année pastorale de travail.
   */
  public setWorkingAnnee(annee: AnneeCatechese, reload: boolean = true): void {
    const previous = this.workingAnnee();
    if (previous && String(previous.id) === String(annee.id)) {
      this.closeModal();
      return;
    }

    this.workingAnnee.set(annee);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, String(annee.id));
    }
    this.closeModal();

    this.toastService.info(
      'Année pastorale de travail',
      `Vous travaillez désormais sur l'année : ${annee.libelle}`
    );

    if (reload && typeof window !== 'undefined') {
      // Rechargement propre pour appliquer le filtrage sur tous les composants & caches locaux
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  }

  public openModal(): void {
    // Rafraîchir la liste des années lors de l'ouverture
    this.anneeService.getAll().subscribe({
      next: (list) => {
        if (!this.workingAnnee()) {
          this.resolveWorkingAnnee(list);
        }
      }
    });
    if (!this.workingAnnee()) {
      this.resolveWorkingAnnee();
    }
    this.isModalOpen.set(true);
  }

  public closeModal(): void {
    this.isModalOpen.set(false);
  }
}
