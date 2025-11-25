

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Truck, Utensils, ChefHat, ArrowRightLeft, Sparkles, Clock, X, Loader, Lock, LockOpen } from 'lucide-react';
import { CartItem, EvaluationData, Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface CalendarSectionProps {
  cart: CartItem[];
  evaluationData: EvaluationData;
}

interface Recipe {
    title: string;
    time: string;
    difficulty: string;
    ingredients: string[];
    steps: string[];
}

export const CalendarSection: React.FC<CalendarSectionProps> = ({ cart, evaluationData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<any[]>([]);
  
  // Interaction State
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [isSwapMode, setIsSwapMode] = useState(false);
  
  // Recipe AI State
  const [selectedProductForRecipe, setSelectedProductForRecipe] = useState<Product | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[] | null>(null);
  const [isRecipeLoading, setIsRecipeLoading] = useState(false);

  // SRE: Temporal Edge Case Fix (Timezone Safe)
  const getStartDate = () => { 
    // Create Date in UTC to avoid DST jumps
    const now = new Date();
    const utcNow = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    let date = new Date(utcNow);
    date.setUTCDate(date.getUTCDate() + 7); 
    // Align to Monday
    while (date.getUTCDay() !== 1) date.setUTCDate(date.getUTCDate() + 1); 
    return date; 
  };

  // SRE: Idempotency Fix (Deterministic Random)
  const pseudoRandom = (seed: number) => {
      let x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
  };

  useEffect(() => {
    // Only generate if empty to preserve manual swaps
    if (calendarData.length > 0) return;

    const mealsPerWeek = Math.max(0, evaluationData.mealsPerWeek || 7); 
    const gramsPerPerson = Math.max(0, evaluationData.gramsPerPerson || 0);
    if (cart.length === 0 || gramsPerPerson === 0 || mealsPerWeek === 0) { setCalendarData([]); return; }
    
    const plan = [];
    let currentSimulationDate = getStartDate();
    // Explicit Year Boundary Handling
    const endSimulationDate = new Date(currentSimulationDate);
    endSimulationDate.setUTCFullYear(endSimulationDate.getUTCFullYear() + 1);

    const getFreqFactor = (f: string) => f === 'full' ? 1 : f === 'biweekly' ? 0.5 : 0.14;
    const avgConsumption = (evaluationData.adults + (evaluationData.teens * getFreqFactor(evaluationData.teensFrequency)) + (evaluationData.children * 0.5 * getFreqFactor(evaluationData.childrenFrequency))) * gramsPerPerson;
    
    if (avgConsumption <= 0) { setCalendarData([]); return; } 

    let stockByDelivery: {[key: number]: {staple: Product[], quick: Product[], roast: Product[]}} = {};
    cart.forEach(item => {
        if (item.product.isBreakfast || item.product.isAppetizer) return; 
        [1, 2, 3, 4].forEach(liv => {
            const qty = item.quantities[liv] || 0;
            if (qty > 0) {
                const totalGrams = (item.product.totalWeightGrams || 0) * qty;
                const mealsCount = Math.floor(totalGrams / avgConsumption); 
                for(let i=0; i<mealsCount; i++) {
                    stockByDelivery[liv] = stockByDelivery[liv] || { staple: [], quick: [], roast: [] };
                    if (item.product.consumptionType === 'staple') stockByDelivery[liv].staple.push(item.product);
                    else if (item.product.consumptionType === 'quick') stockByDelivery[liv].quick.push(item.product);
                    else if (item.product.consumptionType === 'roast') stockByDelivery[liv].roast.push(item.product);
                    else stockByDelivery[liv].staple.push(item.product);
                }
            }
        });
    });

    // SRE Fix: Deterministic Sort
    Object.keys(stockByDelivery).forEach(key => {
        const liv = parseInt(key);
        // Use a fixed seed + product ID for deterministic shuffle
        const seed = currentSimulationDate.getTime() + liv; 
        
        const sorter = (a: Product, b: Product) => {
            const valA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const valB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return pseudoRandom(valA + seed) - pseudoRandom(valB + seed);
        };

        stockByDelivery[liv].staple.sort(sorter);
        stockByDelivery[liv].quick.sort(sorter);
        stockByDelivery[liv].roast.sort(sorter);
    });

    let activeDelivery = 1;
    let currentStock = { staple: [...(stockByDelivery[1]?.staple || [])], quick: [...(stockByDelivery[1]?.quick || [])], roast: [...(stockByDelivery[1]?.roast || [])] };
    let history: { date: Date, productId: string, category: string, texture?: string }[] = [];
    let mealsPlannedThisWeek = 0;
    
    while (currentSimulationDate < endSimulationDate) {
        // Use UTC date for data object
        const safeDate = new Date(currentSimulationDate);
        const dayPlan: any = { date: safeDate };
        const dayOfWeek = safeDate.getUTCDay(); 
        
        if (dayOfWeek === 1) mealsPlannedThisWeek = 0; // Reset on Monday

        const uiIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const isEatingDay = (evaluationData.proteinDays || [1,1,1,1,1,1,1])[uiIndex] === 1;

        const shouldEat = isEatingDay && mealsPlannedThisWeek < mealsPerWeek;

        if ((currentStock.staple.length + currentStock.quick.length + currentStock.roast.length) === 0) {
            if (activeDelivery <= 4 && stockByDelivery[activeDelivery]) {
                currentStock.staple = [...(stockByDelivery[activeDelivery]?.staple || [])];
                currentStock.quick = [...(stockByDelivery[activeDelivery]?.quick || [])];
                currentStock.roast = [...(stockByDelivery[activeDelivery]?.roast || [])];
                dayPlan.isDeliveryDay = true; 
                dayPlan.deliveryIndex = activeDelivery;
                activeDelivery++;
            }
        }
        
        if (plan.length === 0 && !dayPlan.isDeliveryDay) {
             dayPlan.isDeliveryDay = true; 
             dayPlan.deliveryIndex = 1; 
        }

        if (shouldEat) {
            let selectedMeal: Product | undefined;
            let availableMealTypes: ('roast' | 'quick' | 'staple')[] = [];
            
            if (dayOfWeek === 0 && currentStock.roast.length > 0) availableMealTypes.push('roast');
            if ((dayOfWeek === 5 || dayOfWeek === 6) && currentStock.quick.length > 0) availableMealTypes.push('quick');
            if (dayOfWeek >= 1 && dayOfWeek <= 4 && currentStock.staple.length > 0) availableMealTypes.push('staple');

            if (availableMealTypes.length === 0) {
                if (currentStock.quick.length > 0) availableMealTypes.push('quick');
                if (currentStock.staple.length > 0) availableMealTypes.push('staple');
            }
            
            for (const type of availableMealTypes) {
                const stockArray = currentStock[type];
                if (stockArray.length > 0) {
                    const lastMealCategory = history.length > 0 ? history[history.length - 1].category : '';
                    const lastTexture = history.length > 0 ? history[history.length-1].texture : '';
                    
                    let candidates = stockArray.filter(p => p.category !== lastMealCategory && p.texture !== lastTexture);
                    
                    if(history.length >= 3) {
                        const recentGround = history.slice(-3).filter(h => h.texture === 'ground').length;
                        if(recentGround > 0) {
                            candidates = candidates.filter(p => p.texture !== 'ground');
                        }
                    }

                    if (candidates.length === 0) candidates = stockArray;

                    let mealToUse = candidates.length > 0 ? candidates[0] : stockArray[0];

                    if (mealToUse) {
                        const index = stockArray.findIndex(p => p.id === mealToUse.id);
                        if(index > -1) stockArray.splice(index, 1);
                        selectedMeal = mealToUse;
                        break;
                    }
                }
            }
            
            if (selectedMeal) { 
                dayPlan.meal = selectedMeal; 
                dayPlan.locked = false; // Default unlocked
                history.push({ 
                    date: safeDate, 
                    productId: selectedMeal.id, 
                    category: selectedMeal.category,
                    texture: selectedMeal.texture
                });
                mealsPlannedThisWeek++;
            } else { dayPlan.isFreeDay = true; } 
        } else { dayPlan.isFreeDay = true; }

        plan.push(dayPlan);
        // Increment safely
        currentSimulationDate.setUTCDate(currentSimulationDate.getUTCDate() + 1);
    }
    setCalendarData(plan);
  }, [cart, evaluationData]); 

  const handleDayClick = (day: any, index: number) => {
      if (isSwapMode) {
          if (selectedDayIndex === null) {
              // Select first day
              setSelectedDayIndex(index);
          } else {
              // Swap logic
              const newData = [...calendarData];
              const dayA = newData[selectedDayIndex];
              const dayB = newData[index];
              
              // Swap meals
              const tempMeal = dayA.meal;
              const tempFree = dayA.isFreeDay;
              
              dayA.meal = dayB.meal;
              dayA.isFreeDay = dayB.isFreeDay;
              
              dayB.meal = tempMeal;
              dayB.isFreeDay = tempFree;
              
              // SRE: LOCK ON INTERACTION (Contradicting Logic Fix)
              // If user manually swaps, it becomes USER_PINNED logic (visually represented by lock)
              if (dayA.meal) dayA.locked = true;
              if (dayB.meal) dayB.locked = true;

              setCalendarData(newData);
              setSelectedDayIndex(null);
          }
      } else {
          // Open Recipe Modal if meal exists
          if (day.meal) {
              fetchRecipes(day.meal);
          }
      }
  };

  const fetchRecipes = async (product: Product) => {
      setSelectedProductForRecipe(product);
      setGeneratedRecipes(null);
      setIsRecipeLoading(true);

      try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `
            Suggest 3 distinct, delicious recipes for "${product.name}".
            Format response as JSON array:
            [{ "title": "Recipe Name", "time": "30 mins", "difficulty": "Easy", "ingredients": ["ing1", "ing2"], "steps": ["step1", "step2"] }]
            Keep it concise.
          `;
          
          const result = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          
          const recipes = JSON.parse(result.text || "[]");
          setGeneratedRecipes(recipes);
      } catch (e) {
          console.error("Recipe gen error", e);
      } finally {
          setIsRecipeLoading(false);
      }
  };

  const daysInMonth = useMemo(() => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startOfMonth = new Date(year, month, 1);
      // Find the index in calendarData for the first day of this month
      // Note: Comparing local date components because Calendar UI is local time
      const startIndex = calendarData.findIndex(d => {
          const date = d.date; // These are JS dates
          return date.getMonth() === month && date.getFullYear() === year;
      });
      
      if (startIndex === -1) return [];

      const days = [];
      // Get all days for this month
      let i = startIndex;
      while(i < calendarData.length && calendarData[i].date.getMonth() === month) {
          days.push({ ...calendarData[i], globalIndex: i });
          i++;
      }

      const firstDayOfMonth = startOfMonth.getDay(); 
      const paddingStart = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; 
      const paddedDays = Array(paddingStart).fill(null);
      return paddedDays.concat(days);
  }, [currentDate, calendarData]);
  
  const getCategoryColor = (cat: string) => {
      switch(cat) {
          case 'Boeuf': return 'bg-red-50 text-red-900 border-red-100';
          case 'Poulet': return 'bg-orange-50 text-orange-900 border-orange-100';
          case 'Porc': return 'bg-pink-50 text-pink-900 border-pink-100';
          case 'Poisson/Fruits de mer': return 'bg-blue-50 text-blue-900 border-blue-100';
          case 'Prêt-à-manger': return 'bg-violet-50 text-violet-900 border-violet-100';
          default: return 'bg-gray-50 text-gray-800 border-gray-200';
      }
  };

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto relative">
        <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3"><CalendarIcon className="w-7 h-7 text-red-600" /> Chef à la Rescousse</h2>
            <div className="flex items-center gap-3">
                 <button 
                    onClick={() => { setIsSwapMode(!isSwapMode); setSelectedDayIndex(null); }}
                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${isSwapMode ? 'bg-slate-800 text-white shadow-lg' : 'bg-white border border-gray-200 text-slate-700 hover:bg-gray-50'}`}
                 >
                    <ArrowRightLeft className="w-4 h-4"/> {isSwapMode ? 'Mode Échange Actif' : 'Réorganiser'}
                 </button>
                 <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()-1)))} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronLeft className="w-5 h-5 text-slate-600"/></button>
                    <span className="font-bold text-slate-800 w-32 text-center select-none">{currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth()+1)))} className="p-2 hover:bg-white rounded-md transition-colors"><ChevronRight className="w-5 h-5 text-slate-600"/></button>
                </div>
            </div>
        </div>

        {cart.length === 0 ? <div className="text-center py-12 text-slate-400"><Utensils className="w-12 h-12 mx-auto mb-2 opacity-20"/><p>Veuillez générer un plan avec le Magicien.</p></div> : (
            <div className="space-y-4 select-none">
                <div className="grid grid-cols-7 text-center font-bold text-sm text-slate-500 border-b pb-2">
                    {dayLabels.map(day => <span key={day}>{day}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {daysInMonth.map((day, i) => {
                        const isSelected = day && selectedDayIndex === day.globalIndex;
                        return (
                        <div 
                            key={i} 
                            onClick={() => day && handleDayClick(day, day.globalIndex)}
                            className={`
                                h-32 p-1.5 border rounded-xl relative flex flex-col transition-all duration-200 
                                ${!day ? 'invisible' : 'cursor-pointer hover:shadow-md hover:-translate-y-0.5'}
                                ${isSelected ? 'ring-2 ring-slate-800 scale-[1.02] z-10' : ''}
                                ${day?.isDeliveryDay ? 'bg-yellow-50/50 border-yellow-200' : 'bg-white border-gray-100'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1.5">
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${day?.isDeliveryDay ? 'bg-yellow-200 text-yellow-800' : day ? 'text-slate-400 bg-slate-50' : ''}`}>{day ? day.date.getDate() : ''}</span>
                                {day?.isDeliveryDay && <span title={`Livraison #${day.deliveryIndex}`}><Truck className="w-4 h-4 text-yellow-600" /></span>}
                                {day?.locked && <Lock className="w-3 h-3 text-slate-400" />}
                            </div>
                            
                            {day?.meal ? (
                                <div className={`flex-1 p-2 rounded-lg text-xs font-medium border flex flex-col justify-between ${getCategoryColor(day.meal.category)}`}>
                                    <span className="line-clamp-2 leading-tight">{day.meal.name}</span>
                                    <div className="flex justify-between items-end mt-1 opacity-60">
                                        <span className="text-[9px] uppercase tracking-wider">{day.meal.texture}</span>
                                        {!isSwapMode && <ChefHat className="w-3 h-3" />}
                                    </div>
                                </div>
                            ) : day?.isFreeDay ? (
                                <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 rounded-lg"><span className="text-[10px] text-gray-400 italic">Libre / Resto</span></div>
                            ) : null}
                        </div>
                    )})}
                </div>
            </div>
        )}

        {/* Recipe Modal */}
        {selectedProductForRecipe && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                    <div className="p-6 border-b flex justify-between items-start bg-slate-50">
                        <div>
                            <div className="flex items-center gap-2 text-purple-600 font-bold text-xs uppercase tracking-wider mb-2">
                                <Sparkles className="w-4 h-4" /> Suggestions IA
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800">{selectedProductForRecipe.name}</h3>
                            <p className="text-slate-500 text-sm">3 façons délicieuses de cuisiner ce produit.</p>
                        </div>
                        <button onClick={() => setSelectedProductForRecipe(null)} className="p-2 hover:bg-white rounded-full transition-colors"><X className="w-6 h-6 text-slate-400"/></button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                        {isRecipeLoading ? (
                            <div className="flex flex-col items-center justify-center h-64 gap-4">
                                <Loader className="w-10 h-10 text-purple-600 animate-spin" />
                                <p className="text-slate-500 animate-pulse">Le chef réfléchit...</p>
                            </div>
                        ) : (
                            <div className="grid gap-6">
                                {generatedRecipes?.map((recipe, idx) => (
                                    <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-lg text-slate-800">{recipe.title}</h4>
                                            <div className="flex gap-2">
                                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold flex items-center gap-1"><Clock className="w-3 h-3"/> {recipe.time}</span>
                                                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full font-bold">{recipe.difficulty}</span>
                                            </div>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="font-bold text-slate-700 mb-2">Ingrédients</p>
                                                <ul className="list-disc pl-4 space-y-1 text-slate-600">
                                                    {recipe.ingredients.slice(0, 5).map((ing, i) => <li key={i}>{ing}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 mb-2">Préparation</p>
                                                <p className="text-slate-600 line-clamp-4">{recipe.steps.join(' ')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};