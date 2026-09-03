import { Injectable, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Observable, catchError, of, tap } from 'rxjs';
import { ToastService } from './toast.service';

export type PrintDocumentType =
  | 'recu'
  | 'fiche-catechumene'
  | 'liste-catechumenes'
  | 'fiche-notes'
  | 'liste-presence'
  | 'suivi-sacramental'
  | 'bilan-annuel'
  | 'rapport-annuel'
  | 'renseignement-bapteme'
  | 'renseignement-premiere-communion'
  | 'renseignement-confirmation'
  | 'pdf-blob'
  | null;

export interface PrintPreviewOptions {
  title?: string;
  subtitle?: string;
  formatBadge?: string;
  fileName?: string;
  loadingMessage?: string;
}

export type PdfPreviewOptions = PrintPreviewOptions;

@Injectable({
  providedIn: 'root'
})
export class PdfPreviewService {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly toastService = inject(ToastService);

  // Signaux d'état réactifs pour le lecteur / aperçu d'impression universel
  public readonly isOpen = signal<boolean>(false);
  public readonly isLoading = signal<boolean>(false);
  public readonly loadingMessage = signal<string>('Préparation du document officiel...');

  public readonly documentType = signal<PrintDocumentType>(null);
  public readonly documentData = signal<any>(null);

  public readonly title = signal<string>('Aperçu du Document');
  public readonly subtitle = signal<string>('');
  public readonly formatBadge = signal<string>('A4 Portrait');
  public readonly fileName = signal<string>('document.pdf');
  public readonly zoom = signal<number>(100);

  // Fallback legacy blob
  public readonly pdfUrl = signal<SafeResourceUrl | null>(null);
  public readonly rawBlobUrl = signal<string | null>(null);

  public readonly hasError = signal<boolean>(false);
  public readonly errorMessage = signal<string | null>(null);

  private retryFn: (() => void) | null = null;

  /**
   * Ouvre le lecteur de document avec un composant d'impression dédié et ses données JSON
   */
  public openDocument(type: PrintDocumentType, data: any, options?: PrintPreviewOptions): void {
    this.revokeCurrentBlobUrl();
    this.documentType.set(type);
    this.documentData.set(data);

    this.title.set(options?.title || this.getDefaultTitle(type));
    this.subtitle.set(options?.subtitle || '');
    this.formatBadge.set(options?.formatBadge || this.getDefaultFormatBadge(type));
    this.fileName.set(options?.fileName || `${type || 'document'}.pdf`);

    this.zoom.set(100);
    this.hasError.set(false);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.pdfUrl.set(null);
    this.isOpen.set(true);
  }

  /**
   * Définit l'état de chargement avant réception des données
   */
  public startLoading(type: PrintDocumentType, options?: PrintPreviewOptions): void {
    this.revokeCurrentBlobUrl();
    this.documentType.set(type);
    this.documentData.set(null);
    this.title.set(options?.title || this.getDefaultTitle(type));
    this.subtitle.set(options?.subtitle || '');
    this.formatBadge.set(options?.formatBadge || this.getDefaultFormatBadge(type));
    this.fileName.set(options?.fileName || `${type || 'document'}.pdf`);
    this.loadingMessage.set(options?.loadingMessage || 'Chargement des données auprès du serveur...');
    this.isLoading.set(true);
    this.hasError.set(false);
    this.errorMessage.set(null);
    this.isOpen.set(true);
  }

  /**
   * Contrôles de zoom interactifs
   */
  public zoomIn(): void {
    this.zoom.update(z => Math.min(150, z + 10));
  }

  public zoomOut(): void {
    this.zoom.update(z => Math.max(50, z - 10));
  }

  public resetZoom(): void {
    this.zoom.set(100);
  }

  public setZoom(level: number): void {
    this.zoom.set(Math.max(50, Math.min(150, level)));
  }

  /**
   * Déclenche l'impression physique propre
   */
  public print(): void {
    window.print();
  }

  /**
   * Télécharge le document ou invite à l'impression PDF native
   */
  public downloadCurrent(): void {
    if (this.rawBlobUrl()) {
      const link = document.createElement('a');
      link.href = this.rawBlobUrl()!;
      link.download = this.fileName() || 'document.pdf';
      link.click();
      return;
    }

    this.toastService.info(
      'Export PDF',
      'Dans la boîte de dialogue d\'impression, sélectionnez "Enregistrer au format PDF" comme destination.'
    );
    this.print();
  }

  /**
   * Fermeture du modal d'aperçu
   */
  public close(): void {
    this.isOpen.set(false);
    this.documentType.set(null);
    this.documentData.set(null);
    this.revokeCurrentBlobUrl();
    this.hasError.set(false);
    this.errorMessage.set(null);
  }

  public retry(): void {
    if (this.retryFn) {
      this.retryFn();
    }
  }

  // =========================================================================
  // MÉTHODES DE COMPATIBILITÉ LEGACY
  // =========================================================================
  public previewBlob(blob: Blob, options?: PrintPreviewOptions): void {
    this.revokeCurrentBlobUrl();
    this.title.set(options?.title || 'Aperçu du Document');
    this.subtitle.set(options?.subtitle || '');
    this.fileName.set(options?.fileName || 'document.pdf');
    this.hasError.set(false);
    this.errorMessage.set(null);
    this.isLoading.set(false);
    this.documentType.set('pdf-blob');

    try {
      const pdfBlob = blob.type === 'application/pdf' ? blob : new Blob([blob], { type: 'application/pdf' });
      const objectUrl = URL.createObjectURL(pdfBlob);
      this.rawBlobUrl.set(objectUrl);
      this.pdfUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(objectUrl));
      this.isOpen.set(true);
    } catch (err) {
      this.hasError.set(true);
      this.errorMessage.set('Erreur de lecture du document PDF.');
    }
  }

  public previewObservable(obs$: Observable<Blob>, options?: PrintPreviewOptions): void {
    this.startLoading('pdf-blob', options);
    this.retryFn = () => this.previewObservable(obs$, options);

    obs$.pipe(
      tap(blob => this.previewBlob(blob, options)),
      catchError(err => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.errorMessage.set('Impossible de charger le document.');
        return of(null);
      })
    ).subscribe();
  }

  public previewFromUrl(endpointUrl: string, options?: PrintPreviewOptions): Observable<Blob> {
    return of(new Blob());
  }

  private revokeCurrentBlobUrl(): void {
    const current = this.rawBlobUrl();
    if (current && current.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(current);
      } catch {}
    }
    this.rawBlobUrl.set(null);
    this.pdfUrl.set(null);
  }

  private getDefaultTitle(type: PrintDocumentType): string {
    switch (type) {
      case 'recu': return 'Reçu de Paiement Officiel';
      case 'fiche-catechumene': return 'Fiche Individuelle du Catéchumène';
      case 'liste-catechumenes': return 'Registre & Liste des Catéchumènes';
      case 'fiche-notes': return 'Fiche de Notes & Évaluations';
      case 'liste-presence': return 'Feuille de Présence & Émargement';
      case 'suivi-sacramental': return 'Fiche de Suivi Sacramental';
      case 'bilan-annuel': return 'Bilan Annuel & Délibérations';
      case 'rapport-annuel': return 'Rapport Pastoral Annuel';
      case 'renseignement-bapteme': return 'Fiche de Renseignement — Baptême';
      case 'renseignement-premiere-communion': return 'Fiche de Renseignement — 1ère Communion';
      case 'renseignement-confirmation': return 'Fiche de Renseignement — Confirmation';
      default: return 'Document Officiel';
    }
  }

  private getDefaultFormatBadge(type: PrintDocumentType): string {
    switch (type) {
      case 'recu': return 'A4 Portrait (Double Volet)';
      case 'fiche-catechumene': return 'A4 Portrait';
      case 'liste-catechumenes': return 'A4 Paysage';
      case 'fiche-notes': return 'A4 Paysage';
      case 'liste-presence': return 'A4 Paysage';
      case 'suivi-sacramental': return 'A4 Paysage';
      case 'bilan-annuel': return 'A4 Paysage';
      case 'rapport-annuel': return 'A4 Portrait';
      case 'renseignement-bapteme': return 'A4 Portrait';
      case 'renseignement-premiere-communion': return 'A4 Portrait';
      case 'renseignement-confirmation': return 'A4 Portrait';
      default: return 'A4 Portrait';
    }
  }
}
