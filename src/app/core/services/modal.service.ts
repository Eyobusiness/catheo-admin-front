import { Injectable, signal } from '@angular/core';

export interface ModalConfig<T = unknown> {
  id: string;
  title: string;
  subtitle?: string;
  data?: T;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private readonly _activeModals = signal<Map<string, ModalConfig>>(new Map());
  public readonly activeModals = this._activeModals.asReadonly();

  public open<T>(config: ModalConfig<T>): void {
    this._activeModals.update(map => {
      const newMap = new Map(map);
      newMap.set(config.id, config);
      return newMap;
    });
  }

  public close(id: string): void {
    this._activeModals.update(map => {
      const newMap = new Map(map);
      newMap.delete(id);
      return newMap;
    });
  }

  public isOpen(id: string): boolean {
    return this._activeModals().has(id);
  }

  public closeAll(): void {
    this._activeModals.set(new Map());
  }
}
