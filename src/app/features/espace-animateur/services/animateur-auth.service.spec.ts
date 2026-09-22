import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AnimateurAuthService } from './animateur-auth.service';
import { environment } from '../../../environments/environment';

describe('AnimateurAuthService', () => {
  let service: AnimateurAuthService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        AnimateurAuthService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AnimateurAuthService);
  });

  it('devrait être initialisé sans token par défaut', () => {
    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('devrait stocker la session Animateur de façon étanche', () => {
    // Simuler token admin préexistant
    localStorage.setItem('catheo_auth_token', 'admin-token-xyz');

    service.setSession('anim-token-123', { telephone: 'ANIM-001', nom: 'Kouadio', prenoms: 'Ferdinand' });

    expect(service.token()).toBe('anim-token-123');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.displayName()).toBe('Ferdinand Kouadio');
    expect(localStorage.getItem('catheo_animateur_token')).toBe('anim-token-123');

    // Vérifier que le token admin est resté intact
    expect(localStorage.getItem('catheo_auth_token')).toBe('admin-token-xyz');
  });

  it('devrait vider uniquement la session Animateur lors du logout', () => {
    localStorage.setItem('catheo_auth_token', 'admin-token-xyz');
    service.setSession('anim-token-123', { telephone: 'ANIM-001' });

    service.clearSession();

    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('catheo_animateur_token')).toBeNull();

    // La session admin reste préservée
    expect(localStorage.getItem('catheo_auth_token')).toBe('admin-token-xyz');
  });

  it('devrait mettre à jour le profil et le stockage local lors de updateProfile', () => {
    const httpTesting = TestBed.inject(HttpTestingController);
    service.setSession('token-123', { telephone: 'ANIM-001', nom: 'AncienNom' });

    service.updateProfile({ nom: 'NouveauNom', email: 'test@example.com', telephone: 'ANIM-002' }).subscribe();

    const req = httpTesting.expectOne(`${environment.apiUrl}/animateur/profile`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ nom: 'NouveauNom', email: 'test@example.com', telephone: 'ANIM-002' });

    req.flush({
      status: 'success',
      message: 'Profil mis à jour',
      data: {
        animateur: {
          telephone: 'ANIM-002',
          nom: 'NouveauNom',
          email: 'test@example.com'
        }
      }
    });

    expect(service.profile()?.nom).toBe('NouveauNom');
    expect(service.profile()?.telephone).toBe('ANIM-002');
    expect(service.profile()?.email).toBe('test@example.com');
  });
});
