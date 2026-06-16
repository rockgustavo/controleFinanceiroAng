import { OperatorFunction, map } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';

export function unwrapData<T>(): OperatorFunction<ApiResponse<T>, T> {
  return map(response => response.data!);
}

export function unwrapList<T>(): OperatorFunction<ApiResponse<T[]>, T[]> {
  return map(response => response.data ?? []);
}
