import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-doc-renseignement-confirmation',
  imports: [CommonModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './renseignement-confirmation.component.html',
  styleUrl: './renseignement-confirmation.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenseignementConfirmationComponent {
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<any | null>(null);

  public readonly anneePastorale = computed(() => {
    return this.data()?.annee_libelle || this.anneeService.activeAnnee()?.libelle || '2026-2027';
  });

  public getNomPrenoms(c: any): string {
    if (!c) return '';
    return (c.nom_complet || `${c.nom || ''} ${c.prenoms || ''}`).trim();
  }

  public getNom(c: any): string {
    if (!c) return '';
    return c.nom || '';
  }

  public getPrenoms(c: any): string {
    if (!c) return '';
    return c.prenoms || '';
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

  public getTelephone(c: any): string {
    if (!c) return '';
    return c.telephone || c.telephone_candidat || c.contact || c.parent?.telephone || '';
  }

  public getDomicile(c: any): string {
    if (!c) return '';
    return c.domicile || c.adresse || '';
  }

  public getNumeroCarnetBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.num_carnet || c.num_carnet_bapteme || c.numero_acte_bapteme || c.registre_bapteme || '';
  }

  public getDateBapteme(c: any): string {
    if (!c) return '';
    const d = c.bapteme?.date || c.date_bapteme || c.dateBapteme;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getDioceseBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.diocese || c.diocese_bapteme || '';
  }

  public getVilleBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.ville || c.ville_bapteme || c.bapteme?.lieu || c.lieu_bapteme || '';
  }

  public getParoisseBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.paroisse || c.paroisse_bapteme || c.paroisseBapteme || '';
  }

  public getParrain(c: any): string {
    if (!c) return '';
    return c.bapteme?.parrain || c.nom_parrain || c.parrain_confirmation?.nom || c.parrainDetail?.nom || c.parrain?.nom_prenoms || c.parrain?.nom || (Array.isArray(c.parrains_marraines) && c.parrains_marraines[0]?.nom_prenoms) || '';
  }

  public getDatePremiereCommunion(c: any): string {
    if (!c) return '';
    const d = c.premiere_communion?.date || c.date_premiere_communion || c.datePremiereCommunion;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getParoissePremiereCommunion(c: any): string {
    if (!c) return '';
    return c.premiere_communion?.paroisse || c.paroisse_premiere_communion || '';
  }

  public getDateConfirmation(c: any): string {
    if (!c) return '';
    const d = c.confirmation?.date || c.date_confirmation || c.dateConfirmation;
    if (!d) return '';
    try {
      const parts = String(d).split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    } catch {}
    return String(d);
  }

  public getParoisseConfirmation(c: any): string {
    if (!c) return '';
    return c.confirmation?.paroisse || c.paroisse_confirmation || c.paroisseConfirmation || '';
  }

  public getMinistreSacrement(c: any): string {
    if (!c) return '';
    return c.confirmation?.ministre || c.ministre_confirmation || c.ministre || '';
  }

  public getTelephoneCandidat(c: any): string {
    return this.getTelephone(c);
  }

  public getNomPere(c: any): string {
    if (!c) return '';
    return c.nom_pere || c.nomPere || c.parent?.nom || c.parentTuteur?.nom || '';
  }

  public getNomMere(c: any): string {
    if (!c) return '';
    return c.nom_mere || c.nomMere || '';
  }

  public getNomParrain(c: any): string {
    return this.getParrain(c);
  }

  public getDomicileParrain(c: any): string {
    if (!c) return '';
    return c.parrain_confirmation?.domicile || c.domicile_parrain || c.parrainDetail?.domicile || '';
  }

  public getContactParrain(c: any): string {
    if (!c) return '';
    return c.parrain_confirmation?.telephone || c.telephone_parrain || c.parrainDetail?.telephone || c.parrainMarraine?.telephone || '';
  }

  public getParoisseParrain(c: any): string {
    if (!c) return '';
    return c.parrain_confirmation?.paroisse || c.paroisse_parrain || c.parrainDetail?.paroisse || c.paroisse_confirmation || '';
  }

  public getPhotoUrl(c: any): string | null {
    if (!c) return null;
    return c.photo_url || c.photo_path || c.photo || null;
  }
}
