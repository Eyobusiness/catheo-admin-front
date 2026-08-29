import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentsService } from '../../services/documents.service';
import { ModeleDocumentDto, TypeDocumentOfficiel } from '../../models/document-officiel.model';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';

@Component({
  selector: 'app-modeles-documents-page',
  imports: [CommonModule, FormsModule, EnteteCatecheseComponent],
  templateUrl: './modeles.component.html',
  styleUrl: './modeles.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelesDocumentsPageComponent implements OnInit {
  public readonly service = inject(DocumentsService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  public readonly searchQuery = signal('');
  public readonly filterCategorie = signal<string>('toutes');
  public readonly filterStatut = signal<string>('tous');

  public readonly categoriesList: { value: string; label: string }[] = [
    { value: 'certificat', label: 'Certificat' },
    { value: 'attestation', label: 'Attestation' },
    { value: 'convocation', label: 'Convocation' },
    { value: 'carte', label: 'Carte' },
    { value: 'fiche', label: 'Fiche' },
    { value: 'autre', label: 'Autre' }
  ];

  public readonly filteredModeles = computed(() => {
    let list = this.service.modeles();
    const q = this.searchQuery().toLowerCase().trim();
    const cat = this.filterCategorie();
    const st = this.filterStatut();

    if (q) {
      list = list.filter(m =>
        (m.titre && m.titre.toLowerCase().includes(q)) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.type_document && m.type_document.toLowerCase().includes(q)) ||
        (m.code && m.code.toLowerCase().includes(q))
      );
    }

    if (cat !== 'toutes') {
      list = list.filter(m => m.type_document === cat);
    }

    if (st !== 'tous') {
      list = list.filter(m => m.statut === st);
    }

    return list;
  });

  // Modal Aperçu
  public readonly isPreviewModalOpen = signal(false);
  public readonly selectedModele = signal<ModeleDocumentDto | null>(null);
  public readonly previewContentHtml = signal<SafeHtml>('');

  // Modal Confirmation Suppression
  public readonly isDeleteConfirmOpen = signal(false);

  // Toast
  public readonly toastMessage = signal('');
  public readonly toastType = signal<'success' | 'danger' | 'warning' | 'info'>('success');
  public readonly isToastOpen = signal(false);

  public ngOnInit(): void {
    this.service.getModeles().subscribe();
    this.service.getVariablesSysteme().subscribe();
  }

  public openNewModelePage(): void {
    this.router.navigate(['/documents/modeles/nouveau']);
  }

  public openEditModelePage(m: ModeleDocumentDto): void {
    this.router.navigate(['/documents/modeles/editer', m.id]);
  }

  public openPreviewModal(m: ModeleDocumentDto): void {
    this.selectedModele.set(m);
    const rendered = this.service.fusionnerContenu(m.contenu);
    this.previewContentHtml.set(this.sanitizer.bypassSecurityTrustHtml(rendered));
    this.isPreviewModalOpen.set(true);
  }

  public openDeleteConfirm(m: ModeleDocumentDto): void {
    this.selectedModele.set(m);
    this.isDeleteConfirmOpen.set(true);
  }

  public confirmDeleteModele(): void {
    const target = this.selectedModele();
    if (target) {
      this.service.deleteModele(target.id).subscribe(ok => {
        if (ok) {
          this.isDeleteConfirmOpen.set(false);
        }
      });
    }
  }

  public dupliquerModele(m: ModeleDocumentDto): void {
    this.service.createModele({
      titre: `${m.titre} (Copie)`,
      code: m.code ? `${m.code}_COPIE` : undefined,
      type_document: m.type_document,
      description: m.description,
      contenu: m.contenu,
      statut: 'actif',
      en_tete_active: m.en_tete_active,
      pied_page_active: m.pied_page_active,
      signature_nom: m.signature_nom,
      signature_titre: m.signature_titre
    }).subscribe();
  }

  public toggleStatut(m: ModeleDocumentDto): void {
    this.service.toggleStatutModele(m.id).subscribe();
  }

  public getCategoryBadgeLabel(type: TypeDocumentOfficiel): string {
    switch (type) {
      case 'certificat': return 'Certificat';
      case 'attestation': return 'Attestation';
      case 'convocation': return 'Convocation';
      case 'carte': return 'Carte';
      case 'fiche': return 'Fiche';
      default: return 'Autre';
    }
  }
}
