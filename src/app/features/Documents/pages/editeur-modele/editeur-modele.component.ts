import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentsService } from '../../services/documents.service';
import {
  TypeDocumentOfficiel,
  StatutModeleDocument,
  ModeleDocumentVariableDto,
  CreateModeleDocumentDto,
  UpdateModeleDocumentDto
} from '../../models/document-officiel.model';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';

@Component({
  selector: 'app-editeur-modele-page',
  imports: [
    CommonModule,
    FormsModule,
    EnteteCatecheseComponent
  ],
  templateUrl: './editeur-modele.component.html',
  styleUrl: './editeur-modele.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditeurModelePageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly service = inject(DocumentsService);
  private readonly sanitizer = inject(DomSanitizer);

  public readonly isEditMode = signal(false);
  public readonly modeleId = signal<string | null>(null);

  public readonly formModele = signal<CreateModeleDocumentDto>({
    titre: '',
    code: '',
    type_document: 'attestation',
    description: '',
    contenu: '',
    statut: 'actif',
    en_tete_active: true,
    pied_page_active: true,
    signature_nom: 'Père Curé',
    signature_titre: 'Le Curé de la Paroisse'
  });

  public readonly categoriesList: { value: string; label: string }[] = [
    { value: 'certificat', label: 'Certificat' },
    { value: 'attestation', label: 'Attestation' },
    { value: 'convocation', label: 'Convocation' },
    { value: 'carte', label: 'Carte' },
    { value: 'fiche', label: 'Fiche' },
    { value: 'autre', label: 'Autre' }
  ];

  public readonly selectedVariableCategory = signal<string>('Toutes');
  public readonly showPreviewPanel = signal(true);
  public readonly previewContentHtml = signal<SafeHtml>('');

  public readonly filteredVariables = computed(() => {
    const list = this.service.variablesSysteme();
    const cat = this.selectedVariableCategory();
    if (cat === 'Toutes') return list;
    return list.filter(v => v.categorie === cat);
  });

  public readonly availableCategories = computed(() => {
    const list = this.service.variablesSysteme();
    const set = new Set<string>();
    list.forEach(v => {
      if (v.categorie) set.add(v.categorie);
    });
    return Array.from(set);
  });

  public ngOnInit(): void {
    this.service.getVariablesSysteme().subscribe();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.modeleId.set(id);

      this.service.getModeleById(id).subscribe(m => {
        if (m) {
          this.formModele.set({
            titre: m.titre,
            code: m.code || '',
            type_document: m.type_document,
            description: m.description || '',
            contenu: m.contenu,
            statut: m.statut,
            en_tete_active: m.en_tete_active ?? true,
            pied_page_active: m.pied_page_active ?? true,
            signature_nom: m.signature_nom || '',
            signature_titre: m.signature_titre || ''
          });

          setTimeout(() => {
            const editor = document.getElementById('dedicatedWordEditor');
            if (editor) editor.innerHTML = m.contenu;
            this.updatePreviewContent();
          }, 100);
        }
      });
    } else {
      // Modèle modèle par défaut
      const defaultHtml = `<p style="text-align: justify; line-height: 1.8; font-size: 1.05rem;">
Je soussigné, <strong>{{cure_nom}}</strong>, Curé de la paroisse <strong>{{paroisse}}</strong>, atteste que le catéchumène <strong>{{nom_complet}}</strong> (Matricule : <strong>{{matricule}}</strong>) a suivi avec assiduité les cours de catéchèse au sein du niveau <strong>{{niveau}}</strong> durant l'année pastorale <strong>{{annee_pastorale}}</strong>.
</p>
<p style="text-align: justify; line-height: 1.8; font-size: 1.05rem; margin-top: 20px;">
Fait à {{paroisse}}, le {{date_du_jour}} pour servir et valoir ce que de droit.
</p>`;
      this.formModele.update(c => ({ ...c, contenu: defaultHtml }));
      setTimeout(() => {
        const editor = document.getElementById('dedicatedWordEditor');
        if (editor) editor.innerHTML = defaultHtml;
        this.updatePreviewContent();
      }, 100);
    }
  }

  public execFormat(cmd: string, val: string | undefined = undefined): void {
    document.execCommand(cmd, false, val);
    this.syncEditorContent();
  }

  public onEditorInput(event: Event): void {
    const target = event.target as HTMLElement;
    this.formModele.update(cur => ({ ...cur, contenu: target.innerHTML }));
    this.updatePreviewContent();
  }

  public syncEditorContent(): void {
    const editor = document.getElementById('dedicatedWordEditor');
    if (editor) {
      this.formModele.update(cur => ({ ...cur, contenu: editor.innerHTML }));
      this.updatePreviewContent();
    }
  }

  public insererVariable(tag: string): void {
    const editor = document.getElementById('dedicatedWordEditor');
    if (editor) {
      editor.focus();
      const cleanTag = tag.trim();
      const htmlToInsert = `&nbsp;<span class="template-variable-badge">${cleanTag}</span>&nbsp;`;
      const inserted = document.execCommand('insertHTML', false, htmlToInsert);
      if (!inserted) {
        editor.innerHTML += htmlToInsert;
      }
      this.syncEditorContent();
    }
  }

  public updatePreviewContent(): void {
    const rendered = this.service.fusionnerContenu(this.formModele().contenu);
    this.previewContentHtml.set(this.sanitizer.bypassSecurityTrustHtml(rendered));
  }

  public togglePreviewPanel(): void {
    this.showPreviewPanel.update(v => !v);
  }

  public saveModele(): void {
    const data = this.formModele();
    if (!data.titre.trim()) {
      return;
    }

    if (this.isEditMode() && this.modeleId()) {
      this.service.updateModele(this.modeleId()!, data as UpdateModeleDocumentDto).subscribe(() => {
        this.router.navigate(['/documents/modeles']);
      });
    } else {
      this.service.createModele(data).subscribe(() => {
        this.router.navigate(['/documents/modeles']);
      });
    }
  }

  public goBack(): void {
    this.router.navigate(['/documents/modeles']);
  }
}
