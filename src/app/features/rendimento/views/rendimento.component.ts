import { Component, inject, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RendimentoService } from '../services/rendimento.service';
import { SnapshotSummary } from '../../../core/models/snapshot.model';
import { ReturnsResponse, AllocationItem } from '../../../core/models/returns.model';
import { ASSET_TYPE_LABELS, AssetType } from '../../../core/models/asset.model';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { PercentBrPipe } from '../../../shared/pipes/percent-br.pipe';
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

@Component({
  selector: 'app-rendimento',
  standalone: true,
  imports: [FormsModule, CurrencyBrPipe, PercentBrPipe],
  templateUrl: './rendimento.component.html'
})
export class RendimentoComponent implements OnInit, AfterViewInit {
  @ViewChild('allocationChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private svc = inject(RendimentoService);
  protected typeLabels = ASSET_TYPE_LABELS;

  snapshots = signal<SnapshotSummary[]>([]);
  selectedId = signal('');
  mode = signal<'simple' | 'cagr'>('simple');
  returns = signal<ReturnsResponse | null>(null);
  allocation = signal<AllocationItem[]>([]);
  loading = signal(false);
  error = signal('');
  private chart: Chart | null = null;

  ngOnInit(): void {
    this.svc.listSnapshots().subscribe({
      next: s => {
        this.snapshots.set(s);
        if (s.length > 0) { this.selectedId.set(s[0].id); this.load(); }
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.allocation().length > 0) this.renderChart();
  }

  load(): void {
    const id = this.selectedId();
    if (!id) return;
    this.loading.set(true);
    this.error.set('');

    this.svc.getReturns(id, this.mode()).subscribe({
      next: r => { this.returns.set(r); this.loading.set(false); },
      error: err => {
        const msg = err?.error?.error?.message ?? 'Erro ao carregar rendimento.';
        this.error.set(msg);
        this.loading.set(false);
      }
    });

    this.svc.getAllocation(id).subscribe({
      next: a => { this.allocation.set(a); this.renderChart(); }
    });
  }

  toggleMode(m: 'simple' | 'cagr'): void {
    this.mode.set(m);
    this.load();
  }

  tipoLabel(tipo: string): string {
    return ASSET_TYPE_LABELS[tipo as AssetType] ?? tipo;
  }

  private renderChart(): void {
    const items = this.allocation();
    if (!this.chartRef || !items.length) return;
    if (this.chart) this.chart.destroy();

    const COLORS = ['#0d6efd','#198754','#ffc107','#0dcaf0','#dc3545','#6f42c1','#fd7e14'];
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: items.map(i => this.tipoLabel(i.tipo)),
        datasets: [{ data: items.map(i => i.percentual), backgroundColor: COLORS }]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        cutout: '60%'
      }
    });
  }

  returnClass(value: number | null | undefined): string {
    if (value == null) return '';
    return value >= 0 ? 'text-success' : 'text-danger';
  }

  formatDate(date: string): string {
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
  }
}
