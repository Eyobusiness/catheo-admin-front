import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-doc-renseignement-bapteme',
  imports: [
    CommonModule,
    HeaderParoissePrintComponent,
    FooterParoissePrintComponent
  ],
  templateUrl: './renseignement-bapteme.component.html',
  styleUrl: './renseignement-bapteme.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenseignementBaptemeComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<any | null>(null);

  public readonly anneePastorale = computed(() => {
    return this.data()?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '2026-2027';
  });

  public getNomPrenoms(c: any): string {
    if (!c) return '';
    return (c.nom_complet || `${c.nom || ''} ${c.prenoms || ''}`).trim();
  }

  public getDateNaissance(c: any): string {
    if (!c) return '';
    const d = c.date_naissance || c.dateNaissance;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getLieuNaissance(c: any): string {
    if (!c) return '';
    return c.lieu_naissance || c.lieuNaissance || '';
  }

  public getProfession(c: any): string {
    if (!c) return '';
    return c.profession || c.classe_scolaire || '';
  }

  public getContact(c: any): string {
    if (!c) return '';
    return c.telephone || c.contact || c.telephone_pere || c.telephone_mere || '';
  }

  public getDomicile(c: any): string {
    if (!c) return '';
    return c.domicile || c.adresse || '';
  }

  public getNomPere(c: any): string {
    if (!c) return '';
    return c.nom_pere || c.nomPere || '';
  }

  public getOriginePere(c: any): string {
    if (!c) return '';
    return c.origine_pere || c.originePere || '';
  }

  public getNomMere(c: any): string {
    if (!c) return '';
    return c.nom_mere || c.nomMere || '';
  }

  public getOrigineMere(c: any): string {
    if (!c) return '';
    return c.origine_mere || c.origineMere || '';
  }

  public getParrain(c: any): any {
    if (!c) return null;
    if (c.parrain) return c.parrain;
    if (c.parrainDetail) return c.parrainDetail;
    if (Array.isArray(c.parrains_marraines)) {
      const p = c.parrains_marraines.find((item: any) => item.type === 'parrain' || item.sexe === 'M');
      if (p) return p;
    }
    if (c.nom_parrain) {
      return {
        nom: c.nom_parrain,
        nom_prenoms: c.nom_parrain,
        telephone: c.telephone_parrain,
        domicile: c.domicile_parrain || '',
        representant_par: c.representant_parrain || '',
        representant_contact: c.contact_representant_parrain || ''
      };
    }
    return null;
  }

  public getMarraine(c: any): any {
    if (!c) return null;
    if (c.marraine) return c.marraine;
    if (c.marraineDetail) return c.marraineDetail;
    if (Array.isArray(c.parrains_marraines)) {
      const m = c.parrains_marraines.find((item: any) => item.type === 'marraine' || item.sexe === 'F');
      if (m) return m;
    }
    if (c.nom_marraine) {
      return {
        nom: c.nom_marraine,
        nom_prenoms: c.nom_marraine,
        telephone: c.telephone_marraine,
        domicile: c.domicile_marraine || '',
        representant_par: c.representant_marraine || '',
        representant_contact: c.contact_representant_marraine || ''
      };
    }
    return null;
  }

  public getPhotoUrl(c: any): string | null {
    if (!c) return null;
    return c.photo_url || c.photo_path || c.photo || null;
  }
}
