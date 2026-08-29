import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
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
    effect(() => {
      if (!this.isOpen()) return;

      const item = this.tarifToEdit();
      const activeAnneeId = this.activeAnnee()?.id || '';

      if (this.isEditing() && item) {
        // Collect existing niveau ids (single or multiple)
        const initialNiveauIds: string[] = [];
        if (item.niveaux && item.niveaux.length > 0) {
          item.niveaux.forEach(n => initialNiveauIds.push(n.id));
        } else if (item.niveau_id) {
          initialNiveauIds.push(item.niveau_id);
        } else if (item.niveau?.id) {
          initialNiveauIds.push(item.niveau.id);
        }
        this.selectedNiveauIds.set(initialNiveauIds);

        this.form.setValue({
          annee_catechese_id: item.annee_catechese_id || (item.annee_catechese as any)?.id || activeAnneeId,
          intitule: item.intitule,
          montant: item.montant,
          type_tarif: item.type_tarif || 'inscription',
          description: item.description || null,
          est_obligatoire: item.est_obligatoire ?? true
        });
      } else {
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
    const allIds = this.niveaux().map(n => n.id);
    this.selectedNiveauIds.set(allIds);
  }

  protected clearAllNiveaux(): void {
    this.selectedNiveauIds.set([]);
  }

  protected areAllNiveauxSelected(): boolean {
    const list = this.niveaux();
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
      const primaryNiveauId = selectedIds.length === 1 ? selectedIds[0] : (selectedIds.length > 0 ? selectedIds[0] : undefined);

      if (this.isEditing()) {
        const dto: UpdateTarifDto = {
          intitule: raw.intitule,
          montant: raw.montant,
          type_tarif: raw.type_tarif,
          niveau_id: primaryNiveauId,
          niveau_ids: selectedIds,
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
          niveau_ids: selectedIds,
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
