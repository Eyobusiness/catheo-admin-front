import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  InscriptionAnnuelleDto,
  CreateInscriptionAnnuelleDto,
  UpdateInscriptionAnnuelleDto,
  StatutInscriptionAnnuelle
} from '../../models/inscription-annuelle.model';
import { CatechumeneDto } from '../../../liste-catechumene/models/catechumene.model';
import { AnneeCatecheseDto } from '../../../../Organisations/AnneesPastorales/models/annee-catechese.model';
import { Section } from '../../../../Organisations/Sections/models/section.model';
import { NiveauDto } from '../../../../Organisations/Niveaux/models/niveau.model';
import { ClasseDto } from '../../../../Organisations/Classe/models/classe.model';
import { Ceb } from '../../../../Organisations/Ceb/models/ceb.model';
import { Mouvement } from '../../../../Organisations/Mouvements/models/mouvement.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-inscription-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './inscription-form-modal.component.html',
  styleUrl: './inscription-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InscriptionFormModalComponent {
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

  protected readonly catechumeneSearch = signal<string>('');

  protected readonly form = new FormGroup({
    catechumene_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    annee_catechese_id: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
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
      const item = this.inscriptionToEdit();
      const currentAnnee = this.annees().find(a => a.est_active) || (this.annees().length > 0 ? this.annees()[0] : null);

      if (this.isEditing() && item) {
        this.form.setValue({
          catechumene_id: item.catechumene_id || item.catechumene?.id || '',
          annee_catechese_id: item.annee_catechese_id || item.annee_catechese?.id || (currentAnnee?.id || ''),
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
        this.form.reset({
          catechumene_id: '',
          annee_catechese_id: currentAnnee ? currentAnnee.id : '',
          section_id: '',
          niveau_id: '',
          classe_id: '',
          ceb_id: '',
          mouvement_id: '',
          statut_inscription: 'inscrit',
          frais_inscription_payes: false,
          observation: ''
        });
      }
    });
  }

  protected getFilteredClasses(): ClasseDto[] {
    const nivId = this.form.controls.niveau_id.value;
    if (!nivId) return this.classes();
    return this.classes().filter(c => c.niveau_id === nivId || c.niveau?.id === nivId);
  }

  protected getFilteredNiveaux(): NiveauDto[] {
    const secId = this.form.controls.section_id.value;
    if (!secId) return this.niveaux();
    return this.niveaux().filter(n => n.section_id === secId || n.section?.id === secId);
  }

  protected getFilteredCatechumenes(): CatechumeneDto[] {
    const q = this.catechumeneSearch().toLowerCase().trim();
    const list = this.catechumenes();
    if (!q) return list.slice(0, 30);
    return list.filter(c =>
      c.nom.toLowerCase().includes(q) ||
      c.prenoms.toLowerCase().includes(q) ||
      c.code_catechumene.toLowerCase().includes(q) ||
      (c.matricule && c.matricule.toLowerCase().includes(q))
    ).slice(0, 30);
  }

  protected onCatSearchChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.catechumeneSearch.set(input.value);
  }

  protected selectCatechumene(id: string): void {
    this.form.controls.catechumene_id.setValue(id);
  }

  protected getSelectedCatechumene(): CatechumeneDto | undefined {
    const catId = this.form.controls.catechumene_id.value;
    return this.catechumenes().find(c => c.id === catId);
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const selectedCat = this.catechumenes().find(c => c.id === val.catechumene_id);
      const selectedAnnee = this.annees().find(a => a.id === val.annee_catechese_id);
      const selectedSection = this.sections().find(s => s.id === val.section_id);
      const selectedNiv = this.niveaux().find(n => n.id === val.niveau_id);
      const selectedClasse = this.classes().find(c => c.id === val.classe_id);
      const selectedCeb = this.cebs().find(c => c.id === val.ceb_id);
      const selectedMouvement = this.mouvements().find(m => m.id === val.mouvement_id);

      if (this.isEditing()) {
        const dto: UpdateInscriptionAnnuelleDto = {
          section_id: val.section_id || undefined,
          niveau_id: val.niveau_id || undefined,
          classe_id: val.classe_id || undefined,
          ceb_id: val.ceb_id || undefined,
          mouvement_id: val.mouvement_id || undefined,
          statut_inscription: val.statut_inscription,
          frais_inscription_payes: val.frais_inscription_payes,
          observation: val.observation || undefined
        };
        this.formSubmitted.emit({
          dto,
          catechumene: selectedCat,
          annee: selectedAnnee,
          section: selectedSection,
          niveau: selectedNiv,
          classe: selectedClasse,
          ceb: selectedCeb,
          mouvement: selectedMouvement
        });
      } else {
        const dto: CreateInscriptionAnnuelleDto = {
          catechumene_id: val.catechumene_id,
          annee_catechese_id: val.annee_catechese_id,
          section_id: val.section_id || undefined,
          niveau_id: val.niveau_id,
          classe_id: val.classe_id || undefined,
          ceb_id: val.ceb_id || undefined,
          mouvement_id: val.mouvement_id || undefined,
          statut_inscription: val.statut_inscription,
          frais_inscription_payes: val.frais_inscription_payes,
          observation: val.observation || undefined
        } as any;
        this.formSubmitted.emit({
          dto,
          catechumene: selectedCat,
          annee: selectedAnnee,
          section: selectedSection,
          niveau: selectedNiv,
          classe: selectedClasse,
          ceb: selectedCeb,
          mouvement: selectedMouvement
        });
      }
    } else {
      this.form.markAllAsTouched();
    }
  }
}
