

import React, { useState, useRef, useEffect } from 'react';
import { Settings, Wand2, Download, Database, RotateCcw, Search, CheckCircle2, Save, Plus, X, Sparkles, AlertTriangle, BrainCircuit, RefreshCw, Globe, Loader, FileJson, ArrowRight, Link as LinkIcon, Image as ImageIcon, Zap, Microscope, BookOpen, Monitor, Trash2, CheckSquare, Square, FileText, Copy, LayoutDashboard, ChevronRight, Import, GitMerge } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Product, Settings as SettingsType } from '../types';
import { ProductManagementRow } from './ProductManagementRow';
import { detectSmartCategory } from '../constants';
import { useProducts } from '../contexts/StoreContext';
import { IngestionPanel } from './IngestionPanel';
import { DataConflictResolver } from './DataConflictResolver';
import { RuleManager } from './RuleManager';

interface SettingsDashboardProps {
  settings: SettingsType;
  setSettings: (settings: SettingsType) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  onReset: () => void;
  exportData: () => void;
  onSave: () => void;
  onResetCatalog: () => void;
}

// ... (KEEP ALL EXISTING SCRAPER HELPERS & INTERFACES: ScrapedCard, SavedRule, extractProductCards) ...
// --- ROBUST DOM EXTRACTION LOGIC ---
interface ScrapedCard {
    text: string;
    url?: string;
    img?: string;
}

const extractProductCards = (html: string): ScrapedCard[] => {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const bodyText = doc.body.innerText;

        // Anti-bot detection check
        if (bodyText.length < 500 || bodyText.includes("captcha") || bodyText.includes("Cloudflare") || bodyText.includes("Access denied")) {
            console.warn("Potential anti-bot block detected or empty page");
            throw new Error("Page blocked or empty (Captcha/Cloudflare detected)");
        }
        
        // STRATEGY 1: Targeted Class Selectors
        const selectors = [
            '.product-layout', 
            '.product-thumb', 
            '.product-item', 
            '.product-grid-item',
            '.item-inner',
            'div[class*="product-card"]',
            'div[class*="item"]',
            '.col-sm-4', '.col-md-4', '.col-6', '.col-xs-6'
        ];
        
        let nodes: Element[] = [];
        
        for (const sel of selectors) {
            const found = Array.from(doc.querySelectorAll(sel));
            // Filter: A valid product card MUST contain a price-like pattern
            const validCandidates = found.filter(el => {
                const text = el.textContent || '';
                return (text.includes('$') || /\d+[.,]\d+/.test(text)) && text.length > 20;
            });

            if (validCandidates.length > 2) { 
                nodes = validCandidates;
                break;
            }
        }

        // STRATEGY 2: Heuristic Price Search (Fallback)
        if (nodes.length === 0) {
            const treeWalker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
            const priceNodes: Node[] = [];
            let node;
            const priceRegex = /\d+[.,]\d+\s?\$|\$\s?\d+[.,]\d+/;

            while (node = treeWalker.nextNode()) {
                if (priceRegex.test(node.textContent || '')) {
                    priceNodes.push(node);
                }
            }
            
            const candidates = new Set<Element>();
            priceNodes.forEach(n => {
                let curr: Element | null = n.parentElement;
                for (let i = 0; i < 5; i++) {
                    if (!curr) break;
                    if ((curr.tagName === 'DIV' || curr.tagName === 'LI') && curr.querySelector('img')) {
                         if (curr.innerHTML.length < 5000) { 
                            candidates.add(curr);
                            break; 
                         }
                    }
                    curr = curr.parentElement;
                }
            });
            nodes = Array.from(candidates);
        }

        if (nodes.length > 0) {
            return nodes.map(el => {
                const linkNode = el.querySelector('a');
                let url = linkNode?.getAttribute('href') || undefined;
                
                const imgNode = el.querySelector('img');
                let img = imgNode?.getAttribute('src') || imgNode?.getAttribute('data-src') || undefined;

                const clone = el.cloneNode(true) as HTMLElement;
                clone.querySelectorAll('script, style, .hidden, .display-none').forEach(e => e.remove());
                
                const text = clone.innerText
                    .replace(/[\n\r]+/g, ' | ') 
                    .replace(/\s{2,}/g, ' ')
                    .trim();

                return { text, url, img };
            }).filter(item => {
                return item.text.length > 10 && (item.text.includes('$') || /\d+[.,]\d+/.test(item.text));
            });
        }
        
        return [];
    } catch (e) { 
        console.warn("DOM Parse Error", e);
        throw e;
    }
};

export const SettingsDashboard: React.FC<SettingsDashboardProps> = ({ settings, setSettings, products, setProducts, onReset, exportData, onSave, onResetCatalog }) => {
  const [activeTab, setActiveTab] = useState('general');
  const [prodSearch, setProdSearch] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { stagingProducts, commitStagingToLive, discardStaging } = useProducts();
  
  // Scraper Settings
  const [scrapeUrl, setScrapeUrl] = useState('https://www.alimentationmonquartier.com/fr/catalogue');
  const [scrapeStartPage, setScrapeStartPage] = useState(1);
  const [scrapeEndPage, setScrapeEndPage] = useState(21);
  
  // Scraper Strategy
  const [scrapeStrategy, setScrapeStrategy] = useState<'price_watch' | 'standard' | 'deep_dive'>('standard');
  const [extractOptions, setExtractOptions] = useState({
      images: true,
      description: true,
      supplier: false
  });
  
  const [aiLoading, setAiLoading] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState<string[]>([]);
  const [scrapeStats, setScrapeStats] = useState({ added: 0, updated: 0, scanned: 0 });
  const [lastReport, setLastReport] = useState<string | null>(null);

  const updateProduct = (updatedProduct: Product) => setProducts(products.map((p) => p.id === updatedProduct.id ? updatedProduct : p));
  const filteredProducts = products.filter((p) => p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.sku.includes(prodSearch));
  
  const handleSaveClick = async () => { setIsSaving(true); await onSave(); setTimeout(() => setIsSaving(false), 1000); };

  const handleExport = () => {
      const dataStr = JSON.stringify(products, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', 'amq_produits_backup.json');
      linkElement.click();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const importedProducts = JSON.parse(content);
            if (Array.isArray(importedProducts)) {
              setProducts(importedProducts);
              alert('Produits importés avec succès !');
            } else {
              alert('Le fichier JSON doit contenir un tableau de produits.');
            }
          } catch (error) {
            console.error('Error parsing JSON:', error);
            alert('Erreur lors de la lecture du fichier JSON.');
          }
        };
        reader.readAsText(file);
      }
  };

  const safeJsonParse = (text: string, fallback: any) => {
      if (!text) return fallback;
      try {
          let clean = text.replace(/```json/g, '').replace(/```/g, '').trim();
          const firstBracket = clean.indexOf('[');
          const firstBrace = clean.indexOf('{');
          
          if (firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)) {
             const lastBracket = clean.lastIndexOf(']');
             if (lastBracket !== -1) clean = clean.substring(firstBracket, lastBracket + 1);
          } else if (firstBrace !== -1) {
             const lastBrace = clean.lastIndexOf('}');
             if (lastBrace !== -1) clean = clean.substring(firstBrace, lastBrace + 1);
          }
          
          return JSON.parse(clean);
      } catch (e) {
          console.warn("JSON Parse Error on AI response:", e);
          return fallback;
      }
  };

  const fetchWithProxy = async (url: string): Promise<string | null> => {
      const proxies = [
          `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
          `https://corsproxy.io/?${encodeURIComponent(url)}`,
          `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
      ];

      for (const proxy of proxies) {
          try {
              const response = await fetch(proxy);
              if (response.ok) {
                  const html = await response.text();
                  if (html && html.length > 500) return html;
              }
          } catch (e) {
              console.warn(`Proxy failed: ${proxy}`);
          }
          await new Promise(resolve => setTimeout(resolve, 800));
      }
      return null;
  };

  const applyBusinessRules = (item: Partial<Product>): Partial<Product> => {
      const name = (item.name || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();

      // Retrieve Active Rules from LocalStorage (bridge to RuleManager)
      try {
          const storedRules = localStorage.getItem('amq_automation_rules');
          if (storedRules) {
              const rules = JSON.parse(storedRules);
              rules.forEach((rule: any) => {
                  if (!rule.active) return;
                  
                  let match = false;
                  const fieldVal = String(item[rule.trigger.field as keyof Partial<Product>] || '').toLowerCase();
                  const triggerVal = String(rule.trigger.value).toLowerCase();

                  if (rule.trigger.operator === 'contains' && fieldVal.includes(triggerVal)) match = true;
                  if (rule.trigger.operator === 'equals' && fieldVal === triggerVal) match = true;
                  
                  if (match) {
                      if (rule.action.type === 'set_season') item.seasonality = String(rule.action.value);
                      if (rule.action.type === 'set_category') item.category = String(rule.action.value);
                      if (rule.action.type === 'flag_premium') {
                           item.isPremium = rule.action.value === true || rule.action.value === 'true';
                           if(item.isPremium) item.managementCategory = 'premium';
                      }
                  }
              });
          }
      } catch (e) { console.warn("Rule Engine Error", e); }

      // 1. SEASONALITY & PREMIUM RULES (Hardcoded Fallback)
      if (!item.seasonality) {
          if (name.includes('bbq') || name.includes('t-bone') || name.includes('burger')) item.seasonality = 'summer';
          else if (name.includes('ragoût') || name.includes('fondue') || name.includes('mijote')) item.seasonality = 'winter';
          else item.seasonality = 'all_year';
      }

      // 4. FORCE AVAILABLE
      item.isAvailable = true;

      return item;
  };

  const generateScanReport = (currentProducts: Product[], stats: { added: number, updated: number }) => {
      const now = new Date();
      let report = `RAPPORT DE SCAN AUTOMATIQUE - ALIMENTATION MON QUARTIER\n`;
      report += `Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}\n`;
      report += `Stratégie: ${scrapeStrategy.toUpperCase()}\n`;
      report += `Pages scannées: ${scrapeStartPage} à ${scrapeEndPage}\n`;
      report += `\n------------------------------------------------\n`;
      report += `RÉSUMÉ DES CHANGEMENTS\n`;
      report += `------------------------------------------------\n`;
      report += `Total Produits en Base: ${currentProducts.length}\n`;
      report += `Nouveaux Ajouts: ${stats.added}\n`;
      report += `Mises à jour Prix/Infos: ${stats.updated}\n`;
      report += `\n------------------------------------------------\n`;
      report += `INVENTAIRE COMPLET (LISTE NUMÉROTÉE)\n`;
      report += `------------------------------------------------\n\n`;

      currentProducts.forEach((p, index) => {
          report += `${index + 1}. [${p.sku || 'NO-SKU'}] ${p.name}\n`;
          report += `    Prix: ${p.price.toFixed(2)}$ ${p.salePrice ? `(SOLDE: ${p.salePrice.toFixed(2)}$)` : ''}\n`;
          report += `    Catégorie: ${p.category} | Format: ${p.format}\n`;
          report += `    Saison: ${p.seasonality || 'N/A'} | Classe: ${p.managementCategory || 'N/A'}\n`;
          if (p.imageUrl) report += `    [Image OK]\n`;
          report += `\n`;
      });

      setLastReport(report);
  };

  const downloadReport = () => {
      if (!lastReport) return;
      const element = document.createElement("a");
      const file = new Blob([lastReport], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `AMQ_Rapport_Scan_${new Date().toISOString().slice(0,10)}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
  };

  const runScraper = async () => {
      setAiLoading(true);
      setScrapeLogs([]);
      setScrapeStats({ added: 0, updated: 0, scanned: 0 });
      setLastReport(null);
      
      const addLog = (msg: string) => setScrapeLogs(prev => [...prev, msg]);
      let workingProducts = [...products];
      let newItemsCount = 0;
      let updatedItemsCount = 0;
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      try {
          addLog(`Starting Mission: ${scrapeStrategy.toUpperCase()} MODE`);
          
          for (let page = scrapeStartPage; page <= scrapeEndPage; page++) {
              addLog(`Fetching Page ${page}...`);
              const targetUrl = `${scrapeUrl}${scrapeUrl.includes('?') ? '&' : '?'}page=${page}`;
              
              const html = await fetchWithProxy(targetUrl);
              if (!html) {
                  addLog(`Failed to fetch page ${page}. Check proxy.`);
                  continue;
              }

              let smartCards: ScrapedCard[] = [];
              try {
                  smartCards = extractProductCards(html);
                  addLog(`Found ${smartCards.length} candidates on page ${page}.`);
              } catch (domError: any) {
                  addLog(`Extraction Error: ${domError.message}`);
                  continue;
              }

              let extractedItems: any[] = [];

              if (smartCards.length > 0) {
                  const BATCH_SIZE = 8;
                  for (let i = 0; i < smartCards.length; i += BATCH_SIZE) {
                      const batch = smartCards.slice(i, i + BATCH_SIZE);
                      
                      let batchPrompt = `
                        I have a list of structured product cards (Text + optional URL + optional Image).
                        Parse EACH block into a clean JSON object.
                        
                        Input Data:
                        ${JSON.stringify(batch)}

                        Return a JSON Array of objects with:
                        - name (string, clean up)
                        - price (number, extract from text)
                        - salePrice (number, if a lower price exists in text)
                        - format (string, e.g. "10 x 454g")
                        - category (One of: Boeuf, Poulet, Porc, Poisson/Fruits de mer, Gibier & Autres, Prêt-à-manger, Epices)
                        - productUrl (use the 'url' from input if available)
                        - imageUrl (use the 'img' from input if available)
                        - texture (e.g. ground, steak, roast)
                      `;

                      try {
                        const result = await ai.models.generateContent({
                            model: "gemini-2.5-flash",
                            contents: batchPrompt,
                            config: { responseMimeType: "application/json" }
                        });
                        const batchItems = safeJsonParse(result.text || "[]", []);
                        if (Array.isArray(batchItems)) extractedItems.push(...batchItems);
                      } catch (e) {
                          console.warn("Batch AI Error", e);
                      }
                  }
              }
              
              if (Array.isArray(extractedItems) && extractedItems.length > 0) {
                  for (const item of extractedItems) {
                      const ruleAppliedItem = applyBusinessRules(item);
                      const normalizedCat = detectSmartCategory(ruleAppliedItem.name || '', ruleAppliedItem.category || '');
                      const sku = ruleAppliedItem.sku || `AI-${Math.abs(ruleAppliedItem.name.split('').reduce((a:number,b:string)=>a=((a<<5)-a)+b.charCodeAt(0),0))}`;
                      
                      const existingIndex = workingProducts.findIndex(p => 
                          p.name.toLowerCase() === (ruleAppliedItem.name || '').toLowerCase() || 
                          (p.sku && p.sku === sku)
                      );

                      let resolvedUrl = ruleAppliedItem.productUrl;
                      if (resolvedUrl && !resolvedUrl.startsWith('http')) {
                          resolvedUrl = new URL(resolvedUrl, 'https://www.alimentationmonquartier.com').toString();
                      }

                      const cleanProduct: Product = {
                          id: existingIndex > -1 ? workingProducts[existingIndex].id : `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                          sku: sku,
                          name: ruleAppliedItem.name || 'Produit Inconnu',
                          price: ruleAppliedItem.price || 0,
                          salePrice: ruleAppliedItem.salePrice,
                          format: ruleAppliedItem.format || 'Unité',
                          category: normalizedCat,
                          isAvailable: true,
                          unitCount: ruleAppliedItem.unitCount || 1,
                          totalWeightGrams: ruleAppliedItem.totalWeightGrams || 500,
                          consumptionType: ruleAppliedItem.consumptionType || 'staple',
                          proteinType: ruleAppliedItem.proteinType || 'Autre',
                          texture: ruleAppliedItem.texture || 'piece',
                          seasonality: ruleAppliedItem.seasonality || 'all_year',
                          managementCategory: ruleAppliedItem.managementCategory || 'base',
                          isPremium: ruleAppliedItem.isPremium || false,
                          imageUrl: ruleAppliedItem.imageUrl || (existingIndex > -1 ? workingProducts[existingIndex].imageUrl : undefined),
                          productUrl: resolvedUrl,
                          description: ruleAppliedItem.description,
                          // KMS Fields
                          source: 'scrape',
                          lastUpdated: new Date().toISOString()
                      };

                      if (existingIndex > -1) {
                          if (scrapeStrategy !== 'price_watch') {
                             workingProducts[existingIndex] = { ...workingProducts[existingIndex], ...cleanProduct, id: workingProducts[existingIndex].id };
                             updatedItemsCount++;
                          } else {
                             if (workingProducts[existingIndex].price !== cleanProduct.price || workingProducts[existingIndex].salePrice !== cleanProduct.salePrice) {
                                 workingProducts[existingIndex].price = cleanProduct.price;
                                 workingProducts[existingIndex].salePrice = cleanProduct.salePrice;
                                 updatedItemsCount++;
                             }
                          }
                      } else if (scrapeStrategy !== 'price_watch') {
                          workingProducts.push(cleanProduct);
                          newItemsCount++;
                      }
                  }
              }
              setScrapeStats({ added: newItemsCount, updated: updatedItemsCount, scanned: page * 20 }); 
          }

          setProducts(workingProducts);
          generateScanReport(workingProducts, { added: newItemsCount, updated: updatedItemsCount });
          addLog("Mission Complete. Database Updated.");

      } catch (error: any) {
          addLog(`CRITICAL ERROR: ${error.message}`);
      } finally {
          setAiLoading(false);
      }
  };

  const tabs = [
      { id: 'general', label: 'Général', icon: LayoutDashboard },
      { id: 'ingestion', label: 'Import & IA', icon: Import },
      { id: 'review', label: 'Review & Conflits', icon: GitMerge, badge: stagingProducts.length > 0 ? stagingProducts.length : undefined },
      { id: 'scraper', label: 'Web Scraper', icon: Globe },
      { id: 'database', label: 'Base de Données', icon: Database },
      { id: 'backup', label: 'Sauvegarde', icon: Download },
  ];

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Settings className="w-8 h-8 text-slate-900" />
              <span>Paramètres & Administration</span>
          </h2>
          <button 
            onClick={handleSaveClick}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all shadow-lg ${isSaving ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
          >
            {isSaving ? <CheckCircle2 className="w-5 h-5 animate-bounce"/> : <Save className="w-5 h-5"/>}
            {isSaving ? 'Sauvegardé !' : 'Enregistrer tout'}
          </button>
      </div>

      {/* BENTO TABS */}
      <div className="flex p-1 bg-gray-100 rounded-2xl mb-8 overflow-x-auto">
          {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all whitespace-nowrap relative ${isActive ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-red-600' : 'text-gray-400'}`} />
                      {tab.label}
                      {tab.badge && (
                          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">
                             {tab.badge}
                          </span>
                      )}
                  </button>
              )
          })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 min-h-[500px]">
          
          {/* GENERAL SETTINGS */}
          {activeTab === 'general' && (
              <div className="p-8 max-w-2xl">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-gray-400"/> Configuration Générale</h3>
                  <div className="space-y-6">
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                          <label className="block">
                              <span className="text-sm font-bold text-slate-700 mb-2 block">Montant Minimum de Livraison ($)</span>
                              <div className="flex items-center gap-3">
                                  <span className="text-2xl font-bold text-gray-300">$</span>
                                  <input 
                                    type="number" 
                                    value={settings.minDeliveryAmount}
                                    onChange={(e) => setSettings({...settings, minDeliveryAmount: parseInt(e.target.value) || 0})}
                                    className="block w-full text-xl font-bold bg-transparent border-b-2 border-gray-200 focus:border-slate-900 outline-none py-2"
                                  />
                              </div>
                          </label>
                      </div>
                      
                      <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
                          <h4 className="font-bold text-red-800 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Zone de Danger</h4>
                          <p className="text-sm text-red-600 mb-4">Réinitialiser le catalogue remettra les produits par défaut et effacera vos ajouts.</p>
                          <button onClick={onResetCatalog} className="px-4 py-2 bg-white border border-red-200 text-red-600 font-bold rounded-lg hover:bg-red-50 text-sm">
                              Réinitialiser le Catalogue
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* INGESTION PANEL */}
          {activeTab === 'ingestion' && (
              <div className="p-6 h-full">
                  <IngestionPanel />
              </div>
          )}
          
          {/* DATA CONFLICT RESOLVER */}
          {activeTab === 'review' && (
              <div className="p-6 h-full">
                  <DataConflictResolver />
              </div>
          )}

          {/* SCRAPER UI */}
          {activeTab === 'scraper' && (
              <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
                      {/* Left Column: Controls */}
                      <div className="space-y-6">
                          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><BrainCircuit className="w-5 h-5 text-purple-600"/> Intelligence & Stratégie</h4>
                              
                              <div className="space-y-3 mb-6">
                                  <button onClick={() => setScrapeStrategy('price_watch')} className={`w-full text-left p-3 rounded-xl border transition-all ${scrapeStrategy === 'price_watch' ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-100' : 'border-transparent hover:bg-white'}`}>
                                      <div className="font-bold text-sm">⚡ Price Watch</div>
                                      <div className="text-xs text-gray-500">Mise à jour rapide des prix uniquement.</div>
                                  </button>
                                  <button onClick={() => setScrapeStrategy('standard')} className={`w-full text-left p-3 rounded-xl border transition-all ${scrapeStrategy === 'standard' ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-100' : 'border-transparent hover:bg-white'}`}>
                                      <div className="font-bold text-sm">⚖️ Standard (Recommandé)</div>
                                      <div className="text-xs text-gray-500">Nouveaux produits + Prix + Infos de base.</div>
                                  </button>
                                  <button onClick={() => setScrapeStrategy('deep_dive')} className={`w-full text-left p-3 rounded-xl border transition-all ${scrapeStrategy === 'deep_dive' ? 'bg-white border-purple-500 shadow-sm ring-1 ring-purple-100' : 'border-transparent hover:bg-white'}`}>
                                      <div className="font-bold text-sm">🔬 Deep Dive (Lent)</div>
                                      <div className="text-xs text-gray-500">Analyse profonde: Images HD, Descriptions.</div>
                                  </button>
                              </div>

                              <div className="space-y-3">
                                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                      <input type="checkbox" checked={extractOptions.images} onChange={e => setExtractOptions({...extractOptions, images: e.target.checked})} className="rounded text-purple-600"/>
                                      Extraire Images
                                  </label>
                                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                                      <input type="checkbox" checked={extractOptions.description} onChange={e => setExtractOptions({...extractOptions, description: e.target.checked})} className="rounded text-purple-600"/>
                                      Extraire Descriptions
                                  </label>
                              </div>
                          </div>

                          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                              <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Globe className="w-4 h-4"/> Cible</h4>
                              <div className="space-y-4">
                                  <input 
                                    type="text" 
                                    value={scrapeUrl} 
                                    onChange={(e) => setScrapeUrl(e.target.value)} 
                                    className="w-full text-sm border rounded-lg p-2.5 bg-gray-50"
                                    placeholder="https://..."
                                  />
                                  <div className="flex items-center gap-2">
                                      <div className="flex-1">
                                          <span className="text-xs font-bold text-gray-500 uppercase">Début</span>
                                          <input type="number" value={scrapeStartPage} onChange={(e) => setScrapeStartPage(parseInt(e.target.value))} className="w-full border rounded-lg p-2 text-sm font-bold"/>
                                      </div>
                                      <ArrowRight className="w-4 h-4 text-gray-300 mt-4"/>
                                      <div className="flex-1">
                                          <span className="text-xs font-bold text-gray-500 uppercase">Fin</span>
                                          <input type="number" value={scrapeEndPage} onChange={(e) => setScrapeEndPage(parseInt(e.target.value))} className="w-full border rounded-lg p-2 text-sm font-bold"/>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Middle Column: Rules (NEW RULE MANAGER) */}
                      <div className="h-full">
                           <RuleManager />
                      </div>

                      {/* Right Column: Console & Action */}
                      <div className="space-y-6 flex flex-col">
                          <div className="bg-slate-900 rounded-2xl p-5 text-green-400 font-mono text-xs flex-1 min-h-[300px] overflow-y-auto shadow-inner relative">
                              {aiLoading && <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center backdrop-blur-sm z-10"><Loader className="w-8 h-8 animate-spin text-green-500"/></div>}
                              {scrapeLogs.length === 0 ? (
                                  <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                                      <Monitor className="w-12 h-12 mb-2"/>
                                      <p>Prêt à scanner...</p>
                                  </div>
                              ) : (
                                  scrapeLogs.map((log, i) => (
                                      <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">
                                          <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                                          {log}
                                      </div>
                                  ))
                              )}
                          </div>
                          
                          <div className="flex gap-3">
                             <button 
                                onClick={runScraper}
                                disabled={aiLoading}
                                className={`flex-1 py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all ${aiLoading ? 'bg-slate-700 text-slate-400' : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-[1.02]'}`}
                             >
                                {aiLoading ? 'Scan en cours...' : 'Lancer le Scan'} 
                                {!aiLoading && <Zap className="w-5 h-5 fill-current"/>}
                             </button>
                          </div>
                          
                          {lastReport && (
                              <div className="bg-green-50 p-3 rounded-xl border border-green-200 flex justify-between items-center">
                                  <div>
                                      <p className="text-xs font-bold text-green-800">Rapport Disponible</p>
                                      <p className="text-[10px] text-green-600">+{scrapeStats.added} nouveaux • {scrapeStats.updated} mis à jour</p>
                                  </div>
                                  <button onClick={downloadReport} className="text-green-700 hover:bg-green-100 p-2 rounded-lg" title="Télécharger le rapport">
                                      <FileText className="w-5 h-5"/>
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {/* DATABASE TAB */}
          {activeTab === 'database' && (
              <div className="p-0">
                  <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
                      <div className="relative flex-1 max-w-md">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                          <input 
                            type="text" 
                            className="w-full pl-9 py-2 rounded-lg border border-gray-200 text-sm focus:border-slate-800 outline-none" 
                            placeholder="Rechercher un produit (SKU, Nom)..."
                            value={prodSearch}
                            onChange={(e) => setProdSearch(e.target.value)}
                          />
                      </div>
                      <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100">{products.length} produits</span>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                      {filteredProducts.slice(0, 50).map(p => (
                          <ProductManagementRow key={p.id} product={p} onUpdate={updateProduct} />
                      ))}
                      {filteredProducts.length > 50 && (
                          <div className="p-4 text-center text-xs text-gray-400 italic">... et {filteredProducts.length - 50} autres produits. Affinez la recherche.</div>
                      )}
                  </div>
              </div>
          )}

          {/* BACKUP TAB */}
          {activeTab === 'backup' && (
              <div className="p-12 flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6"><Database className="w-10 h-10 text-blue-500"/></div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Sauvegarde & Restauration</h3>
                  <p className="text-gray-500 mb-8">Exportez votre base de données en JSON pour la sécuriser ou transférez-la vers un autre appareil.</p>
                  
                  <div className="grid grid-cols-2 gap-4 w-full">
                      <button onClick={handleExport} className="flex flex-col items-center justify-center p-6 border-2 border-slate-900 rounded-2xl hover:bg-slate-50 transition-colors group">
                          <Download className="w-8 h-8 mb-3 text-slate-900 group-hover:scale-110 transition-transform"/>
                          <span className="font-bold text-slate-900">Exporter JSON</span>
                      </button>
                      <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-2xl hover:border-slate-400 hover:bg-gray-50 transition-all cursor-pointer group">
                          <RotateCcw className="w-8 h-8 mb-3 text-gray-400 group-hover:text-slate-600 transition-colors"/>
                          <span className="font-bold text-gray-500 group-hover:text-slate-700">Importer JSON</span>
                          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                      </label>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};