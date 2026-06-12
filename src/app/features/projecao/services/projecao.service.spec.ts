import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProjecaoService } from './projecao.service';
import { environment } from '../../../../environments/environment';
import { ProjecaoResponse } from '../../../core/models/returns.model';

describe('ProjecaoService', () => {
  let service: ProjecaoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/snapshots`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProjecaoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getProjection() monta a rota com rate e months', () => {
    const data: ProjecaoResponse = {
      dataReferencia: '2025-05-31', totalLiqAtual: 100000, taxaMensalPercentual: 1,
      meses: 12, totalProjetado: 112682.5, rendimentoProjetado: 12682.5,
    };
    let result: ProjecaoResponse | undefined;

    service.getProjection(1, 12).subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/latest/projection?rate=1&months=12`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data });

    expect(result?.totalProjetado).toBe(112682.5);
  });

  it('getProjection() preserva valores decimais de rate', () => {
    service.getProjection(1.5, 6).subscribe();
    const req = httpMock.expectOne(`${base}/latest/projection?rate=1.5&months=6`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });
});
