export type AssetType = 'RENDA_FIXA' | 'RENDA_VARIAVEL' | 'FII' | 'ETF';

export interface Asset {
  id: string;
  nome: string;
  tipo: AssetType;
  ticker?: string;
  observacoes?: string;
}

export interface CreateAssetRequest {
  nome: string;
  tipo: AssetType;
  ticker?: string;
  observacoes?: string;
}

export interface UpdateAssetRequest {
  nome?: string;
  ticker?: string;
  observacoes?: string;
}

export const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  RENDA_FIXA: 'Renda Fixa',
  RENDA_VARIAVEL: 'Renda Variável',
  FII: 'FII',
  ETF: 'ETF'
};
