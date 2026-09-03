import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import {
  getPreinscriptionSectionProfile,
  isAdulteSection,
  isEnfantSection,
  isEnfantPrimaire,
  isEnfantCollege,
  isJeuneSection
} from '../../helpers/preinscription-section.helper';
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
  private readonly destroyRef = inject(DestroyRef);

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

  protected readonly activeTab = signal<'orientation' | 'candidat' | 'parents' | 'sacrements'>('orientation');
  public readonly photoPreview = signal<string>('');
  protected readonly selectedSectionId = signal<string>('');

  protected readonly selectedSection = computed(() => {
    const sectionId = this.selectedSectionId();
    return this.sections().find(section => section.id === sectionId) ?? null;
  });

  protected readonly filteredNiveaux = computed(() => {
    const sectionId = this.selectedSectionId();
    if (!sectionId) {
      return [];
    }

    return this.niveaux().filter(niveau => niveau.section_id === sectionId || niveau.section?.id === sectionId);
  });

  protected readonly sectionProfile = computed(() => getPreinscriptionSectionProfile(this.selectedSection()));
  protected readonly isEnfantSection = computed(() => isEnfantSection(this.selectedSection()));
  protected readonly isEnfantPrimaire = computed(() => isEnfantPrimaire(this.selectedSection()));
  protected readonly isEnfantCollege = computed(() => isEnfantCollege(this.selectedSection()));
  protected readonly isJeuneSection = computed(() => isJeuneSection(this.selectedSection()));
  protected readonly isAdulteSection = computed(() => isAdulteSection(this.selectedSection()));
  protected readonly showSectionDrivenFields = computed(() => !!this.selectedSectionId());
  protected readonly showClasseScolaire = computed(() => this.isEnfantSection());
  protected readonly showProfession = computed(() => {
    if (!this.selectedSectionId()) {
      return false;
    }

    return !this.isEnfantSection();
  });
  protected readonly showSituationMatrimoniale = computed(() => this.isAdulteSection());

  protected readonly classeScolairePlaceholder = computed(() => {
    if (this.isEnfantCollege()) return 'Ex: 6ème, 5ème, 4ème, 3ème';
    return 'Ex: CP1, CP2, CE1, CE2, CM1, CM2';
  });

  protected readonly classeScolaireLabel = computed(() => {
    if (this.isEnfantCollege()) return 'Classe au Collège';
    return 'Classe au Primaire';
  });

  protected readonly professionPlaceholder = computed(() => {
    if (this.isJeuneSection()) return 'Ex: Lycéen, Étudiant, Apprenti...';
    return 'Ex: Cadre, Commerçant, Enseignant, Fonctionnaire...';
  });

  protected readonly form = new FormGroup({
    campagne_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    type_demande: new FormControl<TypeDemandePreinscription>('premiere_inscription', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    section_souhaite_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    niveau_souhaite_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.niveauBelongsToSectionValidator()]
    }),

    nom: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    prenoms: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(2)] }),
    sexe: new FormControl<'M' | 'F'>('M', { nonNullable: true, validators: [Validators.required] }),
    date_naissance: new FormControl('', { nonNullable: true }),
    lieu_naissance: new FormControl('', { nonNullable: true }),
    adresse: new FormControl('', { nonNullable: true }),
    domicile: new FormControl('', { nonNullable: true }),
    telephone: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    profession: new FormControl('', { nonNullable: true }),
    classe_scolaire: new FormControl('', { nonNullable: true }),
    situation_matrimoniale: new FormControl('', { nonNullable: true }),
    photo_url: new FormControl('', { nonNullable: true }),

    nom_pere: new FormControl('', { nonNullable: true }),
    origine_pere: new FormControl('', { nonNullable: true }),
    telephone_pere: new FormControl('', { nonNullable: true }),
    nom_mere: new FormControl('', { nonNullable: true }),
    origine_mere: new FormControl('', { nonNullable: true }),
    telephone_mere: new FormControl('', { nonNullable: true }),
    nom_tuteur: new FormControl('', { nonNullable: true }),
    telephone_tuteur: new FormControl('', { nonNullable: true }),

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
    telephone_parrain: new FormControl('', { nonNullable: true })
  });

  private lastInitializedItemId: string | null = null;
  private wasOpen = false;

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.preinscriptionToEdit();
      const isEdit = this.isEditing();

      if (!open) {
        this.wasOpen = false;
        this.lastInitializedItemId = null;
        return;
      }

      const currentItemId = item ? (item.id || 'edit') : 'new';
      if (this.wasOpen && this.lastInitializedItemId === currentItemId) {
        return;
      }

      this.wasOpen = true;
      this.lastInitializedItemId = currentItemId;

      untracked(() => {
        const campaigns = this.campagnes();
        const openCampagne = campaigns.find(campagne => campagne.statut === 'ouverte') || campaigns[0] || null;

        if (isEdit && item) {
          const secId = item.section_souhaite_id || item.section_souhaite?.id || '';
          this.form.patchValue({
            campagne_id: item.campagne_id || item.campagne?.id || openCampagne?.id || '',
            type_demande: item.type_demande || 'nouvelle_inscription',
            section_souhaite_id: secId,
            niveau_souhaite_id: item.niveau_souhaite_id || item.niveau_souhaite?.id || '',

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
            telephone_parrain: item.telephone_parrain || ''
          }, { emitEvent: false });

          this.photoPreview.set(item.photo_url || '');
          this.selectedSectionId.set(secId);
        } else {
          this.form.reset({
            campagne_id: openCampagne?.id || '',
            type_demande: 'nouvelle_inscription',
            section_souhaite_id: '',
            niveau_souhaite_id: '',
            nom: '',
            prenoms: '',
            sexe: 'M',
            date_naissance: '',
            est_baptise: false,
            sexe_parrain: 'M'
          }, { emitEvent: false });

          this.photoPreview.set('');
          this.selectedSectionId.set('');
        }

        this.syncSectionSelection(this.form.controls.section_souhaite_id.value, false);
        this.applyBaptismRules(this.form.controls.est_baptise.value, false);
        this.applyPremiereCommunionRules(this.form.controls.date_premiere_communion.value, false);
        this.applyConfirmationRules(this.form.controls.date_confirmation.value, false);
      });
    }, { allowSignalWrites: true });

    this.form.controls.est_baptise.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(estBaptise => {
        this.applyBaptismRules(estBaptise, true);
      });

    this.form.controls.date_premiere_communion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(datePremiereCommunion => {
        this.applyPremiereCommunionRules(datePremiereCommunion, true);
      });

    this.form.controls.date_confirmation.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(dateConfirmation => {
        this.applyConfirmationRules(dateConfirmation, true);
      });
  }

  public onSectionSelect(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const secId = select.value;
    this.selectedSectionId.set(secId);
    this.form.patchValue({
      section_souhaite_id: secId,
      niveau_souhaite_id: ''
    });
    this.syncSectionSelection(secId, true);
  }

  public onSectionChange(event: Event): void {
    this.onSectionSelect(event);
  }

  public getFilteredNiveaux(sectionId?: string | null): NiveauDto[] {
    const secId = sectionId || this.selectedSectionId() || this.form.controls.section_souhaite_id.value;
    if (!secId) return [];
    return this.niveaux().filter(n => n.section_id === secId || n.section?.id === secId);
  }

  public onPhotoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.photoPreview.set(result);
        this.form.patchValue({ photo_url: result });
      };
      reader.readAsDataURL(file);
    }
  }

  public removePhoto(): void {
    this.photoPreview.set('');
    this.form.patchValue({ photo_url: '' });
  }

  protected setTab(tab: 'orientation' | 'candidat' | 'parents' | 'sacrements'): void {
    this.activeTab.set(tab);
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalidTab();
      return;
    }

    const value = this.form.getRawValue();
    const selectedCampagne = this.campagnes().find(campagne => campagne.id === value.campagne_id);
    const selectedSection = this.sections().find(section => section.id === value.section_souhaite_id);
    const selectedNiveau = this.filteredNiveaux().find(niveau => niveau.id === value.niveau_souhaite_id);

    if (!selectedSection || !selectedNiveau) {
      this.form.controls.section_souhaite_id.markAsTouched();
      this.form.controls.niveau_souhaite_id.markAsTouched();
      this.activeTab.set('orientation');
      return;
    }

    const isEnfant = this.isEnfantSection();
    const isAdulte = this.isAdulteSection();
    const shouldSendClasseScolaire = isEnfant;
    const shouldSendProfession = !isEnfant;
    const shouldSendSituationMatrimoniale = isAdulte;
    const hasPremiereCommunion = !!value.date_premiere_communion;
    const hasConfirmation = !!value.date_confirmation;

    const dto: SubmitPreinscriptionDto | UpdatePreinscriptionDto = {
      campagne_id: value.campagne_id,
      type_demande: value.type_demande,
      section_souhaite_id: value.section_souhaite_id,
      niveau_souhaite_id: value.niveau_souhaite_id,

      nom: value.nom,
      prenoms: value.prenoms,
      sexe: value.sexe,
      date_naissance: value.date_naissance || undefined,
      lieu_naissance: value.lieu_naissance || undefined,
      adresse: value.adresse || undefined,
      domicile: value.domicile || undefined,
      telephone: value.telephone || undefined,
      profession: shouldSendProfession ? (value.profession || undefined) : undefined,
      classe_scolaire: shouldSendClasseScolaire ? (value.classe_scolaire || undefined) : undefined,
      situation_matrimoniale: shouldSendSituationMatrimoniale ? (value.situation_matrimoniale || undefined) : undefined,
      photo_url: value.photo_url || undefined,

      nom_pere: value.nom_pere || undefined,
      origine_pere: value.origine_pere || undefined,
      telephone_pere: value.telephone_pere || undefined,
      nom_mere: value.nom_mere || undefined,
      origine_mere: value.origine_mere || undefined,
      telephone_mere: value.telephone_mere || undefined,
      nom_tuteur: value.nom_tuteur || undefined,
      telephone_tuteur: value.telephone_tuteur || undefined,

      est_baptise: value.est_baptise,
      num_carnet_bapteme: value.est_baptise ? (value.num_carnet_bapteme || undefined) : undefined,
      date_bapteme: value.est_baptise ? (value.date_bapteme || undefined) : undefined,
      lieu_bapteme: value.est_baptise ? (value.lieu_bapteme || undefined) : undefined,
      paroisse_bapteme: value.est_baptise ? (value.paroisse_bapteme || undefined) : undefined,
      ville_bapteme: value.est_baptise ? (value.ville_bapteme || undefined) : undefined,
      diocese_bapteme: value.est_baptise ? (value.diocese_bapteme || undefined) : undefined,

      date_premiere_communion: hasPremiereCommunion ? value.date_premiere_communion : undefined,
      paroisse_premiere_communion: hasPremiereCommunion ? (value.paroisse_premiere_communion || undefined) : undefined,

      date_confirmation: hasConfirmation ? value.date_confirmation : undefined,
      paroisse_confirmation: hasConfirmation ? (value.paroisse_confirmation || undefined) : undefined,
      ministre_confirmation: hasConfirmation ? (value.ministre_confirmation || undefined) : undefined,

      nom_parrain: value.nom_parrain || undefined,
      sexe_parrain: value.sexe_parrain || undefined,
      telephone_parrain: value.telephone_parrain || undefined
    };

    this.formSubmitted.emit({
      dto,
      campagne: selectedCampagne,
      section: selectedSection,
      niveau: selectedNiveau
    });
  }

  private syncSectionSelection(sectionId: string, resetNiveau: boolean): void {
    this.selectedSectionId.set(sectionId);

    if (resetNiveau) {
      this.form.controls.niveau_souhaite_id.setValue('', { emitEvent: false });
    }

    this.applySectionBusinessRules(resetNiveau);
    this.form.controls.niveau_souhaite_id.updateValueAndValidity({ emitEvent: false });
  }

  private applySectionBusinessRules(clearIrrelevantValues: boolean): void {
    const isEnfantProfile = this.isEnfantSection();
    const isJeuneProfile = this.isJeuneSection();
    const isAdulteProfile = this.isAdulteSection();

    this.setValidators(this.form.controls.classe_scolaire, isEnfantProfile ? [Validators.required] : []);
    this.setValidators(this.form.controls.profession, isJeuneProfile || isAdulteProfile ? [Validators.required] : []);
    this.setValidators(this.form.controls.situation_matrimoniale, isAdulteProfile ? [Validators.required] : []);

    if (clearIrrelevantValues && !isEnfantProfile) {
      this.form.controls.classe_scolaire.setValue('', { emitEvent: false });
    }

    if (clearIrrelevantValues && !this.showProfession()) {
      this.form.controls.profession.setValue('', { emitEvent: false });
    }

    if (clearIrrelevantValues && !isAdulteProfile) {
      this.form.controls.situation_matrimoniale.setValue('', { emitEvent: false });
    }
  }

  private applyBaptismRules(estBaptise: boolean, clearValuesWhenFalse: boolean): void {
    this.setValidators(this.form.controls.date_bapteme, estBaptise ? [Validators.required] : []);
    this.setValidators(this.form.controls.paroisse_bapteme, estBaptise ? [Validators.required] : []);

    if (!estBaptise && clearValuesWhenFalse) {
      this.form.controls.num_carnet_bapteme.setValue('', { emitEvent: false });
      this.form.controls.date_bapteme.setValue('', { emitEvent: false });
      this.form.controls.lieu_bapteme.setValue('', { emitEvent: false });
      this.form.controls.paroisse_bapteme.setValue('', { emitEvent: false });
      this.form.controls.ville_bapteme.setValue('', { emitEvent: false });
      this.form.controls.diocese_bapteme.setValue('', { emitEvent: false });
    }
  }

  private applyPremiereCommunionRules(datePremiereCommunion: string, clearValueWhenEmpty: boolean): void {
    this.setValidators(
      this.form.controls.paroisse_premiere_communion,
      datePremiereCommunion ? [Validators.required] : []
    );

    if (!datePremiereCommunion && clearValueWhenEmpty) {
      this.form.controls.paroisse_premiere_communion.setValue('', { emitEvent: false });
    }
  }

  private applyConfirmationRules(dateConfirmation: string, clearValuesWhenEmpty: boolean): void {
    this.setValidators(this.form.controls.paroisse_confirmation, dateConfirmation ? [Validators.required] : []);

    if (!dateConfirmation && clearValuesWhenEmpty) {
      this.form.controls.paroisse_confirmation.setValue('', { emitEvent: false });
      this.form.controls.ministre_confirmation.setValue('', { emitEvent: false });
    }
  }

  private setValidators(control: FormControl<string>, validators: ValidatorFn[]): void {
    control.setValidators(validators);
    control.updateValueAndValidity({ emitEvent: false });
  }

  private niveauBelongsToSectionValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const niveauId = control.value as string;
      if (!niveauId || !this.selectedSectionId()) {
        return null;
      }

      return this.filteredNiveaux().some(niveau => niveau.id === niveauId)
        ? null
        : { niveauDoesNotBelongToSection: true };
    };
  }

  private focusFirstInvalidTab(): void {
    const orientationControls = ['campagne_id', 'type_demande', 'section_souhaite_id', 'niveau_souhaite_id', 'classe_scolaire', 'profession', 'situation_matrimoniale'];
    const candidatControls = ['nom', 'prenoms', 'sexe', 'date_naissance', 'lieu_naissance', 'adresse', 'domicile', 'telephone'];
    const parentsControls = ['nom_pere', 'origine_pere', 'telephone_pere', 'nom_mere', 'origine_mere', 'telephone_mere', 'nom_tuteur', 'telephone_tuteur'];

    if (this.hasInvalidControl(orientationControls)) {
      this.activeTab.set('orientation');
      return;
    }

    if (this.hasInvalidControl(candidatControls)) {
      this.activeTab.set('candidat');
      return;
    }

    if (this.hasInvalidControl(parentsControls)) {
      this.activeTab.set('parents');
      return;
    }

    this.activeTab.set('sacrements');
  }

  private hasInvalidControl(controlNames: string[]): boolean {
    return controlNames.some(controlName => this.form.controls[controlName as keyof typeof this.form.controls].invalid);
  }
}
