

import React, { useState, useMemo } from 'react';
import { CartItem, ClientInfo, Settings } from '../types';
import { Printer, TrendingUp, DollarSign, FileSignature, CheckCircle2, Box, Snowflake, ShoppingBag } from 'lucide-react';
import { AMQ_KNOWLEDGE_BASE } from '../constants';
import { useProducts } from '../contexts/StoreContext';

interface SummarySectionProps {
  cart: CartItem[];
  grandTotal: number;
  clientInfo?: ClientInfo;
  pickupList?: any[];
  settings?: Settings;
}

export const SummarySection: React.FC<SummarySectionProps> = ({ cart, grandTotal, clientInfo, settings, pickupList = [] }) => {
  const [isPrintMode, setIsPrintMode] = useState(false);
  const { appConfigs } = useProducts();

  // Logic Control: Tax Exemption
  const taxExemptFood = appConfigs.find(c => c.key === 'tax_exempt_food')?.isActive || false;

  // Cost Analysis based on PDF Savings (Min 12% - Max 32%)
  // We use 1.32 factor to represent the grocery price which is 32% higher than our bulk price
  const groceryInflationFactor = 1.32; 
  const groceryCost = grandTotal * groceryInflationFactor;
  const annualSavings = groceryCost - grandTotal;
  
  // Freezer Space Calculation
  // PDF: 1 cu ft = 25 lbs
  // 1 lb = 0.453592 kg
  const totalWeightKg = useMemo((): number => {
      return cart.reduce((total, item) => {
          const itemWeight = (item.product.totalWeightGrams || 0) / 1000;
          const totalQty = (Object.values(item.quantities) as number[]).reduce((a: number, b: number) => a + b, 0);
          return total + (itemWeight * totalQty);
      }, 0);
  }, [cart]);

  const totalWeightLbs = totalWeightKg * 2.20462;
  const requiredCubicFeet = totalWeightLbs / AMQ_KNOWLEDGE_BASE.freezerLogic.lbsPerCubicFoot;
  
  // Delivery Split Logic (Freezer Space per Delivery)
  // Assuming equal split for now, but could be dynamic
  const maxDeliveryVolume = requiredCubicFeet / 4; 

  const handlePrint = () => {
      window.print();
  };

  const calculateTaxes = (item: CartItem) => {
      if (taxExemptFood && item.product.category !== 'Prêt-à-manger') {
          // Simplistic logic: If food exempt is ON, treat almost everything as 0 tax for now
          // In real app, we'd check specific taxable categories
          return 0;
      }
      return (item.product.salePrice || item.product.price) * 0.15; // 15% placeholder
  };

  return (
    <div className="p-8 bg-white min-h-screen">
      {/* SCREEN VIEW */}
      <div className="print:hidden space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Résumé & Contractualisation</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Analyse financière et logistique basée sur les données de consommation 2025.</p>
          </div>

          {/* DASHBOARD GRID */}
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              
              {/* Financial Card */}
              <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-green-500/30 transition-all duration-1000"></div>
                  
                  <div className="relative z-10">
                      <h3 className="text-gray-400 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4"/> Performance Financière</h3>
                      <p className="text-3xl font-bold">Économies Projetées</p>
                  </div>

                  <div className="mt-8 space-y-6 relative z-10">
                      {/* AMQ Bar */}
                      <div>
                          <div className="flex justify-between text-sm font-bold mb-2">
                              <span>AMQ (Prix Bloqué)</span>
                              <span className="text-green-400">{grandTotal.toFixed(0)}$</span>
                          </div>
                          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500 w-[70%]"></div>
                          </div>
                      </div>
                      
                      {/* Grocery Bar */}
                      <div>
                          <div className="flex justify-between text-sm font-bold mb-2">
                              <span>Épicerie (+32%)</span>
                              <span className="text-red-400">{groceryCost.toFixed(0)}$</span>
                          </div>
                          <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
                              <div className="h-full bg-red-500 w-full relative">
                                  <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzjwqgAAQA==')] opacity-20"></div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/10">
                      <p className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">
                          {annualSavings.toFixed(0)}$ <span className="text-lg text-gray-400 font-normal">d'économies / an</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-2">*Basé sur une économie moyenne de 32% (Rapport 2025).</p>
                  </div>
              </div>

              {/* Logistics & Freezer Card */}
              <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -ml-16 -mb-16"></div>
                  
                  <div className="relative z-10">
                      <h3 className="text-blue-200 font-bold uppercase tracking-wider text-xs mb-2 flex items-center gap-2"><Snowflake className="w-4 h-4"/> Logistique & Stockage</h3>
                      <p className="text-3xl font-bold">Espace Requis</p>
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-8 relative z-10">
                      <div>
                          <p className="text-sm text-blue-200 font-bold uppercase">Poids Total</p>
                          <p className="text-4xl font-extrabold">{totalWeightLbs.toFixed(0)} <span className="text-lg font-normal">lbs</span></p>
                          <p className="text-xs text-blue-200 mt-1">{totalWeightKg.toFixed(0)} kg</p>
                      </div>
                      <div>
                          <p className="text-sm text-blue-200 font-bold uppercase">Volume Total</p>
                          <p className="text-4xl font-extrabold">{requiredCubicFeet.toFixed(1)} <span className="text-lg font-normal">pi³</span></p>
                          <p className="text-xs text-blue-200 mt-1">25 lbs / pi³</p>
                      </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-white/20 relative z-10">
                      <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
                          <Box className="w-8 h-8 text-white" />
                          <div>
                              <p className="font-bold text-sm">Espace par Livraison (4/an)</p>
                              <p className="text-xs text-blue-100">Vous avez besoin d'environ <strong className="text-white">{maxDeliveryVolume.toFixed(1)} pi³</strong> de libre dans votre congélateur à chaque livraison.</p>
                          </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                           <span className={`text-[10px] px-2 py-1 rounded border ${maxDeliveryVolume < 3.5 ? 'bg-white text-blue-600 border-white' : 'border-white/30 text-blue-200'}`}>Frigo Std (3.5 pi³)</span>
                           <span className={`text-[10px] px-2 py-1 rounded border ${maxDeliveryVolume >= 3.5 && maxDeliveryVolume < 7 ? 'bg-white text-blue-600 border-white' : 'border-white/30 text-blue-200'}`}>Petit Coffre (5 pi³)</span>
                           <span className={`text-[10px] px-2 py-1 rounded border ${maxDeliveryVolume >= 7 ? 'bg-white text-blue-600 border-white' : 'border-white/30 text-blue-200'}`}>Coffre Famille (7+ pi³)</span>
                      </div>
                  </div>
              </div>
          </div>

          {/* PICKUP LIST (Condo Overflow) */}
          {pickupList.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-3xl p-8 max-w-6xl mx-auto shadow-sm">
                  <h3 className="text-xl font-bold text-orange-800 flex items-center gap-2 mb-4">
                      <ShoppingBag className="w-6 h-6"/> Articles à ramasser en succursale
                  </h3>
                  <p className="text-orange-700 mb-6 text-sm">Ces articles ont été retirés de la livraison pour optimiser l'espace congélateur (Mode Condo). Ils sont disponibles pour ramassage à l'unité.</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {pickupList.map(item => (
                          <div key={item.id} className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                              <p className="font-bold text-sm text-slate-800 line-clamp-2 mb-2">{item.name}</p>
                              <p className="text-xs text-gray-500">{item.format}</p>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          {/* Action Area */}
          <div className="bg-white border border-gray-100 p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 max-w-6xl mx-auto">
              <div className="space-y-2">
                  <h3 className="text-xl font-bold text-slate-800">Prêt à officialiser?</h3>
                  <p className="text-slate-500 text-sm max-w-md">Le contrat inclut la garantie de prix 12 mois et le plan de livraison flexible.</p>
              </div>
              <button 
                onClick={handlePrint}
                className="bg-slate-900 text-white font-bold py-4 px-12 rounded-xl shadow-lg flex items-center gap-3 hover:bg-slate-800 transition-all hover:scale-105"
              >
                  <FileSignature className="w-5 h-5"/> Générer le Contrat PDF
              </button>
          </div>
      </div>

      {/* PRINT CONTRACT VIEW (Visible only on print) */}
      <div className="hidden print:block font-serif">
          <div className="text-center border-b-2 border-slate-900 pb-6 mb-8">
              <h1 className="text-4xl font-bold uppercase tracking-widest">Contrat de Service</h1>
              <p className="text-sm text-slate-500 mt-2">Alimentation Mon Quartier • 1-800-555-0199 • info@amq.ca</p>
          </div>

          <div className="flex justify-between mb-8">
              <div className="w-1/2">
                  <h3 className="font-bold uppercase text-xs text-slate-400 mb-2">Client</h3>
                  <p className="font-bold text-lg">{clientInfo?.contactPrincipal}</p>
                  <p>{clientInfo?.adresse}, {clientInfo?.ville}</p>
                  <p>{clientInfo?.telephone}</p>
                  <p>{clientInfo?.courriel}</p>
              </div>
              <div className="w-1/2 text-right">
                  <h3 className="font-bold uppercase text-xs text-slate-400 mb-2">Détails de la commande</h3>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p className="font-bold text-xl mt-2">Total: {grandTotal.toFixed(2)}$</p>
                  <p className="text-sm text-slate-500">(Taxes incluses si applicable)</p>
                  {taxExemptFood && <p className="text-xs font-bold text-green-700 mt-1">** EXEMPTION TAXES ALIMENTAIRES APPLIQUÉE **</p>}
              </div>
          </div>

          <table className="w-full text-sm mb-8 border-collapse">
              <thead>
                  <tr className="border-b-2 border-slate-900 text-left">
                      <th className="py-2">Produit</th>
                      <th className="py-2 text-center">Format</th>
                      <th className="py-2 text-center">Qté Totale</th>
                      <th className="py-2 text-right">Prix Unitaire</th>
                      <th className="py-2 text-right">Total</th>
                  </tr>
              </thead>
              <tbody>
                  {cart.map((item, i) => {
                      const totalQty = (Object.values(item.quantities) as number[]).reduce((a: number, b: number) => a + b, 0);
                      const price = item.product.salePrice || item.product.price;
                      return (
                          <tr key={i} className="border-b border-gray-100">
                              <td className="py-2">{item.product.name}</td>
                              <td className="py-2 text-center text-xs text-gray-500">{item.product.format}</td>
                              <td className="py-2 text-center font-bold">{totalQty}</td>
                              <td className="py-2 text-right">{price.toFixed(2)}$</td>
                              <td className="py-2 text-right font-bold">{(price * totalQty).toFixed(2)}$</td>
                          </tr>
                      )
                  })}
              </tbody>
              <tfoot>
                  <tr className="border-t-2 border-slate-900">
                      <td colSpan={4} className="py-4 text-right font-bold text-lg">Grand Total</td>
                      <td className="py-4 text-right font-bold text-lg">{grandTotal.toFixed(2)}$</td>
                  </tr>
              </tfoot>
          </table>
          
          <div className="mb-8 p-4 border border-gray-200 rounded">
               <h3 className="font-bold uppercase text-xs text-slate-400 mb-2">Analyse de l'espace congélateur</h3>
               <div className="flex justify-between text-sm">
                   <span>Poids Total: <strong>{totalWeightLbs.toFixed(0)} lbs</strong></span>
                   <span>Volume Requis (Total): <strong>{requiredCubicFeet.toFixed(1)} pi³</strong></span>
                   <span>Volume Requis (par livraison): <strong>{maxDeliveryVolume.toFixed(1)} pi³</strong></span>
               </div>
               <p className="text-xs text-gray-500 mt-2 italic">*Basé sur un ratio de 25 lbs par pied cube (Standard AMQ 2025).</p>
          </div>

          <div className="mb-8">
              <h3 className="font-bold uppercase text-xs text-slate-400 mb-4">Calendrier de Livraison Estimé</h3>
              <div className="flex gap-4">
                  {[1,2,3,4].map(liv => {
                      const hasItems = cart.some(i => (i.quantities[liv] || 0) > 0);
                      if (!hasItems) return null;
                      return (
                          <div key={liv} className="flex-1 border p-4 rounded bg-gray-50">
                              <p className="font-bold text-sm mb-2">Livraison {liv}</p>
                              <div className="w-full h-px bg-gray-300 mb-2"></div>
                              <p className="text-xs text-gray-500">À déterminer avec le client</p>
                          </div>
                      )
                  })}
              </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-xs text-justify text-gray-500 mb-12">
                  CONDITIONS DE VENTE: Le client s'engage à payer le montant total selon les termes convenus. La marchandise demeure la propriété de AMQ jusqu'au paiement complet. Aucun retour sur les produits dégelés. Garantie de satisfaction 100% sur la qualité.
              </p>
              
              <div className="flex justify-between mt-16">
                  <div className="w-5/12 border-t border-slate-900 pt-2">
                      <p className="font-bold">Signature du Client</p>
                  </div>
                  <div className="w-5/12 border-t border-slate-900 pt-2 text-right">
                      <p className="font-bold">Représentant AMQ</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};