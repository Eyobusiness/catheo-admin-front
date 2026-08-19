import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  CatechumeneDto,
  CreateCatechumeneDto,
  UpdateCatechumeneDto,
  StatutCatechumene
} from '../../models/catechumene.model';
import { Ceb } from '../../../../Organisations/Ceb/models/ceb.model';
import { Section } from '../../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../../Organisations/Classe/models/classe.model';
import { AnneeCatecheseDto } from '../../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-catechumene-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './catechumene-form-modal.component.html',
  styleUrl: './catechumene-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatechumeneFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly catechumeneToEdit = input<CatechumeneDto | null>(null);
  public readonly cebs = input<Ceb[]>([]);
  public readonly annees = input<AnneeCatecheseDto[]>([]);
  public readonly sections = input<Section[]>([]);
  public readonly niveaux = input<NiveauDto[]>([]);
  public readonly classes = input<ClasseDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateCatechumeneDto | UpdateCatechumeneDto;
    ceb?: Ceb;
    inscriptionData?: {
      annee_catechese_id?: string;
      section_id?: string;
      niveau_id?: string;
      classe_id?: string;
    };
  }>();

  protected readonly activeTab = signal<'identite' | 'parents' | 'sacrements' | 'paroisse'>('identite');

  protected readonly form = new FormGroup({
    // Identité
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    sexe: new FormControl<'M' | 'F'>('M', { nonNullable: true, validators: [Validators.required] }),
    date_naissance: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lieu_naissance: new FormControl('', { nonNullable: true }),
    adresse: new FormControl('', { nonNullable: true }),
    domicile: new FormControl('', { nonNullable: true }),
    profession: new FormControl('', { nonNullable: true }),
    classe_scolaire: new FormControl('', { nonNullable: true }),
    situation_matrimoniale: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true }),
    photo_url: new FormControl('', { nonNullable: true }),
    statut: new FormControl<StatutCatechumene>('actif', { nonNullable: true }),

    // CEB & Organisation à l'église
    ceb_id: new FormControl('', { nonNullable: true }),
    annee_catechese_id: new FormControl('', { nonNullable: true }),
    section_id: new FormControl('', { nonNullable: true }),
    niveau_id: new FormControl('', { nonNullable: true }),
    classe_id: new FormControl('', { nonNullable: true }),

    // Filiation Parents
    nom_pere: new FormControl('', { nonNullable: true }),
    origine_pere: new FormControl('', { nonNullable: true }),
    telephone_pere: new FormControl('', { nonNullable: true }),
    nom_mere: new FormControl('', { nonNullable: true }),
    origine_mere: new FormControl('', { nonNullable: true }),
    telephone_mere: new FormControl('', { nonNullable: true }),
    nom_tuteur: new FormControl('', { nonNullable: true }),
    telephone_tuteur: new FormControl('', { nonNullable: true }),

    // Sacrements & Parrain
    est_baptise: new FormControl<boolean>(false, { nonNullable: true }),
    num_carnet_bapteme: new FormControl('', { nonNullable: true }),
    date_bapteme: new FormControl('', { nonNullable: true }),
    lieu_bapteme: new FormControl('', { nonNullable: true }),
    diocese_bapteme: new FormControl('', { nonNullable: true }),
    ville_bapteme: new FormControl('', { nonNullable: true }),
    paroisse_bapteme: new FormControl('', { nonNullable: true }),

    date_premiere_communion: new FormControl('', { nonNullable: true }),
    paroisse_premiere_communion: new FormControl('', { nonNullable: true }),

    date_confirmation: new FormControl('', { nonNullable: true }),
    paroisse_confirmation: new FormControl('', { nonNullable: true }),
    ministre_confirmation: new FormControl('', { nonNullable: true }),

    nom_parrain: new FormControl('', { nonNullable: true }),
    sexe_parrain: new FormControl<'M' | 'F'>('M', { nonNullable: true }),
    telephone_parrain: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const item = this.catechumeneToEdit();
      const activeAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : null);

      if (this.isEditing() && item) {
        const lastIns = item.inscriptions_annuelles && item.inscriptions_annuelles.length > 0
          ? item.inscriptions_annuelles[0]
          : null;
        const mainParrain = item.parrains_marraines && item.parrains_marraines.length > 0
          ? item.parrains_marraines[0]
          : null;

        this.form.setValue({
          nom: item.nom || '',
          prenoms: item.prenoms || '',
          sexe: item.sexe || 'M',
          date_naissance: item.date_naissance ? item.date_naissance.substring(0, 10) : '',
          lieu_naissance: item.lieu_naissance || '',
          adresse: item.adresse || '',
          domicile: item.domicile || '',
          profession: item.profession || '',
          classe_scolaire: item.classe_scolaire || '',
          situation_matrimoniale: item.situation_matrimoniale || '',
          telephone: item.telephone || '',
          photo_url: item.photo_url || item.photo_path || '',
          statut: item.statut || 'actif',

          ceb_id: item.ceb_id || item.ceb?.id || '',
          annee_catechese_id: lastIns?.annee_catechese_id || (activeAnnee ? activeAnnee.id : ''),
          section_id: lastIns?.section_id || '',
          niveau_id: lastIns?.niveau_id || '',
          classe_id: lastIns?.classe_id || '',

          nom_pere: item.nom_pere || '',
          origine_pere: item.origine_pere || '',
          telephone_pere: item.telephone_pere || '',
          nom_mere: item.nom_mere || '',
          origine_mere: item.origine_mere || '',
          telephone_mere: item.telephone_mere || '',
          nom_tuteur: item.nom_tuteur || '',
          telephone_tuteur: item.telephone_tuteur || '',

          est_baptise: !!item.est_baptise,
          num_carnet_bapteme: item.num_carnet_bapteme || '',
          date_bapteme: item.date_bapteme ? item.date_bapteme.substring(0, 10) : '',
          lieu_bapteme: item.lieu_bapteme || '',
          diocese_bapteme: item.diocese_bapteme || '',
          ville_bapteme: item.ville_bapteme || '',
          paroisse_bapteme: item.paroisse_bapteme || '',

          date_premiere_communion: item.date_premiere_communion ? item.date_premiere_communion.substring(0, 10) : '',
          paroisse_premiere_communion: item.paroisse_premiere_communion || '',

          date_confirmation: item.date_confirmation ? item.date_confirmation.substring(0, 10) : '',
          paroisse_confirmation: item.paroisse_confirmation || '',
          ministre_confirmation: item.ministre_confirmation || '',

          nom_parrain: item.nom_parrain || (mainParrain ? mainParrain.nom_prenoms : ''),
          sexe_parrain: item.sexe_parrain || (mainParrain?.type === 'marraine' ? 'F' : 'M'),
          telephone_parrain: item.telephone_parrain || (mainParrain ? mainParrain.telephone || '' : '')
        });
      } else if (this.isOpen()) {
        this.form.reset({
          nom: '',
          prenoms: '',
          sexe: 'M',
          date_naissance: '',
          lieu_naissance: '',
          adresse: '',
          domicile: '',
          profession: '',
          classe_scolaire: '',
          situation_matrimoniale: 'celibataire',
          telephone: '',
          photo_url: '',
          statut: 'actif',

          ceb_id: '',
          annee_catechese_id: activeAnnee ? activeAnnee.id : '',
          section_id: '',
          niveau_id: '',
          classe_id: '',

          nom_pere: '',
          origine_pere: '',
          telephone_pere: '',
          nom_mere: '',
          origine_mere: '',
          telephone_mere: '',
          nom_tuteur: '',
          telephone_tuteur: '',

          est_baptise: false,
          num_carnet_bapteme: '',
          date_bapteme: '',
          lieu_bapteme: '',
          diocese_bapteme: '',
          ville_bapteme: '',
          paroisse_bapteme: '',

          date_premiere_communion: '',
          paroisse_premiere_communion: '',

          date_confirmation: '',
          paroisse_confirmation: '',
          ministre_confirmation: '',

          nom_parrain: '',
          sexe_parrain: 'M',
          telephone_parrain: ''
        });
      }
    });
  }

  protected setTab(tab: 'identite' | 'parents' | 'sacrements' | 'paroisse'): void {
    this.activeTab.set(tab);
  }

  protected getFilteredNiveaux(): NiveauDto[] {
    const secId = this.form.controls.section_id.value;
    if (!secId) return this.niveaux();
    return this.niveaux().filter(n => n.section_id === secId || n.section?.id === secId);
  }

  protected getFilteredClasses(): ClasseDto[] {
    const nivId = this.form.controls.niveau_id.value;
    if (!nivId) return this.classes();
    return this.classes().filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const selectedCeb = this.cebs().find(c => c.id === val.ceb_id);

      const dto: CreateCatechumeneDto | UpdateCatechumeneDto = {
        nom: val.nom,
        prenoms: val.prenoms,
        sexe: val.sexe,
        date_naissance: val.date_naissance,
        lieu_naissance: val.lieu_naissance || undefined,
        adresse: val.adresse || undefined,
        domicile: val.domicile || undefined,
        profession: val.profession || undefined,
        classe_scolaire: val.classe_scolaire || undefined,
        situation_matrimoniale: val.situation_matrimoniale || undefined,
        telephone: val.telephone || undefined,
        photo_url: val.photo_url || undefined,
        statut: val.statut,
        ceb_id: val.ceb_id || undefined,

        nom_pere: val.nom_pere || undefined,
        origine_pere: val.origine_pere || undefined,
        telephone_pere: val.telephone_pere || undefined,
        nom_mere: val.nom_mere || undefined,
        origine_mere: val.origine_mere || undefined,
        telephone_mere: val.telephone_mere || undefined,
        nom_tuteur: val.nom_tuteur || undefined,
        telephone_tuteur: val.telephone_tuteur || undefined,

        est_baptise: val.est_baptise,
        num_carnet_bapteme: val.est_baptise ? (val.num_carnet_bapteme || undefined) : undefined,
        date_bapteme: val.est_baptise ? (val.date_bapteme || undefined) : undefined,
        lieu_bapteme: val.est_baptise ? (val.lieu_bapteme || undefined) : undefined,
        diocese_bapteme: val.est_baptise ? (val.diocese_bapteme || undefined) : undefined,
        ville_bapteme: val.est_baptise ? (val.ville_bapteme || undefined) : undefined,
        paroisse_bapteme: val.est_baptise ? (val.paroisse_bapteme || undefined) : undefined,

        date_premiere_communion: val.date_premiere_communion || undefined,
        paroisse_premiere_communion: val.paroisse_premiere_communion || undefined,

        date_confirmation: val.date_confirmation || undefined,
        paroisse_confirmation: val.paroisse_confirmation || undefined,
        ministre_confirmation: val.ministre_confirmation || undefined,

        nom_parrain: val.nom_parrain || undefined,
        sexe_parrain: val.sexe_parrain || undefined,
        telephone_parrain: val.telephone_parrain || undefined
      };

      const inscriptionData = {
        annee_catechese_id: val.annee_catechese_id || undefined,
        section_id: val.section_id || undefined,
        niveau_id: val.niveau_id || undefined,
        classe_id: val.classe_id || undefined
      };

      this.formSubmitted.emit({
        dto,
        ceb: selectedCeb,
        inscriptionData
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
