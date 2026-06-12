import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HistoricoService } from './historico.service';
import { environment } from '../../../../environments/environment';
import { SnapshotSummary, SnapshotDetail, CreateSnapshotRequest } from '../../../core/models/snapshot.model';

describe('HistoricoService', () => {
  let service: HistoricoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/snapshots`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(HistoricoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() faz GET e desembrulha, [] quando ausente', () => {
    const data: SnapshotSummary[] = [
      { id: '1', data: '2025-05-31', totalLiq: 66300, numeroPosicoes: 5 },
    ];
    let result: SnapshotSummary[] | undefined;

    service.list().subscribe(r => (result = r));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data });

    expect(result).toEqual(data);
  });

  it('list() retorna [] quando data ausente', () => {
    let result: SnapshotSummary[] | undefined;
    service.list().subscribe(r => (result = r));
    httpMock.expectOne(base).flush({ success: true });
    expect(result).toEqual([]);
  });

  it('latest() faz GET em /latest', () => {
    const detail = { id: '1', data: '2025-05-31', totalBruto: 0, totalLiq: 66300, posicoes: [] } as SnapshotDetail;
    let result: SnapshotDetail | undefined;

    service.latest().subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/latest`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: detail });

    expect(result?.id).toBe('1');
  });

  it('getById() faz GET na rota do id', () => {
    const detail = { id: '9', data: '2025-04-30', totalBruto: 0, totalLiq: 1, posicoes: [] } as SnapshotDetail;
    let result: SnapshotDetail | undefined;

    service.getById('9').subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/9`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: detail });

    expect(result?.id).toBe('9');
  });

  it('create() faz POST com o corpo informado', () => {
    const body: CreateSnapshotRequest = {
      data: '2025-06-30',
      posicoes: [{ ativoId: 'a1', quantidade: 10, precoUnit: 100, totalLiq: 1000 }],
    };
    let result: SnapshotDetail | undefined;

    service.create(body).subscribe(r => (result = r));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ success: true, data: { id: 'new', data: '2025-06-30', totalBruto: 1000, totalLiq: 1000, posicoes: [] } as SnapshotDetail });

    expect(result?.id).toBe('new');
  });
});
