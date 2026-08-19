import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateProfilDto, PermissionTreeNodeDto, ProfilDto, UpdateProfilDto } from '../../models/profil.model';
import { ProfilService } from '../../services/profil.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

@Component({
  selector: 'app-profil-form-modal',
  imports: [ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './profil-form-modal.component.html',
  styleUrl: './profil-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilFormModalComponent {
  private readonly profilService = inject(ProfilService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly profilToEdit = input<ProfilDto | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateProfilDto | UpdateProfilDto>();

  protected readonly permissionsTree = this.profilService.permissionsTree;

  // Selected permission keys set
  protected readonly selectedPermissions = signal<Set<string>>(new Set());

  protected readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    description: new FormControl('', { nonNullable: true })
  });

  // Total available permissions count
  protected readonly allAvailableKeys = computed(() => {
    const keys: string[] = [];
    for (const node of this.permissionsTree()) {
      if (node.permissions) {
        for (const p of node.permissions) {
          keys.push(p.key);
        }
      }
      if (node.sous_menus) {
        for (const sm of node.sous_menus) {
          for (const p of sm.permissions) {
            keys.push(p.key);
          }
        }
      }
    }
    return keys;
  });

  protected readonly isAllSelected = computed(() => {
    const all = this.allAvailableKeys();
    if (all.length === 0) return false;
    const current = this.selectedPermissions();
    return all.every(k => current.has(k));
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const p = this.profilToEdit();
      const isEdit = this.isEditing();

      if (open) {
        if (isEdit && p) {
          this.form.setValue({
            nom: p.nom || '',
            description: p.description || ''
          });
          this.selectedPermissions.set(new Set(p.permissions || []));
        } else {
          this.form.reset({
            nom: '',
            description: ''
          });
          this.selectedPermissions.set(new Set());
        }
      }
    });
  }

  protected isPermissionChecked(key: string): boolean {
    return this.selectedPermissions().has(key);
  }

  protected togglePermission(key: string): void {
    this.selectedPermissions.update(set => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  protected toggleAllPermissions(): void {
    if (this.isAllSelected()) {
      this.selectedPermissions.set(new Set());
    } else {
      this.selectedPermissions.set(new Set(this.allAvailableKeys()));
    }
  }

  protected toggleNodePermissions(node: PermissionTreeNodeDto): void {
    const nodeKeys: string[] = [];
    if (node.permissions) {
      node.permissions.forEach(p => nodeKeys.push(p.key));
    }
    if (node.sous_menus) {
      node.sous_menus.forEach(sm => sm.permissions.forEach(p => nodeKeys.push(p.key)));
    }

    const current = this.selectedPermissions();
    const allNodeSelected = nodeKeys.every(k => current.has(k));

    this.selectedPermissions.update(set => {
      const next = new Set(set);
      if (allNodeSelected) {
        nodeKeys.forEach(k => next.delete(k));
      } else {
        nodeKeys.forEach(k => next.add(k));
      }
      return next;
    });
  }

  protected isNodeAllSelected(node: PermissionTreeNodeDto): boolean {
    const nodeKeys: string[] = [];
    if (node.permissions) node.permissions.forEach(p => nodeKeys.push(p.key));
    if (node.sous_menus) node.sous_menus.forEach(sm => sm.permissions.forEach(p => nodeKeys.push(p.key)));
    if (nodeKeys.length === 0) return false;
    const current = this.selectedPermissions();
    return nodeKeys.every(k => current.has(k));
  }

  protected toggleSubMenuPermissions(sm: { permissions: { key: string }[] }): void {
    const smKeys = sm.permissions.map(p => p.key);
    const current = this.selectedPermissions();
    const allSelected = smKeys.every(k => current.has(k));

    this.selectedPermissions.update(set => {
      const next = new Set(set);
      if (allSelected) {
        smKeys.forEach(k => next.delete(k));
      } else {
        smKeys.forEach(k => next.add(k));
      }
      return next;
    });
  }

  protected isSubMenuAllSelected(sm: { permissions: { key: string }[] }): boolean {
    if (!sm.permissions || sm.permissions.length === 0) return false;
    const current = this.selectedPermissions();
    return sm.permissions.every(p => current.has(p.key));
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.valid) {
      const val = this.form.getRawValue();
      const permsArray = Array.from(this.selectedPermissions());

      this.formSubmitted.emit({
        nom: val.nom,
        description: val.description || undefined,
        permissions: permsArray
      });
    } else {
      this.form.markAllAsTouched();
    }
  }
}
