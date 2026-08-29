import { ChangeDetectionStrategy, Component, computed, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Calendrier, CreateCalendrierDto, UpdateCalendrierDto } from '../../models/calendrier.model';
import { AnneeCatecheseService } from '../../../AnneesPastorales/services/annee-catechese.service';
import { SectionService } from '../../../Sections/services/section.service';
import { NiveauService } from '../../../Niveaux/services/niveau.service';
import { ClasseService } from '../../../Classe/services/classe.service';
import { AnimateurService } from '../../../Animateurs/services/animateur.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-calendrier-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './calendrier-form-modal.component.html',
  styleUrl: './calendrier-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendrierFormModalComponent implements OnInit {
  private readonly anneeService = inject(AnneeCatecheseService);
  private readonly sectionService = inject(SectionService);
  private readonly niveauService = inject(NiveauService);
  private readonly classeService = inject(ClasseService);
  private readonly animateurService = inject(AnimateurService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly eventToEdit = input<Calendrier | null>(null);
  public readonly defaultDate = input<string>('');
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateCalendrierDto | UpdateCalendrierDto;
    anneeLibelle?: string;
  }>();

  // Signals from services
  protected readonly activeAnnee = this.anneeService.activeAnnee;
  protected readonly sections = this.sectionService.sections;
  protected readonly niveaux = this.niveauService.niveaux;
  protected readonly classes = this.classeService.classes;
  protected readonly animateurs = this.animateurService.animateurs;

  // Selected Target IDs
  protected readonly selectedSectionIds = signal<string[]>([]);
  protected readonly selectedNiveauIds = signal<string[]>([]);
  protected readonly selectedClasseIds = signal<string[]>([]);
  protected readonly selectedAnimateurIds = signal<string[]>([]);

  protected readonly form = new FormGroup({
    titre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3)]
    }),
    type: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    date: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    heure_debut: new FormControl('', { nonNullable: true }),
    heure_fin: new FormControl('', { nonNullable: true }),
    lieu: new FormControl('', { nonNullable: true }),
    cible_type: new FormControl('Tous', { nonNullable: true }),
    statut: new FormControl<'Planifié' | 'Réalisé' | 'Annulé'>('Planifié', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true })
  });

  public ngOnInit(): void {
    this.sectionService.getAll().subscribe();
    this.niveauService.getAll().subscribe();
    this.classeService.getAll().subscribe();
    this.animateurService.getAll().subscribe();
  }

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.eventToEdit();
      const isEdit = this.isEditing();

      if (!open) {
        return;
      }

      if (isEdit && item) {
        const cibleType = item.cible_type || 'Tous';
        const rawIds = item.cible_ids || (item.cible_id ? item.cible_id.split(',') : []);

        if (cibleType === 'Section') {
          this.selectedSectionIds.set(rawIds);
          this.selectedNiveauIds.set([]);
          this.selectedClasseIds.set([]);
          this.selectedAnimateurIds.set([]);
        } else if (cibleType === 'Niveau') {
          this.selectedNiveauIds.set(rawIds);
          this.selectedSectionIds.set([]);
          this.selectedClasseIds.set([]);
          this.selectedAnimateurIds.set([]);
        } else if (cibleType === 'Classe') {
          this.selectedClasseIds.set(rawIds);
          this.selectedSectionIds.set([]);
          this.selectedNiveauIds.set([]);
          this.selectedAnimateurIds.set([]);
        } else if (cibleType === 'Animateurs') {
          this.selectedAnimateurIds.set(rawIds);
          this.selectedSectionIds.set([]);
          this.selectedNiveauIds.set([]);
          this.selectedClasseIds.set([]);
        } else if (cibleType === 'Catéchumènes') {
          this.selectedSectionIds.set(item.cible_ids || []);
          this.selectedNiveauIds.set([]);
          this.selectedClasseIds.set([]);
          this.selectedAnimateurIds.set([]);
        } else {
          this.selectedSectionIds.set([]);
          this.selectedNiveauIds.set([]);
          this.selectedClasseIds.set([]);
          this.selectedAnimateurIds.set([]);
        }

        this.form.setValue({
          titre: item.titre,
          type: item.type || '',
          date: item.date ? item.date.split('T')[0].split(' ')[0] : '',
          heure_debut: item.heure_debut || '',
          heure_fin: item.heure_fin || '',
          lieu: item.lieu || '',
          cible_type: cibleType,
          statut: item.statut || 'Planifié',
          description: item.description || ''
        });
      } else {
        this.selectedSectionIds.set([]);
        this.selectedNiveauIds.set([]);
        this.selectedClasseIds.set([]);

        this.form.reset({
          titre: '',
          type: '',
          date: this.defaultDate() || new Date().toISOString().split('T')[0],
          heure_debut: '09:00',
          heure_fin: '12:00',
          lieu: 'Paroisse CIM',
          cible_type: 'Tous',
          statut: 'Planifié',
          description: ''
        });
      }
    });
  }

  // Section Toggle Helpers
  protected toggleSection(id: string): void {
    this.selectedSectionIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  protected isSectionSelected(id: string): boolean {
    return this.selectedSectionIds().includes(id);
  }

  protected toggleAllSections(): void {
    const all = this.sections().map(s => s.id);
    if (this.selectedSectionIds().length === all.length) {
      this.selectedSectionIds.set([]);
    } else {
      this.selectedSectionIds.set(all);
    }
  }

  // Niveau Toggle Helpers
  protected toggleNiveau(id: string): void {
    this.selectedNiveauIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  protected isNiveauSelected(id: string): boolean {
    return this.selectedNiveauIds().includes(id);
  }

  protected toggleAllNiveaux(): void {
    const all = this.niveaux().map(n => n.id);
    if (this.selectedNiveauIds().length === all.length) {
      this.selectedNiveauIds.set([]);
    } else {
      this.selectedNiveauIds.set(all);
    }
  }

  // Classe Toggle Helpers
  protected toggleClasse(id: string): void {
    this.selectedClasseIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  protected isClasseSelected(id: string): boolean {
    return this.selectedClasseIds().includes(id);
  }

  protected toggleAllClasses(): void {
    const all = this.classes().map(c => c.id);
    if (this.selectedClasseIds().length === all.length) {
      this.selectedClasseIds.set([]);
    } else {
      this.selectedClasseIds.set(all);
    }
  }

  // Animateur Toggle Helpers
  protected toggleAnimateur(id: string): void {
    this.selectedAnimateurIds.update(ids =>
      ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]
    );
  }

  protected isAnimateurSelected(id: string): boolean {
    return this.selectedAnimateurIds().includes(id);
  }

  protected toggleAllAnimateurs(): void {
    const all = this.animateurs().map(a => a.id);
    if (this.selectedAnimateurIds().length === all.length) {
      this.selectedAnimateurIds.set([]);
    } else {
      this.selectedAnimateurIds.set(all);
    }
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const currentActive = this.activeAnnee();
      const cibleType = val.cible_type;

      let cibleIds: string[] = [];
      let cibleNom: string = '';

      if (cibleType === 'Tous') {
        cibleNom = 'Toute la communauté (Tous les Catéchumènes & Tous les Animateurs)';
      } else if (cibleType === 'Animateurs') {
        cibleIds = this.selectedAnimateurIds();
        const names = this.animateurs()
          .filter(a => cibleIds.includes(a.id))
          .map(a => `${a.nom} ${a.prenoms}`);
        cibleNom = names.length > 0 ? `Animateurs (${names.join(', ')})` : 'Tous les Animateurs / Catéchistes';
      } else if (cibleType === 'Section') {
        cibleIds = this.selectedSectionIds();
        const names = this.sections()
          .filter(s => cibleIds.includes(s.id))
          .map(s => s.nom);
        cibleNom = names.length > 0 ? `Sections: ${names.join(', ')}` : 'Toutes les sections';
      } else if (cibleType === 'Niveau') {
        cibleIds = this.selectedNiveauIds();
        const names = this.niveaux()
          .filter(n => cibleIds.includes(n.id))
          .map(n => n.nom);
        cibleNom = names.length > 0 ? `Niveaux: ${names.join(', ')}` : 'Tous les niveaux';
      } else if (cibleType === 'Classe') {
        cibleIds = this.selectedClasseIds();
        const names = this.classes()
          .filter(c => cibleIds.includes(c.id))
          .map(c => c.nom);
        cibleNom = names.length > 0 ? `Classes: ${names.join(', ')}` : 'Toutes les classes';
      } else if (cibleType === 'Catéchumènes') {
        const secNames = this.sections()
          .filter(s => this.selectedSectionIds().includes(s.id))
          .map(s => s.nom);
        const nivNames = this.niveaux()
          .filter(n => this.selectedNiveauIds().includes(n.id))
          .map(n => n.nom);
        const clsNames = this.classes()
          .filter(c => this.selectedClasseIds().includes(c.id))
          .map(c => c.nom);

        cibleIds = [
          ...this.selectedSectionIds(),
          ...this.selectedNiveauIds(),
          ...this.selectedClasseIds()
        ];

        const details: string[] = [];
        if (secNames.length > 0) details.push(`Sections: ${secNames.join(', ')}`);
        if (nivNames.length > 0) details.push(`Niveaux: ${nivNames.join(', ')}`);
        if (clsNames.length > 0) details.push(`Classes: ${clsNames.join(', ')}`);

        cibleNom = details.length > 0 ? `Catéchumènes (${details.join(' | ')})` : 'Tous les Catéchumènes';
      }

      this.formSubmitted.emit({
        dto: {
          titre: val.titre,
          type: val.type,
          date: val.date,
          heure_debut: val.heure_debut || undefined,
          heure_fin: val.heure_fin || undefined,
          lieu: val.lieu || undefined,
          cible_type: cibleType,
          cible_id: cibleIds.length > 0 ? cibleIds.join(',') : undefined,
          cible_ids: cibleIds.length > 0 ? cibleIds : undefined,
          cible_nom: cibleNom || undefined,
          annee_catechese_id: currentActive?.id,
          statut: val.statut,
          description: val.description || undefined
        },
        anneeLibelle: currentActive?.libelle
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}

