import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor';
import { KeycloakService } from './keycloak.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let keycloak: jasmine.SpyObj<KeycloakService>;

  beforeEach(() => {
    keycloak = jasmine.createSpyObj<KeycloakService>('KeycloakService', ['getToken', 'logout']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: KeycloakService, useValue: keycloak },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adiciona Authorization: Bearer quando há token', fakeAsync(() => {
    keycloak.getToken.and.resolveTo('tok-123');

    http.get('/api/x').subscribe();
    tick(); // resolve a Promise do getToken()

    const req = httpMock.expectOne('/api/x');
    expect(req.request.headers.get('Authorization')).toBe('Bearer tok-123');
    req.flush({});
  }));

  it('não adiciona header quando o token vem vazio', fakeAsync(() => {
    keycloak.getToken.and.resolveTo('');

    http.get('/api/x').subscribe();
    tick();

    const req = httpMock.expectOne('/api/x');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  }));

  it('faz logout no erro 401', fakeAsync(() => {
    keycloak.getToken.and.resolveTo('tok');

    http.get('/api/x').subscribe({ error: () => {} });
    tick();

    httpMock.expectOne('/api/x').flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(keycloak.logout).toHaveBeenCalled();
  }));

  it('não faz logout em erros diferentes de 401', fakeAsync(() => {
    keycloak.getToken.and.resolveTo('tok');

    http.get('/api/x').subscribe({ error: () => {} });
    tick();

    httpMock.expectOne('/api/x').flush(null, { status: 500, statusText: 'Server Error' });

    expect(keycloak.logout).not.toHaveBeenCalled();
  }));
});
