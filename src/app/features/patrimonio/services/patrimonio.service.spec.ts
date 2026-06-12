import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PatrimonioService } from './patrimonio.service';
import { environment } from '../../../../environments/environment';
import { Asset, CreateAssetRequest, UpdateAssetRequest } from '../../../core/models/asset.model';

describe('PatrimonioService', () => {
  let service: PatrimonioService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/assets`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatrimonioService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('list() faz GET e desembrulha data', () => {
    const assets: Asset[] = [{ id: '1', nome: 'CDB Banco X', tipo: 'RENDA_FIXA' }];
    let result: Asset[] | undefined;

    service.list().subscribe(r => (result = r));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: assets });

    expect(result).toEqual(assets);
  });

  it('list() retorna [] quando data ausente', () => {
    let result: Asset[] | undefined;

    service.list().subscribe(r => (result = r));

    httpMock.expectOne(base).flush({ success: true });

    expect(result).toEqual([]);
  });

  it('getById() faz GET na rota do id', () => {
    const asset: Asset = { id: '42', nome: 'PETR4', tipo: 'RENDA_VARIAVEL', ticker: 'PETR4' };
    let result: Asset | undefined;

    service.getById('42').subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/42`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: asset });

    expect(result).toEqual(asset);
  });

  it('create() faz POST com o corpo informado', () => {
    const body: CreateAssetRequest = { nome: 'HGLG11', tipo: 'FII', ticker: 'HGLG11' };
    const created: Asset = { id: '99', ...body };
    let result: Asset | undefined;

    service.create(body).subscribe(r => (result = r));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({ success: true, data: created });

    expect(result).toEqual(created);
  });

  it('update() faz PATCH na rota do id com o corpo', () => {
    const body: UpdateAssetRequest = { nome: 'Novo Nome' };
    let result: Asset | undefined;

    service.update('7', body).subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/7`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(body);
    req.flush({ success: true, data: { id: '7', nome: 'Novo Nome', tipo: 'RENDA_FIXA' } as Asset });

    expect(result?.nome).toBe('Novo Nome');
  });

  it('archive() faz DELETE na rota do id', () => {
    let completed = false;

    service.archive('5').subscribe(() => (completed = true));

    const req = httpMock.expectOne(`${base}/5`);
    expect(req.request.method).toBe('DELETE');
    req.flush(null);

    expect(completed).toBeTrue();
  });
});
