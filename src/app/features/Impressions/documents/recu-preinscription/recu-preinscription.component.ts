import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CommonModule, DatePipe, UpperCasePipe } from '@angular/common';
import { ConfigurationService } from '../../../Parametes/Configuration/services/configuration.service';
import { AnneeCatecheseService } from '../../../../core/services/annee-catechese.service';

export interface RecuPreinscriptionData {
  id?: string;
  code_dossier: string;
  type_demande?: string;
  nom: string;
  prenoms: string;
  sexe?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  telephone?: string;
  domicile?: string;
  classe_scolaire?: string;
  profession?: string;
  situation_matrimoniale?: string;
  // Orientation
  section_nom?: string;
  niveau_nom?: string;
  annee_pastorale?: string;
  nom_campagne?: string;
  // Paroisse
  nom_paroisse?: string;
  diocese?: string;
  doyenne?: string;
  telephone_paroisse?: string;
  adresse_paroisse?: string;
  logo_url?: string;
  // Filiation & Tuteur
  nom_pere?: string;
  telephone_pere?: string;
  nom_mere?: string;
  telephone_mere?: string;
  nom_tuteur?: string;
  telephone_tuteur?: string;
  // Sacrements
  est_baptise?: boolean;
  date_bapteme?: string;
  paroisse_bapteme?: string;
  num_carnet_bapteme?: string;
  nom_parrain?: string;
  telephone_parrain?: string;
  // Dates & suivi
  created_at?: string;
  matricule?: string;
}

@Component({
  selector: 'app-doc-recu-preinscription',
  imports: [CommonModule, DatePipe, UpperCasePipe],
  templateUrl: './recu-preinscription.component.html',
  styleUrl: './recu-preinscription.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecuPreinscriptionComponent {
  private readonly configService = inject(ConfigurationService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public readonly data = input<RecuPreinscriptionData | null>(null);

  // Configuration dynamique de la paroisse
  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly logoParoisse = computed(() => {
    const d = this.data();
    if (d?.logo_url) return d.logo_url;
    const p = this.paroisseConfig();
    const raw = p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
    return this.configService.resolveAssetUrl(raw);
  });

  public readonly nomParoisse = computed(() => {
    const d = this.data();
    if (d?.nom_paroisse) return d.nom_paroisse;
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || 'PAROISSE CATHOLIQUE';
  });

  public readonly diocese = computed(() => {
    const d = this.data();
    if (d?.diocese) return d.diocese;
    const p = this.paroisseConfig();
    return p?.diocese || "ARCHIDIOCÈSE D'ABIDJAN";
  });

  public readonly doyenne = computed(() => {
    const d = this.data();
    if (d?.doyenne) return d.doyenne;
    const p = this.paroisseConfig();
    return p?.doyenne || '';
  });

  public readonly localisation = computed(() => {
    const d = this.data();
    if (d?.adresse_paroisse) return d.adresse_paroisse;
    const p = this.paroisseConfig();
    const parts = [p?.commune || p?.ville, p?.adresse].filter(Boolean);
    return parts.length > 0 ? parts.join(' - ') : '';
  });

  public readonly telephone = computed(() => {
    const d = this.data();
    if (d?.telephone_paroisse) return d.telephone_paroisse;
    const p = this.paroisseConfig();
    return p?.telephone || '';
  });

  public readonly displayAnnee = computed(() => {
    const d = this.data();
    if (d?.annee_pastorale) return d.annee_pastorale;
    return this.anneeService.activeAnnee()?.libelle || '';
  });

  public readonly qrCodeUrl = computed(() => {
    const d = this.data();
    const code = d?.code_dossier || 'PRE-INSCRIPTION';
    return `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${encodeURIComponent(code)}`;
  });

  public getSexeLabel(sexe?: string): string {
    if (!sexe) return '-';
    return sexe.toUpperCase() === 'M' ? 'Masculin' : 'Féminin';
  }

  public getTypeDemandeLabel(type?: string): string {
    if (!type) return 'Nouvelle Inscription';
    const lower = type.toLowerCase();
    if (lower.includes('re') || lower.includes('ré')) {
      return 'Réinscription';
    }
    return 'Nouvelle Inscription';
  }
}
