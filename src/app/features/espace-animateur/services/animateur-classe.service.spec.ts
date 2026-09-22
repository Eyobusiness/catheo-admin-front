import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AnimateurClasseService } from './animateur-classe.service';
import { environment } from '../../../environments/environment';

describe('AnimateurClasseService', () => {
  let service: AnimateurClasseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnimateurClasseService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(AnimateurClasseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('devrait récupérer la classe sans envoyer de classe_id', () => {
    service.getMaClasse().subscribe(res => {
      expect(res).toBeTruthy();
      expect(service.classe()?.nom).toBe('3ème année - A');
      expect(service.effectif()).toBe(24);
      expect(service.hasNoAffectation()).toBe(false);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/animateur/ma-classe`);
    expect(req.request.method).toBe('GET');
    expect(req.request.params.keys().length).toBe(0); // Règle stricte: aucun classe_id envoyé

    req.flush({
      classe: { id: 10, nom: '3ème année - A' },
      niveau: { id: 2, nom: 'Niveau 3' },
      section: { id: 1, nom: 'Enfance' },
      annee_pastorale: { id: 5, libelle: '2025-2026' },
      effectif: 24,
      catechumenes: []
    });
  });

  it('devrait gérer proprement le code 404 (aucune affectation active)', () => {
    service.getMaClasse().subscribe(res => {
      expect(res).toBeNull();
      expect(service.hasNoAffectation()).toBe(true);
      expect(service.classe()).toBeNull();
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/animateur/ma-classe`);
    req.flush({ message: 'Aucune affectation trouvée' }, { status: 404, statusText: 'Not Found' });
  });
});
