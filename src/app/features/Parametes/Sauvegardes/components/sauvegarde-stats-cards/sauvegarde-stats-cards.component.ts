import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { SauvegardeDto } from '../../models/sauvegarde.model';

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

@Component({
  selector: 'app-sauvegarde-stats-cards',
  templateUrl: './sauvegarde-stats-cards.component.html',
  styleUrl: './sauvegarde-stats-cards.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SauvegardeStatsCardsComponent {
  public readonly sauvegardes = input<SauvegardeDto[]>([]);

  protected readonly totalCount = computed(() => this.sauvegardes().length);

  protected readonly totalSizeFormatted = computed(() => {
    const totalBytes = this.sauvegardes().reduce((acc, curr) => acc + (curr.taille_octets || 0), 0);
    return formatBytes(totalBytes);
  });

  protected readonly lastBackup = computed(() => {
    const list = this.sauvegardes();
    if (list.length === 0) return null;
    return list[0];
  });

  protected readonly automatiquesCount = computed(() => {
    return this.sauvegardes().filter(s => s.type === 'automatique').length;
  });

  protected readonly manuelsCount = computed(() => {
    return this.sauvegardes().filter(s => s.type === 'manuel').length;
  });
}
