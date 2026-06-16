import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { unwrapData } from '../../../core/http/unwrap';
import { ProjecaoResponse } from '../../../core/models/returns.model';

@Injectable({ providedIn: 'root' })
export class ProjecaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/snapshots`;

  getProjection(rate: number, months: number): Observable<ProjecaoResponse> {
    return this.http
      .get<ApiResponse<ProjecaoResponse>>(`${this.base}/latest/projection?rate=${rate}&months=${months}`)
      .pipe(unwrapData());
  }
}
