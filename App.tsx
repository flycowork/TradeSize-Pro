import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalculatorIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  BookmarkSquareIcon, 
  RocketLaunchIcon, 
  ScaleIcon, 
  BanknotesIcon, 
  ArrowsRightLeftIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { TradeParams, UserSettings } from './types';

const STORAGE_KEY = 'tradesize_pro_v8_settings';

type Language = 'en' | 'es';

const translations = {
  en: {
    sizing: "Position Sizing",
    saveDefaults: "Save Defaults",
    defaultsSaved: "Saved!",
    allocationTitle: "Risk Management Setup",
    balance: "Account Balance",
    riskAmount: "Risk Amount",
    riskPercent: "Risk Percentage",
    executionTitle: "Execution Strategy",
    entryPrice: "Entry Price",
    stopLoss: "Stop Loss Level",
    range: "RANGE",
    targets: "Take Profit Targets",
    recSize: "RECOMMENDED SIZE",
    shares: "SHARES",
    insufficient: "Insufficient Capital",
    requires: "Requires",
    liquidity: "liquidity",
    risk: "Risk",
    reward: "Reward",
    rrFactor: "R/R Factor",
    performance: "Performance Projections",
    rewardOutcome: "Reward Outcome",
    riskExposure: "Risk Exposure",
    profit: "PROFIT",
    loss: "LOSS",
    accountGain: "Account Gain",
    accountLoss: "Account Loss",
    footer: "TradeSize Pro Copyright 2025",
    invalidTarget: "Invalid Setup / Same Levels",
    clear: "Clear"
  },
  es: {
    sizing: "Dimensionamiento de Posición",
    saveDefaults: "Guardar Predeterminados",
    defaultsSaved: "¡Guardado!",
    allocationTitle: "Configuración de Gestión de Riesgos",
    balance: "Saldo de la Cuenta",
    riskAmount: "Monto de Riesgo",
    riskPercent: "Porcentaje de Riesgo",
    executionTitle: "Estrategia de Ejecución",
    entryPrice: "Precio de Entrada",
    stopLoss: "Nivel de Stop Loss",
    range: "RANGO",
    targets: "Objetivos de Ganancia",
    recSize: "TAMAÑO RECOMENDADO",
    shares: "ACCIONES",
    insufficient: "Capital Insuficiente",
    requires: "Requiere",
    liquidity: "de liquidez",
    risk: "Riesgo",
    reward: "Recompensa",
    rrFactor: "Factor R/R",
    performance: "Proyecciones de Rendimiento",
    rewardOutcome: "Resultado de Recompensa",
    riskExposure: "Exposición al Riesgo",
    profit: "GANANCIA",
    loss: "PÉRDIDA",
    accountGain: "Ganancia de Cuenta",
    accountLoss: "Pérdida de Cuenta",
    footer: "TradeSize Pro Copyright 2025",
    invalidTarget: "Configuración Inválida / Niveles Iguales",
    clear: "Borrar"
  }
};

const App: React.FC = () => {
  const loadSettings = (): UserSettings => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    return { 
      defaultBalance: 10000, 
      defaultRiskPercent: 1, 
      defaultStopPercent: 13.33,
      language: 'en'
    };
  };

  const [settings, setSettings] = useState<UserSettings>(loadSettings());
  const [lang, setLang] = useState<Language>(settings.language || 'en');
  const t = translations[lang];

  const [isAllocationOpen, setIsAllocationOpen] = useState(true);
  
  const [params, setParams] = useState<TradeParams>(() => {
    return {
      balance: settings.defaultBalance,
      riskPercent: settings.defaultRiskPercent,
      entryPrice: 0,
      stopPrice: 0,
      takeProfitPrice: 0,
    };
  });

  const formatNum = (val: number, decimals: number = 2) => {
    return val.toLocaleString(undefined, { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  // Raw string states to allow free typing of decimals without formatting jumps
  const [balanceStr, setBalanceStr] = useState(params.balance.toString());
  const [entryPriceStr, setEntryPriceStr] = useState('');
  const [stopPriceStr, setStopPriceStr] = useState('');
  const [tpPriceStr, setTpPriceStr] = useState('');
  const [riskPercentStr, setRiskPercentStr] = useState(params.riskPercent.toString());

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const results = useMemo(() => {
    const riskAmount = (params.balance * params.riskPercent) / 100;
    const priceDifference = Math.abs(params.entryPrice - params.stopPrice);
    const stopLossPercentage = params.entryPrice > 0 ? (priceDifference / params.entryPrice) * 100 : 0;
    
    let positionType: 'LONG' | 'SHORT' | 'INVALID' = 'INVALID';
    let isTargetValid = true;

    // Check if entry and stop are the same
    if (params.entryPrice > 0 && params.stopPrice > 0 && params.entryPrice !== params.stopPrice) {
      positionType = params.stopPrice < params.entryPrice ? 'LONG' : 'SHORT';
    } else {
      positionType = 'INVALID';
    }

    // Check if entry and TP are the same
    if (params.entryPrice === params.takeProfitPrice) {
      isTargetValid = false;
    }

    const positionSize = positionType !== 'INVALID' && priceDifference !== 0 ? riskAmount / priceDifference : 0;
    const notionalValue = positionSize * params.entryPrice;
    
    let riskRewardRatio = 0;
    let potentialProfit = 0;

    if (isTargetValid && params.takeProfitPrice > 0 && positionType !== 'INVALID') {
      if (positionType === 'LONG') {
        isTargetValid = params.takeProfitPrice > params.entryPrice;
      } else if (positionType === 'SHORT') {
        isTargetValid = params.takeProfitPrice < params.entryPrice;
      }

      if (isTargetValid && priceDifference !== 0) {
        const rewardDiff = Math.abs(params.takeProfitPrice - params.entryPrice);
        riskRewardRatio = rewardDiff / priceDifference;
        potentialProfit = positionSize * rewardDiff;
      }
    }

    return {
      riskAmount,
      priceDifference,
      positionSize,
      positionType,
      riskRewardRatio,
      stopLossPercentage,
      potentialProfit,
      notionalValue,
      isTargetValid: isTargetValid && positionType !== 'INVALID'
    };
  }, [params]);

  const formatCurrencyAmount = (val: number) => {
    const absVal = Math.abs(val);
    const decimals = absVal > 500 ? 0 : 2;
    return val.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  const parseString = (val: string) => {
    const cleaned = val.replace(/,/g, '');
    return cleaned === '' ? 0 : parseFloat(cleaned);
  };

  const handleBalanceChange = (val: string) => {
    setBalanceStr(val);
    const num = parseString(val);
    if (!isNaN(num)) {
      setParams(prev => ({ ...prev, balance: Math.max(0, num) }));
    }
  };

  const handleRiskAmountChange = (val: string) => {
    const cashValue = parseString(val);
    if (!isNaN(cashValue)) {
      const clampedCashValue = Math.min(cashValue, params.balance);
      const newPercent = params.balance > 0 ? (clampedCashValue / params.balance) * 100 : 0;
      setParams(prev => ({ 
        ...prev, 
        riskPercent: parseFloat(Math.min(100, newPercent).toFixed(4)) 
      }));
      setRiskPercentStr(newPercent.toFixed(4));
    }
  };

  const handlePriceChange = (key: keyof TradeParams, val: string) => {
    if (key === 'entryPrice') setEntryPriceStr(val);
    if (key === 'stopPrice') setStopPriceStr(val);
    if (key === 'takeProfitPrice') setTpPriceStr(val);
    if (key === 'riskPercent') setRiskPercentStr(val);

    const num = parseString(val);
    if (!isNaN(num)) {
      setParams(prev => ({ ...prev, [key]: num }));
    }
  };

  const handleClearPrices = () => {
    setEntryPriceStr('');
    setStopPriceStr('');
    setTpPriceStr('');
    setParams(prev => ({
      ...prev,
      entryPrice: 0,
      stopPrice: 0,
      takeProfitPrice: 0
    }));
  };

  const saveAsDefaults = () => {
    const newSettings: UserSettings = {
      defaultBalance: params.balance,
      defaultRiskPercent: params.riskPercent,
      defaultStopPercent: results.stopLossPercentage,
      language: lang
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
    setSaveFeedback(t.defaultsSaved);
    setTimeout(() => {
      setSaveFeedback(null);
      setIsAllocationOpen(false);
    }, 1500);
  };

  const setQuickTarget = (ratio: number) => {
    if (results.positionType === 'INVALID') return;
    const riskDiff = Math.abs(params.entryPrice - params.stopPrice);
    
    let targetPrice = 0;
    if (results.positionType === 'LONG') {
      targetPrice = params.entryPrice + (riskDiff * ratio);
    } else {
      targetPrice = params.entryPrice - (riskDiff * ratio);
    }
    const finalPrice = parseFloat(targetPrice.toFixed(2));
    setParams(prev => ({ ...prev, takeProfitPrice: finalPrice }));
    setTpPriceStr(finalPrice.toString());
  };

  const formatRewardValue = (val: number) => {
    if (val === 0 || isNaN(val)) return '0';
    const rounded = Math.round(val * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  };

  const isOverLeveraged = results.notionalValue > params.balance && params.balance > 0;

  const sharesLabel = results.positionSize > 999 
    ? (lang === 'en' ? 'SH' : 'ACC') 
    : t.shares;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col items-center p-4 md:p-8 selection:bg-indigo-500/30">
      <header className="w-full max-w-6xl mb-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-800 pb-8 mt-4">
        <div className="flex items-center gap-4 group">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] group-hover:scale-110 transition-transform duration-300">
            <CalculatorIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              TradeSize Pro
            </h1>
            <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] pt-1">
              {t.sizing}
            </p>
          </div>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={saveAsDefaults}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all border uppercase tracking-[0.15em] shadow-lg ${
              saveFeedback ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <BookmarkSquareIcon className="w-4 h-4 text-indigo-400" />
            {saveFeedback || t.saveDefaults}
          </button>

          <div className="flex bg-slate-800/50 border border-slate-700 rounded-2xl p-1">
            <button 
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${lang === 'en' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              EN
            </button>
            <button 
              onClick={() => setLang('es')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${lang === 'es' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              ES
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-6xl space-y-8">
        
        {/* Risk Management Setup */}
        <section className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] backdrop-blur-sm shadow-2xl overflow-hidden transition-all duration-500">
          <button 
            onClick={() => setIsAllocationOpen(!isAllocationOpen)}
            className="w-full flex items-center justify-between px-8 py-6 hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-4">
              <div className={`p-2 rounded-xl transition-all duration-500 ${isAllocationOpen ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                <AdjustmentsHorizontalIcon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.25em]">
                {t.allocationTitle}
              </h2>
            </div>
            <div className="flex items-center gap-4">
               {!isAllocationOpen && (
                 <div className="hidden md:flex gap-6 text-[11px] font-black uppercase tracking-widest text-indigo-400 mr-4">
                    <span>{t.balance}: ${formatNum(params.balance)}</span>
                    <span>{t.riskAmount}: ${formatCurrencyAmount(results.riskAmount)} ({formatNum(params.riskPercent, 2)}%)</span>
                 </div>
               )}
               {isAllocationOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" />}
            </div>
          </button>

          <div className={`transition-all duration-500 ease-in-out ${isAllocationOpen ? 'max-h-[500px] opacity-100 border-t border-slate-800/50 p-8' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <BanknotesIcon className="w-4 h-4" /> {t.balance} ($)
                </label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 font-mono text-2xl">$</div>
                   <input 
                    type="text" 
                    value={balanceStr}
                    onChange={(e) => handleBalanceChange(e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-3xl pl-12 pr-6 py-5 text-3xl font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-indigo-400" /> {t.riskAmount} ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 font-mono text-2xl">$</div>
                  <input 
                    type="text" 
                    value={results.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    onChange={(e) => handleRiskAmountChange(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-indigo-500/30 rounded-3xl pl-12 pr-6 py-5 text-3xl font-mono focus:border-indigo-500 outline-none transition-all text-indigo-400 font-black shadow-2xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{t.riskPercent} (%)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={riskPercentStr}
                    onChange={(e) => handlePriceChange('riskPercent', e.target.value)}
                    className="w-full bg-slate-950/30 border-2 border-slate-800 rounded-3xl px-6 py-5 text-3xl font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-slate-500 font-mono text-2xl">%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
          
          {/* Execution Strategy */}
          <section className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-xl h-full">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-sm font-black flex items-center gap-3 text-slate-400 uppercase tracking-[0.2em]">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  {t.executionTitle}
                </h2>
                <button 
                  onClick={handleClearPrices}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-all text-[10px] font-black uppercase tracking-widest shadow-md"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                  {t.clear}
                </button>
              </div>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.entryPrice}</label>
                  <input 
                    type="text" 
                    value={entryPriceStr}
                    placeholder="0.00"
                    onChange={(e) => handlePriceChange('entryPrice', e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl px-6 py-5 text-2xl font-mono focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-inner transition-all placeholder:opacity-20"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.stopLoss}</label>
                    <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-wider">{results.stopLossPercentage.toFixed(2)}% {t.range}</span>
                  </div>
                  <input 
                    type="text" 
                    value={stopPriceStr}
                    placeholder="0.00"
                    onChange={(e) => handlePriceChange('stopPrice', e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl px-6 py-5 text-2xl font-mono focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none shadow-inner transition-all placeholder:opacity-20"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t.targets}</label>
                  <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 5, 10].map(r => (
                        <button 
                          key={r}
                          onClick={() => setQuickTarget(r)}
                          disabled={results.positionType === 'INVALID'}
                          className="text-[10px] font-black bg-slate-800/50 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white px-1 py-4 rounded-xl transition-all shadow-md uppercase disabled:opacity-20 disabled:cursor-not-allowed"
                        >
                          {r}R
                        </button>
                      ))}
                  </div>
                  <input 
                    type="text" 
                    value={tpPriceStr}
                    placeholder="0.00"
                    onChange={(e) => handlePriceChange('takeProfitPrice', e.target.value)}
                    className={`w-full bg-slate-950/50 border-2 rounded-2xl px-6 py-5 text-2xl font-mono focus:ring-4 outline-none shadow-inner transition-all placeholder:opacity-20 ${!results.isTargetValid ? 'border-rose-500/50 focus:ring-rose-500/10 focus:border-rose-500' : 'border-slate-800 focus:ring-cyan-500/10 focus:border-cyan-500'}`}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Results Card */}
          <section className="space-y-8">
            <div className={`bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-800 rounded-[3.5rem] p-10 md:p-12 shadow-[0_40px_80px_rgba(79,70,229,0.45)] relative overflow-hidden group border border-white/10 transition-all duration-500 h-full flex flex-col justify-center ${isOverLeveraged ? 'ring-8 ring-rose-500/30' : ''}`}>
              <div className="absolute -top-16 -right-16 p-8 opacity-10 group-hover:scale-125 transition-transform duration-[2000ms]">
                <RocketLaunchIcon className="w-96 h-96 rotate-[15deg]" />
              </div>
              
              <div className="relative z-10 flex flex-col gap-6 items-center text-center">
                <div className="flex flex-col items-center w-full">
                  <span className="text-indigo-100/70 text-[11px] font-black uppercase tracking-[0.4em] flex items-center gap-3 mb-4">
                    <ScaleIcon className="w-4 h-4" /> {t.recSize}
                  </span>
                  
                  <div className={`flex items-center gap-3 px-8 py-3 rounded-full font-black text-xs backdrop-blur-2xl shadow-2xl border-2 border-white/40 uppercase tracking-[0.25em] transition-all duration-500 mb-6 ${
                    results.positionType === 'LONG' ? 'bg-emerald-500/40 text-emerald-100 shadow-emerald-500/20' :
                    results.positionType === 'SHORT' ? 'bg-rose-500/40 text-rose-100 shadow-rose-500/20' : 'bg-slate-500/30 text-slate-300'
                  }`}>
                    {results.positionType === 'LONG' && <ArrowTrendingUpIcon className="w-4 h-4 stroke-[3]" />}
                    {results.positionType === 'SHORT' && <ArrowTrendingDownIcon className="w-4 h-4 stroke-[3]" />}
                    {results.positionType} POSITION
                  </div>

                  <div className="flex flex-col items-center md:flex-row md:items-baseline gap-4">
                    <h3 className="text-[6.5rem] lg:text-[8.5rem] leading-none font-black font-mono tracking-tighter text-white drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]">
                      {results.positionSize > 0 ? Math.round(results.positionSize).toLocaleString() : '0'}
                    </h3>
                    <span className="text-indigo-200 font-black text-2xl lg:text-4xl uppercase tracking-[0.2em] opacity-80">{sharesLabel}</span>
                  </div>
                </div>

                {isOverLeveraged && (
                  <div className="w-full p-8 bg-rose-500/20 border-2 border-rose-500/60 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center gap-4 animate-in slide-in-from-top-6 duration-700 shadow-[0_20px_50px_rgba(244,63,94,0.3)]">
                    <div className="bg-rose-500 p-3 rounded-2xl shadow-2xl ring-4 ring-rose-500/30 shrink-0">
                      <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-rose-100 font-black uppercase tracking-[0.2em] text-sm">{t.insufficient}</h4>
                      <p className="text-rose-200/90 text-xs font-medium mt-1 leading-relaxed">
                        {t.requires} <span className="font-mono font-bold text-white">${formatNum(results.notionalValue)}</span> {t.liquidity}.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
                  <div className="bg-white/10 rounded-[2rem] p-5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default shadow-xl text-center flex flex-col items-center justify-center">
                    <p className="text-indigo-100/60 text-[9px] font-black uppercase mb-2 tracking-[0.2em]">{t.risk}</p>
                    <p className="text-white font-mono text-2xl lg:text-3xl font-black">${formatCurrencyAmount(results.riskAmount)}</p>
                  </div>
                  <div className={`bg-white/10 rounded-[2rem] p-5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default shadow-xl text-center flex flex-col items-center justify-center transition-opacity ${!results.isTargetValid ? 'opacity-40' : ''}`}>
                    <p className="text-indigo-100/60 text-[9px] font-black uppercase mb-2 tracking-[0.2em]">{t.reward}</p>
                    <p className="text-emerald-300 font-mono text-2xl lg:text-3xl font-black">${formatCurrencyAmount(results.potentialProfit)}</p>
                  </div>
                  <div className={`bg-white/10 rounded-[2rem] p-5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default shadow-xl text-center flex flex-col items-center justify-center sm:col-span-2 lg:col-span-1 ${!results.isTargetValid ? 'opacity-40' : results.riskRewardRatio < 2 ? 'border-rose-400/50 shadow-rose-500/10' : 'border-emerald-400/50 shadow-emerald-500/10'}`}>
                    <p className="text-indigo-100/60 text-[9px] font-black uppercase mb-2 tracking-[0.2em]">{t.rrFactor}</p>
                    <div className="flex gap-2 items-center text-white font-mono text-2xl lg:text-3xl font-black mx-auto whitespace-nowrap">
                      <span>1</span>
                      <span className="opacity-70">:</span>
                      <span>{formatRewardValue(results.riskRewardRatio)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Projections Row */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-[3rem] p-10 backdrop-blur-2xl relative overflow-hidden group border-dashed shadow-2xl">
          <div className="flex items-center gap-5 mb-8">
            <div className="bg-indigo-500/10 p-4 rounded-2xl border border-indigo-500/10 shadow-lg">
              <ChartBarIcon className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-black text-slate-200 uppercase tracking-[0.2em] text-xs">{t.performance}</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className={`space-y-4 transition-all ${!results.isTargetValid ? 'opacity-30 scale-95 blur-[1px]' : ''}`}>
               <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                 <ArrowTrendingUpIcon className="w-5 h-5" /> {t.rewardOutcome}
               </p>
               <div className="flex items-baseline gap-4">
                  <p className="text-6xl font-mono font-black text-emerald-300 drop-shadow-[0_8px_20px_rgba(16,185,129,0.3)]">
                    +${formatCurrencyAmount(results.potentialProfit)}
                  </p>
                  <p className="text-xs font-black text-emerald-500/70 uppercase">{t.profit}</p>
               </div>
               <div className="bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10 flex items-center gap-4">
                 <div className="h-12 w-1.5 bg-emerald-500 rounded-full"></div>
                 <div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.accountGain}</p>
                   <p className="text-2xl font-mono font-black text-emerald-400">
                     {params.balance > 0 ? ((results.potentialProfit / params.balance) * 100).toFixed(2) : 0}%
                   </p>
                 </div>
               </div>
             </div>
             
             {!results.isTargetValid ? (
               <div className="flex flex-col items-center justify-center space-y-4 text-center p-8 bg-rose-500/5 border-2 border-dashed border-rose-500/20 rounded-[3rem] animate-pulse">
                 <ExclamationTriangleIcon className="w-12 h-12 text-rose-500/60" />
                 <p className="text-rose-500 text-sm font-black uppercase tracking-[0.2em]">{t.invalidTarget}</p>
               </div>
             ) : (
               <div className="space-y-4">
                 <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                   <ArrowTrendingDownIcon className="w-5 h-5" /> {t.riskExposure}
                 </p>
                 <div className="flex items-baseline gap-4">
                    <p className="text-6xl font-mono font-black text-rose-300 drop-shadow-[0_8px_20px_rgba(244,63,94,0.3)]">
                      -${formatCurrencyAmount(results.riskAmount)}
                    </p>
                    <p className="text-xs font-black text-rose-500/70 uppercase">{t.loss}</p>
                 </div>
                 <div className="bg-rose-500/5 p-6 rounded-[2rem] border border-rose-500/10 flex items-center gap-4">
                   <div className="h-12 w-1.5 bg-rose-500 rounded-full"></div>
                   <div>
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{t.accountLoss}</p>
                     <p className="text-2xl font-mono font-black text-rose-400">
                       {formatNum(params.riskPercent, 2)}%
                     </p>
                   </div>
                 </div>
               </div>
             )}
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-24 pb-12 text-center text-slate-800 text-[10px] font-black uppercase tracking-[0.6em] w-full max-w-6xl border-t border-slate-900/50">
        {t.footer}
      </footer>
    </div>
  );
};

export default App;