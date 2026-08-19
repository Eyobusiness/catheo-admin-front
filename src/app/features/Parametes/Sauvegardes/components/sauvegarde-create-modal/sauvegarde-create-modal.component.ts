import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CreateSauvegardeRequest, TypeSauvegarde } from '../../models/sauvegarde.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-sauvegarde-create-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './sauvegarde-create-modal.component.html',
  styleUrl: './sauvegarde-create-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SauvegardeCreateModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isLoading = input<boolean>(false);

  public readonly closed = output<void>();
  public readonly submitted = output<CreateSauvegardeRequest>();

  protected readonly form = new FormGroup({
    nom_personnalise: new FormControl('', { nonNullable: true }),
    type: new FormControl<TypeSauvegarde>('manuel', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        const now = new Date();
        const dateStr = now.toLocaleDateString('fr-FR').replace(/\//g, '-');
        const timeStr = now.toTimeString().substring(0, 5).replace(':', 'h');
        this.form.reset({
          nom_personnalise: `catheo_paroisse_cim_${dateStr}_${timeStr}`,
          type: 'manuel'
        });
      }
    });
  }

  protected onClose(): void {
    this.closed.emit();
  }

  protected onSubmit(): void {
    const val = this.form.getRawValue();
    this.submitted.emit({
      nom_personnalise: val.nom_personnalise || undefined,
      type: val.type
    });
  }
}
