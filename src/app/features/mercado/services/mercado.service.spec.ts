import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MercadoService } from './mercado.service';
import { environment } from '../../../../environments/environment';
import { MarketIndicators, TesouroDiretoRate } from '../../../core/models/market.model';

describe('MercadoService', () => {
  let service: MercadoService;
  let httpMock: HttpTestingController;
  const base = `${environment.apiUrl}/market`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MercadoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('getIndicators() faz GET e desembrulha data', () => {
    const data: MarketIndicators = { selic: 14.75, usdBrl: 5.4, ipca: 4.2 };
    let result: MarketIndicators | undefined;

    service.getIndicators().subscribe(r => (result = r));

    const req = httpMock.expectOne(base);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data });

    expect(result).toEqual(data);
  });

  it('getTesouro() faz GET em /tesouro e desembrulha', () => {
    const data: TesouroDiretoRate[] = [{ name: 'Tesouro Selic 2027', rate: 14.9 }];
    let result: TesouroDiretoRate[] | undefined;

    service.getTesouro().subscribe(r => (result = r));

    const req = httpMock.expectOne(`${base}/tesouro`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data });

    expect(result).toEqual(data);
  });

  it('getTesouro() retorna [] quando data ausente', () => {
    let result: TesouroDiretoRate[] | undefined;
    service.getTesouro().subscribe(r => (result = r));
    httpMock.expectOne(`${base}/tesouro`).flush({ success: true });
    expect(result).toEqual([]);
  });
});
