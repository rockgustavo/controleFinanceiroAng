import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProjecaoService } from '../services/projecao.service';
import { apiErrorMessage } from '../../../core/http/api-error';
import { ProjecaoResponse } from '../../../core/models/returns.model';
import { CurrencyBrPipe } from '../../../shared/pipes/currency-br.pipe';
import { PercentBrPipe } from '../../../shared/pipes/percent-br.pipe';
import {
  Chart, LineController, LineElement, PointElement, LinearScale,
  CategoryScale, Filler, Tooltip
} from 'chart.js';

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

@Component({
  selector: 'app-projecao',
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyBrPipe, PercentBrPipe],
  templateUrl: './projecao.component.html'
})
export class ProjecaoComponent implements AfterViewChecked {
  @ViewChild('projChart') chartRef!: ElementRef<HTMLCanvasElement>;

  private svc = inject(ProjecaoService);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    rate: [10, [Validators.required, Validators.min(0.01), Validators.max(100)]],
    months: [12, [Validators.required, Validators.min(1), Validators.max(600)]]
  });

  result = signal<ProjecaoResponse | null>(null);
  loading = signal(false);
  error = signal('');
  private chart: Chart | null = null;
  private pendingChart = false;

  calculate(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const { rate, months } = this.form.getRawValue();
    this.svc.getProjection(rate!, months!).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); this.pendingChart = true; },
      error: err => {
        this.error.set(apiErrorMessage(err, 'Erro ao calcular projeção.'));
        this.loading.set(false);
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.pendingChart && this.chartRef) {
      this.pendingChart = false;
      this.renderChart();
    }
  }

  percentualProjetado(r: ProjecaoResponse): number {
    if (!r.totalLiqAtual) return 0;
    return (r.rendimentoProjetado / r.totalLiqAtual) * 100;
  }

  private buildDataPoints(r: ProjecaoResponse): { month: number; value: number }[] {
    const rate = r.taxaMensalPercentual / 100;
    return Array.from({ length: r.meses + 1 }, (_, m) => ({
      month: m,
      value: r.totalLiqAtual * Math.pow(1 + rate, m)
    }));
  }

  private renderChart(): void {
    const r = this.result();
    if (!r || !this.chartRef) return;
    if (this.chart) this.chart.destroy();

    const points = this.buildDataPoints(r);
    const labels = points.map(p => `Mês ${p.month}`);
    const data = points.map(p => p.value);

    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Patrimônio projetado',
          data,
          borderColor: '#0d6efd',
          backgroundColor: 'rgba(13,110,253,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: data.length > 36 ? 0 : 3
        }]
      },
      options: {
        responsive: true,
        plugins: { tooltip: { callbacks: {
          label: ctx => 'R$ ' + (ctx.raw as number).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        }}},
        scales: {
          y: { ticks: { callback: v => 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 0 }) } }
        }
      }
    });
  }
}
