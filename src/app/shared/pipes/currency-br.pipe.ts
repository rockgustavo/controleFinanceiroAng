import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyBr', standalone: true })
export class CurrencyBrPipe implements PipeTransform {
  transform(value: number | null | undefined, decimals = 2): string {
    if (value == null) return '—';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }
}
