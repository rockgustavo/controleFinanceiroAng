import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { unwrapData, unwrapList } from '../../../core/http/unwrap';
import { MarketIndicators, TesouroDiretoRate } from '../../../core/models/market.model';

@Injectable({ providedIn: 'root' })
export class MercadoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/market`;

  getIndicators(): Observable<MarketIndicators> {
    return this.http.get<ApiResponse<MarketIndicators>>(this.base).pipe(unwrapData());
  }

  getTesouro(): Observable<TesouroDiretoRate[]> {
    return this.http.get<ApiResponse<TesouroDiretoRate[]>>(`${this.base}/tesouro`).pipe(unwrapList());
  }
}
