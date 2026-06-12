import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HistoricoService } from '../../services/historico.service';
import { SnapshotDetail } from '../../../../core/models/snapshot.model';
import { CurrencyBrPipe } from '../../../../shared/pipes/currency-br.pipe';
import { PercentBrPipe } from '../../../../shared/pipes/percent-br.pipe';

@Component({
  selector: 'app-historico-detail',
  standalone: true,
  imports: [RouterLink, CurrencyBrPipe, PercentBrPipe],
  templateUrl: './historico-detail.component.html'
})
export class HistoricoDetailComponent implements OnInit {
  private svc = inject(HistoricoService);
  private route = inject(ActivatedRoute);

  snapshot = signal<SnapshotDetail | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const obs = id === 'latest' ? this.svc.latest() : this.svc.getById(id!);
    obs.subscribe({
      next: s => { this.snapshot.set(s); this.loading.set(false); },
      error: () => { this.error.set('Snapshot não encontrado.'); this.loading.set(false); }
    });
  }

  get totalLiq(): number {
    return this.snapshot()?.posicoes.reduce((acc, p) => acc + p.totalLiq, 0) ?? 0;
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  }
}
