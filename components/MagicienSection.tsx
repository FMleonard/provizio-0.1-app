

import React, { useState, useMemo, useEffect } from 'react';
import { BrainCircuit, Sparkles, Wand2, RefreshCw, Target } from 'lucide-react';
import { EvaluationData, Product, CartItem, Settings } from '../types';
import { AMQ_KNOWLEDGE_BASE, PERSONA_TEMPLATES } from '../constants';

interface MagicienSectionProps {
  evaluationData: EvaluationData;
  onApply: (cart: CartItem[]) => void;
  minDeliveryAmount: number;
  products: Product[];
  addToPickupList: (product: Product) => void;
  settings: Settings;
}

export const MagicienSection: React.FC<MagicienSectionProps> = ({ evaluationData, onApply, minDeliveryAmount, products, settings }) => {
  
  // --- 1. ANALYSIS ENGINE: Calculate Needs based on Granular Habits ---
  const analysis = useMemo(() => {
      // Family Composition Factors
      const adults = Math.max(0, evaluationData.adults || 0);
      const teens = Math.max(0, evaluationData.teens || 0);
      const children = Math.max(0, evaluationData.children || 0);
      const gramsPerPerson = Math.max(0, evaluationData.gramsPerPerson || 150);
      
      const portionsPerMeal = adults + teens + (children * 0.5);
      const daysCoverage = 365 - (evaluationData.restaurantFrequency || 0);
      const coverageRatio = daysCoverage / 365;

      const subPrefs = evaluationData.proteinSubPreferences || {};
      const totalWeeklyMeals = Object.values(subPrefs as Record<string, number>).reduce((a: number, b: number) => a + b, 0);

      // Annual Targets per Sub-Category (Kg)
      const targets: Record<string, number> = {};
      let totalAnnualKg = 0;

      Object.entries(subPrefs).forEach(([key, val]) => {
          const weeklyFreq = Number(val);
          if (weeklyFreq > 0) {
              const annualMeals = weeklyFreq * 52 * coverageRatio;
              const annualGrams = annualMeals * (portionsPerMeal * gramsPerPerson);
              const annualKg = annualGrams / 1000;
              targets[key] = annualKg;
              totalAnnualKg += annualKg;
          }
      });

      return {
          totalKg: totalAnnualKg,
          totalMeals: totalWeeklyMeals * 52 * coverageRatio,
          daysCoverage,
          targets,
      };
  }, [evaluationData]);

  // --- State for Adjustments ---
  const [adjustedTargets, setAdjustedTargets] = useState<Record<string, number>>(analysis.targets);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
      setAdjustedTargets(analysis.targets);
  }, [analysis]);

  const handleSliderChange = (key: string, val: number) => {
      setAdjustedTargets(prev => ({ ...prev, [key]: val }));
  };

  const totalAdjustedKg = Object.values(adjustedTargets).reduce((a: number, b: number) => a + b, 0);
  
  const activeTemplate = PERSONA_TEMPLATES.find(p => p.id === evaluationData.selectedPersonaId);

  // --- 2. SMART GENERATION ALGORITHM ---
  const generateProposal = () => {
      setIsGenerating(true);
      
      let availableProducts = products.filter(p => p.isAvailable);
      
      const newCart: CartItem[] = [];
      const deliveries = [1, 2, 3, 4];
      
      // Helper to add to cart
      const addToCart = (product: Product, delivery: number, quantity: number) => {
          const existing = newCart.find(i => i.product.id === product.id);
          if (existing) {
              const currentQty = existing.quantities[delivery] || 0;
              existing.quantities[delivery] = currentQty + quantity;
          } else {
              newCart.push({ 
                  product, 
                  quantities: { [delivery]: quantity },
                  lockState: 'SYSTEM_OPTIMIZED' 
              });
          }
      };

      // Generation Loop: Iterate through each specific habit (e.g. Custom|beef_slot_1)
      Object.entries(adjustedTargets).forEach(([key, val]) => {
          const annualTarget = val as number;
          if (annualTarget <= 0) return;

          const [category, subType] = key.split('|');
          const targetPerDelivery = annualTarget / 4;
          
          let candidates: Product[] = [];

          // HANDLING CUSTOM SLOTS (Now the Primary Logic)
          if (category === 'Custom') {
              const slotName = subType; // e.g. "beef_slot_1" or "boeuf_slot_1"
              const targetSku = evaluationData.customSelections?.[slotName];
              if (targetSku) {
                  // Find exact match
                  candidates = availableProducts.filter(p => p.id === targetSku);
              }
          }

          // Smart Sorting: Best Value & Staples first
          candidates.sort((a, b) => {
               // Prefer staples/base for volume
               if (a.consumptionType === 'staple' && b.consumptionType !== 'staple') return -1;
               if (b.consumptionType === 'staple' && a.consumptionType !== 'staple') return 1;
               return 0;
          });

          // Fill deliveries
          deliveries.forEach(deliveryId => {
              let currentWeight = 0;
              
              for (const product of candidates) {
                  if (currentWeight >= targetPerDelivery) break;

                  const weightKg = (product.totalWeightGrams || 500) / 1000;
                  const safeWeight = weightKg > 0 ? weightKg : 0.5;
                  
                  // Add product
                  addToCart(product, deliveryId, 1);
                  currentWeight += safeWeight;
              }
          });
      });

      // Done
      setTimeout(() => {
          onApply(newCart);
          setIsGenerating(false);
      }, 800);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><Wand2 className="w-8 h-8 text-purple-600" /> Le Magicien des Menus</h2>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
          {/* Analysis Card */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                      <h3 className="text-purple-300 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> Analyse IA (Données 2025)</h3>
                      <div className="space-y-4">
                          {activeTemplate && (
                              <div className="mb-4 bg-white/10 p-2 rounded-lg border border-white/20">
                                  <p className="text-[10px] text-gray-300 uppercase font-bold">Package Actif</p>
                                  <p className="text-sm font-bold text-white flex items-center gap-2">
                                      {activeTemplate.label}
                                  </p>
                              </div>
                          )}
                          <div>
                              <p className="text-3xl font-bold">{analysis.totalKg.toFixed(1)} kg</p>
                              <p className="text-sm text-slate-400">Volume Annuel Ciblé</p>
                          </div>
                          <div>
                              <p className="text-xl font-bold">{analysis.totalMeals.toFixed(0)} repas</p>
                              <p className="text-xs text-slate-400">Couverture ({analysis.daysCoverage} jours)</p>
                          </div>
                          <div className="border-t border-white/20 pt-4 mt-4">
                               <p className="text-xs text-gray-400 mb-1">Espace Congélateur Estimé</p>
                               <p className="font-bold text-lg">{(analysis.totalKg * 2.20462 / AMQ_KNOWLEDGE_BASE.freezerLogic.lbsPerCubicFoot).toFixed(1)} pi³</p>
                               <p className="text-[10px] text-gray-500">Basé sur 25 lbs / pi³</p>
                          </div>
                      </div>
                  </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                  <p className="text-xs text-purple-800 font-bold mb-2">Note du Magicien</p>
                  <p className="text-xs text-purple-600">
                      J'ai traduit vos habitudes hebdomadaires en un plan d'achat annuel précis. 
                      Chaque sélection a été mappée à son produit spécifique.
                  </p>
              </div>
          </div>

          {/* Adjustments */}
          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-gray-100">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-blue-600"/> Répartition Détaillée (kg)</h3>
                  <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
                      {Object.keys(adjustedTargets).length === 0 && <p className="text-gray-400 italic text-sm">Aucune habitude sélectionnée dans l'évaluation.</p>}
                      {Object.entries(adjustedTargets).map(([key, val]) => {
                          const value = val as number;
                          const [cat, sub] = key.split('|');
                          
                          // Look up product name for custom slots
                          let label = sub;
                          if (cat === 'Custom') {
                             const prodId = evaluationData.customSelections?.[sub];
                             const product = products.find(p => p.id === prodId);
                             label = product ? product.name : sub;
                          }

                          return (
                              <div key={key}>
                                  <div className="flex justify-between text-sm font-bold mb-2">
                                      <span className="flex items-center gap-2 capitalize">
                                          <span className="text-gray-500 text-xs uppercase">ITEM</span>
                                          {label}
                                      </span>
                                      <span>{Number(value).toFixed(1)} kg</span>
                                  </div>
                                  <input 
                                      type="range" 
                                      min="0" 
                                      max={value * 2 || 10} 
                                      step="0.5" 
                                      value={value} 
                                      onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                  />
                              </div>
                          );
                      })}
                  </div>
              </div>
          </div>
      </div>

      <div className="mt-8 flex justify-end">
          <button 
              onClick={generateProposal}
              disabled={isGenerating || analysis.totalKg === 0}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-purple-200 transition-all flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
              {isGenerating ? <RefreshCw className="w-5 h-5 animate-spin"/> : <Sparkles className="w-5 h-5"/>}
              {isGenerating ? 'Génération en cours...' : 'Générer la Proposition'}
          </button>
      </div>
    </div>
  );
};
