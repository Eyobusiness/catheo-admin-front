import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { VersementCureDto, CreateVersementDto, UpdateVersementDto, ModeRemise } from '../../models/versement.model';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-versement-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './versement-form-modal.component.html',
  styleUrl: './versement-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersementFormModalComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly versementToEdit = input<VersementCureDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateVersementDto | UpdateVersementDto>();

  protected readonly activeAnnee = this.anneeService.activeAnnee;

  protected readonly form = new FormGroup({
    periode_concernee: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    montant_verse: new FormControl<number>(50000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    mode_remise: new FormControl<ModeRemise>('especes', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    destinataire: new FormControl<string>('Curé de la Paroisse', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    effectue_par: new FormControl<string | null>(null),
    notes: new FormControl<string | null>(null)
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;

      const item = this.versementToEdit();
      if (this.isEditing() && item) {
        this.form.setValue({
          periode_concernee: item.periode_concernee,
          montant_verse: item.montant_verse,
          mode_remise: item.mode_remise,
          destinataire: item.destinataire || 'Curé de la Paroisse',
          effectue_par: item.effectue_par || null,
          notes: item.notes || null
        });
      } else {
        const date = new Date();
        const monthNames = [
          'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
          'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ];
        const defaultPeriode = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;

        this.form.reset({
          periode_concernee: defaultPeriode,
          montant_verse: 50000,
          mode_remise: 'especes',
          destinataire: 'Curé de la Paroisse',
          effectue_par: null,
          notes: null
        });
      }
    }, { allowSignalWrites: true });
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const anneeId = this.activeAnnee()?.id || undefined;

      if (this.isEditing()) {
        const dto: UpdateVersementDto = {
          periode_concernee: raw.periode_concernee,
          montant_verse: raw.montant_verse,
          mode_remise: raw.mode_remise,
          destinataire: raw.destinataire,
          effectue_par: raw.effectue_par || undefined,
          notes: raw.notes || undefined
        };
        this.formSubmitted.emit(dto);
      } else {
        const dto: CreateVersementDto = {
          annee_catechese_id: anneeId,
          periode_concernee: raw.periode_concernee,
          montant_verse: raw.montant_verse,
          mode_remise: raw.mode_remise,
          destinataire: raw.destinataire,
          effectue_par: raw.effectue_par || undefined,
          notes: raw.notes || undefined
        };
        this.formSubmitted.emit(dto);
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
