import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AnimateurClasseService } from '../../services/animateur-classe.service';
import { CatechumeneInscrit } from '../../model/animateur-classe.model';

@Component({
  selector: 'app-animateur-catechumenes-page',
  imports: [RouterLink],
  templateUrl: './animateur-catechumenes-page.component.html',
  styleUrl: './animateur-catechumenes-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimateurCatechumenesPageComponent implements OnInit {
  protected readonly classeService = inject(AnimateurClasseService);

  protected readonly isLoading = this.classeService.isLoading;
  protected readonly hasNoAffectation = this.classeService.hasNoAffectation;
  protected readonly classe = this.classeService.classe;
  protected readonly allCatechumenes = this.classeService.catechumenes;

  protected readonly searchQuery = signal<string>('');
  protected readonly selectedSexeFilter = signal<'all' | 'M' | 'F'>('all');

  protected readonly filteredCatechumenes = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const filterSexe = this.selectedSexeFilter();
    let list = this.allCatechumenes();

    if (filterSexe !== 'all') {
      list = list.filter(c => c.sexe === filterSexe);
    }

    if (q) {
      list = list.filter(c => {
        const nomComplet = `${c.nom} ${c.prenoms}`.toLowerCase();
        const mat = (c.matricule || '').toLowerCase();
        const tel = (c.telephone || '').replace(/\s+/g, '');
        const telP = (c.telephone_parent || '').replace(/\s+/g, '');
        const cleanQ = q.replace(/\s+/g, '');
        return nomComplet.includes(q) || mat.includes(q) || tel.includes(cleanQ) || telP.includes(cleanQ);
      });
    }

    return list;
  });

  public ngOnInit(): void {
    this.classeService.getMaClasse().subscribe();
  }

  protected onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.searchQuery.set(val);
  }

  protected setSexeFilter(sexe: 'all' | 'M' | 'F'): void {
    this.selectedSexeFilter.set(sexe);
  }
}
