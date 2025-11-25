import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Image as ImageIcon, FileJson, Loader, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useProducts } from '../contexts/StoreContext';
import { Product, KnowledgeSource } from '../types';
import { detectSmartCategory } from '../constants';

export const IngestionPanel: React.FC = () => {
  const { setStagingProducts, stagingProducts } = useProducts();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [processedCount, setProcessedCount] = useState(0);

  const addLog = (msg: string) => setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  // --- HELPER: Convert File to Base64 ---
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove "data:*/*;base64," prefix for Gemini API
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // --- HELPER: Map Raw Data to Product Interface ---
  const mapToProduct = (raw: any, sourceFile: string): Product => {
    const category = detectSmartCategory(raw.name || '', raw.category || '');
    return {
      id: `imp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      sku: raw.sku || `UPL-${Math.floor(Math.random() * 10000)}`,
      name: raw.name || 'Produit Inconnu',
      format: raw.format || 'Unité',
      price: typeof raw.price === 'number' ? raw.price : parseFloat(raw.price) || 0,
      category: category,
      consumptionType: raw.consumptionType || 'staple',
      isAvailable: true,
      
      // Knowledge Management Fields
      source: 'upload',
      lastUpdated: new Date().toISOString(),
      confidenceScore: raw.confidenceScore || 0.9, // JSON is high confidence, AI varies
      stagingStatus: 'draft',
      originalSourceFileId: sourceFile,
      
      // AI Enriched fields
      description: raw.description,
      proteinType: raw.proteinType || 'Autre',
      texture: raw.texture || 'piece'
    };
  };

  // --- PROCESSORS ---
  const processJson = async (file: File) => {
    addLog(`Parsing JSON: ${file.name}`);
    const text = await file.text();
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data) ? data : [data];
      
      const newProducts = items.map(item => mapToProduct(item, file.name));
      setStagingProducts([...stagingProducts, ...newProducts]);
      setProcessedCount(prev => prev + newProducts.length);
      addLog(`Success: Extracted ${newProducts.length} items from JSON.`);
    } catch (e) {
      addLog(`Error parsing JSON: ${(e as Error).message}`);
    }
  };

  const processWithAI = async (file: File) => {
    addLog(`Uploading to Neural Engine: ${file.name}...`);
    try {
      const base64Data = await fileToBase64(file);
      const mimeType = file.type;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Prompt specifically designed for Structure Extraction
      const prompt = `
        Analyze this document/image. Identify product lists, catalogs, or invoices.
        Extract each product into a JSON Object.
        
        Required Fields:
        - name (string)
        - price (number)
        - format (string, e.g. "10 x 454g")
        - sku (string, optional)
        - category (guess based on context)
        - texture (e.g. ground, steak, roast - infer from name)
        
        Return ONLY a JSON Array. No markdown.
      `;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
            {
                role: 'user',
                parts: [
                    { text: prompt },
                    { inlineData: { mimeType: mimeType, data: base64Data } }
                ]
            }
        ],
        config: { responseMimeType: "application/json" }
      });

      const responseText = result.text;
      const parsedData = JSON.parse(responseText || "[]");
      
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        const newProducts = parsedData.map(item => ({
             ...mapToProduct(item, file.name),
             source: 'scrape' as const, // AI extracted
             confidenceScore: 0.85 
        }));
        
        // Append to staging (don't overwrite existing staging)
        setStagingProducts((prev) => [...prev, ...newProducts]);
        setProcessedCount(prev => prev + newProducts.length);
        addLog(`Success: AI identified ${newProducts.length} products.`);
      } else {
        addLog(`AI Warning: No structured data found in ${file.name}`);
      }

    } catch (e) {
      addLog(`AI Error: ${(e as Error).message}`);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsProcessing(true);
    setProcessedCount(0);
    
    // Explicitly cast the Array.from result to File[] to ensure TS knows they are Files
    const files = Array.from(e.dataTransfer.files) as File[];
    
    for (const file of files) {
      if (file.type === 'application/json') {
        await processJson(file);
      } else if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        await processWithAI(file);
      } else {
        addLog(`Skipped unsupported file: ${file.name}`);
      }
    }
    
    setIsProcessing(false);
  }, [stagingProducts]);

  return (
    <div className="grid lg:grid-cols-2 gap-8 h-full">
      {/* LEFT: DROPZONE */}
      <div className="space-y-6">
        <div 
          className={`
            border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center transition-all h-80
            ${isDragging ? 'border-purple-500 bg-purple-50 scale-[1.02]' : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-purple-200'}
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          {isProcessing ? (
             <div className="flex flex-col items-center animate-pulse">
                <Loader className="w-16 h-16 text-purple-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-800">Analyse en cours...</h3>
                <p className="text-sm text-slate-500">Lecture des documents par l'IA</p>
             </div>
          ) : (
             <>
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                    <UploadCloud className="w-10 h-10 text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Glissez vos fichiers ici</h3>
                <p className="text-sm text-gray-500 max-w-xs mx-auto mb-6">
                    Supporte PDF (Catalogues), Images (Photos de facture), JSON et Excel.
                </p>
                <div className="flex gap-3 justify-center">
                    <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-xs font-bold flex items-center gap-1"><FileText className="w-3 h-3"/> PDF</span>
                    <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center gap-1"><ImageIcon className="w-3 h-3"/> IMG</span>
                    <span className="px-3 py-1 rounded-full bg-green-100 text-green-600 text-xs font-bold flex items-center gap-1"><FileJson className="w-3 h-3"/> JSON</span>
                </div>
             </>
          )}
        </div>

        {processedCount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="bg-green-100 p-2 rounded-full"><CheckCircle2 className="w-6 h-6 text-green-600"/></div>
                <div>
                    <p className="font-bold text-green-800">Succès !</p>
                    <p className="text-sm text-green-600">{processedCount} produits extraits et placés en zone d'attente (Staging).</p>
                </div>
            </div>
        )}
      </div>

      {/* RIGHT: CONSOLE */}
      <div className="bg-slate-900 rounded-3xl p-6 flex flex-col h-80 lg:h-auto overflow-hidden shadow-inner">
         <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
             <h4 className="text-white font-bold flex items-center gap-2"><Loader className="w-4 h-4"/> Console d'Ingestion</h4>
             <button onClick={() => setLogs([])} className="text-xs text-slate-400 hover:text-white">Effacer</button>
         </div>
         <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2">
             {logs.length === 0 && <span className="text-slate-600 italic">En attente de fichiers...</span>}
             {logs.map((log, i) => (
                 <div key={i} className="text-slate-300 break-words border-l-2 border-purple-500 pl-2">
                     {log}
                 </div>
             ))}
         </div>
      </div>
    </div>
  );
};