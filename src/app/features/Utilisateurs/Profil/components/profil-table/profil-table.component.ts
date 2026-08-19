import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ProfilDto } from '../../models/profil.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-profil-table',
  imports: [AppIconButton, AppButton],
  templateUrl: './profil-table.component.html',
  styleUrl: './profil-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilTableComponent {
  public readonly profils = input<ProfilDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly editRequested = output<ProfilDto>();
  public readonly deleteRequested = output<ProfilDto>();
  public readonly statusToggled = output<ProfilDto>();

  protected onEdit(p: ProfilDto): void {
    this.editRequested.emit(p);
  }

  protected onDelete(p: ProfilDto): void {
    this.deleteRequested.emit(p);
  }

  protected onToggleStatus(p: ProfilDto): void {
    this.statusToggled.emit(p);
  }
}
