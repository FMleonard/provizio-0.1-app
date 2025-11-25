
import React, { useState } from 'react';
import { Info, Search, ImageOff } from 'lucide-react';
import { Product } from '../types';
import { PRODUCT_CATALOG } from '../constants';

export const InfoSection: React.FC = () => {
  // We need to access the products from localStorage to see the updated data
  const [localProducts] = useState<Product[]>(() => {
      try {
          const saved = localStorage.getItem('amq_products_v1');
          return saved ? JSON.parse(saved) : PRODUCT_CATALOG;
      } catch (e) {
          return PRODUCT_CATALOG;
      }
  });
  
  const [search, setSearch] = useState('');
  const filtered = localProducts.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.includes(search));

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3"><Info className="w-8 h-8 text-red-600" /> Infos Produits & Catalogue</h2>
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Chercher un produit..." 
                    className="w-full pl-9 p-2 border rounded-lg bg-gray-50 focus:bg-white transition-all"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">Aucun produit trouvé.</div>}
            {filtered.map(product => (
                <div key={product.id} className="flex bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                    <div className="w-32 h-32 flex-shrink-0 bg-gray-50 flex items-center justify-center border-r border-gray-100">
                        {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '')} />
                        ) : (
                            <ImageOff className="w-8 h-8 text-gray-300" />
                        )}
                    </div>
                    <div className="p-4 flex-1 flex flex-col">
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800 text-sm line-clamp-2">{product.name}</h3>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{product.sku}</span>
                        </div>
                        
                        <div className="mt-2 mb-2 flex-1">
                            {product.description ? (
                                <p className="text-xs text-slate-600 line-clamp-3">{product.description}</p>
                            ) : (
                                <p className="text-xs text-gray-400 italic">Aucune description détaillée disponible.</p>
                            )}
                        </div>

                        <div className="flex items-center gap-3 text-xs mt-auto pt-2 border-t border-gray-50">
                            {product.salePrice ? (
                                <>
                                    <span className="font-bold text-red-600">{product.salePrice.toFixed(2)}$</span>
                                    <span className="text-gray-400 line-through">{product.price.toFixed(2)}$</span>
                                </>
                            ) : (
                                <span className="font-bold text-slate-700">{product.price.toFixed(2)}$</span>
                            )}
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-500">{product.format}</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
