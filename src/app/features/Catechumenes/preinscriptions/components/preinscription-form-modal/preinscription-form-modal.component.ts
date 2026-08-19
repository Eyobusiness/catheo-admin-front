import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  PreinscriptionDto,
  SubmitPreinscriptionDto,
  UpdatePreinscriptionDto,
  TypeDemandePreinscription
} from '../../models/preinscription.model';
import { CampagnePreinscriptionDto } from '../../../campagnes/models/campagne.model';
import { Section } from '../../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../../Organisations/Niveaux/models/niveau.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-preinscription-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './preinscription-form-modal.component.html',
  styleUrl: './preinscription-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreinscriptionFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly preinscriptionToEdit = input<PreinscriptionDto | null>(null);
  public readonly campagnes = input<CampagnePreinscriptionDto[]>([]);
  public readonly sections = input<Section[]>([]);
  public readonly niveaux = input<NiveauDto[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: SubmitPreinscriptionDto | UpdatePreinscriptionDto;
    campagne?: CampagnePreinscriptionDto;
    section?: Section;
    niveau?: NiveauDto;
  }>();

  protected readonly activeTab = signal<'candidat' | 'parents' | 'sacrements' | 'orientation'>('candidat');

  protected readonly form = new FormGroup({
    // Campagne & Demande
    campagne_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type_demande: new FormControl<TypeDemandePreinscription>('premiere_inscription', {
      nonNullable: true,
      validators: [Validators.required]
    }),

    // Identité
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    sexe: new FormControl<'M' | 'F'>('M', { nonNullable: true, validators: [Validators.required] }),
    date_naissance: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lieu_naissance: new FormControl('', { nonNullable: true }),
    adresse: new FormControl('', { nonNullable: true }),
    domicile: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true }),
    profession: new FormControl('', { nonNullable: true }),
    classe_scolaire: new FormControl('', { nonNullable: true }),
    situation_matrimoniale: new FormControl('', { nonNullable: true }),
    photo_url: new FormControl('', { nonNullable: true }),

    // Parents & Filiation
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
    paroisse_bapteme: new FormControl('', { nonNullable: true }),
    ville_bapteme: new FormControl('', { nonNullable: true }),
    diocese_bapteme: new FormControl('', { nonNullable: true }),

    date_premiere_communion: new FormControl('', { nonNullable: true }),
    paroisse_premiere_communion: new FormControl('', { nonNullable: true }),

    date_confirmation: new FormControl('', { nonNullable: true }),
    paroisse_confirmation: new FormControl('', { nonNullable: true }),
    ministre_confirmation: new FormControl('', { nonNullable: true }),

    nom_parrain: new FormControl('', { nonNullable: true }),
    sexe_parrain: new FormControl<'M' | 'F'>('M', { nonNullable: true }),
    telephone_parrain: new FormControl('', { nonNullable: true }),

    // Orientation / Section & Niveau
    section_souhaite_id: new FormControl('', { nonNullable: true }),
    niveau_souhaite_id: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      const item = this.preinscriptionToEdit();
      const camps = this.campagnes();
      const openCamp = camps.find(c => c.statut === 'ouverte') || (camps.length > 0 ? camps[0] : null);

      if (this.isEditing() && item) {
        this.form.setValue({
          campagne_id: item.campagne_id || item.campagne?.id || (openCamp ? openCamp.id : ''),
          type_demande: item.type_demande || 'premiere_inscription',
          nom: item.nom || '',
          prenoms: item.prenoms || '',
          sexe: item.sexe || 'M',
          date_naissance: item.date_naissance ? item.date_naissance.substring(0, 10) : '',
          lieu_naissance: item.lieu_naissance || '',
          adresse: item.adresse || '',
          domicile: item.domicile || '',
          telephone: item.telephone || '',
          profession: item.profession || '',
          classe_scolaire: item.classe_scolaire || '',
          situation_matrimoniale: item.situation_matrimoniale || '',
          photo_url: item.photo_url || '',

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
          paroisse_bapteme: item.paroisse_bapteme || '',
          ville_bapteme: item.ville_bapteme || '',
          diocese_bapteme: item.diocese_bapteme || '',

          date_premiere_communion: item.date_premiere_communion ? item.date_premiere_communion.substring(0, 10) : '',
          paroisse_premiere_communion: item.paroisse_premiere_communion || '',

          date_confirmation: item.date_confirmation ? item.date_confirmation.substring(0, 10) : '',
          paroisse_confirmation: item.paroisse_confirmation || '',
          ministre_confirmation: item.ministre_confirmation || '',

          nom_parrain: item.nom_parrain || '',
          sexe_parrain: item.sexe_parrain || 'M',
          telephone_parrain: item.telephone_parrain || '',

          section_souhaite_id: item.section_souhaite_id || item.section_souhaite?.id || '',
          niveau_souhaite_id: item.niveau_souhaite_id || item.niveau_souhaite?.id || ''
        });
      } else if (this.isOpen()) {
        this.form.reset({
          campagne_id: openCamp ? openCamp.id : '',
          type_demande: 'premiere_inscription',
          nom: '',
          prenoms: '',
          sexe: 'M',
          date_naissance: '',
          lieu_naissance: '',
          adresse: '',
          domicile: '',
          telephone: '',
          profession: '',
          classe_scolaire: '',
          situation_matrimoniale: 'celibataire',
          photo_url: '',

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
          paroisse_bapteme: '',
          ville_bapteme: '',
          diocese_bapteme: '',

          date_premiere_communion: '',
          paroisse_premiere_communion: '',

          date_confirmation: '',
          paroisse_confirmation: '',
          ministre_confirmation: '',

          nom_parrain: '',
          sexe_parrain: 'M',
          telephone_parrain: '',

          section_souhaite_id: '',
          niveau_souhaite_id: ''
        });
      }
    });
  }

  protected setTab(tab: 'candidat' | 'parents' | 'sacrements' | 'orientation'): void {
    this.activeTab.set(tab);
  }

  protected getFilteredNiveaux(): NiveauDto[] {
    const secId = this.form.controls.section_souhaite_id.value;
    if (!secId) return this.niveaux();
    return this.niveaux().filter(n => n.section_id === secId || n.section?.id === secId);
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const selectedCamp = this.campagnes().find(c => c.id === val.campagne_id);
      const selectedSec = this.sections().find(s => s.id === val.section_souhaite_id);
      const selectedNiv = this.niveaux().find(n => n.id === val.niveau_souhaite_id);

      const dto: SubmitPreinscriptionDto | UpdatePreinscriptionDto = {
        campagne_id: val.campagne_id,
        type_demande: val.type_demande,
        nom: val.nom,
        prenoms: val.prenoms,
        sexe: val.sexe,
        date_naissance: val.date_naissance,
        lieu_naissance: val.lieu_naissance || undefined,
        adresse: val.adresse || undefined,
        domicile: val.domicile || undefined,
        telephone: val.telephone || undefined,
        profession: val.profession || undefined,
        classe_scolaire: val.classe_scolaire || undefined,
        situation_matrimoniale: val.situation_matrimoniale || undefined,
        photo_url: val.photo_url || undefined,

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
        paroisse_bapteme: val.est_baptise ? (val.paroisse_bapteme || undefined) : undefined,
        ville_bapteme: val.est_baptise ? (val.ville_bapteme || undefined) : undefined,
        diocese_bapteme: val.est_baptise ? (val.diocese_bapteme || undefined) : undefined,

        date_premiere_communion: val.date_premiere_communion || undefined,
        paroisse_premiere_communion: val.paroisse_premiere_communion || undefined,

        date_confirmation: val.date_confirmation || undefined,
        paroisse_confirmation: val.paroisse_confirmation || undefined,
        ministre_confirmation: val.ministre_confirmation || undefined,

        nom_parrain: val.nom_parrain || undefined,
        sexe_parrain: val.sexe_parrain || undefined,
        telephone_parrain: val.telephone_parrain || undefined,

        section_souhaite_id: val.section_souhaite_id || undefined,
        niveau_souhaite_id: val.niveau_souhaite_id || undefined
      };

      this.formSubmitted.emit({
        dto,
        campagne: selectedCamp,
        section: selectedSec,
        niveau: selectedNiv
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
