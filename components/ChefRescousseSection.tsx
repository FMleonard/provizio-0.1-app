import React, { useState } from 'react';
import { ChefHat, Sparkles, Clock, BarChart, Utensils, ArrowRight, Loader, ShoppingBag, BookOpen } from 'lucide-react';
import { useCart } from '../contexts/StoreContext';
import { Product } from '../types';
import { GoogleGenAI } from "@google/genai";

interface Recipe {
  title: string;
  time: string;
  difficulty: string;
  calories: string;
  ingredients: string[];
  steps: string[];
}

export const ChefRescousseSection: React.FC = () => {
  const { cart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [recipes, setRecipes] = useState<Recipe[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Filter out items with 0 quantity effectively, get unique products
  const availableIngredients = cart.filter(item => {
      const totalQty = (Object.values(item.quantities) as number[]).reduce((a, b) => a + b, 0);
      return totalQty > 0;
  }).map(item => item.product);

  const generateRecipes = async (product: Product) => {
    setSelectedProduct(product);
    setRecipes(null);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        You are a professional chef assisting a family.
        The user has bought: "${product.name}" (${product.category}).
        
        Suggest 3 distinct, delicious recipes using this main ingredient.
        Language: French.
        
        Return a JSON Array with this exact structure:
        [
          {
            "title": "Recipe Name",
            "time": "Prep + Cook time",
            "difficulty": "Easy/Medium/Hard",
            "calories": "Approx calories per serving",
            "ingredients": ["List of ingredients"],
            "steps": ["Step 1", "Step 2", "Step 3"]
          }
        ]
        Do not include markdown formatting (like \`\`\`json). Just the raw JSON.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(result.text || "[]");
      setRecipes(data);
    } catch (error) {
      console.error("Recipe generation failed", error);
      alert("Le chef est débordé (Erreur IA). Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto min-h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 border-b border-gray-100 pb-6">
        <div className="bg-orange-100 p-4 rounded-2xl">
          <ChefHat className="w-8 h-8 text-orange-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Chef à la Rescousse</h2>
          <p className="text-slate-500">Sélectionnez une protéine de votre panier pour obtenir des idées repas instantanées.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Pantry / Ingredients */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5"/> Votre Panier
            </h3>
            <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded-full">{availableIngredients.length} articles</span>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {availableIngredients.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-gray-400 text-sm">Votre panier est vide.</p>
                <p className="text-xs text-gray-400 mt-1">Ajoutez des produits dans la Boutique pour voir des recettes.</p>
              </div>
            ) : (
              availableIngredients.map(product => (
                <button
                  key={product.id}
                  onClick={() => generateRecipes(product)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 flex items-center justify-between group ${
                    selectedProduct?.id === product.id
                      ? 'bg-orange-600 text-white border-orange-600 shadow-md transform scale-[1.02]'
                      : 'bg-white border-gray-100 hover:border-orange-200 hover:bg-orange-50'
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm block">{product.name}</span>
                    <span className={`text-[10px] ${selectedProduct?.id === product.id ? 'text-orange-200' : 'text-gray-400'}`}>
                      {product.format}
                    </span>
                  </div>
                  {selectedProduct?.id === product.id ? (
                    <Loader className="w-5 h-5 animate-spin text-white" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 opacity-0 group-hover:opacity-100 transition-all" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recipe Display */}
        <div className="lg:col-span-8 bg-slate-50 rounded-3xl p-6 border border-slate-200 min-h-[500px]">
          {!selectedProduct ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-12">
              <BookOpen className="w-16 h-16 mb-4 opacity-20" />
              <h4 className="text-xl font-bold text-slate-600 mb-2">En attente d'ingrédients...</h4>
              <p>Cliquez sur un produit à gauche pour demander au Chef de vous inspirer.</p>
            </div>
          ) : loading ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <ChefHat className="w-8 h-8 text-orange-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-800 animate-pulse">Le Chef réfléchit...</h4>
                <p className="text-slate-500 text-sm mt-2">Recherche des meilleures combinaisons pour "{selectedProduct.name}"</p>
              </div>
            </div>
          ) : recipes ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
              <div className="flex justify-between items-end">
                 <h3 className="text-2xl font-bold text-slate-800">
                    Recettes pour <span className="text-orange-600 underline decoration-orange-300 underline-offset-4">{selectedProduct.name}</span>
                 </h3>
                 <span className="text-xs bg-white border border-gray-200 px-3 py-1 rounded-full font-bold text-slate-500">3 Suggestions</span>
              </div>
              
              <div className="grid gap-6">
                {recipes.map((recipe, idx) => (
                  <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                      <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="bg-orange-100 text-orange-700 w-8 h-8 flex items-center justify-center rounded-lg text-sm">{idx + 1}</span>
                        {recipe.title}
                      </h4>
                      <div className="flex gap-2 flex-wrap">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {recipe.time}
                        </span>
                        <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <BarChart className="w-3 h-3" /> {recipe.difficulty}
                        </span>
                        <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1">
                          <Utensils className="w-3 h-3" /> {recipe.calories}
                        </span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-orange-50/50 p-4 rounded-xl">
                        <h5 className="font-bold text-orange-800 mb-3 text-sm uppercase tracking-wider">Ingrédients</h5>
                        <ul className="space-y-1.5">
                          {recipe.ingredients.map((ing, i) => (
                            <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-orange-300 rounded-full mt-1.5 flex-shrink-0"></span>
                              {ing}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wider">Préparation</h5>
                        <ol className="space-y-3">
                          {recipe.steps.map((step, i) => (
                            <li key={i} className="text-sm text-slate-600 flex gap-3">
                              <span className="font-bold text-slate-300 font-mono">{i + 1}.</span>
                              <span className="leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};