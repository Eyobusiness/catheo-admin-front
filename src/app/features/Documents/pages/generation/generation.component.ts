import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DocumentsService } from '../../services/documents.service';
import { DocumentGenereDto } from '../../models/document-officiel.model';
import { CatechumeneService } from '../../../Catechumenes/liste-catechumene/services/catechumene.service';
import { CatechumeneDto } from '../../../Catechumenes/liste-catechumene/models/catechumene.model';
import { InscriptionAnnuelleService } from '../../../Catechumenes/inscriptions-annuelles/services/inscription-annuelle.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

export interface EnrichedCatechumene {
  id: string;
  matricule: string;
  nom: string;
  prenoms: string;
  nom_complet: string;
  telephone?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  section?: string;
  niveau?: string;
  classe?: string;
  statut?: string;
  rawCatechumene: CatechumeneDto;
}

@Component({
  selector: 'app-generation-documents-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './generation.component.html',
  styleUrl: './generation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GenerationDocumentsPageComponent implements OnInit {
  public readonly service = inject(DocumentsService);
  protected readonly catechumeneService = inject(CatechumeneService);
  protected readonly inscriptionService = inject(InscriptionAnnuelleService);
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly router = inject(Router);

  // Étape 1 : Recherche Catéchumène
  public readonly searchQuery = signal('');
  public readonly selectedCatechumene = signal<EnrichedCatechumene | null>(null);

  // Liste combinée et enrichie des catéchumènes
  public readonly allCandidates = computed<EnrichedCatechumene[]>(() => {
    const cats = this.catechumeneService.catechumenes();
    const ins = this.inscriptionService.inscriptions();

    const insMap = new Map<string, any>();
    ins.forEach(i => {
      const catId = i.catechumene_id || i.catechumene?.id;
      if (catId) {
        insMap.set(catId, i);
      }
    });

    return cats.map(c => {
      const inscription = insMap.get(c.id);
      const matricule = c.matricule || c.code_catechumene || 'CAT-AUTO';
      const nom = c.nom || '';
      const prenoms = c.prenoms || '';
      const nom_complet = c.nom_complet || `${nom} ${prenoms}`.trim();

      const section = inscription?.section?.nom || '';
      const niveau = inscription?.niveau?.nom || '';
      const classe = inscription?.classe?.nom || c.classe_scolaire || '';

      return {
        id: c.id,
        matricule,
        nom,
        prenoms,
        nom_complet,
        telephone: c.telephone,
        date_naissance: c.date_naissance,
        lieu_naissance: c.lieu_naissance,
        section,
        niveau,
        classe,
        statut: c.statut,
        rawCatechumene: c
      };
    });
  });

  // Résultats de la recherche (plein texte multi-termes)
  public readonly searchResults = computed<EnrichedCatechumene[]>(() => {
    const list = this.allCandidates();
    const q = this.searchQuery().toLowerCase().trim();

    if (!q) {
      // Retourne les 15 premiers catéchumènes pour un affichage direct
      return list.slice(0, 15);
    }

    const terms = q.split(/\s+/).filter(Boolean);

    return list.filter(c => {
      const haystack = `${c.matricule} ${c.nom} ${c.prenoms} ${c.nom_complet} ${c.telephone || ''} ${c.section || ''} ${c.niveau || ''} ${c.classe || ''}`.toLowerCase();
      return terms.every(term => haystack.includes(term));
    });
  });

  // Étape 2 : Choix Modèle & Options
  public readonly selectedModeleId = signal<string>('');
  public readonly moyenneNote = signal<string>('');
  public readonly decisionEvaluation = signal<string>('');

  // Filtre Historique
  public readonly historySearchQuery = signal('');

  public readonly filteredHistory = computed(() => {
    const q = this.historySearchQuery().toLowerCase().trim();
    const list = this.service.documentsGeneres();
    if (!q) return list;
    return list.filter(d => {
      const catNom = d.catechumene?.nom_complet || (d.catechumene ? `${d.catechumene.nom} ${d.catechumene.prenoms || ''}` : '');
      const catMat = d.catechumene?.matricule || d.catechumene?.code_catechumene || '';
      const text = `${d.titre || ''} ${d.reference_document || ''} ${d.modele_titre || ''} ${catNom} ${catMat}`.toLowerCase();
      return text.includes(q);
    });
  });

  // Modales & Suppressions
  public readonly isDeleteConfirmOpen = signal(false);
  public readonly selectedDocToDelete = signal<DocumentGenereDto | null>(null);

  public ngOnInit(): void {
    this.service.getModeles().subscribe(list => {
      if (list.length > 0 && !this.selectedModeleId()) {
        const firstActif = list.find(m => m.statut === 'actif');
        if (firstActif) {
          this.selectedModeleId.set(firstActif.id);
        }
      }
    });
    this.service.getDocumentsGeneres().subscribe();
    this.catechumeneService.getAll().subscribe();
    this.inscriptionService.getAll().subscribe();
  }

  public selectCatechumene(c: EnrichedCatechumene): void {
    this.selectedCatechumene.set(c);
  }

  public resetCatechumeneSelection(): void {
    this.selectedCatechumene.set(null);
    this.searchQuery.set('');
  }

  public genererDocumentOfficiel(): void {
    const cat = this.selectedCatechumene();
    const modeleId = this.selectedModeleId();

    if (!cat || !modeleId) {
      return;
    }

    const vars: Record<string, string> = {};
    if (this.moyenneNote().trim()) {
      vars['moyenne'] = this.moyenneNote().trim();
    }
    if (this.decisionEvaluation().trim()) {
      vars['decision'] = this.decisionEvaluation().trim();
    }

    const anneeId = this.anneeService.activeAnnee()?.id;

    this.service.genererDocument({
      modele_document_id: modeleId,
      catechumene_id: cat.id,
      annee_catechese_id: anneeId,
      variables_personnalisees: vars
    }).subscribe(created => {
      if (created) {
        setTimeout(() => {
          this.voirDocumentApercu(created.id);
        }, 500);
      }
    });
  }

  public voirDocumentApercu(id: string): void {
    this.router.navigate(['/documents/apercu', id]);
  }

  public openDeleteConfirm(doc: DocumentGenereDto): void {
    this.selectedDocToDelete.set(doc);
    this.isDeleteConfirmOpen.set(true);
  }

  public confirmDeleteDoc(): void {
    const doc = this.selectedDocToDelete();
    if (doc) {
      this.service.deleteDocumentGenere(doc.id).subscribe(() => {
        this.isDeleteConfirmOpen.set(false);
      });
    }
  }

  public getCatechumeneDisplayName(doc: DocumentGenereDto): string {
    if (doc.catechumene?.nom_complet) return doc.catechumene.nom_complet;
    if (doc.catechumene?.nom) {
      return `${doc.catechumene.nom} ${doc.catechumene.prenoms || doc.catechumene.prenom || ''}`.trim();
    }
    return 'Catéchumène';
  }

  public getCatechumeneMatricule(doc: DocumentGenereDto): string {
    return doc.catechumene?.matricule || doc.catechumene?.code_catechumene || '-';
  }
}
