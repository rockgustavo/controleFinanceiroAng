import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RendimentoService } from './rendimento.service';
import { environment } from '../../../../environments/environment';
import { ReturnsResponse, AllocationItem } from '../../../core/models/returns.model';
import { SnapshotSummary } from '../../../core/models/snapshot.model';

describe('RendimentoService', () => {
  let service: RendimentoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/snapshots`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RendimentoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('listSnapshots() faz GET e desembrulha data', () => {
    const data: SnapshotSummary[] = [
      { id: '1', data: '2025-05-31', totalLiq: 66300, numeroPosicoes: 5 },
    ];
    let result: SnapshotSummary[] | undefined;

    service.listSnapshots().subscribe(r => (result = r));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data });

    expect(result).toEqual(data);
  });

  it('listSnapshots() retorna [] quando data ausente', () => {
    let result: SnapshotSummary[] | undefined;
    service.listSnapshots().subscribe(r => (result = r));
    httpMock.expectOne(base).flush({ success: true });
    expect(result).toEqual([]);
  });

  it('getReturns() monta a rota com mode=simple', () => {
    const data: ReturnsResponse = {
      snapshotId: 'abc', data: '2025-05-31', totalLiqAtual: 110,
      totalLiqAnterior: 100, rendimentoAbsoluto: 10, rendimentoPercentual: 10, modo: 'simple',
    };
    let result: ReturnsResponse | undefined;

    service.getReturns('abc', 'simple').subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/abc/returns?mode=simple`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data });

    expect(result?.modo).toBe('simple');
  });

  it('getReturns() monta a rota com mode=cagr', () => {
    service.getReturns('abc', 'cagr').subscribe();
    const req = httpMock.expectOne(`${base}/abc/returns?mode=cagr`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: {} });
  });

  it('getAllocation() faz GET e desembrulha, [] quando ausente', () => {
    const data: AllocationItem[] = [{ tipo: 'RENDA_FIXA', totalLiq: 70000, percentual: 70 }];
    let result: AllocationItem[] | undefined;

    service.getAllocation('abc').subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/abc/allocation`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data });

    expect(result).toEqual(data);
  });

  it('getAllocation() retorna [] quando data ausente', () => {
    let result: AllocationItem[] | undefined;
    service.getAllocation('abc').subscribe(r => (result = r));
    httpMock.expectOne(`${base}/abc/allocation`).flush({ success: true });
    expect(result).toEqual([]);
  });
});
