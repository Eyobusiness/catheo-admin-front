import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  public show(type: ToastType, title: string, message: string, duration = 4000): void {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastMessage = { id, type, title, message, duration };

    this._toasts.update(current => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  public success(title: string, message: string, duration?: number): void {
    this.show('success', title, message, duration);
  }

  public error(title: string, message: string, duration?: number): void {
    this.show('error', title, message, duration);
  }

  public warning(title: string, message: string, duration?: number): void {
    this.show('warning', title, message, duration);
  }

  public info(title: string, message: string, duration?: number): void {
    this.show('info', title, message, duration);
  }

  public remove(id: string): void {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }

  public clear(): void {
    this._toasts.set([]);
  }
}
