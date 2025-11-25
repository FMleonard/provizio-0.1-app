

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
  description?: string;
  imageUrl?: string;
  productUrl?: string;

  // --- KNOWLEDGE MANAGEMENT FIELDS ---
  source?: 'manual' | 'scrape' | 'upload' | 'system';
  lastUpdated?: string; // ISO Date String
  confidenceScore?: number; // 0.0 to 1.0
  stagingStatus?: 'live' | 'draft' | 'conflict' | 'archived';
  originalSourceFileId?: string; // Reference to KnowledgeSource.id
}

export interface KnowledgeSource {
  id: string;
  filename: string;
  uploadDate: string;
  fileType: 'pdf' | 'excel' | 'csv' | 'json';
  status: 'processing' | 'completed' | 'error';
  processedContent?: any; 
  itemCount?: number;
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
  
  // Tracks the active AI Template (Package)
  selectedPersonaId?: string;
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

// --- MODULE 3: AUTOMATION RULES ---
export type RuleTriggerField = 'name' | 'category' | 'price' | 'sku';
export type RuleOperator = 'contains' | 'equals' | 'starts_with' | 'greater_than' | 'less_than';
export type RuleActionType = 'set_season' | 'set_category' | 'flag_premium' | 'set_consumption' | 'exclude';

export interface AutomationRule {
    id: string;
    name: string;
    active: boolean;
    trigger: {
        field: RuleTriggerField;
        operator: RuleOperator;
        value: string | number;
    };
    action: {
        type: RuleActionType;
        value: string | number | boolean;
    };
    lastApplied?: string;
}