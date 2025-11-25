

import React, { useState, useMemo } from 'react';
import { ShoppingCart, Search, Menu, Calculator, ChevronUp, ChevronDown, Wand2, Calendar as CalendarIcon, UserCheck, Users, Utensils, Info, FileText, LayoutGrid, Home, Settings as SettingsIcon, Minus, Plus, Trash2, ArrowDown, Tag, X, Store, BrainCircuit, ShieldCheck, ChefHat } from 'lucide-react';
import { CATEGORIES } from './constants';
import { Product } from './types';
import { SettingsDashboard } from './components/SettingsDashboard';
import { ClientSection } from './components/ClientSection';
import { InfoSection } from './components/InfoSection';
import { EvaluationSection } from './components/EvaluationSection';
import { KnowledgeChat } from './components/KnowledgeChat';
import { CalendarSection } from './components/CalendarSection';
import { TastingSection } from './components/TastingSection';
import { SummarySection } from './components/SummarySection';
import { SuccursalesSection } from './components/SuccursalesSection';
import { SmartPlanner } from './components/SmartPlanner';
import { QualityChecklist } from './components/QualityChecklist';
import { ChefRescousseSection } from './components/ChefRescousseSection';

// Import Contexts
import { ProductProvider, ClientProvider, CartProvider, useProducts, useCart, useClient } from './contexts/StoreContext';

// --- MAIN CONTENT COMPONENT ---
function AppContent() {
  const [currentView, setCurrentView] = useState('shop');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [paymentFrequency, setPaymentFrequency] = useState('weekly');
  const [isRayonsOpen, setIsRayonsOpen] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  // Consume Contexts
  const { products, setSettings, saveProducts, resetCatalog } = useProducts();
  const { cart, setCart, updateQuantity, removeFromCart, grandTotal, cartCount } = useCart();
  const { clientInfo, setClientInfo, evaluationData, setEvaluationData, pickupList, setPickupList } = useClient();

  // Derived UI State
  const filteredProducts = useMemo(() => 
    products.filter(p => 
      p.isAvailable && 
      (selectedCategory === 'All' || p.category === selectedCategory) && 
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku.includes(searchQuery))
    ), [selectedCategory, searchQuery, products]
  );

  const getProductQuantities = (productId: string) => cart.find(i => i.product.id === productId)?.quantities || { 1: 0, 2: 0, 3: 0, 4: 0 };
  const getPrice = (product: Product) => product.salePrice || product.price;

  // Auto-open summary on price change (UI behavior)
  React.useEffect(() => { if (grandTotal > 0) setIsSummaryOpen(true); }, [grandTotal]);

  const periodicPrice = useMemo(() => {
      if (grandTotal === 0) return 0;
      switch (paymentFrequency) { case 'weekly': return grandTotal / 52; case 'biweekly': return grandTotal / 26; case 'monthly': return grandTotal / 12; default: return 0; }
  }, [grandTotal, paymentFrequency]);

  const frequencyLabel = useMemo(() => {
      switch (paymentFrequency) { case 'weekly': return { main: "Par semaine", sub: "52 versements" }; case 'biweekly': return { main: "Aux 2 semaines", sub: "26 versements" }; case 'monthly': return { main: "Par mois", sub: "12 versements" }; default: return { main: "", sub: "" }; }
  }, [paymentFrequency]);

  const DeliveryCounter = ({ label, count, onPlus, onMinus }: any) => (
    <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-slate-50 border border-slate-100/50 hover:bg-white hover:border-slate-200 transition-all duration-200 group">
        <span className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-tighter group-hover:text-slate-600 transition-colors">{label}</span>
        <div className="flex items-center justify-between w-full gap-1">
            <button 
                onClick={onMinus} 
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm active:scale-95"
            >
                <Minus className="w-3 h-3" />
            </button>
            <span className={`flex-1 text-center font-bold text-sm font-mono ${count > 0 ? 'text-slate-900 scale-110' : 'text-slate-300'} transition-all`}>
                {count || 0}
            </span>
            <button 
                onClick={onPlus} 
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-800 text-white shadow-md shadow-slate-200 hover:bg-slate-700 hover:scale-105 active:scale-95 transition-all"
            >
                <Plus className="w-3 h-3" />
            </button>
        </div>
    </div>
  );

  const BentoButton = ({ view, icon: Icon, label, colorClass = "text-slate-600 bg-white hover:border-slate-300", activeClass = "bg-slate-800 text-white ring-2 ring-slate-800 ring-offset-2" }: any) => (
      <button 
        onClick={() => setCurrentView(view)} 
        className={`group relative p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between h-24 shadow-sm hover:shadow-md ${currentView === view ? `border-transparent ${activeClass}` : `border-gray-100 ${colorClass}`}`}
      >
        <Icon className={`w-6 h-6 mb-auto transition-transform duration-300 group-hover:scale-110 ${currentView === view ? 'text-white' : ''}`} />
        <span className="font-bold text-xs text-left">{label}</span>
      </button>
  );

  return (
    <div className="min-h-[100dvh] bg-[#FAFAFA] font-sans text-slate-800 print:bg-white selection:bg-red-100 selection:text-red-900 pb-40 md:pb-0">
      <header className="sticky top-0 z-30 w-full bg-white/90 backdrop-blur-md border-b border-gray-200/50 print:hidden safe-area-top">
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setCurrentView('shop')}>
             <div className="bg-gradient-to-br from-red-600 to-red-800 text-white p-2 rounded-xl font-bold text-lg tracking-tighter shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all duration-300 transform group-hover:scale-105">P</div>
             <div className="hidden sm:block leading-none">
                 <h1 className="text-lg font-bold text-slate-900">PROVIZIO</h1>
                 <p className="text-[9px] text-slate-500 font-medium tracking-wide mt-0.5">PLANIFICATION INTELLIGENTE</p>
             </div>
          </div>
          
          <div className="flex-1 max-w-xl mx-3 md:mx-6 relative group">
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-100/50 border border-transparent focus:bg-white focus:border-red-200 focus:ring-4 focus:ring-red-50 rounded-xl transition-all outline-none text-sm font-medium placeholder:text-gray-400" 
                value={searchQuery} 
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentView('shop'); }} 
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5 group-focus-within:text-red-500 transition-colors" />
          </div>

          <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentView('settings')} 
                className={`hidden md:flex p-2.5 rounded-xl transition-all duration-200 ${currentView === 'settings' ? 'bg-slate-800 text-white shadow-lg shadow-slate-500/30' : 'hover:bg-gray-100 text-slate-500'}`} 
                title="Paramètres"
              >
                <SettingsIcon className="w-5 h-5" />
              </button>
              
              <button 
                onClick={() => setIsCartOpen(true)} 
                className="relative p-2.5 bg-white border border-gray-100 hover:border-red-200 rounded-xl transition-all duration-200 group shadow-sm hover:shadow"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700 group-hover:text-red-600 transition-colors" />
                {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-bold min-w-[1.25rem] h-5 px-1 flex items-center justify-center rounded-full shadow-sm ring-2 ring-white">{cartCount}</span>}
              </button>
          </div>
        </div>
      </header>

      <div className="w-full flex flex-col md:flex-row pt-6 gap-6 px-4 lg:px-6 max-w-[1920px] mx-auto">
        
        {/* SIDEBAR */}
        <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0 space-y-6 sticky top-24 self-start h-fit print:hidden">
           <div className="grid grid-cols-2 gap-3">
             <div className="col-span-2">
                 <button 
                    onClick={() => setCurrentView('shop')} 
                    className={`w-full group relative p-5 rounded-3xl border transition-all duration-300 flex items-center gap-4 shadow-sm hover:shadow-lg ${currentView === 'shop' ? 'bg-slate-900 text-white border-transparent' : 'bg-white border-gray-100 hover:border-red-100'}`}
                 >
                    <div className={`p-3 rounded-2xl ${currentView === 'shop' ? 'bg-white/10' : 'bg-red-50 text-red-600'}`}>
                        <LayoutGrid className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                        <span className="block font-bold text-lg">Boutique</span>
                        <span className={`text-xs ${currentView === 'shop' ? 'text-slate-400' : 'text-slate-400'}`}>Catalogue Complet</span>
                    </div>
                 </button>
             </div>
             
             {/* NEW SMART PLANNER BUTTON */}
             <BentoButton 
                view="smartplanner" 
                icon={BrainCircuit} 
                label="Smart Planner" 
                colorClass="bg-gradient-to-br from-indigo-50 to-white text-indigo-700 border-indigo-100 hover:border-indigo-300" 
                activeClass="bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2" 
             />

             <BentoButton view="chat" icon={Wand2} label="Assistant IA" colorClass="bg-gradient-to-br from-purple-50 to-white text-purple-700 border-purple-100 hover:border-purple-300" activeClass="bg-purple-600 text-white ring-2 ring-purple-600 ring-offset-2" />
             
             {/* NEW CHEF BUTTON */}
             <BentoButton 
                view="chef" 
                icon={ChefHat} 
                label="Chef Rescousse" 
                colorClass="bg-gradient-to-br from-orange-50 to-white text-orange-700 border-orange-100 hover:border-orange-300" 
                activeClass="bg-orange-600 text-white ring-2 ring-orange-600 ring-offset-2" 
             />

             <BentoButton view="calendar" icon={CalendarIcon} label="Planificateur" />
             <BentoButton view="client" icon={UserCheck} label="Client" />
             <BentoButton view="evaluation" icon={Users} label="Évaluation" />
             <BentoButton view="tasting" icon={Utensils} label="Dégustation" />
             <BentoButton view="succursales" icon={Store} label="Succursales" />
             <BentoButton view="quality" icon={ShieldCheck} label="Qualité" colorClass="bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-300" activeClass="bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-2" />
             <div className="col-span-2">
                <BentoButton view="info" icon={Info} label="Infos" />
             </div>

             <div className="col-span-2 mt-2">
                 <button 
                    onClick={() => setCurrentView('summary')} 
                    className={`w-full group relative p-4 rounded-2xl border transition-all duration-200 flex items-center justify-between shadow-sm ${currentView === 'summary' ? 'bg-green-600 text-white border-transparent ring-2 ring-green-600 ring-offset-2' : 'bg-white border-gray-100 hover:border-green-200'}`}
                 >
                    <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5" />
                        <span className="font-bold text-sm">Résumé</span>
                    </div>
                    <span className={`text-xs font-mono font-bold px-2 py-1 rounded-lg ${currentView === 'summary' ? 'bg-white/20' : 'bg-gray-100'}`}>
                        {grandTotal > 0 ? `${grandTotal.toFixed(0)}$` : '0$'}
                    </span>
                 </button>
             </div>
           </div>

           {/* Live Cart Summary Widget */}
           <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-purple-600"></div>
            <button onClick={() => setIsSummaryOpen(!isSummaryOpen)} className="w-full flex items-center justify-between text-slate-800 pb-2 mb-2 group">
                <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors"><Calculator className="w-4 h-4 text-slate-600" /></div>
                    <span className="font-bold text-sm">Esti. Budget</span>
                </div>
                {isSummaryOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            
            {isSummaryOpen && (
                <div className="space-y-4 pt-2 animate-in fade-in slide-in-from-top-2">
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        {['weekly', 'biweekly', 'monthly'].map((freq) => (
                             <button 
                                key={freq}
                                onClick={() => setPaymentFrequency(freq)} 
                                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${paymentFrequency === freq ? 'bg-white text-slate-800 shadow-sm' : 'text-gray-500 hover:text-slate-700'}`}
                             >
                                {freq === 'weekly' ? '1 Sem' : freq === 'biweekly' ? '2 Sem' : '1 Mois'}
                             </button>
                        ))}
                    </div>
                    
                    <div className="text-center py-2">
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">{frequencyLabel.main}</p>
                        <p className="text-3xl font-bold text-slate-800 tracking-tight">{periodicPrice.toFixed(2)}<span className="text-sm text-gray-400 ml-1">$</span></p>
                        <p className="text-[10px] text-gray-400 mt-1">{frequencyLabel.sub}</p>
                    </div>
                </div>
            )}
           </div>

           {currentView === 'shop' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
              <button onClick={() => setIsRayonsOpen(!isRayonsOpen)} className="w-full flex items-center justify-between text-slate-800 pb-2 mb-2">
                  <div className="flex items-center gap-2"><Menu className="w-4 h-4" /><span className="font-bold text-sm">Filtrer par Rayon</span></div>
                  {isRayonsOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </button>
              {isRayonsOpen && (
                  <nav className="space-y-1">
                      <button onClick={() => setSelectedCategory('All')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-bold ${selectedCategory === 'All' ? 'bg-slate-800 text-white shadow-md shadow-slate-200' : 'text-gray-500 hover:bg-gray-50 hover:text-slate-800'}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === 'All' ? 'bg-white' : 'bg-gray-300'}`}></div> Tout voir
                      </button>
                      {CATEGORIES.map((cat) => { 
                          const Icon = cat.icon; 
                          const isSelected = selectedCategory === cat.id;
                          return (
                            <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs font-bold ${isSelected ? 'bg-slate-100 text-slate-900' : 'text-gray-500 hover:bg-gray-50 hover:text-slate-800'}`}>
                                <Icon className={`w-4 h-4 ${isSelected ? 'text-red-600' : 'text-gray-400'}`} /> {cat.label}
                            </button>
                          ); 
                      })}
                  </nav>
              )}
            </div>
          )}
        </aside>

        {/* MOBILE BOTTOM NAVIGATION */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[9999] pb-safe shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center p-3">
                <button onClick={() => setCurrentView('shop')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === 'shop' ? 'text-red-600 bg-red-50' : 'text-gray-400'}`}>
                    <Home className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">Boutique</span>
                </button>
                <button onClick={() => setCurrentView('chef')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === 'chef' ? 'text-orange-600 bg-orange-50' : 'text-gray-400'}`}>
                    <ChefHat className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">Chef</span>
                </button>
                <button onClick={() => setCurrentView('chat')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === 'chat' ? 'text-purple-600 bg-purple-50' : 'text-gray-400'}`}>
                    <Wand2 className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">Assistant</span>
                </button>
                <button onClick={() => setIsCartOpen(true)} className="flex flex-col items-center p-2 rounded-xl text-gray-400 relative">
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && <span className="absolute top-1 right-2 w-3 h-3 bg-red-600 rounded-full border border-white"></span>}
                    <span className="text-[10px] font-bold mt-1">Panier</span>
                </button>
                <button onClick={() => setCurrentView('settings')} className={`flex flex-col items-center p-2 rounded-xl transition-all ${currentView === 'settings' ? 'text-slate-800 bg-gray-100' : 'text-gray-400'}`}>
                    <SettingsIcon className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">Admin</span>
                </button>
            </div>
        </nav>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-h-[calc(100vh-6rem)]">
          {currentView === 'settings' && (
             <div className="h-full">
                 <SettingsDashboard 
                    settings={useProducts().settings} 
                    setSettings={setSettings} 
                    products={products} 
                    setProducts={useProducts().setProducts} 
                    onReset={() => setCart([])} 
                    exportData={() => {}} 
                    onSave={saveProducts} 
                    onResetCatalog={resetCatalog} 
                 />
             </div>
          )}
          {currentView === 'client' && <ClientSection clientInfo={clientInfo} setClientInfo={setClientInfo} />}
          {currentView === 'info' && <InfoSection />}
          {currentView === 'evaluation' && <EvaluationSection formData={evaluationData} setFormData={setEvaluationData} products={products} />}
          {currentView === 'chat' && <KnowledgeChat />}
          {currentView === 'chef' && <ChefRescousseSection />}
          {currentView === 'smartplanner' && (
             <SmartPlanner 
                products={products} 
                evaluationData={evaluationData}
                clientInfo={clientInfo}
                onApplyPlan={(newCart, pickupSuggestions) => {
                    setCart(newCart);
                    if (pickupSuggestions) setPickupList(pickupSuggestions);
                    setCurrentView('shop');
                }}
             />
          )}
          {currentView === 'calendar' && <CalendarSection cart={cart} evaluationData={evaluationData} />}
          {currentView === 'tasting' && <TastingSection />}
          {currentView === 'succursales' && <SuccursalesSection />}
          {currentView === 'quality' && <QualityChecklist />}
          {currentView === 'summary' && <SummarySection cart={cart} grandTotal={grandTotal} clientInfo={clientInfo} pickupList={pickupList} settings={useProducts().settings} />}
          {currentView === 'shop' && (
            <>
              {/* Mobile Category Horizontal Scroll */}
              <div className="md:hidden overflow-x-auto flex gap-2 mb-4 pb-2 scrollbar-hide snap-x">
                  <button onClick={() => setSelectedCategory('All')} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border snap-start ${selectedCategory === 'All' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200'}`}>
                      Tout voir
                  </button>
                  {CATEGORIES.map((cat) => (
                      <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 snap-start ${selectedCategory === cat.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-600 border-gray-200'}`}>
                          {cat.label}
                      </button>
                  ))}
              </div>

              <div className="flex justify-between items-center mb-6 hidden md:flex">
                  <div>
                      <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{selectedCategory === 'All' ? 'Catalogue Complet' : CATEGORIES.find(c => c.id === selectedCategory)?.label}</h2>
                      <p className="text-sm text-gray-400 font-medium mt-1">{filteredProducts.length} produits disponibles</p>
                  </div>
              </div>
              
              {filteredProducts.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                      <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 text-gray-300" /></div>
                      <p className="text-gray-500 font-medium">Aucun produit trouvé.</p>
                  </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
                  {filteredProducts.map((product) => {
                    const isSale = product.salePrice !== undefined;
                    const discountPercentage = isSale ? Math.round(((product.price - (product.salePrice || 0)) / product.price) * 100) : 0;
                    const quantities = getProductQuantities(product.id);
                    const qtyInCart = (Object.values(quantities) as number[]).reduce((a: number, b: number) => a + b, 0);

                    return (
                      <div key={product.id} className={`group bg-white rounded-2xl border transition-all duration-300 hover:shadow-lg flex flex-col overflow-hidden relative ${qtyInCart > 0 ? 'border-slate-800 ring-1 ring-slate-800' : 'border-gray-200 hover:border-gray-300'}`}>
                        {/* Header: Title & Price (No Image) */}
                        <div className="p-4 pb-2">
                             <div className="flex justify-between items-start gap-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{product.name}</h3>
                                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">{product.format} • {product.sku}</p>
                                </div>
                                <div className="text-right flex flex-col items-end">
                                    {isSale ? (
                                        <>
                                           <span className="font-bold text-red-600 text-lg">{product.salePrice?.toFixed(2)}$</span>
                                           <span className="text-xs text-gray-400 line-through decoration-red-300">{product.price.toFixed(2)}$</span>
                                        </>
                                    ) : (
                                        <span className="font-bold text-slate-800 text-lg">{product.price.toFixed(2)}$</span>
                                    )}
                                </div>
                             </div>
                             
                             <div className="flex flex-wrap gap-1 mt-2">
                                {product.isPremium && <span className="text-[9px] bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-100 flex items-center gap-1 font-bold"><Tag className="w-3 h-3"/> Premium</span>}
                                {product.category === 'Halal' && <span className="text-[9px] bg-green-50 text-green-700 px-2 py-0.5 rounded-full border border-green-100 font-bold">Halal</span>}
                                {isSale && <span className="text-[9px] bg-red-50 text-red-600 px-2 py-0.5 rounded-full border border-red-100 font-bold">-{discountPercentage}%</span>}
                             </div>
                        </div>

                        {/* Delivery Grid (The Bento Box) - NO SCROLL */}
                        <div className="p-2 mt-auto">
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map((liv) => (
                                    <DeliveryCounter 
                                        key={liv} 
                                        label={`Liv ${liv}`} 
                                        count={quantities[liv]} 
                                        onPlus={() => updateQuantity(product, liv, 1)} 
                                        onMinus={() => updateQuantity(product, liv, -1)} 
                                    />
                                ))}
                            </div>
                        </div>

                        {qtyInCart > 0 && (
                            <button 
                                onClick={() => removeFromCart(product.id)} 
                                className="absolute top-2 right-2 p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors z-10"
                                title="Retirer du panier"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-5 border-b flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                  <ShoppingCart className="w-6 h-6" />
                  <div>
                      <h2 className="text-xl font-bold">Votre Panier</h2>
                      <p className="text-xs text-gray-400">{cartCount} articles</p>
                  </div>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                        <ShoppingCart className="w-16 h-16 mb-4 opacity-20" />
                        <p className="font-bold text-lg text-slate-500">Votre panier est vide</p>
                        <p className="text-sm">Ajoutez des produits pour commencer.</p>
                        <button onClick={() => setIsCartOpen(false)} className="mt-6 px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm">Parcourir la boutique</button>
                    </div>
                ) : (
                    cart.map((item) => (
                        <div key={item.product.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-slate-800 text-sm w-3/4">{item.product.name}</h4>
                                <span className="font-bold text-slate-900">{getPrice(item.product).toFixed(2)}$</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[1, 2, 3, 4].map(liv => {
                                    const qty = item.quantities[liv] || 0;
                                    if (qty === 0) return null;
                                    return (
                                        <div key={liv} className="bg-gray-50 rounded p-1 text-center border border-gray-100">
                                            <div className="text-[9px] uppercase font-bold text-gray-400">Liv {liv}</div>
                                            <div className="font-bold text-sm text-slate-800">{qty}</div>
                                        </div>
                                    )
                                })}
                            </div>
                            <button onClick={() => removeFromCart(item.product.id)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md"><X className="w-3 h-3"/></button>
                        </div>
                    ))
                )}
            </div>
            
            <div className="p-6 border-t bg-white space-y-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Sous-total</span>
                    <span className="font-bold">{grandTotal.toFixed(2)}$</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-slate-900">
                    <span>Total</span>
                    <span>{grandTotal.toFixed(2)}$</span>
                </div>
                <button 
                    onClick={() => { setIsCartOpen(false); setCurrentView('summary'); }} 
                    className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2"
                >
                    Passer à la caisse <ArrowDown className="w-4 h-4" />
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- APP WRAPPER ---
// Wraps the View logic in the Context Providers
export default function App() {
  return (
    <ProductProvider>
      <ClientProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </ClientProvider>
    </ProductProvider>
  );
}
