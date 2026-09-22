import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimateurClasseService } from '../../services/animateur-classe.service';
import { SeanceService } from '../../../Presences/services/seance.service';
import { SeanceDto, StatutPresence } from '../../../Presences/models/seance.model';
import { ToastService } from '../../../../core/services/toast.service';
import { CloturePeriodeService } from '../../../../core/services/cloture-periode.service';

interface ElevePresenceRow {
  catechumene_id: string;
  matricule?: string;
  nom: string;
  prenoms: string;
  sexe?: string;
  telephone?: string;
  telephone_parent?: string;
  nom_parent?: string;
  statut_presence: StatutPresence;
  remarque?: string;
}

@Component({
  selector: 'app-animateur-presences-page',
  imports: [RouterLink],
  templateUrl: './animateur-presences-page.component.html',
  styleUrl: './animateur-presences-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurPresencesPageComponent implements OnInit {
  protected readonly classeService = inject(AnimateurClasseService);
  protected readonly seanceService = inject(SeanceService);
  protected readonly toastService = inject(ToastService);
  protected readonly clotureService = inject(CloturePeriodeService);

  public readonly lockMessage = CloturePeriodeService.LOCK_MESSAGE;

  protected readonly isSaving = signal<boolean>(false);
  protected readonly selectedSeanceId = signal<string>('');
  protected readonly presencesRows = signal<ElevePresenceRow[]>([]);

  public readonly isCurrentSeanceLocked = computed(() => {
    const seance = this.selectedSeance();
    const cls = this.classe();
    if (!seance) return false;
    const classeId = seance.classe_id || seance.classe?.id || cls?.id;
    return this.clotureService.isLocked({
      date: seance.date_seance || (seance as any).date,
      classeId: classeId ? Number(classeId) : undefined
    });
  });

  constructor() {
    effect(() => {
      const cats = this.catechumenes();
      const seanceId = this.selectedSeanceId();
      if (cats.length > 0 && seanceId && this.presencesRows().length === 0) {
        const seance = this.seances().find(s => s.id === seanceId);
        this.buildRowsForSeance(seance, cats);
      }
    });
  }

  protected readonly seances = this.seanceService.seances;
  protected readonly classe = this.classeService.classe;
  protected readonly catechumenes = this.classeService.catechumenes;

  // Séances de la classe de l'animateur uniquement
  protected readonly classeSeances = computed(() => {
    const cls = this.classe();
    if (!cls) return [];
    const idStr = String(cls.id || '');
    const uuidStr = String(cls.uuid || '');
    const nomStr = (cls.nom || '').toLowerCase().trim();

    return this.seances().filter(s => {
      const sClsId = String(s.classe_id || s.classe?.id || '');
      const sClsUuid = String((s.classe as any)?.uuid || '');
      const sClsNom = (s.classe?.nom || '').toLowerCase().trim();
      return (idStr && (sClsId === idStr || sClsUuid === idStr)) ||
             (uuidStr && (sClsId === uuidStr || sClsUuid === uuidStr)) ||
             (nomStr && sClsNom === nomStr);
    });
  });

  protected readonly selectedSeance = computed<SeanceDto | null>(() => {
    const id = this.selectedSeanceId();
    if (!id) return null;
    return this.seances().find(s => s.id === id) || null;
  });

  protected readonly totalPresents = computed(() => {
    return this.presencesRows().filter(r => r.statut_presence === 'present').length;
  });

  protected readonly totalAbsents = computed(() => {
    return this.presencesRows().filter(r => r.statut_presence === 'absent').length;
  });

  public ngOnInit(): void {
    this.classeService.getMaClasse().subscribe({
      next: () => this.loadSeancesAndInit(),
      error: () => this.loadSeancesAndInit()
    });
  }

  private loadSeancesAndInit(): void {
    const cls = this.classe();
    const clsId = cls?.uuid || (cls?.id ? String(cls.id) : undefined);
    this.seanceService.getAll(clsId).subscribe(() => {
      const filtered = this.classeSeances();
      if (filtered && filtered.length > 0) {
        this.selectSeance(filtered[0].id);
      }
    });
  }

  protected selectSeance(seanceId: string): void {
    this.selectedSeanceId.set(seanceId);
    const seance = this.seances().find(s => s.id === seanceId);
    this.buildRowsForSeance(seance, this.catechumenes());
  }

  private buildRowsForSeance(seance: SeanceDto | undefined, cats: any[]): void {
    if (!cats || cats.length === 0) {
      this.presencesRows.set([]);
      return;
    }

    const rows: ElevePresenceRow[] = cats.map(c => {
      const catId = String(c.id || c.uuid || c.catechumene_id || '');
      const existing = seance?.presences?.find(
        p => String(p.catechumene_id) === catId || String(p.catechumene?.id) === catId
      );

      const statut: StatutPresence = (existing?.statut_presence as StatutPresence) || 'present';

      return {
        catechumene_id: catId,
        matricule: c.matricule,
        nom: c.nom,
        prenoms: c.prenoms,
        sexe: c.sexe,
        telephone: c.telephone,
        telephone_parent: c.telephone_parent,
        nom_parent: c.nom_parent,
        statut_presence: statut,
        remarque: existing?.remarque || ''
      };
    });

    this.presencesRows.set(rows);
  }

  protected togglePresence(row: ElevePresenceRow, statut: StatutPresence): void {
    if (this.isCurrentSeanceLocked()) {
      this.toastService.warning('Période clôturée', CloturePeriodeService.LOCK_MESSAGE);
      return;
    }

    this.presencesRows.update(list =>
      list.map(r => (r.catechumene_id === row.catechumene_id ? { ...r, statut_presence: statut } : r))
    );
  }

  protected setAllPresents(): void {
    if (this.isCurrentSeanceLocked()) {
      this.toastService.warning('Période clôturée', CloturePeriodeService.LOCK_MESSAGE);
      return;
    }

    this.presencesRows.update(list =>
      list.map(r => ({ ...r, statut_presence: 'present' as StatutPresence }))
    );
    this.toastService.info('Appel', 'Tous les catéchumènes ont été marqués comme Présents.');
  }

  protected savePresences(): void {
    if (this.isCurrentSeanceLocked()) {
      this.toastService.warning('Période clôturée', CloturePeriodeService.LOCK_MESSAGE);
      return;
    }

    const sId = this.selectedSeanceId();
    if (!sId) {
      this.toastService.warning('Attention', 'Veuillez sélectionner une séance.');
      return;
    }

    const payload = {
      presences: this.presencesRows().map(r => ({
        catechumene_id: r.catechumene_id,
        statut_presence: r.statut_presence,
        remarque: r.remarque
      }))
    };

    this.isSaving.set(true);
    this.seanceService.recordPresences(sId, payload).subscribe({
      next: () => {
        this.isSaving.set(false);
      },
      error: (err) => {
        this.isSaving.set(false);
        if (err?.status === 403) {
          const msg = err?.error?.message || CloturePeriodeService.LOCK_MESSAGE;
          this.toastService.error('Action non autorisée', msg);
        }
      }
    });
  }
}
