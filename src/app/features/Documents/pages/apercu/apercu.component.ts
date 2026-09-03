import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { DocumentsService } from '../../services/documents.service';
import { DocumentGenereDto } from '../../models/document-officiel.model';
import { EnteteCatecheseComponent } from '../../../../shared/ui/components/entete-catechese/entete-catechese.component';
import { PdfService } from '../../../../core/services/pdf.service';

@Component({
  selector: 'app-apercu-document-page',
  imports: [CommonModule, EnteteCatecheseComponent],
  templateUrl: './apercu.component.html',
  styleUrl: './apercu.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApercuDocumentPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  public readonly service = inject(DocumentsService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly pdfService = inject(PdfService);

  public readonly documentGenere = signal<DocumentGenereDto | null>(null);
  public readonly safeContenuRendu = signal<SafeHtml>('');
  public readonly currentDateFormatted = signal<string>('');

  ngOnInit(): void {
    const docId = this.route.snapshot.paramMap.get('id') || '';
    const cached = this.service.documentsGeneres().find(d => d.id === docId);

    if (cached) {
      this.setDoc(cached);
    } else {
      this.service.getDocumentGenereById(docId).subscribe(doc => {
        if (doc) {
          this.setDoc(doc);
        }
      });
    }

    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    this.currentDateFormatted.set(today.toLocaleDateString('fr-FR', options));
  }

  private setDoc(doc: DocumentGenereDto): void {
    this.documentGenere.set(doc);
    this.safeContenuRendu.set(this.sanitizer.bypassSecurityTrustHtml(doc.contenu));
  }

  public imprimerDocument(): void {
    const doc = this.documentGenere();
    if (!doc) return;
    this.pdfService.previewDocumentGenerePdf(doc.id || (doc as any).uuid || doc.reference, {
      titre: doc.titre || 'Document Officiel',
      reference: doc.reference_document || doc.reference
    });
  }

  public retourHistorique(): void {
    this.router.navigate(['/documents/generation']);
  }

  public getCatechumeneDisplayName(): string {
    const doc = this.documentGenere();
    if (!doc) return '';
    if (doc.catechumene?.nom_complet) return doc.catechumene.nom_complet;
    if (doc.catechumene?.nom) {
      return `${doc.catechumene.nom} ${doc.catechumene.prenoms || doc.catechumene.prenom || ''}`.trim();
    }
    return '';
  }

  public getCatechumeneMatricule(): string {
    const doc = this.documentGenere();
    return doc?.catechumene?.matricule || doc?.catechumene?.code_catechumene || '';
  }
}
