import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { ReturnsResponse, AllocationItem } from '../../../core/models/returns.model';
import { SnapshotSummary } from '../../../core/models/snapshot.model';

@Injectable({ providedIn: 'root' })
export class RendimentoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/snapshots`;

  listSnapshots(): Observable<SnapshotSummary[]> {
    return this.http.get<ApiResponse<SnapshotSummary[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  getReturns(id: string, mode: 'simple' | 'cagr'): Observable<ReturnsResponse> {
    return this.http.get<ApiResponse<ReturnsResponse>>(`${this.base}/${id}/returns?mode=${mode}`)
      .pipe(map(r => r.data!));
  }

  getAllocation(id: string): Observable<AllocationItem[]> {
    return this.http.get<ApiResponse<AllocationItem[]>>(`${this.base}/${id}/allocation`)
      .pipe(map(r => r.data ?? []));
  }
}
