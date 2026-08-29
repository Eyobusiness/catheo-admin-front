import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  InscriptionAnnuelleDto,
  CreateInscriptionAnnuelleDto,
  UpdateInscriptionAnnuelleDto,
  StatutInscriptionAnnuelle
} from '../../models/inscription-annuelle.model';
import {
  CatechumeneDto,
  CreateCatechumeneDto,
  UpdateCatechumeneDto
} from '../../../liste-catechumene/models/catechumene.model';
import { AnneeCatecheseDto } from '../../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { Section } from '../../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../../Organisations/Classe/models/classe.model';
import { Ceb } from '../../../../Organisations/Ceb/models/ceb.model';
import { Mouvement } from '../../../../Organisations/Mouvements/models/mouvement.model';
import { CatechumeneService } from '../../../liste-catechumene/services/catechumene.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

export type InscriptionModalMode = 'choice' | 'nouvelle' | 'reinscription';

@Component({
  selector: 'app-inscription-form-modal',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './inscription-form-modal.component.html',
  styleUrl: './inscription-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscriptionFormModalComponent {
  private readonly catechumeneService = inject(CatechumeneService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly inscriptionToEdit = input<InscriptionAnnuelleDto | null>(null);
  public readonly catechumenes = input<CatechumeneDto[]>([]);
  public readonly annees = input<AnneeCatecheseDto[]>([]);
  public readonly sections = input<Section[]>([]);
  public readonly niveaux = input<NiveauDto[]>([]);
  public readonly classes = input<ClasseDto[]>([]);
  public readonly cebs = input<Ceb[]>([]);
  public readonly mouvements = input<Mouvement[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();

  // Événement unifié de soumission
  public readonly nouvelleInscriptionSubmitted = output<{
    catechumeneData: CreateCatechumeneDto;
    inscriptionData: CreateInscriptionAnnuelleDto;
    section?: Section;
    niveau?: NiveauDto;
    classe?: ClasseDto;
    ceb?: Ceb;
    mouvement?: Mouvement;
  }>();

  public readonly reinscriptionSubmitted = output<{
    catechumeneId: string;
    updateCatechumeneData?: UpdateCatechumeneDto;
    inscriptionData: CreateInscriptionAnnuelleDto;
    catechumene?: CatechumeneDto;
    section?: Section;
    niveau?: NiveauDto;
    classe?: ClasseDto;
    ceb?: Ceb;
    mouvement?: Mouvement;
  }>();

  public readonly formSubmitted = output<{
    dto: CreateInscriptionAnnuelleDto | UpdateInscriptionAnnuelleDto;
    catechumene?: CatechumeneDto;
    annee?: AnneeCatecheseDto;
    section?: Section;
    niveau?: NiveauDto;
    classe?: ClasseDto;
    ceb?: Ceb;
    mouvement?: Mouvement;
  }>();

  // Mode actif : 'choice' | 'nouvelle' | 'reinscription'
  public readonly currentMode = signal<InscriptionModalMode>('choice');

  // Recherche par matricule pour la réinscription
  public readonly searchMatricule = signal<string>('');
  public readonly foundCatechumene = signal<CatechumeneDto | null>(null);
  public readonly isSearchingMatricule = signal<boolean>(false);
  public readonly searchMatriculeError = signal<string | null>(null);

  // Photo de profil
  public readonly photoPreview = signal<string>('');

  // Formulaire pour NOUVELLE INSCRIPTION (Création Catéchumène + Inscription)
  public readonly nouvelleForm = new FormGroup({
    // Identité Catéchumène
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    sexe: new FormControl<'M' | 'F'>('M', { nonNullable: true, validators: [Validators.required] }),
    date_naissance: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    lieu_naissance: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true }),
    domicile: new FormControl('', { nonNullable: true }),
    profession: new FormControl('', { nonNullable: true }),
    classe_scolaire: new FormControl('', { nonNullable: true }),
    photo_url: new FormControl('', { nonNullable: true }),

    // Parents / Filiation
    nom_pere: new FormControl('', { nonNullable: true }),
    telephone_pere: new FormControl('', { nonNullable: true }),
    nom_mere: new FormControl('', { nonNullable: true }),
    telephone_mere: new FormControl('', { nonNullable: true }),
    nom_tuteur: new FormControl('', { nonNullable: true }),
    telephone_tuteur: new FormControl('', { nonNullable: true }),

    // Sacrements
    est_baptise: new FormControl<boolean>(false, { nonNullable: true }),
    date_bapteme: new FormControl('', { nonNullable: true }),
    paroisse_bapteme: new FormControl('', { nonNullable: true }),
    num_carnet_bapteme: new FormControl('', { nonNullable: true }),
    nom_parrain: new FormControl('', { nonNullable: true }),
    telephone_parrain: new FormControl('', { nonNullable: true }),

    // Inscription Pastorale
    section_id: new FormControl('', { nonNullable: true }),
    niveau_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classe_id: new FormControl('', { nonNullable: true }),
    ceb_id: new FormControl('', { nonNullable: true }),
    mouvement_id: new FormControl('', { nonNullable: true }),
    statut_inscription: new FormControl<StatutInscriptionAnnuelle>('inscrit', { nonNullable: true }),
    frais_inscription_payes: new FormControl<boolean>(false, { nonNullable: true }),
    observation: new FormControl('', { nonNullable: true })
  });

  // Formulaire pour RÉINSCRIPTION (Mise à jour Catéchumène + Inscription Annuelle)
  public readonly reinscriptionForm = new FormGroup({
    // Coordonnées actualisables
    telephone: new FormControl('', { nonNullable: true }),
    domicile: new FormControl('', { nonNullable: true }),
    profession: new FormControl('', { nonNullable: true }),
    classe_scolaire: new FormControl('', { nonNullable: true }),
    telephone_tuteur: new FormControl('', { nonNullable: true }),

    // Nouvelle affectation pastorale
    section_id: new FormControl('', { nonNullable: true }),
    niveau_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classe_id: new FormControl('', { nonNullable: true }),
    ceb_id: new FormControl('', { nonNullable: true }),
    mouvement_id: new FormControl('', { nonNullable: true }),
    statut_inscription: new FormControl<StatutInscriptionAnnuelle>('inscrit', { nonNullable: true }),
    frais_inscription_payes: new FormControl<boolean>(false, { nonNullable: true }),
    observation: new FormControl('', { nonNullable: true })
  });

  // Formulaire pour MODIFICATION d'une inscription existante
  public readonly editForm = new FormGroup({
    section_id: new FormControl('', { nonNullable: true }),
    niveau_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    classe_id: new FormControl('', { nonNullable: true }),
    ceb_id: new FormControl('', { nonNullable: true }),
    mouvement_id: new FormControl('', { nonNullable: true }),
    statut_inscription: new FormControl<StatutInscriptionAnnuelle>('inscrit', { nonNullable: true }),
    frais_inscription_payes: new FormControl<boolean>(false, { nonNullable: true }),
    observation: new FormControl('', { nonNullable: true })
  });

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      const item = this.inscriptionToEdit();

      if (this.isEditing() && item) {
        this.currentMode.set('choice');
        this.editForm.setValue({
          section_id: item.section_id || item.section?.id || '',
          niveau_id: item.niveau_id || item.niveau?.id || '',
          classe_id: item.classe_id || item.classe?.id || '',
          ceb_id: item.ceb_id || item.ceb?.id || '',
          mouvement_id: item.mouvement_id || item.mouvement?.id || '',
          statut_inscription: item.statut_inscription || 'inscrit',
          frais_inscription_payes: item.frais_inscription_payes ?? false,
          observation: item.observation || ''
        });
      } else {
        // Mode création : on commence par l'écran de choix
        this.currentMode.set('choice');
        this.foundCatechumene.set(null);
        this.searchMatricule.set('');
        this.searchMatriculeError.set(null);
        this.nouvelleForm.reset({
          sexe: 'M',
          est_baptise: false,
          statut_inscription: 'inscrit',
          frais_inscription_payes: false
        });
        this.reinscriptionForm.reset({
          statut_inscription: 'inscrit',
          frais_inscription_payes: false
        });
      }
    });
  }

  // --- FILTRES EN CASCADE ---

  public getFilteredNiveaux(sectionId: string): NiveauDto[] {
    if (!sectionId) return this.niveaux();
    return this.niveaux().filter(n => n.section_id === sectionId || n.section?.id === sectionId);
  }

  public getFilteredClasses(niveauId: string): ClasseDto[] {
    if (!niveauId) return this.classes();
    return this.classes().filter(c => c.niveau_id === niveauId || c.niveau?.id === niveauId);
  }

  // --- NAVIGATION DU MODAL ---

  public selectChoice(mode: 'nouvelle' | 'reinscription'): void {
    this.currentMode.set(mode);
    this.searchMatriculeError.set(null);
  }

  public backToChoice(): void {
    this.currentMode.set('choice');
    this.foundCatechumene.set(null);
    this.searchMatriculeError.set(null);
  }

  // --- RECHERCHE MATRICULE (RÉINSCRIPTION) ---

  public onSearchMatricule(): void {
    const mat = this.searchMatricule().trim();
    if (!mat) {
      this.searchMatriculeError.set('Veuillez renseigner un matricule ou un nom.');
      return;
    }

    this.isSearchingMatricule.set(true);
    this.searchMatriculeError.set(null);

    // 1. Recherche locale d'abord
    const foundLocal = this.catechumenes().find(
      c => c.matricule?.toLowerCase() === mat.toLowerCase() ||
           c.code_catechumene?.toLowerCase() === mat.toLowerCase() ||
           c.nom_complet?.toLowerCase().includes(mat.toLowerCase())
    );

    if (foundLocal) {
      this.setFoundCatechumene(foundLocal);
      this.isSearchingMatricule.set(false);
      return;
    }

    // 2. Recherche API via getByMatricule
    this.catechumeneService.getByMatricule(mat).subscribe({
      next: (cat) => {
        this.isSearchingMatricule.set(false);
        if (cat) {
          this.setFoundCatechumene(cat);
        } else {
          this.searchMatriculeError.set(`Aucun catéchumène trouvé avec le matricule « ${mat} ».`);
        }
      },
      error: () => {
        this.isSearchingMatricule.set(false);
        this.searchMatriculeError.set(`Aucun catéchumène trouvé avec le matricule « ${mat} ».`);
      }
    });
  }

  private setFoundCatechumene(cat: CatechumeneDto): void {
    this.foundCatechumene.set(cat);
    this.reinscriptionForm.patchValue({
      telephone: cat.telephone || '',
      domicile: cat.domicile || cat.adresse || '',
      profession: cat.profession || '',
      classe_scolaire: cat.classe_scolaire || '',
      telephone_tuteur: cat.telephone_tuteur || ''
    });
  }

  public onPhotoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.photoPreview.set(result);
        this.nouvelleForm.patchValue({ photo_url: result });
      };
      reader.readAsDataURL(file);
    }
  }

  public removePhoto(): void {
    this.photoPreview.set('');
    this.nouvelleForm.patchValue({ photo_url: '' });
  }

  // --- SOUMISSIONS ---

  public submitNouvelle(): void {
    if (this.nouvelleForm.invalid) {
      this.nouvelleForm.markAllAsTouched();
      return;
    }

    const val = this.nouvelleForm.getRawValue();
    const currentAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : null);

    const catechumeneData: CreateCatechumeneDto = {
      nom: val.nom.trim(),
      prenoms: val.prenoms.trim(),
      sexe: val.sexe,
      date_naissance: val.date_naissance,
      lieu_naissance: val.lieu_naissance ? val.lieu_naissance.trim() : undefined,
      telephone: val.telephone ? val.telephone.trim() : undefined,
      domicile: val.domicile ? val.domicile.trim() : undefined,
      adresse: val.domicile ? val.domicile.trim() : undefined,
      profession: val.profession ? val.profession.trim() : undefined,
      classe_scolaire: val.classe_scolaire ? val.classe_scolaire.trim() : undefined,
      photo_url: val.photo_url || this.photoPreview() || undefined,
      nom_pere: val.nom_pere ? val.nom_pere.trim() : undefined,
      telephone_pere: val.telephone_pere ? val.telephone_pere.trim() : undefined,
      nom_mere: val.nom_mere ? val.nom_mere.trim() : undefined,
      telephone_mere: val.telephone_mere ? val.telephone_mere.trim() : undefined,
      nom_tuteur: val.nom_tuteur ? val.nom_tuteur.trim() : undefined,
      telephone_tuteur: val.telephone_tuteur ? val.telephone_tuteur.trim() : undefined,
      est_baptise: val.est_baptise,
      date_bapteme: val.est_baptise && val.date_bapteme ? val.date_bapteme : undefined,
      paroisse_bapteme: val.est_baptise && val.paroisse_bapteme ? val.paroisse_bapteme.trim() : undefined,
      num_carnet_bapteme: val.est_baptise && val.num_carnet_bapteme ? val.num_carnet_bapteme.trim() : undefined,
      nom_parrain: val.nom_parrain ? val.nom_parrain.trim() : undefined,
      telephone_parrain: val.telephone_parrain ? val.telephone_parrain.trim() : undefined,
      ceb_id: val.ceb_id || undefined,
      statut: 'actif'
    };

    const inscriptionData: CreateInscriptionAnnuelleDto = {
      catechumene_id: '', // Sera affecté après création
      annee_catechese_id: currentAnnee ? currentAnnee.id : '',
      section_id: val.section_id || undefined,
      niveau_id: val.niveau_id,
      classe_id: val.classe_id || undefined,
      ceb_id: val.ceb_id || undefined,
      mouvement_id: val.mouvement_id || undefined,
      date_inscription: new Date().toISOString().substring(0, 10),
      statut_inscription: val.statut_inscription,
      frais_inscription_payes: val.frais_inscription_payes,
      observation: val.observation ? val.observation.trim() : undefined
    };

    const selectedSection = this.sections().find(s => s.id === val.section_id);
    const selectedNiv = this.niveaux().find(n => n.id === val.niveau_id);
    const selectedClasse = this.classes().find(c => c.id === val.classe_id);
    const selectedCeb = this.cebs().find(c => c.id === val.ceb_id);
    const selectedMouvement = this.mouvements().find(m => m.id === val.mouvement_id);

    this.nouvelleInscriptionSubmitted.emit({
      catechumeneData,
      inscriptionData,
      section: selectedSection,
      niveau: selectedNiv,
      classe: selectedClasse,
      ceb: selectedCeb,
      mouvement: selectedMouvement
    });
  }

  public submitReinscription(): void {
    const cat = this.foundCatechumene();
    if (!cat) return;

    if (this.reinscriptionForm.invalid) {
      this.reinscriptionForm.markAllAsTouched();
      return;
    }

    const val = this.reinscriptionForm.getRawValue();
    const currentAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : null);

    const updateCatechumeneData: UpdateCatechumeneDto = {
      telephone: val.telephone ? val.telephone.trim() : undefined,
      domicile: val.domicile ? val.domicile.trim() : undefined,
      adresse: val.domicile ? val.domicile.trim() : undefined,
      profession: val.profession ? val.profession.trim() : undefined,
      classe_scolaire: val.classe_scolaire ? val.classe_scolaire.trim() : undefined,
      telephone_tuteur: val.telephone_tuteur ? val.telephone_tuteur.trim() : undefined
    };

    const inscriptionData: CreateInscriptionAnnuelleDto = {
      catechumene_id: cat.id,
      annee_catechese_id: currentAnnee ? currentAnnee.id : '',
      section_id: val.section_id || undefined,
      niveau_id: val.niveau_id,
      classe_id: val.classe_id || undefined,
      ceb_id: val.ceb_id || undefined,
      mouvement_id: val.mouvement_id || undefined,
      date_inscription: new Date().toISOString().substring(0, 10),
      statut_inscription: val.statut_inscription,
      frais_inscription_payes: val.frais_inscription_payes,
      observation: val.observation ? val.observation.trim() : undefined
    };

    const selectedSection = this.sections().find(s => s.id === val.section_id);
    const selectedNiv = this.niveaux().find(n => n.id === val.niveau_id);
    const selectedClasse = this.classes().find(c => c.id === val.classe_id);
    const selectedCeb = this.cebs().find(c => c.id === val.ceb_id);
    const selectedMouvement = this.mouvements().find(m => m.id === val.mouvement_id);

    this.reinscriptionSubmitted.emit({
      catechumeneId: cat.id,
      updateCatechumeneData,
      inscriptionData,
      catechumene: cat,
      section: selectedSection,
      niveau: selectedNiv,
      classe: selectedClasse,
      ceb: selectedCeb,
      mouvement: selectedMouvement
    });
  }

  public submitEdit(): void {
    const item = this.inscriptionToEdit();
    if (!item) return;

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const val = this.editForm.getRawValue();
    const currentAnnee = this.annees().find(a => a.id === item.annee_catechese_id) || item.annee_catechese;

    const dto: UpdateInscriptionAnnuelleDto = {
      section_id: val.section_id || undefined,
      niveau_id: val.niveau_id,
      classe_id: val.classe_id || undefined,
      ceb_id: val.ceb_id || undefined,
      mouvement_id: val.mouvement_id || undefined,
      statut_inscription: val.statut_inscription,
      frais_inscription_payes: val.frais_inscription_payes,
      observation: val.observation ? val.observation.trim() : undefined
    };

    const selectedSection = this.sections().find(s => s.id === val.section_id);
    const selectedNiv = this.niveaux().find(n => n.id === val.niveau_id);
    const selectedClasse = this.classes().find(c => c.id === val.classe_id);
    const selectedCeb = this.cebs().find(c => c.id === val.ceb_id);
    const selectedMouvement = this.mouvements().find(m => m.id === val.mouvement_id);

    this.formSubmitted.emit({
      dto,
      catechumene: item.catechumene,
      annee: currentAnnee,
      section: selectedSection,
      niveau: selectedNiv,
      classe: selectedClasse,
      ceb: selectedCeb,
      mouvement: selectedMouvement
    });
  }

  public onClose(): void {
    this.formClosed.emit();
  }
}
