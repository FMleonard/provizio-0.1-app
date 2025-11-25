




import { Percent, Beef, Drumstick, ChefHat, Fish, ScrollText, DollarSign, Utensils, Flame, PiggyBank, Dumbbell, Zap, Box, UserPlus } from 'lucide-react';
import { HalalIcon } from './components/HalalIcon';
import { AppConfig, PlannerConfig } from './types';

// --- LOGIC CONTROL CENTER DEFAULTS ---
export const DEFAULT_APP_CONFIGS: AppConfig[] = [
    { 
        key: 'tax_exempt_food', 
        label: 'Exemption Taxes Alimentaires', 
        description: 'Si actif, aucune taxe n\'est appliquée sur les produits de catégorie alimentaire.', 
        isActive: true, 
        category: 'financial' 
    },
    { 
        key: 'display_3_decimals', 
        label: 'Format Monétaire Précis', 
        description: 'Afficher 3 décimales (ex: 0.045$) pour les coûts unitaires.', 
        isActive: false, 
        category: 'display' 
    },
    { 
        key: 'stock_alert_strict', 
        label: 'Alerte Stock Stricte', 
        description: 'Déclencher une alerte rouge immédiate si le stock calculé est ≤ 0.', 
        isActive: true, 
        category: 'inventory' 
    },
    { 
        key: 'dual_unit_display', 
        label: 'Double Unité (Lbs + Kg)', 
        description: 'Afficher simultanément le poids en Livres et en Kilogrammes.', 
        isActive: true, 
        category: 'display' 
    },
    { 
        key: 'auto_recalc_portion', 
        label: 'Recalcul Portion Auto', 
        description: 'Mettre à jour le coût portion immédiatement si le prix d\'un ingrédient change.', 
        isActive: true, 
        category: 'financial' 
    },
    { 
        key: 'prevent_zero_cost_save', 
        label: 'Validation Prix', 
        description: 'Interdire la sauvegarde ou l\'ajout au panier d\'un produit à 0.00$.', 
        isActive: true, 
        category: 'system' 
    },
    { 
        key: 'auto_loss_calculation', 
        label: 'Calcul de Perte Auto', 
        description: 'Appliquer automatiquement un % de perte standard aux produits bruts.', 
        isActive: false, 
        category: 'financial' 
    },
    { 
        key: 'show_supplier_ref', 
        label: 'Afficher Réf. Fournisseur', 
        description: 'Montrer le code fournisseur dans les listes de produits.', 
        isActive: false, 
        category: 'display' 
    },
    { 
        key: 'enforce_fr_lang', 
        label: 'Forcer Langue FR', 
        description: 'Empêcher l\'utilisation de termes anglais dans les noms de produits.', 
        isActive: false, 
        category: 'system' 
    },
    { 
        key: 'strict_inventory_lock', 
        label: 'Verrouillage Inventaire', 
        description: 'Empêcher la modification des produits si une commande est en cours.', 
        isActive: false, 
        category: 'inventory' 
    }
];

export const DEFAULT_PLANNER_CONFIG: PlannerConfig = {
    id: 'v1.0.0',
    name: 'Factory Default',
    status: 'live',
    timestamp: new Date().toISOString(),
    budget: { weeklyCap: 125, maxPricePerKg: 28 },
    custody: { childFactor: 0.5, teenFactor: 0.75 },
    essentials: { maxItems: 5, excludePremium: true },
    vip: { premiumTarget: 104, sortingWeight: 2.0 },
    condo: { overflowThreshold: 1.0, packDensity: 25 },
    variety: { maxRedMeatPercentage: 0.40, minFishPercentage: 0.10, diversityPenaltyWeight: 5, forceVarietyInjection: true },
    timeZoneProtocol: {
        storageStandard: 'UTC',
        contextVariable: 'User_IANA_TimeZone',
        evaluationScope: 'Local_Wall_Clock_Time'
    }
};

// --- AMQ KNOWLEDGE BASE (From PDF Report 2025) ---
export const AMQ_KNOWLEDGE_BASE = {
    // Page 3: Profils de Consommation
    profiles: [
        {
            id: 'single',
            label: 'Personne Seule',
            proteinPerSupper: 115, // 115g per supper
            description: "Congélateur domestique suffisant.",
            recommendedFreq: 1, // Annual order implies small freezer logic or single batch
            icon: 'User'
        },
        {
            id: 'couple',
            label: 'Couple',
            proteinPerSupper: 230, // 230g per supper
            description: "Commandes bimensuelles ou annuelles recommandées.",
            recommendedFreq: 2,
            icon: 'Users'
        },
        {
            id: 'family_small',
            label: 'Famille (2 enfants <12)',
            proteinPerSupper: 390, // 390g per supper
            description: "Optimisation budget et gaspillage (-48%).",
            recommendedFreq: 4,
            icon: 'Baby'
        },
        {
            id: 'family_teens',
            label: 'Famille (2 ados)',
            proteinPerSupper: 520, // Extrapolated from Chart Page 8
            description: "Volume élevé, nécessite congélateur coffre.",
            recommendedFreq: 4,
            icon: 'UserPlus'
        }
    ],
    // Page 6: Espace Congélateur
    freezerLogic: {
        lbsPerCubicFoot: 25, // 1 pi3 = 25 lbs
        fridgeFreezerCapacity: 3.5, // 3.5 pi3 standard fridge freezer
        chestRecommendedFamily: 7, // 7-10 pi3 recommended for family
    },
    // Page 5: Savings
    financials: {
        annualSavingsMin: 0.12, // 12%
        annualSavingsMax: 0.32, // 32%
        wasteReduction: 0.48 // 48%
    },
    // Page 4: Halal Trends
    halal: {
        growth: 0.18, // +18% demand
        avgStorage: 11.5 // 9-14 cu ft avg
    }
};

export const CATEGORIES = [
  { id: 'Rabais', label: 'En Rabais', icon: Percent },
  { id: 'Halal', label: 'Halal', icon: HalalIcon },
  { id: 'Boeuf', label: 'Bœuf', icon: Beef },
  { id: 'Poulet', label: 'Poulet', icon: Drumstick },
  { id: 'Porc', label: 'Porc', icon: ChefHat },
  { id: 'Poisson/Fruits de mer', label: 'Poissons & Mer', icon: Fish },
  { id: 'Gibier & Autres', label: 'Gibier & Autres', icon: ScrollText },
  { id: 'Prêt-à-manger', label: 'Prêt-à-manger', icon: DollarSign },
  { id: 'Epices', label: 'Épices & Autres', icon: Utensils },
];

export const detectSmartCategory = (name: string, currentCategory: string = ''): string => {
    const n = name.toLowerCase();
    
    // 1. Épices & Assaisonnements (Requested Priority)
    if (n.includes('épice') || n.includes('epice') || n.includes('rub') || n.includes('sauce') || n.includes('assaisonnement') || n.includes('marinade') || n.includes('sel ') || n.includes('poivre')) {
        return 'Epices';
    }

    // 2. Prêt-à-manger (Explicit overrides for prepared meals)
    if (n.includes('pâté') || n.includes('lasagne') || n.includes('pizza') || n.includes('tourtière') || n.includes('quiche')) {
        return 'Prêt-à-manger';
    }

    // 3. Specific Poultry keywords (Aileron, Pilon -> Poulet)
    if (n.includes('aileron') || n.includes('pilon') || n.includes('haut de cuisse') || n.includes('poulet') || n.includes('volaille') || n.includes('dinde')) {
        return 'Poulet';
    }

    // 4. Specific Pork keywords (Bacon, Saucisse -> Porc)
    // Note: Saucisse is usually Porc, unless specific meat is mentioned. Since we checked Poultry above, "Saucisse de poulet" should be caught there if order matters. 
    // However, simplest rule "contains saucisse -> Porc" works for 90% of cases in this catalog.
    if (n.includes('porc') || n.includes('pork') || n.includes('bacon') || n.includes('saucisse') || n.includes('jambon') || n.includes('cote levée') || n.includes('côte levée') || n.includes('flanc')) {
        return 'Porc';
    }

    // 5. Beef keywords
    if (n.includes('boeuf') || n.includes('bœuf') || n.includes('beef') || n.includes('steak') || n.includes('bavette') || n.includes('ribeye') || n.includes('t-bone') || n.includes('tomahawk') || n.includes('viande fumée') || n.includes('smoked meat') || n.includes('burger')) {
        return 'Boeuf';
    }

    // 6. Fish/Seafood keywords
    if (n.includes('poisson') || n.includes('saumon') || n.includes('truite') || n.includes('morue') || n.includes('crevette') || n.includes('homard') || n.includes('pétoncle') || n.includes('fruit de mer') || n.includes('tilapia') || n.includes('aiglefin')) {
        return 'Poisson/Fruits de mer';
    }

    // 7. Game keywords
    if (n.includes('bison') || n.includes('cerf') || n.includes('canard') || n.includes('agneau') || n.includes('cheval')) {
        return 'Gibier & Autres';
    }

    // Fallback to existing category normalization
    const c = currentCategory.toLowerCase();
    if (c.includes('boeuf')) return 'Boeuf';
    if (c.includes('poulet')) return 'Poulet';
    if (c.includes('porc')) return 'Porc';
    if (c.includes('poisson') || c.includes('mer')) return 'Poisson/Fruits de mer';
    if (c.includes('gibier')) return 'Gibier & Autres';
    if (c.includes('prêt')) return 'Prêt-à-manger';
    if (c.includes('epice')) return 'Epices';

    return currentCategory || 'Autre';
};

// --- PERSONA TEMPLATES (Package Scenarios) ---
// These define the "Default State" for specific user archetypes
export const PERSONA_TEMPLATES = [
    {
        id: 'family_budget',
        label: 'Famille Budget (4p)',
        description: 'Optimisé pour ~100$/sem. Gros formats, mijotés.',
        iconName: 'PiggyBank',
        color: 'green',
        rules: {
            'Boeuf': [
                { keywords: ['haché', 'ground'], freq: 2 },
                { keywords: ['cube', 'ragoût', 'stew'], freq: 1 },
                { keywords: ['palette', 'rôti'], freq: 0.5 },
            ],
            'Poulet': [
                { keywords: ['entier', 'whole'], freq: 1 },
                { keywords: ['haut de cuisse', 'thigh'], freq: 2 },
                { keywords: ['pilon', 'drumstick'], freq: 1 },
            ],
            'Porc': [
                { keywords: ['longe', 'rôti'], freq: 0.5 },
                { keywords: ['saucisse'], freq: 1 },
            ],
            'Extra': [
                { keywords: ['pâté'], freq: 1 },
            ]
        }
    },
    {
        id: 'shared_custody',
        label: 'Garde Partagée',
        description: 'Flexible. Plats enfants et repas rapides.',
        iconName: 'UserPlus',
        color: 'orange',
        rules: {
            'Boeuf': [
                { keywords: ['burger', 'haché'], freq: 2 },
                { keywords: ['minute', 'tournedos'], freq: 1 },
            ],
            'Poulet': [
                { keywords: ['croquette', 'nugget'], freq: 2 },
                { keywords: ['brochette', 'souvlaki'], freq: 1 },
                { keywords: ['pané'], freq: 1 },
            ],
            'Extra': [
                { keywords: ['pâté'], freq: 1 },
                { keywords: ['sauce'], freq: 1 },
                { keywords: ['lasagne'], freq: 1 },
            ]
        }
    },
    {
        id: 'essentials',
        label: 'Les 5 Essentiels',
        description: '5 repas simples par semaine. Poulet, Bœuf, Porc.',
        iconName: 'Zap',
        color: 'blue',
        rules: {
            'Boeuf': [
                { keywords: ['haché', 'ground'], freq: 2 },
            ],
            'Poulet': [
                { keywords: ['poitrine', 'breast'], freq: 2 },
            ],
            'Porc': [
                { keywords: ['côtelette', 'chop'], freq: 1 },
            ]
        }
    },
    {
        id: 'premium',
        label: 'Gastronome VIP',
        description: 'Upgrade. Steaks, Fruits de mer, Veau, Canard.',
        iconName: 'Flame',
        color: 'purple',
        rules: {
            'Boeuf': [
                { keywords: ['filet mignon'], freq: 1 },
                { keywords: ['ribeye', 'faux-filet'], freq: 1 },
                { keywords: ['bavette'], freq: 0.5 },
            ],
            'Poisson': [
                { keywords: ['pétoncle'], freq: 1 },
                { keywords: ['homard', 'crevette'], freq: 0.5 },
                { keywords: ['saumon'], freq: 1 },
            ],
             'Gibier & Autres': [
                { keywords: ['veau'], freq: 0.5 },
                { keywords: ['canard'], freq: 0.5 }
            ]
        }
    },
    {
        id: 'condo_storage',
        label: 'Espace Condo',
        description: 'Compact. Emballages plats sous-vide.',
        iconName: 'Box',
        color: 'yellow',
        rules: {
            'Boeuf': [
                { keywords: ['bavette'], freq: 1 },
                { keywords: ['tournedos'], freq: 1 },
                { keywords: ['steak'], freq: 1 },
            ],
            'Poulet': [
                { keywords: ['poitrine', 'breast'], freq: 2 },
                { keywords: ['tournedos'], freq: 1 },
            ],
            'Poisson': [
                { keywords: ['filet'], freq: 2 },
            ],
            'Porc': [
                { keywords: ['saucisse'], freq: 1 },
                { keywords: ['bacon'], freq: 0.5 },
            ]
        }
    }
];

export const PRODUCT_CATALOG = [
  // --- BŒUF (Base & Premium) ---
  {"id": "b_821397", "sku": "821397", "name": "Bœuf haché extra maigre", "format": "10 X 454G", "price": 89.90, "category": "Boeuf", "unitCount": 10, "totalWeightGrams": 4540, "consumptionType": "staple", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "ground", "managementCategory": "base"},
  {"id": "b_1534S", "sku": "1534-S", "name": "Bœuf Haché Maigre", "format": "10 X 454G", "price": 83.00, "category": "Boeuf", "unitCount": 10, "totalWeightGrams": 4540, "consumptionType": "staple", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "ground", "managementCategory": "base"},
  {"id": "b_811625", "sku": "811625", "name": "Steak Minute AAA", "format": "24 X 110G", "price": 150.90, "category": "Boeuf", "unitCount": 24, "totalWeightGrams": 2640, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "steak", "managementCategory": "base"},
  {"id": "b_821343", "sku": "821343", "name": "Cubes de boeuf à ragoût", "format": "8 X 454G", "price": 146.70, "category": "Boeuf", "unitCount": 8, "totalWeightGrams": 3632, "consumptionType": "staple", "isAvailable": true, "seasonality": "winter", "proteinType": "Viande Rouge", "texture": "cube", "managementCategory": "base"},
  {"id": "b_fondue", "sku": "821999", "name": "Cubes pour Fondue Chinoise", "format": "10 X 350G", "price": 155.00, "category": "Boeuf", "unitCount": 10, "totalWeightGrams": 3500, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "slice", "managementCategory": "medium"},
  {"id": "b_811930", "sku": "811930", "name": "Tournedos de boeuf", "format": "24 X 110G", "price": 186.90, "category": "Boeuf", "unitCount": 24, "totalWeightGrams": 2640, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "steak", "managementCategory": "base"},
  {"id": "b_821416", "sku": "821416", "name": "Bavette de boeuf marinée", "format": "12 X 224G", "price": 274.70, "category": "Boeuf", "unitCount": 12, "totalWeightGrams": 2688, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Viande Rouge", "texture": "steak", "managementCategory": "premium"},
  {"id": "b_821421", "sku": "821421", "name": "Filet mignon AAA+ 6 oz", "format": "12 X 170G", "price": 357.90, "category": "Boeuf", "unitCount": 12, "totalWeightGrams": 2040, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Viande Rouge", "texture": "steak", "managementCategory": "premium"},
  {"id": "b_ribeye", "sku": "821888", "name": "Faux-Filet (Ribeye) AAA", "format": "10 X 340G", "price": 310.00, "category": "Boeuf", "unitCount": 10, "totalWeightGrams": 3400, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Viande Rouge", "texture": "steak", "managementCategory": "premium"},
  {"id": "b_tbone", "sku": "821777", "name": "T-Bone Steak AAA", "format": "8 X 454G", "price": 295.00, "category": "Boeuf", "unitCount": 8, "totalWeightGrams": 3632, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Viande Rouge", "texture": "steak", "managementCategory": "premium"},
  {"id": "b_821368", "sku": "821368", "name": "Rosette de boeuf", "format": "2 kg", "price": 91.30, "category": "Boeuf", "totalWeightGrams": 2000, "consumptionType": "roast", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "roast", "managementCategory": "base"},
  {"id": "b_821425", "sku": "821425", "name": "Roti d'Épaule de Boeuf", "format": "3 X 1KG", "price": 120.80, "category": "Boeuf", "unitCount": 3, "totalWeightGrams": 3000, "consumptionType": "roast", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "roast", "managementCategory": "base"},
  {"id": "b_150322", "sku": "150322", "name": "Smoked Meat", "format": "22 X 125g", "price": 238.60, "category": "Boeuf", "unitCount": 22, "totalWeightGrams": 2750, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "deli", "managementCategory": "base"},
  {"id": "b_roti_palette", "sku": "B050", "name": "Rôti de palette désossé", "format": "4 x 800G", "price": 98.00, "category": "Boeuf", "unitCount": 4, "totalWeightGrams": 3200, "consumptionType": "slow", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "roast", "managementCategory": "base"},
  {"id": "b_steak_francais", "sku": "B051", "name": "Steak Français (Intérieur de ronde)", "format": "16 x 170G", "price": 145.00, "category": "Boeuf", "unitCount": 16, "totalWeightGrams": 2720, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "steak", "managementCategory": "base"},
  {"id": "b_boulettes", "sku": "B052", "name": "Boulettes de bœuf italiennes", "format": "2kg (approx 40)", "price": 65.00, "category": "Boeuf", "unitCount": 40, "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "prepared", "managementCategory": "base"},
  {"id": "b_laniere_bavette", "sku": "B053", "name": "Lanières de Bavette marinées", "format": "10 x 200G", "price": 185.00, "category": "Boeuf", "unitCount": 10, "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "slice", "managementCategory": "premium"},
  {"id": "b_cubes_brochette", "sku": "B054", "name": "Cubes Bœuf à Brochette", "format": "8 x 454G", "price": 165.00, "category": "Boeuf", "unitCount": 8, "totalWeightGrams": 3632, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "cube", "managementCategory": "medium"},

  // --- POULET (Base & Easy) ---
  {"id": "p_QC10608", "sku": "QC10608", "name": "Haut Cuisse poulet désossé", "format": "10-14 (3,6 kg)", "price": 127.00, "category": "Poulet", "unitCount": 12, "totalWeightGrams": 3600, "consumptionType": "staple", "isAvailable": true, "proteinType": "Volaille", "texture": "piece", "managementCategory": "base"},
  {"id": "p_QC10114", "sku": "QC10114", "name": "Poitrines poulet désossées", "format": "9-12 (3.2KG)", "price": 109.00, "category": "Poulet", "unitCount": 10, "totalWeightGrams": 3200, "consumptionType": "staple", "isAvailable": true, "proteinType": "Volaille", "texture": "breast", "managementCategory": "base"},
  {"id": "p_hache", "sku": "QC10999", "name": "Poulet Haché Maigre", "format": "10 X 454G", "price": 95.00, "category": "Poulet", "unitCount": 10, "totalWeightGrams": 4540, "consumptionType": "staple", "isAvailable": true, "proteinType": "Volaille", "texture": "ground", "managementCategory": "base"},
  {"id": "p_QC11009", "sku": "QC11009", "name": "Poulet entier 1,8 kg", "format": "1,8 Kg", "price": 17.40, "category": "Poulet", "unitCount": 1, "totalWeightGrams": 1800, "consumptionType": "roast", "isAvailable": true, "proteinType": "Volaille", "texture": "whole", "managementCategory": "base"},
  {"id": "p_811425", "sku": "811425", "name": "Brochettes poulet souvlaki", "format": "18 X 110G", "price": 133.70, "category": "Poulet", "unitCount": 18, "totalWeightGrams": 1980, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "kebab", "managementCategory": "base"},
  {"id": "p_821369", "sku": "821369", "name": "Ailes de poulet BBQ", "format": "2 X 1KG", "price": 76.90, "category": "Poulet", "unitCount": 2, "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "bone-in", "managementCategory": "base"},
  {"id": "p_croq", "sku": "821555", "name": "Croquettes de Poulet (Vraie viande)", "format": "4 X 1KG", "price": 85.00, "category": "Poulet", "unitCount": 4, "totalWeightGrams": 4000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "p_gen", "sku": "821666", "name": "Poulet Général Tao", "format": "4 X 1KG", "price": 92.00, "category": "Poulet", "unitCount": 4, "totalWeightGrams": 4000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "p_crapaudine", "sku": "P050", "name": "Poulet en Crapaudine (Portugais)", "format": "2 x 1.2kg", "price": 42.00, "category": "Poulet", "unitCount": 2, "totalWeightGrams": 2400, "consumptionType": "roast", "isAvailable": true, "proteinType": "Volaille", "texture": "whole", "managementCategory": "medium"},
  {"id": "p_lanieres", "sku": "P051", "name": "Lanières de poulet panées", "format": "2kg", "price": 78.00, "category": "Poulet", "unitCount": 1, "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "p_burger_poulet", "sku": "P052", "name": "Burger de poulet grillé", "format": "12 x 140g", "price": 65.00, "category": "Poulet", "unitCount": 12, "totalWeightGrams": 1680, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "p_cubes", "sku": "P053", "name": "Cubes de poulet (Poitrine)", "format": "5 x 500g", "price": 85.00, "category": "Poulet", "unitCount": 5, "totalWeightGrams": 2500, "consumptionType": "staple", "isAvailable": true, "proteinType": "Volaille", "texture": "cube", "managementCategory": "base"},

  // --- PORC (Everyday) ---
  {"id": "po_151396", "sku": "151396", "name": "Porc haché 85%", "format": "10 X 500G", "price": 80.50, "category": "Porc", "unitCount": 10, "totalWeightGrams": 5000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Porc", "texture": "ground", "managementCategory": "base"},
  {"id": "po_filet", "sku": "811222", "name": "Filet de Porc (Tenderloin)", "format": "4 X 1KG", "price": 88.00, "category": "Porc", "unitCount": 8, "totalWeightGrams": 4000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "piece", "managementCategory": "base"},
  {"id": "po_811975", "sku": "811975", "name": "Rôti de porc longe", "format": "4 X 908G", "price": 51.80, "category": "Porc", "unitCount": 4, "totalWeightGrams": 3632, "consumptionType": "roast", "isAvailable": true, "proteinType": "Porc", "texture": "roast", "managementCategory": "base"},
  {"id": "po_821524", "sku": "821524", "name": "Bacon artisanal", "format": "6 X 500g", "price": 76.20, "category": "Porc", "unitCount": 6, "totalWeightGrams": 3000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "slice", "managementCategory": "base"},
  {"id": "po_821252", "sku": "821252", "name": "Côte de porc bbq", "format": "12 x 250g", "price": 101.40, "category": "Porc", "unitCount": 12, "totalWeightGrams": 3000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "chop", "managementCategory": "base"},
  {"id": "po_saucisse_it", "sku": "821111", "name": "Saucisses Italiennes Douces", "format": "5kg (VRAC)", "price": 65.00, "category": "Porc", "totalWeightGrams": 5000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "sausage", "managementCategory": "base"},
  {"id": "po_saucisse_dj", "sku": "821112", "name": "Saucisses Déjeuner Érable", "format": "5kg (VRAC)", "price": 68.00, "category": "Porc", "totalWeightGrams": 5000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "sausage", "managementCategory": "base"},
  {"id": "po_cotelette_desosse", "sku": "PO050", "name": "Côtelettes de porc désossées", "format": "20 x 140g", "price": 75.00, "category": "Porc", "unitCount": 20, "totalWeightGrams": 2800, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "chop", "managementCategory": "base"},
  {"id": "po_jambon_toupie", "sku": "PO051", "name": "Jambon Toupie (Tranché épais)", "format": "4 x 500g", "price": 48.00, "category": "Porc", "unitCount": 4, "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "deli", "managementCategory": "base"},
  {"id": "po_osso_bucco", "sku": "PO052", "name": "Osso Bucco de Porc", "format": "8 x 350g", "price": 62.00, "category": "Porc", "unitCount": 8, "totalWeightGrams": 2800, "consumptionType": "slow", "isAvailable": true, "proteinType": "Porc", "texture": "piece", "managementCategory": "base"},
  {"id": "po_effiloche", "sku": "PO053", "name": "Porc effiloché BBQ", "format": "6 x 400g", "price": 72.00, "category": "Porc", "unitCount": 6, "totalWeightGrams": 2400, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "prepared", "managementCategory": "base"},

  // --- POISSON (Variété) ---
  {"id": "f_821256", "sku": "821256", "name": "Pavé de saumon Atlantique", "format": "12 X 170G", "price": 95.90, "category": "Poisson/Fruits de mer", "unitCount": 12, "totalWeightGrams": 2040, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "base"},
  {"id": "f_truite", "sku": "821300", "name": "Filet de Truite Arc-en-ciel", "format": "10 X 200G", "price": 98.50, "category": "Poisson/Fruits de mer", "unitCount": 10, "totalWeightGrams": 2000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "base"},
  {"id": "f_morue", "sku": "821301", "name": "Dos de Morue Islande", "format": "10 X 170G", "price": 115.00, "category": "Poisson/Fruits de mer", "unitCount": 10, "totalWeightGrams": 1700, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "medium"},
  {"id": "f_821347", "sku": "821347", "name": "Crevettes nordiques cuites", "format": "5 X 400G", "price": 134.40, "category": "Poisson/Fruits de mer", "unitCount": 5, "totalWeightGrams": 2000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Fruits de mer", "texture": "small", "managementCategory": "base"},
  {"id": "f_tigre", "sku": "821348", "name": "Crevettes Tigrées (Crues, 16-20)", "format": "2 X 908G", "price": 89.00, "category": "Poisson/Fruits de mer", "totalWeightGrams": 1816, "consumptionType": "quick", "isAvailable": true, "proteinType": "Fruits de mer", "texture": "shellfish", "managementCategory": "medium"},
  {"id": "f_petoncle", "sku": "821349", "name": "Pétoncles Géants U-10", "format": "2 X 1KG", "price": 145.00, "category": "Poisson/Fruits de mer", "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Fruits de mer", "texture": "shellfish", "managementCategory": "premium"},
  {"id": "f_aiglefin", "sku": "F050", "name": "Filet d'Aiglefin (Haddock)", "format": "10 x 200g", "price": 85.00, "category": "Poisson/Fruits de mer", "unitCount": 10, "totalWeightGrams": 2000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "base"},
  {"id": "f_sole", "sku": "F051", "name": "Filet de Sole", "format": "12 x 150g", "price": 72.00, "category": "Poisson/Fruits de mer", "unitCount": 12, "totalWeightGrams": 1800, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "base"},
  {"id": "f_coquille", "sku": "F052", "name": "Coquille St-Jacques (Prêt-à-cuire)", "format": "8 x 200g", "price": 95.00, "category": "Poisson/Fruits de mer", "unitCount": 8, "totalWeightGrams": 1600, "consumptionType": "quick", "isAvailable": true, "proteinType": "Fruits de mer", "texture": "prepared", "managementCategory": "premium"},
  {"id": "f_turbot", "sku": "F053", "name": "Filet de Turbot", "format": "10 x 170g", "price": 110.00, "category": "Poisson/Fruits de mer", "unitCount": 10, "totalWeightGrams": 1700, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "medium"},

  // --- PRÊT-À-MANGER / EXTRA ---
  {"id": "pm_821379", "sku": "821379", "name": "Lasagne à la viande", "format": "8 X 350G", "price": 118.70, "category": "Prêt-à-manger", "unitCount": 8, "totalWeightGrams": 2800, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_pat", "sku": "821380", "name": "Pâté au Poulet (Format Familial)", "format": "4 X 800G", "price": 68.00, "category": "Prêt-à-manger", "unitCount": 4, "totalWeightGrams": 3200, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_shep", "sku": "821381", "name": "Pâté Chinois (Shepherd's Pie)", "format": "8 X 400G", "price": 85.00, "category": "Prêt-à-manger", "unitCount": 8, "totalWeightGrams": 3200, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_sauce", "sku": "821382", "name": "Sauce à Spaghetti (Viande)", "format": "4 X 1L", "price": 55.00, "category": "Prêt-à-manger", "totalWeightGrams": 4000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "liquid", "managementCategory": "base"},
  {"id": "pm_tourtiere", "sku": "PM050", "name": "Tourtière du Lac", "format": "2 x 1.5kg", "price": 55.00, "category": "Prêt-à-manger", "unitCount": 2, "totalWeightGrams": 3000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_pizza", "sku": "PM051", "name": "Pizza Toute Garnie (12po)", "format": "5 unités", "price": 60.00, "category": "Prêt-à-manger", "unitCount": 5, "totalWeightGrams": 3000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Autre", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_quiche", "sku": "PM052", "name": "Quiche Lorraine", "format": "4 x 600g", "price": 48.00, "category": "Prêt-à-manger", "unitCount": 4, "totalWeightGrams": 2400, "consumptionType": "quick", "isAvailable": true, "proteinType": "Autre", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_frites", "sku": "PM053", "name": "Frites Coupe Steak", "format": "4 x 2kg", "price": 32.00, "category": "Prêt-à-manger", "unitCount": 4, "totalWeightGrams": 8000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Autre", "texture": "prepared", "managementCategory": "base"}
];