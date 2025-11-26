
import { Percent, Beef, Drumstick, ChefHat, Fish, ScrollText, DollarSign, Utensils, Flame, PiggyBank, Dumbbell, Zap, Box, UserPlus, IceCream, Soup, Droplet, Cookie, Salad } from 'lucide-react';
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
    budget: { weeklyCap: 250, maxPricePerKg: 35 },
    custody: { childFactor: 0.5, teenFactor: 0.85 },
    essentials: { maxItems: 5, excludePremium: true },
    vip: { premiumTarget: 104, sortingWeight: 2.0 },
    condo: { overflowThreshold: 1.0, packDensity: 25 },
    variety: { maxRedMeatPercentage: 0.40, minFishPercentage: 0.15, diversityPenaltyWeight: 5, forceVarietyInjection: true },
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
            proteinPerSupper: 125, 
            description: "Congélateur domestique suffisant.",
            recommendedFreq: 1, 
            icon: 'User'
        },
        {
            id: 'couple',
            label: 'Couple',
            proteinPerSupper: 250, 
            description: "Commandes bimensuelles ou annuelles recommandées.",
            recommendedFreq: 2,
            icon: 'Users'
        },
        {
            id: 'family_small',
            label: 'Famille (2 enfants <12)',
            proteinPerSupper: 450, 
            description: "Optimisation budget et gaspillage (-48%).",
            recommendedFreq: 4,
            icon: 'Baby'
        },
        {
            id: 'family_teens',
            label: 'Famille (2 ados)',
            proteinPerSupper: 600, 
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
  { id: 'Entrée', label: 'Entrées', icon: Salad },
  { id: 'Dessert', label: 'Desserts', icon: Cookie },
  { id: 'Sauce', label: 'Sauces', icon: Droplet },
  { id: 'Epices', label: 'Épices & Autres', icon: Utensils },
];

export const detectSmartCategory = (name: string, currentCategory: string = ''): string => {
    const n = name.toLowerCase();
    
    // 0. Nouvelles catégories prioritaires
    if (n.includes('gâteau') || n.includes('tarte') || n.includes('biscuit') || n.includes('dessert') || n.includes('chocolat')) {
        return 'Dessert';
    }
    if ((n.includes('sauce') || n.includes('marinade')) && !n.includes('pâtes') && !n.includes('viande')) {
        return 'Sauce';
    }
    if (n.includes('fondue parmesan') || n.includes('bâtonnet fromage') || n.includes('calmar') || n.includes('aile') || n.includes('entrée') || n.includes('boulette')) {
        return 'Entrée';
    }

    // 1. Épices & Assaisonnements (Requested Priority)
    if (n.includes('épice') || n.includes('epice') || n.includes('rub') || n.includes('assaisonnement') || n.includes('sel ') || n.includes('poivre')) {
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
    if (c.includes('dessert')) return 'Dessert';
    if (c.includes('entree') || c.includes('entrée')) return 'Entrée';
    if (c.includes('sauce')) return 'Sauce';

    return currentCategory || 'Autre';
};

// --- PERSONA TEMPLATES (Package Scenarios) ---
// Mise à jour des budgets pour 2025 et dispersion des items pour éviter les répétitions
export const PERSONA_TEMPLATES = [
    {
        id: 'family_budget',
        label: 'Famille Budget (4p)',
        description: 'Optimisé pour ~275$/sem. Gros formats, mijotés.',
        iconName: 'PiggyBank',
        color: 'green',
        defaultBudget: 275,
        rules: {
            'Boeuf': [
                { keywords: ['haché', 'ground'], freq: 1.0 }, // Max 1.0 au lieu de 1.5
                { keywords: ['cube', 'ragoût', 'stew'], freq: 0.5 },
                { keywords: ['palette', 'rôti'], freq: 0.25 },
                { keywords: ['burger'], freq: 0.25 },
            ],
            'Poulet': [
                { keywords: ['entier', 'whole'], freq: 0.5 },
                { keywords: ['haut de cuisse', 'thigh'], freq: 1.0 },
                { keywords: ['pilon', 'drumstick'], freq: 0.5 },
                { keywords: ['haché'], freq: 0.5 },
            ],
            'Porc': [
                { keywords: ['longe', 'rôti'], freq: 0.25 },
                { keywords: ['saucisse'], freq: 0.5 },
                { keywords: ['haché'], freq: 0.5 },
                { keywords: ['côtelette'], freq: 0.5 },
            ],
            'Extra': [
                { keywords: ['pâté'], freq: 0.25 },
            ]
        }
    },
    {
        id: 'shared_custody',
        label: 'Garde Partagée',
        description: 'Flexible. Plats enfants et repas rapides.',
        iconName: 'UserPlus',
        color: 'orange',
        defaultBudget: 225,
        rules: {
            'Boeuf': [
                { keywords: ['burger'], freq: 1.0 },
                { keywords: ['haché'], freq: 0.5 },
                { keywords: ['minute', 'tournedos'], freq: 0.5 },
            ],
            'Poulet': [
                { keywords: ['croquette', 'nugget'], freq: 1.0 },
                { keywords: ['brochette', 'souvlaki'], freq: 0.5 },
                { keywords: ['pané', 'lanière'], freq: 0.5 },
                { keywords: ['pilon'], freq: 0.5 },
            ],
            'Extra': [
                { keywords: ['pâté'], freq: 0.25 },
                { keywords: ['sauce'], freq: 0.5 },
                { keywords: ['lasagne', 'pizza'], freq: 0.5 },
            ],
            'Dessert': [
                { keywords: ['gâteau'], freq: 0.25 }
            ]
        }
    },
    {
        id: 'essentials',
        label: 'Les 5 Essentiels',
        description: '5 repas simples par semaine. Poulet, Bœuf, Porc.',
        iconName: 'Zap',
        color: 'blue',
        defaultBudget: 200,
        rules: {
            'Boeuf': [
                { keywords: ['haché', 'ground'], freq: 1.0 },
                { keywords: ['bavette'], freq: 0.25 },
                { keywords: ['cube'], freq: 0.25 },
            ],
            'Poulet': [
                { keywords: ['poitrine', 'breast'], freq: 1.0 },
                { keywords: ['pilon'], freq: 0.5 },
            ],
            'Porc': [
                { keywords: ['côtelette', 'chop'], freq: 0.5 },
                { keywords: ['filet'], freq: 0.5 },
            ]
        }
    },
    {
        id: 'premium',
        label: 'Gastronome VIP',
        description: 'Upgrade. Steaks, Fruits de mer, Veau, Canard.',
        iconName: 'Flame',
        color: 'purple',
        defaultBudget: 400,
        rules: {
            'Boeuf': [
                { keywords: ['filet mignon'], freq: 0.5 },
                { keywords: ['ribeye', 'faux-filet'], freq: 0.5 },
                { keywords: ['bavette'], freq: 0.5 },
                { keywords: ['tomahawk', 't-bone'], freq: 0.25 },
            ],
            'Poisson': [
                { keywords: ['pétoncle'], freq: 0.25 },
                { keywords: ['homard', 'crevette'], freq: 0.5 },
                { keywords: ['saumon'], freq: 0.5 },
                { keywords: ['morue', 'aiglefin'], freq: 0.25 },
            ],
             'Gibier & Autres': [
                { keywords: ['veau'], freq: 0.25 },
                { keywords: ['canard'], freq: 0.25 },
                { keywords: ['agneau'], freq: 0.25 }
            ],
            'Entrée': [
                { keywords: ['fondue'], freq: 0.25 }
            ]
        }
    },
    {
        id: 'condo_storage',
        label: 'Espace Condo',
        description: 'Compact. Emballages plats sous-vide.',
        iconName: 'Box',
        color: 'yellow',
        defaultBudget: 250,
        rules: {
            'Boeuf': [
                { keywords: ['bavette'], freq: 0.5 },
                { keywords: ['tournedos'], freq: 0.5 },
                { keywords: ['steak'], freq: 0.5 },
            ],
            'Poulet': [
                { keywords: ['poitrine', 'breast'], freq: 1.0 },
                { keywords: ['tournedos'], freq: 0.5 },
            ],
            'Poisson': [
                { keywords: ['filet'], freq: 1.0 },
            ],
            'Porc': [
                { keywords: ['saucisse'], freq: 0.5 },
                { keywords: ['bacon'], freq: 0.25 },
            ]
        }
    }
];

export const PRODUCT_CATALOG = []; // Vide par défaut, rempli par le contexte
