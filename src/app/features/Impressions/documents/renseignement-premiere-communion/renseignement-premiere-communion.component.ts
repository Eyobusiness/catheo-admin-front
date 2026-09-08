import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';
import { HeaderParoissePrintComponent } from '../../components/header-paroisse-print/header-paroisse-print.component';
import { FooterParoissePrintComponent } from '../../components/footer-paroisse-print/footer-paroisse-print.component';

@Component({
  selector: 'app-doc-renseignement-premiere-communion',
  imports: [CommonModule, HeaderParoissePrintComponent, FooterParoissePrintComponent],
  templateUrl: './renseignement-premiere-communion.component.html',
  styleUrl: './renseignement-premiere-communion.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RenseignementPremiereCommunionComponent {
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
    return c.telephone || c.contact || c.telephone_pere || c.telephone_mere || c.parent?.telephone || '';
  }

  public getDomicile(c: any): string {
    if (!c) return '';
    return c.domicile || c.adresse || '';
  }

  public getNumeroCarnetBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.num_carnet || c.num_carnet_bapteme || c.numero_acte_bapteme || c.registre_bapteme || c.numeroRegistreBapteme || '';
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
    return c.bapteme?.diocese || c.diocese_bapteme || c.diocese || '';
  }

  public getVilleBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.ville || c.ville_bapteme || c.ville || c.bapteme?.lieu || c.lieu_bapteme || '';
  }

  public getParoisseBapteme(c: any): string {
    if (!c) return '';
    return c.bapteme?.paroisse || c.paroisse_bapteme || c.paroisseBapteme || '';
  }

  public getParrainMarraineOrigine(c: any): string {
    if (!c) return '';
    if (c.parrain_marraine_origine) return c.parrain_marraine_origine;
    if (c.parrain_origine) return c.parrain_origine;
    if (c.nom_parrain) return c.nom_parrain;
    if (c.parrain?.nom_prenoms || c.parrain?.nom) return c.parrain.nom_prenoms || c.parrain.nom;
    if (c.marraine?.nom_prenoms || c.marraine?.nom) return c.marraine.nom_prenoms || c.marraine.nom;
    if (Array.isArray(c.parrains_marraines) && c.parrains_marraines.length > 0) {
      return c.parrains_marraines[0]?.nom_prenoms || c.parrains_marraines[0]?.nom || '';
    }
    return '';
  }

  public getRepresentant(c: any): string {
    if (!c) return '';
    if (c.representant_par || c.representant) return c.representant_par || c.representant;
    if (c.parrain?.representant_nom || c.parrain?.representant_par) return c.parrain.representant_nom || c.parrain.representant_par;
    if (c.marraine?.representant_nom || c.marraine?.representant_par) return c.marraine.representant_nom || c.marraine.representant_par;
    if (c.representant_parrain) return c.representant_parrain;
    if (Array.isArray(c.parrains_marraines) && c.parrains_marraines.length > 0) {
      return c.parrains_marraines[0]?.representant_nom || c.parrains_marraines[0]?.representant_par || '';
    }
    return '';
  }

  public getContactParrainMarraine(c: any): string {
    if (!c) return '';
    if (c.contact_representant || c.representant_contact) return c.contact_representant || c.representant_contact;
    if (c.parrain?.representant_contact || c.parrain?.telephone) return c.parrain.representant_contact || c.parrain.telephone;
    if (c.marraine?.representant_contact || c.marraine?.telephone) return c.marraine.representant_contact || c.marraine.telephone;
    if (c.telephone_parrain) return c.telephone_parrain;
    if (Array.isArray(c.parrains_marraines) && c.parrains_marraines.length > 0) {
      return c.parrains_marraines[0]?.representant_contact || c.parrains_marraines[0]?.telephone || '';
    }
    return '';
  }

  public getNumeroRegistreBapteme(c: any): string {
    return this.getNumeroCarnetBapteme(c);
  }

  public getLieuDioceseBapteme(c: any): string {
    if (!c) return '';
    const l = this.getVilleBapteme(c);
    const d = this.getDioceseBapteme(c);
    if (l && d) return `${l} (${d})`;
    return l || d;
  }

  public getContact(c: any): string {
    return this.getTelephone(c);
  }

  public getNomPere(c: any): string {
    if (!c) return '';
    return c.nom_pere || c.nomPere || c.parentTuteur?.nom || '';
  }

  public getNomMere(c: any): string {
    if (!c) return '';
    return c.nom_mere || c.nomMere || '';
  }

  public getPhotoUrl(c: any): string | null {
    if (!c) return null;
    return c.photo_url || c.photo_path || c.photo || null;
  }
}
