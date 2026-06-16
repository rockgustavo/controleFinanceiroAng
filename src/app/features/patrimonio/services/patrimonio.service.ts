import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/models/api-response.model';
import { unwrapData, unwrapList } from '../../../core/http/unwrap';
import { Asset, CreateAssetRequest, UpdateAssetRequest } from '../../../core/models/asset.model';

@Injectable({ providedIn: 'root' })
export class PatrimonioService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/assets`;

  list(): Observable<Asset[]> {
    return this.http.get<ApiResponse<Asset[]>>(this.base).pipe(unwrapList());
  }

  getById(id: string): Observable<Asset> {
    return this.http.get<ApiResponse<Asset>>(`${this.base}/${id}`).pipe(unwrapData());
  }

  create(req: CreateAssetRequest): Observable<Asset> {
    return this.http.post<ApiResponse<Asset>>(this.base, req).pipe(unwrapData());
  }

  update(id: string, req: UpdateAssetRequest): Observable<Asset> {
    return this.http.patch<ApiResponse<Asset>>(`${this.base}/${id}`, req).pipe(unwrapData());
  }

  archive(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
