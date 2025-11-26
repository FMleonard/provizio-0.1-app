
import React, { useState, useMemo } from 'react';
import { ArrowRight, AlertTriangle, CheckCircle2, XCircle, TrendingUp, AlertOctagon, GitMerge, Trash2, Search, Copy } from 'lucide-react';
import { useProducts } from '../contexts/StoreContext';
import { Product } from '../types';

export const DataConflictResolver: React.FC = () => {
  const { products: liveCatalog, stagingProducts, setStagingProducts, commitStagingToLive, discardStaging, setProducts } = useProducts();
  const [activeTab, setActiveTab] = useState<'staging' | 'live_cleanup'>('staging');
  
  // --- LIVE CATALOG DUPLICATE DETECTOR ---
  const liveDuplicates = useMemo(() => {
      const lookup: Record<string, Product[]> = {};
      const duplicates: Product[][] = [];

      liveCatalog.forEach(p => {
          // Normalize name for fuzzy match
          const key = p.sku ? p.sku : p.name.toLowerCase().trim();
          if (!lookup[key]) lookup[key] = [];
          lookup[key].push(p);
      });

      Object.values(lookup).forEach(group => {
          if (group.length > 1) duplicates.push(group);
      });

      return duplicates;
  }, [liveCatalog]);

  const handleResolveLiveDuplicate = (keepId: string, group: Product[]) => {
      // Keep the selected ID, remove others from liveCatalog
      const idsToRemove = group.map(p => p.id).filter(id => id !== keepId);
      const newCatalog = liveCatalog.filter(p => !idsToRemove.includes(p.id));
      setProducts(newCatalog);
  };

  // --- STAGING ANALYSIS ENGINE ---
  const analysis = useMemo(() => {
    const newItems: Product[] = [];
    const updates: { staging: Product; live: Product; priceDiffPercent: number }[] = [];
    const conflicts: { staging: Product; live: Product; reason: string }[] = [];

    stagingProducts.forEach(staged => {
      // Match by ID first, then SKU, then Fuzzy Name
      const liveMatch = liveCatalog.find(p => 
        p.id === staged.id || 
        (p.sku && p.sku === staged.sku) ||
        (p.name.toLowerCase() === staged.name.toLowerCase())
      );

      if (!liveMatch) {
        newItems.push(staged);
      } else {
        // It's a match, check for differences
        const priceDiff = liveMatch.price > 0 
          ? ((staged.price - liveMatch.price) / liveMatch.price) * 100 
          : 0;

        // Conflict Logic: Category Mismatch or Massive Price Hike (>50%)
        if (staged.category !== liveMatch.category) {
            conflicts.push({ staging: staged, live: liveMatch, reason: `Category Mismatch: "${liveMatch.category}" vs "${staged.category}"` });
        } else if (priceDiff > 50) {
            conflicts.push({ staging: staged, live: liveMatch, reason: `Extreme Price Hike (+${priceDiff.toFixed(0)}%)` });
        } else {
            updates.push({ staging: staged, live: liveMatch, priceDiffPercent: priceDiff });
        }
      }
    });

    return { newItems, updates, conflicts };
  }, [stagingProducts, liveCatalog]);

  const handleRemoveStaged = (id: string) => {
      setStagingProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleCommit = () => {
      commitStagingToLive();
  };

  const impactCount = Math.floor(analysis.updates.filter(u => u.priceDiffPercent > 10).length * 2.5);

  return (
    <div className="space-y-6 h-full flex flex-col">
        {/* TOP TABS */}
        <div className="flex gap-4 border-b border-gray-200 pb-4">
             <button 
                onClick={() => setActiveTab('staging')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'staging' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-gray-100'}`}
             >
                 <GitMerge className="w-4 h-4"/> Importation ({stagingProducts.length})
             </button>
             <button 
                onClick={() => setActiveTab('live_cleanup')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'live_cleanup' ? 'bg-red-600 text-white' : 'text-slate-500 hover:bg-gray-100'}`}
             >
                 <Copy className="w-4 h-4"/> Nettoyer Doublons ({liveDuplicates.length})
             </button>
        </div>

        {/* LIVE CLEANUP TAB */}
        {activeTab === 'live_cleanup' && (
            <div className="flex-1 overflow-y-auto space-y-4">
                {liveDuplicates.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500 opacity-50"/>
                        <p className="font-bold text-lg text-slate-600">Base de données saine !</p>
                        <p>Aucun doublon détecté dans le catalogue actif.</p>
                    </div>
                ) : (
                    liveDuplicates.map((group, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 rounded-xl p-4">
                            <h4 className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4"/> Doublon Détecté : "{group[0].name}"
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                                {group.map(item => (
                                    <div key={item.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col justify-between">
                                        <div>
                                            <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">SKU: {item.sku} | ID: {item.id}</p>
                                            <p className="text-xs font-bold mt-1 text-slate-600">{item.price}$</p>
                                        </div>
                                        <button 
                                            onClick={() => handleResolveLiveDuplicate(item.id, group)}
                                            className="mt-3 w-full py-1.5 bg-slate-900 text-white text-xs font-bold rounded hover:bg-slate-700"
                                        >
                                            Garder celui-ci
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        )}

        {/* STAGING TAB (Existing Logic) */}
        {activeTab === 'staging' && (
            <>
                {stagingProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-gray-200">
                        <CheckCircle2 className="w-12 h-12 mb-4 text-green-500 opacity-50" />
                        <p className="font-bold text-slate-600">Tout est à jour !</p>
                        <p className="text-sm">Aucune donnée en attente de validation.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
                            <div className="flex gap-6">
                                <div className="text-center px-4 border-r border-gray-100">
                                    <p className="text-xs font-bold text-green-600 uppercase">Nouveaux</p>
                                    <p className="text-2xl font-bold text-slate-800">{analysis.newItems.length}</p>
                                </div>
                                <div className="text-center px-4 border-r border-gray-100">
                                    <p className="text-xs font-bold text-yellow-600 uppercase">Mises à jour</p>
                                    <p className="text-2xl font-bold text-slate-800">{analysis.updates.length}</p>
                                </div>
                                <div className="text-center px-4">
                                    <p className="text-xs font-bold text-red-600 uppercase">Conflits</p>
                                    <p className="text-2xl font-bold text-slate-800">{analysis.conflicts.length}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <button onClick={discardStaging} className="px-4 py-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg text-sm font-bold transition-colors">Tout Rejeter</button>
                                <button onClick={handleCommit} className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 shadow-lg flex items-center gap-2">
                                    <GitMerge className="w-4 h-4"/> Fusionner vers Live
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 overflow-hidden">
                            {/* NEW ITEMS */}
                            <div className="bg-green-50/50 rounded-2xl border border-green-100 flex flex-col h-full overflow-hidden">
                                <div className="p-3 bg-green-100/50 border-b border-green-200 font-bold text-green-800 text-xs uppercase flex justify-between items-center">
                                    <span>Nouveaux Produits</span>
                                    <span className="bg-white px-2 py-0.5 rounded text-[10px]">{analysis.newItems.length}</span>
                                </div>
                                <div className="overflow-y-auto p-3 space-y-2 flex-1">
                                    {analysis.newItems.map(item => (
                                        <div key={item.id} className="bg-white p-3 rounded-xl border border-green-100 shadow-sm group relative">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{item.name}</p>
                                                    <p className="text-[10px] text-gray-400">{item.format} • {item.category}</p>
                                                </div>
                                                <span className="font-mono font-bold text-green-600">{item.price.toFixed(2)}$</span>
                                            </div>
                                            <button onClick={() => handleRemoveStaged(item.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* UPDATES */}
                            <div className="bg-yellow-50/50 rounded-2xl border border-yellow-100 flex flex-col h-full overflow-hidden">
                                <div className="p-3 bg-yellow-100/50 border-b border-yellow-200 font-bold text-yellow-800 text-xs uppercase flex justify-between items-center">
                                    <span>Modifications</span>
                                    <span className="bg-white px-2 py-0.5 rounded text-[10px]">{analysis.updates.length}</span>
                                </div>
                                <div className="overflow-y-auto p-3 space-y-2 flex-1">
                                    {analysis.updates.map(({ staging, live, priceDiffPercent }) => (
                                        <div key={staging.id} className="bg-white p-3 rounded-xl border border-yellow-100 shadow-sm relative group">
                                            <p className="font-bold text-sm text-slate-800 mb-2 truncate">{live.name}</p>
                                            <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg p-2">
                                                <div className="text-gray-400 line-through mr-2">{live.price.toFixed(2)}$</div>
                                                <ArrowRight className="w-3 h-3 text-gray-300" />
                                                <div className={`font-bold ml-2 ${priceDiffPercent > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {staging.price.toFixed(2)}$
                                                </div>
                                            </div>
                                            <button onClick={() => handleRemoveStaged(staging.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><XCircle className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* CONFLICTS */}
                            <div className="bg-red-50/50 rounded-2xl border border-red-100 flex flex-col h-full overflow-hidden">
                                <div className="p-3 bg-red-100/50 border-b border-red-200 font-bold text-red-800 text-xs uppercase flex justify-between items-center">
                                    <span>Conflits Critiques</span>
                                    <span className="bg-white px-2 py-0.5 rounded text-[10px]">{analysis.conflicts.length}</span>
                                </div>
                                <div className="overflow-y-auto p-3 space-y-2 flex-1">
                                    {analysis.conflicts.map(({ staging, live, reason }) => (
                                        <div key={staging.id} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                            <div className="flex items-start gap-2 mb-2">
                                                <AlertOctagon className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="font-bold text-sm text-slate-800">{live.name}</p>
                                                    <p className="text-[10px] text-red-500 font-medium">{reason}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <button onClick={() => handleRemoveStaged(staging.id)} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-slate-600 rounded text-[10px] font-bold">Garder Ancien</button>
                                                <button className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[10px] font-bold">Forcer Nouveau</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </>
        )}
    </div>
  );
};
