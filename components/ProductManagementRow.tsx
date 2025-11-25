

import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { CATEGORIES } from '../constants';
import { useProducts } from '../contexts/StoreContext';

interface ProductManagementRowProps {
  product: Product;
  onUpdate: (product: Product) => void;
}

export const ProductManagementRow: React.FC<ProductManagementRowProps> = ({ product, onUpdate }) => {
  const [localProduct, setLocalProduct] = useState(product);
  const { appConfigs } = useProducts();
  
  // Logic Control: Check if 3 decimals are enabled
  const show3Decimals = appConfigs.find(c => c.key === 'display_3_decimals')?.isActive || false;

  useEffect(() => { setLocalProduct(product); }, [product]);
  
  const handleSave = () => { onUpdate(localProduct); };
  
  // Logic: Dynamic Decimal Precision
  const pricePerUnit = product.unitCount ? (product.price / product.unitCount).toFixed(show3Decimals ? 3 : 2) : '-';
  const pricePerGram = product.totalWeightGrams ? (product.price / product.totalWeightGrams).toFixed(show3Decimals ? 4 : 3) : '-';
  
  return (
    <div className={`border-b border-gray-100 p-4 ${!localProduct.isAvailable ? 'bg-gray-50 opacity-70' : 'bg-white'}`}>
      <div className="flex gap-6 items-start">
        <div className="flex flex-col gap-3 items-center w-32 flex-shrink-0 pt-1">
            <button 
                onClick={() => onUpdate({...localProduct, isAvailable: !localProduct.isAvailable})}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${localProduct.isAvailable ? 'bg-green-500' : 'bg-red-500'}`}
            >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${localProduct.isAvailable ? 'left-7' : 'left-1'}`}></div>
            </button>
            <select 
                className="text-[10px] border rounded p-1 bg-white w-full text-center"
                value={localProduct.seasonality}
                onChange={(e) => onUpdate({...localProduct, seasonality: e.target.value})}
            >
                <option value="all_year">À l'année</option>
                <option value="summer">Été</option>
                <option value="winter">Hiver</option>
                <option value="special">Spécial</option>
            </select>
            <select 
                className="text-[10px] border rounded p-1 bg-white w-full text-center"
                value={localProduct.category}
                onChange={(e) => {
                    const cat = e.target.value;
                    let pType = 'Autre';
                    if(cat === 'Boeuf') pType = 'Viande Rouge';
                    if(cat === 'Poulet') pType = 'Volaille';
                    if(cat === 'Porc') pType = 'Porc';
                    if(cat.includes('Poisson')) pType = 'Poissons';
                    onUpdate({...localProduct, category: cat, proteinType: pType});
                }}
            >
                {CATEGORIES.filter(c => c.id !== 'Rabais').map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
        </div>
        
        <div className="flex-1 grid grid-cols-3 gap-4 text-sm">
            <div className="col-span-3 md:col-span-1 space-y-2">
                <input type="text" className="font-bold text-slate-800 w-full border-b border-transparent focus:border-blue-500 outline-none bg-transparent" value={localProduct.name} onChange={(e) => setLocalProduct({...localProduct, name: e.target.value})} onBlur={handleSave} />
                <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-500">SKU <input type="text" className="block w-full border rounded p-1 text-xs" value={localProduct.sku} onChange={(e) => setLocalProduct({...localProduct, sku: e.target.value})} onBlur={handleSave} /></label>
                    <label className="text-xs text-slate-500">Format <input type="text" className="block w-full border rounded p-1 text-xs" value={localProduct.format} onChange={(e) => setLocalProduct({...localProduct, format: e.target.value})} onBlur={handleSave} /></label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-slate-500">Type Conso
                        <select className="block w-full border rounded p-1 text-xs" value={localProduct.consumptionType} onChange={(e) => onUpdate({...localProduct, consumptionType: e.target.value})}>
                            <option value="staple">Staple (Base)</option>
                            <option value="quick">Quick (Rapide)</option>
                            <option value="roast">Roast (Rôti)</option>
                        </select>
                    </label>
                    <label className="text-xs text-slate-500">Texture
                        <input type="text" className="block w-full border rounded p-1 text-xs bg-slate-50" value={localProduct.texture || ''} readOnly title="Calculé automatiquement" />
                    </label>
                </div>
            </div>
            
            <div className="col-span-3 md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                <label className="text-xs text-slate-500">Prix <input type="number" step={show3Decimals ? "0.001" : "0.01"} className="block w-full border rounded p-1 font-bold" value={localProduct.price} onChange={(e) => setLocalProduct({...localProduct, price: parseFloat(e.target.value)})} onBlur={handleSave} /></label>
                <label className="text-xs text-slate-500">Nb/Boîte <input type="number" className="block w-full border rounded p-1" value={localProduct.unitCount || ''} onChange={(e) => setLocalProduct({...localProduct, unitCount: parseInt(e.target.value)})} onBlur={handleSave} /></label>
                <label className="text-xs text-slate-500">Poids(g) <input type="number" className="block w-full border rounded p-1" value={localProduct.totalWeightGrams || ''} onChange={(e) => setLocalProduct({...localProduct, totalWeightGrams: parseInt(e.target.value)})} onBlur={handleSave} /></label>
                
                <label className="text-xs text-slate-500 col-span-1">Classe
                    <select 
                        className="block w-full border rounded p-1"
                        value={localProduct.managementCategory || 'base'}
                        onChange={(e) => {
                            const val = e.target.value;
                            const isPrem = val === 'premium' || val === 'high';
                            onUpdate({...localProduct, managementCategory: val, isPremium: isPrem});
                        }}
                    >
                        <option value="base">Base</option>
                        <option value="low">Éco</option>
                        <option value="medium">Standard</option>
                        <option value="high">Élevé</option>
                        <option value="premium">Premium</option>
                        <option value="entree">Entrée</option>
                    </select>
                </label>

                <div className="col-span-4 flex justify-between bg-slate-50 p-2 rounded text-[10px] text-slate-500 mt-1">
                   <span>$/Unité: <span className="font-bold">{pricePerUnit}</span></span>
                   <span>$/g: <span className="font-bold">{pricePerGram}</span></span>
                   <span>Fournisseur: <input type="text" className="inline-block border-b border-slate-300 bg-transparent w-20" value={localProduct.supplier || ''} onChange={(e) => setLocalProduct({...localProduct, supplier: e.target.value})} onBlur={handleSave} /></span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};