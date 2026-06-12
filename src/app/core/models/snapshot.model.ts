export interface SnapshotSummary {
  id: string;
  data: string;
  totalLiq: number;
  numeroPosicoes: number;
  criadoEm?: string;
}

export interface Posicao {
  ativoId: string;
  nomeAtivo: string;
  tipoAtivo: string;
  ticker?: string;
  quantidade: number;
  precoUnit: number;
  totalBruto: number;
  totalLiq: number;
  taxa?: string;
}

export interface MarketData {
  selic?: number;
  usdBrl?: number;
  ibovespa?: number;
  ivvb11?: number;
  ipca?: number;
}

export interface SnapshotDetail {
  id: string;
  data: string;
  observacoes?: string;
  totalBruto: number;
  totalLiq: number;
  posicoes: Posicao[];
  criadoEm?: string;
  marketData?: MarketData;
}

export interface CreateSnapshotRequest {
  data: string;
  observacoes?: string;
  posicoes: CreatePosicaoRequest[];
}

export interface CreatePosicaoRequest {
  ativoId: string;
  quantidade: number;
  precoUnit: number;
  totalLiq: number;
  taxa?: string;
}
