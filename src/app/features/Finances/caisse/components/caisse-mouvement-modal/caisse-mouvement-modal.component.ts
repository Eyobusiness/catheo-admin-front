import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CreateMouvementCaisseDto, TypeMouvementCaisse } from '../../models/caisse.model';
import { AnneeCatecheseService } from '../../../../../core/services/annee-catechese.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-caisse-mouvement-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './caisse-mouvement-modal.component.html',
  styleUrl: './caisse-mouvement-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CaisseMouvementModalComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly isOpen = input<boolean>(false);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly formSubmitted = output<CreateMouvementCaisseDto>();

  protected readonly activeAnnee = this.anneeService.activeAnnee;

  protected readonly form = new FormGroup({
    type_mouvement: new FormControl<TypeMouvementCaisse>('sortie', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    categorie: new FormControl('fournitures', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    montant: new FormControl<number>(5000, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)]
    }),
    reference_document: new FormControl<string | null>(null),
    libelle: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    date_mouvement: new FormControl(new Date().toISOString().substring(0, 10), {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) return;

      this.form.reset({
        type_mouvement: 'sortie',
        categorie: 'fournitures',
        montant: 5000,
        reference_document: null,
        libelle: '',
        date_mouvement: new Date().toISOString().substring(0, 10)
      });
    }, { allowSignalWrites: true });
  }

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const raw = this.form.getRawValue();
      const anneeId = this.activeAnnee()?.id || '';

      const dto: CreateMouvementCaisseDto = {
        annee_catechese_id: anneeId,
        type_mouvement: 'sortie',
        categorie: raw.categorie,
        montant: raw.montant,
        reference_document: raw.reference_document || undefined,
        libelle: raw.libelle,
        date_mouvement: raw.date_mouvement
      };

      this.formSubmitted.emit(dto);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
