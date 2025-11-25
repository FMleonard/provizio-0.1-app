
import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Product, CartItem, ClientInfo, Settings, EvaluationData } from '../types';
import { PRODUCT_CATALOG, detectSmartCategory } from '../constants';

// --- 1. PRODUCT & SETTINGS CONTEXT ---
interface ProductContextType {
  products: Product[];
  setProducts: (products: Product[]) => void;
  settings: Settings;
  setSettings: (settings: Settings) => void;
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
  
  const [products, setProducts] = useState<Product[]>(() => {
    try {
        const saved = localStorage.getItem('amq_products_v1');
        let initialProducts = saved ? JSON.parse(saved) : PRODUCT_CATALOG; 
        return initialProducts.map((p: Product) => ({
            ...p,
            category: detectSmartCategory(p.name, p.category),
            isAvailable: true,
            // Re-calc management category to ensure data integrity
            managementCategory: p.managementCategory || 'base' 
        }));
    } catch (e) {
        return PRODUCT_CATALOG;
    }
  });

  const saveProducts = () => {
    try {
        localStorage.setItem('amq_products_v1', JSON.stringify(products));
    } catch (e) {
        alert("Erreur lors de la sauvegarde.");
    }
  };

  const resetCatalog = () => {
    if(confirm("Êtes-vous sûr de vouloir réinitialiser le catalogue ?")) {
        localStorage.removeItem('amq_products_v1');
        // Force reload from constant
        setProducts((PRODUCT_CATALOG as unknown as Product[]).map(p => ({
            ...p,
            category: detectSmartCategory(p.name, p.category),
            isAvailable: true
        }))); 
    }
  };

  return (
    <ProductContext.Provider value={{ products, setProducts, settings, setSettings, saveProducts, resetCatalog }}>
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
  addToPickupList: (product: Product) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

export const ClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [clientInfo, setClientInfo] = useState<ClientInfo>({ contactPrincipal: '', telephone: '', courriel: '', client2: '', adresse: '', ville: '', province: 'Québec', codePostal: '' });
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
          customSelections: initialCustomSelections
      };
  });

  const addToPickupList = (product: Product) => setPickupList(prev => [...prev, product]);

  return (
    <ClientContext.Provider value={{ clientInfo, setClientInfo, evaluationData, setEvaluationData, pickupList, addToPickupList }}>
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

          newCart[existingItemIndex] = { ...existingItem, quantities: newQuantities };
          return newCart;
        } else if (delta > 0) {
          return [...prevCart, { product, quantities: { [deliveryIndex]: delta } }];
        }
        return prevCart;
      });
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
    <CartContext.Provider value={{ cart, setCart, updateQuantity, removeFromCart, grandTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
