import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TarifDto, CreateTarifDto, UpdateTarifDto, TypeTarif } from '../../models/tarif.model';
import { NiveauDto } from '../../../../Organisations/Niveaux/models/niveau.model';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-tarif-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './tarif-form-modal.component.html',
  styleUrl: './tarif-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TarifFormModalComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly tarifToEdit = input<TarifDto | null>(null);
  public readonly niveaux = input<NiveauDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateTarifDto | UpdateTarifDto>();

  protected readonly activeAnnee = this.anneeService.activeAnnee;

  // Track selected niveau IDs with a signal for multiple checkboxes
  protected readonly selectedNiveauIds = signal<string[]>([]);
  protected readonly selectedType = signal<string>('inscription');

  protected readonly isSacrementType = computed(() => {
    const t = this.selectedType().toLowerCase();
    return t.includes('sacrement') || t.includes('bapteme') || t.includes('communion') || t.includes('confirmation');
  });

  // For sacraments, only 3ème Année levels apply
  protected readonly displayedNiveaux = computed(() => {
    const all = this.niveaux();
    if (this.isSacrementType()) {
      return all.filter(n => n.nom.includes('3'));
    }
    return all;
  });

  protected readonly form = new FormGroup({
    annee_catechese_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    intitule: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    montant: new FormControl<number>(10000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0)]
    }),
    type_tarif: new FormControl<TypeTarif>('inscription', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    description: new FormControl<string | null>(null),
    est_obligatoire: new FormControl<boolean>(true, { nonNullable: true })
  });

  constructor() {
    this.form.controls.type_tarif.valueChanges.subscribe(val => {
      const typeStr = val || 'inscription';
      this.selectedType.set(typeStr);
      if (this.isSacrementType()) {
        const validTroisieme = this.displayedNiveaux().map(n => n.id);
        const current = this.selectedNiveauIds();
        const filtered = current.filter(id => validTroisieme.includes(id));
        this.selectedNiveauIds.set(filtered.length > 0 ? filtered : validTroisieme);
      }
    });

    effect(() => {
      if (!this.isOpen()) return;

      const item = this.tarifToEdit();
      const activeAnneeId = this.activeAnnee()?.id || '';

      if (this.isEditing() && item) {
        this.selectedType.set(item.type_tarif || 'inscription');

        // Collect existing niveau ids (single or multiple)
        const initialNiveauIds: string[] = [];
        if (item.niveaux && item.niveaux.length > 0) {
          item.niveaux.forEach(n => {
            const id = n.id || n.uuid;
            if (id) initialNiveauIds.push(String(id));
          });
        } else if (item.niveau_ids && item.niveau_ids.length > 0) {
          item.niveau_ids.forEach(id => initialNiveauIds.push(String(id)));
        } else if (item.niveau_id) {
          initialNiveauIds.push(String(item.niveau_id));
        } else if (item.niveau?.id || item.niveau?.uuid) {
          initialNiveauIds.push(String(item.niveau.id || item.niveau.uuid));
        }

        // If it's a sacrement, ensure only 3ème Année are checked
        if (this.isSacrementType()) {
          const validTroisieme = this.displayedNiveaux().map(n => n.id);
          const filtered = initialNiveauIds.filter(id => validTroisieme.includes(id));
          this.selectedNiveauIds.set(filtered.length > 0 ? filtered : validTroisieme);
        } else {
          this.selectedNiveauIds.set(initialNiveauIds);
        }

        this.form.setValue({
          annee_catechese_id: item.annee_catechese_id || (item.annee_catechese as any)?.id || activeAnneeId,
          intitule: item.intitule,
          montant: item.montant,
          type_tarif: item.type_tarif || 'inscription',
          description: item.description || null,
          est_obligatoire: item.est_obligatoire ?? true
        });
      } else {
        this.selectedType.set('inscription');
        this.selectedNiveauIds.set([]);
        this.form.reset({
          annee_catechese_id: activeAnneeId,
          intitule: '',
          montant: 10000,
          type_tarif: 'inscription',
          description: null,
          est_obligatoire: true
        });
      }
    }, { allowSignalWrites: true });
  }

  protected isNiveauSelected(niveauId: string): boolean {
    return this.selectedNiveauIds().includes(niveauId);
  }

  protected toggleNiveau(niveauId: string, event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    const current = this.selectedNiveauIds();
    if (checkbox.checked) {
      if (!current.includes(niveauId)) {
        this.selectedNiveauIds.set([...current, niveauId]);
      }
    } else {
      this.selectedNiveauIds.set(current.filter(id => id !== niveauId));
    }
  }

  protected selectAllNiveaux(): void {
    const allIds = this.displayedNiveaux().map(n => n.id);
    this.selectedNiveauIds.set(allIds);
  }

  protected clearAllNiveaux(): void {
    this.selectedNiveauIds.set([]);
  }

  protected areAllNiveauxSelected(): boolean {
    const list = this.displayedNiveaux();
    return list.length > 0 && list.every(n => this.selectedNiveauIds().includes(n.id));
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const anneeId = raw.annee_catechese_id || this.activeAnnee()?.id || '';
      const selectedIds = this.selectedNiveauIds();
      // Ensure that sacrament tarifs never include non-3ème Année levels
      const sanitizedIds = this.isSacrementType()
        ? selectedIds.filter(id => this.displayedNiveaux().some(n => n.id === id))
        : selectedIds;
      const primaryNiveauId = sanitizedIds.length > 0 ? sanitizedIds[0] : null;

      if (this.isEditing()) {
        const dto: UpdateTarifDto = {
          intitule: raw.intitule,
          montant: raw.montant,
          type_tarif: raw.type_tarif,
          niveau_id: primaryNiveauId,
          niveau_ids: sanitizedIds,
          description: raw.description || undefined,
          est_obligatoire: raw.est_obligatoire
        };
        this.formSubmitted.emit(dto);
      } else {
        const dto: CreateTarifDto = {
          annee_catechese_id: anneeId,
          intitule: raw.intitule,
          montant: raw.montant,
          type_tarif: raw.type_tarif,
          niveau_id: primaryNiveauId,
          niveau_ids: sanitizedIds,
          description: raw.description || undefined,
          est_obligatoire: raw.est_obligatoire
        };
        this.formSubmitted.emit(dto);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
