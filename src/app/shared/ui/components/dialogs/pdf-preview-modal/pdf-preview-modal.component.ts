import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PdfPreviewService } from '../../../../../core/services/pdf-preview.service';
import { RecuComponent } from '../../../../../features/Impressions/documents/recu/recu.component';
import { FicheCatechumeneComponent } from '../../../../../features/Impressions/documents/fiche-catechumene/fiche-catechumene.component';
import { ListeCatechumenesComponent } from '../../../../../features/Impressions/documents/liste-catechumenes/liste-catechumenes.component';
import { FicheNotesComponent } from '../../../../../features/Impressions/documents/fiche-notes/fiche-notes.component';
import { ListePresenceComponent } from '../../../../../features/Impressions/documents/liste-presence/liste-presence.component';
import { SuiviSacramentalComponent } from '../../../../../features/Impressions/documents/suivi-sacramental/suivi-sacramental.component';
import { BilanAnnuelComponent } from '../../../../../features/Impressions/documents/bilan-annuel/bilan-annuel.component';
import { RapportAnnuelComponent } from '../../../../../features/Impressions/documents/rapport-annuel/rapport-annuel.component';
import { RenseignementBaptemeComponent } from '../../../../../features/Impressions/documents/renseignement-bapteme/renseignement-bapteme.component';
import { RenseignementPremiereCommunionComponent } from '../../../../../features/Impressions/documents/renseignement-premiere-communion/renseignement-premiere-communion.component';
import { RenseignementConfirmationComponent } from '../../../../../features/Impressions/documents/renseignement-confirmation/renseignement-confirmation.component';

@Component({
  selector: 'app-pdf-preview-modal',
  imports: [
    CommonModule,
    RecuComponent,
    FicheCatechumeneComponent,
    ListeCatechumenesComponent,
    FicheNotesComponent,
    ListePresenceComponent,
    SuiviSacramentalComponent,
    BilanAnnuelComponent,
    RapportAnnuelComponent,
    RenseignementBaptemeComponent,
    RenseignementPremiereCommunionComponent,
    RenseignementConfirmationComponent
  ],
  templateUrl: './pdf-preview-modal.component.html',
  styleUrl: './pdf-preview-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onEscape()'
  }
})
export class PdfPreviewModalComponent {
  protected readonly pdfService = inject(PdfPreviewService);

  protected readonly isOpen = this.pdfService.isOpen;
  protected readonly isLoading = this.pdfService.isLoading;
  protected readonly loadingMessage = this.pdfService.loadingMessage;
  protected readonly documentType = this.pdfService.documentType;
  protected readonly documentData = this.pdfService.documentData;
  protected readonly title = this.pdfService.title;
  protected readonly subtitle = this.pdfService.subtitle;
  protected readonly formatBadge = this.pdfService.formatBadge;
  protected readonly zoom = this.pdfService.zoom;
  protected readonly pdfUrl = this.pdfService.pdfUrl;
  protected readonly hasError = this.pdfService.hasError;
  protected readonly errorMessage = this.pdfService.errorMessage;

  protected handleClose(): void {
    this.pdfService.close();
  }

  protected handleBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.handleClose();
    }
  }

  protected handlePrint(): void {
    this.pdfService.print();
  }

  protected handleDownload(): void {
    this.pdfService.downloadCurrent();
  }

  protected handleZoomIn(): void {
    this.pdfService.zoomIn();
  }

  protected handleZoomOut(): void {
    this.pdfService.zoomOut();
  }

  protected handleResetZoom(): void {
    this.pdfService.resetZoom();
  }

  protected handleRetry(): void {
    this.pdfService.retry();
  }

  protected onEscape(): void {
    if (this.isOpen()) {
      this.handleClose();
    }
  }
}
