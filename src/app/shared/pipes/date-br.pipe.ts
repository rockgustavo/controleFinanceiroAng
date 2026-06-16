import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'dateBr', standalone: true })
export class DateBrPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '—';
    return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR');
  }
}
