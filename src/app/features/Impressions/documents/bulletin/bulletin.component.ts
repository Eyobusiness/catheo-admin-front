import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';
import { BulletinDocData, BulletinBatchDocData } from '../../../Evaluations/bulletin/models/bulletin.model';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

@Component({
  selector: 'app-doc-bulletin',
  imports: [CommonModule, UpperCasePipe, EnteteCatecheseComponent],
  templateUrl: './bulletin.component.html',
  styleUrl: './bulletin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulletinDocComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<BulletinDocData | BulletinBatchDocData | null>(null);
  public readonly activeAnnee = this.anneeService.activeAnnee;

  public readonly bulletinsList = computed<BulletinDocData[]>(() => {
    const raw = this.data();
    if (!raw) return [];
    if ('bulletins' in raw && Array.isArray((raw as BulletinBatchDocData).bulletins)) {
      return (raw as BulletinBatchDocData).bulletins;
    }
    return [raw as BulletinDocData];
  });

  public getMentionAppreciation(moy: number | null | undefined): string {
    if (moy === null || moy === undefined) return 'Non évalué';
    if (moy >=17) return 'Excellent — Félicitations';
    if (moy >= 16) return 'Très Bien — Félicitations';
    if (moy >= 14) return 'Bien — Encouragements';
    if (moy >= 12) return 'Assez Bien — Travail satisfaisant';
    if (moy >= 10) return 'Passable — Peut mieux faire';
    if (moy >= 8.5) return 'Insuffisant — Ajourné';
    return 'Insuffisant — Non admis';
  }
}

