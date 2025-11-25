
import React, { useState } from 'react';
import { Utensils, MessageSquare, ChefHat, Plus, Save, AlertCircle } from 'lucide-react';

const MENU_DEGUSTATION = [
  {
    service: "1er Service",
    items: [
      { id: 't1', name: 'Tartare de thon (GRIZZLY)', desc: 'Tartare de thon servi en coquille, relevé d’un zeste de citron.', allergens: 'poisson, soya, crustacés, sésame, sulfites' },
      { id: 't2', name: 'Saumon fumé à chaud (Boucanerie D’Henri)', desc: 'Saumon fumé au bois d’érable, servi tiède avec crème sûre à la ciboulette et filet d’huile d’olive pressée à froid.', allergens: 'produits laitiers, poisson' },
      { id: 't3', name: 'Tataki de thon (Épices Crousset)', desc: 'Thon mi-cuit en croûte de sésame grillé, servi avec une mayonnaise citronnée aux épices québécoises.', allergens: 'poisson, sésame, œuf, soya' }
    ]
  },
  {
    service: "2e Service",
    items: [
      { id: 't4', name: 'Côte levée signature (Épurée)', desc: 'Côte levée tendre et caramélisée, déposée sur une purée de pommes de terre, fromage en grains et oignons verts.', allergens: 'moutarde, soya, traces de poissons' },
      { id: 't5', name: 'Rillette de porcelet (Gaspor & La Belle Excuse)', desc: 'Rillette de porcelet sur craquelin, avec confit d’échalote à la framboise, réduction balsamique et échalotes croustillantes.', allergens: 'sulfites (Peut contenir : lait, soya, noix, sésame)' }
    ]
  },
  {
    service: "3e Service",
    items: [
      { id: 't6', name: 'Poulet sauté mariné (Volailles des Cantons & Épices Crousset)', desc: 'Lanières de poitrine de poulet poêlées aux épices du Québec et crème balsamique.', allergens: 'soya, produits laitiers' },
      { id: 't7', name: 'Poulet au beurre maison', desc: 'Poulet mijoté dans une sauce au beurre crémeuse et parfumée, servi sur riz frit.', allergens: 'soya, produits laitiers' }
    ]
  },
  {
    service: "4e Service",
    items: [
      { id: 't8', name: 'Macreuse de bœuf (Bœuf Angus Certifié & Épurée)', desc: 'Tranchée finement et servie sur une purée d’ail rôti avec tomates confites.', allergens: 'soya, produits laitiers' },
      { id: 't9', name: 'Joue de bœuf braisée (Épurée)', desc: 'Braisée lentement au jus, déposée sur une purée de carottes et échalotes fondantes.', allergens: 'produits laitiers' },
      { id: 't10', name: 'Mini burger (La Belle Excuse)', desc: 'Bœuf haché extra maigre (92 % AMC), cheddar fumé, confit d’échalotes et réduction de balsamique.', allergens: 'produits laitiers, blé, soya' }
    ]
  },
  {
    service: "5e Service",
    items: [
      { id: 't11', name: 'La passion sucrée (Martin Dessert)', desc: 'Bouchée gourmande du moment, conçue sans noix ni arachides. Une finale tout en finesse.', allergens: 'gluten' }
    ]
  }
];

const RATING_OPTIONS = [
  { id: 'want_home', label: 'Je veux à la maison', color: 'text-green-700 bg-green-50 border-green-200' },
  { id: 'love', label: 'J\'aime', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  { id: 'neutral', label: 'Indifférent (Par défaut)', color: 'text-gray-600 bg-gray-100 border-gray-200' },
  { id: 'dislike_mild', label: 'J\'aime moins', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { id: 'hate', label: 'Je déteste', color: 'text-red-700 bg-red-50 border-red-200' },
  { id: 'refuse', label: 'Je refuse de goûter', color: 'text-slate-700 bg-slate-200 border-slate-300' },
];

export const TastingSection: React.FC = () => {
  // Initialize all ratings to 'neutral' (Indifférent)
  const [ratings, setRatings] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    MENU_DEGUSTATION.forEach(service => {
        service.items.forEach(item => {
            initial[item.id] = 'neutral';
        });
    });
    return initial;
  });

  const [comments, setComments] = useState<Record<string, string>>({});

  const handleRate = (id: string, value: string) => {
    setRatings(prev => ({...prev, [id]: value}));
  };

  const handleComment = (id: string, text: string) => {
    setComments(prev => ({...prev, [id]: text}));
  };

  const saveEvaluation = () => {
      console.log("Evaluation Saved", { ratings, comments });
      alert("Évaluation enregistrée avec succès!");
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-100">
            <div>
                <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <Utensils className="w-8 h-8 text-red-600" /> 
                    Menu Dégustation
                </h2>
                <p className="text-slate-500 mt-1">Fiche d'évaluation officielle.</p>
            </div>
            <button 
                onClick={saveEvaluation}
                className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors shadow-lg"
            >
                <Save className="w-5 h-5" /> Enregistrer les résultats
            </button>
        </div>

        <div className="space-y-12">
            {MENU_DEGUSTATION.map((service, sIdx) => (
                <div key={sIdx} className="space-y-6">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-wider bg-slate-100 px-4 py-2 rounded-lg">
                            {service.service}
                        </h3>
                        <div className="h-px bg-slate-200 flex-1"></div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-6">
                        {service.items.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                                <div className="mb-4">
                                    <h4 className="font-bold text-lg text-slate-800 leading-tight mb-2">{item.name}</h4>
                                    <p className="text-sm text-slate-600 italic mb-3">{item.desc}</p>
                                    <div className="flex items-start gap-2 text-xs text-red-500 bg-red-50 p-2 rounded-lg inline-block">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                        <span>Allergènes: {item.allergens}</span>
                                    </div>
                                </div>

                                {/* Standardized Rating Block */}
                                <div className="space-y-3 border-t border-gray-100 pt-4">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Votre Verdict</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {RATING_OPTIONS.map((option) => {
                                            const isSelected = ratings[item.id] === option.id;
                                            return (
                                                <label 
                                                    key={option.id}
                                                    className={`
                                                        relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                                        ${isSelected 
                                                            ? `${option.color} ring-1 ring-inset ring-current shadow-sm font-bold` 
                                                            : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                        }
                                                    `}
                                                >
                                                    <input 
                                                        type="radio" 
                                                        name={`rating_${item.id}`} 
                                                        value={option.id}
                                                        checked={isSelected}
                                                        onChange={() => handleRate(item.id, option.id)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-current' : 'border-gray-300'}`}>
                                                        {isSelected && <div className="w-2 h-2 rounded-full bg-current" />}
                                                    </div>
                                                    <span className="text-xs">{option.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-4 relative">
                                    <MessageSquare className="w-4 h-4 text-gray-400 absolute top-3 left-3" />
                                    <textarea 
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2 pl-9 pr-3 text-sm focus:bg-white focus:border-slate-300 outline-none transition-all" 
                                        placeholder="Commentaires additionnels..."
                                        rows={2}
                                        value={comments[item.id] || ''}
                                        onChange={(e) => handleComment(item.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
