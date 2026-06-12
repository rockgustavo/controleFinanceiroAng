export interface MarketIndicators {
  selic?: number;
  usdBrl?: number;
  ibovespa?: number;
  ivvb11?: number;
  ipca?: number;
  fetchedAt?: string;
}

export interface TesouroDiretoRate {
  name: string;
  rate: number;
  minimumInvestment?: number;
  expirationDate?: string;
}
