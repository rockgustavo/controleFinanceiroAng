import { Component, inject, OnInit, signal } from '@angular/core';
import { MercadoService } from '../services/mercado.service';
import { MarketIndicators, TesouroDiretoRate } from '../../../core/models/market.model';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { PercentBrPipe } from '../../../shared/pipes/percent-br.pipe';

@Component({
  selector: 'app-mercado',
  standalone: true,
  imports: [CurrencyBrPipe, PercentBrPipe],
  templateUrl: './mercado.component.html'
})
export class MercadoComponent implements OnInit {
  private svc = inject(MercadoService);

  indicators = signal<MarketIndicators | null>(null);
  tesouro = signal<TesouroDiretoRate[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.svc.getIndicators().subscribe({
      next: d => { this.indicators.set(d); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar indicadores.'); this.loading.set(false); }
    });
    this.svc.getTesouro().subscribe({ next: t => this.tesouro.set(t) });
  }

  fetchedAt(): string {
    const d = this.indicators()?.fetchedAt;
    return d ? new Date(d).toLocaleString('pt-BR') : '—';
  }
}
