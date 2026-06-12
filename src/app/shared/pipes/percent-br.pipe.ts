import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'percentBr', standalone: true })
export class PercentBrPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2): string {
    if (value == null) return '—';
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }) + '%';
  }
}
