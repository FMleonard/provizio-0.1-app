
import React, { useMemo } from 'react';
import { Scale, Users, CalendarDays, Repeat, Calculator, ChefHat, Beef, Drumstick, Fish, ScrollText, Minus, Plus, UtensilsCrossed, Pencil, ChevronDown, Sparkles, Flame, PiggyBank, Dumbbell, Zap, User, UserPlus, Baby } from 'lucide-react';
import { EvaluationData, Product } from '../types';
import { PERSONA_TEMPLATES, AMQ_KNOWLEDGE_BASE } from '../constants';

interface EvaluationSectionProps {
  formData: EvaluationData;
  setFormData: (data: EvaluationData) => void;
  products?: Product[];
}

export const EvaluationSection: React.FC<EvaluationSectionProps> = ({ formData, setFormData, products = [] }) => {
  const getFreqFactor = (f: string) => f === 'full' ? 52 : f === 'biweekly' ? 26 : 7.4; 
  
  const adults = Math.max(0, Number(formData.adults) || 0);
  const teens = Math.max(0, Number(formData.teens) || 0);
  const children = Math.max(0, Number(formData.children) || 0);
  const gramsPerPerson = Math.max(0, Number(formData.gramsPerPerson) || 0);
  const restaurantFreq = Number(formData.restaurantFrequency) || 0; 
  const annualDaysCoverage = 365 - restaurantFreq;

  // Calculate stats based on new granular preferences
  const totalMealsPerWeek = (Object.values(formData.proteinSubPreferences || {}) as number[]).reduce((a: number, b: number) => a + (Number(b) || 0), 0);
  
  const annualConsumption = useMemo(() => {
     const coverageRatio = annualDaysCoverage / 365;
     // Base Portion Total per Meal
     const portionsPerMeal = adults + teens + (children * 0.5);
     // Total Annual Meals calculated from the Granular List
     const annualMeals = totalMealsPerWeek * 52 * coverageRatio;
     const totalGrams = (portionsPerMeal * gramsPerPerson) * annualMeals;
                        
     if (isNaN(totalGrams) || totalGrams <= 0) return '0';
     return (totalGrams / 1000).toFixed(0); 
  }, [adults, teens, children, totalMealsPerWeek, gramsPerPerson, annualDaysCoverage]);
  
  const setNumericField = (field: keyof EvaluationData, value: string | number) => {
    const numValue = parseInt(value as string);
    setFormData({...formData, [field]: isNaN(numValue) ? 0 : numValue});
  };

  const updateSubPreference = (key: string, delta: number) => {
      const current = (formData.proteinSubPreferences || {})[key] || 0;
      const newVal = Math.max(0, current + delta);
      setFormData({
          ...formData,
          proteinSubPreferences: {
              ...(formData.proteinSubPreferences || {}),
              [key]: newVal
          }
      });
  };
  
  const updateCustomSelection = (slot: string, productId: string) => {
      setFormData({
          ...formData,
          customSelections: {
              ...(formData.customSelections || {}),
              [slot]: productId
          }
      });
  };

  // Expanded Butcher's Categories configuration
  const butcherCategories = [
      { id: 'Boeuf', label: 'Bœuf & Veau', icon: Beef, color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-100', prefix: 'boeuf_slot' },
      { id: 'Poulet', label: 'Volaille', icon: Drumstick, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-100', prefix: 'poulet_slot' },
      { id: 'Porc', label: 'Porc', icon: ChefHat, color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-100', prefix: 'porc_slot' },
      { id: 'Poisson', label: 'Mer', icon: Fish, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100', prefix: 'poisson_slot' },
      { id: 'Extra', label: 'Prêt-à-manger & Extras', icon: UtensilsCrossed, color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-100', prefix: 'extra_slot' }
  ];
  
  // Memoize Candidates for each category
  const candidatesMap = useMemo(() => {
      const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));
      return {
          'Boeuf': sortedProducts.filter(p => p.category === 'Boeuf' || p.name.toLowerCase().includes('veau')),
          'Poulet': sortedProducts.filter(p => p.category === 'Poulet' || p.name.toLowerCase().includes('dinde') || p.name.toLowerCase().includes('canard')),
          'Porc': sortedProducts.filter(p => p.category === 'Porc'),
          'Poisson': sortedProducts.filter(p => p.category.includes('Poisson') || p.category.includes('Fruits de mer')),
          'Extra': sortedProducts.filter(p => p.category === 'Prêt-à-manger' || p.category === 'Epices' || p.category === 'Gibier & Autres')
      };
  }, [products]);

  // --- PERSONA LOGIC ---
  const applyPersona = (personaId: string) => {
      const template = PERSONA_TEMPLATES.find(p => p.id === personaId);
      if (!template) return;

      const newCustomSelections = { ...formData.customSelections };
      const newSubPreferences = { ...formData.proteinSubPreferences };
      
      // Reset current preferences to 0 to avoid messy accumulation
      Object.keys(newSubPreferences).forEach(k => newSubPreferences[k] = 0);

      const usedProductIds = new Set<string>();

      // Apply Rules
      butcherCategories.forEach(cat => {
          const catRules = template.rules[cat.id as keyof typeof template.rules] || [];
          const catCandidates = candidatesMap[cat.id as keyof typeof candidatesMap] || [];
          
          let slotIndex = 1;

          catRules.forEach(rule => {
              // Find best matching product
              let bestMatch: Product | undefined;
              
              for (const keyword of rule.keywords) {
                  bestMatch = catCandidates.find(p => 
                      !usedProductIds.has(p.id) && 
                      p.name.toLowerCase().includes(keyword.toLowerCase())
                  );
                  if (bestMatch) break;
              }

              // Fallback: Just take any available product if specific keyword not found
              if (!bestMatch) {
                  bestMatch = catCandidates.find(p => !usedProductIds.has(p.id));
              }

              if (bestMatch && slotIndex <= 10) {
                  const slotName = `${cat.prefix}_${slotIndex}`;
                  const slotKey = `Custom|${slotName}`;
                  
                  newCustomSelections[slotName] = bestMatch.id;
                  newSubPreferences[slotKey] = rule.freq;
                  
                  usedProductIds.add(bestMatch.id);
                  slotIndex++;
              }
          });
          
          // Clear remaining slots for this category
          for (let i = slotIndex; i <= 10; i++) {
              newSubPreferences[`Custom|${cat.prefix}_${i}`] = 0;
          }
      });

      setFormData({
          ...formData,
          customSelections: newCustomSelections,
          proteinSubPreferences: newSubPreferences
      });
      
      alert(`Profil "${template.label}" appliqué avec succès !`);
  };

  // --- KNOWLEDGE BASE PROFILE LOADER ---
  const loadKnowledgeProfile = (profileId: string) => {
      const profile = AMQ_KNOWLEDGE_BASE.profiles.find(p => p.id === profileId);
      if (!profile) return;

      let newAdults = 0;
      let newTeens = 0;
      let newChildren = 0;

      switch(profileId) {
          case 'single': newAdults = 1; break;
          case 'couple': newAdults = 2; break;
          case 'family_small': newAdults = 2; newChildren = 2; break;
          case 'family_teens': newAdults = 2; newTeens = 2; break;
      }

      setFormData({
          ...formData,
          adults: newAdults,
          teens: newTeens,
          children: newChildren,
          gramsPerPerson: profile.proteinPerSupper // Set specific gram weight from PDF
      });
  };

  const getPersonaIcon = (name: string) => {
      switch(name) {
          case 'Flame': return Flame;
          case 'PiggyBank': return PiggyBank;
          case 'Dumbbell': return Dumbbell;
          case 'Zap': return Zap;
          default: return Sparkles;
      }
  };

  const getProfileIcon = (name: string) => {
      switch(name) {
          case 'User': return User;
          case 'Users': return Users;
          case 'UserPlus': return UserPlus;
          case 'Baby': return Baby;
          default: return User;
      }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3"><Scale className="w-7 h-7 text-red-600" /> Diagnostic Alimentaire</h2>
      
      {/* KNOWLEDGE BASE PROFILES */}
      <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Profils Familiaux (Données 2025)</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AMQ_KNOWLEDGE_BASE.profiles.map(profile => {
                  const Icon = getProfileIcon(profile.icon);
                  return (
                      <button 
                        key={profile.id}
                        onClick={() => loadKnowledgeProfile(profile.id)}
                        className="text-left p-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-800 transition-all hover:scale-[1.02] hover:shadow-md group"
                      >
                          <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                              <span className="font-bold text-sm leading-tight">{profile.label}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 group-hover:text-blue-600/80 leading-tight">{profile.proteinPerSupper}g / repas</p>
                      </button>
                  )
              })}
          </div>
      </div>

      {/* PERSONA SELECTOR */}
      <div className="mb-8 border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">Styles de Consommation</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {PERSONA_TEMPLATES.map(persona => {
                  const Icon = getPersonaIcon(persona.iconName);
                  const colorClass = 
                    persona.color === 'orange' ? 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100' :
                    persona.color === 'green' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' :
                    persona.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' :
                    'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';

                  return (
                      <button 
                        key={persona.id}
                        onClick={() => applyPersona(persona.id)}
                        className={`text-left p-3 rounded-xl border transition-all hover:scale-[1.02] hover:shadow-md ${colorClass}`}
                      >
                          <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-5 h-5" />
                              <span className="font-bold text-sm leading-tight">{persona.label}</span>
                          </div>
                          <p className="text-[10px] opacity-80 leading-tight">{persona.description}</p>
                      </button>
                  )
              })}
          </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 border-t border-gray-100 pt-6">
         {/* LEFT COLUMN: Family Demographics (4 cols) */}
         <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Users className="w-4 h-4"/> Composition</h3>
                <div className="space-y-4">
                    <label className="block">
                        <span className="text-xs font-bold uppercase text-slate-500 mb-1 block">Adultes</span>
                        <div className="flex items-center gap-3">
                            <input type="number" min="0" className="block w-full border rounded-xl p-3 text-lg font-bold text-center" value={formData.adults} onChange={(e) => setNumericField('adults', e.target.value)}/>
                        </div>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-500 mb-1 block">Ados</span>
                            <input type="number" min="0" className="block w-full border rounded-xl p-3 text-lg font-bold text-center" value={formData.teens} onChange={(e) => setNumericField('teens', e.target.value)}/>
                        </label>
                        <label className="block">
                            <span className="text-xs font-bold uppercase text-slate-500 mb-1 block">Enfants</span>
                            <input type="number" min="0" className="block w-full border rounded-xl p-3 text-lg font-bold text-center" value={formData.children} onChange={(e) => setNumericField('children', e.target.value)}/>
                        </label>
                    </div>
                    <label className="block bg-white p-3 rounded-xl border border-gray-200">
                        <span className="text-xs font-bold text-slate-700 mb-1 block">Portion Moyenne (cru)</span>
                        <div className="flex items-center gap-2">
                             <input type="range" min="100" max="600" step="10" className="flex-1 accent-red-600" value={formData.gramsPerPerson} onChange={(e) => setNumericField('gramsPerPerson', e.target.value)}/>
                             <span className="font-bold text-red-600 w-16 text-right">{formData.gramsPerPerson}g</span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-1 italic text-center">Basé sur les standards 2025.</p>
                    </label>
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-sm">
                <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4"/> Style de Vie</h3>
                <div className="mb-4">
                    <span className="text-xs font-bold uppercase text-slate-500 block mb-1">Repas Extérieurs (Resto)</span>
                    <select 
                        className="block w-full border rounded-xl p-2.5 text-sm bg-purple-50 border-purple-100 text-purple-900 font-medium outline-none"
                        value={formData.restaurantFrequency || 0}
                        onChange={(e) => setNumericField('restaurantFrequency', e.target.value)}
                    >
                        <option value={0}>Jamais (0 jours/an)</option>
                        <option value={12}>1x / mois (12 jours/an)</option>
                        <option value={24}>2x / mois (24 jours/an)</option>
                        <option value={52}>1x / semaine (52 jours/an)</option>
                        <option value={104}>2x / semaine (104 jours/an)</option>
                    </select>
                    <p className="text-[10px] text-purple-400 mt-2 text-center">Vous cuisinez environ <strong>{annualDaysCoverage} jours</strong> par an.</p>
                </div>
            </div>
            
            <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 text-center">
                 <p className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-1">Besoin Annuel Estimé</p>
                 <p className="text-4xl font-extrabold text-blue-900">{annualConsumption}<span className="text-lg">kg</span></p>
                 <p className="text-[10px] text-blue-600 mt-1">Pour couvrir vos besoins à 100%</p>
            </div>
         </div>

         {/* RIGHT COLUMN: The Butcher's Questionnaire (8 cols) */}
         <div className="lg:col-span-8 space-y-6">
             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-full">
                 <div className="flex justify-between items-end mb-6">
                     <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2"><Repeat className="w-5 h-5 text-slate-900"/> Habitudes de Consommation</h3>
                        <p className="text-sm text-gray-500">Sélectionnez vos 10 favoris par catégorie et leur fréquence.</p>
                     </div>
                     <div className="text-right">
                         <span className="block text-3xl font-bold text-slate-900">{totalMealsPerWeek}</span>
                         <span className="text-xs font-bold text-slate-400 uppercase">Repas / Semaine</span>
                     </div>
                 </div>
                 
                 <div className="grid md:grid-cols-2 gap-4">
                     {butcherCategories.map((cat) => {
                         const candidates = candidatesMap[cat.id as keyof typeof candidatesMap] || [];
                         
                         return (
                         <div key={cat.id} className={`p-4 rounded-2xl border ${cat.bg} border-opacity-50 ${cat.border}`}>
                             <div className="flex items-center gap-2 mb-4 border-b border-black/5 pb-2">
                                 <cat.icon className={`w-5 h-5 ${cat.color}`} />
                                 <span className={`font-bold ${cat.color}`}>{cat.label}</span>
                             </div>
                             
                             {/* 10 Customizable Slots per Category */}
                             <div className="space-y-2">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => {
                                    const slotName = `${cat.prefix}_${num}`;
                                    const slotKey = `Custom|${slotName}`;
                                    const count = (formData.proteinSubPreferences || {})[slotKey] || 0;
                                    const selectedId = (formData.customSelections || {})[slotName] || '';
                                    
                                    // Duplicate Prevention: Get IDs selected in *other* slots of this category
                                    const otherSelectedIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
                                        .filter(n => n !== num)
                                        .map(n => (formData.customSelections || {})[`${cat.prefix}_${n}`])
                                        .filter(Boolean);

                                    return (
                                        <div key={slotKey} className="flex items-center justify-between bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex-1 min-w-0 mr-2">
                                                <select 
                                                    className="w-full text-xs p-1.5 rounded border border-gray-200 bg-gray-50 focus:bg-white outline-none"
                                                    value={selectedId}
                                                    onChange={(e) => updateCustomSelection(slotName, e.target.value)}
                                                >
                                                    <option value="">-- Choisir Produit {num} --</option>
                                                    {candidates.filter(p => !otherSelectedIds.includes(p.id) || p.id === selectedId).map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1 flex-shrink-0">
                                                <button 
                                                    onClick={() => updateSubPreference(slotKey, -0.25)}
                                                    className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200"
                                                    disabled={!selectedId}
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className={`w-8 text-center font-bold text-sm ${count > 0 ? 'text-slate-900' : 'text-slate-300'}`}>{count}</span>
                                                <button 
                                                    onClick={() => updateSubPreference(slotKey, 0.25)}
                                                    className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-md shadow-sm text-white hover:bg-slate-700 disabled:opacity-50"
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
                     )})}
                 </div>
             </div>

             {/* NOTES SECTION */}
             <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Pencil className="w-4 h-4"/> Notes & Préférences Spécifiques</h3>
                <textarea 
                    className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-slate-900 outline-none transition-all min-h-[100px] text-sm"
                    placeholder="Ex: Le client n'aime pas le poivre, préfère les petites portions, allergie aux fruits de mer..."
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                />
             </div>
         </div>
      </div>
    </div>
  );
};
