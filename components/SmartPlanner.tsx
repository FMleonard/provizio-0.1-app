



import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrainCircuit, Calculator, ShieldCheck, Snowflake, ArrowRight, Check, 
  DollarSign, Users, Star, Building, ShoppingBag, AlertOctagon, 
  FileSearch, Lock, Unlock, Zap, PlayCircle, Box, ChevronRight, 
  ChevronLeft, RotateCcw, Truck, Activity, Wand2, Flame, PiggyBank, 
  Dumbbell, UserPlus, Sparkles, ThermometerSnowflake, CheckCircle2,
  ChefHat, Plus, Minus
} from 'lucide-react';
import { Product, CartItem, EvaluationData, ClientInfo, PlannerConfig } from '../types';
import { useCart, useProducts, useClient } from '../contexts/StoreContext';
import { PERSONA_TEMPLATES, AMQ_KNOWLEDGE_BASE } from '../constants';

interface SmartPlannerProps {
  products: Product[];
  evaluationData: EvaluationData;
  clientInfo: ClientInfo;
  onApplyPlan: (cart: CartItem[], pickupList?: Product[]) => void;
}

// --- UTILS ---
const LBS_PER_CU_FT = 25;

const calculateFreezerSpace = (info: ClientInfo) => {
    const fridge = info.fridgeFreezerCapacity * info.fridgeFreezerEfficiency;
    const chest = info.chestFreezerCapacity * info.chestFreezerEfficiency;
    return fridge + chest;
};

// Helper to get icon component
const getPersonaIcon = (name: string) => {
    switch(name) {
        case 'Flame': return Flame;
        case 'PiggyBank': return PiggyBank;
        case 'Dumbbell': return Dumbbell;
        case 'Zap': return Zap;
        case 'Box': return Box;
        case 'UserPlus': return UserPlus;
        default: return Sparkles;
    }
};

export const SmartPlanner: React.FC<SmartPlannerProps> = ({ products, evaluationData: initialData, clientInfo: initialClient, onApplyPlan }) => {
  const { plannerConfig } = useProducts();
  const { setEvaluationData, setClientInfo } = useClient();
  
  // --- WIZARD STATE ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplyingPersona, setIsApplyingPersona] = useState(false);
  
  // --- LOCAL DATA BUFFER ---
  const [localClient, setLocalClient] = useState<ClientInfo>(initialClient);
  const [localData, setLocalData] = useState<EvaluationData>(initialData);
  
  // --- RESULT STATE ---
  const [generatedCart, setGeneratedCart] = useState<CartItem[]>([]);
  const [pickupItems, setPickupItems] = useState<Product[]>([]);
  const [timeline, setTimeline] = useState<{day: number, volume: number, isDelivery: boolean}[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [totalCost, setTotalCost] = useState(0);

  // --- CATEGORY CONFIG FOR UI ---
  const butcherCategories = [
      { id: 'Boeuf', label: 'Bœuf', icon: '🥩', color: 'text-red-700', bg: 'bg-red-50', prefix: 'boeuf_slot' },
      { id: 'Poulet', label: 'Volaille', icon: '🍗', color: 'text-orange-700', bg: 'bg-orange-50', prefix: 'poulet_slot' },
      { id: 'Porc', label: 'Porc', icon: '🥓', color: 'text-pink-700', bg: 'bg-pink-50', prefix: 'porc_slot' },
      { id: 'Poisson', label: 'Mer', icon: '🐟', color: 'text-blue-700', bg: 'bg-blue-50', prefix: 'poisson_slot' },
      { id: 'Extra', label: 'Extra', icon: '🥘', color: 'text-purple-700', bg: 'bg-purple-50', prefix: 'extra_slot' }
  ];

  // --- STEP 1 LOGIC (FREEZER) ---
  const totalUsableSpace = calculateFreezerSpace(localClient);
  const requiredSpaceForFamily = useMemo(() => {
      const portions = (localData.adults * 1) + (localData.children * 0.5) + (localData.teens * 0.75);
      return portions * 2.5; // Rule of thumb
  }, [localData]);

  // --- STEP 2 LOGIC (PERSONA ENGINE) ---
  const applyPersona = (personaId: string) => {
      setIsApplyingPersona(true);
      const template = PERSONA_TEMPLATES.find(p => p.id === personaId);
      if (!template) { setIsApplyingPersona(false); return; }

      setTimeout(() => {
          const newCustomSelections = { ...localData.customSelections };
          const newSubPreferences = { ...localData.proteinSubPreferences };
          
          // Clear existing prefs
          Object.keys(newSubPreferences).forEach(k => newSubPreferences[k] = 0);
          const usedProductIds = new Set<string>();

          // Iterate Categories
          butcherCategories.forEach(cat => {
              // Map "Poisson" UI category to actual catalog categories
              const catalogCategory = cat.id === 'Poisson' ? 'Poisson/Fruits de mer' : cat.id;
              
              // Get rules for this category from template
              // Note: Template keys might differ slightly (e.g., 'Poisson' vs 'Poisson/Fruits de mer')
              // We try to match loosely
              let catRules = template.rules[cat.id as keyof typeof template.rules] || [];
              if (cat.id === 'Extra') {
                  // Combine rules for Prêt-à-manger, Gibier, etc if needed, or just use 'Extra' key in template
                  catRules = template.rules['Extra' as keyof typeof template.rules] || [];
              }

              // Filter products for this category
              const catCandidates = products.filter(p => {
                  if (cat.id === 'Extra') return p.category === 'Prêt-à-manger' || p.category === 'Gibier & Autres';
                  if (cat.id === 'Poisson') return p.category.includes('Poisson') || p.category.includes('mer');
                  return p.category === cat.id;
              });

              let slotIndex = 1;

              catRules.forEach(rule => {
                  let bestMatch: Product | undefined;
                  
                  // 1. Try precise keyword match
                  for (const keyword of rule.keywords) {
                      bestMatch = catCandidates.find(p => 
                          !usedProductIds.has(p.id) && 
                          p.name.toLowerCase().includes(keyword.toLowerCase()) &&
                          p.isAvailable
                      );
                      if (bestMatch) break;
                  }

                  // 2. Fallback to any available in category
                  if (!bestMatch) {
                      bestMatch = catCandidates.find(p => !usedProductIds.has(p.id) && p.isAvailable);
                  }

                  if (bestMatch && slotIndex <= 10) {
                      const slotName = `${cat.prefix}_${slotIndex}`;
                      const slotKey = `Custom|${slotName}`;
                      
                      newCustomSelections[slotName] = bestMatch.id;
                      newSubPreferences[slotKey] = rule.freq; // Set frequency from template
                      
                      usedProductIds.add(bestMatch.id);
                      slotIndex++;
                  }
              });
          });

          setLocalData({
              ...localData,
              customSelections: newCustomSelections,
              proteinSubPreferences: newSubPreferences,
              selectedPersonaId: personaId
          });
          setIsApplyingPersona(false);
      }, 600); // Fake "Thinking" delay
  };

  // --- STEP 3 LOGIC (SIMULATION) ---
  const runSimulation = async () => {
      setIsSimulating(true);
      setLogs([]);
      const log = (msg: string) => setLogs(prev => [...prev, msg]);
      
      log("INITIALISATION DU MAGICIEN...");
      
      // 1. CALCULATE NEEDS
      const gramsPerPerson = localData.gramsPerPerson || 150;
      const portions = (localData.adults) + (localData.children * 0.5) + (localData.teens * 0.75);
      
      // 2. BUILD TARGET CART FROM PREFERENCES
      let targetCart: CartItem[] = [];
      let currentCost = 0;
      const subPrefs = localData.proteinSubPreferences || {};
      
      log(`Analyse des préférences (${Object.keys(subPrefs).length} points de données)...`);

      Object.entries(subPrefs).forEach(([key, freq]) => {
          if (Number(freq) <= 0) return;
          const [cat, subType] = key.split('|');
          
          let product: Product | undefined;
          if (cat === 'Custom') {
              const prodId = localData.customSelections?.[subType];
              product = products.find(p => p.id === prodId);
          }
          
          if (product) {
              const mealWeightGrams = portions * gramsPerPerson;
              const annualMeals = Number(freq) * 52;
              const annualTotalWeight = mealWeightGrams * annualMeals;
              
              const boxWeight = product.totalWeightGrams || 5000;
              let boxCount = Math.floor(annualTotalWeight / boxWeight); // Rule C: Round Down
              
              // If heavy usage but small box, ensure at least 1
              if (boxCount === 0 && (annualTotalWeight / boxWeight) > 0.4) boxCount = 1;

              if (boxCount > 0) {
                  // Even split default
                  const baseQty = Math.floor(boxCount / 4);
                  const remainder = boxCount % 4;
                  const quantities = { 1: baseQty, 2: baseQty, 3: baseQty, 4: baseQty };
                  for (let i=1; i<=remainder; i++) quantities[i as 1|2|3|4]++;
                  
                  targetCart.push({
                      product,
                      quantities,
                      lockState: 'SYSTEM_OPTIMIZED'
                  });
                  currentCost += (product.salePrice || product.price) * boxCount;
              }
          }
      });

      log(`Panier brut généré: ${currentCost.toFixed(2)}$`);

      // 3. BUDGET OPTIMIZATION (OPTION B)
      const weeklyBudget = plannerConfig.budget.weeklyCap;
      const annualBudget = weeklyBudget * 52;
      
      if (currentCost > annualBudget) {
          log(`⚠️ DÉPASSEMENT BUDGET (${currentCost.toFixed(0)}$ > ${annualBudget.toFixed(0)}$)`);
          log("-> Activation Protocole B: Substitution Économique");
          
          // Find cheaper alternatives
          const fillers = products.filter(p => 
              (p.category === 'Boeuf' && p.texture === 'ground') || 
              (p.category === 'Poulet' && (p.texture === 'piece' || p.texture === 'whole'))
          ).sort((a, b) => (a.price / (a.totalWeightGrams||1)) - (b.price / (b.totalWeightGrams||1)));
          
          const filler = fillers[0]; // Best value item
          
          // Sort cart by price descending
          targetCart.sort((a, b) => (b.product.price) - (a.product.price));
          
          let safetyLoop = 0;
          while (currentCost > annualBudget && safetyLoop < 100) {
              // Find expensive item
              const expensiveItem = targetCart.find(i => i.product.id !== filler.id && i.product.isPremium);
              if (!expensiveItem) break; // No more premium to swap
              
              // Reduce quantity
              const d = [1,2,3,4].find(k => expensiveItem.quantities[k] > 0);
              if (d) {
                  expensiveItem.quantities[d]--;
                  currentCost -= (expensiveItem.product.salePrice || expensiveItem.product.price);
                  
                  // Add filler
                  let fillerItem = targetCart.find(i => i.product.id === filler.id);
                  if (!fillerItem) {
                      fillerItem = { product: filler, quantities: {1:0,2:0,3:0,4:0} as any, lockState: 'SYSTEM_OPTIMIZED' };
                      targetCart.push(fillerItem);
                  }
                  fillerItem.quantities[d]++;
                  currentCost += (filler.salePrice || filler.price);
              }
              
              // Remove if empty
              if (Object.values(expensiveItem.quantities).reduce((a,b)=>a+b,0) === 0) {
                  targetCart = targetCart.filter(i => i !== expensiveItem);
              }
              safetyLoop++;
          }
          log(`Budget optimisé: ${currentCost.toFixed(2)}$`);
      } else {
          log("Budget respecté.");
      }

      // 4. FREEZER SIMULATION (TIME SERIES)
      log("Simulation Espace Congélateur (365 jours)...");
      const timelineData: {day: number, volume: number, isDelivery: boolean}[] = [];
      const pickupListGenerated: Product[] = [];
      
      let currentVol = 0;
      let deliveryIdx = 1;
      
      // Prep Queues
      const queues: Record<number, CartItem[]> = {1:[], 2:[], 3:[], 4:[]};
      targetCart.forEach(i => {
          [1,2,3,4].forEach(d => { if(i.quantities[d]>0) queues[d].push(i); });
      });

      const totalVol = targetCart.reduce((acc, i) => {
          const qty = Object.values(i.quantities).reduce((a,b)=>a+b,0);
          const vol = (i.product.totalWeightGrams! / 1000 * 2.20462 * qty) / LBS_PER_CU_FT;
          return acc + vol;
      }, 0);
      const dailyDrain = totalVol / 365;

      for (let day = 1; day <= 365; day++) {
          currentVol = Math.max(0, currentVol - dailyDrain);
          
          // Delivery Logic
          if (deliveryIdx <= 4) {
              const items = queues[deliveryIdx];
              if (items && items.length > 0) {
                  // Check if we should deliver (Low stock or Day 1)
                  // Or simplistic: Deliver exactly at Day 1, 90, 180, 270?
                  // Requirement: "when they have enough space again"
                  
                  let deliveryVol = 0;
                  items.forEach(i => {
                      const q = i.quantities[deliveryIdx];
                      const v = (i.product.totalWeightGrams! / 1000 * 2.20462 * q) / LBS_PER_CU_FT;
                      deliveryVol += v;
                  });

                  const hasSpace = (currentVol + deliveryVol) <= (totalUsableSpace * 1.1); // 10% tolerance
                  const isTime = day === 1 || (currentVol < totalUsableSpace * 0.2); // Deliver when 80% empty

                  if (isTime) {
                      if (!hasSpace) {
                          log(`⚠️ Manque d'espace (Liv #${deliveryIdx}). Transfert vers Ramassage.`);
                          // Move overflow to pickup
                          // Simplistic: Move entire delivery or largest items?
                          // Let's move items until it fits
                          items.sort((a,b) => (b.product.totalWeightGrams || 0) - (a.product.totalWeightGrams || 0));
                          
                          let removedVol = 0;
                          const needed = (currentVol + deliveryVol) - totalUsableSpace;
                          
                          for (const item of items) {
                              if (removedVol >= needed) break;
                              if (item.quantities[deliveryIdx] > 0) {
                                  item.quantities[deliveryIdx]--;
                                  pickupListGenerated.push(item.product);
                                  const v = (item.product.totalWeightGrams! / 1000 * 2.20462) / LBS_PER_CU_FT;
                                  removedVol += v;
                                  deliveryVol -= v;
                              }
                          }
                      }
                      currentVol += deliveryVol;
                      timelineData.push({ day, volume: currentVol, isDelivery: true });
                      deliveryIdx++;
                  } else {
                      timelineData.push({ day, volume: currentVol, isDelivery: false });
                  }
              } else {
                  deliveryIdx++; // Empty delivery, skip
              }
          } else {
              timelineData.push({ day, volume: currentVol, isDelivery: false });
          }
      }

      setGeneratedCart(targetCart);
      setPickupItems(pickupListGenerated);
      setTimeline(timelineData);
      setTotalCost(currentCost);
      
      setTimeout(() => setIsSimulating(false), 1000);
  };

  const handleFinalize = () => {
      setClientInfo(localClient);
      setEvaluationData(localData);
      onApplyPlan(generatedCart, pickupItems);
  };

  return (
    <div className="min-h-[600px] flex flex-col bg-slate-50">
      {/* --- WIZARD HEADER --- */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex justify-between items-center max-w-4xl mx-auto">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Wand2 className="w-6 h-6 text-purple-600"/> Le Magicien
              </h2>
              
              <div className="flex items-center gap-2 text-sm">
                  <span className={`px-3 py-1 rounded-full ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400'}`}>1. Famille</span>
                  <div className="w-4 h-0.5 bg-gray-200"></div>
                  <span className={`px-3 py-1 rounded-full ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400'}`}>2. Goûts</span>
                  <div className="w-4 h-0.5 bg-gray-200"></div>
                  <span className={`px-3 py-1 rounded-full ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400'}`}>3. Plan</span>
              </div>
          </div>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
          
          {/* STEP 1: CONTEXT */}
          {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in">
                  <div className="grid md:grid-cols-2 gap-8">
                      {/* Family Card */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> Qui mange?</h3>
                          <div className="space-y-4">
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                  <span className="font-bold text-slate-600">Adultes</span>
                                  <input type="number" min="1" value={localData.adults} onChange={e => setLocalData({...localData, adults: parseInt(e.target.value)})} className="w-16 text-center font-bold text-xl bg-white border rounded-lg p-1"/>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                  <span className="font-bold text-slate-600">Ados</span>
                                  <input type="number" min="0" value={localData.teens} onChange={e => setLocalData({...localData, teens: parseInt(e.target.value)})} className="w-16 text-center font-bold text-xl bg-white border rounded-lg p-1"/>
                              </div>
                              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                  <span className="font-bold text-slate-600">Enfants</span>
                                  <input type="number" min="0" value={localData.children} onChange={e => setLocalData({...localData, children: parseInt(e.target.value)})} className="w-16 text-center font-bold text-xl bg-white border rounded-lg p-1"/>
                              </div>
                          </div>
                      </div>

                      {/* Freezer Card */}
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ThermometerSnowflake className="w-5 h-5 text-blue-600"/> Espace Froid</h3>
                          
                          <div className="space-y-6">
                              <div>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-bold text-slate-700">Frigo (Haut)</span>
                                      <span className="text-blue-600 font-bold">{localClient.fridgeFreezerCapacity} pi³</span>
                                  </div>
                                  <input 
                                    type="range" min="2" max="6" step="0.5"
                                    value={localClient.fridgeFreezerCapacity}
                                    onChange={e => setLocalClient({...localClient, fridgeFreezerCapacity: parseFloat(e.target.value)})}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                  />
                              </div>

                              <div>
                                  <div className="flex justify-between text-sm mb-1">
                                      <span className="font-bold text-slate-700">Congélateur Tombeau</span>
                                      <span className="text-blue-600 font-bold">{localClient.chestFreezerCapacity} pi³</span>
                                  </div>
                                  <div className="flex gap-2">
                                      {[0, 5, 7, 10, 15].map(size => (
                                          <button 
                                            key={size}
                                            onClick={() => setLocalClient({...localClient, chestFreezerCapacity: size})}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${localClient.chestFreezerCapacity === size ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'}`}
                                          >
                                              {size === 0 ? 'Aucun' : size}
                                          </button>
                                      ))}
                                  </div>
                              </div>

                              <div className="bg-blue-50 p-3 rounded-xl flex justify-between items-center">
                                  <span className="text-xs font-bold text-blue-800 uppercase">Total Dispo</span>
                                  <span className="text-2xl font-bold text-blue-900">{totalUsableSpace.toFixed(1)} <span className="text-sm">pi³</span></span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 2: PREFERENCES (LE MAGICIEN) */}
          {step === 2 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in">
                  {/* Persona Selector */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {PERSONA_TEMPLATES.map(p => {
                          const Icon = getPersonaIcon(p.iconName);
                          const isSelected = localData.selectedPersonaId === p.id;
                          return (
                              <button 
                                key={p.id}
                                onClick={() => applyPersona(p.id)}
                                className={`relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden ${isSelected ? 'border-purple-600 bg-purple-50' : 'border-gray-100 bg-white hover:border-purple-200'}`}
                              >
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-400 group-hover:text-purple-600'}`}>
                                      <Icon className="w-5 h-5" />
                                  </div>
                                  <h4 className={`font-bold text-sm ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>{p.label}</h4>
                                  <p className="text-[10px] text-gray-500 mt-1 leading-tight">{p.description}</p>
                                  {isSelected && <div className="absolute top-2 right-2 text-purple-600"><CheckCircle2 className="w-4 h-4"/></div>}
                              </button>
                          )
                      })}
                  </div>

                  {isApplyingPersona ? (
                      <div className="py-20 text-center">
                          <Wand2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-purple-900">Le Magicien travaille...</h3>
                          <p className="text-purple-600">Recherche des meilleurs produits pour votre profil.</p>
                      </div>
                  ) : (
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                          <div className="flex items-center gap-3 mb-6">
                              <div className="bg-slate-900 text-white p-2 rounded-lg"><ChefHat className="w-5 h-5"/></div>
                              <h3 className="text-xl font-bold text-slate-800">Vos Habitudes (Le Boucher)</h3>
                          </div>
                          
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {butcherCategories.map(cat => (
                                  <div key={cat.id} className={`rounded-2xl border ${cat.bg} ${cat.color.replace('text', 'border')} border-opacity-20 overflow-hidden h-full`}>
                                      <div className={`p-3 border-b border-white/50 flex items-center justify-between ${cat.color}`}>
                                          <span className="font-bold flex items-center gap-2">{cat.icon} {cat.label}</span>
                                          <span className="text-xs opacity-70 font-mono font-bold">Repas/sem</span>
                                      </div>
                                      <div className="p-2 space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                          {[1,2,3,4,5,6,7,8,9,10].map(idx => { 
                                              const slotName = `${cat.prefix}_${idx}`;
                                              const slotKey = `Custom|${slotName}`;
                                              const selectedId = localData.customSelections?.[slotName];
                                              const freq = localData.proteinSubPreferences?.[slotKey] || 0;
                                              
                                              // Filter Products for this category
                                              const candidates = products.filter(p => {
                                                  if (cat.id === 'Extra') return p.category === 'Prêt-à-manger' || p.category === 'Gibier & Autres';
                                                  if (cat.id === 'Poisson') return p.category.includes('Poisson') || p.category.includes('mer');
                                                  return p.category === cat.id;
                                              });

                                              return (
                                                  <div key={slotKey} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white/60 p-2 rounded-lg border border-black/5 hover:border-black/10 transition-colors">
                                                      <select 
                                                        className="flex-1 text-xs bg-transparent outline-none font-medium text-slate-700 w-full p-1"
                                                        value={selectedId || ''}
                                                        onChange={(e) => {
                                                            setLocalData(prev => ({
                                                                ...prev,
                                                                customSelections: { ...prev.customSelections, [slotName]: e.target.value }
                                                            }))
                                                        }}
                                                      >
                                                          <option value="">-- Choisir --</option>
                                                          {candidates.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                                      </select>
                                                      
                                                      {/* High Visibility Frequency Counter */}
                                                      <div className="flex items-center justify-between bg-slate-800 text-white rounded-md p-0.5 shrink-0 w-full sm:w-auto">
                                                          <button 
                                                            onClick={() => {
                                                                const n = Math.max(0, freq - 0.25);
                                                                setLocalData(prev => ({...prev, proteinSubPreferences: {...prev.proteinSubPreferences, [slotKey]: n}}));
                                                            }} 
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
                                                            disabled={!selectedId}
                                                          >
                                                              <Minus className="w-3 h-3" />
                                                          </button>
                                                          <span className="w-8 text-center text-xs font-bold font-mono">{freq}</span>
                                                          <button 
                                                            onClick={() => {
                                                                const n = freq + 0.25;
                                                                setLocalData(prev => ({...prev, proteinSubPreferences: {...prev.proteinSubPreferences, [slotKey]: n}}));
                                                            }} 
                                                            className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded transition-colors"
                                                            disabled={!selectedId}
                                                          >
                                                              <Plus className="w-3 h-3" />
                                                          </button>
                                                      </div>
                                                  </div>
                                              )
                                          })}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
              </div>
          )}

          {/* STEP 3: SIMULATION & RESULTS */}
          {step === 3 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in">
                  {isSimulating ? (
                      <div className="py-20 flex flex-col items-center justify-center">
                          <div className="w-24 h-24 relative">
                              <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                              <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
                              <BrainCircuit className="absolute inset-0 m-auto w-8 h-8 text-slate-900" />
                          </div>
                          <h2 className="mt-6 text-2xl font-bold text-slate-800">Le Cerveau Calcule...</h2>
                          <div className="mt-4 bg-white border border-gray-200 p-4 rounded-xl w-full max-w-md h-40 overflow-y-auto font-mono text-xs text-slate-500 shadow-inner">
                              {logs.map((l, i) => <div key={i} className="mb-1">> {l}</div>)}
                          </div>
                      </div>
                  ) : (
                      <>
                        {/* RESULT DASHBOARD */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* FINANCIAL */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-12 h-12"/></div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Budget Hebdo</p>
                                <p className="text-4xl font-extrabold text-slate-900 mt-2">{(totalCost/52).toFixed(0)}<span className="text-lg font-normal text-gray-400">$</span></p>
                                <div className="mt-4 text-xs font-medium flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                                    <Check className="w-3 h-3"/> Prix bloqué 1 an
                                </div>
                            </div>

                            {/* LOGISTICS */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Snowflake className="w-12 h-12 text-blue-600"/></div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Espace Requis</p>
                                <p className="text-4xl font-extrabold text-slate-900 mt-2">{(totalCost > 0 ? 2.5 : 0) * localData.adults} <span className="text-lg font-normal text-gray-400">pi³</span></p>
                                <p className="mt-4 text-xs text-gray-500">Basé sur votre volume d'achat</p>
                            </div>

                            {/* ACTION */}
                            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between">
                                <div>
                                    <p className="font-bold text-lg">Prêt à finaliser ?</p>
                                    <p className="text-slate-400 text-sm mt-1">Ce plan génère {generatedCart.length} lignes de commande.</p>
                                </div>
                                <button 
                                    onClick={handleFinalize}
                                    className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mt-4"
                                >
                                    Voir le Panier <ArrowRight className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>

                        {/* TIMELINE GRAPH */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-500"/> Simulation de votre congélateur
                            </h4>
                            <div className="h-48 flex items-end gap-0.5 w-full">
                                {timeline.filter((_, i) => i % 3 === 0).map((point, i) => {
                                    const pct = Math.min(100, (point.volume / totalUsableSpace) * 100);
                                    const isOver = point.volume > totalUsableSpace;
                                    
                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                            {/* Bar */}
                                            <div 
                                                className={`w-full rounded-t-sm transition-all ${point.isDelivery ? 'bg-purple-500 w-1.5 mx-auto' : isOver ? 'bg-red-400' : 'bg-blue-100 group-hover:bg-blue-300'}`} 
                                                style={{ height: `${Math.max(5, pct)}%` }}
                                            ></div>
                                            
                                            {/* Tooltip */}
                                            <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] p-2 rounded whitespace-nowrap z-10 pointer-events-none">
                                                Jour {point.day}: {point.volume.toFixed(1)} pi³
                                            </div>

                                            {/* Delivery Icon */}
                                            {point.isDelivery && (
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 mb-1">
                                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            {/* Legend */}
                            <div className="flex justify-center gap-6 mt-4 text-xs font-medium text-gray-500">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-100 rounded"></div> Stock</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded"></div> Livraison</div>
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-400 rounded"></div> Surplus (Ramassage)</div>
                            </div>
                        </div>

                        {/* PICKUP ALERT */}
                        {pickupItems.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl flex gap-4 items-start animate-pulse">
                                <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><ShoppingBag className="w-6 h-6"/></div>
                                <div>
                                    <h4 className="font-bold text-orange-800">Surplus Détecté ({pickupItems.length} items)</h4>
                                    <p className="text-sm text-orange-700 mt-1">
                                        Pour optimiser l'espace, certains items volumineux ont été déplacés en <strong>Ramassage Magasin</strong>.
                                    </p>
                                </div>
                            </div>
                        )}
                      </>
                  )}
              </div>
          )}
      </div>

      {/* --- FOOTER CONTROLS --- */}
      <div className="bg-white border-t border-gray-200 p-4 md:px-8 py-4 flex justify-between items-center sticky bottom-0 z-20">
          <button 
            onClick={() => setStep(Math.max(1, step - 1) as any)}
            disabled={step === 1}
            className="px-4 py-2 text-slate-500 font-bold hover:text-slate-900 disabled:opacity-30 flex items-center gap-2 transition-colors"
          >
              <ChevronLeft className="w-4 h-4"/> Retour
          </button>

          {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1 as any)}
                className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-slate-800 hover:scale-105 transition-all flex items-center gap-2"
              >
                  Suivant <ChevronRight className="w-4 h-4"/>
              </button>
          ) : (
              !isSimulating && (
                  <button 
                    onClick={runSimulation}
                    className="text-slate-500 font-bold hover:text-blue-600 flex items-center gap-2 text-sm"
                  >
                      <RotateCcw className="w-4 h-4"/> Recalculer
                  </button>
              )
          )}
      </div>
    </div>
  );
};