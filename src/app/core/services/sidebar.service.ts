import { Injectable, signal } from '@angular/core';
import { APP_MENU, MenuItem } from '../constants/menu';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  public readonly isCollapsed = signal<boolean>(false);
  public readonly isMobileOpen = signal<boolean>(false);
  public readonly menuItems = signal<MenuItem[]>(APP_MENU);

  // All submenus closed/hidden by default, auto-expanded on active routes
  public readonly expandedMenus = signal<Set<string>>(new Set<string>());

  public toggleCollapse(): void {
    this.isCollapsed.update(val => !val);
  }

  public toggleMobile(): void {
    this.isMobileOpen.update(val => !val);
  }

  public closeMobile(): void {
    this.isMobileOpen.set(false);
  }

  public toggleSubMenu(reference: string): void {
    this.expandedMenus.update(set => {
      const newSet = new Set(set);
      if (newSet.has(reference)) {
        newSet.delete(reference);
      } else {
        newSet.add(reference);
      }
      return newSet;
    });
  }

  public expandSubMenu(reference: string): void {
    this.expandedMenus.update(set => {
      if (set.has(reference)) return set;
      const newSet = new Set(set);
      newSet.add(reference);
      return newSet;
    });
  }

  public isExpanded(reference: string): boolean {
    return this.expandedMenus().has(reference);
  }
}
