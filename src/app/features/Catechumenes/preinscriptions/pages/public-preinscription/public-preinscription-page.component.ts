import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PreinscriptionService } from '../../services/preinscription.service';
import { CampagnePreinscriptionService } from '../../../campagnes/services/campagne.service';
import { SectionService } from '../../../../Organisations/Sections/services/section.service';
import { NiveauService } from '../../../../Organisations/Niveaux/services/niveau.service';
import { CebService } from '../../../../Organisations/Ceb/services/ceb.service';
import { MouvementService } from '../../../../Organisations/Mouvements/services/mouvement.service';
import { CatechumeneService } from '../../../liste-catechumene/services/catechumene.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { PdfService } from '../../../../../core/services/pdf.service';
import { CampagnePreinscriptionDto } from '../../../campagnes/models/campagne.model';
import { CatechumeneDto } from '../../../liste-catechumene/models/catechumene.model';
import {
  PreinscriptionDto,
  SubmitPreinscriptionDto
} from '../../models/preinscription.model';
import { ConfigurationService } from '../../../../Parametes/Configuration/services/configuration.service';
import {
  getPreinscriptionSectionProfile,
  isAdulteSection,
  isEnfantCollege,
  isEnfantPrimaire,
  isEnfantSection,
  isJeuneSection
} from '../../helpers/preinscription-section.helper';

export type PublicPreinscriptionMode = 'choice' | 'nouvelle' | 'reinscription' | 'success';

@Component({
  selector: 'app-public-preinscription-page',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './public-preinscription-page.component.html',
  styleUrl: './public-preinscription-page.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicPreinscriptionPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly preinscriptionService = inject(PreinscriptionService);
  private readonly campagneService = inject(CampagnePreinscriptionService);
  private readonly sectionService = inject(SectionService);
  private readonly niveauService = inject(NiveauService);
  private readonly cebService = inject(CebService);
  private readonly mouvementService = inject(MouvementService);
  private readonly catechumeneService = inject(CatechumeneService);
  private readonly configService = inject(ConfigurationService);
  private readonly toastService = inject(ToastService);
  private readonly pdfService = inject(PdfService);

  // Configuration réelle de la Paroisse (chargée depuis la BD)
  public readonly paroisseConfig = this.configService.paroisseConfig;

  public readonly nomParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.nom_paroisse || p?.nom || '';
  });

  public readonly diocese = computed(() => {
    const p = this.paroisseConfig();
    return p?.diocese || '';
  });

  public readonly doyenne = computed(() => {
    const p = this.paroisseConfig();
    return p?.doyenne || '';
  });

  public readonly logoParoisse = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_paroisse_url || p?.logo_paroisse || p?.logo_url || '';
  });

  public readonly logoCatechese = computed(() => {
    const p = this.paroisseConfig();
    return p?.logo_catechese_url || p?.logo_catechese || '';
  });

  // Données dynamiques chargées depuis la BD
  public readonly sections = this.sectionService.sections;
  public readonly niveaux = this.niveauService.niveaux;
  public readonly cebs = this.cebService.cebs;
  public readonly mouvements = this.mouvementService.mouvements;
  public readonly isLoading = signal<boolean>(false);
  public readonly isInitialLoading = signal<boolean>(true);

  // Campagne active récupérée de la BD
  public readonly currentCampagne = signal<CampagnePreinscriptionDto | null>(null);

  // Mode en cours ('choice' | 'nouvelle' | 'reinscription' | 'success')
  public readonly currentMode = signal<PublicPreinscriptionMode>('choice');

  // Étape active pour le stepper mobile (1 à 4)
  public readonly activeStep = signal<number>(1);

  // Recherche pour réinscription
  public readonly searchMatricule = signal<string>('');
  public readonly foundCatechumene = signal<CatechumeneDto | null>(null);
  public readonly isSearchingMatricule = signal<boolean>(false);
  public readonly searchMatriculeError = signal<string | null>(null);

  // Aperçu photo
  public readonly photoPreview = signal<string>('');

  // Résultat de la soumission réussie
  public readonly submittedDossier = signal<PreinscriptionDto | null>(null);

  // Formulaire pour NOUVELLE INSCRIPTION
  public readonly nouvelleForm = new FormGroup({
    // Étape 1 : Orientation
    section_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    niveau_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),

    // Étape 2 : Identité
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    sexe: new FormControl<'M' | 'F'>('M', { nonNullable: true, validators: [Validators.required] }),
    date_naissance: new FormControl('', { nonNullable: true }),
    lieu_naissance: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    domicile: new FormControl('', { nonNullable: true }),
    profession: new FormControl('', { nonNullable: true }),
    classe_scolaire: new FormControl('', { nonNullable: true }),
    situation_matrimoniale: new FormControl('', { nonNullable: true }),
    photo_url: new FormControl('', { nonNullable: true }),

    // Étape 3 : Parents / Filiation
    nom_pere: new FormControl('', { nonNullable: true }),
    telephone_pere: new FormControl('', { nonNullable: true }),
    nom_mere: new FormControl('', { nonNullable: true }),
    telephone_mere: new FormControl('', { nonNullable: true }),
    nom_tuteur: new FormControl('', { nonNullable: true }),
    telephone_tuteur: new FormControl('', { nonNullable: true }),

    // Étape 4 : Sacrements & Engagement
    est_baptise: new FormControl<boolean>(false, { nonNullable: true }),
    date_bapteme: new FormControl('', { nonNullable: true }),
    paroisse_bapteme: new FormControl('', { nonNullable: true }),
    num_carnet_bapteme: new FormControl('', { nonNullable: true }),
    nom_parrain: new FormControl('', { nonNullable: true }),
    telephone_parrain: new FormControl('', { nonNullable: true }),
    ceb_id: new FormControl('', { nonNullable: true }),
    mouvement_id: new FormControl('', { nonNullable: true })
  });

  // Formulaire pour RÉINSCRIPTION
  public readonly reinscriptionForm = new FormGroup({
    section_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    niveau_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    nom: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    telephone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    domicile: new FormControl('', { nonNullable: true }),
    situation_matrimoniale: new FormControl('', { nonNullable: true }),
    profession: new FormControl('', { nonNullable: true }),
    classe_scolaire: new FormControl('', { nonNullable: true }),
    telephone_tuteur: new FormControl('', { nonNullable: true }),
    nom_tuteur: new FormControl('', { nonNullable: true }),
    ceb_id: new FormControl('', { nonNullable: true }),
    mouvement_id: new FormControl('', { nonNullable: true })
  });

  // Signaux réactifs pour traquer la section sélectionnée
  public readonly selectedSectionIdNouvelle = signal<string>('');
  public readonly selectedSectionIdReinscription = signal<string>('');

  constructor() {
    this.nouvelleForm.controls.section_id.valueChanges.subscribe(val => {
      this.selectedSectionIdNouvelle.set(val || '');
    });
    this.reinscriptionForm.controls.section_id.valueChanges.subscribe(val => {
      this.selectedSectionIdReinscription.set(val || '');
    });
  }

  // Section sélectionnée (Nouvelle Inscription)
  public readonly selectedSectionNouvelle = computed(() => {
    const secId = this.selectedSectionIdNouvelle().trim();
    if (!secId) return null;
    return this.sections().find(s => 
      String(s.id) === secId || 
      String((s as any).uuid || '') === secId || 
      s.nom.trim().toLowerCase() === secId.toLowerCase()
    ) || null;
  });

  // Section sélectionnée (Réinscription)
  public readonly selectedSectionReinscription = computed(() => {
    const secId = this.selectedSectionIdReinscription().trim();
    if (!secId) return null;
    return this.sections().find(s => 
      String(s.id) === secId || 
      String((s as any).uuid || '') === secId || 
      s.nom.trim().toLowerCase() === secId.toLowerCase()
    ) || null;
  });

  // Niveaux filtrés STRICTEMENT par section sélectionnée (Nouvelle Inscription)
  public readonly filteredNiveauxNouvelle = computed(() => {
    const secId = this.selectedSectionIdNouvelle().trim();
    if (!secId) return [];
    const sec = this.selectedSectionNouvelle();
    const secNom = String(sec?.nom || '').trim().toLowerCase();
    const secCode = String(sec?.code || '').trim().toUpperCase();
    const secRealId = sec ? String(sec.id) : secId;
    const secRealUuid = sec ? String((sec as any).uuid || '') : '';

    return this.niveaux().filter(n => {
      const nSecId = String(n.section_id || n.section?.id || '').trim();
      const nSecUuid = String((n as any).section?.uuid || (n as any).section_uuid || '').trim();
      const nSecNom = String(n.section?.nom || '').trim().toLowerCase();
      const nSecCode = String((n as any).section?.code || '').trim().toUpperCase();

      const matchId = nSecId === secId || nSecId === secRealId;
      const matchUuid = (secRealUuid && nSecUuid === secRealUuid) || (secId && nSecUuid === secId);
      const matchNom = (secNom && nSecNom === secNom) || (secCode && nSecCode === secCode);

      return matchId || matchUuid || matchNom;
    });
  });

  // Niveaux filtrés STRICTEMENT par section sélectionnée (Réinscription)
  public readonly filteredNiveauxReinscription = computed(() => {
    const secId = this.selectedSectionIdReinscription().trim();
    if (!secId) return [];
    const sec = this.selectedSectionReinscription();
    const secNom = String(sec?.nom || '').trim().toLowerCase();
    const secCode = String(sec?.code || '').trim().toUpperCase();
    const secRealId = sec ? String(sec.id) : secId;
    const secRealUuid = sec ? String((sec as any).uuid || '') : '';

    return this.niveaux().filter(n => {
      const nSecId = String(n.section_id || n.section?.id || '').trim();
      const nSecUuid = String((n as any).section?.uuid || (n as any).section_uuid || '').trim();
      const nSecNom = String(n.section?.nom || '').trim().toLowerCase();
      const nSecCode = String((n as any).section?.code || '').trim().toUpperCase();

      const matchId = nSecId === secId || nSecId === secRealId;
      const matchUuid = (secRealUuid && nSecUuid === secRealUuid) || (secId && nSecUuid === secId);
      const matchNom = (secNom && nSecNom === secNom) || (secCode && nSecCode === secCode);

      return matchId || matchUuid || matchNom;
    });
  });

  // Conditions dynamiques précises sur les champs (Nouvelle Inscription)
  public readonly isEnfantNouvelle = computed(() => isEnfantSection(this.selectedSectionNouvelle()));
  public readonly isCollegeNouvelle = computed(() => isEnfantCollege(this.selectedSectionNouvelle()));
  public readonly isJeuneNouvelle = computed(() => isJeuneSection(this.selectedSectionNouvelle()));
  public readonly isAdulteNouvelle = computed(() => isAdulteSection(this.selectedSectionNouvelle()));

  // 1. Adultes : fonction/profession + situation matrimoniale, pas de classe scolaire
  public readonly showProfessionNouvelle = computed(() => this.isAdulteNouvelle());
  public readonly showSituationMatrimonialeNouvelle = computed(() => this.isAdulteNouvelle());

  // 2. Jeunes : classe scolaire supprimée, champs de base intacts
  // 3. Autre (Enfants) : affiche la classe scolaire
  public readonly showClasseScolaireNouvelle = computed(() => {
    if (!this.selectedSectionNouvelle()) return false;
    return !this.isAdulteNouvelle() && !this.isJeuneNouvelle();
  });

  public readonly labelClasseScolaireNouvelle = computed(() => {
    if (this.isCollegeNouvelle()) return 'Classe à l\'école / Collège';
    return 'Classe à l\'école / Primaire';
  });

  public readonly placeholderClasseScolaireNouvelle = computed(() => {
    if (this.isCollegeNouvelle()) return 'Ex: 6ème, 5ème, 4ème, 3ème';
    return 'Ex: CP1, CP2, CE1, CE2, CM1, CM2';
  });

  // Conditions dynamiques précises sur les champs (Réinscription)
  public readonly isEnfantReinscription = computed(() => isEnfantSection(this.selectedSectionReinscription()));
  public readonly isCollegeReinscription = computed(() => isEnfantCollege(this.selectedSectionReinscription()));
  public readonly isJeuneReinscription = computed(() => isJeuneSection(this.selectedSectionReinscription()));
  public readonly isAdulteReinscription = computed(() => isAdulteSection(this.selectedSectionReinscription()));

  public readonly showProfessionReinscription = computed(() => this.isAdulteReinscription());
  public readonly showSituationMatrimonialeReinscription = computed(() => this.isAdulteReinscription());
  public readonly showClasseScolaireReinscription = computed(() => {
    if (!this.selectedSectionReinscription()) return false;
    return !this.isAdulteReinscription() && !this.isJeuneReinscription();
  });

  public ngOnInit(): void {
    // 1. Charger la configuration de la paroisse et les listes de la BD (Sections, Niveaux, CEBs, Mouvements, Catéchumènes)
    this.configService.getParoisseConfig().subscribe();
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.cebService.getAll().subscribe();
    this.mouvementService.getAll().subscribe();
    this.catechumeneService.getAll().subscribe();

    // 2. Charger les détails de la Campagne réelle depuis la BD
    const paramCampagneId = this.route.snapshot.paramMap.get('campagneId');
    if (paramCampagneId) {
      this.currentCampagne.set({
        id: paramCampagneId,
        titre: 'Campagne de Préinscription',
        date_debut: '',
        date_fin: '',
        statut: 'ouverte',
        est_ouverte: true,
        sections_autorisees: []
      } as CampagnePreinscriptionDto);

      this.campagneService.getById(paramCampagneId).subscribe({
        next: camp => {
          if (camp && (camp.id || (camp as any).uuid)) {
            this.currentCampagne.set(camp);
          }
          this.isInitialLoading.set(false);
        },
        error: () => {
          this.isInitialLoading.set(false);
        }
      });
    } else {
      this.loadFallbackCampagne();
    }
  }

  private loadFallbackCampagne(): void {
    const localList = this.campagneService.campagnes();
    if (localList && localList.length > 0) {
      const active = localList.find(c => c.statut === 'ouverte' || c.est_ouverte) || localList[0];
      this.currentCampagne.set(active);
      this.isInitialLoading.set(false);
      return;
    }

    this.campagneService.getAll().subscribe({
      next: list => {
        const active = list.find(c => c.statut === 'ouverte' || c.est_ouverte) || list[0] || null;
        this.currentCampagne.set(active);
        this.isInitialLoading.set(false);
      },
      error: () => {
        this.isInitialLoading.set(false);
      }
    });
  }

  // --- GESTION DES SECTIONS & NIVEAUX ---
  public onNouvelleSectionChange(): void {
    this.nouvelleForm.controls.niveau_id.setValue('');
    if (this.isAdulteNouvelle()) {
      this.nouvelleForm.controls.classe_scolaire.setValue('');
    } else if (this.isJeuneNouvelle()) {
      this.nouvelleForm.controls.classe_scolaire.setValue('');
      this.nouvelleForm.controls.profession.setValue('');
      this.nouvelleForm.controls.situation_matrimoniale.setValue('');
    } else {
      // Autres (Enfants)
      this.nouvelleForm.controls.profession.setValue('');
      this.nouvelleForm.controls.situation_matrimoniale.setValue('');
    }
  }

  public onReinscriptionSectionChange(): void {
    this.reinscriptionForm.controls.niveau_id.setValue('');
    if (this.isAdulteReinscription()) {
      this.reinscriptionForm.controls.classe_scolaire.setValue('');
    } else if (this.isJeuneReinscription()) {
      this.reinscriptionForm.controls.classe_scolaire.setValue('');
      this.reinscriptionForm.controls.profession.setValue('');
      this.reinscriptionForm.controls.situation_matrimoniale.setValue('');
    } else {
      this.reinscriptionForm.controls.profession.setValue('');
      this.reinscriptionForm.controls.situation_matrimoniale.setValue('');
    }
  }

  // --- NAVIGATION DU STEPPER ---
  public goToStep(step: number): void {
    // Valider les étapes précédentes avant d'avancer
    if (step > 1 && this.currentMode() === 'nouvelle') {
      if (step === 2 && (this.nouvelleForm.controls.section_id.invalid || this.nouvelleForm.controls.niveau_id.invalid)) {
        this.nouvelleForm.controls.section_id.markAsTouched();
        this.nouvelleForm.controls.niveau_id.markAsTouched();
        this.toastService.warning('Orientation requise', 'Veuillez choisir la section et le niveau.');
        return;
      }
      if (step === 3 && (this.nouvelleForm.controls.nom.invalid || this.nouvelleForm.controls.prenoms.invalid)) {
        this.nouvelleForm.controls.nom.markAsTouched();
        this.nouvelleForm.controls.prenoms.markAsTouched();
        this.toastService.warning('Identité requise', 'Veuillez renseigner le nom et les prénoms.');
        return;
      }
    }

    this.activeStep.set(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public nextStep(): void {
    this.goToStep(this.activeStep() + 1);
  }

  public prevStep(): void {
    if (this.activeStep() > 1) {
      this.goToStep(this.activeStep() - 1);
    }
  }

  // --- GESTION DU CHOIX INITIAL ---
  public selectChoice(mode: 'nouvelle' | 'reinscription'): void {
    this.currentMode.set(mode);
    this.activeStep.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  public backToChoice(): void {
    this.currentMode.set('choice');
    this.searchMatriculeError.set(null);
    this.foundCatechumene.set(null);
    this.activeStep.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- RECHERCHE PAR MATRICULE POUR RÉINSCRIPTION ---
  public onSearchMatricule(): void {
    const mat = this.searchMatricule().trim();
    if (!mat) {
      this.searchMatriculeError.set('Veuillez saisir un matricule ou code catéchumène.');
      return;
    }

    this.isSearchingMatricule.set(true);
    this.searchMatriculeError.set(null);

    // 1. Recherche dans la liste déjà chargée
    const matLower = mat.toLowerCase();
    const foundLocal = this.catechumeneService.catechumenes().find(
      c => (c.matricule && c.matricule.toLowerCase() === matLower) ||
           (c.code_catechumene && c.code_catechumene.toLowerCase() === matLower) ||
           (c.nom_complet && c.nom_complet.toLowerCase().includes(matLower)) ||
           (`${c.nom} ${c.prenoms}`.toLowerCase().includes(matLower))
    );

    if (foundLocal) {
      this.applyFoundCatechumene(foundLocal);
      this.isSearchingMatricule.set(false);
      return;
    }

    // 2. Recherche directe par API
    this.catechumeneService.getByMatricule(mat).subscribe({
      next: cat => {
        this.isSearchingMatricule.set(false);
        if (cat && (cat.id || cat.nom)) {
          this.applyFoundCatechumene(cat);
        } else {
          this.tryFallbackSearchInAll(mat);
        }
      },
      error: () => {
        this.tryFallbackSearchInAll(mat);
      }
    });
  }

  private tryFallbackSearchInAll(mat: string): void {
    this.catechumeneService.getAll().subscribe({
      next: list => {
        this.isSearchingMatricule.set(false);
        const matLower = mat.toLowerCase();
        const found = list.find(
          c => (c.matricule && c.matricule.toLowerCase() === matLower) ||
               (c.code_catechumene && c.code_catechumene.toLowerCase() === matLower) ||
               (c.nom_complet && c.nom_complet.toLowerCase().includes(matLower)) ||
               (`${c.nom} ${c.prenoms}`.toLowerCase().includes(matLower))
        );

        if (found) {
          this.applyFoundCatechumene(found);
        } else {
          this.searchMatriculeError.set(`Aucun catéchumène trouvé avec le matricule « ${mat} ».`);
          this.foundCatechumene.set(null);
        }
      },
      error: () => {
        this.isSearchingMatricule.set(false);
        this.searchMatriculeError.set(`Aucun dossier trouvé pour le matricule « ${mat} ».`);
        this.foundCatechumene.set(null);
      }
    });
  }

  private applyFoundCatechumene(cat: CatechumeneDto): void {
    this.foundCatechumene.set(cat);

    // Pré-remplir le formulaire
    this.reinscriptionForm.patchValue({
      nom: cat.nom,
      prenoms: cat.prenoms,
      telephone: cat.telephone || '',
      domicile: cat.domicile || cat.adresse || '',
      situation_matrimoniale: cat.situation_matrimoniale || '',
      profession: cat.profession || '',
      classe_scolaire: cat.classe_scolaire || '',
      nom_tuteur: cat.nom_tuteur || '',
      telephone_tuteur: cat.telephone_tuteur || '',
      ceb_id: cat.ceb_id || cat.ceb?.id || ''
    });

    if (cat.photo_url || cat.photo_path) {
      this.photoPreview.set(cat.photo_url || cat.photo_path || '');
    }

    this.toastService.success('Dossier Retrouvé', `Bienvenue ${cat.nom} ${cat.prenoms} !`);
  }

  // --- PHOTO ---
  public onPhotoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.warning('Photo trop grande', 'La taille maximale acceptée est de 2 Mo.');
        return;
      }

      const reader = new FileReader();
      reader.onload = e => {
        const base64 = e.target?.result as string;
        this.photoPreview.set(base64);
        this.nouvelleForm.controls.photo_url.setValue(base64);
      };
      reader.readAsDataURL(file);
    }
  }

  public removePhoto(): void {
    this.photoPreview.set('');
    this.nouvelleForm.controls.photo_url.setValue('');
  }

  // --- SOUMISSION : NOUVELLE INSCRIPTION ---
  public submitNouvelle(): void {
    if (this.nouvelleForm.invalid) {
      this.nouvelleForm.markAllAsTouched();
      this.toastService.warning('Formulaire Incomplet', 'Veuillez vérifier les champs obligatoires (*).');
      return;
    }

    const val = this.nouvelleForm.getRawValue();
    const paramCampagneId = this.route.snapshot.paramMap.get('campagneId');
    const campagneId = this.currentCampagne()?.id || paramCampagneId || '';

    if (!campagneId) {
      this.toastService.error(
        'Campagne introuvable',
        'Aucune campagne de préinscription active n\'a été sélectionnée. Veuillez vérifier qu\'une campagne est bien ouverte.'
      );
      return;
    }

    const dto: SubmitPreinscriptionDto = {
      campagne_id: campagneId,
      type_demande: 'premiere_inscription',
      section_souhaite_id: val.section_id,
      niveau_souhaite_id: val.niveau_id,
      nom: val.nom.trim().toUpperCase(),
      prenoms: val.prenoms.trim(),
      sexe: val.sexe,
      date_naissance: val.date_naissance || undefined,
      lieu_naissance: val.lieu_naissance || undefined,
      telephone: val.telephone || undefined,
      domicile: val.domicile || undefined,
      profession: this.showProfessionNouvelle() ? (val.profession || undefined) : undefined,
      classe_scolaire: this.showClasseScolaireNouvelle() ? (val.classe_scolaire || undefined) : undefined,
      situation_matrimoniale: this.showSituationMatrimonialeNouvelle() ? (val.situation_matrimoniale || undefined) : undefined,
      photo_url: this.photoPreview() || undefined,
      nom_pere: val.nom_pere || undefined,
      telephone_pere: val.telephone_pere || undefined,
      nom_mere: val.nom_mere || undefined,
      telephone_mere: val.telephone_mere || undefined,
      nom_tuteur: val.nom_tuteur || undefined,
      telephone_tuteur: val.telephone_tuteur || undefined,
      est_baptise: val.est_baptise,
      date_bapteme: val.est_baptise ? (val.date_bapteme || undefined) : undefined,
      paroisse_bapteme: val.est_baptise ? (val.paroisse_bapteme || undefined) : undefined,
      num_carnet_bapteme: val.est_baptise ? (val.num_carnet_bapteme || undefined) : undefined,
      nom_parrain: val.nom_parrain || undefined,
      telephone_parrain: val.telephone_parrain || undefined
    };

    this.isLoading.set(true);
    this.preinscriptionService.submitPublic(dto).subscribe({
      next: (created) => {
        this.isLoading.set(false);
        this.submittedDossier.set(created);
        this.currentMode.set('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // --- SOUMISSION : RÉINSCRIPTION ---
  public submitReinscription(): void {
    if (this.reinscriptionForm.invalid) {
      this.reinscriptionForm.markAllAsTouched();
      this.toastService.warning('Formulaire Incomplet', 'Veuillez sélectionner la section et le niveau.');
      return;
    }

    const cat = this.foundCatechumene();
    if (!cat) {
      this.toastService.warning('Catéchumène Requis', 'Veuillez retrouver votre matricule.');
      return;
    }

    const val = this.reinscriptionForm.getRawValue();
    const paramCampagneId = this.route.snapshot.paramMap.get('campagneId');
    const campagneId = this.currentCampagne()?.id || paramCampagneId || '';

    if (!campagneId) {
      this.toastService.error(
        'Campagne introuvable',
        'Aucune campagne de préinscription active n\'a été sélectionnée. Veuillez vérifier qu\'une campagne est bien ouverte.'
      );
      return;
    }

    const dto: SubmitPreinscriptionDto = {
      campagne_id: campagneId,
      type_demande: 'reinscription',
      section_souhaite_id: val.section_id,
      niveau_souhaite_id: val.niveau_id,
      nom: cat.nom,
      prenoms: cat.prenoms,
      sexe: cat.sexe,
      date_naissance: cat.date_naissance,
      lieu_naissance: cat.lieu_naissance,
      telephone: val.telephone || cat.telephone,
      domicile: val.domicile || cat.domicile,
      profession: this.showProfessionReinscription() ? (val.profession || cat.profession) : undefined,
      classe_scolaire: this.showClasseScolaireReinscription() ? (val.classe_scolaire || cat.classe_scolaire) : undefined,
      situation_matrimoniale: this.showSituationMatrimonialeReinscription() ? (val.situation_matrimoniale || cat.situation_matrimoniale) : undefined,
      photo_url: cat.photo_url || this.photoPreview() || undefined,
      nom_pere: cat.nom_pere,
      telephone_pere: cat.telephone_pere,
      nom_mere: cat.nom_mere,
      telephone_mere: cat.telephone_mere,
      nom_tuteur: val.nom_tuteur || cat.nom_tuteur,
      telephone_tuteur: val.telephone_tuteur || cat.telephone_tuteur,
      est_baptise: cat.est_baptise,
      date_bapteme: cat.date_bapteme,
      paroisse_bapteme: cat.paroisse_bapteme,
      num_carnet_bapteme: cat.num_carnet_bapteme,
      nom_parrain: cat.nom_parrain || cat.parrains_marraines?.[0]?.nom_prenoms || undefined,
      telephone_parrain: cat.telephone_parrain || cat.parrains_marraines?.[0]?.telephone || undefined
    };

    this.isLoading.set(true);
    this.preinscriptionService.submitPublic(dto).subscribe({
      next: (created) => {
        this.isLoading.set(false);
        this.submittedDossier.set(created);
        this.currentMode.set('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  // --- ACTIONS FINALES ---
  public printReceipt(): void {
    const dossier = this.submittedDossier();
    if (!dossier) return;
    this.pdfService.previewCatechumenePdf(dossier.id || (dossier as any).uuid || (dossier as any).catechumene_id, {
      nom: dossier.nom,
      prenoms: dossier.prenoms,
      matricule: (dossier as any).code_preinscription || (dossier as any).numero_dossier
    });
  }

  public resetForm(): void {
    this.nouvelleForm.reset({ sexe: 'M', est_baptise: false });
    this.reinscriptionForm.reset();
    this.photoPreview.set('');
    this.foundCatechumene.set(null);
    this.searchMatricule.set('');
    this.submittedDossier.set(null);
    this.currentMode.set('choice');
    this.activeStep.set(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
