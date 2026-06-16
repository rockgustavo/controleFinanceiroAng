import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { unwrapData, unwrapList } from '../../../core/http/unwrap';
import { SnapshotSummary, SnapshotDetail, CreateSnapshotRequest } from '../../../core/models/snapshot.model';

@Injectable({ providedIn: 'root' })
export class HistoricoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/snapshots`;

  list(): Observable<SnapshotSummary[]> {
    return this.http.get<ApiResponse<SnapshotSummary[]>>(this.base).pipe(unwrapList());
  }

  latest(): Observable<SnapshotDetail> {
    return this.http.get<ApiResponse<SnapshotDetail>>(`${this.base}/latest`).pipe(unwrapData());
  }

  getById(id: string): Observable<SnapshotDetail> {
    return this.http.get<ApiResponse<SnapshotDetail>>(`${this.base}/${id}`).pipe(unwrapData());
  }

  create(req: CreateSnapshotRequest): Observable<SnapshotDetail> {
    return this.http.post<ApiResponse<SnapshotDetail>>(this.base, req).pipe(unwrapData());
  }
}
