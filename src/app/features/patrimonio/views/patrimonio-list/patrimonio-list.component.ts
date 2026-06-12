import { Component, inject, OnInit, signal } from '@angular/core';
import { PatrimonioService } from '../../services/patrimonio.service';
import { KeycloakService } from '../../../../core/auth/keycloak.service';
import { Asset, ASSET_TYPE_LABELS } from '../../../../core/models/asset.model';
import { PatrimonioFormComponent } from '../patrimonio-form/patrimonio-form.component';

@Component({
  selector: 'app-patrimonio-list',
  standalone: true,
  imports: [PatrimonioFormComponent],
  templateUrl: './patrimonio-list.component.html'
})
export class PatrimonioListComponent implements OnInit {
  private svc = inject(PatrimonioService);
  protected keycloak = inject(KeycloakService);

  assets = signal<Asset[]>([]);
  loading = signal(true);
  error = signal('');
  showForm = signal(false);
  editAsset = signal<Asset | null>(null);
  typeLabels = ASSET_TYPE_LABELS;

  ngOnInit(): void {
    this.loadAssets();
  }

  loadAssets(): void {
    this.loading.set(true);
    this.svc.list().subscribe({
      next: assets => { this.assets.set(assets); this.loading.set(false); },
      error: () => { this.error.set('Erro ao carregar ativos.'); this.loading.set(false); }
    });
  }

  openCreate(): void {
    this.editAsset.set(null);
    this.showForm.set(true);
  }

  openEdit(asset: Asset): void {
    this.editAsset.set(asset);
    this.showForm.set(true);
  }

  onFormSaved(): void {
    this.showForm.set(false);
    this.loadAssets();
  }

  onFormCancelled(): void {
    this.showForm.set(false);
  }

  archive(asset: Asset): void {
    if (!confirm(`Arquivar o ativo "${asset.nome}"?`)) return;
    this.svc.archive(asset.id).subscribe({ next: () => this.loadAssets() });
  }

  typeBadgeClass(type: string): string {
    const map: Record<string, string> = {
      RENDA_FIXA: 'bg-success',
      RENDA_VARIAVEL: 'bg-primary',
      FII: 'bg-warning text-dark',
      ETF: 'bg-info text-dark'
    };
    return map[type] ?? 'bg-secondary';
  }
}
