
import React, { useState, useMemo } from 'react';
import { 
  CalculatorIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ArrowPathIcon, 
  BookmarkSquareIcon, 
  RocketLaunchIcon, 
  ScaleIcon, 
  BanknotesIcon, 
  ArrowsRightLeftIcon, 
  ChartBarIcon, 
  ExclamationTriangleIcon, 
  ChevronUpIcon, 
  ChevronDownIcon, 
  AdjustmentsHorizontalIcon 
} from '@heroicons/react/24/outline';
import { TradeParams, UserSettings } from './types';

const STORAGE_KEY = 'tradesize_pro_v6_settings';

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
    return { defaultBalance: 10000, defaultRiskPercent: 1, defaultStopPercent: 2 };
  };

  const [settings, setSettings] = useState<UserSettings>(loadSettings());
  const [isAllocationOpen, setIsAllocationOpen] = useState(true);
  
  const [params, setParams] = useState<TradeParams>(() => {
    const entry = 100.00;
    const stop = entry * (1 - (settings.defaultStopPercent / 100));
    return {
      balance: settings.defaultBalance,
      riskPercent: settings.defaultRiskPercent,
      entryPrice: entry,
      stopPrice: stop,
      takeProfitPrice: entry + (Math.abs(entry - stop) * 2),
    };
  });

  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  const results = useMemo(() => {
    const riskAmount = (params.balance * params.riskPercent) / 100;
    const priceDifference = Math.abs(params.entryPrice - params.stopPrice);
    const stopLossPercentage = params.entryPrice > 0 ? (priceDifference / params.entryPrice) * 100 : 0;
    
    let positionType: 'LONG' | 'SHORT' | 'INVALID' = 'INVALID';
    if (params.entryPrice > 0 && params.stopPrice > 0) {
      positionType = params.stopPrice < params.entryPrice ? 'LONG' : 'SHORT';
    }

    const positionSize = priceDifference > 0 ? riskAmount / priceDifference : 0;
    const notionalValue = positionSize * params.entryPrice;
    
    let riskRewardRatio = 0;
    let potentialProfit = 0;
    if (params.takeProfitPrice > 0 && priceDifference > 0) {
      const rewardDiff = Math.abs(params.takeProfitPrice - params.entryPrice);
      riskRewardRatio = rewardDiff / priceDifference;
      potentialProfit = positionSize * rewardDiff;
    }

    return {
      riskAmount,
      priceDifference,
      positionSize,
      positionType,
      riskRewardRatio,
      stopLossPercentage,
      potentialProfit,
      notionalValue
    };
  }, [params]);

  const handleInputChange = (key: keyof TradeParams, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setParams(prev => ({ ...prev, [key]: numValue }));
  };

  const handleRiskAmountChange = (value: string) => {
    const cashValue = value === '' ? 0 : parseFloat(value);
    const newPercent = params.balance > 0 ? (cashValue / params.balance) * 100 : 0;
    setParams(prev => ({ ...prev, riskPercent: parseFloat(newPercent.toFixed(4)) }));
  };

  const saveAsDefaults = () => {
    const newSettings: UserSettings = {
      defaultBalance: params.balance,
      defaultRiskPercent: params.riskPercent,
      defaultStopPercent: results.stopLossPercentage
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    setSettings(newSettings);
    setSaveFeedback("Defaults Saved!");
    setTimeout(() => {
      setSaveFeedback(null);
      setIsAllocationOpen(false);
    }, 1500);
  };

  const setQuickTarget = (ratio: number) => {
    const riskDiff = Math.abs(params.entryPrice - params.stopPrice);
    if (riskDiff === 0) return;

    let targetPrice = 0;
    if (results.positionType === 'LONG') {
      targetPrice = params.entryPrice + (riskDiff * ratio);
    } else {
      targetPrice = params.entryPrice - (riskDiff * ratio);
    }
    setParams(prev => ({ ...prev, takeProfitPrice: parseFloat(targetPrice.toFixed(2)) }));
  };

  const formatRewardValue = (val: number) => {
    if (val === 0 || isNaN(val)) return '0';
    const rounded = Math.round(val * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  };

  const isOverLeveraged = results.notionalValue > params.balance && params.balance > 0;

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
            <p className="text-slate-500 text-sm font-medium uppercase tracking-[0.2em] pt-1">Institutional Risk Protocol</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={saveAsDefaults}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all border uppercase tracking-[0.15em] shadow-lg ${
              saveFeedback ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-800/50 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <BookmarkSquareIcon className="w-4 h-4 text-indigo-400" />
            {saveFeedback || "Save Defaults"}
          </button>
          <button 
            onClick={() => setParams({ 
              ...params, 
              balance: settings.defaultBalance,
              riskPercent: settings.defaultRiskPercent,
              entryPrice: 100.00,
              stopPrice: 100 * (1 - (settings.defaultStopPercent / 100)),
              takeProfitPrice: 100 + (Math.abs(100 - (100 * (1 - (settings.defaultStopPercent / 100)))) * 2)
            })}
            className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-2xl transition-all shadow-md"
            title="Reload Defaults"
          >
            <ArrowPathIcon className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl space-y-8">
        
        {/* Capital Allocation */}
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
                Capital Allocation Strategy
              </h2>
            </div>
            <div className="flex items-center gap-4">
               {!isAllocationOpen && (
                 <div className="hidden md:flex gap-6 text-[11px] font-black uppercase tracking-widest text-indigo-400 mr-4">
                    <span>Balance: ${params.balance.toLocaleString()}</span>
                    <span>Risk: ${results.riskAmount.toLocaleString()} ({params.riskPercent}%)</span>
                 </div>
               )}
               {isAllocationOpen ? <ChevronUpIcon className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" /> : <ChevronDownIcon className="w-5 h-5 text-slate-600 group-hover:text-indigo-400" />}
            </div>
          </button>

          <div className={`transition-all duration-500 ease-in-out ${isAllocationOpen ? 'max-h-[500px] opacity-100 border-t border-slate-800/50 p-8' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <BanknotesIcon className="w-4 h-4" /> Account Balance ($)
                </label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 font-mono text-2xl">$</div>
                   <input 
                    type="number" 
                    inputMode="decimal"
                    step="0.01"
                    value={params.balance || ''}
                    onChange={(e) => handleInputChange('balance', e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-3xl pl-12 pr-6 py-5 text-3xl font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <ArrowsRightLeftIcon className="w-4 h-4 text-indigo-400" /> Risk Amount ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-500 font-mono text-2xl">$</div>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    step="0.01"
                    value={parseFloat(results.riskAmount.toFixed(2)) || ''}
                    onChange={(e) => handleRiskAmountChange(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-indigo-500/30 rounded-3xl pl-12 pr-6 py-5 text-3xl font-mono focus:border-indigo-500 outline-none transition-all text-indigo-400 font-black shadow-2xl"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Risk Percentage (%)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    inputMode="decimal"
                    step="0.01"
                    value={params.riskPercent || ''}
                    onChange={(e) => handleInputChange('riskPercent', e.target.value)}
                    className="w-full bg-slate-950/30 border-2 border-slate-800 rounded-3xl px-6 py-5 text-3xl font-mono focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                  />
                  <div className="absolute inset-y-0 right-0 pr-6 flex items-center pointer-events-none text-slate-500 font-mono text-2xl">%</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* side-by-side starting from sm: breakpoint (Landscape Mobile) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-stretch">
          
          {/* Execution Strategy */}
          <section className="space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-xl h-full">
              <h2 className="text-sm font-black mb-8 flex items-center gap-3 text-slate-400 uppercase tracking-[0.2em]">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Execution Strategy
              </h2>
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Entry Price</label>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    step="0.01"
                    value={params.entryPrice || ''}
                    onChange={(e) => handleInputChange('entryPrice', e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl px-6 py-5 text-2xl font-mono focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none shadow-inner transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end mb-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stop Loss Level</label>
                    <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 uppercase tracking-wider">{results.stopLossPercentage.toFixed(2)}% RANGE</span>
                  </div>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    step="0.01"
                    value={params.stopPrice || ''}
                    onChange={(e) => handleInputChange('stopPrice', e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl px-6 py-5 text-2xl font-mono focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none shadow-inner transition-all"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Take Profit Targets</label>
                  <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 5, 10].map(r => (
                        <button 
                          key={r}
                          onClick={() => setQuickTarget(r)}
                          className="text-[10px] font-black bg-slate-800/50 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white px-1 py-4 rounded-xl transition-all shadow-md uppercase"
                        >
                          {r}R
                        </button>
                      ))}
                  </div>
                  <input 
                    type="number" 
                    inputMode="decimal"
                    step="0.01"
                    value={params.takeProfitPrice || ''}
                    onChange={(e) => handleInputChange('takeProfitPrice', e.target.value)}
                    className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl px-6 py-5 text-2xl font-mono focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none shadow-inner transition-all"
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
                    <ScaleIcon className="w-4 h-4" /> RECOMMENDED SIZE
                  </span>
                  
                  {/* Position Badge: Centered below title and above size */}
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
                    <span className="text-indigo-200 font-black text-2xl lg:text-4xl uppercase tracking-[0.2em] opacity-80">SHARES</span>
                  </div>
                </div>

                {isOverLeveraged && (
                  <div className="w-full p-8 bg-rose-500/20 border-2 border-rose-500/60 rounded-[2.5rem] backdrop-blur-xl flex flex-col items-center gap-4 animate-in slide-in-from-top-6 duration-700 shadow-[0_20px_50px_rgba(244,63,94,0.3)]">
                    <div className="bg-rose-500 p-3 rounded-2xl shadow-2xl ring-4 ring-rose-500/30 shrink-0">
                      <ExclamationTriangleIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-center">
                      <h4 className="text-rose-100 font-black uppercase tracking-[0.2em] text-sm">Insufficient Capital</h4>
                      <p className="text-rose-200/90 text-xs font-medium mt-1 leading-relaxed">
                        Requires <span className="font-mono font-bold text-white">${results.notionalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span> liquidity.
                      </p>
                    </div>
                  </div>
                )}

                {/* Footer Stats Grid: configured for Tablet Portrait requirements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-4">
                  <div className="bg-white/10 rounded-[2rem] p-5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default shadow-xl text-center flex flex-col items-center justify-center">
                    <p className="text-indigo-100/60 text-[9px] font-black uppercase mb-2 tracking-[0.2em]">Dollar Risk</p>
                    <p className="text-white font-mono text-2xl lg:text-3xl font-black">${results.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="bg-white/10 rounded-[2rem] p-5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default shadow-xl text-center flex flex-col items-center justify-center">
                    <p className="text-indigo-100/60 text-[9px] font-black uppercase mb-2 tracking-[0.2em]">Target Profit</p>
                    <p className="text-emerald-300 font-mono text-2xl lg:text-3xl font-black">${results.potentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                  {/* R/R Factor below on tablet portrait (sm), but side-by-side on desktop (lg) */}
                  <div className={`bg-white/10 rounded-[2rem] p-5 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-default shadow-xl text-center flex flex-col items-center justify-center sm:col-span-2 lg:col-span-1 ${results.riskRewardRatio < 2 ? 'border-rose-400/50 shadow-rose-500/10' : 'border-emerald-400/50 shadow-emerald-500/10'}`}>
                    <p className="text-indigo-100/60 text-[9px] font-black uppercase mb-2 tracking-[0.2em]">R/R Factor</p>
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-2 w-full max-w-[200px] items-center text-white font-mono text-2xl lg:text-3xl font-black mx-auto">
                      <div className="text-right">1</div>
                      <div className="text-center opacity-70">:</div>
                      <div className="text-left">{formatRewardValue(results.riskRewardRatio)}</div>
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
              <h3 className="font-black text-slate-200 uppercase tracking-[0.2em] text-xs">Performance Projections</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Growth Matrix</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
             <div className="space-y-4">
               <p className="text-[11px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                 <ArrowTrendingUpIcon className="w-5 h-5" /> Reward Outcome
               </p>
               <div className="flex items-baseline gap-4">
                  <p className="text-6xl font-mono font-black text-emerald-300 drop-shadow-[0_8px_20px_rgba(16,185,129,0.3)]">
                    +${results.potentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs font-black text-emerald-500/70 uppercase">PROFIT</p>
               </div>
               <div className="bg-emerald-500/5 p-6 rounded-[2rem] border border-emerald-500/10 flex items-center gap-4">
                 <div className="h-12 w-1.5 bg-emerald-500 rounded-full"></div>
                 <div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Projected Growth</p>
                   <p className="text-2xl font-mono font-black text-emerald-400">
                     {params.balance > 0 ? ((results.potentialProfit / params.balance) * 100).toFixed(2) : 0}%
                   </p>
                 </div>
               </div>
             </div>
             <div className="space-y-4">
               <p className="text-[11px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">
                 <ArrowTrendingDownIcon className="w-5 h-5" /> Drawdown Exposure
               </p>
               <div className="flex items-baseline gap-4">
                  <p className="text-6xl font-mono font-black text-rose-300 drop-shadow-[0_8px_20px_rgba(244,63,94,0.3)]">
                    -${results.riskAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs font-black text-rose-500/70 uppercase">LOSS</p>
               </div>
               <div className="bg-rose-500/5 p-6 rounded-[2rem] border border-rose-500/10 flex items-center gap-4">
                 <div className="h-12 w-1.5 bg-rose-500 rounded-full"></div>
                 <div>
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Account Decay</p>
                   <p className="text-2xl font-mono font-black text-rose-400">
                     {params.riskPercent.toFixed(2)}%
                   </p>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto pt-24 pb-12 text-center text-slate-800 text-[10px] font-black uppercase tracking-[0.6em] w-full max-w-6xl border-t border-slate-900/50">
        TradeSize Pro &bull; Institutional Risk Engine &bull; PROTOCOL V6.9
      </footer>
    </div>
  );
};

export default App;
