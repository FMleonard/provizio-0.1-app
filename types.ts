
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

// --- SRE RELIABILITY TYPES ---
export type LockState = 'SYSTEM_OPTIMIZED' | 'USER_PINNED' | 'HARD_CONSTRAINT';

export interface OptimizationScorecard {
    score: number;
    factors: {
        costEfficiency: number;
        preferenceMatch: number;
        varietyBonus: number;
    };
    decisionTime: string; // ISO Timestamp
    algorithmVersion: string;
}

// --- DETERMINISTIC GENERATION TYPES ---
export interface DeterministicPayload {
    REQUEST_ID: string; // Idempotency Key (UUID)
    MODEL_SEED: number; // Integer for deterministic RNG seeding
    INPUT_A: EvaluationData; // Core User Data
    CONSTRAINTS_B: any; // PlannerConfig rules
    PROMPT_INSTRUCTION?: string; // The strict prompt
}

export interface AppConfig {
    key: string;
    label: string;
    description: string;
    isActive: boolean;
    category: 'financial' | 'inventory' | 'display' | 'system';
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
  // SRE: State Consistency Fields
  lockState: LockState;
  decisionLog?: OptimizationScorecard;
  lastModifiedUTC?: string;
}

export interface Settings {
  minDeliveryAmount: number;
  magicienVarietyMode: string;
}

// --- UPDATED CLIENT INFO FOR FREEZER LOGIC ---
export interface ClientInfo {
  contactPrincipal: string;
  telephone: string;
  courriel: string;
  client2: string;
  adresse: string;
  ville: string;
  province: string;
  codePostal: string;
  
  // Freezer Specifics
  fridgeFreezerCapacity: number; // Standard usually 3.5 to 5 cu ft
  fridgeFreezerEfficiency: number; // e.g. 0.75 (75%)
  chestFreezerCapacity: number; // 0 if none, else 5, 7, 10, 15...
  chestFreezerEfficiency: number; // e.g. 0.90 (90%)
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
  
  // --- TEMPORAL PROTOCOL ---
  userIANATimeZone?: string; // P2: Context Variable (e.g., 'America/Chicago')
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

// --- PLANNER CONFIGURATION TYPES ---
export interface VarietyConfig {
    maxRedMeatPercentage: number; // e.g. 0.45 (45%)
    minFishPercentage: number;
    diversityPenaltyWeight: number; // 0 to 10 impact score
    forceVarietyInjection: boolean;
}

export interface TimeZoneProtocol {
    storageStandard: 'UTC'; // P1: Backend Storage Rule
    contextVariable: 'User_IANA_TimeZone'; // P2: Context Variable
    evaluationScope: 'Local_Wall_Clock_Time'; // P3: Runtime Evaluation Scope
}

export interface PlannerConfig {
    id: string; // Version ID
    name: string;
    status: 'live' | 'draft' | 'archived';
    timestamp: string;
    
    // Core Logic Params
    budget: { weeklyCap: number; maxPricePerKg: number; };
    custody: { childFactor: number; teenFactor: number; };
    essentials: { maxItems: number; excludePremium: boolean; };
    vip: { premiumTarget: number; sortingWeight: number; };
    condo: { overflowThreshold: number; packDensity: number; };
    
    // New Variety Control Engine
    variety: VarietyConfig;

    // Temporal Settings
    timeZoneProtocol: TimeZoneProtocol;
}
