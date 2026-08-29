import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  CreateProfilDto,
  MenuActionPermission,
  MenuTreeItem,
  ProfilItem,
  SousMenuItem,
  UpdateProfilDto
} from '../../models/profil.model';
import { ProfilService } from '../../services/profil.service';
import { AppDialog } from '../../../../../shared/ui/components/dialogs/app-dialog/app-dialog.component';
import { AppButton } from '../../../../../shared/ui/components/buttons/app-button/app-button.component';

export type ActionKey = 'read' | 'create' | 'update' | 'delete' | 'restore' | 'force_delete';

export const ACTION_LABELS: { key: ActionKey; label: string; icon: string; badgeClass: string }[] = [
  { key: 'read', label: 'Lecture', icon: 'bi-eye', badgeClass: 'action-read' },
  { key: 'create', label: 'Création', icon: 'bi-plus-circle', badgeClass: 'action-create' },
  { key: 'update', label: 'Modification', icon: 'bi-pencil', badgeClass: 'action-update' },
  { key: 'delete', label: 'Suppression', icon: 'bi-trash', badgeClass: 'action-delete' },
];

@Component({
  selector: 'app-profil-form-modal',
  imports: [CommonModule, ReactiveFormsModule, AppDialog, AppButton],
  templateUrl: './profil-form-modal.component.html',
  styleUrl: './profil-form-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfilFormModalComponent {
  private readonly profilService = inject(ProfilService);

  public readonly isOpen = input<boolean>(false);
  public readonly isEditing = input<boolean>(false);
  public readonly profilToEdit = input<ProfilItem | null>(null);
  public readonly isLoading = input<boolean>(false);

  public readonly formClosed = output<void>();
  public readonly formSubmitted = output<CreateProfilDto | UpdateProfilDto>();

  protected readonly permissionsTree = this.profilService.permissionsTree;
  protected readonly actionLabels = ACTION_LABELS;

  // Selected action map: key is `${uuid || reference}:${action}`
  protected readonly selectedActions = signal<Set<string>>(new Set());

  protected readonly form = new FormGroup({
    nom: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)]
    }),
    code: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true }),
    statut: new FormControl<'actif' | 'inactif'>('actif', { nonNullable: true })
  });

  // Calculate total possible actions in the tree
  protected readonly totalPossibleActionsCount = computed(() => {
    let count = 0;
    for (const menu of this.permissionsTree()) {
      count += 4; // read, create, update, delete
      if (menu.sousMenus) {
        count += menu.sousMenus.length * 4;
      }
    }
    return count || 1;
  });

  protected readonly selectedCount = computed(() => this.selectedActions().size);

  protected readonly isAllSelected = computed(() => {
    const total = this.totalPossibleActionsCount();
    const count = this.selectedCount();
    return total > 0 && count >= total;
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const p = this.profilToEdit();
      const isEdit = this.isEditing();

      if (open) {
        if (isEdit && p) {
          this.form.setValue({
            nom: p.nom || p.name || '',
            code: p.code || '',
            description: p.description || '',
            statut: p.statut_code || (p.statut === 'Actif' || p.statut === 'actif' ? 'actif' : 'inactif')
          });

          // Initialize permissions from profile
          this.loadPermissionsFromProfil(p);
        } else {
          this.form.reset({
            nom: '',
            code: '',
            description: '',
            statut: 'actif'
          });
          this.selectedActions.set(new Set());
        }
      }
    });
  }

  private loadPermissionsFromProfil(p: ProfilItem): void {
    const nextSet = new Set<string>();

    // 1. If menus are present with granular permissions
    if (p.menus && Array.isArray(p.menus)) {
      for (const m of p.menus) {
        this.extractMenuActions(m, nextSet);
        if (m.sousMenus) {
          for (const sm of m.sousMenus) {
            this.extractMenuActions(sm, nextSet);
          }
        }
      }
    }

    // 2. If permissions array has string keys
    if (p.permissions && Array.isArray(p.permissions)) {
      for (const permKey of p.permissions) {
        nextSet.add(permKey);
      }
    }

    this.selectedActions.set(nextSet);
  }

  private extractMenuActions(item: { uuid?: string; reference?: string; permissions?: MenuActionPermission }, set: Set<string>): void {
    const id = item.uuid || item.reference;
    if (!id || !item.permissions) return;
    const perms = item.permissions;

    if (perms.read || perms.can_read) set.add(`${id}:read`);
    if (perms.create || perms.can_create) set.add(`${id}:create`);
    if (perms.update || perms.can_update) set.add(`${id}:update`);
    if (perms.delete || perms.can_delete) set.add(`${id}:delete`);
    if (perms.restore || perms.can_restore) set.add(`${id}:restore`);
    if (perms.force_delete || perms.can_force_delete) set.add(`${id}:force_delete`);
  }

  protected isActionChecked(menuIdentifier: string, action: ActionKey): boolean {
    return this.selectedActions().has(`${menuIdentifier}:${action}`) || this.selectedActions().has(`${menuIdentifier}.${action}`);
  }

  protected toggleAction(menuIdentifier: string, action: ActionKey): void {
    const key1 = `${menuIdentifier}:${action}`;
    const key2 = `${menuIdentifier}.${action}`;

    this.selectedActions.update(set => {
      const next = new Set(set);
      if (next.has(key1) || next.has(key2)) {
        next.delete(key1);
        next.delete(key2);
      } else {
        next.add(key1);
      }
      return next;
    });
  }

  protected toggleAllActionsForMenu(menu: MenuTreeItem | SousMenuItem): void {
    const id = menu.uuid || menu.reference;
    const actions: ActionKey[] = ['read', 'create', 'update', 'delete'];
    const current = this.selectedActions();

    const isAllMenuChecked = actions.every(a => current.has(`${id}:${a}`) || current.has(`${id}.${a}`));

    this.selectedActions.update(set => {
      const next = new Set(set);
      actions.forEach(a => {
        const k = `${id}:${a}`;
        if (isAllMenuChecked) {
          next.delete(k);
          next.delete(`${id}.${a}`);
        } else {
          next.add(k);
        }
      });
      return next;
    });
  }

  protected isMenuAllChecked(menu: MenuTreeItem | SousMenuItem): boolean {
    const id = menu.uuid || menu.reference;
    const actions: ActionKey[] = ['read', 'create', 'update', 'delete'];
    const current = this.selectedActions();
    return actions.every(a => current.has(`${id}:${a}`) || current.has(`${id}.${a}`));
  }

  protected toggleRootMenuAndSubmenus(root: MenuTreeItem): void {
    const items: (MenuTreeItem | SousMenuItem)[] = [root, ...(root.sousMenus || [])];
    const actions: ActionKey[] = ['read', 'create', 'update', 'delete'];
    const current = this.selectedActions();

    const allChecked = items.every(item => {
      const id = item.uuid || item.reference;
      return actions.every(a => current.has(`${id}:${a}`) || current.has(`${id}.${a}`));
    });

    this.selectedActions.update(set => {
      const next = new Set(set);
      items.forEach(item => {
        const id = item.uuid || item.reference;
        actions.forEach(a => {
          const k = `${id}:${a}`;
          if (allChecked) {
            next.delete(k);
            next.delete(`${id}.${a}`);
          } else {
            next.add(k);
          }
        });
      });
      return next;
    });
  }

  protected isRootMenuAllChecked(root: MenuTreeItem): boolean {
    const items: (MenuTreeItem | SousMenuItem)[] = [root, ...(root.sousMenus || [])];
    const actions: ActionKey[] = ['read', 'create', 'update', 'delete'];
    const current = this.selectedActions();

    return items.every(item => {
      const id = item.uuid || item.reference;
      return actions.every(a => current.has(`${id}:${a}`) || current.has(`${id}.${a}`));
    });
  }

  protected toggleAllGlobalPermissions(): void {
    const allSelected = this.isAllSelected();

    this.selectedActions.update(set => {
      if (allSelected) {
        return new Set();
      }

      const next = new Set<string>();
      const actions: ActionKey[] = ['read', 'create', 'update', 'delete'];

      for (const root of this.permissionsTree()) {
        const items = [root, ...(root.sousMenus || [])];
        for (const item of items) {
          const id = item.uuid || item.reference;
          for (const a of actions) {
            next.add(`${id}:${a}`);
          }
        }
      }
      return next;
    });
  }

  protected onClose(): void {
    this.formClosed.emit();
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const val = this.form.getRawValue();
    const currentActions = this.selectedActions();

    // 1. Build menu_permissions hierarchical payload
    const menu_permissions = this.permissionsTree().map(root => {
      const rootId = root.uuid || root.reference;
      const rootPerms = {
        read: this.isActionChecked(rootId, 'read'),
        create: this.isActionChecked(rootId, 'create'),
        update: this.isActionChecked(rootId, 'update'),
        delete: this.isActionChecked(rootId, 'delete'),
        restore: this.isActionChecked(rootId, 'restore'),
        force_delete: this.isActionChecked(rootId, 'force_delete')
      };

      const sousMenus = (root.sousMenus || []).map(sm => {
        const smId = sm.uuid || sm.reference;
        return {
          uuid: sm.uuid,
          reference: sm.reference,
          permissions: {
            read: this.isActionChecked(smId, 'read'),
            create: this.isActionChecked(smId, 'create'),
            update: this.isActionChecked(smId, 'update'),
            delete: this.isActionChecked(smId, 'delete'),
            restore: this.isActionChecked(smId, 'restore'),
            force_delete: this.isActionChecked(smId, 'force_delete')
          }
        };
      });

      return {
        uuid: root.uuid,
        reference: root.reference,
        permissions: rootPerms,
        sousMenus: sousMenus.length > 0 ? sousMenus : undefined
      };
    });

    const permissionsArray = Array.from(currentActions);

    const payload: CreateProfilDto | UpdateProfilDto = {
      nom: val.nom.trim(),
      code: val.code ? val.code.trim() : undefined,
      description: val.description ? val.description.trim() : undefined,
      statut: val.statut,
      permissions: permissionsArray,
      menu_permissions: menu_permissions
    };

    this.formSubmitted.emit(payload);
  }
}
