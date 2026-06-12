import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { MarketIndicators, TesouroDiretoRate } from '../../../core/models/market.model';

@Injectable({ providedIn: 'root' })
export class MercadoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/market`;

  getIndicators(): Observable<MarketIndicators> {
    return this.http.get<ApiResponse<MarketIndicators>>(this.base).pipe(map(r => r.data!));
  }

  getTesouro(): Observable<TesouroDiretoRate[]> {
    return this.http.get<ApiResponse<TesouroDiretoRate[]>>(`${this.base}/tesouro`).pipe(map(r => r.data ?? []));
  }
}
