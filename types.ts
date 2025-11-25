
export interface Product {
  id: string;
  sku: string;
  name: string;
  format: string;
  price: number;
  salePrice?: number;
  category: string;
  unitCount?: number;
  totalWeightGrams?: number;
  consumptionType: string;
  isAvailable: boolean;
  proteinType?: string;
  texture?: string;
  managementCategory?: string;
  isPremium?: boolean;
  seasonality?: string;
  isAppetizer?: boolean;
  isBreakfast?: boolean;
  supplier?: string;
  // New fields for deep scraping
  description?: string;
  imageUrl?: string;
  productUrl?: string;
}

export interface CartItem {
  product: Product;
  quantities: { [key: number]: number };
}

export interface Settings {
  minDeliveryAmount: number;
  magicienVarietyMode: string;
}

export interface ClientInfo {
  contactPrincipal: string;
  telephone: string;
  courriel: string;
  client2: string;
  adresse: string;
  ville: string;
  province: string;
  codePostal: string;
  freezerType?: 'fridge' | 'chest_small' | 'chest_medium' | 'chest_large';
  freezerCapacity?: number; // in cubic feet
}

export interface EvaluationData {
  adults: number;
  children: number;
  childrenFrequency: string;
  childrenVacationDays: number;
  teens: number;
  teensFrequency: string;
  teensVacationDays: number;
  isYoungChild: boolean;
  mealsPerWeek: number;
  proteinDays: number[];
  restaurantFrequency: number;
  premiumFrequency: number;
  proteinRepetition: number;
  gramsPerPerson: number;
  restrictions: string;
  currentGrocery: string;
  hasPreviousService: boolean;
  notes?: string;
  // New Granular Preferences (The "Butcher's List")
  // Key format: "Category|Texture" (e.g., "Boeuf|steak", "Poulet|breast")
  // Value: Meals per week (0, 0.25, 0.5, 1, 2...)
  proteinSubPreferences: Record<string, number>;
  // Stores specific Product IDs for custom slots (e.g. { 'beef_slot_1': 'p_123' })
  customSelections: Record<string, string>;
}

// Knowledge Base Types (Based on PDF)
export interface ConsumptionProfile {
    id: string;
    label: string;
    proteinPerSupper: number; // grams
    description: string;
    recommendedOrderFreq: number; // orders per year
}

export interface FreezerSpec {
    cubicFeet: number;
    capacityLbs: number; // 1 cu ft = 25 lbs (approx)
    description: string;
}
