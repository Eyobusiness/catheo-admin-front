import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeanceDto, RecordPresencesBatchDto, PresenceItemDto } from '../../models/seance.model';
import { InscriptionAnnuelleDto } from '../../../Catechumenes/inscriptions-annuelles/models/inscription-annuelle.model';
import { AppDialog } from '../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../shared/ui/components/buttons/app-button/app-button.component';

export interface PresenceEntry {
  catechumene_id: string;
  nom_complet: string;
  code_catechumene?: string;
  sexe?: string;
  est_present: boolean;
  motif_absence: string;
}

@Component({
  selector: 'app-seance-presences-modal',
  imports: [CommonModule, FormsModule, DatePipe, AppDialog, AppButton],
  templateUrl: './seance-presences-modal.component.html',
  styleUrl: './seance-presences-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SeancePresencesModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly seance = input<SeanceDto | null>(null);
  public readonly inscriptions = input<InscriptionAnnuelleDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly presencesSubmitted = output<{
    seanceId: string;
    dto: RecordPresencesBatchDto;
  }>();

  protected readonly entries = signal<PresenceEntry[]>([]);
  protected readonly searchQuery = signal<string>('');
  protected readonly filterStatus = signal<'all' | 'present' | 'absent'>('all');

  protected readonly filteredEntries = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const status = this.filterStatus();
    let list = this.entries();

    if (status === 'present') {
      list = list.filter(e => e.est_present);
    } else if (status === 'absent') {
      list = list.filter(e => !e.est_present);
    }

    if (!q) return list;
    return list.filter(e =>
      e.nom_complet.toLowerCase().includes(q) ||
      (e.code_catechumene && e.code_catechumene.toLowerCase().includes(q))
    );
  });

  protected readonly totalCount = computed(() => this.entries().length);
  protected readonly presentCount = computed(() => this.entries().filter(e => e.est_present).length);
  protected readonly absentCount = computed(() => this.entries().filter(e => !e.est_present).length);
  protected readonly tauxPresence = computed(() => {
    const total = this.totalCount();
    if (total === 0) return 0;
    return Math.round((this.presentCount() / total) * 100);
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      const currentSeance = this.seance();
      const allInscriptions = this.inscriptions();
      const classeId = currentSeance?.classe_id || currentSeance?.classe?.id;

      // Filter inscriptions for this class
      const classInscriptions = classeId
        ? allInscriptions.filter(ins => ins.classe_id === classeId || ins.classe?.id === classeId)
        : allInscriptions;

      const existingPresences = currentSeance?.presences || [];
      const presenceMap = new Map<string, PresenceItemDto>();
      existingPresences.forEach(p => presenceMap.set(p.catechumene_id, p));

      const newEntries: PresenceEntry[] = [];

      if (classInscriptions.length > 0) {
        classInscriptions.forEach(ins => {
          const catId = ins.catechumene_id || ins.catechumene?.id || ins.id;
          const nom = ins.catechumene
            ? `${ins.catechumene.nom} ${ins.catechumene.prenoms}`
            : (ins.code_inscription ? `Catéchumène (${ins.code_inscription})` : 'Catéchumène');

          const recorded = presenceMap.get(catId);
          const isPresent = recorded ? (recorded.est_present ?? (recorded.statut_presence === 'present')) : true;

          newEntries.push({
            catechumene_id: catId,
            nom_complet: nom,
            code_catechumene: ins.catechumene?.code_catechumene || ins.code_inscription,
            sexe: ins.catechumene?.sexe,
            est_present: isPresent,
            motif_absence: recorded?.motif_absence || recorded?.remarque || ''
          });
        });
      } else if (existingPresences.length > 0) {
        existingPresences.forEach(p => {
          newEntries.push({
            catechumene_id: p.catechumene_id,
            nom_complet: p.catechumene ? `${p.catechumene.nom} ${p.catechumene.prenoms}` : `Catéchumène ${p.catechumene_id}`,
            code_catechumene: p.catechumene?.code_catechumene,
            sexe: p.catechumene?.sexe,
            est_present: p.est_present ?? (p.statut_presence === 'present'),
            motif_absence: p.motif_absence || p.remarque || ''
          });
        });
      }

      this.entries.set(newEntries);
      this.searchQuery.set('');
      this.filterStatus.set('all');
    }, { allowSignalWrites: true });
  }

  protected setAllStatus(present: boolean): void {
    this.entries.update(list =>
      list.map(e => ({
        ...e,
        est_present: present,
        motif_absence: present ? '' : e.motif_absence
      }))
    );
  }

  protected togglePresence(entry: PresenceEntry): void {
    this.entries.update(list =>
      list.map(e => {
        if (e.catechumene_id === entry.catechumene_id) {
          const next = !e.est_present;
          return {
            ...e,
            est_present: next,
            motif_absence: next ? '' : e.motif_absence
          };
        }
        return e;
      })
    );
  }

  protected updateMotif(entry: PresenceEntry, motif: string): void {
    this.entries.update(list =>
      list.map(e => (e.catechumene_id === entry.catechumene_id ? { ...e, motif_absence: motif } : e))
    );
  }

  protected onSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchQuery.set(input.value);
  }

  protected setFilter(status: 'all' | 'present' | 'absent'): void {
    this.filterStatus.set(status);
  }

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    const currentSeance = this.seance();
    if (!currentSeance) return;

    const dto: RecordPresencesBatchDto = {
      presences: this.entries().map(e => ({
        catechumene_id: e.catechumene_id,
        statut_presence: e.est_present ? 'present' : 'absent',
        remarque: !e.est_present && e.motif_absence.trim() ? e.motif_absence.trim() : undefined
      }))
    };

    this.presencesSubmitted.emit({
      seanceId: currentSeance.id,
      dto
    });
  }
}
