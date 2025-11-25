


import React, { useState } from 'react';
import { Settings2, RotateCcw, DollarSign, Users, Check, Star, Building, Activity, AlertOctagon, Save } from 'lucide-react';
import { useProducts } from '../contexts/StoreContext';
import { PlannerConfig } from '../types';
import { DEFAULT_PLANNER_CONFIG } from '../constants';

export const QualityChecklist: React.FC = () => {
  const { plannerConfig, updatePlannerConfig } = useProducts();
  const [config, setConfig] = useState<PlannerConfig>(plannerConfig);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync local state when global state changes (e.g. initial load)
  React.useEffect(() => {
      setConfig(plannerConfig);
  }, [plannerConfig]);

  const handleChange = (section: keyof PlannerConfig, field: string, value: any) => {
      setConfig(prev => {
          const newState = { ...prev };
          // @ts-ignore
          newState[section] = { ...newState[section], [field]: value };
          return newState;
      });
      setHasChanges(true);
  };

  const saveChanges = () => {
      updatePlannerConfig(config);
      setHasChanges(false);
      alert("Règles du SmartPlanner mises à jour avec succès.");
  };

  const handleReset = () => {
      if(confirm("Réinitialiser toutes les règles du planificateur aux valeurs par défaut ?")) {
          setConfig(DEFAULT_PLANNER_CONFIG);
          updatePlannerConfig(DEFAULT_PLANNER_CONFIG);
          setHasChanges(false);
      }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto max-w-5xl">
      
      {/* HEADER DASHBOARD */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-6 border-b border-gray-100 pb-8">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Settings2 className="w-8 h-8 text-slate-900" />
                Centre de Contrôle Logique
            </h2>
            <p className="text-slate-500 mt-1">Gérez les règles métier fondamentales du système smartplanner.</p>
        </div>

        {/* ACTIONS */}
        <div className="flex items-center gap-4">
             <button 
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all font-bold text-sm"
             >
                 <RotateCcw className="w-4 h-4" /> Réinitialiser
             </button>
             
             <button 
                onClick={saveChanges}
                disabled={!hasChanges}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
             >
                 <Save className="w-4 h-4" /> Enregistrer les Règles
             </button>
        </div>
      </div>

      {/* RULES GRID */}
      <div className="grid lg:grid-cols-2 gap-8 mb-12">
          
          {/* BUDGET STRATEGY */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-700"/>
                  <h3 className="font-bold text-green-800 text-sm uppercase tracking-wide">Stratégie Budgétaire</h3>
              </div>
              <div className="p-6 space-y-6">
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Plafond Hebdomadaire ($)</label>
                          <span className="text-sm font-bold text-green-600">{config.budget.weeklyCap}$</span>
                      </div>
                      <input 
                        type="range" min="50" max="500" step="5"
                        value={config.budget.weeklyCap}
                        onChange={(e) => handleChange('budget', 'weeklyCap', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <p className="text-xs text-gray-400 mt-1">Limite théorique par semaine pour le mode "Budget".</p>
                  </div>
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Prix Max / Kg</label>
                          <span className="text-sm font-bold text-green-600">{config.budget.maxPricePerKg}$/kg</span>
                      </div>
                      <input 
                        type="range" min="10" max="100" step="1"
                        value={config.budget.maxPricePerKg}
                        onChange={(e) => handleChange('budget', 'maxPricePerKg', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                      />
                      <p className="text-xs text-gray-400 mt-1">Seuil pour considérer un produit "économique".</p>
                  </div>
              </div>
          </div>

          {/* CUSTODY LOGIC */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-700"/>
                  <h3 className="font-bold text-blue-800 text-sm uppercase tracking-wide">Paramètres Garde Partagée</h3>
              </div>
              <div className="p-6 space-y-6">
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Facteur Enfant (%)</label>
                          <span className="text-sm font-bold text-blue-600">{(config.custody.childFactor * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1.0" step="0.1"
                        value={config.custody.childFactor}
                        onChange={(e) => handleChange('custody', 'childFactor', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-xs text-gray-400 mt-1">Temps de présence annuel pour le calcul des portions enfants.</p>
                  </div>
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Facteur Ado (%)</label>
                          <span className="text-sm font-bold text-blue-600">{(config.custody.teenFactor * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0.1" max="1.0" step="0.1"
                        value={config.custody.teenFactor}
                        onChange={(e) => handleChange('custody', 'teenFactor', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                  </div>
              </div>
          </div>

          {/* VARIETY ENGINE */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm lg:col-span-2">
              <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-red-700"/>
                  <h3 className="font-bold text-red-800 text-sm uppercase tracking-wide">Moteur de Variété & Compliance</h3>
              </div>
              <div className="p-6 grid md:grid-cols-2 gap-8">
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Plafond Viande Rouge (%)</label>
                          <span className="text-sm font-bold text-red-600">{(config.variety.maxRedMeatPercentage * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0.2" max="0.8" step="0.05"
                        value={config.variety.maxRedMeatPercentage}
                        onChange={(e) => handleChange('variety', 'maxRedMeatPercentage', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                          <AlertOctagon className="w-3 h-3 text-red-500"/>
                          Si dépassé, le plan sera rejeté automatiquement (Blocker).
                      </p>
                  </div>
                  
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Minimum Poisson (%)</label>
                          <span className="text-sm font-bold text-red-600">{(config.variety.minFishPercentage * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0.05" max="0.5" step="0.05"
                        value={config.variety.minFishPercentage}
                        onChange={(e) => handleChange('variety', 'minFishPercentage', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600"
                      />
                      <label className="flex items-center gap-2 mt-4 cursor-pointer">
                          <div className={`w-10 h-6 rounded-full relative transition-colors ${config.variety.forceVarietyInjection ? 'bg-red-600' : 'bg-gray-300'}`} onClick={() => handleChange('variety', 'forceVarietyInjection', !config.variety.forceVarietyInjection)}>
                              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${config.variety.forceVarietyInjection ? 'left-5' : 'left-1'}`}></div>
                          </div>
                          <span className="text-sm text-slate-700 font-bold">Injection Forcée</span>
                      </label>
                      <p className="text-xs text-gray-400 mt-1">Si activé, l'algorithme forcera l'ajout de poisson si sous le seuil.</p>
                  </div>
              </div>
          </div>

          {/* CONDO LOGISTICS */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-2">
                  <Building className="w-5 h-5 text-orange-700"/>
                  <h3 className="font-bold text-orange-800 text-sm uppercase tracking-wide">Logistique (Mode Condo)</h3>
              </div>
              <div className="p-6 space-y-6">
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Seuil Overflow (%)</label>
                          <span className="text-sm font-bold text-orange-600">{(config.condo.overflowThreshold * 100).toFixed(0)}%</span>
                      </div>
                      <input 
                        type="range" min="0.8" max="1.2" step="0.05"
                        value={config.condo.overflowThreshold}
                        onChange={(e) => handleChange('condo', 'overflowThreshold', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                      />
                      <p className="text-xs text-gray-400 mt-1">Pourcentage de la capacité congélateur avant déclenchement d'alerte.</p>
                  </div>
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Densité (lbs/pi³)</label>
                          <span className="text-sm font-bold text-orange-600">{config.condo.packDensity}</span>
                      </div>
                      <input 
                        type="number"
                        value={config.condo.packDensity}
                        onChange={(e) => handleChange('condo', 'packDensity', parseFloat(e.target.value))}
                        className="w-full border rounded p-2 text-sm font-bold"
                      />
                  </div>
              </div>
          </div>

          {/* VIP FACTORS */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-purple-50 p-4 border-b border-purple-100 flex items-center gap-2">
                  <Star className="w-5 h-5 text-purple-700"/>
                  <h3 className="font-bold text-purple-800 text-sm uppercase tracking-wide">Facteurs VIP</h3>
              </div>
              <div className="p-6 space-y-6">
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Poids de Tri</label>
                          <span className="text-sm font-bold text-purple-600">x{config.vip.sortingWeight}</span>
                      </div>
                      <input 
                        type="range" min="1.0" max="5.0" step="0.5"
                        value={config.vip.sortingWeight}
                        onChange={(e) => handleChange('vip', 'sortingWeight', parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                      />
                      <p className="text-xs text-gray-400 mt-1">Priorité donnée aux articles Premium dans l'algorithme de tri.</p>
                  </div>
                  <div>
                      <div className="flex justify-between mb-2">
                          <label className="text-sm font-bold text-slate-700">Cible Premium (Items)</label>
                          <input 
                            type="number"
                            value={config.vip.premiumTarget}
                            onChange={(e) => handleChange('vip', 'premiumTarget', parseInt(e.target.value))}
                            className="w-20 border rounded p-1 text-sm font-bold text-center"
                          />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Nombre maximum d'items premium autorisés avant plafonnement.</p>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};