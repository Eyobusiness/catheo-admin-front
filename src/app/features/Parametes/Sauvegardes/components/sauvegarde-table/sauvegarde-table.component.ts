import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { SauvegardeDto } from '../../models/sauvegarde.model';
import { AppIconButton } from '../../../../../shared/ui/components/buttons/app-icon-button/app-icon-button.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-sauvegarde-table',
  imports: [AppIconButton, AppButton],
  templateUrl: './sauvegarde-table.component.html',
  styleUrl: './sauvegarde-table.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SauvegardeTableComponent {
  public readonly sauvegardes = input<SauvegardeDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly createRequested = output<void>();
  public readonly downloadRequested = output<SauvegardeDto>();
  public readonly restaurerRequested = output<SauvegardeDto>();
  public readonly deleteRequested = output<SauvegardeDto>();

  protected onDownload(s: SauvegardeDto): void {
    this.downloadRequested.emit(s);
  }

  protected onRestaurer(s: SauvegardeDto): void {
    this.restaurerRequested.emit(s);
  }

  protected onDelete(s: SauvegardeDto): void {
    this.deleteRequested.emit(s);
  }
}
