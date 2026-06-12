import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HistoricoService } from '../../services/historico.service';
import { SnapshotSummary } from '../../../../core/models/snapshot.model';
import { CurrencyBrPipe } from '../../../../shared/pipes/currency-br.pipe';

@Component({
  selector: 'app-historico-list',
  standalone: true,
  imports: [RouterLink, CurrencyBrPipe],
  templateUrl: './historico-list.component.html'
})
export class HistoricoListComponent implements OnInit {
  private svc = inject(HistoricoService);

  snapshots = signal<SnapshotSummary[]>([]);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.svc.list().subscribe({
      next: s => { this.snapshots.set(s); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar snapshots.'); this.loading.set(false); }
    });
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  }
}
