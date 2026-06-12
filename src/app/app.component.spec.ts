import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { KeycloakService } from './core/auth/keycloak.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const keycloakSpy = jasmine.createSpyObj<KeycloakService>(
      'KeycloakService',
      ['getUsername', 'isAdmin', 'logout']
    );
    keycloakSpy.getUsername.and.returnValue('usuario');
    keycloakSpy.isAdmin.and.returnValue(false);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: KeycloakService, useValue: keycloakSpy },
      ],
    }).compileComponents();
  });

  it('deve criar o componente raiz', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('deve renderizar a navbar e o router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-navbar')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
