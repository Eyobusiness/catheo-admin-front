import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { PreinscriptionDto, RejeterPreinscriptionDto } from '../../models/preinscription.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-preinscription-rejeter-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './preinscription-rejeter-modal.component.html',
  styleUrl: './preinscription-rejeter-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreinscriptionRejeterModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly preinscription = input<PreinscriptionDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly rejected = output<RejeterPreinscriptionDto>();

  protected readonly form = new FormGroup({
    motif: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5)]
    })
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      this.rejected.emit({
        motif: this.form.controls.motif.value
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
