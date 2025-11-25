

import React, { useState, useEffect, useMemo } from 'react';
import { BrainCircuit, Calculator, ShieldCheck, Snowflake, ArrowRight, Check, DollarSign, Users, Star, Building, ShoppingBag, AlertOctagon, FileSearch, Lock, Unlock, Zap, PlayCircle, Box, ChevronRight, ChevronLeft, RotateCcw, Truck, Activity } from 'lucide-react';
import { Product, CartItem, EvaluationData, ClientInfo, LockState, OptimizationScorecard, PlannerConfig } from '../types';
import { useCart, useProducts, useClient } from '../contexts/StoreContext';
import { EvaluationSection } from './EvaluationSection';

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

export const SmartPlanner: React.FC<SmartPlannerProps> = ({ products, evaluationData: initialData, clientInfo: initialClient, onApplyPlan }) => {
  const { plannerConfig } = useProducts();
  const { setEvaluationData, setClientInfo } = useClient();
  
  // --- WIZARD STATE ---
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // --- LOCAL DATA BUFFER (So we don't commit until end) ---
  const [localClient, setLocalClient] = useState<ClientInfo>(initialClient);
  const [localData, setLocalData] = useState<EvaluationData>(initialData);
  
  // --- RESULT STATE ---
  const [generatedCart, setGeneratedCart] = useState<CartItem[]>([]);
  const [pickupItems, setPickupItems] = useState<Product[]>([]);
  const [timeline, setTimeline] = useState<{day: number, volume: number, isDelivery: boolean}[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [budgetStatus, setBudgetStatus] = useState<'ok' | 'over' | 'under'>('ok');

  // --- STEP 1: LOGIC (Freezer & Family) ---
  const totalUsableSpace = calculateFreezerSpace(localClient);
  const requiredSpaceForFamily = useMemo(() => {
      const portions = (localData.adults * 1) + (localData.children * 0.5) + (localData.teens * 0.75);
      // Rough rule of thumb: 2.5 cu ft per person for full year bulk buying
      return portions * 2.5;
  }, [localData]);

  // --- STEP 3: THE BRAIN (Simulation) ---
  const runSimulation = async () => {
      setIsSimulating(true);
      setLogs([]);
      const log = (msg: string) => setLogs(prev => [...prev, msg]);
      
      // 1. GATHER REQUIREMENTS
      log("--- PHASE 1: ANALYSE DES BESOINS ---");
      const gramsPerPerson = localData.gramsPerPerson || 150;
      const portions = (localData.adults) + (localData.children * 0.5) + (localData.teens * 0.75);
      const annualDays = 365 - (localData.restaurantFrequency || 0);
      const totalAnnualGrams = portions * gramsPerPerson * (localData.mealsPerWeek/7 * 365); // Rough approximation adjusted for meal freq
      
      log(`Besoin annuel estimé: ${(totalAnnualGrams/1000).toFixed(1)} kg`);
      
      // 2. SELECT PRODUCTS BASED ON HABITS
      let targetCart: CartItem[] = [];
      let currentCost = 0;
      
      const subPrefs = localData.proteinSubPreferences || {};
      
      Object.entries(subPrefs).forEach(([key, freq]) => {
          if (Number(freq) <= 0) return;
          const [cat, subType] = key.split('|');
          
          // Find Product
          let product: Product | undefined;
          if (cat === 'Custom') {
              const prodId = localData.customSelections?.[subType];
              product = products.find(p => p.id === prodId);
          }
          
          if (product) {
              // Calculate Boxes Needed
              // Formula: (Freq/week * 52) * (Portions * Grams) / BoxWeight
              // But we use the simpler integer box logic requested
              // Let's calculate annual boxes needed
              const mealWeightGrams = portions * gramsPerPerson;
              const annualMeals = Number(freq) * 52;
              const annualTotalWeight = mealWeightGrams * annualMeals;
              
              const boxWeight = product.totalWeightGrams || 5000;
              const rawBoxes = annualTotalWeight / boxWeight;
              
              // REMAINDER RULE: C (Round Down) is default
              let boxCount = Math.floor(rawBoxes);
              if (boxCount === 0 && rawBoxes > 0.3) boxCount = 1; // Minimum 1 if significant usage
              
              if (boxCount > 0) {
                  // Distribute across 4 deliveries
                  const baseQty = Math.floor(boxCount / 4);
                  const remainder = boxCount % 4;
                  
                  const quantities = { 1: baseQty, 2: baseQty, 3: baseQty, 4: baseQty };
                  // Distribute remainder to first deliveries
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
      
      log(`Panier initial généré. Coût: ${currentCost.toFixed(2)}$`);

      // 3. BUDGET OPTIMIZATION (OPTION B: DOWNGRADE IF OVER BUDGET)
      const weeklyBudget = plannerConfig.budget.weeklyCap;
      const annualBudget = weeklyBudget * 52;
      
      if (currentCost > annualBudget) {
          log(`⚠️ Budget dépassé (${currentCost.toFixed(2)}$ > ${annualBudget.toFixed(2)}$). Activation Protocole B.`);
          
          // Sort by Price/kg descending (remove expensive stuff first)
          targetCart.sort((a, b) => {
              const priceA = (a.product.salePrice || a.product.price) / (a.product.totalWeightGrams || 1);
              const priceB = (b.product.salePrice || b.product.price) / (b.product.totalWeightGrams || 1);
              return priceB - priceA;
          });
          
          const cheapFillers = products.filter(p => 
              (p.category === 'Boeuf' && p.texture === 'ground') || 
              (p.category === 'Poulet' && p.texture === 'piece')
          ).sort((a, b) => (a.price/a.totalWeightGrams!) - (b.price/b.totalWeightGrams!));
          
          const filler = cheapFillers[0]; // Best value filler
          
          let attempts = 0;
          while (currentCost > annualBudget && attempts < 50) {
              // Find an expensive item to swap
              const expensiveItemIdx = targetCart.findIndex(i => i.product.id !== filler.id && i.product.isPremium);
              
              if (expensiveItemIdx === -1) break; // No more premium items to swap
              
              const item = targetCart[expensiveItemIdx];
              const itemCost = (item.product.salePrice || item.product.price);
              
              // Reduce quantity of expensive item by 1
              // Find a delivery with qty > 0
              const deliveryToReduce = [1,2,3,4].find(d => item.quantities[d] > 0);
              
              if (deliveryToReduce) {
                  item.quantities[deliveryToReduce]--;
                  currentCost -= itemCost;
                  log(`Retrait: 1x ${item.product.name} (-${itemCost.toFixed(2)}$)`);
                  
                  // Inject Filler
                  const fillerCost = (filler.salePrice || filler.price);
                  // Add to same delivery
                  const fillerItem = targetCart.find(i => i.product.id === filler.id);
                  if (fillerItem) {
                      fillerItem.quantities[deliveryToReduce]++;
                  } else {
                      targetCart.push({
                          product: filler,
                          quantities: {[deliveryToReduce]: 1, 1:0, 2:0, 3:0, 4:0} as any,
                          lockState: 'SYSTEM_OPTIMIZED'
                      });
                  }
                  currentCost += fillerCost;
                  log(`Ajout: 1x ${filler.name} (+${fillerCost.toFixed(2)}$)`);
              }
              
              // Cleanup empty items
              if (Object.values(item.quantities).reduce((a,b)=>a+b,0) === 0) {
                  targetCart.splice(expensiveItemIdx, 1);
              }
              
              attempts++;
          }
      }

      // 4. TIME-SERIES & FREEZER LOGIC
      log("--- PHASE 3: SIMULATION TEMPORELLE & LOGISTIQUE ---");
      const timelineData: {day: number, volume: number, isDelivery: boolean}[] = [];
      const pickupListGenerated: Product[] = [];
      
      let currentVolume = 0; // in cu ft
      let activeDeliveryIndex = 1;
      
      // Flatten Deliveries
      const deliveryQueues: {[key: number]: CartItem[]} = {1: [], 2: [], 3: [], 4: []};
      targetCart.forEach(item => {
          [1,2,3,4].forEach(d => {
              if (item.quantities[d] > 0) {
                  deliveryQueues[d].push(item);
              }
          });
      });

      // Simulation Loop (Day 1 to 365)
      // Daily Consumption Rate (Volume)
      const totalAnnualVolume = targetCart.reduce((acc, item) => {
          const qty = Object.values(item.quantities).reduce((a,b)=>a+b,0);
          const lbs = (item.product.totalWeightGrams! / 1000 * 2.20462) * qty;
          return acc + (lbs / LBS_PER_CU_FT);
      }, 0);
      const dailyConsumption = totalAnnualVolume / 365;

      for (let day = 1; day <= 365; day++) {
          // A. Consume Food
          currentVolume = Math.max(0, currentVolume - dailyConsumption);
          
          // B. Check Delivery Trigger
          // Logic: If we have space and a delivery is pending
          if (activeDeliveryIndex <= 4) {
              const nextDeliveryItems = deliveryQueues[activeDeliveryIndex];
              
              if (nextDeliveryItems && nextDeliveryItems.length > 0) {
                  // Calculate Volume of next delivery
                  let deliveryVolume = 0;
                  nextDeliveryItems.forEach(i => {
                      const qty = i.quantities[activeDeliveryIndex];
                      const lbs = (i.product.totalWeightGrams! / 1000 * 2.20462) * qty;
                      deliveryVolume += (lbs / LBS_PER_CU_FT);
                  });

                  // Can we fit it?
                  // Trigger delivery if current stock is low (< 20% capacity) OR it's day 1
                  const isLowStock = currentVolume < (totalUsableSpace * 0.2);
                  const isDay1 = day === 1;
                  
                  if (isDay1 || isLowStock) {
                      // Check overflow
                      if (currentVolume + deliveryVolume > totalUsableSpace) {
                          log(`⚠️ Manque d'espace pour Livraison #${activeDeliveryIndex}. Volume requis: ${deliveryVolume.toFixed(1)} pi³. Dispo: ${(totalUsableSpace - currentVolume).toFixed(1)} pi³.`);
                          
                          // OVERFLOW LOGIC (Store Pickup)
                          // Calculate how much fits
                          const spaceAvailable = totalUsableSpace - currentVolume;
                          
                          // Naive approach: Move largest items to pickup until it fits
                          // Or simply flagging items for pickup
                          // Let's move entire delivery overflow to pickup for simplicity in this simulation
                          // Realistically we'd split. Here we just warn.
                          log(" -> Activation transfert vers ramassage magasin pour surplus.");
                          
                          // Identify bulky items to move
                          nextDeliveryItems.sort((a, b) => (b.product.totalWeightGrams || 0) - (a.product.totalWeightGrams || 0));
                          
                          let removedVol = 0;
                          const needed = (currentVolume + deliveryVolume) - totalUsableSpace;
                          
                          for (const item of nextDeliveryItems) {
                              if (removedVol >= needed) break;
                              // Move 1 unit to pickup
                              if (item.quantities[activeDeliveryIndex] > 0) {
                                  item.quantities[activeDeliveryIndex]--;
                                  pickupListGenerated.push(item.product);
                                  const itemVol = ((item.product.totalWeightGrams!/1000*2.2)/LBS_PER_CU_FT);
                                  removedVol += itemVol;
                                  deliveryVolume -= itemVol;
                              }
                          }
                      }
                      
                      currentVolume += deliveryVolume;
                      timelineData.push({ day, volume: currentVolume, isDelivery: true });
                      log(`Livraison #${activeDeliveryIndex} effectuée au Jour ${day}. Remplissage: ${(currentVolume/totalUsableSpace*100).toFixed(0)}%`);
                      activeDeliveryIndex++;
                  } else {
                      timelineData.push({ day, volume: currentVolume, isDelivery: false });
                  }
              } else {
                  // Empty delivery, skip
                  activeDeliveryIndex++;
              }
          } else {
              timelineData.push({ day, volume: currentVolume, isDelivery: false });
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
    <div className="min-h-[600px] flex flex-col bg-slate-50">
      {/* STEPPER HEADER */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex justify-between items-center max-w-3xl mx-auto">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-slate-900 font-bold' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-slate-900 text-white' : 'bg-gray-100'}`}>1</div>
                  <span className="hidden sm:inline">Famille & Froid</span>
              </div>
              <div className={`h-1 flex-1 mx-4 rounded ${step >= 2 ? 'bg-slate-900' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-slate-900 font-bold' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-slate-900 text-white' : 'bg-gray-100'}`}>2</div>
                  <span className="hidden sm:inline">Habitudes</span>
              </div>
              <div className={`h-1 flex-1 mx-4 rounded ${step >= 3 ? 'bg-slate-900' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-slate-900 font-bold' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-slate-900 text-white' : 'bg-gray-100'}`}>3</div>
                  <span className="hidden sm:inline">Plan</span>
              </div>
          </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
          
          {/* STEP 1: FAMILY & FREEZER */}
          {step === 1 && (
              <div className="space-y-8 animate-in slide-in-from-right-4">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-blue-600"/> La Famille</h3>
                      <div className="grid grid-cols-3 gap-4">
                          <label className="block">
                              <span className="text-sm text-gray-500 font-bold">Adultes</span>
                              <input type="number" value={localData.adults} onChange={e => setLocalData({...localData, adults: parseInt(e.target.value)})} className="w-full border rounded-xl p-2 text-lg font-bold text-center mt-1" />
                          </label>
                          <label className="block">
                              <span className="text-sm text-gray-500 font-bold">Ados</span>
                              <input type="number" value={localData.teens} onChange={e => setLocalData({...localData, teens: parseInt(e.target.value)})} className="w-full border rounded-xl p-2 text-lg font-bold text-center mt-1" />
                          </label>
                          <label className="block">
                              <span className="text-sm text-gray-500 font-bold">Enfants</span>
                              <input type="number" value={localData.children} onChange={e => setLocalData({...localData, children: parseInt(e.target.value)})} className="w-full border rounded-xl p-2 text-lg font-bold text-center mt-1" />
                          </label>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                      <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Snowflake className="w-5 h-5 text-blue-600"/> Configuration Congélateurs</h3>
                      
                      {/* FRIDGE */}
                      <div className="mb-6 pb-6 border-b border-gray-100">
                          <div className="flex justify-between mb-2">
                              <label className="font-bold text-slate-700">Congélateur Frigo (Standard)</label>
                              <span className="text-sm font-bold text-blue-600">Capacité: {localClient.fridgeFreezerCapacity} pi³</span>
                          </div>
                          <div className="flex items-center gap-4">
                              <div className="flex-1">
                                  <span className="text-xs text-gray-500 block mb-1">Taux de remplissage sécuritaire</span>
                                  <input 
                                    type="range" min="0.5" max="1.0" step="0.05" 
                                    value={localClient.fridgeFreezerEfficiency}
                                    onChange={(e) => setLocalClient({...localClient, fridgeFreezerEfficiency: parseFloat(e.target.value)})}
                                    className="w-full accent-blue-600"
                                  />
                              </div>
                              <div className="w-16 text-right font-bold">{(localClient.fridgeFreezerEfficiency * 100).toFixed(0)}%</div>
                          </div>
                      </div>

                      {/* CHEST */}
                      <div>
                          <div className="flex justify-between mb-4">
                              <label className="font-bold text-slate-700">Congélateur Tombeau (Coffre)</label>
                              <select 
                                value={localClient.chestFreezerCapacity} 
                                onChange={(e) => setLocalClient({...localClient, chestFreezerCapacity: parseInt(e.target.value)})}
                                className="border rounded-lg p-1 text-sm font-bold"
                              >
                                  <option value="0">Aucun (0 pi³)</option>
                                  <option value="5">Petit (5 pi³)</option>
                                  <option value="7">Moyen (7 pi³)</option>
                                  <option value="10">Grand (10 pi³)</option>
                                  <option value="15">X-Large (15 pi³)</option>
                              </select>
                          </div>
                          
                          {localClient.chestFreezerCapacity > 0 ? (
                              <div className="flex items-center gap-4 bg-blue-50 p-4 rounded-xl">
                                  <div className="flex-1">
                                      <span className="text-xs text-blue-700 block mb-1">Taux de remplissage (Tombeau)</span>
                                      <input 
                                        type="range" min="0.5" max="1.0" step="0.05" 
                                        value={localClient.chestFreezerEfficiency}
                                        onChange={(e) => setLocalClient({...localClient, chestFreezerEfficiency: parseFloat(e.target.value)})}
                                        className="w-full accent-blue-600"
                                      />
                                  </div>
                                  <div className="w-16 text-right font-bold text-blue-700">{(localClient.chestFreezerEfficiency * 100).toFixed(0)}%</div>
                              </div>
                          ) : (
                              <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-3 text-orange-800 text-sm">
                                  <AlertOctagon className="w-5 h-5"/>
                                  <span>Attention: Sans congélateur tombeau, les livraisons seront plus fréquentes (ou ramassage requis).</span>
                              </div>
                          )}
                      </div>
                      
                      <div className="mt-6 pt-4 border-t border-gray-100 text-center">
                          <p className="text-gray-500 text-sm">Espace Total Utilisable</p>
                          <p className="text-3xl font-bold text-slate-900">{totalUsableSpace.toFixed(2)} pi³</p>
                          <p className={`text-xs font-bold mt-1 ${totalUsableSpace < requiredSpaceForFamily ? 'text-red-500' : 'text-green-500'}`}>
                              {totalUsableSpace < requiredSpaceForFamily ? `Déficit estimé de ${(requiredSpaceForFamily - totalUsableSpace).toFixed(1)} pi³ pour votre famille` : 'Capacité suffisante estimée'}
                          </p>
                      </div>
                  </div>
              </div>
          )}

          {/* STEP 2: HABITS (Reusing Logic) */}
          {step === 2 && (
              <div className="animate-in slide-in-from-right-4">
                  <EvaluationSection 
                    formData={localData} 
                    setFormData={setLocalData} 
                    products={products}
                  />
              </div>
          )}

          {/* STEP 3: RESULTS */}
          {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4">
                  {isSimulating ? (
                      <div className="flex flex-col items-center justify-center py-20">
                          <div className="w-20 h-20 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-6"></div>
                          <h3 className="text-xl font-bold text-slate-800">Simulation en cours...</h3>
                          <div className="mt-4 font-mono text-xs text-slate-500 bg-white p-4 rounded-xl border max-w-md w-full h-32 overflow-y-auto">
                              {logs.map((l, i) => <div key={i} className="mb-1">{l}</div>)}
                          </div>
                      </div>
                  ) : (
                      <>
                        {/* DASHBOARD SUMMARY */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase">Total Annuel</p>
                                <p className="text-3xl font-bold text-slate-900">{totalCost.toFixed(0)}$</p>
                                <p className="text-xs text-green-600">Budget: {(plannerConfig.budget.weeklyCap*52).toFixed(0)}$</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase">Paiement Hebdo</p>
                                <p className="text-3xl font-bold text-slate-900">{(totalCost/52).toFixed(2)}$</p>
                                <p className="text-xs text-gray-400">Sur 52 semaines</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold text-gray-400 uppercase">Items à Ramasser</p>
                                <p className={`text-3xl font-bold ${pickupItems.length > 0 ? 'text-orange-600' : 'text-slate-900'}`}>{pickupItems.length}</p>
                                <p className="text-xs text-gray-400">Surplus congélateur</p>
                            </div>
                        </div>

                        {/* TIMELINE GRAPH */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-5 h-5"/> Simulation Congélateur (365 Jours)</h4>
                            <div className="h-40 flex items-end gap-0.5 w-full">
                                {timeline.filter((_, i) => i % 5 === 0).map((point, i) => {
                                    const heightPct = Math.min(100, (point.volume / totalUsableSpace) * 100);
                                    return (
                                        <div key={i} className="flex-1 flex flex-col justify-end group relative">
                                            <div 
                                                className={`w-full rounded-t-sm transition-all ${point.isDelivery ? 'bg-green-500' : heightPct > 90 ? 'bg-red-400' : 'bg-blue-200'}`} 
                                                style={{ height: `${heightPct}%` }}
                                            ></div>
                                            {point.isDelivery && (
                                                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2">
                                                    <Truck className="w-4 h-4 text-green-600" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="flex justify-between text-xs text-gray-400 mt-2">
                                <span>Jour 1</span>
                                <span>Jour 180</span>
                                <span>Jour 365</span>
                            </div>
                        </div>

                        {/* PICKUP LIST ALERT */}
                        {pickupItems.length > 0 && (
                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                                <h4 className="font-bold text-orange-800 flex items-center gap-2"><ShoppingBag className="w-5 h-5"/> Surplus à Ramasser (Option B)</h4>
                                <p className="text-sm text-orange-700 mb-2">Ces articles ne rentrent pas dans le congélateur lors des livraisons prévues. Ils sont ajoutés à votre liste de ramassage en magasin.</p>
                                <div className="flex gap-2 overflow-x-auto pb-2">
                                    {pickupItems.map((p, i) => (
                                        <span key={i} className="text-xs bg-white border border-orange-100 px-2 py-1 rounded text-orange-800 whitespace-nowrap">{p.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                      </>
                  )}
              </div>
          )}
      </div>

      {/* FOOTER CONTROLS */}
      <div className="bg-white border-t border-gray-200 p-6 flex justify-between items-center">
          <button 
            onClick={() => setStep(Math.max(1, step - 1) as any)}
            disabled={step === 1}
            className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-gray-100 disabled:opacity-50 flex items-center gap-2"
          >
              <ChevronLeft className="w-5 h-5"/> Retour
          </button>

          {step < 3 ? (
              <button 
                onClick={() => setStep(step + 1 as any)}
                className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 shadow-lg"
              >
                  Suivant <ChevronRight className="w-5 h-5"/>
              </button>
          ) : (
              <div className="flex gap-4">
                  <button 
                    onClick={runSimulation}
                    className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-xl font-bold hover:bg-slate-50 flex items-center gap-2"
                  >
                      <RotateCcw className="w-5 h-5"/> Relancer Simulation
                  </button>
                  <button 
                    onClick={handleFinalize}
                    disabled={isSimulating}
                    className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg flex items-center gap-2 disabled:opacity-50"
                  >
                      <Check className="w-5 h-5"/> Valider le Plan
                  </button>
              </div>
          )}
      </div>
    </div>
  );
};
