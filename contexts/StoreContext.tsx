

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, CartItem, ClientInfo, Settings, EvaluationData, KnowledgeSource, AppConfig, LockState, PlannerConfig } from '../types';
import { PRODUCT_CATALOG, detectSmartCategory, DEFAULT_APP_CONFIGS, DEFAULT_PLANNER_CONFIG } from '../constants';

// --- 1. PRODUCT & SETTINGS CONTEXT ---
interface ProductContextType {
  // Live Catalog (Backward Compatible)
  products: Product[]; 
  setProducts: (products: Product[]) => void;
  
  // Staging Catalog (Knowledge System)
  stagingProducts: Product[];
  setStagingProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  commitStagingToLive: () => void;
  discardStaging: () => void;
  
  // Settings & Utils
  settings: Settings;
  setSettings: (settings: Settings) => void;
  
  // New Logic Control
  appConfigs: AppConfig[];
  toggleConfig: (key: string) => void;
  addAppConfig: (config: AppConfig) => void;
  resetAppConfigs: () => void;

  // Smart Planner Logic Control
  plannerConfig: PlannerConfig;
  updatePlannerConfig: (newConfig: PlannerConfig) => void;

  saveProducts: () => void;
  resetCatalog: () => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const HARDCODED_DEFAULTS: Record<string, string[]> = {
    'Boeuf': ['b_1534S', 'b_tbone', 'b_821416', 'b_821425', 'b_821343'],
    'Poulet': ['p_QC10114', 'p_QC11009', 'p_hache', 'p_821369', 'p_QC10608'],
    'Porc': ['po_filet', 'po_821252', 'po_saucisse_it', 'po_821524', 'po_811975'],
    'Poisson': ['f_821256', 'f_truite', 'f_morue', 'f_821347', 'f_petoncle'],
    'Extra': ['pm_821379', 'pm_pat', 'pm_shep', 'pm_sauce', 'p_croq']
};

export const ProductProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({ minDeliveryAmount: 1000, magicienVarietyMode: 'balanced' });
  
  // LIVE CATALOG: The single source of truth for the shop
  const [liveCatalog, setLiveCatalog] = useState<Product[]>(() => {
    try {
        const saved = localStorage.getItem('amq_products_v1');
        let initialProducts = saved ? JSON.parse(saved) : PRODUCT_CATALOG; 
        return initialProducts.map((p: Product) => ({
            ...p,
            category: detectSmartCategory(p.name, p.category),
            isAvailable: true,
            managementCategory: p.managementCategory || 'base',
            // Default KM fields for legacy data
            source: p.source || 'system',
            stagingStatus: 'live',
            confidenceScore: p.confidenceScore ?? 1
        }));
    } catch (e) {
        return PRODUCT_CATALOG;
    }
  });

  // STAGING CATALOG: Incoming data buffer
  const [stagingCatalog, setStagingCatalog] = useState<Product[]>(() => {
    try {
        const savedStaging = localStorage.getItem('amq_staging_v1');
        return savedStaging ? JSON.parse(savedStaging) : [];
    } catch (e) {
        return [];
    }
  });

  // APP CONFIGS: Global logic switches
  const [appConfigs, setAppConfigs] = useState<AppConfig[]>(() => {
      try {
          const saved = localStorage.getItem('amq_app_configs');
          return saved ? JSON.parse(saved) : DEFAULT_APP_CONFIGS;
      } catch {
          return DEFAULT_APP_CONFIGS;
      }
  });

  // PLANNER CONFIG: Smart Planner Rules
  const [plannerConfig, setPlannerConfig] = useState<PlannerConfig>(() => {
      try {
          const saved = localStorage.getItem('amq_planner_config');
          return saved ? JSON.parse(saved) : DEFAULT_PLANNER_CONFIG;
      } catch {
          return DEFAULT_PLANNER_CONFIG;
      }
  });

  // Persist Staging Changes
  useEffect(() => {
    localStorage.setItem('amq_staging_v1', JSON.stringify(stagingCatalog));
  }, [stagingCatalog]);

  // Persist App Configs
  useEffect(() => {
    localStorage.setItem('amq_app_configs', JSON.stringify(appConfigs));
  }, [appConfigs]);

  // Persist Planner Config
  useEffect(() => {
    localStorage.setItem('amq_planner_config', JSON.stringify(plannerConfig));
  }, [plannerConfig]);

  const saveProducts = () => {
    try {
        localStorage.setItem('amq_products_v1', JSON.stringify(liveCatalog));
    } catch (e) {
        alert("Erreur lors de la sauvegarde.");
    }
  };

  const resetCatalog = () => {
    if(confirm("Êtes-vous sûr de vouloir réinitialiser le catalogue ?")) {
        localStorage.removeItem('amq_products_v1');
        setLiveCatalog((PRODUCT_CATALOG as unknown as Product[]).map(p => ({
            ...p,
            category: detectSmartCategory(p.name, p.category),
            isAvailable: true,
            source: 'system',
            stagingStatus: 'live',
            confidenceScore: 1
        }))); 
    }
  };

  const toggleConfig = (key: string) => {
      setAppConfigs(prev => prev.map(c => c.key === key ? { ...c, isActive: !c.isActive } : c));
  };

  const addAppConfig = (config: AppConfig) => {
      setAppConfigs(prev => [...prev, config]);
  };

  const resetAppConfigs = () => {
      setAppConfigs(DEFAULT_APP_CONFIGS);
      alert("Configuration système réinitialisée aux valeurs d'usine.");
  };

  const updatePlannerConfig = (newConfig: PlannerConfig) => {
      setPlannerConfig(newConfig);
  };

  // KMS: Commit Staging to Live
  const commitStagingToLive = () => {
      if (stagingCatalog.length === 0) return;

      const newLive = [...liveCatalog];
      let updatedCount = 0;
      let newCount = 0;

      stagingCatalog.forEach(stageItem => {
          const idx = newLive.findIndex(p => p.id === stageItem.id || p.sku === stageItem.sku);
          const liveItem = { ...stageItem, stagingStatus: 'live' as const, lastUpdated: new Date().toISOString() };

          if (idx >= 0) {
              // Update existing
              newLive[idx] = { ...newLive[idx], ...liveItem };
              updatedCount++;
          } else {
              // Add new
              newLive.push(liveItem);
              newCount++;
          }
      });

      setLiveCatalog(newLive);
      setStagingCatalog([]); // Clear staging
      localStorage.setItem('amq_products_v1', JSON.stringify(newLive));
      alert(`Catalogue mis à jour: ${newCount} ajouts, ${updatedCount} modifications.`);
  };

  // KMS: Discard Staging
  const discardStaging = () => {
      if(confirm("Supprimer tous les produits en attente ?")) {
          setStagingCatalog([]);
      }
  };

  return (
    <ProductContext.Provider value={{ 
        products: liveCatalog, // Backward compatibility
        setProducts: setLiveCatalog, // Backward compatibility
        stagingProducts: stagingCatalog,
        setStagingProducts: setStagingCatalog,
        commitStagingToLive,
        discardStaging,
        settings, 
        setSettings, 
        appConfigs,
        toggleConfig,
        addAppConfig,
        resetAppConfigs,
        plannerConfig,
        updatePlannerConfig,
        saveProducts, 
        resetCatalog 
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProducts must be used within a ProductProvider');
  return context;
};


// --- 2. CLIENT & EVALUATION CONTEXT ---
interface ClientContextType {
  clientInfo: ClientInfo;
  setClientInfo: (info: ClientInfo) => void;
  evaluationData: EvaluationData;
  setEvaluationData: (data: EvaluationData) => void;
  pickupList: Product[];
  setPickupList: (list: Product[]) => void;
  addToPickupList: (product: Product) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ 
      contactPrincipal: '', telephone: '', courriel: '', client2: '', 
      adresse: '', ville: '', province: 'Québec', codePostal: '',
      // Freezer Defaults
      fridgeFreezerCapacity: 3.5, 
      fridgeFreezerEfficiency: 0.75,
      chestFreezerCapacity: 0, // None by default
      chestFreezerEfficiency: 0.90
  });
  const [pickupList, setPickupList] = useState<Product[]>([]);

  const [evaluationData, setEvaluationData] = useState<EvaluationData>(() => {
      // Build Initial Custom Selections
      const initialCustomSelections: Record<string, string> = {};
      const categories = ['Boeuf', 'Poulet', 'Porc', 'Poisson', 'Extra'];
      
      categories.forEach(cat => {
          const defaults = HARDCODED_DEFAULTS[cat] || [];
          defaults.forEach((prodId, index) => {
             const slotKey = `${cat.toLowerCase()}_slot_${index + 1}`;
             initialCustomSelections[slotKey] = prodId;
          });
      });

      return { 
          adults: 2, children: 0, childrenFrequency: 'full', childrenVacationDays: 0, 
          teens: 0, teensFrequency: 'full', teensVacationDays: 0, isYoungChild: false, 
          mealsPerWeek: 5, proteinDays: [1,1,1,1,1,0,0], restaurantFrequency: 0, 
          premiumFrequency: 12, proteinRepetition: 3, gramsPerPerson: 150, 
          restrictions: '', currentGrocery: '', hasPreviousService: false, notes: '',
          proteinSubPreferences: {}, 
          customSelections: initialCustomSelections,
          // P2: Context Variable Init
          userIANATimeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      };
  });

  const addToPickupList = (product: Product) => setPickupList(prev => [...prev, product]);

  return (
    <ClientContext.Provider value={{ clientInfo, setClientInfo, evaluationData, setEvaluationData, pickupList, setPickupList, addToPickupList }}>
      {children}
    </ClientContext.Provider>
  );
};

export const useClient = () => {
  const context = useContext(ClientContext);
  if (!context) throw new Error('useClient must be used within a ClientProvider');
  return context;
};


// --- 3. CART CONTEXT ---
interface CartContextType {
  cart: CartItem[];
  setCart: (cart: CartItem[]) => void;
  updateQuantity: (product: Product, deliveryIndex: number, delta: number) => void;
  updateLockState: (product: Product, state: LockState) => void;
  removeFromCart: (productId: string) => void;
  grandTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  const updateQuantity = (product: Product, deliveryIndex: number, delta: number) => {
      setCart((prevCart) => {
        const existingItemIndex = prevCart.findIndex((item) => item.product.id === product.id);

        if (existingItemIndex > -1) {
          const newCart = [...prevCart];
          const existingItem = newCart[existingItemIndex];
          const currentQty = existingItem.quantities[deliveryIndex] || 0;
          const newQty = Math.max(0, currentQty + delta);
          
          const newQuantities = { ...existingItem.quantities, [deliveryIndex]: newQty };
          const totalQty = (Object.values(newQuantities) as number[]).reduce((sum, q) => sum + q, 0);

          if (totalQty <= 0) return prevCart.filter((_, index) => index !== existingItemIndex);

          // SRE: If user manually changes quantity, we assume it's a manual override (USER_PINNED)
          // unless explicitly handled elsewhere.
          const newLockState = delta !== 0 ? 'USER_PINNED' : existingItem.lockState;

          newCart[existingItemIndex] = { 
              ...existingItem, 
              quantities: newQuantities,
              lockState: newLockState,
              lastModifiedUTC: new Date().toISOString()
          };
          return newCart;
        } else if (delta > 0) {
          // New Item Default: SYSTEM_OPTIMIZED (Subject to change by user)
          // If added via UI (Manual), logic in App.tsx might need to flip this, but for now defaults to User Pinned if manual
          return [...prevCart, { 
              product, 
              quantities: { [deliveryIndex]: delta },
              lockState: 'USER_PINNED', // Manual Add = User Pinned
              lastModifiedUTC: new Date().toISOString()
          }];
        }
        return prevCart;
      });
  };

  const updateLockState = (product: Product, state: LockState) => {
      setCart(prev => prev.map(item => 
          item.product.id === product.id ? { ...item, lockState: state } : item
      ));
  };

  const removeFromCart = (productId: string) => setCart((prev) => prev.filter((item) => item.product.id !== productId));

  const grandTotal = useMemo(() => {
    let grand = 0; 
    cart.forEach(item => {
      const price = item.product.salePrice || item.product.price;
      [1, 2, 3, 4].forEach(liv => { 
          const qty = item.quantities[liv] || 0; 
          grand += price * qty; 
      });
    });
    return grand;
  }, [cart]);

  const cartCount = cart.reduce((sum: number, item) => sum + (Object.values(item.quantities) as number[]).reduce((a, b) => a + b, 0), 0);

  return (
    <CartContext.Provider value={{ cart, setCart, updateQuantity, updateLockState, removeFromCart, grandTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
