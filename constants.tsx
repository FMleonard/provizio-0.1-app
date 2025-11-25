

import { Percent, Beef, Drumstick, ChefHat, Fish, ScrollText, DollarSign, Utensils, Flame, PiggyBank, Dumbbell, Zap, Box, UserPlus } from 'lucide-react';
import { HalalIcon } from './components/HalalIcon';

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
  {"id": "821345", "sku": "821333", "name": "Tournedos de boeuf aux trois poivres", "format": "24 X 110G", "price": 186.90, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 24, "totalWeightGrams": 2640},
  {"id": "811225", "sku": "811225", "name": "Contre-filet mariné 3 poivres", "format": "12 X 220G", "price": 78.30, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 12, "totalWeightGrams": 2640},
  {"id": "811430", "sku": "811430", "name": "Bift. Filet mignon châteaubriand", "format": "8 X 280G", "price": 225.10, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isPremium": true, "unitCount": 8, "totalWeightGrams": 2240},
  {"id": "821529", "sku": "821529", "name": "Onglet de boeuf AAA 6 oz", "format": "12 x 170G", "price": 180.20, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "821530", "sku": "821530", "name": "Onglet de Boeuf AAA 8 oz", "format": "12 x 220G", "price": 238.50, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 12, "totalWeightGrams": 2640},
  {"id": "821527", "sku": "821527", "name": "Bift. Haut Surlonge 6 oz (Baseball Cut) AAA+", "format": "12 x 170 g", "price": 180.20, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "821417", "sku": "821417", "name": "Contre filet 10 oz", "format": "12 X 280g", "price": 308.90, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isPremium": true, "unitCount": 12, "totalWeightGrams": 3360},
  {"id": "821528", "sku": "821528", "name": "Bift. Haut Surlonge 8 oz (Baseball Cut) AAA+", "format": "12 x 220g", "price": 242.90, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 12, "totalWeightGrams": 2640},
  {"id": "821418", "sku": "821418", "name": "Contre filet 12 oz", "format": "10 X 340g", "price": 307.10, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isPremium": true, "unitCount": 10, "totalWeightGrams": 3400},
  {"id": "821430", "sku": "821430", "name": "Contre-Filet AA 10oz", "format": "10 x 285g", "price": 216.10, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 10, "totalWeightGrams": 2850},
  {"id": "821423", "sku": "821423", "name": "Filet mignon AAA+ 8 oz", "format": "10 X 224G", "price": 394.70, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 10, "totalWeightGrams": 2240},
  {"id": "821422", "sku": "821422", "name": "Filet Mignon AAA+ 10 oz", "format": "8 X 280G", "price": 399.99, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 8, "totalWeightGrams": 2240},
  {"id": "821431", "sku": "821431", "name": "Filet mignon AA 6 oz", "format": "12 x 170g", "price": 335.90, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "821420", "sku": "821420", "name": "Faux filet AAA 10 oz", "format": "10 X 285g", "price": 301.60, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 10, "totalWeightGrams": 2850},
  {"id": "1501955", "sku": "1501955", "name": "BF Contre Filet CAB prime", "format": "12 X 225G", "price": 399.99, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 12, "totalWeightGrams": 2700},
  {"id": "1501684", "sku": "1501684", "name": "Haut Surlonge CAB PRIME", "format": "10 X 170G", "price": 267.50, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 10, "totalWeightGrams": 1700},
  {"id": "821436", "sku": "821436", "name": "Bift. D'Aloyau T-Bone 3/4\"", "format": "4 X 460g", "price": 216.50, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 4, "totalWeightGrams": 1840},
  {"id": "821427", "sku": "821427", "name": "Bift. D'Aloyau 1-1/2\" T-Bone", "format": "4 X 850G", "price": 399.99, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 4, "totalWeightGrams": 3400},
  {"id": "821432", "sku": "821432", "name": "T-Bone AA 3/4po", "format": "4 x 450g", "price": 234.50, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 4, "totalWeightGrams": 1800},
  {"id": "821426", "sku": "821426", "name": "Rib tomahawk AAA", "format": "2 X 1.3KG", "price": 256.00, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 2, "totalWeightGrams": 2600},
  {"id": "821429", "sku": "821429", "name": "Bifteck de côte 1\"", "format": "6 X 570G", "price": 359.50, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 6, "totalWeightGrams": 3420},
  {"id": "821419", "sku": "821419", "name": "Bifteck de côte 1\"1/2", "format": "4 X 815 g", "price": 342.70, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 4, "totalWeightGrams": 3260},
  {"id": "821914", "sku": "821914", "name": "Cote Cowboy CAB PRIME", "format": "4 X 454G", "price": 229.90, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 4, "totalWeightGrams": 1816},
  {"id": "1900-s", "sku": "1900-s", "name": "Galettes de boeuf", "format": "10 x (2 x 170g)", "price": 100.40, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "ground", "consumptionType": "quick", "isAvailable": true, "unitCount": 20, "totalWeightGrams": 3400},
  {"id": "821661", "sku": "821661", "name": "Wagyu kobe A5 Mix", "format": "2 x 200g", "price": 243.90, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 2, "totalWeightGrams": 400},
  {"id": "1501340", "sku": "1501340", "name": "Haut De Surlonge Wagyu", "format": "10 x 170G", "price": 442.90, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 10, "totalWeightGrams": 1700},
  {"id": "p_QC10608", "sku": "QC10608", "name": "Haut Cuisse poulet désossé", "format": "10-14 (3,6 kg)", "price": 127.00, "category": "Poulet", "unitCount": 12, "totalWeightGrams": 3600, "consumptionType": "staple", "isAvailable": true, "proteinType": "Volaille", "texture": "piece", "managementCategory": "base"},
  {"id": "p_QC10114", "sku": "QC10114", "name": "Poitrines poulet désossées", "format": "9-12 (3.2KG)", "price": 109.00, "category": "Poulet", "unitCount": 10, "totalWeightGrams": 3200, "consumptionType": "staple", "isAvailable": true, "proteinType": "Volaille", "texture": "breast", "managementCategory": "base"},
  {"id": "p_hache", "sku": "QC10999", "name": "Poulet Haché Maigre", "format": "10 X 454G", "price": 95.00, "category": "Poulet", "unitCount": 10, "totalWeightGrams": 4540, "consumptionType": "staple", "isAvailable": true, "proteinType": "Volaille", "texture": "ground", "managementCategory": "base"},
  {"id": "p_QC11009", "sku": "QC11009", "name": "Poulet entier 1,8 kg", "format": "1,8 Kg", "price": 17.40, "category": "Poulet", "unitCount": 1, "totalWeightGrams": 1800, "consumptionType": "roast", "isAvailable": true, "proteinType": "Volaille", "texture": "whole", "managementCategory": "base"},
  {"id": "p_811425", "sku": "811425", "name": "Brochettes poulet souvlaki", "format": "18 X 110G", "price": 133.70, "category": "Poulet", "unitCount": 18, "totalWeightGrams": 1980, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "kebab", "managementCategory": "base"},
  {"id": "p_821369", "sku": "821369", "name": "Ailes de poulet BBQ", "format": "2 X 1KG", "price": 76.90, "category": "Poulet", "unitCount": 2, "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "bone-in", "managementCategory": "base"},
  {"id": "p_croq", "sku": "821555", "name": "Croquettes de Poulet (Vraie viande)", "format": "4 X 1KG", "price": 85.00, "category": "Poulet", "unitCount": 4, "totalWeightGrams": 4000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "p_gen", "sku": "821666", "name": "Poulet Général Tao", "format": "4 X 1KG", "price": 92.00, "category": "Poulet", "unitCount": 4, "totalWeightGrams": 4000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "QC10214", "sku": "QC10214", "name": "Poulet Cuisse S/D", "format": "8-10 (4,2KG)", "price": 74.50, "category": "Poulet", "proteinType": "Volaille", "texture": "piece", "consumptionType": "staple", "isAvailable": true, "unitCount": 9, "totalWeightGrams": 4200},
  {"id": "QC10414", "sku": "QC10414", "name": "Pilons de Poulet de Grain", "format": "4-6 pqt (4,2 kg)", "price": 79.10, "category": "Poulet", "proteinType": "Volaille", "texture": "piece", "consumptionType": "staple", "isAvailable": true, "unitCount": 5, "totalWeightGrams": 4200},
  {"id": "10009", "sku": "10009", "name": "Poulet de grain entier 3 kg", "format": "3 KG", "price": 46.00, "category": "Poulet", "proteinType": "Volaille", "texture": "whole", "consumptionType": "roast", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 3000},
  {"id": "QC10316", "sku": "QC10316", "name": "Ailes de Poulet de Grain", "format": "6 x 450G", "price": 71.60, "category": "Poulet", "proteinType": "Volaille", "texture": "bone-in", "consumptionType": "quick", "isAvailable": true, "unitCount": 6, "totalWeightGrams": 2700},
  {"id": "821342", "sku": "821342", "name": "Cubes de brochette de poulet", "format": "10 X 224G", "price": 140.90, "category": "Poulet", "proteinType": "Volaille", "texture": "cube", "consumptionType": "quick", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 2240},
  {"id": "821333", "sku": "821333", "name": "Escalopes de poulet", "format": "20 X 110G", "price": 123.40, "category": "Poulet", "proteinType": "Volaille", "texture": "breast", "consumptionType": "quick", "isAvailable": true, "unitCount": 20, "totalWeightGrams": 2200},
  {"id": "QC10955", "sku": "QC10955", "name": "Poulet de grain Haché", "format": "6 x 450G", "price": 85.70, "category": "Poulet", "proteinType": "Volaille", "texture": "ground", "consumptionType": "staple", "isAvailable": true, "unitCount": 6, "totalWeightGrams": 2700},
  {"id": "151639", "sku": "151639", "name": "Dinde Hachée", "format": "6 x 454G", "price": 79.10, "category": "Poulet", "proteinType": "Volaille", "texture": "ground", "consumptionType": "staple", "isAvailable": true, "unitCount": 6, "totalWeightGrams": 2724},
  {"id": "811574", "sku": "811574", "name": "Tournedos de poulet (nature)", "format": "16 X 142G", "price": 163.20, "category": "Poulet", "proteinType": "Volaille", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "unitCount": 16, "totalWeightGrams": 2272},
  {"id": "821352", "sku": "821352", "name": "Tournedos de poulet miel et ail", "format": "16 X 140G", "price": 176.80, "category": "Poulet", "proteinType": "Volaille", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "unitCount": 16, "totalWeightGrams": 2240},
  {"id": "821334", "sku": "821334", "name": "Tournedos de poulet méditéranéen", "format": "14 x 170G", "price": 176.80, "category": "Poulet", "proteinType": "Volaille", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "unitCount": 14, "totalWeightGrams": 2380},
  {"id": "821338", "sku": "821338", "name": "Tournedos de poulet (BBQ)", "format": "16 x 140G", "price": 170.00, "category": "Poulet", "proteinType": "Volaille", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "unitCount": 16, "totalWeightGrams": 2240},
  {"id": "811347", "sku": "811347", "name": "Poitrine de poulet et BBQ", "format": "12 X 170G", "price": 107.30, "category": "Poulet", "proteinType": "Volaille", "texture": "breast", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "811346", "sku": "811346", "name": "Poitrine de poulet miel & ail", "format": "8 x 255 g", "price": 104.90, "category": "Poulet", "proteinType": "Volaille", "texture": "breast", "consumptionType": "quick", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 2040},
  {"id": "811353", "sku": "811353", "name": "poitrine de poulet méditerranéenne", "format": "12 x 170g", "price": 125.00, "category": "Poulet", "proteinType": "Volaille", "texture": "breast", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "821373", "sku": "821373", "name": "Poulet pop corn", "format": "2KG", "price": 84.20, "category": "Poulet", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 2000},
  {"id": "821340", "sku": "821340", "name": "Croquettes de poulet", "format": "2 X 1KG", "price": 69.00, "category": "Poulet", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 2, "totalWeightGrams": 2000},
  {"id": "821409", "sku": "821409", "name": "Filet de poulet pané", "format": "2kg", "price": 92.90, "category": "Poulet", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 2000},
  {"id": "821374", "sku": "821374", "name": "Burger de poulet pané", "format": "1.6 KG", "price": 92.90, "category": "Poulet", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 1600},
  {"id": "221009", "sku": "221009", "name": "Poulet Pané Style maison", "format": "2,2 Kg", "price": 79.10, "category": "Poulet", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 2200},
  {"id": "821369_2", "sku": "821369", "name": "Ailes de poulet BBQ", "format": "2 X 1KG", "price": 76.90, "category": "Poulet", "proteinType": "Volaille", "texture": "bone-in", "consumptionType": "quick", "isAvailable": true, "unitCount": 2, "totalWeightGrams": 2000},
  {"id": "221010", "sku": "221010", "name": "Poitrine de poulet farcie jambon fromage", "format": "2.04 KG (entre 10-12unite)", "price": 158.10, "category": "Poulet", "proteinType": "Volaille", "texture": "breast", "consumptionType": "quick", "isAvailable": true, "unitCount": 11, "totalWeightGrams": 2040},
  {"id": "221012", "sku": "221012", "name": "Poitrine de poulet farcie brocoli fromage", "format": "10 X 270G", "price": 158.10, "category": "Poulet", "proteinType": "Volaille", "texture": "breast", "consumptionType": "quick", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 2700},
  {"id": "811002", "sku": "811002", "name": "Coq au porc érable & chipotle", "format": "12 X 275G", "price": 170.30, "category": "Poulet", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 3300},
  {"id": "162101", "sku": "162101", "name": "Dinde Assaisonnée Cuite", "format": "5,6 KG", "price": 142.40, "category": "Poulet", "proteinType": "Volaille", "texture": "roast", "consumptionType": "roast", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 5600},
  {"id": "po_151396", "sku": "151396", "name": "Porc haché 85%", "format": "10 X 500G", "price": 80.50, "category": "Porc", "unitCount": 10, "totalWeightGrams": 5000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Porc", "texture": "ground", "managementCategory": "base"},
  {"id": "po_filet", "sku": "811222", "name": "Filet de Porc (Tenderloin)", "format": "4 X 1KG", "price": 88.00, "category": "Porc", "unitCount": 8, "totalWeightGrams": 4000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "piece", "managementCategory": "base"},
  {"id": "po_811975", "sku": "811975", "name": "Rôti de porc longe", "format": "4 X 908G", "price": 51.80, "category": "Porc", "unitCount": 4, "totalWeightGrams": 3632, "consumptionType": "roast", "isAvailable": true, "proteinType": "Porc", "texture": "roast", "managementCategory": "base"},
  {"id": "po_821524", "sku": "821524", "name": "Bacon artisanal", "format": "6 X 500g", "price": 76.20, "category": "Porc", "unitCount": 6, "totalWeightGrams": 3000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "slice", "managementCategory": "base"},
  {"id": "po_821252", "sku": "821252", "name": "Côte de porc bbq", "format": "12 x 250g", "price": 101.40, "category": "Porc", "unitCount": 12, "totalWeightGrams": 3000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "chop", "managementCategory": "base"},
  {"id": "po_saucisse_it", "sku": "821111", "name": "Saucisses Italiennes Douces", "format": "5kg (VRAC)", "price": 65.00, "category": "Porc", "totalWeightGrams": 5000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "sausage", "managementCategory": "base"},
  {"id": "po_saucisse_dj", "sku": "821112", "name": "Saucisses Déjeuner Érable", "format": "5kg (VRAC)", "price": 68.00, "category": "Porc", "totalWeightGrams": 5000, "consumptionType": "quick", "isAvailable": true, "proteinType": "Porc", "texture": "sausage", "managementCategory": "base"},
  {"id": "821351", "sku": "821351", "name": "Filet mignon de porc", "format": "5-6 (3 kg)", "price": 54.99, "category": "Porc", "proteinType": "Porc", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "unitCount": 6, "totalWeightGrams": 3000},
  {"id": "150236", "sku": "150236", "name": "Côte de porc manchon", "format": "approx 12 X +/-300G", "price": 186.90, "category": "Porc", "proteinType": "Porc", "texture": "chop", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 3600},
  {"id": "151125", "sku": "151125", "name": "Escalope de porc attendri", "format": "24 x 110G", "price": 66.90, "category": "Porc", "proteinType": "Porc", "texture": "slice", "consumptionType": "quick", "isAvailable": true, "unitCount": 24, "totalWeightGrams": 2640},
  {"id": "811301", "sku": "811301", "name": "Côtelettes de porc demi-lune", "format": "24 x 110G", "price": 67.10, "category": "Porc", "proteinType": "Porc", "texture": "chop", "consumptionType": "quick", "isAvailable": true, "unitCount": 24, "totalWeightGrams": 2640},
  {"id": "821346", "sku": "821346", "name": "Côtes levées de porc entières nature", "format": "5 X +/-850G", "price": 111.80, "category": "Porc", "proteinType": "Porc", "texture": "ribs", "consumptionType": "quick", "isAvailable": true, "unitCount": 5, "totalWeightGrams": 4250},
  {"id": "851350", "sku": "851350", "name": "Échine de Porc", "format": "4 X 750G", "price": 118.60, "category": "Porc", "proteinType": "Porc", "texture": "roast", "consumptionType": "roast", "isAvailable": true, "unitCount": 4, "totalWeightGrams": 3000},
  {"id": "821350", "sku": "821350", "name": "Côtelette de porc avec os", "format": "12 x 140G", "price": 46.00, "category": "Porc", "proteinType": "Porc", "texture": "chop", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 1680},
  {"id": "811104", "sku": "811104", "name": "Brochettes de porc souvlaki", "format": "9 x 2 x 110G", "price": 84.30, "category": "Porc", "proteinType": "Porc", "texture": "kebab", "consumptionType": "quick", "isAvailable": true, "unitCount": 18, "totalWeightGrams": 1980},
  {"id": "102499", "sku": "102499", "name": "Bacon tranché cov", "format": "10 x 250G", "price": 113.50, "category": "Porc", "proteinType": "Porc", "texture": "slice", "consumptionType": "quick", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 2500},
  {"id": "821251", "sku": "821251", "name": "Côte de porc teriyaki", "format": "12 x 250g", "price": 101.40, "category": "Porc", "proteinType": "Porc", "texture": "chop", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 3000},
  {"id": "821250", "sku": "821250", "name": "Côte de porc érable chipotlé", "format": "12 x 250g", "price": 101.40, "category": "Porc", "proteinType": "Porc", "texture": "chop", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 3000},
  {"id": "821331", "sku": "821331", "name": "Côtelette De Porc A/Os Souvlaki", "format": "8 X 400G", "price": 102.80, "category": "Porc", "proteinType": "Porc", "texture": "chop", "consumptionType": "quick", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 3200},
  {"id": "821332", "sku": "821332", "name": "Côtelette De Porc A/Os Teriyaki", "format": "8 X 400G", "price": 102.80, "category": "Porc", "proteinType": "Porc", "texture": "chop", "consumptionType": "quick", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 3200},
  {"id": "6031-s", "sku": "6031-s", "name": "Osso Bucco de Porc", "format": "12 X 275G", "price": 94.60, "category": "Porc", "proteinType": "Porc", "texture": "piece", "consumptionType": "slow", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 3300},
  {"id": "150708", "sku": "150708", "name": "Porc effiloché a la texane", "format": "8 x 500g", "price": 169.60, "category": "Porc", "proteinType": "Porc", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 4000},
  {"id": "321372", "sku": "321372", "name": "Côte levée quatre côtes BBQ", "format": "10 X 250G", "price": 154.60, "category": "Porc", "proteinType": "Porc", "texture": "ribs", "consumptionType": "quick", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 2500},
  {"id": "104082", "sku": "104082", "name": "Saucisse Italienne douce porc", "format": "32 X 2 X 90G", "price": 149.50, "category": "Porc", "proteinType": "Porc", "texture": "sausage", "consumptionType": "quick", "isAvailable": true, "unitCount": 64, "totalWeightGrams": 5760},
  {"id": "104084", "sku": "104084", "name": "Saucisse Toulouse", "format": "16 X 4 X 90G", "price": 153.80, "category": "Porc", "proteinType": "Porc", "texture": "sausage", "consumptionType": "quick", "isAvailable": true, "unitCount": 64, "totalWeightGrams": 5760},
  {"id": "f_821256", "sku": "821256", "name": "Pavé de saumon Atlantique", "format": "12 X 170G", "price": 95.90, "category": "Poisson/Fruits de mer", "unitCount": 12, "totalWeightGrams": 2040, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "base"},
  {"id": "f_truite", "sku": "821300", "name": "Filet de Truite Arc-en-ciel", "format": "10 X 200G", "price": 98.50, "category": "Poisson/Fruits de mer", "unitCount": 10, "totalWeightGrams": 2000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "base"},
  {"id": "f_morue", "sku": "821301", "name": "Dos de Morue Islande", "format": "10 X 170G", "price": 115.00, "category": "Poisson/Fruits de mer", "unitCount": 10, "totalWeightGrams": 1700, "consumptionType": "staple", "isAvailable": true, "proteinType": "Poissons", "texture": "fillet", "managementCategory": "medium"},
  {"id": "f_821347", "sku": "821347", "name": "Crevettes nordiques cuites", "format": "5 X 400G", "price": 134.40, "category": "Poisson/Fruits de mer", "unitCount": 5, "totalWeightGrams": 2000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Fruits de mer", "texture": "small", "managementCategory": "base"},
  {"id": "f_tigre", "sku": "821348", "name": "Crevettes Tigrées (Crues, 16-20)", "format": "2 X 908G", "price": 89.00, "category": "Poisson/Fruits de mer", "totalWeightGrams": 1816, "consumptionType": "quick", "isAvailable": true, "proteinType": "Fruits de mer", "texture": "shellfish", "managementCategory": "medium"},
  {"id": "f_petoncle", "sku": "821349", "name": "Pétoncles Géants U-10", "format": "2 X 1KG", "price": 145.00, "category": "Poisson/Fruits de mer", "totalWeightGrams": 2000, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Fruits de mer", "texture": "shellfish", "managementCategory": "premium"},
  {"id": "f_821714", "sku": "821714", "name": "Queue de homard", "format": "1.82KG", "price": 314.90, "category": "Poisson/Fruits de mer", "totalWeightGrams": 1820, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Fruits de mer", "texture": "whole", "managementCategory": "premium"},
  {"id": "821666", "sku": "821666", "name": "Omble Chevalier", "format": "2 Kg", "price": 105.00, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "staple", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 2000},
  {"id": "821532", "sku": "821532", "name": "Saumon biologique king A/P", "format": "10 UNITÉ / 6 OZ", "price": 137.60, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "staple", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 1700},
  {"id": "821257", "sku": "821257", "name": "Filet de truite", "format": "8-11 (1,82KG)", "price": 118.70, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "staple", "isAvailable": true, "unitCount": 9, "totalWeightGrams": 1820},
  {"id": "821324", "sku": "821324", "name": "Thon saku 8 oz", "format": "6 X 225G", "price": 195.00, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "unitCount": 6, "totalWeightGrams": 1350},
  {"id": "821269", "sku": "821269", "name": "Flétan", "format": "8 X 170G", "price": 211.40, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "quick", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 1360},
  {"id": "821652", "sku": "821652", "name": "Bajoue De Morue", "format": "8 X 250G", "price": 186.90, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "piece", "consumptionType": "staple", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 2000},
  {"id": "821298", "sku": "821298", "name": "Longe de morue 5 oz", "format": "12 unité", "price": 94.60, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "staple", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 1700},
  {"id": "211565", "sku": "211565", "name": "Longe d'aiglefin", "format": "16 X 4 oz (1,82 Kg)", "price": 81.00, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "staple", "isAvailable": true, "unitCount": 16, "totalWeightGrams": 1820},
  {"id": "821203", "sku": "821203", "name": "Filet de sole", "format": "20 X 3OZ", "price": 84.30, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "staple", "isAvailable": true, "unitCount": 20, "totalWeightGrams": 1700},
  {"id": "821316", "sku": "821316", "name": "Filet de doré", "format": "(10-13) 2KG", "price": 139.30, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "quick", "isAvailable": true, "unitCount": 11, "totalWeightGrams": 2000},
  {"id": "821233", "sku": "821233", "name": "Tilapia", "format": "2 lbs (908g)", "price": 17.10, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "staple", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 908},
  {"id": "812625", "sku": "812625", "name": "Darnes Espadon", "format": "12 X 170G", "price": 153.10, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "821526", "sku": "821526", "name": "Mahi-mahi", "format": "12 X 170G", "price": 135.90, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "812652", "sku": "812652", "name": "Vivaneau", "format": "10 X 200G", "price": 166.70, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "quick", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 2000},
  {"id": "821319", "sku": "821319", "name": "Brochette de saumon à l'érable", "format": "12 X 175G", "price": 170.30, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "kebab", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 2100},
  {"id": "821320", "sku": "821320", "name": "Brochette de saumon trois poivres", "format": "12 X 175G", "price": 170.30, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "kebab", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 2100},
  {"id": "1483627", "sku": "1483627", "name": "Gravlax de Saumon tranché", "format": "12 X 100G", "price": 181.20, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "slice", "consumptionType": "quick", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 1200},
  {"id": "1340113", "sku": "1340113", "name": "Saumon Coho Fumé Tranché", "format": "15 X 70G", "price": 137.60, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "slice", "consumptionType": "quick", "isAvailable": true, "unitCount": 15, "totalWeightGrams": 1050},
  {"id": "1073712", "sku": "1073712", "name": "Truite fumée tranchée", "format": "15 x 70G", "price": 184.00, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "slice", "consumptionType": "quick", "isAvailable": true, "unitCount": 15, "totalWeightGrams": 1050},
  {"id": "1318018", "sku": "1318018", "name": "Bonbons Saumon Fumé Érable", "format": "14 X 141G", "price": 166.20, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "unitCount": 14, "totalWeightGrams": 1974},
  {"id": "821323", "sku": "821323", "name": "Saumon fumé Coho", "format": "6-7 un (1,5 Kg)", "price": 154.70, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "slice", "consumptionType": "quick", "isAvailable": true, "unitCount": 6, "totalWeightGrams": 1500},
  {"id": "821355", "sku": "821355", "name": "Saumon planche de cèdre érable et BBQ", "format": "8 X 220G", "price": 154.80, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "quick", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 1760},
  {"id": "821353", "sku": "821353", "name": "Bâtonnets de poisson", "format": "2,27KG", "price": 91.40, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 2270},
  {"id": "213178", "sku": "213178", "name": "Fish and chips (morue)", "format": "2 x 1KG", "price": 256.00, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 2, "totalWeightGrams": 2000},
  {"id": "213136", "sku": "213136", "name": "Fish and chips (goberge)", "format": "3 x 1KG", "price": 152.40, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 3, "totalWeightGrams": 3000},
  {"id": "821321", "sku": "821321", "name": "Filet de sole au crabe sauce safran", "format": "8 X 200G", "price": 233.90, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 1600},
  {"id": "610351", "sku": "610351", "name": "Truite farcie crevette et pétoncle", "format": "10 X 200G", "price": 194.10, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 2000},
  {"id": "821375", "sku": "821375", "name": "Crevette argentine P.D. S/Q 16/20", "format": "2 X 908G", "price": 152.40, "category": "Poisson/Fruits de mer", "proteinType": "Fruits de mer", "texture": "shellfish", "consumptionType": "quick", "isAvailable": true, "unitCount": 2, "totalWeightGrams": 1816},
  {"id": "822625", "sku": "822625", "name": "Crevettes Blanches 16/20 P&D", "format": "2 X 908G", "price": 129.00, "category": "Poisson/Fruits de mer", "proteinType": "Fruits de mer", "texture": "shellfish", "consumptionType": "quick", "isAvailable": true, "unitCount": 2, "totalWeightGrams": 1816},
  {"id": "821318", "sku": "821318", "name": "Crevettes papillon ail et fines herbes", "format": "1.82KG", "price": 180.50, "category": "Poisson/Fruits de mer", "proteinType": "Fruits de mer", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 1820},
  {"id": "821376", "sku": "821376", "name": "Crevette tigré 16-20", "format": "2 X 908G", "price": 151.00, "category": "Poisson/Fruits de mer", "proteinType": "Fruits de mer", "texture": "shellfish", "consumptionType": "quick", "isAvailable": true, "unitCount": 2, "totalWeightGrams": 1816},
  {"id": "821322", "sku": "821322", "name": "Queue de langouste 4 oz", "format": "1.4KG", "price": 256.00, "category": "Poisson/Fruits de mer", "proteinType": "Fruits de mer", "texture": "shellfish", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 1, "totalWeightGrams": 1400},
  {"id": "821531", "sku": "821531", "name": "Pétoncle 10/20 IQF naturel", "format": "2 X 1KG", "price": 307.70, "category": "Poisson/Fruits de mer", "proteinType": "Fruits de mer", "texture": "shellfish", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 2, "totalWeightGrams": 2000},
  {"id": "821348", "sku": "821348", "name": "Pétoncle 80/120 IQF", "format": "5 X 400G", "price": 104.90, "category": "Poisson/Fruits de mer", "proteinType": "Fruits de mer", "texture": "shellfish", "consumptionType": "staple", "isAvailable": true, "unitCount": 5, "totalWeightGrams": 2000},
  {"id": "821523", "sku": "821523", "name": "Steak de Thon Rouge 6 oz", "format": "13 x 170G", "price": 140.90, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "unitCount": 13, "totalWeightGrams": 2210},
  {"id": "8250", "sku": "8250", "name": "Pavé Saumon Fumé", "format": "10 X 200G", "price": 194.10, "category": "Poisson/Fruits de mer", "proteinType": "Poissons", "texture": "fillet", "consumptionType": "quick", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 2000},
  {"id": "g_bison_hache", "sku": "GB001", "name": "Bison Haché maigre", "format": "10 X 454g", "price": 145.00, "category": "Gibier & Autres", "unitCount": 10, "totalWeightGrams": 4540, "consumptionType": "staple", "isAvailable": true, "proteinType": "Gibier", "texture": "ground", "managementCategory": "high"},
  {"id": "g_canard_conf", "sku": "GB002", "name": "Cuisses de Canard confites", "format": "6 X 200g", "price": 89.00, "category": "Gibier & Autres", "unitCount": 6, "totalWeightGrams": 1200, "consumptionType": "quick", "isAvailable": true, "isPremium": true, "proteinType": "Volaille", "texture": "piece", "managementCategory": "premium"},
  {"id": "MG522617", "sku": "MG522617", "name": "Médaillon de bison", "format": "10 X 200G", "price": 236.20, "category": "Gibier & Autres", "proteinType": "Gibier", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 10, "totalWeightGrams": 2000},
  {"id": "MG522616", "sku": "MG522616", "name": "Medaillon de cerf", "format": "10 x 200G", "price": 163.80, "category": "Gibier & Autres", "proteinType": "Gibier", "texture": "steak", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 10, "totalWeightGrams": 2000},
  {"id": "821354", "sku": "821354", "name": "Canard cuisse confite", "format": "10 x 200G", "price": 195.50, "category": "Gibier & Autres", "proteinType": "Volaille", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 10, "totalWeightGrams": 2000},
  {"id": "821330", "sku": "821330", "name": "Magret de canard", "format": "6 x 400G", "price": 175.40, "category": "Gibier & Autres", "proteinType": "Volaille", "texture": "breast", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 6, "totalWeightGrams": 2400},
  {"id": "812033", "sku": "812033", "name": "Pilons de canard fumé", "format": "4 X 10 pilons (600g)", "price": 111.80, "category": "Gibier & Autres", "proteinType": "Volaille", "texture": "piece", "consumptionType": "quick", "isAvailable": true, "unitCount": 4, "totalWeightGrams": 2400},
  {"id": "821327", "sku": "821327", "name": "Tourte au canard confit", "format": "12 X 170G", "price": 273.20, "category": "Gibier & Autres", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "isPremium": true, "unitCount": 12, "totalWeightGrams": 2040},
  {"id": "121487", "sku": "121487", "name": "Cheval haché", "format": "8 X 454G", "price": 114.10, "category": "Gibier & Autres", "proteinType": "Viande Rouge", "texture": "ground", "consumptionType": "staple", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 3632},
  {"id": "MG923832", "sku": "MG923832", "name": "Cerf haché extra maigre", "format": "10 X 300G", "price": 173.60, "category": "Gibier & Autres", "proteinType": "Gibier", "texture": "ground", "consumptionType": "staple", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 3000},
  {"id": "7267321", "sku": "7267321", "name": "Agneau Haché", "format": "4 X 375G", "price": 85.90, "category": "Gibier & Autres", "proteinType": "Viande Rouge", "texture": "ground", "consumptionType": "staple", "isAvailable": true, "unitCount": 4, "totalWeightGrams": 1500},
  {"id": "508013", "sku": "508013", "name": "Veau haché", "format": "6 X 454G", "price": 85.70, "category": "Gibier & Autres", "proteinType": "Viande Rouge", "texture": "ground", "consumptionType": "staple", "isAvailable": true, "unitCount": 6, "totalWeightGrams": 2724},
  {"id": "pm_821379", "sku": "821379", "name": "Lasagne à la viande", "format": "8 X 350G", "price": 118.70, "category": "Prêt-à-manger", "unitCount": 8, "totalWeightGrams": 2800, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_pat", "sku": "821380", "name": "Pâté au Poulet (Format Familial)", "format": "4 X 800G", "price": 68.00, "category": "Prêt-à-manger", "unitCount": 4, "totalWeightGrams": 3200, "consumptionType": "quick", "isAvailable": true, "proteinType": "Volaille", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_shep", "sku": "821381", "name": "Pâté Chinois (Shepherd's Pie)", "format": "8 X 400G", "price": 85.00, "category": "Prêt-à-manger", "unitCount": 8, "totalWeightGrams": 3200, "consumptionType": "quick", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "prepared", "managementCategory": "base"},
  {"id": "pm_sauce", "sku": "821382", "name": "Sauce à Spaghetti (Viande)", "format": "4 X 1L", "price": 55.00, "category": "Prêt-à-manger", "totalWeightGrams": 4000, "consumptionType": "staple", "isAvailable": true, "proteinType": "Viande Rouge", "texture": "liquid", "managementCategory": "base"},
  {"id": "70358", "sku": "70358", "name": "Sauce à spaghetti au poulet de grain", "format": "10 sac x 500 ml", "price": 99.90, "category": "Prêt-à-manger", "proteinType": "Volaille", "texture": "liquid", "consumptionType": "staple", "isAvailable": true, "unitCount": 10, "totalWeightGrams": 5000},
  {"id": "221015", "sku": "221015", "name": "Pâté au poulet", "format": "600g", "price": 24.40, "category": "Prêt-à-manger", "proteinType": "Volaille", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 600},
  {"id": "MG920165", "sku": "MG920165", "name": "Tourtière aux quatres gibiers", "format": "840 gr", "price": 23.20, "category": "Prêt-à-manger", "proteinType": "Gibier", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 840},
  {"id": "861276", "sku": "861276", "name": "Fondu parmesan", "format": "12 X 4", "price": 115.30, "category": "Prêt-à-manger", "proteinType": "Laitier", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "isAppetizer": true, "unitCount": 48, "totalWeightGrams": 0},
  {"id": "821732", "sku": "821732", "name": "Pâté au saumon", "format": "750G", "price": 22.20, "category": "Prêt-à-manger", "proteinType": "Poissons", "texture": "prepared", "consumptionType": "quick", "isAvailable": true, "unitCount": 1, "totalWeightGrams": 750},
  {"id": "821365", "sku": "821365", "name": "Sauce aux fruits de mer", "format": "12 X 270G", "price": 133.70, "category": "Prêt-à-manger", "proteinType": "Fruits de mer", "texture": "liquid", "consumptionType": "staple", "isAvailable": true, "unitCount": 12, "totalWeightGrams": 3240},
  {"id": "821364", "sku": "821364", "name": "Sauce à spaghetti", "format": "5 X 1KG", "price": 100.60, "category": "Prêt-à-manger", "proteinType": "Viande Rouge", "texture": "liquid", "consumptionType": "staple", "isAvailable": true, "unitCount": 5, "totalWeightGrams": 5000},
  {"id": "0440285", "sku": "0440285", "name": "Joue de Boeuf", "format": "8 x 320g", "price": 179.70, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "piece", "consumptionType": "slow", "isAvailable": true, "unitCount": 8, "totalWeightGrams": 2560},
  {"id": "821424", "sku": "821424", "name": "Macreuse de boeuf AAA", "format": "12 X 190G", "price": 242.30, "category": "Boeuf", "proteinType": "Viande Rouge", "texture": "steak", "consumptionType": "quick", "unitCount": 12, "totalWeightGrams": 2280}
];