export interface ReturnsResponse {
  snapshotId: string;
  data: string;
  totalLiqAtual: number;
  dataAnterior?: string;
  totalLiqAnterior: number;
  rendimentoAbsoluto: number;
  rendimentoPercentual: number;
  modo: 'simple' | 'cagr';
}

export interface AllocationItem {
  tipo: string;
  totalLiq: number;
  percentual: number;
}

export interface ProjecaoResponse {
  dataReferencia: string;
  totalLiqAtual: number;
  taxaMensalPercentual: number;
  meses: number;
  totalProjetado: number;
  rendimentoProjetado: number;
}
