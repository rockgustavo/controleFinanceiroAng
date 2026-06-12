import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { SnapshotSummary, SnapshotDetail, CreateSnapshotRequest } from '../../../core/models/snapshot.model';

@Injectable({ providedIn: 'root' })
export class HistoricoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/snapshots`;

  list(): Observable<SnapshotSummary[]> {
    return this.http.get<ApiResponse<SnapshotSummary[]>>(this.base).pipe(map(r => r.data ?? []));
  }

  latest(): Observable<SnapshotDetail> {
    return this.http.get<ApiResponse<SnapshotDetail>>(`${this.base}/latest`).pipe(map(r => r.data!));
  }

  getById(id: string): Observable<SnapshotDetail> {
    return this.http.get<ApiResponse<SnapshotDetail>>(`${this.base}/${id}`).pipe(map(r => r.data!));
  }

  create(req: CreateSnapshotRequest): Observable<SnapshotDetail> {
    return this.http.post<ApiResponse<SnapshotDetail>>(this.base, req).pipe(map(r => r.data!));
  }
}
