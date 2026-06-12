import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'patrimonio', pathMatch: 'full' },
  {
    path: 'patrimonio',
    loadComponent: () =>
      import('./features/patrimonio/views/patrimonio-list/patrimonio-list.component')
        .then(m => m.PatrimonioListComponent)
  },
  {
    path: 'historico',
    loadComponent: () =>
      import('./features/historico/views/historico-list/historico-list.component')
        .then(m => m.HistoricoListComponent)
  },
  {
    path: 'historico/:id',
    loadComponent: () =>
      import('./features/historico/views/historico-detail/historico-detail.component')
        .then(m => m.HistoricoDetailComponent)
  },
  {
    path: 'rendimento',
    loadComponent: () =>
      import('./features/rendimento/views/rendimento.component')
        .then(m => m.RendimentoComponent)
  },
  {
    path: 'mercado',
    loadComponent: () =>
      import('./features/mercado/views/mercado.component')
        .then(m => m.MercadoComponent)
  },
  {
    path: 'projecao',
    loadComponent: () =>
      import('./features/projecao/views/projecao.component')
        .then(m => m.ProjecaoComponent)
  },
  { path: '**', redirectTo: 'patrimonio' }
];
