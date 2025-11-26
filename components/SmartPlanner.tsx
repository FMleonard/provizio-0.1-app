
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BrainCircuit, Calculator, ShieldCheck, Snowflake, ArrowRight, Check, 
  DollarSign, Users, Star, Building, ShoppingBag, AlertOctagon, 
  FileSearch, Lock, Unlock, Zap, PlayCircle, Box, ChevronRight, 
  ChevronLeft, RotateCcw, Truck, Activity, Wand2, Flame, PiggyBank, 
  Dumbbell, UserPlus, Sparkles, ThermometerSnowflake, CheckCircle2,
  ChefHat, Plus, Minus, MessageSquare, X, Cookie, Soup, Droplet, Fish
} from 'lucide-react';
import { Product, CartItem, EvaluationData, ClientInfo, PlannerConfig } from '../types';
import { useCart, useProducts, useClient } from '../contexts/StoreContext';
import { PERSONA_TEMPLATES, AMQ_KNOWLEDGE_BASE } from '../constants';
import { KnowledgeChat } from './KnowledgeChat';

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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isApplyingPersona, setIsApplyingPersona] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); // AI Panel State
  const [activeCategoryTab, setActiveCategoryTab] = useState('Boeuf');
  
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
      { id: 'Poisson', label: 'Mer', icon: <Fish className="w-4 h-4"/>, color: 'text-blue-700', bg: 'bg-blue-50', prefix: 'poisson_slot' },
      { id: 'Extra', label: 'Extra', icon: '🥘', color: 'text-gray-700', bg: 'bg-gray-50', prefix: 'extra_slot' },
      { id: 'Entrée', label: 'Entrées', icon: <Soup className="w-4 h-4"/>, color: 'text-emerald-700', bg: 'bg-emerald-50', prefix: 'entree_slot' },
      { id: 'Dessert', label: 'Desserts', icon: <Cookie className="w-4 h-4"/>, color: 'text-rose-700', bg: 'bg-rose-50', prefix: 'dessert_slot' },
      { id: 'Sauce', label: 'Sauces', icon: <Droplet className="w-4 h-4"/>, color: 'text-cyan-700', bg: 'bg-cyan-50', prefix: 'sauce_slot' }
  ];

  // --- STEP 1 LOGIC (FREEZER) ---
  const totalUsableSpace = calculateFreezerSpace(localClient);

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
          
          // STRICT DUPLICATE PREVENTION SET
          const globalUsedIds = new Set<string>();

          // Iterate Categories
          butcherCategories.forEach(cat => {
              let catRules = template.rules[cat.id as keyof typeof template.rules] || [];
              
              const catCandidates = products.filter(p => {
                  if (cat.id === 'Extra') return p.category === 'Prêt-à-manger' || p.category === 'Gibier & Autres';
                  if (cat.id === 'Poisson') return p.category.includes('Poisson') || p.category.includes('mer');
                  return p.category === cat.id;
              });

              let slotIndex = 1;

              catRules.forEach(rule => {
                  let bestMatch: Product | undefined;
                  
                  // Try to find a match that hasn't been used globally
                  for (const keyword of rule.keywords) {
                      bestMatch = catCandidates.find(p => 
                          !globalUsedIds.has(p.id) && 
                          p.name.toLowerCase().includes(keyword.toLowerCase()) &&
                          p.isAvailable
                      );
                      if (bestMatch) break;
                  }

                  // Fallback: any unused product in category
                  if (!bestMatch) {
                      bestMatch = catCandidates.find(p => !globalUsedIds.has(p.id) && p.isAvailable);
                  }

                  if (bestMatch && slotIndex <= 10) {
                      const slotName = `${cat.prefix}_${slotIndex}`;
                      const slotKey = `Custom|${slotName}`;
                      
                      newCustomSelections[slotName] = bestMatch.id;
                      newSubPreferences[slotKey] = rule.freq;
                      
                      globalUsedIds.add(bestMatch.id);
                      slotIndex++;
                  }
              });
          });

          // PRE-FILL FAMILY IF EMPTY
          let updatedClient = { ...localData };
          if (localData.adults === 0 && localData.children === 0) {
               if (personaId.includes('family')) { updatedClient.adults = 2; updatedClient.children = 2; }
               else if (personaId.includes('shared')) { updatedClient.adults = 1; updatedClient.children = 2; }
               else if (personaId === 'essentials' || personaId === 'premium') { updatedClient.adults = 2; }
          }
          
          // SET DEFAULT BUDGET
          updatedClient.targetWeeklyBudget = template.defaultBudget || 250;

          setLocalData({
              ...updatedClient,
              customSelections: newCustomSelections,
              proteinSubPreferences: newSubPreferences,
              selectedPersonaId: personaId
          });
          setIsApplyingPersona(false);
      }, 400); 
  };

  const calculateProjectedCost = () => {
      const gramsPerPerson = localData.gramsPerPerson || 150;
      const portions = (localData.adults) + (localData.children * 0.5) + (localData.teens * 0.75);
      const subPrefs = localData.proteinSubPreferences || {};
      let totalAnnualCost = 0;

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
              let boxCount = annualTotalWeight / boxWeight;
              
              // Estimate cost continuously
              totalAnnualCost += (product.salePrice || product.price) * boxCount;
          }
      });
      return totalAnnualCost;
  };

  const autoAdjustFrequencies = () => {
      const currentProjectedAnnual = calculateProjectedCost();
      if (currentProjectedAnnual === 0) return;

      const targetAnnual = (localData.targetWeeklyBudget || 200) * 52;
      const ratio = targetAnnual / currentProjectedAnnual;

      const newPrefs = { ...localData.proteinSubPreferences };
      let changed = false;

      Object.keys(newPrefs).forEach(key => {
          const currentFreq = newPrefs[key];
          if (currentFreq > 0) {
              // Apply ratio but keep valid steps (0.25)
              let newFreq = currentFreq * ratio;
              // Round to nearest 0.25 to keep it clean, but ensure at least 0.25 if it was > 0
              newFreq = Math.max(0.25, Math.round(newFreq * 4) / 4);
              newPrefs[key] = newFreq;
              changed = true;
          }
      });

      if (changed) {
          setLocalData({ ...localData, proteinSubPreferences: newPrefs });
          alert(`Quantités ajustées automatiquement ! Ratio appliqué: ${(ratio * 100).toFixed(0)}%`);
      }
  };


  // --- STEP 3 LOGIC (SIMULATION) ---
  const runSimulation = async () => {
      setIsSimulating(true);
      setLogs([]);
      const log = (msg: string) => setLogs(prev => [...prev, msg]);
      
      log("INITIALISATION DU MAGICIEN...");
      
      const gramsPerPerson = localData.gramsPerPerson || 150;
      const portions = (localData.adults) + (localData.children * 0.5) + (localData.teens * 0.75);
      
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
              
              if (boxCount === 0 && (annualTotalWeight / boxWeight) > 0.4) boxCount = 1;

              if (boxCount > 0) {
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

      // 3. BUDGET OPTIMIZATION
      const userWeeklyTarget = localData.targetWeeklyBudget || plannerConfig.budget.weeklyCap;
      const annualBudget = userWeeklyTarget * 52;
      
      log(`Cible Budgétaire: ${userWeeklyTarget}$/sem (${annualBudget}$/an)`);

      if (currentCost > annualBudget) {
          log(`⚠️ DÉPASSEMENT (${currentCost.toFixed(0)}$ > ${annualBudget.toFixed(0)}$)`);
          log("-> Optimisation par substitution économique...");
          
          const fillers = products.filter(p => 
              (p.category === 'Boeuf' && p.texture === 'ground') || 
              (p.category === 'Poulet' && (p.texture === 'piece' || p.texture === 'whole'))
          ).sort((a, b) => (a.price / (a.totalWeightGrams||1)) - (b.price / (b.totalWeightGrams||1)));
          
          const filler = fillers[0];
          targetCart.sort((a, b) => (b.product.price) - (a.product.price));
          
          let safetyLoop = 0;
          while (currentCost > annualBudget && safetyLoop < 100) {
              const expensiveItem = targetCart.find(i => i.product.id !== filler.id && i.product.isPremium);
              if (!expensiveItem) break;
              
              const d = [1,2,3,4].find(k => expensiveItem.quantities[k] > 0);
              if (d) {
                  expensiveItem.quantities[d]--;
                  currentCost -= (expensiveItem.product.salePrice || expensiveItem.product.price);
                  
                  let fillerItem = targetCart.find(i => i.product.id === filler.id);
                  if (!fillerItem) {
                      fillerItem = { product: filler, quantities: {1:0,2:0,3:0,4:0} as any, lockState: 'SYSTEM_OPTIMIZED' };
                      targetCart.push(fillerItem);
                  }
                  fillerItem.quantities[d]++;
                  currentCost += (filler.salePrice || filler.price);
              }
              
              if (Object.values(expensiveItem.quantities).reduce((a,b)=>a+b,0) === 0) {
                  targetCart = targetCart.filter(i => i !== expensiveItem);
              }
              safetyLoop++;
          }
          log(`Budget optimisé: ${currentCost.toFixed(2)}$`);
      } else {
          log("Budget respecté.");
      }

      // 4. FREEZER SIMULATION
      log("Simulation Espace Congélateur...");
      const timelineData: {day: number, volume: number, isDelivery: boolean}[] = [];
      const pickupListGenerated: Product[] = [];
      
      let currentVol = 0;
      let deliveryIdx = 1;
      
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
          
          if (deliveryIdx <= 4) {
              const items = queues[deliveryIdx];
              if (items && items.length > 0) {
                  let deliveryVol = 0;
                  items.forEach(i => {
                      const q = i.quantities[deliveryIdx];
                      const v = (i.product.totalWeightGrams! / 1000 * 2.20462 * q) / LBS_PER_CU_FT;
                      deliveryVol += v;
                  });

                  const hasSpace = (currentVol + deliveryVol) <= (totalUsableSpace * 1.1);
                  const isTime = day === 1 || (currentVol < totalUsableSpace * 0.2); 

                  if (isTime) {
                      if (!hasSpace) {
                          log(`⚠️ Manque d'espace (Liv #${deliveryIdx}). Transfert vers Ramassage.`);
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
                  deliveryIdx++;
              }
          } else {
              timelineData.push({ day, volume: currentVol, isDelivery: false });
          }
      }

      setGeneratedCart(targetCart);
      setPickupItems(pickupListGenerated);
      setTimeline(timelineData);
      setTotalCost(currentCost);
      
      setTimeout(() => setIsSimulating(false), 800);
  };

  const handleFinalize = () => {
      setClientInfo(localClient);
      setEvaluationData(localData);
      onApplyPlan(generatedCart, pickupItems);
  };

  return (
    <div className="min-h-[600px] flex flex-col bg-slate-50 relative">
      
      {/* --- AI COMPANION (SIDE PANEL) --- */}
      {isChatOpen && (
          <div className="absolute right-0 top-16 bottom-0 w-80 md:w-96 bg-white shadow-2xl z-40 border-l border-gray-200 animate-in slide-in-from-right">
              <div className="flex justify-between items-center p-3 border-b bg-purple-50">
                  <span className="font-bold text-purple-800 flex items-center gap-2"><Sparkles className="w-4 h-4"/> Assistant IA</span>
                  <button onClick={() => setIsChatOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-red-500"/></button>
              </div>
              <div className="h-full pb-10">
                  <KnowledgeChat />
              </div>
          </div>
      )}

      {/* --- WIZARD HEADER --- */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-30 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Wand2 className="w-6 h-6 text-purple-600"/> Le Magicien
              </h2>
              <div className="hidden md:flex items-center gap-2 text-sm ml-8">
                  <span className={`px-3 py-1 rounded-full transition-colors ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400'}`}>1. Diagnostic</span>
                  <div className="w-4 h-0.5 bg-gray-200"></div>
                  <span className={`px-3 py-1 rounded-full transition-colors ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400'}`}>2. Personnalisation</span>
                  <div className="w-4 h-0.5 bg-gray-200"></div>
                  <span className={`px-3 py-1 rounded-full transition-colors ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-400'}`}>3. Plan</span>
              </div>
          </div>
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isChatOpen ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 hover:bg-purple-50 text-slate-600'}`}
          >
              <MessageSquare className="w-4 h-4"/> 
              <span className="hidden sm:inline">Assistant</span>
          </button>
      </div>

      {/* --- CONTENT AREA --- */}
      <div className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full">
          
          {/* STEP 1: DIAGNOSTIC (Family + Freezer + Persona High Level) */}
          {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-8 fade-in">
                  
                  {/* HERO QUESTION */}
                  <div className="text-center mb-10">
                      <h3 className="text-3xl font-bold text-slate-800 mb-2">Commençons par le commencement.</h3>
                      <p className="text-slate-500">Qui sommes-nous en train de servir aujourd'hui ?</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                      {/* Family Card */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> Composition Familiale</h3>
                          <div className="flex justify-between items-center gap-4">
                              <div className="text-center">
                                  <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Adultes</span>
                                  <input type="number" min="1" value={localData.adults} onChange={e => setLocalData({...localData, adults: parseInt(e.target.value)})} className="w-16 h-16 text-center font-bold text-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none"/>
                              </div>
                              <div className="text-center">
                                  <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Ados</span>
                                  <input type="number" min="0" value={localData.teens} onChange={e => setLocalData({...localData, teens: parseInt(e.target.value)})} className="w-16 h-16 text-center font-bold text-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none"/>
                              </div>
                              <div className="text-center">
                                  <span className="block text-xs font-bold text-gray-400 uppercase mb-2">Enfants</span>
                                  <input type="number" min="0" value={localData.children} onChange={e => setLocalData({...localData, children: parseInt(e.target.value)})} className="w-16 h-16 text-center font-bold text-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none"/>
                              </div>
                          </div>
                      </div>

                      {/* Freezer Card */}
                      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><ThermometerSnowflake className="w-5 h-5 text-blue-600"/> Capacité de Stockage</h3>
                          
                          <div className="space-y-6">
                              <div>
                                  <div className="flex justify-between text-sm mb-2">
                                      <span className="font-bold text-slate-700">Frigo (Standard)</span>
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
                                  <div className="flex justify-between text-sm mb-2">
                                      <span className="font-bold text-slate-700">Congélateur Tombeau</span>
                                      <span className="text-blue-600 font-bold">{localClient.chestFreezerCapacity > 0 ? localClient.chestFreezerCapacity + ' pi³' : 'Aucun'}</span>
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
                          </div>
                      </div>
                  </div>

                  {/* Persona Selection (The Trigger) */}
                  <div className="mt-10">
                       <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-600"/> Choisissez un Profil de Départ</h3>
                       <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          {PERSONA_TEMPLATES.map(p => {
                              const Icon = getPersonaIcon(p.iconName);
                              const isSelected = localData.selectedPersonaId === p.id;
                              return (
                                  <button 
                                    key={p.id}
                                    onClick={() => applyPersona(p.id)}
                                    className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden ${isSelected ? 'border-purple-600 bg-purple-50 shadow-lg scale-105' : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-md'}`}
                                  >
                                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-400 group-hover:text-purple-600'}`}>
                                          <Icon className="w-6 h-6" />
                                      </div>
                                      <h4 className={`font-bold text-sm mb-1 ${isSelected ? 'text-purple-900' : 'text-slate-700'}`}>{p.label}</h4>
                                      <p className="text-[10px] text-gray-500 leading-tight">{p.description}</p>
                                      
                                      {/* Editable Budget Display on Card */}
                                      <div className={`mt-4 pt-3 border-t ${isSelected ? 'border-purple-200' : 'border-gray-100'}`}>
                                           <p className="text-[9px] uppercase font-bold text-gray-400 mb-1">Budget Cible</p>
                                           <div className="flex items-center gap-1">
                                               <span className="text-xs font-bold text-slate-400">$</span>
                                               <span className={`font-bold text-lg ${isSelected ? 'text-purple-700' : 'text-slate-600'}`}>
                                                   {p.defaultBudget}
                                               </span>
                                               <span className="text-[9px] text-gray-400">/sem</span>
                                           </div>
                                      </div>

                                      {isSelected && <div className="absolute top-3 right-3 text-purple-600"><CheckCircle2 className="w-5 h-5"/></div>}
                                  </button>
                              )
                          })}
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 2: PREFERENCES & BUDGET ADJUSTMENT */}
          {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-8 fade-in h-full flex flex-col">
                  {isApplyingPersona ? (
                      <div className="flex-1 flex flex-col items-center justify-center">
                          <Wand2 className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
                          <h3 className="text-xl font-bold text-purple-900">Le Magicien prépare le terrain...</h3>
                          <p className="text-purple-600">Chargement des préférences basées sur le profil.</p>
                      </div>
                  ) : (
                      <>
                          {/* Top Bar: Budget Control */}
                          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex items-center gap-3">
                                  <div className="bg-green-100 p-2 rounded-xl text-green-700"><DollarSign className="w-6 h-6"/></div>
                                  <div>
                                      <h3 className="font-bold text-slate-800">Budget Cible</h3>
                                      <p className="text-xs text-gray-500">Montant hebdomadaire visé</p>
                                  </div>
                              </div>
                              <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200 relative">
                                      <div className="px-2 text-center">
                                          <input 
                                              type="number" 
                                              value={localData.targetWeeklyBudget}
                                              onChange={(e) => setLocalData(d => ({...d, targetWeeklyBudget: parseInt(e.target.value) || 0}))}
                                              className="block text-2xl font-bold text-slate-800 bg-transparent text-center w-24 outline-none border-b border-gray-300 focus:border-purple-500"
                                          />
                                          <span className="text-[9px] text-gray-400 uppercase font-bold block mt-1">Par Semaine</span>
                                      </div>
                                  </div>
                                  <button 
                                      onClick={autoAdjustFrequencies}
                                      className="p-3 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors flex items-center gap-2 text-xs font-bold shadow-sm"
                                      title="Ajuster automatiquement les quantités selon ce budget"
                                  >
                                      <Wand2 className="w-4 h-4" />
                                      Ajuster les quantités
                                  </button>
                              </div>
                          </div>

                          {/* The Butcher's Interface */}
                          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex-1 overflow-hidden flex flex-col">
                              <div className="flex flex-col md:flex-row items-center gap-3 mb-4 flex-shrink-0 justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="bg-slate-900 text-white p-2 rounded-lg"><ChefHat className="w-5 h-5"/></div>
                                    <h3 className="text-xl font-bold text-slate-800">Ajustement des Habitudes</h3>
                                  </div>
                                  
                                  {/* Tab Selector for Categories */}
                                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
                                    {butcherCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveCategoryTab(cat.id)}
                                            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeCategoryTab === cat.id ? `${cat.bg} ${cat.color} border-transparent` : 'bg-gray-50 text-gray-500 border-gray-200'}`}
                                        >
                                            <span className="mr-1">{typeof cat.icon === 'string' ? cat.icon : ''}</span>
                                            {cat.label}
                                        </button>
                                    ))}
                                  </div>
                              </div>
                              
                              <div className="overflow-y-auto pr-2 custom-scrollbar pb-4 flex-1">
                                  {butcherCategories.filter(c => c.id === activeCategoryTab).map(cat => (
                                      <div key={cat.id} className={`rounded-2xl border ${cat.bg} ${cat.color.replace('text', 'border')} border-opacity-30 overflow-hidden flex flex-col h-full`}>
                                          <div className={`p-3 border-b border-white/50 flex items-center justify-between ${cat.color}`}>
                                              <span className="font-bold flex items-center gap-2 text-sm">
                                                  {typeof cat.icon !== 'string' && cat.icon}
                                                  {cat.label}
                                              </span>
                                              <span className="text-[10px] opacity-70 font-mono font-bold uppercase">Repas/sem</span>
                                          </div>
                                          <div className="p-2 space-y-2 flex-1 overflow-y-auto">
                                              {[1,2,3,4,5,6,7,8,9,10].map(idx => { 
                                                  const slotName = `${cat.prefix}_${idx}`;
                                                  const slotKey = `Custom|${slotName}`;
                                                  const selectedId = localData.customSelections?.[slotName];
                                                  const freq = localData.proteinSubPreferences?.[slotKey] || 0;
                                                  const isHighFreq = freq > 1.5;
                                                  
                                                  // --- DYNAMIC FILTERING LOGIC ---
                                                  // 1. Get IDs already selected in this category (excluding current slot)
                                                  const alreadySelectedIds = [1,2,3,4,5,6,7,8,9,10]
                                                      .filter(i => i !== idx)
                                                      .map(i => localData.customSelections?.[`${cat.prefix}_${i}`])
                                                      .filter(Boolean);

                                                  // 2. Filter candidates
                                                  const candidates = products.filter(p => {
                                                      let matchesCat = false;
                                                      if (cat.id === 'Extra') matchesCat = p.category === 'Prêt-à-manger' || p.category === 'Gibier & Autres';
                                                      else if (cat.id === 'Poisson') matchesCat = p.category.includes('Poisson') || p.category.includes('mer');
                                                      else matchesCat = p.category === cat.id;

                                                      if (!matchesCat) return false;
                                                      if (!p.isAvailable) return false;

                                                      // EXCLUDE DUPLICATES STRICTLY
                                                      return !alreadySelectedIds.includes(p.id);
                                                  });

                                                  return (
                                                      <div key={slotKey} className="flex flex-row items-center gap-2 bg-white/60 p-2 rounded-xl border border-black/5 hover:border-black/10 transition-colors">
                                                          <div className="w-6 text-center text-[10px] font-bold text-gray-400">#{idx}</div>
                                                          <select 
                                                            className="flex-1 text-xs bg-transparent outline-none font-bold text-slate-700 w-full p-1 truncate"
                                                            value={selectedId || ''}
                                                            onChange={(e) => {
                                                                setLocalData(prev => ({
                                                                    ...prev,
                                                                    customSelections: { ...prev.customSelections, [slotName]: e.target.value }
                                                                }))
                                                            }}
                                                          >
                                                              <option value="">-- Choisir Produit --</option>
                                                              {candidates.map(p => <option key={p.id} value={p.id}>{p.name} ({p.format})</option>)}
                                                              {/* Persist currently selected value even if it would be filtered out (edge case) */}
                                                              {selectedId && !candidates.find(c => c.id === selectedId) && (
                                                                  <option value={selectedId}>{products.find(p=>p.id===selectedId)?.name || 'Produit masqué'}</option>
                                                              )}
                                                          </select>
                                                          
                                                          <div className={`flex items-center rounded-lg p-0.5 shrink-0 ${isHighFreq ? 'bg-orange-100 text-orange-700 ring-1 ring-orange-200' : 'bg-slate-800 text-white'}`}>
                                                              <button 
                                                                onClick={() => {
                                                                    const n = Math.max(0, freq - 0.25);
                                                                    setLocalData(prev => ({...prev, proteinSubPreferences: {...prev.proteinSubPreferences, [slotKey]: n}}));
                                                                }} 
                                                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isHighFreq ? 'hover:bg-orange-200' : 'hover:bg-white/20'}`}
                                                                disabled={!selectedId}
                                                              >
                                                                  <Minus className="w-3 h-3" />
                                                              </button>
                                                              <span className="w-8 text-center text-xs font-bold font-mono">{freq.toFixed(2).replace('.00', '')}</span>
                                                              <button 
                                                                onClick={() => {
                                                                    const n = freq + 0.25;
                                                                    setLocalData(prev => ({...prev, proteinSubPreferences: {...prev.proteinSubPreferences, [slotKey]: n}}));
                                                                }} 
                                                                className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${isHighFreq ? 'hover:bg-orange-200' : 'hover:bg-white/20'}`}
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
                              <p className="text-center text-[10px] text-gray-400 mt-2">
                                  <AlertOctagon className="w-3 h-3 inline mr-1" />
                                  Astuce : Max 1.5 par item recommandé (approx. 6x / mois)
                              </p>
                          </div>
                      </>
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
                          <p className="text-slate-500 mb-6">Optimisation budgétaire & Simulation congélateur en cours.</p>
                          <div className="mt-4 bg-white border border-gray-200 p-4 rounded-xl w-full max-w-md h-40 overflow-y-auto font-mono text-xs text-slate-500 shadow-inner">
                              {logs.map((l, i) => <div key={i} className="mb-1 border-b border-gray-50 pb-1">> {l}</div>)}
                          </div>
                      </div>
                  ) : (
                      <>
                        {/* RESULT DASHBOARD */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* FINANCIAL */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-12 h-12 text-green-600"/></div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Budget Hebdo Final</p>
                                <p className="text-4xl font-extrabold text-slate-900 mt-2">{(totalCost/52).toFixed(0)}<span className="text-lg font-normal text-gray-400">$</span></p>
                                
                                <div className="mt-4 flex flex-col gap-2">
                                    <div className="text-xs font-medium flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
                                        <Check className="w-3 h-3"/> Prix bloqué 1 an
                                    </div>
                                    {/* Show target comparison */}
                                    <div className="text-xs text-gray-500">
                                        Cible: {localData.targetWeeklyBudget}$ <span className={totalCost/52 <= (localData.targetWeeklyBudget || 0) ? "text-green-500 font-bold" : "text-orange-500 font-bold"}>
                                            ({totalCost/52 <= (localData.targetWeeklyBudget || 0) ? 'OK' : 'Dépassement'})
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* LOGISTICS */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Snowflake className="w-12 h-12 text-blue-600"/></div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Espace Requis (Max)</p>
                                <p className="text-4xl font-extrabold text-slate-900 mt-2">
                                    {Math.max(...timeline.map(t => t.volume)).toFixed(1)} <span className="text-lg font-normal text-gray-400">pi³</span>
                                </p>
                                <div className="mt-4 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                    <div 
                                        className={`h-full ${Math.max(...timeline.map(t => t.volume)) > totalUsableSpace ? 'bg-red-500' : 'bg-blue-500'}`} 
                                        style={{ width: `${Math.min(100, (Math.max(...timeline.map(t => t.volume)) / totalUsableSpace) * 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-1 text-right">{totalUsableSpace} pi³ disponibles</p>
                            </div>

                            {/* ACTION */}
                            <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between relative overflow-hidden">
                                <div className="relative z-10">
                                    <p className="font-bold text-lg">Prêt à finaliser ?</p>
                                    <p className="text-slate-400 text-sm mt-1">Ce plan génère {generatedCart.length} lignes de commande optimisées.</p>
                                </div>
                                <button 
                                    onClick={handleFinalize}
                                    className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 mt-4 relative z-10"
                                >
                                    Voir le Panier <ArrowRight className="w-4 h-4"/>
                                </button>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
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
      <div className="bg-white border-t border-gray-200 p-4 md:px-8 py-4 flex justify-between items-center sticky bottom-0 z-20 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
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
                      <RotateCcw className="w-4 h-4"/> Recalculer le Scénario
                  </button>
              )
          )}
      </div>
    </div>
  );
};
