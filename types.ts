
export interface TradeParams {
  balance: number;
  riskPercent: number;
  entryPrice: number;
  stopPrice: number;
  takeProfitPrice: number;
}

export interface CalculationResult {
  riskAmount: number;
  priceDifference: number;
  positionSize: number;
  positionType: 'LONG' | 'SHORT' | 'INVALID';
  riskRewardRatio: number;
  stopLossPercentage: number;
  potentialProfit: number;
}

export interface UserSettings {
  defaultBalance: number;
  defaultRiskPercent: number;
  defaultStopPercent: number;
  language: 'en' | 'es';
}
