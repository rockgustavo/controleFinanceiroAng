import { HttpErrorResponse } from '@angular/common/http';
import { ApiResponse } from '../models/api-response.model';

export function apiErrorMessage(error: unknown, fallback = 'Ocorreu um erro inesperado.'): string {
  const body = (error as HttpErrorResponse)?.error as ApiResponse<unknown> | undefined;
  return body?.error?.message ?? fallback;
}
