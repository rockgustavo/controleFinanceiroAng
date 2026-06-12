import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { adminGuard } from './auth.guard';
import { KeycloakService } from './keycloak.service';

describe('adminGuard', () => {
  let keycloak: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    keycloak = jasmine.createSpyObj<KeycloakService>('KeycloakService', ['isAdmin']);
    TestBed.configureTestingModule({
      providers: [{ provide: KeycloakService, useValue: keycloak }],
    });
  });

  function run() {
    return TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  }

  it('libera o acesso quando o usuário é ADMIN', () => {
    keycloak.isAdmin.and.returnValue(true);
    expect(run()).toBeTrue();
  });

  it('bloqueia o acesso quando o usuário não é ADMIN', () => {
    keycloak.isAdmin.and.returnValue(false);
    expect(run()).toBeFalse();
  });
});
