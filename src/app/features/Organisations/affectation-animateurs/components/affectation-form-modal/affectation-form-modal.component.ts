import { ChangeDetectionStrategy, Component, computed, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  AffectationAnimateur,
  CreateAffectationAnimateurDto,
  UpdateAffectationAnimateurDto
} from '../../models/affectation-animateur.model';
import { Animateur } from '../../../Animateurs/models/animateur.model';
import { Classe } from '../../../Classe/models/classe.model';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-affectation-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './affectation-form-modal.component.html',
  styleUrl: './affectation-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AffectationFormModalComponent {
  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly affectationToEdit = input<AffectationAnimateur | null>(null);
  public readonly animateurs = input<Animateur[]>([]);
  public readonly classes = input<Classe[]>([]);
  public readonly existingAffectations = input<AffectationAnimateur[]>([]);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<{
    dto: CreateAffectationAnimateurDto | UpdateAffectationAnimateurDto;
    animateurLabel: string;
    classeLabel: string;
  }>();

  private previousIsOpen = false;
  private hasInitializedForCurrentOpen = false;

  protected readonly availableAnimateurs = computed(() => {
    const allAnim = this.animateurs();
    const existing = this.existingAffectations();
    const isEdit = this.isEditing();
    const currentEdit = this.affectationToEdit();
    const currentEditAnimId = String(currentEdit?.animateur_id || currentEdit?.animateur?.id || '');

    let list: Animateur[];
    if (isEdit) {
      // In edit mode: all registered animators are available so the user can change or keep
      list = [...allAnim];
      // Guarantee current animator is in the list
      if (currentEdit?.animateur && currentEditAnimId) {
        const found = list.some(a => String(a.id) === currentEditAnimId);
        if (!found) {
          list.unshift({
            id: currentEditAnimId,
            nom: currentEdit.animateur.nom || 'Catéchiste',
            prenoms: currentEdit.animateur.prenoms || '',
            sexe: currentEdit.animateur.sexe || 'M',
            statut: 'actif'
          } as Animateur);
        }
      }
    } else {
      // In create mode: exclude animators already assigned
      const assignedIds = new Set(
        existing
          .map(a => String(a.animateur_id || a.animateur?.id || ''))
          .filter(id => !!id)
      );
      list = allAnim.filter(anim => !assignedIds.has(String(anim.id)));
    }

    return list;
  });

  protected readonly availableClasses = computed(() => {
    const allClasses = this.classes();
    const isEdit = this.isEditing();
    const currentEdit = this.affectationToEdit();
    const currentEditClsId = String(currentEdit?.classe_id || currentEdit?.classe?.id || '');

    const list = [...allClasses];
    if (isEdit && currentEdit?.classe && currentEditClsId) {
      const found = list.some(c => String(c.id) === currentEditClsId);
      if (!found) {
        list.unshift({
          id: currentEditClsId,
          nom: currentEdit.classe.nom || 'Classe',
          capacite_max: currentEdit.classe.capacite_max || 30,
          statut: 'active',
          niveau: currentEdit.classe.niveau
        } as Classe);
      }
    }
    return list;
  });

  protected readonly form = new FormGroup({
    animateur_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    classe_id: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    role: new FormControl<string>('principal', {
      nonNullable: true,
      validators: [Validators.required]
    })
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.affectationToEdit();
      const isEdit = this.isEditing();
      const anims = this.availableAnimateurs();
      const clss = this.availableClasses();

      if (!open) {
        this.previousIsOpen = false;
        this.hasInitializedForCurrentOpen = false;
        return;
      }

      const justOpened = !this.previousIsOpen;
      this.previousIsOpen = true;

      if (justOpened || !this.hasInitializedForCurrentOpen) {
        if (isEdit && item) {
          const rawAnimId = String(
            item.animateur_id ||
            item.animateur?.id ||
            (typeof item.animateur === 'string' ? item.animateur : '') ||
            ''
          );
          const foundAnim = anims.find(
            a => String(a.id) === rawAnimId ||
            (item.animateur && a.nom === item.animateur.nom && a.prenoms === item.animateur.prenoms)
          );
          const animId = foundAnim ? String(foundAnim.id) : (rawAnimId || (anims.length > 0 ? String(anims[0].id) : ''));

          const rawClsId = String(
            item.classe_id ||
            item.classe?.id ||
            (typeof item.classe === 'string' ? item.classe : '') ||
            ''
          );
          const foundCls = clss.find(
            c => String(c.id) === rawClsId ||
            (item.classe && c.nom === item.classe.nom)
          );
          const clsId = foundCls ? String(foundCls.id) : (rawClsId || (clss.length > 0 ? String(clss[0].id) : ''));

          const roleVal = String(item.role || (item as any).role_animateur || 'principal').toLowerCase().trim();
          const finalRole = roleVal.includes('assist')
            ? 'assistant'
            : roleVal.includes('adj')
            ? 'adjoint'
            : 'principal';

          this.form.patchValue({
            animateur_id: animId,
            classe_id: clsId,
            role: finalRole
          });

          if (animId && clsId) {
            this.hasInitializedForCurrentOpen = true;
          }
        } else if (!isEdit && justOpened) {
          this.form.reset({
            animateur_id: anims.length > 0 ? String(anims[0].id) : '',
            classe_id: clss.length > 0 ? String(clss[0].id) : '',
            role: 'principal'
          });
          this.hasInitializedForCurrentOpen = true;
        }
      }
    }, { allowSignalWrites: true });
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const anim = this.availableAnimateurs().find(a => String(a.id) === String(val.animateur_id));
      const cls = this.availableClasses().find(c => String(c.id) === String(val.classe_id));
      const animateurLabel = anim ? `${anim.nom} ${anim.prenoms}` : 'Catéchiste';
      const classeLabel = cls ? cls.nom : 'Classe';

      this.formSubmitted.emit({
        dto: {
          animateur_id: val.animateur_id,
          classe_id: val.classe_id,
          role: val.role
        },
        animateurLabel,
        classeLabel
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
