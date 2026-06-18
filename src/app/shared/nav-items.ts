export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Patrimônio',  icon: 'bi-wallet2',        route: '/patrimonio' },
  { label: 'Histórico',   icon: 'bi-calendar3',       route: '/historico'  },
  { label: 'Rendimento',  icon: 'bi-graph-up-arrow',  route: '/rendimento' },
  { label: 'Mercado',     icon: 'bi-broadcast',       route: '/mercado'    },
  { label: 'Projeção',    icon: 'bi-calculator',      route: '/projecao'   }
];
