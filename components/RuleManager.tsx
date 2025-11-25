
import React, { useState, useEffect } from 'react';
import { Sparkles, Plus, Trash2, Power, Save, PlayCircle, Variable, Zap, Filter, Tag, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useProducts } from '../contexts/StoreContext';
import { AutomationRule, RuleTriggerField, RuleOperator, RuleActionType } from '../types';

export const RuleManager: React.FC = () => {
  const { products } = useProducts();
  const [rules, setRules] = useState<AutomationRule[]>(() => {
    try {
      const saved = localStorage.getItem('amq_automation_rules');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isGenerating, setIsGenerating] = useState(false);
  
  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newRule, setNewRule] = useState<Partial<AutomationRule>>({
    active: true,
    trigger: { field: 'name', operator: 'contains', value: '' },
    action: { type: 'set_season', value: 'summer' }
  });

  useEffect(() => {
    localStorage.setItem('amq_automation_rules', JSON.stringify(rules));
  }, [rules]);

  // --- ACTIONS ---
  const addRule = () => {
    if (!newRule.name || !newRule.trigger?.value) return;
    
    const rule: AutomationRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name || 'Nouvelle Règle',
      active: true,
      trigger: newRule.trigger as AutomationRule['trigger'],
      action: newRule.action as AutomationRule['action'],
    };
    
    setRules([...rules, rule]);
    setIsCreating(false);
    setNewRule({
        active: true,
        trigger: { field: 'name', operator: 'contains', value: '' },
        action: { type: 'set_season', value: 'summer' }
    });
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(r => r.id !== id));
  };

  // --- AI GENERATION ---
  const generateRulesWithAI = async () => {
    setIsGenerating(true);
    try {
      const sampleProducts = products.slice(0, 40).map(p => ({ name: p.name, category: p.category, price: p.price }));
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `
        Analyze this list of products and suggest 3-5 logical automation rules to organize the catalog.
        
        Product Sample:
        ${JSON.stringify(sampleProducts)}

        Return ONLY a JSON array of objects fitting this interface:
        {
          name: string (e.g. "Flag Wagyu as Premium"),
          trigger: {
            field: "name" | "category" | "price",
            operator: "contains" | "equals" | "greater_than",
            value: string | number
          },
          action: {
            type: "set_season" | "set_category" | "flag_premium" | "set_consumption" | "exclude",
            value: string | number | boolean
          }
        }

        Examples:
        - If name contains "BBQ", action set_season "summer".
        - If name contains "Ragoût", action set_season "winter".
        - If price greater_than 200, action flag_premium true.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const suggestions = JSON.parse(result.text || "[]");
      
      if (Array.isArray(suggestions)) {
        const convertedRules: AutomationRule[] = suggestions.map((s: any) => ({
            id: `ai_${Date.now()}_${Math.random().toString(36).substr(2,4)}`,
            name: s.name,
            active: true,
            trigger: s.trigger,
            action: s.action
        }));
        setRules(prev => [...prev, ...convertedRules]);
      }
    } catch (e) {
      console.error("AI Rule Gen Error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-slate-800 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500"/> Règles d'Automation</h4>
            <div className="flex gap-2">
                <button 
                    onClick={generateRulesWithAI}
                    disabled={isGenerating}
                    className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50"
                    title="Générer avec IA"
                >
                    <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`}/>
                </button>
                <button 
                    onClick={() => setIsCreating(!isCreating)}
                    className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors"
                >
                    <Plus className="w-4 h-4"/>
                </button>
            </div>
        </div>

        {/* CREATE FORM */}
        {isCreating && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4 animate-in slide-in-from-top-2">
                <input 
                    type="text" 
                    placeholder="Nom de la règle (ex: BBQ Été)"
                    className="w-full mb-3 p-2 text-sm border rounded-lg"
                    value={newRule.name || ''}
                    onChange={e => setNewRule({...newRule, name: e.target.value})}
                />
                
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 w-12">SI</span>
                    <select 
                        className="p-1.5 text-xs border rounded bg-white flex-1"
                        value={newRule.trigger?.field}
                        onChange={e => setNewRule({...newRule, trigger: { ...newRule.trigger!, field: e.target.value as any }})}
                    >
                        <option value="name">Nom</option>
                        <option value="category">Catégorie</option>
                        <option value="price">Prix</option>
                    </select>
                    <select 
                        className="p-1.5 text-xs border rounded bg-white flex-1"
                        value={newRule.trigger?.operator}
                        onChange={e => setNewRule({...newRule, trigger: { ...newRule.trigger!, operator: e.target.value as any }})}
                    >
                        <option value="contains">Contient</option>
                        <option value="equals">Égal à</option>
                        <option value="greater_than">Supérieur à</option>
                    </select>
                </div>
                
                <input 
                    type="text" 
                    placeholder="Valeur (ex: BBQ)"
                    className="w-full mb-3 p-2 text-sm border rounded-lg ml-[3.25rem] w-[calc(100%-3.25rem)]"
                    value={newRule.trigger?.value}
                    onChange={e => setNewRule({...newRule, trigger: { ...newRule.trigger!, value: e.target.value }})}
                />

                <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-slate-400 w-12">ALORS</span>
                    <select 
                        className="p-1.5 text-xs border rounded bg-white flex-1"
                        value={newRule.action?.type}
                        onChange={e => setNewRule({...newRule, action: { ...newRule.action!, type: e.target.value as any }})}
                    >
                        <option value="set_season">Définir Saison</option>
                        <option value="set_category">Définir Catégorie</option>
                        <option value="flag_premium">Marquer Premium</option>
                        <option value="exclude">Exclure</option>
                    </select>
                    <input 
                        type="text" 
                        placeholder="Valeur (ex: summer)"
                        className="p-1.5 text-xs border rounded bg-white flex-1"
                        value={String(newRule.action?.value || '')}
                        onChange={e => setNewRule({...newRule, action: { ...newRule.action!, value: e.target.value }})}
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <button onClick={() => setIsCreating(false)} className="text-xs text-slate-500 hover:text-slate-800">Annuler</button>
                    <button onClick={addRule} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg font-bold">Enregistrer</button>
                </div>
            </div>
        )}

        {/* RULE LIST */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {rules.length === 0 && !isCreating && (
                <div className="text-center py-8 text-gray-400 text-xs italic">
                    Aucune règle active. <br/> Cliquez sur <Sparkles className="w-3 h-3 inline"/> pour générer.
                </div>
            )}
            
            {rules.map(rule => (
                <div key={rule.id} className={`p-3 rounded-xl border transition-all ${rule.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <button onClick={() => toggleRule(rule.id)} className={`w-8 h-4 rounded-full relative transition-colors ${rule.active ? 'bg-green-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${rule.active ? 'left-4.5' : 'left-0.5'}`}></div>
                            </button>
                            <span className="font-bold text-sm text-slate-700">{rule.name}</span>
                        </div>
                        <button onClick={() => deleteRule(rule.id)} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-gray-50 p-1.5 rounded-lg">
                        <Filter className="w-3 h-3 text-blue-400"/>
                        <span className="font-mono bg-white px-1 border rounded">{rule.trigger.field}</span>
                        <span>{rule.trigger.operator === 'contains' ? '≈' : '='}</span>
                        <span className="font-bold text-slate-700">"{rule.trigger.value}"</span>
                        <ArrowRight className="w-3 h-3 text-gray-300 mx-1"/>
                        <Tag className="w-3 h-3 text-purple-400"/>
                        <span className="font-mono">{rule.action.type}</span>
                        <span className="font-bold text-slate-700">"{String(rule.action.value)}"</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
