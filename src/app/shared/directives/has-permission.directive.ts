import { Directive, TemplateRef, ViewContainerRef, effect, inject, input } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

export interface PermissionCheck {
  ref: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

@Directive({
  selector: '[hasPermission]',
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<any>);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly authService = inject(AuthService);

  /**
   * Entrée de la directive:
   * Accepte soit une chaîne sous la forme "reference:action" (ex: "annees_pastorales:delete" ou "sections:create"),
   * soit un objet { ref: string, action: 'create' | 'read' | 'update' | 'delete' }.
   */
  public readonly hasPermission = input<string | PermissionCheck | null | undefined>(null);

  private isVisible = false;

  constructor() {
    effect(() => {
      const perm = this.hasPermission();
      const hasAccess = this.checkAccess(perm);

      if (hasAccess && !this.isVisible) {
        this.viewContainer.createEmbeddedView(this.templateRef);
        this.isVisible = true;
      } else if (!hasAccess && this.isVisible) {
        this.viewContainer.clear();
        this.isVisible = false;
      }
    });
  }

  private checkAccess(val: string | PermissionCheck | null | undefined): boolean {
    if (!val) return true;

    if (typeof val === 'string') {
      const parts = val.split(/[:.]/);
      if (parts.length >= 2) {
        const ref = parts[0];
        const action = parts[1].toLowerCase() as 'create' | 'read' | 'update' | 'delete';
        return this.authService.hasPermission(ref, action);
      }
      // Si seule une référence ou action est passée
      return true;
    }

    if (typeof val === 'object' && val.ref && val.action) {
      return this.authService.hasPermission(val.ref, val.action);
    }

    return true;
  }
}
