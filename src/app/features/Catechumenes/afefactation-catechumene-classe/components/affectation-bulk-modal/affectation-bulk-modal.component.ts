import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ClasseDto } from '../../../../Organisations/Classe/models/classe.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-affectation-bulk-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './affectation-bulk-modal.component.html',
  styleUrl: './affectation-bulk-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffectationBulkModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly selectedCount = input<number>(0);
  public readonly classes = input<ClasseDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly modalClosed = output<void>();
  public readonly assigned = output<string>();

  protected readonly form = new FormGroup({
    classe_id: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  protected onClose(): void {
    this.modalClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      this.assigned.emit(this.form.controls.classe_id.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
