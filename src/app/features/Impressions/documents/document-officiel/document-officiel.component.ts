import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { DocumentsService } from '../../../Documents/services/documents.service';

@Component({
  selector: 'app-doc-document-officiel',
  imports: [CommonModule, HeaderParoissePrintComponent],
  templateUrl: './document-officiel.component.html',
  styleUrl: './document-officiel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentOfficielComponent {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly documentsService = inject(DocumentsService);

  public readonly data = input<any | null>(null);

  public readonly safeContenu = computed<SafeHtml>(() => {
    let raw = this.data()?.contenu || '';
    if (raw && raw.includes('{{')) {
      const doc = this.data();
      const catId = doc?.catechumene_id || doc?.catechumene?.id;
      const custom = doc?.metadonnees || {};
      raw = this.documentsService.fusionnerContenu(raw, catId, custom);
    }
    return this.sanitizer.bypassSecurityTrustHtml(raw);
  });
}

