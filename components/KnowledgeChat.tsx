
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Send, Bot, User, Sparkles, ShoppingCart, Loader, Terminal, ChevronRight } from 'lucide-react';
import { GoogleGenAI, FunctionDeclaration, SchemaType, Type } from "@google/genai";
import { useProducts, useClient, useCart } from '../contexts/StoreContext';
import { Product, CartItem } from '../types';

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  isToolResult?: boolean;
}

export const KnowledgeChat: React.FC = () => {
  const { products, settings } = useProducts();
  const { evaluationData, clientInfo } = useClient();
  const { cart, updateQuantity } = useCart();
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chatSession, setChatSession] = useState<any>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // --- 1. CONTEXT BUILDER ---
  const systemContext = useMemo(() => {
    const rules = localStorage.getItem('amq_automation_rules');
    const parsedRules = rules ? JSON.parse(rules) : [];
    
    // Simplified Product List for Token Efficiency
    const productList = products.map(p => `${p.id}: ${p.name} (${p.price}$) [${p.category}]`).join('\n');
    
    // Client Context
    const familyContext = `Adults: ${evaluationData.adults}, Teens: ${evaluationData.teens}, Children: ${evaluationData.children}.
    Weekly Meals Needed: ${evaluationData.mealsPerWeek}.
    Preferences: ${Object.entries(evaluationData.proteinSubPreferences || {}).map(([k,v]) => `${k}: ${v}`).join(', ')}.`;

    return `
      You are the AMQ Intelligent Assistant (Module 4).
      
      [CONTEXT]
      User Family: ${familyContext}
      Total Cart Value: $${cart.reduce((acc, item) => acc + (item.product.price * Object.values(item.quantities).reduce((a: number, b: number) => a + b, 0)), 0).toFixed(2)}
      Active Rules: ${parsedRules.length} rules active.
      
      [CATALOG SNAPSHOT]
      ${productList}

      [INSTRUCTIONS]
      1. You help the user plan their grocery order.
      2. If the user asks to add items, use the 'addToCart' tool. You must find the best matching Product ID from the catalog snapshot.
      3. Be proactive. Analyze their family size vs. what is in their cart.
      4. Use Markdown for formatting (bolding, lists).
    `;
  }, [products, evaluationData, cart]);

  // --- 2. TOOL DEFINITIONS ---
  const addToCartTool: FunctionDeclaration = {
    name: 'addToCart',
    description: 'Add a product to the user\'s cart.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productNameOrId: {
          type: Type.STRING,
          description: 'The exact ID or the name of the product from the catalog.',
        },
        quantity: {
          type: Type.NUMBER,
          description: 'The number of units to add.',
        },
        deliveryIndex: {
          type: Type.NUMBER,
          description: 'Which delivery to add to (1, 2, 3, or 4). Default to 1.',
        }
      },
      required: ['productNameOrId', 'quantity'],
    },
  };

  // --- 3. INITIALIZATION & PROACTIVE ENGINE ---
  useEffect(() => {
    const initChat = async () => {
      setIsThinking(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // A. Initialize Chat Session
        const chat = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction: systemContext,
            tools: [{ functionDeclarations: [addToCartTool] }],
          },
        });
        setChatSession(chat);

        // B. Proactive Suggestions (One-shot generation)
        const suggestionPrompt = `
          Based on the user's profile (Family: ${evaluationData.adults}A/${evaluationData.children}C) and current empty cart, 
          generate 3 short, specific questions I should ask you to help me fill my freezer.
          Return ONLY a JSON array of strings. Example: ["Suggest a beef pack", "What is on sale?"]
        `;
        
        const suggestionRes = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: suggestionPrompt,
            config: { responseMimeType: "application/json" }
        });
        
        const suggestionsJson = JSON.parse(suggestionRes.text || "[]");
        setSuggestions(suggestionsJson);
        
        // Add Welcome Message
        setMessages([{
            id: 'init',
            role: 'model',
            content: `Bonjour! Je suis votre assistant Provizio. J'ai analysé votre profil (famille de ${evaluationData.adults + evaluationData.teens + evaluationData.children} personnes). Comment puis-je vous aider à optimiser votre commande aujourd'hui?`
        }]);

      } catch (e) {
        console.error("Initialization Error", e);
      } finally {
        setIsThinking(false);
      }
    };

    if (!chatSession) initChat();
  }, []);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- 4. ACTION HANDLERS ---
  const executeTool = (name: string, args: any): string => {
      if (name === 'addToCart') {
          const { productNameOrId, quantity, deliveryIndex = 1 } = args;
          
          // Fuzzy Find Product
          const product = products.find(p => 
              p.id === productNameOrId || 
              p.name.toLowerCase().includes(productNameOrId.toLowerCase())
          );

          if (product) {
              updateQuantity(product, deliveryIndex, quantity);
              return `SUCCESS: Added ${quantity}x ${product.name} to Delivery ${deliveryIndex}.`;
          } else {
              return `ERROR: Product "${productNameOrId}" not found. Ask user for clarification.`;
          }
      }
      return "ERROR: Unknown tool.";
  };

  const handleSend = async (text: string = input) => {
    if (!text.trim() || !chatSession) return;
    
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    try {
        let response = await chatSession.sendMessage({ message: text });
        
        // Handle Function Calls loop
        while (response.functionCalls && response.functionCalls.length > 0) {
             const call = response.functionCalls[0];
             // Add tool call marker to UI (optional, kept subtle)
             setMessages(prev => [...prev, { 
                 id: `tool_${Date.now()}`, 
                 role: 'system', 
                 content: `Exécution: ${call.name}(${JSON.stringify(call.args)})`,
                 isToolResult: true 
             }]);

             const toolResult = executeTool(call.name, call.args);
             
             // Send Result back to model
             response = await chatSession.sendToolResponse({
                functionResponses: [{
                    id: call.id,
                    name: call.name,
                    response: { result: toolResult }
                }]
             });
        }

        const modelMsg: Message = { 
            id: (Date.now() + 1).toString(), 
            role: 'model', 
            content: response.text || "Je n'ai pas pu générer de réponse textuelle." 
        };
        setMessages(prev => [...prev, modelMsg]);

    } catch (e) {
        setMessages(prev => [...prev, { id: 'err', role: 'system', content: "Erreur de communication avec l'IA." }]);
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 animate-in fade-in slide-in-from-bottom-4 w-full mx-auto h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-purple-600" /> 
            Assistant Provizio
        </h2>
        <div className="flex gap-2">
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-lg border border-purple-100 font-mono flex items-center gap-1">
                <Terminal className="w-3 h-3"/> Module 4 Actif
            </span>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 mb-4">
        {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                    max-w-[80%] rounded-2xl p-4 text-sm relative
                    ${msg.role === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 
                      msg.role === 'system' ? 'bg-gray-100 text-gray-500 font-mono text-xs w-full text-center' :
                      'bg-purple-50 text-slate-800 rounded-tl-none border border-purple-100'}
                `}>
                    <div className="flex items-center gap-2 mb-1 opacity-50 text-[10px] uppercase font-bold tracking-wider">
                        {msg.role === 'user' ? <User className="w-3 h-3"/> : msg.role === 'model' ? <Bot className="w-3 h-3"/> : <Terminal className="w-3 h-3"/>}
                        {msg.role === 'user' ? 'Vous' : msg.role === 'model' ? 'Provizio AI' : 'Système'}
                    </div>
                    {/* Basic Markdown-like Rendering */}
                    <div className="whitespace-pre-wrap leading-relaxed">
                        {msg.content.split('\n').map((line, i) => (
                            <p key={i} className={line.startsWith('-') ? 'pl-4' : ''}>
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        ))}
        {isThinking && (
            <div className="flex justify-start w-full">
                <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                    <Loader className="w-4 h-4 text-purple-600 animate-spin" />
                    <span className="text-xs text-gray-400 font-medium animate-pulse">Analyse en cours...</span>
                </div>
            </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* SUGGESTIONS */}
      {suggestions.length > 0 && messages.length < 3 && (
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {suggestions.map((s, i) => (
                <button 
                    key={i} 
                    onClick={() => handleSend(s)}
                    className="whitespace-nowrap px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-full text-xs font-bold hover:bg-purple-50 transition-colors flex items-center gap-2 shadow-sm"
                >
                    <Sparkles className="w-3 h-3"/> {s}
                </button>
            ))}
        </div>
      )}

      {/* INPUT AREA */}
      <div className="relative">
        <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Posez une question ou demandez d'ajouter un produit..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all shadow-inner"
        />
        <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="absolute right-2 top-2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
        >
            <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
